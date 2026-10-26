"""Build isolated v0.4.6 bridges, boats and aircraft over v0.4.5."""
from pathlib import Path
import json,hashlib,re
R=Path(__file__).resolve().parents[1];P=R/'prototypes'
def build():
 plan=json.loads((P/'v046-transport-plan.json').read_text())
 assert plan['source_sha256']==hashlib.sha256((P/'v044-art-data.json').read_bytes()).hexdigest(),'Transport plan requires re-export'
 assert plan['environment_sha256']==hashlib.sha256((R/'3d/env.js').read_bytes()).hexdigest(),'Sea obstacle layout requires re-export'
 s=(P/'street-infill-v045.js').read_text().replace('const fixed=[...solidLandmarks,','const fixed=[...(plan.bridgeClearances||[]),...solidLandmarks,')
 s=s.replace('coverage.push({cell:cell.id,','coverage.push({cell:cell.id,transport:(plan.bridgeClearances||[]).some(b=>overlap({x,z,w:W,d:W},b)),')
 (P/'street-infill-v046.js').write_text(s)
 s=(P/'v045-art.js').read_text().replace("'./street-infill-v045.js'","'./street-infill-v046.js'")
 s=s.replace('const roads=plan.roads;','const roads=plan.roads;\nplan.bridgeClearances=data.transportCorridors||[];for(const q of plan.bridgeClearances)reserve(q.x,q.z,q.w,q.d);')
 s=re.sub(r'const airTraffic=await createRegionalAircraft\(scene,plan,Math.max\(.*?\)\);','// Eight city flights are managed by the shared transport network.',s)
 assert 'const airTraffic=await' not in s
 (P/'v046-art.js').write_text(s)
 s=(P/'greater-taipei-v0.4.5.html').read_text().replace('v045-art.js?rev=1','v046-art.js?rev=1').replace('revision:4.5','revision:4.6')
 mark='import * as THREE from \"three\";'
 assert mark in s;s=s.replace(mark,mark+"\nimport {buildTransportNetwork} from './transport-network-v046.js';",1)
 mark='for(const input of inputs){';s=s.replace(mark,"const transportPlan=await fetch('./v046-transport-plan.json?rev=1').then(r=>{if(!r.ok)throw Error('Transport plan unavailable');return r.json();});\n"+mark+'\n input.transportCorridors=transportPlan.corridors[input.city.city];',1)
 marker='}\nscene.updateMatrixWorld(true);\n// Keep the native sea'
 hook='''}
APPROVED_ART.transport=await buildTransportNetwork(scene,APPROVED_ART.cities,transportPlan,SHIPS,rng,WATER_Y);
for(const b of APPROVED_ART.transport.bridges){const x=(b.a[0]+b.b[0])/2,z=(b.a[1]+b.b[1])/2,isl=islands.find(i=>i.t.city==='newtaipei');let l=LANDMARKS3D.find(v=>v.name===b.name);if(!l){l={id:b.name,name:b.name};LANDMARKS3D.push(l);}Object.assign(l,{isl,x:x-isl.c.x,z:z-isl.c.z,top:b.top,city:'newtaipei',sc:1,r:1,nature:false,fixed:true});}
WORLD.bridges=transportPlan.bridges.map(b=>({...b,ca:'taipei',cb:'newtaipei'}));WORLD.bridgeEnds=transportPlan.bridges.flatMap(b=>[b.a,b.b]);
scene.updateMatrixWorld(true);
// Keep the native sea'''
 assert marker in s;s=s.replace(marker,hook,1)
 s=s.replace('APPROVED_ART.update=(dt,time,moving)=>{','APPROVED_ART.update=(dt,time,moving)=>{APPROVED_ART.transport.update(dt,time,moving);',1)
 marker='}catch(err){console.error(err);window.cityLoadFailed();}'
 assert marker in s
 s=s.replace(marker,"if(new URLSearchParams(location.search).get('view')==='bridges'){UI.dismissOverlays?.();MAP3D.panorama();fly=null;const f=APPROVED_ART.transport.frame(camera);camera.position.copy(f.pos);controls.target.copy(f.target);controls.update();}\n"+marker,1)
 s=s.replace('content="0.4.5"','content="0.4.6"',1).replace('街區補齊與植栽預覽 v0.4.5','橋梁與海空交通預覽 v0.4.6',1)
 (P/'greater-taipei-v0.4.6.html').write_text(s)
 (P/'v046-version.json').write_text(json.dumps({'preview_version':'0.4.6','base':'preview-v0.4.5','scope':'guandu-danjiang-bridges-more-boats-and-planes','entry':'greater-taipei-v0.4.6.html','bridges':2,'boats':24,'aircraft':8,'placement':plan['placement'],'status':'review-only'},ensure_ascii=False,indent=2)+'\n')
 print('Built isolated v0.4.6: two bridges,24 boats,8 flights; earlier pages retained.')
if __name__=='__main__':build()
