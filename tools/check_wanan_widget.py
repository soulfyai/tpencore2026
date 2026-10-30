"""Check the packaged site: each production page loads the chat widget once, last, and nothing else changed."""
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wanan_widget import PAGES, TAG, inject

assert inject('<html><body><p>x</p></body></html>') == '<html><body><p>x</p>' + TAG + '</body></html>'
assert inject('<p>x</p></HTML>') == '<p>x</p>' + TAG + '</HTML>'
assert inject(inject('<body></body>')).count(TAG) == 1

site = Path(sys.argv[1]) if len(sys.argv) > 1 else None
if site is None:
    from package_site import package
    site = Path(tempfile.mkdtemp()) / 'site'
    package(site)
for name in PAGES:
    html = (site / name).read_text()
    assert html.count(TAG) == 1, name
    assert 'chat.tpencore.tw' not in html.replace(TAG, ''), name
    assert html.rstrip().lower().endswith(TAG.lower() + '</body></html>') or html.rstrip().lower().endswith(TAG.lower() + '</html>'), name
    assert '獨立整理' in html, name
for name in ('candidate-home-preview.html', 'greater-taipei-v0.6.4.html'):
    assert 'chat.tpencore.tw' not in (site / name).read_text(), name
print('wanan widget: 4 production pages, previews untouched')
