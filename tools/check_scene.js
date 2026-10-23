(()=>{
 const check=(x,m)=>{if(!x)throw new Error(m)}, C=CITY3D,P=C.PEOPLE,W=C.WORLD;
 const roles=['office','commuter','student','elder','parent','worker','hiker','umbrella','balloonkid','tourist','farmer'];
 check(roles.every(r=>P.list.some(p=>p.role===r))&&new Set(P.list.map(p=>p.role)).size===11,'missing brick-figure roles');
 check(P.stats.people===P.list.length,'citizen statistics');
 const props=[...new Set(P.list.flatMap(p=>p.parts.map(q=>q.im)))];
 check(props.length===5&&props.every(m=>m.isInstancedMesh),'five instanced prop pools');
 for(const k of ['rbox','cyl','dome','sph','cone'])check(P.stats.props[k]===P.list.reduce((n,p)=>n+p.props.filter(q=>q.g===k).length,0),'prop pool capacity '+k);
 const citizenMeshes=C.scene.children.filter(m=>m.isInstancedMesh&&(m.material===props[0].material||m.geometry.type==='CapsuleGeometry'));
 check(citizenMeshes.length===12,'seven base meshes plus five prop pools');
 const carriers=[P.list[0].s,P.ships[0].t,P.planes[1].t];
 for(let i=0;i<12;i++)P.update(1/30,i/30,true);
 check(P.list[0].s!==carriers[0] || P.list[0].wait>0,'citizen motion');
 check(P.ships[0].t!==carriers[1],'ship motion');check(P.planes[1].t!==carriers[2],'plane motion');
 const originalCamera=C.camera.position.clone();
 const citizenMatrices=()=>{
   check(citizenMeshes.every(m=>m.visible&&Array.from(m.instanceMatrix.array).every(Number.isFinite)&&m.instanceMatrix.array.some(v=>v!==0)),'citizen prop visibility / transforms');
   check(P.list.every(p=>['bodyLoc','hipLoc','headLoc','topLoc'].every(k=>p[k].elements.every(Number.isFinite))&&p.parts.every(q=>q.i>=0&&q.i<q.im.count&&q.m.elements.every(Number.isFinite))),'citizen local transforms');
 };
 C.camera.position.copy(C.controls.target).add(new C.camera.position.constructor(3,2,3));P.update(0,0,false);citizenMatrices();
 C.camera.position.copy(originalCamera);P.update(0,0,false);citizenMatrices();
 const named=W.bridges.filter(b=>b.name);check(named.length===2,'both named bridges required');
 const [a,b]=named,dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
 const gap=Math.min(dist(a.a,b.a),dist(a.b,b.b));check(gap>=W.namedBridgeSpacing,'bridge spacing');
 const cross=(a,b,c,d)=>{const v=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);return v(a,b,c)*v(a,b,d)<0&&v(c,d,a)*v(c,d,b)<0};
 for(let i=0;i<W.bridges.length;i++)for(let j=i+1;j<W.bridges.length;j++)check(!cross(W.bridges[i].a,W.bridges[i].b,W.bridges[j].a,W.bridges[j].b),'bridge intersection');
 const pip=(p,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++)if((P[i][1]>p[1])!==(P[j][1]>p[1])&&p[0]<(P[j][0]-P[i][0])*(p[1]-P[i][1])/(P[j][1]-P[i][1])+P[i][0])c=!c;return c};
 for(const b of named)for(let i=1;i<100;i++){const p=[b.a[0]+(b.b[0]-b.a[0])*i/100,b.a[1]+(b.b[1]-b.a[1])*i/100];check([...W.cities.values()].every(c=>!pip(p,c.coast)),'named bridge crosses land')}
 // Verify the generated scene, including multi-cell policies and real item hit boxes.
 check(W.hexCells.length>55&&W.hexRadius>0,'hex city fabric');
 const ids=new Set();
 for(const cell of W.hexCells){
   check(!ids.has(cell.id),'duplicate hex');ids.add(cell.id);
   check(cell.poly.length===6,'hex sides');
   for(let k=0;k<6;k++){
     check(Math.abs(dist(cell.poly[k],cell.poly[(k+1)%6])-W.hexRadius)<1e-6,'equal hex edge length');
     check(pip(cell.poly[k],W.cities.get(cell.city).coast),'hex outside coastline');
   }
 }
 check(new Set(C.islands.map(i=>i.id)).size===55&&W.bodies.size===55,'stable policy IDs');
 for(const isl of C.islands){
   check(isl.cells.length>=1&&isl.cells.length<=3,'policy hex count');
   const seen=new Set([isl.cells[0]]);
   for(let pass=0;pass<3;pass++)for(const cell of isl.cells)if([...seen].some(a=>Math.abs(dist(a.c,cell.c)-W.hexRadius*Math.sqrt(3))<1e-6))seen.add(cell);
   check(seen.size===isl.cells.length,'disconnected policy group');
   for(const item of isl.t.items){const box=C.ITEMS3D.get(item.id)?.box;check(box&&!box.isEmpty()&&[...box.min.toArray(),...box.max.toArray()].every(Number.isFinite),'missing item model '+item.id);}
 }
 check(Object.values(W.buildingCounts).every(n=>n>0),'all six zone skylines');
 check(C.ITEMS3D.size===C.islands.reduce((n,i)=>n+i.t.items.length,0),'complete policy items');
 check(LANDMARKS3D.length===34,'preserve all landmarks');
 for(const [id,site] of Object.entries(W.landmarkSites)){
   const L=LANDMARKS3D.find(l=>l.id===id);check(L&&Math.abs(L.isl.c.x+L.x-site.x)<1e-6&&Math.abs(L.isl.c.z+L.z-site.z)<1e-6&&L.sc===site.sc,'landmark site '+id);
 }
 for(const isl of [C.islands.find(i=>i.cells.length===1),C.islands.find(i=>i.cells.length>1)].filter(Boolean)){
   MAP3D.focusTheme(isl.id);C.snapshot();
   const buttons=[...document.querySelectorAll('.callout button[data-item]')];
   check(buttons.length===isl.t.items.length&&buttons.every(b=>C.ITEMS3D.has(b.dataset.item)),'theme bubble item links');
   buttons[0].click();check(APP.state.selItem===buttons[0].dataset.item,'bubble item selection');
 }
 const plans=W.blockPlans.filter(p=>p.buildings.length),byCell=new Map(plans.map(p=>[p.cell,p]));
 check(new Set(plans.map(p=>p.plan)).size>=6,'distinct block organisations');
 check(new Set(plans.flatMap(p=>p.buildings.map(b=>b.type))).size>=10,'distinct architecture types');
 for(const city of ['taipei','newtaipei','keelung','taoyuan'])check(new Set(plans.filter(p=>p.city===city).map(p=>p.plan)).size>=5,'city block variety '+city);
 for(const cell of W.hexCells){
   const a=byCell.get(cell.id);if(!a)continue;
   for(const [q,r] of [[1,0],[0,1],[-1,1]]){const b=byCell.get(`${cell.city}:${cell.q+q}:${cell.r+r}`);if(b)check(a.plan!==b.plan,'repeated adjacent block layout');}
 }
 check(W.streetTypes.pedestrian>0&&W.streetTypes.road>W.streetTypes.pedestrian,'street hierarchy');
 for(const city of ['taipei','newtaipei','keelung','taoyuan']){
   const buildings=plans.filter(p=>p.city===city).flatMap(p=>p.buildings);
   for(const type of ['fire','police','hospital'])check(buildings.some(b=>b.type===type),'public facility '+city+' '+type);
   for(const floors of [10,15,20])check(buildings.some(b=>b.type==='highrise'&&b.floors===floors),'high-rise floors '+city+' '+floors);
 }
 const toolbar=document.querySelector('.hi-toolbar'),landmarks=toolbar.querySelector('.lmbtn'),tour=toolbar.querySelector('.hi-tourbtn'),modes=toolbar.querySelector('.hi-modes');
 check(landmarks&&tour&&modes,'integrated map tools');
 if(innerWidth>860){const a=landmarks.getBoundingClientRect(),b=tour.getBoundingClientRect(),c=modes.getBoundingClientRect();check(a.right<=b.left&&b.right<=c.left&&Math.abs(a.top-c.top)<8,'desktop toolbar order');}
 landmarks.click();check(landmarks.getAttribute('aria-pressed')==='true','landmark toggle');landmarks.click();
 tour.click();check(!document.querySelector('.hi-tour').hidden,'tour start');document.querySelector('.hi-tour [data-a=end]').click();check(document.querySelector('.hi-tour').hidden&&!tour.hidden,'tour end');
 check(modes.querySelector('[data-mode=list]').getAttribute('aria-label')==='政策清單'&&modes.querySelector('[data-mode=time]').getAttribute('aria-label')==='政策進度','policy mode labels');
 C.ENV.forced={minute:660,w:{code:1,cloud:10,wind:10,temp:25}};C.ENV.apply();MAP3D.panorama();check(C.ENV.state.minute===660&&C.ENV.lampsOn===0,'day mode reset');
 document.querySelector('.hi-brandbtn').click();
 for(const city of ['taipei','newtaipei','keelung','taoyuan']){document.querySelector('.hi-cities [data-city='+city+']').click();check(document.querySelector('.hi-cities [data-city='+city+']').getAttribute('aria-selected')==='true','city switch');const wx=document.querySelector('.hi-pop .wx');check(wx.dataset.city===city&&wx.querySelectorAll(':scope > span').length===2,'selected-city weather only')}
 MAP3D.panorama();document.querySelector('.hi-brandbtn').click();
 const r=document.querySelector('.notice').getBoundingClientRect(), l=document.querySelector('.lmbtn').getBoundingClientRect();
 check(l.bottom<=r.top,'landmark control behind notice');
 return {roles:Object.fromEntries(roles.map(r=>[r,P.list.filter(p=>p.role===r).length])),people:P.list.length,propBatches:props.length,hexRadius:W.hexRadius,hexCells:W.hexCells.length,partBatches:C.batches.size,blockTypes:new Set(plans.map(p=>p.plan)).size,architectureTypes:new Set(plans.flatMap(p=>p.buildings.map(b=>b.type))).size,streets:W.streetTypes,waterfrontPlots:W.waterfrontPlots.length,buildings:W.buildingCounts,bridges:W.bridges.length,gap,requiredGap:W.namedBridgeSpacing,ships:P.ships.length,planes:P.planes.length,shadows:C.renderer.shadowMap.enabled};
})()
