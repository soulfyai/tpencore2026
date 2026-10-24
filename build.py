"""Merge data/*.json into one dataset, validate sourcing, and inline it into index.html."""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).parent
# 資料查核日（頁面上顯示）：人工重新查核 data/ 內容後才更新，不要自動帶當天日期
CHECKED_AT = "2026-10-22"
CITIES = ["taipei", "newtaipei", "keelung", "taoyuan"]
problems = []

cities = []
for c in CITIES:
    p = ROOT / "data" / f"{c}.json"
    if not p.exists():
        problems.append(f"missing {p.name}")
        continue
    cities.append(json.loads(p.read_text(encoding="utf-8")))

# fold in systematic in-office record sweeps (data/records-<city>.json)
for c in cities:
    rp = ROOT / "data" / f"records-{c['city']}.json"
    if not rp.exists():
        continue
    r = json.loads(rp.read_text(encoding="utf-8"))
    c["sources"] = c.get("sources", []) + r.get("sources", [])
    have = {a["name"] for a in c.get("achievements", [])}
    for a in r.get("achievements", []):
        if a["name"] not in have:
            c.setdefault("achievements", []).append(a)

fp = ROOT / "data" / "flows.json"
flows = json.loads(fp.read_text(encoding="utf-8")) if fp.exists() else {"sources": [], "flows": [], "unknowns": []}

src_ids = {}
for c in cities:
    for s in c.get("sources", []):
        if s["id"] in src_ids:
            problems.append(f"duplicate source id {s['id']}")
        src_ids[s["id"]] = s
for s in flows.get("sources", []):
    src_ids[s["id"]] = s
for sid, s in src_ids.items():
    if not (s.get("url") or "").startswith("http"):
        problems.append(f"source {sid} has no url")
    if s.get("tier") not in ("official", "news", "interview"):
        problems.append(f"source {sid} bad tier {s.get('tier')}")

n_items = 0
for c in cities:
    for t in c.get("themes", []):
        for it in t.get("items", []):
            n_items += 1
            ids = it.get("sources") or []
            if not ids:
                problems.append(f"{it['id']} has no sources")
            for sid in ids:
                if sid not in src_ids:
                    problems.append(f"{it['id']} cites unknown {sid}")
for f in flows.get("flows", []):
    for sid in f.get("sources", []):
        if sid not in src_ids:
            problems.append(f"flow {f['id']} cites unknown {sid}")
    if f.get("tier") not in ("official", "news", "interview"):
        problems.append(f"flow {f['id']} bad tier")

# cities whose in-office record is shown as its own map tile
SHOW_RECORD = {"taipei": "tp", "keelung": "kl", "taoyuan": "ty"}
# in-office records become one island per policy area; areas with a single item share an island
AREA_ORDER = ["交通", "住宅都更", "社福", "衛生", "教育", "產業", "數位", "勞動", "環保", "工務水利", "文化觀光", "體育", "市政效能", "治安消防"]
AREA_SLUG = {"交通": "transport", "住宅都更": "housing", "社福": "welfare", "衛生": "health", "教育": "education", "產業": "industry",
             "數位": "digital", "勞動": "labor", "環保": "environment", "工務水利": "works", "文化觀光": "culture", "體育": "sport",
             "市政效能": "civic", "治安消防": "safety"}
for c in cities:
    pre = SHOW_RECORD.get(c["city"])
    if not (pre and c.get("achievements")):
        continue
    groups = {}
    for a in c["achievements"]:
        groups.setdefault(a.get("area") or "其他", []).append(a)
    small = [k for k, v in groups.items() if len(v) < 2]
    if len(small) > 0:
        rest = [a for k in small for a in groups.pop(k)]
        if rest:
            groups["其他"] = groups.get("其他", []) + rest
    order = sorted(groups, key=lambda k: (AREA_ORDER.index(k) if k in AREA_ORDER else 99))
    n = 0
    for area in order:
        slug = AREA_SLUG.get(area, "misc")
        c["themes"].append({
            "id": f"{pre}-rec-{slug}", "name": f"政績・{area}", "kind": "record", "area": area,
            "summary": f"{c['candidate']}本屆任內在「{area}」領域已完成或已上路的施政，和政見分開列出，方便對照。",
            "sources": [],
            "items": [{"id": f"{pre}-rec-{slug}-{k+1}", "name": a["name"], "plain": a.get("plain"), "who": None,
                       "facts": a.get("facts", []), "phase": "已實施", "area": a.get("area"), "tags": ["任內政績"], "sources": a.get("sources", [])}
                      for k, a in enumerate(groups[area])]})
        n += len(groups[area])
    assert n == len(c["achievements"])
    c["recordShown"] = True

