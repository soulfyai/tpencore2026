"""Headless screenshots of index3d.html for visual checks.

Usage (from repo root):
  pip install playwright                   # once; in Claude Code cloud sessions Chromium is pre-installed
                                           # (do NOT run "playwright install"); locally, also run "playwright install chromium"
  npm i --no-save three@0.160.0            # once; Three.js is served locally instead of the CDN
  CHROMIUM_EXECUTABLE=/usr/bin/chromium python3 tools/shot.py '{"out/pano":"MAP3D.panorama()","out/tpe":"MAP3D.enterCity(\'taipei\')"}' [mobile]

Use --check [mobile] instead of the JSON argument to verify scene geometry and animation.
Use --check-sea [mobile] to verify the sea animation clock and reduced-motion pause.

Each key is an output path (".png" is appended), each value is JS evaluated in the page before the shot.
Weather/time are forced to 11:00 clear; set CITY3D.ENV.forced = {minute: 1140, ...} inside a shot for night.
"""
import sys, json, os
from playwright.sync_api import sync_playwright
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(ROOT, "node_modules/three")

def route(r):
    rel = r.request.url.split("three@0.160.0/")[1]
    r.fulfill(path=os.path.join(T, rel), content_type="application/javascript")

@contextmanager
def serve():
    class Handler(SimpleHTTPRequestHandler):
        extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".html": "text/html; charset=utf-8"}
        def log_message(self, *args): pass
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=ROOT))
    thread = Thread(target=server.serve_forever, daemon=True); thread.start()
    try: yield f"http://127.0.0.1:{server.server_port}/index3d.html"
    finally: server.shutdown(); server.server_close(); thread.join()

mobile = "mobile" in sys.argv
checking = "--check" in sys.argv
sea_check = "--check-sea" in sys.argv
if checking:
    with open(os.path.join(ROOT, "tools/check_scene.js"), encoding="utf-8") as f:
        shots = {"out/check-scene-mobile" if mobile else "out/check-scene-desktop": f.read()}
elif sea_check:
    shots = {"out/check-sea-mobile" if mobile else "out/check-sea-desktop": "MAP3D.panorama()"}
else:
    shots = json.loads(sys.argv[1])
with serve() as url, sync_playwright() as p:
    options = {"args": ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"]}
    if os.environ.get("CHROMIUM_EXECUTABLE"): options["executable_path"] = os.environ["CHROMIUM_EXECUTABLE"]
    b = p.chromium.launch(**options)
    pg = b.new_page(viewport={"width": 400, "height": 860} if mobile else {"width": 1400, "height": 860}, reduced_motion="reduce")
    # Pause the animation scheduler, but snapshot() runs the complete production frame pipeline.
    pg.add_init_script("""window.requestAnimationFrame = cb => { window.__sceneFrame = cb; return 0; };
const getContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type, options) {
  return getContext.call(this, type, type.startsWith('webgl') ? {...options, preserveDrawingBuffer:true} : options);
};""")
    out = []
    pg.on("pageerror", lambda e: out.append("ERR " + str(e)))
    pg.on("console", lambda m: out.append("ERR " + m.text) if m.type == "error" and "THREE.WebGLProgram" in m.text else None)
    pg.route("**/three@0.160.0/**", route); pg.route("**/fonts.g*/**", lambda r: r.abort())
    pg.goto(url, wait_until="commit")
    pg.wait_for_function("document.getElementById('stage')?.classList.contains('ready')", timeout=300000, polling=100)
    pg.evaluate("(()=>{const E=CITY3D.ENV;E.forced={minute:660,w:{code:1,cloud:20,wind:10,temp:27}};E.apply();const i=document.querySelector('.hi-intro');if(i)i.hidden=true;})()")
    if sea_check:
        pg.emulate_media(reduced_motion="no-preference")
        before = pg.evaluate("CITY3D.scene.getObjectByName('open-sea').material.uniforms.uTime.value")
        pg.evaluate("window.__sceneFrame(performance.now()+100)")
        after = pg.evaluate("CITY3D.scene.getObjectByName('open-sea').material.uniforms.uTime.value")
        assert after > before, "Production frame loop did not animate the sea"
        assert pg.evaluate("CITY3D.scene.getObjectByName('coastal-surf').material.uniforms.uTime.value") == after, "Surf clock out of sync"
        pg.emulate_media(reduced_motion="reduce")
        pg.evaluate("window.__sceneFrame(performance.now()+200)")
        assert pg.evaluate("CITY3D.scene.getObjectByName('open-sea').material.uniforms.uTime.value") == after, "Reduced-motion sea did not pause"
        out.append("Sea: production animation, coastal sync and reduced-motion pause passed")
    for name, js in shots.items():
        r = pg.evaluate(js)
        if r is not None: out.append(f"{name}: {str(r)[:600]}")
        state = pg.evaluate("CITY3D.snapshot()")
        out.append(f"{name} environment: {json.dumps(state, ensure_ascii=False)}")
        if checking:
            for city, key in [("taipei", None), ("newtaipei", None), ("keelung", "Enter"), ("taoyuan", "Space")]:
                pg.evaluate("MAP3D.panorama(); CITY3D.snapshot()")
                sign = pg.locator(f'button.clabel[data-city="{city}"]')
                if key:
                    sign.focus()
                    sign.press(key)
                else:
                    # The scene RAF is paused; click its rendered coordinates without waiting
                    # for Playwright's RAF-based stability polling. Assertions below verify receipt.
                    box = sign.bounding_box()
                    assert box is not None, "City sign is not rendered: " + city
                    pg.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                pg.evaluate("CITY3D.snapshot()")
                pg.evaluate("""city => {
                  if (document.getElementById('stage').classList.contains('pano')) throw new Error('City sign did not enter city: '+city);
                  if (document.querySelector('.hi-cities [aria-selected="true"]').dataset.city !== city || document.querySelector('.hi-pop .wx').dataset.city !== city) throw new Error('City sign did not sync selection/weather: '+city);
                }""", city)
            pg.evaluate("MAP3D.panorama(); CITY3D.snapshot()")
            out.append("City signs: pointer clicks and Enter/Space passed for all four cities")
            pg.evaluate("""()=>{
              if (!CITY3D.renderer.info.render.triangles) throw new Error('Scene did not render');
              const f=document.getElementById('stage').getBoundingClientRect();
              if (f.width>620) return;
              const signs=[...document.querySelectorAll('.clabel')].map(e=>e.getBoundingClientRect());
              for (const r of signs) if (r.left<f.left||r.right>f.right||r.top<f.top||r.bottom>f.bottom) throw new Error('City sign clipped');
              for(let i=0;i<signs.length;i++)for(let j=i+1;j<signs.length;j++){
                const a=signs[i],b=signs[j];
                if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)throw new Error('City signs overlap');
              }
            }""")
        os.makedirs(os.path.dirname(name) or ".", exist_ok=True)
        pg.screenshot(path=f"{name}.png", timeout=240000)
    print("\n".join(out)); b.close()
    if any(line.startswith("ERR ") for line in out): sys.exit(1)
