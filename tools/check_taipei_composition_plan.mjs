import assert from 'node:assert/strict';
import * as THREE from 'three';
import {COMPOSITION_HOUSING,COMPOSITION_COAST} from '../prototypes/taipei-composition-elements.js';
import {inside} from '../prototypes/organic-district.js';
const coast=new THREE.CatmullRomCurve3(COMPOSITION_COAST.map(p=>new THREE.Vector3(...p)),true,'catmullrom',.3).getPoints(160).map(p=>[p.x,p.z]);
const roads=[[-56,6.5,55,13.5],[9.5,-37.2,16.5,6.5],[-54,-40.9,-10,-36.1]];
for(const p of [[-54.5,-41.85],[-54.5,-35.15],[-9.5,-41.85],[-9.5,-35.15]])assert(inside(p,coast),'Back street ends on land');
COMPOSITION_HOUSING.forEach(([x,z,width,depth],i)=>{
 const w=i%7===0?depth:width,d=i%7===0?width:depth;
 for(const sx of [-1,1])for(const sz of [-1,1])assert(inside([x+sx*w/2,z+sz*d/2],coast),`Housing ${i+1}: outside coast`);
 for(const [x0,z0,x1,z1] of roads)assert(!(x+w/2>x0+.05&&x-w/2<x1-.05&&z+d/2>z0+.05&&z-d/2<z1-.05),`Housing ${i+1}: inside road`);
 assert(!(Math.abs(x-10)<15&&z>40&&z<58),'Keep the foreground lake view open');
});
console.log(`PASS ${COMPOSITION_HOUSING.length} housing footprints clear coast, main streets and foreground lake view.`);
