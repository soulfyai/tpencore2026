import * as THREE from 'three';
import {allocateRecipe,architectureAudit,ARCHITECTURE_FAMILIES} from './v05-building-recipes.js';
export {architectureAudit,ARCHITECTURE_FAMILIES};
const COLORS=[['#cfaa83','#6b8d87'],['#b4c7b3','#ae785c'],['#e5d6b7','#6b87a0'],['#b77962','#e6d8b9'],['#d9c09b','#788f70'],['#b7c5ca','#4b7089'],['#e1d1bd','#9d7056'],['#afc5bf','#d2ad71']];
const PREFERENCE={transport:[12,23,24,30],sports:[17,15,13],education:[0,1,2,23,30],childcare:[18,0,23],family:[0,18,30,1],housing:[3,4,6,7,20,21,22,29,31],research:[5,6,8,9,10,11,24],enterprise:[8,10,13,24,29],youth:[11,13,24,29],medical:[2,21,10,30],health:[12,13,25],senior:[0,1,18,30],welfare:[1,18,30,16],culture:[14,15,16,19,27,28],community:[14,16,19,27,28],environment:[13,25,23],flood:[13,25,23],civic:[16,27,28,11]};
function prism(points){const g=new THREE.BufferGeometry(),pos=[],idx=[];for(const y of [-.5,.5])for(const [x,z]of points)pos.push(x,y,z);const n=points.length;for(let i=1;i<n-1;i++){idx.push(0,i,i+1,n,n+i+1,n+i);}for(let i=0;i<n;i++){const j=(i+1)%n;idx.push(i,n+j,j,i,n+i,n+j);}g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function roofs(type){const s=new THREE.Shape();if(type==='arch'){s.moveTo(-.5,-.5);s.lineTo(.5,-.5);s.absellipse(0,-.5,.5,1,0,Math.PI,false);s.closePath();}else if(type==='gable'){s.moveTo(-.5,-.5);s.lineTo(.5,-.5);s.lineTo(0,.5);s.closePath();}else{s.moveTo(-.5,-.5);s.lineTo(.5,-.5);s.lineTo(.5,.5);s.closePath();}const g=new THREE.ExtrudeGeometry(s,{depth:1,bevelEnabled:false,curveSegments:20});g.translate(0,0,-.5);g.computeVertexNormals();return g;}
export function createDiverseDistrict(art,scene,T,city){
 const {box,shape,line,mat}=art,records=[],sites=[],picks=[],furniture={seating:0,bicycleStands:0,planters:0,pergolas:0,flowerBeds:0,entrances:0};
 const materials=new Map(),glass=new THREE.MeshPhysicalMaterial({color:'#5d8797',roughness:.23,metalness:.24,clearcoat:.8,envMapIntensity:.6});
 for(const [type,g]of Object.entries({box:art.geo.box,cyl:new THREE.CylinderGeometry(.5,.5,1,28),oct:new THREE.CylinderGeometry(.5,.5,1,8),hex:new THREE.CylinderGeometry(.5,.5,1,6),tri:prism([[-.5,-.5],[.5,-.5],[0,.5]]),pyramid:new THREE.ConeGeometry(.707,1,4).rotateY(Math.PI/4),dome:new THREE.SphereGeometry(.5,24,14,0,Math.PI*2,0,Math.PI/2).scale(1,2,1).translate(0,-.5,0),arch:roofs('arch'),gable:roofs('gable'),wedge:roofs('wedge')}))art.geo['var-'+type]=g;
 const ring=new THREE.Shape();ring.absellipse(0,0,.5,.5,0,Math.PI*2,false);const inner=new THREE.Path();inner.absellipse(0,0,.3464,.3464,0,Math.PI*2,true);ring.holes.push(inner);const rg=new THREE.ExtrudeGeometry(ring,{depth:1,bevelEnabled:false,curveSegments:28});rg.rotateX(-Math.PI/2);rg.translate(0,-.5,0);art.geo['var-ring']=rg;
 function wall(color){if(!materials.has(color))materials.set(color,T.material(color,T.tile));return materials.get(color);}
 function face(root,span,h,style){const cols=Math.max(1,Math.min(6,Math.floor(span/2.6))),floors=Math.max(1,Math.floor(h/2.8));
  if(h>35||style==='curtain'){for(let f=0;f<floors;f++){box(glass,0,1.45+f*2.8,.07,Math.max(.5,span-.28),2.35,.08,root);box('#c1cabb',0,2.74+f*2.8,.15,span,.08,.18,root);}for(let j=0;j<=cols;j++)box('#c4cdbf',-span/2+j*span/cols,h/2,.17,.075,h,.15,root);
   if(style==='fins')for(let j=0;j<=cols*2;j++)box('#e4d9be',-span/2+j*span/(cols*2),h/2,.34,.055,h,.55,root);
  }else for(let f=0;f<floors;f++)for(let j=0;j<cols;j++)T.windowBay(-span/2+(j+.5)*span/cols,1.45+f*2.8,.04,Math.min(1.6,span/cols*.66),1.65,root,style==='balcony'&&f>0&&(f+j)%3!==1);
 }
 function facade(root,m,w,d,h,style){
  if(m.type==='box')for(const [x,z,a,span]of [[0,d/2,0,w],[w/2,0,Math.PI/2,d],[0,-d/2,Math.PI,w],[-w/2,0,-Math.PI/2,d]]){
   if(span<2.2||h<3)continue;const f=new THREE.Group();f.position.set(x,-h/2,z);f.rotation.y=a;root.add(f);face(f,span,h,style);
  }else if(['cyl','oct','hex'].includes(m.type)&&h>3){const n=m.type==='hex'?6:m.type==='oct'?8:14;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,f=new THREE.Group();f.position.set(Math.sin(a)*w/2,-h/2,Math.cos(a)*d/2);f.rotation.y=a;root.add(f);face(f,Math.min(w,d)*Math.PI/n*.88,h,style==='balcony'?'curtain':style);}}
 }
 function program(root,p,W,D,H){const k=p.sceneKind;if(!k)return;
  const z=D*.30,y=.13;
  if(['education','sports'].includes(k)){
   const tex=art.texture(512,(g,s)=>{g.fillStyle='#b46f53';g.fillRect(0,0,s,s);g.fillStyle='#76a55e';g.beginPath();g.ellipse(s/2,s/2,s*.38,s*.32,0,0,Math.PI*2);g.fill();g.strokeStyle='#f3ead3';g.lineWidth=3;for(let j=0;j<4;j++){g.beginPath();g.ellipse(s/2,s/2,s*(.40+j*.025),s*(.35+j*.025),0,0,Math.PI*2);g.stroke();}g.strokeRect(s*.25,s*.28,s*.5,s*.44);g.beginPath();g.moveTo(s/2,s*.28);g.lineTo(s/2,s*.72);g.stroke();});
   const field=new THREE.Mesh(new THREE.PlaneGeometry(W*.72,D*.36),new THREE.MeshStandardMaterial({map:tex,roughness:1}));field.rotation.x=-Math.PI/2;field.position.set(0,y,z);root.add(field);for(let i=0;i<3;i++)box('#d2cfbb',0,.25+i*.3,z+D*.19+i*.35,W*.65,.3,.65,root);
  }
  if(['childcare','family'].includes(k)){
   for(const x of [-1.2,1.2])for(const zz of [-1,1])box('#b08c61',x,1.3,z+zz,.13,2.5,.13,root);box('#d7b375',0,1.7,z,3,.17,2.5,root);shape('var-pyramid','#71a29a',0,3.4,z,3.8,1.4,3.5,root);line('#e9b859',[1.1,1.7,z+1],[3.6,.2,z+3.4],.18,root);for(const x of [-W*.32,-W*.2])line('#9a9e8b',[x,.1,z],[x,2.8,z],.05,root);line('#87958a',[-W*.32,2.8,z],[-W*.2,2.8,z],.05,root);
  }
  if(k==='transport'){
   for(const x of [-W*.2,W*.2]){box('#a4aaa1',x,.15,z,1,.24,D*.32,root);for(let j=0;j<6;j++)box('#e4d3a0',x+.6,.28,z-D*.14+j*D*.05,.08,.02,.7,root);}const canopy=box('#548594',0,3.5,z,W*.7,.2,D*.26,root);for(const x of [-W*.3,W*.3])line('#8d9f96',[x,.1,z],[x,3.5,z],.08,root);box('#e6e7db',0,1.1,z,2.2,1.6,5.5,root);box('#447897',0,1.4,z+2.77,1.9,.8,.06,root);
  }
  if(['research','enterprise','youth'].includes(k))for(let i=0;i<4;i++){const panel=box(mat('#335d6b',.3,.4),-W*.3+i*W*.2,H*.3,z,W*.17,.08,2,root);panel.rotation.x=-.15;}
  if(k==='medical'){box('#e7ddd0',W*.32,H*.55,-D*.1,2.3,2.3,.12,root);box('#bc6359',W*.32,H*.55,-D*.02,.45,1.7,.18,root);box('#bc6359',W*.32,H*.55,-D*.02,1.7,.45,.18,root);box('#e8e5d7',0,.9,z,2,1.6,4.2,root);box('#7d9f9c',0,1.2,z+2.12,1.8,.65,.05,root);}
  if(k==='health'){for(let i=0;i<3;i++){box('#c4a16a',-W*.26+i*W*.25,.9,z,W*.2,1.6,2,root);box(i%2?'#629c91':'#d0a16e',-W*.26+i*W*.25,2,z,W*.23,.18,2.4,root);}T.sign('食安檢驗',0,2.7,z+1.2,W*.5,.55,'#ece3c9','#426c68',root);}
  if(['flood','environment'].includes(k))for(let i=0;i<3;i++){shape('var-cyl','#a6bdb2',-W*.25+i*W*.25,1.3,z,2.1,2.5,2.1,root);shape('var-cyl','#6d9eab',-W*.25+i*W*.25,2.58,z,1.9,.05,1.9,root);}
  if(['senior','welfare','civic','community'].includes(k)){for(const x of [-W*.25,W*.25]){box('#ad9673',x,.55,z,2.7,.16,.8,root);box('#788e7c',x,1,z-.35,2.7,.8,.1,root);}const ramp=box('#b8bba8',0,.22,z,2,.18,4,root);ramp.rotation.x=-.08;}
 }
 function build(p,policy=false){let candidates=policy?PREFERENCE[p.sceneKind]||[11,16,30]:null;
  const recipe=allocateRecipe(p,candidates),palette=COLORS[(recipe.family+recipe.variant)%COLORS.length],W=p.usableW*.9,D=p.usableD*.9;
  const tall=[4,5,6,7,8,9,10,20,21,22,24,29,31].includes(recipe.family);
  let H=tall?32+((p.seed||recipe.family*17)%16)*3:9+((p.seed||recipe.family*13)%6)*2.8;if(policy)H=Math.min(H,['research','housing','medical'].includes(p.sceneKind)?60:20);
  const root=new THREE.Group();root.position.set(p.x,0,p.z);root.name='architecture-'+p.id;scene.add(root);
  const model=new THREE.Group();if(policy){model.position.z=-D*.16;model.scale.set(.95,1,.57);}root.add(model);
  const style=['balcony','curtain','recessed','fins'][recipe.family%4];
  for(const m of recipe.masses){const g=new THREE.Group();g.position.set(m.x*W,(m.b+m.h/2)*H,m.z*D);g.rotation.y=m.rot;model.add(g);const w=m.w*W,d=m.d*D,h=m.h*H;
   const glassType=['cyl','tri','hex'].includes(m.type)&&tall,material=glassType?glass:['arch','gable','pyramid','wedge','dome'].includes(m.type)?mat(palette[1]):wall(palette[0]);
   const mass=shape('var-'+m.type,material,0,0,0,w,h,d,g);mass.userData.architectureMass=true;facade(g,m,w,d,h,style);
   if(m.type==='box'&&w>5&&d>4&&m.h>.3){if(recipe.variant%3===0)T.roofGarden(g,w*.85,d*.85,h/2);else if(recipe.variant%3===1){for(let i=0;i<3;i++){const panel=box(mat('#365e6e',.3,.35),-w*.25+i*w*.25,h/2+.22,0,w*.19,.08,1.7,g);panel.rotation.x=-.18;}}else{shape('var-cyl','#99aaa2',-w*.25,h/2+.85,0,1.1,1.7,1.1,g);box('#c9cebd',w*.18,h/2+.4,0,2,.8,1.5,g);}}
  }
  program(root,p,W,D,H);
  // Some districts have arcades, others colonnades, glass lobbies or public stairs.
  if(!policy&&[0,1,2,3,18,26,29,31].includes(recipe.family)){const fronts=recipe.masses.filter(m=>m.type==='box'&&m.b===0&&m.w*W>4).slice(0,2);for(const [i,m]of fronts.entries())T.storefront(root,m.x*W,m.z*D+m.d*D/2+.13,m.w*W*.86,i?'日常咖啡':'街角書屋',palette[1]);furniture.seating++;furniture.entrances++;}
  else if(!policy){box(glass,0,1.8,D*.34,W*.22,3.2,.12,root);for(let i=0;i<3;i++)box('#d7cfb9',0,.1+i*.12,D*.40+i*.32,W*.36,.14,.45,root);furniture.entrances++;}
  root.updateMatrixWorld(true);let bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());const sc=Math.min(1,(p.usableW-1)/size.x,(p.usableD-1)/size.z);
  root.scale.set(sc,1,sc);root.position.x=p.x-(center.x-p.x)*sc;root.position.z=p.z-(center.z-p.z)*sc;root.updateMatrixWorld(true);bounds.setFromObject(root);size=bounds.getSize(new THREE.Vector3());
  p.height=bounds.max.y;p.anchor=new THREE.Vector3(p.x,p.height+2,p.z);p.features=[p.sceneKind||'urban',recipe.key,'unique-massing','detailed-facades'];art.reserve(p.x,p.z,size.x+1.5,size.z+1.5);
  const rec={id:p.id,parcel:p.id,city,kind:policy?'policy':'urban',x:p.x,z:p.z,w:size.x,d:size.z,height:p.height,style:recipe.key,family:recipe.family,variant:recipe.variant,signature:recipe.signature,nearSimilarity:recipe.nearSimilarity,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},site:{x:p.x,z:p.z,w:p.usableW,d:p.usableD}};records.push(rec);
  if(policy){const pick=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),new THREE.MeshBasicMaterial({visible:false}));pick.position.copy(bounds.getCenter(new THREE.Vector3()));pick.userData.theme=p.id;scene.add(pick);picks.push(pick);}
  else sites.push({city,parcel:p.id,x:p.x,z:p.z,w:size.x,d:size.z,height:p.height,rotation:0});
  return rec;
 }
 function parks(ponds){for(const p of ponds){const x=p.x+p.usableW*.38,z=p.z+p.usableD*.36;if(!art.clearAt(x,z,2))continue;art.bench(x,z);art.reserve(x,z,4,3);furniture.seating++;T.planter(x,.15,z+2,2.5,.8);furniture.planters++;}}
 return {records,sites,picks,furniture,source:'v0.5 diverse structural catalog',policy:p=>(build(p,true),true),urban:p=>build(p),highriseFront:()=>{},parks};
}
