import assert from 'node:assert/strict';
import {createOrganicDistrictLayout,inside,edgeDistance} from '../prototypes/organic-district.js';
const area=points=>Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
function roadDistance(point,points){let d=Infinity;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((point[0]-a.x)*dx+(point[1]-a.z)*dz)/(dx*dx+dz*dz)));d=Math.min(d,Math.hypot(point[0]-a.x-t*dx,point[1]-a.z-t*dz));}return d;}
for(let seed=20261000;seed<20261050;seed++){
 const layout=createOrganicDistrictLayout(seed),roads=layout.curves.map(c=>c.getPoints(200));
 assert.equal(layout.quarters.length,6);assert.equal(layout.ponds.length,4);
 assert(layout.quarters.some(q=>q.w>50&&q.volumes.length>=3));assert(layout.quarters.some(q=>q.volumes.some(v=>v.angle!==0)));
 for(const pond of layout.ponds){assert(area(pond.points)>45);assert(inside([pond.x,pond.z],pond.points));
  for(const point of pond.walk){assert(Math.abs(point[0])<119&&Math.abs(point[1])<130,`${pond.id} off coast`);
   for(const road of roads)assert(roadDistance(point,road)>5.25,`${pond.id} overlaps curved road`);
   for(const x of [-90,105])assert(Math.abs(point[0]-x)>5.6,`${pond.id} overlaps side road`);
   assert(point[1]>33.6||point[0]<-95.6,`${pond.id} overlaps northern grid`);
   for(const quarter of layout.quarters)for(const v of quarter.volumes){const dx=point[0]-v.x,dz=point[1]-v.z,c=Math.cos(v.angle),s=Math.sin(v.angle),x=c*dx-s*dz,z=s*dx+c*dz;assert(Math.abs(x)>v.w/2+.7||Math.abs(z)>v.d/2+.7,`${pond.id} overlaps ${quarter.id}`);}
  }
  for(const other of layout.ponds)if(other!==pond)assert(!other.walk.some(pt=>inside(pt,pond.walk)));
 }
}
const a=createOrganicDistrictLayout(),b=createOrganicDistrictLayout(),c=createOrganicDistrictLayout(123);
assert.deepEqual(a.ponds.map(p=>p.points),b.ponds.map(p=>p.points));assert.notDeepEqual(a.ponds.map(p=>p.points),c.ponds.map(p=>p.points));
console.log('PASS 50 seeded plans: stable organic lakes, different footprints, connected wings, road/building/coast clearance.');
