"""Build v0.6.4: v0.6.1 content (production shell + realistic Taipei), with New Taipei and the two bridges removed.

Reuses the v0.6.1 injections from tools/build_taipei_real_shell_preview.py (so both stay in sync), then makes the
page Taipei-only at the data level: New Taipei is dropped from the city list (no island, art, policy list, labels,
landmarks or city sign), the Guandu and Danjiang bridges and their traffic are not built, and the few places
that assumed two cities (cluster offset, ship gateways, desktop panorama framing) only use the cities present.
"""
import base64
import io
import pathlib
import re
import runpy

ROOT = pathlib.Path(__file__).resolve().parents[1]
P = ROOT / "prototypes"
OUT = P / "greater-taipei-v0.6.4.html"
VERSION = "0.6.4"

base = runpy.run_path(str(ROOT / "tools" / "build_taipei_real_shell_preview.py"))

# Per-frame: realistic Taipei follows the native day/night state. Night keeps more natural light than v0.6.1 and
# adds a cool moonlight, so the city reads bright and lively; window.NIGHT_LOOK = {dim, env, moon} tunes it live.
UPDATE = r"""
{const nativeUpdate=APPROVED_ART.update;let realNight=null;const lightBase=new Map(),lightSet=new Map();let lights=null,envMats=null,envKey='';
 const moon=new THREE.DirectionalLight('#aec6ff',0);moon.name='moonlight';moon.position.set(-70,140,-50);scene.add(moon);scene.add(moon.target);
 window.NIGHT_LOOK=window.NIGHT_LOOK||{dim:.55,env:.6,moon:.9};
 const dimNature=()=>{const L=window.NIGHT_LOOK;if(!lights){lights=[];scene.traverse(o=>{if((o.isHemisphereLight||o.isDirectionalLight||o.isAmbientLight)&&o!==moon)lights.push(o);});}
  const night=ENV.state?.night||0,f=1-L.dim*night,key=night.toFixed(2)+'/'+L.env;
  if(key!==envKey){envKey=key;if(!envMats){envMats=new Map();scene.traverse(o=>{if(o.isMesh)for(const m of [o.material].flat())if(m&&m.isMeshStandardMaterial&&!envMats.has(m))envMats.set(m,m.envMapIntensity);});}envMats.forEach((v,m)=>m.envMapIntensity=v*(1-L.env*night));}
  lights.forEach(o=>{if(!lightSet.has(o)||Math.abs(o.intensity-lightSet.get(o))>1e-6)lightBase.set(o,o.intensity);const v=lightBase.get(o)*f;o.intensity=v;lightSet.set(o,v);});
  moon.intensity=L.moon*night;};
 APPROVED_ART.update=(dt,time,moving)=>{nativeUpdate(dt,time,moving);const n=(ENV.state?.night||0)>.5;if(n!==realNight){realNight=n;REAL_TAIPEI.engine.setNight(n);}dimNature();if(moving)REAL_TAIPEI.engine.update(dt);};}
"""


POSTER_CSS = """
html.hi.booting .loading{background:#8cc6ee url("assets/poster-v064-day-wide.jpg") center/cover no-repeat;padding-bottom:9vh}
html.hi.booting.poster-night .loading{background-color:#16233f;background-image:url("assets/poster-v064-night-wide.jpg")}
@media (max-aspect-ratio:1/1){html.hi.booting .loading{background-image:url("assets/poster-v064-day-tall.jpg")}html.hi.booting.poster-night .loading{background-image:url("assets/poster-v064-night-tall.jpg")}}
html.hi.booting .loading .loading-brand,html.hi.booting .loading>small{display:none}
html.hi.booting .loading .loading-spinner{width:22px;height:22px;border-width:3px}
html.hi.booting .loading{flex-direction:row;gap:10px;justify-content:center;align-items:flex-end}
html.hi.booting .loading .loading-status{background:rgba(255,255,255,.88);color:#102c50;padding:9px 18px;border-radius:999px;font-size:14px;box-shadow:0 4px 18px rgba(0,0,0,.15)}
"""


