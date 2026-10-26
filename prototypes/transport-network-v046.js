import * as THREE from 'three';
import {loadReviewAircraft} from './review-models.js?rev=1';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function deckHeight(b,f){return .018+(b.deck-.018)*smooth(Math.min(f,1-f)*b.length/b.ramp);}
export function deckWidth(b,f){return .34+(b.width-.34)*smooth(Math.min(f,1-f)*b.length/1.3);}
export function routePoint(r,a){return [0,1].map(i=>r.center[i]+r.tangent[i]*Math.cos(a)*r.length+r.out[i]*Math.sin(a)*.45);}
export async function buildTransportNetwork(scene,cities,plan,ships,random,waterY){
 const root=new THREE.Group();root.name='reviewed-bridges-and-traffic-v046';scene.add(root);
 const materials=new Map(),bridges=[],vessels=[],planes=[],cars=[];let clock=0;
 const mat=(color,glow=false)=>{const key=color+glow;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.08,...(glow?{emissive:color,emissiveIntensity:.65}:{})}));return materials.get(key);};
 function box(g,c,x,y,z,w,h,d,ry=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=m.receiveShadow=true;g.add(m);return m;}
 function rod(g,c,a,b,r=.02){const dir=b.clone().sub(a),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,dir.length(),7),mat(c));m.position.copy(a.clone().add(b).multiplyScalar(.5));m.quaternion.setFromUnitVectors(V(0,1,0),dir.normalize());m.castShadow=true;g.add(m);return m;}
 function tube(g,c,pts,r){const curve=new THREE.CatmullRomCurve3(pts),m=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(32,pts.length*3),r,7,false),mat(c));m.castShadow=true;g.add(m);return m;}
 const carArt=cities.get('taipei').art;
 for(const b of plan.bridges){const g=new THREE.Group();g.name=b.name;root.add(g);const ux=(b.b[0]-b.a[0])/b.length,uz=(b.b[1]-b.a[1])/b.length,nx=-uz,nz=ux;
  const at=(f,y=deckHeight(b,f),side=0)=>V(b.a[0]+ux*b.length*f+nx*side,y,b.a[1]+uz*b.length*f+nz*side);
  const N=Math.ceil(b.length/.2),pos=[],idx=[];const width=f=>deckWidth(b,f);
  for(let k=0;k<=N;k++){const f=k/N,w=width(f)/2;for(const y of [deckHeight(b,f),deckHeight(b,f)-.10])for(const side of [-w,w])pos.push(...at(f,y,side).toArray());if(k<N){const i=k*4;idx.push(i,i+4,i+1,i+1,i+4,i+5,i+2,i+3,i+6,i+3,i+7,i+6,i,i+2,i+4,i+2,i+6,i+4,i+1,i+5,i+3,i+3,i+5,i+7);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const deck=new THREE.Mesh(geo,mat('#657176'));deck.receiveShadow=deck.castShadow=true;g.add(deck);
  for(const side of [-1,1]){const pts=Array.from({length:N+1},(_,k)=>{const f=k/N;return at(f,deckHeight(b,f)+.12,side*width(f)/2);});tube(g,'#dddcc9',pts,.018);for(let k=0;k<=N;k+=5){const f=k/N;rod(g,'#bec8c3',at(f,deckHeight(b,f)+.015,side*width(f)/2),at(f,deckHeight(b,f)+.12,side*width(f)/2),.009);}}
  for(let k=1;k<N;k+=3){const f=k/N,p=at(f,deckHeight(b,f)+.012);box(g,'#efe5c5',p.x,p.y,p.z,.018,.009,.19,Math.atan2(ux,uz));}
  for(let k=1;k<10;k++){const f=k/10,side=k%2?-.27:.27,p=at(f,deckHeight(b,f),side);rod(g,'#657772',p,p.clone().add(V(0,.42,0)),.014);const light=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),mat('#e7ce96',true));light.position.copy(p).y+=.43;g.add(light);}
  const supports=[];
  if(b.kind==='red-arch'){
   for(let span=0;span<3;span++){const lo=.14+span*.24,hi=lo+.24,ah=Math.min(1.9,b.length*.24*.3);for(const side of [-.245,.245]){const pts=Array.from({length:33},(_,k)=>at(lo+(hi-lo)*k/32,b.deck+.12+Math.sin(Math.PI*k/32)*ah,side));tube(g,'#cc4d3d',pts,.055);for(let k=1;k<12;k++){const f=lo+(hi-lo)*k/12,top=b.deck+.12+Math.sin(Math.PI*k/12)*ah;rod(g,'#d48a73',at(f,b.deck+.05,side),at(f,top,side),.012);if(k%3===0)rod(g,'#bb493d',at(f,top,-.245),at(f,top,.245),.026);}}
    supports.push(lo,hi);
   }
  }else{
   const f=.43,H=4.8;const pts=[at(f,b.deck,-.20),at(f-.005,b.deck+1.6,-.12),at(f-.022,b.deck+3.5,0),at(f-.045,b.deck+H,.025)];tube(g,'#eee9da',pts,.075);rod(g,'#dddccf',at(f,b.deck,.20),at(f-.008,b.deck+2.0,0),.06);supports.push(f);
   for(const side of [-.22,.22])for(const dir of [-1,1])for(let k=1;k<=12;k++){const end=f+dir*k*.031;if(end<.08||end>.92)continue;rod(g,'#d8e1dc',at(f-.042,b.deck+H-k*.035,side*.08),at(end,b.deck+.05,side),.008);}
   const tip=at(f-.045,b.deck+H+.12,.025),beacon=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),mat('#df755b',true));beacon.position.copy(tip);g.add(beacon);
  }
  for(const f of new Set([...supports,.07,.93])){const p=at(f,0);box(g,'#bfbcae',p.x,(waterY+b.deck)/2-.08,p.z,.28,b.deck-waterY,.45,Math.atan2(ux,uz));}
  for(let k=0;k<8;k++){const model=carArt.car(0,0,['#d0dbd7','#b68f70','#7292a0','#e4d9b8'][k%4]);model.removeFromParent();model.scale.setScalar(1/14);root.add(model);cars.push({root:model,bridge:b,at,phase:k/8,dir:k%2?1:-1});}
  bridges.push({...b,root:g,at,top:b.deck+(b.kind==='single-pylon'?4.95:Math.min(1.9,b.length*.24*.3)+.2)});
 }
 for(const r of plan.boats){const model=ships.make(r.kind,random(r.id.length*113+vessels.length));model.name=r.id;model.scale.setScalar(r.scale);model.userData.keepDynamic=true;root.add(model);
  const wake=new THREE.Group();wake.name='moving-wake';const points=[V(-.24,.06,-.65),V(-.65,.06,-1.4),V(.24,.06,-.65),V(.65,.06,-1.4)];const mesh=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#d9eee5',transparent:true,opacity:.55,depthWrite:false}));wake.add(mesh);model.add(wake);
  vessels.push({...r,root:model,wake});
 }
 for(const [city,c]of cities){const xs=c.plan.coast.map(p=>p[0]/14+c.root.position.x),zs=c.plan.coast.map(p=>p[1]/14+c.root.position.z),cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2,rx=(Math.max(...xs)-Math.min(...xs))*.57,rz=(Math.max(...zs)-Math.min(...zs))*.57;
  const ceiling=Math.max(...c.landmarks.map(l=>l.height),...c.buildings.map(v=>v.height))/14+15.8/14;
  for(let i=0;i<4;i++){const model=await loadReviewAircraft();model.name=city+'-flight-'+i;model.scale.setScalar([.58,.66,.72,.62][i]);model.userData.keepDynamic=true;root.add(model);planes.push({root:model,city,cx,cz,rx,rz,phase:i*Math.PI/2+.32+(city==='taipei'?0:.45),height:ceiling+2.6+i*.9,speed:.022+i*.002,ceiling});}
 }
 function update(dt=0,time=0,moving=false){if(moving)clock+=Math.max(0,Math.min(.1,dt));
  for(const v of vessels){const a=v.phase+clock*v.speed,p=routePoint(v,a),dx=-v.tangent[0]*Math.sin(a)*v.length+v.out[0]*Math.cos(a)*.45,dz=-v.tangent[1]*Math.sin(a)*v.length+v.out[1]*Math.cos(a)*.45;v.root.position.set(p[0],waterY-.04+(moving?Math.sin(clock*1.3+v.phase)*.012:0),p[1]);v.root.rotation.set(moving?Math.sin(clock+v.phase)*.012:0,Math.atan2(dx,dz),0);v.wake.visible=moving;}
  for(const p of planes){const a=p.phase+clock*p.speed;p.root.position.set(p.cx+Math.cos(a)*p.rx,p.height,p.cz+Math.sin(a)*p.rz);p.root.rotation.set(0,Math.atan2(-Math.sin(a)*p.rx,Math.cos(a)*p.rz),-.025*Math.sin(a));}
  for(const c of cars){const f=((c.phase+clock*.013*c.dir)%1+1)%1,p=c.at(f,deckHeight(c.bridge,f)+.025,c.dir*Math.min(.105,deckWidth(c.bridge,f)/2-.094));c.root.position.copy(p);c.root.rotation.y=Math.atan2(c.bridge.b[0]-c.bridge.a[0],c.bridge.b[1]-c.bridge.a[1])+(c.dir<0?Math.PI:0);const f2=Math.min(1,Math.max(0,f+.002*c.dir));c.root.rotation.x=-Math.atan2(deckHeight(c.bridge,f2)-deckHeight(c.bridge,f),Math.abs(f2-f)*c.bridge.length);}
 }
 function frame(camera,id=null){const selected=bridges.filter(b=>!id||b.id===id),box=new THREE.Box3();for(const b of selected){box.expandByPoint(V(b.a[0],waterY,b.a[1]));box.expandByPoint(V(b.b[0],b.top,b.b[1]));}const target=box.getCenter(new THREE.Vector3());target.y=.7;const corners=[];for(const b of selected){const nx=-(b.b[1]-b.a[1])/b.length,nz=(b.b[0]-b.a[0])/b.length;for(const p of [b.a,b.b])for(const y of [waterY,b.top])for(const side of [-.32,.32])corners.push(V(p[0]+nx*side,y,p[1]+nz*side));}const probe=camera.clone(),dir=(camera.aspect<.8?V(.6,.9,1):V(1,.75,.15)).normalize(),size=box.getSize(new THREE.Vector3()).length();const fits=distance=>{probe.position.copy(target).addScaledVector(dir,distance);probe.lookAt(target);probe.updateMatrixWorld(true);return corners.every(p=>{const q=p.clone().project(probe);return q.z>-1&&q.z<1&&Math.abs(q.x)<.82&&Math.abs(q.y)<.74;});};let low=size*.25,high=size*2;while(!fits(high))high*=1.4;for(let i=0;i<35;i++){const mid=(low+high)/2;if(fits(mid))high=mid;else low=mid;}return {target,pos:target.clone().addScaledVector(dir,high*1.015)};}

 update();return {root,bridges,vessels,planes,cars,update,frame,get clock(){return clock;}};
}
