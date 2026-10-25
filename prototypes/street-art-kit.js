import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Art materials and components from the approved standalone street study.
export function createStreetArt(renderer,worldScene){
let scene=worldScene;
let seed=73129;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const between=(a,b)=>a+(b-a)*rand();
const mats=new Map();
function mat(c,roughness=.86,metalness=0){const k=`${c}/${roughness}/${metalness}`;if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color:c,roughness,metalness,envMapIntensity:.25}));return mats.get(k);}
const geo={box:new THREE.BoxGeometry(1,1,1),round:new RoundedBoxGeometry(1,1,1,2,.12),sphere:new THREE.SphereGeometry(1,16,12),leaf:new THREE.IcosahedronGeometry(1,1),cyl:new THREE.CylinderGeometry(1,1,1,12),cone:new THREE.ConeGeometry(1,1,10),foliage:new THREE.PlaneGeometry(1,1)};
const instances=new Map();
function shape(g,m,x,y,z,sx,sy,sz,parent=scene,rot=0){const o=new THREE.Mesh(geo[g],typeof m==='string'?mat(m):m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.y=rot;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(c,x,y,z,w,h,d,parent=scene,rot=0){return shape('box',c,x,y,z,w,h,d,parent,rot);}
function ball(c,x,y,z,w,h=w,d=w,parent=scene){return shape('sphere',c,x,y,z,w,h,d,parent);}
function batch(g,c,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){if(scene!==worldScene){const mesh=shape(g,c,x,y,z,sx,sy,sz);mesh.rotation.set(rx,ry,rz);return;}
const key=g+'/'+c;if(!instances.has(key))instances.set(key,{g,c,transforms:[]});instances.get(key).transforms.push({x,y,z,sx,sy,sz,rx,ry,rz});}
function line(c,a,b,r=.025,parent=scene){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),v=B.clone().sub(A);const o=new THREE.Mesh(geo.cyl,mat(c));o.position.copy(A.add(B).multiplyScalar(.5));o.scale.set(r,v.length(),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());o.castShadow=true;parent.add(o);return o;}
function texture(size,draw,repeat=1){const cv=document.createElement('canvas');cv.width=cv.height=size;draw(cv.getContext('2d'),size);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}
// Alpha-cut leaf sprays, not coloured spheres, provide the visible tree surface.
const leafMap=texture(128,(g,s)=>{
 g.clearRect(0,0,s,s);g.lineCap='round';g.strokeStyle='#b8c2a0';g.lineWidth=2;
 g.beginPath();g.moveTo(62,116);g.lineTo(66,14);g.stroke();
 for(let k=0;k<7;k++){
  const y=22+k*12,side=k%2?1:-1;g.save();g.translate(64+side*13,y);g.rotate(side*.7);
  g.fillStyle=k%3?'#f0f2dc':'#cbd7b2';g.beginPath();g.ellipse(0,0,13,23,0,0,Math.PI*2);g.fill();
  g.strokeStyle='#a3b68d';g.lineWidth=1;g.beginPath();g.moveTo(0,-18);g.lineTo(0,19);g.stroke();g.restore();
 }
});
leafMap.wrapS=leafMap.wrapT=THREE.ClampToEdgeWrapping;
const foliageMaterials=new Map();
function foliageMaterial(c){if(!foliageMaterials.has(c))foliageMaterials.set(c,new THREE.MeshStandardMaterial({map:leafMap,color:c,alphaTest:.45,side:THREE.DoubleSide,roughness:.95,envMapIntensity:.2}));return foliageMaterials.get(c);}
const grassMap=texture(512,(g,s)=>{g.fillStyle='#7d9950';g.fillRect(0,0,s,s);for(let i=0;i<65000;i++){g.fillStyle=rand()<.45?'rgba(228,223,127,.13)':'rgba(35,72,34,.12)';g.fillRect(rand()*s,rand()*s,between(.5,1.7),between(1,3.5));}},1);
const grass=new THREE.MeshStandardMaterial({map:grassMap,color:'#b9cd87',roughness:1,envMapIntensity:.15});
grass.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGround;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 groundPoint=vec4(transformed,1.);\n#ifdef USE_INSTANCING\ngroundPoint=instanceMatrix*groundPoint;\n#endif\nvGround=(modelMatrix*groundPoint).xyz;');sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vGround;
float hashG(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noiseG(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hashG(i),hashG(i+vec2(1,0)),f.x),mix(hashG(i+vec2(0,1)),hashG(i+vec2(1)),f.x),f.y);}`);sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
vec3 turf=texture2D(map,vGround.xz*.57).rgb;
float field=noiseG(vGround.xz*.13)*.65+noiseG(vGround.xz*.39)*.35;
diffuseColor.rgb=turf*mix(vec3(.82,.98,.70),vec3(1.40,1.35,.98),field);`);};
const asphaltMap=texture(256,(g,s)=>{g.fillStyle='#596266';g.fillRect(0,0,s,s);for(let i=0;i<14000;i++){g.fillStyle=rand()<.5?'#697176':'#4a5358';g.globalAlpha=.3;g.fillRect(rand()*s,rand()*s,1,1);}g.globalAlpha=1;},1);
const asphalt=new THREE.MeshStandardMaterial({map:asphaltMap,color:'#b4bdbe',roughness:1});
const pavingMap=texture(256,(g,s)=>{g.fillStyle='#d2cbbc';g.fillRect(0,0,s,s);g.strokeStyle='#b7b2a4';g.lineWidth=2;for(let row=0;row<8;row++)for(let col=-1;col<8;col++){const x=col*64+(row%2)*32,y=row*32;g.fillStyle=`hsl(41 15% ${between(76,84)}%)`;g.fillRect(x+1,y+1,62,30);g.strokeRect(x,y,64,32);}for(let i=0;i<6000;i++){g.fillStyle='#6e7364';g.globalAlpha=.09;g.fillRect(rand()*s,rand()*s,1,1);}g.globalAlpha=1;},1);
const pavement=new THREE.MeshStandardMaterial({map:pavingMap,roughness:1,color:'#f3efe1'});
const wallMap=texture(256,(g,s)=>{g.fillStyle='#e7dfcc';g.fillRect(0,0,s,s);for(let i=0;i<20000;i++){g.fillStyle=rand()<.5?'rgba(68,65,48,.06)':'rgba(255,255,255,.16)';g.fillRect(rand()*s,rand()*s,1,1);}},1);
const plaster=new THREE.MeshStandardMaterial({map:wallMap,roughness:.9,color:'#f0e9da'});
const brickMap=texture(256,(g,s)=>{g.fillStyle='#b98a65';g.fillRect(0,0,s,s);for(let y=0;y<16;y++)for(let x=-1;x<8;x++){g.fillStyle=`hsl(${between(22,30)} 28% ${between(48,62)}%)`;g.fillRect(x*48+(y%2)*24+1,y*16+1,46,14);}},1);
const brick=new THREE.MeshStandardMaterial({map:brickMap,roughness:.95});
const glass=new THREE.MeshPhysicalMaterial({color:'#628795',roughness:.23,metalness:.22,clearcoat:.75,clearcoatRoughness:.2});
function slab(material,x,z,w,d,y=.025,h=.05){return box(material,x,y,z,w,h,d);}
function label(text,x,y,z,w,h,bg='#f3ead6',color='#3a555c',parent=scene){const cv=document.createElement('canvas');cv.width=512;cv.height=128;const g=cv.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,512,128);g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';g.font='600 52px "Microsoft JhengHei",sans-serif';g.fillText(text,256,67,480);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshStandardMaterial({map:t,roughness:.8});const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);p.position.set(x,y,z);parent.add(p);return p;}

