import * as THREE from 'three';

// New urban silhouettes for art review. None of these represent a built policy project.
export function createUrbanBuildings(art,scene){
 const {geo,box,shape,batch,line,mat,label,reserve}=art;
 const glass=new THREE.MeshPhysicalMaterial({color:'#3d799e',roughness:.19,metalness:.2,clearcoat:.8,envMapIntensity:.65});
 const darkGlass=new THREE.MeshPhysicalMaterial({color:'#244c72',roughness:.22,metalness:.18,clearcoat:.9,envMapIntensity:.75});
 const aquaGlass=new THREE.MeshPhysicalMaterial({color:'#75a9b5',roughness:.23,metalness:.16,clearcoat:.75,envMapIntensity:.65});
 const cream='#d9cdb0',steel='#b2c1c4',bronze='#aa8658',brick='#aa7257';
 const FH=3;
 geo.urbanCylinder=new THREE.CylinderGeometry(1,1,1,64);
 geo.urbanRing=new THREE.TorusGeometry(1,.016,6,64);
 geo.urbanPyramid=new THREE.ConeGeometry(1,1,4).rotateY(Math.PI/4);
 const rs=new THREE.Shape();rs.moveTo(-.3,-.5);rs.lineTo(.3,-.5);rs.quadraticCurveTo(.5,-.5,.5,-.3);rs.lineTo(.5,.3);rs.quadraticCurveTo(.5,.5,.3,.5);rs.lineTo(-.3,.5);rs.quadraticCurveTo(-.5,.5,-.5,.3);rs.lineTo(-.5,-.3);rs.quadraticCurveTo(-.5,-.5,-.3,-.5);
 geo.urbanRound=new THREE.ExtrudeGeometry(rs,{depth:1,bevelEnabled:false,curveSegments:12}).rotateX(-Math.PI/2).translate(0,-.5,0);
 const wedge=new THREE.BufferGeometry();wedge.setAttribute('position',new THREE.Float32BufferAttribute([-.5,-.5,-.5,.5,-.5,-.5,.5,-.5,.5,-.5,-.5,.5,-.5,.15,-.5,.5,.5,-.5,.5,.5,.5,-.5,.15,.5],3));wedge.setIndex([0,1,2,0,2,3,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0,4,7,6,4,6,5]);geo.urbanSlant=wedge.toNonIndexed();geo.urbanSlant.computeVertexNormals();
 function band(c,x,y,z,w,d,t=.22){box(c,x,y,z,w,t,d);}
 function podium(x,z,w,d,h=6,color=cream){reserve(x,z,w,d);box(color,x,h/2,z,w,h,d);box(glass,x,h*.48,z+d/2+.06,w*.87,h*.7,.1);band('#e4dbc7',x,h,z,w+.5,d+.5,.3);for(let p=-w/2+1;p<w/2;p+=3.5)box(steel,x+p,h/2,z+d/2+.15,.14,h,.18);}
 function curtain(x,z,w,d,floors,material=glass,piers=steel,y0=0){
  const h=floors*FH;box(material,x,y0+h/2,z,w,h,d);
  for(let f=1;f<floors;f++){band(piers,x,y0+f*FH,z,w+.12,d+.12,.16);}
  for(let xx=-w/2;xx<=w/2+.1;xx+=2){box(piers,x+xx,y0+h/2,z+d/2+.08,.07,h,.13);box(piers,x+xx,y0+h/2,z-d/2-.08,.07,h,.13);}
  for(let zz=-d/2;zz<=d/2+.1;zz+=2)for(const side of [-1,1])box(piers,x+side*(w/2+.07),y0+h/2,z+zz,.13,h,.07);
  return h;
 }
 function cylinderTower(x,z,floors,r=7,color='#655f85'){
  const h=floors*FH;shape('urbanCylinder',darkGlass,x,h/2+6,z,r,h,r);
  for(let f=0;f<=floors;f++){const o=shape('urbanRing',f%4===0?'#d0d5ce':'#a3bfc8',x,6+f*FH,z,r+.06,r+.06,r+.06);o.rotation.x=Math.PI/2;o.castShadow=false;}
  for(let n=0;n<18;n++){const a=n*Math.PI/9;box(n%3?color:bronze,x+Math.cos(a)*(r+.06),6+h/2,z+Math.sin(a)*(r+.06),.35,h,.35);}
  shape('urbanCylinder',color,x,h+6.7,z,r+.25,1.4,r+.25);shape('urbanCylinder',steel,x,h+7.7,z,r*.65,1,r*.65);line(steel,[x,h+8,z],[x,h+13,z],.08);return h+13;
 }
 function twinCylinders(x,z){podium(x,z,32,24,6,'#c8c6b7');const h=cylinderTower(x-8,z-1,38,6.2);cylinderTower(x+8,z+1,32,6,'#5b6884');box(aquaGlass,x,79,z,8,3,5);band(cream,x,81,z,8.4,5.4,.3);return h;}
 function bracedSpire(x,z){
  podium(x,z,24,24,7);const w=13,d=13,floors=45,h=curtain(x,z,w,d,floors,darkGlass,'#69869b',7);
  for(const side of [-1,1])for(let k=0;k<5;k++){
   const y=7+k*27,za=z+side*(d/2+.28);
   line('#c6d1d1',[x-w/2,y,za],[x+w/2,y+27,za],.13);
   line('#c6d1d1',[x+w/2,y,za],[x-w/2,y+27,za],.13);
  }
  shape('urbanPyramid',darkGlass,x,h+18,z,9,22,9);for(const dx of [-1,1])line(steel,[x+dx*6.5,h+7,z+6.6],[x,h+29,z],.16);line(steel,[x,h+29,z],[x,h+43,z],.085);return h+43;
 }
 function curvedGlass(x,z){
  podium(x,z,26,24,7,'#c6cfcb');const h=36*FH;
  shape('urbanRound',aquaGlass,x,h/2+7,z,17,h,13);
  for(let f=0;f<=36;f++){shape('urbanRound','#aec8cd',x,7+f*FH,z,17.18,.16,13.18).castShadow=false;}
  for(const xx of [-6,-3,0,3,6])box('#c7d5d4',x+xx,h/2+7,z+6.55,.08,h,.08);
  shape('urbanRound',steel,x,h+7.5,z,17.6,1,13.6);shape('urbanRound','#97aab0',x,h+10,z,11,4,8);return h+12;
 }
 function slopedCrown(x,z){
  podium(x,z,24,23,6,'#c6c9bd');const h=48*FH,w=15,d=13;
  box(glass,x,h*.4+6,z,w,h*.8,d);shape('urbanSlant',darkGlass,x,h*.9+6,z,w,h*.2,d);
  for(let f=0;f<=48;f++){
   const y=f*FH+6;for(let j=0;j<7;j++){const xx=-w/2+(j+.5)*w/7,maxH=h*(.93+.07*(j+.5)/7)+6;if(y>maxH)continue;box('#a7c0c9',x+xx,y,z+d/2+.08,w/7-.12,.15,.12);}
  }
  for(const side of [-1,1]){line(steel,[x-w/2,6,z+side*(d/2+.2)],[x+w/2,h+6,z+side*(d/2+.2)],.14);line(steel,[x+w/2,6,z+side*(d/2+.2)],[x-w/2,h*.93+6,z+side*(d/2+.2)],.14);}
  for(const xx of [-w/2,w/2])box(steel,x+xx,h*.45+6,z+d/2+.12,.2,h*.9,.2);
  return h+7;
 }
 function artDeco(x,z){
  const tiers=[{w:27,d:24,f:4},{w:21,d:18,f:10},{w:15,d:13,f:8},{w:9,d:8,f:4}],colours=['#bca78a','#d1c5ab','#cabca1','#e1cf9e'];let y=0;
  for(const [i,t] of tiers.entries()){
   const h=t.f*FH;box(colours[i],x,y+h/2,z,t.w,h,t.d);
   for(let f=0;f<t.f;f++)for(let j=-t.w/2+1.5;j<t.w/2;j+=2.2){box(darkGlass,x+j,y+f*FH+1.55,z+t.d/2+.055,1.25,1.9,.08);}
   for(let j=-t.w/2+.8;j<t.w/2;j+=2.2)box('#e0d6bd',x+j,y+h/2,z+t.d/2+.16,.25,h,.25);
   for(const side of [-1,1])for(let f=0;f<t.f;f++)for(let j=-t.d/2+1.5;j<t.d/2;j+=2.2)box(darkGlass,x+side*(t.w/2+.05),y+f*FH+1.55,z+j,.08,1.9,1.25);
   band('#e4d9bb',x,y+h,z,t.w+.6,t.d+.6,.5);y+=h;
  }
  shape('urbanPyramid',bronze,x,y+4.5,z,6,9,6);line(steel,[x,y+9,z],[x,y+16,z],.08);return y+16;
 }
 function asymmetricTwins(x,z){
  podium(x,z,32,25,7,'#b9bfc0');const h1=curtain(x-8,z-2,12,13,35,glass,'#a7bbc0',7),h2=curtain(x+8,z+2,12,15,28,darkGlass,'#9caeb2',7);
  box('#718f99',x,82,z,6,4,10);box(aquaGlass,x+2.7,82,z+5.1,11,3,.08);band(steel,x-8,h1+7.6,z-2,12.7,13.7,.8);band(steel,x+8,h2+7.6,z+2,12.7,15.7,.8);
  box('#9caeac',x-8,h1+10,z-2,7,5,7);return h1+12.5;
 }
 function setbackResidential(x,z){
  const tiers=[{w:28,d:23,f:5,x:0,z:0},{w:22,d:17,f:8,x:-2,z:-2},{w:15,d:12,f:7,x:0,z:-3},{w:9,d:8,f:4,x:1,z:-4}];let y=0;
  for(const [i,t] of tiers.entries()){
   const h=t.f*FH,xx=x+t.x,zz=z+t.z;box(i%2?'#ca9a79':'#ad785f',xx,y+h/2,zz,t.w,h,t.d);
   for(let f=0;f<t.f;f++){
    for(let j=-t.w/2+1.3;j<t.w/2;j+=2.6){box(cream,xx+j,y+f*FH+1.6,zz+t.d/2+.07,1.8,2,.15);box(glass,xx+j,y+f*FH+1.6,zz+t.d/2+.17,1.5,1.7,.05);}
    for(const side of [-1,1])for(let j=-t.d/2+1.3;j<t.d/2;j+=2.6){box(cream,xx+side*(t.w/2+.07),y+f*FH+1.6,zz+j,.15,2,1.8);box(glass,xx+side*(t.w/2+.17),y+f*FH+1.6,zz+j,.05,1.7,1.5);}
    if(f%2===0){band('#d5bfa0',xx,y+f*FH,zz,t.w+.4,t.d+.4,.22);}
   }
   band(cream,xx,y+h,zz,t.w+.8,t.d+.8,.35);for(let k=-1;k<=1;k++){box('#b19d7e',xx+k*t.w*.25,y+h+.4,zz+t.d/2-1.1,t.w*.16,.6,1.2);batch('leaf','#698e53',xx+k*t.w*.25,y+h+1,zz+t.d/2-1.1,1.3,.8,.8);}
   y+=h;
  }
  return y+1.5;
 }
 function perimeterBlock(x,z){
  const wings=[[-10,0,7,27],[10,0,7,27],[0,-10,16,7]],h=10*FH;
  for(const [dx,dz,w,d] of wings){box(brick,x+dx,h/2,z+dz,w,h,d);for(let f=0;f<10;f++)for(let j=-w/2+1;j<w/2;j+=2){box(cream,x+dx+j,1.5+f*FH,z+dz+d/2+.06,1.25,1.9,.12);box(glass,x+dx+j,1.5+f*FH,z+dz+d/2+.14,1,1.65,.06);}for(const side of [-1,1])for(let f=0;f<10;f++)for(let j=-d/2+1;j<d/2;j+=2.4){box(cream,x+dx+side*(w/2+.06),1.5+f*FH,z+dz+j,.12,1.9,1.35);box(glass,x+dx+side*(w/2+.14),1.5+f*FH,z+dz+j,.06,1.65,1.1);}
  band(cream,x+dx,h,z+dz,w+.4,d+.4,.4);}
  art.slab(art.pavement,x,z+2,11,15,.08,.12);for(let i=-1;i<=1;i++)art.tree(x+i*3,z+1,4.5,0,true);return h+.5;
 }
 function cultureHall(x,z){
  podium(x,z,30,25,4,'#ddd2bd');box(aquaGlass,x,8,z,26,10,21);
  for(let i=0;i<10;i++){const xx=x-13+i*2.9,y=13+Math.sin(i/9*Math.PI)*5;line('#c7d1d0',[xx,4,z-11],[xx,y,z-11],.11);line('#c7d1d0',[xx,4,z+11],[xx,y,z+11],.11);}
  const roof=new THREE.CylinderGeometry(1,1,1,48,1,true,0,Math.PI);roof.rotateZ(Math.PI/2);geo.urbanHallRoof=roof;shape('urbanHallRoof',mat('#cad6d7',.45,.2),x,13,z,28,5.3,11);
  label('城市文化館',x,3.1,z+12.6,11,1.5,'#e8dfc7','#475b62');return 19;
 }
 function mixedUse(x,z){
  podium(x,z,28,25,6,'#d6bb96');curtain(x-6,z-1,12,17,6,aquaGlass,'#c4cbbd',6);box('#c59e7a',x+9,10,z+1,8,20,20);
  for(let f=0;f<6;f++)for(let j=0;j<3;j++)box(darkGlass,x+6.5+j*2.2,7.5+f*FH,z+11.1,1.2,1.8,.08);
  for(const side of [-1,1])for(let f=0;f<6;f++)for(let j=-7;j<10;j+=2.4)box(darkGlass,x+9+side*4.06,2+f*FH,z+1+j,.08,1.8,1.2);
  box('#809c97',x,4.8,z+13.4,28,.18,2.5);label('街區商業與辦公',x,5.8,z+12.7,14,1.1,'#e5d6b8','#665846');return 25;
 }
 return {twinCylinders,bracedSpire,curvedGlass,slopedCrown,artDeco,asymmetricTwins,setbackResidential,perimeterBlock,cultureHall,mixedUse};
}
