import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {createStreetArt} from './street-art-kit.js?rev=2';
import {createTaipeiCityPlan} from './taipei-city-layout.js?rev=1';
import {createTaipeiCityKit} from './taipei-city-kit.js?rev=1';
import {planTaipeiWater,buildTaipeiWater,inside,edgeDistance} from './taipei-city-water.js?rev=1';
import {createTaipeiLife} from './taipei-city-life.js?rev=1';
import {createTaipeiRoads} from './taipei-city-roads.js?rev=1';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {LANDMARK_BUILD} from './taipei-landmarks.js?rev=1';

// Separate review scene. Production HTML, models, counter and music are not imported or modified.
const response=await fetch('./taipei-preview-data.json?rev=1',{cache:'no-cache'});
if(!response.ok)throw new Error('Preview data unavailable');
const data=await response.json(),plan=createTaipeiCityPlan(data),ponds=planTaipeiWater(plan);
const scene=new THREE.Scene();scene.background=new THREE.Color('#8fc7e2');scene.fog=new THREE.Fog('#a9cddd',950,2800);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.querySelector('#stage').append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.3,4200),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=7;controls.maxDistance=1800;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI*.48;
const hemisphere=new THREE.HemisphereLight('#d5edff','#768264',1.35);scene.add(hemisphere);
const sun=new THREE.DirectionalLight('#fff0d4',2.8);sun.position.set(-320,560,290);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-410,right:410,top:410,bottom:-410,near:1,far:1800});sun.shadow.normalBias=.06;sun.shadow.bias=-.0001;sun.shadow.radius=3;scene.add(sun,sun.target);
const sky=new Sky();sky.scale.setScalar(3500);Object.assign(sky.material.uniforms.turbidity,{value:3});sky.material.uniforms.rayleigh.value=1.1;sky.material.uniforms.mieCoefficient.value=.006;sky.material.uniforms.mieDirectionalG.value=.8;sky.material.uniforms.sunPosition.value.copy(sun.position);scene.add(sky);
const art=createStreetArt(renderer,scene),{box,ball,batch,line,mat,shape,slab,label,rand,between,tree,reserve,clearAt}=art;
const cityKit=createTaipeiCityKit(art,scene);
const pmrem=new THREE.PMREMGenerator(renderer),studio=new RoomEnvironment();const environment=pmrem.fromScene(studio,.04);scene.environment=environment.texture;studio.dispose();pmrem.dispose();
const SCALE=plan.scale,coast=plan.coast;
function pip(x,z,P=coast){let inside=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function distSeg(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
function boundaryDist(x,z){let d=Infinity;for(let i=0;i<coast.length;i++)d=Math.min(d,distSeg(x,z,coast[i],coast[(i+1)%coast.length]));return d;}
function polygon(points,y,material,depth=0,holes=[]){const s=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));for(const points of holes)s.holes.push(new THREE.Path(points.map(([x,z])=>new THREE.Vector2(x,-z))));const g=depth?new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:1}):new THREE.ShapeGeometry(s);g.rotateX(-Math.PI/2);g.translate(0,y,0);const mesh=new THREE.Mesh(g,typeof material==='string'?mat(material):material);mesh.receiveShadow=true;scene.add(mesh);return mesh;}
polygon(coast.map(([x,z])=>[x*1.035,z*1.035]),-2.5,'#d6c7a2',2.1);
polygon(coast,.01,art.grass,0,ponds.map(p=>p.bank));
buildTaipeiWater(art,scene,ponds);
const seaMaterial=new THREE.MeshStandardMaterial({color:'#2589ac',roughness:.32,metalness:.07,envMapIntensity:.3});
seaMaterial.onBeforeCompile=shader=>{shader.uniforms.uSeaTime={value:0};seaMaterial.userData.shader=shader;shader.vertexShader='uniform float uSeaTime;\nvarying vec2 vSea;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
vSea=position.xy;
transformed.z+=sin(position.x*.035+uSeaTime*.25)*.13+sin(position.y*.06-uSeaTime*.21)*.10;`);shader.fragmentShader='varying vec2 vSea;\nuniform float uSeaTime;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float wave=sin(vSea.x*.09+vSea.y*.055+uSeaTime*.24)*.5+sin(vSea.y*.13-uSeaTime*.19)*.3;
diffuseColor.rgb*=.96+wave*.045;`);};
const sea=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000,160,160),seaMaterial);sea.rotation.x=-Math.PI/2;sea.position.y=-1.55;scene.add(sea);
// All shoreline checks include tree crown clearance; no trees in the sea or on paths.
art.setLandCheck((x,z,r)=>pip(x,z)&&boundaryDist(x,z)>r+2&&ponds.every(p=>!inside([x,z],p.walk)&&edgeDistance([x,z],p.walk)>r));
const landmarks=plan.landmarks;
for(const l of landmarks)reserve(l.x,l.z,l.r*2+.8,l.r*2+.8);
const roads=plan.roads;
for(const rd of roads){const a=rd.a,b=rd.b,x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,length=Math.hypot(b[0]-a[0],b[1]-a[1]),width=rd.pedestrian?2.8:4.8;reserve(x,z,rd.horizontal?length+1:width+2,rd.horizontal?width+2:length+1);}
const roadSurface=createTaipeiRoads(art,scene,renderer,roads);
for(let i=0;i<roads.length;i+=10){const rd=roads[i],x=(rd.a[0]+rd.b[0])/2+(rd.horizontal?0:3.1),z=(rd.a[1]+rd.b[1])/2+(rd.horizontal?3.1:0);if(pip(x,z))art.lamp(x,z);}
const byCell=new Map(data.cells.map(c=>[c.id,c]));
const themeMeta=plan.parcels.filter(p=>p.kind==='policy').map(p=>({...p.theme,x:p.x,z:p.z,w:p.usableW,d:p.usableD,sceneKind:p.sceneKind,sceneName:p.sceneName,sceneNote:p.sceneNote,anchor:new THREE.Vector3(),height:6}));
const themeMap=new Map(themeMeta.map(t=>[t.id,t]));
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
for(const p of plan.parcels.filter(p=>p.kind==='policy')){cityKit.policy(p);const t=themeMap.get(p.id);t.height=p.height;t.anchor.copy(p.anchor);t.features=p.features;}
const ordinary=plan.parcels.filter(p=>p.kind==='urban');
const highCandidates=ordinary.filter(p=>['commercial','technology'].includes(p.zone)).sort((a,b)=>Math.hypot(a.x+40,a.z-10)-Math.hypot(b.x+40,b.z-10)).slice(0,8);
const highKinds=['curvedGlass','artDeco','twinCylinders','slopedCrown','asymmetricTwins','setbackResidential','mixedUse','bracedSpire'];
for(const p of ordinary){const index=highCandidates.indexOf(p);if(index>=0)cityKit.highrise(p,highKinds[index]);else cityKit.urban(p);}
const buildings=cityKit.records;
// Open lots and land between districts stay green, with deliberate clear lawns and planted groves.
const xs=coast.map(p=>p[0]),zs=coast.map(p=>p[1]);
for(let i=0;i<14000&&art.treeSites.length<900;i++){
 const x=between(Math.min(...xs),Math.max(...xs)),z=between(Math.min(...zs),Math.max(...zs));if(!pip(x,z)||boundaryDist(x,z)<5)continue;
 const dense=.5+.25*Math.sin(x*.055+z*.03)+.25*Math.cos(z*.06-x*.03);
 if(rand()>dense*.85)continue;
 tree(x,z,between(4.8,8.2),rand()<.07?1:rand()<.18?2:0);
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
 const x=between(Math.min(...xs),Math.max(...xs)),z=between(Math.min(...zs),Math.max(...zs));if(!clearAt(x,z,.6))continue;
 if(i%5===0)batch('leaf',i%2?'#738c51':'#8c9e61',x,.3,z,.42,.42,.42);
 else for(let j=0;j<3;j++)batch('cone',i%2?'#a1b573':'#84a464',x+j*.08,.13,z,.03,.26,.03,between(-.3,.3),rand()*6.28);
}
// Instanced residents and vehicles follow only actual street/sidewalk loops.
plan.ponds=ponds;const life=createTaipeiLife(art,scene,plan),people=life.people,cars=life.cars;
const childTheme=themeMap.get('tp-childcare'),cx=childTheme.x,cz=childTheme.z;
for(const p of plan.parcels.filter(p=>p.kind==='park')){const x=p.x+p.usableW*.4,z=p.z;if(clearAt(x,z,.7)){art.bench(x,z);reserve(x,z,3,2);}}
// Small national flag on the highest landmark, matching the existing city's detail.
const tallest=landmarks.find(l=>l.id==='t101'),flagPoleY=tallest.height;
line('#c5d0c8',[tallest.x,flagPoleY,tallest.z],[tallest.x,flagPoleY+3.5,tallest.z],.045);
const flagTex=art.texture(256,(g,s)=>{g.fillStyle='#c73e36';g.fillRect(0,0,s,s);g.fillStyle='#20447e';g.fillRect(0,0,s*.52,s*.52);g.save();g.translate(s*.26,s*.26);g.fillStyle='#fffdf1';for(let i=0;i<12;i++){g.save();g.rotate(i*Math.PI/6);g.beginPath();g.moveTo(-3,-14);g.lineTo(0,-25);g.lineTo(3,-14);g.fill();g.restore();}g.beginPath();g.arc(0,0,12,0,Math.PI*2);g.fill();g.restore();});
const flag=new THREE.Mesh(new THREE.PlaneGeometry(2.5,1.65),new THREE.MeshStandardMaterial({map:flagTex,side:THREE.DoubleSide,roughness:.9}));flag.position.set(tallest.x+1.2,flagPoleY+2.5,tallest.z);scene.add(flag);
const cloudTexture=art.texture(256,(g,size)=>{g.clearRect(0,0,size,size);for(let k=0;k<11;k++){const x=between(45,210),y=between(85,160),r=between(20,53),gradient=g.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,'rgba(255,253,242,.8)');gradient.addColorStop(.5,'rgba(255,253,242,.55)');gradient.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gradient;g.fillRect(x-r,y-r,r*2,r*2);}});cloudTexture.wrapS=cloudTexture.wrapT=THREE.ClampToEdgeWrapping;
const clouds=[];for(let k=0;k<12;k++){const a=k*Math.PI/6,o=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTexture,transparent:true,opacity:.75,depthWrite:false,toneMapped:false,fog:true}));o.position.set(Math.cos(a)*850,170+(k%3)*22,Math.sin(a)*850);o.scale.set(190+(k%3)*20,95,1);scene.add(o);clouds.push(o);}
const geometryStats=art.flush();
// Reuse the approved soft-contact batching without discarding any trees.
scene.updateMatrixWorld(true);const shadowGroups=new Map();
for(const o of [...scene.children]){if(!o.isMesh||o.isInstancedMesh||o.geometry.type!=='PlaneGeometry'||!o.material.isMeshBasicMaterial||!o.material.transparent||o.material.depthWrite||!o.material.map)continue;const key=o.material.map.uuid+'/'+o.material.opacity;if(!shadowGroups.has(key))shadowGroups.set(key,[]);shadowGroups.get(key).push(o);}
for(const group of shadowGroups.values()){const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),group[0].material,group.length);for(let i=0;i<group.length;i++){const o=group[i],p=o.geometry.parameters;mesh.setMatrixAt(i,o.matrixWorld.clone().multiply(new THREE.Matrix4().makeScale(p.width,p.height,1)));o.removeFromParent();o.geometry.dispose();if(i)o.material.dispose();}mesh.castShadow=false;mesh.receiveShadow=false;scene.add(mesh);}
const cluster=ordinary.filter(p=>p.cells.length>1).sort((a,b)=>Math.hypot(a.x+75,a.z-10)-Math.hypot(b.x+75,b.z-10))[0]||ordinary[0],garden=ponds[0];
const views={neighbourhood:{pos:[cluster.x+63,55,cluster.z+77],target:[cluster.x,13,cluster.z]},overview:{pos:[430,360,570],target:[-35,26,6]},landmarks:{pos:[-250,210,300],target:[-25,55,60]},childcare:{pos:[cx+49,31,cz+57],target:[cx,3.5,cz]},garden:{pos:[garden.x-48,37,garden.z+59],target:[garden.x,3,garden.z]}};
const composer=new EffectComposer(renderer);if(renderer.capabilities.isWebGL2){composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;}composer.addPass(new RenderPass(scene,camera));
const ao=new SSAOPass(scene,camera,innerWidth,innerHeight);ao.kernelRadius=1.8;ao.minDistance=.00005;ao.maxDistance=.008;composer.addPass(ao);composer.addPass(new OutputPass());
renderer.info.autoReset=false;
function draw(){renderer.info.reset();composer.render();}
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),drawers=document.querySelector('#drawer'),drawerBody=document.querySelector('#drawer-body'),labelsEl=document.querySelector('.labels'),svg=document.querySelector('.guides');
let flight=null,view='overview',lightMode='day',quality='high',labelsOn=true,selected=null,labelKey='',lastFocus=null;
function focus(pos,target,instant=false){if(instant||reduced.matches){flight=null;camera.position.fromArray(pos);controls.target.fromArray(target);controls.update();}else flight={t:performance.now(),from:camera.position.clone(),to:new THREE.Vector3(...pos),startTarget:controls.target.clone(),endTarget:new THREE.Vector3(...target)};labelKey='';}
function go(name,instant=false){view=name;const v=views[name];let pos=new THREE.Vector3(...v.pos);if(name==='overview'){
 const target=new THREE.Vector3(...v.target),direction=pos.clone().sub(target).normalize(),right=new THREE.Vector3(0,1,0).cross(direction).normalize(),up=direction.clone().cross(right).normalize();
 const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanH=tanV*camera.aspect,marginX=1-32/innerWidth,topMargin=1-2*155/innerHeight,bottomMargin=1-2*(innerWidth<760?160:130)/innerHeight;
 const points=coast.map(([x,z])=>new THREE.Vector3(x,0,z));for(const l of [...landmarks,...buildings])points.push(new THREE.Vector3(l.x,l.height+4,l.z));
 let distance=0;for(const p of points){const q=p.clone().sub(target),depth=q.dot(direction),vertical=q.dot(up);distance=Math.max(distance,depth+Math.abs(q.dot(right))/(tanH*marginX),depth+Math.abs(vertical)/(tanV*(vertical>=0?topMargin:bottomMargin)));}
 controls.maxDistance=Math.max(1800,distance*1.08);pos.copy(target).addScaledVector(direction,distance*1.03);
 }else if(camera.aspect<.85){const target=new THREE.Vector3(...v.target);pos.sub(target).multiplyScalar(Math.min(2,.85/camera.aspect)).add(target);}
 focus(pos.toArray(),v.target,instant);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));}
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function openDrawer(title,kicker){if(drawers.hidden)lastFocus=document.activeElement;drawers.hidden=false;document.documentElement.classList.add('drawer-open');document.querySelector('#drawer-title').textContent=title;document.querySelector('#drawer-kicker').textContent=kicker;drawerBody.replaceChildren();labelsEl.hidden=true;svg.replaceChildren();}
function closeDrawer(){drawers.hidden=true;document.documentElement.classList.remove('drawer-open');labelsEl.hidden=!labelsOn;document.querySelector('#policy-list').setAttribute('aria-expanded','false');document.querySelector('#landmark-list').setAttribute('aria-expanded','false');labelKey='';lastFocus?.focus?.({preventScroll:true});}
const sources=new Map(data.city.sources.map(s=>[s.id,s]));
function showPolicy(id,move=true){const t=themeMap.get(id);if(!t)return;selected=id;
 if(move){const target=new THREE.Vector3(t.x,t.height*.35,t.z),distance=Math.max(52,t.height*2.25,t.w*1.6,t.d*1.5)/Math.min(1,camera.aspect*1.5),pos=target.clone().add(new THREE.Vector3(1,.8,1.4).normalize().multiplyScalar(distance));focus(pos.toArray(),target.toArray());}
 openDrawer(t.theme.name.replace(/^政績・/,''),`${t.rec?'任內政績':'公開政見'} · 臺北市 · ${t.theme.items.length} 項`);
 const back=element('button','← 返回全部政策','back-list');back.onclick=showPolicyList;drawerBody.append(back);
 if(t.theme.summary)drawerBody.append(element('p',t.theme.summary));
 drawerBody.append(element('p',`建築示意：${t.sceneName}。${t.sceneNote}。`,'preview-sign'));
 drawerBody.append(element('p','建築與人車為互動場景示意，不代表政策已落實或真實設施位置。','preview-sign'));
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
function setLight(mode){lightMode=mode;const evening=mode==='sunset';sun.position.set(...(evening?[-420,230,250]:[-320,560,290]));sun.color.set(evening?'#ffd09a':'#fff1d8');sun.intensity=evening?2.55:2.8;hemisphere.intensity=evening?1.05:1.35;hemisphere.color.set(evening?'#d0d8ea':'#d5edff');hemisphere.groundColor.set(evening?'#7f6e52':'#6d7650');sky.material.uniforms.sunPosition.value.copy(sun.position);sky.material.uniforms.turbidity.value=evening?5:3;scene.fog.color.set(evening?'#d5bca4':'#a9cddd');clouds.forEach(c=>c.material.color.set(evening?'#ffe4c4':'#ffffff'));document.querySelectorAll('[data-light]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.light===mode)));}
function setQuality(value){quality=value;renderer.setPixelRatio(Math.min(devicePixelRatio,value==='high'?2:1.25));sun.shadow.mapSize.setScalar(value==='high'?4096:2048);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}renderer.shadowMap.needsUpdate=true;renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);ao.enabled=value==='high';document.querySelector('#quality').value=value;}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{closeDrawer();go(b.dataset.view);});document.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>setLight(b.dataset.light));document.querySelector('#quality').onchange=e=>setQuality(e.target.value);
document.querySelector('#policy-list').onclick=showPolicyList;document.querySelector('#landmark-list').onclick=showLandmarkList;document.querySelector('#close-drawer').onclick=closeDrawer;
life.setEnabled(!reduced.matches);document.querySelector('#toggle-motion').setAttribute('aria-pressed',String(life.enabled));document.querySelector('#toggle-motion').onclick=()=>{life.setEnabled(!life.enabled);document.querySelector('#toggle-motion').setAttribute('aria-pressed',String(life.enabled));};reduced.addEventListener('change',e=>{if(e.matches){life.setEnabled(false);document.querySelector('#toggle-motion').setAttribute('aria-pressed','false');}});
document.querySelector('#toggle-labels').onclick=()=>{labelsOn=!labelsOn;document.querySelector('#toggle-labels').setAttribute('aria-pressed',String(labelsOn));labelKey='';updateLabels();};
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,id:e.pointerId};});renderer.domElement.addEventListener('pointercancel',()=>down=null);
renderer.domElement.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6){down=null;return;}down=null;if(!drawers.hidden){closeDrawer();return;}pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(cityKit.picks)[0];if(hit){showPolicy(hit.object.userData.theme,false);return;}const point=new THREE.Vector3();if(!raycaster.ray.intersectPlane(groundPlane,point))return;const parcel=plan.parcels.find(p=>p.kind==='policy'&&Math.abs(point.x-p.x)<p.usableW/2&&Math.abs(point.z-p.z)<p.usableD/2);if(parcel)showPolicy(parcel.id,false);});
controls.addEventListener('start',()=>flight=null);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!drawers.hidden)closeDrawer();});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);labelKey='';});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.querySelector('#loading').hidden=false;document.querySelector('#loading-text').textContent='3D 顯示已中斷，請重新載入。';document.querySelector('#retry').hidden=false;document.querySelector('#retry').onclick=()=>location.reload();});
const initialView=new URLSearchParams(location.search).get('view');go(Object.hasOwn(views,initialView)?initialView:'overview',true);
let first=true,lastLabelUpdate=0,lastFrame=null;
function updateNear(){const near=Math.max(.25,Math.min(80,camera.position.distanceTo(controls.target)*.035,camera.position.y*.2));if(Math.abs(camera.near-near)>.01){camera.near=near;camera.updateProjectionMatrix();}}
function render(t=0){const dt=lastFrame===null?0:Math.min(.05,Math.max(0,(t-lastFrame)/1000));lastFrame=t;life.update(dt);if(flight){const a=Math.min(1,(t-flight.t)/1200),s=a*a*(3-2*a);camera.position.lerpVectors(flight.from,flight.to,s);controls.target.lerpVectors(flight.startTarget,flight.endTarget,s);if(a===1)flight=null;}controls.update();updateNear();if(seaMaterial.userData.shader)seaMaterial.userData.shader.uniforms.uSeaTime.value=reduced.matches?0:t*.001;draw();if(t-lastLabelUpdate>70||first){updateLabels();lastLabelUpdate=t;}if(first){document.querySelector('#loading').hidden=true;document.documentElement.dataset.ready='true';document.querySelector('#stats').textContent=`17 個主題場景・${ponds.length} 處水景・${people.length} 位民眾／${cars.length} 輛車`;first=false;}requestAnimationFrame(render);}
window.TAIPEI_CITY={scene,camera,controls,renderer,data,buildings,landmarks,roads,people,cars,themeMeta,art,cityKit,plan,ponds,life,roadSurface,ao,composer,views,go,showPolicy,showPolicyList,showLandmark,showLandmarkList,closeDrawer,setLight,setQuality,geometryStats,snapshot(name,renderScene=true){if(name)go(name,true);if(flight){camera.position.copy(flight.to);controls.target.copy(flight.endTarget);flight=null;}controls.update();updateNear();camera.updateMatrixWorld();scene.updateMatrixWorld(true);if(renderScene)draw();labelKey='';updateLabels();return {view,light:lightMode,quality,themes:themeMeta.length,landmarks:builtLandmarks,buildings:buildings.length,...geometryStats,people:people.length,cars:cars.length,lakes:ponds.length,animationTime:life.clock,motion:life.enabled,merged:plan.parcels.filter(p=>p.cells.length>1).length,policyScenes:themeMeta.map(t=>({id:t.id,kind:t.sceneKind,features:t.features})),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}};
window.__taipeiCityFrame=render;render();
