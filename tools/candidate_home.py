"""Prepared homepage integration; activate after NAS candidate page exists."""
import re,json
TITLE='台北安可・政策市｜蔣萬安政見、政策與政績整理'
DESCRIPTION='從交通、住宅都更到育兒托育，閱讀蔣萬安政見、政策與任內政績，逐項查看內容、時程與原始來源。'
def integrate(s):
 s=re.sub(r'<title>.*?</title>','<title>'+TITLE+'</title>',s,count=1)
 for key,value in {'og:title':TITLE,'twitter:title':TITLE,'description':DESCRIPTION,'og:description':DESCRIPTION,'twitter:description':DESCRIPTION}.items():
  s=re.sub(r'(<meta (?:name|property)="'+re.escape(key)+r'" content=")[^"]*',lambda m:m[1]+value,s)
 old='<h2>一個政策區塊，一個政策主題。</h2>'
 assert old in s
 if '蔣萬安政見、政策與政績整理 →</a>' not in s:
  s=s.replace(old,old+'<p>'+DESCRIPTION+' <a href="https://tpencore.tw/chiang-wan-an.html">蔣萬安政見、政策與政績整理 →</a></p>',1)
 def schema(m):
  data=json.loads(m[1])
  for node in data.get('@graph',[]):
   if node.get('@type')=='WebPage':
    node['name']=TITLE;node['description']=DESCRIPTION
    node['hasPart']={'@type':'WebPage','url':'https://tpencore.tw/chiang-wan-an.html','name':'蔣萬安政見、政策與政績整理'}
  return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False)+'</script>'
 s=re.sub(r'<script type="application/ld\+json">(.*?)</script>',schema,s,flags=re.S)
 return s
