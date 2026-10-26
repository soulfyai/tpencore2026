"""Regression checks for grouped facts, coastlines and policy campus allocation."""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def read(name):return json.loads((R/'prototypes'/name).read_text())
old=read('v041-art-data.json');new=read('v044-art-data.json')
for a,b in zip(old,new):
 city=b['city']['city']
 for key in ['coast','landmarks','center','half','snapshotCommit']:assert a[key]==b[key],(city,key)
 before={i['id']:i for t in a['city']['themes'] for i in t['items']}
 after={i['id']:i for t in b['city']['themes'] for i in t['items']}
 assert before.keys()==after.keys()
 for id,i in before.items():
  for key,val in i.items():
   if key not in ['no','theme']:assert after[id][key]==val,(id,key)
 assert len(after)==sum(len(t['items'])for t in b['city']['themes'])
 parcels=b['plannedParcels'];occupied=[]
 for p in parcels:
  assert not set(p['cells'])&set(occupied),p['id']
  occupied.extend(p['cells'])
 audit=b['districtAudit'];assert audit['roadComponents']==1
 assert audit['maxAngularGapDegrees']<90
 assert audit['policyCells']>audit['oldPolicyCells']*1.8
 assert audit['ordinaryParcels']<=2
 if city=='taipei':
  assert len(b['city']['themes'])==12 and len(after)==62
  assert sum(i['contentKind']=='record'for i in after.values())==27
  groups={t['id']:t for t in b['city']['themes']}
  for id,total,records in [('tp-transport',10,5),('tp-housing',9,3),('tp-education',4,2),('tp-sports',4,2)]:
   assert len(groups[id]['items'])==total and groups[id]['recordCount']==records
 else:assert len(b['city']['themes'])==9 and len(after)==56
print('PASS all 118 original facts/statuses/sources retained; canonical categories; unchanged coasts/landmarks; disjoint campuses; connected roads; ring spread <90 degrees; policy land >1.8x.')