const exclusion=[],treeSites=[],residents=[];let landCheck=()=>true;
function reserve(x,z,w,d){if(scene!==worldScene){scene.updateMatrixWorld(true);const p=new THREE.Vector3(x,0,z).applyMatrix4(scene.matrixWorld),s=new THREE.Vector3();scene.getWorldScale(s);x=p.x;z=p.z;w*=s.x;d*=s.z;}exclusion.push({x,z,w,d});}
function clearAt(x,z,r=.8){return landCheck(x,z,r)&&!exclusion.some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r);}
const contactTex=texture(128,(g,s)=>{const a=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);a.addColorStop(0,'rgba(20,30,19,.28)');a.addColorStop(1,'rgba(20,30,19,0)');g.fillStyle=a;g.fillRect(0,0,s,s);});
const contactMat=new THREE.MeshBasicMaterial({map:contactTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
function contact(x,z,w,d,opacity=.55){const m=contactMat.clone();m.opacity=opacity;const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);p.rotation.x=-Math.PI/2;p.position.set(x,.015,z);scene.add(p);}
function apartment(x,z,w,d,floors,tone,style=0){
 const h=floors*2.35;reserve(x,z,w+1,d+1);box(tone,x,h/2,z,w,h,d);box('#d6d0c2',x,.25,z,w+.7,.5,d+.7);box('#d7d3c6',x,h+.16,z,w+.4,.32,d+.4);
 const cols=Math.max(2,Math.floor(w/2.8));
 for(let f=0;f<floors;f++){
  const y=1.25+f*2.35;
  for(let j=0;j<cols;j++){
   const xx=x-w/2+(j+.5)*w/cols;
   box('#b6b4a6',xx,y,z+d/2+.03,1.66,1.6,.1);box(glass,xx,y,z+d/2+.11,1.49,1.43,.055);box('#eee8d8',xx,y,z+d/2+.16,.055,1.5,.065);
   if((j+f+style)%3!==0){box('#ddd8c9',xx,y-.87,z+d/2+.48,2.1,.14,1.05);box('#8c9c92',xx,y-.48,z+d/2+.97,2.1,.045,.045);for(let q=-.85;q<1;q+=.34)box('#a3aba1',xx+q,y-.63,z+d/2+.97,.035,.47,.035);if((f+j)%4===0){box('#ad9472',xx+.5,y-.71,z+d/2+.5,.5,.28,.35);batch('leaf','#769563',xx+.5,y-.42,z+d/2+.5,.38,.4,.32);}}
  }
  for(let j=0;j<Math.floor(d/2.6);j++){
   const zz=z-d/2+(j+.5)*d/Math.floor(d/2.6);box('#ded9ca',x+w/2+.05,y,zz,.12,1.7,1.85);box(glass,x+w/2+.13,y,zz,.045,1.42,1.58);
  }
  if(style%2===0)box('#bcb7a8',x,y+1.1,z+d/2+.1,w,.12,.22);
 }
 box('#8d9d94',x-w*.25,h+.9,z,.95,1.5,.95);box('#a9b7b0',x+w*.22,h+.4,z-d*.2,1.7,.7,1.5);
 for(let i=0;i<4;i++)box(mat('#435d6c',.35,.3),x-w*.25+i*.65,h+.48,z+d*.22,.55,.08,1.3,scene,-.08);
 contact(x,z,w+6,d+5,.5);
}
function tree(x,z,h=5,type=0,force=false,groundY=0){
 const radius=h*.28;
 if(!force&&(!clearAt(x,z,radius)||treeSites.some(t=>Math.hypot(t.x-x,t.z-z)<(radius+t.r)*.65)))return false;
 treeSites.push({x,z,r:radius,groundY});if(!groundY)contact(x,z,radius*3,radius*3,.28);
 batch('cyl','#776347',x,groundY+h*.27,z,.13*h/5,h*.55,.13*h/5);
 if(type===1){for(let k=0;k<4;k++)batch('cone',['#3f6950','#497653','#638953'][k%3],x,groundY+h*(.42+k*.15),z,h*(.25-k*.043),h*.44,h*(.25-k*.043),0,rand()*6.28);}
 else{
  const palette=type===2?['#7f9551','#96a95c','#a3b363']:['#527e48','#6b914c','#7e9e54','#5e8948'];
  // A dense shell of individually oriented leaf sprays breaks the silhouette naturally.
  for(let k=0;k<240;k++){
   const a=k*2.3999+rand()*.6,yy=between(-.83,.96),rr=radius*Math.sqrt(1-yy*yy)*between(.55,1.05);
   const ss=radius*between(.23,.39);
   batch('foliage',palette[k%palette.length],x+Math.cos(a)*rr,groundY+h*.73+yy*radius,z+Math.sin(a)*rr,ss,ss*1.25,1,between(-1.4,1.4),rand()*6.28,rand()*6.28);
  }
  for(let k=0;k<3;k++){const a=k*2.1;line('#776347',[x,groundY+h*.35,z],[x+Math.cos(a)*radius*.45,groundY+h*.65,z+Math.sin(a)*radius*.45],.075);}
 }
 return true;
}
function bench(x,z,rot=0){const g=new THREE.Group();g.position.set(x,.19,z);g.rotation.y=rot;scene.add(g);for(let j=0;j<4;j++)box('#ad8b5a',0,.5,j*.13,1.8,.09,.1,g);for(let j=0;j<3;j++)box('#b19061',0,.9+j*.16,-.09,1.8,.12,.07,g);for(const xx of [-.65,.65]){box('#536762',xx,.25,.2,.09,.5,.65,g);line('#536762',[xx,.3,0],[xx,1.2,-.1],.035,g);}}
function lamp(x,z){line('#596a63',[x,.2,z],[x,5.3,z],.065);line('#596a63',[x,5.3,z],[x+.6,5.3,z],.055);shape('round','#596a63',x+.65,5.28,z,.75,.12,.35);box('#f1e6b8',x+.65,5.2,z,.55,.035,.22);}
function car(x,z,color,rot=0){const g=new THREE.Group();g.position.set(x,.16,z);g.rotation.y=rot;scene.add(g);shape('round',color,0,.65,0,1.75,.65,3.6,g);shape('round',glass,0,1.18,-.12,1.5,.7,1.95,g);box(color,0,1.55,-.2,1.48,.1,1.4,g);for(const xx of [-.88,.88])for(const zz of [-1.1,1.1]){const tire=shape('cyl','#343d3d',xx,.4,zz,.36,.22,.36,g);tire.rotation.z=Math.PI/2;const hub=shape('cyl',mat('#b8bdb3',.4,.5),xx*1.015,.4,zz,.19,.23,.19,g);hub.rotation.z=Math.PI/2;}for(const xx of [-.57,.57]){box('#eee7c9',xx,.72,1.81,.4,.18,.03,g);box('#ae6049',xx,.73,-1.81,.35,.16,.03,g);}return g;}
function person(x,z,scale,shirt,pants,hair,pose='idle',turn=0){
 const g=new THREE.Group();g.position.set(x,.23,z);g.scale.setScalar(scale);g.rotation.y=turn;scene.add(g);
 const skin='#e4bb95';
 shape('round',pants,0,.48,0,.49,.3,.3,g);
 for(const xx of [-.15,.15]){shape('round',pants,xx,.26,0,.19,.47,.2,g);shape('round','#e8e1cc',xx,.07,.09,.23,.15,.4,g);box('#a5b1a6',xx,.02,.09,.24,.04,.4,g);}
 shape('round',shirt,0,.88,0,.62,.65,.39,g);ball(skin,0,1.61,.015,.46,.48,.43,g);
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.475,20,14,0,Math.PI*2,0,Math.PI*.56),mat(hair));cap.position.set(0,1.69,-.02);cap.castShadow=true;g.add(cap);
 for(let k=0;k<5;k++){const angle=-.9+k*.38;const lock=ball(hair,Math.sin(angle)*.32,1.91-Math.abs(angle)*.1,.24,.17,.16,.17,g);lock.rotation.z=angle*.6;}
 for(const xx of [-.16,.16]){ball('#293b3b',xx,1.61,.412,.056,.074,.027,g);ball('#fff9e7',xx-.013,1.635,.439,.015,.019,.006,g);ball('#e6a99c',xx*1.65,1.51,.36,.071,.037,.012,g);}
 const smile=new THREE.EllipseCurve(0,0,.07,.035,Math.PI,Math.PI*2,false,0).getPoints(12);const smileMesh=new THREE.Line(new THREE.BufferGeometry().setFromPoints(smile.map(p=>new THREE.Vector3(p.x,p.y+1.49,.435))),new THREE.LineBasicMaterial({color:'#9a7060'}));g.add(smileMesh);
 for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.37,1.08,0);g.add(arm);shape('round',shirt,0,-.19,0,.19,.4,.22,arm);shape('round',skin,0,-.45,0,.15,.26,.16,arm);ball(skin,0,-.6,0,.1,.105,.09,arm);arm.rotation.z=pose==='wave'&&side===1?-2.1:side*.1;if(pose==='wave'&&side===1)residents.push({arm,base:-2.1});}
 return g;
}

