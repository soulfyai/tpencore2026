"""Render the urban skyline study and exercise native controls without altering existing city pages."""
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
  pg.on('pageerror',lambda e:errors.append(str(e)));pg.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  pg.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  pg.add_init_script('window.requestAnimationFrame=()=>0;')
  pg.goto(f'http://127.0.0.1:{server.server_port}/prototypes/skyline-study.html?view=waterfront',wait_until='commit')
  try:pg.wait_for_function("document.documentElement.dataset.ready==='true'",timeout=300000,polling=250)
  except Exception:print('ERRORS',errors,flush=True);raise
  assert pg.evaluate("SKYLINE.snapshot(undefined,false).view")=="waterfront"
  stats=pg.evaluate("SKYLINE.snapshot('overview')");print('STATS',stats,flush=True)
  assert stats['calls']<1200,stats
  assert stats['types']==20 and stats['quarters']==6 and stats['ponds']==4 and stats['maxFloors']==48 and stats['tallest']>160
  assert pg.evaluate('SKYLINE.art.treeSites.every(t=>Math.abs(t.x)<121&&Math.abs(t.z)<132.5&&Math.hypot(Math.max(0,Math.abs(t.x)-100),Math.max(0,Math.abs(t.z)-111.5))<21)')
  assert pg.evaluate('new Set(SKYLINE.specs.map(s=>s.height)).size>=9')
  assert pg.evaluate('SKYLINE.specs.some(s=>s.n<=10)&&SKYLINE.specs.filter(s=>s.n>=24).length>=7')
  for name in ['overview','towers','transition','waterfront']:
   click(f'[data-view={name}]');pg.evaluate('SKYLINE.snapshot()');assert pg.locator(f'[data-view={name}]').get_attribute('aria-pressed')=='true'
   pg.screenshot(path=str(ROOT/f'out/skyline-{name}-desktop.png'),timeout=240000);print('SHOT',name,flush=True)
  click('[data-light=sunset]');pg.evaluate("SKYLINE.snapshot('towers')");assert pg.evaluate('SKYLINE.snapshot(undefined,false).light')=='sunset'
  pg.screenshot(path=str(ROOT/'out/skyline-sunset-desktop.png'),timeout=240000)
  click('#catalogue');assert pg.locator('.row').count()==20
  click('[data-sample=slopedCrown]');pg.evaluate('SKYLINE.snapshot(undefined,false)');assert pg.locator('.spec').inner_text()=='48F'
  pg.keyboard.press('Escape');assert pg.locator('.drawer').is_hidden()
  click('#labels');pg.evaluate("SKYLINE.snapshot('overview')");assert pg.locator('.labels').is_visible()
  click('#labels');pg.evaluate('SKYLINE.snapshot(undefined,false)');assert pg.locator('.labels').is_hidden()
  # Model picking, not just menu navigation.
  point=pg.evaluate("()=>{SKYLINE.snapshot('waterfront',false);const s=SKYLINE.specs.find(s=>s.id==='cultureHall'),p=SKYLINE.controls.target.clone().set(s.x,8,s.z+13).project(SKYLINE.camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}}")
  pg.mouse.click(point['x'],point['y']);assert pg.locator('.drawer').is_visible();pg.keyboard.press('Escape')
  pg.evaluate("SKYLINE.snapshot('overview',false)");before=pg.evaluate('SKYLINE.camera.position.toArray()');pg.mouse.move(700,500);pg.mouse.down();pg.mouse.move(840,550,steps=10);pg.mouse.up();pg.evaluate('SKYLINE.snapshot(undefined,false)');assert before!=pg.evaluate('SKYLINE.camera.position.toArray()')
  before=pg.evaluate('SKYLINE.camera.position.toArray()');pg.mouse.wheel(0,-450);pg.evaluate('SKYLINE.snapshot(undefined,false)');assert before!=pg.evaluate('SKYLINE.camera.position.toArray()')
  pg.locator('#quality').select_option('standard');pg.evaluate('SKYLINE.snapshot(undefined,false)');assert not pg.evaluate('SKYLINE.ao.enabled')
  pg.set_viewport_size({'width':400,'height':860});pg.evaluate('window.dispatchEvent(new Event("resize"))');pg.wait_for_function('Math.abs(SKYLINE.camera.aspect-innerWidth/innerHeight)<.0001',polling=100);pg.evaluate("SKYLINE.setLight('day');SKYLINE.snapshot('overview')")
  assert pg.evaluate("()=>[[-119,0,-130],[119,0,-130],[-119,0,130],[119,0,130]].every(a=>{const p=SKYLINE.controls.target.clone().fromArray(a).project(SKYLINE.camera);return Math.abs(p.x)<.98&&Math.abs(p.y)<.8})")
  pg.screenshot(path=str(ROOT/'out/skyline-study-mobile.png'),timeout=240000);pg.evaluate("SKYLINE.snapshot('waterfront')");pg.screenshot(path=str(ROOT/'out/skyline-waterfront-mobile.png'),timeout=240000);assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth')
  click('#catalogue');assert pg.locator('.body').evaluate('e=>e.scrollHeight>e.clientHeight');click('[data-sample=artDeco]');assert '26F' in pg.locator('.spec').inner_text();pg.keyboard.press('Escape')
  pg.set_viewport_size({'width':320,'height':720});pg.evaluate('window.dispatchEvent(new Event("resize"))');pg.wait_for_function('Math.abs(SKYLINE.camera.aspect-innerWidth/innerHeight)<.0001',polling=100);pg.evaluate("SKYLINE.snapshot('overview',false)");assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert pg.evaluate('SKYLINE.scene.children.some(o=>o.material===SKYLINE.art.grass&&o.geometry.parameters.shapes.holes.length===4)')
  assert pg.evaluate('SKYLINE.district.ponds.every(p=>p.mesh.position.y<0&&p.points.length>60)')
  assert pg.evaluate('SKYLINE.picks.filter(p=>p.userData.sample==="courtyardQuarter").length===3')
  print('ERRORS',errors,flush=True);assert not errors
  b.close()
 subprocess.run(['git','diff','--exit-code','--','index.html','index3d.html','3d/','data/','prototypes/taipei-preview.js','prototypes/taipei-preview.html','prototypes/taipei-architecture.js','prototypes/street-art-kit.js','prototypes/street-test.html','prototypes/street-test.js'],cwd=ROOT,check=True)
 print('PASS 6 compound quarters, 4 organic lakes, varied urban massing, 48F, catalogue/picking, orbit/zoom, light/quality, desktop/mobile; production and prior studies unchanged',flush=True)
finally:server.shutdown()
