"""Promote the approved chat experience into self-contained production pages."""
import json
import re
from policy_audit import read as read_audit, summary as audit_summary, label as audit_label
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'previews/wanan-widget-v0.1.0'
PAGES = ('index.html', 'index3d.html', '2d.html', 'chiang-wan-an.html')


PAGEVIEW_SCRIPT = r"""(() => {
  // 3D pages already record visits; this adapter is only for the other two pages.
  if (!/^(?:www\.)?tpencore\.tw$/i.test(location.hostname)) return;
  fetch(new URL('site-config.json', location.href), {credentials:'omit',cache:'no-store'})
    .then(response => response.ok ? response.json() : null)
    .then(config => {
      if (!config || config.counterEnabled === false) return;
      let url;
      try { url = new URL(config.counterUrl || 'counter.php', location.href); } catch { return; }
      if (url.origin !== location.origin || url.username || url.password) return;
      fetch(url, {method:'POST',credentials:'omit',cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)})
        .catch(() => {});
    }).catch(() => {});
})();"""


def inline_script(code, attributes=''):
    # HTML parsers recognize the close tag even inside JS strings/comments.
    return '<script' + attributes + '>' + re.sub(r'</script', r'<\\/script', code, flags=re.I) + '</script>'


def promote(output):
    corpus = json.loads((ROOT / 'prototypes/v044-art-data.json').read_text()) if (ROOT / 'data/policy-audit/current.json').exists() else []
    audit = read_audit(corpus) if corpus else None
    widget = (ASSETS / 'widget.js').read_text()
    layout = (ASSETS / 'layout.js').read_text()
    topics = (ASSETS / 'topics.js').read_text()
    snapshot = json.loads((ASSETS / 'topics.json').read_text())
    # Keep a dated fallback in self-contained HTML; primary reads the live API.
    fallback = '  const fallbackSnapshot = null;'
    assert topics.count(fallback) == 1
    topics = topics.replace(fallback, '  const fallbackSnapshot = ' + json.dumps(snapshot, ensure_ascii=False) + ';')
    bundle = inline_script(widget, ' data-wanan-production="2.4.0" data-wanan-base="https://chat.tpencore.tw/" data-wanan-side="right"') + inline_script(layout)
    for name in PAGES:
        path = output / name
        html = path.read_text()
        assert 'data-wanan-production=' not in html, name
        html = html.replace('<b>獨立整理，非任何候選人或政黨官方網站</b>・資料查核至 ', '<b>非官方萬安政策市</b><br>政策逐項查核至 ')
        if name in ('2d.html', 'chiang-wan-an.html'):
            html, count = re.subn(r'資料查核日期：(\d{4}-\d{2}-\d{2})。',
                r'政策逐項查核至：<span id="checked">\1</span>。', html, count=1)
            assert count == 1, name + ': policy freshness marker missing'
        if audit:
            stats = audit_summary(audit, None if name == '2d.html' else 'taipei')
            status = '<span id="policy-audit-status">' + escape(audit_label(stats)) + '</span><br>'
            html = html.replace('政策逐項查核至', status + '其餘資料基準查核日', 1)
        if name in ('index.html','index3d.html'):
            assert html.count('autoStartPending=true') == 1
            assert html.count('if(config.musicAutoplay===false)stopAutoStart();else playMusic(true);') == 1
            html = html.replace('autoStartPending=true','autoStartPending=false')
            html = html.replace('if(config.musicAutoplay===false)stopAutoStart();else playMusic(true);','stopAutoStart();')
        closing = '</body>' if '</body>' in html.lower() else '</html>'
        at = html.lower().rfind(closing)
        assert at >= 0, name
        scripts = bundle + inline_script(topics) + ('' if name in ('index.html','index3d.html') else inline_script(PAGEVIEW_SCRIPT, ' data-tpencore-pageview="1"'))
        html = html[:at] + scripts + html[at:]
        path.write_text(html)
    print('Promoted approved Wanan chat to four self-contained production pages')


