"""Add phone-only two-city panorama to the preserved v0.4.2 opening preview."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'prototypes'
def build():
 source=(P/'greater-taipei-v0.4.2.html').read_text();html=source
 marker='function overview() {';assert marker in html
 html=html.replace(marker,(P/'mobile-panorama-v043.js').read_text()+'\n'+marker,1)
 old='function panorama() { entered = null; const o = overview();'
 assert old in html;html=html.replace(old,'function panorama() { entered = null; const o = mobileTwoCityPanorama(overview());',1)
 old='if(refitOverview){fly=null;camera.position.copy(o.pos);controls.target.copy(o.target);controls.update();}'
 assert old in html;html=html.replace(old,'if(refitOverview){const frame=mobileTwoCityPanorama(o);fly=null;camera.position.copy(frame.pos);controls.target.copy(frame.target);controls.update();}',1)
 old='height=THREE.MathUtils.lerp(10,Math.max(12,citySignFar*view.farFactor),blend)'
 assert old in html;html=html.replace(old,'height=mobilePanoramaSignHeight(THREE.MathUtils.lerp(10,Math.max(12,citySignFar*view.farFactor),blend))',1)
 html=html.replace('name="tpencore-preview-version" content="0.4.2"','name="tpencore-preview-version" content="0.4.3"',1).replace('手機預設視角預覽 v0.4.2','手機全景視角預覽 v0.4.3',1)
 # Review link can open panorama directly; ordinary entry still starts on Taipei.
 marker='}catch(err){console.error(err);window.cityLoadFailed();}'
 assert marker in html
 html=html.replace(marker,"if(new URLSearchParams(location.search).get('view')==='panorama'){UI.dismissOverlays?.();MAP3D.panorama();}\n"+marker,1)
 (P/'greater-taipei-v0.4.3.html').write_text(html)
 (P/'v043-version.json').write_text(json.dumps({'preview_version':'0.4.3','base':'preview-v0.4.2','scope':'mobile-two-city-panorama-camera','entry':'greater-taipei-v0.4.3.html','reference_viewport':[392,697],'base_entry_sha256':hashlib.sha256(source.encode()).hexdigest(),'status':'review-only'},indent=2)+'\n')
 print('Built v0.4.3 phone panorama; Taipei opening and original assets retained.')
if __name__=='__main__':build()
