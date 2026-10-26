"""Build isolated v0.4.5 dense streets, planting and visible rooftop flags."""
from pathlib import Path
import json,re,hashlib
R=Path(__file__).resolve().parents[1];P=R/'prototypes'
def build():
 s=(P/'v044-art.js').read_text()
 s=s.replace("import * as THREE from 'three';","import * as THREE from 'three';\nimport {landmarkFootprints,fillStreetBlocks,plantDenseLandscape,createProminentFlag} from './street-infill-v045.js';",1)
 s=s.replace('for(const l of landmarks)reserve(l.x,l.z,l.r*2+.8,l.r*2+.8);','// Landmark avoidance uses actual geometry below, not the old broad square.')
 # Ground turf is landscaping, not a solid building footprint.
 s=s.replace("const landmarkBuckets=new Map()","art.grass.userData.groundCover=true;\nconst landmarkBuckets=new Map()")
 s=s.replace('const buildings=[...cityKit.records,...streetDetails.records];','const infill=fillStreetBlocks(art,plan,data,ponds,streetDetails,landmarkFootprints(landmarkBuckets));\nconst buildings=[...cityKit.records,...streetDetails.records];')
 s=s.replace('plantPolicyDistrictLandscape(art,plan)','plantDenseLandscape(art,plan)')
 s=re.sub(r"// Small national flag.*?\nconst tallest=(.*?),flagPoleY=tallest.height;.*?scene.add\(flag\);",r"// A prominent national flag stays anchored to the highest building.\nconst tallest=\1;\nconst flag=createProminentFlag(scene,art,tallest);",s,flags=re.S)
 assert s.count('const flag=createProminentFlag')==2
 s=s.replace('forestStats,geometryStats,flag','forestStats,infill,geometryStats,flag')
 (P/'v045-art.js').write_text(s)
 s=(P/'greater-taipei-v0.4.4.html').read_text().replace('v044-art.js?rev=1','v045-art.js?rev=1').replace('revision:4.4','revision:4.5')
 s=s.replace('c.life.setEnabled(moving);','c.flag.userData.update?.(time,moving);c.life.setEnabled(moving);')
 s=s.replace('content="0.4.4"','content="0.4.5"',1).replace('政策街區預覽 v0.4.4','街區補齊與植栽預覽 v0.4.5',1)
 (P/'greater-taipei-v0.4.5.html').write_text(s)
 (P/'v045-version.json').write_text(json.dumps({'preview_version':'0.4.5','base':'preview-v0.4.4','scope':'street-infill-dense-trees-visible-flags','entry':'greater-taipei-v0.4.5.html','base_sha256':hashlib.sha256((P/'greater-taipei-v0.4.4.html').read_bytes()).hexdigest(),'status':'review-only'},indent=2)+'\n')
 print('Built v0.4.5; v0.4.4, production and policy allocation retained.')
if __name__=='__main__':build()
