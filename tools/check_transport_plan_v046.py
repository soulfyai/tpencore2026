"""Validate static vessel water/bridge clearances and frozen layout provenance."""
from pathlib import Path
import json,hashlib,math,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from plan_policy_districts_v044 import inside,distseg
from plan_transport_v046 import crossing,dist
P=Path(__file__).resolve().parents[1]/'prototypes';data=json.loads((P/'v044-art-data.json').read_text());plan=json.loads((P/'v046-transport-plan.json').read_text())
assert plan['source_sha256']==hashlib.sha256((P/'v044-art-data.json').read_bytes()).hexdigest()
coasts=[[[p[i]+d.get('sourceCenter',[0,0])[i]for i in [0,1]]for p in d['coast']]for d in data]
assert len(plan['boats'])==20 and len({b['id']for b in plan['boats']})==20
assert len({b['kind']for b in plan['boats']})==5
assert all(distseg(o['x'],o['z'],b['a'],b['b'])>o['radius']+.5 for b in plan['bridges']for o in plan['seaObstacles'])
A,B=plan['bridges'];assert not crossing(A['a'],A['b'],B['a'],B['b'])
assert min(dist(A['a'],B['a']),dist(A['b'],B['b']))>4
for bridge in plan['bridges']:
 for i,d in enumerate(data):
  p=bridge['b'if i else'a'];offset=d.get('sourceCenter',[0,0]);assert any(dist(p,[r[k][j]+offset[j]for j in [0,1]])<1e-6 for r in d['roads']for k in ['a','b'])
for i,b in enumerate(plan['boats']):
 for p in b['samples']:
  assert min(dist(p,q)for q in plan['stationaryBoats'])>=1.6
  assert all(math.hypot(p[0]-o['x'],p[1]-o['z'])>=o['radius']+1.2 for o in plan['seaObstacles'])
  for C in coasts:
   assert not inside(*p,C)
   assert min(distseg(*p,a,c)for a,c in zip(C,C[1:]+C[:1]))>=1.2
  for bridge in plan['bridges']:assert distseg(*p,bridge['a'],bridge['b'])>=1.4
 for q in plan['boats'][:i]:assert min(dist(a,c)for a in b['samples']for c in q['samples'])>=1.6
print('PASS bridge endpoints/spacing/noncrossing; all20 added vessel routes remain at sea, away from bridges and each other; original layout SHA retained.')
