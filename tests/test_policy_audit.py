import copy
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import policy_audit as audit


class PolicyAuditTests(unittest.TestCase):
    def setUp(self):
        self.corpus = [{'city': {'city': 'taipei', 'sources': [{'id': 'source-a', 'url': 'https://example.com/a'}]},
                        'themes': [{'theme': {'id': 'theme-a', 'items': [
                            {'id': 'item-a', 'plain': '原內容', 'sources': ['source-a'], 'contentKind': 'policy'},
                            {'id': 'item-b', 'plain': '另一項', 'sources': ['source-a'], 'contentKind': 'policy'}]}}]}]
        self.batch = {'schema_version': 1, 'audit_date': '2026-11-04', 'checked_at': '2026-11-04T08:00:00+08:00', 'entries': [
            {'id': 'item-a', 'city': 'taipei', 'status': 'verified_updated', 'checked_at': '2026-11-04T07:00:00+08:00',
             'note': '核對主管機關服務規定，已上路。', 'changes': {'phase': '已實施', 'contentKind': 'record'},
             'evidence': [{'url': 'https://example.com/a', 'read_at': '2026-11-04T06:00:00+08:00',
                           'method': 'source_pages_read', 'finding': '原文明列生效日與適用條件'}]},
            {'id': 'item-b', 'city': 'taipei', 'status': 'source_unavailable', 'checked_at': None,
             'note': '原文無法讀取，保留舊內容', 'evidence': []}]}

    def test_partial_round_preserves_old_item_and_source(self):
        original = copy.deepcopy(self.corpus)
        result = audit.apply(self.corpus, self.batch)
        self.assertEqual(self.corpus, original)
        self.assertEqual(result[0]['themes'][0]['theme']['items'][1]['plain'], '另一項')
        self.assertEqual(result[0]['themes'][0]['theme']['recordCount'], 1)
        self.assertEqual(audit.summary(self.batch)['pending'], 1)
        self.assertEqual(audit.summary(self.batch)['status'], 'partial')

    def test_missing_or_repeated_id_rejected(self):
        for entries in [self.batch['entries'][:1], [self.batch['entries'][0]]*2]:
            batch = dict(self.batch, entries=entries)
            with self.assertRaises(ValueError): audit.validate(batch, self.corpus)

    def test_http_success_cannot_be_called_ai_verified(self):
        batch = copy.deepcopy(self.batch)
        batch['entries'][0]['evidence'][0]['method'] = 'http_200'
        with self.assertRaises(ValueError): audit.validate(batch, self.corpus)

    def test_unverified_item_cannot_change_content(self):
        batch = copy.deepcopy(self.batch)
        batch['entries'][1]['changes'] = {'plain': '未核實變更'}
        with self.assertRaises(ValueError): audit.apply(self.corpus, batch)

    def test_cannot_replace_stable_id_or_reference_unknown_source(self):
        for changes in [{'id': 'other'}, {'sources': ['unknown']}]:
            batch = copy.deepcopy(self.batch); batch['entries'][0]['changes'] = changes
            with self.assertRaises(ValueError): audit.apply(self.corpus, batch)

    def test_previous_day_does_not_count_as_todays_check(self):
        batch = copy.deepcopy(self.batch)
        batch['entries'][0]['checked_at'] = '2026-11-03T07:00:00+08:00'
        batch['entries'][0]['evidence'][0]['read_at'] = '2026-11-03T06:00:00+08:00'
        audit.validate(batch, self.corpus)
        self.assertEqual(audit.summary(batch)['verified'], 0)

    def test_utc_timestamp_is_counted_in_taipei_date(self):
        batch = copy.deepcopy(self.batch)
        batch['entries'][0]['checked_at'] = '2026-11-03T23:00:00+00:00'
        self.assertEqual(audit.summary(batch)['verified'], 1)

    def test_future_or_timezone_missing_rejected(self):
        for stamp in ['2026-11-05T08:00:00+08:00', '2026-11-04T07:00:00']:
            batch = copy.deepcopy(self.batch); batch['entries'][0]['checked_at'] = stamp
            with self.assertRaises(ValueError): audit.validate(batch, self.corpus)

    def test_previous_corrections_survive_a_new_unchanged_round(self):
        batch = copy.deepcopy(self.batch)
        batch['overrides'] = {'item-b': {'plain': '前輪已核實更正'}}
        result = audit.apply(self.corpus, batch)
        self.assertEqual(result[0]['themes'][0]['theme']['items'][1]['plain'], '前輪已核實更正')

    def test_real_batch_retains_pending_and_corrects_dome_year(self):
        corpus = json.loads((ROOT / 'prototypes/v044-art-data.json').read_text())
        batch = audit.read(corpus)
        result = audit.inventory(audit.apply(corpus, batch))
        self.assertEqual(audit.summary(batch)['total'], 118)
        dome = result['tp-rec-sport-1'][1]
        self.assertTrue(any('2006年10月3日' in f for f in dome['facts']))
        self.assertFalse(any('1995' in f for f in dome['facts']))
        self.assertEqual(result['tp-ai-5'][1]['policyAudit']['status'], 'needs_followup')
        for item_id in ('tp-childcare-2', 'tp-childcare-3', 'tp-childcare-4'):
            self.assertEqual(result[item_id][1]['contentKind'], 'record')

    def test_full_reader_renders_unknown_source_dates_and_real_corrections(self):
        from build_policy_reader import build_reader
        html, count = build_reader()
        self.assertEqual(count, 118)
        self.assertIn('日期未註明', html)
        self.assertIn('2006年10月3日', html)
        self.assertIn('政策查核：待查核', html)
        self.assertNotIn('1995 年簽約', html)

    def test_public_note_escapes_source_text(self):
        item = {'policyAudit': {'status': 'needs_followup', 'checked_at': None, 'note': '<script>bad</script>'}}
        self.assertIn('&lt;script&gt;', audit.item_note(item))
        self.assertNotIn('<script>', audit.item_note(item))


if __name__ == '__main__': unittest.main()
