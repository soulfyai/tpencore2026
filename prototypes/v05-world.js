import * as THREE from 'three';
import {createStreetArt} from './street-art-kit.js?rev=2';
import {createTaipeiRoads} from './taipei-city-roads.js?rev=2';
export const GEOGRAPHY=await fetch('./v05-geography.json').then(r=>{if(!r.ok)throw Error('Geography unavailable');return r.json();});
const S=14;
function pip(x,z,a){let v=false;for(let i=0,j=a.length-1;i<a.length;j=i++){const p=a[i],q=a[j];if((p[1]>z)!==(q[1]>z)&&x<(q[0]-p[0])*(z-p[1])/(q[1]-p[1])+p[0])v=!v;}return v;}
function inPolys(x,z,polys){return polys.some(p=>pip(x,z,p.outer)&&!p.holes.some(h=>pip(x,z,h)));}
export function heightAt(x,z){const g=GEOGRAPHY.heightGrid,u=(x-g.origin[0])/g.step,v=(z-g.origin[1])/g.step,i=Math.floor(u),j=Math.floor(v);if(i<0||j<0||i>=g.nx-1||j>=g.nz-1)return 0;const a=u-i,b=v-j,h=(ii,jj)=>g.values[jj*g.nx+ii];return (h(i,j)*(1-a)+h(i+1,j)*a)*(1-b)+(h(i,j+1)*(1-a)+h(i+1,j+1)*a)*b;}
function geometry(polys){const shapes=polys.map(p=>{const s=new THREE.Shape(p.outer.map(([x,z])=>new THREE.Vector2(x,-z)));for(const h of p.holes)s.holes.push(new THREE.Path(h.map(([x,z])=>new THREE.Vector2(x,-z))));return s;});return new THREE.ShapeGeometry(shapes).rotateX(-Math.PI/2);}
function distanceSegment(x,z,r){const [a,b]=[r.a,r.b],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}
export function buildGeographicWorld(scene,renderer,cities){
 const data=GEOGRAPHY,root=new THREE.Group();root.name='continuous-administrative-mainland';scene.add(root);
 const ground=new THREE.MeshStandardMaterial({color:'#98b87a',roughness:1});
 const base=new THREE.Mesh(geometry(data.base),ground);base.position.y=-.035;base.name='shared-mainland-base';base.receiveShadow=true;root.add(base);
 const context=new THREE.Mesh(geometry(data.context),ground);context.position.y=.001;context.name='Taiwan-mainland-context';context.receiveShadow=true;root.add(context);
 const t=data.terrain,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(t.positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(t.colors,3));g.setIndex(t.indices);g.computeVertexNormals();
 const terrain=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));terrain.name='shared-city-terrain';terrain.receiveShadow=true;root.add(terrain);
 const banks=new THREE.Mesh(geometry(data.riverBanks),new THREE.MeshStandardMaterial({color:'#a8b18c',roughness:1}));banks.position.y=-.045;root.add(banks);
 const artRoot=new THREE.Group();artRoot.name='shared-streets-and-forest';root.add(artRoot);const art=createStreetArt(renderer,artRoot);
 const grassCompile=art.grass.onBeforeCompile;art.grass.onBeforeCompile=sh=>{grassCompile(sh);sh.vertexShader=sh.vertexShader.replace('vGround=(modelMatrix*groundPoint).xyz;','vGround=(modelMatrix*groundPoint).xyz*14.;');};art.grass.customProgramCacheKey=()=> 'v05-mainland-grass';
 for(const mesh of [terrain,base,context]){const p=mesh.geometry.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i),p.getZ(i));mesh.geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));mesh.material=art.grass;}
 const roadSurface=createTaipeiRoads(art,artRoot,renderer,data.roads.map(r=>({...r,a:r.a.map(v=>v*S),b:r.b.map(v=>v*S)})));
 for(const mesh of roadSurface.meshes){if(mesh.material.name!=='Taipei road with integrated paint')continue;const compile=mesh.material.onBeforeCompile;mesh.material.onBeforeCompile=sh=>{compile(sh);sh.vertexShader=sh.vertexShader.replace('vRoadXZ=(modelMatrix*vec4(transformed,1.)).xz;','vRoadXZ=transformed.xz;');};mesh.material.customProgramCacheKey=()=> 'v05-shared-road';}
 for(const [a,b]of data.bridges){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
  for(const side of [-1,1]){const p=[(a[0]+nx*.20*side)*S,.65,(a[1]+nz*.20*side)*S],q=[(b[0]+nx*.20*side)*S,.65,(b[1]+nz*.20*side)*S];art.line('#d4d5c5',p,q,.045);for(let f=0;f<=1;f+=.25){const x=(a[0]+dx*f+nx*.20*side)*S,z=(a[1]+dz*f+nz*.20*side)*S;art.line('#8a9b91',[x,-2.2,z],[x,.65,z],.06);}}
 }
 for(const [id,polys]of Object.entries(data.cities)){const color=id==='taipei'?'#609cce':'#d6b367';for(const p of polys){const points=p.outer.map(([x,z])=>new THREE.Vector3(x,heightAt(x,z)+.055,z));points.push(points[0]);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity:.75}));line.name=id+'-administrative-boundary';root.add(line);}}
 const urban=[...cities.values()].flatMap(c=>c.plan.parcels.map(p=>({x:p.x/S,z:p.z/S,w:p.w/S,d:p.d/S}))),ponds=[...cities.values()].flatMap(c=>c.ponds.map(p=>p.points.map(v=>v.map(n=>n/S))));
 let trees=0;const tp=data.cities.taipei,nt=data.cities.newtaipei;
 const eligible=(xx,zz)=> (inPolys(xx,zz,tp)||inPolys(xx,zz,nt))&&!data.roads.some(r=>distanceSegment(xx,zz,r)<.50)&&!urban.some(p=>Math.abs(xx-p.x)<p.w/2+.38&&Math.abs(zz-p.z)<p.d/2+.38)&&!data.landmarks.some(l=>Math.hypot(xx-l.x,zz-l.z)<l.r+.5)&&!inPolys(xx,zz,data.riverWater)&&!ponds.some(p=>pip(xx,zz,p));
 // Dense groves use solid instanced canopy clusters. Reviewed urban trees keep
 // their fine leaf sprays; countryside does not multiply alpha-overdraw.
 for(let z=-38;z<45;z+=1.25)for(let x=-39;x<35;x+=1.25){const count=2+Math.floor(art.rand()*2);for(let n=0;n<count;n++){const xx=x+art.between(-.54,.54),zz=z+art.between(-.54,.54);if(!eligible(xx,zz))continue;
  const h=art.between(7,12),y=heightAt(xx,zz)*S,ax=xx*S,az=zz*S;
  art.batch('cyl','#776347',ax,y+h*.30,az,.16,h*.60,.16);
  if(art.rand()<.28){for(let k=0;k<3;k++)art.batch('cone',['#385f45','#4b7850','#668b53'][k],ax,y+h*(.46+k*.18),az,h*(.29-k*.07),h*.53,h*(.29-k*.07),0,art.rand()*6.28);}
  else for(let k=0;k<5;k++){const a=k*2.3999,r=k===4?0:h*.16,sy=k===4?.83:.68,rad=h*(k===4?.25:.21);art.batch('leaf',['#527d48','#6c914e','#7c9d53','#608648','#6f934e'][k],ax+Math.cos(a)*r,y+h*sy,az+Math.sin(a)*r,rad,rad*1.13,rad,0,art.rand()*6.28);}
  trees++;
 }}
 art.flush();artRoot.scale.setScalar(1/S);
 const ferries=[];for(let i=0;i<2;i++){const ship=new THREE.Group();ship.name='Tamsui-passenger-ferry';root.add(ship);const box=(color,x,y,z,w,h,d)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),art.mat(color));m.position.set(x,y,z);ship.add(m);};box('#e9e8da',0,0,0,.14,.065,.40);box('#315e79',0,.045,0,.115,.06,.25);box('#ece5ce',0,.083,0,.14,.018,.28);ferries.push(ship);}
 const river=new THREE.CatmullRomCurve3(data.rivers[0].points.map(([x,z])=>new THREE.Vector3(x,-.135,z)));
 const update=(time,moving)=>{if(!moving&&ferries[0].userData.placed)return;for(const [i,ship]of ferries.entries()){const t=(time*.003+i*.38)%1,p=river.getPoint(t),d=river.getTangent(t);ship.position.copy(p);ship.rotation.y=Math.atan2(d.x,d.z);ship.userData.placed=true;}};update(0,true);
 return {data,root,roadSurface,forestTrees:trees,ferries,heightAt,update};
}
