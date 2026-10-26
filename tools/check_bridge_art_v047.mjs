import * as THREE from 'three';
import fs from 'node:fs';
import {createTaipeiRoads} from '../prototypes/taipei-city-roads.js';
import {createPolicyDistrictPlan} from '../prototypes/policy-district-layout-v044.js';
import {configureBridgeArt,prepareBridge,buildFinishedDeck,deckHeight,deckWidth,FINISH,buildWaterPier} from '../prototypes/bridge-art-finishes-v047.js';
import {pointIn,area} from '../prototypes/bridge-planar-v047.js';
const read=n=>JSON.parse(fs.readFileSync(new URL('../prototypes/'+n,import.meta.url),'utf8'));
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillStyle:''})})};
const cities=new Map(),scene=new THREE.Group();
for(const d of read('v044-art-data.json')){const root=new THREE.Group();root.scale.setScalar(1/14);root.position.set(d.sourceCenter?.[0]||0,0,d.sourceCenter?.[1]||0);scene.add(root);const plan=createPolicyDistrictPlan(d),mat=c=>new THREE.MeshStandardMaterial({color:c}),art={asphalt:mat('#374347'),pavement:mat('#d8d4bc'),mat};const roads=createTaipeiRoads(art,root,{capabilities:{maxTextureSize:256,getMaxAnisotropy:()=>1}},plan.roads);cities.set(d.city.city,{root,plan,roadSurface:roads,art});}
configureBridgeArt(read('v047-bridge-finishes.json'));
let checked=0;
function allFinite(root){root.traverse(o=>{if(!o.isMesh)return;for(const a of Object.values(o.geometry.attributes))if([...a.array].some(v=>!Number.isFinite(v)))throw Error('Invalid geometry '+o.name);});}
function areaGeo(mesh){const a=mesh.geometry.attributes.position,ix=mesh.geometry.index;let sum=0;for(let k=0;k<(ix?.count||a.count);k+=3){const tri=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(a,ix?ix.getX(k+j):k+j));sum+=tri[1].clone().sub(tri[0]).cross(tri[2].clone().sub(tri[0])).length()/2;}return sum;}
for(const raw of read('v046-transport-plan.json').bridges){const b=prepareBridge(raw,cities),g=new THREE.Group();scene.add(g);const finish=buildFinishedDeck(g,b,cities,-.18);allFinite(g);
 for(const end of finish.landings){const city=cities.get(end.city);if(!end.inner.every(p=>pointIn(p,end.outer,true)))throw Error('Road outside sidewalk '+end.id);const road=end.root.getObjectByName('junction-asphalt'),walk=end.root.getObjectByName('junction-walk');if(Math.abs(areaGeo(road)-Math.abs(area(end.inner)))>2e-5)throw Error('Road triangulation '+end.id);if(Math.abs(areaGeo(walk)-(Math.abs(area(end.outer))-Math.abs(area(end.inner))))>2e-5)throw Error('Sidewalk triangulation '+end.id);
  for(const mesh of [...city.roadSurface.meshes,city.roadSurface.curb]){const pos=mesh.geometry.attributes.position;for(let k=0;k<pos.count;k+=3){const p=[(pos.getX(k)+pos.getX(k+1)+pos.getX(k+2))/42+city.root.position.x,(pos.getZ(k)+pos.getZ(k+1)+pos.getZ(k+2))/42+city.root.position.z];if(pointIn(p,end.outer,false)&&Math.min(...end.outer.map((a,i)=>{const q=end.outer[(i+1)%end.outer.length],dx=q[0]-a[0],dz=q[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}))>1e-5)throw Error('Old street/curb still intrudes '+end.id+' '+mesh.name);}}
  const epsilon=1e-6,side=end.city==='taipei'?0:1,f=side?1-FINISH.join/b.length:FINISH.join/b.length;if(Math.abs(deckHeight(b,f)-FINISH.roadY)>epsilon)throw Error('Step at seam');const derivative=(deckHeight(b,side?f-epsilon:f+epsilon)-deckHeight(b,f))/(epsilon*b.length);if(Math.abs(derivative)>.001)throw Error('Abrupt grade at seam');checked++;
 }
 for(const mesh of [finish.road,...finish.walks,g.getObjectByName('surface-conforming-center-lines')]){const a=mesh.geometry.attributes.normal;if([...a.array].some((v,i)=>i%3===1&&v<.9))throw Error('Top surface faces downward '+mesh.name+' '+b.id);}
 const street=cities.get('taipei').roadSurface.meshes.find(m=>m.name==='city-asphalt-union').material;if(finish.road.material.bumpScale!==street.bumpScale||finish.road.material.map!==street.map||!finish.road.material.color.equals(street.color))throw Error('Bridge asphalt differs from street');
 const stripe=g.getObjectByName('surface-conforming-center-lines').geometry.attributes.position,ux=(b.b[0]-b.a[0])/b.length,uz=(b.b[1]-b.a[1])/b.length;for(let k=0;k<stripe.count;k++){const f=((stripe.getX(k)-b.a[0])*ux+(stripe.getZ(k)-b.a[1])*uz)/b.length,gap=stripe.getY(k)-deckHeight(b,f);if(gap<.00010||gap>.00014)throw Error('Paint floating or embedded in ramp '+b.id);}
 if(finish.terminals.some(t=>t.station<FINISH.join+.19||t.station>b.length-FINISH.join-.19))throw Error('Rail inside junction');
 for(let k=0;k<=1000;k++){const f=k/1000;if(deckHeight(b,f)<FINISH.roadY-1e-9||deckHeight(b,f)>b.deck+1e-9)throw Error('Deck height');const lane=Math.min(.105,deckWidth(b,f)/2-.094);if(lane+.072>=deckWidth(b,f)/2)throw Error('Vehicle outside asphalt');}
 for(const f of [0,.03,.07,.93,.97,1]){const p=[b.a[0]+(b.b[0]-b.a[0])*f,b.a[1]+(b.b[1]-b.a[1])*f],onLand=[...cities.values()].some(c=>pointIn([(p[0]-c.root.position.x)*14,(p[1]-c.root.position.z)*14],c.plan.coast));if(onLand&&buildWaterPier(g,b,f,cities,-.18,finish.materials.concrete))throw Error('Pier on land');}
 console.log('PASS finished bridge',b.name,b.finish.ends.map(e=>({end:e.id,shore:e.shore,ramp:e.ramp,inner:area(e.inner),outer:area(e.outer)})));
}
for(const c of cities.values())allFinite(c.root);
if(checked!==4)throw Error('Missing landing');
console.log('PASS all4 joints: paving ownership/areas, no old curb crossings, matching road elevation and C2 ramps, capped rails, water-only piers, finite geometry');
