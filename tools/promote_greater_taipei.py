"""Package approved v048 as self-contained NAS-compatible production pages."""
from pathlib import Path
import base64,json,re
from production_metadata import apply
ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'prototypes'
def uri(data,mime):return 'data:'+mime+';base64,'+base64.b64encode(data).decode()
def promote(output):
 modules={}
 refs=re.compile(r'''(\bfrom\s*|\bimport\s*)(["'])(\./[^"']+\.js(?:\?[^"']*)?)\2''')
 datarefs=re.compile(r'''(["'])(\./[^"']+\.json(?:\?[^"']*)?)\1''')
 def transform(text):
  def module(m):
   name=m[3].split('?')[0][2:];key='tpencore/'+name
   if key not in modules:
    modules[key]=None
    modules[key]=uri(transform((P/name).read_text()).encode(),'text/javascript')
   return m[1]+m[2]+key+m[2]
  text=refs.sub(module,text)
  return datarefs.sub(lambda m:m[1]+uri((P/m[2].split('?')[0][2:]).read_bytes(),'application/json')+m[1],text)
 s=(P/'greater-taipei-v0.4.8.html').read_text()
 s=s.replace('new URL("v044-config.json",location.href)','new URL("site-config.json",location.href)')
 s=s.replace('<meta name="robots" content="noindex,nofollow">','')
 s=re.sub(r'<title>.*?</title>','<title>台北安可｜一起打造你我的大台北</title>',s,count=1)
 s=s.replace('content="0.4.8"','content="2.1.2"').replace('./v044-2d.html','./2d.html').replace('./greater-taipei-2d.html','./2d.html')
 s=transform(s)
 pattern=r'(<script type="importmap">)(.*?)(</script>)'
 def mapping(m):
  config=json.loads(m[2]);config['imports'].update(modules)
  return m[1]+json.dumps(config,ensure_ascii=False)+m[3]
 s,n=re.subn(pattern,mapping,s,count=1,flags=re.S);assert n==1
 assert all(modules.values())
 assert 'brand-slogan' not in s
 s=apply(s)
 for name in ['index.html','index3d.html']:(output/name).write_text(s)
 two=(P/'v044-2d.html').read_text().replace('<meta name="robots" content="noindex,nofollow">','')
 two=re.sub(r'(?:greater-taipei(?:-v[0-9.]+)?|v044)\.html','index.html',two)
 from build_policy_reader import build_reader
 reader,count=build_reader()
 assert count==118
 (output/'2d.html').write_text(reader)
 print(f'Promoted v048 to production: {len(modules)} embedded modules, inline JSON, live NAS config retained')
