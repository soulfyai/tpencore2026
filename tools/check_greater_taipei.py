"""Exercise the isolated two-city metropolitan preview in real desktop/mobile WebGL."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import io
import json
import re
import subprocess
import wave
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTSIDE = re.compile(r'桃園|基隆(?!河|路)|北北基桃')
data = json.loads((ROOT / 'prototypes/greater-taipei-data.json').read_text())
assert [c['id'] for c in data['cities']] == ['taipei', 'newtaipei']
assert not OUTSIDE.search(json.dumps(data, ensure_ascii=False))
assert '基隆河' in json.dumps(data, ensure_ascii=False) and '基隆路' in json.dumps(data, ensure_ascii=False)
for city in data['cities']:
    source_ids = {s['id'] for s in city['sources']}
    for theme in city['themes']:
        for item in theme['items']:
            assert item.get('sources') and set(item['sources']) <= source_ids, item['id']
for path in (ROOT / 'prototypes').glob('greater-taipei*'):
    assert not OUTSIDE.search(path.read_text()), path.name
audio = io.BytesIO()
with wave.open(audio, 'wb') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(8000)
    f.writeframes(b'\0\0' * 2000)


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml'}

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
        page.set_default_timeout(240000)
        errors = []
        page.on('pageerror', lambda e: (errors.append(str(e)), print('PAGE ERROR', str(e), flush=True)))
        page.on('console', lambda m: (errors.append(m.text), print('CONSOLE ERROR', m.text, flush=True)) if m.type == 'error' else None)
        page.route('**/three@0.160.0/**', lambda r: r.fulfill(
            path=str(ROOT / 'node_modules/three' / r.request.url.split('three@0.160.0/')[1]), content_type='application/javascript'))
        page.route('https://tpencore.tw/music/**', lambda r: r.fulfill(body=audio.getvalue(), content_type='audio/wav'))
        page.add_init_script('window.requestAnimationFrame=()=>0;')
        page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/greater-taipei.html', wait_until='commit')
        page.wait_for_function("document.documentElement.dataset.ready==='true'||document.documentElement.dataset.error==='true'", timeout=600000, polling=500)
        assert page.evaluate("document.documentElement.dataset.ready==='true'"), errors
        assert not errors, errors

        def click(selector):
            r = page.locator(selector).bounding_box()
            assert r, selector
            page.mouse.click(r['x'] + r['width'] / 2, r['y'] + r['height'] / 2)

        def clean_copy():
            assert not OUTSIDE.search(page.locator('body').inner_text())

        def shot(name):
            stats = page.evaluate('GREATER_TAIPEI.snapshot()')
            page.screenshot(path=str(ROOT / f'out/greater-{name}.png'), timeout=300000)
            print('SHOT', name, stats, flush=True)

        stats = page.evaluate('GREATER_TAIPEI.snapshot(false)')
        assert stats['cityIds'] == ['taipei', 'newtaipei'] and stats['city'] == 'taipei'
        assert page.locator('[data-city]').count() == 2
        assert page.locator('.entry img').get_attribute('src') == 'greater-taipei-sign.svg'
        shot('entry-desktop')
        click('#enter')
        assert page.locator('#panel-title').inner_text() == '使用說明'
        assert page.evaluate('GREATER_TAIPEI.state.city') == 'taipei'
        clean_copy()
        page.mouse.click(5, 500)
        assert page.locator('#panel').is_hidden()
        shot('taipei-desktop')
        for city_id, count, items in [('taipei', 17, 62), ('newtaipei', 9, 56)]:
            click(f'[data-city={city_id}]')
            s = page.evaluate('GREATER_TAIPEI.snapshot(false)')
            assert s['themes'] == count and s['items'] == items
            assert page.evaluate('id=>GREATER_TAIPEI.cities[id].features.flag', city_id)
            for theme in next(c['themes'] for c in data['cities'] if c['id'] == city_id):
                page.evaluate('id=>GREATER_TAIPEI.showTheme(id,false)', theme['id'])
                assert page.locator('.policy-item').count() == len(theme['items'])
                assert page.locator('.source').count() > 0
                clean_copy()
            page.evaluate('GREATER_TAIPEI.showPolicies()')
            assert page.locator('.list-row').count() == count
            page.locator('.search').fill('不存在的政策檢查')
            assert page.locator('.list-row').count() == 0
            page.evaluate('GREATER_TAIPEI.showProgress()')
            assert page.locator('.policy-item').count() == items
            clean_copy()
            page.keyboard.press('Escape')
        shot('newtaipei-desktop')
        click('#home')
        assert page.evaluate('GREATER_TAIPEI.state.city') == 'taipei'
        click('#menu-button')
        actions = page.locator('#menu > button').evaluate_all('(els)=>els.map(e=>e.dataset.action)')
        assert actions == ['policies', 'progress', 'help', 'panorama', 'guide', 'landmarks', 'music']
        page.locator('#time-mode').select_option('night')
        assert page.evaluate('GREATER_TAIPEI.state.night')
        click('#menu-button')
        shot('night-desktop')
        click('#menu-button')
        page.locator('#time-mode').select_option('real')
        assert page.evaluate('GREATER_TAIPEI.state.time') == 'real'
        page.locator('#time-mode').select_option('day')
        click('[data-action=guide]')
        assert page.locator('#guide').is_visible()
        page.wait_for_function('GREATER_TAIPEI.state.music===true', polling=100)
        before = page.locator('#guide-title').inner_text()
        click('#guide-next')
        assert page.locator('#guide-title').inner_text() != before
        click('#guide-details')
        assert page.locator('.policy-item').count() > 0
        page.keyboard.press('Escape')
        click('#guide-stop')
        click('#panorama')
        assert page.evaluate('GREATER_TAIPEI.state.view') == 'panorama'
        shot('two-cities-desktop')
        click('#home')
        page.set_viewport_size({'width': 400, 'height': 860})
        page.evaluate('window.dispatchEvent(new Event("resize"))')
        click('#home')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        shot('taipei-mobile')
        click('#menu-button')
        shot('menu-mobile')
        click('[data-action=help]')
        assert page.locator('#panel-title').inner_text() == '使用說明'
        page.mouse.click(5, 400)
        assert page.locator('#panel').is_hidden()
        click('[data-city=newtaipei]')
        shot('newtaipei-mobile')
        page.evaluate('GREATER_TAIPEI.showPolicies()')
        clean_copy()
        assert page.locator('.list-row').count() == 9
        page.keyboard.press('Escape')
        page.evaluate('GREATER_TAIPEI.panorama(true)')
        shot('two-cities-mobile')
        assert not errors, errors
        browser.close()
    subprocess.run(['git', 'diff', '--exit-code', 'fb88fac', '--', 'index.html', 'index3d.html', '3d/', 'data/', 'VERSION',
                    'prototypes/taipei-composition.js', 'prototypes/taipei-composition-elements.js'], cwd=ROOT, check=True)
    print('PASS two-city scope, retained place names, 118 items/citations, Taipei entry/Home, guide/audio/time/menu, desktop/mobile; production unchanged.', flush=True)
finally:
    server.shutdown()
