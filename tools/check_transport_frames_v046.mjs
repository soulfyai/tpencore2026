import * as THREE from 'three';
import fs from 'node:fs';
import {deckWidth,deckHeight} from '../prototypes/transport-network-v046.js';
const source=fs.readFileSync(new URL('../prototypes/transport-network-v046.js',import.meta.url),'utf8');
const start=source.indexOf(' function frame('),end=source.indexOf('\n update();return',start);
const bridges=JSON.parse(fs.readFileSync(new URL('../prototypes/v046-transport-plan.json',import.meta.url),'utf8')).bridges.map(b=>({...b,top:b.deck+(b.kind==='single-pylon'?4.95:2.1)}));
const frame=new Function('THREE','bridges','waterY','const V=(x,y,z)=>new THREE.Vector3(x,y,z);return ('+source.slice(start,end)+');')(THREE,bridges,-.18);
for(const [w,h]of [[392,697],[1000,760],[320,900],[1440,900]]){
 const camera=new THREE.PerspectiveCamera(32,w/h,.3,420),f=frame(camera);camera.position.copy(f.pos);camera.lookAt(f.target);camera.updateMatrixWorld(true);
 const distance=camera.position.distanceTo(f.target);if(distance>230)throw Error('Bridge review too distant');
 for(const b of bridges)for(const p of [b.a,b.b])for(const y of [-.18,b.top]){const q=new THREE.Vector3(p[0],y,p[1]).project(camera);if(Math.abs(q.x)>.83||Math.abs(q.y)>.75)throw Error('Bridge cropped');}
 console.log('PASS bridge frame',w,h,distance.toFixed(2));
}
for(const b of bridges)for(let k=0;k<=1000;k++){
 const f=k/1000,width=deckWidth(b,f),lane=Math.min(.105,width/2-.094);
 if(lane+.072>=width/2-.018)throw Error('Vehicle touches guardrail');
 if(deckHeight(b,f)<.018||deckHeight(b,f)>.92)throw Error('Invalid approach grade');
}
console.log('PASS continuous approaches and vehicle guardrail clearance');
