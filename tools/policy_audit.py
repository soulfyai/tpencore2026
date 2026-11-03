"""政策逐項查核紀錄、受限欄位更新與公開完成度；不以建置時間冒充查核。"""
import copy
from datetime import date, datetime
from html import escape
import json
from pathlib import Path
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

TAIPEI = ZoneInfo("Asia/Taipei")

ROOT = Path(__file__).resolve().parents[1]
CURRENT = ROOT / 'data/policy-audit/current.json'
DONE = {'verified_updated', 'verified_unchanged'}
STATUSES = DONE | {'needs_followup', 'source_unavailable', 'not_checked'}
FIELDS = {'plain', 'facts', 'phase', 'contentKind', 'sources'}


def stamp(value):
    result = datetime.fromisoformat(value)
    if result.tzinfo is None: raise ValueError('查核時間缺少時區')
    return result


def public_url(value):
    parsed = urlsplit(value)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('來源網址必須為公開HTTPS')
    return value


def inventory(corpus):
    return {item['id']: (city['city']['city'], item)
            for city in corpus for row in city['themes'] for item in row['theme']['items']}


def validate(audit, corpus):
    if audit.get('schema_version') != 1: raise ValueError('查核版本不符')
    day = date.fromisoformat(audit['audit_date'])
    stamp(audit['checked_at'])
    expected = inventory(corpus)
    overrides = audit.get('overrides', {})
    if not isinstance(overrides, dict) or not set(overrides) <= set(expected):
        raise ValueError('歷史更正含未知ID')
    for fields in overrides.values():
        if not isinstance(fields, dict) or not set(fields) <= FIELDS:
            raise ValueError('歷史更正不可變更穩定ID或其他欄位')
    entries = audit['entries']
    if len(entries) != len(expected) or {row['id'] for row in entries} != set(expected):
        raise ValueError('逐項查核清單缺漏、重複或有未知ID')
    for entry in entries:
        if entry['city'] != expected[entry['id']][0] or entry['status'] not in STATUSES:
            raise ValueError('項目城市或狀態不符')
        if not isinstance(entry.get('note'), str) or not entry['note'].strip():
            raise ValueError('缺少逐項判讀')
        changes = entry.get('changes', {})
        if not isinstance(changes, dict) or not set(changes) <= FIELDS:
            raise ValueError('不可變更穩定ID、主題或未授權欄位')
        if changes and entry['status'] != 'verified_updated': raise ValueError('未核實不可更新內容')
        if entry['status'] in DONE:
            checked = stamp(entry['checked_at'])
            if checked.astimezone(TAIPEI).date() > day or checked > stamp(audit['checked_at']): raise ValueError('查核日期超前')
            refs = entry.get('evidence', [])
            if not refs: raise ValueError('已核實項目必須有原文紀錄')
            for ref in refs:
                public_url(ref['url'])
                if ref.get('method') != 'source_pages_read' or not ref.get('finding'):
                    raise ValueError('HTTP成功、搜尋摘要或雜湊不是AI查核')
                if stamp(ref['read_at']) > checked: raise ValueError('原文讀取晚於查核')
        elif entry.get('checked_at') is not None:
            stamp(entry['checked_at'])
        if 'contentKind' in changes and changes['contentKind'] not in ('policy', 'record'):
            raise ValueError('政策種類不符')
        if 'facts' in changes and (not isinstance(changes['facts'], list) or
                                  any(not isinstance(f, str) for f in changes['facts'])):
            raise ValueError('政策事實格式不符')
    return audit


def read(corpus, path=None):
    path = Path(path) if path else CURRENT
    return validate(json.loads(path.read_text()), corpus) if path.exists() else None


def summary(audit, city_id=None):
    entries = [row for row in audit['entries'] if city_id is None or row['city'] == city_id]
    # A carried-forward prior check must not count as today's work.
    done = [row for row in entries if row['status'] in DONE and
            stamp(row['checked_at']).astimezone(TAIPEI).date().isoformat() == audit['audit_date']]
    return {'audit_date': audit['audit_date'], 'checked_at': audit['checked_at'],
            'total': len(entries), 'verified': len(done), 'pending': len(entries)-len(done),
            'updated': sum(row['status'] == 'verified_updated' for row in done),
            'status': 'complete' if len(done) == len(entries) else 'partial'}


