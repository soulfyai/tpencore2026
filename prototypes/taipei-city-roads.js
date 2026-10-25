import * as THREE from 'three';

const rounded=n=>Math.round(n*1e5)/1e5;
export const ROAD_LEVELS=Object.freeze({asphalt:.12,pavement:.18,grass:.01});
// Union axis-aligned street sections on a shared grid. Asphalt and sidewalks own
// disjoint cells; junctions never contain stacked, coplanar road rectangles.
export function createRoadSurfacePlan(roads){
 const rectangles=[],markings=[],junctions=new Map();
 for(const rd of roads){const [a,b]=[rd.a,rd.b],horizontal=Math.abs(a[0]-b[0])>Math.abs(a[1]-b[1]),x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,length=Math.hypot(b[0]-a[0],b[1]-a[1]),width=rd.pedestrian?2.8:4.8;
  for(const [kind,w,len] of [[1,width+1.9,length+1],...(rd.pedestrian?[]:[[2,width,length+.15]])]){const sx=horizontal?len:w,sz=horizontal?w:len;rectangles.push({kind,x0:rounded(x-sx/2),x1:rounded(x+sx/2),z0:rounded(z-sz/2),z1:rounded(z+sz/2)});}
  if(!rd.pedestrian)for(let p=5;p<length-4;p+=3.7){const t=p/length,px=a[0]+(b[0]-a[0])*t,pz=a[1]+(b[1]-a[1])*t;markings.push({kind:'center',x:px,z:pz,w:horizontal?1.7:.18,d:horizontal?.18:1.7});}
  for(const point of [a,b]){const key=point.map(v=>v.toFixed(3)).join('/');if(!junctions.has(key))junctions.set(key,[]);junctions.get(key).push({...rd,horizontal});}
 }
 // A full join at each node fills the outside quadrant of L bends as well as
 // crossings. Butt-ended segment rectangles alone leave a white corner notch.
 for(const [key,edges] of junctions){if(edges.length<2)continue;const [x,z]=key.split('/').map(Number),vehicle=edges.some(r=>!r.pedestrian);for(const [kind,width] of [[1,vehicle?6.7:4.7],...(vehicle?[[2,4.8]]:[])])rectangles.push({kind,x0:rounded(x-width/2),x1:rounded(x+width/2),z0:rounded(z-width/2),z1:rounded(z+width/2)});}
 let crossingIndex=0;for(const [key,edges] of junctions){if(edges.length<3||crossingIndex++%3)continue;const [x,z]=key.split('/').map(Number),rd=edges.find(r=>!r.pedestrian);if(!rd)continue;const other=Math.hypot(rd.a[0]-x,rd.a[1]-z)<.1?rd.b:rd.a,dx=rd.horizontal?Math.sign(other[0]-x):0,dz=rd.horizontal?0:Math.sign(other[1]-z);for(let k=0;k<5;k++)markings.push({kind:'crossing',x:x+dx*(4.2+k*.8),z:z+dz*(4.2+k*.8),w:rd.horizontal?.4:4.3,d:rd.horizontal?4.3:.4});}
 const xs=[...new Set(rectangles.flatMap(r=>[r.x0,r.x1]))].sort((a,b)=>a-b),zs=[...new Set(rectangles.flatMap(r=>[r.z0,r.z1]))].sort((a,b)=>a-b),nx=xs.length-1,nz=zs.length-1,xIndex=new Map(xs.map((x,i)=>[x,i])),zIndex=new Map(zs.map((z,i)=>[z,i])),mask=new Uint8Array(nx*nz);
 for(const r of rectangles){for(let j=zIndex.get(r.z0);j<zIndex.get(r.z1);j++)for(let i=xIndex.get(r.x0);i<xIndex.get(r.x1);i++)mask[j*nx+i]|=r.kind;}
 const cells=new Uint8Array(mask.length);for(let i=0;i<mask.length;i++)cells[i]=mask[i]&2?2:mask[i]&1?1:0;
 const visited=new Uint8Array(cells.length),faces=[];let asphaltArea=0,pavementArea=0;
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const kind=cells[j*nx+i];if(!kind||visited[j*nx+i])continue;let end=i+1;while(end<nx&&cells[j*nx+end]===kind&&!visited[j*nx+end])end++;let bottom=j+1;outer:while(bottom<nz){for(let k=i;k<end;k++)if(cells[bottom*nx+k]!==kind||visited[bottom*nx+k])break outer;bottom++;}for(let row=j;row<bottom;row++)visited.fill(1,row*nx+i,row*nx+end);const face={kind,x0:xs[i],x1:xs[end],z0:zs[j],z1:zs[bottom]},area=(face.x1-face.x0)*(face.z1-face.z0);if(kind===2)asphaltArea+=area;else pavementArea+=area;faces.push(face);}
 return {xs,zs,nx,nz,cells,faces,markings,asphaltArea,pavementArea};
}
export function createTaipeiRoads(art,scene,renderer,roads){
 const plan=createRoadSurfacePlan(roads),positions={1:[],2:[]},uvs={1:[],2:[]},walls=[];
 function top(face){const y=face.kind===2?ROAD_LEVELS.asphalt:ROAD_LEVELS.pavement,p=positions[face.kind],uv=uvs[face.kind];for(const [x,z] of [[face.x0,face.z0],[face.x0,face.z1],[face.x1,face.z1],[face.x0,face.z0],[face.x1,face.z1],[face.x1,face.z0]]){p.push(x,y,z);uv.push(x*.25,z*.25);}}
 for(const face of plan.faces)top(face);
 const {xs,zs,nx,nz,cells}=plan;
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){if(cells[j*nx+i]!==1)continue;for(const [di,dj,a,b] of [[-1,0,[xs[i],zs[j]],[xs[i],zs[j+1]]],[1,0,[xs[i+1],zs[j+1]],[xs[i+1],zs[j]]],[0,-1,[xs[i+1],zs[j]],[xs[i],zs[j]]],[0,1,[xs[i],zs[j+1]],[xs[i+1],zs[j+1]]]]){const ii=i+di,jj=j+dj,other=ii<0||jj<0||ii>=nx||jj>=nz?0:cells[jj*nx+ii];if(other===1)continue;const bottom=other===2?ROAD_LEVELS.asphalt:ROAD_LEVELS.grass,top=ROAD_LEVELS.pavement;walls.push(a[0],bottom,a[1],b[0],top,b[1],a[0],top,a[1],a[0],bottom,a[1],b[0],bottom,b[1],b[0],top,b[1]);}}
 const minX=xs[0]-1,minZ=zs[0]-1,spanX=xs.at(-1)-xs[0]+2,spanZ=zs.at(-1)-zs[0]+2;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=Math.min(4096,renderer.capabilities.maxTextureSize);const ctx=canvas.getContext('2d');ctx.fillStyle='#000000';ctx.fillRect(0,0,canvas.width,canvas.height);
 for(const mark of plan.markings){ctx.fillStyle=mark.kind==='crossing'?'#00ff00':'#ff0000';ctx.fillRect((mark.x-mark.w/2-minX)/spanX*canvas.width,(mark.z-mark.d/2-minZ)/spanZ*canvas.height,mark.w/spanX*canvas.width,mark.d/spanZ*canvas.height);}
 const mask=new THREE.CanvasTexture(canvas);mask.colorSpace=THREE.NoColorSpace;mask.flipY=false;mask.minFilter=THREE.LinearMipmapLinearFilter;mask.magFilter=THREE.LinearFilter;mask.anisotropy=renderer.capabilities.getMaxAnisotropy();
 const asphalt=art.asphalt.clone();asphalt.name='Taipei road with integrated paint';asphalt.onBeforeCompile=shader=>{shader.uniforms.roadPaint={value:mask};shader.uniforms.roadBounds={value:new THREE.Vector4(minX,minZ,spanX,spanZ)};shader.uniforms.roadLineColor={value:new THREE.Color('#e5dfbf')};shader.uniforms.roadCrossingColor={value:new THREE.Color('#ebe9d7')};shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vRoadXZ;').replace('#include <project_vertex>','vRoadXZ=(modelMatrix*vec4(transformed,1.)).xz;\n#include <project_vertex>');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vRoadXZ;\nuniform sampler2D roadPaint;\nuniform vec4 roadBounds;\nuniform vec3 roadLineColor;\nuniform vec3 roadCrossingColor;').replace('#include <map_fragment>','#include <map_fragment>\nvec2 marks=texture2D(roadPaint,(vRoadXZ-roadBounds.xy)/roadBounds.zw).rg;\ndiffuseColor.rgb=mix(diffuseColor.rgb,roadLineColor,marks.r);\ndiffuseColor.rgb=mix(diffuseColor.rgb,roadCrossingColor,marks.g);');};asphalt.customProgramCacheKey=()=> 'taipei-integrated-road-paint-v1';
 const meshes=[];for(const kind of [1,2]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions[kind],3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs[kind],2));g.computeVertexNormals();const mesh=new THREE.Mesh(g,kind===2?asphalt:art.pavement);mesh.name=kind===2?'city-asphalt-union':'city-pavement-union';mesh.receiveShadow=true;mesh.castShadow=false;scene.add(mesh);meshes.push(mesh);}
 const wallGeo=new THREE.BufferGeometry();wallGeo.setAttribute('position',new THREE.Float32BufferAttribute(walls,3));wallGeo.computeVertexNormals();const curb=new THREE.Mesh(wallGeo,art.mat('#d7d3c4'));curb.name='city-curb-edges';curb.receiveShadow=true;curb.castShadow=false;scene.add(curb);
 return {plan,meshes,curb,paintTexture:mask};
}
