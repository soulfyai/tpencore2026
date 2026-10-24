"""Check real scene time modes, mobile integration, and desktop restoration."""
import sys
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.html':'text/html; charset=utf-8'}
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
thread=Thread(target=server.serve_forever,daemon=True);thread.start()
mobile=True
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  pg=b.new_page(viewport={'width':400 if mobile else 1400,'height':860},reduced_motion='reduce')
  pg.add_init_script("""window.requestAnimationFrame=cb=>{window.__sceneFrame=cb;return 0};""")
  pg.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  pg.route('**/fonts.g*/**',lambda r:r.abort())
  errors=[]
  pg.route('**/site-config.json',lambda r:r.fulfill(json={'musicUrl':'https://tpencore.tw/music/tpencoretheme.mp3','musicAutoplay':False,'counterUrl':'counter.php'}))
  pg.route('**/counter.php',lambda r:r.fulfill(json={'ok':True,'views':1234}))
  pg.on('pageerror',lambda e:errors.append(str(e)))
  pg.goto(f'http://127.0.0.1:{server.server_port}/index3d.html',wait_until='commit')
  pg.wait_for_function("document.getElementById('stage')?.classList.contains('ready')",timeout=300000,polling=100)
  pg.evaluate('CITY3D.snapshot()')
  assert pg.locator('.hi-intro').is_visible(), 'Initial help missing'
  pg.locator('.hi-intro .hi-x').click()
  pg.wait_for_function("document.querySelector('.hi-music')&&!document.querySelector('.hi-music').hidden",polling=100)
  toggle=pg.locator('.hi-tools-toggle')
  assert toggle.inner_text().strip()=='' and toggle.get_attribute('aria-label')=='地圖工具'
  toggle.click()
  result=pg.evaluate(r"""()=>{
    const buttons=[...document.querySelectorAll('.hi-tools-panel>button')];
    return buttons.map(b=>({text:b.innerText.replace(/\s+/g,' ').trim(),x:b.getBoundingClientRect().x,y:b.getBoundingClientRect().y,width:b.getBoundingClientRect().width}));
  }""")
  expected=['政策清單','政策進度','使用說明','全景','導覽','地標','音樂']
  assert len(result)==7 and all(name in item['text'] for name,item in zip(expected,result)),result
  assert max(r['x'] for r in result)-min(r['x'] for r in result)<1,result
  assert all(result[i]['y']<result[i+1]['y'] for i in range(6)),result
  assert pg.locator('.hi-clock-trigger').is_hidden()
  assert pg.locator('[data-time-mode]').count()==3
  assert pg.locator('[data-time-mode=live]').get_attribute('aria-pressed')=='true'
  pg.screenshot(path=str(ROOT/'out/time-modes-mobile.png'),timeout=240000)
  camera=pg.evaluate('CITY3D.camera.position.toArray()')
  for mode,minute in [('night',1320),('day',720),('live',None)]:
    pg.locator(f'[data-time-mode={mode}]').click()
    assert pg.locator('.hi-tools-panel').is_hidden()
    pg.evaluate('CITY3D.snapshot()')
    state=pg.evaluate('CITY3D.ENV.state')
    assert state['timeMode']==mode,state
    assert pg.evaluate('CITY3D.camera.position.toArray()')==camera
    if minute is not None:assert state['minute']==minute,state
    if mode=='night':
      assert state['night']>.9,state
      assert pg.evaluate('CITY3D.ENV.lampsOn')==1
      pg.screenshot(path=str(ROOT/'out/time-modes-mobile-night.png'),timeout=240000)
    elif mode=='day':
      assert state['night']==0,state
      assert pg.evaluate('CITY3D.ENV.lampsOn')==0
      pg.evaluate('CITY3D.ENV.setWeather({code:95,temp:20})')
      assert pg.evaluate('CITY3D.ENV.state.minute')==720
      assert pg.evaluate('CITY3D.ENV.state.night')==0
    else:
      actual=pg.evaluate("(()=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());return (+p.find(x=>x.type==='hour').value%24)*60 + +p.find(x=>x.type==='minute').value})()")
      assert abs(state['minute']-actual)<=1,state
    toggle.click()
  assert pg.evaluate('CITY3D.ENV.setTimeMode("invalid")')==False

  pg.locator('.hi-tools-panel [data-mode=list]').click()
  assert pg.locator('.hi-tools-panel').is_hidden()
  assert pg.evaluate("document.documentElement.classList.contains('drawer-open')")
  pg.evaluate("document.querySelector('[data-mode=pano]').click();CITY3D.snapshot()")
  toggle.click();pg.locator('.hi-tools-panel .hi-help').click()
  assert pg.locator('.hi-intro').is_visible() and pg.locator('.hi-tools-panel').is_hidden()
  pg.locator('.hi-intro .hi-x').click()
  pg.set_viewport_size({'width':1400,'height':860})
  pg.wait_for_function("document.querySelector('.hi-tools-panel>.hi-maptools .hi-tourbtn')&&document.querySelector('.hi-tools-panel>.hi-modes [data-mode=list]')",polling=100)
  pg.evaluate('CITY3D.snapshot()')
  assert toggle.is_hidden()
  assert pg.locator('.hi-maptools>.hi-music').is_visible()
  assert pg.locator('.hi-clock-trigger').is_visible()
  assert pg.locator('.hi-clock-options').is_hidden()
  pg.locator('.hi-clock-trigger').click()
  assert pg.locator('.hi-clock-options').is_visible()
  pg.screenshot(path=str(ROOT/'out/time-modes-desktop.png'),timeout=240000)
  pg.locator('[data-time-mode=night]').click()
  assert pg.locator('.hi-clock-options').is_hidden()
  assert '晚上' in pg.locator('.hi-clock-trigger').inner_text()
  pg.evaluate('CITY3D.snapshot()')
  pg.screenshot(path=str(ROOT/'out/time-modes-desktop-night.png'),timeout=240000)
  pg.locator('.hi-clock-trigger').click()
  pg.keyboard.press('Escape')
  assert pg.locator('.hi-clock-options').is_hidden()
  pg.locator('.hi-clock-trigger').click()
  pg.locator('[data-time-mode=live]').click()

  pg.set_viewport_size({'width':320,'height':720})
  pg.wait_for_function("document.querySelectorAll('.hi-tools-panel>button').length===7",polling=100)
  pg.evaluate('CITY3D.snapshot()');toggle.click()
  assert pg.locator('.hi-tools-panel>button').count()==7
  assert pg.evaluate("()=>{const r=document.querySelector('.hi-tools-panel').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}")
  pg.screenshot(path=str(ROOT/'out/time-modes-320.png'),timeout=240000)
  pg.locator('[data-time-mode=day]').click()
  assert pg.evaluate('CITY3D.ENV.state.minute')==720
  assert pg.locator('.hi-tools-panel').is_hidden()
  pg.reload(wait_until='commit')
  pg.wait_for_function("document.getElementById('stage')?.classList.contains('ready')",timeout=300000,polling=100)
  assert pg.evaluate('CITY3D.ENV.mode')=='live','Fresh visits must use actual time'
  assert not errors,errors
  print('PASS day/night/live native controls, lighting, camera preserved, weather independence, fresh default, mobile menu, Escape and responsive restoration',flush=True)
  b.close()
finally:
 server.shutdown();server.server_close();thread.join()
