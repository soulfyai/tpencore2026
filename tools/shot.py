"""Headless screenshots of index3d.html for visual checks.

Usage (from repo root):
  npm i --no-save three@0.160.0            # once; Three.js is served locally instead of the CDN
  python3 tools/shot.py '{"out/pano":"MAP3D.panorama()","out/tpe":"MAP3D.enterCity(\'taipei\')"}' [mobile]

Each key is an output path (".png" is appended), each value is JS evaluated in the page before the shot.
Weather/time are forced to 11:00 clear; set CITY3D.ENV.forced = {minute: 1140, ...} inside a shot for night.
"""
import sys, json, os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(ROOT, "node_modules/three")

def route(r):
    rel = r.request.url.split("three@0.160.0/")[1]
    r.fulfill(path=os.path.join(T, rel), content_type="application/javascript")

shots = json.loads(sys.argv[1]); mobile = "mobile" in sys.argv
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 400, "height": 860} if mobile else {"width": 1400, "height": 860})
    out = []
    pg.on("pageerror", lambda e: out.append("ERR " + str(e)))
    pg.route("**/three@0.160.0/**", route); pg.route("**/fonts.g*/**", lambda r: r.abort())
    pg.goto("file://" + os.path.join(ROOT, "index3d.html"), wait_until="commit")
    pg.wait_for_function("document.getElementById('stage')?.classList.contains('ready')", timeout=300000)
    pg.evaluate("(()=>{const E=CITY3D.ENV;E.forced={minute:660,w:{code:1,cloud:20,wind:10,temp:27}};E.apply();const i=document.querySelector('.hi-intro');if(i)i.hidden=true;})()")
    for name, js in shots.items():
        r = pg.evaluate(js)
        if r is not None: out.append(f"{name}: {str(r)[:600]}")
        pg.wait_for_timeout(2500)
        os.makedirs(os.path.dirname(name) or ".", exist_ok=True)
        pg.screenshot(path=f"{name}.png", timeout=240000)
    print("\n".join(out)); b.close()
