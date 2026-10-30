"""Add the AI 萬安 chat widget (served by chat.tpencore.tw) to the four production pages.

The widget renders in its own Shadow DOM at the lower right and only calls the chat service; the
service answers tpencore.tw through its CORS allowlist. Remove PAGES entries or this step to take it off."""
from pathlib import Path

TAG = '<script src="https://chat.tpencore.tw/widget.js" data-wanan-base="https://chat.tpencore.tw/" defer></script>'
PAGES = ('index.html', 'index3d.html', '2d.html', 'chiang-wan-an.html')


def inject(html):
    if TAG in html:
        return html
    for marker in ('</body>', '</html>'):
        at = html.lower().rfind(marker)
        if at >= 0:
            return html[:at] + TAG + html[at:]
    return html + TAG


def apply(output):
    for name in PAGES:
        page = Path(output) / name
        page.write_text(inject(page.read_text()))
