"""Build the independent v0.6.0 realistic Taipei preview (prototypes/taipei-real-v0.6.0.html).

Taipei is rendered by prototypes/taipei-real-v060.js: real district outlines, rivers, mountains and
landmarks, with one policy campus per theme. Content comes only from data/taipei.json and
data/records-taipei.json, grouped exactly like build.py. Production and earlier previews are untouched.
"""
import ast
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "prototypes" / "taipei-real-v0.6.0.html"
VERSION = "0.6.0"


def build_constants():
    """Read CHECKED_AT / AREA_ORDER / AREA_SLUG literals from build.py without executing it."""
    tree = ast.parse((ROOT / "build.py").read_text(encoding="utf-8"))
    found = {}
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            name = node.targets[0].id
            if name in ("CHECKED_AT", "AREA_ORDER", "AREA_SLUG"):
                found[name] = ast.literal_eval(node.value)
    missing = {"CHECKED_AT", "AREA_ORDER", "AREA_SLUG"} - found.keys()
    if missing:
        raise RuntimeError(f"build.py constants not found: {missing}")
    return found


def taipei_dataset():
    k = build_constants()
    city = json.loads((ROOT / "data" / "taipei.json").read_text(encoding="utf-8"))
    rec = json.loads((ROOT / "data" / "records-taipei.json").read_text(encoding="utf-8"))
    sources = {s["id"]: s for s in city.get("sources", []) + rec.get("sources", [])}
    achievements = list(city.get("achievements", []))
    have = {a["name"] for a in achievements}
    achievements += [a for a in rec.get("achievements", []) if a["name"] not in have]

    themes = [dict(t, kind="policy") for t in city["themes"]]
    groups = {}
    for a in achievements:
        groups.setdefault(a.get("area") or "其他", []).append(a)
    small = [g for g, v in groups.items() if len(v) < 2]
    rest = [a for g in small for a in groups.pop(g)]
    if rest:
        groups["其他"] = groups.get("其他", []) + rest
    order = sorted(groups, key=lambda g: (k["AREA_ORDER"].index(g) if g in k["AREA_ORDER"] else 99))
    for area in order:
        slug = k["AREA_SLUG"].get(area, "misc")
        themes.append({
            "id": f"tp-rec-{slug}", "name": f"政績・{area}", "kind": "record", "area": area,
            "summary": f"{city['candidate']}本屆任內在「{area}」領域已完成或已上路的施政，和政見分開列出，方便對照。",
            "items": [{"id": f"tp-rec-{slug}-{i + 1}", "name": a["name"], "plain": a.get("plain"), "who": None,
                       "facts": a.get("facts", []), "phase": "已實施", "tags": ["任內政績"], "sources": a.get("sources", [])}
                      for i, a in enumerate(groups[area])]})

    problems, used = [], set()
    for n, t in enumerate(themes, 1):
        t["no"] = n
        for it in t["items"]:
            if not it.get("sources"):
                problems.append(f"{it['id']} has no sources")
            for sid in it.get("sources", []):
                if sid not in sources:
                    problems.append(f"{it['id']} cites unknown {sid}")
                used.add(sid)
    if problems:
        raise RuntimeError("Source validation failed: " + "; ".join(problems))
    keep = ("id", "name", "kind", "area", "summary", "vision", "no", "items")
    return {
        "version": VERSION, "checkedAt": k["CHECKED_AT"], "city": city["city"], "cityName": city["cityName"],
        "candidate": city["candidate"], "cityColor": "#1F4FB8",
        "themes": [{key: t[key] for key in keep if key in t} for t in themes],
        "sources": {sid: {key: sources[sid].get(key) for key in ("title", "url", "publisher", "date")} for sid in sorted(used)},
    }


