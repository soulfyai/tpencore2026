import {craftDistrict} from './district-craft-v1.js';
import * as THREE from 'three';
import {landmarkFootprints,fillStreetBlocks,plantDenseLandscape,createProminentFlag} from './street-infill-v046.js';
import {createStreetArt} from './street-art-kit.js?rev=2';
import {createPolicyDistrictPlan as createTaipeiCityPlan,plantPolicyDistrictLandscape} from './policy-district-layout-v044.js';
import {buildPolicyAmenities,buildPolicyCampus} from './policy-amenities-v044.js';
import {createPolicyDistrictPlan as createRegionalCityPlan} from './policy-district-layout-v044.js';
import {createTaipeiCityKit} from './v044-taipei-kit.js';
import {createRegionalCityKit} from './regional-kit.js?rev=1';
import {REGIONAL_CITIES} from './regional-config.js?rev=1';
import {planTaipeiWater,buildTaipeiWater,inside,edgeDistance} from './taipei-city-water.js?rev=1';
import {createTaipeiLife} from './v049-taipei-life.js';
import {createRegionalLife} from './v049-regional-life.js';
import {createRegionalAircraft} from './review-models.js?rev=1';
import {createTaipeiRoads} from './taipei-city-roads.js?rev=2';
import {plantTaipeiForest} from './taipei-city-nature.js?rev=1';
import {createVariedStreetElements as createDetailStreetElements} from './v044-architecture.js';
import {LANDMARK_BUILD} from './taipei-landmarks.js?rev=1';

export function createReviewedFacades(art,scene,cityLabel){const {box,ball,line,shape,batch,texture,mat,between,rand}=art;
const features={buildings:[],trees:0,benches:0,shopfronts:0,people:0,cars:0,flag:false};
const keep=o=>{o.userData.keepDynamic=true;return o;};
function group(x,z,rotation=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);return g;}
function material(c,map,roughness=.86){return new THREE.MeshStandardMaterial({color:c,map,roughness,envMapIntensity:.23,bumpMap:map,bumpScale:.035});}
const tile=texture(256,(g,s)=>{g.fillStyle='#dedbd0';g.fillRect(0,0,s,s);for(let y=0;y<16;y++)for(let x=0;x<16;x++){g.fillStyle=`hsl(39 8% ${between(78,91)}%)`;g.fillRect(x*16+1,y*16+1,14,14);}});
const stone=texture(512,(g,s)=>{g.fillStyle='#dbd3bd';g.fillRect(0,0,s,s);for(let y=0;y<16;y++)for(let x=-1;x<8;x++){g.fillStyle=`hsl(40 18% ${between(74,86)}%)`;g.fillRect(x*64+(y%2)*32+1,y*32+1,62,30);}for(let i=0;i<40000;i++){g.fillStyle=rand()<.5?'#fff3':'#594e3c17';g.fillRect(rand()*s,rand()*s,1,1);}});
const tarmac=texture(512,(g,s)=>{g.fillStyle='#49575a';g.fillRect(0,0,s,s);for(let i=0;i<75000;i++){g.fillStyle=rand()<.5?'#c4c6bd2b':'#12232b35';g.fillRect(rand()*s,rand()*s,between(.3,1.5),between(.3,1.5));}});
const roofTile=texture(256,(g,s)=>{g.fillStyle='#ae6d4c';g.fillRect(0,0,s,s);for(let x=0;x<16;x++){const gr=g.createLinearGradient(x*16,0,(x+1)*16,0);gr.addColorStop(0,'#885237');gr.addColorStop(.5,'#cb9270');gr.addColorStop(1,'#a16546');g.fillStyle=gr;g.fillRect(x*16,0,16,s);}g.strokeStyle='#744832';for(let y=0;y<16;y++){g.beginPath();g.moveTo(0,y*16);g.lineTo(s,y*16);g.stroke();}});
tile.repeat.set(7,7);stone.repeat.set(6,6);
const lawn=new THREE.MeshStandardMaterial({map:art.grass.map,color:'#d4dfb5',roughness:1,envMapIntensity:.15});
lawn.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vLawn;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLawn=(modelMatrix*vec4(transformed,1.)).xyz;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vLawn;').replace('#include <map_fragment>','#include <map_fragment>\nfloat turfVariation=sin(vLawn.x*.25+sin(vLawn.z*.19))*sin(vLawn.z*.33); diffuseColor.rgb*=.95+turfVariation*.10;');};
const pavement=material('#f2ead6',stone),asphalt=material('#b5bfbd',tarmac,1),terracotta=material('#dfc2a4',roofTile);
const glass=new THREE.MeshPhysicalMaterial({color:'#668f98',roughness:.23,metalness:.36,clearcoat:.8,envMapIntensity:.6});
const darkGlass=new THREE.MeshPhysicalMaterial({color:'#365d68',roughness:.2,metalness:.35,clearcoat:.7,envMapIntensity:.65});
function paving(x,z,w,d,y=.16,parent=scene){return box(pavement,x,y,z,w,.24,d,parent);}
function planter(x,y,z,w=1.5,d=.65,parent=scene){box('#a88b68',x,y,z,w,.35,d,parent);box('#5a5140',x,y+.19,z,w-.12,.04,d-.12,parent);for(let i=0;i<6;i++)shape('leaf',['#54784c','#6c8b51','#8da35c'][i%3],x+between(-w*.4,w*.4),y+.35,z+between(-d*.3,d*.3),.3,.3,.3,parent);}
function rail(x,y,z,w,parent=scene){box('#788b81',x,y+.65,z,w,.045,.045,parent);for(let q=-w/2;q<=w/2;q+=.26)box('#88968a',x+q,y+.34,z,.025,.64,.025,parent);}
function windowBay(x,y,z,w=1.5,h=1.9,parent=scene,balcony=false){box('#b6b4a0',x,y,z,w+.22,h+.22,.13,parent);box(glass,x,y,z+.09,w,h,.08,parent);box('#e9dfc7',x,y,z+.15,.055,h,.08,parent);box('#eee7d4',x,y+.1,z+.15,w,.05,.08,parent);
 box('#ddd4b9',x,y-h/2-.12,z+.18,w+.38,.12,.38,parent);
 if(balcony){box('#dcd4bb',x,y-h/2-.2,z+.55,w+.75,.16,1.2,parent);rail(x,y-h/2-.1,z+1.08,w+.65,parent);if(rand()<.55)planter(x+.28,y-h/2+.1,z+.75,.8,.38,parent);}
 else if(rand()<.2){box('#c8d0c4',x+w*.38,y-h*.25,z+.37,.52,.45,.45,parent);for(let k=0;k<4;k++)box('#758b86',x+w*.38,y-h*.25-.14+k*.09,z+.6,.38,.022,.025,parent);}}
