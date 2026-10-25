"""Pixel regression: orbit a far camera and sample unpainted asphalt, before and after the fix."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=b.new_page();page.set_default_timeout(180000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  page.goto(f'http://127.0.0.1:{server.server_port}/tools/road-depth-fixture.html');page.wait_for_function("document.documentElement.dataset.ready==='true'")
  result=page.evaluate('ROAD_DEPTH_TEST.run()');print(result,flush=True)
  assert result['baseline']['samples']>500 and result['baseline']['white']>50,'fixture did not reproduce old pavement bleeding through asphalt'
  assert result['geometry']['white']==0 and result['precision']['white']==0,'fixed unpainted asphalt still flashes white'
  assert not errors,errors;b.close()
 print('PASS far-camera pixel sweep reproduces old white flashes; union road material stays stable.',flush=True)
finally:server.shutdown()
