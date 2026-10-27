from pathlib import Path
R=Path(__file__).resolve().parents[1];P=R/'prototypes'
s=(P/'greater-taipei-v0.4.9.html').read_text().replace('transport-network-v049.js','transport-network-v0410.js').replace('0.4.9','0.4.10')
(P/'greater-taipei-v0.4.10.html').write_text(s)
t=(P/'transport-network-v049.js').read_text().replace("import * as THREE from 'three';","import * as THREE from 'three';\nimport {createRemoteTraffic} from './remote-traffic-v0410.js';")
t=t.replace(' function update(dt=0', ' const remote=await createRemoteTraffic(root,cities,plan,ships,random,waterY);\n function update(dt=0').replace('  for(const v of vessels)', '  remote.update(clock);\n  for(const v of vessels)').replace('return {root,bridges,vessels,planes,cars,update,','return {root,bridges,vessels,planes,cars,remote,update,')
(P/'transport-network-v0410.js').write_text(t)
print('Built v0.4.10 remote sea/air traffic preview')
