import * as THREE from 'three';

// A complete neighbourhood composition fitted to the existing childcare policy parcel.
// All geometry is real, including rear elevations, courtyard, lake bank and bridge.
export function craftDistrict(art,scene,p,T,details){
 const g=new THREE.Group();g.name='craft-v2-'+p.id;scene.add(g);
 const {box,shape,line,ball}=art;
 const masonry=art.texture(256,(ctx,n)=>{ctx.fillStyle='#ccb39b';ctx.fillRect(0,0,n,n);for(let row=0;row<16;row++)for(let col=-1;col<8;col++){ctx.fillStyle=['#b06e52','#ba795b','#a8654d'][(row+col+9)%3];ctx.fillRect(col*32+(row%2)*16+1,row*16+1,30,14);}});masonry.repeat.set(2,2);
 const cream=art.mat('#ead8b8',.86),brick=T.material('#ffffff',masonry),sage=art.mat('#749b8c',.8),wood=art.mat('#a3774b',.8);
 const glass=new THREE.MeshPhysicalMaterial({color:'#3a8190',metalness:.22,roughness:.22,clearcoat:.8,envMapIntensity:.65});
 const pale=art.mat('#e5d3ab',.9),bank=art.mat('#bcb28d',.96);
 const specimens=[];
 function mesh(geo,mat,parent=g){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function outline(points,y,material,parent=g){const s=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));const geo=new THREE.ShapeGeometry(s);geo.rotateX(-Math.PI/2);const m=mesh(geo,material,parent);m.position.y=y;return m;}
 function round(w,d,r,h,material,x,y,z,parent=g){const s=new THREE.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const geo=new THREE.ExtrudeGeometry(s,{depth:h,steps:1,bevelEnabled:false,curveSegments:12});geo.rotateX(-Math.PI/2);const o=mesh(geo,material,parent);o.position.set(x,y,z);return o;}
 function path(points,width,material,y=.17){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1];const o=box(material,(a[0]+b[0])/2,y,(a[1]+b[1])/2,width,.10,Math.hypot(dx,dz)+.04,g);o.rotation.y=Math.atan2(dx,dz);}}
 function tree(x,z,h=5,tone=0){line('#786044',[x,.25,z],[x,h*.7,z],.13,g);const colors=['#537b54','#70934d','#8da65d'];for(let k=0;k<7;k++){const a=k*2.4,r=k?1.0:0;ball(colors[(k+tone)%3],x+Math.cos(a)*r,h*.7+(k%3)*.6,z+Math.sin(a)*r,.95,h*.24,.9,g);}shape('cyl','#c5b990',x,.25,z,1.35,.22,1.35,g);}
 function garden(x,z,w,d,y=.3){box('#c2af8c',x,y,z,w,.38,d,g);box('#576b40',x,y+.21,z,w-.2,.08,d-.2,g);for(let i=0;i<Math.ceil(w*2);i++){const xx=x-w*.43+(i+.5)/Math.ceil(w*2)*w*.86;ball(i%3?'#719252':'#95a85d',xx,y+.55,z,.38,.45,.36,g);if(i%4===0)ball('#d89b96',xx,y+.88,z,.16,.1,.16,g);}}
 function fence(points,y=1.1){for(let i=1;i<points.length;i++)line('#817459',[points[i-1][0],y,points[i-1][1]],[points[i][0],y,points[i][1]],.045,g);for(const [x,z]of points)line('#9b8b70',[x,.2,z],[x,y,z],.04,g);}
 function facade(parent,w,d,base,floors){for(let side=0;side<4;side++){const f=new THREE.Group();parent.add(f);f.rotation.y=side*Math.PI/2;f.position.set(side===1?w/2:side===3?-w/2:0,0,side===0?d/2:side===2?-d/2:0);const width=side%2?d:w,n=Math.floor(width/3);for(let floor=0;floor<floors;floor++)for(let j=0;j<n;j++){const x=-width/2+(j+.5)*width/n,y=base+floor*2.8+1.3;box('#dfd8bc',x,y,.07,1.95,2.15,.13,f);box(glass,x,y,.16,1.68,1.9,.08,f);box('#d2cdb6',x,y,.23,.05,1.95,.07,f);if(side===0){box('#e6d5b0',x,y-.95,.65,2.3,.12,1.3,f);T.rail(x,y-.9,1.27,2.2,f);T.planter(x+.55,y-.7,.82,.6,.4,f);}}}}
 // Continuous neighbourhood ground: lawn, warm paving, and permeable courtyard.
 box('#7e995c',0,.04,0,41,.1,65,g);
 path([[-19,-31],[-19,31],[19,31],[19,-31],[-19,-31]],2.0,T.pavement);
 path([[-18,-2],[1,-2],[14,2],[16,17],[12,28]],2.5,T.pavement);
 path([[-18,26],[-8,24],[0,28],[12,28]],2.2,T.pavement);
 // A stepped L-shaped family residence, with planted terraces rather than a flat box.
 const residence=new THREE.Group();residence.position.set(-8,-.0,-20);g.add(residence);
 round(17,15,1.2,3.2,cream,0,.22,0,residence);
 box(cream,-3,9.0,-1.5,11,12,12,residence);const residenceFaces=new THREE.Group();residenceFaces.position.set(-3,0,-1.5);residence.add(residenceFaces);facade(residenceFaces,11,12,3.3,4);
 box(sage,4,7.8,1.5,7,9.4,12,residence);
 for(let f=0;f<3;f++){box('#eedfbe',4,3.3+f*3.1,7.7,7.5,.22,1.8,residence);for(let k=0;k<4;k++)box(glass,1.6+k*1.6,4.6+f*3.1,7.58,1.25,2.2,.12,residence);}
 for(const side of [1,2]){const face=new THREE.Group();face.rotation.y=side*Math.PI/2;face.position.set(side===1?7.55:4,0,side===1?1.5:-4.55);residence.add(face);const width=side===1?12:7,n=side===1?4:2;for(let f=0;f<3;f++)for(let j=0;j<n;j++){const xx=-width/2+(j+.5)*width/n,y=4.6+f*3.1;T.windowBay(xx,y,.05,1.6,2,face,false);box('#d4c6a4',xx,y+1.13,.3,2,.13,.65,face);}}
 round(11.4,12.4,.5,.32,pale,-3,15,-1.5,residence);
 round(7.3,12.3,.5,.3,pale,4,12.5,1.5,residence);
 T.roofGarden(residenceFaces,10,11,15.3);
 for(let j=0;j<4;j++)T.planter(4,12.9,-3+j*2.8,2.5,.8,residence);
 for(let k=0;k<6;k++)box(wood,-3,18.1,-5+k*1.2,10,.13,.16,residence);
 for(const x of [-7,1])for(const z of [-5,1])box(wood,x,16.6,z,.14,3,.14,residence);
 T.sign('親子生活館',0,2.6,7.67,8,.8,'#eee0c0','#395f64',residence);
 for(const x of [-6,-2,2,6])box(glass,x,1.5,7.61,2.3,2.3,.12,residence);
 specimens.push('L形退台親子生活館');
 // Curved glazed reading pavilion, a low circular counterpoint to the residence.
 const rotunda=new THREE.Group();rotunda.position.set(9,0,-8);g.add(rotunda);
 round(17,14,6.8,.4,pale,0,.2,0,rotunda);round(15,12,5.9,6.6,glass,0,.6,0,rotunda);
 for(let corner=0;corner<4;corner++)for(let k=0;k<9;k++){const a=corner*Math.PI/2+k/8*Math.PI/2,cx=corner===0||corner===3?1.6:-1.6,cz=corner<2?.1:-.1;box('#d9c6a0',cx+Math.cos(a)*5.96,3.8,cz+Math.sin(a)*5.96,.13,6.5,.13,rotunda);}
 for(const yy of [2.8,5.2])round(15.12,12.12,5.96,.09,pale,0,yy,0,rotunda);
 round(17.5,14.5,7,.35,cream,0,7.2,0,rotunda);
 const dome=mesh(new THREE.SphereGeometry(1,32,16,0,Math.PI*2,0,Math.PI/2),glass,rotunda);dome.position.set(0,7.55,0);dome.scale.set(4.8,2.3,3.6);
 for(let k=0;k<4;k++)box(wood,-3+k*2,1.3,-2,1.5,2.1,.5,rotunda);
 T.sign('湖畔繪本室',0,4.9,6.06,6,.8,'#eee4cd','#466d70',rotunda);
 specimens.push('弧形玻璃繪本室');
 // Three connected narrow shops with sloped ceramic roofs and individual silhouettes.
 for(let i=0;i<3;i++){
  const shop=new THREE.Group();shop.position.set(-12,0,3+i*7);shop.rotation.y=Math.PI/2;g.add(shop);const w=6.5,d=8,h=[6.5,8.4,5.4][i];
  box([brick,cream,sage][i],0,h/2+.2,0,w,h,d,shop);
  const roofShape=new THREE.Shape();roofShape.moveTo(-w/2-.5,0);roofShape.lineTo(0,2);roofShape.lineTo(w/2+.5,0);roofShape.closePath();const geo=new THREE.ExtrudeGeometry(roofShape,{depth:d+1,bevelEnabled:false});const roof=mesh(geo,T.terracotta,shop);roof.position.set(0,h+.3,-d/2-.5);
  for(let k=0;k<16;k++){const x=-w/2+k*w/15;line('#cc9b75',[x,h+.4+2*(1-Math.abs(x)/(w/2+.5)),-d/2-.5],[x,h+.4+2*(1-Math.abs(x)/(w/2+.5)),d/2+.5],.035,shop);}
  T.storefront(shop,0,d/2+.04,w-.2,['巷口麵包','日常書屋','小樹花房'][i],['#a56945','#557d75','#8b8958'][i]);
  for(const side of [-1,1]){const face=new THREE.Group();face.position.x=side*w/2;face.rotation.y=side*Math.PI/2;shop.add(face);for(const z of [-2,1])T.windowBay(z,h-1.5,.05,1.5,1.6,face,false);}
  const rear=new THREE.Group();rear.position.z=-d/2;rear.rotation.y=Math.PI;shop.add(rear);T.windowBay(0,h-1.4,.05,1.8,1.5,rear,false);box('#657974',0,1.35,.12,1.2,2.4,.1,rear);
  T.windowBay(0,h-1.4,d/2+.05,1.8,1.5,shop,false);box('#beaa85',0,h+.7,-2,1,2,1,shop);
 }
 specimens.push('連棟坡屋頂商店');
 // Organic lake with a layered stone bank and shallow-water rim.
 const curve=new THREE.CatmullRomCurve3([[-4,0,8],[4,0,5],[13,0,8],[15,0,16],[10,0,24],[2,0,25],[-5,0,21],[-5,0,15]].map(v=>new THREE.Vector3(...v)),true,'catmullrom',.4);
 const pts=curve.getPoints(100).map(v=>[v.x,v.z]);outline(pts,.24,bank);
 const center=new THREE.Vector2(5,15),scaled=f=>pts.map(([x,z])=>[center.x+(x-center.x)*f,center.y+(z-center.y)*f]);
 outline(scaled(.92),.26,art.mat('#70bcb5',.35,.15));
 const waveNormal=art.texture(128,(ctx,n)=>{const im=ctx.createImageData(n,n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4;im.data[i]=128+23*Math.cos(x*.39+y*.2);im.data[i+1]=128+17*Math.sin(y*.31-x*.15);im.data[i+2]=253;im.data[i+3]=255;}ctx.putImageData(im,0,0);});waveNormal.colorSpace=THREE.NoColorSpace;waveNormal.repeat.set(.3,.3);
 const water=new THREE.MeshPhysicalMaterial({color:'#338e9f',roughness:.22,metalness:.15,clearcoat:1,envMapIntensity:.9,normalMap:waveNormal,normalScale:new THREE.Vector2(.35,.35)});outline(scaled(.83),.28,water);
 for(let i=0;i<38;i++){const [x,z]=pts[Math.floor(i*100/38)];const o=shape('leaf',i%3?'#b6ad91':'#d0c4a3',x,.43,z,.45,.3,.38,g);o.rotation.y=i;}
 for(let i=0;i<18;i++){const a=i*.7,x=5+Math.sin(a)*7,z=15+Math.cos(a)*6;if(z>11&&z<15)continue;const pts=[];for(let j=0;j<7;j++)pts.push(new THREE.Vector3(x+j*.22,.295,z+Math.sin(j*.6+i)*.09));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.018,4,false),art.mat('#89c3bf',.4));}
 // Arched wooden pedestrian bridge crosses the water, with continuous handrails.
 const a=new THREE.Vector3(-6,0,13),b=new THREE.Vector3(16,0,13),railL=[],railR=[];
 for(let i=0;i<=44;i++){const t=i/44,x=THREE.MathUtils.lerp(a.x,b.x,t),y=.65+2.2*Math.sin(Math.PI*t);box(wood,x,y,13,.52,.18,2.3,g);railL.push(new THREE.Vector3(x,y+1,11.9));railR.push(new THREE.Vector3(x,y+1,14.1));if(i%4===0)for(const z of [11.9,14.1])line('#dbbe85',[x,y,z],[x,y+1.1,z],.055,g);}
 for(const points of [railL,railR])mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),60,.065,6,false),pale);
 for(const x of [-4,14])box('#b2a789',x,.65,13,.7,1.1,2.5,g);
 specimens.push('不規則湖岸與拱橋');
 // Deliberate clusters, clear sightlines and smaller understorey along the shore.
 for(const [x,z,h,t]of [[-17,-29,6,0],[16,-27,6,1],[17,-22,5,2],[-18,-6,5,0],[-17,26,5,2],[-11,28,6,0],[1,29,5,1],[14,25,5,2],[17,19,5,0],[17,4,5,1],[-2,3,4,1]])tree(x,z,h,t);
 for(const [x,z,w,d]of [[0,-30,9,1.6],[17,-17,1.4,7],[-18,11,1.4,12],[-2,27,7,1.2],[14,28,6,1.3],[-3,4,4,1]])garden(x,z,w,d);
 for(const [x,z]of [[-1,2],[12,27],[-15,26]]){box(wood,x,.65,z,2.7,.18,.7,g);box(wood,x,1,z-.35,2.7,.65,.12,g);for(const dx of [-1,1])box('#566b62',x+dx,.35,z,.12,.6,.6,g);}
 for(const [x,z]of [[-17,-10],[18,0],[-16,22],[10,28]]){line('#5e756f',[x,.2,z],[x,3.5,z],.06,g);ball('#fff0c8',x,3.6,z,.23,.28,.23,g);}
 // Playground on the north courtyard, outside pond and circulation paths.
 round(7,6,1.8,.12,art.mat('#d5b276'),0,.2,-2,g);
 for(const x of [-2,2])for(const z of [-3,0])box(wood,x,1.4,z,.15,2.5,.15,g);
 box('#d3a555',0,1.6,-1.5,4.5,.18,3.4,g);shape('cone','#648e84',0,3.7,-1.5,3,1.3,2.5,g);
 line('#d8b75c',[2,1.6,-1],[4,.4,1],.2,g);
 // The whole composition must fit the approved site and leave roads untouched.
 g.updateMatrixWorld(true);let bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(new THREE.Vector3()),mid=bounds.getCenter(new THREE.Vector3());const scale=Math.min(1,(p.usableW-1)/size.x,(p.usableD-1)/size.z);g.scale.set(scale,scale,scale);g.position.set(p.x-mid.x*scale,0,p.z-mid.z*scale);g.updateMatrixWorld(true);bounds.setFromObject(g);size=bounds.getSize(new THREE.Vector3());art.reserve(p.x,p.z,size.x+.5,size.z+.5);
 p.height=bounds.max.y;p.anchor=new THREE.Vector3(p.x,p.height+2,p.z);p.features=specimens;
 const pick=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),new THREE.MeshBasicMaterial({visible:false}));pick.position.copy(bounds.getCenter(new THREE.Vector3()));pick.userData.theme=p.id;scene.add(pick);details.picks.push(pick);
 details.records.push({id:p.id,kind:'craft-study-v2',x:p.x,z:p.z,height:p.height,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},site:{x:p.x,z:p.z,w:p.usableW,d:p.usableD},features:specimens,scale});
}
