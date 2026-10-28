"""Build v0.6.2: v0.6.1 (production shell + realistic Taipei) with New Taipei placed on the real map.

New Taipei keeps its existing art kit (buildApprovedCityArt, same buildings, streets, policy campuses and
landmark models), but its plan is regenerated from the real 29-district geography so that it surrounds
Taipei exactly as on a map:
  * the realistic Taipei engine also renders the surrounding region: New Taipei's land, the Tamsui,
    Xindian, Dahan and upper Keelung rivers, and forest on New Taipei's mountains;
  * New Taipei's street cells (1.8 world units, the kit's own size) are laid on its real lowland;
  * its 9 policy themes are placed in fitting real districts, its 5 landmarks at their real sites;
  * Guandu and Danjiang bridges stand at their real Tamsui River crossings;
  * vessels whose routes were planned for the old sea are hidden while they are over land.
UI, data and Taipei behave as in v0.6.1. Production and earlier previews are untouched.
"""
import pathlib
import re
import runpy

ROOT = pathlib.Path(__file__).resolve().parents[1]
P = ROOT / "prototypes"
OUT = P / "greater-taipei-v0.6.2.html"
VERSION = "0.6.2"

base = runpy.run_path(str(ROOT / "tools" / "build_taipei_real_shell_preview.py"))

NEIGHBOR_IMPORT = "import NEWTAIPEI_GEO from './taipei-real-v062-newtaipei.js?rev=1';\n"
# Taipei-basin floor in New Taipei (Sanchong, Luzhou, Wugu lowland, Xinzhuang, Banqiao, Zhonghe, Yonghe,
# Tucheng, Shulin, the Dahan corridor to Sanxia/Yingge, north Xindian) plus flat river towns.
BASIN = ("[[121.466,25.121],[121.447,25.106],[121.432,25.092],[121.426,25.072],[121.421,25.056],[121.402,25.048],"
         "[121.386,25.036],[121.38,25.016],[121.385,24.993],[121.372,24.966],[121.352,24.948],[121.345,24.93],"
         "[121.37,24.922],[121.4,24.952],[121.43,24.963],[121.46,24.973],[121.49,24.981],[121.515,24.984],"
         "[121.532,24.966],[121.545,24.954],[121.556,24.975],[121.56,25.0],[121.53,25.03],[121.51,25.07],[121.49,25.121]]")
BASINS = [BASIN,
          # Yonghe, north Zhonghe and north Xindian along the Xindian River
          "[[121.49,25.03],[121.52,25.012],[121.535,24.995],[121.545,24.975],[121.55,24.96],[121.537,24.952],[121.52,24.975],[121.5,24.985],[121.48,24.99],[121.47,25.0],[121.475,25.02]]",
          # Xizhi on the Keelung River plain
          "[[121.612,25.058],[121.64,25.076],[121.668,25.082],[121.688,25.077],[121.678,25.058],[121.65,25.053],[121.625,25.046]]",
          # Tamsui downtown
          "[[121.42,25.172],[121.44,25.162],[121.46,25.141],[121.476,25.144],[121.47,25.162],[121.45,25.178],[121.425,25.183]]"]
NEIGHBOR_OPTS = ("neighbor:{districts:{...NEWTAIPEI_GEO.districts,基隆:NEWTAIPEI_GEO.keelung},basins:[" + ",".join(BASINS) + "],"
                 "flats:[[121.4648,25.0122,6],[121.4329,25.1752,6],[121.444,25.168,7],[121.656,25.066,6],"
                 "[121.6385,25.0705,5],[121.844,25.1094,8],[121.787,25.049,8],[121.6905,25.207,7]]},")