function sign(text,x,y,z,w,h,bg='#f2e5c9',color='#42626a',parent=scene){return art.label(text,x,y,z,w,h,bg,color,parent);}
function roofGarden(g,w,d,h){box('#c7c2a9',0,h+.12,0,w+.5,.25,d+.5,g);for(const z of [-d/2,d/2])box('#e1d8bf',0,h+.55,z,w,.8,.2,g);for(const x of [-w/2,w/2])box('#e1d8bf',x,h+.55,0,.2,.8,d,g);
 for(const x of [-w*.3,w*.28])planter(x,h+.42,d*.25,2.8,.85,g);
 for(let i=0;i<3;i++)box(mat('#335d6b',.3,.4),-w*.22+i*1.1,h+.42,-d*.25,.95,.1,2,g,-.12);
 box('#c5c9b9',w*.23,h+.65,-d*.22,2.1,1.1,1.8,g);for(let i=0;i<7;i++)box('#87958c',w*.23-.8+i*.26,h+.75,-d*.22+.92,.075,.65,.025,g);
 const tank=shape('cyl','#9bada5',-w*.32,h+1.25,0,.72,1.65,.72,g);tank.material=mat('#9bada5',.35,.55);shape('cone','#b5c2b8',-w*.32,h+2.15,0,.77,.25,.77,g);}
