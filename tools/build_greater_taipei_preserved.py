"""Derive a two-city review from the production site without redesigning its geometry."""
from pathlib import Path
import copy
import json
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
KEEP = {'taipei', 'newtaipei'}
OUTSIDE = re.compile(r'桃園|基隆(?!河|路)|北北基桃')


def scope(value):
    if isinstance(value, str):
        return None if OUTSIDE.search(value) else value
    if isinstance(value, list):
        return [v for item in value if (v := scope(item)) is not None]
    if isinstance(value, dict):
        return {k: v for k, item in value.items() if (v := scope(item)) is not None}
    return value


def replace(text, old, new):
    assert old in text, old[:100]
    return text.replace(old, new, 1)


def build():
    frozen = {}
    for city in ['taipei', 'newtaipei']:
        snap = json.loads((ROOT / f'prototypes/{city}-preview-data.json').read_text())
        offset = snap.get('sourceCenter', [0, 0])
        frozen[city] = {
            'coast': [[x + offset[0], z + offset[1]] for x, z in snap['coast']],
            'half': snap['half'],
            'cells': [{**c,'c':[c['c'][0]+offset[0],c['c'][1]+offset[1]],'poly':[[x+offset[0],z+offset[1]] for x,z in c['poly']]} for c in snap['cells']],
            'themeCells': {t['id']: t['cells'] for t in snap['themes']},
        }
    with tempfile.TemporaryDirectory(prefix='tpencore-preserved-') as directory:
        stage = Path(directory)
        for name in ['build.py', 'template.html', 'VERSION']:
            shutil.copy2(ROOT / name, stage / name)
        shutil.copytree(ROOT / '3d', stage / '3d')
        shutil.copytree(ROOT / 'data', stage / 'data')
        for city in KEEP:
            for filename in [f'{city}.json', f'records-{city}.json']:
                path = stage / 'data' / filename
                if not path.exists():
                    continue
                raw = json.loads(path.read_text())
                if 'crossCity' in raw:
                    raw['crossCity'] = [c for c in raw['crossCity'] if set(c.get('with', [])) <= KEEP]
                path.write_text(json.dumps(scope(raw), ensure_ascii=False))
        path = stage / 'data/flows.json'
        flows = json.loads(path.read_text())
        flows['flows'] = [f for f in flows['flows'] if set(f['cities']) <= KEEP and not OUTSIDE.search(json.dumps(f, ensure_ascii=False))]
        used = {s for f in flows['flows'] for s in f['sources']}
        flows['sources'] = [s for s in flows['sources'] if s['id'] in used]
        flows['unknowns'] = []
        path.write_text(json.dumps(flows, ensure_ascii=False))
        for filename in ['geo.json', 'weather.json']:
            path = stage / 'data' / filename
            raw = json.loads(path.read_text())
            raw['cities'] = {k: v for k, v in raw['cities'].items() if k in KEEP}
            path.write_text(json.dumps(raw, ensure_ascii=False))
        path = stage / 'build.py'
        path.write_text(replace(path.read_text(), 'CITIES = ["taipei", "newtaipei", "keelung", "taoyuan"]', 'CITIES = ["taipei", "newtaipei"]'))
        path = stage / '3d/core.js'
        text = path.read_text().replace('new Set(["taipei", "newtaipei", "keelung", "taoyuan"])', 'new Set(["taipei", "newtaipei"])')
        text = text.replace('for (const c of ["newtaipei", "keelung", "taoyuan"])', 'for (const c of ["newtaipei"])')
        path.write_text(text)
        path = stage / '3d/world.js'
        text = path.read_text()
        text = replace(text, 'const WORLD = ', 'const PRESERVED_LAYOUT = ' + json.dumps(frozen, separators=(',', ':')) + ';\nconst WORLD = ')
        # Keep the already-published world offsets, not a newly packed two-city layout.
        text = replace(text, '  WORLD.geo = ', '''  for(const c of A.cities){const p=PRESERVED_LAYOUT[c.city].coast[0],o=outlines[c.city];o.off=[p[0]-o.local[0][0],p[1]-o.local[0][1]];}
  WORLD.geo = ''')
        text = replace(text, '  WORLD.blockCells = [];', '''  WORLD.landmarkSites=Object.fromEntries(Object.entries(WORLD.landmarkSites).filter(([,site])=>LIVE_CITIES.has(site.city)));
  WORLD.blockCells = [];''')
        text = replace(text, 'const outlinesWorld = new Map(A.cities.map(c => [c.city, outlines[c.city].local.map(([x,z]) => [x+outlines[c.city].off[0],z+outlines[c.city].off[1]])]));', 'const outlinesWorld = new Map(A.cities.map(c => [c.city,PRESERVED_LAYOUT[c.city].coast]));')
        start = text.index('  let blockHalfSize=1.5,layouts;')
        end = text.index('  WORLD.blockHalfSize=blockHalfSize;', start)
        text = text[:start] + '  const blockHalfSize=PRESERVED_LAYOUT.taipei.half,layouts=new Map(A.cities.map(c=>[c.city,PRESERVED_LAYOUT[c.city].cells]));\n' + text[end:]
        allocation_start=text.index('      const candidates=[...available]')
        allocation_end=text.index('      if(!group)throw new Error',allocation_start)
        text=text[:allocation_start]+'      const group=PRESERVED_LAYOUT[c.city].themeCells[isl.id].map(id=>cells.find(cell=>cell.id===id));\n      if(group.some(cell=>!cell))throw new Error("Original policy cells are missing");\n'+text[allocation_end:]
        text=text.replace("cells.filter(cell=>!cell.themeId)","cells.filter(cell=>!cell.themeId&&!cell.zone)")
        path.write_text(text)
        path = stage / '3d/people.js'
        text = path.read_text()
        text = text.replace('["keelung","taoyuan","newtaipei","taipei"].slice', '["newtaipei","taipei"].slice')
        text = replace(text, 'const TA = WORLD.geo("taoyuan", 121.233, 25.0797), SS = WORLD.geo("taipei", 121.5525, 25.0694);', 'const SS = WORLD.geo("taipei",121.5525,25.0694),TA=[SS[0]-30,SS[1]+18];')
        path.write_text(text)
        path = stage / '3d/main.js'
        text = path.read_text()
        text = replace(text, 'function home() { if (entered) enterCity(entered); else panorama(); }', 'function home() { enterCity("taipei"); }')
        text = replace(text, '{ const o = overview(); controls.maxDistance = o.dist; ENV.fit?.(o.dist); camera.position.copy(o.pos); controls.target.copy(o.target); controls.update(); stage.classList.add("pano"); }', '{ const o=overview(),f=cityFrame("taipei");controls.maxDistance=o.dist;ENV.fit?.(o.dist);entered="taipei";camera.position.copy(f.pos);controls.target.copy(f.target);controls.update();stage.classList.remove("pano"); }')
        path.write_text(text)
        path = stage / '3d/ui.js'
        text = path.read_text().replace('new URL("site-config.json",location.href)', 'new URL("greater-taipei-config.json",location.href)')
        text = text.replace('intro.querySelector(".hi-ghost").onclick = () => setMode("pano");', 'intro.querySelector(".hi-ghost").onclick = () => {setMode("pano");MAP3D.home();};')
        text = text.replace('</picture><span class="hi-brand-copy">', '</picture><span class="preserved-tagline" aria-hidden="true">一起打造你我的大台北</span><span class="hi-brand-copy">')
        path.write_text(text)
        subprocess.run([sys.executable, str(stage / 'build.py')], cwd=stage, check=True)
        page = (stage / 'index3d.html').read_text()
        page = page.replace('北北基桃', '大台北').replace('台北、新北、基隆、桃園', '台北、新北').replace('四座城市島', '兩座城市島').replace('四位候選人', '兩位參選人').replace('四位參選人', '兩位參選人').replace('四位直轄市與基隆市長參選人', '兩位市長參選人')
        page = page.replace('./2d.html', './greater-taipei-2d.html')
        page = page.replace('<meta name="description"', '<meta name="robots" content="noindex,nofollow"><meta name="description"', 1)
        page = re.sub(r'(<div class="loading-brand">.*?</picture>)(</div>)', r'\1<span class="preserved-tagline" aria-hidden="true">一起打造你我的大台北</span>\2', page, count=1, flags=re.S)
        # Product text layer over the original sign: keep the original skyline,
        # title, frame and glow assets; do not generate replacement artwork.
        css = '''
.hi-brandbtn,.loading-brand{position:relative;container-type:inline-size}
.preserved-tagline{position:absolute;left:48.7%;top:61.5%;width:42.3%;height:21%;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:5px;background:linear-gradient(#001429,#00152e);color:#ffe6ac;font:800 3.05cqw/1.2 "Noto Sans TC",sans-serif;letter-spacing:.15cqw;text-shadow:0 0 2px #fff6cb,0 0 7px #ffbf58;pointer-events:none;white-space:nowrap}
@media(max-width:860px){.preserved-tagline{left:14%;top:75%;width:73%;height:12%;font-size:5cqw;letter-spacing:.55cqw}}
.preserved-preview{position:fixed;bottom:45px;left:12px;z-index:30;font-size:10px;color:#dce8f1;background:#14243ac9;border-radius:5px;padding:5px 9px;pointer-events:none}
'''
        page = page.replace('</style>', css + '</style>', 1)
        page += '<div class="preserved-preview">大台北範圍調整預覽・沿用原版地圖・尚未替換正式網站</div>'
        (ROOT / 'prototypes/greater-taipei.html').write_text(page)
        text_page=(stage/'index.html').read_text()
        text_page=text_page.replace('北北基桃','大台北').replace('台北、新北、基隆、桃園','台北、新北').replace('四位參選人','兩位參選人').replace('四位直轄市與基隆市長參選人','兩位市長參選人').replace('index3d.html','greater-taipei.html')
        text_page=text_page.replace('<meta name="description"','<meta name="robots" content="noindex,nofollow"><meta name="description"',1)
        (ROOT/'prototypes/greater-taipei-2d.html').write_text(text_page)
        config = json.loads((ROOT / 'site-config.json').read_text())
        config['counterEnabled'] = False
        (ROOT / 'prototypes/greater-taipei-config.json').write_text(json.dumps(config, ensure_ascii=False))
        print('Staged production-derived preview; original coastlines, policy cells and landmark sites preserved.')


if __name__ == '__main__':
    build()
