"""Export larger ring-distributed policy campuses on the retained v0.4 islands."""
from pathlib import Path
import json,math,copy,hashlib
from collections import defaultdict
from policy_groups_v044 import merge_themes,EXTRA
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'prototypes';S=14

def inside(x,z,poly):
 yes=False
 for a,b in zip(poly,poly[1:]+poly[:1]):
  if (a[1]>z)!=(b[1]>z) and x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]:yes=not yes
 return yes

def hsh(s):return int(hashlib.sha256(s.encode()).hexdigest()[:8],16)
def edgekey(a,b):return tuple(sorted((tuple(round(v,5)for v in a),tuple(round(v,5)for v in b))))
def distseg(x,z,a,b):
 dx=b[0]-a[0];dz=b[1]-a[1];q=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz or 1)))
 return math.hypot(x-a[0]-dx*q,z-a[1]-dz*q)
def components(roads):
 adj=defaultdict(set)
 for a,b in roads:adj[a].add(b);adj[b].add(a)
 todo=set(adj);result=[]
 while todo:
  seed=min(todo);todo.remove(seed);seen={seed};stack=[seed]
  while stack:
   for q in adj[stack.pop()]:
    if q in todo:todo.remove(q);seen.add(q);stack.append(q)
  result.append(seen)
 return result