NEWTAIPEI = r"""
/* ===== v0.6.2: New Taipei on the real map, built with its existing art kit ===== */
{
 const real=REAL_TAIPEI.engine,g=REAL_TAIPEI.root,k=REAL_TAIPEI.scale;
 const toW=(x,z)=>{const v=g.localToWorld(new THREE.Vector3(x,0,z));return [v.x,v.z];};
 const toL=(x,z)=>{const v=g.worldToLocal(new THREE.Vector3(x,0,z));return [v.x,v.z];};
 const geoW=(lo,la)=>{const c=real.geo(lo,la);return toW(c.x,c.z);};
 const pipR=(x,z,P)=>{let s=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])s=!s;}return s;};
 const distW={};for(const [n,rings] of Object.entries(NEWTAIPEI_GEO.districts))distW[n]=rings.map(r=>r.map(([x,z])=>toW(x,z)));
 const districtAt=(x,z)=>{for(const [n,rings] of Object.entries(distW))if(rings.some(r=>pipR(x,z,r)))return n;return null;};
 const centroidW=n=>{const r=distW[n].reduce((a,b)=>b.length>a.length?b:a);let A=0,cx=0,cz=0;for(let i=0;i<r.length;i++){const p=r[i],q=r[(i+1)%r.length],c=p[0]*q[1]-q[0]*p[1];A+=c;cx+=(p[0]+q[0])*c;cz+=(p[1]+q[1])*c;}return [cx/3/A,cz/3/A];};
 const outerW=NEWTAIPEI_GEO.outer.map(([x,z])=>toW(x,z)),holeW=NEWTAIPEI_GEO.holes[0].map(([x,z])=>toW(x,z));
 // One ring that walks the outer coast and around Taipei through a zero-width slit: inside tests skip Taipei.
 let bi=0,bj=0,bd=1e9;for(let i=0;i<outerW.length;i++)for(let j=0;j<holeW.length;j++){const d=Math.hypot(outerW[i][0]-holeW[j][0],outerW[i][1]-holeW[j][1]);if(d<bd){bd=d;bi=i;bj=j;}}
 const keyhole=[...outerW.slice(0,bi+1),...holeW.slice(bj),...holeW.slice(0,bj+1),...outerW.slice(bi)];
 const baseInput=inputs.find(i=>i.city.city==='newtaipei');
 const H=.9,CS=1.8;
 const sampleAt=(x,z)=>{const [lx,lz]=toL(x,z);return real.regionSample(lx,lz);};
 const coreOK=s=>s&&s.region===2&&s.land>.95&&!s.bank&&s.e<10,edgeOK=s=>s&&s.region===2&&s.land>.7&&s.e<30;
 let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const [x,z] of outerW){x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);}
 const ZONE={板橋:'commercial',新莊:'commercial',三重:'commercial',中和:'residential',永和:'residential',新店:'technology',汐止:'technology',土城:'technology',蘆洲:'residential',淡水:'culture',八里:'environment',林口:'technology',樹林:'residential',三峽:'culture',鶯歌:'culture',五股:'environment',泰山:'residential'};
 // Landmarks at their real sites, models and scale from the kit.
 const SITE={ntcity:[121.4648,25.0122],fort:[121.4329,25.1752],jiufen:[121.844,25.1094],shifen:[121.787,25.049],queen:[121.6905,25.207]};
 const landmarks=baseInput.landmarks.map(l=>{const [x,z]=SITE[l.id]?geoW(...SITE[l.id]):[l.x,l.z];return {...l,x,z};});
 // Lay the 1.8-unit street grid at the phase that fits the most blocks on the real lowland.
 const gridAt=(px,pz)=>{const out=[];for(let q=Math.floor(x0/CS)-1;q<=Math.ceil(x1/CS);q++)for(let r=Math.floor(z0/CS)-1;r<=Math.ceil(z1/CS);r++){const x=q*CS+px,z=r*CS+pz;
  if(!coreOK(sampleAt(x,z)))continue;const d=districtAt(x,z);if(!d)continue;
  if(![[-H,-H],[H,-H],[-H,H],[H,H],[0,-H],[0,H],[-H,0],[H,0]].every(([dx,dz])=>edgeOK(sampleAt(x+dx,z+dz))))continue;
  if(landmarks.some(l=>Math.hypot(l.x-x,l.z-z)<l.r+1.2))continue;out.push({q,r,x,z,d});}return out;};
 let grid=[];for(const px of [0,.6,1.2])for(const pz of [0,.6,1.2]){const g3=gridAt(px,pz);if(g3.length>grid.length)grid=g3;}
 const cells=[],byQR=new Map();
 for(const {q,r,x,z,d} of grid){const cell={id:`newtaipei:${q}:${r}`,city:'newtaipei',q,r,c:[x,z],poly:[[x-H,z-H],[x+H,z-H],[x+H,z+H],[x-H,z+H]],zone:ZONE[d]||(hash(q*7+r)%2?'residential':'public'),district:d};
  cells.push(cell);byQR.set(q+':'+r,cell);}
 const roadKey=new Set(),roads=[];for(const c of cells)for(let i=0;i<4;i++){const a=c.poly[i],b=c.poly[(i+1)%4],key=[a,b].map(p=>p.map(v=>v.toFixed(2)).join(',')).sort().join('|');if(!roadKey.has(key)){roadKey.add(key);roads.push({a,b,pedestrian:false});}}
 // Policy themes in fitting real districts, keeping each theme's cell count close to the reviewed plan.
 const HOME=[[/交通|軌道/,'板橋'],[/居住|都更/,'三重'],[/托育|親子/,'新莊'],[/長者|照顧/,'永和'],[/醫療|口腔/,'中和'],[/教育/,'土城'],[/產業|就業|青年/,'汐止'],[/治水|防災/,'蘆洲'],[/族群|地方/,'淡水']];
 const claimed=new Set(),nearLm=(x,z)=>landmarks.some(l=>Math.hypot(l.x-x,l.z-z)<l.r+2.6);
 const SHAPES=[[4,2],[3,2],[2,2],[2,1],[1,1]];
 const themes=baseInput.themes.map(t=>{const n=t.cells.length,home=(HOME.find(([re])=>re.test(t.theme.name))||[])[1];
  const [hx,hz]=home&&distW[home]?centroidW(home):[0,0];let best=null,bs=1e9;
  for(const [w,d] of SHAPES.filter(([w,d])=>w*d<=Math.max(2,n)))for(const c of cells)for(const [ww,dd] of [[w,d],[d,w]]){const g2=[];for(let a=0;a<ww;a++)for(let b=0;b<dd;b++){const o=byQR.get((c.q+a)+':'+(c.r+b));if(o&&!claimed.has(o.id))g2.push(o);}
   if(g2.length!==ww*dd)continue;const x=g2.reduce((s,o)=>s+o.c[0],0)/g2.length,z=g2.reduce((s,o)=>s+o.c[1],0)/g2.length;if(nearLm(x,z))continue;
   const sc=Math.hypot(x-hx,z-hz)+4*Math.max(0,Math.min(n,4)-ww*dd);if(sc<bs){bs=sc;best={g2,x,z};}}
  if(!best)throw Error('No room for '+t.id);for(const o of best.g2){claimed.add(o.id);o.themeId=t.id;}
  return {...t,cells:best.g2.map(o=>o.id),x:best.x,z:best.z};});
 // The kit's coast is only the developed land: blocks plus a planted margin, traced from a raster.
 // (The whole county would make the kit plant its street trees over every mountain.)
 const cityCoast=(()=>{const G=.3,M0=1.5;let ax=1e9,bx=-1e9,az=1e9,bz=-1e9;for(const c of cells){ax=Math.min(ax,c.c[0]);bx=Math.max(bx,c.c[0]);az=Math.min(az,c.c[1]);bz=Math.max(bz,c.c[1]);}
  const gx0=ax-H-M0-1,gz0=az-H-M0-1,NX=Math.ceil((bx-ax+2*(H+M0+1))/G),NZ=Math.ceil((bz-az+2*(H+M0+1))/G),Mk=new Uint8Array(NX*NZ);
  for(const c of cells){const i0=Math.max(0,Math.floor((c.c[0]-H-M0-gx0)/G)),i1=Math.min(NX-1,Math.ceil((c.c[0]+H+M0-gx0)/G)),j0=Math.max(0,Math.floor((c.c[1]-H-M0-gz0)/G)),j1=Math.min(NZ-1,Math.ceil((c.c[1]+H+M0-gz0)/G));
   for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*NX+i;if(Mk[k])continue;const x=gx0+(i+.5)*G,z=gz0+(j+.5)*G;
    if(Math.abs(x-c.c[0])<H+.2&&Math.abs(z-c.c[1])<H+.2){Mk[k]=1;continue;}const s=sampleAt(x,z);if(s&&s.land>.9&&!s.bank&&s.e<40)Mk[k]=1;}}
  const on=(i,j)=>i>=0&&j>=0&&i<NX&&j<NZ&&Mk[j*NX+i]===1,next=new Map(),key=(i,j)=>i+','+j,add=(a,b)=>{const k=key(...a);if(!next.has(k))next.set(k,[]);next.get(k).push(b);};
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){if(!on(i,j))continue;if(!on(i,j-1))add([i,j],[i+1,j]);if(!on(i+1,j))add([i+1,j],[i+1,j+1]);if(!on(i,j+1))add([i+1,j+1],[i,j+1]);if(!on(i-1,j))add([i,j+1],[i,j]);}
  const loops=[];for(const [k0] of next){while(next.get(k0)?.length){let cur=k0.split(',').map(Number);const loop=[];let guard=0;
   do{const k=key(...cur),l=next.get(k);if(!l||!l.length)break;const n=l.pop();if(!l.length)next.delete(k);loop.push(cur);cur=n;}while(key(...cur)!==k0&&++guard<1e6);
   const pts=loop.filter((p,i)=>{const a=loop[(i-1+loop.length)%loop.length],b=loop[(i+1)%loop.length];return (p[0]-a[0])*(b[1]-p[1])-(p[1]-a[1])*(b[0]-p[0])!==0;});
   let A=0;for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];A+=p[0]*q[1]-q[0]*p[1];}if(A>8)loops.push({A,pts:pts.map(([i,j])=>[gx0+i*G,gz0+j*G])});}}
  loops.sort((a,b)=>b.A-a.A);let ring=loops[0].pts;
  for(const {pts} of loops.slice(1)){let bi=0,bj=0,bd=1e9;for(let i=0;i<ring.length;i++)for(let j=0;j<pts.length;j++){const d=(ring[i][0]-pts[j][0])**2+(ring[i][1]-pts[j][1])**2;if(d<bd){bd=d;bi=i;bj=j;}}
   ring=[...ring.slice(0,bi+1),...pts.slice(bj),...pts.slice(0,bj+1),...ring.slice(bi)];}
  return ring;})();
 const input={...baseInput,coast:cityCoast,center:[0,0],sourceCenter:[0,0],cells,roads,themes,landmarks,transportCorridors:[]};
 const built=await buildApprovedCityArt(input,renderer),S=built.plan.scale,baseNT=WATER_Y+1.2*k+.012;
 // The kit's sand island base is removed (real terrain carries the city); its lawn stays under the blocks.
 for(const o of [...built.root.children])if(o.isMesh&&o.geometry?.type==='ExtrudeGeometry')o.removeFromParent();
 for(const road of built.roadSurface.meshes){if(road.material.name!=='Taipei road with integrated paint')continue;const compile=road.material.onBeforeCompile;
  road.material.onBeforeCompile=shader=>{compile(shader);shader.vertexShader=shader.vertexShader.replace('vRoadXZ=(modelMatrix*vec4(transformed,1.)).xz;','vRoadXZ=transformed.xz;');};road.material.customProgramCacheKey=()=> 'approved-city-local-road-v3';}
 {const grassCompile=built.art.grass.onBeforeCompile;built.art.grass.onBeforeCompile=shader=>{grassCompile(shader);shader.vertexShader=shader.vertexShader.replace('vGround=(modelMatrix*groundPoint).xyz;','vGround=groundPoint.xyz;');};built.art.grass.customProgramCacheKey=()=> 'approved-city-local-grass-v3';}
 {const scaled=new Set();built.root.traverse(o=>{if(o.isMesh)for(const m of [o.material].flat()){if(m?.bumpMap&&!scaled.has(m)){m.bumpScale/=S;scaled.add(m);}}});}
 const oldNT=APPROVED_ART.cities.get('newtaipei');oldNT.root.removeFromParent();
 for(let i=APPROVED_ART.picks.length-1;i>=0;i--)if(oldNT.picks.includes(APPROVED_ART.picks[i]))APPROVED_ART.picks.splice(i,1);
 built.root.name='approved-city-newtaipei';built.root.scale.setScalar(1/S);built.root.position.set(0,baseNT,0);scene.add(built.root);built.root.updateMatrixWorld(true);APPROVED_ART.cities.set('newtaipei',built);
 for(const p of built.picks){if(p.userData.theme){p.userData.type='island';p.userData.id=p.userData.theme;APPROVED_ART.picks.push(p);}}
 for(const t of built.themeMeta){const isl=islandById.get(t.id),body=WORLD.bodies.get(t.id);if(!isl||!body)continue;
  const x=t.x/S,z=t.z/S,h=t.height/S;isl.campus={cx:x-isl.c.x,cz:z-isl.c.z,w:t.w/S,d:t.d/S};isl.campusTop=baseNT+h;body.anchor.set(x-isl.c.x,baseNT+h+.25,z-isl.c.z);
  for(const item of isl.t.items||[]){const info=ITEMS3D.get(item.id);if(!info)continue;info.box.set(new THREE.Vector3(x-t.w/S/2,baseNT,z-t.d/S/2),new THREE.Vector3(x+t.w/S/2,baseNT+h,z+t.d/S/2));info.size=Math.max(t.w,t.d)/S;}}
 for(const l of built.landmarks){const L=LANDMARKS3D.find(v=>v.id===l.id&&v.city==='newtaipei');if(!L)continue;L.x=l.x/S-L.isl.c.x;L.z=l.z/S-L.isl.c.z;L.top=baseNT+l.height/S;}
 const nf=scene.getObjectByName('national-flag-newtaipei');if(nf)nf.visible=false;
 // Map-level records used by framing, city signs and routing.
 const ci=WORLD.cities.get('newtaipei');ci.coast=outerW;ci.center=geoW(121.4648,25.0122);
 WORLD.blockCells=WORLD.blockCells.filter(b=>b.city!=='newtaipei').concat(cells.map(c=>({city:'newtaipei',c:[c.c[0]-WORLD.blockHalfSize,c.c[1]-WORLD.blockHalfSize]})));
 for(const [id,site] of Object.entries(WORLD.landmarkSites))if(site.city==='newtaipei')delete WORLD.landmarkSites[id];
 // Guandu and Danjiang: the engine builds them on the Tamsui River; the reviewed sea bridges are not built.
 transportPlan.bridges.length=0;
 const ntIsl=islands.find(i=>i.t.city==='newtaipei');
 for(const b of real.namedBridges()){const [x,z]=toW(b.x,b.z);LANDMARKS3D.push({id:b.name,name:b.name,isl:ntIsl,x:x-ntIsl.c.x,z:z-ntIsl.c.z,top:WATER_Y+b.top*k,city:'newtaipei',sc:1,r:1,nature:false,fixed:true});}
 const surf=scene.getObjectByName('coastal-surf');if(surf){surf.visible=false;REAL_TAIPEI.deco=scene.children[scene.children.indexOf(surf)+1]||null;}
 REAL_TAIPEI.newTaipei={points:{banqiao:geoW(121.4648,25.0122),sanchong:geoW(121.488,25.062),guandu:toW(real.namedBridges()[0].x,real.namedBridges()[0].z),tamsui:geoW(121.44,25.17)},cells:cells.length,themes:themes.map(t=>t.id+'@'+districtAt(t.x,t.z))};
}
"""