function school(x,z,scale=.4,name="生活托育館",heightScale=scale){const parent=scene,g=new THREE.Group();g.position.set(x+5*scale,0,z+4*scale);g.scale.set(scale,heightScale,scale);parent.add(g);scene=g;
// School: setbacks, warm brick side wing, tall frames, rooftop garden and readable entry.
reserve(-4,-3,23,15);reserve(-4,5,24,8);
box(plaster,-5,3.1,-4,18,6.1,10);box(brick,5,2.65,-4,3.8,5.2,10.2);
box('#d7c9ae',-5,6.3,-4,18.6,.3,10.6);box('#e7ddc7',-5,6.6,-4,18.5,.45,10.5);
box('#c8bb9f',-5,6.85,-4,17.8,.08,9.8);box('#e7decc',-5,6.95,-9,18.5,.65,.2);
for(const x of [-13.9,3.9])box('#e7decc',x,6.95,-4,.18,.65,10.4);
// Main doorway and canopy.
box('#cbbd9f',-5,1.62,1.08,4.6,3.25,.35);box(glass,-5,1.5,1.29,3.5,2.8,.09);
for(const x of [-6.75,-5,-3.25])box('#ede5d6',x,1.52,1.36,.08,2.9,.08);
box('#a5a798',-5,3.35,2,5.8,.2,2.3);label(name,-5,3.36,3.18,5.4,.42);
for(let floor=0;floor<2;floor++)for(const x of [-11.5,-8.8,-1,1.6]){
 const y=1.45+floor*2.6;box('#ddd1b9',x,y,1.08,2.25,1.9,.25);box(glass,x,y,1.23,1.85,1.58,.05);box('#f0e7d4',x,y,1.28,.055,1.65,.08);box('#f0e7d4',x,y,1.28,1.9,.055,.08);box('#f4e9d5',x,y-.98,1.27,2.4,.12,.6);
}
for(let z=-8;z<.5;z+=2.6)for(let f=0;f<2;f++){box('#e7d8bf',7.02,1.5+f*2.5,z,.12,1.9,1.9);box(glass,7.1,1.5+f*2.5,z,.08,1.55,1.55);}
for(const x of [-11,-1]){box('#d5c7a9',x,6.98,-7,2.5,.45,2);for(let n=0;n<5;n++)batch('sphere','#6b8a4b',x+between(-1,1),7.36,-7+between(-.6,.6),.43,.35,.43);}
box('#dde0d7',0,7.35,-5,2.4,1.05,2);for(let n=0;n<8;n++)box('#9aa7a2',.95,7.2,-5.7+n*.2,.08,.5,.08);
contact(-5,-3,25,17,.6);
// Courtyard has grass, actual paths, children's play equipment and an open gate.
const court=slab(pavement,-5,4.9,3.8,7.7,.08,.1);court.material=pavement.clone();court.material.map=pavingMap.clone();court.material.map.repeat.set(2,4);
slab('#d2b995',3.1,4.6,5.2,4.5,.065,.1); // soft play surface
for(const x of [-15.3,7.2]){box('#d8cfb7',x,.35,5.2,.26,.6,7);for(let z=2;z<8.6;z+=.5)box('#68786d',x,.95,z,.07,1.25,.07);box('#68786d',x,1.55,5.2,.09,.07,7);}
for(const side of [[-10.8,8.4], [1.7,8.4]]){const [x,z]=side;box('#d8cfb7',x,.32,z,7.8,.55,.3);for(let k=-3.7;k<4;k+=.48)box('#68786d',x+k,1,z,.065,1.4,.065);box('#68786d',x,1.7,z,8,.065,.07);}
for(const x of [-6.8,-3.2])box('#e6d7b9',x,1.15,8.4,.45,2.3,.48);
label('歡迎來到生活街角',-10.4,1.12,8.59,4,.62,'#e9edda','#47716d');
// Playground tower, yellow slide, swing frame, playful mural.
for(const x of [2,3.5])for(const z of [3.4,4.9])box('#caa675',x,1.1,z,.12,2.2,.12);
box('#d6b686',2.75,1.4,4.15,1.8,.16,1.8);
const roof=new THREE.Mesh(new THREE.ConeGeometry(1.5,.9,4),mat('#568e97'));roof.rotation.y=Math.PI/4;roof.position.set(2.75,2.7,4.15);roof.castShadow=true;scene.add(roof);
for(const x of [2,3.5])box('#d1a165',x,1.92,4.9,.1,.85,.12);
line('#d7a452',[3,1.5,5],[4.7,.23,6.8],.16);line('#f0c65e',[2.73,1.55,5],[4.43,.27,6.8],.13);line('#f0c65e',[3.3,1.55,5],[5,.27,6.8],.13);
for(let j=0;j<5;j++)box('#e0bd80',2.3,.15+j*.24,3.1-j*.18,.8,.08,.15);
// Small raised beds avoid filling the entire courtyard with identical trees.
for(const [x,z] of [[-11,4],[.1,2]]){box('#c9c2aa',x,.22,z,2.4,.4,1.3);box('#65543c',x,.44,z,2.15,.04,1.1);for(let n=0;n<9;n++)batch('leaf',['#6e925b','#8aa76b','#587e4e'][n%3],x+between(-.9,.9),.7,z+between(-.35,.35),.35,.32,.35);}

scene=parent;return g;}