def plan(source,parks):
 data=copy.deepcopy(source);city=data['city']['city'];coast=data['coast'];half=data['half'];step=half*2;cells=data['cells'];lm=data['landmarks'];byid={c['id']:c for c in cells};bygrid={(c['q'],c['r']):c for c in cells}
 for c in cells:c['themeId']=None
 xmin=min(p[0]for p in coast);xmax=max(p[0]for p in coast);zmin=min(p[1]for p in coast);zmax=max(p[1]for p in coast);cx=(xmin+xmax)/2;cz=(zmin+zmax)/2;rx=(xmax-xmin)/2;rz=(zmax-zmin)/2
 def clear(c):
  x,z=c['c'];return all(inside(x+dx,z+dz,coast)for dx in [-half,half]for dz in [-half,half])and all(math.hypot(max(0,abs(l['x']-x)-half),max(0,abs(l['z']-z)-half))>l['r']+.13 for l in lm)
 valid={c['id']for c in cells if clear(c)};used=set();parcels=[]
 def make(ids,kind,id,**extra):
  group=[byid[k]for k in ids];xs=[c['c'][0]for c in group];zs=[c['c'][1]for c in group];w=max(xs)-min(xs)+step;d=max(zs)-min(zs)+step
  return {'id':id,'kind':kind,'cells':list(ids),'x':(min(xs)+max(xs))/2,'z':(min(zs)+max(zs))/2,'w':w,'d':d,'usableW':w-7.4/S,'usableD':d-7.4/S,'seed':hsh(id),'zone':group[0].get('zone','residential'),**extra}
 for p in parks:
  parcels.append(make(p['cells'],'park',p['id'],seed=p['seed']));used.update(p['cells'])
 themes=merge_themes([t['theme']for t in data['themes']],city)
 for no,t in enumerate(themes,1):
  t['no']=no;t['city']=city
  for j,i in enumerate(t['items'],1):i.update(city=city,theme=t['id'],no=j)
 candidates=[]
 for c in cells:
  for nq,nr in [(3,3),(4,2),(2,4),(3,2),(2,3),(2,2),(3,1),(1,3),(2,1),(1,2)]:
   g=[bygrid.get((c['q']+q,c['r']+r))for q in range(nq)for r in range(nr)]
   if not all(v and v['id']in valid for v in g):continue
   p=make([v['id']for v in g],'policy','candidate');xn=(p['x']-cx)/rx;zn=(p['z']-cz)/rz;p.update(radius=math.hypot(xn,zn),angle=math.atan2(zn,xn));candidates.append(p)
 def angleerror(a,b):return abs((a-b+math.pi)%(2*math.pi)-math.pi)
 # Place the constrained northern/coastal sectors first, then grow each campus.
 best=None
 for rotation in [0,.15,-.15,.30,-.30]:
  placements=[];occupied=set(used);slots=[(t,-math.pi/2+rotation+i*2*math.pi/len(themes))for i,t in enumerate(themes)]
  slots.sort(key=lambda s:sum(p['w']*p['d']>step*step*3.5 and angleerror(p['angle'],s[1])<.5 for p in candidates))
  success=True
  for t,angle in slots:
   opts=[p for p in candidates if not occupied.intersection(p['cells'])]
   if not opts:success=False;break
   desired=6 if len(t['items'])>=5 else 4
   def cost(p):return angleerror(p['angle'],angle)*35+abs(p['radius']-.67)*17+max(0,desired-len(p['cells']))*5+max(0,len(p['cells'])-desired)*.7
   p=min(opts,key=lambda p:(cost(p),p['x'],p['z']));occupied.update(p['cells']);placements.append((t,p,angle))
  if not success:continue
  score=sum(angleerror(p['angle'],a)*35+abs(p['radius']-.67)*17+max(0,4-len(p['cells']))*8 for t,p,a in placements)
  if best is None or score<best[0]:best=(score,placements,occupied)
 if best is None:raise RuntimeError('No policy ring allocation '+city)
 _,placements,used=best
 # Expansion takes land from generic lots, while preserving coherent rectangle footprints.
 for _ in range(3):
  for index,(t,p,angle)in enumerate(placements):
   maximum=9 if len(t['items'])>=5 else 6
   opts=[q for q in candidates if set(p['cells']).issubset(q['cells']) and len(q['cells'])>len(p['cells']) and len(q['cells'])<=maximum and not (set(q['cells'])-set(p['cells'])).intersection(used) and angleerror(q['angle'],angle)<.8]
   if not opts:continue
   q=min(opts,key=lambda q:angleerror(q['angle'],angle)*20+abs(q['radius']-.67)*10-len(q['cells'])*1.7);used.update(q['cells']);placements[index]=(t,q,angle)
 finalthemes=[]
 for t in themes:
  _,p,angle=next(a for a in placements if a[0]['id']==t['id']);p=make(p['cells'],'policy',t['id'],angleTarget=angle)
  if t['id']in EXTRA:p.update(scene=EXTRA[t['id']])
  parcels.append(p)
  for id in p['cells']:byid[id]['themeId']=t['id']
  finalthemes.append({'id':t['id'],'x':p['x'],'z':p['z'],'zone':p['zone'],'rec':t['kind']=='record','cells':p['cells'],'theme':t})
 # Only a few distinctive ordinary blocks remain; every other usable plot serves
 # the nearest policy campus as an amenity/auxiliary facility, rather than forest lots.
 free=valid-used;ordinary_limit=4 if city=='taipei' else 3;urban=0
 for c in sorted(cells,key=lambda c:hsh(c['id'])):
  if c['id']not in free:continue
  group=None
  for nq,nr in [(2,2),(2,1),(1,2),(1,1)]:
   g=[bygrid.get((c['q']+q,c['r']+r))for q in range(nq)for r in range(nr)]
   if all(v and v['id']in free for v in g):group=g;break
  ids=[v['id']for v in group];free.difference_update(ids);used.update(ids)
  q=make(ids,'amenity','amenity-'+c['id']);nearest=min(finalthemes,key=lambda t:math.hypot(q['x']-t['x'],q['z']-t['z']));q['policyId']=nearest['id']
  # Preserve a small skyline between campuses; prioritize sizeable policy lots.
  if urban<ordinary_limit and len(group)>=2 and q['zone']in ['commercial','technology','residential']:
   q['kind']='urban';q['id']='urban-'+c['id'];urban+=1
  parcels.append(q)
 claims={id:p['id']for p in parcels for id in p['cells']};edges={};owners=defaultdict(list)
 for c in cells:
  for a,b in zip(c['poly'],c['poly'][1:]+c['poly'][:1]):owners[edgekey(a,b)].append(c['id'])
 for (a,b),ids in owners.items():
  if len(ids)==2 and claims.get(ids[0])and claims.get(ids[0])==claims.get(ids[1]):continue
  if any(distseg(l['x'],l['z'],a,b)<l['r']*.82 for l in lm):continue
  edges[(a,b)]={'a':list(a),'b':list(b),'pedestrian':False}
 # Prune genuine dead-end stubs, retaining the connected street circuits.
 adj=defaultdict(set)
 for e in edges:
  for a in e:adj[a].add(e)
 queue=[p for p,v in adj.items()if len(v)==1];removed=set()
 while queue:
  a=queue.pop()
  if len(adj[a])!=1:continue
  e=next(iter(adj[a]));removed.add(e)
  for p in e:
   adj[p].discard(e)
   if len(adj[p])==1:queue.append(p)
 roads=[v for e,v in edges.items()if e not in removed]
 angles=sorted(math.atan2((t['z']-cz)/rz,(t['x']-cx)/rx)for t in finalthemes);gaps=[(angles[(i+1)%len(angles)]-a)%(2*math.pi)for i,a in enumerate(angles)]
 data.update(themes=finalthemes,roads=roads,plannedParcels=parcels)
 data['city']['themes']=themes
 data['districtAudit']={'topicsBefore':len(source['themes']),'topicsAfter':len(themes),'items':sum(len(t['items'])for t in themes),'recordItems':sum(t['recordCount']for t in themes),'validCells':len(valid),'policyCells':sum(len(p['cells'])for p in parcels if p['kind']=='policy'),'oldPolicyCells':sum(len(t['cells'])for t in source['themes']),'policyCampusSizes':[len(p['cells'])for p in parcels if p['kind']=='policy'],'ordinaryParcels':sum(p['kind']=='urban'for p in parcels),'amenityParcels':sum(p['kind']=='amenity'for p in parcels),'maxAngularGapDegrees':max(gaps)*180/math.pi,'roadComponents':len(components([(tuple(r['a']),tuple(r['b']))for r in roads])),'prunedRoads':len(removed)}
 return data

def main():
 parks=json.loads((P/'v044-park-footprints.json').read_text());out=[]
 for c in ['taipei','newtaipei']:
  d=plan(json.loads((P/f'{c}-preview-data.json').read_text()),parks[c]);out.append(d);print(c,json.dumps(d['districtAudit']))
 (P/'v044-district-data.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
if __name__=='__main__':main()
