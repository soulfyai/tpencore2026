import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createTaipeiRoads} from './taipei-city-roads.js?rev=2';
import {buildCompositionElements,COMPOSITION_COAST} from './taipei-composition-elements.js?rev=2';
import {createStreetArt} from './street-art-kit.js?rev=2';
import {installTaipeiSkyClouds,excludeSkyOverlaysFromAO} from './taipei-city-nature.js?rev=1';

// Deliberately separate from every published city and previous review page.
const scene=new THREE.Scene();scene.background=new THREE.Color('#b9dbe2');scene.fog=new THREE.Fog('#b9dbe2',650,1200);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.querySelector('#scene').append(renderer.domElement);
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.6,700),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=8;controls.maxDistance=650;controls.maxPolarAngle=Math.PI*.485;controls.minPolarAngle=.15;
const hemi=new THREE.HemisphereLight('#d2ecff','#6c784b',1.65);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff0cc',3.3);sun.position.set(-45,82,36);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);
Object.assign(sun.shadow.camera,{left:-85,right:85,top:85,bottom:-85,near:1,far:230});sun.shadow.normalBias=.025;sun.shadow.bias=-.00008;sun.shadow.radius=3;sun.target.position.set(0,0,-8);scene.add(sun,sun.target);
const sky=new Sky();sky.scale.setScalar(500);sky.material.uniforms.turbidity.value=2.6;sky.material.uniforms.rayleigh.value=1.05;sky.material.uniforms.mieCoefficient.value=.005;sky.material.uniforms.sunPosition.value.copy(sun.position);installTaipeiSkyClouds(sky);sky.material.fragmentShader=sky.material.fragmentShader.replace('retColor=mix(retColor,citySkyTint,smoothstep(.025,.3,direction.y)*.45);','retColor=mix(retColor*.3,citySkyTint,.65);');scene.add(sky);
const composer=new EffectComposer(renderer);if(renderer.capabilities.isWebGL2){composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;}composer.addPass(new RenderPass(scene,camera));
const ao=new SSAOPass(scene,camera,innerWidth,innerHeight);ao.kernelRadius=.6;ao.minDistance=.0005;ao.maxDistance=.025;excludeSkyOverlaysFromAO(ao,scene);composer.addPass(ao);composer.addPass(new OutputPass());
renderer.info.autoReset=false;
const art=createStreetArt(renderer,scene),{box,ball,line,shape,batch,texture,mat,between,rand}=art;
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
function apartment({name,x,z,w,d,floors,tone,rotation=0,shops=[]}){const worldW=Math.abs(Math.cos(rotation))*w+Math.abs(Math.sin(rotation))*d,worldD=Math.abs(Math.sin(rotation))*w+Math.abs(Math.cos(rotation))*d;art.reserve(x,z,worldW+3,worldD+5);const g=group(x,z,rotation),wall=material(tone,tile),h=3.45+floors*2.65;features.buildings.push({name,x,z,width:w,depth:d,rotation,height:h,type:'住宅與騎樓',detail:'磁磚立面、退台、陽台花台、屋頂設備、店面騎樓'});
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

// A unified textured ground with a real hole for the irregular lake.
const lakeCurve=new THREE.CatmullRomCurve3([[-30,0,24],[-23,0,22],[-17,0,26],[-11,0,24],[-7,0,30],[-11,0,34],[-10,0,39],[-20,0,40],[-28,0,37],[-33,0,31]].map(p=>new THREE.Vector3((p[0]+20)*1.15+10,p[1],(p[2]-31)*1.12+31)),true,'catmullrom',.45);
const lakePoints=lakeCurve.getPoints(150),ground=new THREE.Shape();const coastCurve=new THREE.CatmullRomCurve3(COMPOSITION_COAST.map(p=>new THREE.Vector3(...p)),true,'catmullrom',.3),coast=coastCurve.getPoints(160);coast.forEach((p,i)=>i?ground.lineTo(p.x,-p.z):ground.moveTo(p.x,-p.z));ground.closePath();
function onLand(x,z){let inside=false;for(let i=0,j=coast.length-1;i<coast.length;j=i++){const a=coast[i],b=coast[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;}return inside;}art.setLandCheck((x,z,r)=>[[x-r,z-r],[x+r,z+r],[x-r,z+r],[x+r,z-r]].every(p=>onLand(...p)));
const hole=new THREE.Path();lakePoints.forEach((p,i)=>i?hole.lineTo(p.x,-p.z):hole.moveTo(p.x,-p.z));hole.closePath();ground.holes.push(hole);
const base=new THREE.Mesh(new THREE.ExtrudeGeometry(ground,{depth:1.1,bevelEnabled:false}),[lawn,mat('#b8aa87')]);base.rotation.x=-Math.PI/2;base.position.y=-1.2;base.name='detail-ground';base.receiveShadow=true;scene.add(base);
const beachShape=new THREE.Shape(coast.map(p=>new THREE.Vector2(p.x*1.04,-p.z*1.04))),beach=new THREE.Mesh(new THREE.ExtrudeGeometry(beachShape,{depth:.55,bevelEnabled:false}),mat('#d6c7a0'));beach.rotation.x=-Math.PI/2;beach.position.y=-1.1;beach.receiveShadow=true;scene.add(beach);
const lakeShape=new THREE.Shape();lakePoints.forEach((p,i)=>i?lakeShape.lineTo(p.x,-p.z):lakeShape.moveTo(p.x,-p.z));lakeShape.closePath();
const waterMat=new THREE.MeshPhysicalMaterial({color:'#4fabb5',roughness:.24,metalness:.22,clearcoat:.8,envMapIntensity:.65});
const water=new THREE.Mesh(new THREE.ShapeGeometry(lakeShape),waterMat);water.rotation.x=-Math.PI/2;water.position.y=-.38;water.receiveShadow=true;scene.add(water);
const sea=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.MeshStandardMaterial({color:'#309eb8',roughness:.42,metalness:.2,envMapIntensity:.3}));sea.rotation.x=-Math.PI/2;sea.position.y=-1.35;scene.add(sea);
sea.material.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vReviewSea;').replace('#include <begin_vertex>','#include <begin_vertex>\nvReviewSea=position.xy;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vReviewSea;').replace('#include <color_fragment>','#include <color_fragment>\nfloat seaRipple=sin(vReviewSea.x*.7+vReviewSea.y*.31+sin(vReviewSea.y*.18)*1.7)+sin(vReviewSea.x*.12-vReviewSea.y*.65)*.4; diffuseColor.rgb*=.97+seaRipple*.025;');};
const waterUniform={value:0};waterMat.onBeforeCompile=s=>{s.uniforms.uReviewTime=waterUniform;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vLake;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLake=position.xy;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vLake; uniform float uReviewTime;').replace('#include <color_fragment>','#include <color_fragment>\nfloat wave=sin(vLake.x*3.+sin(vLake.y*1.8)+uReviewTime*.35)*sin(vLake.y*4.7-uReviewTime*.24); diffuseColor.rgb*=.96+wave*.045;');};
// One contiguous road surface: paint is baked into its material, not coplanar strips.
const roadMap=texture(2048,(g,s)=>{g.drawImage(tarmac.image,0,0,s,s);const px=x=>(x+56)/111*s,pz=z=>(z+47)/96*s;
 const road=(x,z,w,d)=>{g.fillStyle='#526063';g.fillRect(px(x-w/2),pz(z-d/2),w/111*s,d/96*s);};road(0,10,111,7);road(13,-13,7,53);road(-38,-10,6,48);
 g.strokeStyle='#e8ddae';g.lineWidth=1.7;g.setLineDash([18,17]);for(const [a,b,c,d] of [[-56,10,9,10],[17,10,55,10],[13,-39,13,6.5],[-38,-34,-38,6.5]]){g.beginPath();g.moveTo(px(a),pz(b));g.lineTo(px(c),pz(d));g.stroke();}g.setLineDash([]);
 g.fillStyle='#eee9d6';for(let i=0;i<7;i++){g.fillRect(px(7+i*1.5),pz(14.7),.65/111*s,5.2/96*s);g.fillRect(px(15.4),pz(3-i*.8),5.2/111*s,.42/96*s);}g.fillStyle='#d4b866';g.font='bold 33px sans-serif';g.fillText('30',px(-25),pz(11));});
const roadShape=new THREE.Shape();for(const [i,p] of [[0,[-56,-6.5]],[1,[9.5,-6.5]],[2,[9.5,37.2]],[3,[16.5,37.2]],[4,[16.5,-6.5]],[5,[55,-6.5]],[6,[55,-13.5]],[7,[-56,-13.5]]]){i?roadShape.lineTo(...p):roadShape.moveTo(...p);}roadShape.closePath();
// Build by shared polygon ownership; narrow west road joins its side without overlap.
const roadGeo=new THREE.ShapeGeometry(roadShape),uv=roadGeo.attributes.uv,pos=roadGeo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+56)/111,1-(-pos.getY(i)+47)/96);
const road=new THREE.Mesh(roadGeo,new THREE.MeshStandardMaterial({map:roadMap,color:'#80908a',roughness:1}));road.rotation.x=-Math.PI/2;road.position.y=.045;road.name='detail-road';road.receiveShadow=true;scene.add(road);
// Broad sidewalks form deliberate pedestrian routes and protect planted courts.
paving(0,15.1,111,3.2);paving(-23.25,4.9,65.5,3.2);paving(35.75,4.9,38.5,3.2);paving(18.1,-15,3.2,42);paving(7.9,-15,3.2,42);
for(const z of [3.25,6.55,13.45,16.75])for(let x=-55;x<55;x+=1.2){if(z<7&&x>8.8&&x<17.2)continue;batch('box','#c7c4af',x,.18,z,1.17,.27,.15);}
for(const x of [6.25,9.55,16.45,19.75])for(let z=-35;z<3;z+=1.2)batch('box','#c7c4af',x,.18,z,.15,.27,1.17);

