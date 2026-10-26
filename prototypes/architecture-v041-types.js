import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createStreetArt} from './street-art-kit.js?rev=2';
import {createReviewedFacades} from './v041-art.js?rev=1';
import {createVariedStreetElements,buildingAudit,BUILDING_TYPES} from './architecture-v041.js';
const scene=new THREE.Scene();scene.background=new THREE.Color('#dfeadf');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.querySelector('#scene').append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.4,900),controls=new OrbitControls(camera,renderer.domElement);controls.minDistance=9;controls.maxDistance=420;controls.maxPolarAngle=Math.PI*.48;
const sun=new THREE.DirectionalLight('#fff0d4',3.1);sun.position.set(-70,160,80);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-130,right:130,top:130,bottom:-130,near:1,far:400});sun.shadow.normalBias=.025;sun.shadow.bias=-.00003;scene.add(sun,sun.target,new THREE.HemisphereLight('#d8edff','#68794e',1.7));
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;pmrem.dispose();room.dispose();
const art=createStreetArt(renderer,scene),T=createReviewedFacades(art,scene,'大台北'),streets=createVariedStreetElements(art,scene,T,'catalog');
for(let i=0;i<24;i++){const x=(i%6-2.5)*30,z=(Math.floor(i/6)-1.5)*34,p={id:'type-'+i,kind:'urban',x,z,usableW:24,usableD:27,seed:i*117+21};art.box('#bccba7',x,-.45,z,28,.8,31);art.box('#d3d2bb',x,.01,z+13.5,28,.04,2);streets.urban(p);}
const records=streets.records,labels=[];for(const r of records){const el=document.createElement('button');el.className='label';el.textContent=r.typeName;el.onclick=()=>focus(r.id);document.querySelector('#labels').append(el);labels.push({el,r});}
for(const r of [...records].sort((a,b)=>a.type-b.type)){const o=document.createElement('option');o.value=r.id;o.textContent=r.typeName;document.querySelector('#types').append(o);}
art.flush();let selected=null;
function render(){for(const {el,r}of labels){const p=new THREE.Vector3(r.x,.1,r.z+13).project(camera);el.hidden=p.z>1||p.z< -1||!!selected&&selected!==r.id;el.style.left=(p.x+1)*innerWidth/2+'px';el.style.top=(1-p.y)*innerHeight/2+'px';}renderer.render(scene,camera);}
function overview(){selected=null;document.querySelector('#types').value='';const k=Math.max(1,1.3/camera.aspect);controls.target.set(0,2,0);camera.position.set(88*k,203*k,237*k);controls.update();render();}
function focus(id){const r=records.find(r=>r.id===id);if(!r)return overview();selected=id;document.querySelector('#types').value=id;const d=Math.max(r.height*1.4,Math.max(r.w,r.d)*2,32);controls.target.set(r.x,r.height*.4,r.z);camera.position.copy(controls.target).add(new THREE.Vector3(.65,.63,1).normalize().multiplyScalar(d*Math.max(1,1/camera.aspect)));controls.update();render();}
controls.addEventListener('change',render);document.querySelector('#all').onclick=overview;document.querySelector('#types').onchange=e=>focus(e.target.value);addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();render();});
document.querySelector('#status').hidden=true;overview();window.ARCHITECTURE_CATALOG={scene,renderer,camera,controls,records,audit:buildingAudit(),render,focus,overview};
