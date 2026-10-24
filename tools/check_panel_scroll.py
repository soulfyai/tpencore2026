"""Run package_site.py first. Verify drawer CSS, native touch/wheel scroll and readable content bottoms."""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=str(ROOT / "out/site")))
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_EXECUTABLE", "/usr/bin/chromium"))
        for name, width in [("mobile", 400), ("desktop", 1400)]:
            page = browser.new_page(viewport={"width": width, "height": 860}, is_mobile=name == "mobile", has_touch=name == "mobile", reduced_motion="reduce")
            page.route("**/fonts.g*/**", lambda r: r.abort())
            page.route("**/three@0.160.0/**", lambda r: r.abort())
            page.goto(f"http://127.0.0.1:{server.server_port}/index.html", wait_until="domcontentloaded")
            # Exercise the actual classic content/tabs and drawer CSS without building the GPU city.
            page.evaluate("document.documentElement.classList.remove('booting');document.documentElement.classList.add('drawer-open');document.getElementById('stage').classList.add('ready');APP.setCity('')")
            session = page.context.new_cdp_session(page)
            for tab in ["cands", "list", "flows", "about"]:
                page.locator(f'.tabs [data-tab="{tab}"]').click()
                if tab == "list":
                    page.evaluate("document.querySelectorAll('#pbody details').forEach(e=>e.open=true)")
                data = page.evaluate("""()=>{const b=document.getElementById('pbody'),s=getComputedStyle(b);return {height:b.clientHeight,scroll:b.scrollHeight,overflow:s.overflowY,touch:s.touchAction,top:document.querySelector('.tabs').getBoundingClientRect().top}}""")
                assert data["overflow"] == "auto" and data["touch"] == "pan-y"
                assert data["height"] > 0
                if data["scroll"] > data["height"] + 1:
                    box = page.locator("#pbody").bounding_box()
                    x, start, end = box["x"] + box["width"] - 16, box["y"] + box["height"] * .8, box["y"] + box["height"] * .25
                    if name == "mobile":
                        session.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": start}]})
                        for step in range(1, 9):
                            session.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x, "y": start + (end-start)*step/8}]})
                            page.wait_for_timeout(16)
                        session.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
                    else:
                        page.mouse.move(x, start)
                        page.mouse.wheel(0, 500)
                    page.wait_for_function("document.getElementById('pbody').scrollTop>0")
                page.evaluate("document.getElementById('pbody').scrollTop=document.getElementById('pbody').scrollHeight")
                page.evaluate("""expected=>{
                  const b=document.getElementById('pbody'),r=b.getBoundingClientRect(),last=b.lastElementChild.getBoundingClientRect();
                  if(b.scrollHeight-b.clientHeight-b.scrollTop>2)throw Error('Cannot reach drawer bottom');
                  if(last.bottom>Math.min(r.bottom,innerHeight)+1)throw Error('Last content outside panel');
                  if(Math.abs(document.querySelector('.tabs').getBoundingClientRect().top-expected)>1)throw Error('Tabs scrolled away');
                }""", data["top"])
                page.screenshot(path=str(ROOT / f"out/panel-scroll-{name}-{tab}.png"))
                print(f"PASS {name} {tab}: native scroll, bottom content and fixed tabs", flush=True)
            page.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
    thread.join()
