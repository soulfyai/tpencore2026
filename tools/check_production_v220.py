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
  page=browser.new_page(viewport={'width':900,'height':600},is_mobile=True,has_touch=True,reduced_motion='reduce');errors=[];page.set_default_timeout(300000)
  page.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',str(e),flush=True)))
  page.on('console',lambda m:print('CONSOLE',m.text,flush=True) if m.type=='error' else None)
  page.add_init_script('window.__nativeRAF=requestAnimationFrame.bind(window);requestAnimationFrame=cb=>cb.name==="loop"?0:__nativeRAF(cb);')
  page.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(R/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  page.route('**/fonts.googleapis.com/**',lambda r:r.fulfill(body='',content_type='text/css'))
  page.route('**/*config.json',lambda r:r.fulfill(json={'counterEnabled':False,'musicAutoplay':False}))
  page.goto(f'http://127.0.0.1:{server.server_port}/out/site/index.html',wait_until='commit')
  page.wait_for_function("document.querySelector('#stage')?.classList.contains('ready')||document.querySelector('.loading-status')?.textContent.startsWith('無法')",polling=500,timeout=420000)
  assert page.evaluate("document.querySelector('#stage').classList.contains('ready')"),errors
  assert not errors,errors
  page.evaluate("const i=document.querySelector('.hi-intro');if(!i.hidden)i.querySelector('.hi-x').click()")
  print('CAMERA',page.evaluate("({p:CITY3D.camera.position.toArray(),t:CITY3D.controls.target.toArray()})"),flush=True)

  stats=page.evaluate("({oldShips:APPROVED_ART.transport.vessels.length,oldPlanes:APPROVED_ART.transport.planes.length,newShips:APPROVED_ART.transport.remote.vessels.length,newPlanes:APPROVED_ART.transport.remote.planes.length,lanes:APPROVED_ART.transport.remote.lanes.length})")
  print(stats,flush=True)
  assert stats['oldShips']==40 and stats['oldPlanes']==16 and stats['newShips']>0 and stats['newPlanes']==12
  assert page.evaluate("APPROVED_ART.transport.marine.animals.length") == 8
  page.wait_for_function("!!APPROVED_ART.panoramaLife")
  print('PANORAMA',page.evaluate("({points:APPROVED_ART.panoramaLife.points.map(p=>{const q=p.clone().project(CITY3D.camera);return [(q.x+1)/2,(1-q.y)/2]}),boats:APPROVED_ART.panoramaLife.boats.length,planes:APPROVED_ART.panoramaLife.planes.length})"),flush=True)
  assert page.evaluate("APPROVED_ART.panoramaLife.boats.length")>=3
  page.evaluate("document.documentElement.classList.remove('booting')")
  page.locator('.hi-policy > button').dispatch_event('click')
  assert page.locator('.hi-policy-menu').is_visible()
  page.locator('.hi-policy-menu [data-mode="list"]').dispatch_event('click')
  assert page.locator('html').evaluate('(e)=>e.classList.contains("drawer-open")')
  assert '時間' in page.locator('.hi-clock-trigger').inner_text()
  assert page.locator('.hi-data-help').count()==1
  print('Production panorama and navigation PASS',flush=True)
  assert not errors,errors
  browser.close()
finally:server.shutdown()