TEMPLATE = r"""<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>台北安可｜擬真臺北預覽 v__VERSION__</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500;700;900&family=Noto+Serif+TC:wght@700;900&display=swap">
<link rel="stylesheet" href="taipei-real-v060.css">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
<style>
:root{--c-taipei:#1F4FB8;--c-taipei-soft:#6F9BF2;--ink:#14213a;--muted:#5a6880;--line:#dfe5ee;--surface:#fff;--bg:#0c1524;
  --f-body:"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif;--f-display:"Noto Serif TC","Songti TC",serif}
html,body{margin:0;height:100%;background:var(--bg);font-family:var(--f-body);color:var(--ink)}
#stage{position:fixed;inset:0}
#stage .tpi-root{--policy:var(--c-taipei)}
.brand{position:fixed;z-index:20;top:calc(14px + env(safe-area-inset-top,0px));left:calc(16px + env(safe-area-inset-left,0px));pointer-events:none}
.brand h1{margin:0;font:900 clamp(28px,4.2vw,44px)/1 var(--f-display);letter-spacing:.12em;color:#fff;
  text-shadow:0 0 6px #fff,0 0 16px rgba(120,190,255,.95),0 0 34px rgba(60,140,255,.8)}
.brand p{margin:8px 0 0;font:700 13px/1.4 var(--f-body);letter-spacing:.12em;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.55)}
.brand .tag{display:inline-block;margin-top:6px;padding:3px 8px;border-radius:6px;background:rgba(255,207,74,.95);color:#2a2000;font:800 11px var(--f-body);letter-spacing:.06em}
.listbtn{position:fixed;z-index:20;top:calc(118px + env(safe-area-inset-top,0px));left:calc(16px + env(safe-area-inset-left,0px));
  font:700 13px var(--f-body);padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.5);background:var(--c-taipei);color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}
.notice{position:fixed;z-index:20;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom,0px));max-width:calc(100% - 32px);
  padding:6px 12px;border-radius:999px;background:rgba(12,21,36,.78);color:#e8eef5;font:500 12px/1.4 var(--f-body);text-align:center;backdrop-filter:blur(6px)}
.notice b{color:#fff}
.notice a{color:#bcd3ff}
.panel{position:fixed;z-index:30;top:0;right:0;bottom:0;width:min(420px,100%);background:var(--surface);box-shadow:-10px 0 30px rgba(0,0,0,.25);
  display:flex;flex-direction:column;transform:translateX(105%);transition:transform .28s ease}
.panel.open{transform:none}
.panel header{padding:calc(18px + env(safe-area-inset-top,0px)) 20px 14px;border-bottom:1px solid var(--line);display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start}
.panel .chip{display:inline-flex;align-items:center;gap:6px;font:700 12px var(--f-body);color:var(--c-taipei)}
.panel .chip i{width:10px;height:10px;border-radius:50%;background:var(--c-taipei)}
.panel h2{margin:6px 0 0;font:900 24px/1.25 var(--f-display);text-wrap:balance}
.panel .summary{grid-column:1/-1;margin:6px 0 0;color:var(--muted);line-height:1.7;font-size:14px}
.panel .close{border:0;background:#eef2f8;width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer;color:var(--ink)}
.panel .body{overflow:auto;padding:8px 20px calc(24px + env(safe-area-inset-bottom,0px))}
.item{padding:16px 0;border-bottom:1px solid var(--line)}
.item h3{margin:0 0 6px;font:800 17px/1.4 var(--f-body)}
.item p{margin:0 0 8px;line-height:1.75;font-size:15px}
.item .who{color:var(--muted);font-size:13px}
.item ul{margin:6px 0 8px;padding-left:20px;line-height:1.7;font-size:14px}
.pill{display:inline-block;margin:0 6px 6px 0;padding:2px 8px;border-radius:6px;background:#eef3ff;color:var(--c-taipei);font:700 12px var(--f-body)}
.src{margin-top:6px;font-size:12.5px;line-height:1.65;color:var(--muted)}
.src a{color:var(--c-taipei);text-decoration:none}
.src a:hover{text-decoration:underline}
.list{position:fixed;z-index:25;top:calc(160px + env(safe-area-inset-top,0px));left:calc(16px + env(safe-area-inset-left,0px));width:min(300px,calc(100% - 32px));
  max-height:calc(100% - 230px);overflow:auto;background:var(--surface);border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.3);padding:8px}
.list button{display:flex;gap:10px;align-items:center;width:100%;text-align:left;border:0;background:none;padding:9px 8px;border-radius:8px;font:600 14px var(--f-body);color:var(--ink);cursor:pointer}
.list button:hover{background:#f0f4fb}
.list button b{display:grid;place-items:center;min-width:26px;height:26px;border-radius:50%;background:var(--c-taipei);color:#fff;font:800 12px var(--f-body)}
.list button.rec b{background:#fff;color:var(--c-taipei);border:1.5px solid var(--c-taipei)}
.list h4{margin:8px 8px 4px;font:800 12px var(--f-body);color:var(--muted);letter-spacing:.08em}
@media (max-width:760px){
  .panel{top:auto;width:100%;height:62%;border-radius:18px 18px 0 0;transform:translateY(105%)}
  .panel.open{transform:none}
  .brand h1{font-size:28px}.brand p{font-size:11px}
  .listbtn{top:calc(96px + env(safe-area-inset-top,0px))}
  .list{top:calc(138px + env(safe-area-inset-top,0px))}
  #stage .tpi-root .tpi-hint{display:none}
}
</style>
</head>
<body>
<div id="stage"></div>
<div class="brand"><h1>台北安可</h1><p>臺北市・__CANDIDATE__ 政見與任內政績</p><span class="tag">擬真城市預覽 v__VERSION__・未替換正式網站</span></div>
<button class="listbtn" id="listbtn" type="button" aria-expanded="false">政策清單</button>
<div class="list" id="list" hidden></div>
<aside class="panel" id="panel" aria-hidden="true">
  <header><div><span class="chip" id="pchip"><i></i><span></span></span><h2 id="ptitle"></h2></div><button class="close" id="pclose" type="button" aria-label="關閉">✕</button><p class="summary" id="psum"></p></header>
  <div class="body" id="pbody"></div>
</aside>
<div class="notice"><b>獨立整理，非任何候選人或政黨官方網站</b>・資料查核至 __CHECKED__・<a href="https://tpencore.tw/" target="_blank" rel="noopener">正式網站</a></div>
<script id="tpe-data" type="application/json">__DATA__</script>
<script type="module">
import { createTaipeiIsland } from './taipei-real-v060.js';
const D = JSON.parse(document.getElementById('tpe-data').textContent);
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let island = null, current = null;

function srcLine(ids){
  return (ids||[]).map(id=>{const s=D.sources[id];if(!s)return '';
    return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.publisher||'來源')+'</a>'+(s.date?'・'+esc(s.date):'')+'：'+esc(s.title);}).filter(Boolean).join('<br>');
}
function openTheme(t, fly){
  current=t.id;$('pchip').lastElementChild.textContent=t.kind==='record'?'任內政績':'政見';
  $('ptitle').textContent=t.name.replace(/^政績・/,'');$('psum').textContent=t.summary||'';
  $('pbody').innerHTML=t.items.map(it=>'<article class="item"><h3>'+esc(it.name)+'</h3>'+(it.plain?'<p>'+esc(it.plain)+'</p>':'')+
    (it.who?'<div class="who">對象：'+esc(it.who)+'</div>':'')+((it.facts||[]).length?'<ul>'+it.facts.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul>':'')+
    (it.phase?'<span class="pill">'+esc(it.phase)+'</span>':'')+(it.tags||[]).map(g=>'<span class="pill">'+esc(g)+'</span>').join('')+
    '<div class="src">來源：<br>'+srcLine(it.sources)+'</div></article>').join('');
  $('panel').classList.add('open');$('panel').setAttribute('aria-hidden','false');$('pbody').scrollTop=0;
  if(island){island.setActivePolicy(t.id);if(fly)island.focusPolicy(t.id);}
}
function closePanel(){current=null;$('panel').classList.remove('open');$('panel').setAttribute('aria-hidden','true');if(island)island.setActivePolicy(null);}
$('pclose').onclick=closePanel;
addEventListener('keydown',e=>{if(e.key==='Escape')closePanel();});

const pol=D.themes.filter(t=>t.kind!=='record'),rec=D.themes.filter(t=>t.kind==='record');
const row=t=>'<button type="button" data-id="'+t.id+'" class="'+(t.kind==='record'?'rec':'')+'"><b>'+String(t.no).padStart(2,'0')+'</b><span>'+esc(t.name.replace(/^政績・/,''))+'</span></button>';
$('list').innerHTML='<h4>政見</h4>'+pol.map(row).join('')+'<h4>任內政績</h4>'+rec.map(row).join('');
$('list').onclick=e=>{const b=e.target.closest('button[data-id]');if(!b)return;const t=D.themes.find(x=>x.id===b.dataset.id);$('list').hidden=true;$('listbtn').setAttribute('aria-expanded','false');openTheme(t,true);};
$('listbtn').onclick=()=>{const h=!$('list').hidden;$('list').hidden=h;$('listbtn').setAttribute('aria-expanded',String(!h));};

island = createTaipeiIsland($('stage'), {
  ui: { brand: false, controls: true, hint: true },
  landmarkLabels: false,
  focusOffset: () => matchMedia('(max-width:760px)').matches ? .3 : 0,   // 手機底部面板會遮住下半畫面，鏡頭目標往下方前移
  policies: D.themes, cityColor: D.cityColor,
  onSelect(place){ if(place.type==='policy'){ openTheme(place.theme,false); } }
});
window.TAIPEI_REAL = { island, data: D, openTheme };
</script>
</body>
</html>
"""


def build():
    data = taipei_dataset()
    blob = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    html = (TEMPLATE.replace("__DATA__", blob).replace("__VERSION__", VERSION)
            .replace("__CHECKED__", data["checkedAt"]).replace("__CANDIDATE__", data["candidate"]))
    OUT.write_text(html, encoding="utf-8")
    n = sum(len(t["items"]) for t in data["themes"])
    print(f"taipei-real v{VERSION}: themes={len(data['themes'])} items={n} sources={len(data['sources'])} -> {OUT.relative_to(ROOT)}")
    return data


if __name__ == "__main__":
    build()
