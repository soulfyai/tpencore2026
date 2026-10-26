"""Capture the reference mobile opening after normal instruction dismissal."""
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
  page=browser.new_page(viewport={'width':392,'height':697},is_mobile=True,has_touch=True,reduced_motion='reduce');page.set_default_timeout(240000);errors=[]
  page.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',str(e),flush=True)))
  page.on('console',lambda m:print('CONSOLE',m.text[:400],flush=True) if m.type=='error' else None)
  page.add_init_script('window.__nativeRAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==="loop"?0:window.__nativeRAF(cb);')
  page.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(R/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  page.route('**/fonts.googleapis.com/**',lambda r:r.fulfill(body='',content_type='text/css'))
  page.route('**/*config.json',lambda r:r.fulfill(json={'counterEnabled':False,'musicAutoplay':False}))
  page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/greater-taipei-v0.4.3.html?view=panorama&v=reference',wait_until='commit')
  page.wait_for_function("document.querySelector('#stage')?.classList.contains('ready')||document.querySelector('.loading-status')?.textContent.startsWith('無法')",polling=250,timeout=360000)
  assert page.evaluate("document.querySelector('#stage').classList.contains('ready')"),errors
  assert not errors,errors
  page.evaluate("const intro=document.querySelector('.hi-intro');if(!intro.hidden)intro.querySelector('.hi-x').click()")
  assert page.evaluate("document.querySelector('.hi-intro').hidden")
  stats=page.evaluate("""async()=>{const T=await import('three'),c=CITY3D.camera,w=innerWidth,h=innerHeight,_=c.updateMatrixWorld(true),p=v=>{const a=v.clone().project(c);return [+(a.x*.5+.5).toFixed(3),+(.5-a.y*.5).toFixed(3)];},land=APPROVED_ART.cities.get('taipei').landmarks.find(l=>l.id==='t101');return {camera:c.position.toArray(),target:CITY3D.controls.target.toArray(),dist:c.position.distanceTo(CITY3D.controls.target),fov:c.fov,aspect:c.aspect,base:p(new T.Vector3(land.x/14,0,land.z/14)),top:p(new T.Vector3(land.x/14,land.height/14,land.z/14)),coast:CITY3D.WORLD.cities.get('taipei').coast.map(([x,z])=>p(new T.Vector3(x,0,z)))};}""")
  (R/'out/mobile-panorama-v043.json').write_text(json.dumps(stats));print('CAMERA',json.dumps({k:v for k,v in stats.items()if k!='coast'}),flush=True)
  assert stats['dist']>150
  opening={'camera':[-23.860331466377936,45.550904374724325,47.67788488147288],'target':[.6687149558392002,0,-4.924824924471995]}
  page.evaluate('MAP3D.home();CITY3D.controls.update()')
  home=page.evaluate('[...CITY3D.camera.position.toArray(),...CITY3D.controls.target.toArray()]')
  assert max(abs(a-b)for a,b in zip(home,opening['camera']+opening['target']))<.01,(home,opening)
  page.evaluate("document.querySelector('.hi-tools-toggle').click();document.querySelector('[data-mode=pano]').click();CITY3D.controls.update()")
  assert page.evaluate("document.querySelector('#hi-tools-panel').hidden")
  same=page.evaluate('[...CITY3D.camera.position.toArray(),...CITY3D.controls.target.toArray()]')
  assert max(abs(a-b)for a,b in zip(same,stats['camera']+stats['target']))<.01
  print('PASS reference panorama, preserved Taipei Home and normal phone menu control',flush=True)
  print('RENDER reference phone panorama',flush=True)
  page.evaluate("CITY3D.ENV.setTimeMode('day');CITY3D.snapshot();CITY3D.renderer.getContext().finish()")
  page.evaluate('()=>new Promise(r=>window.__nativeRAF(()=>window.__nativeRAF(r)))')
  cap=page.context.new_cdp_session(page).send('Page.captureScreenshot',{'format':'png','fromSurface':True,'captureBeyondViewport':False})
  (R/'out/mobile-panorama-v043.png').write_bytes(base64.b64decode(cap['data']));print('SHOT mobile panorama v0.4.3',flush=True)
  assert page.locator('#stage').evaluate("e=>e.classList.contains('pano')")
  assert page.evaluate("[...document.querySelectorAll('.tlabel')].every(e=>getComputedStyle(e).display==='none')")
  labels=page.evaluate("CITY3D.cityLabels.map(v=>{const r=v.el.getBoundingClientRect();return {city:v.city,x:r.x,y:r.y,w:r.width,h:r.height}})")
  print('LABELS',json.dumps(labels),flush=True)
  logo=page.locator('.hi .brand').bounding_box()
  assert all(r['y']>logo['y']+logo['height']+8 for r in labels),labels
  assert not errors,errors
  browser.close()
finally:server.shutdown()
