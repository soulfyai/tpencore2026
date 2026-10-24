"""Check full-bleed viewport, desktop panorama zoom and resize behaviour."""
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
mobile='mobile' in sys.argv
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
  for width,height in [(1400,860),(1920,1080),(1024,768),(400,860),(320,720)]:
    pg.set_viewport_size({'width':width,'height':height})
    pg.wait_for_function("([w,h])=>{const r=document.getElementById('stage').getBoundingClientRect();return Math.abs(r.width-w)<1&&Math.abs(r.height-h)<1&&Math.abs(CITY3D.camera.aspect-w/h)<1e-6}",arg=[width,height],polling=100)
    pg.evaluate('MAP3D.panorama();CITY3D.snapshot()')
    data=pg.evaluate("""()=>{
      const C=CITY3D,r=document.getElementById('stage').getBoundingClientRect(),canvas=C.renderer.domElement.getBoundingClientRect();
      const coast=[...C.WORLD.cities.values()].flatMap(c=>c.coast).map(([x,z])=>C.camera.position.clone().set(x,0,z).project(C.camera));
      const signs=[...document.querySelectorAll('.clabel')].map(e=>e.getBoundingClientRect());
      return {x:r.x,y:r.y,width:r.width,height:r.height,canvasWidth:canvas.width,canvasHeight:canvas.height,aspect:C.camera.aspect,distance:C.camera.position.distanceTo(C.controls.target),coastsVisible:coast.every(p=>Math.abs(p.x)<=1&&Math.abs(p.y)<=1&&p.z<1),signsVisible:signs.every(s=>s.left>=0&&s.right<=innerWidth&&s.top>=0&&s.bottom<=innerHeight)};
    }""")
    assert data['x']==0 and data['y']==0 and data['width']==width and data['height']==height,data
    assert data['canvasWidth']==width and data['canvasHeight']==height,data
    assert abs(data['aspect']-width/height)<1e-6 and data['coastsVisible'] and data['signsVisible'],data
    if width>860:
      assert pg.evaluate("()=>{const a=document.querySelector('.hi-brandbtn').getBoundingClientRect(),b=document.querySelector('.hi-toolbar').getBoundingClientRect();return a.right<=b.left||a.bottom<=b.top}")
    if width==1400: assert 200<data['distance']<240,data
    print('PASS responsive edge-to-edge '+str((width,height))+' '+str(data),flush=True)
    if width in [1400,1024,400]:pg.screenshot(path=str(ROOT/f'out/responsive-{width}.png'),timeout=240000)
  # An untouched overview re-fits on resize without needing Panorama again.
  pg.set_viewport_size({'width':1400,'height':860})
  pg.wait_for_function("CITY3D.camera.aspect>1",polling=100);pg.evaluate('MAP3D.panorama();CITY3D.snapshot()')
  wide=pg.evaluate('CITY3D.camera.position.distanceTo(CITY3D.controls.target)')
  pg.set_viewport_size({'width':400,'height':860})
  pg.wait_for_function("CITY3D.camera.aspect<1",polling=100);pg.evaluate('CITY3D.snapshot()')
  assert pg.evaluate('CITY3D.camera.position.distanceTo(CITY3D.controls.target)')>wide*2
  # Manual city framing survives viewport changes.
  pg.evaluate("MAP3D.enterCity('taipei');CITY3D.snapshot()")
  saved=pg.evaluate('({p:CITY3D.camera.position.toArray(),t:CITY3D.controls.target.toArray()})')
  pg.set_viewport_size({'width':1400,'height':860})
  pg.wait_for_function("CITY3D.camera.aspect>1",polling=100);pg.evaluate('CITY3D.snapshot()')
  after=pg.evaluate('({p:CITY3D.camera.position.toArray(),t:CITY3D.controls.target.toArray()})')
  assert max(abs(a-b) for a,b in zip(saved['p']+saved['t'],after['p']+after['t']))<1e-6,(saved,after)
  assert not errors,errors
  print('PASS overview resize re-fit and manual city-view preservation',flush=True)
  b.close()
finally:
 server.shutdown();server.server_close();thread.join()
