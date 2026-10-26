import * as THREE from 'three';
import {createDetailStreetElements} from './detail-street-elements-v044.js';
import {selectBuilding,buildingAudit,BUILDING_TYPES} from './architecture-v041-catalog.js';
export {buildingAudit,BUILDING_TYPES};
const PALETTES=[['#cf946e','#456f72','#e0c79f'],['#b6c2a0','#658481','#e5d8ba'],['#dbc9aa','#638d9c','#a66b4c'],['#b56e57','#ded0ad','#476b75'],['#b1c6c1','#607b8b','#bd8e5d'],['#ddbd7e','#6f8e74','#d8dac9'],['#c89783','#5a827b','#eedbb6'],['#8faca4','#deb47c','#4d6f83']];
function roofGeometry(kind){const p=new THREE.Shape();if(kind==='barrel'){p.moveTo(-.5,-.5);p.lineTo(.5,-.5);p.absellipse(0,-.5,.5,1,0,Math.PI,false);}else if(kind==='gable'){p.moveTo(-.5,-.5);p.lineTo(.5,-.5);p.lineTo(0,.5);}else{p.moveTo(-.5,-.5);p.lineTo(.5,-.5);p.lineTo(.5,.5);}p.closePath();return new THREE.ExtrudeGeometry(p,{depth:1,bevelEnabled:false,curveSegments:20}).translate(0,0,-.5);}
export function createVariedStreetElements(art,scene,T,city){
 const base=createDetailStreetElements(art,scene,T),{records,sites,furniture}=base,{box,shape,line,mat}=art;
 const glass=T.glass,dark=T.darkGlass,materials=new Map();
 const roofMaterials=new Map();const roofMat=color=>{if(!roofMaterials.has(color))roofMaterials.set(color,T.material(color,T.roofTile));return roofMaterials.get(color);};
 const wall=(color,brick=false)=>{const k=color+'/'+brick;if(!materials.has(k))materials.set(k,T.material(color,brick?art.brick.map:T.tile));return materials.get(k);};
 for(const [key,g]of Object.entries({box:art.geo.box,cyl:new THREE.CylinderGeometry(.5,.5,1,28),oct:new THREE.CylinderGeometry(.5,.5,1,8),gable:roofGeometry('gable'),barrel:roofGeometry('barrel'),wedge:roofGeometry('wedge'),pyramid:new THREE.ConeGeometry(.707,1,4).rotateY(Math.PI/4),dome:new THREE.SphereGeometry(.5,24,14,0,Math.PI*2,0,Math.PI/2).scale(1,2,1).translate(0,-.5,0)}))art.geo['v041-'+key]=g;
 const arch=new THREE.Shape();arch.moveTo(-.5,-.5);arch.lineTo(.5,-.5);arch.lineTo(.5,.1);arch.absellipse(0,.1,.5,.4,0,Math.PI,false);arch.closePath();const archGeo=new THREE.ShapeGeometry(arch);archGeo.computeVertexNormals();art.geo['v041-window-arch']=archGeo;
 function window(parent,x,y,w,h,arched=false,balcony=false){if(arched){shape('v041-window-arch','#e5d5b2',x,y,.12,w+.24,h+.24,1,parent);shape('v041-window-arch',dark,x,y-.02,.15,w,h,1,parent);box('#d7c39e',x,y-h*.48,.2,w+.35,.15,.36,parent);box('#c7bfa8',x,y,.22,.07,h,.1,parent);}else T.windowBay(x,y,.10,w,h,parent,balcony);}
 function elevation(parent,w,h,style,seed){const low=['industrial','loft','arches','brick','timber','gallery','colonnade','dome'].includes(style),floor=low?3.1:2.85,rows=Math.max(1,Math.floor(h/floor)),cols=Math.max(1,Math.min(6,Math.floor(w/2.55)));
  if(['curtain','ribbon','atrium','fins','diagonal'].includes(style)){
   box(glass,0,h*.50,.12,w*.94,h*.92,.10,parent);
   for(let f=1;f<rows;f++)box('#d6d3bd',0,f*h/rows,.23,w,.09,.22,parent);
   for(let j=0;j<=cols;j++)box(style==='fins'?'#c39869':'#acbcaf',-w/2+j*w/cols,h/2,.27,.09,h,style==='fins'?.65:.23,parent);
   if(style==='diagonal')for(let k=0;k<2;k++)line('#dfd9bd',[-w*.47,k*h/2,.32],[w*.47,(k+1)*h/2,.32],.065,parent);
  }else if(style==='horizontal'){
   for(let f=0;f<rows;f++){const y=f*h/rows+h/rows*.53;box(glass,0,y,.13,w*.91,h/rows*.72,.12,parent);box('#e4d7b9',0,f*h/rows+.12,.60,w+.45,.15,1.35,parent);T.rail(0,f*h/rows+.2,1.12,w+.2,parent);if(f%2===0)T.planter(w*.23,f*h/rows+.39,.74,w*.25,.4,parent);}
  }else for(let f=0;f<rows;f++)for(let j=0;j<cols;j++){const x=-w/2+(j+.5)*w/cols,y=(f+.52)*h/rows,ww=Math.min(1.65,w/cols*.66),hh=Math.min(low?2.25:1.9,h/rows*.72);const arched=['arches','loft','brick','dome','arcade'].includes(style);
    window(parent,x,y,ww,hh,arched,['balcony','terrace','bay'].includes(style)&&f>0&&(j+f+seed)%3!==0);
    if(style==='bay'&&(j+f)%2===0){box('#d8cfb5',x,y+hh*.54,.55,ww+.2,.10,1.1,parent);box('#b5b79f',x-ww*.55,y,.45,.12,hh,1,parent);}
   }
  if(style==='deco')for(let j=0;j<=cols;j++)box('#e5c895',-w/2+j*w/cols,h/2,.37,.11,h,.36,parent);
  if(style==='timber')for(let f=1;f<=rows;f++)box('#7d5c42',0,f*h/rows,.29,w,.12,.16,parent);
  if(style==='colonnade')for(let j=0;j<=cols;j++)shape('cyl','#e5d6b6',-w*.48+j*w*.96/cols,1.7,.84,.14,3.3,.14,parent);
 }
 function massFacade(g,m,w,d,h,style,seed){if(m.g==='barrel'){for(let zi=0;zi<=5;zi++){const z=-d/2+zi*d/5;for(let j=0;j<16;j++){const a=j*Math.PI/16,b=(j+1)*Math.PI/16;line('#bfd0c5',[Math.cos(a)*w*.505,-h/2+Math.sin(a)*h*1.005,z],[Math.cos(b)*w*.505,-h/2+Math.sin(b)*h*1.005,z],.045,g);}}}
  if(m.g==='box'){for(const [x,z,a,span]of [[0,d/2,0,w],[w/2,0,Math.PI/2,d],[0,-d/2,Math.PI,w],[-w/2,0,-Math.PI/2,d]]){if(span<2||h<2.5)continue;const face=new THREE.Group();face.position.set(x,-h/2,z);face.rotation.y=a;g.add(face);elevation(face,span,h,style,seed);}}
  else if(['cyl','oct'].includes(m.g)&&h>3){const n=m.g==='oct'?8:16;for(let j=0;j<n;j++){const a=j*Math.PI*2/n,face=new THREE.Group();face.position.set(Math.sin(a)*w/2,-h/2,Math.cos(a)*d/2);face.rotation.y=a;g.add(face);elevation(face,Math.min(w,d)*Math.PI/n*.85,h,style==='round'?'ribbon':style,seed);}
   if(style==='round')for(let f=0;f<=Math.floor(h/2.85);f++){const y=-h/2+f*2.85;shape('v041-cyl','#e3d8bd',0,y,0,w+.65,.16,d+.65,g);}}
 }
 function roofExtras(g,m,w,d,h,style,seed){if(m.g!=='box'||w<4||d<3)return;
  if(['terrace','balcony','box','bay'].includes(style)){T.roofGarden(g,w*.86,d*.86,h/2);}
  else if(['industrial','loft','brick','timber','dome','arches','gallery'].includes(style))return;
  else{box('#cfccb8',0,h/2+.14,0,w+.2,.25,d+.2,g);for(let i=0;i<3;i++){const o=box(mat('#315c70',.3,.4),-w*.27+i*w*.23,h/2+.42,-d*.17,w*.17,.08,1.4,g);o.rotation.x=-.18;}shape('v041-cyl','#99a79d',w*.25,h/2+.75,d*.15,.75,1.3,.75,g);}
 }
 function build(id,p,s,index){const selected=selectBuilding(id,city,s.x,s.z),seed=(p.seed+index*113)>>>0,palette=PALETTES[(selected.type+selected.variant)%PALETTES.length],W=s.w,D=s.d,H=Math.min(31,Math.max(8,(14+(seed%4)*2.5)*selected.heightFactor),Math.max(W,D)*2.05);
  const root=new THREE.Group();root.name='varied-street-'+id;scene.add(root);
  for(const m of selected.masses){const g=new THREE.Group();g.position.set(m.x*W,(m.y+m.h/2)*H,m.z*D);g.rotation.y=m.rot;root.add(g);const w=m.w*W,d=m.d*D,h=m.h*H,roof=['gable','wedge','pyramid','dome'].includes(m.g),isGlass=m.g==='barrel'||(m.g==='cyl'&&selected.style==='round');
   shape('v041-'+m.g,roof?(m.g==='gable'?roofMat(palette[2]):mat(palette[2])):isGlass?glass:wall(palette[0],['brick','arches','loft','industrial'].includes(selected.style)),0,0,0,w,h,d,g);massFacade(g,m,w,d,h,selected.style,seed);roofExtras(g,m,w,d,h,selected.style,seed);
  }
  // Distinct ground-floor uses and entrances are part of each actual model.
  const front=selected.masses.filter(m=>m.g==='box'&&m.y===0&&m.w*W>4).sort((a,b)=>(b.z+b.d/2)-(a.z+a.d/2))[0];
  const uses=['庭院咖啡','轉角旅舍','花園生活','日常市場','街區圖書館','城市商館','生活雜貨','麵包工房','共享辦公','手作工坊','社區會館','文化小劇場','中庭旅舍','街角選物','生活藥局','轉角商店','創作工房','街區藝廊','閱讀學苑','共居空間','公共展館','散步商廊','合院茶屋','綠能辦公'];
  if(front&&W>6&&!['loft','industrial','brick','arches','dome','colonnade'].includes(selected.style)){T.storefront(root,front.x*W,front.z*D+front.d*D/2+.15,Math.min(front.w*W*.85,W*.67),uses[selected.type],palette[1]);furniture.entrances++;}
  if(selected.key==='clock-civic'){const tower=selected.masses[1],cy=(tower.y+tower.h*.65)*H,cz=(tower.z+tower.d/2)*D;for(const side of [0,Math.PI]){const face=new THREE.Group();face.position.set(tower.x*W,cy,cz+.06);face.rotation.y=side;root.add(face);const c=new THREE.Mesh(new THREE.CircleGeometry(.65,24),mat('#efe6ce'));face.add(c);line('#5b7068',[0,0,.03],[0,.44,.03],.035,face);line('#5b7068',[0,0,.03],[.30,-.14,.03],.03,face);}}
  if(['courtyard','brick-court','colonnade-reading'].includes(selected.key)){T.planter(0,.22,D*.06,W*.30,D*.24,root);furniture.planters++;}
  if(selected.key==='butterfly-gallery'){shape('sphere','#bd9778',0,1.3,D*.30,.65,1.1,.65,root);box('#d1c8ad',0,.25,D*.30,1.7,.45,1.7,root);}
  // Seating, planting and entry paving stay inside the reserved slot.
  const frontZ=D*.55+1.5;box(T.pavement,0,.10,frontZ,W*.91,.12,2.4,root);
  box('#a78b65',-W*.25,.52,frontZ,2,.14,.60,root);box('#a78b65',-W*.25,.90,frontZ-.26,2,.75,.12,root);for(const x of [-W*.25-.75,-W*.25+.75])box('#6f8173',x,.28,frontZ,.10,.48,.47,root);furniture.seating++;
  T.planter(W*.28,.24,frontZ,1.25,.7,root);furniture.planters++;furniture.entrances++;
  root.rotation.y=s.rotation;root.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(root),size=b.getSize(new THREE.Vector3()),mid=b.getCenter(new THREE.Vector3());const scale=Math.min(1,(s.slotW-1)/size.x,(s.slotD-1)/size.z);root.scale.set(scale,1,scale);root.position.set(s.x-mid.x*scale,0,s.z-mid.z*scale);root.updateMatrixWorld(true);b.setFromObject(root);size=b.getSize(new THREE.Vector3());
  art.reserve(s.x,s.z,size.x+1,size.z+1);const r={id,parcel:p.id,city,kind:'varied-street',type:selected.type,typeName:selected.name,style:selected.key,variant:selected.variant,signature:selected.signature,x:s.x,z:s.z,w:size.x,d:size.z,height:b.max.y,rotation:s.rotation,bounds:{min:b.min.toArray(),max:b.max.toArray()},site:{x:p.x,z:p.z,w:p.usableW,d:p.usableD},slot:{x:s.x,z:s.z,w:s.slotW,d:s.slotD}};records.push(r);sites.push({...r});return r;
 }
 function urban(p){const W=p.usableW,D=p.usableD,seed=p.seed>>>0;let specs;
  if(W>D*1.35){const n=W>34?3:2,slot=W/n;specs=Array.from({length:n},(_,i)=>({x:p.x+(i-(n-1)/2)*slot,z:p.z+(i%2?1.1:-1.1),w:Math.min(16,slot-3.5),d:Math.min(13,D-7),rotation:0,slotW:slot-1.5,slotD:D-2.5}));}
  else if(D>W*1.35){const n=D>34?3:2,slot=D/n;specs=Array.from({length:n},(_,i)=>({x:p.x+(i%2?1:-1),z:p.z+(i-(n-1)/2)*slot,w:Math.min(16,slot-3.5),d:Math.min(13,W-7),rotation:Math.PI/2,slotW:W-2.5,slotD:slot-1.5}));}
  else{const n=W>24?2:1,slot=W/n;specs=Array.from({length:n},(_,i)=>({x:p.x+(i-(n-1)/2)*slot,z:p.z+(n>1?(i?1:-1):0),w:Math.min(17,slot-3.5),d:Math.min(14,D-7),rotation:i%2?Math.PI:0,slotW:slot-1.5,slotD:D-2.5}));}
  if(specs.some(s=>s.w<5.5||s.d<5))specs=[{x:p.x,z:p.z,w:Math.max(5,Math.min(17,W-4)),d:Math.max(5,Math.min(14,D-7)),rotation:0,slotW:W-2,slotD:D-2}];
  const made=specs.map((s,i)=>build(p.id+'-'+i,p,s,i));p.height=Math.max(...made.map(r=>r.height));p.family='varied-street';return p.height;
 }
 return {...base,urban,source:'v0.4.1 architecture-only variation',audit:buildingAudit};
}
