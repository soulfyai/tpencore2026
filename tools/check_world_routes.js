(()=>{
 const C=CITY3D,P=C.PEOPLE,W=C.WORLD,check=(ok,message)=>{if(!ok)throw Error(message)};
 const ships=P.ships.filter(s=>s.international),planes=P.planes.filter(p=>p.kind==='international');
 check(ships.length===(P.list.length>500?4:3),'international ship routes missing');
 check(planes.length===2&&P.planes.filter(p=>p.kind==='shuttle').length===2,'regional / international flights');
 const pip=(x,z,poly)=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i][1]>z)!==(poly[j][1]>z)&&x<(poly[j][0]-poly[i][0])*(z-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0])inside=!inside;return inside};
 const segmentDistance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)};
 for(const s of ships){
   check(Math.hypot(s.bx-s.ax,s.bz-s.az)>100,'ocean route too short');
   for(let k=0;k<=400;k++){const t=k/400,x=s.ax+(s.bx-s.ax)*t,z=s.az+(s.bz-s.az)*t;
     check([...W.cities.values()].every(c=>!pip(x,z,c.seaGuard||c.coast)),'ocean ship crosses land');
     check(W.bridges.every(b=>segmentDistance(x,z,b.a,b.b)>4.8),'ocean ship crosses bridge');
     check(C.ENV.seaObstacles.every(o=>Math.hypot(x-o.x,z-o.z)>o.radius+3.8),'ocean ship crosses islet');
   }
 }
 const actors=[...ships,...planes],saved=actors.map(a=>({a,t:a.t,wait:a.wait,dir:a.dir}));
 const bodyMaterial=P.ships.find(s=>!s.international).g.children[0].material;
 for(const a of actors)check(a.fade.every(([m])=>m!==bodyMaterial),'shared material fades local actors');
 let nearest=Infinity;
 for(let k=0;k<1200;k++){
   P.updatePlanes(.25,k*.25,true);
   for(let i=0;i<P.planes.length;i++)for(let j=i+1;j<P.planes.length;j++)nearest=Math.min(nearest,P.planes[i].g.position.distanceTo(P.planes[j].g.position));
 }
 check(nearest>3,'aircraft routes too close: '+nearest);
 for(const a of actors){a.t=.45;a.wait=0;}
 P.updateShips(0,0,false);P.updatePlanes(0,0,false);
 check(actors.every(a=>a.g.visible&&a.fade.every(([m])=>m.opacity>.95)),'mid-route visibility');
 const frozen=actors.map(a=>a.t);P.updateShips(1,1,false);P.updatePlanes(1,1,false);
 check(actors.every((a,i)=>a.t===frozen[i]),'reduced-motion routes move');
 for(const a of actors){a.t=a.dir>0?.99999:.00001;a.wait=0;}
 P.updateShips(1,0,true);P.updatePlanes(1,0,true);
 check(actors.every(a=>a.wait>0&&!a.g.visible),'route reset teleports visibly');
 for(const {a,t,wait,dir} of saved)Object.assign(a,{t,wait,dir});
 P.updateShips(0,0,false);P.updatePlanes(0,0,false);
 MAP3D.panorama();C.snapshot();
 return {internationalShips:ships.length,internationalPlanes:planes.length,planes:P.planes.length,ships:P.ships.length,minAircraftDistance:nearest};
})()
