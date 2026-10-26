"""Build v0.4.7 bridge/junction art refinement without modifying v0.4.6."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[1];P=R/'prototypes'
def build():
 plan=json.loads((P/'v047-bridge-finishes.json').read_text())
 assert plan['source_sha256']==hashlib.sha256((P/'v044-art-data.json').read_bytes()).hexdigest()
 assert plan['transport_sha256']==hashlib.sha256((P/'v046-transport-plan.json').read_bytes()).hexdigest()
 s=(P/'greater-taipei-v0.4.6.html').read_text().replace("'./transport-network-v046.js'","'./transport-network-v047.js?rev=1'").replace('revision:4.6','revision:4.7')
 s=s.replace('const APPROVED_ART={','let bridgeJointReview=null;\nconst APPROVED_ART={',1)
 old='if(refitOverview){const frame=mobileTwoCityPanorama(o);fly=null;camera.position.copy(frame.pos);controls.target.copy(frame.target);controls.update();}'
 new='if(refitOverview){const frame=bridgeJointReview?APPROVED_ART.transport.jointFrame(camera,bridgeJointReview.id,bridgeJointReview.angle):mobileTwoCityPanorama(o);fly=null;camera.position.copy(frame.pos);controls.target.copy(frame.target);controls.update();}'
 assert old in s;s=s.replace(old,new,1)
 s=s.replace('content="0.4.6"','content="0.4.7"',1).replace('橋梁與海空交通預覽 v0.4.6','橋梁接岸美術修整預覽 v0.4.7',1)
 marker='}catch(err){console.error(err);window.cityLoadFailed();}'
 assert marker in s
 s=s.replace(marker,"const originalJointPanorama=MAP3D.panorama;MAP3D.panorama=(...args)=>{bridgeJointReview=null;return originalJointPanorama(...args);};controls.addEventListener('start',()=>{bridgeJointReview=null;});const jointView=new URLSearchParams(location.search);if(jointView.get('view')?.startsWith('joint-')){document.querySelector('.hi-intro .hi-x')?.click();UI.dismissOverlays?.();MAP3D.panorama();fly=null;bridgeJointReview={id:jointView.get('view').slice(6),angle:jointView.get('angle')||'shore'};const f=APPROVED_ART.transport.jointFrame(camera,bridgeJointReview.id,bridgeJointReview.angle);camera.position.copy(f.pos);controls.target.copy(f.target);controls.update();}\n"+marker,1)
 (P/'greater-taipei-v0.4.7.html').write_text(s)
 (P/'v047-version.json').write_text(json.dumps({'preview_version':'0.4.7','base':'preview-v0.4.6','scope':'four-bridge-landing-art-and-contact-refinement','entry':'greater-taipei-v0.4.7.html','landings':4,'boats':24,'aircraft':8,'status':'review-only'},ensure_ascii=False,indent=2)+'\n')
 print('Built isolated v0.4.7: four stitched bridge landings; previous previews/production retained.')
if __name__=='__main__':build()
