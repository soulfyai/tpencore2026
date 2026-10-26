import * as THREE from 'three';

// Place the reviewed street models inside existing parcels, without moving roads,
// coastlines or policy IDs. Dimensions include balconies, arcades and furniture.
export function createDetailStreetElements(art,scene,T){
 const records=[],sites=[],furniture={seating:0,bicycleStands:0,planters:0,pergolas:0,flowerBeds:0,entrances:0},picks=[];
 const {box,shape,line,mat}=art;
 const tones=['#d8ae8b','#b2c4ac','#dbcdb1','#bf8a70','#b6c9c3','#cfb995'];
 const shops=[['湖畔書屋','#527e7c'],['日常麵包','#ae6d4e'],['轉角咖啡','#507d70'],['生活藥局','#697d5c'],['安可小食','#a0614e'],['散步茶屋','#668b7b']];
 function record(p,kind,x,z,w,d,height){const r={parcel:p.id,kind,x,z,w,d,height};records.push(r);return r;}
 function fit(root,p,padding=1.5){root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());
  const scale=Math.min((p.usableW-padding*2)/s.x,(p.usableD-padding*2)/s.z,1.8);root.scale.set(scale,Math.min(1.3,Math.sqrt(scale)),scale);root.position.set(p.x-c.x*scale,0,p.z-c.z*scale);root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);p.height=box.max.y;p.anchor=new THREE.Vector3(p.x,p.height+2,p.z);art.reserve(p.x,p.z,s.x*scale+1,s.z*scale+1);return box;
 }
 function policy(p){let root,features;
  const originalReserve=art.reserve;art.reserve=()=>{};
  try{if(p.sceneKind==='childcare'){root=T.childcare();features=['childcare','wood-louvers','accessible-ramp','playground','roof-garden'];}
  else if(p.sceneKind==='research'){root=T.office();features=['research','curtain-wall','vertical-fins','planted-terrace'];}
  else if(p.sceneKind==='housing'){root=new THREE.Group();scene.add(root);for(const [i,x]of [-6,6].entries()){const g=T.apartment({name:'社區住宅與騎樓',x,z:0,w:9,d:10,floors:5+i*3,tone:tones[i],rotation:i?Math.PI:0,shops:[shops[2+i]]});root.add(g);}features=['mixed-housing','arcade','balconies','roof-garden'];}
  else return false;
  }finally{art.reserve=originalReserve;}
  const b=fit(root,p),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());p.features=features;
  const pick=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),new THREE.MeshBasicMaterial({visible:false}));pick.position.copy(center);pick.userData.theme=p.id;scene.add(pick);picks.push(pick);
  record(p,'detailed-'+p.sceneKind,p.x,p.z,size.x,size.z,p.height);return true;
 }
 function furnishings(x,z,angle,w,seed){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);art.reserve(x,z,Math.abs(Math.cos(angle))*(w+1)+Math.abs(Math.sin(angle))*3,Math.abs(Math.sin(angle))*(w+1)+Math.abs(Math.cos(angle))*3);
  // Tables and chairs stay within the arcade setback, never on the carriageway.
  if(w>=9){shape('cyl','#d7c6a1',0,.95,0,.47,.08,.47,g);line('#6d7c6c',[0,.3,0],[0,.9,0],.04,g);
   for(const side of [-1,1]){box('#8a9b82',side*.8,.6,0,.5,.07,.5,g);box('#8a9b82',side*1,.9,0,.07,.6,.5,g);for(const zz of [-.18,.18])line('#667c70',[side*.8,.2,zz],[side*.8,.6,zz],.025,g);}furniture.seating++;
  }
  T.planter(-w*.33,.2,0,1.1,.6,g);T.planter(w*.33,.2,0,1.1,.6,g);furniture.planters+=2;
  if(seed%3===0){for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.4,.035,6,20),mat('#7c9188',.5,.3));ring.position.set(w*.35+i*.65,.6,-1.1);ring.rotation.y=Math.PI/2;g.add(ring);}furniture.bicycleStands++;}
 }
 function approach(p,s){const dx=Math.round(Math.sin(s.rotation)),dz=Math.round(Math.cos(s.rotation)),start={x:s.x+dx*(s.d/2+1),z:s.z+dz*(s.d/2+1)},end={x:dx?p.x+dx*(p.usableW/2+.15):start.x,z:dz?p.z+dz*(p.usableD/2+.15):start.z};
 const length=Math.abs(end.x-start.x)+Math.abs(end.z-start.z);if(length<.2)return;
 const x=(start.x+end.x)/2,z=(start.z+end.z)/2,w=dx?length:s.w+.8,d=dz?length:s.w+.8;
 // Forecourts meet the existing sidewalk from below, with no coplanar overlap.
 const path=box(T.pavement,x,.10,z,w,.12,d);path.castShadow=false;art.reserve(x,z,w+.3,d+.3);furniture.entrances++;
 }
 function urban(p){const seed=p.seed>>>0,W=p.usableW,D=p.usableD;let specs;
  // Use long strips, L-shaped groups and opposed rows according to the actual site.
  if(W>D*1.35){const n=W>32?3:2,w=Math.min(14,(W-4-(n-1)*3)/n-3),d=Math.min(11,D-8);specs=Array.from({length:n},(_,i)=>({x:p.x+(i-(n-1)/2)*(w+6),z:p.z-1.5,w,d,rotation:0}));}
  else if(D>W*1.35){const n=D>35?3:2,slot=(D-4-(n-1)*3)/n,w=Math.min(14,slot-3),d=Math.min(11,W-8);specs=Array.from({length:n},(_,i)=>({x:p.x-1.4,z:p.z+(i-(n-1)/2)*(slot+3),w,d,rotation:Math.PI/2}));}
  else{const w=Math.min(14,W*.44-3),d=Math.min(11,D-8);specs=[{x:p.x-W*.23,z:p.z-1.4,w,d,rotation:0},{x:p.x+W*.23,z:p.z+1.2,w,d,rotation:Math.PI}];}
  // Very narrow parcels retain a single complete street house rather than cropped wings.
  if(specs.some(s=>s.w<5.5||s.d<5)){specs=[{x:p.x,z:p.z-1.5,w:Math.max(5.5,Math.min(14,W-5)),d:Math.max(5,Math.min(11,D-8)),rotation:0}];}
  let highest=0;
  for(const [i,s]of specs.entries()){
   // Rotated buildings use width along the street and include the arcade in depth.
   const floors=3+(seed+i*3)%6,tone=tones[(seed+i)%tones.length],shop=shops[(seed+i)%shops.length];
   const root=T.apartment({name:['赤陶街角住宅','青綠退台住宅','米白窄塔住宅','老街紅磚樓'][(seed+i)%4],...s,floors,tone,shops:[shop,shops[(seed+i+1)%shops.length]]});
   root.name='detail-street-'+p.id+'-'+i;
   if((seed+i)%4===0){const pent=new THREE.Group();root.add(pent);box(T.material('#e3c4a3',T.tile),0,4.1+floors*2.65,0,s.w*.65,2.5,s.d*.6,pent);T.roofGarden(pent,s.w*.65,s.d*.6,5.5+floors*2.65);}
   root.updateMatrixWorld(true);let bounds=new THREE.Box3().setFromObject(root);const extent=bounds.getSize(new THREE.Vector3());
   const slotW=specs.length>1&&s.rotation===0?W/specs.length-3:W-2,slotD=specs.length>1&&s.rotation===Math.PI/2?D/specs.length-3:D-2;
   const fitScale=Math.min(1,slotW/extent.x,slotD/extent.z);root.scale.set(fitScale,1,fitScale);
   root.updateMatrixWorld(true);bounds.setFromObject(root);const mid=bounds.getCenter(new THREE.Vector3());root.position.x+=s.x-mid.x;root.position.z+=s.z-mid.z;
   s.x=root.position.x;s.z=root.position.z;s.w*=fitScale;s.d*=fitScale;
   root.updateMatrixWorld(true);bounds.setFromObject(root);
   const h=bounds.max.y;highest=Math.max(highest,h);const recordItem=record(p,'arcade-house',s.x,s.z,s.w,s.d,h);recordItem.bounds={min:bounds.min.toArray(),max:bounds.max.toArray()};recordItem.site={x:p.x,z:p.z,w:W,d:D};
   const front=new THREE.Vector3(0,0,s.d/2+1.55).applyAxisAngle(new THREE.Vector3(0,1,0),s.rotation);
   furnishings(s.x+front.x,s.z+front.z,s.rotation,s.w,seed+i);approach(p,s);
   sites.push({city:null,parcel:p.id,x:s.x,z:s.z,w:s.w,d:s.d,height:h,rotation:s.rotation});
  }
  p.height=highest;p.family='detailed-street-group';return highest;
 }
 function highriseFront(p){const s=Math.min(p.usableW/36,p.usableD/32,.65),w=30*s,z=p.z+15*s+.14;
  const root=new THREE.Group();root.position.set(p.x,0,z);scene.add(root);T.storefront(root,-w*.24,0,w*.44,'街角生活','#527e7c');T.storefront(root,w*.24,0,w*.44,'日常咖啡','#ae6d4e');furnishings(p.x,z+1.3,0,w,p.seed);
 }
 function parks(ponds){for(const p of ponds){const x=p.x+p.usableW*.38,z=p.z+p.usableD*.36;
   if(!art.clearAt(x,z,2.5))continue;
   art.bench(x,z,0);art.reserve(x,z,5,3);furniture.seating++;
   if(p.usableW>25){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);for(const a of [-2,2])for(const b of [-1,1])box('#a98e64',a,1.65,b,.18,3,.18,g);for(let i=0;i<9;i++)box('#b8a078',-2.4+i*.6,3.15,0,.12,.18,3.1,g);furniture.pergolas++;}
   T.planter(x,.15,z+2.2,3,1);art.reserve(x,z+2.2,4,2);furniture.flowerBeds++;
   for(let i=0;i<14;i++){const xx=x-1.2+i*.18,zz=z+2.2;art.batch('cyl','#798e53',xx,.55,zz,.012,.3,.012);for(let j=0;j<4;j++){const a=j*Math.PI/2;art.batch('sphere',i%3?'#e4c586':'#c5969d',xx+Math.cos(a)*.065,.72,zz+Math.sin(a)*.065,.055,.035,.055);}}
  }}
 return {records,sites,furniture,picks,policy,urban,highriseFront,parks,source:'taipei-detail.html?view=street&v=1'};
}
