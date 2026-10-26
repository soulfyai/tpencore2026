"""Derive a two-city review from the production site without redesigning its geometry."""
from pathlib import Path
import copy
import json
import re
import shutil
import subprocess
import sys
import tempfile
from build_approved_city_art import build as build_art

ROOT = Path(__file__).resolve().parents[1]
KEEP = {'taipei', 'newtaipei'}
# Match the actual production package, including mobile layout and decoding.
DOCUMENT_PREFIX = ('<!doctype html>\n<html lang="zh-Hant">\n'
                   '<meta charset="utf-8">\n'
                   '<meta name="viewport" content="width=device-width, initial-scale=1">\n')
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
    build_art()
    art_data=[]
    for city in ["taipei","newtaipei"]:
        source=json.loads((ROOT/f"prototypes/{city}-preview-data.json").read_text())
        art_data.append(scope(source))
    (ROOT/"prototypes/greater-taipei-art-data.json").write_text(json.dumps(art_data,ensure_ascii=False,separators=(",",":")))
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
        build_text=path.read_text().replace('"flags.js", "main.js"','"flags.js", "approved-art.js", "main.js"')
        path.write_text(build_text)
        (stage/'3d/approved-art.js').write_text((ROOT/'prototypes/greater-taipei-art-bridge.js').read_text())
        env=stage/'3d/env.js'
        env.write_text('const beforeArtEnv=new Set();scene.traverse(o=>beforeArtEnv.add(o));\n'+env.read_text().replace('ENV.cullClouds = (cam) => { clouds.visible = cam.position.distanceTo(controls.target) > 12; };','ENV.cullClouds = () => { clouds.visible=false; };')+'\nENV.preservedObjects=new Set();scene.traverse(o=>{if(!beforeArtEnv.has(o))ENV.preservedObjects.add(o);});\n')
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
        text=replace(text,'buildBatches();','buildBatches();for(const mesh of batches.values())mesh.removeFromParent();')
        text=text.replace('const pickables = () => [...batches.values(), ...[...WORLD.bodies.values()].flatMap((b) => [b.top, b.cliff]), ...flowViews.filter((v) => v.tube.visible).map((v) => v.tube)];','const pickables = () => [...APPROVED_ART.picks,...flowViews.filter(v=>v.tube.visible).map(v=>v.tube)];')
        text=text.replace('isl.liftTo = sel ? 0.14 : 0;', 'isl.liftTo = 0;')
        text=text.replace('PEOPLE.update(dt, clock, moving);','APPROVED_ART.update(dt,clock,moving);')
        text=text.replace('renderer.render(scene, camera);', 'APPROVED_ART.render();')
        path.write_text(text)
        path = stage / '3d/ui.js'
        text = path.read_text().replace('new URL("site-config.json",location.href)', 'new URL("greater-taipei-config.json",location.href)')
        text = text.replace('intro.querySelector(".hi-ghost").onclick = () => setMode("pano");', 'intro.querySelector(".hi-ghost").onclick = () => {setMode("pano");MAP3D.home();};')
        path.write_text(text)
        subprocess.run([sys.executable, str(stage / 'build.py')], cwd=stage, check=True)
        page = (stage / 'index3d.html').read_text()
        page = page.replace('北北基桃', '大台北').replace('台北、新北、基隆、桃園', '台北、新北').replace('四座城市島', '兩座城市島').replace('四位候選人', '兩位參選人').replace('四位參選人', '兩位參選人').replace('四位直轄市與基隆市長參選人', '兩位市長參選人')
        page = page.replace('./2d.html', './greater-taipei-2d.html')
        page = page.replace('<meta name="description"', '<meta name="robots" content="noindex,nofollow"><meta name="description"', 1)
        # Preserve the production CSS, picture sources, image sizes and markup exactly.
        # Scope changes affect accessible text; the existing raster logo stays untouched.
        (ROOT / 'prototypes/greater-taipei.html').write_text(DOCUMENT_PREFIX+page+'\n</html>\n')
        text_page=(stage/'index.html').read_text()
        text_page=text_page.replace('北北基桃','大台北').replace('台北、新北、基隆、桃園','台北、新北').replace('四位參選人','兩位參選人').replace('四位直轄市與基隆市長參選人','兩位市長參選人').replace('index3d.html','greater-taipei.html')
        text_page=text_page.replace('<meta name="description"','<meta name="robots" content="noindex,nofollow"><meta name="description"',1)
        (ROOT/'prototypes/greater-taipei-2d.html').write_text(DOCUMENT_PREFIX+text_page+'\n</html>\n')
        config = json.loads((ROOT / 'site-config.json').read_text())
        config['counterEnabled'] = False
        (ROOT / 'prototypes/greater-taipei-config.json').write_text(json.dumps(config, ensure_ascii=False))
        print('Staged production-derived preview; original coastlines, policy cells and landmark sites preserved.')


if __name__ == '__main__':
    build()
