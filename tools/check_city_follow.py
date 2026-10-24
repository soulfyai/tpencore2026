"""Check initial help and city context while panning without clicking city buttons."""
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
  # Every fresh visit starts with help; it remains manually reopenable.
  pg.evaluate("document.querySelector('.hi-help').click();CITY3D.snapshot()")
  assert pg.locator('.hi-intro').is_visible()
  pg.screenshot(path=str(ROOT/f"out/city-follow-intro-{'mobile' if mobile else 'desktop'}.png"),timeout=240000)
  pg.locator('.hi-intro .hi-x').click()
  pg.evaluate("MAP3D.enterCity('taipei');CITY3D.snapshot()")
  initial=pg.evaluate('CITY3D.camera.position.distanceTo(CITY3D.controls.target)')
  for city in ['taoyuan','keelung','newtaipei','taipei']:
    result=pg.evaluate("""city=>{
      const C=CITY3D,center=C.WORLD.cities.get(city).center;
      const dx=center[0]-C.controls.target.x,dz=center[1]-C.controls.target.z;
      C.camera.position.x+=dx;C.camera.position.z+=dz;
      C.controls.target.x+=dx;C.controls.target.z+=dz;C.controls.update();
      const before=C.camera.position.clone();C.snapshot();
      const labels=[...document.querySelectorAll('.tlabel')].filter(e=>!e.hidden&&getComputedStyle(e).display!=='none');
      return {city:document.querySelector('.hi-cities [aria-selected=true]').dataset.city,filter:APP.state.cityFilter,labels:labels.length,other:labels.some(e=>e.dataset.city!==city),distance:C.camera.position.distanceTo(C.controls.target),jump:before.distanceTo(C.camera.position)};
    }""",city)
    assert result['city']==city and result['filter']==city,result
    assert result['labels']>0 and not result['other'],result
    assert abs(result['distance']-initial)<1e-6 and result['jump']<1e-6,result
    print('PASS pan updates city / policy labels / brand without camera jump: '+city,flush=True)
    if city=='taoyuan':
      pg.screenshot(path=str(ROOT/f"out/city-follow-taoyuan-{'mobile' if mobile else 'desktop'}.png"),timeout=240000)
  # Pan away from an open policy too: old selection must not keep the previous city locked.
  pg.evaluate("APP.openTheme('tp-ai');CITY3D.snapshot()")
  result=pg.evaluate("""()=>{
    const C=CITY3D,p=C.WORLD.cities.get('taoyuan').center;
    const dx=p[0]-C.controls.target.x,dz=p[1]-C.controls.target.z;
    C.camera.position.x+=dx;C.camera.position.z+=dz;C.controls.target.x+=dx;C.controls.target.z+=dz;C.controls.update();C.snapshot();
    return {city:APP.state.cityFilter,selection:APP.state.selTheme,callout:!!document.querySelector('.callout')};
  }""")
  assert result['city']=='taoyuan' and not result['selection'] and not result['callout'],result
  assert not errors,errors
  print('PASS old policy selection cleared after panning into another city',flush=True)
  b.close()
finally:
 server.shutdown();server.server_close();thread.join()
