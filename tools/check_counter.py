"""Native PHP/SQLite counter: concurrency, persistence, no cookies and actual frontend requests."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import json, os, shutil, signal, socket, sqlite3, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
php=[os.environ.get('TPENCORE_PHP_BIN','php')]
if os.environ.get('TPENCORE_PHP_EXTENSION_DIR'):
    ext=Path(os.environ['TPENCORE_PHP_EXTENSION_DIR']);php+=['-n','-d','extension='+str(ext/'pdo.so'),'-d','extension='+str(ext/'pdo_sqlite.so')]
subprocess.run(php+['-l',str(ROOT/'deploy/counter.php')],check=True)
with TemporaryDirectory(prefix='tpencore-counter-') as tmp:
    tmp=Path(tmp);web=tmp/'public';web.mkdir();database=tmp/'private.sqlite'
    shutil.copy(ROOT/'deploy/counter.php',web/'counter.php')
    ui=(ROOT/'3d/ui.js').read_text();counter=ui[ui.index('  const recordVisit='):ui.index('  const cand =')]
    (web/'index.html').write_text('<meta charset="utf-8"><footer id="watermark"><span>Designed by TPEncore © 2026</span><a>Contact</a></footer><button id="other">Map</button><script>const el=(tag,cls)=>{const e=document.createElement(tag);e.className=cls;return e;};const watermark=document.getElementById("watermark");'+counter+'recordVisit({counterUrl:"counter.php"});</script>')
    with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
    url=f'http://127.0.0.1:{port}'
    env={**os.environ,'TPENCORE_COUNTER_DB':str(database),'PHP_CLI_SERVER_WORKERS':'4'}
    log=open(tmp/'php.log','w')
    def start():
        proc=subprocess.Popen(php+['-S',f'127.0.0.1:{port}','-t',str(web)],env=env,stdout=log,stderr=log,start_new_session=True)
        for _ in range(100):
            try:
                with urlopen(url+'/counter.php',timeout=1) as r:json.load(r)
                return proc
            except OSError:time.sleep(.03)
        raise RuntimeError((tmp/'php.log').read_text())
    def request(method='GET',headers=None):
        with urlopen(Request(url+'/counter.php',data=b'' if method=='POST' else None,method=method,headers=headers or {}),timeout=10) as r:
            assert not r.headers.get('Set-Cookie')
            assert 'no-store' in r.headers['Cache-Control']
            return json.load(r)
    process=start()
    try:
        assert request()['views']==0
        with ThreadPoolExecutor(max_workers=16) as pool:values=list(pool.map(lambda _:request('POST')['views'],range(40)))
        assert sorted(values)==list(range(1,41)),values
        assert request()['views']==40 and request()['views']==40
        for method,headers,expected in [('PUT',{},405),('POST',{'Origin':'https://other.example'},403)]:
            try:request(method,headers);raise AssertionError('Unexpected request accepted')
            except HTTPError as e:assert e.code==expected
        assert request()['views']==40
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path='/usr/bin/chromium')
            page=browser.new_page();posts=[]
            page.on('request',lambda r:posts.append(r) if r.url.endswith('/counter.php') else None)
            with page.expect_response(lambda r:r.url.endswith('/counter.php')):
                page.goto(url+'/')
            assert request()['views']==41
            assert page.locator('.hi-visit-counter').count()==0
            assert '瀏覽次數' not in page.locator('body').inner_text()
            assert len(posts)==1 and posts[0].method=='POST' and 'cookie' not in posts[0].all_headers()
            page.locator('#other').click();assert request()['views']==41
            with page.expect_response(lambda r:r.url.endswith('/counter.php')):
                page.reload()
            assert request()['views']==42
            assert browser.contexts[0].cookies()==[]
            browser.close()
        os.killpg(process.pid,signal.SIGTERM);process.wait();process=start()
        assert request()['views']==42
        with sqlite3.connect(database) as db:
            assert [r[1] for r in db.execute('PRAGMA table_info(totals)')]==['name','value']
        print('PASS counter: 40 concurrent visits, refresh semantics, persistent total, no identifiers/cookies, frontend POST once, cross-origin rejection')
    finally:
        os.killpg(process.pid,signal.SIGTERM);process.wait();log.close()