function awning(x,y,z,w,c,parent){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.x=.25;parent.add(g);for(let i=0;i<12;i++)box(i%2?'#efe5cc':c,-w/2+(i+.5)*w/12,0,0,w/12,.055,1.7,g);for(let i=0;i<12;i++)box(i%2?'#efe5cc':c,-w/2+(i+.5)*w/12,-.16,.83,w/12,.3,.04,g);}
function storefront(g,x,z,w,name,color){features.shopfronts++;box('#e4dbc4',x,1.65,z,w,3.2,.18,g);box(darkGlass,x,1.5,z+.12,w-.35,2.6,.07,g);
 for(let k=-1;k<=1;k++)box('#e0d5b8',x+k*w*.28,1.5,z+.2,.065,2.7,.08,g);
 box('#ccbfa0',x,.15,z+.25,w+.3,.2,.7,g);sign(name,x,3.12,z+.2,w-.2,.58,'#f1e4c6',color,g);awning(x,2.75,z+.94,w-.15,color,g);
 for(const xx of [-w*.38,w*.38])planter(x+xx,.32,z+1.2,.52,.52,g);
 // Display shelves behind the shop glass, with handmade books/bread.
 for(let i=0;i<3;i++){box('#ae8d62',x, .55+i*.5,z-.03,w*.7,.06,.25,g);for(let q=0;q<7;q++)box(['#c38b56','#b9b17e','#b66e51','#799c96'][q%4],x-w*.29+q*w*.095,.7+i*.5,z+.03,w*.055,.22,.12,g);}}
function apartment({name,x,z,w,d,floors,tone,rotation=0,shops=[]}){art.reserve(x,z,Math.abs(Math.cos(rotation))*w+Math.abs(Math.sin(rotation))*d+3,Math.abs(Math.sin(rotation))*w+Math.abs(Math.cos(rotation))*d+5);const g=group(x,z,rotation),wall=material(tone,tile),h=3.45+floors*2.65;features.buildings.push({name,x,z,height:h,type:'住宅與騎樓',detail:'磁磚立面、退台、陽台花台、屋頂設備、店面騎樓'});
 box(wall,0,h/2+.2,0,w,h,d,g);box('#c4bdab',0,.2,0,w+.6,.4,d+.6,g);
 // Ground floor recessed arcade, columns support the balcony above.
 box('#666b5a',0,1.6,d/2+.04,w-.3,2.8,.08,g);paving(0,d/2+.9,w+1,2.8,.19,g);
 for(let i=0;i<=Math.floor(w/3.5);i++){const xx=-w/2+i*w/Math.floor(w/3.5);box('#e4d8bf',xx,1.7,d/2+1.35,.35,3.2,.35,g);box('#c5b99d',xx,.42,d/2+1.35,.5,.48,.5,g);}
 const cols=Math.floor(w/2.9);for(let f=0;f<floors;f++){const y=4.65+f*2.65;box('#e6dac0',0,y+1.28,d/2+.1,w+.15,.12,.28,g);
  for(let j=0;j<cols;j++)windowBay(-w/2+(j+.5)*w/cols,y,d/2+.07,1.55,1.8,g,(j+f)%3!==1);}
 // Both side elevations have actual inset frames, not blank colored blocks.
 for(const side of [-1,1]){const face=new THREE.Group();face.position.x=side*w/2;face.rotation.y=side*Math.PI/2;g.add(face);for(let f=0;f<floors;f++)for(let j=0;j<Math.floor(d/2.8);j++)windowBay(-d/2+(j+.5)*d/Math.floor(d/2.8),4.65+f*2.65,.06,1.4,1.75,face,j%3===0);}
const rear=new THREE.Group();rear.position.z=-d/2;rear.rotation.y=Math.PI;g.add(rear);
 for(let f=0;f<floors;f++)for(let j=0;j<cols;j++)windowBay(-w/2+(j+.5)*w/cols,4.65+f*2.65,.06,1.5,1.75,rear,false);
 box('#a5ad9b',0,1.5,.08,1.5,2.8,.16,rear);box(darkGlass,0,1.5,.19,1.22,2.5,.06,rear);box('#d7cbb0',0,2.98,.25,2.1,.12,.7,rear);
 shops.forEach((s,i)=>storefront(g,-w/2+(i+.5)*w/shops.length,d/2+.13,w/shops.length-.45,s[0],s[1]));roofGarden(g,w,d,h+.2);return g;}


