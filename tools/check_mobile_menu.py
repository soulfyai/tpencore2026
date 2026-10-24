"""Check the mobile single-column menu and desktop restoration on resize."""
import sys
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.html':'text/html; charset=utf-8'}
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
thread=Thread(target=server.serve_forever,daemon=True);thread.start()
mobile=True
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  pg=b.new_page(viewport={'width':400 if mobile else 1400,'height':860},reduced_motion='reduce')
  pg.add_init_script("""window.requestAnimationFrame=cb=>{window.__sceneFrame=cb;return 0};""")
  pg.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  pg.route('**/fonts.g*/**',lambda r:r.abort())
  errors=[]
  pg.on('pageerror',lambda e:errors.append(str(e)))
  pg.goto(f'http://127.0.0.1:{server.server_port}/index3d.html',wait_until='commit')
  pg.wait_for_function("document.getElementById('stage')?.classList.contains('ready')",timeout=300000,polling=100)
  pg.evaluate('CITY3D.snapshot()')
  assert pg.locator('.hi-intro').is_visible(), 'Initial help missing'
  pg.locator('.hi-intro .hi-x').click()
  pg.wait_for_function("document.querySelector('.hi-music')&&!document.querySelector('.hi-music').hidden",polling=100)
  toggle=pg.locator('.hi-tools-toggle')
  assert toggle.inner_text().strip()=='' and toggle.get_attribute('aria-label')=='地圖工具'
  toggle.click()
  result=pg.evaluate(r"""()=>{
    const buttons=[...document.querySelectorAll('.hi-tools-panel>button')];
    return buttons.map(b=>({text:b.innerText.replace(/\s+/g,' ').trim(),x:b.getBoundingClientRect().x,y:b.getBoundingClientRect().y,width:b.getBoundingClientRect().width}));
  }""")
  expected=['政策清單','政策進度','使用說明','全景','導覽','地標','音樂']
  assert len(result)==7 and all(name in item['text'] for name,item in zip(expected,result)),result
  assert max(r['x'] for r in result)-min(r['x'] for r in result)<1,result
  assert all(result[i]['y']<result[i+1]['y'] for i in range(6)),result
  pg.screenshot(path=str(ROOT/'out/mobile-menu-single-column.png'),timeout=240000)
  pg.locator('.hi-tools-panel [data-mode=list]').click()
  assert pg.locator('.hi-tools-panel').is_hidden()
  assert pg.evaluate("document.documentElement.classList.contains('drawer-open')")
  pg.evaluate("document.querySelector('[data-mode=pano]').click();CITY3D.snapshot()")
  toggle.click();pg.locator('.hi-tools-panel .hi-help').click()
  assert pg.locator('.hi-intro').is_visible() and pg.locator('.hi-tools-panel').is_hidden()
  pg.locator('.hi-intro .hi-x').click()
  pg.set_viewport_size({'width':1400,'height':860})
  pg.wait_for_function("document.querySelector('.hi-tools-panel>.hi-maptools .hi-tourbtn')&&document.querySelector('.hi-tools-panel>.hi-modes [data-mode=list]')",polling=100)
  pg.evaluate('CITY3D.snapshot()')
  assert toggle.is_hidden()
  assert pg.locator('.hi-maptools>.hi-music').is_visible()
  pg.screenshot(path=str(ROOT/'out/mobile-menu-desktop-preserved.png'),timeout=240000)
  pg.set_viewport_size({'width':320,'height':720})
  pg.wait_for_function("document.querySelectorAll('.hi-tools-panel>button').length===7",polling=100)
  pg.evaluate('CITY3D.snapshot()');toggle.click()
  assert pg.locator('.hi-tools-panel>button').count()==7
  assert pg.evaluate("()=>{const r=document.querySelector('.hi-tools-panel').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}")
  pg.screenshot(path=str(ROOT/'out/mobile-menu-320.png'),timeout=240000)
  assert not errors,errors
  print('PASS icon-only toggle, seven rows in requested visual/DOM order, list/help actions, desktop restoration and 320px layout',flush=True)
  b.close()
finally:
 server.shutdown();server.server_close();thread.join()
