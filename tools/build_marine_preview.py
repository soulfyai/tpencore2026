from pathlib import Path
R=Path(__file__).resolve().parents[1];P=R/'prototypes'
s=(P/'greater-taipei-v0.4.10.html').read_text().replace('transport-network-v0410.js','transport-network-v0411.js').replace('0.4.10','0.4.11')
(P/'greater-taipei-v0.4.11.html').write_text(s)
t=(P/'transport-network-v0410.js').read_text().replace("import * as THREE from 'three';","import * as THREE from 'three';\nimport {createMarineLife} from './marine-life-v0411.js';")
t=t.replace(' function update(dt=0',' const marine=createMarineLife(root,remote.lanes,waterY);\n function update(dt=0').replace('  remote.update(clock);','  remote.update(clock);marine.update(clock,[...vessels,...remote.vessels]);').replace('cars,remote,update,','cars,remote,marine,update,')
(P/'transport-network-v0411.js').write_text(t)
print('Built v0.4.11 cute marine wildlife preview')