function childcare(){const childcare=group(0,0),cw=material('#e7d9b8',tile);features.buildings.push({name:'生活托育館',type:'托育與家庭',x:-9,z:-26,height:9.9,detail:'三翼庭院、木百葉、無障礙入口、遊戲區'});
box(cw,0,4.2,-3,19,8.1,7,childcare);box(cw,-8,2.7,3,4,5.2,8,childcare);box('#d0b593',7,2.7,2,4.8,5.2,8,childcare);
for(let f=0;f<3;f++)for(let j=0;j<7;j++)windowBay(-7.8+j*2.6,1.5+f*2.5,.56,1.65,1.7,childcare);
const childcareRear=new THREE.Group();childcareRear.position.z=-6.5;childcareRear.rotation.y=Math.PI;childcare.add(childcareRear);
for(let f=0;f<3;f++)for(let j=0;j<7;j++)windowBay(-7.8+j*2.6,1.5+f*2.5,.07,1.65,1.7,childcareRear);
for(let j=0;j<13;j++)box('#aa8d62',-8.9+j*.37,2.6,7.1,.09,4.3,.25,childcare);
box('#729b95',0,3.2,4.5,7,.22,5.6,childcare);for(const x of [-3.1,3.1])line('#768982',[x,.2,6.8],[x,3.2,6.8],.055,childcare);
sign(cityLabel+'・生活托育館',0,3.35,7.34,6.3,.65,'#eee2bd','#457575',childcare);paving(0,3,7.5,8,.18,childcare);roofGarden(childcare,19,7,8.3);
// Actual ramp and low safety fence.
const ramp=box(pavement,3,.34,8,2,.2,5,childcare);ramp.rotation.x=-.09;for(const x of [2,4])line('#7d8d7e',[x,.8,10.4],[x,1.25,5.6],.035,childcare);
for(const x of [-9.8,9.8])for(let z=1;z<8;z+=.4)box('#8a9d85',x,.7,z,.055,1.2,.055,childcare);

const playground=new THREE.Group();playground.position.set(10,0,11);childcare.add(playground);box('#c9a56b',0,.2,0,7,.18,4,playground);for(const x of [-1,1])for(const z of [-.7,.7])box('#ad8e61',x,1,z,.12,2,.12,playground);box('#deb877',0,1.2,0,2.5,.15,2,playground);
const canopy=shape('cone','#587e7a',0,2.6,0,1.8,1.1,1.8,playground);canopy.rotation.y=Math.PI/4;
for(let j=0;j<6;j++)box('#cfa257',2-j*.23,.2+j*.17,.8,.5,.08,.4,playground);line('#e1bb63',[0,1.3,1],[1.9,.3,2],.17,playground);

return childcare;}
function office(){const office=group(0,0);features.buildings.push({name:'退台玻璃辦公樓',x:28,z:-31,height:42,type:'產業與工作',detail:'玻璃帷幕、垂直遮陽、退台植栽、裙樓'});
box('#d2ccba',0,2.1,0,17,4.1,14,office);box(darkGlass,0,21.9,-1.3,10,35,9,office);box(glass,-4.1,14.8,3,5,21,6,office);
for(let f=0;f<13;f++){box('#9eafa7',0,4.8+f*2.65,3.28,10.15,.095,.16,office);box('#9eafa7',5.05,4.8+f*2.65,-1.3,.13,.095,9,office);}
for(let x=-4.5;x<5;x+=.85)box('#c6cbb7',x,22.1,3.38,.07,34.4,.18,office);
for(let z=-5.5;z<3;z+=.85)box('#c6cbb7',5.13,22.1,z,.17,34.4,.07,office);
for(let f=0;f<13;f++){box('#9eafa7',0,4.8+f*2.65,-5.88,10.15,.095,.16,office);box('#9eafa7',-5.05,4.8+f*2.65,-1.3,.13,.095,9,office);}
for(let x=-4.5;x<5;x+=.85)box('#c6cbb7',x,22.1,-5.93,.07,34.4,.18,office);
for(let z=-5.5;z<3;z+=.85)box('#c6cbb7',-5.13,22.1,z,.17,34.4,.07,office);
for(let f=0;f<8;f++){box('#b5c1af',-4.1,5+f*2.65,6.08,5,.08,.13,office);box('#b5c1af',-6.67,5+f*2.65,3,.1,.08,6,office);}
for(let z=.4;z<5.9;z+=.8)box('#b5c1af',-6.7,15,z,.1,20,.045,office);
roofGarden(office,10,9,39.5);for(let x=-6;x<7;x+=2.5)planter(x,4.45,5.4,2,.75,office);
sign(cityLabel+'・共創',0,3.5,7.07,6,.7,'#d9d6bd','#3e626b',office);

return office;}

return {apartment,features,childcare,office,material,tile,pavement,asphalt,planter,storefront,roofGarden,windowBay,glass,darkGlass,terracotta,roofTile,rail,sign,awning};}

