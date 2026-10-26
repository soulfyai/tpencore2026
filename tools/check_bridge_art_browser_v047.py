"""Check actual transport models, routes, bridge connections and preserved preview."""
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
 with sync_playwright()as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  page=browser.new_page(viewport={'width':392,'height':697},is_mobile=True,has_touch=True,reduced_motion='reduce');errors=[];page.set_default_timeout(300000)
  page.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',str(e),flush=True)))
  page.add_init_script('window.__nativeRAF=requestAnimationFrame.bind(window);requestAnimationFrame=cb=>cb.name==="loop"?0:__nativeRAF(cb);')
  page.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(R/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  page.route('**/fonts.googleapis.com/**',lambda r:r.fulfill(body='',content_type='text/css'))
  page.route('**/*config.json',lambda r:r.fulfill(json={'counterEnabled':False,'musicAutoplay':False}))
  page.goto(f'http://127.0.0.1:{server.server_port}/prototypes/greater-taipei-v0.4.7.html?view=joint-danjiang-taipei&v=1',wait_until='commit')
  page.wait_for_function("document.querySelector('#stage')?.classList.contains('ready')||document.querySelector('.loading-status')?.textContent.startsWith('無法')",polling=500,timeout=420000)
  assert page.evaluate("document.querySelector('#stage').classList.contains('ready')"),errors
  assert not errors,errors
  page.evaluate("const i=document.querySelector('.hi-intro');if(!i.hidden)i.querySelector('.hi-x').click()")
  page.evaluate("async()=>{window.__testTransportPlan=await fetch('./v046-transport-plan.json').then(r=>r.json())}")
  stats=page.evaluate("(()=>{const n=APPROVED_ART.transport;return {bridges:n.bridges.map(b=>({id:b.id,name:b.name,kind:b.kind,length:b.length,top:b.top})),boats:n.vessels.length+APPROVED_ART.boats.length,planes:n.planes.length,cars:n.cars.length,coasts:[...APPROVED_ART.cities].map(([id,c])=>({id,trees:c.forestStats.planted,infill:c.infill.buildings,flags:c.flag.userData.width,oldAircraft:!!c.airTraffic})),labels:LANDMARKS3D.map(v=>v.name).filter(v=>/關渡大橋|淡江大橋/.test(v)),items:APP.themes.reduce((n,t)=>n+t.items.length,0)}})()")
  print('STATS',json.dumps(stats,ensure_ascii=False),flush=True)
  assert page.evaluate("(()=>{const p=window.__testTransportPlan.seaObstacles,a=CITY3D.ENV.seaObstacles;return p.length===a.length&&p.every((o,i)=>Math.hypot(o.x-a[i].x,o.z-a[i].z)<1e-5&&Math.abs(o.radius-a[i].radius)<1e-5);})()")
  print('JOINT_FRAME',page.evaluate("({distance:CITY3D.camera.position.distanceTo(CITY3D.controls.target),target:CITY3D.controls.target.toArray(),expected:APPROVED_ART.transport.jointFrame(CITY3D.camera,'danjiang-taipei').target.toArray()})"),flush=True)
  assert page.evaluate("CITY3D.camera.position.distanceTo(CITY3D.controls.target)<30")
  assert len(stats['bridges'])==2 and set(b['kind']for b in stats['bridges'])=={'red-arch','single-pylon'}
  assert stats['boats']==24 and stats['planes']==8 and stats['cars']==16 and stats['items']==118
  assert len(stats['labels'])==2
  assert all(c['trees']>900 and c['infill']>=8 and c['flags']==12.6 and not c['oldAircraft'] for c in stats['coasts'])
  assert page.evaluate("APPROVED_ART.transport.planes.every(p=>p.height-p.ceiling>=2.59)")
  assert page.evaluate("(()=>{const n=APPROVED_ART.transport,positions=()=>[...n.vessels,...n.planes].flatMap(v=>v.root.position.toArray());const before=positions(),clock=n.clock;n.update(.1,5,false);if(n.clock!==clock||positions().some((v,i)=>v!==before[i]))return false;n.update(.1,5,true);return n.clock>clock&&positions().some((v,i)=>Math.abs(v-before[i])>1e-5);})()")
  # Every bridge is attached to a real node of each retained road graph.
  assert page.evaluate("APPROVED_ART.transport.bridges.every(b=>['taipei','newtaipei'].every((city,j)=>{const c=APPROVED_ART.cities.get(city),p=j?b.b:b.a;return c.plan.roads.some(r=>[r.a,r.b].some(q=>Math.hypot(q[0]/14+c.root.position.x-p[0],q[1]/14+c.root.position.z-p[1])<1e-5));}))")
  assert page.evaluate("APPROVED_ART.transport.bridges.every(b=>b.artFinish.landings.length===2&&b.artFinish.terminals.length===4&&b.piers.every(f=>f>.15&&f<.85))")
  assert page.evaluate("APPROVED_ART.transport.cars.every(c=>Math.abs(c.groundOffset)<.01)")
  # Actual campus buildings must not overlap either bridge's paved approaches.
  collisions=page.evaluate("(()=>{const bad=[];for(const b of APPROVED_ART.transport.bridges)for(let k=0;k<=200;k++){const f=k/200,x=b.a[0]+(b.b[0]-b.a[0])*f,z=b.a[1]+(b.b[1]-b.a[1])*f;for(const [id,c]of APPROVED_ART.cities)for(const p of c.plan.parcels.filter(p=>p.kind==='policy')){const a=p.actualBounds;if(x>a.min[0]/14+c.root.position.x-.17&&x<a.max[0]/14+c.root.position.x+.17&&z>a.min[2]/14+c.root.position.z-.17&&z<a.max[2]/14+c.root.position.z+.17)bad.push([b.id,p.id]);}}return bad;})()")
  assert not collisions,collisions
  assert not errors,errors
  print('PASS actual bridges/road endpoints/campuses;24boats;8safe flights;pause/resume;retained art/flags/content',flush=True)
  if '--no-screenshots' not in sys.argv:
   def shot(name):
    print('RENDER',name,flush=True)
    page.evaluate("CITY3D.ENV.setTimeMode('day');CITY3D.snapshot();CITY3D.renderer.getContext().finish()")
    page.evaluate('()=>new Promise(r=>__nativeRAF(()=>__nativeRAF(r)))')
    cap=page.context.new_cdp_session(page).send('Page.captureScreenshot',{'format':'png','fromSurface':True,'captureBeyondViewport':False})
    (R/f'out/v047-{name}.png').write_bytes(base64.b64decode(cap['data']));print('SHOT',name,flush=True)
   shots=[('danjiang-taipei','shore',392,697),('guandu-newtaipei','top',392,697),('danjiang-newtaipei','city',900,700),('guandu-taipei','shore',900,700)]
   for id,angle,w,h in shots:
    page.set_viewport_size({'width':w,'height':h})
    page.evaluate("([id,angle])=>{window.dispatchEvent(new Event('resize'));MAP3D.panorama();const f=APPROVED_ART.transport.jointFrame(CITY3D.camera,id,angle);CITY3D.camera.position.copy(f.pos);CITY3D.controls.target.copy(f.target);CITY3D.controls.update()}",[id,angle])
    shot(id+'-'+angle)
   assert page.evaluate("document.querySelector('.hi-brandbtn').getBoundingClientRect().width")>200
  assert not errors,errors
  browser.close()
finally:server.shutdown()