def build():
    s = base["SRC"].read_text(encoding="utf-8")

    def sub(a, b, count=1):
        nonlocal s
        assert s.count(a) >= 1, a[:80]
        s = s.replace(a, b, count)

    sub('import * as THREE from "three";\n', 'import * as THREE from "three";\n' + base["IMPORT"])
    sub("APPROVED_ART.transport=await buildTransportNetwork(", base["REPLACE"] + "APPROVED_ART.transport=await buildTransportNetwork(")
    sub("APPROVED_ART.ao=artAO;", "APPROVED_ART.ao=artAO;" + UPDATE)
    sub('content="0.4.12"', f'content="{VERSION}"')
    sub('const near = THREE.MathUtils.clamp(camDist * 0.02, 0.3, 12);', 'const near = THREE.MathUtils.clamp(camDist * 0.02, 0.012, 12);')
    # Taipei only: New Taipei and the two cross-river bridges are removed.
    sub('const ORDER=["taipei","newtaipei","keelung","taoyuan"];', 'const ORDER=["taipei"];')
    sub('const LIVE_CITIES = new Set(["taipei", "newtaipei"]);', 'const LIVE_CITIES = new Set(["taipei"]);')
    sub('for (const c of ["newtaipei"]) {', 'for (const c of ["newtaipei"].filter((c) => islands.some((i) => i.city === c))) {')
    sub('const gateways=["newtaipei","taipei"]', 'const gateways=["newtaipei","taipei"].filter(c=>WORLD.cities.has(c))')
    sub("for(const id of ['taipei','newtaipei'])for(const [x,z] of WORLD.cities.get(id).coast)",
        "for(const id of ['taipei','newtaipei'].filter(id=>WORLD.cities.has(id)))for(const [x,z] of WORLD.cities.get(id).coast)")
    # Taipei's approved art kit is hidden by the realistic engine anyway: do not build it (saves seconds of load and
    # its shaders). A light stand-in keeps the coast, scale and hooks that transport, panorama life and update use.
    sub("for(const input of inputs){", "for(const input of inputs){\n if(!A.cityById.get(input.city.city))continue;\n"
        " if(input.city.city==='taipei'){const off=input.sourceCenter||[0,0],root=new THREE.Group();root.name='approved-city-taipei';root.position.set(off[0],APPROVED_ART.baseY,off[1]);scene.add(root);"
        "APPROVED_ART.cities.set('taipei',{root,plan:{coast:input.coast.map(p=>p.map(v=>v*14)),scale:14},landmarks:[{id:'t101',height:115}],buildings:[],picks:[],themeMeta:[],art:null,"
        "flag:{userData:{}},life:{setEnabled(){},update(){}}});APPROVED_ART.boats=[];continue;}")
    sub("APPROVED_ART.transport=await buildTransportNetwork(", "transportPlan.bridges.length=0;\nAPPROVED_ART.transport=await buildTransportNetwork(")
    # Copy that described two cities.
    s = s.replace("以臺北市為主的 3D 互動政策地圖，連結新北市，", "臺北市 3D 互動政策地圖，")
    sub('aria-label="3D 政策城市：台北、新北，每個街區是一項政策主題"', 'aria-label="3D 政策城市：台北，每個街區是一項政策主題"')
    sub('<div class="eyebrow">2026 縣市長選舉 · 大台北</div><h2 class="title">兩位參選人</h2>', '<div class="eyebrow">2026 縣市長選舉 · 臺北市</div><h2 class="title">臺北市參選人</h2>')
    sub('這裡把大台北兩位參選人的 <b>${allRows}</b> 項政見與任內政績，分成 <b>${allThemes}</b> 個政策區塊，散在台北、新北兩座城市島上。',
        '這裡把臺北市參選人的 <b>${allRows}</b> 項政見與任內政績，分成 <b>${allThemes}</b> 個政策區塊，散在台北城市島上。')
    sub('<li><b>全景</b>：看整座群島，點島就飛過去</li>', '<li><b>全景</b>：看整座城市島，點政策區塊就飛過去</li>')
    sub('<p class="hi-soon">拖曳地圖可以移動到其他城市，或用左上角的城市按鈕切換。</p>', '')
    # Single-island framing leaves room for the city sign under the toolbar.
    sub("return Math.abs(q.x)<.88&&q.y>-.90&&q.y<.48&&q.z<1;", "return Math.abs(q.x)<.88&&q.y>-.90&&q.y<.3&&q.z<1;")
    # Default view: 101 at the centre, north-east up (camera south-west of 101), lowest camera angle, slow continuous orbit.
    # The Panorama button returns to exactly this view and restarts the orbit.
    sub(" REAL_TAIPEI.engine=real;window.REAL_TAIPEI=REAL_TAIPEI;",
        " {const t101=places.find(p=>p.type==='landmark'&&/101/.test(p.name));if(t101){const c=toWorld(t101.position);REAL_TAIPEI.focus101={x:c.x,z:c.z};}}\n REAL_TAIPEI.engine=real;window.REAL_TAIPEI=REAL_TAIPEI;")
    old_overview = s[s.index("function overview() {"):s.index("function flyTo(target, pos) {")]
    sub(old_overview, """function overview() {
  // v0.6.4 default view: Taipei 101 in the centre, north-east up, at the lowest camera angle the controls allow.
  const f=window.REAL_TAIPEI&&REAL_TAIPEI.focus101,tc=WORLD.cities.get("taipei");
  const C=f?new THREE.Vector3(f.x,0.3,f.z):new THREE.Vector3(tc.center[0],0.3,tc.center[1]);
  const aspect=stage.clientWidth/Math.max(1,stage.clientHeight),pitch=Math.PI/2-controls.maxPolarAngle+.001,dir=new THREE.Vector3(-Math.SQRT1_2*Math.cos(pitch),Math.sin(pitch),Math.SQRT1_2*Math.cos(pitch)); // camera south-west of 101, so north-east is up
  const pts=tc.coast.map(([x,z])=>new THREE.Vector3(x,0,z)),probe=new THREE.PerspectiveCamera(camera.fov,Math.max(aspect,.9),camera.near,camera.far); // portrait phones crop the sides instead of shrinking the city
  const fits=d=>{probe.position.copy(C).addScaledVector(dir,d);probe.lookAt(C);probe.updateMatrixWorld(true);let out=0;for(const p of pts){const q=p.clone().project(probe);if(Math.abs(q.x)>1.04||q.y<-1.06||q.y>.8)out++;}return out<=pts.length*.04;};
  let lo=2,hi=400;for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(fits(mid))hi=mid;else lo=mid;}
  const d=hi*.74; // closer than the whole-island fit, like the reference frame (101 large, island fills the view)
  return {target:C,pos:C.clone().addScaledVector(dir,d),dist:d};
}
""")
    sub("function home() { if(stage.clientWidth>860)panorama();else enterCity(\"taipei\"); }", "function home() { panorama(); }")
    # Zoom out beyond the default view is allowed; policy tags are visible at the default distance.
    sub("const o = overview(); controls.maxDistance = o.dist; ENV.fit?.(o.dist);", "const o = overview(); controls.maxDistance = o.dist*1.5; ENV.fit?.(o.dist*1.5);")
    sub("labelTH = Math.min(o.dist * 0.94,cityDist * 1.12);", "labelTH = o.dist * 1.08;")
    sub('const o=overview(),desktop=stage.clientWidth>860,f=desktop?o:cityFrame("taipei");controls.maxDistance=o.dist;ENV.fit?.(o.dist);entered=desktop?null:"taipei";camera.position.copy(f.pos);controls.target.copy(f.target);controls.update();stage.classList.toggle("pano",desktop);',
        'const o=overview(),desktop=true,f=o;controls.maxDistance=o.dist*1.5;ENV.fit?.(o.dist*1.5);entered=null;camera.position.copy(f.pos);controls.target.copy(f.target);controls.update();stage.classList.toggle("pano",desktop);')
    sub("function armPanoramaOrbit() { if(stage.clientWidth>860)return; panoramaOrbit.armed=true;", "function armPanoramaOrbit() { panoramaOrbit.armed=true;")
    sub("if(now-panoramaOrbit.waitingSince<5000)return false;\n  const step=Math.min(Math.max(0,dt)*Math.PI*2/180,Math.PI*2-panoramaOrbit.angle);",
        "if(now-panoramaOrbit.waitingSince<1500)return false;\n  const step=Math.max(0,dt)*Math.PI*2/180; // one revolution every 3 minutes, continuous")
    sub("  if(panoramaOrbit.angle>=Math.PI*2-1e-9)stopPanoramaOrbit();\n", "")
    # Faster first paint:
    # 1) the two brand logos were inlined as ~1.6 MB PNG data URIs, each twice (8.8 MB of the 9.6 MB page);
    #    serve them as small WebP files instead (shared by the loading screen and the header, cached once);
    # 2) shaders compile asynchronously before the first frame;
    # 3) the loading page becomes the pre-rendered default view (day or night by Taipei time) with a small status
    #    pill, so the city is on screen immediately and the live 3D takes over in place.
    from PIL import Image
    assets = P / "assets"
    def logo(match):
        raw = base64.b64decode(match.group(1))
        im = Image.open(io.BytesIO(raw))
        name = "brand-v064-mobile.webp" if im.size[0] < 2000 else "brand-v064-desktop.webp"
        out = assets / name
        if not out.exists():
            w = 760 if "mobile" in name else 1086
            im.resize((w, round(im.size[1] * w / im.size[0])), Image.LANCZOS).save(out, "WEBP", quality=90, method=6)
        return "assets/" + name
    s, n = re.subn(r'data:image/png;base64,([A-Za-z0-9+/=]+)', logo, s)
    assert n == 4, n
    # No high-altitude neon city sign for Taipei, and no leader line / anchor dot.
    sub("/* one callout per explored island", "cityLeaders.visible=false;cityAnchorDots.visible=false;for(const v of citySignViews){v.object.removeFromParent();v.object.element?.remove();}\n/* one callout per explored island")
    sub('stage.classList.add("ready");', 'try{await renderer.compileAsync(scene,camera);}catch(e){}\nstage.classList.add("ready");')
    sub("document.documentElement.classList.add('hi','booting');",
        "document.documentElement.classList.add('hi','booting');"
        "try{const h=+new Intl.DateTimeFormat('en-GB',{hour:'numeric',hourCycle:'h23',timeZone:'Asia/Taipei'}).format(new Date());if(h<6||h>=18)document.documentElement.classList.add('poster-night');}catch(e){}")
    sub("html.hi:not(.booting) .loading{display:none}", "html.hi:not(.booting) .loading{display:none}" + POSTER_CSS)
    s = re.sub(r'<title>.*?</title>', '<title>台北安可擬真臺北 v0.6.4</title>', s, count=1)
    OUT.write_text(s, encoding="utf-8")
    print(f"Built v{VERSION} realistic Taipei only (New Taipei and bridges removed) -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build()