async function buildTaipei(data,renderer){
const scene=new THREE.Group(),plan=createTaipeiCityPlan(data),ponds=planTaipeiWater(plan);
const cityId=data.city.city,cityConfig=REGIONAL_CITIES[cityId];
const art=createStreetArt(renderer,scene),{box,ball,batch,line,mat,shape,slab,label,rand,between,tree,reserve,clearAt}=art;
const cityKit=createTaipeiCityKit(art,scene);
const reviewedFacades=createReviewedFacades(art,scene,data.city.cityName),streetDetails=createDetailStreetElements(art,scene,reviewedFacades,data.city.city);
art.pavement=reviewedFacades.pavement;art.asphalt=reviewedFacades.asphalt;art.grass.color.set("#d4dfb5");
const SCALE=plan.scale,coast=plan.coast;
function pip(x,z,P=coast){let inside=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function distSeg(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
function boundaryDist(x,z){let d=Infinity;for(let i=0;i<coast.length;i++)d=Math.min(d,distSeg(x,z,coast[i],coast[(i+1)%coast.length]));return d;}
function polygon(points,y,material,depth=0,holes=[]){const s=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));for(const points of holes)s.holes.push(new THREE.Path(points.map(([x,z])=>new THREE.Vector2(x,-z))));const g=depth?new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:1}):new THREE.ShapeGeometry(s);g.rotateX(-Math.PI/2);g.translate(0,y,0);const mesh=new THREE.Mesh(g,typeof material==='string'?mat(material):material);mesh.receiveShadow=true;scene.add(mesh);return mesh;}
polygon(coast.map(([x,z])=>[x*1.035,z*1.035]),-2.5,'#d6c7a2',2.1);
polygon(coast,.01,art.grass,0,ponds.map(p=>p.bank));
buildTaipeiWater(art,scene,ponds);
// All shoreline checks include tree crown clearance; no trees in the sea or on paths.
art.setLandCheck((x,z,r)=>pip(x,z)&&boundaryDist(x,z)>r+2&&ponds.every(p=>!inside([x,z],p.walk)&&edgeDistance([x,z],p.walk)>r));
const landmarks=plan.landmarks;
// Landmark avoidance uses actual geometry below, not the old broad square.
const roads=plan.roads;
plan.bridgeClearances=data.transportCorridors||[];for(const q of plan.bridgeClearances)reserve(q.x,q.z,q.w,q.d);
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
art.grass.userData.groundCover=true;
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
for(const p of plan.parcels.filter(p=>p.kind==='policy')){if(p.id==='tp-housing')craftDistrict(art,scene,p,reviewedFacades,streetDetails);else buildPolicyCampus(art,scene,p,streetDetails,cityKit);const t=themeMap.get(p.id);t.height=p.height;t.anchor.copy(p.anchor);t.features=p.features;}
const ordinary=plan.parcels.filter(p=>p.kind==='urban');
const highCandidates=ordinary.filter(p=>['commercial','technology'].includes(p.zone)).sort((a,b)=>Math.hypot(a.x+40,a.z-10)-Math.hypot(b.x+40,b.z-10)).slice(0,2);
const highKinds=['curvedGlass','artDeco','twinCylinders','slopedCrown','asymmetricTwins','setbackResidential','mixedUse','bracedSpire'];
for(const p of ordinary){if(p.id==='urban-taipei:-2:-5'){craftDistrict(art,scene,p,reviewedFacades,streetDetails);continue;}const index=highCandidates.indexOf(p);if(index>=0){cityKit.highrise(p,highKinds[index]);streetDetails.highriseFront(p);}else streetDetails.urban(p);}
const amenities=buildPolicyAmenities(art,scene,plan,reviewedFacades);streetDetails.records.push(...amenities.records);streetDetails.picks.push(...amenities.picks);
const infill=fillStreetBlocks(art,plan,data,ponds,streetDetails,landmarkFootprints(landmarkBuckets));
const buildings=[...cityKit.records,...streetDetails.records];
// Open lots and land between districts stay green, with deliberate clear lawns and planted groves.
const xs=coast.map(p=>p[0]),zs=coast.map(p=>p[1]);
streetDetails.parks(ponds);
const forestStats=plantDenseLandscape(art,plan);
// New foliage in the park and mountain landmark grounds is placed at the existing terrain height.
for(const l of landmarks.filter(l=>['daan','yangming','beitou'].includes(l.id))){
 const sc=l.scale*SCALE,placed=[];const count=l.id==='yangming'?85:l.id==='daan'?28:24;
 for(let n=0;n<1200&&placed.length<count;n++){
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
  tree(x,z,between(4,6.3),0,true,.1+y*sc);placed.push({x,z});
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
// A prominent national flag stays anchored to the highest building.
const tallest=landmarks.find(l=>l.id==='t101');
const flag=createProminentFlag(scene,art,tallest);

const geometryStats=art.flush();
// Reuse the approved soft-contact batching without discarding any trees.
scene.updateMatrixWorld(true);const shadowGroups=new Map();
for(const o of [...scene.children]){if(!o.isMesh||o.isInstancedMesh||o.geometry.type!=='PlaneGeometry'||!o.material.isMeshBasicMaterial||!o.material.transparent||o.material.depthWrite||!o.material.map)continue;const key=o.material.map.uuid+'/'+o.material.opacity;if(!shadowGroups.has(key))shadowGroups.set(key,[]);shadowGroups.get(key).push(o);}
for(const group of shadowGroups.values()){const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),group[0].material,group.length);for(let i=0;i<group.length;i++){const o=group[i],p=o.geometry.parameters;mesh.setMatrixAt(i,o.matrixWorld.clone().multiply(new THREE.Matrix4().makeScale(p.width,p.height,1)));o.removeFromParent();o.geometry.dispose();if(i)o.material.dispose();}mesh.castShadow=false;mesh.receiveShadow=false;scene.add(mesh);}

