"""Freeze the current Taipei coastline, blocks, policy content and landmark positions for independent art review."""
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
  d=pg.evaluate('''()=>{const {WORLD,islands}=CITY3D,c=WORLD.cities.get('taipei');return {city:APP.cityById.get('taipei'),checkedAt:APP.D.meta.checkedAt,coast:c.coast,center:c.center,half:WORLD.blockHalfSize,cells:WORLD.blockCells.filter(b=>b.city==='taipei'),roads:WORLD.roads.filter(r=>r.city==='taipei'),themes:islands.filter(i=>i.city==='taipei').map(i=>({id:i.id,x:i.c.x,z:i.c.z,zone:i.zone,rec:i.rec,cells:i.cells.map(c=>c.id),theme:i.t})),landmarks:LANDMARKS3D.filter(l=>l.city==='taipei'&&!l.fixed).map(l=>({id:l.id,name:l.name,x:l.isl.c.x+l.x,z:l.isl.c.z+l.z,top:l.top,scale:l.sc,r:l.r,nature:l.nature}))}}''')
  d['snapshotCommit']=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
  (ROOT/'prototypes/taipei-preview-data.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
  print({k:len(d[k]) for k in ['coast','cells','roads','themes','landmarks']},flush=True)
  print('bounds',min(x[0] for x in d['coast']),max(x[0] for x in d['coast']),min(x[1] for x in d['coast']),max(x[1] for x in d['coast']),'half',d['half'],flush=True)
  b.close()
finally:s.shutdown()
