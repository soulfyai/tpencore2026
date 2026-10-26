"""Solve two illustrative bridge crossings and collision-free coastal boat lanes."""
from pathlib import Path
import json,math,hashlib
from plan_policy_districts_v044 import inside,distseg
P=Path(__file__).resolve().parents[1]/'prototypes'
def dist(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def blend(a,b,f):return [a[i]+(b[i]-a[i])*f for i in [0,1]]
def bounds(d):
 c=d['worldCoast'];return [(min(v[i]for v in c)+max(v[i]for v in c))/2 for i in [0,1]]
def crossing(a,b,c,d):
 def cross(a,b,c):return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
 return cross(a,b,c)*cross(a,b,d)<0 and cross(c,d,a)*cross(c,d,b)<0

def sea_obstacles(coasts):
 points=[p for c in coasts for p in c];mn=[min(p[i]for p in points)-1.5 for i in [0,1]];mx=[max(p[i]for p in points)+1.5 for i in [0,1]];mid=[(mn[i]+mx[i])/2 for i in [0,1]];rx=max(mx[i]-mn[i]for i in [0,1])/2;state=1313
 def rand():
  nonlocal state
  state=((state^(state>>15))*2246822519+0x9e3779b9)&0xffffffff
  return state/4294967296
 out=[]
 for k in range(11):
  tries=0
  while True:
   a=rand()*2*math.pi;d=rx+9+rand()*26;x=mid[0]+math.cos(a)*d;z=mid[1]+math.sin(a)*d*.8-6;tries+=1
   if tries>=30 or all(math.hypot(p['x']-x,p['z']-z)>=7 for p in out):break
  scale=1.2+rand()*2.2;rand();t=0
  while t<2+int(rand()*4):rand();rand();rand();t+=1
  out.append(dict(x=x,z=z,radius=scale*2.2))
 return out

def solve():
 data=json.loads((P/'v044-art-data.json').read_text());coasts=[]
 for d in data:
  off=d.get('sourceCenter',[0,0]);d['off']=off;d['worldCoast']=[[x+off[0],z+off[1]]for x,z in d['coast']];coasts.append(d['worldCoast'])
 A,B=data;centers=list(map(bounds,data));axis=[centers[1][i]-centers[0][i]for i in [0,1]];L=math.hypot(*axis);axis=[v/L for v in axis];normal=[-axis[1],axis[0]]
 nodes=[]
 for ci,d in enumerate(data):
  off=d['off'];pts=sorted({tuple([r[k][i]+off[i]for i in [0,1]])for r in d['roads']for k in ['a','b']})
  pts=[p for p in pts if inside(*p,d['worldCoast'])and min(distseg(*p,a,b)for a,b in zip(d['worldCoast'],d['worldCoast'][1:]+d['worldCoast'][:1]))<2.8 and sum((p[i]-centers[ci][i])*axis[i]for i in [0,1])*(1 if ci==0 else -1)>2]
  nodes.append(pts)
 def blocked(p,d,pad=.18):
  x,z=p[0]-d['off'][0],p[1]-d['off'][1]
  return any(q['kind']!='park' and abs(x-q['x'])<q['usableW']/2+pad and abs(z-q['z'])<q['usableD']/2+pad for q in d['plannedParcels'])or any(math.hypot(x-l['x'],z-l['z'])<l['r']*.8+.1 for l in d['landmarks'])or any(q['kind']=='park'and abs(x-q['x'])<q['w']/2+.1 and abs(z-q['z'])<q['d']/2+.1 for q in d['plannedParcels'])
 candidates=[]
 for a in nodes[0]:
  for b in nodes[1]:
   length=dist(a,b)
   if length>50:continue
   pts=[blend(a,b,k/100)for k in range(101)]
   if any((inside(*p,coasts[0])and k>12)or(inside(*p,coasts[1])and k<88)or any(blocked(p,d,.18+.12*min(1,min(k,100-k)*length/100/1.3))for d in data)for k,p in enumerate(pts)):continue
   side=sum(((a[i]+b[i])/2-(centers[0][i]+centers[1][i])/2)*normal[i]for i in [0,1]);candidates.append((a,b,length,side))
 if not candidates:raise RuntimeError('No clear bridge crossing')
 print('CANDIDATES',len(candidates),'nodes',list(map(len,nodes)), 'separation',max(min(dist(a[0],b[0]),dist(a[1],b[1]))for a in candidates for b in candidates),flush=True)
 lo=min(q[3]for q in candidates);hi=max(q[3]for q in candidates);bridges=[]
 for name,kind,target in [('淡江大橋','single-pylon',hi),('關渡大橋','red-arch',lo)]:
  opts=[q for q in candidates if all(dist(q[0],p['a'])>4 and dist(q[1],p['b'])>4 and not crossing(q[0],q[1],p['a'],p['b'])for p in bridges)]
  if not opts:raise RuntimeError('Cannot separate bridge crossings')
  a,b,length,side=min(opts,key=lambda q:q[2]+abs(q[3]-target)*3)
  bridges.append(dict(id='danjiang'if kind=='single-pylon'else'guandu',name=name,kind=kind,a=a,b=b,length=length,deck=.92,width=.56,ramp=3.4))
 corridors={}
 for d in data:
  rs=[]
  for bridge in bridges:
   steps=math.ceil(bridge['length']/.3)
   for k in range(steps):
    a,b=blend(bridge['a'],bridge['b'],k/steps),blend(bridge['a'],bridge['b'],(k+1)/steps);mid=blend(a,b,.5)
    if not inside(*mid,d['worldCoast']) and min(distseg(*mid,c,e)for c,e in zip(d['worldCoast'],d['worldCoast'][1:]+d['worldCoast'][:1]))>1:continue
    rs.append(dict(x=(mid[0]-d['off'][0])*14,z=(mid[1]-d['off'][1])*14,w=(abs(a[0]-b[0])+.8)*14,d=(abs(a[1]-b[1])+.8)*14))
  corridors[d['city']['city']]=rs
 c=A['worldCoast'];x0=min(p[0]for p in c);x1=max(p[0]for p in c);z0=min(p[1]for p in c);z1=max(p[1]for p in c);cx=(x0+x1)/2
 stationary=[(x0-1,(z0+z1)/2),(cx-25/14,z1+18/14),(cx+25/14,z1+22/14),(x0-22/14,z1-15/14)]
 obstacles=sea_obstacles(coasts)
 boats=[];kinds=['ferry','yacht','fishing','container','ferry','tug','yacht','fishing','ferry','yacht'];scales={'ferry':.45,'yacht':.62,'fishing':.7,'container':.22,'tug':.7}
 for ci,d in enumerate(data):
  c=centers[ci];coast=d['worldCoast'];rx=max(abs(p[0]-c[0])for p in coast);rz=max(abs(p[1]-c[1])for p in coast)
  for k in range(10):
   found=None
   for attempt in range(500):
    angle=2*math.pi*(k/10+(attempt%31)*.017+ci*.03);rad=1.12+(attempt//31)*.045
    mid=[c[0]+math.cos(angle)*rx*rad,c[1]+math.sin(angle)*rz*rad];tangent=[-math.sin(angle),math.cos(angle)];out=[math.cos(angle),math.sin(angle)];length=2.5+(k%3)*.45;curve=[]
    for j in range(64):
     a=j*math.pi*2/64;curve.append([mid[i]+tangent[i]*math.cos(a)*length+out[i]*math.sin(a)*.45 for i in [0,1]])
    if any(any(inside(*p,C)or min(distseg(*p,a,b)for a,b in zip(C,C[1:]+C[:1]))<1.2 for C in coasts)or any(distseg(*p,b['a'],b['b'])<1.4 for b in bridges)for p in curve):continue
    if any(math.hypot(p[0]-o['x'],p[1]-o['z'])<o['radius']+1.2 for p in curve for o in obstacles):continue
    if min(dist(p,q)for p in curve for q in stationary)<1.6:continue
    if any(min(dist(a,b)for a in curve for b in q['samples'])<1.6 for q in boats):continue
    found=dict(id=f'{d["city"]["city"]}-boat-{k}',city=d['city']['city'],kind=kinds[k],scale=scales[kinds[k]],center=mid,tangent=tangent,out=out,length=length,phase=k*.73,speed=.05+(k%4)*.006,samples=curve);break
   if found is None:raise RuntimeError('No water lane '+str((ci,k)))
   boats.append(found)
 out=dict(environment_sha256=hashlib.sha256((P.parent/'3d/env.js').read_bytes()).hexdigest(),source_sha256=hashlib.sha256((P/'v044-art-data.json').read_bytes()).hexdigest(),version='0.4.6',placement='illustrative-two-island-crossings-not-geographic-survey',bridges=bridges,corridors=corridors,boats=boats,stationaryBoats=stationary,seaObstacles=obstacles)
 (P/'v046-transport-plan.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
 print('Planned',[(b['name'],round(b['length'],2),b['a'],b['b'])for b in bridges],len(boats),'new vessels')
 return out
if __name__=='__main__':solve()
