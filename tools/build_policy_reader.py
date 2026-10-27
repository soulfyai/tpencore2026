"""Server-rendered source-backed policy reader for people and crawlers."""
from pathlib import Path
from html import escape as e
import json
from production_metadata import apply
R=Path(__file__).resolve().parents[1]
def build_reader(city_id=None):
 cities=json.loads((R/'prototypes/v044-art-data.json').read_text());toc=[];sections=[];count=0
 if city_id:cities=[c for c in cities if c['city']['city']==city_id]
 for c in cities:
  city=c['city'];sources={s['id']:s for s in city['sources']}
  for row in c['themes']:
   t=row['theme'];toc.append(f'<li><a href="#{e(t["id"])}">{e(city["cityName"])}・{e(t["name"])}</a></li>')
   items=[]
   for it in t['items']:
    count+=1;refs=[]
    for sid in it.get('sources',t.get('sources',[])):
     src=sources.get(sid)
     if src and src['url'].startswith('https://'):refs.append(f'<li><a href="{e(src["url"],quote=True)}" rel="noopener noreferrer">{e(src["title"])}</a> — {e(src.get("publisher",""))} {e(src.get("date",""))}</li>')
    facts=''.join('<li>'+e(str(f))+'</li>' for f in it.get('facts',[]))
    kind='任內政績' if it.get('contentKind')=='record' else '政策與承諾'
    items.append(f'<article id="{e(it["id"])}"><h3>{e(it["name"])}</h3><p class="meta">{kind}｜{e(city["candidate"])}</p><p>{e(it.get("plain",""))}</p>'+('<p>時程／進度：'+e(it['phase'])+'</p>' if it.get('phase') else '')+f'<ul>{facts}</ul><details><summary>原始來源（{len(refs)}）</summary><ul>{"".join(refs)}</ul></details></article>')
   sections.append(f'<section id="{e(t["id"])}"><h2>{e(city["cityName"])}・{e(t["name"])}</h2><p>{e(t.get("summary",""))}</p>{"".join(items)}</section>')
 html='''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>大台北政策清單｜台北安可</title><meta name="description" content=""><link rel="canonical" href="https://tpencore.tw/2d.html"><meta property="og:type" content="website"><meta property="og:title" content=""><meta property="og:description" content=""><meta property="og:url" content=""><meta property="og:image" content=""><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content=""><meta name="twitter:description" content=""><meta name="twitter:image" content=""><meta name="claude:viewport-fit-sides" content="cover"><style>body{margin:0;background:#f5f8fc;color:#14253e;font:17px/1.8 system-ui,sans-serif}header,main,footer{max-width:960px;margin:auto;padding:24px}header{padding-top:40px}a{color:#145caf;text-underline-offset:3px}h1{font-size:clamp(26px,5vw,40px)}h2{padding-top:24px}article{background:white;border:1px solid #dbe4ed;border-radius:16px;padding:20px;margin:16px 0}h3{margin:0}.meta{color:#52677d;font-size:14px}nav ul{columns:2;padding-left:24px}summary{cursor:pointer;font-weight:600}li{overflow-wrap:anywhere}section,article{scroll-margin-top:16px}@media(max-width:600px){nav ul{columns:1}header,main,footer{padding:18px}}</style></head><body><header><a href="/">← 台北安可・3D 互動地圖</a><h1>臺北市與新北市政策、政績整理</h1><p>以臺北市為主，連結新北市，依主題閱讀政策內容、時程及原始來源。</p><p>本站為獨立整理的公開資訊索引，不代表候選人、政黨或競選團隊。政策承諾不等於已完成，時程與數字以各項原始來源為準。</p>'''
 html+=f'<p>收錄 {count} 項內容，分為 {len(toc)} 個主題。資料查核日期：2026-10-22。</p><nav aria-label="政策主題"><ul>{"".join(toc)}</ul></nav></header><main>{"".join(sections)}</main><footer><h2>資料如何整理？</h2><p>內容依公開發布、媒體報導與受訪發言整理；每項保留原始來源，沒有來源支持的數字或進度不自行推定。資料可能隨政策增修，請比對來源發布日期。</p><a href="https://github.com/soulfyai/tpencore2026/issues/new/choose">回報錯誤或提供更新來源</a><p>Designed by TPEncore © 2026</p></footer></body></html>'
 html=apply(html,two=True)
 if city_id=='taipei':
  import re
  title='蔣萬安政策與政績整理｜台北安可・政策市'
  desc='整理蔣萬安在臺北市的交通、住宅都更、育兒托育、教育與長照等政策及任內政績，分別標示內容性質、時程、原始來源與查核日期。'
  url='https://tpencore.tw/chiang-wan-an.html'
  html=html.replace('臺北市與新北市政策、政績整理','蔣萬安政策與政績整理').replace('以臺北市為主，連結新北市，依主題閱讀政策內容、時程及原始來源。',desc).replace('大台北政策清單｜台北安可',title).replace('https://tpencore.tw/2d.html',url)
  html=re.sub(r'(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")[^"]*',lambda m:m[1]+desc,html)
  def schema(m):
   data=json.loads(m[1])
   for node in data['@graph']:
    if node['@type']=='WebPage':
     node['name']=title;node['description']=desc;node['about']=[{'@type':'Person','name':'蔣萬安'},{'@type':'Place','name':'臺北市'}]
   return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False)+'</script>'
  html=re.sub(r'<script type="application/ld\+json">(.*?)</script>',schema,html,flags=re.S)
  html=html.replace('<nav aria-label="政策主題">','<p><a href="/2d.html">閱讀臺北、新北完整政策清單</a></p><nav aria-label="政策主題">')
 return html,count
