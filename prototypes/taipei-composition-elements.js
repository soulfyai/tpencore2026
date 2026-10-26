import * as THREE from 'three';
export const COMPOSITION_HOUSING=[[-35,-48,7,7,5],[-22,-49,7,7,7],[-9,-50,7,7,4],[18,-49,7,7,5],[33,-49,7,7,6],[-54,-31,8,8,4],[-32,-30,8,8,4],[-55,-7,8,8,3],[-35,-3,8,8,4],[-8,-6,8,8,3],[3,-6,7,7,4],[46,-24,8,8,5],[56,-13,6,7,3],[47,-12,6,7,2],[36,33,8,8,3],[50,30,7,8,2],[-33,49,6,5,2],[-58,-19,6,6,3],[-43,-46.5,5,4,2],[48,-42,7,5,2],[59,1,6,6,3],[56,21,6,6,2],[44,39,6,6,2]];
export const COMPOSITION_COAST=[[-69,0,-13],[-58,0,-42],[-29,0,-57],[7,0,-59],[45,0,-53],[64,0,-29],[67,0,7],[56,0,35],[35,0,54],[0,0,62],[-34,0,59],[-58,0,45],[-70,0,17]];

// A deliberately planned scene inventory. Each required reference element has a
// named object and review camera; none is substituted by a background image.
export function buildCompositionElements(art,scene,{apartment,group,paving,glass,windowBay,sign}){
 const {box,line,shape,mat,texture}=art,inventory=[],boats=[];
 function record(id,name,x,z,r,root){root.name=id;inventory.push({id,name,x,z,r,root});return root;}
 const civic=record('school-track','校園與完整跑道',-43,29,18,group(-43,29));
 art.reserve(-43,27,38,29);
 const fieldMap=texture(2048,(g,s)=>{g.fillStyle='#80a65c';g.fillRect(0,0,s,s);
  for(let i=0;i<12;i++){g.fillStyle=i%2?'#85ab61':'#79a057';g.fillRect(s*.2+i*s*.05,s*.25,s*.05,s*.5);}
  const ellipse=(rx,ry)=>{g.beginPath();g.ellipse(s*.5,s*.5,s*rx,s*ry,0,0,Math.PI*2);};
  g.fillStyle='#bd795c';ellipse(.49,.48);g.fill();g.fillStyle='#739f5b';ellipse(.36,.32);g.fill();
  g.strokeStyle='#f0e8cf';g.lineWidth=3;for(let i=0;i<6;i++){ellipse(.38+i*.02,.34+i*.023);g.stroke();}
  g.lineWidth=4;g.strokeRect(s*.23,s*.29,s*.54,s*.42);g.beginPath();g.moveTo(s*.5,s*.29);g.lineTo(s*.5,s*.71);g.stroke();g.beginPath();g.ellipse(s*.5,s*.5,s*.07,s*.11,0,0,Math.PI*2);g.stroke();g.strokeRect(s*.23,s*.4,s*.08,s*.2);g.strokeRect(s*.69,s*.4,s*.08,s*.2);
 });
 const field=new THREE.Mesh(new THREE.PlaneGeometry(32,21),new THREE.MeshStandardMaterial({map:fieldMap,roughness:1}));field.rotation.x=-Math.PI/2;field.position.y=.14;field.receiveShadow=true;civic.add(field);
 for(const x of [-8.7,8.7]){box('#f5eedb',x,.65,0,.08,1.1,2.9,civic);box('#f5eedb',x+Math.sign(x)*.65,.65,-1.4,1.3,1.1,.06,civic);box('#f5eedb',x+Math.sign(x)*.65,.65,1.4,1.3,1.1,.06,civic);}
 const school=group(-43,16);box('#e0c9a1',0,3.3,0,28,6.4,3.8,school);box('#decfb1',0,6.7,0,28.8,.35,4.4,school);
 for(let f=0;f<2;f++)for(let j=0;j<10;j++)windowBay(-12+j*2.65,1.8+f*2.8,1.98,1.6,1.65,school);
 sign('臺北・校園與運動',0,3.6,2.3,8,.65,'#e9dcba','#547c6b',school);
 for(let j=0;j<4;j++)box('#c6c3af',0,.45+j*.38,11.5+j*.45,24,.35,.8,civic);
 for(const x of [-16,16])for(const z of [-11,11]){line('#8a9d91',[x,.2,z],[x,8,z],.07,civic);box('#e5dfbe',x,8,z,1.8,.5,.3,civic);}
 inventory.push({id:'school-building',name:'校舍與看台',x:-43,z:16,r:15,root:school});

 const bridge=record('lake-bridge','跨湖拱橋',10,31,17,group(10,31));art.reserve(10,31,35,5);
 for(let i=0;i<65;i++){const x=-16+i*.5,y=.38+Math.sin((x+16)/32*Math.PI)*1.3;box('#b59a72',x,y,0,.48,.18,2.8,bridge);}
 for(const side of [-1,1]){
  const pts=[];for(let i=0;i<=32;i++){const x=-16+i,deck=.38+Math.sin(i/32*Math.PI)*1.3;pts.push(new THREE.Vector3(x,deck+1,side*1.25));if(i%2===0)line('#8c9e8d',[x,deck,side*1.25],[x,deck+1,side*1.25],.045,bridge);}
  const tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),70,.055,6,false),mat('#8c9e8d'));bridge.add(tube);
 }
 const care=record('care-center','社區照護與醫療',39,21.5,7,group(39,21.5));art.reserve(39,21.5,14,14);
 box('#e1e1cb',0,5,0,11,9.8,9,care);box('#c6d0c0',0,10,0,11.5,.35,9.5,care);
 for(let f=0;f<3;f++)for(let j=0;j<4;j++)windowBay(-3.9+j*2.6,1.7+f*2.8,4.56,1.6,1.8,care);
 box('#dfd9bd',0,10.8,0,6,1.3,5,care);box('#c77a64',0,12.2,0,.6,1.7,.16,care);box('#c77a64',0,12.2,0,1.7,.6,.16,care);sign('社區照護',0,3.35,4.8,5,.6,'#ecedd9','#547d7b',care);
 const housing=COMPOSITION_HOUSING;
 const tones=['#ccb093','#c6c9b0','#c2d0c1','#d6c7a8','#c6a08d','#b6c9c3'];
 housing.forEach(([x,z,w,d,floors],i)=>{apartment({name:`生活街區${i+1}`,x,z,w,d,floors,tone:tones[i%tones.length],rotation:i%7===0?Math.PI/2:0,shops:i%4===0?[['街角日常','#668b7b']]:[]});});
 inventory.push({id:'mixed-neighbourhoods',name:'高低混合生活街區',x:-20,z:-8,r:25,root:null,count:housing.length});

 // A small harbour has a landward approach and piers extending out over sea.
 const harbour=record('harbour','碼頭與客運停靠區',-51,51,10,group(-51,51));art.reserve(-51,49,15,17);
 paving(-51,46,12,6);for(let i=0;i<45;i++)box(i%3?'#aa9370':'#b9a581',0,.18,i*.43,7,.2,.4,harbour);
 for(const x of [-3.1,3.1])for(let z=0;z<19;z+=4){shape('cyl','#8f8972',x,-.2,z,.14,1.3,.14,harbour);box('#e6d7ae',x,.55,z,.3,.2,.3,harbour);}
 box('#d9ceb5',0,1.7,-2.5,6,3,3.8,harbour);box('#6e9895',0,3.35,-2.5,6.5,.25,4.3,harbour);sign('城市水岸',0,2.2,-.55,4.6,.6,'#e8dfc5','#4c777b',harbour);
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
 passenger('passenger-berthed',-57,62,0,.8);passenger('passenger-cruising',-32,78,-.7,1);passenger('passenger-east',64,52,.8,.7);
 sail('sail-west',-77,43,-.6,'#c9a372');sail('sail-front',10,78,-.25,'#c88d73');sail('sail-east',71,18,-.5,'#8eaea5');
 // A white arch bridge is a visible edge connection, separate from the lake bridge.
 const connection=record('white-arch-bridge','水岸白色拱橋',62,-22,18,group(62,-22,-.7));
 box('#d7d6c4',0,.5,0,4,.6,30,connection);for(const side of [-1,1]){const points=[];for(let i=0;i<=30;i++){const z=-15+i,y=.8+Math.sin(i/30*Math.PI)*6;points.push(new THREE.Vector3(side*1.6,y,z));if(i%3===0)line('#e7e5d2',[side*1.6,.8,z],[side*1.6,y,z],.05,connection);}const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),60,.16,8,false),mat('#e9e7d5'));connection.add(mesh);}
 const islet=record('edge-connection-islet','周邊連結的局部岸邊',79,-41,13,group(79,-41));
 shape('cyl','#c8bb96',0,-.6,0,13,1.2,12,islet);shape('cyl','#849e58',0,.03,0,12.5,.1,11.5,islet);box('#d6ccb0',2,1.4,-2,5,2.7,4,islet);box('#77988a',2,2.9,-2,5.6,.25,4.5,islet);
 for(const [x,z] of [[78,-47],[85,-44],[84,-36],[73,-44]])art.tree(x,z,4.5,0,true);
 return {inventory,boats,advance(time){boats.forEach((b,i)=>{b.root.position.y=b.base.y+Math.sin(time*.7+i)*.045;b.root.rotation.z=Math.sin(time*.5+i)*.012;});}};
}
