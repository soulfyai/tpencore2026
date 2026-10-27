import * as THREE from 'three';
import {inside} from './remote-traffic-v0410.js';
import {loadReviewAircraft} from './review-models.js?rev=1';
import {createMarineLife} from './marine-life-v0411.js';
export function panoramaWaterPoints(camera,waterY,polys,obstacles=[]){
 const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-waterY),out=[];
 const distance=(p,a,b)=>{const x=b[0]-a[0],z=b[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*x+(p.z-a[1])*z)/(x*x+z*z||1)));return Math.hypot(p.x-a[0]-t*x,p.z-a[1]-t*z);};
 for(const [x,y]of [[.83,.75],[.72,.82],[.91,.64],[.64,.9],[.91,.89],[.78,.62],[.6,.75],[.86,.53],[.72,.94],[.96,.78]]){
 ray.setFromCamera(new THREE.Vector2(x*2-1,1-y*2),camera);const p=ray.ray.intersectPlane(plane,new THREE.Vector3());if(!p)continue;
 if(polys.some(poly=>inside([p.x,p.z],poly)||poly.some((a,i)=>distance(p,a,poly[(i+1)%poly.length])<5)))continue;
 if(obstacles.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<o.radius+5)||out.some(q=>q.distanceTo(p)<6))continue;out.push(p);
 }return out;
}
export async function createPanoramaLife(scene,cities,plan,ships,rng,waterY,camera){
 const polys=[...cities.values()].map(c=>c.plan.coast.map(p=>[p[0]/14+c.root.position.x,p[1]/14+c.root.position.z])),points=panoramaWaterPoints(camera,waterY,polys,plan.seaObstacles||[]),root=new THREE.Group();root.name='panorama-lower-right-life';scene.add(root);
 const boats=[],planes=[],boatCount=Math.min(5,Math.max(1,points.length-3));
 for(let i=0;i<boatCount;i++){const kind=['ferry','yacht','container','fishing','tug'][i],source=plan.boats.find(b=>b.kind===kind),model=ships.make(kind,rng(923+i));model.scale.setScalar(source.scale);root.add(model);boats.push({root:model,center:points[i],phase:i*1.7});}
 for(let i=0;i<3&&points.length;i++){const model=await loadReviewAircraft();model.scale.setScalar(.68);root.add(model);planes.push({root:model,center:points[(i+2)%points.length],phase:i*2.1,height:5+i*1.8});}
 const lanes=points.slice(boatCount).map(p=>({a:[p.x,p.z-1],b:[p.x,p.z+1]})),marine=createMarineLife(root,lanes,waterY);
 function update(clock,otherShips=[]){for(const b of boats){const a=b.phase+clock*.075;b.root.position.set(b.center.x+Math.cos(a)*1.6,waterY-.04,b.center.z+Math.sin(a)*1.6);b.root.rotation.y=Math.atan2(-Math.sin(a),Math.cos(a));}
 for(const p of planes){const a=p.phase+clock*.085;p.root.position.set(p.center.x+Math.cos(a)*6,waterY+p.height,p.center.z+Math.sin(a)*4);p.root.rotation.y=Math.atan2(-6*Math.sin(a),4*Math.cos(a));}
 marine.update(clock+2,[...otherShips,...boats]);}
 update(0);return {root,points,boats,planes,marine,update};
}