def label(stats):
    return ('政策每日查核：' + stats['audit_date'] + '｜已核對 ' + str(stats['verified']) +
            '/' + str(stats['total']) + ' 項｜待查 ' + str(stats['pending']) + ' 項（原文與可取得更新；非全面成效驗證）')


def apply(corpus, audit):
    validate(audit, corpus)
    result = copy.deepcopy(corpus)
    by_id = {row['id']: row for row in audit['entries']}
    for city in result:
        refs = {source['id']: source for source in city['city']['sources']}
        for source in audit.get('new_sources', []):
            if source['city'] != city['city']['city']: continue
            public_url(source['url'])
            record = {k: v for k, v in source.items() if k != 'city'}
            if record['id'] in refs and refs[record['id']] != record:
                raise ValueError('新來源不可覆寫既有來源識別碼')
            refs[record['id']] = record
        city['city']['sources'] = list(refs.values())
        for row in city['themes']:
            theme = row['theme']
            for item in theme['items']:
                record = by_id[item['id']]
                item.update(copy.deepcopy(audit.get('overrides', {}).get(item['id'], {})))
                item.update(copy.deepcopy(record.get('changes', {})))
                if not set(item.get('sources', [])) <= set(refs): raise ValueError('項目引用未知來源')
                item['policyAudit'] = {k: record.get(k) for k in ('status', 'checked_at', 'note')}
            n = sum(item.get('contentKind') == 'record' for item in theme['items'])
            theme.update(recordCount=n, policyCount=len(theme['items'])-n,
                         kind='record' if n == len(theme['items']) else 'mixed' if n else 'policy')
        city['city']['themes'] = [row['theme'] for row in city['themes']]
        by_name = {item['name']: item for row in city['themes'] for item in row['theme']['items'] if 'name' in item}
        for achievement in city['city'].get('achievements', []):
            if achievement['name'] in by_name:
                item = by_name[achievement['name']]
                for field in FIELDS | {'policyAudit'}:
                    if field in item: achievement[field] = copy.deepcopy(item[field])
        prefix = '原始基準盤點（現況以逐項查核為準）：'
        city['city']['unknowns'] = [text if text.startswith(prefix) else prefix + text
                                    for text in city['city'].get('unknowns', [])]
    return result


def prepare(root=ROOT):
    path = Path(root) / 'prototypes/v044-art-data.json'
    corpus = json.loads(path.read_text())
    audit = read(corpus, Path(root) / 'data/policy-audit/current.json')
    if audit:
        path.write_text(json.dumps(apply(corpus, audit), ensure_ascii=False, separators=(',', ':')))
    return audit


def item_note(item):
    audit = item.get('policyAudit')
    if not audit: return ''
    checked = (audit.get('checked_at') or '')[:10]
    state = '已核對' if audit['status'] in DONE else '待查核'
    return '<p class="meta">政策查核：' + escape(state + (' ' + checked if checked else '') +
            '。' + audit['note']) + '</p>'


def apply_page(html, corpus):
    """Replace the UI's inline copy too, not only the scene's fetched JSON."""
    import re
    match = re.search(r'const D\s*=\s*', html)
    if not match: raise ValueError('3D政策面板資料入口不存在')
    payload, length = json.JSONDecoder().raw_decode(html[match.end():])
    old_ids = {item['id'] for city in payload['cities'] for theme in city['themes'] for item in theme['items']}
    if old_ids != set(inventory(corpus)): raise ValueError('3D面板與政策庫ID不一致')
    payload['cities'] = [copy.deepcopy(city['city']) for city in corpus]
    encoded = json.dumps(payload, ensure_ascii=False).replace('<', r'\u003c')
    html = html[:match.end()] + encoded + html[match.end()+length:]
    hook = '  <dl class="kv">${i.who?'
    if html.count(hook) != 1: raise ValueError('3D逐項查核顯示入口不符')
    note = '''  ${i.policyAudit?`<p class="meta">政策查核：${esc(i.policyAudit.status.startsWith("verified_")?"已核對":"待查核")} ${esc((i.policyAudit.checked_at||"").slice(0,10))}。${esc(i.policyAudit.note)}</p>`:""}
'''
    return html.replace(hook, note+hook, 1)
