"""Verify the specified street-detail concept inside the native two-city preview."""
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,json,sys
R=Path(__file__).resolve().parents[1]
class H(SimpleHTTPRequestHandler):
 extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.html':'text/html; charset=utf-8'}
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(R)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':1200,'height':900},reduced_motion='reduce');page.set_default_timeout(240000);errors=[]
  page.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',str(e),flush=True)))
  page.on('console',lambda m:print('CONSOLE',m.text[:400],flush=True) if m.type=='error' else None)
  page.add_init_script('window.__nativeRAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==="loop"?0:window.__nativeRAF(cb);')
  page.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(R/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  page.route('**/fonts.googleapis.com/**',lambda r:r.fulfill(body='',content_type='text/css'))
  page.route('**/*config.json',lambda r:r.fulfill(json={'counterEnabled':False,'musicAutoplay':False}))
  page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/architecture-v041-types.html',wait_until='commit')
  page.wait_for_function('window.ARCHITECTURE_CATALOG')
  audit=page.evaluate('ARCHITECTURE_CATALOG.audit');assert audit['count']==audit['types']==audit['uniqueStructures']==24
  print('PASS 24 actual building types loaded in catalog',flush=True)
  assert not errors,errors
  def shot(name):
   page.evaluate('ARCHITECTURE_CATALOG.render();ARCHITECTURE_CATALOG.renderer.getContext().finish()')
   page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
   cap=page.context.new_cdp_session(page).send('Page.captureScreenshot',{'format':'png','fromSurface':True,'captureBeyondViewport':False})
   (R/f'out/v041-types-{name}.png').write_bytes(base64.b64decode(cap['data']));print('SHOT',name,flush=True)
  shot('overview')
  for t in ([] if "--overview-only" in sys.argv else [3,4,10,19]):
   page.evaluate('(t)=>ARCHITECTURE_CATALOG.focus(ARCHITECTURE_CATALOG.records.find(r=>r.type===t).id)',t)
   shot(str(t))
  browser.close()
finally:server.shutdown()