return {root:scene,art,plan,ponds,themeMeta,buildings,landmarks,life,forestStats,infill,geometryStats,flag,tallest,roadSurface,picks:[...cityKit.picks,...streetDetails.picks],streetDetails,facadeDetails:reviewedFacades.features,...(typeof airTraffic!=="undefined"?{airTraffic}:{})};
}

async function buildNewTaipei(data,renderer){
const scene=new THREE.Group(),plan=createRegionalCityPlan(data),ponds=planTaipeiWater(plan);
const cityId=data.city.city,cityConfig=REGIONAL_CITIES[cityId];
const art=createStreetArt(renderer,scene),{box,ball,batch,line,mat,shape,slab,label,rand,between,tree,reserve,clearAt}=art;
const cityKit=createRegionalCityKit(art,scene);
const reviewedFacades=createReviewedFacades(art,scene,data.city.cityName),streetDetails=createDetailStreetElements(art,scene,reviewedFacades,data.city.city);
art.pavement=reviewedFacades.pavement;art.asphalt=reviewedFacades.asphalt;art.grass.color.set("#d4dfb5");
const SCALE=plan.scale,coast=plan.coast;
function pip(x,z,P=coast){let inside=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function distSeg(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
function boundaryDist(x,z){let d=Infinity;for(let i=0;i<coast.length;i++)d=Math.min(d,distSeg(x,z,coast[i],coast[(i+1)%coast.length]));return d;}
function polygon(points,y,material,depth=0,holes=[]){const s=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));for(const points of holes)s.holes.push(new THREE.Path(points.map(([x,z])=>new THREE.Vector2(x,-z))));const g=depth?new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:1}):new THREE.ShapeGeometry(s);g.rotateX(-Math.PI/2);g.translate(0,y,0);const mesh=new THREE.Mesh(g,typeof material==='string'?mat(material):material);mesh.receiveShadow=true;scene.add(mesh);return mesh;}
polygon(coast.map(([x,z])=>[x*1.035,z*1.035]),-2.5,'#d6c7a2',2.1);
polygon(coast,.01,art.grass,0,ponds.map(p=>p.bank));
buildTaipeiWater(art,scene,ponds);
// All shoreline checks include tree crown clearance; no trees in the sea or on paths.
art.setLandCheck((x,z,r)=>pip(x,z)&&boundaryDist(x,z)>r+2&&ponds.every(p=>!inside([x,z],p.walk)&&edgeDistance([x,z],p.walk)>r));
const landmarks=plan.landmarks;
// Landmark avoidance uses actual geometry below, not the old broad square.
const roads=plan.roads;
plan.bridgeClearances=data.transportCorridors||[];for(const q of plan.bridgeClearances)reserve(q.x,q.z,q.w,q.d);
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
art.grass.userData.groundCover=true;
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
for(const p of plan.parcels.filter(p=>p.kind==='policy')){buildPolicyCampus(art,scene,p,streetDetails,cityKit);const t=themeMap.get(p.id);t.height=p.height;t.anchor.copy(p.anchor);t.features=p.features;}
const ordinary=plan.parcels.filter(p=>p.kind==='urban');
const highCandidates=ordinary.filter(p=>['commercial','technology'].includes(p.zone)).sort((a,b)=>Math.hypot(a.x+40,a.z-10)-Math.hypot(b.x+40,b.z-10)).slice(0,2);
const highKinds=['curvedGlass','artDeco','twinCylinders','slopedCrown','asymmetricTwins','setbackResidential','mixedUse','bracedSpire'];
for(const p of ordinary){const index=highCandidates.indexOf(p);if(index>=0){cityKit.highrise(p,highKinds[index]);streetDetails.highriseFront(p);}else streetDetails.urban(p);}
const amenities=buildPolicyAmenities(art,scene,plan,reviewedFacades);streetDetails.records.push(...amenities.records);streetDetails.picks.push(...amenities.picks);
const infill=fillStreetBlocks(art,plan,data,ponds,streetDetails,landmarkFootprints(landmarkBuckets));
const buildings=[...cityKit.records,...streetDetails.records];
// Open lots and land between districts stay green, with deliberate clear lawns and planted groves.
const xs=coast.map(p=>p[0]),zs=coast.map(p=>p[1]);
streetDetails.parks(ponds);
const forestStats=plantDenseLandscape(art,plan);
// Finer planting on a subset of open street corners, always respecting the same footprint map.
for(let i=0;i<1100;i++){
 const x=between(Math.min(...xs),Math.max(...xs)),z=between(Math.min(...zs),Math.max(...zs));if(!clearAt(x,z,.6))continue;
 if(i%5===0)batch('leaf',i%2?'#738c51':'#8c9e61',x,.3,z,.42,.42,.42);
 else for(let j=0;j<3;j++)batch('cone',i%2?'#a1b573':'#84a464',x+j*.08,.13,z,.03,.26,.03,between(-.3,.3),rand()*6.28);
}
// Instanced residents and vehicles follow only actual street/sidewalk loops.
plan.ponds=ponds;const life=createRegionalLife(art,scene,plan),people=life.people,cars=life.cars;
const childTheme=themeMap.get(cityConfig.focus)||themeMeta[0],cx=childTheme.x,cz=childTheme.z;
for(const p of plan.parcels.filter(p=>p.kind==='park')){const x=p.x+p.usableW*.4,z=p.z;if(clearAt(x,z,.7)){art.bench(x,z);reserve(x,z,3,2);}}
// A prominent national flag stays anchored to the highest building.
const tallest=[...landmarks,...buildings].sort((a,b)=>b.height-a.height)[0];
const flag=createProminentFlag(scene,art,tallest);
// Eight city flights are managed by the shared transport network.

