import * as THREE from 'three';
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.55});
const blue=mat('#56a9d1'),dark=mat('#527da9'),belly=mat('#c9eaf0'),eye=mat('#122837'),shine=mat('#ffffff'),pink=mat('#eea8ac');
function ell(parent,m,x,y,z,sx,sy,sz){const o=new THREE.Mesh(new THREE.SphereGeometry(1,20,12),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;}
function animal(whale){const g=new THREE.Group(),skin=whale?dark:blue;
 ell(g,skin,0,0,0,whale?.8:.43,whale?.62:.4,whale?1.5:1.08);
 ell(g,belly,0,-.25,.14,whale?.66:.34,.35,whale?1.18:.78);
 ell(g,skin,0,.02,whale?.88:1.08,whale?.63:.22,whale?.49:.16,whale?.65:.53);
 for(const sign of [-1,1]){const fin=ell(g,skin,sign*(whale?.86:.55),-.12,-.12,whale?.63:.4,.10,.27);fin.rotation.z=-sign*.3;
 ell(g,eye,sign*(whale?.58:.32),.21,whale?1.05:.7,.11,.13,.10);ell(g,shine,sign*(whale?.62:.35),.255,whale?1.10:.75,.035,.04,.035);
 ell(g,pink,sign*(whale?.68:.39),.02,whale?.94:.68,.08,.06,.10);
 const tail=ell(g,skin,sign*.38,.03,whale?-1.65:-1.2,.5,.12,.27);tail.rotation.y=sign*.35;}
 if(!whale){const fin=ell(g,skin,0,.43,-.3,.08,.35,.22);fin.rotation.x=-.3;}
 const smile=new THREE.CatmullRomCurve3([new THREE.Vector3(-.2,-.1,whale?1.48:1.5),new THREE.Vector3(0,-.18,whale?1.54:1.56),new THREE.Vector3(.2,-.1,whale?1.48:1.5)]);g.add(new THREE.Mesh(new THREE.TubeGeometry(smile,12,.018,5,false),eye));
 return g;
}
export function createMarineLife(root,lanes,waterY){
 const animals=[];
 for(let i=0;i<Math.min(8,lanes.length*2);i++){
 const lane=lanes[i%lanes.length],t=i<lanes.length?.28:.7,dx=lane.b[0]-lane.a[0],dz=lane.b[1]-lane.a[1],len=Math.hypot(dx,dz),whale=i%3===0,group=new THREE.Group();
 // Stay on already cleared open-water lanes; offset longitudinally from ship phase positions.
 const center=[lane.a[0]+dx*t,lane.a[1]+dz*t];group.position.set(center[0],waterY,center[1]);group.rotation.y=Math.atan2(dx,dz);root.add(group);
 const model=animal(whale);model.scale.setScalar(whale?1.55:1.35);group.add(model);
 const ringMat=new THREE.MeshBasicMaterial({color:'#d8f5f7',transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide});const ring=new THREE.Mesh(new THREE.RingGeometry(.88,1,40),ringMat);ring.rotation.x=-Math.PI/2;ring.position.y=.045;group.add(ring);
 const spray=new THREE.InstancedMesh(new THREE.SphereGeometry(.055,6,4),new THREE.MeshBasicMaterial({color:'#d5f6ff',transparent:true,opacity:.82,depthWrite:false}),28);spray.instanceMatrix.setUsage(THREE.DynamicDrawUsage);spray.frustumCulled=false;group.add(spray);
 group.name=whale?'cute-whale':'cute-dolphin';animals.push({group,model,ring,spray,whale,phase:i*3.73,period:whale?25:17,center});
 }
 const dummy=new THREE.Object3D();
 function update(clock,ships=[]){for(const a of animals){const cycle=((clock+a.phase)%a.period)/a.period,active=cycle<.36&&!ships.some(s=>Math.hypot(s.root.position.x-a.center[0],s.root.position.z-a.center[1])<5),u=cycle/.36;
 a.model.visible=active;a.spray.visible=active;a.ring.visible=active;
 if(!active)continue;
 if(a.whale){a.model.position.set(0,-1.4+Math.sin(Math.PI*u)*1.65,0);a.model.rotation.x=.07*Math.sin(u*Math.PI*2);}
 else{a.model.position.set(0,-1.1+Math.sin(Math.PI*u)*3.8,(u-.5)*3);a.model.rotation.x=-(1-2*u)*.85;}
 const splash=a.whale?(u>.25&&u<.8):(u<.16||u>.78);a.spray.visible=splash;
 a.ring.scale.setScalar(1+u*3);a.ring.material.opacity=.45*(1-u);
 for(let k=0;k<28;k++){const angle=k*2.39996,q=((u*2+k/28)%1),radius=(a.whale?.65:1.6)*q;dummy.position.set(Math.cos(angle)*radius,.1+(a.whale?3.2:1.15)*Math.sin(Math.PI*q),Math.sin(angle)*radius+(a.whale?.35:a.model.position.z));dummy.scale.setScalar(1-q*.65);dummy.updateMatrix();a.spray.setMatrixAt(k,dummy.matrix);}a.spray.instanceMatrix.needsUpdate=true;
 }}
 update(0);return {animals,update};
}
