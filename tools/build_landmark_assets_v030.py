"""GLB asset comparison in the approved city. Never modify v0.2.0 or production."""
from pathlib import Path
import re,shutil
R=Path(__file__).resolve().parents[1];P=R/'prototypes'
a=(P/'district-craft-art-v2.js').read_text()
a="import {installTaipei101Asset} from './landmark-assets-v030.js';\n"+a
a=a.replace('let builtLandmarks=0;','let builtLandmarks=0;let assetReview=null;',1)
a=a.replace('for(const l of landmarks){',"for(const l of landmarks){\n if(l.id==='t101'){assetReview=await installTaipei101Asset(scene,art,l,SCALE,landmarkGeometries);builtLandmarks++;continue;}",1)
a=a.replace('return {root:scene,art,plan,ponds,themeMeta,buildings,landmarks,life,','return {root:scene,assetReview,art,plan,ponds,themeMeta,buildings,landmarks,life,',1)
a=a.replace('landmarkFootprints(landmarkBuckets));','landmarkFootprints(landmarkBuckets).concat(assetReview?[assetReview.footprint]:[]));',1)
(P/'landmark-asset-art-v030.js').write_text(a)
s=(P/'district-craft-v0.2.0.html').read_text().replace('./district-craft-art-v2.js','./landmark-asset-art-v030.js')
s=re.sub(r'<title>.*?</title>','<title>台北安可｜地標模型美術 v0.3.0・新舊比較</title>',s,count=1)
start=s.index("const craftPanel=document.createElement('nav');")
end=s.index('}catch(err){console.error(err);window.cityLoadFailed();}',start)
hook='''
const craftPanel=document.createElement('nav');craftPanel.className='craft-review';craftPanel.setAttribute('aria-label','地標模型美術驗收');craftPanel.innerHTML='<p>模型美術 v0.3.0｜臺北 101・獨立預覽</p><button data-craft="full">地標全貌</button><button data-craft="facade">帷幕近看</button><button data-craft="podium">地面商場</button><button data-craft="compare" aria-pressed="false">對照原模型</button>';document.body.append(craftPanel);
const asset=APPROVED_ART.cities.get('taipei').assetReview;
function craftView(view){
 UI.dismissOverlays?.();document.querySelector('.hi-intro .hi-x')?.click();
 if(view==='compare'){asset.setOriginal(!asset.original);document.querySelector('[data-craft=compare]').textContent=asset.original?'切回新模型':'對照原模型';document.querySelector('[data-craft=compare]').setAttribute('aria-pressed',String(asset.original));if(artSun)artSun.shadow.needsUpdate=true;dirty=true;return;}
 const c=APPROVED_ART.cities.get('taipei'),l=c.landmarks.find(l=>l.id==='t101');
 const heights={full:.48,facade:.58,podium:.035};let target=c.root.localToWorld(new THREE.Vector3(l.x,l.height*heights[view],l.z));
 const delta={full:[17,11,21],facade:[3.7,2.0,4.5],podium:[3.7,2.6,4.5]}[view];if(innerWidth<600)delta.forEach((v,i)=>delta[i]=v*1.25);
 let fitBounds=null;if(view==='full'){fitBounds=new THREE.Box3().setFromObject(asset.root).union(new THREE.Box3().setFromObject(asset.old));fitBounds.max.y+=17/c.plan.scale;fitBounds.max.x+=13/c.plan.scale;target=fitBounds.getCenter(new THREE.Vector3());}
 MAP3D.enterCity('taipei');fly=null;controls.target.copy(target);camera.position.copy(target).add(new THREE.Vector3(...delta));controls.update();
 if(fitBounds){const top=Math.max(document.querySelector('.hi .brand')?.getBoundingClientRect().bottom||110,document.querySelector('.hi-toolbar')?.getBoundingClientRect().bottom||70)+12,bottom=craftPanel.getBoundingClientRect().top-14;
 for(let k=0;k<18;k++){camera.updateMatrixWorld(true);const points=[];for(const x of [fitBounds.min.x,fitBounds.max.x])for(const y of [fitBounds.min.y,fitBounds.max.y])for(const z of [fitBounds.min.z,fitBounds.max.z])points.push(new THREE.Vector3(x,y,z).project(camera));if(points.every(p=>(1-p.y)*innerHeight/2>=top&&(1-p.y)*innerHeight/2<=bottom&&(p.x+1)*innerWidth/2>=20&&(p.x+1)*innerWidth/2<=innerWidth-20))break;camera.position.sub(target).multiplyScalar(1.08).add(target);controls.update();}}
 dirty=true;
 for(const b of craftPanel.querySelectorAll('[data-craft]:not([data-craft=compare])'))b.setAttribute('aria-pressed',String(b.dataset.craft===view));
}
craftPanel.addEventListener('click',e=>{if(e.target.dataset.craft)craftView(e.target.dataset.craft)});
window.CRAFT_REVIEW={version:'0.3.0',view:craftView,asset};ENV.setTimeMode('day');craftView(new URLSearchParams(location.search).get('detail')==='facade'?'facade':'full');
'''
s=s[:start]+hook+s[end:]
(P/'landmark-art-v0.3.0.html').write_text(s)
# Keep local and hosted GLB paths identical; git tracks the canonical asset only.
(P/'assets/art-v030').mkdir(parents=True,exist_ok=True)
shutil.copy2(R/'assets/art-v030/taipei101-v1.glb',P/'assets/art-v030/taipei101-v1.glb')
print('Built isolated v0.3.0 GLB landmark comparison')
