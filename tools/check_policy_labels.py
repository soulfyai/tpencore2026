"""Check policy-label placement, rotation, stable frames and native picking."""
import sys
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SIZES=[(1400,860)] if '--desktop' in sys.argv else [(320,740)] if '--narrow' in sys.argv else [(400,860),(1400,860),(320,740)]
class Handler(SimpleHTTPRequestHandler):
 extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.html':'text/html; charset=utf-8'}
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
thread=Thread(target=server.serve_forever,daemon=True);thread.start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  pg=b.new_page(viewport={'width':SIZES[0][0],'height':SIZES[0][1]},reduced_motion='reduce')
  pg.add_init_script('window.requestAnimationFrame=cb=>{window.__sceneFrame=cb;return 0}')
  pg.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  pg.route('**/fonts.g*/**',lambda r:r.abort())
  pg.route('**/site-config.json',lambda r:r.fulfill(json={}))
  errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  pg.goto(f'http://127.0.0.1:{server.server_port}/index3d.html',wait_until='commit')
  pg.wait_for_function("document.getElementById('stage')?.classList.contains('ready')",timeout=300000,polling=100)
  pg.evaluate("CITY3D.ENV.forced={minute:720,w:{code:1}};document.querySelector('.hi-intro').hidden=true;CITY3D.snapshot()")
  check=r'''()=>{
   const labels=[...document.querySelectorAll('.tlabel:not([hidden])')].filter(e=>getComputedStyle(e).display!=='none');
   const rects=labels.map(e=>({id:e.dataset.theme,...Object.fromEntries(['left','right','top','bottom','width','height'].map(k=>[k,e.getBoundingClientRect()[k]]))}));
   for(const r of rects)if(r.left<7||r.right>innerWidth-7||r.top<80||r.bottom>innerHeight-40)throw Error('Clipped label '+JSON.stringify(r));
   for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
    const a=rects[i],b=rects[j];if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>.7&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.7)throw Error('Overlap '+a.id+' / '+b.id);
   }
   const xs=new Set(rects.map(r=>Math.round((r.left+r.right)/2/8)));
   if(xs.size<5)throw Error('Labels still form rigid columns');
   const svg=document.querySelector('.policy-guides');if(getComputedStyle(svg).pointerEvents!=='none')throw Error('Guides intercept input');
   const before=labels.map(e=>e.style.translate).join('|'),markup=svg.innerHTML;CITY3D.snapshot();
   if(before!==labels.map(e=>e.style.translate).join('|')||markup!==svg.innerHTML)throw Error('Unstable idle placement');
   return {labels:labels.length,xPositions:xs.size,guides:svg.querySelectorAll('line').length};
  }'''
  for width,height in SIZES:
   pg.set_viewport_size({'width':width,'height':height})
   pg.wait_for_function("([w,h])=>{const r=document.getElementById('stage').getBoundingClientRect();return Math.abs(r.width-w)<1&&Math.abs(r.height-h)<1&&Math.abs(CITY3D.camera.aspect-w/h)<.001}",arg=[width,height],polling=100,timeout=60000)
   pg.evaluate('CITY3D.snapshot()')
   cities=['taipei','newtaipei','keelung','taoyuan'] if width!=320 else ['taipei']
   for city in cities:
    pg.evaluate('c=>{MAP3D.enterCity(c);CITY3D.snapshot()}',city)
    for angle in [0,65]:
     if angle:pg.evaluate('a=>{const {camera,controls}=CITY3D,off=camera.position.clone().sub(controls.target);const x=off.x,z=off.z,t=a*Math.PI/180;off.x=x*Math.cos(t)+z*Math.sin(t);off.z=-x*Math.sin(t)+z*Math.cos(t);camera.position.copy(controls.target).add(off);controls.update();CITY3D.snapshot()}',angle)
     result=pg.evaluate(check);print(width,city,angle,result,flush=True)
     if city=='taipei' and angle==0:pg.screenshot(path=str(ROOT/f'out/scatter-verified-{width}.png'),timeout=240000)
    # Actual pointer selection must still open its original policy topic.
    el=pg.locator('.tlabel:not([hidden])').first;theme=el.get_attribute('data-theme');r=el.bounding_box()
    pg.mouse.click(r['x']+r['width']/2,r['y']+r['height']/2);pg.evaluate('CITY3D.snapshot()')
    assert pg.evaluate('APP.state.selTheme')==theme
    assert pg.locator('.policy-guides line').count()==0
    assert pg.locator('.callout').is_visible()
    pg.evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));MAP3D.panorama();CITY3D.snapshot()")
    assert pg.locator('.policy-guides line').count()==0
   assert not errors,errors
  b.close();print('PASS organic placement, no overlaps/clipping, rotation, stable idle cache, native policy selection and panorama cleanup',flush=True)
finally:server.shutdown();server.server_close();thread.join()