apartment({name:'赤陶街角住宅',x:-21,z:-3,w:14,d:11,floors:5,tone:'#d8ae8b',shops:[['湖畔書屋','#527e7c'],['日常麵包','#ae6d4e']]});
apartment({name:'青綠退台住宅',x:-43,z:-19,w:13,d:11,floors:7,tone:'#b2c4ac',rotation:Math.PI/2,shops:[['轉角咖啡','#507d70']]});
apartment({name:'米白窄塔住宅',x:29,z:-10,w:10,d:12,floors:9,tone:'#dbcdb1',shops:[['生活藥局','#697d5c']]});
apartment({name:'老街紅磚樓',x:44,z:0,w:9,d:8,floors:3,tone:'#bf8a70',shops:[['安可小食','#a0614e']]});
// Setback penthouse, not another full identical floor.
const pent=group(-21,-3);box(material('#e3c4a3',tile),1,18.6,-1,9,2.8,7,pent);for(let i=0;i<3;i++)windowBay(-2+i*2.5,18.6,2.58,1.5,1.65,pent);roofGarden(pent,9,7,20);
// Three wings wrap a childcare courtyard; warm timber louvers, deep canopy, rooftop garden.
const childcare=group(-9,-26),cw=material('#e7d9b8',tile);features.buildings.push({name:'生活托育館',type:'托育與家庭',x:-9,z:-26,height:9.9,detail:'三翼庭院、木百葉、無障礙入口、遊戲區'});
box(cw,0,4.2,-3,19,8.1,7,childcare);box(cw,-8,2.7,3,4,5.2,8,childcare);box('#d0b593',7,2.7,2,4.8,5.2,8,childcare);
for(let f=0;f<3;f++)for(let j=0;j<7;j++)windowBay(-7.8+j*2.6,1.5+f*2.5,.56,1.65,1.7,childcare);
const childcareRear=new THREE.Group();childcareRear.position.z=-6.5;childcareRear.rotation.y=Math.PI;childcare.add(childcareRear);
for(let f=0;f<3;f++)for(let j=0;j<7;j++)windowBay(-7.8+j*2.6,1.5+f*2.5,.07,1.65,1.7,childcareRear);
for(let j=0;j<13;j++)box('#aa8d62',-8.9+j*.37,2.6,7.1,.09,4.3,.25,childcare);
box('#729b95',0,3.2,4.5,7,.22,5.6,childcare);for(const x of [-3.1,3.1])line('#768982',[x,.2,6.8],[x,3.2,6.8],.055,childcare);
sign('臺北・生活托育館',0,3.35,7.34,6.3,.65,'#eee2bd','#457575',childcare);paving(0,3,7.5,8,.18,childcare);roofGarden(childcare,19,7,8.3);
// Actual ramp and low safety fence.
const ramp=box(pavement,3,.34,8,2,.2,5,childcare);ramp.rotation.x=-.09;for(const x of [2,4])line('#7d8d7e',[x,.8,10.4],[x,1.25,5.6],.035,childcare);
for(const x of [-9.8,9.8])for(let z=1;z<8;z+=.4)box('#8a9d85',x,.7,z,.055,1.2,.055,childcare);
paving(-7,-14,17,3);sign('遊戲與散步的日常',-8,1.2,-12.48,5,.6);
const playground=group(1,-15);box('#c9a56b',0,.2,0,7,.18,4,playground);for(const x of [-1,1])for(const z of [-.7,.7])box('#ad8e61',x,1,z,.12,2,.12,playground);box('#deb877',0,1.2,0,2.5,.15,2,playground);
const canopy=shape('cone','#587e7a',0,2.6,0,1.8,1.1,1.8,playground);canopy.rotation.y=Math.PI/4;
for(let j=0;j<6;j++)box('#cfa257',2-j*.23,.2+j*.17,.8,.5,.08,.4,playground);line('#e1bb63',[0,1.3,1],[1.9,.3,2],.17,playground);
// A slim modern office with a recessed plinth and a planted terrace.
const office=group(28,-31);features.buildings.push({name:'退台玻璃辦公樓',x:28,z:-31,height:42,type:'產業與工作',detail:'玻璃帷幕、垂直遮陽、退台植栽、裙樓'});
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
sign('臺北・共創',0,3.5,7.07,6,.7,'#d9d6bd','#3e626b',office);
// Recognizable Taipei context; hand-modelled tiered crown and facade fins.
const tower=group(5,-42);features.buildings.push({name:'臺北101',x:5,z:-42,height:62,type:'城市地標',detail:'逐節退收塔身、水平簷線、垂直帷幕與國旗'});
box('#b1c0ae',0,3.2,0,10,6.4,8,tower);for(let section=0;section<8;section++){
 const y=7+section*5.5,w=7.2-section*.38,d=w*.78;box(mat('#4d8c85',.27,.3),0,y+2.3,0,w,4.7,d,tower);
 for(const side of [-1,1]){
 for(let yy=0;yy<5;yy++){box('#9ebdb0',0,y+yy+.2,side*(d/2+.035),w,.065,.12,tower);box('#9ebdb0',side*(w/2+.035),y+yy+.2,0,.12,.065,d,tower);}
 for(let j=-3;j<=3;j++){box('#9ebdb0',j*w/8,y+2.3,side*(d/2+.1),.045,4.7,.1,tower);box('#9ebdb0',side*(w/2+.1),y+2.3,j*d/8,.1,4.7,.045,tower);}
 }
 box('#7ba69a',0,y+4.8,0,w+1.15,.38,d+.85,tower);box('#c1ccb2',0,y+4.98,0,w+1.25,.08,d+.95,tower);}
