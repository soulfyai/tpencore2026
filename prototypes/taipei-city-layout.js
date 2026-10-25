// Review-only urban parcels. All policy IDs and normalized landmark positions stay intact.
export const CITY_SCALE=14;
export const POLICY_SCENES={
 'tp-transport':['transport','交通轉乘站','月台、候車棚與公車轉乘空間'],
 'tp-housing':['housing','都更住宅街廓','高低住宅、共享內院與連接裙樓'],
 'tp-ai':['research','科技研發園區','研發辦公、實驗樓、太陽能與空中連廊'],
 'tp-childcare':['childcare','托育與親子庭院','低樓層托育館、遊戲場與家長等候區'],
 'tp-education':['education','校園與營養午餐','教學樓、餐廳與戶外活動空間'],
 'tp-senior':['senior','銀髮日照與休憩','無障礙入口、日照館與遮蔭花園'],
 'tp-sports':['sports','運動場與看台','跑道、球場與觀賽遮棚'],
 'tp-youth':['youth','青年工作與交流','共享工作空間、自行車架與屋頂露台'],
 'tp-health':['health','食安檢驗與市場','檢驗室、市場棚架與無菸標示'],
 'tp-rec-transport':['transport','公共運輸街區','車站入口、站棚與轉乘設施'],
 'tp-rec-housing':['housing','住宅更新街區','錯位住宅塔樓與公共內院'],
 'tp-rec-welfare':['welfare','社區照顧中心','社福服務、友善步道與多功能活動館'],
 'tp-rec-education':['education','教育學習街區','教室、學習館及用餐空間'],
 'tp-rec-environment':['environment','環境循環與水務','資源分類、循環水槽與太陽能屋頂'],
 'tp-rec-culture':['culture','文化展演街廓','紅磚拱廊、展館與公共廣場'],
 'tp-rec-sport':['sports','體育與休閒場館','室內運動館、戶外球場與看台'],
 'tp-rec-misc':['civic','公共服務中心','市民服務大廳與開放式綠化廣場']
};
export function hash(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
const edgeKey=(a,b)=>[a,b].map(p=>p.map(v=>v.toFixed(4)).join(':')).sort().join('/');
export function createTaipeiCityPlan(data){
 const S=CITY_SCALE,half=data.half*S,byId=new Map(data.cells.map(c=>[c.id,c])),byGrid=new Map(data.cells.map(c=>[`${c.q}:${c.r}`,c])),claimed=new Map(),parcels=[];
 const landmarks=data.landmarks.map(l=>({...l,x:l.x*S,z:l.z*S,r:l.r*S}));
 const coast=data.coast.map(p=>p.map(v=>v*S));
 function inside(x,z){let yes=false;for(let i=0,j=coast.length-1;i<coast.length;j=i++){const a=coast[i],b=coast[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
 function clear(cell){const x=cell.c[0]*S,z=cell.c[1]*S;return !cell.themeId&&landmarks.every(l=>Math.hypot(Math.max(0,Math.abs(l.x-x)-half),Math.max(0,Math.abs(l.z-z)-half))>l.r+1.2)&&[[-half,-half],[-half,half],[half,-half],[half,half]].every(([dx,dz])=>inside(x+dx,z+dz));}
 function add(cells,kind,extra={}){const xs=cells.map(c=>c.c[0]*S),zs=cells.map(c=>c.c[1]*S),minX=Math.min(...xs)-half,maxX=Math.max(...xs)+half,minZ=Math.min(...zs)-half,maxZ=Math.max(...zs)+half;
 const parcel={id:extra.id||`urban-${cells[0].id}`,kind,zone:cells[0].zone,cells:cells.map(c=>c.id),x:(minX+maxX)/2,z:(minZ+maxZ)/2,w:maxX-minX,d:maxZ-minZ,usableW:maxX-minX-7.4,usableD:maxZ-minZ-7.4,...extra};parcels.push(parcel);for(const c of cells)claimed.set(c.id,parcel.id);return parcel;}
 for(const t of data.themes){const [sceneKind,sceneName,sceneNote]=POLICY_SCENES[t.id]||[];if(!sceneKind)throw Error('Unmapped policy '+t.id);add(t.cells.map(id=>byId.get(id)),'policy',{id:t.id,sceneKind,sceneName,sceneNote,theme:t});}
 const available=data.cells.filter(clear),free=new Set(available.map(c=>c.id));
 function group(cell,nq,nr){const result=[];for(let dq=0;dq<nq;dq++)for(let dr=0;dr<nr;dr++){const c=byGrid.get(`${cell.q+dq}:${cell.r+dr}`);if(!c||!free.has(c.id)||claimed.has(c.id))return null;result.push(c);}return result;}
 // Lakes occupy merged parcels with their own clearance, not arbitrary overlays on a street.
 const targets=[[-7,-4],[-7,7],[1,0],[-3,16]];
 for(let i=0;i<targets.length;i++){const [tx,tz]=targets[i];let choices=[];for(const c of available)for(const [nq,nr] of [[2,2],[2,1],[1,2]]){const g=group(c,nq,nr);if(!g)continue;const x=g.reduce((s,c)=>s+c.c[0]*S,0)/g.length,z=g.reduce((s,c)=>s+c.c[1]*S,0)/g.length;if(parcels.some(p=>p.kind==='park'&&Math.hypot(p.x-x,p.z-z)<60))continue;choices.push({g,score:Math.hypot(x-tx*S,z-tz*S)+(g.length===4?-15:0)});}choices.sort((a,b)=>a.score-b.score);if(choices[0])add(choices[0].g,'park',{id:`lake-${i}`,seed:hash(`taipei-lake-${i}`)});}
 for(const c of available.sort((a,b)=>hash(a.id)-hash(b.id))){if(claimed.has(c.id))continue;const k=hash(c.id),sizes=k%3===0?[[2,2],[1,2],[2,1]]:k%2?[[2,1],[1,2]]:[[1,2],[2,1]];let cells;for(const [nq,nr] of sizes){cells=group(c,nq,nr);if(cells)break;}cells||=[c];add(cells,'urban',{seed:k});}
 const owners=new Map();for(const c of data.cells)for(let i=0;i<4;i++){const k=edgeKey(c.poly[i],c.poly[(i+1)%4]);if(!owners.has(k))owners.set(k,[]);owners.get(k).push(c.id);}
 const distance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);};
 let removedInternal=0;const roads=[];
 for(const rd of data.roads){const ids=owners.get(edgeKey(rd.a,rd.b))||[];if(ids.length===2&&claimed.has(ids[0])&&claimed.get(ids[0])===claimed.get(ids[1])){removedInternal++;continue;}const a=rd.a.map(v=>v*S),b=rd.b.map(v=>v*S);if(landmarks.some(l=>distance(l.x,l.z,a,b)<l.r*.82))continue;roads.push({...rd,sourcePedestrian:rd.pedestrian,pedestrian:false,a,b,horizontal:Math.abs(a[0]-b[0])>Math.abs(a[1]-b[1])});}
 // Remove orphan spurs left by landmark clearance; the remaining street graph
 // is one continuous network of blocks, without half-streets ending in lawns.
 const nodeKey=p=>p.map(v=>v.toFixed(3)).join('/'),links=new Map(),removed=new Set();
 roads.forEach((r,i)=>{for(const p of [r.a,r.b]){const k=nodeKey(p);if(!links.has(k))links.set(k,new Set());links.get(k).add(i);}});
 const queue=[...links].filter(([,v])=>v.size===1).map(([k])=>k);
 while(queue.length){const k=queue.pop(),ids=links.get(k);if(ids.size!==1)continue;const i=[...ids][0];removed.add(i);for(const p of [roads[i].a,roads[i].b]){const n=nodeKey(p),edges=links.get(n);edges.delete(i);if(edges.size===1)queue.push(n);}}
 const connectedRoads=roads.filter((_,i)=>!removed.has(i));
 return {scale:S,coast,landmarks,parcels,roads:connectedRoads,removedInternal,prunedSpurs:removed.size,byId};
}
