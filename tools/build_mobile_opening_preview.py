"""Build a camera-only v0.4.2 preview; preserve v0.4.1 and production outputs."""
from pathlib import Path
import re,json,hashlib
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'prototypes'
def build():
 source=(P/'greater-taipei-v0.4.1.html').read_text();html=source
 start=html.index('function cityFrame(city) {');end=html.index('\nfunction enterCity(city)',start)
 frame=html[start:end]
 old='return { target: c, pos: c.clone().add(new THREE.Vector3(0, 0.62, 0.79).normalize().multiplyScalar(dist)), dist };'
 assert old in frame
 frame=frame.replace(old,'return mobileTaipeiOpening(city,{ target: c, pos: c.clone().add(new THREE.Vector3(0, 0.62, 0.79).normalize().multiplyScalar(dist)), dist });')
 html=html[:start]+(P/'mobile-opening-v042.js').read_text()+'\n'+frame+html[end:]
 html=html.replace('name="tpencore-preview-version" content="0.4.1"','name="tpencore-preview-version" content="0.4.2"',1)
 html=html.replace('建築多樣性預覽 v0.4.1','手機預設視角預覽 v0.4.2',1)
 (P/'greater-taipei-v0.4.2.html').write_text(html)
 (P/'v042-version.json').write_text(json.dumps({'preview_version':'0.4.2','base':'preview-v0.4.1','scope':'mobile-portrait-taipei-opening-camera','entry':'greater-taipei-v0.4.2.html','reference_viewport':[392,697],'base_entry_sha256':hashlib.sha256(source.encode()).hexdigest(),'status':'review-only'},indent=2)+'\n')
 print('Built v0.4.2 mobile opening camera; v0.4.1 geometry/UI and desktop frame retained.')
if __name__=='__main__':build()