box('#83aaa0',0,53.2,0,3.3,4.3,2.9,tower);line('#9ebcb0',[0,55,0],[0,62,0],.08,tower);
const flagMap=texture(256,(g,s)=>{g.fillStyle='#d33b35';g.fillRect(0,0,s,s);g.fillStyle='#17477c';g.fillRect(0,0,s*.5,s*.5);g.save();g.translate(s*.25,s*.25);g.fillStyle='#fff';for(let i=0;i<12;i++){g.save();g.rotate(i*Math.PI/6);g.beginPath();g.moveTo(-3,-14);g.lineTo(0,-25);g.lineTo(3,-14);g.fill();g.restore();}g.beginPath();g.arc(0,0,12,0,Math.PI*2);g.fill();g.restore();});
const flag=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.47),new THREE.MeshStandardMaterial({map:flagMap,side:THREE.DoubleSide,roughness:.9}));flag.name='detail-national-flag';flag.position.set(1.1,61,0);tower.add(flag);features.flag=true;

// Natural shore: stones, curved boardwalk, reeds, individual flowers, no rectangular pond tile.
const pathCurve=new THREE.CatmullRomCurve3([[-64,.15,21],[-56,.15,43],[-33,.15,52],[-3,.15,48],[25,.15,45],[50,.15,40],[59,.15,17]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.4);
function ribbon(curve,width,material,y=.12){const points=curve.getPoints(180),vertices=[],indices=[],uvs=[];points.forEach((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],v=new THREE.Vector3(b.z-a.z,0,a.x-b.x).normalize().multiplyScalar(width/2);for(const side of [-1,1]){vertices.push(p.x+v.x*side,y,p.z+v.z*side);uvs.push(i/12,side===-1?0:1);}if(i<points.length-1){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;scene.add(mesh);return mesh;}
ribbon(pathCurve,2.8,pavement,.18);
const shoreAccess=[
 {id:'bridge-west-access',points:[[-6,31],[-8,37],[-8,45],[-3,48]],width:1.8},
 {id:'bridge-east-access',points:[[26,31],[28,35],[28,43],[25,45]],width:1.8},
 {id:'waterfront-shop-center-access',points:[[0,49.7],[0,47.9]],width:1.4},
 {id:'waterfront-shop-east-access',points:[[20,48.2],[20,45.7]],width:1.4},
 {id:'waterfront-house-side-access',points:[[28.6,48],[28,45],[25,45]],width:1.4}
];
for(const access of shoreAccess){const curve=new THREE.CatmullRomCurve3(access.points.map(([x,z])=>new THREE.Vector3(x,.18,z)),false,'catmullrom',.2);const layerPavement=pavement.clone();Object.assign(layerPavement,{polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2-shoreAccess.indexOf(access)*2});access.mesh=ribbon(curve,access.width,layerPavement,.2);access.mesh.name=access.id;const samples=curve.getPoints(24);for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i];art.reserve((a.x+b.x)/2,(a.z+b.z)/2,Math.abs(a.x-b.x)+access.width,Math.abs(a.z-b.z)+access.width);}}
art.reserve(-15,44,10,7);
ribbon(new THREE.CatmullRomCurve3(coast.map(p=>new THREE.Vector3(p.x*1.055,0,p.z*1.055)),true,'catmullrom',.3),.7,new THREE.MeshBasicMaterial({color:'#d2ece0',transparent:true,opacity:.55,depthWrite:false}),-1.29);
lakePoints.forEach((p,i)=>{if(i%2===0){const h=between(.18,.46);shape('leaf',['#a6a898','#b9b39b','#8e9a89'][i%3],p.x,-.02,p.z,between(.25,.55),h,between(.25,.5));}if(i%4===0){for(let j=0;j<4;j++)line('#839263',[p.x,-.25,p.z],[p.x+between(-.2,.2),between(.25,.65),p.z+between(-.2,.2)],.018);}});
// Timber landing at the lake's western end.
for(let i=0;i<30;i++)box(i%3?'#b49b70':'#c0a67c',-4+i*.23,.25,31,.215,.13,5.2);for(let i=0;i<6;i++)line('#71877d',[-4+i*1.3,.25,33.65],[-4+i*1.3,1.1,33.65],.035);line('#71877d',[-4,1.13,33.65],[2.5,1.13,33.65],.045);
// Street furniture deliberately placed along usable pedestrian areas.
for(const [x,z,rot] of [[-36,21,0],[-31,42,Math.PI],[-5,41,-.5],[8,22,0],[33,26,-.2],[-8,17,0]]){art.bench(x,z,rot);features.benches++;}
for(const [x,z] of [[-46,16],[-30,16],[-13,16],[4,16],[23,16],[41,16],[18,-26],[18,-5]])art.lamp(x,z);
for(const [x,z] of [[-35,17],[2,19],[35,18]]){shape('cyl','#658172',x,.65,z,.27,1,.27);shape('cyl','#a3b19d',x,1.19,z,.3,.1,.3);}
// Café tables, chairs, terrace pergola, bicycle stand and small pavement details.
for(const x of [-25,-21,-17]){shape('cyl','#d7c6a1',x,.95,5.2,.47,.08,.47);line('#6d7c6c',[x,.3,5.2],[x,.9,5.2],.04);for(const side of [-1,1]){box('#8a9b82',x+side*.8,.6,5.2,.5,.07,.5);box('#8a9b82',x+side*1,.9,5.2,.07,.6,.5);for(const zz of [-.18,.18])line('#667c70',[x+side*.8,.2,5.2+zz],[x+side*.8,.6,5.2+zz],.025);}}
const pergola=group(-15,44);for(const x of [-4,4])for(const z of [-2,2])box('#a98e64',x,1.65,z,.18,3,.18,pergola);for(let i=0;i<13;i++)box('#b8a078',-4.4+i*.73,3.15,0,.12,.18,5.1,pergola);for(const z of [-2,2])box('#a88c60',0,3,z,9,.2,.18,pergola);
for(let i=0;i<4;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.4,.035,6,20),mat('#7c9188',.5,.3));ring.position.set(-12+i*.7,.6,17);ring.rotation.y=Math.PI/2;scene.add(ring);}
const neighbourhoodRoads=[{a:[-54,-38.5],b:[-10,-38.5],horizontal:true},{a:[-25.5,-43],b:[-25.5,3.1],horizontal:false,pedestrian:true},{a:[39.5,-44],b:[39.5,3.1],horizontal:false,pedestrian:true}];createTaipeiRoads(art,scene,renderer,neighbourhoodRoads);for(const r of neighbourhoodRoads)art.reserve((r.a[0]+r.b[0])/2,(r.a[1]+r.b[1])/2,r.horizontal?Math.abs(r.a[0]-r.b[0])+1:5,r.horizontal?7:Math.abs(r.a[1]-r.b[1])+1);
const composition=buildCompositionElements(art,scene,{apartment,group,paving,glass,windowBay,sign});composition.inventory.push({id:'central-lake',name:'中央不規則湖泊',x:10,z:31,r:17,root:water});
art.reserve(0,10,120,13);art.reserve(13,-13,13,53);art.reserve(-9,-26,24,24);art.reserve(28,-31,22,19);art.reserve(5,-42,14,14);
// Branching trees with leaf sprays from the current art kit, plus flowering seasonal trees.
const treeSites=[[-51,4,6],[-47,5,5],[-35,1,5],[-31,3,5],[-8,4,5.5],[1,4,5],[-51,-33,7],[-30,-32,6],[-23,-37,7],[-15,-40,6],[-1,-38,5],[41,-35,7],[49,-25,6],[45,-16,5],[50,7,5],[22,4,4.5]];
for(const [x,z,h] of treeSites)art.tree(x,z,h,0,false);
for(let i=0;i<300;i++){const x=between(-59,59),z=between(19,56);if(lakePoints.some(p=>Math.hypot(p.x-x,p.z-z)<3))continue;
 let inside=false;for(let j=0,k=lakePoints.length-1;j<lakePoints.length;k=j++){const a=lakePoints[j],b=lakePoints[k];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;}
 const pathDistance=Math.min(...pathCurve.getPoints(120).map(p=>Math.hypot(p.x-x,p.z-z)));
 if(!art.clearAt(x,z,1.8)||art.treeSites.some(t=>Math.hypot(t.x-x,t.z-z)<3)||inside||pathDistance<2.7||Math.abs(x+15)<6&&Math.abs(z-44)<4||Math.abs(x)<7&&Math.abs(z-31)<5)continue;art.tree(x,z,between(3.8,7),i%9===0?1:0,true);}
