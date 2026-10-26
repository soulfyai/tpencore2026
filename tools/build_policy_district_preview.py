"""Build v0.4.4 policy-first campuses in staging, preserving all prior previews."""
from pathlib import Path
import tempfile,shutil,subprocess,sys,json,re,hashlib
from plan_policy_districts_v044 import main as export_layout
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'prototypes'
def replace(s,a,b):
 assert a in s,a[:120]
 return s.replace(a,b,1)
def build():
 export_layout();inputs=json.loads((P/'v044-district-data.json').read_text())
 with tempfile.TemporaryDirectory(prefix='tpencore-v044-') as td:
  stage=Path(td)
  for name in ['3d','data','prototypes']:shutil.copytree(ROOT/name,stage/name)
  for name in ['build.py','template.html','VERSION','site-config.json']:shutil.copy2(ROOT/name,stage/name)
  (stage/'tools').mkdir()
  for name in ['build_greater_taipei_preserved.py','build_approved_city_art.py','build_architecture_preview.py','build_mobile_opening_preview.py','build_mobile_panorama_preview.py']:shutil.copy2(ROOT/'tools'/name,stage/'tools'/name)
  for d in inputs:(stage/f'prototypes/{d["city"]["city"]}-preview-data.json').write_text(json.dumps(d,ensure_ascii=False))
  # Group after the normal source/record compilation, retaining every stable item ID.
  path=stage/'build.py';s=path.read_text();marker='data = {"meta":';at=s.index(marker);s=s[:at]+(ROOT/'tools/policy_groups_v044.py').read_text()+'\ncities=merge_cities(cities)\n'+s[at:];path.write_text(s)
  # Native lists/counters distinguish individual record items within mixed topics.
  path=stage/'template.html';s=path.read_text()
  s=replace(s,'const matches=t=>', 'const isRecordItem=(i,t)=>i.contentKind==="record"||t.kind==="record";\nconst matches=t=>')
  s=s.replace('[t.name,t.summary,(t.items||[]).map(i=>[i.name,i.plain,i.facts])]', '[t.name,t.aliases,t.summary,(t.items||[]).map(i=>[i.name,i.plain,i.facts,i.originalCategory])]')
  s=s.replace('[i.name,i.plain,i.facts,t.name]', '[i.name,i.plain,i.facts,t.name,i.originalCategory]')
  old='const pol=c.themes.filter(t=>t.kind!=="record"),recs=c.themes.filter(t=>t.kind==="record"),rec=recs.length?{items:recs.flatMap(t=>t.items)}:null;'
  new='const pol=c.themes.filter(t=>t.items.some(i=>!isRecordItem(i,t))),recordItems=c.themes.flatMap(t=>t.items.filter(i=>isRecordItem(i,t))),rec=recordItems.length?{items:recordItems}:null;'
  s=replace(s,old,new).replace('const n=pol.reduce((s,t)=>s+(t.items||[]).length,0);','const n=pol.reduce((s,t)=>s+(t.items||[]).filter(i=>!isRecordItem(i,t)).length,0);')
  s=s.replace('${(t.items||[]).length} 項${t.kind==="record"?"已實施施政":"政見"}', '${(t.items||[]).filter(i=>!isRecordItem(i,t)).length} 項政策 · ${(t.items||[]).filter(i=>isRecordItem(i,t)).length} 項任內戰績')
  start=s.index('    if(t.kind!=="record")return`');end=s.index('})()}',start)
  s=s[:start]+'''    const policy=(t.items||[]).filter(i=>!isRecordItem(i,t)),record=(t.items||[]).filter(i=>isRecordItem(i,t));
    return [["政策與承諾",policy],["任內戰績",record]].filter(([,v])=>v.length).map(([k,v])=>`<h3 class="sec">${k}<span style="font-family:var(--f-mono);font-weight:400;margin-left:6px">${v.length}</span></h3><div class="rows">${v.map(row).join("")}</div>`).join("")'''+s[end:]
  s=s.replace('filter(i=>!q||JSON.stringify([i.name', 'filter(i=>!q||JSON.stringify([t.name,t.aliases]).toLowerCase().includes(q)||JSON.stringify([i.name')
  # Both search rows and detail rows carry a clear item-level provenance label.
  s=s.replace('${esc(i.name)}</span><span class="go">', '${esc(i.name)}<span class="sub">${isRecordItem(i,t)?"任內戰績":"政策與承諾"}${i.phase?" · "+esc(i.phase):""}</span></span><span class="go">')
  s=s.replace('${esc(i.name)}${i.who?', '${esc(i.name)}<span class="sub">${isRecordItem(i,t)?"任內戰績":"政策與承諾"}</span>${i.who?')
  path.write_text(s)
  path=stage/'3d/ui.js';s=path.read_text().replace('r.t.kind !== "record"','r.it.contentKind!=="record" && r.t.kind!=="record"');path.write_text(s)
  # Read the already solved campus rectangles instead of the previous grid allocation.
  path=stage/'tools/build_approved_city_art.py';s=path.read_text()
  s=replace(s,"import {createTaipeiCityPlan} from './taipei-city-layout.js?rev=2';","import {createPolicyDistrictPlan as createTaipeiCityPlan,plantPolicyDistrictLandscape} from './policy-district-layout-v044.js';\nimport {buildPolicyAmenities,buildPolicyCampus} from './policy-amenities-v044.js';")
  s=replace(s,"import {createRegionalCityPlan} from './regional-layout.js?rev=1';","import {createPolicyDistrictPlan as createRegionalCityPlan} from './policy-district-layout-v044.js';")
  s=s.replace("'./taipei-city-kit.js?rev=2'","'./v044-taipei-kit.js'").replace("'./taipei-city-life.js?rev=1'","'./v044-taipei-life.js'").replace("'./regional-life.js?rev=1'","'./v044-regional-life.js'")
  s=s.replace('const buildings=[...cityKit.records,...streetDetails.records];','const amenities=buildPolicyAmenities(art,scene,plan,reviewedFacades);streetDetails.records.push(...amenities.records);streetDetails.picks.push(...amenities.picks);\\nconst buildings=[...cityKit.records,...streetDetails.records];')
  marker="        output.append(f'async function build"
  at=s.index(marker);s=s[:at]+"        body=body.replace('plantTaipeiForest(art,coast)','plantPolicyDistrictLandscape(art,plan)').replace('.slice(0,8)','.slice(0,2)').replace('if(!streetDetails.policy(p))cityKit.policy(p);','buildPolicyCampus(art,scene,p,streetDetails,cityKit);')\n"+s[at:];path.write_text(s)
  # Let complete detailed policy buildings expand into their enlarged campus.
  s=(P/'detail-street-elements.js').read_text().replace('(p.usableD-padding*2)/s.z,1)','(p.usableD-padding*2)/s.z,1.8)').replace('root.scale.set(scale,1,scale)','root.scale.set(scale,Math.min(1.3,Math.sqrt(scale)),scale)')
  (stage/'prototypes/detail-street-elements-v044.js').write_text(s)
  path=stage/'prototypes/architecture-v041.js';path.write_text(path.read_text().replace("'./detail-street-elements.js?rev=1'","'./detail-street-elements-v044.js'"))
  # Retain the same residents/car models and density on the new perimeter loops.
  for old,new in [('taipei-city-life.js','v044-taipei-life.js'),('regional-life.js','v044-regional-life.js')]:
   s=(P/old).read_text().replace('Math.max(48,Math.min(84,walking.length*3))','84');(stage/'prototypes'/new).write_text(s)
  # A safety category has actual emergency facilities, not a generic office.
  s=(P/'taipei-city-kit.js').read_text();s=replace(s,"   case 'sports':",'''   case 'rescue':{
    h=wing(root,-w*.13,-d*.18,w*.75,d*.48,3,'#c5b89c','glass');for(const x of [-w*.29,-w*.07,w*.15])box('#a34e3d',x,1.5,d*.06,w*.18,2.8,.16,root);wing(root,-w*.35,-d*.22,w*.14,d*.24,6,'#bd9877');path(root,w*.12,d*.23,w*.66,d*.35);const truck=new THREE.Group();truck.position.set(w*.15,0,d*.22);root.add(truck);box('#b84f3d',0,1,0,2,1.8,5,truck);box(glass,0,1.3,2.54,1.8,.7,.08,truck);for(const x of [-1,1])for(const z of [-1.5,1.5])shape('cyl','#3c4746',x,.4,z,.35,.16,.35,truck).rotation.z=Math.PI/2;sign(root,'城市安全 · 應變',0,3.3,d*.06,w*.7);features.push('emergency-garage','response-center','training-tower');break;
   }
   case 'sports':''');(stage/'prototypes/v044-taipei-kit.js').write_text(s)
  # Near-review fallback still works after most ordinary buildings are removed.
  path=stage/'prototypes/greater-taipei-art-bridge.js';s=path.read_text().replace('const s=choices[0]||c.streetDetails.sites[0];','const s=choices[0]||c.streetDetails.sites[0]||{...c.themeMeta[0],rotation:0,parcel:c.themeMeta[0].id};');path.write_text(s)
  for name in ['build_greater_taipei_preserved.py','build_architecture_preview.py','build_mobile_opening_preview.py','build_mobile_panorama_preview.py']:
   subprocess.run([sys.executable,str(stage/'tools'/name)],cwd=stage,check=True)
  # Only new filenames leave the temporary tree.
  art=(stage/'prototypes/v041-art.js').read_text().replace("'./architecture-v041.js'","'./v044-architecture.js'")
  (P/'v044-art.js').write_text(art)
  for name in ['v044-taipei-kit.js','v044-taipei-life.js','v044-regional-life.js','detail-street-elements-v044.js']:(P/name).write_bytes((stage/'prototypes'/name).read_bytes())
  (P/'v044-architecture.js').write_bytes((stage/'prototypes/architecture-v041.js').read_bytes())
  (P/'v044-art-data.json').write_bytes((stage/'prototypes/v041-art-data.json').read_bytes())
  html=(stage/'prototypes/greater-taipei-v0.4.3.html').read_text().replace('v041-art.js?rev=1','v044-art.js?rev=1').replace('v041-art-data.json?rev=1','v044-art-data.json?rev=1').replace('v041-config.json','v044-config.json').replace('v041-2d.html','v044-2d.html').replace('revision:4.1','revision:4.4')
  html=html.replace('name="tpencore-preview-version" content="0.4.3"','name="tpencore-preview-version" content="0.4.4"',1).replace('手機全景視角預覽 v0.4.3','政策街區預覽 v0.4.4',1)
  (P/'greater-taipei-v0.4.4.html').write_text(html)
  page=(stage/'prototypes/v041-2d.html').read_text().replace('greater-taipei-v0.4.1.html','greater-taipei-v0.4.4.html');(P/'v044-2d.html').write_text(page)
  (P/'v044-config.json').write_bytes((stage/'prototypes/v041-config.json').read_bytes())
  (P/'v044-version.json').write_text(json.dumps({'preview_version':'0.4.4','base':'preview-v0.4.3','scope':'grouped-policy-records-larger-ring-campuses','entry':'greater-taipei-v0.4.4.html','audit':{d['city']['city']:d['districtAudit']for d in inputs},'status':'review-only'},ensure_ascii=False,indent=2)+'\n')
 print('Built isolated v0.4.4 grouped policy districts; previous pages/production untouched.')
if __name__=='__main__':build()
