"""Promote the approved chat experience into self-contained production pages."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'previews/wanan-widget-v0.1.0'
PAGES = ('index.html', 'index3d.html', '2d.html', 'chiang-wan-an.html')


def inline_script(code, attributes=''):
    # HTML parsers recognize the close tag even inside JS strings/comments.
    return '<script' + attributes + '>' + re.sub(r'</script', r'<\\/script', code, flags=re.I) + '</script>'


def promote(output):
    widget = (ASSETS / 'widget.js').read_text()
    layout = (ASSETS / 'layout.js').read_text()
    topics = (ASSETS / 'topics.js').read_text()
    snapshot = json.loads((ASSETS / 'topics.json').read_text())
    # NAS's fixed-file updater does not fetch separate topic assets. Pin the
    # reviewed JSON in this HTML release, just as the existing policy corpus is.
    source = "  const source = new URL('wanan-hot-topics-v0.1.0.json', script.src);"
    request = "        const response=await fetch(source,{cache:'no-store',credentials:'omit'});if(!response.ok)throw Error();\n        const data=await response.json();"
    assert topics.count(source) == 1 and topics.count(request) == 1
    topics = topics.replace(source, '  const snapshot = ' + json.dumps(snapshot, ensure_ascii=False) + ';')
    topics = topics.replace(request, '        const data = snapshot;')
    bundle = inline_script(widget, ' data-wanan-production="2.4.0" data-wanan-base="https://chat.tpencore.tw/" data-wanan-side="right"') + inline_script(layout)
    for name in PAGES:
        path = output / name
        html = path.read_text()
        assert 'data-wanan-production=' not in html, name
        html = html.replace('<b>獨立整理，非任何候選人或政黨官方網站</b>・資料查核至 ', '<b>非官方萬安政策市</b><br>資料更新至 ')
        if name in ('index.html','index3d.html'):
            assert html.count('autoStartPending=true') == 1
            assert html.count('if(config.musicAutoplay===false)stopAutoStart();else playMusic(true);') == 1
            html = html.replace('autoStartPending=true','autoStartPending=false')
            html = html.replace('if(config.musicAutoplay===false)stopAutoStart();else playMusic(true);','stopAutoStart();')
        closing = '</body>' if '</body>' in html.lower() else '</html>'
        at = html.lower().rfind(closing)
        assert at >= 0, name
        scripts = bundle + (inline_script(topics) if name in ('index.html','index3d.html') else '')
        html = html[:at] + scripts + html[at:]
        path.write_text(html)
    print('Promoted approved Wanan chat to four self-contained production pages')
