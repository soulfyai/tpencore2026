"""Render and exercise the isolated Taipei preview; verify production files remain unchanged."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
import json,hashlib,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce');errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  page.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  page.add_init_script('window.requestAnimationFrame=()=>0;')
  page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/taipei-preview.html',wait_until='commit')
  try:page.wait_for_function("document.documentElement.dataset.ready==='true'",timeout=300000,polling=250)
  except Exception:print('ERRORS',errors,flush=True);raise
  result=page.evaluate("TAIPEI_PREVIEW.snapshot('overview')");print('STATS',result,flush=True)
  assert result['themes']==17 and result['landmarks']==16 and result['buildings']>65 and result['trees']>100
  assert page.evaluate("TAIPEI_PREVIEW.data.city.city==='taipei'&&TAIPEI_PREVIEW.data.city.cityName==='台北市'")
  for name in ['overview','landmarks','childcare','garden']:
   page.locator(f'[data-view={name}]').click();page.evaluate('TAIPEI_PREVIEW.snapshot()')
   assert page.locator(f'[data-view={name}]').get_attribute('aria-pressed')=='true'
   page.screenshot(path=str(ROOT/f'out/taipei-preview-{name}-desktop.png'),timeout=240000);print('SHOT',name,flush=True)
  page.locator('[data-light=sunset]').click();page.evaluate("TAIPEI_PREVIEW.snapshot('landmarks')")
  page.screenshot(path=str(ROOT/'out/taipei-preview-sunset-desktop.png'),timeout=240000)
  assert page.evaluate('TAIPEI_PREVIEW.snapshot().light')=='sunset'
  page.locator('#quality').select_option('standard');assert page.evaluate('TAIPEI_PREVIEW.snapshot().quality')=='standard'
  page.locator('#policy-list').click();assert page.locator('.list-row[data-theme]').count()==17
  assert page.locator('#drawer-body').evaluate('(e)=>e.scrollHeight>e.clientHeight')
  page.locator('[data-theme=tp-childcare].list-row').click();page.evaluate('TAIPEI_PREVIEW.snapshot()')
  assert page.locator('.policy-item').count()==5 and page.locator('.source').count()>0
  assert page.locator('#drawer-title').inner_text()=='育兒托育'
  assert '8小時免費臨托券' in page.locator('#drawer-body').inner_text()
  assert all(a.startswith('https://') or a.startswith('http://') for a in page.locator('.source').evaluate_all('(es)=>es.map(e=>e.href)'))
  page.screenshot(path=str(ROOT/'out/taipei-preview-policy-desktop.png'),timeout=240000)
  page.mouse.click(430,450);assert page.locator('#drawer').is_hidden()
  page.locator('#landmark-list').click();assert page.locator('.list-row[data-landmark]').count()==16
  page.locator('[data-landmark=t101]').click();page.evaluate('TAIPEI_PREVIEW.snapshot()');assert '101' in page.locator('#drawer-title').inner_text()
  page.keyboard.press('Escape');assert page.locator('#drawer').is_hidden()
  page.locator('#toggle-labels').click();page.evaluate('TAIPEI_PREVIEW.snapshot()');assert page.locator('.labels').is_hidden()
  page.locator('#toggle-labels').click();page.evaluate("TAIPEI_PREVIEW.snapshot('overview')");assert page.locator('.labels').is_visible()
  # Visible policy buttons never overlap one another.
  rects=page.locator('.pin:visible').evaluate_all('(es)=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})')
  for i,a in enumerate(rects):
   for b in rects[i+1:]:assert not (a['x']<b['x']+b['w'] and a['x']+a['w']>b['x'] and a['y']<b['y']+b['h'] and a['y']+a['h']>b['y'])
  page.locator('.pin:visible').first.click();assert page.locator('#drawer').is_visible();page.keyboard.press('Escape')
  # Direct camera controls, not only scripted view changes.
  page.evaluate("TAIPEI_PREVIEW.snapshot('overview')")
  before=page.evaluate('TAIPEI_PREVIEW.camera.position.toArray()');page.mouse.move(730,500);page.mouse.down();page.mouse.move(900,550,steps=10);page.mouse.up();page.evaluate('TAIPEI_PREVIEW.snapshot()');assert before!=page.evaluate('TAIPEI_PREVIEW.camera.position.toArray()')
  before=page.evaluate('TAIPEI_PREVIEW.camera.position.toArray()');page.mouse.wheel(0,-500);page.evaluate('TAIPEI_PREVIEW.snapshot()');assert before!=page.evaluate('TAIPEI_PREVIEW.camera.position.toArray()')
  page.set_viewport_size({'width':400,'height':860});page.wait_for_function('Math.abs(TAIPEI_PREVIEW.camera.aspect-innerWidth/innerHeight)<.0001',polling=100);page.evaluate("TAIPEI_PREVIEW.setLight('day');TAIPEI_PREVIEW.snapshot('overview')")
  page.screenshot(path=str(ROOT/'out/taipei-preview-mobile.png'),timeout=240000)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.evaluate("()=>{const P=TAIPEI_PREVIEW;return P.data.coast.every(([x,z])=>{const p=P.controls.target.clone().set(x*8,0,z*8).project(P.camera);return Math.abs(p.x)<.98&&p.y<.8&&p.y>-.8})}")
  page.locator('#policy-list').click();page.locator('[data-theme=tp-housing].list-row').click();page.evaluate('TAIPEI_PREVIEW.snapshot()')
  assert page.locator('.policy-item').count()==6
  page.locator('#drawer-body').evaluate('e=>e.scrollTop=e.scrollHeight');assert page.locator('#drawer-body').evaluate('e=>e.scrollTop>0')
  page.screenshot(path=str(ROOT/'out/taipei-preview-policy-mobile.png'),timeout=240000)
  page.keyboard.press('Escape');page.set_viewport_size({'width':320,'height':720});page.wait_for_function('Math.abs(TAIPEI_PREVIEW.camera.aspect-innerWidth/innerHeight)<.0001',polling=100);page.evaluate("TAIPEI_PREVIEW.snapshot('overview')")
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  print('ERRORS',errors,flush=True);assert not errors
  print('PASS full Taipei, 17 policy groups, 16 landmarks, citations, native controls, labels, map dismissal, drawer scrolling, desktop and phone',flush=True)
  browser.close()
  subprocess.run(['git','diff','--exit-code','--','index.html','index3d.html','3d/','data/','prototypes/street-test.html','prototypes/street-test.js'],cwd=ROOT,check=True)
  print('PASS production city, policy data and approved street test unchanged',flush=True)
finally:server.shutdown()
