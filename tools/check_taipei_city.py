"""Exercise the separate Taipei urban preview, its policy scenes and real moving instances."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
import subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(SimpleHTTPRequestHandler):
 extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.html':'text/html; charset=utf-8'}
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  pg=b.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce');pg.set_default_timeout(180000);errors=[]
  def click(selector):
   target=pg.locator(selector);target.wait_for(state='visible');r=target.bounding_box();pg.mouse.click(r['x']+r['width']/2,r['y']+r['height']/2)
  def shot(name):
   pg.screenshot(path=str(ROOT/f'out/taipei-city-{name}.png'),timeout=240000);print('SHOT',name,flush=True)
  pg.on('pageerror',lambda e:errors.append(str(e)));pg.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  pg.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  pg.add_init_script('window.requestAnimationFrame=()=>0;')
  pg.goto(f'http://127.0.0.1:{server.server_port}/prototypes/taipei-city.html',wait_until='commit')
  try:pg.wait_for_function("document.documentElement.dataset.ready==='true'",timeout=300000,polling=500)
  except Exception:print('ERRORS',errors,flush=True);raise
  stats=pg.evaluate('TAIPEI_CITY.snapshot(undefined,false)');print('STATS',stats,flush=True)
  assert stats['themes']==17 and stats['landmarks']==16 and stats['buildings']>=90 and stats['merged']>=20 and stats['lakes']==4
  assert stats['people']>=60 and stats['cars']>=16 and stats['calls']<1800
  assert not stats['motion'],'Reduced motion should pause startup movement'
  assert len({s['kind'] for s in stats['policyScenes']})>=12
  assert pg.evaluate('TAIPEI_CITY.themeMeta.every(t=>t.features.length>=3)')
  assert pg.evaluate('TAIPEI_CITY.scene.children.some(o=>o.material===TAIPEI_CITY.art.grass&&o.geometry.parameters.shapes.holes.length===4)')
  # Cars travel on retained asphalt edges, including rounded junctions, on the right-hand side.
  assert pg.evaluate('''()=>{const P=TAIPEI_CITY;function closest(p,parallel){let best={d:Infinity};for(const rd of P.plan.roads.filter(r=>!r.pedestrian&&(!parallel||r.horizontal===(Math.abs(parallel.x)>.999)))){const dx=rd.b[0]-rd.a[0],dz=rd.b[1]-rd.a[1],t=Math.max(0,Math.min(1,((p.x-rd.a[0])*dx+(p.z-rd.a[1])*dz)/(dx*dx+dz*dz))),x=rd.a[0]+t*dx,z=rd.a[1]+t*dz,d=Math.hypot(p.x-x,p.z-z);if(d<best.d)best={d,x,z};}return best;}return P.life.routes.filter(r=>r.kind==='drive').every(r=>{for(let i=0;i<64;i++){const p=r.curve.getPointAt(i/64),n=closest(p),t=r.curve.getTangentAt(i/64).multiplyScalar(r.direction);if(n.d>2.25)return false;if(Math.abs(t.x)>.999||Math.abs(t.z)>.999){const lane=closest(p,t);if(t.z*(p.x-lane.x)-t.x*(p.z-lane.z)<.2)return false;}}return true;});}''')
  # The actual instanced transforms change, not only a simulation counter.
  click('#toggle-motion');assert pg.evaluate('TAIPEI_CITY.life.enabled')
  before=pg.evaluate('TAIPEI_CITY.cars.map(c=>c.position.toArray())')
  transform=pg.evaluate('Array.from(TAIPEI_CITY.scene.children.find(o=>o.isInstancedMesh&&o.userData.keepDynamic).instanceMatrix.array).slice(0,16)')
  pg.evaluate('TAIPEI_CITY.life.advance(8)')
  after=pg.evaluate('TAIPEI_CITY.cars.map(c=>c.position.toArray())');assert before!=after
  assert transform!=pg.evaluate('Array.from(TAIPEI_CITY.scene.children.find(o=>o.isInstancedMesh&&o.userData.keepDynamic).instanceMatrix.array).slice(0,16)')
  assert pg.evaluate('TAIPEI_CITY.people.some(p=>p.route?.surface==="lake-path")')
  # Production frame hook advances from frame deltas; the test does not run an uncontrolled GPU loop.
  pg.evaluate('__taipeiCityFrame(50)');click('#toggle-motion')
  clock=pg.evaluate('TAIPEI_CITY.life.clock');pg.evaluate('TAIPEI_CITY.life.advance(3)');assert pg.evaluate('TAIPEI_CITY.life.clock')==clock
  shot('overview-desktop')
  for t in pg.evaluate('TAIPEI_CITY.themeMeta.map(t=>({id:t.id,count:t.theme.items.length}))'):
   pg.evaluate('(id)=>TAIPEI_CITY.showPolicy(id,false)',t['id']);assert pg.locator('.policy-item').count()==t['count'];assert pg.locator('.source').count()>0
   assert '建築示意' in pg.locator('#drawer-body').inner_text()
  pg.keyboard.press('Escape');click('#policy-list');assert pg.locator('.list-row[data-theme]').count()==17
  click('[data-theme=tp-childcare].list-row');assert '8小時免費臨托券' in pg.locator('#drawer-body').inner_text()
  assert pg.locator('#drawer-body').evaluate('e=>e.scrollHeight>e.clientHeight')
  assert all(u.startswith(('https://','http://')) for u in pg.locator('.source').evaluate_all('es=>es.map(e=>e.href)'))
  pg.evaluate('TAIPEI_CITY.snapshot()');shot('policy-desktop')
  pg.mouse.click(420,450);assert pg.locator('#drawer').is_hidden()
  # Real roof/wing picking uses each policy building, independent of DOM labels.
  point=pg.evaluate('''()=>{const P=TAIPEI_CITY;P.snapshot('childcare',false);const o=P.cityKit.picks.find(o=>o.userData.theme==='tp-childcare'),q=P.controls.target.clone().set(0,o.geometry.parameters.height/2-.2,0);o.localToWorld(q);q.project(P.camera);return {x:(q.x+1)*innerWidth/2,y:(1-q.y)*innerHeight/2};}''')
  pg.mouse.click(point['x'],point['y']);assert pg.locator('#drawer-title').inner_text()=='育兒托育';pg.keyboard.press('Escape')
  click('#landmark-list');assert pg.locator('.list-row[data-landmark]').count()==16;click('[data-landmark=t101]');assert '101' in pg.locator('#drawer-title').inner_text();pg.keyboard.press('Escape')
  pg.evaluate("TAIPEI_CITY.snapshot('overview',false)");click('#toggle-labels');assert pg.locator('.labels').is_hidden();click('#toggle-labels');pg.evaluate('TAIPEI_CITY.snapshot(undefined,false)')
  rects=pg.locator('.pin:visible').evaluate_all('es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})')
  for i,a in enumerate(rects):
   for c in rects[i+1:]:assert not(a['x']<c['x']+c['w'] and a['x']+a['w']>c['x'] and a['y']<c['y']+c['h'] and a['y']+a['h']>c['y'])
  before=pg.evaluate('TAIPEI_CITY.camera.position.toArray()');pg.mouse.move(700,500);pg.mouse.down();pg.mouse.move(840,550,steps=10);pg.mouse.up();pg.evaluate('TAIPEI_CITY.snapshot(undefined,false)');assert before!=pg.evaluate('TAIPEI_CITY.camera.position.toArray()')
  before=pg.evaluate('TAIPEI_CITY.camera.position.toArray()');pg.mouse.wheel(0,-400);pg.evaluate('TAIPEI_CITY.snapshot(undefined,false)');assert before!=pg.evaluate('TAIPEI_CITY.camera.position.toArray()')
  click('[data-view=garden]');click('[data-light=sunset]');pg.evaluate('TAIPEI_CITY.snapshot()');shot('garden-desktop')
  assert pg.evaluate('TAIPEI_CITY.snapshot(undefined,false).light')=='sunset'
  pg.locator('#quality').select_option('standard');assert not pg.evaluate('TAIPEI_CITY.ao.enabled');pg.locator('#quality').select_option('high');assert pg.evaluate('TAIPEI_CITY.ao.enabled')
  pg.set_viewport_size({'width':400,'height':860});pg.evaluate('window.dispatchEvent(new Event("resize"))');pg.wait_for_function('Math.abs(TAIPEI_CITY.camera.aspect-innerWidth/innerHeight)<.0001',polling=100)
  click('[data-light=day]');pg.evaluate("TAIPEI_CITY.snapshot('overview')");shot('overview-mobile')
  assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert pg.evaluate("TAIPEI_CITY.plan.coast.every(([x,z])=>{const p=TAIPEI_CITY.controls.target.clone().set(x,0,z).project(TAIPEI_CITY.camera);return Math.abs(p.x)<.98&&Math.abs(p.y)<.8})")
  click('[data-view=childcare]');pg.evaluate('TAIPEI_CITY.snapshot()');shot('childcare-mobile')
  click('#policy-list');click('[data-theme=tp-housing].list-row');assert pg.locator('.policy-item').count()==6
  pg.locator('#drawer-body').evaluate('e=>e.scrollTop=e.scrollHeight');assert pg.locator('#drawer-body').evaluate('e=>e.scrollTop>0');pg.keyboard.press('Escape')
  pg.set_viewport_size({'width':320,'height':720});pg.evaluate('window.dispatchEvent(new Event("resize"))');pg.wait_for_function('Math.abs(TAIPEI_CITY.camera.aspect-innerWidth/innerHeight)<.0001',polling=100);pg.evaluate("TAIPEI_CITY.snapshot('overview',false)");assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth')
  print('ERRORS',errors,flush=True);assert not errors;b.close()
 subprocess.run(['git','diff','--exit-code','--','index.html','index3d.html','3d/','data/','prototypes/taipei-preview.html','prototypes/taipei-preview.js','prototypes/skyline-study.html','prototypes/skyline-study.js','prototypes/organic-district.js','prototypes/urban-buildings.js','prototypes/street-art-kit.js'],cwd=ROOT,check=True)
 print('PASS actual Taipei: 17 policy scenes and citations, merged blocks, lakes, moving instances/right-hand traffic/pause, controls, desktop/mobile; production and approved studies unchanged.',flush=True)
finally:server.shutdown()
