(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)}, C=CITY3D,P=C.PEOPLE,W=C.WORLD;
 check(new Set(P.list.map(p=>p.role)).size===10,'missing citizen roles');
 check(P.meshes.every(m=>m.isInstancedMesh),'citizens must stay instanced');
 const carriers=[P.list[0].s,P.ships[0].t,P.planes[1].t];
 for(let i=0;i<12;i++)P.update(1/30,i/30,true);
 check(P.list[0].s!==carriers[0] || P.list[0].wait>0,'citizen motion');
 check(P.ships[0].t!==carriers[1],'ship motion');check(P.planes[1].t!==carriers[2],'plane motion');
 const originalCamera=C.camera.position.clone();
 C.camera.position.copy(C.controls.target).add(new C.camera.position.constructor(3,2,3));P.update(0,0,false);
 check(P.detailVisible&&P.accessories.every(a=>a.mesh.visible),'near citizen detail');
 check(P.meshes.every(m=>Array.from(m.instanceMatrix.array).every(Number.isFinite)),'invalid citizen transform');
 check(P.accessories.every(a=>a.mesh.instanceMatrix.array.some(v=>v!==0)),'accessory matrices not populated');
 C.camera.position.copy(originalCamera);P.update(0,0,false);
 check(!P.detailVisible&&P.accessories.every(a=>!a.mesh.visible),'far citizen LOD');
 const named=W.bridges.filter(b=>b.name);check(named.length===2,'both named bridges required');
 const [a,b]=named,dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
 const gap=Math.min(dist(a.a,b.a),dist(a.b,b.b));check(gap>=W.namedBridgeSpacing,'bridge spacing');
 const cross=(a,b,c,d)=>{const v=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);return v(a,b,c)*v(a,b,d)<0&&v(c,d,a)*v(c,d,b)<0};
 for(let i=0;i<W.bridges.length;i++)for(let j=i+1;j<W.bridges.length;j++)check(!cross(W.bridges[i].a,W.bridges[i].b,W.bridges[j].a,W.bridges[j].b),'bridge intersection');
 const pip=(p,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++)if((P[i][1]>p[1])!==(P[j][1]>p[1])&&p[0]<(P[j][0]-P[i][0])*(p[1]-P[i][1])/(P[j][1]-P[i][1])+P[i][0])c=!c;return c};
 for(const b of named)for(let i=1;i<100;i++){const p=[b.a[0]+(b.b[0]-b.a[0])*i/100,b.a[1]+(b.b[1]-b.a[1])*i/100];check([...W.cities.values()].every(c=>!pip(p,c.coast)),'named bridge crosses land')}
 C.ENV.forced={minute:660,w:{code:1,cloud:10,wind:10,temp:25}};C.ENV.apply();MAP3D.panorama();check(C.ENV.state.minute===660&&C.ENV.lampsOn===0,'day mode reset');
 document.querySelector('.hi-brandbtn').click();
 for(const city of ['taipei','newtaipei','keelung','taoyuan']){document.querySelector('.hi-cities [data-city='+city+']').click();check(document.querySelector('.hi-cities [data-city='+city+']').getAttribute('aria-selected')==='true','city switch')}
 MAP3D.panorama();document.querySelector('.hi-brandbtn').click();
 const r=document.querySelector('.notice').getBoundingClientRect(), l=document.querySelector('.lmbtn').getBoundingClientRect();
 check(l.bottom<=r.top,'landmark control behind notice');
 return {roles:Object.fromEntries(P.roles.map(r=>[r,P.list.filter(p=>p.role===r).length])),people:P.list.length,accessoryBatches:P.accessories.length,bridges:W.bridges.length,gap,requiredGap:W.namedBridgeSpacing,ships:P.ships.length,planes:P.planes.length,shadows:C.renderer.shadowMap.enabled};
})()
