import * as THREE from 'three';

// Preview-only architecture: silhouette, footprint and use vary before colours are applied.
export function createArchitecture(art,scene){
 const {box,shape,ball,batch,line,label,mat,geo,reserve,rand,between}=art;
 const counts={},placements=[];
 const colours=['#deb47d','#c79680','#92b7a1','#c9b384','#94b8c4','#e3c786'];
 const roofs=['#b77c56','#c58b61','#718c8e','#8d7867'];
 const woodTex=art.texture(256,(g,s)=>{g.fillStyle='#d5be93';g.fillRect(0,0,s,s);for(let i=0;i<180;i++){g.strokeStyle=i%3?'#b59b75':'#eee0bd';g.globalAlpha=.25;g.lineWidth=between(.5,1.5);g.beginPath();const y=rand()*s;g.moveTo(0,y);g.bezierCurveTo(70,y-4,170,y+6,s,y+2);g.stroke();}g.globalAlpha=1;});
 const wood=new THREE.MeshStandardMaterial({map:woodTex,color:'#cfaa76',roughness:.86,envMapIntensity:.25});
 const glass=new THREE.MeshPhysicalMaterial({color:'#548b9b',roughness:.22,metalness:.12,clearcoat:.8,envMapIntensity:.65});
 const cream='#f0e2c5',dark='#6b776d';
 const roofGeo=new THREE.BufferGeometry();roofGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.5,-.5,-.5,.5,-.5,-.5,.5,.5,0,-.5,.5,0,-.5,-.5,.5,.5,-.5,.5],3));roofGeo.setIndex([0,3,1,1,3,2,4,5,3,5,2,3,0,4,3,1,2,5,0,1,4,1,5,4]);geo.gable=roofGeo.toNonIndexed();geo.gable.computeVertexNormals();
 function register(family,x,z,height,w,d){counts[family]=(counts[family]||0)+1;placements.push({family,x,z,height,w,d});return height;}
 function pitched(x,y,z,w,d,rh,color){
  shape('gable',color,x,y+rh/2,z,w+.3,rh,d+.36);
  box(color,x,y+rh+.025,z,w+.5,.13,.14);
  const slope=rh/(d/2+.18);
  for(let side=-1;side<=1;side+=2)for(let n=1;n<=5;n++){const zz=(d/2+.18)*n/5;line(color,[x-w/2-.17,y+rh-zz*slope+.055,z+side*zz],[x+w/2+.17,y+rh-zz*slope+.055,z+side*zz],.02).castShadow=false;}
  for(const side of [-1,1])box('#d6b88b',x,y-.055,z+side*(d/2+.18),w+.4,.13,.10);
 }
 function window(x,y,z,w=1.1,h=1.35,side='front',trim=cream){
  if(side==='front'){
   box(trim,x,y,z,w+.22,h+.2,.16);box(glass,x,y,z+.105,w,h,.045);box(trim,x,y,z+.145,.045,h+.05,.055);box(trim,x,y-.04,z+.146,w,.04,.055);box(trim,x,y-h/2-.13,z+.16,w+.33,.09,.34);
  }else{
   box(trim,x,y,z,.16,h+.2,w+.22);box(glass,x+.105,y,z,.045,h,w);box(trim,x+.145,y,z,.055,h+.05,.045);box(trim,x+.146,y-.04,z,.055,.04,w);
  }
 }
 function door(x,z,y=1.1,width=.85){box('#8c775b',x,y,z,width+.15,2.15,.14);box(glass,x,y+.1,z+.095,width*.8,1.8,.045);ball('#e2c99d',x+width*.26,y-.03,z+.13,.035,.035,.035);}
 function planter(x,y,z,w=1.05,c='#be9676'){
  box(c,x,y+.15,z,w,.3,.4);box('#77654a',x,y+.32,z,w*.88,.035,.32);
  for(let k=0;k<14;k++){const xx=x+between(-w*.4,w*.4),zz=z+between(-.13,.13);batch('foliage',k%3?'#6f9654':'#92ac61',xx,y+.44,zz,.25,.25,1,rand()*2,rand()*6,rand()*6);if(k%5===0)ball(k%2?'#f2c582':'#dcaeae',xx,y+.51,zz,.05,.05,.05);}
 }
 function railing(x,y,z,w){box(dark,x,y+.57,z,w,.05,.05);for(let k=-w/2;k<=w/2;k+=.32)box('#9baca1',x+k,y+.3,z,.035,.6,.035);}
 function balcony(x,y,z,w=1.7,d=.75){shape('round',cream,x,y,z,w,.14,d);railing(x,y+.04,z+d/2,w);for(const side of [-1,1])box(dark,x+side*w/2,y+.58,z,.035,.045,d);}
 function tiledPath(x,z,w=1.25,d=1.8){art.slab(art.pavement,x,z,w,d,.08,.1);}
 function roofGarden(x,y,z,w,d){box('#d9cbb0',x,y,z,w,.24,d);box(art.grass,x,y+.13,z,w-.25,.03,d-.25);for(let k=-1;k<=1;k++)planter(x+k*w*.25,y+.15,z,w*.2);}
 function townhouses(x,z,k=0){
  reserve(x,z,7.7,7.2);const unit=2.12;
  for(let i=0;i<3;i++){
   const xx=x+(i-1)*unit,h=4.5+((k+i)%3)*.55,c=colours[(k+i)%colours.length];
   box(c,xx,h/2,z,unit-.08,h,4.8);pitched(xx,h,z,unit,4.8,.9,roofs[(k+i)%roofs.length]);
   window(xx,3.35,z+2.44,1.16,1.3);door(xx-.38,z+2.46,1.1,.7);window(xx+.48,1.32,z+2.46,.57,1.02);
   if(i!==1){balcony(xx,2.53,z+2.88,1.7,.72);planter(xx+.5,2.65,z+3.1,.6);}
   tiledPath(xx-.38,z+3.08,.8,1.2);box('#d4c7ad',xx-unit/2,1,z+2.5,.12,2,.3);
  }
  return register('townhouses',x,z,6.6,7.7,7.2);
 }
 function gardenVilla(x,z,k=0){
  reserve(x,z,7.8,7.8);const mainX=x-.8,h=4.9;box(colours[k%6],mainX,h/2,z-.4,4.4,h,4.9);pitched(mainX,h,z-.4,4.4,4.9,1.25,roofs[k%4]);
  box(colours[(k+2)%6],x+2.25,1.75,z+.25,2.15,3.5,3.6);pitched(x+2.25,3.5,z+.25,2.3,3.7,.8,roofs[k%4]);
  window(mainX-.9,3.5,z+2.09,1.05,1.25);window(mainX+.9,3.5,z+2.09,1.05,1.25);door(mainX,z+2.1);window(x+2.25,1.9,z+2.1,1.3,1.3);
  box(wood,mainX,2.55,z+2.8,4.1,.16,1.6);for(const xx of [-1.9,1.9])box(wood,mainX+xx,1.25,z+3.4,.1,2.5,.1);
  balcony(mainX,2.64,z+2.8,3.8,1.55);planter(mainX+1.25,.12,z+3.5,.9);tiledPath(mainX-.6,z+3.2,1,1.4);art.tree(x-3,z+2.8,2.7,0,true);
  return register('gardenVilla',x,z,6.4,7.8,7.8);
 }
 function courtyard(x,z,k=0){
  reserve(x,z,7.8,7.8);const c=colours[(k+2)%6];box(c,x,3.5,z-1.7,7,7,2.6);pitched(x,7,z-1.7,7,2.6,.75,roofs[(k+2)%4]);
  for(const side of [-1,1]){box(c,x+side*2.65,2.55,z+.6,1.7,5.1,3.5);pitched(x+side*2.65,5.1,z+.6,1.8,3.7,.65,roofs[(k+2)%4]);window(x+side*2.65,3.6,z+2.4,.8,1.1);window(x+side*2.65,1.5,z+2.4,.8,1.1);}
  for(let f=0;f<3;f++)for(const xx of [-2.3,0,2.3])window(x+xx,1.2+f*2.2,z-.34,1.2,1.4);
  door(x,z-.3);tiledPath(x,z+1.1,1.2,3);planter(x-1.25,.1,z+1.5,1);planter(x+1.25,.1,z+1.5,1);
  return register('courtyard',x,z,8,7.8,7.8);
 }
 function terraces(x,z,k=0){
  reserve(x,z,7.6,7.5);const c=colours[k%6];
  box(c,x,2.3,z,6.7,4.6,5.9);box(c,x+.45,6.7,z-.65,5.2,4.2,4.3);box(colours[(k+2)%6],x+.8,9.9,z-1.1,3.8,2.2,3.1);
  for(let f=0;f<4;f++){const step=f<2?0:1,zz=z+(step?1.55:3.01);for(const xx of [-1.7,.3,2.1])window(x+xx,1.2+f*2.2,zz,1.12,1.4);}
  box(cream,x,4.67,z,7,.15,6.2);railing(x,4.74,z+2.96,6.8);planter(x-1.9,4.8,z+2.3,1.8);planter(x+1.5,4.8,z+2.3,1.5);
  box(cream,x+.45,8.87,z-.65,5.5,.15,4.6);railing(x+.45,8.95,z+1.6,5.4);planter(x+1.8,9,z+1.1,1.3);roofGarden(x+.8,11.1,z-1.1,3.9,3.3);
  door(x-.7,z+3.08);return register('terraces',x,z,11.7,7.6,7.5);
 }
 function balconyApartment(x,z,k=0,floors=5){
  reserve(x,z,7.4,7.6);const h=floors*2.35,c=colours[k%6],w=6.3,d=5.5;
  box(c,x,h/2,z,w,h,d);box('#b7b7a6',x-w*.34,h/2,z,.6,h,d+.08);
  for(let f=0;f<floors;f++){
   const y=1.24+f*2.35;
   for(const xx of [-1.8,0,1.8])window(x+xx,y,z+d/2+.04,1.1,1.45);
   for(const zz of [-1.7,.6])window(x+w/2+.04,y,z+zz,1.2,1.45,'side');
   const xx=x+(f%2?.9:-.9);balcony(xx,y-.88,z+d/2+.5,3.4,.98);planter(xx+1.1,y-.75,z+d/2+.8,.8);
  }
  box(cream,x,h+.14,z,w+.3,.28,d+.3);roofGarden(x+1,h+.3,z-1,2.8,2.1);
  shape('cyl',mat('#afc3bc',.4,.25),x-1.5,h+1.05,z-.9,.65,1.5,.65);shape('cyl','#8ea69f',x-1.5,h+1.83,z-.9,.72,.08,.72);
  for(const xx of [-2.7,-.3])box(wood,x+xx,h+.95,z+1.6,.09,1.65,.09);for(let n=0;n<7;n++)box(wood,x-1.5,h+1.8,z+.65+n*.25,2.8,.065,.07);
  return register('balconyApartment',x,z,h+1.9,7.4,7.6);
 }
 function cornerShop(x,z,k=0){
  reserve(x,z,7.8,7.8);const h=5.1;box(colours[k%6],x-.35,h/2,z-.2,6.2,h,5.4);pitched(x-.35,h,z-.2,6.4,5.6,1.15,roofs[(k+1)%4]);
  for(const xx of [-1.85,.1,2])window(x+xx,3.65,z+2.54,1.2,1.3);
  box(glass,x-.3,1.15,z+2.57,5.2,1.95,.055);box(wood,x-2.65,1.15,z+2.68,.12,2.1,.12);box(wood,x+2.3,1.15,z+2.68,.12,2.1,.12);
  const awning=box('#b6bfa0',x-.3,2.48,z+3.03,6.4,.12,1.05);awning.rotation.x=.14;
  for(let n=0;n<9;n++){const o=box(n%2?'#f3e4bc':['#6e9a9b','#bd9474','#9cae80'][k%3],x-3.2+n*.72,2.5,z+3.03,.69,.13,1.08);o.rotation.x=.14;}
  label(['巷口咖啡','街角書屋','日常商店'][k%3],x-.3,2.95,z+2.66,3.6,.5,'#eee0c2','#6d6651');
  planter(x-2.65,.1,z+3.4,.8);planter(x+2.5,.1,z+3.4,.8);if(k%3===0)art.tree(x-3.2,z+2.8,2.5,0,true);return register('cornerShop',x,z,6.5,7.8,7.8);
 }
 function arcadeRow(x,z,k=0){
  reserve(x,z,7.8,7.8);
  for(let i=0;i<3;i++){
   const xx=x+(i-1)*2.25,h=4.6+(i%2)*.7;box(colours[(k+i)%6],xx,h/2,z-.4,2.16,h,4.6);pitched(xx,h,z-.4,2.3,4.8,.7,roofs[(k+i)%4]);
   window(xx,3.5,z+1.94,1.1,1.35);box(glass,xx,1.2,z+1.97,1.7,1.9,.06);box(wood,xx-1,1.2,z+3.1,.12,2.4,.12);box(wood,xx+1,1.2,z+3.1,.12,2.4,.12);box(cream,xx,2.45,z+2.5,2.25,.2,1.65);label(['生活小店','街區工作室','巷口商店'][i],xx,2.78,z+2.02,1.9,.35,'#e8d8b9','#75644d');
  }
  tiledPath(x,z+2.7,7.6,1.2);return register('arcadeRow',x,z,6.2,7.8,7.8);
 }
 function glassOffice(x,z,k=0,floors=7){
  reserve(x,z,7.8,7.6);const h=floors*2.35,front=z+2.38;
  box('#d6cbb4',x,2.2,z,7,4.4,6.1);box(glass,x,.1+h/2,z-.2,5.5,h,4.8);
  for(const xx of [-2.8,-1.45,0,1.45,2.8])box('#c9cfc5',x+xx,h/2,z+2.25,.11,h,.17);
  for(let f=1;f<floors;f++){box('#d9d9c9',x,f*2.35,z+2.27,5.7,.11,.2);box('#b8c5bd',x+2.8,f*2.35,z-.2,.12,.11,4.9);}
  for(const zz of [-2,-.5,1])box('#c9cfc5',x+2.83,h/2,z+zz,.14,h,.1);
  box('#dad6c5',x,h+.2,z-.2,6,.4,5.2);box('#b8c5bb',x,h+.95,z-.4,2.4,1.2,1.8);box(glass,x,1.6,z+3.1,5.6,2.7,.09);box('#d8c7a4',x,3.7,z+3.4,7.2,.18,.9);
  planter(x-2.4,.1,z+3.4,.9);planter(x+2.4,.1,z+3.4,.9);return register('glassOffice',x,z,h+1.6,7.8,7.6);
 }
 function labCampus(x,z,k=0){
  reserve(x,z,7.8,7.8);box('#bccfc4',x-1.25,3.4,z-1,4.5,6.8,4.5);box('#d8c6a6',x+2.1,2.2,z+.7,2.5,4.4,4.7);box(glass,x+.2,1.7,z+1.7,2.4,2.8,1.2);
  for(let f=0;f<3;f++)for(const xx of [-2.4,-.4])window(x+xx,1.3+f*2.1,z+1.3,1.25,1.35);
  for(let f=0;f<2;f++)window(x+2.1,1.3+f*2.1,z+3.1,1.55,1.35);
  box(cream,x-1.25,6.9,z-1,4.8,.2,4.8);for(let i=0;i<3;i++){const o=box(mat('#4a7389',.4,.2),x-2.6+i*1.3,7.15,z-1.2,1.1,.07,2.4);o.rotation.x=-.18;}
  planter(x+2.1,4.5,z+.5,1.8);return register('labCampus',x,z,7.5,7.8,7.8);
 }
 function civicHall(x,z,k=0,name='城市生活館'){
  reserve(x,z,8,7.8);box(colours[(k+3)%6],x,2.3,z-.45,6.8,4.6,5.5);pitched(x,4.6,z-.45,7.1,5.8,1.4,roofs[(k+2)%4]);
  for(const xx of [-2.3,2.3])window(x+xx,2.5,z+2.34,1.15,2.25);
  box(glass,x,1.6,z+2.37,2.8,2.9,.06);for(const xx of [-1.6,1.6])box(wood,x+xx,1.65,z+3.2,.14,3.3,.14);box('#d9bd8e',x,3.3,z+2.95,3.6,.17,1.4);label(name,x,3.8,z+2.4,4.5,.5);
  planter(x-2.6,.12,z+3.1,.85);planter(x+2.6,.12,z+3.1,.85);return register('civicHall',x,z,6.3,8,7.8);
 }
 function preschool(x,z,k=0,name='育兒服務主題'){
  reserve(x,z,8,8.1);box('#e4c59a',x-.3,2.6,z-1.3,6.5,5.2,4.6);pitched(x-.3,5.2,z-1.3,6.8,4.9,1.3,'#c38a60');
  box('#d6b692',x+2.6,1.7,z-.5,1.7,3.4,3.5);pitched(x+2.6,3.4,z-.5,1.9,3.7,.7,'#7e9e9c');
  for(const xx of [-2.4,-.3,1.7]){window(x+xx,3.8,z+1.06,1.15,1.25);if(xx!==-.3)window(x+xx,1.5,z+1.06,1.1,1.2);}
  door(x-.3,z+1.13,1.1,1.1);box('#d9c291',x-.3,2.65,z+1.8,3.2,.17,1.5);label(name,x-.3,2.66,z+2.57,3.15,.34,'#eddbaf','#675139');
  for(const side of [-1,1]){const mid=x+side*2.5;for(let i=0;i<8;i++)box(wood,mid-.95+i*.27,.65,z+4,.095,1.3,.11);box(wood,mid,.9,z+4,2.15,.095,.12);}
  tiledPath(x-.3,z+2.65,1.2,3.1);planter(x-2.5,.1,z+2.9,1.3);
  for(const xx of [2,3])for(const zz of [2.5,3.5])box(wood,x+xx,.7,z+zz,.08,1.4,.08);box('#e2b86e',x+2.5,.85,z+3,1.3,.12,1.3);
  shape('gable','#769fa4',x+2.5,1.85,z+3,1.5,.6,1.5);line('#ddb55b',[x+2.4,.9,z+3.6],[x+1.5,.18,z+4.2],.13);
  art.tree(x-3.1,z+3,2.8,0,true);return register('preschool',x,z,6.8,8,8.1);
 }
 const builders={townhouses,gardenVilla,courtyard,terraces,balconyApartment,cornerShop,arcadeRow,glassOffice,labCampus,civicHall,preschool};
 return {...builders,counts,placements,glass};
}
