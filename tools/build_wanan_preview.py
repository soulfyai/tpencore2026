"""Create isolated widget previews without changing the production HTML."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ('index.html', 'index3d.html', '2d.html', 'chiang-wan-an.html')
PREFIX = 'wanan-widget-v0.1.0-'
TAG = '<script src="wanan-widget-v0.1.0.js" data-wanan-base="https://chat.tpencore.tw/" data-wanan-side="right" defer></script>'

def apply(output):
    baseline = {}
    for name in PAGES:
        page = output / name
        original = page.read_bytes()
        baseline[name] = hashlib.sha256(original).hexdigest()
        html = original.decode('utf-8')
        # Keep queries/fragments while moving only links among these four pages.
        def link(match):
            quote, url = match.group(1), match.group(2)
            if url.startswith('#'):
                return match.group(0)
            url = re.sub(r'^https://(?:tpencore\.tw|soulfyai\.github\.io/tpencore2026)/', '', url)
            target, *suffix = re.split(r'(?=[?#])', url, maxsplit=1)
            target = target.removeprefix('./')
            if target in ('', '/'):
                target = 'index.html'
            target = target.removeprefix('/')
            if target in PAGES:
                return 'href=' + quote + PREFIX + target + ''.join(suffix) + quote
            return match.group(0)
        html = re.sub(r'href=([\"\x27])([^\"\x27]*)\1', link, html)
        html = re.sub(r'<link\b[^>]*rel=[\"\x27]canonical[\"\x27][^>]*>', '', html, flags=re.I)
        html = re.sub(r'<meta\b[^>]*name=[\"\x27]robots[\"\x27][^>]*>', '', html, flags=re.I)
        metadata = '<meta name="robots" content="noindex,nofollow"><link rel="canonical" href="https://soulfyai.github.io/tpencore2026/' + PREFIX + name + '">'
        html, count = re.subn(r'(<meta\s+charset=[\"\x27]utf-8[\"\x27]\s*>)', lambda m: m.group(0) + metadata, html, count=1, flags=re.I)
        assert count == 1, name
        marker = '</body>' if '</body>' in html.lower() else '</html>'
        at = html.lower().rfind(marker)
        assert at >= 0
        html = html[:at] + TAG + html[at:]
        assert html.count(TAG) == 1 and '獨立整理' in html
        (output / (PREFIX + name)).write_text(html, encoding='utf-8')
        assert page.read_bytes() == original, name
    (output / 'wanan-widget-v0.1.0.js').write_bytes((ROOT / 'previews/wanan-widget-v0.1.0/widget.js').read_bytes())
    (output / 'wanan-widget-v0.1.0-manifest.json').write_text(json.dumps({'production_sha256': baseline, 'widget_source': 'wanan_digitwin@3f6a444', 'published': False}, indent=2) + '\n')