function flush(){
 const dummy=new THREE.Object3D();let instanceCount=0;
 for(const {g,c,transforms} of instances.values()){
  const mesh=new THREE.InstancedMesh(geo[g],g==='foliage'?foliageMaterial(c):mat(c),transforms.length);
  transforms.forEach((t,i)=>{dummy.position.set(t.x,t.y,t.z);dummy.rotation.set(t.rx,t.ry,t.rz);dummy.scale.set(t.sx,t.sy,t.sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.castShadow=true;mesh.receiveShadow=true;worldScene.add(mesh);instanceCount+=transforms.length;
 }
 const groups=new Map();worldScene.updateMatrixWorld(true);
 worldScene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.userData.keepDynamic)return;let par=o.parent;while(par&&par!==worldScene){if(par.userData.keepDynamic)return;par=par.parent;}if(!Object.values(geo).includes(o.geometry)||!o.material.isMeshStandardMaterial)return;const key=o.geometry.uuid+'/'+o.material.uuid+'/'+o.castShadow+'/'+o.receiveShadow;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);});
 for(const objects of groups.values()){if(objects.length<2)continue;const first=objects[0],mesh=new THREE.InstancedMesh(first.geometry,first.material,objects.length);objects.forEach((o,i)=>{mesh.setMatrixAt(i,o.matrixWorld);o.removeFromParent();});mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;worldScene.add(mesh);}
 return {trees:treeSites.length,instances:instanceCount,batches:instances.size};
}
return {mat,geo,box,ball,batch,line,shape,slab,label,texture,grass,pavement,asphalt,plaster,brick,glass,apartment,school,tree,bench,lamp,car,person,residents,treeSites,exclusion,reserve,clearAt,rand,between,contact,flush,setLandCheck:fn=>landCheck=fn};
}
