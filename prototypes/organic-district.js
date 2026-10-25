import * as THREE from 'three';

// One seeded plan governs water, actual terrain cutouts, building wings and planting.
export function inside(point, polygon){let yes=false;const [x,z]=point;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export function edgeDistance([x,z],polygon){let best=Infinity;for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}return best;}
function outline(x,z,rx,rz,phase,random){const points=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2,delta=Math.atan2(Math.sin(a-phase),Math.cos(a-phase)),r=Math.min(1.02,.82+.12*Math.sin(a*3+phase)+.07*Math.cos(a*2-phase)+random()*.08-.28*Math.exp(-delta*delta/.18));points.push(new THREE.Vector3(x+Math.cos(a)*rx*r,0,z+Math.sin(a)*rz*r));}return new THREE.CatmullRomCurve3(points,true,'centripetal').getPoints(95).slice(0,-1).map(v=>[v.x,v.z]);}
function expand(points,x,z,amount){return points.map(([px,pz])=>{const d=Math.hypot(px-x,pz-z);return [px+(px-x)/d*amount,pz+(pz-z)/d*amount];});}
export function createOrganicDistrictLayout(seed=20261025){let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const quarters=[
  {id:'courtyardQuarter',name:'轉折式內院住宅群',x:-55,z:105,w:57,d:27,n:9,floors:'4–9F · 三翼內院',detail:'長條街屋、轉角側翼與斜向住宅塔共享同一座庭院；一個街區由多個不同寬度、深度和高度的量體組成。內院保留自然池塘及步道。',blocks:[[-4,-9,40,7,6,'terrace','#d4b894',0],[-23,2,8,23,4,'terrace','#b78068',0],[24,4,9,17,9,'bay','#d5c9a8',.13]]},
  {id:'passageCampus',name:'穿廊與空橋複合街廓',x:-6,z:106,w:36,d:23,n:7,floors:'5–7F · 空橋／退台',detail:'不同進深的兩棟住宅形成步行穿廊，以玻璃空橋連接。屋頂露台與綠化退台銜接中央街區，沒有每棟獨立方形草坪。',blocks:[[-10,0,13,20,7,'modern','#e4d8bc',0],[9,-3,12,12,5,'modern','#8fa9a5',0]]},
  {id:'lakesideArcade',name:'湖畔 L 形商業街廓',x:80,z:58,w:37,d:35,n:4,floors:'3–4F · 連續騎樓',detail:'沿湖長翼與後方側翼形成不等邊 L 形街廓；石材拱廊、店面遮棚和高低屋頂沿同一街面連接，湖岸保留公共活動空間。',blocks:[[0,-6,30,10,4,'arcade','#ddc9a6',0],[11,6,10,22,3,'arcade','#c79679',0]]},
  {id:'marketHall',name:'鋸齒屋頂市集與鐘樓',x:80,z:110,w:39,d:15,n:7,floors:'3F 市集＋7F 鐘樓',detail:'寬而長的磚造市場搭配偏置鐘樓。連續採光鋸齒屋頂與拱形開口，形成不同於住宅及玻璃辦公樓的公共街區。',blocks:[[0,0,30,12,3,'market','#ba8069',0],[15,-1,6,8,7,'clock','#d6c5a1',0]]},
  {id:'museumWalk',name:'文化廣場與狹長展廊',x:-11,z:76,w:29,d:5,n:2,floors:'2F · 狹長公共展廊',detail:'低矮的狹長展廊與原有弧頂文化場館共享公共廣場，讓城市除了住宅和高樓，也有大面積、低高度的公共設施。',blocks:[[0,0,29,5,2,'gallery','#e6dec9',0]]},
  {id:'angledApartment',name:'斜向窄基地公寓',x:14,z:108,w:9,d:15,n:5,floors:'5F · 斜向窄基地',detail:'狹長基地採斜向配置，以凸窗、金屬折屋頂和轉角小花園貼合水岸空間；不是等寬等深的方形建築。',blocks:[[0,0,7,13,5,'bay','#a3b6b0',-.16]]}
 ];
 for(const q of quarters){q.volumes=q.blocks.map(([dx,dz,w,d,n,style,color,angle])=>({x:q.x+dx,z:q.z+dz,w,d,n,style,color,angle}));q.height=q.n*2.8+3.5;}
 const ponds=[['centralLake','曲岸中央湖',32,61.5,18.5,14.8,1.25,1.8],['courtyardPond','內院小池',-54,108,8.6,4.2,.9,1.1],['southLake','狹長水岸湖',39,107,14,6.2,1.1,1.4],['woodlandPond','林間小池',-107,8,5.1,9.8,1,1.2]].map(([id,name,x,z,rx,rz,shore,width])=>{x+=(random()-.5)*.6;z+=(random()-.5)*.6;const points=outline(x,z,rx,rz,random()*6.28,random),bank=expand(points,x,z,shore),walk=expand(bank,x,z,width);return {id,name,x,z,points,bank,walk,w:rx*2+shore*2,d:rz*2+shore*2,height:1,n:0,floors:id==='centralLake'?'自然湖泊':'自然池塘',anchor:new THREE.Vector3(x,2,z),detail:'不規則岸線、低於草地的水面與沿岸植栽。水域由固定種子的布局產生，每次重新載入保持位置，不會任意穿過建築或道路。'};});
 const curves=[new THREE.CatmullRomCurve3([[-90,84],[-54,82],[-15,85],[20,89],[59,87],[103,84]].map(([x,z])=>new THREE.Vector3(x,0,z))),new THREE.CatmullRomCurve3([[-90,123],[-52,124],[-5,121],[39,124],[75,122],[105,117]].map(([x,z])=>new THREE.Vector3(x,0,z)))];
 return {seed,quarters,ponds,curves};
}
function planar(points){return new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));}
export function buildOrganicDistrict(art,scene,layout){const {box,shape,line,mat,geo}=art,picks=[];
 function ground(points,y,material,holes=[]){const s=planar(points);for(const hole of holes)s.holes.push(new THREE.Path(hole.map(([x,z])=>new THREE.Vector2(x,-z))));const mesh=new THREE.Mesh(new THREE.ShapeGeometry(s).rotateX(-Math.PI/2),material);mesh.position.y=y;mesh.receiveShadow=true;scene.add(mesh);return mesh;}
 function ribbon(curve,width,y,material){const points=curve.getPoints(160),vertices=[],uv=[],indices=[];for(let i=0;i<points.length;i++){const p=points[i],t=curve.getTangent(i/(points.length-1)),normal=new THREE.Vector3(-t.z,0,t.x).multiplyScalar(width/2);for(const side of [-1,1]){vertices.push(p.x+normal.x*side,y,p.z+normal.z*side);uv.push((p.x+normal.x*side)*.25,(p.z+normal.z*side)*.25);}if(i<points.length-1){const k=i*2;indices.push(k,k+3,k+2,k,k+1,k+3);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;scene.add(mesh);}
 // The two foreground boulevards bend; minor north/south streets end at T junctions.
 for(const curve of layout.curves){ribbon(curve,10.5,.185,art.pavement);ribbon(curve,6.5,.225,art.asphalt);const length=curve.getLength();for(let d=2;d<length-2;d+=6){const p=curve.getPointAt(d/length),t=curve.getTangentAt(d/length);const stripe=box('#eee4c6',p.x,.24,p.z,2.6,.012,.12);stripe.rotation.y=-Math.atan2(t.z,t.x);stripe.castShadow=false;}for(const p of curve.getPoints(100))art.reserve(p.x,p.z,11,11);}
 // Shared facade shapes keep true 3D frames, arches, bays and roofs inexpensive to instance.
 const arch=new THREE.Shape();arch.moveTo(-.5,-.5);arch.lineTo(.5,-.5);arch.lineTo(.5,0);arch.absarc(0,0,.5,0,Math.PI,false);arch.lineTo(-.5,-.5);geo.districtArch=new THREE.ShapeGeometry(arch,10);
 const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,-.5,.5,0,-.5,.5,0,.5,-.5,0,.5,-.5,.5,0,.5,.5,0],3));roof.setIndex([0,4,5,0,5,1,3,2,5,3,5,4,0,3,4,1,5,2]);roof.computeVertexNormals();geo.districtRoof=roof;
 const glass=mat('#52828b',.3,.15),darkGlass=mat('#365b68',.3,.2),trim=mat('#eee3cc'),stone=mat('#e4d8bf'),roofMat=mat('#546b72',.7,.15);
 function facade(group,w,d,n,style){const h=2.8;for(const side of [-1,1])for(let f=0;f<n;f++){const y=1.9+f*h,front=side*(d/2+.08);if(style==='modern'){box(darkGlass,0,y,front,w-.75,1.75,.09,group);for(let x=-w/2+.8;x<w/2;x+=2.3)box(trim,x,y,front+side*.1,.1,1.85,.12,group);box(trim,0,y-.98,front,w+.4,.3,.65,group);continue;}const columns=Math.max(2,Math.floor(w/2.65));for(let j=0;j<columns;j++){const x=(j-(columns-1)/2)*w/columns,ww=Math.min(1.25,w/columns-.55);if(f===0&&(style==='arcade'||style==='market')){shape('districtArch',darkGlass,x,1.6,front,ww*1.45,2.6,1,group,side===-1?Math.PI:0);box(stone,x-ww*.78,1.5,front, .2,2.9,.34,group);box(stone,x,3,front,ww*1.6,.22,.4,group);}else if(style==='bay'&&j%2===0){box(trim,x,y,front+side*.25,ww+.3,1.95,.7,group);box(glass,x,y,front+side*.62,ww,1.6,.04,group);box(trim,x,y-.92,front+side*.4,ww+.48,.16,.95,group);}else{box(trim,x,y,front,ww+.24,1.9,.13,group);box(glass,x,y,front+side*.08,ww,1.6,.05,group);box(trim,x,y,front+side*.13,.06,1.6,.05,group);}}
 box(trim,0,(f+1)*h+.15,side*(d/2+.13),w+.3,.12,.32,group);}
 for(const side of [-1,1])for(let f=0;f<n;f++)for(let j=0;j<Math.max(2,Math.floor(d/3));j++){const count=Math.max(2,Math.floor(d/3)),z=(j-(count-1)/2)*d/count;box(trim,side*(w/2+.06),1.9+f*h,z,.14,1.9,1.45,group);box(glass,side*(w/2+.14),1.9+f*h,z,.04,1.6,1.2,group);}
 }
 for(const q of layout.quarters){for(const v of q.volumes){const group=new THREE.Group();group.position.set(v.x,0,v.z);group.rotation.y=v.angle;scene.add(group);const h=v.n*2.8+.4;
 box(stone,0,.2,0,v.w+.5,.4,v.d+.5,group);box(v.color,0,h/2,0,v.w,h,v.d,group);facade(group,v.w,v.d,v.n,v.style);
 if(v.style==='market'){for(let k=0;k<5;k++){const x=-v.w/2+(k+.5)*v.w/5;shape('districtRoof',roofMat,x,h,0,v.d+1,3,v.w/5,group,Math.PI/2);box(glass,x,h+1.35,0,.16,1.2,v.d*.8,group);}for(let x=-v.w/2+2;x<v.w/2;x+=4){box('#c28c56',x,2.5,v.d/2+.8,3.2,.18,1.6,group);}}
 else if(v.style==='modern'){box(stone,0,h+.18,0,v.w+.8,.36,v.d+.8,group);box('#8b9d61',0,h+.42,0,v.w-1,.14,v.d-1,group);box(trim,0,h+1.1,-v.d/2,v.w,.75,.2,group);for(let k=0;k<5;k++)shape('leaf','#6c8c49',-v.w/2+1.4+k*(v.w-3)/4,h+.9,v.d/2-1, .8,.7,.7,group);box('#c7c5b3',v.w*.15,h+1.1,-v.d*.15,v.w*.45,1.5,v.d*.35,group);}
 else if(v.style==='gallery'){shape('districtRoof',roofMat,0,h,0,v.w+1,2,v.d+1,group);for(let x=-v.w/2;x<=v.w/2;x+=2.6){box(stone,x,h/2,v.d/2+1.3,.28,h,.28,group);}box(stone,0,h,v.d/2+1.1,v.w+.4,.25,2.5,group);}
 else if(v.style==='clock'){box(stone,0,h+.25,0,v.w+1,.5,v.d+1,group);shape('cone','#5b796e',0,h+2.2,0,v.w*.65,3.7,v.d*.65,group);shape('cyl','#eee8d6',0,h-1.7,v.d/2+.2,1.3,.15,1.3,group).rotation.x=Math.PI/2;line('#4c5b58',[0,h-1.7,v.d/2+.3],[0,h-.85,v.d/2+.3],.07,group);line('#4c5b58',[0,h-1.7,v.d/2+.3],[.65,h-2,v.d/2+.3],.07,group);}
 else {shape('districtRoof',v.style==='terrace'?mat('#a66d53'):roofMat,0,h,0,v.w+.7,2.8,v.d+.7,group);for(let x=-v.w/2+2;x<v.w/2-1;x+=4.2){box(trim,x,h+.55,v.d*.22,1.8,1.5,1.8,group);box(glass,x,h+.6,v.d*.22+.92,1.2,.9,.06,group);shape('districtRoof',roofMat,x,h+1.3,v.d*.22,2.1,1.2,2.2,group);}}
 // Shared sidewalk ribbons follow each actual wing, rather than one lawn pad per house.
 box(art.pavement,0,.055,0,v.w+2.1,.09,v.d+2.1,group);
 const bw=Math.abs(Math.cos(v.angle))*v.w+Math.abs(Math.sin(v.angle))*v.d,bd=Math.abs(Math.cos(v.angle))*v.d+Math.abs(Math.sin(v.angle))*v.w;art.reserve(v.x,v.z,bw+2.2,bd+2.2);
 const pick=new THREE.Mesh(new THREE.BoxGeometry(v.w,h+2.8,v.d),new THREE.MeshBasicMaterial({visible:false}));pick.position.set(v.x,(h+2.8)/2,v.z);pick.rotation.y=v.angle;pick.userData.sample=q.id;scene.add(pick);picks.push(pick);
 }
 q.anchor=new THREE.Vector3(q.x,q.height+3,q.z);}
 // Continuous civic forecourt, rather than separate square lawns.
 art.slab(art.pavement,-11,72,34,8,.035,.04);
 // Pedestrian connection between unequal campus volumes.
 box('#476c79',-7,10.8,105,9,2.2,3.8);box(glass,-7,11,107,8.6,1.7,.12);box(trim,-7,12.05,105,9.4,.25,4.1);
 const ripples=art.texture(128,(ctx,s)=>{ctx.fillStyle='#8080ff';ctx.fillRect(0,0,s,s);for(let i=0;i<32;i++){ctx.strokeStyle=`rgb(${120+i%4*5},128,252)`;ctx.beginPath();ctx.moveTo(0,i*4);ctx.bezierCurveTo(32,i*4+2,96,i*4-2,s,i*4);ctx.stroke();}});ripples.colorSpace=THREE.NoColorSpace;ripples.repeat.set(12,12);
 const water=new THREE.MeshPhysicalMaterial({color:'#498f9f',roughness:.28,metalness:.05,envMapIntensity:.65,normalMap:ripples,normalScale:new THREE.Vector2(.16,.16)});
 for(const p of layout.ponds){if(p.id==='centralLake'||p.id==='courtyardPond')ground(p.walk,.035,art.pavement,[p.bank]);ground(p.bank,-.018,mat('#c5bf91'),[p.points]);p.mesh=ground(p.points,-.085,water);p.mesh.userData.sample=p.id;picks.push(p.mesh);
 for(let i=0;i<p.bank.length;i+=i%3===0?9:5){const a=p.bank[i],b=p.points[i],v=new THREE.Vector2(a[0]-b[0],a[1]-b[1]).normalize();for(let k=0;k<3;k++){const x=b[0]+v.x*(.35+k*.17),z=b[1]+v.y*(.35+k*.17);if(k===0)shape('leaf','#b5af91',x,.14,z,.34,.22,.27);else{for(let reed=0;reed<3;reed++)line(k%2?'#789159':'#99a66f',[x+reed*.11,-.02,z],[x+reed*.11+.09,.6+reed*.14,z+.08],.023);}}}
 }
 // One crossing, kept distinct from the walking shorelines of the other three water bodies.
 const bridge=new THREE.Group();bridge.position.set(32,.36,61);bridge.rotation.y=-.38;scene.add(bridge);box('#b79669',0,0,0,40,.3,2.5,bridge);for(let x=-19.5;x<20;x+=.8)box('#92784f',x,.18,0,.045,.03,2.5,bridge);for(const side of [-1,1]){line('#8a927e',[-20,1.4,side*1.25],[20,1.4,side*1.25],.065,bridge);for(let x=-20;x<=20;x+=2.5)line('#8a927e',[x,.15,side*1.25],[x,1.4,side*1.25],.055,bridge);}for(const x of [-20,20])box('#c6ba99',x,-.05,0,2,.35,3,bridge);
 return {picks,ripples};
}
