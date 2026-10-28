"""Build v0.6.3: production shell with Taipei AND New Taipei rendered by the realistic engine on the real map.

v0.6.2 kept New Taipei's old art kit on its real lowland, which left it sparse and most districts as forest.
v0.6.3 applies the realistic Taipei art to New Taipei as well, in the engine's region mode (opts.neighbor):
  * one city window (440 units, about 59 km) covers Taipei, New Taipei's built-up areas and Keelung's harbour;
  * developed land follows the satellite picture: the whole New Taipei part of the Taipei basin, the Linkou
    plateau, Tamsui with Danhai new town, Bali, Xizhi, the Shulin-Yingge-Sanxia corridor, Ankeng and north
    Xindian, Shenkeng, the north-coast and north-east towns, and Keelung (scenery only, no policy content);
  * each New Taipei district gets its own street grid and character (Banqiao towers, Sanchong old town,
    Wugu/Taishan industry, small-town fabric on the coast) - the same building kit as Taipei;
  * New Taipei's 9 policy themes become campuses in fitting real districts with New Taipei's colour ring;
  * its 5 landmarks are modelled at their real sites; Guandu/Danjiang and the river bridges are on the rivers.
The production UI, data and New Taipei's policy content are unchanged; only art and marker positions move.
Block size is a readable illustration, not the real street scale.
"""
import json
import pathlib
import re
import runpy

ROOT = pathlib.Path(__file__).resolve().parents[1]
P = ROOT / "prototypes"
OUT = P / "greater-taipei-v0.6.3.html"
VERSION = "0.6.3"

base = runpy.run_path(str(ROOT / "tools" / "build_taipei_real_shell_preview.py"))

# Developed land traced from the satellite view (lon, lat), with ground height in metres.
DEV = [
    # New Taipei's part of the Taipei basin: Luzhou, Sanchong, Wugu and Taishan lowland, Xinzhuang, Banqiao,
    # Zhonghe, Yonghe, Tucheng, Shulin, north Xindian (Dapinglin, Qizhang) and the Ankeng valley.
    ([[121.472, 25.112], [121.458, 25.104], [121.443, 25.098], [121.432, 25.085], [121.426, 25.066], [121.412, 25.054],
      [121.396, 25.046], [121.386, 25.032], [121.389, 25.012], [121.396, 24.992], [121.401, 24.972], [121.418, 24.958],
      [121.432, 24.962], [121.447, 24.967], [121.466, 24.973], [121.49, 24.983], [121.505, 24.985], [121.508, 24.968],
      [121.494, 24.958], [121.497, 24.95], [121.515, 24.953], [121.531, 24.949], [121.545, 24.952], [121.556, 24.968],
      [121.562, 24.99], [121.556, 25.03], [121.52, 25.08], [121.49, 25.115]], 0),
    # Linkou plateau new town.
    ([[121.352, 25.078], [121.362, 25.091], [121.386, 25.097], [121.405, 25.089], [121.408, 25.072], [121.396, 25.058],
      [121.374, 25.056], [121.357, 25.063]], 220),
    # Yingge, Sanxia old street and the Taipei University district.
    ([[121.333, 24.966], [121.352, 24.972], [121.375, 24.97], [121.395, 24.962], [121.398, 24.948], [121.386, 24.932],
      [121.372, 24.92], [121.356, 24.924], [121.343, 24.938]], 35),
    # Tamsui old town, Zhuwei, Hongshulin and Danhai new town.
    ([[121.405, 25.196], [121.42, 25.208], [121.447, 25.2], [121.458, 25.183], [121.465, 25.165], [121.473, 25.146],
      [121.474, 25.128], [121.462, 25.124], [121.452, 25.142], [121.443, 25.158], [121.43, 25.166], [121.415, 25.176]], 8),
    # Bali riverside and the Taipei Port back-up land.
    ([[121.383, 25.158], [121.398, 25.166], [121.414, 25.154], [121.432, 25.134], [121.444, 25.118], [121.437, 25.108],
      [121.418, 25.118], [121.398, 25.138], [121.381, 25.147]], 6),
    # Xizhi along the Keelung River (with Wudu).
    ([[121.6, 25.058], [121.622, 25.073], [121.65, 25.081], [121.676, 25.088], [121.698, 25.09], [121.704, 25.078],
      [121.68, 25.062], [121.655, 25.054], [121.628, 25.047], [121.607, 25.047]], 8),
    # Keelung: harbour city, Qidu and Badu (scenery only).
    ([[121.7, 25.148], [121.727, 25.162], [121.758, 25.158], [121.782, 25.142], [121.777, 25.118], [121.752, 25.112],
      [121.728, 25.096], [121.704, 25.092], [121.688, 25.095], [121.694, 25.11], [121.712, 25.126]], 12),
    # Ruifang.
    ([[121.795, 25.103], [121.808, 25.114], [121.826, 25.108], [121.822, 25.096], [121.805, 25.095]], 25),
    # Jinshan, Wanli, Sanzhi and Shimen towns on the north coast.
    ([[121.624, 25.226], [121.643, 25.236], [121.662, 25.226], [121.652, 25.21], [121.63, 25.211]], 10),
    ([[121.672, 25.181], [121.688, 25.188], [121.701, 25.177], [121.686, 25.168]], 10),
    ([[121.493, 25.254], [121.508, 25.263], [121.518, 25.252], [121.503, 25.244]], 15),
    ([[121.563, 25.288], [121.576, 25.294], [121.582, 25.284], [121.568, 25.28]], 10),
    # Shenkeng old street.
    ([[121.6, 25.006], [121.62, 25.008], [121.627, 24.996], [121.606, 24.992]], 25),
]