const geometryStats=art.flush();
// Reuse the approved soft-contact batching without discarding any trees.
scene.updateMatrixWorld(true);const shadowGroups=new Map();
for(const o of [...scene.children]){if(!o.isMesh||o.isInstancedMesh||o.geometry.type!=='PlaneGeometry'||!o.material.isMeshBasicMaterial||!o.material.transparent||o.material.depthWrite||!o.material.map)continue;const key=o.material.map.uuid+'/'+o.material.opacity;if(!shadowGroups.has(key))shadowGroups.set(key,[]);shadowGroups.get(key).push(o);}
for(const group of shadowGroups.values()){const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),group[0].material,group.length);for(let i=0;i<group.length;i++){const o=group[i],p=o.geometry.parameters;mesh.setMatrixAt(i,o.matrixWorld.clone().multiply(new THREE.Matrix4().makeScale(p.width,p.height,1)));o.removeFromParent();o.geometry.dispose();if(i)o.material.dispose();}mesh.castShadow=false;mesh.receiveShadow=false;scene.add(mesh);}

return {root:scene,art,plan,ponds,themeMeta,buildings,landmarks,life,forestStats,infill,geometryStats,flag,tallest,roadSurface,picks:[...cityKit.picks,...streetDetails.picks],streetDetails,facadeDetails:reviewedFacades.features,...(typeof airTraffic!=="undefined"?{airTraffic}:{})};
}

export async function buildApprovedCityArt(data,renderer){return data.city.city==='taipei'?buildTaipei(data,renderer):buildNewTaipei(data,renderer);}

