from pathlib import Path
R=Path(__file__).resolve().parents[1];P=R/'prototypes'
s=(P/'greater-taipei-v0.4.11.html').read_text().replace('0.4.11','0.4.12')
s=s.replace('import * as THREE from "three";','import * as THREE from "three";\nimport {createPanoramaLife} from "./panorama-life-v0412.js";',1)
s=s.replace('APPROVED_ART.transport.update(dt,time,moving);','APPROVED_ART.transport.update(dt,time,moving);APPROVED_ART.panoramaLife?.update(APPROVED_ART.transport.clock,[...APPROVED_ART.transport.vessels,...APPROVED_ART.transport.remote.vessels]);',1)
marker='}catch(err){console.error(err);window.cityLoadFailed();}'
code='''const panoramaFrame=mobileTwoCityPanorama(overview()),panoramaCamera=camera.clone();panoramaCamera.position.copy(panoramaFrame.pos);panoramaCamera.lookAt(panoramaFrame.target);panoramaCamera.updateMatrixWorld(true);
APPROVED_ART.panoramaLife=await createPanoramaLife(scene,APPROVED_ART.cities,transportPlan,SHIPS,rng,WATER_Y,panoramaCamera);
'''
assert marker in s;s=s.replace(marker,code+marker,1)
(P/'greater-taipei-v0.4.12.html').write_text(s)
