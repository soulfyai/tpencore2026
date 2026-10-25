"""Verify the three regional previews and actual-model detail viewer in real WebGL."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
import json,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(SimpleHTTPRequestHandler):
 extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.html':'text/html; charset=utf-8'}
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  def newpage():
   page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce');page.set_default_timeout(180000)
   page.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
   page.add_init_script('window.requestAnimationFrame=()=>0;');return page
  def click(page,selector):
   e=page.locator(selector);e.wait_for(state='visible');r=e.bounding_box();page.mouse.click(r['x']+r['width']/2,r['y']+r['height']/2)
  def shot(page,name):page.screenshot(path=str(ROOT/f'out/{name}.png'),timeout=240000);print('SHOT',name,flush=True)
  page=newpage();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/model-study.html',wait_until='commit');page.wait_for_function("document.documentElement.dataset.ready==='true'",timeout=300000,polling=500)
  state=page.evaluate('MODEL_STUDY.snapshot()');print('MODEL STATS',state,flush=True);assert state['models']==7 and state['triangles']>1000
  shot(page,'model-aircraft-desktop')
  before=page.evaluate('MODEL_STUDY.controls.target.toArray()');page.locator('#detail').select_option('nose');assert before!=page.evaluate('MODEL_STUDY.controls.target.toArray()')
  click(page,'[data-angle=side]');page.evaluate('MODEL_STUDY.snapshot()');assert page.locator('[data-angle=side]').get_attribute('aria-pressed')=='true'
  click(page,'[data-model=car]');page.evaluate('MODEL_STUDY.snapshot()');shot(page,'model-car-desktop')
  page.locator('#detail').select_option('wheel');page.evaluate('MODEL_STUDY.snapshot()');shot(page,'model-wheel-desktop')
  click(page,'[data-model=bus]');assert page.evaluate('MODEL_STUDY.selected')=='bus'
  heights={}
  for id in ['adult','child','elder']:
   click(page,f'[data-model={id}]');heights[id]=page.evaluate('MODEL_STUDY.snapshot().bounds[1]')
  assert heights['child']<heights['adult']*.7 and heights['elder']<heights['adult']
  click(page,'[data-model=group]');page.evaluate('MODEL_STUDY.snapshot()');shot(page,'model-people-desktop')
  click(page,'#wireframe');assert page.evaluate('MODEL_STUDY.snapshot().wire');click(page,'#wireframe')
  click(page,'#base');assert not page.evaluate("MODEL_STUDY.scene.getObjectByName('review-base').visible");click(page,'#base')
  click(page,'#rotate');assert page.evaluate('MODEL_STUDY.controls.autoRotate');page.mouse.move(800,500);page.mouse.down();page.mouse.move(850,520,steps=4);page.mouse.up();assert not page.evaluate('MODEL_STUDY.controls.autoRotate')
  page.set_viewport_size({'width':400,'height':860});page.evaluate('window.dispatchEvent(new Event("resize"))');click(page,'[data-model=adult]');page.locator('#detail').select_option('face');page.evaluate('MODEL_STUDY.snapshot()');shot(page,'model-face-mobile');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not errors,errors;page.close();print('PASS actual model source, seven models, parts, relative scale, native camera/wireframe/base/rotation, desktop/mobile.',flush=True)
  for city,expected in [('newtaipei',9),('keelung',15),('taoyuan',14)]:
   page=newpage();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
   page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/regional-city.html?city={city}',wait_until='commit')
   try:page.wait_for_function("document.documentElement.dataset.ready==='true'",timeout=300000,polling=500)
   except Exception:print('ERRORS',city,errors,flush=True);raise
   stats=page.evaluate('REGIONAL_CITY.snapshot(undefined,false)');print('CITY STATS',stats,flush=True)
   assert stats['city']==city and stats['themes']==expected and stats['landmarks']>=5 and stats['trees']>500 and stats['lakes']>=3
   assert stats['cars']==26 and stats['people']>=60 and stats['planes']==2
   assert page.locator('#city-switch').input_value()==city
   assert page.evaluate('REGIONAL_CITY.themeMeta.every(t=>t.features.length>=3)')
   assert page.evaluate('!REGIONAL_CITY.scene.children.some(o=>o.isSprite)')
   assert page.evaluate('REGIONAL_CITY.airTraffic.planes.every(p=>p.g.position.y>Math.max(...REGIONAL_CITY.buildings.map(b=>b.height),...REGIONAL_CITY.landmarks.map(l=>l.height))+50)')
   shot(page,f'{city}-overview-desktop')
   for theme in page.evaluate('REGIONAL_CITY.themeMeta.map(t=>({id:t.id,count:t.theme.items.length}))'):
    page.evaluate('id=>REGIONAL_CITY.showPolicy(id,false)',theme['id']);assert page.locator('.policy-item').count()==theme['count'];assert page.locator('.source').count()>0
   page.keyboard.press('Escape');click(page,'#policy-list');assert page.locator('.list-row[data-theme]').count()==expected
   if city=='newtaipei':assert '任內政績' not in page.locator('#drawer-body').inner_text()
   focus=page.evaluate('REGIONAL_CITY.cityConfig.focus');click(page,f'[data-theme={focus}].list-row');assert page.locator('.policy-item').count()>0
   page.keyboard.press('Escape');before=page.evaluate('REGIONAL_CITY.cars[0].position.toArray()');click(page,'#toggle-motion');page.evaluate('REGIONAL_CITY.life.advance(2)');assert before!=page.evaluate('REGIONAL_CITY.cars[0].position.toArray()');click(page,'#toggle-motion')
   before=page.evaluate('REGIONAL_CITY.airTraffic.planes[0].g.position.toArray()');page.evaluate('REGIONAL_CITY.airTraffic.update(.1)');assert before!=page.evaluate('REGIONAL_CITY.airTraffic.planes[0].g.position.toArray()')
   page.set_viewport_size({'width':400,'height':860});page.evaluate('window.dispatchEvent(new Event("resize"))');page.wait_for_function('Math.abs(REGIONAL_CITY.camera.aspect-innerWidth/innerHeight)<.0001',polling=100);page.evaluate("REGIONAL_CITY.snapshot('childcare')");shot(page,f'{city}-policy-mobile');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   click(page,'#landmark-list');assert page.locator('.list-row[data-landmark]').count()==stats['landmarks'];page.keyboard.press('Escape')
   assert not errors,(city,errors);page.close();print('PASS',city,'policies/sources, architecture, forest, plane/car movement, native controls and desktop/mobile',flush=True)
  browser.close()
 subprocess.run(['git','diff','--exit-code','--','index.html','index3d.html','3d/','data/','prototypes/taipei-city.js','prototypes/taipei-city.html','prototypes/taipei-city-kit.js','prototypes/taipei-city-layout.js','prototypes/taipei-city-life.js','prototypes/taipei-city-nature.js'],cwd=ROOT,check=True)
 print('PASS production and approved Taipei preview unchanged.',flush=True)
finally:server.shutdown()