for c in cities:
    for a in c.get("achievements", []):
        if not a.get("sources"):
            problems.append(f"record {a['name']} has no sources")
        for sid in a.get("sources", []):
            if sid not in src_ids:
                problems.append(f"record {a['name']} cites unknown {sid}")

wp = ROOT / "data" / "weather.json"
gp = ROOT / "data" / "geo.json"
data = {"meta": {"checkedAt": CHECKED_AT, "geo": json.loads(gp.read_text(encoding="utf-8")) if gp.exists() else None, "weather": json.loads(wp.read_text(encoding="utf-8")) if wp.exists() else None}, "cities": cities, "flows": flows}
html = (ROOT / "template.html").read_text(encoding="utf-8")
blob = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
(ROOT / "index.html").write_text(html.replace("/*__DATA__*/null", blob), encoding="utf-8")

print(f"cities={len(cities)} themes={sum(len(c.get('themes', [])) for c in cities)} items={n_items} flows={len(flows.get('flows', []))} sources={len(src_ids)}")
print("problems:" if problems else "no problems")
for p in problems:
    print(" -", p)

# ---------- 3D variant ----------
page = (ROOT / "index.html").read_text(encoding="utf-8")
def sub(a, b, count=1):
    global page
    assert a in page, a[:60]
    page = page.replace(a, b, count)

sub("的公開政見，一格一個政策主題</p>", "的公開政見與任內政績</p>")
boot = """<script>
document.documentElement.classList.add('hi','booting');
window.cityLoadFailed=function(){
  const status=document.querySelector('#loading .loading-status'),hint=document.querySelector('#loading .loading-hint'),retry=document.getElementById('loading-retry');
  if(status)status.textContent='無法載入城市畫面';
  if(hint)hint.textContent='請重新整理後再試一次。';
  if(retry)retry.hidden=false;
  const actions=document.getElementById('loading-actions');if(actions)actions.hidden=false;
  const spinner=document.querySelector('.loading-spinner');if(spinner)spinner.hidden=true;
  const stage=document.getElementById('stage');if(stage)stage.setAttribute('aria-busy','false');
};
</script>
"""
sub('<link rel="stylesheet" href="https://fonts.googleapis.com/', '<link rel="stylesheet" media="print" onload="this.media=\'all\'" href="https://fonts.googleapis.com/')
sub("--hex-mix:20%;", "--hex-mix:20%; --water:#A8CBDF; --water-deep:#86AFC7; --bldg:#F3EFE8; --bldg-shade:#D8D2C8; --sky-top:#7FB0EC; --sky-bottom:#D4E8FA; --f-pixel:\"DotGothic16\",\"Noto Sans TC\",monospace;")
sub("--hex-mix:26%; color-scheme:dark", "--hex-mix:26%; --water:#173246; --water-deep:#0F2232; --bldg:#C9CED3; --bldg-shade:#9AA2AA; --sky-top:#0E1830; --sky-bottom:#24365A; color-scheme:dark", 2)
sub('<svg class="map" id="map" role="img" aria-label="六角格地圖：台北、新北、基隆、桃園，每格是一位候選人的一項政策主題；完整內容請用右側清單"></svg>',
    '<div class="stage" id="stage" role="group" aria-busy="true" aria-label="3D 政策城市：台北、新北、基隆、桃園，每個街區是一項政策主題">'
    '<section class="loading" id="loading" aria-label="城市載入狀態">'
    '<div class="loading-brand">台北安可<span>一起打造你我的北北基桃</span></div>'
    '<div class="loading-spinner" aria-hidden="true"></div>'
    '<p class="loading-status" role="status">正在載入四座政策城市…</p>'
    '<p class="loading-hint">準備好後，會自動顯示全景。</p>'
    '<div class="loading-actions" id="loading-actions" hidden><button id="loading-retry" type="button" onclick="location.reload()" hidden>重新整理</button></div>'
    '<small>獨立整理，非任何候選人或政黨官方網站</small>'
    '</section></div>'
    '<div class="key" aria-label="圖例"><span><i class="k-done"></i>已完成</span><span><i class="k-build"></i>施工中</span><span><i class="k-planb"></i>政見</span><span class="lm">白色標籤＝城市地標・一個大街區＝一個政策主題</span><span class="hint">拖曳旋轉・滾輪或雙指縮放・點街區看細項</span></div>')
