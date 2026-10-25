import * as THREE from 'three';

function roundedLoop(minX,minZ,maxX,maxZ,r){const path=new THREE.CurvePath(),p=(x,z)=>new THREE.Vector3(x,0,z);const line=(a,b)=>path.add(new THREE.LineCurve3(p(...a),p(...b))),turn=(a,b,c)=>path.add(new THREE.QuadraticBezierCurve3(p(...a),p(...b),p(...c)));
 line([minX+r,minZ],[maxX-r,minZ]);turn([maxX-r,minZ],[maxX,minZ],[maxX,minZ+r]);line([maxX,minZ+r],[maxX,maxZ-r]);turn([maxX,maxZ-r],[maxX,maxZ],[maxX-r,maxZ]);line([maxX-r,maxZ],[minX+r,maxZ]);turn([minX+r,maxZ],[minX,maxZ],[minX,maxZ-r]);line([minX,maxZ-r],[minX,minZ+r]);turn([minX,minZ+r],[minX,minZ],[minX+r,minZ]);return path;}
export function createTaipeiRoutes(plan){
 const step=plan.scale*1.8,routes=[];
 function edgeExists(a,b,vehicle){return plan.roads.some(rd=>(!vehicle||!rd.pedestrian)&&((Math.hypot(rd.a[0]-a[0],rd.a[1]-a[1])<.02&&Math.hypot(rd.b[0]-b[0],rd.b[1]-b[1])<.02)||(Math.hypot(rd.b[0]-a[0],rd.b[1]-a[1])<.02&&Math.hypot(rd.a[0]-b[0],rd.a[1]-b[1])<.02)));}
 function hasPerimeter(p,vehicle){for(const [a,b] of [[[p.x-p.w/2,p.z-p.d/2],[p.x+p.w/2,p.z-p.d/2]],[[p.x+p.w/2,p.z-p.d/2],[p.x+p.w/2,p.z+p.d/2]],[[p.x+p.w/2,p.z+p.d/2],[p.x-p.w/2,p.z+p.d/2]],[[p.x-p.w/2,p.z+p.d/2],[p.x-p.w/2,p.z-p.d/2]]]){const count=Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/step);for(let i=0;i<count;i++){const A=a.map((v,j)=>v+(b[j]-v)*i/count),B=a.map((v,j)=>v+(b[j]-v)*(i+1)/count);if(!edgeExists(A,B,vehicle))return false;}}return true;}
 for(const p of plan.parcels){if(!hasPerimeter(p,false))continue;const walk=roundedLoop(p.x-p.w/2+2.9,p.z-p.d/2+2.9,p.x+p.w/2-2.9,p.z+p.d/2-2.9,.8);routes.push({id:p.id,kind:'walk',curve:walk,length:walk.getLength()});if(hasPerimeter(p,true)){for(const inset of [-.9,.9]){const curve=roundedLoop(p.x-p.w/2+inset,p.z-p.d/2+inset,p.x+p.w/2-inset,p.z+p.d/2-inset,1.5);routes.push({id:p.id,kind:'drive',direction:inset>0?-1:1,curve,length:curve.getLength()});}}}
 for(const p of plan.ponds||[]){if(!p.path)continue;const points=p.bank.map((a,i)=>new THREE.Vector3((a[0]+p.walk[i][0])/2,0,(a[1]+p.walk[i][1])/2)),curve=new THREE.CatmullRomCurve3(points,true,'centripetal');routes.push({id:p.id,kind:'walk',surface:'lake-path',curve,length:curve.getLength()});}
 return routes;
}
export function createTaipeiLife(art,scene,plan){
 const routes=createTaipeiRoutes(plan),cars=[],people=[],templates=new Map(),buckets=new Map(),dummy=new THREE.Object3D();let clock=0,enabled=true,lastClock=NaN;
 function source(kind,index){const key=kind+index;if(templates.has(key))return templates.get(key);let root;
  if(kind==='car')root=art.car(0,0,['#c7d4d5','#d1b783','#8ba8b3','#aa856e'][index%4]);
  else{const shirts=['#79a9bd','#c5ad87','#a8bb9d','#b28d7e','#739499','#dec179'];root=art.person(0,0,1,shirts[index%6],'#82928e',index===4?'#c0c3b2':'#574534',index===5?'wave':'idle');if(index===4){art.line('#9b835f',[.48,.75,.1],[.48,.05,.35],.035,root);}}
  root.updateMatrixWorld(true);const parts=[];root.traverse(o=>{if(!o.isMesh)return;const local=o.matrixWorld.clone(),arm=o.parent!==root&&Math.abs(o.parent.position.x)>.3&&Math.abs(o.parent.position.y-1.08)<.01;let swing=arm?Math.sign(o.parent.position.x):0;const leg=!arm&&o.parent===root&&Math.abs(o.position.x)>.1&&Math.abs(o.position.x)<.25&&o.position.y<.6;if(leg)swing=-Math.sign(o.position.x);parts.push({geometry:o.geometry,material:o.material,local,swing,pivot:arm?new THREE.Vector3(o.parent.position.x,1.08+root.position.y,0):new THREE.Vector3(o.position.x,.5+root.position.y,0)});});root.removeFromParent();templates.set(key,parts);return parts;
 }
 const walking=routes.filter(r=>r.kind==='walk'),driving=routes.filter(r=>r.kind==='drive');
 for(let i=0;i<Math.min(26,driving.length);i++){const route=driving[i];cars.push({kind:'car',route,phase:(i*.271)%1,speed:5.7+(i%4)*.6,scale:1,variant:i%4,position:new THREE.Vector3()});}
 for(let i=0;i<Math.max(48,Math.min(84,walking.length*3));i++){const route=walking[i%walking.length];if(!route)break;people.push({kind:'person',route,phase:(i*.381966)%1,speed:.95+(i%4)*.16,scale:i%9===0?.62:.83+(i%3)*.07,variant:i%6,position:new THREE.Vector3()});}
 // Families also occupy the actual childcare forecourt; a smaller child never looks adult-sized.
 const childcare=plan.parcels.find(p=>p.id==='tp-childcare'),care=plan.parcels.find(p=>p.id==='tp-senior');
 for(const [p,variant,scale,dx,dz] of [[childcare,0,.95,0,3],[childcare,5,.6,1.6,3.2],[childcare,1,.9,-2.3,2.3],[care,4,.85,1.2,4],[care,2,.93,-1.1,3]])people.push({kind:'person',fixed:true,phase:0,variant,scale,position:new THREE.Vector3(p.x+dx,0,p.z+dz)});
 const agents=[...cars,...people];
 for(const agent of agents){for(const part of source(agent.kind,agent.variant)){const key=part.geometry.uuid+'/'+part.material.uuid;if(!buckets.has(key))buckets.set(key,{geometry:part.geometry,material:part.material,entries:[]});buckets.get(key).entries.push({agent,part});}}
 for(const bucket of buckets.values()){bucket.mesh=new THREE.InstancedMesh(bucket.geometry,bucket.material,bucket.entries.length);bucket.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);bucket.mesh.castShadow=true;bucket.mesh.receiveShadow=true;bucket.mesh.frustumCulled=false;bucket.mesh.userData.keepDynamic=true;scene.add(bucket.mesh);}
 const pivot=new THREE.Matrix4(),rotation=new THREE.Matrix4(),inverse=new THREE.Matrix4(),local=new THREE.Matrix4(),world=new THREE.Matrix4();
 function update(delta=0){if(enabled)clock+=Math.max(0,Math.min(delta,.1));if(clock===lastClock)return;lastClock=clock;for(const agent of agents){if(!agent.fixed){const direction=agent.route.direction||1,t=((agent.phase+clock*agent.speed/agent.route.length*direction)%1+1)%1;agent.position.copy(agent.route.curve.getPointAt(t));const tangent=agent.route.curve.getTangentAt(t).multiplyScalar(direction);agent.heading=Math.atan2(tangent.x,tangent.z);}dummy.position.copy(agent.position);dummy.rotation.set(0,agent.heading||.3,0);dummy.scale.setScalar(agent.scale);dummy.updateMatrix();(agent.matrix||=new THREE.Matrix4()).copy(dummy.matrix);}
  for(const bucket of buckets.values()){for(let i=0;i<bucket.entries.length;i++){const {agent,part}=bucket.entries[i];local.copy(part.local);if(part.swing&&!agent.fixed){const angle=Math.sin(clock*6+agent.phase*15)*.28*part.swing;rotation.makeRotationX(angle);pivot.makeTranslation(part.pivot.x,part.pivot.y,part.pivot.z);inverse.makeTranslation(-part.pivot.x,-part.pivot.y,-part.pivot.z);local.premultiply(pivot.multiply(rotation).multiply(inverse));}bucket.mesh.setMatrixAt(i,world.multiplyMatrices(agent.matrix,local));}bucket.mesh.instanceMatrix.needsUpdate=true;}
 }
 update(0);
 return {people,cars,routes,batches:buckets.size,update,get clock(){return clock;},get enabled(){return enabled;},setEnabled(value){enabled=!!value;},advance(seconds){for(let t=0;t<seconds;t+=.05)update(Math.min(.05,seconds-t));}};
}
