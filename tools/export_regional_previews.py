"""Freeze regional coastlines, policy blocks, landmark positions and the actual aircraft model for independent art review."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
import json,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(SimpleHTTPRequestHandler):
 extensions_map={**SimpleHTTPRequestHandler.extensions_map,".html":"text/html; charset=utf-8"}
 def log_message(self,*a):pass
s=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(ROOT)));Thread(target=s.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  pg=b.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce');pg.add_init_script('window.requestAnimationFrame=()=>0;')
  pg.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  pg.route('**/fonts.g*/**',lambda r:r.abort());pg.goto(f'http://127.0.0.1:{s.server_port}/index3d.html',wait_until='commit')
  pg.wait_for_function("document.getElementById('stage')?.classList.contains('ready')",timeout=300000,polling=250)
  result=pg.evaluate("""()=>{const {WORLD,islands}=CITY3D;const result={};for(const id of ['newtaipei','keelung','taoyuan']){const c=WORLD.cities.get(id),[cx,cz]=c.center,local=p=>[p[0]-cx,p[1]-cz];result[id]={city:APP.cityById.get(id),checkedAt:APP.D.meta.checkedAt,coast:c.coast.map(local),center:[0,0],sourceCenter:c.center,half:WORLD.blockHalfSize,cells:WORLD.blockCells.filter(b=>b.city===id).map(b=>({...b,c:local(b.c),poly:b.poly.map(local)})),roads:WORLD.roads.filter(r=>r.city===id).map(r=>({...r,a:local(r.a),b:local(r.b)})),themes:islands.filter(i=>i.city===id).map(i=>({id:i.id,x:i.c.x-cx,z:i.c.z-cz,zone:i.zone,rec:i.rec,cells:i.cells.map(c=>c.id),theme:i.t})),landmarks:LANDMARKS3D.filter(l=>l.city===id&&!l.fixed).map(l=>({id:l.id,name:l.name,x:l.isl.c.x+l.x-cx,z:l.isl.c.z+l.z-cz,top:l.top,scale:l.sc,r:l.r,nature:l.nature}))};}const plane=CITY3D.PEOPLE.planes.find(p=>p.kind==='shuttle').g.clone();plane.position.set(0,0,0);plane.rotation.set(0,0,0);plane.scale.setScalar(1);plane.visible=true;plane.updateMatrixWorld(true);result.aircraft=plane.toJSON();return result;}""")
  commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
  for id in ['newtaipei','keelung','taoyuan']:
   d=result[id];d['snapshotCommit']=commit
   (ROOT/f'prototypes/{id}-preview-data.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
   print(id,{k:len(d[k]) for k in ['cells','roads','themes','landmarks']},flush=True)
  aircraft={'sourceCommit':commit,'source':'3d/ships.js · SHIPS.make(plane)','object':result['aircraft']}
  (ROOT/'prototypes/aircraft-review-data.json').write_text(json.dumps(aircraft,separators=(',',':'))+'\n')
  print('Aircraft geometry snapshot exported',flush=True)
  b.close()
finally:s.shutdown()