sub("</style>", (ROOT / "3d" / "page.css").read_text(encoding="utf-8") + """
.stage{position:relative;flex:1;min-height:0;overflow:hidden;background:linear-gradient(180deg,var(--sky-top),var(--sky-bottom))}
.stage canvas{display:block;touch-action:none}
.loading{position:absolute;inset:0;display:grid;place-items:center;margin:0;color:var(--muted);font-family:var(--f-display);font-size:18px}
.stage.ready .loading{display:none}
.labels{position:absolute;inset:0;pointer-events:none}
.labels button{pointer-events:auto}
.tlabel{font:700 12px/1.2 var(--f-body);color:var(--ink);background:color-mix(in srgb,var(--surface) 94%,transparent);border:1.5px solid color-mix(in srgb,var(--c) 55%,var(--line));border-radius:999px;box-shadow:0 2px 6px rgba(20,30,40,.18);padding:3px 7px 3px 6px;white-space:nowrap;cursor:pointer;display:flex;gap:5px;align-items:center;transform:translateY(50%)}
.tlabel b{font:400 9px var(--f-mono);color:var(--muted)}
.tlabel.rec{border-style:dashed}
.tlabel.sel{background:var(--c);color:var(--surface);border-color:var(--c)}
.tlabel.sel b{color:var(--surface);opacity:.8}
.tlabel.hot{border-color:var(--c);box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 30%,transparent)}
.tlabel.dim{opacity:.3}
.stage.far .tlabel:not(.sel):not(.hot){font-size:0;padding:2px 5px;gap:0}
.stage.far .tlabel:not(.sel):not(.hot) b{font-size:9px}
@media (max-width:860px){.stage.far .tlabel:not(.sel):not(.hot){display:none}}
.clabel{font:800 21px/1.1 var(--f-display);color:var(--c);text-shadow:0 0 3px var(--surface),0 0 8px var(--surface),0 0 14px var(--surface);pointer-events:none;white-space:nowrap}
.clabel span{display:block;font:600 12px var(--f-body);color:var(--ink);text-align:center}
.pin{font:600 12px/1.2 var(--f-body);color:var(--ink);background:var(--surface);border:1.5px solid var(--line);border-radius:999px;box-shadow:0 2px 6px rgba(20,30,40,.18);padding:2px 8px 2px 3px;display:flex;gap:4px;align-items:center;cursor:pointer;white-space:nowrap;transform:translateY(-50%)}
.pin b{font-weight:700;color:var(--route);font-size:13px}
.pin.mini span{display:none}
.pin.mini{padding:2px 4px}
.pin:hover span,.pin.sel span{display:inline}
.pin.sel{border-color:var(--route);box-shadow:0 0 0 2px color-mix(in srgb,var(--route) 30%,transparent);z-index:2}
.key{display:flex;flex-wrap:wrap;gap:6px 14px;padding:7px 12px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
.key span{display:inline-flex;align-items:center;gap:6px}
.key i{width:14px;height:12px;border-radius:3px;display:inline-block}
.key .k-plan{background:repeating-linear-gradient(90deg,var(--c-taipei) 0 5px,#c9d8ea 5px 8px);border-radius:2px}
.key .k-built{background:repeating-conic-gradient(#f8f6f1 0 25%,var(--c-taipei) 0 50%) 0 0/8px 8px;border-radius:2px;box-shadow:inset 0 0 0 1px var(--line)}
.key .hint{margin-left:auto}
.key .k-done,.key .k-build,.key .k-planb{width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px var(--line)}
.key .k-done{background:#2e9e5b}.key .k-build{background:#e07b1f}.key .k-planb{background:#1f4fb8}
.lmlabel{font:800 14px/1.2 var(--f-body);color:#14213d;background:#fff;border:2px solid var(--c);border-radius:10px;padding:5px 10px 5px 6px;white-space:nowrap;pointer-events:none;transform:translateY(-60%);box-shadow:0 4px 12px rgba(20,30,60,.22);display:flex;align-items:center;gap:6px}
.lm-pin{width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--c);display:inline-block;box-shadow:inset 0 0 0 5px var(--c),inset 0 0 0 9px #fff}
.cityhud{position:absolute;left:10px;top:10px;z-index:21;display:flex;gap:8px;align-items:center}
.stage:not(.incity) .cityhud{display:none}
.backbtn{font:700 13px var(--f-body);min-height:40px;padding:0 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer;box-shadow:0 2px 8px rgba(20,30,60,.14)}
.hudtitle{font:800 15px var(--f-display);color:var(--ink);background:color-mix(in srgb,var(--surface) 92%,transparent);border:1px solid var(--line);border-radius:12px;padding:8px 12px;display:flex;gap:8px;align-items:center;box-shadow:0 2px 8px rgba(20,30,60,.12)}
.hudtitle i{width:12px;height:12px;border-radius:3px;display:inline-block}
.candcard{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:150px;padding:10px 14px 10px 12px;border-radius:14px;border:2px solid var(--c);border-left-width:8px;background:var(--surface);color:var(--ink);cursor:pointer;font-family:var(--f-body);box-shadow:0 8px 22px rgba(20,30,60,.22);transform:translateY(-70%);text-align:left}
.candcard:hover,.candcard.hot{transform:translateY(-74%);box-shadow:0 12px 28px rgba(20,30,60,.3)}
.cc-city{font-size:12px;color:var(--muted);font-weight:600}.cc-name{font:800 20px/1.15 var(--f-display);color:var(--c)}.cc-stat{font-size:12px;color:var(--ink)}.cc-go{margin-top:4px;font:700 12.5px var(--f-body);color:#fff;background:var(--c);border-radius:999px;padding:3px 10px}
.nbr{font:700 12px var(--f-body);color:var(--c);background:color-mix(in srgb,var(--surface) 90%,transparent);border:1.5px dashed var(--c);border-radius:999px;padding:5px 10px;cursor:pointer;white-space:nowrap}
.tlabel i{font-style:normal;font:700 10px var(--f-mono);background:var(--c);color:#fff;border-radius:999px;padding:1px 6px;margin-left:2px}
.tlabel.sel i{background:#fff;color:var(--c)}
.stage.far .lmlabel{font-size:10.5px}
.layers{position:absolute;right:10px;top:10px;z-index:20;display:flex;flex-direction:column;gap:6px;align-items:flex-end}
.layerbtns{display:flex;gap:4px;background:color-mix(in srgb,var(--surface) 92%,transparent);border:1px solid var(--line);border-radius:12px;padding:4px;box-shadow:0 2px 8px rgba(20,30,60,.12)}
.layerbtns button{font:600 12.5px var(--f-body);min-height:36px;padding:0 10px;border-radius:8px;border:0;background:transparent;color:var(--ink);cursor:pointer}
.layerbtns button[aria-pressed=true]{background:var(--ink);color:var(--surface)}
.layerleg{display:flex;flex-wrap:wrap;gap:4px 10px;justify-content:flex-end;background:color-mix(in srgb,var(--surface) 92%,transparent);border:1px solid var(--line);border-radius:10px;padding:5px 9px;font-size:11.5px;color:var(--ink)}
.layerleg span{display:inline-flex;gap:5px;align-items:center}.layerleg i{width:11px;height:11px;border-radius:3px;display:inline-block}
@media (max-width:860px){.candcard{min-width:0;padding:6px 9px 6px 8px}.cc-name{font-size:15px}.cc-stat,.cc-city{font-size:10.5px}.cc-go{font-size:11px;padding:2px 8px}.lmlabel{font-size:12px;padding:3px 7px 3px 4px}.lm-pin{width:13px;height:13px}.layers{right:8px;top:auto;bottom:8px}.layerbtns button{min-height:34px;padding:0 8px;font-size:12px}.layerleg{display:none}}
.wx{position:absolute;left:10px;bottom:10px;z-index:20;max-width:min(560px,calc(100% - 20px));display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;font:600 12px/1.3 var(--f-body);color:var(--ink);background:color-mix(in srgb,var(--surface) 90%,transparent);border:1px solid var(--line);border-radius:10px;padding:6px 10px;box-shadow:0 2px 8px rgba(20,30,60,.12)}
.wx b{font:700 13px var(--f-body)}
.wx span{white-space:nowrap}
.wx small{font:400 11px var(--f-body);color:var(--muted);width:100%}
@media (max-width:860px){.wx{left:8px;top:8px;padding:4px 8px;font-size:11px}.wx span:nth-child(n+3),.wx small{display:none}}
.mapwrap .legend{bottom:44px}
@media (max-width:860px){.stage{flex:none;aspect-ratio:1/1;max-width:100%}.mapwrap .legend{bottom:auto}.key .hint{margin-left:0}}
</style>""")
mod = "\n".join((ROOT / "3d" / f).read_text(encoding="utf-8") for f in ["core.js", "world.js", "env.js", "models.js", "models2.js", "models3.js", "landmarks.js", "ships.js", "decor.js", "people.js", "coaster.js", "main.js", "ui.js"])
imports = "\n".join(l for l in mod.splitlines() if l.startswith("import "))
body = "\n".join(l for l in mod.splitlines() if not l.startswith("import "))
sub("</script>\n", """</script>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
<script type="module" onerror="window.cityLoadFailed()">
""" + imports + """
try{
""" + body + """
}catch(err){console.error(err);window.cityLoadFailed();}
</script>
""")
(ROOT / "index3d.html").write_text(boot + page, encoding="utf-8")
print("wrote index3d.html")
