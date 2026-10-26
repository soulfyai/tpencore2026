"""Verify grouped topics and enlarged policy campuses in the actual WebGL scene."""
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
  page=browser.new_page(viewport={'width':1000,'height':760},reduced_motion='reduce');page.set_default_timeout(240000);errors=[]
  page.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',str(e),flush=True)))
  page.on('console',lambda m:print('CONSOLE',m.text[:400],flush=True) if m.type=='error' else None)
  page.add_init_script('window.__nativeRAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==="loop"?0:window.__nativeRAF(cb);')
  page.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(R/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  page.route('**/fonts.googleapis.com/**',lambda r:r.fulfill(body='',content_type='text/css'))
  page.route('**/*config.json',lambda r:r.fulfill(json={'counterEnabled':False,'musicAutoplay':False}))
  page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/greater-taipei-v0.4.4.html?v=1',wait_until='commit')
  page.wait_for_function("document.querySelector('#stage')?.classList.contains('ready')||document.querySelector('.loading-status')?.textContent.startsWith('無法')",polling=250,timeout=360000)
  assert page.evaluate("document.querySelector('#stage').classList.contains('ready')"),errors
  assert not errors,errors
  page.evaluate("const i=document.querySelector('.hi-intro');if(!i.hidden)i.querySelector('.hi-x').click()")
  stats=page.evaluate("[...APPROVED_ART.cities].map(([id,c])=>({id,policies:c.themeMeta.length,buildings:c.buildings.length,ordinary:c.streetDetails.records.filter(r=>r.kind==='varied-street').length,amenities:c.streetDetails.records.filter(r=>r.kind==='policy-amenity').length,trees:c.forestStats.planted,people:c.life.people.length,cars:c.life.cars.length,audit:c.plan.districtAudit}))")
  print('STATS',json.dumps(stats),flush=True)
  assert sum(c['policies']for c in stats)==21
  assert page.evaluate('APP.themes.reduce((n,t)=>n+t.items.length,0)')==118
  print('THEMES',page.evaluate("APP.themes.filter(t=>t.city==='taipei').map(t=>[t.id,t.name,t.items.length])"),flush=True)
  page.evaluate("APP.openTheme('tp-transport')")
  assert '政策與承諾' in page.locator('#pbody').text_content()
  assert '任內戰績' in page.locator('#pbody').text_content()
  page.evaluate("APP.openItem('tp-rec-transport-4')")
  assert 'YouBike' in page.locator('#pbody').text_content()
  assert '已實施' in page.locator('#pbody').text_content()
  page.evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));document.querySelector('.hi-close').click();MAP3D.home()")
  invalid=page.evaluate("[...APPROVED_ART.cities].flatMap(([id,c])=>c.plan.parcels.filter(p=>p.kind==='policy').filter(p=>{const b=p.actualBounds;return b.min[0]<p.x-p.usableW/2-.02||b.max[0]>p.x+p.usableW/2+.02||b.min[2]<p.z-p.usableD/2-.02||b.max[2]>p.z+p.usableD/2+.02}).map(p=>p.id))")
  assert not invalid,invalid
  bad_amenities=page.evaluate("[...APPROVED_ART.cities].flatMap(([id,c])=>c.streetDetails.records.filter(r=>r.kind==='policy-amenity').filter(r=>!APP.themeById.has(r.theme)||r.bounds.min[0]<r.site.x-r.site.w/2-.02||r.bounds.max[0]>r.site.x+r.site.w/2+.02||r.bounds.min[2]<r.site.z-r.site.d/2-.02||r.bounds.max[2]>r.site.z+r.site.d/2+.02).map(r=>r.id))")
  assert not bad_amenities,bad_amenities
  assert page.evaluate("APP.themes.filter(t=>t.city==='taipei').flatMap(t=>t.items).filter(i=>i.contentKind==='record').every(i=>APP.themeById.has(i.theme)&&APP.items.has(i.id))")
  print('PASS grouped records remain clickable with sources/status; all main campuses fit sites',flush=True)
  if "--no-screenshots" in sys.argv:
   browser.close();server.shutdown();sys.exit(0)
  def shot(name):
   print('RENDER',name,flush=True)
   page.evaluate("CITY3D.ENV.setTimeMode('day');CITY3D.snapshot();CITY3D.snapshot();CITY3D.renderer.getContext().finish()")
   page.evaluate('()=>new Promise(r=>window.__nativeRAF(()=>window.__nativeRAF(r)))')
   cap=page.context.new_cdp_session(page).send('Page.captureScreenshot',{'format':'png','fromSurface':True,'captureBeyondViewport':False})
   (R/f'out/v044-{name}.png').write_bytes(base64.b64decode(cap['data']));print('SHOT',name,flush=True)
  shot('taipei-default-desktop')
  page.set_viewport_size({'width':400,'height':860});page.evaluate("window.dispatchEvent(new Event('resize'));MAP3D.home()")
  shot('taipei-default-mobile')
  assert page.evaluate('innerWidth')==400
  assert page.evaluate("document.querySelector('.hi-brandbtn').getBoundingClientRect().width")>200
  assert not errors,errors
  print('PASS grouped policy districts with unchanged native interface and desktop/mobile rendering.',flush=True)
  browser.close()
finally:server.shutdown()
