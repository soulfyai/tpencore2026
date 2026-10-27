import * as THREE from 'three';
import {loadReviewAircraft} from './review-models.js?rev=1';
export function inside(p,poly){let on=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])on=!on;}return on;}
function edgeDistance(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}
export function makeSeaLanes(polys,obstacles=[],bridges=[]){
 const pts=polys.flat(),xs=pts.map(p=>p[0]),zs=pts.map(p=>p[1]),center=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2],radius=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs))*.6;
 // View-relative diagonals for the approved default: upper-left / lower-right and its crossing diagonal.
 const lanes=[];
 for(const raw of [[1.65,-.35],[.35,1.65]]){const n=Math.hypot(...raw),d=raw.map(v=>v/n),side=[-d[1],d[0]];
 for(const offset of [-1.5,-1.2,-.95,-.7,.7,.95,1.2,1.5]){const mid=center.map((v,i)=>v+side[i]*radius*offset),a=mid.map((v,i)=>v-d[i]*radius*2.4),b=mid.map((v,i)=>v+d[i]*radius*2.4);
 const clear=Array.from({length:241},(_,k)=>a.map((v,i)=>v+(b[i]-v)*k/240)).every(p=>!polys.some(poly=>inside(p,poly)||poly.some((v,i)=>edgeDistance(p,v,poly[(i+1)%poly.length])<2))&&!bridges.some(b=>edgeDistance(p,b.a,b.b)<2)&&!obstacles.some(o=>Math.hypot(p[0]-o.x,p[1]-o.z)<o.radius+2));
 if(clear)lanes.push({a,b});}}
 return {lanes,center,radius};
}
export async function createRemoteTraffic(root,cities,plan,ships,random,waterY){
 const polys=[...cities.values()].map(c=>c.plan.coast.map(p=>[p[0]/14+c.root.position.x,p[1]/14+c.root.position.z]));
 const layout=makeSeaLanes(polys,plan.seaObstacles||[],plan.bridges||[]),actors=[],vessels=[],planes=[];
 for(let i=0;i<layout.lanes.length;i++){const lane=layout.lanes[i];for(let j=0;j<2;j++){const kind=['ferry','container','yacht','fishing','tug'][i%5],sample=plan.boats.find(v=>v.kind===kind)||plan.boats[0],model=ships.make(kind,random(810+i*7+j));model.scale.setScalar(sample.scale);root.add(model);const actor={root:model,lane,phase:(i*.381966+j*.5)%1,speed:.35+i%3*.04,height:waterY-.04,reverse:(i+j)%2===1};actors.push(actor);vessels.push(actor);}}
 const ceiling=Math.max(...[...cities.values()].map(c=>Math.max(...c.landmarks.map(l=>l.height),...c.buildings.map(b=>b.height))/14))+8;
 for(let i=0;i<12;i++){const angle=-.21+(i%3)*Math.PI/3,d=[Math.cos(angle),Math.sin(angle)],side=[-d[1],d[0]],mid=layout.center.map((v,k)=>v+side[k]*(Math.floor(i/3)-1.5)*layout.radius*.5),lane={a:mid.map((v,k)=>v-d[k]*layout.radius*2.8),b:mid.map((v,k)=>v+d[k]*layout.radius*2.8)},model=await loadReviewAircraft();model.scale.setScalar(.62);root.add(model);const actor={root:model,lane,phase:(i*.618)%1,speed:1.8+(i%3)*.2,height:ceiling+(i%4)*2.2,reverse:i%2===1};actors.push(actor);planes.push(actor);}
 function update(clock){for(const a of actors){let t=(a.phase+clock*a.speed/Math.hypot(a.lane.b[0]-a.lane.a[0],a.lane.b[1]-a.lane.a[1]))%1;if(a.reverse)t=1-t;const p=a.lane.a.map((v,i)=>v+(a.lane.b[i]-v)*t);a.root.position.set(p[0],a.height,p[1]);a.root.rotation.y=Math.atan2(a.lane.b[0]-a.lane.a[0],a.lane.b[1]-a.lane.a[1])+(a.reverse?Math.PI:0);a.root.visible=t>.025&&t<.975;}}
 update(0);return {vessels,planes,lanes:layout.lanes,update};
}