# Mountain and coastal roads (waypoints, lon/lat) - routed over the terrain by the engine, lit by street lamps.
ROUTES = [
    [[121.505, 25.135], [121.53, 25.155], [121.535, 25.168], [121.546, 25.177], [121.57, 25.19], [121.6, 25.205], [121.635, 25.215]],  # Yangjin Hwy
    [[121.53, 25.095], [121.545, 25.125], [121.545, 25.155]],  # Yangde Blvd
    [[121.445, 25.19], [121.475, 25.225], [121.505, 25.258], [121.54, 25.28], [121.57, 25.29], [121.6, 25.27], [121.635, 25.222],
     [121.688, 25.18], [121.71, 25.16], [121.74, 25.14]],  # North Coast Hwy 2
    [[121.745, 25.13], [121.78, 25.115], [121.81, 25.108], [121.844, 25.109], [121.857, 25.106]],  # Ruifang-Jiufen-Jinguashi
    [[121.81, 25.105], [121.79, 25.07], [121.775, 25.045], [121.74, 25.025], [121.705, 25.005], [121.66, 24.99], [121.615, 25.0]],  # Pingxi line
    [[121.615, 25.0], [121.59, 24.97], [121.57, 24.99]],  # Shenkeng-Maokong
    [[121.66, 24.99], [121.69, 24.96], [121.711, 24.937]],  # Shiding-Pinglin
    [[121.54, 24.96], [121.55, 24.91], [121.551, 24.865]],  # Wulai Hwy 9A
    [[121.545, 24.955], [121.6, 24.93], [121.65, 24.93], [121.711, 24.937]],  # Beiyi Hwy 9
    [[121.375, 24.93], [121.4, 24.89], [121.42, 24.855]],  # Sanxia-Dabao
    [[121.66, 25.07], [121.65, 25.1], [121.62, 25.12], [121.6, 25.15], [121.57, 25.19]],  # Xizhi hills to Yangmingshan east
    [[121.65, 25.06], [121.66, 25.03], [121.66, 24.99]],  # Xizhi-Shiding
    [[121.81, 25.1], [121.84, 25.06], [121.866, 25.035], [121.91, 25.02]],  # Shuangxi-Gongliao
    [[121.38, 25.08], [121.36, 25.11], [121.39, 25.14], [121.41, 25.15]],  # Linkou-Bali coast
    [[121.39, 25.065], [121.41, 25.05]],  # Linkou-Taishan
    [[121.585, 25.085], [121.6, 25.1], [121.63, 25.09]],  # Neihu Bishan
    [[121.61, 25.04], [121.615, 25.0]],  # Nangang-Shenkeng
    [[121.505, 25.135], [121.48, 25.17], [121.46, 25.2], [121.475, 25.225]],  # Beitou-Danshui hills
]
VILLAGES = [[121.535, 25.168, 10], [121.545, 25.155, 14], [121.857, 25.106, 10], [121.738, 25.026, 10], [121.66, 24.99, 8],
            [121.711, 24.937, 12], [121.551, 24.865, 12], [121.55, 24.91, 6], [121.588, 24.968, 8], [121.866, 25.035, 10],
            [121.908, 25.022, 8], [121.4, 24.89, 6], [121.65, 25.1, 6], [121.6, 25.15, 4], [121.6, 25.1, 6], [121.57, 25.19, 5],
            [121.475, 25.225, 6], [121.765, 25.04, 6]]

