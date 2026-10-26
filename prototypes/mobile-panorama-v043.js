// Full-map camera for portrait phones; the v0.4.2 Taipei opening stays separate.
function mobileTwoCityPanorama(base){
 const w=stage.clientWidth,h=stage.clientHeight;
 if(w>600||w>=h)return base;
 const points=[],cityBoxes=new Map();
 for(const id of ['taipei','newtaipei']){const city=WORLD.cities.get(id);if(!city)return base;const box=new THREE.Box3();for(const [x,z]of city.coast){const p=new THREE.Vector3(x,0,z);points.push(p);box.expandByPoint(p);}cityBoxes.set(id,box);}
 const combined=cityBoxes.get('taipei').clone().union(cityBoxes.get('newtaipei')),size=combined.getSize(new THREE.Vector3()),center=combined.getCenter(new THREE.Vector3());
 const taipei=cityBoxes.get('taipei'),taipeiSize=taipei.getSize(new THREE.Vector3()),taipeiCenter=taipei.getCenter(new THREE.Vector3());
 const aspect=w/Math.max(1,h),tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
 const target=new THREE.Vector3(center.x+size.x*.055,0,taipeiCenter.z+taipeiSize.z*.185),direction=new THREE.Vector3(0,.35,.94).normalize();
 let dist=size.x/(2*tangent*aspect)*1.12;
 const probe=new THREE.PerspectiveCamera(camera.fov,aspect,camera.near,camera.far);
 // Keep both actual shorelines within the reference framing on wider phones.
 for(let i=0;i<5;i++){probe.position.copy(target).addScaledVector(direction,dist);probe.lookAt(target);probe.updateMatrixWorld(true);let spill=1;
  for(const point of points){const p=point.clone().project(probe),x=.5+p.x*.5,y=.5-p.y*.5;spill=Math.max(spill,(.5-x)/.49,(x-.5)/.55,(y-.5)/.34);}
  if(spill<=1.005)break;dist*=Math.min(1.3,spill*1.01);
 }
 return {target,pos:target.clone().addScaledVector(direction,dist),dist};
}
function mobilePanoramaSignHeight(height){
 // Keep full-map signs below the logo, retaining their original font/box sizes.
 return entered===null&&stage.clientWidth<=600&&stage.clientWidth<stage.clientHeight?height*.90:height;
}
