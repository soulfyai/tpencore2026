"""Exercise NAS updates offline: successful publish, no-op and interrupted downloads."""
from pathlib import Path
from tempfile import TemporaryDirectory
import os, shutil, subprocess
ROOT=Path(__file__).resolve().parents[1]
with TemporaryDirectory(prefix='check-tpencore-') as tmp:
    tmp=Path(tmp);site=tmp/'site';site.mkdir();bin_dir=tmp/'bin';bin_dir.mkdir()
    (site/'music').mkdir();(site/'music'/'theme.mp3').write_bytes(b'local music')
    config=site/'site-config.json';config.write_text('{"musicUrl":"music/theme.mp3"}')
    (site/'index.html').write_text('old')
    fake=bin_dir/'curl';fake.write_text('''#!/bin/sh
while [ "$#" -gt 0 ]; do
 case "$1" in
  https://*) url=$1;;
  -o) shift; output=$1;;
 esac
 shift
done
file=${url##*/}; file=${file%%\\?*}
[ "$file" != "${FAIL_FILE:-}" ] || exit 22
cp "$FIXTURE/$file" "$output"
''');fake.chmod(0o755)
    env={**os.environ,'PATH':str(bin_dir)+':'+os.environ['PATH'],'FIXTURE':str(ROOT/'out/site')}
    def run(**extra):
        return subprocess.run(['sh',str(ROOT/'deploy/synology-update.sh'),str(site)],env={**env,**extra},capture_output=True,text=True)
    result=run();assert result.returncode==0,result.stderr
    assert (site/'index.html').read_bytes()==(ROOT/'out/site/index.html').read_bytes()
    assert (site/'music/theme.mp3').read_bytes()==b'local music'
    assert config.read_text()=='{"musicUrl":"music/theme.mp3"}'
    stamp=(site/'index.html').stat().st_mtime_ns
    result=run();assert result.returncode==0 and 'latest' in result.stdout
    assert (site/'index.html').stat().st_mtime_ns==stamp
    (site/'version.json').write_text('{"version":"old"}')
    result=run(FAIL_FILE='2d.html');assert result.returncode!=0
    assert (site/'index.html').stat().st_mtime_ns==stamp
    assert not (site/'.tpencore-update.lock').exists()
    print('PASS NAS atomic files, local music/config preserved, unchanged-version no-op and failed-download recovery')
