"""Exercise production audio code with native playback and both browser autoplay policies."""
from pathlib import Path
from threading import Thread
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import io, wave
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
ui=(ROOT/'3d/ui.js').read_text()
source=ui[ui.index('  const audio = new Audio();'):ui.index('\n  UI.hasOverlays=')]
sound=io.BytesIO()
with wave.open(sound,'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(8000);w.writeframes(b'\0\0'*8000)
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers()
        html='<button id="begin">Begin</button><button id="music" aria-pressed="false" hidden>Music</button><div id="toast"></div><script>const recordVisit=()=>{},music=document.getElementById("music"),UI={toast:t=>document.getElementById("toast").textContent=t};'+source+'</script>'
        self.wfile.write(html.encode('utf-8'))
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
thread=Thread(target=server.serve_forever,daemon=True);thread.start()
try:
 with sync_playwright() as p:
  for policy in ['document-user-activation-required','no-user-gesture-required']:
   b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--autoplay-policy='+policy])
   def page_for(config=None,failed=False):
    pg=b.new_page();state={'failed':failed,'errors':[]}
    pg.route('**/site-config.json',lambda r:r.fulfill(json=config or {'musicUrl':'https://tpencore.tw/music/tpencoretheme.mp3'}))
    def route_audio(r):
      if state['failed']:r.fulfill(status=404,body='Missing')
      else:r.fulfill(body=sound.getvalue(),content_type='audio/wav')
    pg.route('https://tpencore.tw/music/tpencoretheme.mp3',route_audio)
    pg.on('pageerror',lambda e:state['errors'].append(str(e)))
    pg.add_init_script("""window.playAttempts=0;const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.testAudio=this;window.playAttempts++;return play.call(this)}""")
    pg.goto(f'http://127.0.0.1:{server.server_port}/')
    pg.wait_for_function("!document.getElementById('music').hidden")
    return pg,state
   pg,state=page_for()
   pg.wait_for_function('playAttempts>=1')
   if policy=='document-user-activation-required':
    pg.wait_for_function("document.getElementById('music').title.includes('點選')")
    assert pg.evaluate('testAudio.paused')
    pg.locator('#begin').click()
   pg.wait_for_function("document.getElementById('music').getAttribute('aria-pressed')==='true'")
   assert pg.evaluate('testAudio.loop&&!testAudio.paused')
   pg.locator('#music').click();assert pg.evaluate('testAudio.paused')
   attempts=pg.evaluate('playAttempts');pg.locator('#begin').click();pg.keyboard.press('Enter')
   assert pg.evaluate('testAudio.paused&&playAttempts===%d'%attempts),'Manual pause restarted'
   assert not state['errors'],state
   pg.close()
   if policy=='document-user-activation-required':
    for action in ['key','music']:
     pg,state=page_for();pg.wait_for_function("document.getElementById('music').title.includes('點選')")
     if action=='key':pg.keyboard.press('Enter')
     else:pg.locator('#music').click()
     pg.wait_for_function("document.getElementById('music').getAttribute('aria-pressed')==='true'")
     assert not state['errors'],state;pg.close()
   pg,state=page_for({'musicUrl':'https://tpencore.tw/music/tpencoretheme.mp3','musicAutoplay':False})
   pg.locator('#begin').click();assert pg.evaluate('playAttempts===0')
   pg.locator('#music').click();pg.wait_for_function("document.getElementById('music').getAttribute('aria-pressed')==='true'")
   assert not state['errors'],state;pg.close()
   if policy=='no-user-gesture-required':
    pg,state=page_for(failed=True)
    pg.wait_for_function("document.getElementById('music').title.includes('重試')")
    assert pg.locator('#toast').inner_text()==''
    attempts=pg.evaluate('playAttempts');pg.locator('#begin').click()
    assert pg.evaluate('playAttempts')==attempts,'Failed audio retries on unrelated interactions'
    state['failed']=False;pg.locator('#music').click()
    pg.wait_for_function("document.getElementById('music').getAttribute('aria-pressed')==='true'")
    assert not state['errors'],state;pg.close()
   print('PASS '+policy+': initial attempt / gesture fallback, pause respected, manual opt-out, errors and retry',flush=True)
   b.close()
finally:
 server.shutdown();server.server_close();thread.join()
