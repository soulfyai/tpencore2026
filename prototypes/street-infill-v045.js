import * as THREE from 'three';
import {inside,edgeDistance} from './taipei-city-water.js?rev=1';
const overlap=(a,b,pad=0)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+pad&&Math.abs(a.z-b.z)<(a.d+b.d)/2+pad;
const rect=b=>({x:(b.min.x+b.max.x)/2,z:(b.min.z+b.max.z)/2,w:b.max.x-b.min.x,d:b.max.z-b.min.z});
export function landmarkFootprints(buckets){const out=[];
 for(const {geometry,matrices,material}of buckets.values()){
  if(material.userData?.groundCover)continue;
  if(!geometry.boundingBox)geometry.computeBoundingBox();
  for(const m of matrices){const b=geometry.boundingBox.clone().applyMatrix4(m);if(b.max.y<.8)continue;out.push(rect(b));}
 }return out;
}
function landFits(p,plan,ponds){return [-1,0,1].every(a=>[-1,0,1].every(b=>{const pt=[p.x+a*p.w/2,p.z+b*p.d/2];return inside(pt,plan.coast)&&edgeDistance(pt,plan.coast)>1.8&&ponds.every(l=>!inside(pt,l.walk));}));}
// A landmark's actual solid geometry, rather than its broad reservation circle,
// determines which surrounding street plots can receive buildings.
export function fillStreetBlocks(art,plan,data,ponds,details,solidLandmarks){
 const S=plan.scale,claimed=new Set(plan.parcels.flatMap(p=>p.cells)),added=[],coverage=[];
 const parks=plan.parcels.filter(p=>p.kind==='park').map(p=>({x:p.x,z:p.z,w:p.w,d:p.d}));
 const nature=plan.landmarks.filter(l=>l.nature).map(l=>({x:l.x,z:l.z,w:l.r*1.9,d:l.r*1.9}));
 const fixed=[...solidLandmarks,...nature,...parks,...plan.parcels.filter(p=>p.kind!=='park').map(p=>({x:p.x,z:p.z,w:p.usableW,d:p.usableD}))];
 const roads=plan.roads.map(r=>({x:(r.a[0]+r.b[0])/2,z:(r.a[1]+r.b[1])/2,w:r.horizontal?Math.abs(r.a[0]-r.b[0])+1:6.8,d:r.horizontal?6.8:Math.abs(r.a[1]-r.b[1])+1}));
 for(const cell of data.cells){
  if(claimed.has(cell.id))continue;
  const x=cell.c[0]*S,z=cell.c[1]*S,W=data.half*2*S-7.8;
  const obstacles=[...fixed,...roads,...added];let made=0;
  // A complete block first; smaller offset buildings fit beside landmark plinths.
  for(let pass=0;pass<3;pass++){
   const choices=[];
   for(const [w,d]of [[W,W],[W,W*.68],[W*.68,W],[W*.68,W*.68],[W*.48,W*.72],[W*.72,W*.48],[W*.48,W*.48]]){
    for(const dx of [0,-(W-w)/2,(W-w)/2])for(const dz of [0,-(W-d)/2,(W-d)/2]){
     const p={x:x+dx,z:z+dz,w,d};if(w<6.5||d<6.5||!landFits(p,plan,ponds)||obstacles.some(b=>overlap(p,b,1.1)))continue;
     choices.push(p);
    }
   }
   if(!choices.length)break;
   choices.sort((a,b)=>b.w*b.d-a.w*a.d||a.x-b.x||a.z-b.z);const q=choices[0];
   const p={...q,id:'infill-'+cell.id+'-'+pass,kind:'urban',usableW:q.w,usableD:q.d,seed:hash(cell.id+pass),zone:cell.zone,cells:[cell.id]};
   const start=details.records.length;details.urban(p);const records=details.records.slice(start);
   // Associate added streets with a nearby policy without adding duplicate labels.
   const theme=plan.parcels.filter(v=>v.kind==='policy').sort((a,b)=>Math.hypot(a.x-q.x,a.z-q.z)-Math.hypot(b.x-q.x,b.z-q.z))[0];
   for(const r of records){r.infill=true;r.cell=cell.id;r.policyId=theme.id;}
   added.push(q);obstacles.push(q);made+=records.length;
  }
  coverage.push({cell:cell.id,buildings:made,landmark:solidLandmarks.some(b=>overlap({x,z,w:W,d:W},b)),nature:nature.some(b=>overlap({x,z,w:W,d:W},b)),coastal:!landFits({x,z,w:W,d:W},plan,ponds)});
 }
 // Replace only the overly broad landmark exclusion squares. Actual buildings,
 // roads, policy grounds and water remain protected from trees.
 art.exclusion.push(...solidLandmarks,...nature);
 return {added,coverage,buildings:details.records.filter(r=>r.infill).length,solidLandmarks};
}
export function plantDenseLandscape(art,plan){const start=art.treeSites.length,xs=plan.coast.map(p=>p[0]),zs=plan.coast.map(p=>p[1]);let candidates=0;
 for(const [spacing,jitter,offset]of [[3.9,.65,2.5],[4.7,.8,4]]){
  for(let z=Math.min(...zs)+offset;z<Math.max(...zs)-2.5;z+=spacing)for(let x=Math.min(...xs)+offset;x<Math.max(...xs)-2.5;x+=spacing){
   const xx=x+art.between(-jitter,jitter),zz=z+art.between(-jitter,jitter);candidates++;
   let h=art.between(7.5,10.8);if(!art.clearAt(xx,zz,h*.28))h=art.between(4.8,6.8);
   art.tree(xx,zz,h,art.rand()<.16?1:art.rand()<.2?2:0);
  }
 }
 return {candidates,planted:art.treeSites.length-start};
}
function hash(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function createProminentFlag(scene,art,tallest){
 const cv=document.createElement('canvas');cv.width=768;cv.height=512;const c=cv.getContext('2d');c.fillStyle='#fe0000';c.fillRect(0,0,768,512);c.fillStyle='#000095';c.fillRect(0,0,384,256);
 c.fillStyle='#fff';c.beginPath();for(let k=0;k<24;k++){const a=-Math.PI/2+k*Math.PI/12,r=k%2?48:96,x=192+Math.cos(a)*r,y=128+Math.sin(a)*r;k?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fill();c.fillStyle='#000095';c.beginPath();c.arc(192,128,57.6,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(192,128,48,0,Math.PI*2);c.fill();
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide,roughness:.85,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.18});
 const time={value:0};material.onBeforeCompile=s=>{s.uniforms.flagTime=time;s.vertexShader='uniform float flagTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z+=.48*uv.x*sin(uv.x*8.-flagTime*2.2+uv.y*1.5);transformed.y+=.11*uv.x*sin(uv.x*6.-flagTime*1.7);');};material.customProgramCacheKey=()=> 'roc-flag-v045';
 const flag=new THREE.Mesh(new THREE.PlaneGeometry(12.6,8.4,32,16).translate(6.3,11.3,0),material);flag.name='prominent-roc-flag';flag.position.set(tallest.x,tallest.height+.15,tallest.z);flag.rotation.y=-.35;scene.add(flag);
 art.line('#d6ddd7',[tallest.x,tallest.height,tallest.z],[tallest.x,tallest.height+15.7,tallest.z],.13);art.ball('#d9d7bb',tallest.x,tallest.height+15.8,tallest.z,.22);
 flag.userData={width:12.6,height:8.4,poleHeight:15.7,roofHeight:tallest.height,update:(t,moving)=>{if(moving)time.value=t;}};return flag;
}
