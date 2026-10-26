import {POLICY_SCENES} from './taipei-city-layout.js?rev=2';
import {regionalPolicyScenes} from './regional-config.js?rev=1';
export function createGeographicPlan(data){const S=14,scenes=data.city.city==='taipei'?POLICY_SCENES:regionalPolicyScenes(data),themes=new Map(data.themes.map(t=>[t.id,t]));
 const parcels=data.plannedParcels.map(p=>{const q={...p,x:p.x*S,z:p.z*S,w:p.w*S,d:p.d*S,usableW:p.usableW*S,usableD:p.usableD*S};if(p.kind==='policy'){const [sceneKind,sceneName,sceneNote]=scenes[p.id];Object.assign(q,{sceneKind,sceneName,sceneNote,theme:themes.get(p.id)});}return q;});
 return {scale:S,cellWidth:data.half*2,coast:data.coast.map(p=>p.map(v=>v*S)),landmarks:data.landmarks.map(l=>({...l,x:l.x*S,z:l.z*S,r:l.r*S})),parcels,roads:data.roads.map(r=>({...r,a:r.a.map(v=>v*S),b:r.b.map(v=>v*S),horizontal:Math.abs(r.a[0]-r.b[0])>Math.abs(r.a[1]-r.b[1])})),geoPonds:data.geoPonds.map(p=>({...p,x:p.x*S,z:p.z*S,w:p.w*S,d:p.d*S,usableW:p.usableW*S,usableD:p.usableD*S,points:p.points.map(a=>a.map(v=>v*S)),bank:p.bank.map(a=>a.map(v=>v*S)),walk:p.walk.map(a=>a.map(v=>v*S))})),removedInternal:0,prunedSpurs:0,byId:new Map(data.cells.map(c=>[c.id,c]))};
}
export function plantGeographicUrbanForest(art,plan,data){let candidates=0;const before=art.treeSites.length,S=plan.scale;const minx=Math.min(...data.cells.map(c=>c.c[0]))*S,maxx=Math.max(...data.cells.map(c=>c.c[0]))*S,minz=Math.min(...data.cells.map(c=>c.c[1]))*S,maxz=Math.max(...data.cells.map(c=>c.c[1]))*S;
 for(let z=minz;z<=maxz;z+=4.4)for(let x=minx;x<=maxx;x+=4.4){const xx=x+art.between(-.7,.7),zz=z+art.between(-.7,.7);if(!plan.parcels.some(p=>Math.abs(p.x-xx)<p.w/2+3&&Math.abs(p.z-zz)<p.d/2+3))continue;candidates++;art.tree(xx,zz,art.between(4.3,7.5),art.rand()<.08?1:0);}
 return {candidates,planted:art.treeSites.length-before};
}
