"""Validate v0.5 geography, structural uniqueness, native UI and review screenshots."""
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
  page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/greater-taipei-v0.5.0.html?view=street&v=5',wait_until='commit')
  page.wait_for_function("document.querySelector('#stage')?.classList.contains('ready')||document.querySelector('.loading-status')?.textContent.startsWith('無法')",polling=250,timeout=360000)
  assert page.evaluate("document.querySelector('#stage').classList.contains('ready')"),errors
  assert not errors,errors
  stats=page.evaluate("[...APPROVED_ART.cities].map(([id,c])=>({id,models:c.streetDetails.records.length,sites:c.streetDetails.sites.length,trees:c.forestStats.planted,people:c.life.people.length,cars:c.life.cars.length,themes:c.themeMeta.length}))")
  print('STATS',json.dumps(stats),flush=True)
  print('AUDIT',page.evaluate("import('./v05-building-recipes.js').then(m=>{const a=m.architectureAudit();return {...a,entries:undefined}})"),flush=True)
  print('GEOGRAPHY',page.evaluate('GEO_WORLD.data.audit'),flush=True)
  audit=page.evaluate("import('./v05-building-recipes.js').then(m=>{const a=m.architectureAudit();return {...a,entries:undefined}})")
  assert audit['buildings']==audit['uniqueSilhouettes']==137
  assert audit['familyCount']>=30 and audit['maxNeighborSimilarity']<=.94
  assert sum(c['themes'] for c in stats)==26
  assert all(c['people']==89 and c['cars']==26 for c in stats)
  assert page.evaluate('GEO_WORLD.data.audit.roadComponents')==1
  assert page.evaluate('GEO_WORLD.data.audit.cityIntersectionArea')==0
  assert page.evaluate('GEO_WORLD.forestTrees')>1000
  assert page.evaluate("CITY3D.WORLD.cities.get('newtaipei').holes.length")>0
  assert page.evaluate("CITY3D.flags.sites.every(s=>s.group.parent===CITY3D.scene&&s.cloth.parent===s.group&&s.y>0)")
  assert page.evaluate("CITY3D.flags.sites.find(s=>s.city==='taipei').source")== '台北 101'
  assert page.evaluate("APP.cities.map(c=>c.city).join(',')")=='taipei,newtaipei'
  assert page.evaluate('APP.themes.reduce((n,t)=>n+t.items.length,0)')==118
  invalid=page.evaluate("[...APPROVED_ART.cities].flatMap(([id,c])=>c.streetDetails.records.filter(r=>r.bounds.min[0]<r.site.x-r.site.w/2-.02||r.bounds.max[0]>r.site.x+r.site.w/2+.02||r.bounds.min[2]<r.site.z-r.site.d/2-.02||r.bounds.max[2]>r.site.z+r.site.d/2+.02).map(r=>r.id))")
  assert not invalid,invalid
  from html.parser import HTMLParser
  class Styles(HTMLParser):
   def __init__(self):super().__init__();self.active=False;self.items=[]
   def handle_starttag(self,t,a):
    if t=='style':self.active=True;self.items.append('')
   def handle_endtag(self,t):
    if t=='style':self.active=False
   def handle_data(self,d):
    if self.active:self.items[-1]+=d
  old=Styles();old.feed((R/'index3d.html').read_text());new=Styles();new.feed((R/'prototypes/greater-taipei-v0.5.0.html').read_text());assert old.items==new.items
  print('PASS architecture, geography, policies, flags, parcel containment and unchanged native CSS',flush=True)
  if "--no-screenshots" in sys.argv:
   browser.close();server.shutdown();sys.exit(0)
  def shot(name):
   print('RENDER',name,flush=True)
   page.evaluate("CITY3D.ENV.setTimeMode('day');CITY3D.snapshot();CITY3D.snapshot();CITY3D.renderer.getContext().finish()")
   page.evaluate('()=>new Promise(r=>window.__nativeRAF(()=>window.__nativeRAF(r)))')
   cap=page.context.new_cdp_session(page).send('Page.captureScreenshot',{'format':'png','fromSurface':True,'captureBeyondViewport':False})
   (R/f'out/v05-{name}.png').write_bytes(base64.b64decode(cap['data']));print('SHOT',name,flush=True)
  shot('taipei-street-desktop')
  page.evaluate("MAP3D.home(); document.querySelector('.hi-intro').hidden=true")
  shot('default-desktop')
  page.set_viewport_size({'width':400,'height':860});page.evaluate("window.dispatchEvent(new Event('resize'));const f=APPROVED_ART.streetFrame('taipei');MAP3D.flyTo(f.target,f.pos)")
  page.evaluate("MAP3D.home(); document.querySelector('.hi-intro').hidden=true")
  shot('default-mobile')
  browser.close()
finally:server.shutdown()
