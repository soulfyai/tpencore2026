"""Build preview v0.5 in a staging tree; never mutate the v0.4 source or archive."""
from pathlib import Path
import tempfile,shutil,json,re,subprocess,sys,hashlib
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'prototypes'
def replace(s,a,b):
 assert a in s,a[:120]
 return s.replace(a,b,1)
def build():
 geo=json.loads((P/'v05-geography.json').read_text());inputs=json.loads((P/'v05-art-data.json').read_text())
 assert hashlib.sha256((ROOT/'data/geo.json').read_bytes()).hexdigest()==geo['source_sha256'],'Re-export geographic data after source-boundary changes'
 with tempfile.TemporaryDirectory(prefix='tpencore-v05-') as td:
  stage=Path(td)
  for name in ['3d','data','prototypes']:shutil.copytree(ROOT/name,stage/name)
  for name in ['build.py','template.html','VERSION','site-config.json']:shutil.copy2(ROOT/name,stage/name)
  (stage/'tools').mkdir()
  for name in ['build_greater_taipei_preserved.py','build_approved_city_art.py']:shutil.copy2(ROOT/'tools'/name,stage/'tools'/name)
  for d in inputs:(stage/f'prototypes/{d["city"]["city"]}-preview-data.json').write_text(json.dumps(d,ensure_ascii=False))
  # Freeze true sites and disable the old coastal-pocket lattice expansion.
  path=stage/'3d/world.js';s=path.read_text();a=s.index('    // Extend the same lattice');b=s.index('    for(const cell of cells.filter',a);s=s[:a]+s[b:]
  s=re.sub(r'WORLD\.geo = \(city, lon, lat\) => \{.*?\};',f'WORLD.geo = (city,lon,lat) => [(lon-{geo["projection"]["origin"][0]})*{geo["projection"]["xPerLongitude"]},(lat-{geo["projection"]["origin"][1]})*{geo["projection"]["zPerLatitude"]}];',s,count=1)
  sites={l['id']:{'city':l['city'],'x':l['x'],'z':l['z'],'r':l['r'],'sc':l['scale']} for l in geo['landmarks']}
  s=re.sub(r'WORLD\.landmarkSites = \{.*?\n  \};','WORLD.landmarkSites = '+json.dumps(sites)+';',s,count=1,flags=re.S);path.write_text(s)
  path=stage/'3d/decor.js';s=path.read_text().replace('const route = WORLD.shortest(w, e) || [];','const route = WORLD.shortest(w, e) || [];if(route.length<2)continue;');path.write_text(s)
  # Native sky/sea/time controls survive; island furniture, cliffs and surf do not.
  path=stage/'3d/env.js';s=path.read_text();s=replace(s,'  setInterval(apply, 60000);','  ENV.geoKeepObjects=new Set();for(const o of [sky,stars,moon,water,hemi,sun,sun.target,fill])o.traverse(v=>ENV.geoKeepObjects.add(v));\n  setInterval(apply, 60000);');path.write_text(s)
  # Preserve original UI, but use holes when following the selected municipality.
  path=stage/'3d/main.js';s=path.read_text();s=s.replace('const distanceToCoast = (poly) => {','const distanceToCoast = (poly,holes=[]) => {').replace('if (GEOM.pip(point[0], point[1], poly)) return 0;','if (GEOM.pip(point[0], point[1], poly)&&!holes.some(h=>GEOM.pip(point[0],point[1],h))) return 0;').replace('distanceToCoast(data.coast)','distanceToCoast(data.coast,data.holes||[])')
  s=replace(s,'const box = new THREE.Box3(); for (const [x,z] of WORLD.cities.get(city).coast) box.expandByPoint(new THREE.Vector3(x,0,z)); box.expandByScalar(0.8);','const box = new THREE.Box3(),f=GEO_WORLD.data.urbanFocus[city];for(const [x,z]of [[f[0],f[1]],[f[2],f[3]]])box.expandByPoint(new THREE.Vector3(x,0,z));box.expandByScalar(.8);')
  s=s.replace('labelR.render(scene, camera); fitPolicyLabels();','labelR.render(scene, camera); fitGeographicCitySigns(); fitPolicyLabels();')
  s+="""
function fitGeographicCitySigns(){const obstacles=[document.querySelector('.hi .brand'),document.querySelector('.hi-toolbar')].filter(Boolean).map(e=>e.getBoundingClientRect());for(const v of citySignViews){v.el.style.translate='';const r=v.el.getBoundingClientRect();if(!r.width)continue;const hits=obstacles.filter(h=>r.left<h.right+8&&r.right>h.left-8&&r.top<h.bottom+8&&r.bottom>h.top-8);if(hits.length)v.el.style.translate='0 '+(Math.max(...hits.map(h=>h.bottom))+12-r.top)+'px';}}
"""
  path.write_text(s)
  # Reuse detailed facade primitives; swap layout and structural model factories.
  path=stage/'tools/build_approved_city_art.py';s=path.read_text()
  s=s.replace("import {createTaipeiCityPlan} from './taipei-city-layout.js?rev=2';","import {createGeographicPlan as createTaipeiCityPlan,plantGeographicUrbanForest} from './v05-city-plan.js';")
  s=s.replace("import {createRegionalCityPlan} from './regional-layout.js?rev=1';","import {createGeographicPlan as createRegionalCityPlan} from './v05-city-plan.js';")
  s=s.replace("import {createTaipeiLife} from './taipei-city-life.js?rev=1';","import {createRegionalLife as createTaipeiLife} from './v05-life.js';").replace("import {createRegionalLife} from './regional-life.js?rev=1';","import {createRegionalLife} from './v05-life.js';")
  s=s.replace("import {createDetailStreetElements} from './detail-street-elements.js?rev=1';","import {createDiverseDistrict as createDetailStreetElements} from './v05-architecture.js';")
  s=s.replace('roofGarden};','roofGarden,windowBay,glass,paving,sign};')
  s=s.replace('createDetailStreetElements(art,scene,reviewedFacades);','createDetailStreetElements(art,scene,reviewedFacades,data.city.city);')
  s=s.replace('ponds=planTaipeiWater(plan)','ponds=plan.geoPonds')
  marker='        # Descriptor includes'
  s=replace(s,marker,'''        # Geographic land belongs to one shared surface, not to either city renderer.
        body=body.replace("polygon(coast.map(([x,z])=>[x*1.035,z*1.035]),-2.5,'#d6c7a2',2.1);",'').replace('polygon(coast,.01,art.grass,0,ponds.map(p=>p.bank));','')
        body=body.replace('const roadSurface=createTaipeiRoads(art,scene,renderer,roads);','const roadSurface={meshes:[]};')
        body=body.replace('boundaryDist(x,z)>r+2&&ponds.every','boundaryDist(x,z)>r+2&&!(data.holes||[]).some(h=>inside([x/SCALE,z/SCALE],h))&&ponds.every')
        body=body.replace('plantTaipeiForest(art,coast)','plantGeographicUrbanForest(art,plan,data)')
        body=body.replace("landmarks.filter(l=>['daan','yangming','beitou'].includes(l.id))",'[]')
        body=body.replace('if(index>=0){cityKit.highrise(p,highKinds[index]);streetDetails.highriseFront(p);}else streetDetails.urban(p);','streetDetails.urban(p);')
        body=body.replace('makeTranslation(l.x,.1,l.z)','makeTranslation(l.x,.1+(l.baseY||0)*SCALE,l.z)').replace('makeScale(sc,sc,sc)','makeScale(sc,sc*(l.heightScale||1),sc)').replace('const height=LANDMARK_BUILD[l.id](p)*sc;','const height=LANDMARK_BUILD[l.id](p)*sc*(l.heightScale||1)+(l.baseY||0)*SCALE;')
'''+marker)
  path.write_text(s)
  # Cell dimensions are shared, including the traffic loops on smaller v0.5 blocks.
  life=(ROOT/'prototypes/regional-life.js').read_text().replace('const step=plan.scale*1.8','const step=plan.scale*plan.cellWidth')
  (stage/'prototypes/v05-life.js').write_text(life)
  # The bridge remains the native rendering adapter, with a continuous world added.
  s=(P/'greater-taipei-art-bridge.js').read_text();s=s.replace("import {buildApprovedCityArt,buildReviewedBoats} from './greater-taipei-art.js?rev=4';", "import {buildApprovedCityArt} from './v05-art.js';\nimport {buildGeographicWorld,GEOGRAPHY} from './v05-world.js';")
  s=s.replace('&&!ENV.preservedObjects.has(o)',"&&!ENV.preservedObjects.has(o)&&!o.parent?.name.startsWith('national-flag-')")
  s=s.replace('revision:4','revision:5').replace("const retired=[];", "const retired=[];for(const o of ENV.preservedObjects)if(!ENV.geoKeepObjects.has(o))o.removeFromParent();ENV.preservedObjects=ENV.geoKeepObjects;")
  s=s.replace("fetch('./greater-taipei-art-data.json?rev=4'", "fetch('./v05-art-data.json'")
  a=s.index(" if(city==='taipei'){");b=s.index('\n }\n}',a)+3;s=s[:a]+s[b:]
  marker='scene.updateMatrixWorld(true);\n// Keep'
  s=replace(s,marker,"const GEO_WORLD=buildGeographicWorld(scene,renderer,APPROVED_ART.cities);window.GEO_WORLD=GEO_WORLD;for(const [id,c]of WORLD.cities){c.holes=GEOGRAPHY.cities[id][0].holes;c.center=id==='taipei'?[-3,1]:[-12.86,6.30];}\nscene.updateMatrixWorld(true);\n// Keep")
  s=s.replace("scene.updateMatrixWorld(true);\n// Keep", """for(const site of CITY_FLAGS.sites){const c=APPROVED_ART.cities.get(site.city),S=c.plan.scale;const options=[...c.landmarks.filter(l=>!l.nature).map(l=>({x:l.x,z:l.z,height:l.height,name:l.name})),...c.streetDetails.records];const top=options.sort((a,b)=>b.height-a.height)[0];Object.assign(site,{x:top.x/S,y:top.height/S,z:top.z/S,isl:null,source:top.name||top.style});}CITY_FLAGS.update(0,false);
scene.updateMatrixWorld(true);
// Keep""")
  s=s.replace('APPROVED_ART.update=(dt,time,moving)=>{','APPROVED_ART.update=(dt,time,moving)=>{GEO_WORLD.update(time,moving);')
  s=s.replace("s.height<=25","s.height<=35").replace('7/S,s.z/S+offset.z','12/S,s.z/S+offset.z').replace('new THREE.Vector3(22,20,43)','new THREE.Vector3(60,70,105)');(stage/'prototypes/greater-taipei-art-bridge.js').write_text(s)
  # Existing two-city builder is reused only inside this temporary tree.
  subprocess.run([sys.executable,str(stage/'tools/build_greater_taipei_preserved.py')],check=True,cwd=stage)
  (P/'v05-art.js').write_bytes((stage/'prototypes/greater-taipei-art.js').read_bytes())
  (P/'v05-life.js').write_bytes((stage/'prototypes/v05-life.js').read_bytes())
  html=(stage/'prototypes/greater-taipei.html').read_text().replace('greater-taipei-config.json','v05-config.json').replace('greater-taipei-2d.html','v05-2d.html')
  html=html.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<meta name="tpencore-preview-version" content="0.5.0">',1)
  html=re.sub(r'<title>(.*?)</title>',r'<title>\1｜地理配置預覽 v0.5.0</title>',html,count=1)
  (P/'greater-taipei-v0.5.0.html').write_text(html)
  text=(stage/'prototypes/greater-taipei-2d.html').read_text().replace('greater-taipei.html','greater-taipei-v0.5.0.html');(P/'v05-2d.html').write_text(text)
  (P/'v05-config.json').write_bytes((stage/'prototypes/greater-taipei-config.json').read_bytes())
  (P/'v05-version.json').write_text(json.dumps({'preview_version':'0.5.0','base':'preview-v0.4.0','geography_source':geo['source_sha256'],'entry':'greater-taipei-v0.5.0.html','status':'review-only'},indent=2)+'\n')
 print('Built isolated geographic preview v0.5.0; v0.4 and production untouched.')
if __name__=='__main__':build()
