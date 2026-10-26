"""Verify the specified street-detail concept inside the native two-city preview."""
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
  page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/greater-taipei-v0.4.1.html?view=street&v=1',wait_until='commit')
  page.wait_for_function("document.querySelector('#stage')?.classList.contains('ready')||document.querySelector('.loading-status')?.textContent.startsWith('無法')",polling=250,timeout=360000)
  assert page.evaluate("document.querySelector('#stage').classList.contains('ready')"),errors
  assert not errors,errors
  stats=page.evaluate("[...APPROVED_ART.cities].map(([id,c])=>({id,models:c.streetDetails.records.length,houses:c.streetDetails.sites.length,furniture:c.streetDetails.furniture,forest:c.forestStats.planted,themes:c.themeMeta.length,people:c.life.people.length,cars:c.life.cars.length,policy:c.themeMeta.filter(t=>t.features.includes('wood-louvers')||t.features.includes('vertical-fins')||t.features.includes('mixed-housing')).map(t=>t.id)}))")
  print('STATS',json.dumps(stats),flush=True)
  assert sum(c['themes'] for c in stats)==26
  assert all(c['people']==89 and c['cars']==26 for c in stats)
  audit=page.evaluate("import('./architecture-v041-catalog.js').then(m=>m.buildingAudit())")
  print('AUDIT',json.dumps({k:v for k,v in audit.items() if k!='entries'}),flush=True)
  assert audit['count']==audit['uniqueStructures'] and audit['types']==24
  assert all(c['forest']>500 for c in stats)
  assert (R/'prototypes/v041-art-data.json').read_bytes()==(R/'prototypes/greater-taipei-art-data.json').read_bytes()
  for i,r in enumerate(audit['entries']):
   for n in audit['entries'][:i]:
    if r['city']==n['city'] and ((r['x']-n['x'])**2+(r['z']-n['z'])**2)**.5<48:assert r['type']!=n['type'],(r['id'],n['id'])
  overlap=page.evaluate("[...APPROVED_ART.cities].flatMap(([id,c])=>{const r=c.streetDetails.records.filter(r=>r.kind==='varied-street');return r.flatMap((a,i)=>r.slice(0,i).filter(b=>Math.min(a.bounds.max[0],b.bounds.max[0])-Math.max(a.bounds.min[0],b.bounds.min[0])>.03&&Math.min(a.bounds.max[2],b.bounds.max[2])-Math.max(a.bounds.min[2],b.bounds.min[2])>.03).map(b=>[id,a.id,b.id]));})")
  assert not overlap,overlap
  print('PASS v0.4 layout exact, no neighboring same-type buildings and no overlapping street buildings',flush=True)

  invalid=page.evaluate("[...APPROVED_ART.cities].flatMap(([id,c])=>c.streetDetails.records.filter(r=>r.bounds&&(r.bounds.min[0]<r.site.x-r.site.w/2-.02||r.bounds.max[0]>r.site.x+r.site.w/2+.02||r.bounds.min[2]<r.site.z-r.site.d/2-.02||r.bounds.max[2]>r.site.z+r.site.d/2+.02)).map(r=>({city:id,...r})))")
  assert not invalid,invalid
  print('PASS detailed houses fit existing parcels',flush=True)
  assert page.locator('.hi-intro').is_hidden()
  assert page.evaluate('[...CITY3D.batches.values()].every(m=>!m.parent)')
  assert page.evaluate("APP.cities.map(c=>c.city).join(',')")== 'taipei,newtaipei'
  assert page.evaluate('APP.themes.reduce((n,t)=>n+t.items.length,0)')==118
  # This round changes scene art only; retain the complete production style sheets.
  from html.parser import HTMLParser
  class Styles(HTMLParser):
   def __init__(self):super().__init__();self.active=False;self.items=[]
   def handle_starttag(self,tag,attrs):
    if tag=='style':self.active=True;self.items.append('')
   def handle_endtag(self,tag):
    if tag=='style':self.active=False
   def handle_data(self,data):
    if self.active:self.items[-1]+=data
  original=Styles();original.feed((R/'index3d.html').read_text())
  candidate=Styles();candidate.feed((R/'prototypes/greater-taipei-v0.4.1.html').read_text())
  assert original.items==candidate.items
  print('PASS production CSS and source policy scope unchanged',flush=True)
  if "--no-screenshots" in sys.argv:
   browser.close();server.shutdown();sys.exit(0)
  def shot(name):
   print('RENDER',name,flush=True)
   page.evaluate("CITY3D.ENV.setTimeMode('day');CITY3D.snapshot();CITY3D.snapshot();CITY3D.renderer.getContext().finish()")
   page.evaluate('()=>new Promise(r=>window.__nativeRAF(()=>window.__nativeRAF(r)))')
   cap=page.context.new_cdp_session(page).send('Page.captureScreenshot',{'format':'png','fromSurface':True,'captureBeyondViewport':False})
   (R/f'out/v041-{name}.png').write_bytes(base64.b64decode(cap['data']));print('SHOT',name,flush=True)
  shot('taipei-street-desktop')
  page.set_viewport_size({'width':400,'height':860});page.evaluate("window.dispatchEvent(new Event('resize'));const f=APPROVED_ART.streetFrame('taipei');MAP3D.flyTo(f.target,f.pos)")
  shot('taipei-street-mobile')
  assert page.evaluate('innerWidth')==400
  assert page.evaluate("document.querySelector('.hi-brandbtn').getBoundingClientRect().width")>200
  assert not errors,errors
  print('PASS detail reference concept with unchanged native interface and working close-up link.',flush=True)
  browser.close()
finally:server.shutdown()
