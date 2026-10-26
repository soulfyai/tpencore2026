"""Create a scoped, read-only preview dataset; keep the published source data intact."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Retain the actual road/river names requested by the user. Omit whole out-of-scope
# statements instead of rewriting a quotation or changing a policy's meaning.
OUTSIDE = re.compile(r'桃園|基隆(?!河|路)|北北基桃')
audit = []


def scoped(value, path):
    if isinstance(value, str):
        if OUTSIDE.search(value):
            audit.append(path)
            return None
        return value
    if isinstance(value, list):
        result = [scoped(v, f'{path}/{i}') for i, v in enumerate(value)]
        return [v for v in result if v is not None]
    if isinstance(value, dict):
        result = {k: scoped(v, f'{path}/{k}') for k, v in value.items()}
        return {k: v for k, v in result.items() if v is not None}
    return value


cities = []
for city_id in ['taipei', 'newtaipei']:
    snapshot = json.loads((ROOT / 'prototypes' / f'{city_id}-preview-data.json').read_text())
    raw = snapshot['city']
    themes = [scoped({**t['theme'], 'record': bool(t['rec'])}, f'{city_id}/{t["id"]}')
              for t in snapshot['themes']]
    sources = scoped(raw['sources'], f'{city_id}/sources')
    source_ids = {s['id'] for s in sources}
    for theme in themes:
        for item in theme['items']:
            assert set(item.get('sources', [])) <= source_ids, item['id']
    cities.append({
        'id': city_id, 'name': '臺北市' if city_id == 'taipei' else '新北市',
        'candidate': raw['candidate'], 'party': raw['party'], 'status': raw['status'],
        'checkedAt': snapshot['checkedAt'], 'themes': themes, 'sources': sources,
        'connections': [scoped(c, f'{city_id}/connections') for c in raw.get('crossCity', [])
                        if c.get('with') and set(c['with']) <= {'taipei', 'newtaipei'}
                        and not OUTSIDE.search(c['text'])]
    })
result = {'brand': '台北安可', 'region': '大台北', 'defaultCity': 'taipei', 'cities': cities}
text = json.dumps(result, ensure_ascii=False, separators=(',', ':'))
assert not OUTSIDE.search(text)
(ROOT / 'prototypes/greater-taipei-data.json').write_text(text)
(ROOT / 'out').mkdir(exist_ok=True)
(ROOT / 'out/greater-taipei-scope-audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2))
print('Preview scope:', [(c['name'], len(c['themes']), sum(len(t['items']) for t in c['themes'])) for c in cities])
print('Omitted out-of-scope statements:', len(audit), '; source policy files unchanged.')
