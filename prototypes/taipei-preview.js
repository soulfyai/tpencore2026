import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {createStreetArt} from './street-art-kit.js?rev=1';
import {LANDMARK_BUILD} from './taipei-landmarks.js?rev=1';

// Separate review scene. Production HTML, models, counter and music are not imported or modified.
const response=await fetch('./taipei-preview-data.json?rev=1',{cache:'no-cache'});
if(!response.ok)throw new Error('Preview data unavailable');
const data=await response.json();
const scene=new THREE.Scene();scene.background=new THREE.Color('#b9d8e5');scene.fog=new THREE.Fog('#c3dae0',420,1350);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.querySelector('#stage').append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.3,2200),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=7;controls.maxDistance=780;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI*.48;
const hemisphere=new THREE.HemisphereLight('#d5edff','#6d7650',2.25);scene.add(hemisphere);
const sun=new THREE.DirectionalLight('#fff1d8',3.4);sun.position.set(-180,300,170);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-235,right:235,top:235,bottom:-235,near:1,far:950});sun.shadow.normalBias=.06;sun.shadow.bias=-.0001;sun.shadow.radius=3;scene.add(sun,sun.target);
const sky=new Sky();sky.scale.setScalar(1800);Object.assign(sky.material.uniforms.turbidity,{value:3});sky.material.uniforms.rayleigh.value=1.1;sky.material.uniforms.mieCoefficient.value=.006;sky.material.uniforms.mieDirectionalG.value=.8;sky.material.uniforms.sunPosition.value.copy(sun.position);scene.add(sky);
const art=createStreetArt(renderer,scene),{box,ball,batch,line,mat,shape,slab,label,rand,between,tree,reserve,clearAt}=art;
const SCALE=8,coast=data.coast.map(([x,z])=>[x*SCALE,z*SCALE]);
function pip(x,z,P=coast){let inside=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function distSeg(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
function boundaryDist(x,z){let d=Infinity;for(let i=0;i<coast.length;i++)d=Math.min(d,distSeg(x,z,coast[i],coast[(i+1)%coast.length]));return d;}
function polygon(points,y,material,depth=0){const s=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));const g=depth?new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:1}):new THREE.ShapeGeometry(s);g.rotateX(-Math.PI/2);g.translate(0,y,0);const mesh=new THREE.Mesh(g,typeof material==='string'?mat(material):material);mesh.receiveShadow=true;scene.add(mesh);return mesh;}
polygon(coast.map(([x,z])=>[x*1.035,z*1.035]),-2.5,'#d6c7a2',2.1);
polygon(coast,-.08,art.grass,.09);
const seaMaterial=new THREE.MeshStandardMaterial({color:'#76afb8',roughness:.38,metalness:.07});
seaMaterial.onBeforeCompile=shader=>{shader.uniforms.uSeaTime={value:0};seaMaterial.userData.shader=shader;shader.vertexShader='uniform float uSeaTime;\nvarying vec2 vSea;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
vSea=position.xy;
transformed.z+=sin(position.x*.035+uSeaTime*.25)*.13+sin(position.y*.06-uSeaTime*.21)*.10;`);shader.fragmentShader='varying vec2 vSea;\nuniform float uSeaTime;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float wave=sin(vSea.x*.09+vSea.y*.055+uSeaTime*.24)*.5+sin(vSea.y*.13-uSeaTime*.19)*.3;
diffuseColor.rgb*=.96+wave*.045;`);};
const sea=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000,160,160),seaMaterial);sea.rotation.x=-Math.PI/2;sea.position.y=-1.55;scene.add(sea);
// All shoreline checks include tree crown clearance; no trees in the sea or on paths.
art.setLandCheck((x,z,r)=>pip(x,z)&&boundaryDist(x,z)>r+2);
const landmarks=data.landmarks.map(l=>({...l,x:l.x*SCALE,z:l.z*SCALE,r:l.r*SCALE}));
for(const l of landmarks)reserve(l.x,l.z,l.r*2+.8,l.r*2+.8);
const roads=[];
for(const rd of data.roads){
 const a=rd.a.map(v=>v*SCALE),b=rd.b.map(v=>v*SCALE),cx=(a[0]+b[0])/2,cz=(a[1]+b[1])/2,len=Math.hypot(b[0]-a[0],b[1]-a[1]);
 if(landmarks.some(l=>distSeg(l.x,l.z,a,b)<l.r*.76))continue;
 const horizontal=Math.abs(a[0]-b[0])>Math.abs(a[1]-b[1]),width=rd.pedestrian?2.3:4.1;
 roads.push({a,b,horizontal,pedestrian:rd.pedestrian});reserve(cx,cz,horizontal?len+1:width+2,horizontal?width+2:len+1);
 slab(art.pavement,cx,cz,horizontal?len+1:width+1.9,horizontal?width+1.9:len+1,.075,.14);
 slab(rd.pedestrian?art.pavement:art.asphalt,cx,cz,horizontal?len+.15:width,horizontal?width:len+.15,.125,.06);
 if(!rd.pedestrian){for(let p=2;p<len-1;p+=3.7){const t=p/len,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;batch('box','#e5dfbf',x,.162,z,horizontal?1.7:.065,.009,horizontal?.065:1.7);}}
 // Curb edges form a continuous street section, not a slab beneath every building.
 const nx=horizontal?0:1,nz=horizontal?1:0;
 for(const side of [-1,1])box('#d7d3c4',cx+nx*(width/2+.95)*side,.11,cz+nz*(width/2+.95)*side,horizontal?len:.13,.22,horizontal?.13:len);
}
function keyHash(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
const byCell=new Map(data.cells.map(c=>[c.id,c]));
const themeMeta=data.themes.map(t=>{const cells=t.cells.map(id=>byCell.get(id));return {...t,x:cells.reduce((s,c)=>s+c.c[0],0)/cells.length*SCALE,z:cells.reduce((s,c)=>s+c.c[1],0)/cells.length*SCALE,anchor:new THREE.Vector3(),height:6};});
const themeMap=new Map(themeMeta.map(t=>[t.id,t]));
const buildings=[];
function roomWindows(x,z,w,d,floors,color='#d6d3c3',kind='office'){
 const h=floors*2.35;box(color,x,h/2,z,w,h,d);reserve(x,z,w+.65,d+.65);box('#dcd7c8',x,h+.15,z,w+.3,.3,d+.3);
 const cols=Math.max(2,Math.floor(w/2));for(let f=0;f<floors;f++)for(let c=0;c<cols;c++){const xx=x-w/2+(c+.5)*w/cols,y=1.25+f*2.35;box('#b2b5ab',xx,y,z+d/2+.04,w/cols*.81,1.7,.12);box(art.glass,xx,y,z+d/2+.115,w/cols*.68,1.46,.05);box('#e5decd',xx,y,z+d/2+.16,.035,1.5,.06);}
 for(let f=0;f<floors;f++)for(let c=0;c<Math.max(2,Math.floor(d/2));c++){const zz=z-d/2+(c+.5)*d/Math.max(2,Math.floor(d/2)),y=1.25+f*2.35;box(art.glass,x+w/2+.05,y,zz,.06,1.5,1.45);}
 box('#929f98',x-w*.22,h+.65,z-d*.17,1.3,1,1.4);
 if(kind==='shop'){box('#719c9b',x,2.1,z+d/2+.65,w+.5,.15,1.2);box(art.glass,x,1.05,z+d/2+.04,w*.77,1.8,.1);label('街角生活',x,2.5,z+d/2+.07,w*.7,.45);}
 if(kind==='lab'){for(let k=-1;k<=1;k++)box(mat('#47718b',.35,.3),x+k*1.2,h+.4,z,1,.07,2);box('#65959e',x-w/2-.03,h/2,z,.2,h,d*.3);}
 return h;
}
function court(x,z,w=7,d=6){reserve(x,z,w,d);slab('#829d76',x,z,w,d,.04,.06);for(const xx of [-w/2,w/2])box('#e7e0bf',x+xx,.09,z,.05,.01,d);for(const zz of [-d/2,d/2])box('#e7e0bf',x,.09,z+zz,w,.01,.05);const ring=new THREE.Mesh(new THREE.TorusGeometry(1.1,.025,5,40),mat('#e7e0bf'));ring.rotation.x=Math.PI/2;ring.position.set(x,.085,z);scene.add(ring);for(const side of [-1,1]){line('#667a79',[x,.1,z+side*(d/2+.4)],[x,2.5,z+side*(d/2+.4)],.07);box('#f2eee1',x,2.4,z+side*(d/2+.25),1.2,.7,.09);}}
function civic(x,z,name,type='public'){
 const h=roomWindows(x,z,6.7,5.4,type==='lab'?4:2,type==='lab'?'#d1d8cb':'#e0d6bf',type);
 label(name,x,2.9,z+2.81,5.6,.55,'#f1ebd9','#416c80');
 slab(art.pavement,x,z+3.5,3.5,1.7,.09,.12);return h;
}
function buildTheme(t){
 const first=byCell.get(t.cells[0]),x=first.c[0]*SCALE,z=first.c[1]*SCALE,name=t.theme.name;
 let h=6;
 if(/育兒|教育/.test(name)){art.school(x,z-1.7,.36,/育兒/.test(name)?'育兒服務主題':'教育與學習主題',.9);h=7;}
 else if(/運動|體育/.test(name)){court(x,z);h=3;}
 else if(/居住|都更/.test(name)){art.apartment(x,z-1,6.2,5.8,5,'#d3c9b6',keyHash(t.id)%3);h=12.5;}
 else if(/交通/.test(name)){
  reserve(x,z,7.5,7);slab(art.pavement,x,z,7.5,7,.04,.08);box(art.glass,x,1.7,z,5.8,2.8,3.5);box('#c7cfc3',x,3.3,z,6.8,.23,4.5);label('交通與轉乘',x,3.1,z+2.3,5,.55,'#f4eddb','#406980');for(const xx of [-2.7,2.7])box('#688581',x+xx,1.6,z+1.8,.12,3.2,.12);h=4;
 }
 else if(/環保/.test(name)){
  reserve(x,z,7,7);roomWindows(x-1,z,4.5,4.5,2,'#d1d8be','lab');for(const xx of [1.8,3.2])shape('cyl','#88a9a4',x+xx,1.6,z,.65,3.2,.65);label('環境與循環',x,2.8,z+2.3,4.5,.5);h=6;
 }
 else h=civic(x,z,/AI|產業/.test(name)?'科技與學習主題':/銀髮|社福/.test(name)?'照顧與生活主題':/文化/.test(name)?'文化與城市生活':/青年/.test(name)?'青年與工作主題':'公共服務主題',/AI|產業/.test(name)?'lab':'public');
 buildings.push({x,z,w:8,d:8,theme:t.id,type:'policy',height:h});
 for(const id of t.cells.slice(1)){const c=byCell.get(id),xx=c.c[0]*SCALE,zz=c.c[1]*SCALE;roomWindows(xx-1.1,zz-1.2,4.4,4.3,2,'#c7d1c3','shop');buildings.push({x:xx-1.1,z:zz-1.2,w:4.4,d:4.3,theme:t.id,type:'annex',height:5.2});}
 t.height=h;t.anchor.set(x,h+1.7,z);
}
// Existing landmark coordinates remain fixed; ordinary buildings clear their footprint first.
let builtLandmarks=0;
const landmarkGeometries={...art.geo,cyl:new THREE.CylinderGeometry(.5,.5,1,16),cyl6:new THREE.CylinderGeometry(.5,.5,1,6),sphere:new THREE.SphereGeometry(.5,20,14),ico:new THREE.IcosahedronGeometry(.5,1),ico1:new THREE.IcosahedronGeometry(.5,2),cone:new THREE.ConeGeometry(.5,1,16),cone4:new THREE.ConeGeometry(.71,1,4).rotateY(Math.PI/4),dome:new THREE.SphereGeometry(.5,24,14,0,Math.PI*2,0,Math.PI/2),torus:new THREE.TorusGeometry(.5,.11,10,48),frust:new THREE.CylinderGeometry(.5,.35,1,4).rotateY(Math.PI/4)};
const prism=new THREE.BufferGeometry();prism.setAttribute('position',new THREE.Float32BufferAttribute([-.5,-.5,-.5,.5,-.5,-.5,.5,.5,0,-.5,.5,0,-.5,-.5,.5,.5,-.5,.5],3));prism.setIndex([0,3,1,1,3,2,4,5,3,5,2,3,0,4,3,1,2,5,0,1,4,1,5,4]);landmarkGeometries.prism=prism.toNonIndexed();landmarkGeometries.prism.computeVertexNormals();
const landmarkBuckets=new Map(),temp=new THREE.Object3D();
function landmarkPart(key,x,y,z,w,h,d,color,ry=0,rx=0,rz=0){let geometry=landmarkGeometries[key]||art.geo.box;let material=mat(color,.8);if(key==='turf'||key==='turfc')material=art.grass;const k=geometry.uuid+'/'+material.uuid;if(!landmarkBuckets.has(k))landmarkBuckets.set(k,{geometry,material,matrices:[]});temp.position.set(x,y,z);temp.rotation.set(rx,ry,rz);temp.scale.set(w,h,d);temp.updateMatrix();landmarkBuckets.get(k).matrices.push(temp.matrix.clone());}
for(const l of landmarks){
 if(!LANDMARK_BUILD[l.id])throw new Error('Missing landmark '+l.id);
 const sc=l.scale*SCALE,base=new THREE.Matrix4().makeTranslation(l.x,.1,l.z),scaleMatrix=new THREE.Matrix4().makeScale(sc,sc,sc);base.multiply(scaleMatrix);
 const p=(key,x,y,z,w,h,d,c,ry=0,rx=0,rz=0)=>{landmarkPart(key,x,y,z,w,h,d,c,ry,rx,rz);const material=(key==='turf'||key==='turfc')?art.grass:mat(c,.8),geometry=landmarkGeometries[key]||art.geo.box;const entries=landmarkBuckets.get(geometry.uuid+'/'+material.uuid).matrices;entries[entries.length-1].premultiply(base);};
 const height=LANDMARK_BUILD[l.id](p)*sc;l.height=height;builtLandmarks++;
 // A restrained paved edge integrates each cultural landmark into the street fabric.
 if(!l.nature)art.contact(l.x,l.z,l.r*2.7,l.r*2.7,.35);
}
for(const {geometry,material,matrices} of landmarkBuckets.values()){const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);}
for(const t of themeMeta)buildTheme(t);
let highrises=0;
for(const cell of data.cells){
 if(cell.themeId)continue;
 const x=cell.c[0]*SCALE,z=cell.c[1]*SCALE,k=keyHash(cell.id),r=Math.hypot(x+15,z-30);
 if(!clearAt(x,z,3.8)||landmarks.some(l=>Math.hypot(x-l.x,z-l.z)<l.r+4.7))continue;
 if(k%6===0||z<-110&&k%3===0)continue;
 const floors=r<80?4+k%5:2+k%4,w=5.3+(k%3)*.48,d=5.4+(k%2)*.4;
 let h;
 if(cell.zone==='commercial'&&r<90&&highrises<3){h=roomWindows(x,z,w,d,10+highrises*5,['#c8d0c9','#c6c4b9','#b8c7c3'][highrises],'office');highrises++;}
 else if(cell.zone==='residential'||k%4===0){art.apartment(x,z,w,d,floors,['#d6cbbb','#c6cdbf','#d7d5c7'][k%3],k%4);h=floors*2.35+1.4;}
 else if(cell.zone==='technology'){h=roomWindows(x,z,w,d,3+k%3,'#c8d4ca','lab');}
 else if(k%5===0){h=roomWindows(x,z,w,d,2,'#cfbea7','shop');}
 else {h=roomWindows(x,z,w,d,floors,['#d0c8b5','#d4d8cc','#c6c8bd'][k%3],'office');}
 buildings.push({x,z,w,d,height:h,type:cell.zone});
}
// Open lots and land between districts stay green, with deliberate clear lawns and planted groves.
for(let i=0;i<11000;i++){
 const x=between(-140,120),z=between(-190,157);if(!pip(x,z)||boundaryDist(x,z)<5)continue;
 const dense=.5+.25*Math.sin(x*.055+z*.03)+.25*Math.cos(z*.06-x*.03);
 if(rand()>dense*.85)continue;
 tree(x,z,between(3.2,6.6),rand()<.07?1:rand()<.18?2:0);
}
// New foliage in the park and mountain landmark grounds is placed at the existing terrain height.
for(const l of landmarks.filter(l=>['daan','yangming','beitou'].includes(l.id))){
 const sc=l.scale*SCALE,placed=[];const count=l.id==='yangming'?36:l.id==='daan'?13:9;
 for(let n=0;n<250&&placed.length<count;n++){
  const a=rand()*Math.PI*2,r=Math.sqrt(rand())*(l.id==='yangming'?.92:.78),lx=Math.cos(a)*r,lz=Math.sin(a)*r*.82;
  if(l.id==='daan'&&(Math.hypot(lx-.45,lz-.25)<.47||Math.hypot(lx+.45,lz-.3)<.42))continue;
  if(l.id==='beitou'&&(Math.hypot(lx+.25,lz-.15)<.55||Math.hypot(lx-.5,lz+.25)<.48))continue;
  const x=l.x+lx*sc,z=l.z+lz*sc;if(placed.some(p=>Math.hypot(p.x-x,p.z-z)<2.2))continue;
  let y=.06;
  if(l.id==='beitou')y=.08;
  if(l.id==='yangming'){
   const cones=[[0,-.1,1.1,.95,0,1.4],[.2,-.25,.6,.55,.55,1],[.25,-.28,.2,.18,1.51,.22]];
   y=0;for(const [cx,cz,rx,rz,base,height] of cones){const d=Math.hypot((lx-cx)/rx,(lz-cz)/rz);if(d<=1)y=Math.max(y,base+(1-d)*height);}
  }
  tree(x,z,between(3,4.8),0,true,.1+y*sc);placed.push({x,z});
 }
}
// Finer planting on a subset of open street corners, always respecting the same footprint map.
for(let i=0;i<1100;i++){
 const x=between(-120,110),z=between(-175,140);if(!clearAt(x,z,.6))continue;
 if(i%5===0)batch('leaf',i%2?'#738c51':'#8c9e61',x,.3,z,.42,.42,.42);
 else for(let j=0;j<3;j++)batch('cone',i%2?'#a1b573':'#84a464',x+j*.08,.13,z,.03,.26,.03,between(-.3,.3),rand()*6.28);
}
// Sparse street activity, modelled at the same human scale as the approved street sample.
const people=[],cars=[];
for(let i=0;i<roads.length;i++){
 const rd=roads[i];if(i%23!==0||rd.pedestrian)continue;
 const x=(rd.a[0]+rd.b[0])/2,z=(rd.a[1]+rd.b[1])/2;
 const person=art.person(x+(rd.horizontal?0:3.0),z+(rd.horizontal?3.0:0),.85+(i%3)*.12,['#8cb8ca','#c7b194','#a9b9a1'][i%3],'#8d9e98','#60503e','idle',rd.horizontal?.7:2.1);people.push(person);
 if(i%46===0){const car=art.car(x+(rd.horizontal?0:1),z+(rd.horizontal?1:0),['#becdd0','#d4bd91','#90aab2'][i%3],rd.horizontal?Math.PI/2:0);cars.push(car);}
 if(i%46===0&&pip(x,z)){art.lamp(x+(rd.horizontal?0:3),z+(rd.horizontal?3:0));}
}
const childTheme=themeMap.get('tp-childcare');const childCell=byCell.get(childTheme.cells[0]),cx=childCell.c[0]*SCALE,cz=childCell.c[1]*SCALE;
people.push(art.person(cx-.5,cz+3,.85,'#88b5c9','#82999c','#544331','idle',.4),art.person(cx+.8,cz+2.3,.8,'#cfb994','#87998a','#564334','idle',-.4),art.person(cx+1.6,cz+2.9,.55,'#d4b965','#91a7a5','#58402e','idle',0));
for(const [x,z] of [[cx-2.7,cz+4],[-55,25],[-15,-95]])if(pip(x,z))art.bench(x,z);
// Small national flag on the highest landmark, matching the existing city's detail.
const tallest=landmarks.find(l=>l.id==='t101'),flagPoleY=tallest.height;
line('#c5d0c8',[tallest.x,flagPoleY,tallest.z],[tallest.x,flagPoleY+3.5,tallest.z],.045);
const flagTex=art.texture(256,(g,s)=>{g.fillStyle='#c73e36';g.fillRect(0,0,s,s);g.fillStyle='#20447e';g.fillRect(0,0,s*.52,s*.52);g.save();g.translate(s*.26,s*.26);g.fillStyle='#fffdf1';for(let i=0;i<12;i++){g.save();g.rotate(i*Math.PI/6);g.beginPath();g.moveTo(-3,-14);g.lineTo(0,-25);g.lineTo(3,-14);g.fill();g.restore();}g.beginPath();g.arc(0,0,12,0,Math.PI*2);g.fill();g.restore();});
const flag=new THREE.Mesh(new THREE.PlaneGeometry(2.5,1.65),new THREE.MeshStandardMaterial({map:flagTex,side:THREE.DoubleSide,roughness:.9}));flag.position.set(tallest.x+1.2,flagPoleY+2.5,tallest.z);scene.add(flag);
const geometryStats=art.flush();
// Views deliberately review both the whole island and the same detailed street scale.
const gardenLandmark=landmarks.find(l=>l.id==='daan');
const views={overview:{pos:[210,215,295],target:[-20,3,18]},landmarks:{pos:[-122,136,173],target:[-16,32,46]},childcare:{pos:[cx-12,9,cz+18],target:[cx,2.1,cz]},garden:{pos:[gardenLandmark.x-23,15,gardenLandmark.z+25],target:[gardenLandmark.x,2,gardenLandmark.z]}};
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),drawers=document.querySelector('#drawer'),drawerBody=document.querySelector('#drawer-body'),labelsEl=document.querySelector('.labels'),svg=document.querySelector('.guides');
let flight=null,view='overview',lightMode='day',quality='high',labelsOn=true,selected=null,labelKey='',lastFocus=null;
function focus(pos,target,instant=false){if(instant||reduced.matches){flight=null;camera.position.fromArray(pos);controls.target.fromArray(target);controls.update();}else flight={t:performance.now(),from:camera.position.clone(),to:new THREE.Vector3(...pos),startTarget:controls.target.clone(),endTarget:new THREE.Vector3(...target)};labelKey='';}
function go(name,instant=false){view=name;const v=views[name];let pos=new THREE.Vector3(...v.pos);if(name==='overview'){
 const target=new THREE.Vector3(...v.target),direction=pos.clone().sub(target).normalize(),right=new THREE.Vector3(0,1,0).cross(direction).normalize(),up=direction.clone().cross(right).normalize();
 const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanH=tanV*camera.aspect,marginX=1-32/innerWidth,topMargin=1-2*155/innerHeight,bottomMargin=1-2*(innerWidth<760?160:130)/innerHeight;
 const points=coast.map(([x,z])=>new THREE.Vector3(x,0,z));for(const l of landmarks)points.push(new THREE.Vector3(l.x,l.height+4,l.z));
 let distance=0;for(const p of points){const q=p.clone().sub(target),depth=q.dot(direction),vertical=q.dot(up);distance=Math.max(distance,depth+Math.abs(q.dot(right))/(tanH*marginX),depth+Math.abs(vertical)/(tanV*(vertical>=0?topMargin:bottomMargin)));}
 pos.copy(target).addScaledVector(direction,distance*1.03);
 }focus(pos.toArray(),v.target,instant);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));}
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function openDrawer(title,kicker){if(drawers.hidden)lastFocus=document.activeElement;drawers.hidden=false;document.documentElement.classList.add('drawer-open');document.querySelector('#drawer-title').textContent=title;document.querySelector('#drawer-kicker').textContent=kicker;drawerBody.replaceChildren();labelsEl.hidden=true;svg.replaceChildren();}
function closeDrawer(){drawers.hidden=true;document.documentElement.classList.remove('drawer-open');labelsEl.hidden=!labelsOn;document.querySelector('#policy-list').setAttribute('aria-expanded','false');document.querySelector('#landmark-list').setAttribute('aria-expanded','false');labelKey='';lastFocus?.focus?.({preventScroll:true});}
const sources=new Map(data.city.sources.map(s=>[s.id,s]));
function showPolicy(id,move=true){const t=themeMap.get(id);if(!t)return;selected=id;
 if(move)focus([t.anchor.x+19,t.anchor.y+16,t.anchor.z+25],[t.anchor.x,t.height*.4,t.anchor.z]);
 openDrawer(t.theme.name.replace(/^政績・/,''),`${t.rec?'任內政績':'公開政見'} · 臺北市 · ${t.theme.items.length} 項`);
 const back=element('button','← 返回全部政策','back-list');back.onclick=showPolicyList;drawerBody.append(back);
 if(t.theme.summary)drawerBody.append(element('p',t.theme.summary));
 drawerBody.append(element('p','街景建築為視覺示意，不代表政策已落實或真實設施位置。','preview-sign'));
 for(const [i,item] of t.theme.items.entries()){
  const article=element('article',undefined,'policy-item');article.append(element('h3',`${String(i+1).padStart(2,'0')} ${item.name}`));if(item.plain)article.append(element('p',item.plain));
  article.append(element('p',t.rec?'任內紀錄・依來源記載':`公開政見${item.phase?'・'+(typeof item.phase==='string'?item.phase:JSON.stringify(item.phase)):'・時程依來源記載'}`,'status'));
  if(item.facts?.length){const ul=element('ul');for(const fact of item.facts)ul.append(element('li',fact));article.append(ul);}
  for(const sid of item.sources||[]){const s=sources.get(sid);if(!s)continue;const a=element('a',`${s.publisher||'原始來源'} ↗`,'source');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';a.title=s.title||'';article.append(a);}
  drawerBody.append(article);
 }
 drawerBody.append(element('p',`獨立整理，非任何候選人或政黨官方網站。資料查核：${data.checkedAt}。`,'disclaimer'));
 document.querySelector('#drawer-title').tabIndex=-1;document.querySelector('#drawer-title').focus({preventScroll:true});
}
function showPolicyList(){openDrawer('臺北市政策清單','9 個政見主題 · 8 個政績主題');document.querySelector('#policy-list').setAttribute('aria-expanded','true');
 for(const rec of [false,true]){drawerBody.append(element('div',rec?'任內政績':'公開政見','section-title'));for(const t of themeMeta.filter(t=>!!t.rec===rec)){const b=element('button',undefined,'list-row');b.dataset.theme=t.id;b.append(element('span',t.theme.name.replace(/^政績・/,'')),element('span',`${t.theme.items.length} 項 →`));b.onclick=()=>showPolicy(t.id);drawerBody.append(b);}}
 drawerBody.append(element('p','獨立整理，非任何候選人或政黨官方網站。政見與政績分開呈現，街景設施為示意。','disclaimer'));
}
function showLandmark(id){const l=landmarks.find(l=>l.id===id);if(!l)return;
 const target=new THREE.Vector3(l.x,l.height*.45,l.z),distance=Math.max(38,l.height*2.1,l.r*3.6),offset=new THREE.Vector3(1,.85,1.4).normalize().multiplyScalar(distance);focus(target.clone().add(offset).toArray(),target.toArray());openDrawer(l.name,'城市地標 · 沿用原版配置');drawerBody.append(element('span',l.nature?'自然與休憩':'城市與文化','landmark-tag'),element('p','此預覽沿用正式版臺北島中的地標位置與識別造型，採用新版街景的光影、材質與周邊綠化。整體為縮尺城市，不作真實導航。'),element('p','本頁為獨立美術預覽，尚未套用正式城市。','disclaimer'));
 const back=element('button','← 返回地標清單','back-list');back.onclick=showLandmarkList;drawerBody.append(back);
}
function showLandmarkList(){openDrawer('臺北城市地標','16 處地標 · 城市縮尺配置');document.querySelector('#landmark-list').setAttribute('aria-expanded','true');for(const l of landmarks){const b=element('button',undefined,'list-row');b.dataset.landmark=l.id;b.append(element('span',l.name),element('span','前往 →'));b.onclick=()=>showLandmark(l.id);drawerBody.append(b);}}
const markers=[];
for(const [i,t] of themeMeta.entries()){const b=element('button',undefined,'pin'+(t.rec?' record':''));b.dataset.theme=t.id;b.setAttribute('aria-pressed','false');b.append(element('small',t.rec?'政績':String(i+1).padStart(2,'0')),element('span',t.theme.name.replace(/^政績・/,'')));b.onclick=()=>showPolicy(t.id);labelsEl.append(b);markers.push({t,b});}
function updateLabels(){
 if(!labelsOn||!drawers.hidden){labelsEl.hidden=true;svg.replaceChildren();return;}labelsEl.hidden=false;
 const key=[innerWidth,innerHeight,...camera.matrixWorld.elements.map(n=>n.toFixed(3)),selected].join('/');if(key===labelKey)return;labelKey=key;
 svg.setAttribute('width',innerWidth);svg.setAttribute('height',innerHeight);svg.replaceChildren();
 const occupied=[],mobile=innerWidth<760,top=mobile?150:160,bottom=innerHeight-(mobile?155:130),maxX=innerWidth-16,minX=16,far=camera.position.distanceTo(controls.target)>175;
 const sorted=markers.slice().sort((a,b)=>(a.t.rec-b.t.rec)||a.t.anchor.distanceTo(camera.position)-b.t.anchor.distanceTo(camera.position));
 for(const {t,b} of sorted){const p=t.anchor.clone().project(camera);const x=(p.x+1)*innerWidth/2,y=(1-p.y)*innerHeight/2;
  if(p.z<-1||p.z>1||x<0||x>innerWidth||y<top-50||y>innerHeight||far&&t.rec){b.hidden=true;continue;}
  b.hidden=false;b.setAttribute('aria-pressed',String(selected===t.id));const w=b.offsetWidth||130,h=b.offsetHeight||36;
  let placed=null;
  for(let n=0;n<100;n++){const a=n*2.3999,r=n?7*Math.sqrt(n):0,xx=Math.max(minX+w/2,Math.min(maxX-w/2,x+Math.cos(a)*r)),yy=Math.max(top+h/2,Math.min(bottom-h/2,y+Math.sin(a)*r));const rect={x:xx-w/2-4,y:yy-h/2-4,w:w+8,h:h+8};if(!occupied.some(o=>rect.x<o.x+o.w&&rect.x+rect.w>o.x&&rect.y<o.y+o.h&&rect.y+rect.h>o.y)){placed={xx,yy,rect};break;}}
  if(!placed){b.hidden=true;continue;}occupied.push(placed.rect);b.style.left=placed.xx+'px';b.style.top=placed.yy+'px';
  if(Math.hypot(placed.xx-x,placed.yy-y)>12){const l=document.createElementNS('http://www.w3.org/2000/svg','line');for(const [k,v] of Object.entries({x1:x,y1:y,x2:placed.xx,y2:placed.yy,stroke:'#e9f7ff','stroke-width':1.2,'stroke-opacity':.85}))l.setAttribute(k,String(v));svg.append(l);}
 }
}
function setLight(mode){lightMode=mode;const evening=mode==='sunset';sun.position.set(...(evening?[-230,125,140]:[-180,300,170]));sun.color.set(evening?'#ffd09a':'#fff1d8');sun.intensity=evening?3:3.4;hemisphere.intensity=evening?1.6:2.25;hemisphere.color.set(evening?'#d0d8ea':'#d5edff');hemisphere.groundColor.set(evening?'#7f6e52':'#6d7650');sky.material.uniforms.sunPosition.value.copy(sun.position);sky.material.uniforms.turbidity.value=evening?5:3;scene.fog.color.set(evening?'#d5bca4':'#c3dae0');document.querySelectorAll('[data-light]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.light===mode)));}
function setQuality(value){quality=value;renderer.setPixelRatio(Math.min(devicePixelRatio,value==='high'?2:1.25));sun.shadow.mapSize.setScalar(value==='high'?4096:2048);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}renderer.shadowMap.needsUpdate=true;renderer.setSize(innerWidth,innerHeight);document.querySelector('#quality').value=value;}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{closeDrawer();go(b.dataset.view);});document.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>setLight(b.dataset.light));document.querySelector('#quality').onchange=e=>setQuality(e.target.value);
document.querySelector('#policy-list').onclick=showPolicyList;document.querySelector('#landmark-list').onclick=showLandmarkList;document.querySelector('#close-drawer').onclick=closeDrawer;
document.querySelector('#toggle-labels').onclick=()=>{labelsOn=!labelsOn;document.querySelector('#toggle-labels').setAttribute('aria-pressed',String(labelsOn));labelKey='';updateLabels();};
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,id:e.pointerId};});renderer.domElement.addEventListener('pointercancel',()=>down=null);
renderer.domElement.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6){down=null;return;}down=null;if(!drawers.hidden){closeDrawer();return;}pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);raycaster.setFromCamera(pointer,camera);const point=new THREE.Vector3();if(!raycaster.ray.intersectPlane(groundPlane,point))return;const cell=data.cells.find(c=>c.themeId&&Math.abs(point.x-c.c[0]*SCALE)<data.half*SCALE-1.9&&Math.abs(point.z-c.c[1]*SCALE)<data.half*SCALE-1.9);if(cell)showPolicy(cell.themeId,false);});
controls.addEventListener('start',()=>flight=null);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!drawers.hidden)closeDrawer();});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);labelKey='';});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.querySelector('#loading').hidden=false;document.querySelector('#loading-text').textContent='3D 顯示已中斷，請重新載入。';document.querySelector('#retry').hidden=false;document.querySelector('#retry').onclick=()=>location.reload();});
go('overview',true);
let first=true,lastLabelUpdate=0;
function updateNear(){const near=Math.max(.2,Math.min(4,camera.position.distanceTo(controls.target)*.008));if(Math.abs(camera.near-near)>.01){camera.near=near;camera.updateProjectionMatrix();}}
function render(t=0){if(flight){const a=Math.min(1,(t-flight.t)/1200),s=a*a*(3-2*a);camera.position.lerpVectors(flight.from,flight.to,s);controls.target.lerpVectors(flight.startTarget,flight.endTarget,s);if(a===1)flight=null;}controls.update();updateNear();if(seaMaterial.userData.shader)seaMaterial.userData.shader.uniforms.uSeaTime.value=reduced.matches?0:t*.001;renderer.render(scene,camera);if(t-lastLabelUpdate>70||first){updateLabels();lastLabelUpdate=t;}if(first){document.querySelector('#loading').hidden=true;document.documentElement.dataset.ready='true';document.querySelector('#stats').textContent=`${buildings.length} 棟建築・${geometryStats.trees} 棵樹`;first=false;}requestAnimationFrame(render);}
window.TAIPEI_PREVIEW={scene,camera,controls,renderer,data,buildings,landmarks,roads,people,themeMeta,art,views,go,showPolicy,showPolicyList,showLandmark,showLandmarkList,closeDrawer,setLight,setQuality,geometryStats,snapshot(name){if(name)go(name,true);if(flight){camera.position.copy(flight.to);controls.target.copy(flight.endTarget);flight=null;}controls.update();updateNear();camera.updateMatrixWorld();renderer.render(scene,camera);labelKey='';updateLabels();return {view,light:lightMode,quality,themes:themeMeta.length,landmarks:builtLandmarks,buildings:buildings.length,...geometryStats,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}};
render();
