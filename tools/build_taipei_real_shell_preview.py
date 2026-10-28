"""Build v0.6.1: production shell (v0.4.12, the page promoted to production 2.2.x) with only Taipei's art replaced.

Everything outside Taipei's city art is the production page byte-for-byte: brand, toolbar, policy list,
drawer, intro, time modes, music, New Taipei, bridges, sea/air traffic. Taipei's approved city group is
hidden and the realistic Taipei engine (prototypes/taipei-real-v060.js, embed mode) is fitted into the
same island footprint. Taipei's existing policy themes get campuses in the new city; their native label
anchors, picking targets, item boxes and landmark tags are rewritten to the new positions, before the
unchanged UI creates its labels.
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
P = ROOT / "prototypes"
SRC = P / "greater-taipei-v0.4.12.html"
OUT = P / "greater-taipei-v0.6.1.html"
VERSION = "0.6.1"

IMPORT = "import {createTaipeiIsland as createRealTaipei} from './taipei-real-v060.js?rev=2';\n"

# Runs right after every approved city is built and before the transport network and native labels.
REPLACE = r"""
/* ===== v0.6.1: replace Taipei's city art with the realistic Taipei engine; UI and other cities unchanged ===== */
const REAL_TAIPEI={};
{
 const tpBuilt=APPROVED_ART.cities.get('taipei');
 const coast=WORLD.cities.get('taipei').coast;
 let cx0=1e9,cx1=-1e9,cz0=1e9,cz1=-1e9;for(const [x,z] of coast){cx0=Math.min(cx0,x);cx1=Math.max(cx1,x);cz0=Math.min(cz0,z);cz1=Math.max(cz1,z);}
 const tpIslands=islands.filter(i=>i.city==='taipei');
 const themes=tpIslands.map(i=>({id:i.t.id,name:i.t.name,kind:i.t.kind,area:i.t.area,no:i.t.no,items:i.t.items||[]}));
 const real=createRealTaipei(document.createElement('div'),{embed:true,renderer,postprocessing:false,ui:false,policies:themes,cityColor:cityHex('taipei'),campusRadius:5.4,campusHeight:2.2,nightBoost:1.15,carScale:1.5,walkerScale:3.2});
 const g=real.root,lb=g.userData.landBounds;
 const k=Math.min((cx1-cx0)/(lb.maxX-lb.minX),(cz1-cz0)/(lb.maxZ-lb.minZ))*1.02;
 g.scale.setScalar(k);
 g.position.set((cx0+cx1)/2-k*(lb.minX+lb.maxX)/2,WATER_Y,(cz0+cz1)/2-k*(lb.minZ+lb.maxZ)/2);
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 scene.add(g);g.updateMatrixWorld(true);
 tpBuilt.root.visible=false;
 const nativeFlag=scene.getObjectByName('national-flag-taipei');if(nativeFlag)nativeFlag.visible=false;
 for(let i=APPROVED_ART.picks.length-1;i>=0;i--)if(tpBuilt.picks.includes(APPROVED_ART.picks[i]))APPROVED_ART.picks.splice(i,1);
 const toWorld=(p)=>g.localToWorld(new THREE.Vector3(p.x,p.y,p.z));
 const places=real.getPlaces();
 const pickMat=new THREE.MeshBasicMaterial({visible:false});
 for(const place of places.filter(p=>p.type==='policy')){
  const isl=islandById.get(place.id),body=WORLD.bodies.get(place.id);if(!isl||!body)continue;
  const c=toWorld(place.position),w=place.radius*2*k,top=WATER_Y+place.top*k;
  isl.campus={cx:c.x-isl.c.x,cz:c.z-isl.c.z,w,d:w};isl.campusTop=top;
  body.anchor.set(c.x-isl.c.x,top+.25,c.z-isl.c.z);
  for(const item of isl.t.items||[]){const info=ITEMS3D.get(item.id);if(!info)continue;
   info.box.set(new THREE.Vector3(c.x-w/2,c.y,c.z-w/2),new THREE.Vector3(c.x+w/2,top,c.z+w/2));info.size=w;}
  const pick=new THREE.Mesh(new THREE.BoxGeometry(w,top-c.y+.1,w),pickMat);pick.position.set(c.x,(c.y+top)/2,c.z);
  pick.userData={type:'island',id:place.id,theme:place.id};scene.add(pick);APPROVED_ART.picks.push(pick);
 }
 // Taipei landmark tags follow the new landmarks; tags for landmarks the new city does not model are removed.
 const norm=s=>String(s).replace(/\s/g,'').replace(/臺/g,'台');
 const lm=new Map(places.filter(p=>p.type==='landmark').map(p=>[norm(p.name),p]));
 for(let i=LANDMARKS3D.length-1;i>=0;i--){const L=LANDMARKS3D[i];if(L.city!=='taipei'||L.fixed)continue;
  const p=lm.get(norm(L.name))||[...lm].find(([n])=>n.includes(norm(L.name))||norm(L.name).includes(n))?.[1];
  if(!p){LANDMARKS3D.splice(i,1);continue;}
  const c=toWorld(p.position);L.x=c.x-L.isl.c.x;L.z=c.z-L.isl.c.z;L.top=WATER_Y+p.top*k;}
 // Ships moored by the old Taipei art sit inside the hidden group; nothing else to move.
 controls.minDistance=.45; // 允許拉近到街道層級看清行人與車輛
 REAL_TAIPEI.engine=real;window.REAL_TAIPEI=REAL_TAIPEI;REAL_TAIPEI.root=g;REAL_TAIPEI.scale=k;
 REAL_TAIPEI.isLandWorld=(x,z)=>{const v=g.worldToLocal(new THREE.Vector3(x,0,z));return real.isLand(v.x,v.z);};
}
"""

# Per-frame: animate the realistic city and follow the native day/night state.
UPDATE = r"""
{const nativeUpdate=APPROVED_ART.update;let realNight=null;const lightBase=new Map(),lightSet=new Map();
 let lights=null,envMats=null,envNight=-1;const dimNature=()=>{if(!lights){lights=[];scene.traverse(o=>{if(o.isHemisphereLight||o.isDirectionalLight||o.isAmbientLight)lights.push(o);});}const night=ENV.state?.night||0,f=1-.82*night;if(Math.abs(night-envNight)>.01){envNight=night;if(!envMats){envMats=new Map();scene.traverse(o=>{if(o.isMesh)for(const m of [o.material].flat())if(m&&m.isMeshStandardMaterial&&!envMats.has(m))envMats.set(m,m.envMapIntensity);});}envMats.forEach((v,m)=>m.envMapIntensity=v*(1-.85*night));}lights.forEach(o=>{
  if(!lightSet.has(o)||Math.abs(o.intensity-lightSet.get(o))>1e-6)lightBase.set(o,o.intensity);const v=lightBase.get(o)*f;o.intensity=v;lightSet.set(o,v);});};
 APPROVED_ART.update=(dt,time,moving)=>{nativeUpdate(dt,time,moving);const n=(ENV.state?.night||0)>.5;if(n!==realNight){realNight=n;REAL_TAIPEI.engine.setNight(n);}dimNature();if(moving)REAL_TAIPEI.engine.update(dt);};}
"""


def build():
    s = SRC.read_text(encoding="utf-8")

    def sub(a, b, count=1):
        nonlocal s
        assert s.count(a) >= 1, a[:80]
        s = s.replace(a, b, count)

    sub('import * as THREE from "three";\n', 'import * as THREE from "three";\n' + IMPORT)
    sub("APPROVED_ART.transport=await buildTransportNetwork(", REPLACE + "APPROVED_ART.transport=await buildTransportNetwork(")
    sub("APPROVED_ART.ao=artAO;", "APPROVED_ART.ao=artAO;" + UPDATE)
    sub('content="0.4.12"', f'content="{VERSION}"')
    # 街道層級拉近：放寬鏡頭近裁切面下限（原本 0.3，拉近到 0.45 距離時會裁掉城市）
    sub('const near = THREE.MathUtils.clamp(camDist * 0.02, 0.3, 12);', 'const near = THREE.MathUtils.clamp(camDist * 0.02, 0.012, 12);')
    import re
    s = re.sub(r'<title>.*?</title>', '<title>台北安可擬真臺北 v0.6.1</title>', s, count=1)
    OUT.write_text(s, encoding="utf-8")
    print(f"Built v{VERSION} production shell with realistic Taipei -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build()
