import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createTaipeiCityPlan} from '../prototypes/taipei-city-layout.js';
import {createRoadSurfacePlan} from '../prototypes/taipei-city-roads.js';
const crossing=[{a:[-20,0],b:[20,0],pedestrian:false},{a:[0,-20],b:[0,20],pedestrian:false}];
const cross=createRoadSurfacePlan(crossing);
assert(Math.abs(cross.asphaltArea-(40.15*4.8*2-4.8**2))<1e-6,'crossroads must be a union, not stacked rectangles');
function check(plan){let area=0;for(let i=0;i<plan.faces.length;i++){const a=plan.faces[i];area+=(a.x1-a.x0)*(a.z1-a.z0);for(let j=i+1;j<plan.faces.length;j++){const b=plan.faces[j];assert(Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0)<1e-7||Math.min(a.z1,b.z1)-Math.max(a.z0,b.z0)<1e-7,'road/sidewalk surfaces overlap');}}
 let cells=0;for(let j=0;j<plan.nz;j++)for(let i=0;i<plan.nx;i++)if(plan.cells[j*plan.nx+i])cells+=(plan.xs[i+1]-plan.xs[i])*(plan.zs[j+1]-plan.zs[j]);assert(Math.abs(area-cells)<1e-5,'greedy faces left gaps');
 assert(plan.markings.some(m=>m.kind==='center'));
}
check(cross);
const data=JSON.parse(fs.readFileSync(new URL('../prototypes/taipei-preview-data.json',import.meta.url))),city=createTaipeiCityPlan(data),plan=createRoadSurfacePlan(city.roads);check(plan);
assert(plan.markings.some(m=>m.kind==='crossing'));assert(plan.faces.length<1000);
console.log(`PASS ${city.roads.length} street sections → ${plan.faces.length} non-overlapping surface faces; no junction overlap, no missing coverage, integrated markings.`);
