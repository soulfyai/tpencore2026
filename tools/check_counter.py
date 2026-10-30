"""Native PHP/SQLite counter: concurrency, persistence, no cookies and actual frontend requests."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import json, os, shutil, signal, socket, sqlite3, subprocess, time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from playwright.sync_api import sync_playwright
from promote_wanan import PAGEVIEW_SCRIPT
ROOT=Path(__file__).resolve().parents[1]
php=[os.environ.get('TPENCORE_PHP_BIN','php')]
if os.environ.get('TPENCORE_PHP_EXTENSION_DIR'):
    ext=Path(os.environ['TPENCORE_PHP_EXTENSION_DIR']);php+=['-n','-d','extension='+str(ext/'pdo.so'),'-d','extension='+str(ext/'pdo_sqlite.so')]
subprocess.run(php+['-l',str(ROOT/'deploy/counter.php')],check=True)
with TemporaryDirectory(prefix='tpencore-counter-') as tmp:
    tmp=Path(tmp);web=tmp/'public';web.mkdir();database=tmp/'private.sqlite'
    shutil.copy(ROOT/'deploy/counter.php',web/'counter.php')
    # Simulate upgrading an existing production database with a lifetime total.
    with sqlite3.connect(database) as db:
        db.execute('CREATE TABLE totals(name TEXT PRIMARY KEY,value INTEGER NOT NULL)')
        db.execute("INSERT INTO totals VALUES ('views',100)")
    ui=(ROOT/'3d/ui.js').read_text();counter=ui[ui.index('  const recordVisit='):ui.index('  const cand =')]
    (web/'index.html').write_text('<meta charset="utf-8"><footer id="watermark"><span>Designed by TPEncore © 2026</span><a>Contact</a></footer><button id="other">Map</button><script>const el=(tag,cls)=>{const e=document.createElement(tag);e.className=cls;return e;};const watermark=document.getElementById("watermark");'+counter+'recordVisit({counterUrl:"counter.php"});</script>')
    env={**os.environ,'TPENCORE_COUNTER_DB':str(database),'PHP_CLI_SERVER_WORKERS':'4'}
    log=open(tmp/'php.log','w')
    def start():
        global url
        with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
        url=f'http://127.0.0.1:{port}'
        proc=subprocess.Popen(php+['-S',f'127.0.0.1:{port}','-t',str(web)],env=env,stdout=log,stderr=log,start_new_session=True)
        for _ in range(300):
            try:
                with urlopen(url+'/counter.php',timeout=1) as r:json.load(r)
                return proc
            except OSError:time.sleep(.05)
        if proc.poll() is None:
            os.killpg(proc.pid,signal.SIGTERM);proc.wait()
        raise RuntimeError((tmp/'php.log').read_text())
    def request(method='GET',headers=None):
        with urlopen(Request(url+'/counter.php',data=b'' if method=='POST' else None,method=method,headers=headers or {}),timeout=10) as r:
            assert not r.headers.get('Set-Cookie')
            assert 'no-store' in r.headers['Cache-Control']
            return json.load(r)
    process=start()
    try:
        initial=request()
        assert initial['views']==100 and initial['today']==0
        assert initial['date']==datetime.now(ZoneInfo('Asia/Taipei')).date().isoformat()
        assert initial['timezone']=='Asia/Taipei' and initial['today_is_partial'] is True
        started=initial['daily_tracking_started_at']
        with ThreadPoolExecutor(max_workers=16) as pool:values=list(pool.map(lambda _:request('POST')['views'],range(40)))
        assert sorted(values)==list(range(101,141)),values
        assert request()['views']==140 and request()['views']==140
        assert request()['today']==40 and request()['daily_tracking_started_at']==started
        for method,headers,expected in [('PUT',{},405),('POST',{'Origin':'https://other.example'},403)]:
            try:request(method,headers);raise AssertionError('Unexpected request accepted')
            except HTTPError as e:assert e.code==expected
        assert request()['views']==140
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path='/usr/bin/chromium')
            page=browser.new_page();posts=[]
            page.on('request',lambda r:posts.append(r) if r.url.endswith('/counter.php') else None)
            with page.expect_response(lambda r:r.url.endswith('/counter.php')):
                page.goto(url+'/')
            assert request()['views']==141
            assert page.locator('.hi-visit-counter').count()==0
            assert '瀏覽次數' not in page.locator('body').inner_text()
            assert len(posts)==1 and posts[0].method=='POST' and 'cookie' not in posts[0].all_headers()
            page.locator('#other').click();assert request()['views']==141
            with page.expect_response(lambda r:r.url.endswith('/counter.php')):
                page.reload()
            assert request()['views']==142
            assert browser.contexts[0].cookies()==[]
            # Production 2D/candidate adapter uses the same config but never posts
            # from GitHub preview or to a foreign destination. These requests are fixtures.
            for host,config,expected in [
                ('tpencore.tw',{'counterEnabled':True},1),
                ('www.tpencore.tw',{'counterUrl':'/counter.php'},1),
                ('tpencore.tw',{'counterEnabled':False},0),
                ('tpencore.tw',{'counterUrl':'https://foreign.example/counter.php'},0),
                ('soulfyai.github.io',{'counterEnabled':True},0),
            ]:
                print('Checking adapter:',host,config,flush=True)
                tab=browser.new_page();sent=[]
                def route(request):
                    if request.request.url.endswith('/site-config.json'):
                        request.fulfill(json=config)
                    elif request.request.url.endswith('/counter.php'):
                        sent.append(request.request);request.fulfill(json={'ok':True,'views':1})
                    else:
                        request.fulfill(content_type='text/html',body='<meta charset="utf-8"><script>'+PAGEVIEW_SCRIPT+'</script>')
                tab.route('**/*',route)
                tab.goto('https://'+host+'/2d.html',wait_until='networkidle')
                assert len(sent)==expected,(host,config,len(sent))
                if sent:
                    assert sent[0].method=='POST' and 'cookie' not in sent[0].all_headers()
                tab.close()
            browser.close()
        os.killpg(process.pid,signal.SIGTERM);process.wait();process=start()
        assert request()['views']==142
        with sqlite3.connect(database) as db:
            assert [r[1] for r in db.execute('PRAGMA table_info(totals)')]==['name','value']
            assert [r[1] for r in db.execute('PRAGMA table_info(daily_views)')]==['day','views']
            today=datetime.now(ZoneInfo('Asia/Taipei')).date()
            yesterday=(today-timedelta(days=1)).isoformat()
            db.execute('UPDATE daily_views SET day=? WHERE day=?',(yesterday,today.isoformat()))
            db.execute("UPDATE counter_metadata SET value=? WHERE name='daily_tracking_started_at'",(yesterday+'T08:00:00+08:00',))
            db.execute('INSERT INTO daily_views VALUES (?,?)',((today-timedelta(days=90)).isoformat(),99))
        # A new day starts at zero; historical lifetime total is unchanged.
        next_day=request()
        assert next_day['views']==142 and next_day['today']==0 and next_day['today_is_partial'] is False
        assert request('POST')['today']==1 and request()['views']==143
        with sqlite3.connect(database) as db:
            assert db.execute('SELECT views FROM daily_views WHERE day=?',(yesterday,)).fetchone()[0]==42
            assert db.execute('SELECT COUNT(*) FROM daily_views').fetchone()[0]==2
        print('PASS counter: legacy total retained, Taipei daily counts, partial-first-day marker, GET read-only counts, concurrent atomic increments, day isolation, retention, restart, frontend and no identifiers/cookies')
    finally:
        if process.poll() is None:
            os.killpg(process.pid,signal.SIGTERM);process.wait()
        log.close()
