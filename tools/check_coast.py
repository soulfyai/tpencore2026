"""Capture tiny camera rotations with a frozen clock to compare coastal stability."""
import base64, json, os, sys
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
label=sys.argv[1] if len(sys.argv)>1 else 'after'
mobile='desktop' not in sys.argv
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  pg=b.new_page(viewport={'width':400 if mobile else 1400,'height':860},device_scale_factor=2 if mobile else 1,reduced_motion='reduce')
  pg.add_init_script("""window.requestAnimationFrame=cb=>{window.__sceneFrame=cb;return 0};const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,o){return orig.call(this,t,t.startsWith('webgl')?{...o,preserveDrawingBuffer:true}:o)}""")
  pg.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  pg.route('**/fonts.g*/**',lambda r:r.abort())
  pg.on('pageerror',lambda e:print('PAGE ERROR',e,flush=True))
  path='out/coast-before.html' if label=='before' else 'index3d.html'
  pg.goto(f'http://127.0.0.1:{server.server_port}/{path}',wait_until='commit')
  pg.wait_for_function("document.getElementById('stage')?.classList.contains('ready')",timeout=300000,polling=100)
  print('READY '+label,flush=True)
  for view in ['overview','city']:
   data=pg.evaluate("""view=>{const C=CITY3D;C.ENV.forced={minute:660,w:{code:1,cloud:20,wind:10,temp:27}};if(view==='city')MAP3D.enterCity('taipei');else MAP3D.panorama();C.snapshot();window.coastBase=C.camera.position.clone();return {distance:C.camera.position.distanceTo(C.controls.target),near:C.camera.near,far:C.camera.far,depthBits:C.renderer.getContext().getParameter(C.renderer.getContext().DEPTH_BITS),ratio:C.renderer.getPixelRatio()}}""",view)
   print(view,json.dumps(data),flush=True)
   for i in range(3):
    result=pg.evaluate("""i=>{const C=CITY3D;C.camera.position.copy(coastBase);const v=C.camera.position.clone().sub(C.controls.target);v.applyAxisAngle({x:0,y:1,z:0},i*.00015);C.camera.position.copy(C.controls.target).add(v);C.controls.update();C.snapshot();return C.renderer.domElement.toDataURL('image/png').split(',')[1]}""",i)
    (ROOT/f"out/coast-{label}-{'mobile' if mobile else 'desktop'}-{view}-{i}.png").write_bytes(base64.b64decode(result))
   pg.screenshot(path=str(ROOT/f"out/coast-{label}-{'mobile' if mobile else 'desktop'}-{view}.png"),timeout=240000)
  if label != 'before':
   result=pg.evaluate("""()=>{
    const C=CITY3D,gl=C.renderer.getContext(),sea=C.scene.getObjectByName('open-sea'),surf=C.scene.getObjectByName('coastal-surf');
    if(gl.getParameter(gl.STENCIL_BITS)<3)throw Error('Coast stencil unavailable');
    const layers=[];C.scene.traverse(o=>{if(['coast-shallows','coast-foam','coastal-surf'].includes(o.name))layers.push(o)});
    if(layers.length!==9)throw Error('Coast layers missing');
    if(layers.some(o=>!o.material.depthTest||o.material.depthWrite||!o.material.polygonOffset))throw Error('Coast depth settings');
    if(new Set(layers.map(o=>o.material.stencilWriteMask)).size!==3)throw Error('Coast masks collide');
    for(const city of ['taipei','newtaipei','keelung','taoyuan']){MAP3D.enterCity(city);C.snapshot();if(C.camera.near<.3||C.camera.near>=C.camera.position.distanceTo(C.controls.target)*.1)throw Error('City clipping');}
    MAP3D.focusTheme('tp-ai');C.snapshot();if(C.camera.near>.5)throw Error('Close inspection clipping');
    C.ENV.update(.1,1.5);
    if(sea.material.uniforms.uTime.value!==1.5||surf.material.uniforms.uTime.value!==1.5)throw Error('Wave animation stopped');
    C.ENV.forced.minute=1140;MAP3D.enterCity('taipei');C.snapshot();
    return {coastLayers:layers.length,near:C.camera.near,depthBits:gl.getParameter(gl.DEPTH_BITS),animated:true};
   }""")
   print('PASS',json.dumps(result),flush=True)
   pg.screenshot(path=str(ROOT/f"out/coast-after-{'mobile' if mobile else 'desktop'}-night.png"),timeout=240000)
  b.close()
finally:
 server.shutdown();server.server_close();thread.join()
