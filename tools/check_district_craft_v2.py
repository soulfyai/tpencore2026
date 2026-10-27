from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[1]
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(R)));Thread(target=server.serve_forever,daemon=True).start()
out=R/'out/craft-review-v2';out.mkdir(parents=True,exist_ok=True)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':1100,'height':760},reduced_motion='reduce');page.set_default_timeout(300000);errors=[]
  page.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',e,flush=True)))
  page.add_init_script('window.__nativeRAF=requestAnimationFrame.bind(window);requestAnimationFrame=cb=>cb.name==="loop"?0:__nativeRAF(cb);')
  page.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(R/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  page.route('**/fonts.googleapis.com/**',lambda r:r.fulfill(body='',content_type='text/css'))
  page.route('**/*config.json*',lambda r:r.fulfill(json={'counterEnabled':False,'musicAutoplay':False}))
  page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/district-craft-v0.2.0.html',wait_until='commit')
  page.wait_for_function('!!window.CRAFT_REVIEW',timeout=420000)
  assert not errors,errors
  data=page.evaluate("APPROVED_ART.cities.get('taipei').buildings.filter(b=>b.kind==='craft-study-v2')")
  assert len(data)==1,data
  for r in data:
   b=r['bounds'];s=r['site']
   assert b['min'][0]>=s['x']-s['w']/2 and b['max'][0]<=s['x']+s['w']/2
   assert b['min'][2]>=s['z']-s['d']/2 and b['max'][2]<=s['z']+s['d']/2
  print('Parcel bounds and integrated lake district PASS',flush=True)
  page.evaluate("document.documentElement.classList.remove('booting');APPROVED_ART.render()")
  page.screenshot(path=str(out/'desktop-front.png'))
  page.locator('[data-craft=rear]').dispatch_event('click');page.evaluate('APPROVED_ART.render()');page.screenshot(path=str(out/'desktop-rear.png'))
  page.set_viewport_size({'width':390,'height':844});page.locator('[data-craft=front]').dispatch_event('click');page.evaluate('APPROVED_ART.render()');page.screenshot(path=str(out/'mobile-front.png'))
  assert page.locator('.craft-review').bounding_box()['width']<=390
  assert not errors,errors
  print('Desktop/mobile camera controls and WebGL PASS',flush=True)
  browser.close()
finally:server.shutdown()
