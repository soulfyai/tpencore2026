import * as THREE from 'three';
import {createUrbanBuildings} from './urban-buildings.js?rev=1';
import {createReviewBus} from './review-models.js?rev=1';

// Shared urban facade vocabulary, with a distinct physical scene for every policy category.
export function createRegionalCityKit(art,scene){
 const {box,shape,line,mat,label,geo}=art,glass=mat('#5b8695',.3,.16),cream='#e6dcc7',blue='#477591',brick='#b58068';
 const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,-.5,.5,0,-.5,.5,0,.5,-.5,0,.5,-.5,.5,0,.5,.5,0],3));roof.setIndex([0,4,5,0,5,1,3,2,5,3,5,4,0,3,4,1,5,2]);roof.computeVertexNormals();geo.cityRoof=roof;
 const arch=new THREE.Shape();arch.moveTo(-.5,-.5);arch.lineTo(.5,-.5);arch.lineTo(.5,0);arch.absarc(0,0,.5,0,Math.PI,false);arch.lineTo(-.5,-.5);geo.cityArch=new THREE.ShapeGeometry(arch,10);
 geo.cityRing=new THREE.TorusGeometry(1,.025,6,48);
 const rampGeo=new THREE.BoxGeometry(1,1,1);for(let i=0;i<rampGeo.attributes.position.count;i++){const y=rampGeo.attributes.position.getY(i),z=rampGeo.attributes.position.getZ(i);rampGeo.attributes.position.setY(i,y>0?.5-z:0);}rampGeo.computeVertexNormals();geo.cityRamp=rampGeo;
 const picks=[],records=[];let current=null,features=null;
 function wing(root,x,z,w,d,floors,color=cream,style='masonry',angle=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);const h=floors*2.65;
  const c=Math.abs(Math.cos(angle)),sn=Math.abs(Math.sin(angle));art.reserve(root.position.x+x,root.position.z+z,c*w+sn*d+1.2,c*d+sn*w+1.2);
  box(color,0,h/2,0,w,h,d,g);box('#ded8c7',0,h+.15,0,w+.3,.3,d+.3,g);
  for(let f=0;f<floors;f++)for(const side of [-1,1]){
   const y=1.45+f*2.65,zz=side*(d/2+.08);
   if(style==='glass'){box(glass,0,y,zz,w-.45,2.05,.12,g);for(let xx=-w/2+.65;xx<w/2;xx+=2.15)box('#c2cecc',xx,y,zz+side*.08,.08,2.1,.16,g);}
   else for(let xx=-w/2+1.05;xx<w/2-.4;xx+=2.15){if(style==='arcade'&&f===0){shape('cityArch',glass,xx,1.3,zz,1.7,2.25,1,g,side<0?Math.PI:0);}else{box('#ede2c8',xx,y,zz,1.45,1.94,.18,g);box(glass,xx,y,zz+side*.11,1.18,1.65,.08,g);box('#e5dbc5',xx,y,zz+side*.18,.06,1.65,.08,g);if(style==='balcony'&&f>0){box('#b6b5a1',xx,y-.92,zz+side*.5,1.85,.14,1.1,g);box('#b8c8bc',xx,y-.45,zz+side*.96,1.85,.7,.08,g);}}}
  }
  for(const side of [-1,1])for(let f=0;f<floors;f++)for(let zz=-d/2+1.2;zz<d/2-.4;zz+=2.6){box('#e3d8c2',side*(w/2+.06),1.45+f*2.65,zz,.15,1.9,1.6,g);box(glass,side*(w/2+.15),1.45+f*2.65,zz,.06,1.65,1.35,g);}
  if(style==='gable'||style==='arcade')shape('cityRoof',style==='gable'?'#a16e55':'#617b7a',0,h,0,w+.55,2.4,d+.55,g);
  if(style==='glass'||style==='balcony'){box('#82936a',0,h+.35,0,w-.65,.1,d-.65,g);for(let k=-1;k<=1;k++)shape('leaf','#6c8c4c',k*w*.25,h+.85,d*.3,.6,.6,.5,g);box('#c7c3b3',w*.12,h+.9,-d*.13,w*.35,1.2,d*.3,g);}
  const pick=new THREE.Mesh(new THREE.BoxGeometry(w,h+2,d),new THREE.MeshBasicMaterial({visible:false}));pick.position.y=h/2;pick.userData.theme=current;g.add(pick);picks.push(pick);
  records.push({theme:current,x:root.position.x+x,z:root.position.z+z,w,d,floors,height:h,style,angle});return h+2.5;
 }
 function sign(root,text,x,y,z,w=8){label(text,x,y,z,w,.8,'#f0eadb','#386279',root);}
 function canopy(root,x,z,w,d,y=3.1,color='#6a969b'){box(color,x,y,z,w,.25,d,root);for(const xx of [-w/2+.25,w/2-.25])for(const zz of [-d/2+.25,d/2-.25])box('#9caa9e',x+xx,y/2,z+zz,.13,y,.13,root);}
 function path(root,x,z,w,d){box(art.pavement,x,.055,z,w,.11,d,root);art.reserve(root.position.x+x,root.position.z+z,w+.6,d+.6);}
 function solar(root,x,y,z,w,d){box('#b5bdba',x,y,z,w+.2,.15,d+.2,root);box('#466f86',x,y+.11,z,w,.1,d,root);for(let xx=-w/2+.65;xx<w/2;xx+=1)box('#a5b8bd',x+xx,y+.17,z,.03,.02,d,root);}
 function planter(root,x,z,w=2.4,d=1.2){box('#b9ad90',x,.23,z,w,.46,d,root);box('#6b6047',x,.48,z,w-.2,.06,d-.2,root);for(let k=-1;k<=1;k++)shape('leaf','#779859',x+k*w*.25,.8,z,.55,.55,.5,root);}
 function seats(root,x,z){for(const dx of [-1,1]){box('#a6855e',x+dx*.8,.55,z,1.4,.15,.65,root);box('#a6855e',x+dx*.8,.95,z-.3,1.4,.65,.1,root);}}
 function ramp(root,x,z,length=5){const h=.55;shape('cityRamp','#bfb8a2',x,0,z,2,.55,length,root);for(const s of [-1,1]){line('#9aa8a3',[x+s,1.45,z-length/2],[x+s,.9,z+length/2],.045,root);}}
 function playground(root,w,d){path(root,0,d*.25,w*.85,d*.34);for(const x of [-2,0])for(const z of [0,2])box('#b18c5d',x,1.1,d*.2+z,.12,2.2,.12,root);box('#d5b376',-1,1.5,d*.2+1,2.5,.15,2.5,root);shape('cone','#6a9f9b',-1,3,d*.2+1,1.9,1.3,1.9,root);line('#edbe64',[0,1.5,d*.2+1],[2.5,.25,d*.2+4],.24,root);for(const x of [-w*.32,-w*.17]){line('#8f9f8f',[x,0,d*.2],[x,3,d*.3],.07,root);}line('#8f9f8f',[-w*.32,3,d*.3],[-w*.17,3,d*.3],.07,root);line('#bcb9a4',[-w*.25,3,d*.3],[-w*.25,1,d*.3],.025,root);box('#c59d61',-w*.25,1,d*.3,.7,.1,.5,root);features.push('playground');}
 function sports(root,w,d,indoor=false){
  const rx=w*.42,rz=d*.4;const ring=shape('cyl','#b7745d',0,.1,0,rx,.16,rz,root);shape('cyl','#83986b',0,.2,0,rx*.76,.08,rz*.64,root);
  for(const scale of [.82,.9]){const lineRing=shape('cityRing','#eadfc0',0,.23,0,rx*scale,rz*scale,1,root);lineRing.rotation.x=Math.PI/2;}
  box('#e9e4cb',0,.25,0,w*.53,.015,.06,root);for(const s of [-1,1]){box('#eff0de',s*w*.27,.7,0,.1,1.4,2.3,root);for(let k=0;k<3;k++)box('#c8c9b6',0,.4+k*.48,-d*.4+k*.7,w*.72,.4,1,root);}canopy(root,0,-d*.37,w*.8,3.4,4.2);if(indoor){wing(root,-w*.28,-d*.22,w*.26,d*.35,3,'#c3cfc4','glass');}features.push('running-track','sports-field','grandstand');return indoor?11:5;
 }
 function policy(parcel){current=parcel.id;features=[];const root=new THREE.Group();root.position.set(parcel.x,0,parcel.z);scene.add(root);let w=parcel.usableW,d=parcel.usableD,h=8;const long=d>w*1.5;
  // Several categories span the original two cells as one connected campus.
  switch(parcel.sceneKind){
   case 'transport':{
    h=wing(root,-w*.3,-d*.25,w*.32,d*.32,3,'#cbd5ce','glass');path(root,w*.1,0,w*.65,d*.95);canopy(root,w*.1,-d*.08,w*.64,d*.75,4.5,'#5e8d9f');
    for(const x of [-w*.2,w*.35])box('#c6c4b5',x,.38,-d*.04,.8,.6,d*.8,root);
    for(let z=-d*.35;z<d*.35;z+=5)box('#eadc9e',w*.22,.19,z,.08,.015,2.7,root);
    sign(root,parcel.theme.rec?'捷運 · 轉乘':'城市交通 · 轉乘',0,4.3,d*.3,w*.85);shape('cyl',blue,-w*.32,7,-d*.12,1.2,.2,1.2,root).rotation.x=Math.PI/2;sign(root,'M',-w*.32,7,-d*.12+.16,1.2);const bus=createReviewBus(art);bus.position.set(w*.12,0,-d*.07);root.add(bus);features.push('platform','transit-canopy','station-entrance','city-bus');break;
   }
   case 'housing':{
    h=wing(root,-w*.24,-d*.23,w*.43,d*.42,12,'#c3ad8e','balcony');wing(root,w*.24,d*.19,w*.42,d*.42,8,'#ad8a74','balcony');wing(root,0,-d*.08,w*.88,d*.16,2,'#d9cbb3','arcade');path(root,0,d*.26,w*.3,d*.4);planter(root,-w*.24,d*.25,w*.3,2);features.push('offset-residential-towers','shared-courtyard','podium');break;
   }
   case 'research':{
    h=wing(root,-w*.24,-d*.2,w*.43,d*.48,14,'#b1c6c5','glass');wing(root,w*.25,d*.2,w*.41,d*.44,7,'#d9dcc9','glass');box(glass,0,12,0,w*.22,2.1,4,root);solar(root,w*.25,19.3,d*.2,w*.34,d*.28);line('#a4b7b3',[-w*.24,h,-d*.2],[-w*.24,h+4,-d*.2],.08,root);features.push('research-lab','solar-roof','skybridge');break;
   }
   case 'childcare':{
    h=wing(root,-w*.1,-d*.25,w*.75,d*.37,2,'#d7b48a','gable');wing(root,-w*.35,0,w*.2,d*.45,2,'#b77961','gable');playground(root,w,d);canopy(root,w*.34,0,w*.2,3,2.7);sign(root,'托育 · 親子生活',0,3.2,-d*.05,w*.52);features.push('childcare','parent-waiting');break;
   }
   case 'education':{
    h=wing(root,-w*.1,-d*.25,w*.78,d*.33,4,'#d4c5a7');wing(root,-w*.34,d*.1,w*.25,d*.4,3,'#ae816c');wing(root,w*.3,d*.1,w*.29,d*.4,2,'#c5d0b4','gable');path(root,0,d*.25,w*.34,d*.4);box('#83a27e',0,.15,d*.22,w*.32,.1,d*.3,root);sign(root,'學習館',-w*.1,3.1,-d*.07,6);sign(root,'營養午餐',w*.3,3.2,d*.31,4.3);solar(root,-w*.1,11,-d*.25,w*.46,2);features.push('classrooms','meal-hall','school-court');break;
   }
   case 'senior':case 'welfare':{
    h=wing(root,-w*.1,-d*.25,w*.78,d*.34,parcel.sceneKind==='senior'?3:4,'#d4c5aa','balcony');wing(root,-w*.32,d*.05,w*.28,d*.42,2,'#bf9c7f','gable');canopy(root,w*.23,d*.06,w*.35,d*.24,3);ramp(root,w*.22,d*.25,d*.35);seats(root,0,d*.35);planter(root,-w*.16,d*.32,3,2);sign(root,parcel.sceneKind==='senior'?'日照 · 銀髮生活':'社區照顧 · 多元服務',-w*.05,3,-d*.06,w*.7);features.push('accessible-ramp','care-center','shaded-seating');break;
   }
   case 'sports':h=sports(root,w,d,!!parcel.theme.rec);break;
   case 'youth':{
    h=wing(root,-w*.19,-d*.12,w*.5,d*.65,6,'#99b4b2','glass');wing(root,w*.25,-d*.24,w*.33,d*.38,3,'#ba9178','arcade');canopy(root,w*.23,d*.2,w*.4,d*.25,3);for(let k=0;k<4;k++){const x=-w*.25+k*1.3;const ring=shape('cityRing','#799794',x,.7,d*.4,.55,.65,.55,root);}
    sign(root,'青年 · 共創空間',0,3.15,d*.27,w*.75);features.push('coworking','cycle-parking','roof-terrace');break;
   }
   case 'health':{
    h=wing(root,-w*.23,-d*.14,w*.44,d*.65,4,'#d7e0ce','glass');wing(root,w*.26,-d*.22,w*.4,d*.35,2,'#c5b49a');canopy(root,w*.2,d*.18,w*.5,d*.38,3.3,'#8ca995');for(const z of [d*.08,d*.25])box('#d8bd91',w*.2,.9,z,w*.34,1.4,.7,root);sign(root,'食安檢驗',-w*.23,3.1,d*.2,5.3);sign(root,'無菸 · 安心市場',w*.2,3.4,d*.39,6);features.push('food-testing-lab','market-stalls','smoke-free-sign');break;
   }
   case 'environment':{
    h=wing(root,-w*.25,-d*.2,w*.42,d*.48,3,'#c3cfac');solar(root,-w*.25,8.3,-d*.2,w*.35,d*.35);for(const z of [-d*.22,d*.12]){shape('cyl','#82a9a4',w*.24,2.3,z,w*.16,4.5,w*.16,root);shape('cityRing','#bdc6b9',w*.24,4.6,z,w*.16,w*.16,w*.16,root).rotation.x=Math.PI/2;}for(let k=0;k<3;k++)box(['#749b79','#baac76','#7c9eaa'][k],-w*.35+k*2.6,.8,d*.32,2,1.6,2.4,root);sign(root,'資源循環 · 水務',0,3,d*.35,w*.8);features.push('water-tanks','sorting-depot','solar-roof');break;
   }
   case 'culture':{
    h=wing(root,-w*.15,-d*.2,w*.7,d*.47,3,'#b87f67','arcade');wing(root,w*.3,d*.04,w*.3,d*.32,2,'#d8cbb3','glass');path(root,0,d*.3,w*.85,d*.3);for(const x of [-w*.26,0,w*.26])shape('cyl','#d1c5a4',x,1.2,d*.28,.7,2.4,.7,root);sign(root,'文化 · 城市展演',-w*.12,3.05,d*.06,w*.65);features.push('brick-arcade','exhibition-hall','sculpture-plaza');break;
   }
   case 'medical':{
    h=wing(root,-w*.18,-d*.15,w*.54,d*.66,8,'#d7e1d4','glass');wing(root,w*.28,-d*.12,w*.34,d*.46,4,'#c4d0c7');canopy(root,w*.18,d*.25,w*.48,d*.2,3.6,'#7d9d94');path(root,w*.18,d*.34,w*.48,d*.15);box('#b96e64',-w*.18,h-4,d*.185,2.8,.65,.18,root);box('#b96e64',-w*.18,h-4,d*.19,.65,2.8,.19,root);ramp(root,-w*.27,d*.33,3.3);sign(root,'醫療 · 口腔與照護',0,3.3,d*.15,w*.8);features.push('medical-tower','clinic-entrance','ambulance-bay','accessible-ramp');break;
   }
   case 'flood':{
    h=wing(root,-w*.25,-d*.2,w*.42,d*.5,3,'#c4c9b5','glass');box('#92b4b3',w*.22,.12,0,w*.43,.15,d*.66,root);for(const x of [w*.05,w*.38])box('#c5c7b4',x,.55,0,.4,1.1,d*.7,root);box('#6d8e90',w*.22,1.8,-d*.25,w*.4,3.6,.7,root);for(const x of [-w*.34,-w*.14])shape('cyl','#91aaa2',x,1.4,d*.28,1,2.8,1,root);solar(root,-w*.25,8.25,-d*.2,w*.32,d*.32);sign(root,'水務 · 防汛',0,3,d*.36,w*.75);features.push('pump-house','retention-basin','floodgate','flood-platform');break;
   }
   case 'family':{
    h=wing(root,-w*.22,-d*.22,w*.46,d*.48,4,'#ccb596','balcony');wing(root,w*.25,-d*.23,w*.42,d*.4,2,'#bb896f','gable');playground(root,w*.72,d*.8);ramp(root,-w*.3,d*.2,d*.24);sign(root,'家庭 · 長照與育兒',0,3.1,0,w*.75);features.push('childcare','day-care','accessible-ramp');break;
   }
   case 'enterprise':{
    h=wing(root,-w*.22,-d*.12,w*.47,d*.68,9,'#b2c1bd','glass');wing(root,w*.26,-d*.2,w*.38,d*.43,3,'#b79074','arcade');canopy(root,w*.22,d*.23,w*.45,d*.3,3.1);solar(root,w*.26,8.3,-d*.2,w*.28,d*.3);sign(root,'就業 · 職訓與創業',0,3.1,d*.08,w*.8);features.push('enterprise-office','vocational-workshop','startup-plaza');break;
   }
   case 'community':case 'port':{
    h=wing(root,-w*.1,-d*.22,w*.76,d*.43,3,'#c9b191','arcade');wing(root,-w*.34,d*.1,w*.24,d*.4,2,'#b5806e','gable');path(root,w*.16,d*.2,w*.6,d*.35);canopy(root,w*.24,d*.12,w*.42,d*.2,3.3);for(const x of [-w*.12,w*.12,w*.36])box(['#b48e6e','#93ada1','#c7ae78'][Math.round((x/w+.12)*12)%3]||'#b48e6e',x,.9,d*.25,2,1.4,1.1,root);sign(root,parcel.sceneKind==='port'?'港市 · 旅遊與展演':'地方 · 多元文化',0,3,d*.02,w*.8);features.push(parcel.sceneKind==='port'?'visitor-center':'community-hall','market-stalls','cultural-plaza');break;
   }
   case 'rescue':{
    h=wing(root,-w*.15,-d*.18,w*.65,d*.55,3,'#b58070');h=Math.max(h,wing(root,w*.34,-d*.25,w*.24,d*.3,7,'#c5b9a1','glass'));for(const x of [-w*.3,0]){box('#8a9d9e',x,1.45,d*.1,w*.24,2.7,.12,root);box('#b56558',x,1.1,d*.29,1.8,1.5,3.5,root);}sign(root,'消防 · 應變',0,3.1,d*.11,w*.7);features.push('fire-appliance-bays','watchtower','emergency-center');break;
   }
   case 'urban':{
    h=wing(root,-w*.24,-d*.12,w*.45,d*.64,5,'#d1c4aa','glass');canopy(root,w*.22,-d*.12,w*.4,d*.36,3.2);for(const s of [-1,1])line('#c6a46c',[w*.2+s*.6,0,d*.22],[w*.2+s*.6,11,d*.22],.08,root);line('#c6a46c',[-w*.05,10,d*.22],[w*.43,10,d*.22],.12,root);solar(root,-w*.24,13.6,-d*.12,w*.33,d*.3);planter(root,w*.2,d*.3,3,2);sign(root,'建設 · 城市環境',0,3,d*.03,w*.8);features.push('public-works-center','construction-crane','green-infrastructure');break;
   }
   default:{h=wing(root,-w*.12,-d*.23,w*.72,d*.38,5,'#d8ceb6','glass');wing(root,-w*.3,d*.08,w*.3,d*.3,3,'#ab8b76','arcade');canopy(root,w*.2,d*.06,w*.4,d*.32,4.3);path(root,w*.2,d*.3,w*.4,d*.25);planter(root,-w*.12,d*.32,w*.3,2);sign(root,'市民服務',0,3.2,-d*.03,w*.6);features.push('service-hall','public-plaza','green-roof');}
  }
  art.reserve(parcel.x,parcel.z,w+.8,d+.8);parcel.height=h;parcel.features=features;parcel.anchor=new THREE.Vector3(parcel.x,h+2,parcel.z);return {root,height:h,features};
 }
 let activeRoot=scene;
 const scoped={...art,box:(...a)=>{a[7]||=activeRoot;return box(...a);},shape:(...a)=>{a[8]||=activeRoot;return shape(...a);},line:(...a)=>{a[4]||=activeRoot;return line(...a);},label:(...a)=>{a[8]||=activeRoot;return label(...a);},reserve:()=>{},batch:(g,c,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0)=>{const o=shape(g,c,x,y,z,sx,sy,sz,activeRoot);o.rotation.set(rx,ry,rz);},slab:(m,x,z,w,d,y=.025,h=.05)=>box(m,x,y,z,w,h,d,activeRoot)};
 const towers=createUrbanBuildings(scoped,scene);
 function highrise(parcel,type){const root=new THREE.Group();root.position.set(parcel.x,0,parcel.z);const s=Math.min(parcel.usableW/36,parcel.usableD/32,.65);root.scale.set(s,.72,s);scene.add(root);activeRoot=root;const h=towers[type](0,0)*.72;activeRoot=scene;current=null;art.reserve(parcel.x,parcel.z,parcel.usableW,parcel.usableD);const pick=new THREE.Mesh(new THREE.BoxGeometry(35*s,h,30*s),new THREE.MeshBasicMaterial({visible:false}));pick.position.set(parcel.x,h/2,parcel.z);pick.userData.theme=null;scene.add(pick);picks.push(pick);parcel.height=h;parcel.family=type;records.push({theme:null,x:parcel.x,z:parcel.z,w:32*s,d:28*s,height:h,style:type});return h;}
 function urban(parcel){current=null;const root=new THREE.Group();root.position.set(parcel.x,0,parcel.z);scene.add(root);const w=parcel.usableW,d=parcel.usableD,k=parcel.seed%6;let h;
  if(w>d*1.4){h=wing(root,-w*.28,-d*.13,w*.37,d*.65,5+parcel.seed%5,'#c4ad90','balcony');wing(root,w*.18,-d*.26,w*.48,d*.35,3+parcel.seed%4,'#b27d68','arcade');wing(root,w*.36,d*.18,w*.2,d*.48,7,'#a9babb','glass',.09);}
  else if(d>w*1.4){h=wing(root,-w*.2,-d*.25,w*.5,d*.4,6+parcel.seed%5,'#cfb38e','balcony');wing(root,w*.24,d*.15,w*.44,d*.6,4+parcel.seed%4,'#a9b9ad','glass');box(glass,0,8.4,0,w*.2,2.1,4,root);}
  else if(k===0||k===3){h=wing(root,0,-d*.28,w*.85,d*.3,6,'#c8ad8c','balcony');wing(root,-w*.3,d*.1,w*.26,d*.5,4,'#b0816a','gable');}
  else if(k===1){h=wing(root,-w*.2,-d*.2,w*.53,d*.55,5,'#c1a789','arcade');wing(root,w*.26,d*.18,w*.39,d*.5,8,'#a3b6b3','glass',-.08);}
  else if(k===2){h=wing(root,0,-d*.14,w*.8,d*.65,8,'#aab9ae','balcony');wing(root,w*.15,-d*.2,w*.4,d*.4,4,'#e0ceb0');}
  else{h=wing(root,-w*.25,0,w*.35,d*.88,7,'#b4c5bd','glass');wing(root,w*.2,-d*.23,w*.5,d*.4,4,'#b8876b','gable');}
  path(root,0,d*.34,w*.55,1.6);planter(root,w*.27,d*.28,2.7,1.3);art.reserve(parcel.x+w*.27,parcel.z+d*.28,3.3,1.9);parcel.height=h;parcel.family=['courtyard','arcade','terraces','passage','balcony','mixed'][k];return h;
 }
 return {policy,urban,highrise,picks,records};
}
