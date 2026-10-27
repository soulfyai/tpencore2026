from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys
R=Path(__file__).resolve().parents[1]
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(R)));Thread(target=server.serve_forever,daemon=True).start()
out=R/'out/landmark-art-v030';out.mkdir(parents=True,exist_ok=True)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':900,'height':650},reduced_motion='reduce');page.set_default_timeout(300000);errors=[]
  page.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',e,flush=True)))
  page.add_init_script('window.__nativeRAF=requestAnimationFrame.bind(window);requestAnimationFrame=cb=>cb.name==="loop"?0:__nativeRAF(cb);')
  page.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(R/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  page.route('**/fonts.googleapis.com/**',lambda r:r.fulfill(body='',content_type='text/css'))
  page.route('**/*config.json*',lambda r:r.fulfill(json={'counterEnabled':False,'musicAutoplay':False}))
  page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/landmark-art-v0.3.0.html',wait_until='commit')
  page.wait_for_function('!!window.CRAFT_REVIEW',timeout=420000)
  assert not errors,errors
  data=page.evaluate("({meshes:CRAFT_REVIEW.asset.meshes,triangles:CRAFT_REVIEW.asset.triangles,original:CRAFT_REVIEW.asset.original})")
  assert data['meshes']>=10 and data['triangles']>10000 and not data['original'],data
  assert page.evaluate("(()=>{const c=APPROVED_ART.cities.get('taipei'),f=c.assetReview.footprint;return c.infill.added.every(b=>!(Math.abs(b.x-f.x)<(b.w+f.w)/2&&Math.abs(b.z-f.z)<(b.d+f.d)/2));})()"), 'Infill intersects landmark footprint'
  print('GLB loaded and footprint clear',data,flush=True)
  page.evaluate("document.documentElement.classList.remove('booting');APPROVED_ART.render()")
  page.screenshot(path=str(out/'full.png'))
  if '--framing-only' in sys.argv:
   page.set_viewport_size({'width':390,'height':844});page.locator('[data-craft=full]').dispatch_event('click');page.evaluate('APPROVED_ART.render()');page.screenshot(path=str(out/'mobile.png'));assert not errors,errors;print('Final desktop/mobile auto framing PASS',flush=True);browser.close();raise SystemExit(0)
  page.locator('[data-craft=facade]').dispatch_event('click');page.evaluate('APPROVED_ART.render()');page.screenshot(path=str(out/'facade.png'))
  before=page.evaluate('CITY3D.camera.position.toArray()')
  page.locator('[data-craft=compare]').dispatch_event('click');page.evaluate('APPROVED_ART.render()');page.screenshot(path=str(out/'original.png'))
  assert page.evaluate('CRAFT_REVIEW.asset.original')
  assert before==page.evaluate('CITY3D.camera.position.toArray()')
  page.locator('[data-craft=compare]').dispatch_event('click')
  assert not page.evaluate('CRAFT_REVIEW.asset.original')
  page.locator('[data-craft=podium]').dispatch_event('click');page.evaluate('APPROVED_ART.render()');page.screenshot(path=str(out/'podium.png'))
  page.set_viewport_size({'width':390,'height':844});page.locator('[data-craft=full]').dispatch_event('click');page.evaluate('APPROVED_ART.render()');page.screenshot(path=str(out/'mobile.png'))
  assert page.locator('.craft-review').bounding_box()['width']<=390
  assert not errors,errors
  print('GLB model comparison, facade/podium views and mobile PASS',flush=True)
  browser.close()
finally:server.shutdown()
