import * as THREE from 'three';
// Small, reversible art intervention inside existing parcels; metres match the city kit.
export function craftDistrict(art,scene,p,T,details){
 const g=new THREE.Group();g.name='craft-'+p.id;scene.add(g);
 const {box,shape,line}=art;
 const wall=[T.material('#d9cdb2',T.tile),T.material('#b66f54',T.tile),T.material('#9cbbb5',T.tile)];
 const specs=[];
 function building(x,z,w,d,floors,kind,name){
  const b=new THREE.Group();b.position.set(x,0,z);g.add(b);const h=3.4+floors*2.6;
  // The ground floor is recessed behind a genuinely open covered arcade.
  box(wall[kind],0,1.6,-.8,w,3.2,d-1.6,b);
  box(wall[kind],0,(h+3.2)/2,0,w,h-3.2,d,b);
  box('#dfd6c2',0,.14,0,w+.6,.24,d+.8,b);
  for(let k=0;k<4;k++){const xx=-w*.43+k*w*.286;box('#d6c5a5',xx,1.65,d/2+.7,.25,3.2,.25,b);}
  T.storefront(b,0,d/2-1.55,w-.5,name,['#537b70','#a96a47','#42778a'][kind]);
  for(let side=0;side<4;side++){
   const face=new THREE.Group(),width=side%2?d:w;face.rotation.y=side*Math.PI/2;
   face.position.set(side===1?w/2:side===3?-w/2:0,0,side===0?d/2:side===2?-d/2:0);b.add(face);
   const cols=Math.max(2,Math.floor(width/2.9));
   for(let f=0;f<floors;f++)for(let j=0;j<cols;j++){
    const xx=-width/2+(j+.5)*width/cols,yy=4.65+f*2.6;
    T.windowBay(xx,yy,.06,kind===2?1.8:1.5,1.75,face,side===0&&kind!==1);
    if(kind===1){box('#e5cba5',xx,yy+1.02,.17,2,.16,.35,face);}
    if(kind===2&&side%2===0){for(let k=0;k<3;k++)box('#c6d1bf',xx-.8+k*.23,yy,.33,.06,2,.32,face);}
   }
   if(kind===1)for(let f=0;f<=floors;f++)box('#dbc7a6',0,3.3+f*2.6,.13,width,.12,.24,face);
  }
  T.roofGarden(b,w,d,h);
  if(kind===0){box(wall[0],-w*.12,h+1.8,-d*.1,w*.65,3.3,d*.55,b);T.roofGarden(b,w*.65,d*.55,h+3.45);}
  if(kind===1){for(const xx of [-w*.45,w*.45])box('#e5cfad',xx,h+.6,d*.46,.45,1.1,.5,b);}
  if(kind===2){for(let k=0;k<7;k++)box('#9d805d',0,h+2,-d*.16+k*.4,w*.7,.12,.12,b);for(const xx of [-w*.3,w*.3])box('#8c765b',xx,h+1,-d*.1,.12,2,.12,b);}
  // Rear service door, downpipe and roof access read correctly when rotated.
  box(T.darkGlass,0,1.3,-d/2-.07,1.2,2.4,.12,b);
  line('#92958a',[-w*.46,.3,-d/2-.12],[-w*.46,h,-d/2-.12],.045,b);
  specs.push({name,kind,height:h+4});return b;
 }
 if(p.kind==='policy'){
  // Long narrow housing parcel: three different silhouettes along the street.
  building(0,-22,11,14,6,0,'日常書屋').rotation.y=Math.PI/2;
  building(0,0,15,12,3,1,'巷口咖啡').rotation.y=Math.PI/2;
  building(0,23,13,13,4,2,'街角花房').rotation.y=Math.PI/2;
 }else{
  building(-12,0,11,9,2,1,'臺北茶行');building(1,0,10,10,4,0,'城市書店');building(13,0,10,8,3,2,'日常食堂');
 }
 // Textured paving and a continuous tactile route, never touching the road asphalt.
 const W=p.kind==='policy'?17:41,D=p.kind==='policy'?66:16;
 box(T.pavement,0,.03,0,W,.12,D,g);
 if(p.kind==='policy')for(let z=-29;z<31;z+=.7)box('#c7ae71',7.5,.115,z,.45,.025,.6,g);
 else for(let x=-19;x<20;x+=.7)box('#c7ae71',x,.115,6.6,.6,.025,.45,g);
 for(let i=0;i<6;i++){
  const x=p.kind==='policy'?-6.9:-18+i*7,z=p.kind==='policy'?-29+i*11:6;
  T.planter(x,.27,z,1.4,1.2,g);
  line('#826d4e',[x,.4,z],[x,2.5,z],.09,g);
  for(let q=0;q<5;q++)shape('leaf',['#6b8a51','#87a066','#4c7457'][q%3],x+Math.sin(q*2.4)*.4,2.5+(q%2)*.4,z+Math.cos(q*2.4)*.4,.65,.8,.65,g);
 }
 // Benches, bike stands, bollards and bins remain inside each parcel.
 for(let i=0;i<3;i++){
  const x=p.kind==='policy'?5.8:-15+i*14,z=p.kind==='policy'?-12+i*21:5.5;
  box('#9d7954',x,.6,z,1.5,.15,.55,g);for(const dx of [-.55,.55])box('#566761',x+dx,.3,z,.1,.5,.45,g);
  shape('cyl','#576c65',x+1.1,.45,z,.2,.8,.2,g);
 }
 g.updateMatrixWorld(true);let bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(new THREE.Vector3()),mid=bounds.getCenter(new THREE.Vector3());
 const sc=Math.min(1,(p.usableW-1)/size.x,(p.usableD-1)/size.z);g.scale.set(sc,1,sc);g.position.set(p.x-mid.x*sc,0,p.z-mid.z*sc);g.updateMatrixWorld(true);bounds.setFromObject(g);size=bounds.getSize(new THREE.Vector3());
 art.reserve(p.x,p.z,size.x+.5,size.z+.5);
 const record={id:p.id,kind:'craft-study',x:p.x,z:p.z,height:bounds.max.y,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},site:{x:p.x,z:p.z,w:p.usableW,d:p.usableD},buildings:specs};details.records.push(record);
 if(p.kind==='policy'){
  p.height=bounds.max.y;p.anchor=new THREE.Vector3(p.x,p.height+2,p.z);p.features=['騎樓住宅','紅磚街屋','綠意退台','屋頂花園'];
  const pick=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),new THREE.MeshBasicMaterial({visible:false}));pick.position.copy(bounds.getCenter(new THREE.Vector3()));pick.userData.theme=p.id;scene.add(pick);details.picks.push(pick);
 }
 return record;
}
