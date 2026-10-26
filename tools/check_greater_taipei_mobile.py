"""Compare packaged production and preview in an emulated mobile browser."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
s=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(R)));Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  boxes=[]
  for path in ['out/site/index.html','prototypes/greater-taipei.html']:
   page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
   page.add_init_script('window.requestAnimationFrame=()=>0;')
   page.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(R/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
   page.route('**/fonts.googleapis.com/**',lambda r:r.fulfill(body='',content_type='text/css'))
   page.route('**/*config.json',lambda r:r.fulfill(json={'counterEnabled':False,'musicAutoplay':False}))
   page.goto(f'http://127.0.0.1:{s.server_port}/{path}',wait_until='commit')
   page.wait_for_function("document.querySelector('#stage')?.classList.contains('ready')",polling=250,timeout=240000)
   assert page.evaluate('innerWidth')==390
   assert page.evaluate('document.characterSet')=='UTF-8'
   assert page.evaluate('APP.cities[0].cityName')=='台北市'
   boxes.append(page.locator('.hi-brandbtn').bounding_box())
   print('PASS real mobile viewport/UTF-8',path,boxes[-1],flush=True)
   page.close()
  assert boxes[0]==boxes[1],boxes
  print('PASS production and preview have identical logo rectangle on emulated mobile.',flush=True)
  b.close()
finally:s.shutdown()
