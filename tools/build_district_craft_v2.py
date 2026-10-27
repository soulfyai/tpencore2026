"""Isolated art review; production modules and default camera are untouched."""
from pathlib import Path
import re
P=Path(__file__).resolve().parents[1]/'prototypes'
a=(P/'v049-art.js').read_text()
a="import {craftDistrict} from './district-craft-v2.js';\n"+a
a=a.replace("buildPolicyCampus(art,scene,p,streetDetails,cityKit);", "if(p.id==='tp-childcare')craftDistrict(art,scene,p,reviewedFacades,streetDetails);else buildPolicyCampus(art,scene,p,streetDetails,cityKit);",1)
(P/'district-craft-art-v2.js').write_text(a)
s=(P/'greater-taipei-v0.4.12.html').read_text().replace('./v049-art.js?rev=1','./district-craft-art-v2.js')
s=re.sub(r'<title>.*?</title>','<title>台北安可｜街區美術實作 v0.2.0・獨立預覽</title>',s,count=1)
css='''<style>.craft-review{position:fixed;bottom:36px;left:50%;transform:translateX(-50%);z-index:70;background:#f4f7f4ed;color:#17374d;padding:10px 14px;border-radius:12px;box-shadow:0 5px 25px #132d4530;text-align:center;max-width:94vw;width:max-content;font:12px system-ui}.craft-review p{margin:0 0 7px}.craft-review button{font:inherit;border:1px solid #b7c9d0;background:#f5f8fa;color:#20475b;border-radius:6px;padding:9px 12px;min-height:40px;margin:2px;cursor:pointer}.craft-review button:focus-visible{outline:3px solid #2996db}.craft-review button[aria-pressed=true]{background:#234d71;color:#fff}@media(max-width:600px){.craft-review{bottom:35px;padding:7px 9px;font-size:11px}.craft-review button{padding:7px 9px}}</style>'''
s=s.replace('</style>','</style>'+css,1)
# Preview-only warm daylight; retain night/live logic.
s=s.replace('const sourceSun=scene.children.find(o=>o.isDirectionalLight&&o.castShadow);',"if(ENV.mode==='day'){const h=scene.children.find(o=>o.isHemisphereLight);if(h){h.intensity=.9;h.color.set('#e6eff5');h.groundColor.set('#879268');}if(artSun){artSun.color.set('#ffe8bf');artSun.intensity=2.65;}}const sourceSun=scene.children.find(o=>o.isDirectionalLight&&o.castShadow);",1)

hook='''
const craftPanel=document.createElement('nav');craftPanel.className='craft-review';craftPanel.setAttribute('aria-label','美術樣板視角');craftPanel.innerHTML='<p>街區美術 v0.2.0｜湖岸親子街區・獨立預覽</p><button data-craft="front">街區構圖</button><button data-craft="rear">反向觀看</button><button data-craft="above">湖岸俯瞰</button><button data-craft="all">全市全景</button>';document.body.append(craftPanel);
function craftView(view){
 UI.dismissOverlays?.();document.querySelector('.hi-intro .hi-x')?.click();
 if(view==='all'){MAP3D.panorama();}else{
 const c=APPROVED_ART.cities.get('taipei'),p=c.plan.parcels.find(p=>p.id==='tp-childcare');
 const target=c.root.localToWorld(new THREE.Vector3(p.x,5,p.z+3));
 const delta={front:[5.5,6.5,7],rear:[-6,6,-7],above:[0,11,3]}[view];
 if(innerWidth<600)delta.forEach((v,i)=>delta[i]=v*1.25);
 MAP3D.enterCity('taipei');fly=null;controls.target.copy(target);camera.position.copy(target).add(new THREE.Vector3(...delta));controls.update();dirty=true;
 }
 for(const b of craftPanel.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.craft===view));
}
craftPanel.addEventListener('click',e=>{if(e.target.dataset.craft)craftView(e.target.dataset.craft)});
window.CRAFT_REVIEW={version:'0.2.0',view:craftView};ENV.setTimeMode('day');craftView('front');
'''
s=s.replace('}catch(err){console.error(err);window.cityLoadFailed();}',hook+'\n}catch(err){console.error(err);window.cityLoadFailed();}')
(P/'district-craft-v0.2.0.html').write_text(s)
print('Built isolated district craft v0.2.0')
