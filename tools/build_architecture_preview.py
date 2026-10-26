"""Build v0.4.1 architecture-only preview from the immutable v0.4 layout sources."""
from pathlib import Path
import shutil,tempfile,subprocess,sys,json,re,hashlib
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'prototypes'
def replace(s,a,b):
 assert a in s,a[:120]
 return s.replace(a,b,1)
def build():
 with tempfile.TemporaryDirectory(prefix='tpencore-v041-') as td:
  stage=Path(td)
  for name in ['3d','data','prototypes']:shutil.copytree(ROOT/name,stage/name)
  for name in ['build.py','template.html','VERSION','site-config.json']:shutil.copy2(ROOT/name,stage/name)
  (stage/'tools').mkdir()
  for name in ['build_greater_taipei_preserved.py','build_approved_city_art.py']:shutil.copy2(ROOT/'tools'/name,stage/'tools'/name)
  path=stage/'tools/build_approved_city_art.py';s=path.read_text()
  s=replace(s,"import {createDetailStreetElements} from './detail-street-elements.js?rev=1';","import {createVariedStreetElements as createDetailStreetElements} from './architecture-v041.js';")
  s=replace(s,'roofGarden};','roofGarden,windowBay,glass,darkGlass,terracotta,roofTile,rail,sign,awning};')
  s=replace(s,'createDetailStreetElements(art,scene,reviewedFacades);','createDetailStreetElements(art,scene,reviewedFacades,data.city.city);')
  s=replace(s,"output.append('function createReviewedFacades","output.append('export function createReviewedFacades")
  path.write_text(s)
  path=stage/'prototypes/greater-taipei-art-bridge.js' ;s=path.read_text().replace("'./greater-taipei-art.js?rev=4'","'./v041-art.js?rev=1'").replace("'./greater-taipei-art-data.json?rev=4'","'./v041-art-data.json?rev=1'").replace('revision:4','revision:4.1')
  s=s.replace('new THREE.Vector3(22,20,43)','new THREE.Vector3(-34,32,-56)')
  s=s.replace('s.w>=9&&s.height>=15&&s.height<=25','s.w>=7&&s.height>=8&&s.height<=30')
  s=s.replace('const score=s=>Math.min',"const coastGap=s=>Math.min(...c.plan.coast.map((a,i)=>{const b=c.plan.coast[(i+1)%c.plan.coast.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((s.x-a[0])*dx+(s.z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(s.x-a[0]-t*dx,s.z-a[1]-t*dz);}));\nconst score=s=>Math.max(0,65-coastGap(s))*8+Math.min")

  path.write_text(s)
  subprocess.run([sys.executable,str(stage/'tools/build_greater_taipei_preserved.py')],cwd=stage,check=True)
  (P/'v041-art.js').write_bytes((stage/'prototypes/greater-taipei-art.js').read_bytes())
  (P/'v041-art-data.json').write_bytes((stage/'prototypes/greater-taipei-art-data.json').read_bytes())
  # Every geometry/layout input stays byte-identical to v0.4.
  assert (P/'v041-art-data.json').read_bytes()==(P/'greater-taipei-art-data.json').read_bytes()
  html=(stage/'prototypes/greater-taipei.html').read_text().replace('greater-taipei-config.json','v041-config.json').replace('greater-taipei-2d.html','v041-2d.html')
  html=html.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<meta name="tpencore-preview-version" content="0.4.1">',1)
  html=re.sub(r'<title>(.*?)</title>',r'<title>\1｜建築多樣性預覽 v0.4.1</title>',html,count=1)
  (P/'greater-taipei-v0.4.1.html').write_text(html)
  text=(stage/'prototypes/greater-taipei-2d.html').read_text().replace('greater-taipei.html','greater-taipei-v0.4.1.html');(P/'v041-2d.html').write_text(text)
  (P/'v041-config.json').write_bytes((stage/'prototypes/greater-taipei-config.json').read_bytes())
  (P/'v041-version.json').write_text(json.dumps({'preview_version':'0.4.1','base':'preview-v0.4.0','scope':'ordinary-street-architecture-only','layout_sha256':hashlib.sha256((P/'v041-art-data.json').read_bytes()).hexdigest(),'entry':'greater-taipei-v0.4.1.html','status':'review-only'},indent=2)+'\n')
 print('Built isolated v0.4.1: v0.4 layout, highrises, policies, roads and UI retained.')
if __name__=='__main__':build()