# New Taipei policy themes -> fitting real districts (the engine falls back to the nearest New Taipei district).
NT_HOME = [["交通|軌道", "板橋"], ["居住|都更", "三重"], ["托育|親子", "新莊"], ["長者|照顧", "永和"], ["醫療|口腔", "中和"],
           ["教育", "土城"], ["產業|就業|青年", "汐止"], ["治水|防災", "蘆洲"], ["族群|地方", "淡水"]]

IMPORT = ("import {createTaipeiIsland as createRealTaipei} from './taipei-real-v063.js?rev=1';\n"
          "import NEWTAIPEI_GEO from './taipei-real-v062-newtaipei.js?rev=1';\n")

NEIGHBOR_OPTS = ("neighbor:{districts:{...NEWTAIPEI_GEO.districts,基隆:NEWTAIPEI_GEO.keelung},dev:"
                 + json.dumps(DEV, separators=(",", ":")) + ",routes:" + json.dumps(ROUTES, separators=(",", ":"))
                 + ",villages:" + json.dumps(VILLAGES, separators=(",", ":")) + "},")

# After the realistic engine is in place: New Taipei map records, bridges, decorations.
NEWTAIPEI = r"""
/* ===== v0.6.3: New Taipei rendered by the realistic engine; map records follow the real geography ===== */
{
 const real=REAL_TAIPEI.engine,g=REAL_TAIPEI.root,k=REAL_TAIPEI.scale;
 const toW=(x,z)=>{const v=g.localToWorld(new THREE.Vector3(x,0,z));return [v.x,v.z];};
 const geoW=(lo,la)=>{const c=real.geo(lo,la);return toW(c.x,c.z);};
 const ntBuilt=APPROVED_ART.cities.get('newtaipei');ntBuilt.root.visible=false;
 for(let i=APPROVED_ART.picks.length-1;i>=0;i--)if(ntBuilt.picks.includes(APPROVED_ART.picks[i]))APPROVED_ART.picks.splice(i,1);
 const nf=scene.getObjectByName('national-flag-newtaipei');if(nf)nf.visible=false;
 const ci=WORLD.cities.get('newtaipei');ci.coast=NEWTAIPEI_GEO.outer.map(([x,z])=>toW(x,z));ci.center=geoW(121.4648,25.0122);
 {const [cx,cz]=geoW(121.472,25.02);WORLD.blockCells=WORLD.blockCells.filter(b=>b.city!=='newtaipei').concat([{city:'newtaipei',c:[cx-WORLD.blockHalfSize,cz-WORLD.blockHalfSize]}]);}
 for(const [id,site] of Object.entries(WORLD.landmarkSites))if(site.city==='newtaipei')delete WORLD.landmarkSites[id];
 // Guandu and Danjiang stand on the Tamsui River (built by the engine); the reviewed sea bridges are not built.
 transportPlan.bridges.length=0;
 const ntIsl=islands.find(i=>i.t.city==='newtaipei');
 for(const b of real.namedBridges()){const [x,z]=toW(b.x,b.z);LANDMARKS3D.push({id:b.name,name:b.name,isl:ntIsl,x:x-ntIsl.c.x,z:z-ntIsl.c.z,top:WATER_Y+b.top*k,city:'newtaipei',sc:1,r:1,nature:false,fixed:true});}
 const surf=scene.getObjectByName('coastal-surf');if(surf){surf.visible=false;REAL_TAIPEI.deco=scene.children[scene.children.indexOf(surf)+1]||null;}
 REAL_TAIPEI.points={banqiao:geoW(121.4648,25.0122),sanchong:geoW(121.488,25.062),linkou:geoW(121.383,25.077),tamsui:geoW(121.44,25.17),xizhi:geoW(121.656,25.064),keelung:geoW(121.742,25.13),guandu:toW(real.namedBridges()[0].x,real.namedBridges()[0].z)};
 REAL_TAIPEI.policies=real.getPlaces().filter(p=>p.type==='policy').map(p=>p.id+'@'+p.district);
}
"""

