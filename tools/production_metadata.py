"""Consistent search, social and machine-readable identity for the live site."""
import re,json
TITLE='台北安可｜一起打造你我的大台北'
DESCRIPTION='以臺北市為主的 3D 互動政策地圖，連結新北市，探索交通、居住、育兒、教育與長照等政策及政績，查閱內容、進度與原始來源。'
IMAGE='https://soulfyai.github.io/tpencore2026/social-preview-v2.1.3.png'
def apply(html,two=False):
 url='https://tpencore.tw/'+('2d.html' if two else '')
 title='大台北政策清單｜台北安可' if two else TITLE
 html=re.sub(r'<title>.*?</title>',f'<title>{title}</title>',html,count=1)
 values={'description':DESCRIPTION,'og:site_name':'台北安可','og:title':title,'og:description':DESCRIPTION,'og:url':url,'og:image':IMAGE,'og:image:secure_url':IMAGE,'og:image:alt':'政策市：不只看選舉，更要看政策。探索城市政策，看見更好的未來。','twitter:title':title,'twitter:description':DESCRIPTION,'twitter:image':IMAGE,'og:image:type':'image/png','og:image:width':'1733','og:image:height':'907','twitter:image:alt':'政策市：不只看選舉，更要看政策。'}
 for key,value in values.items():
  html=re.sub(r'(<meta (?:name|property)="'+re.escape(key)+r'" content=")[^"]*(">)',lambda m:m[1]+value+m[2],html)
  if not re.search(r'<meta (?:name|property)="'+re.escape(key)+r'"',html):
   attr='property' if key.startswith('og:') else 'name'
   html=html.replace('<title>',f'<meta {attr}="{key}" content="{value}"><title>',1)
 html=re.sub(r'<link rel="canonical" href="[^"]+">',f'<link rel="canonical" href="{url}">',html)
 data={'@context':'https://schema.org','@graph':[{'@type':'WebSite','@id':'https://tpencore.tw/#website','url':'https://tpencore.tw/','name':'台北安可','alternateName':'一起打造你我的大台北','description':DESCRIPTION,'inLanguage':'zh-Hant'},{'@type':'WebPage','@id':url+'#webpage','url':url,'name':title,'description':DESCRIPTION,'isPartOf':{'@id':'https://tpencore.tw/#website'},'inLanguage':'zh-Hant','about':[{'@type':'Place','name':'臺北市'},{'@type':'Place','name':'新北市'}],'primaryImageOfPage':{'@type':'ImageObject','url':IMAGE,'width':1733,'height':907}}]}
 extra='<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False)+'</script>\n'
 html=html.replace('<meta name="claude:viewport-fit-sides"',extra+'<meta name="claude:viewport-fit-sides"',1)
 if not two:
  summary='<noscript><article><h1>'+TITLE+'</h1><p>'+DESCRIPTION+'</p><p>本網站整理政策與政績資訊，個別項目的原始來源及進度請見政策清單；互動地圖為視覺示意。</p><a href="https://tpencore.tw/2d.html">閱讀大台北政策清單與來源</a></article></noscript>'
  html=html.replace('</html>',summary+'</html>',1)
 return html
