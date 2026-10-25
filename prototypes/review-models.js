import * as THREE from 'three';
export const RESIDENT_SHIRTS=['#79a9bd','#c5ad87','#a8bb9d','#b28d7e','#739499','#dec179'];
export function createReviewCar(art,index=0){const root=art.car(0,0,['#c7d4d5','#d1b783','#8ba8b3','#aa856e'][index%4]);root.userData.modelType='car';return root;}
export function createReviewResident(art,index=0){const root=art.person(0,0,1,RESIDENT_SHIRTS[index%6],'#82928e',index===4?'#c0c3b2':'#574534',index===5?'wave':'idle');if(index===4)art.line('#9b835f',[.48,.75,.1],[.48,.05,.35],.035,root);root.userData.modelType='resident';return root;}
export function createReviewBus(art){const root=new THREE.Group(),blue='#477591',glass=art.mat('#5b8695',.3,.16);art.box('#e3e6da',0,1.2,0,2.2,1.8,7,root);art.box(blue,0,.75,0,2.25,.38,7.05,root);for(const x of [-1.12,1.12]){art.box(glass,x,1.62,0,.06,.9,5.7,root);for(const z of [-2.2,2.2])art.shape('cyl','#3c4746',x,.5,z,.4,.2,.4,root).rotation.z=Math.PI/2;}art.box(glass,0,1.65,3.53,1.85,.9,.05,root);root.userData.modelType='bus';return root;}
let aircraft;
export async function loadReviewAircraft(){if(!aircraft)aircraft=fetch('./aircraft-review-data.json?rev=1').then(r=>{if(!r.ok)throw Error('Aircraft model unavailable');return r.json();}).then(data=>{const root=new THREE.ObjectLoader().parse(data.object);root.userData.sourceCommit=data.sourceCommit;root.userData.source='現行飛機模型';root.userData.modelType='aircraft';return root;});return (await aircraft).clone(true);}
export async function createRegionalAircraft(scene,plan,ceiling){const planes=[];for(let i=0;i<2;i++){const g=await loadReviewAircraft();g.scale.setScalar(11);g.userData.keepDynamic=true;scene.add(g);planes.push({g,phase:i*Math.PI+.6});}const xs=plan.coast.map(p=>p[0]),zs=plan.coast.map(p=>p[1]),rx=(Math.max(...xs)-Math.min(...xs))*.7,rz=(Math.max(...zs)-Math.min(...zs))*.65;let clock=0;
 function update(dt=0){clock+=Math.max(0,Math.min(.1,dt));for(const [i,p]of planes.entries()){const a=p.phase+clock*.026,dx=-Math.sin(a)*rx,dz=Math.cos(a)*rz;p.g.position.set(Math.cos(a)*rx,ceiling+55+i*23,Math.sin(a)*rz);p.g.rotation.set(0,Math.atan2(dx,dz),-.035*Math.sin(a));}}
 update();return {planes,update,get clock(){return clock;}};
}
