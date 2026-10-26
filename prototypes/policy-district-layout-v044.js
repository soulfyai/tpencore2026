import {POLICY_SCENES} from './taipei-city-layout.js?rev=2';
import {regionalPolicyScenes} from './regional-config.js?rev=1';
export function createPolicyDistrictPlan(data){const S=14,scenes=data.city.city==='taipei'?POLICY_SCENES:regionalPolicyScenes(data),themes=new Map(data.themes.map(t=>[t.id,t]));
 const parcels=data.plannedParcels.map(p=>{const q={...p,x:p.x*S,z:p.z*S,w:p.w*S,d:p.d*S,usableW:p.usableW*S,usableD:p.usableD*S};if(p.kind==='policy'||p.kind==='amenity'){const t=themes.get(p.kind==='policy'?p.id:p.policyId),spec=p.scene||data.plannedParcels.find(v=>v.id===t.id)?.scene||scenes[t.id];if(!spec)throw Error('Missing campus type '+t.id);const [sceneKind,sceneName,sceneNote]=spec;Object.assign(q,{sceneKind,sceneName,sceneNote,theme:t});}return q;});
 return {scale:S,coast:data.coast.map(p=>p.map(v=>v*S)),landmarks:data.landmarks.map(l=>({...l,x:l.x*S,z:l.z*S,r:l.r*S})),parcels,roads:data.roads.map(r=>({...r,a:r.a.map(v=>v*S),b:r.b.map(v=>v*S),horizontal:Math.abs(r.a[0]-r.b[0])>Math.abs(r.a[1]-r.b[1])})),removedInternal:0,prunedSpurs:data.districtAudit.prunedRoads,byId:new Map(data.cells.map(c=>[c.id,c])),districtAudit:data.districtAudit};
}
function edgeDistance(x,z,coast){let best=Infinity;for(let i=0;i<coast.length;i++){const a=coast[i],b=coast[(i+1)%coast.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}return best;}
export function plantPolicyDistrictLandscape(art,plan){const xs=plan.coast.map(p=>p[0]),zs=plan.coast.map(p=>p[1]),before=art.treeSites.length,parks=plan.parcels.filter(p=>p.kind==='park');let candidates=0;
 for(let z=Math.min(...zs)+3;z<Math.max(...zs)-3;z+=8.5)for(let x=Math.min(...xs)+3;x<Math.max(...xs)-3;x+=8.5){const xx=x+art.between(-1.5,1.5),zz=z+art.between(-1.5,1.5),shore=edgeDistance(xx,zz,plan.coast);if(shore>16&&!parks.some(p=>Math.abs(xx-p.x)<p.w/2+8&&Math.abs(zz-p.z)<p.d/2+8))continue;candidates++;art.tree(xx,zz,art.between(4.8,7.6),art.rand()<.1?1:0);}
 return {candidates,planted:art.treeSites.length-before};
}