export function buildReviewedBoats(art,scene,coast){
const {box,line,shape,mat,texture}=art,boats=[],inventory=[],glass=mat('#668f98',.23,.36);
function group(x,z,rotation=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);return g;}
function record(id,name,x,z,r,root){inventory.push({id,name,x,z,r,root});return root;}
 function hull(root,w,length,color){const outline=new THREE.Shape();outline.moveTo(-w*.5,-length*.35);outline.quadraticCurveTo(-w*.55,length*.18,0,length*.5);outline.quadraticCurveTo(w*.55,length*.18,w*.5,-length*.35);outline.quadraticCurveTo(0,-length*.5,-w*.5,-length*.35);const g=new THREE.ExtrudeGeometry(outline,{depth:.8,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.18,bevelThickness:.15});g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,mat(color,.5));m.position.y=-.28;m.castShadow=true;root.add(m);}
 function passenger(id,x,z,rot=0,scale=1){const b=group(x,z,rot);b.position.y=-.9;b.scale.setScalar(scale);b.userData.keepDynamic=true;hull(b,4,12,'#e5e4cf');
  box('#4d7c8d',0,.55,-.6,3.7,.25,8,b);box('#e6e4ce',0,1.3,-.5,3,1.4,6.8,b);box(glass,0,1.45,2.94,2.7,.7,.06,b);
  for(const side of [-1,1])for(let j=0;j<7;j++)box(glass,side*1.52,1.5,-3+j*.85,.055,.72,.6,b);
  box('#f1e9ce',0,2.1,-.7,3.5,.18,7.5,b);box('#e1e0c9',0,2.6,.9,2.2,.9,2.2,b);box(glass,0,2.7,2.02,2,.5,.05,b);
  line('#7a968e',[0,3.1,0],[0,4,0],.045,b);for(const side of [-1,1]){line('#a3b3a1',[side*1.8,.8,-4.7],[side*1.8,.8,3.6],.025,b);for(let j=0;j<7;j++)line('#a3b3a1',[side*1.8,.35,-4.5+j*1.2],[side*1.8,.8,-4.5+j*1.2],.022,b);}
  boats.push({id,kind:'passenger',root:b,base:new THREE.Vector3(x,-.9,z)});record(id,'水上客船',x,z,7,b);return b;}
 function sail(id,x,z,rot,color){const b=group(x,z,rot);b.position.y=-.95;b.userData.keepDynamic=true;hull(b,2.5,6.8,'#e6e0c6');line('#a4ada0',[0,.3,0],[0,7,0],.055,b);line('#8d998e',[0,1.1,0],[0,1.1,-2.7],.04,b);
  for(const [points,c] of [[[0,6.8,.05,0,1.3,.05,0,1.3,-2.7],'#f7f0d9'],[[.04,6,.1,.04,1.3,.1,.04,1.3,2.2],color]]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,side:THREE.DoubleSide,roughness:.8}));b.add(m);}
  boats.push({id,kind:'sail',root:b,base:new THREE.Vector3(x,-.95,z)});record(id,'帆船',x,z,5,b);return b;}

const shore=coast.reduce((a,b)=>a[1]>b[1]?a:b),harbour=group(shore[0],shore[1]-2);harbour.name='approved-waterfront-pier';
for(let i=0;i<45;i++)box(i%3?'#aa9370':'#b9a581',0,.18,i*.43,7,.2,.4,harbour);
for(const x of [-3.1,3.1])for(let z=0;z<19;z+=4){shape('cyl','#8f8972',x,-1.25,z,.14,3.2,.14,harbour);box('#e6d7ae',x,.55,z,.3,.2,.3,harbour);}
box('#d9ceb5',0,1.7,1,6,3,3.8,harbour);box('#6e9895',0,3.35,1,6.5,.25,4.3,harbour);
inventory.push({id:'harbour',name:'碼頭與停靠區',root:harbour});
const xs=coast.map(p=>p[0]),zs=coast.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs),cx=(x0+x1)/2;
passenger('passenger-west',x0-14,(z0+z1)/2,-.5,1.2);
passenger('passenger-front',cx-25,z1+18,.4,1);
sail('sail-front',cx+25,z1+22,-.25,'#c88d73');sail('sail-west',x0-22,z1-15,-.6,'#8eaea5');
return {boats,inventory};}
