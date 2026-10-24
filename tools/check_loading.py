"""Run package_site.py first. Check loading UI with Three.js requests deliberately held/failed."""
import os
from base64 import b64decode
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
            page = browser.new_page(viewport={"width": width, "height": 860}, reduced_motion="reduce")
            capture = page.context.new_cdp_session(page)
            pending = []
            page.route("**/fonts.g*/**", lambda r: r.abort())
            page.route("**/three@0.160.0/**", lambda r: pending.append(r))
            page.goto(f"http://127.0.0.1:{server.server_port}/index.html", wait_until="commit")
            page.wait_for_selector("#loading", state="visible")
            page.wait_for_function("document.querySelector('.loading-status')?.textContent.includes('正在載入')")
            assert not page.locator("#loading a").count()
            assert not page.locator(".loading-actions").is_visible()
            page.evaluate("""()=>{
              const loader=document.getElementById('loading'),r=loader.getBoundingClientRect();
              if(!document.documentElement.classList.contains('hi')||!document.documentElement.classList.contains('booting'))throw Error('Initial shell missing');
              if(Math.abs(r.width-innerWidth)>1||Math.abs(r.height-innerHeight)>1)throw Error('Loading screen is not full viewport');
              if(getComputedStyle(document.querySelector('.maptools')).display!=='none'||getComputedStyle(document.querySelector('header.top')).visibility!=='hidden')throw Error('Legacy chrome exposed');
              if(getComputedStyle(document.querySelector('.loading-spinner')).animationName!=='none')throw Error('Reduced-motion loading spinner animates');
              if(document.getElementById('stage').getAttribute('aria-busy')!=='true')throw Error('Missing busy state');
            }""")
            (ROOT / "out").mkdir(exist_ok=True)
            # Held module requests also delay document.fonts.ready; capture the actual
            # first paint directly instead of waiting for the deliberately blocked load.
            (ROOT / f"out/loading-{name}.png").write_bytes(b64decode(capture.send("Page.captureScreenshot", {"format": "png"})["data"]))
            assert pending, "3D import delay was not exercised"
            for request in pending:
                request.abort()
            page.wait_for_function("document.querySelector('.loading-status')?.textContent.includes('無法載入')")
            assert page.locator("#loading-retry").is_visible()
            assert not page.locator(".loading-spinner").is_visible()
            assert page.locator("#stage").get_attribute("aria-busy") == "false"
            (ROOT / f"out/loading-{name}-failure.png").write_bytes(b64decode(capture.send("Page.captureScreenshot", {"format": "png"})["data"]))
            assert not page.locator("#loading a").count()
            assert "文字版" not in page.locator("#loading").inner_text()
            assert page.locator("#loading-retry").get_attribute("onclick") == "location.reload()"
            print(f"PASS {name}: delayed imports, full-screen shell, reduced motion, failed imports, retry and no text-version link")
            page.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
    thread.join()
