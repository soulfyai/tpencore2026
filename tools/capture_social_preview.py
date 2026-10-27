"""Capture the actual 3D overview as a 1200x630 social preview; no image compositing."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.html':'text/html; charset=utf-8'}
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
thread=Thread(target=server.serve_forever,daemon=True);thread.start()
try:
 with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':1200,'height':630},device_scale_factor=1,reduced_motion='reduce')
    pg.add_init_script("""window.requestAnimationFrame=cb=>{window.__sceneFrame=cb;return 0};
const original=HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext=function(type,options){return original.call(this,type,type.startsWith('webgl')?{...options,preserveDrawingBuffer:true}:options)};""")
    pg.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
    pg.route('**/fonts.g*/**',lambda r:r.abort())
    pg.route('**/site-config.json',lambda r:r.fulfill(json={}))
    errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
    pg.goto(f'http://127.0.0.1:{server.server_port}/out/site/index.html',wait_until='commit')
    pg.wait_for_function("document.getElementById('stage')?.classList.contains('ready')",timeout=300000,polling=100)
    pg.evaluate("""()=>{CITY3D.ENV.forced={minute:720,w:{code:1,cloud:20,wind:10,temp:27}};document.querySelector('.hi-intro').hidden=true;MAP3D.panorama();CITY3D.snapshot()}""")
    pg.locator('.hi-brandart img').evaluate('(img)=>img.decode()')
    assert pg.locator('#loading').is_hidden()
    assert pg.locator('button.clabel').count()==2
    pg.screenshot(path=str(ROOT/'assets/social-preview.jpg'),type='jpeg',quality=88,timeout=240000)
    assert not errors,errors
    b.close()
    print('Captured actual 3D overview: assets/social-preview.jpg (1200x630)')
finally:server.shutdown();server.server_close();thread.join()
