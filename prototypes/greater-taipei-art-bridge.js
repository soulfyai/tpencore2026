/* This file runs in the production module's scope, before its unchanged UI. */
import {buildApprovedCityArt,buildReviewedBoats} from './greater-taipei-art.js?rev=3';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {installTaipeiSkyClouds,excludeSkyOverlaysFromAO} from './taipei-city-nature.js?rev=1';
const APPROVED_ART={cities:new Map(),picks:[],boats:[],revision:3,baseY:0};
// Remove the earlier city meshes, retaining environment and all native label/UI anchors.
const retired=[];
scene.traverse(o=>{if((o.isMesh||o.isLine||o.isPoints||o.isSprite)&&!ENV.preservedObjects.has(o))retired.push(o);});
for(const o of retired)o.removeFromParent();
const inputs=await fetch('./greater-taipei-art-data.json?rev=3',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('City art data unavailable');return r.json();});
for(const input of inputs){
 const city=input.city.city,offset=input.sourceCenter||[0,0],built=await buildApprovedCityArt(input,renderer),S=built.plan.scale;
 // The reviewed road mask/grass shaders use city-local metres. Keep those
 // coordinates after scaling the city into the existing production world.
 for(const road of built.roadSurface.meshes){if(road.material.name!=='Taipei road with integrated paint')continue;const compile=road.material.onBeforeCompile;
 road.material.onBeforeCompile=shader=>{compile(shader);shader.vertexShader=shader.vertexShader.replace('vRoadXZ=(modelMatrix*vec4(transformed,1.)).xz;','vRoadXZ=transformed.xz;');};
 road.material.customProgramCacheKey=()=> 'approved-city-local-road-v3';}
 const grassCompile=built.art.grass.onBeforeCompile;
 built.art.grass.onBeforeCompile=shader=>{grassCompile(shader);shader.vertexShader=shader.vertexShader.replace('vGround=(modelMatrix*groundPoint).xyz;','vGround=groundPoint.xyz;');};
 built.art.grass.customProgramCacheKey=()=> 'approved-city-local-grass-v3';
 built.root.name='approved-city-'+city;built.root.scale.setScalar(1/S);built.root.position.set(offset[0],APPROVED_ART.baseY,offset[1]);scene.add(built.root);
 built.root.updateMatrixWorld(true);APPROVED_ART.cities.set(city,built);
 for(const p of built.picks){if(p.userData.theme){p.userData.type='island';p.userData.id=p.userData.theme;APPROVED_ART.picks.push(p);}}
 for(const t of built.themeMeta){
  const isl=islandById.get(t.id),body=WORLD.bodies.get(t.id);if(!isl||!body)continue;
  const x=offset[0]+t.x/S,z=offset[1]+t.z/S,h=t.height/S;
  isl.campus={cx:x-isl.c.x,cz:z-isl.c.z,w:t.w/S,d:t.d/S};isl.campusTop=APPROVED_ART.baseY+h;
  body.anchor.set(x-isl.c.x,APPROVED_ART.baseY+h+.25,z-isl.c.z);
  for(const item of isl.t.items||[]){const info=ITEMS3D.get(item.id);if(!info)continue;
   info.box.set(new THREE.Vector3(x-t.w/S/2,APPROVED_ART.baseY,z-t.d/S/2),new THREE.Vector3(x+t.w/S/2,APPROVED_ART.baseY+h,z+t.d/S/2));info.size=Math.max(t.w,t.d)/S;
  }
 }
 for(const landmark of built.landmarks){const native=LANDMARKS3D.find(l=>l.id===landmark.id&&l.city===city);if(native)native.top=APPROVED_ART.baseY+landmark.height/S;}
 if(city==='taipei'){
  const ships=buildReviewedBoats(built.art,built.root,built.plan.coast);APPROVED_ART.boats=ships.boats;
  for(const b of ships.boats){b.base.y=(WATER_Y-APPROVED_ART.baseY)*S+.35;b.root.position.y=b.base.y;}
 }
}
scene.updateMatrixWorld(true);
// Keep the native sea, day/night modes and shadows, adding reviewed reflection and cloud materials.
const pmremArt=new THREE.PMREMGenerator(renderer),roomArt=new RoomEnvironment();
scene.environment=pmremArt.fromScene(roomArt,.04).texture;roomArt.dispose();pmremArt.dispose();
const artSky=new Sky();artSky.scale.setScalar(350);artSky.name='approved-background-clouds';
artSky.material.uniforms.turbidity.value=2.6;artSky.material.uniforms.rayleigh.value=1.1;
installTaipeiSkyClouds(artSky);
// Add the approved cloud function to the existing native sky dome. A second
// full-screen sky mesh must never cover the city during a mode change.
const nativeSky=[...ENV.preservedObjects].find(o=>o.material?.uniforms?.uTop);
const cloudFragment=artSky.material.fragmentShader;
const cloudNoise=cloudFragment.slice(cloudFragment.indexOf('uniform vec3 cityCloudColor'),cloudFragment.indexOf('void main() {'));
Object.assign(nativeSky.material.uniforms,{cityCloudColor:artSky.material.uniforms.cityCloudColor,citySkyTint:artSky.material.uniforms.citySkyTint});
nativeSky.material.fragmentShader=nativeSky.material.fragmentShader.replace('void main(){',cloudNoise+'\nvoid main(){').replace('gl_FragColor=vec4(c,1.0);',`vec3 direction=normalize(vDir);
vec2 cloudUV=direction.xz/(.3+max(0.,direction.y))*1.5;
float cloudShape=cityCloudFbm(cloudUV+vec2(13.4,7.2));
float cloudCover=smoothstep(.52,.7,cloudShape)*smoothstep(.015,.15,direction.y)*(1.-smoothstep(.82,.98,direction.y));
c=mix(c,cityCloudColor*(1.1+cloudShape*.35),cloudCover*.85*(1.-uStars));
gl_FragColor=vec4(c,1.0);`);
nativeSky.material.needsUpdate=true;
const artWindowMaterials=new Set();
for(const c of APPROVED_ART.cities.values())c.root.traverse(o=>{if(o.isMesh)for(const m of [o.material].flat()){if(m?.isMeshStandardMaterial&&m.roughness<=.4)artWindowMaterials.add(m);}});
const artSun=scene.children.find(o=>o.isDirectionalLight&&o.castShadow);if(artSun){artSun.shadow.autoUpdate=false;artSun.shadow.needsUpdate=true;}
let artNight=-1,artShadowMinute=-1,artShadowTime=0;
function updateArtLight(){const night=ENV.state?.night||0;artSky.visible=night<.55;
const sourceSun=scene.children.find(o=>o.isDirectionalLight&&o.castShadow);if(sourceSun)artSky.material.uniforms.sunPosition.value.copy(sourceSun.position).sub(sourceSun.target.position);
if(artSun&&ENV.state?.minute!==artShadowMinute){artShadowMinute=ENV.state?.minute;artSun.shadow.needsUpdate=true;}
if(Math.abs(night-artNight)>.01){artNight=night;for(const m of artWindowMaterials){m.emissive.set('#efd5a0');m.emissiveIntensity=night*.35;}}}
const artComposer=new EffectComposer(renderer);if(renderer.capabilities.isWebGL2){artComposer.renderTarget1.samples=4;artComposer.renderTarget2.samples=4;}
artComposer.addPass(new RenderPass(scene,camera));
const artAO=new SSAOPass(scene,camera,1,1,16);artAO.kernelRadius=.13;artAO.minDistance=.00005;artAO.maxDistance=.008;
excludeSkyOverlaysFromAO(artAO,scene);artComposer.addPass(artAO);artComposer.addPass(new OutputPass());
let artWidth=0,artHeight=0;
APPROVED_ART.render=()=>{const w=stage.clientWidth,h=stage.clientHeight;if(w!==artWidth||h!==artHeight){artWidth=w;artHeight=h;artComposer.setSize(w,h);const aoRatio=renderer.getPixelRatio()*.5;artAO.setSize(Math.ceil(w*aoRatio),Math.ceil(h*aoRatio));}updateArtLight();artSky.position.copy(camera.position);artComposer.render();};
APPROVED_ART.update=(dt,time,moving)=>{if(moving&&artSun&&time-artShadowTime>.25){artShadowTime=time;artSun.shadow.needsUpdate=true;}for(const c of APPROVED_ART.cities.values()){c.life.setEnabled(moving);c.life.update(dt);if(moving)c.airTraffic?.update(dt);}if(moving)for(const [i,b]of APPROVED_ART.boats.entries()){b.root.position.y=b.base.y+Math.sin(time*.7+i)*.045;b.root.rotation.z=Math.sin(time*.5+i)*.012;}};
APPROVED_ART.ao=artAO;
window.APPROVED_ART=APPROVED_ART;
