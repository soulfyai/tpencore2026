"""Compare the two-city preview against the actual production geometry and native UI."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import math
import re
import subprocess
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
COLLECT = """()=>{const C=CITY3D,W=C.WORLD,keep=c=>['taipei','newtaipei'].includes(c);return {
 half:W.blockHalfSize,
 coasts:Object.fromEntries([...W.cities].filter(([id])=>keep(id)).map(([id,c])=>[id,c.coast])),
 cells:W.blockCells.filter(c=>keep(c.city)).map(c=>({id:c.id,c:c.c,poly:c.poly,themeId:c.themeId,zone:c.zone})).sort((a,b)=>a.id.localeCompare(b.id)),
 themes:C.islands.filter(i=>keep(i.city)).map(i=>({id:i.id,x:i.c.x,z:i.c.z,cells:i.cells.map(c=>c.id)})).sort((a,b)=>a.id.localeCompare(b.id)),
 items:[...C.ITEMS3D].filter(([id])=>/^(tp|nt)-/.test(id)).map(([id,i])=>({id,min:i.box.min.toArray(),max:i.box.max.toArray()})).sort((a,b)=>a.id.localeCompare(b.id)),
 landmarks:LANDMARKS3D.filter(l=>keep(l.city)&&!l.fixed).map(l=>({id:l.id,x:l.isl.c.x+l.x,z:l.isl.c.z+l.z,top:l.top,r:l.r,scale:l.sc})).sort((a,b)=>a.id.localeCompare(b.id))};}"""


def same(a, b, path='geometry'):
    if isinstance(a, (float, int)) and isinstance(b, (float, int)):
        assert math.isclose(a, b, rel_tol=0, abs_tol=1e-8), (path, a, b)
    elif isinstance(a, dict):
        assert a.keys() == b.keys(), path
        for k in a:
            same(a[k], b[k], path + '/' + k)
    elif isinstance(a, list):
        assert len(a) == len(b), (path, len(a), len(b))
        for i, (x, y) in enumerate(zip(a, b)):
            same(x, y, path + '/' + str(i))
    else:
        assert a == b, (path, a, b)


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.html': 'text/html; charset=utf-8'}

    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=[
            '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])

        def load(path):
            page = browser.new_page(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
            page.set_default_timeout(180000)
            errors = []
            page.on('pageerror', lambda e: (errors.append(str(e)), print('PAGE ERROR', str(e), flush=True)))
            page.on('console', lambda m: (errors.append(m.text), print('ERROR', m.text, flush=True)) if m.type == 'error' and 'net::' not in m.text else None)
            page.add_init_script("""window.requestAnimationFrame=()=>0;const get=HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext=function(type,options){return get.call(this,type,type.startsWith('webgl')?{...options,preserveDrawingBuffer:true}:options);};""")
            page.route('**/three@0.160.0/**', lambda r: r.fulfill(path=str(ROOT / 'node_modules/three' / r.request.url.split('three@0.160.0/')[1]), content_type='application/javascript'))
            page.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
            page.route('**/*config.json', lambda r: r.fulfill(json={'counterEnabled': False, 'musicAutoplay': False}))
            page.goto(f'http://127.0.0.1:{server.server_port}/{path}', wait_until='commit')
            page.wait_for_function("document.getElementById('stage')?.classList.contains('ready')||document.querySelector('.loading-status')?.textContent.startsWith('無法')", timeout=360000, polling=250)
            assert page.evaluate("document.getElementById('stage').classList.contains('ready')"), errors
            page.evaluate('CITY3D.snapshot()')
            assert not errors, errors
            return page, errors

        baseline, errors = load('index3d.html')
        original = baseline.evaluate(COLLECT)
        baseline.close()
        page, errors = load('prototypes/greater-taipei.html')
        proposed = page.evaluate(COLLECT)
        same(original, proposed)
        print('PASS exact original coast/cell/theme/landmark/item bounds (tolerance 1e-8).', flush=True)
        assert page.evaluate('[...CITY3D.WORLD.cities.keys()]') == ['taipei', 'newtaipei']
        assert page.evaluate('APP.cities.map(c=>c.city)') == ['taipei', 'newtaipei']
        assert page.evaluate('APP.themes.length') == 26
        assert page.evaluate('APP.themes.reduce((n,t)=>n+t.items.length,0)') == 118
        assert page.locator('.hi-intro').is_visible()

        def clean():
            assert not re.search(r'桃園|基隆(?!河|路)|北北基桃', page.locator('body').inner_text())

        def shot(name):
            page.evaluate('CITY3D.snapshot()')
            page.screenshot(path=str(ROOT / f'out/preserved-{name}.png'), timeout=240000)
            print('SHOT', name, flush=True)

        def click(selector):
            r = page.locator(selector).bounding_box()
            page.mouse.click(r['x'] + r['width']/2, r['y'] + r['height']/2)

        clean()
        click('.hi-intro .hi-ghost')
        page.evaluate('CITY3D.snapshot()')
        distance = page.evaluate("CITY3D.controls.target.distanceTo(MAP3D.cityFrame('taipei').target)")
        assert distance < .001, distance
        shot('taipei-desktop')
        page.evaluate("MAP3D.enterCity('newtaipei');CITY3D.snapshot()")
        shot('newtaipei-desktop')
        for id in page.evaluate('APP.themes.map(t=>t.id)'):
            page.evaluate('id=>APP.openTheme(id)', id)
            clean()
        page.evaluate('MAP3D.home();CITY3D.snapshot()')
        page.keyboard.press('Escape')
        page.set_viewport_size({'width': 400, 'height': 860})
        page.evaluate("window.dispatchEvent(new Event('resize'));MAP3D.home();CITY3D.snapshot()")
        shot('taipei-mobile')
        page.evaluate("MAP3D.enterCity('newtaipei');CITY3D.snapshot()")
        shot('newtaipei-mobile')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        clean()
        assert not errors, errors
        page.close()
        browser.close()
    subprocess.run(['git', 'diff', '--exit-code', '--', 'index.html', 'index3d.html', '3d/', 'data/', 'VERSION', 'template.html', 'build.py'], cwd=ROOT, check=True)
    print('PASS native two-city preview; production sources unchanged.', flush=True)
finally:
    server.shutdown()
