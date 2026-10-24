/* One national flag on each city's highest eligible existing building. */
const CITY_FLAGS = {sites:[],uniforms:{uFlagTime:{value:0}}};
{
  const landmarks=new Map(LANDMARKS3D.filter(l=>!l.nature&&!l.fixed&&l.id!=="guanyin").map(l=>[l.id,l]));
  const highest=new Map();
  for(const p of parts){
    const landmark=landmarks.get(p.landmark);
    if(!p.fabric&&!landmark)continue;
    const geo=GEO[p.g]||GEO.box;if(!geo.boundingBox)geo.computeBoundingBox();
    const box=geo.boundingBox.clone().applyMatrix4(p.m),isl=islandById.get(p.isl);
    if(isl)box.translate(new THREE.Vector3(isl.c.x,0,isl.c.z));
    const center=box.getCenter(new THREE.Vector3());
    const city=landmark?.city||[...WORLD.cities].find(([,c])=>GEOM.pip(center.x,center.z,c.coast))?.[0];
    if(!LIVE_CITIES.has(city)||highest.get(city)?.y>=box.max.y)continue;
    highest.set(city,{city,x:center.x,y:box.max.y,z:center.z,isl:isl?.id||null,source:landmark?.name||"城市高樓",sourcePart:p});
  }
  const canvas=document.createElement("canvas");canvas.width=768;canvas.height=512;
  const ctx=canvas.getContext("2d");ctx.fillStyle="#fe0000";ctx.fillRect(0,0,768,512);
  ctx.fillStyle="#000095";ctx.fillRect(0,0,384,256);
  // Twelve white rays with a blue ring separating them from the central white disc.
  const cx=192,cy=128,outer=96,inner=48;
  ctx.fillStyle="#fff";ctx.beginPath();
  for(let k=0;k<24;k++){const angle=-Math.PI/2+k*Math.PI/12,r=k%2?inner:outer;const x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r;if(k)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
  ctx.closePath();ctx.fill();ctx.fillStyle="#000095";ctx.beginPath();ctx.arc(cx,cy,inner*1.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(cx,cy,inner,0,Math.PI*2);ctx.fill();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const clothMaterial=new THREE.MeshStandardMaterial({map:texture,side:THREE.DoubleSide,roughness:.92,emissive:0xffffff,emissiveMap:texture,emissiveIntensity:.08});
  clothMaterial.onBeforeCompile=shader=>{
    shader.uniforms.uFlagTime=CITY_FLAGS.uniforms.uFlagTime;
    shader.vertexShader="uniform float uFlagTime;\n"+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
      float phase=uv.x*8.0-uFlagTime*2.2+uv.y*2.0+modelMatrix[3].x*.15;
      transformed.z+=.09*uv.x*(sin(phase)+.4*sin(uv.x*14.0-uFlagTime*3.0));
      transformed.y+=.025*uv.x*sin(uv.x*5.0-uFlagTime*1.8);
    `);
  };
  clothMaterial.customProgramCacheKey=()=>"roc-national-flag-v1";
  const clothGeometry=new THREE.PlaneGeometry(.9,.6,20,12).translate(.45,.8,0);
  const poleGeometry=new THREE.CylinderGeometry(.012,.015,1.15,8).translate(0,.575,0);
  const baseGeometry=new THREE.BoxGeometry(.09,.05,.09).translate(0,.01,0);
  const metal=new THREE.MeshStandardMaterial({color:0xd7dfe6,roughness:.45,metalness:.35});
  for(const city of LIVE_CITIES){
    const site=highest.get(city);if(!site)continue;
    const group=new THREE.Group();group.name=`national-flag-${city}`;group.rotation.y=-.35;
    const cloth=new THREE.Mesh(clothGeometry,clothMaterial);cloth.name="flag-cloth";cloth.frustumCulled=false;
    const pole=new THREE.Mesh(poleGeometry,metal),base=new THREE.Mesh(baseGeometry,metal);
    group.add(base,pole,cloth);scene.add(group);
    CITY_FLAGS.sites.push({...site,group,cloth});
  }
  CITY_FLAGS.update=(time,moving)=>{
    if(moving)CITY_FLAGS.uniforms.uFlagTime.value=time;
    for(const site of CITY_FLAGS.sites)site.group.position.set(site.x,site.y+(islandById.get(site.isl)?.lift||0)+.015,site.z);
  };
  CITY_FLAGS.update(0,false);
}