AFLOAT = r"""
{const _v=new THREE.Vector3();let _t=0;const movers=()=>{const out=[];for(const root of [scene.getObjectByName('reviewed-bridges-and-traffic-v047'),scene.getObjectByName('panorama-lower-right-life'),REAL_TAIPEI.deco]){if(!root)continue;
  for(const c of root.children){if(c.position.lengthSq()<1e-6&&c.children.length>3)out.push(...c.children);else out.push(c);}}return out;};let list=null;
 const prev=APPROVED_ART.update;APPROVED_ART.update=(dt,time,moving)=>{prev(dt,time,moving);_t+=dt;if(_t<.35)return;_t=0;list||=movers();
  for(const o of list){o.getWorldPosition(_v);if(_v.y>1.4)continue;o.visible=!REAL_TAIPEI.isLandWorld(_v.x,_v.z);}};}
"""


def build():
    s = base["SRC"].read_text(encoding="utf-8")

    def sub(a, b, count=1):
        nonlocal s
        assert s.count(a) >= 1, a[:80]
        s = s.replace(a, b, count)

    replace = base["REPLACE"]

    def rsub(a, b):
        nonlocal replace
        assert a in replace, a[:80]
        replace = replace.replace(a, b, 1)

    rsub("v0.6.1: replace Taipei's city art with the realistic Taipei engine; UI and other cities unchanged",
         "v0.6.3: Taipei and New Taipei art from the realistic engine on the real map; UI unchanged")
    rsub("const tpIslands=islands.filter(i=>i.city==='taipei');",
         "const tpIslands=islands.filter(i=>i.city==='taipei'||i.city==='newtaipei');\n"
         " const NT_HOME=" + json.dumps(NT_HOME, ensure_ascii=False) + ";")
    rsub("const themes=tpIslands.map(i=>({id:i.t.id,name:i.t.name,kind:i.t.kind,area:i.t.area,no:i.t.no,items:i.t.items||[]}));",
         "const themes=tpIslands.map(i=>({id:i.t.id,name:i.t.name,kind:i.t.kind,area:i.t.area,no:i.t.no,items:i.t.items||[],city:i.city,"
         "color:i.city==='taipei'?undefined:cityHex(i.city),home:i.city==='newtaipei'?(NT_HOME.find(([re])=>new RegExp(re).test(i.t.name))||[])[1]:undefined}));")
    rsub("campusRadius:5.4,", NEIGHBOR_OPTS + "campusRadius:5.4,")
    rsub("for(let i=LANDMARKS3D.length-1;i>=0;i--){const L=LANDMARKS3D[i];if(L.city!=='taipei'||L.fixed)continue;",
         "for(let i=LANDMARKS3D.length-1;i>=0;i--){const L=LANDMARKS3D[i];if((L.city!=='taipei'&&L.city!=='newtaipei')||L.fixed)continue;")

    sub('import * as THREE from "three";\n', 'import * as THREE from "three";\n' + IMPORT)
    sub("APPROVED_ART.transport=await buildTransportNetwork(", replace + NEWTAIPEI + "APPROVED_ART.transport=await buildTransportNetwork(")
    update = base["UPDATE"]
    assert "f=1-.82*night" in update
    update = update.replace("f=1-.82*night", "f=1-.72*night")  # keep a little moonlight on the hills
    sub("APPROVED_ART.ao=artAO;", "APPROVED_ART.ao=artAO;" + update + AFLOAT)
    sub('content="0.4.12"', f'content="{VERSION}"')
    sub('const near = THREE.MathUtils.clamp(camDist * 0.02, 0.3, 12);', 'const near = THREE.MathUtils.clamp(camDist * 0.02, 0.012, 12);')
    s = re.sub(r'<title>.*?</title>', '<title>台北安可大臺北擬真 v0.6.3</title>', s, count=1)
    OUT.write_text(s, encoding="utf-8")
    print(f"Built v{VERSION} realistic Taipei + New Taipei -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build()
