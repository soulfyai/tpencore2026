import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createTaipeiCityPlan,POLICY_SCENES} from '../prototypes/taipei-city-layout.js';
import {createTaipeiRoutes} from '../prototypes/taipei-city-life.js';
import {planTaipeiWater,inside,edgeDistance} from '../prototypes/taipei-city-water.js';
const data=JSON.parse(fs.readFileSync(new URL('../prototypes/taipei-preview-data.json',import.meta.url))),before=JSON.stringify(data),plan=createTaipeiCityPlan(data),ponds=planTaipeiWater(plan);
assert.equal(JSON.stringify(data),before,'plan must not mutate source data');
const policies=plan.parcels.filter(p=>p.kind==='policy');assert.equal(policies.length,17);assert.equal(policies.filter(p=>p.theme.rec).length,8);
assert.equal(policies.reduce((s,p)=>s+p.theme.theme.items.length,0),62);assert.equal(plan.landmarks.length,16);assert.equal(ponds.length,4);assert(plan.removedInternal>=20);
assert.deepEqual(policies.map(p=>p.id).sort(),Object.keys(POLICY_SCENES).sort());
assert.equal(policies.find(p=>p.id==='tp-health').sceneKind,'health');assert(policies.find(p=>p.id==='tp-health').sceneNote.includes('檢驗'));
const used=new Set();for(const p of plan.parcels){for(const c of p.cells){assert(!used.has(c),'double-booked cell '+c);used.add(c);}assert(p.usableW>17&&p.usableD>17);for(const l of plan.landmarks){const distance=Math.hypot(Math.max(0,Math.abs(p.x-l.x)-p.usableW/2),Math.max(0,Math.abs(p.z-l.z)-p.usableD/2));assert(distance>l.r,`${p.id} overlaps ${l.id}`);}}
function distance(point,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dz);}
for(const pond of ponds){assert(inside([pond.x,pond.z],pond.points));for(const p of pond.walk){assert(inside(p,plan.coast));assert(Math.abs(p[0]-pond.x)<pond.usableW/2&&Math.abs(p[1]-pond.z)<pond.usableD/2);for(const road of plan.roads)assert(distance(p,road.a,road.b)>3.5,'lake bank intersects a road');}}
assert(plan.parcels.filter(p=>p.cells.length>1).length>=20);
console.log(`PASS ${policies.length} source-backed policy groups, 16 landmark clearances, 4 real lakes, ${plan.removedInternal} internal roads merged, unique parcels and unchanged source data.`);

const routes=createTaipeiRoutes({...plan,ponds});assert(routes.filter(r=>r.kind==='drive').length>20);assert(routes.some(r=>r.surface==='lake-path'));
for(const route of routes.filter(r=>r.kind==='drive'))for(let i=0;i<64;i++){const point=route.curve.getPointAt(i/64),d=Math.min(...plan.roads.filter(r=>!r.pedestrian).map(r=>distance([point.x,point.z],r.a,r.b)));assert(d<2.25,'vehicle leaves asphalt at a corner');}
console.log('PASS real road and lakeside walking circuits; car corner clearance stays on retained asphalt.');