# Hide anything afloat that ended up over land (routes were planned for the old sea).
AFLOAT = r"""
{const _v=new THREE.Vector3();let _t=0;const movers=()=>{const out=[];for(const root of [scene.getObjectByName('reviewed-bridges-and-traffic-v047'),scene.getObjectByName('panorama-lower-right-life'),REAL_TAIPEI.deco]){if(!root)continue;
  for(const c of root.children){if(c.position.lengthSq()<1e-6&&c.children.length>3)out.push(...c.children);else out.push(c);}}return out;};let list=null;
 const prev=APPROVED_ART.update;APPROVED_ART.update=(dt,time,moving)=>{prev(dt,time,moving);_t+=dt;if(_t<.35)return;_t=0;list||=movers();
  for(const o of list){o.getWorldPosition(_v);if(_v.y>1.4)continue;o.visible=!REAL_TAIPEI.isLandWorld(_v.x,_v.z);}};}
"""


def build():
    src = base["SRC"].read_text(encoding="utf-8")

    def sub(s, a, b, count=1):
        assert s.count(a) >= 1, a[:80]
        return s.replace(a, b, count)

    s = src
    s = sub(s, 'import * as THREE from "three";\n', 'import * as THREE from "three";\n' + base["IMPORT"].replace("?rev=2", "?rev=3") + NEIGHBOR_IMPORT)
    replace = base["REPLACE"].replace("campusRadius:5.4,", NEIGHBOR_OPTS + "campusRadius:5.4,")
    assert NEIGHBOR_OPTS in replace
    s = sub(s, "APPROVED_ART.transport=await buildTransportNetwork(", replace + NEWTAIPEI + "APPROVED_ART.transport=await buildTransportNetwork(")
    s = sub(s, "APPROVED_ART.ao=artAO;", "APPROVED_ART.ao=artAO;" + base["UPDATE"] + AFLOAT)
    s = sub(s, 'content="0.4.12"', f'content="{VERSION}"')
    s = sub(s, 'const near = THREE.MathUtils.clamp(camDist * 0.02, 0.3, 12);', 'const near = THREE.MathUtils.clamp(camDist * 0.02, 0.012, 12);')
    s = re.sub(r'<title>.*?</title>', '<title>台北安可真實大台北 v0.6.2</title>', s, count=1)
    OUT.write_text(s, encoding="utf-8")
    print(f"Built v{VERSION} real-map Taipei + New Taipei -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build()