for(let z=-42;z<1;z+=4.2)for(let x=-51;x<52;x+=4.2){if(rand()<.6)art.tree(x+between(-.7,.7),z+between(-.7,.7),between(4.2,6.7),0,false);}
for(const scale of [.83,.91])for(let i=0;i<coast.length;i+=3){const x=coast[i].x*scale,z=coast[i].z*scale;if(lakePoints.some(p=>Math.hypot(p.x-x,p.z-z)<4)||pathCurve.getPoints(120).some(p=>Math.hypot(p.x-x,p.z-z)<2.5))continue;art.tree(x,z,between(4.6,6.7),0,false);}
// Flowers are separate petals at close range, batched by material.
for(let i=0;i<250;i++){const x=between(27,44),z=between(39,46),h=between(.15,.36);if(!art.clearAt(x,z,.2))continue;batch('cyl','#798e53',x,h/2,z,.012,h,.012);for(let j=0;j<4;j++){const a=j*Math.PI/2;batch('sphere',i%3?'#e4c586':'#c5969d',x+Math.cos(a)*.065,h,z+Math.sin(a)*.065,.055,.035,.055);}batch('sphere','#cfa965',x,h+.02,z,.035,.035,.035);}
// Residents and vehicles share the existing family-friendly character language.
for(const [i,p] of [[-24,5],[-22,5],[-5,-15],[-3,-16],[1,-16],[20,15],[23,16],[-34,26],[-32,28],[-8,40],[-2,22],[28,28],[30,31],[45,23],[-18,51.2],[0,49.5],[20,48],[28.6,48]].entries()){
 const resident=art.person(p[0],p[1],i===3||i===4?.58:.9,['#739baf','#bb9277','#93a179','#d3b36e'][i%4],'#697570',i%5===0?'#b9b7a2':'#594937',i%4===0?'wave':'idle',between(-1,1));keep(resident);features.people++;}
