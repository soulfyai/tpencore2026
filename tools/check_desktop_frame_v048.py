"""Check actual transport models, routes, bridge connections and preserved preview."""
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
 with sync_playwright()as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':1600,'height':960},is_mobile=True,has_touch=True,reduced_motion='reduce');errors=[];page.set_default_timeout(300000)
  page.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',str(e),flush=True)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('THREE.WebGLProgram' in m.text or 'Shader Error' in m.text) else None)
  page.add_init_script('window.__nativeRAF=requestAnimationFrame.bind(window);requestAnimationFrame=cb=>cb.name==="loop"?0:__nativeRAF(cb);')
  page.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(R/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  page.route('**/fonts.googleapis.com/**',lambda r:r.fulfill(body='',content_type='text/css'))
  page.route('**/*config.json',lambda r:r.fulfill(json={'counterEnabled':False,'musicAutoplay':False}))
  page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/greater-taipei-v0.4.8.html',wait_until='commit')
  page.wait_for_function("document.querySelector('#stage')?.classList.contains('ready')||document.querySelector('.loading-status')?.textContent.startsWith('無法')",polling=500,timeout=420000)
  assert page.evaluate("document.querySelector('#stage').classList.contains('ready')"),errors
  assert not errors,errors
  page.evaluate("const i=document.querySelector('.hi-intro');if(!i.hidden)i.querySelector('.hi-x').click()")
  print('CAMERA',page.evaluate("({p:CITY3D.camera.position.toArray(),t:CITY3D.controls.target.toArray()})"),flush=True)
  page.evaluate("CITY3D.snapshot()")
  page.screenshot(path='/tmp/v048-desktop.png')
  assert not errors,errors
  browser.close()
finally:server.shutdown()
