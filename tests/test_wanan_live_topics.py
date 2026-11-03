import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('promoter', ROOT / 'tools/promote_wanan.py')
promoter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(promoter)


class LiveTopicsTests(unittest.TestCase):
    def test_production_keeps_live_request_and_dated_fallback(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            assets = root / 'assets'; assets.mkdir()
            for name in ('topics.js', 'topics.json'):
                (assets / name).write_text((ROOT / 'previews/wanan-widget-v0.1.0' / name).read_text())
            for name in ('widget.js', 'layout.js'):
                (assets / name).write_text('/* fixture */')
            html = '<!doctype html><body><b>獨立整理，非任何候選人或政黨官方網站</b>・資料查核至 <span id="checked">2026-10-22</span><script>let autoStartPending=true;if(config.musicAutoplay===false)stopAutoStart();else playMusic(true);</script></body>'
            for name in promoter.PAGES:
                (root / name).write_text(html if name in ('index.html','index3d.html') else '<!doctype html><body><p>收錄62項內容。資料查核日期：2026-10-22。</p></body>')
            old = promoter.ASSETS
            try:
                promoter.ASSETS = assets
                promoter.promote(root)
            finally: promoter.ASSETS = old
            for name in promoter.PAGES:
                result = (root / name).read_text()
                self.assertIn('/api/public/topics', result)
                self.assertIn('await fetch(source', result)
                self.assertIn('const fallbackSnapshot = {', result)
                self.assertIn('政策每日查核：', result)
                self.assertIn('其餘資料基準查核日', result)
                self.assertIn('2026-10-22', result)
                self.assertIn('新聞／話題查核至', result)

    def browser_read(self, fail=False):
        snapshot = {'status':'published','reviewed':True,'mode':'editorial_web','period':'歷史報導','updated_at':'2026-10-30','topics':[]}
        live = dict(snapshot, updated_at='2026-11-03')
        code = (ROOT / 'previews/wanan-widget-v0.1.0/topics.js').read_text().replace('const fallbackSnapshot = null;', 'const fallbackSnapshot = '+json.dumps(snapshot)+';')
        runner = r'''
const vm=require('node:vm');const fs=require('node:fs');
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const markers={};const calls=[];
const checked={textContent:'2026-10-22',after(...nodes){for(const n of nodes)if(n.id)markers[n.id]=n;}};
const document={currentScript:{src:'https://tpencore.tw/topics.js'},
  getElementById(id){return id==='checked'?checked:markers[id];},
  createElement(){return {};},querySelector(){return null;}};
vm.runInNewContext(input.code,{document,URL,AbortSignal,MutationObserver:class{observe(){} disconnect(){}},setTimeout:()=>0,location:{href:'https://tpencore.tw/'},
  fetch:async(url,options)=>{calls.push({url:String(url),options:{cache:options.cache,credentials:options.credentials}});if(input.fail)throw Error();return {ok:true,json:async()=>input.live};}});
setImmediate(()=>process.stdout.write(JSON.stringify({text:markers['wanan-news-checked'].textContent,policy:checked.textContent,calls})));
'''
        return json.loads(subprocess.check_output(['node','-e',runner],input=json.dumps({'code':code,'fail':fail,'live':live}),text=True))

    def test_live_feed_updates_news_date_without_changing_policy_date(self):
        result = self.browser_read()
        self.assertEqual(result['text'],'新聞／話題查核至：2026-11-03')
        self.assertEqual(result['policy'],'2026-10-22')
        self.assertEqual(result['calls'][0]['url'],'https://chat.tpencore.tw/api/public/topics')
        self.assertEqual(result['calls'][0]['options'],{'cache':'no-store','credentials':'omit'})

    def test_network_failure_explicitly_labels_old_snapshot(self):
        result = self.browser_read(fail=True)
        self.assertEqual(result['text'],'話題歷史快照：2026-10-30')
        self.assertEqual(result['policy'],'2026-10-22')


if __name__ == '__main__': unittest.main()
