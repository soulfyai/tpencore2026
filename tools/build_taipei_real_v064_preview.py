"""Build v0.6.4: v0.6.1 content (production shell + realistic Taipei), with New Taipei and the two bridges removed.

Reuses the v0.6.1 injections from tools/build_taipei_real_shell_preview.py (so both stay in sync), then makes the
page Taipei-only at the data level: New Taipei is dropped from the city list (no island, art, policy list, labels,
landmarks or city sign), the Guandu and Danjiang bridges and their traffic are not built, and the few places
that assumed two cities (cluster offset, ship gateways, desktop panorama framing) only use the cities present.
"""
import pathlib
import re
import runpy

ROOT = pathlib.Path(__file__).resolve().parents[1]
P = ROOT / "prototypes"
OUT = P / "greater-taipei-v0.6.4.html"
VERSION = "0.6.4"

base = runpy.run_path(str(ROOT / "tools" / "build_taipei_real_shell_preview.py"))


def build():
    s = base["SRC"].read_text(encoding="utf-8")

    def sub(a, b, count=1):
        nonlocal s
        assert s.count(a) >= 1, a[:80]
        s = s.replace(a, b, count)

    sub('import * as THREE from "three";\n', 'import * as THREE from "three";\n' + base["IMPORT"])
    sub("APPROVED_ART.transport=await buildTransportNetwork(", base["REPLACE"] + "APPROVED_ART.transport=await buildTransportNetwork(")
    sub("APPROVED_ART.ao=artAO;", "APPROVED_ART.ao=artAO;" + base["UPDATE"])
    sub('content="0.4.12"', f'content="{VERSION}"')
    sub('const near = THREE.MathUtils.clamp(camDist * 0.02, 0.3, 12);', 'const near = THREE.MathUtils.clamp(camDist * 0.02, 0.012, 12);')
    # Taipei only: New Taipei and the two cross-river bridges are removed.
    sub('const ORDER=["taipei","newtaipei","keelung","taoyuan"];', 'const ORDER=["taipei"];')
    sub('const LIVE_CITIES = new Set(["taipei", "newtaipei"]);', 'const LIVE_CITIES = new Set(["taipei"]);')
    sub('for (const c of ["newtaipei"]) {', 'for (const c of ["newtaipei"].filter((c) => islands.some((i) => i.city === c))) {')
    sub('const gateways=["newtaipei","taipei"]', 'const gateways=["newtaipei","taipei"].filter(c=>WORLD.cities.has(c))')
    sub("for(const id of ['taipei','newtaipei'])for(const [x,z] of WORLD.cities.get(id).coast)",
        "for(const id of ['taipei','newtaipei'].filter(id=>WORLD.cities.has(id)))for(const [x,z] of WORLD.cities.get(id).coast)")
    sub("for(const input of inputs){", "for(const input of inputs){\n if(!A.cityById.get(input.city.city))continue;")
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
    s = re.sub(r'<title>.*?</title>', '<title>台北安可擬真臺北 v0.6.4</title>', s, count=1)
    OUT.write_text(s, encoding="utf-8")
    print(f"Built v{VERSION} realistic Taipei only (New Taipei and bridges removed) -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build()
