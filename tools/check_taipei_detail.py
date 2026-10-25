"""Render and exercise the independent Taipei material/architecture study."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import subprocess
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.html': 'text/html; charset=utf-8'}

    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=[
            '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
            '--enable-webgl', '--ignore-gpu-blocklist'])
        page = browser.new_page(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        page.set_default_timeout(180000)
        errors = []
        page.on('pageerror', lambda e: (errors.append(str(e)), print('PAGE ERROR', str(e), flush=True)))
        page.on('console', lambda m: (errors.append(m.text), print('CONSOLE ERROR', m.text, flush=True)) if m.type == 'error' else None)
        page.route('**/three@0.160.0/**', lambda r: r.fulfill(
            path=str(ROOT / 'node_modules/three' / r.request.url.split('three@0.160.0/')[1]),
            content_type='application/javascript'))
        page.add_init_script('window.requestAnimationFrame=()=>0;')
        page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/taipei-detail.html', wait_until='commit')
        page.wait_for_function("document.documentElement.dataset.ready==='true'", timeout=300000, polling=500)
        stats = page.evaluate('TAIPEI_DETAIL.snapshot()')
        print(json.dumps(stats, ensure_ascii=False), flush=True)
        assert not errors, errors
        assert len(stats['features']['buildings']) == 7
        assert stats['features']['trees'] >= 30
        assert stats['features']['shopfronts'] == 5
        assert stats['features']['flag'] and stats['features']['people'] == 14
        # The ground extrudes upward after rotation: its top must stay below road/paving.
        assert page.evaluate("""(()=>{const g=TAIPEI_DETAIL.scene.getObjectByName('detail-ground');
            g.geometry.computeBoundingBox();const top=g.position.y+g.geometry.boundingBox.max.z;
            return top < TAIPEI_DETAIL.scene.getObjectByName('detail-road').position.y;})()""")

        def click(selector):
            bounds = page.locator(selector).bounding_box()
            page.mouse.click(bounds['x'] + bounds['width'] / 2, bounds['y'] + bounds['height'] / 2)

        def shot(name):
            page.evaluate('TAIPEI_DETAIL.snapshot()')
            if name.startswith('overview'):
                assert page.evaluate("""(()=>{const flag=TAIPEI_DETAIL.scene.getObjectByName('detail-national-flag');
                    const p=flag.localToWorld(flag.position.clone().set(0,0,0)).project(TAIPEI_DETAIL.camera);
                    return Math.abs(p.x)<.95 && p.y<.8 && p.y>-.9 && p.z<1;})()"""), '101 flag clipped'
            page.screenshot(path=str(ROOT / f'out/detail-{name}.png'), timeout=240000)
            print('SHOT', name, flush=True)

        shot('overview-desktop')
        for view in ['street', 'courtyard', 'lake']:
            click(f'[data-view={view}]')
            assert page.evaluate('TAIPEI_DETAIL.snapshot().view') == view
            shot(f'{view}-desktop')
        click('#time')
        assert page.evaluate('TAIPEI_DETAIL.snapshot().sunset')
        shot('sunset-desktop')
        click('#time')
        page.locator('#quality').select_option('standard')
        assert not page.evaluate('TAIPEI_DETAIL.renderer.shadowMap.enabled')
        page.locator('#quality').select_option('high')
        assert page.evaluate('TAIPEI_DETAIL.renderer.shadowMap.enabled')
        assert not page.evaluate('TAIPEI_DETAIL.snapshot().moving')
        click('#motion')
        assert page.evaluate('TAIPEI_DETAIL.snapshot().moving')
        click('#motion')
        before = page.evaluate('TAIPEI_DETAIL.camera.position.toArray()')
        page.mouse.move(800, 450)
        page.mouse.down()
        page.mouse.move(930, 510, steps=6)
        page.mouse.up()
        assert before != page.evaluate('TAIPEI_DETAIL.camera.position.toArray()')
        page.set_viewport_size({'width': 400, 'height': 860})
        page.evaluate('window.dispatchEvent(new Event("resize"))')
        click('[data-view=overview]')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        shot('overview-mobile')
        click('[data-view=street]')
        shot('street-mobile')
        assert not errors, errors
        browser.close()
    subprocess.run(['git', 'diff', '--exit-code', 'dc7ac26', '--',
                    'index.html', 'index3d.html', '3d/', 'data/',
                    'prototypes/taipei-city.js', 'prototypes/regional-city.js'], cwd=ROOT, check=True)
    print('PASS native camera, all four views, time, quality, motion, desktop/mobile; production unchanged.', flush=True)
finally:
    server.shutdown()