const cars=[];for(const [i,p] of [[-40,8],[-7,8],[31,12],[13,-22]].entries()){const c=keep(art.car(p[0],p[1],['#e4dbbd','#628f97','#bd836a','#9cab9b'][i],i===3?0:Math.PI/2*(i===2?-1:1)));cars.push(c);features.cars++;}
features.trees=art.treeSites.length;const batchStats=art.flush();

const placeDefinitions=[['校園與運動',-43,8,24],['育兒托育',-9,11,-19],['居住與都更',-22,24,-4],['產業與科技',28,42,-31],['社區照護',39,15,21.5],['湖橋與水岸',10,3,34]];
const places=placeDefinitions.map(([text,x,y,z])=>{const el=document.createElement('span');el.className='place';el.textContent=text;document.querySelector('#places').append(el);return {el,point:new THREE.Vector3(x,y,z)};});
function updatePlaces(){for(const p of places){const q=p.point.clone().project(camera),visible=q.z<1&&q.z>-1&&Math.abs(q.x)<.96&&Math.abs(q.y)<.84;p.el.hidden=!visible;if(visible)p.el.style.transform=`translate(${(q.x*.5+.5)*innerWidth}px,${(-q.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`;}}
const views={overview:{target:[-2,12,8],position:[132,145,175]},street:{target:[-17,7,1],position:[10,22,54]},courtyard:{target:[-40,2,26],position:[-4,39,80]},lake:{target:[-7,1,40],position:[53,40,115]}};
let activeView='overview',sunset=false,moving=false,elapsed=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function render(){controls.update();sky.position.copy(camera.position);renderer.info.reset();composer.render();updatePlaces();}
function setView(name){activeView=name;const v=views[name];controls.target.fromArray(v.target);const pos=new THREE.Vector3(...v.position),offset=pos.sub(controls.target);if(innerWidth<760&&name==='overview')offset.set(40,205,330);camera.position.copy(controls.target).add(offset);controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===name));render();}
function orbitQuarter(){const damping=controls.enableDamping;controls.enableDamping=false;controls.update();camera.position.sub(controls.target).applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2).add(controls.target);controls.update();controls.enableDamping=damping;render();}
document.querySelector('#orbit').onclick=orbitQuarter;
function setTime(value){sunset=value;sun.color.set(value?'#ffbe83':'#fff0cc');sun.intensity=value?3:3.3;sun.position.set(value?-65:-45,value?33:82,value?20:36);sky.material.uniforms.sunPosition.value.copy(sun.position);sky.material.uniforms.cityCloudColor.value.set(value?'#ffe1bc':'#fffaf0');hemi.intensity=value?1.15:1.65;scene.background.set(value?'#c6cfcc':'#b9dbe2');scene.fog.color.copy(scene.background);document.querySelector('#time').setAttribute('aria-pressed',String(value));render();}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));document.querySelector('#time').onclick=()=>setTime(!sunset);
document.querySelector('#motion').onclick=()=>{moving=!moving;document.querySelector('#motion').setAttribute('aria-pressed',String(moving));};
document.querySelector('#quality').onchange=e=>{renderer.setPixelRatio(e.target.value==='high'?Math.min(devicePixelRatio,2):1);renderer.shadowMap.enabled=e.target.value==='high';ao.enabled=e.target.value==='high';renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});render();};
reduced.addEventListener('change',()=>{if(reduced.matches){moving=false;document.querySelector('#motion').setAttribute('aria-pressed','false');}});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);render();});
const clock=new THREE.Clock();function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);if(moving){elapsed+=dt;composition.advance(elapsed);waterUniform.value=elapsed;cars[0].position.x=-45+(elapsed*2)%96;cars[1].position.x=-30+(elapsed*1.5)%80;art.residents.forEach(r=>r.arm.rotation.z=r.base+Math.sin(elapsed*2)*.15);}render();}
const initialView=new URLSearchParams(location.search).get('view');setView(Object.hasOwn(views,initialView)?initialView:'overview');window.TAIPEI_COMPOSITION={composition,shoreAccess,onLand,orbitQuarter,scene,renderer,camera,controls,features,views,setView,setTime,cars,snapshot(){render();return {inventory:composition.inventory.map(({root,...item})=>item),boats:composition.boats.length,features,batchStats,view:activeView,sunset,moving,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls};}};
document.querySelector('#loading').hidden=true;document.documentElement.dataset.ready='true';frame();
