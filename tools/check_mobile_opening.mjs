import * as THREE from '../node_modules/three/build/three.module.js';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const data=JSON.parse(fs.readFileSync(new URL('../prototypes/taipei-preview-data.json',import.meta.url))),source=fs.readFileSync(new URL('../prototypes/mobile-opening-v042.js',import.meta.url),'utf8');
const landmark=data.landmarks.find(l=>l.id==='t101');
for(const [w,h]of [[392,697],[375,667],[400,860],[430,740],[1000,760],[697,392]]){
 const box=new THREE.Box3();for(const [x,z]of data.coast)box.expandByPoint(new THREE.Vector3(x,0,z));box.expandByScalar(.8);
 const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()).setY(.3),aspect=w/h,camera=new THREE.PerspectiveCamera(32,aspect,.3,420);
 const span=Math.max(size.x/Math.max(aspect,.6),size.z)*1.05,dist=span/(2*Math.tan(THREE.MathUtils.degToRad(16)))*(aspect<1?1.25:1.1),base={target:center,pos:center.clone().add(new THREE.Vector3(0,.62,.79).normalize().multiplyScalar(dist)),dist};
 const fn=new Function('THREE','stage','camera','APPROVED_ART',source+';return mobileTaipeiOpening;')(THREE,{clientWidth:w,clientHeight:h},camera,{cities:new Map([['taipei',{landmarks:[{...landmark,x:landmark.x*14,z:landmark.z*14}],plan:{scale:14},root:{position:new THREE.Vector3()}}]])});
 const saved=JSON.stringify(base),frame=fn('taipei',base);assert.equal(JSON.stringify(base),saved);assert.equal(fn('newtaipei',base),base);
 if(w>600||w>=h){assert.equal(frame,base);console.log('PASS original desktop/landscape frame',w,h);continue;}
 camera.position.copy(frame.pos);camera.lookAt(frame.target);camera.updateMatrixWorld(true);
 const p=new THREE.Vector3(landmark.x,0,landmark.z).project(camera),x=p.x/2+.5,y=.5-p.y/2;
 assert.ok(Math.abs(x-.60)<.004&&Math.abs(y-.68)<.004,{w,h,x,y});assert.ok(frame.dist<base.dist*.8);
 console.log('PASS Taipei focus in lower middle, diagonal orbit and closer city view',w,h,x.toFixed(3),y.toFixed(3));
}
