"""Validate the self-contained production promotion and retained SEO/navigation."""
from html.parser import HTMLParser
import json
from pathlib import Path
import sys

PAGES=('index.html','index3d.html','2d.html','chiang-wan-an.html')
class Tags(HTMLParser):
    def __init__(self):super().__init__();self.tags=[]
    def handle_starttag(self,tag,attrs):self.tags.append((tag,dict(attrs)))

site=Path(sys.argv[1])
for name in PAGES:
    html=(site/name).read_text();parsed=Tags();parsed.feed(html)
    assert html.count('data-wanan-production="2.4.0"')==1,name
    assert 'Powered by SoulfyAI' in html and 'AI Powered by SoulfyAI' not in html,name
    assert '.typing-dots' in html and "text.replace(/—+/g, '，')" in html,name
    assert 'data-wanan-side="right"' in html,name
    for tag,attrs in parsed.tags:
        if tag=='script':assert not attrs.get('src','').startswith('wanan-'),name
        if tag=='meta' and attrs.get('name')=='robots':assert 'noindex' not in attrs.get('content',''),name
        if tag=='link' and attrs.get('rel')=='canonical':assert attrs['href'].startswith('https://tpencore.tw/'),name
        if tag=='a':assert not attrs.get('href','').startswith('wanan-widget-v0.1.0-'),name
    if name in PAGES[:2]:
        assert 'const snapshot = {"status": "published"' in html,name
        assert 'autoStartPending=true' not in html,name
        assert '<b>非官方萬安政策市</b><br>資料更新至 ' in html,name
    if name in ('2d.html','chiang-wan-an.html'):
        assert html.count('data-tpencore-pageview="1"')==1,name
    else:
        assert 'data-tpencore-pageview=' not in html,name
    preview=(site/('wanan-widget-v0.1.0-'+name)).read_text()
    assert 'noindex,nofollow' in preview and 'data-wanan-production=' not in preview,name
assert json.loads((site/'version.json').read_text())['version']==(Path(__file__).resolve().parents[1]/'VERSION').read_text().strip()
print('PASS: four self-contained production chats, reviewed topics, music off, production SEO/navigation and isolated previews')
