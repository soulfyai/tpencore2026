(()=>{
 const C=CITY3D,F=C.flags,check=(ok,message)=>{if(!ok)throw Error(message)};
 check(F.sites.length===4&&new Set(F.sites.map(s=>s.city)).size===4,'one flag per city');
 const texture=F.sites[0].cloth.material.map.image,ctx=texture.getContext('2d');
 const pixel=(x,y)=>ctx.getImageData(x,y,1,1).data;
 check(texture.width/texture.height===1.5,'flag aspect ratio');
 check(pixel(600,400)[0]>240&&pixel(600,400)[2]<5,'red field');
 check(pixel(10,10)[2]>100&&pixel(10,10)[0]<5,'blue canton');
 check(pixel(192,128).slice(0,3).every(v=>v>245),'white sun disc');
 for(let k=0;k<12;k++){
   const angle=-Math.PI/2+k*Math.PI/6;
   check(pixel(Math.round(192+80*Math.cos(angle)),Math.round(128+80*Math.sin(angle)))[0]>240,'white ray '+k);
   check(pixel(Math.round(192+80*Math.cos(angle+Math.PI/12)),Math.round(128+80*Math.sin(angle+Math.PI/12)))[0]<5,'separate sun rays');
 }
 F.update(5,true);check(F.uniforms.uFlagTime.value===5,'flag animation clock');
 F.update(9,false);check(F.uniforms.uFlagTime.value===5,'reduced-motion freeze');
 for(const site of F.sites){
   check(site.source!=='中正公園大觀音'&&(site.sourcePart.fabric||site.sourcePart.landmark),'eligible building anchor');
   const geo=site.sourcePart.mesh.geometry;if(!geo.boundingBox)geo.computeBoundingBox();
   const matrix=site.sourcePart.m.clone(),isl=C.islands.find(i=>i.id===site.isl);
   const roof=geo.boundingBox.clone().applyMatrix4(matrix);
   if(isl)roof.translate(C.camera.position.clone().set(isl.c.x,0,isl.c.z));
   check(Math.abs(site.y-roof.max.y)<1e-6,'flag anchored to rendered rooftop');
   check(site.group.position.y>site.y,'roof clearance');
   if(isl){const original=isl.lift;isl.lift=.14;F.update(0,false);check(Math.abs(site.group.position.y-site.y-.155)<1e-6,'flag follows building lift');isl.lift=original;}
 }
 F.update(0,false);MAP3D.panorama();C.snapshot();
 const gl=C.renderer.getContext();check(gl.getError()===gl.NO_ERROR,'flag rendering GL error');
 return F.sites.map(s=>({city:s.city,building:s.source,height:s.y}));
})()
