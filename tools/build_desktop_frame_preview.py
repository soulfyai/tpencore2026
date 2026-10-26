"""Isolated desktop panorama framing; preserve v047 and phone framing."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
p=R/'prototypes'
s=(p/'greater-taipei-v0.4.7.html').read_text()
frame='''function desktopReferencePanorama(){
 const points=[],box=new THREE.Box3();
 for(const id of ['taipei','newtaipei'])for(const [x,z] of WORLD.cities.get(id).coast){const p=new THREE.Vector3(x,0,z);points.push(p);box.expandByPoint(p);}
 const target=box.getCenter(new THREE.Vector3());target.y=.3;
 const direction=new THREE.Vector3(-1,.55,-.15).normalize(),probe=camera.clone();
 const fits=d=>{probe.position.copy(target).addScaledVector(direction,d);probe.lookAt(target);probe.updateMatrixWorld(true);return points.every(p=>{const q=p.clone().project(probe);return Math.abs(q.x)<.79&&q.y>-.72&&q.y<.48&&q.z<1;});};
 let lo=1,hi=box.getSize(new THREE.Vector3()).length()*3;
 for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(fits(mid))hi=mid;else lo=mid;}
 return {target,pos:target.clone().addScaledVector(direction,hi),dist:hi};
}
'''
s=s.replace('function overview() {',frame+'function overview() {\n  if(stage.clientWidth>860)return desktopReferencePanorama();',1)
s=s.replace('function home() { enterCity("taipei"); }','function home() { if(stage.clientWidth>860)panorama();else enterCity("taipei"); }',1)
old='{ const o=overview(),f=cityFrame("taipei");controls.maxDistance=o.dist;ENV.fit?.(o.dist);entered="taipei";camera.position.copy(f.pos);controls.target.copy(f.target);controls.update();stage.classList.remove("pano"); }'
new='{ const o=overview(),desktop=stage.clientWidth>860,f=desktop?o:cityFrame("taipei");controls.maxDistance=o.dist;ENV.fit?.(o.dist);entered=desktop?null:"taipei";camera.position.copy(f.pos);controls.target.copy(f.target);controls.update();stage.classList.toggle("pano",desktop); }'
assert old in s
s=s.replace(old,new,1).replace('content="0.4.7"','content="0.4.8"',1).replace('橋梁接岸美術修整預覽 v0.4.7','桌面全景視角預覽 v0.4.8',1)
(p/'greater-taipei-v0.4.8.html').write_text(s)
print('Built v0.4.8 desktop reference panorama')
if __name__=='__main__':pass
