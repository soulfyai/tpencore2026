"""Real pointer dismissal and native audio playback with a local audio fixture."""
import io, json, os, sys, wave
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
mobile='mobile' in sys.argv
sound=io.BytesIO()
with wave.open(sound,'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(8000);w.writeframes(b'\0\0'*8000)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
  pg=b.new_page(viewport={'width':400 if mobile else 1400,'height':860},reduced_motion='reduce')
  pg.add_init_script("""window.requestAnimationFrame=cb=>{window.__sceneFrame=cb;return 0};const Orig=window.Audio;window.Audio=class extends Orig{constructor(...a){super(...a);window.testAudio=this}};""")
  pg.route('**/three@0.160.0/**',lambda r:r.fulfill(path=str(ROOT/'node_modules/three'/r.request.url.split('three@0.160.0/')[1]),content_type='application/javascript'))
  pg.route('**/fonts.g*/**',lambda r:r.abort())
  pg.route('**/site-config.json',lambda r:r.fulfill(json={'musicUrl':'https://tpencore.tw/music/tpencoretheme.mp3','musicAutoplay':False}))
  requests=[];errors=[]
  def audio_route(r):
    requests.append(r.request.url);r.fulfill(body=sound.getvalue(),content_type='audio/wav')
  pg.route('https://tpencore.tw/music/tpencoretheme.mp3',audio_route)
  pg.on('pageerror',lambda e:errors.append(str(e)))
  pg.goto(f'http://127.0.0.1:{server.server_port}/index3d.html',wait_until='commit')
  pg.wait_for_function("document.getElementById('stage')?.classList.contains('ready')",timeout=300000,polling=100)
  pg.wait_for_function("!document.querySelector('.hi-music')?.hidden",polling=100)
  pg.evaluate("CITY3D.snapshot();document.querySelector('.hi-intro .hi-x').click()")
  assert not requests,'Audio loaded before user intent'
  if mobile: pg.locator('.hi-tools-toggle').click()
  pg.locator('.hi-music').click()
  pg.wait_for_function("document.querySelector('.hi-music').getAttribute('aria-pressed')==='true'",polling=100)
  assert requests and pg.evaluate('testAudio.loop&&!testAudio.paused')
  if mobile: pg.locator('.hi-tools-toggle').click()
  pg.locator('.hi-music').click()
  assert pg.evaluate('testAudio.paused')
  print('PASS user-initiated native audio play/pause, loop, no preload',flush=True)
  def map_point():
    return pg.evaluate("""()=>{const c=CITY3D.renderer.domElement,r=c.getBoundingClientRect();for(let y=r.top+150;y<r.bottom-60;y+=24)for(let x=r.left+12;x<r.right-12;x+=24)if(document.elementFromPoint(x,y)===c)return{x,y};throw Error('No exposed map surface')}""")
  for name,opening in [
    ('brand',"document.querySelector('.hi-brandbtn').click()"),
    ('help',"document.querySelector('.hi-help').click()"),
    ('drawer',"document.querySelector('[data-mode=list]').click()"),
    ('timeline',"document.querySelector('[data-mode=time]').click()"),
    ('tour',"document.querySelector('.hi-tourbtn').click()"),
    ('policy',"APP.openTheme('tp-ai')")]:
    pg.evaluate(opening);pg.evaluate('CITY3D.snapshot()')
    before=pg.evaluate('CITY3D.camera.position.toArray()')
    point=map_point();pg.mouse.click(point["x"],point["y"])
    pg.evaluate('CITY3D.snapshot()')
    result=pg.evaluate("""()=>({help:document.querySelector('.hi-intro').hidden,brand:document.querySelector('.hi-brandbtn').getAttribute('aria-expanded')==='false',drawer:!document.documentElement.classList.contains('drawer-open'),timeline:document.querySelector('.hi-timeline').hidden,tour:document.querySelector('.hi-tour').hidden,selection:!APP.state.selTheme&&!APP.state.selFlow,position:CITY3D.camera.position.toArray()})""")
    assert all(result[k] for k in ['help','brand','drawer','timeline','tour','selection']), (name,result)
    assert max(abs(x-y) for x,y in zip(before,result['position']))<1e-6,(name,'Camera jumped')
    print('PASS map tap dismisses '+name+' without camera jump or click-through',flush=True)
  pg.evaluate("document.querySelector('.hi-help').click()")
  point=map_point();x,y=point["x"],point["y"]
  pg.mouse.move(x,y);pg.mouse.down();pg.mouse.move(x+32,y+10,steps=4);pg.mouse.move(x,y,steps=4);pg.mouse.up()
  assert pg.locator('.hi-intro').is_visible(),'Drag dismissed help'
  point=map_point();pg.mouse.click(point["x"],point["y"]);pg.evaluate('CITY3D.snapshot()')
  pg.route('**/missing.mp3',lambda r:r.abort())
  pg.evaluate("testAudio.src='https://tpencore.tw/music/missing.mp3'")
  if mobile: pg.locator('.hi-tools-toggle').click()
  pg.locator('.hi-music').click()
  pg.wait_for_function("document.querySelector('.hi-toast').textContent.includes('無法播放')",polling=100)
  assert pg.locator('.hi-music').get_attribute('aria-pressed')=='false'
  pg.evaluate('MAP3D.panorama();CITY3D.snapshot()')
  pg.screenshot(path=str(ROOT/f"out/music-map-{'mobile' if mobile else 'desktop'}.png"),timeout=240000)
  assert not errors,errors
  print('PASS drag guard, failed music recovery, no page errors',flush=True)
  b.close()
finally:
 server.shutdown();server.server_close();thread.join()
