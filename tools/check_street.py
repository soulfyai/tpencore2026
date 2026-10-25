"""Render the standalone street study and verify native controls/picking at desktop and phone sizes."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
import json,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  pg=b.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1,reduced_motion='reduce');errors=[]
  pg.on('pageerror',lambda e:errors.append(str(e)))
  pg.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  pg.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  pg.add_init_script('window.requestAnimationFrame=()=>0;')
  pg.goto(f'http://127.0.0.1:{server.server_port}/prototypes/street-test.html',wait_until='commit')
  pg.wait_for_function("document.documentElement.dataset.ready==='true'",timeout=300000,polling=250)
  print('STATS',pg.evaluate("STREET.snapshot('overview')"),flush=True)
  for name in ['overview','street','garden']:
   pg.evaluate('(name)=>STREET.snapshot(name)',name)
   pg.screenshot(path=str(ROOT/f'out/street-{name}-desktop.png'),timeout=240000)
   print('SHOT',name,flush=True)
  pg.locator('[data-light=sunset]').click();assert pg.locator('[data-light=sunset]').get_attribute('aria-pressed')=='true'
  pg.evaluate("STREET.snapshot('street')")
  pg.screenshot(path=str(ROOT/'out/street-sunset-desktop.png'),timeout=240000)
  pg.locator('#quality').select_option('standard');pg.evaluate('STREET.snapshot()')
  assert pg.evaluate('STREET.renderer.getPixelRatio()')<=1.25
  # Actual native view buttons, then free drag and zoom.
  for name in ['overview','garden','street']:
   pg.locator(f'[data-view={name}]').click()
   assert pg.evaluate('STREET.snapshot().view')==name
  before=pg.evaluate('STREET.camera.position.toArray()');pg.mouse.move(750,400);pg.mouse.down();pg.mouse.move(900,450,steps=10);pg.mouse.up();pg.evaluate('STREET.snapshot()');after=pg.evaluate('STREET.camera.position.toArray()');assert before!=after
  before=pg.evaluate('STREET.camera.position.toArray()');pg.mouse.wheel(0,-400);pg.evaluate('STREET.snapshot()');assert before!=pg.evaluate('STREET.camera.position.toArray()')
  # Validate player native picking and dismissal with projected mesh centre.
  pt=pg.evaluate("()=>{STREET.snapshot('street');const p=STREET.player.position.clone();p.y+=1.6;p.project(STREET.camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}}")
  pg.mouse.click(pt['x'],pt['y']);assert pg.locator('#toast').is_visible();pg.keyboard.press('Escape');assert pg.locator('#toast').is_hidden()
  pg.set_viewport_size({'width':400,'height':860});pg.evaluate("STREET.setLight('day');STREET.snapshot('street')")
  pg.screenshot(path=str(ROOT/'out/street-test-mobile.png'),timeout=240000)
  assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth')
  pg.set_viewport_size({'width':320,'height':720});pg.evaluate("STREET.snapshot('overview')")
  assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth')
  print('ERRORS',errors,flush=True);assert not errors
  print('PASS three views, daylight, sunset, quality, native orbit/zoom, character pick, dismiss, responsive and real WebGL',flush=True)
  b.close()
finally:server.shutdown()
