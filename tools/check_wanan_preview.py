"""Check an isolated widget preview against a separately built main baseline."""
import hashlib
import json
import sys
from pathlib import Path
from zipfile import ZipFile
from build_wanan_preview import PAGES, PREFIX, TAG

site, baseline = map(Path, sys.argv[1:3])
report = json.loads((site / 'wanan-widget-v0.1.0-manifest.json').read_text())
for original in baseline.rglob('*'):
    if not original.is_file():
        continue
    name = original.relative_to(baseline)
    current = site / name
    if name.name == 'version.json':
        continue
    if original.suffix == '.zip':
        with ZipFile(original) as a, ZipFile(current) as b:
            assert a.namelist() == b.namelist(), name
            assert all(a.read(n) == b.read(n) for n in a.namelist()), name
    else:
        assert current.read_bytes() == original.read_bytes(), name
for name in PAGES:
    original = (site / name).read_bytes()
    assert hashlib.sha256(original).hexdigest() == report['production_sha256'][name]
    assert TAG.encode() not in original
    preview = (site / (PREFIX + name)).read_text()
    assert preview.count(TAG) == 1
    assert 'noindex,nofollow' in preview and '獨立整理' in preview
    assert 'https://soulfyai.github.io/tpencore2026/' + PREFIX + name in preview
    for target in PAGES:
        assert 'href="' + target + '"' not in preview
print('PASS: original site payloads unchanged; four separate left-side widget previews')
