"""Export common-coordinate administrative terrain and illustrative urban parcels.
Run explicitly with Shapely 2.1; CI consumes the checked-in export, not this tool.
"""
from pathlib import Path
import json, math, hashlib, heapq, re
from collections import defaultdict
from shapely.geometry import Polygon,Point,LineString,MultiPoint,box
from shapely.ops import unary_union,triangulate
from shapely import make_valid
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'prototypes';S=14;HALF=.72;STEP=HALF*2
LON=121.55;LAT=25.05;UNIT=1.5;KX=111.32*math.cos(math.radians(LAT))*UNIT;KZ=110.57*UNIT

def project(p):return [(p[0]-LON)*KX,-(p[1]-LAT)*KZ]
def clean(p):
 g=make_valid(p)
 return unary_union([x for x in getattr(g,'geoms',[g]) if x.geom_type in ['Polygon','MultiPolygon']])
def polys(g):
 if g.is_empty or g.geom_type not in ['Polygon','MultiPolygon','GeometryCollection']:return []
 return [g] if g.geom_type=='Polygon' else [p for q in g.geoms for p in polys(q)]
def encode(g):return [{'outer':[[round(x,6),round(z,6)] for x,z in p.exterior.coords],'holes':[[[round(x,6),round(z,6)] for x,z in h.coords] for h in p.interiors]} for p in polys(g)]
def hsh(s):return int(hashlib.sha256(s.encode()).hexdigest()[:8],16)
def smooth(v):v=max(0,min(1,v));return v*v*(3-2*v)

def main():
 raw=(ROOT/'data/geo.json').read_bytes();G=json.loads(raw)
 city={c:clean(Polygon([project(p) for p in G['cities'][c][0]])) for c in ['taipei','newtaipei']}
 city['newtaipei']=city['newtaipei'].difference(city['taipei'])
 nation=clean(unary_union([Polygon([project(p) for p in ring]) for ring in G['nation']])).union(city['newtaipei']).union(city['taipei'])
 river_paths=[('淡水河',[[121.414,25.183],[121.427,25.163],[121.452,25.139],[121.466,25.116],[121.474,25.108],[121.491,25.092],[121.502,25.064],[121.496,25.044],[121.485,25.028],[121.506,25.014]],.25),('新店溪',[[121.506,25.014],[121.525,25.009],[121.532,24.996],[121.533,24.975],[121.541,24.958]],.14),('基隆河',[[121.491,25.092],[121.51,25.083],[121.54,25.078],[121.56,25.072],[121.589,25.074],[121.614,25.079],[121.64,25.073],[121.659,25.068]],.13),('大漢溪',[[121.506,25.014],[121.473,25.027],[121.449,25.025],[121.429,25.013],[121.416,24.99],[121.394,24.967],[121.376,24.944]],.19)]
 rivers=[]
 for name,coords,width in river_paths:
  points=[project(p) for p in coords]
  # Catmull-Rom interpolation keeps recognizable course anchors without sharp elbows.
  curve=[]
  for i in range(len(points)-1):
   a=points[max(0,i-1)];b=points[i];c=points[i+1];d=points[min(len(points)-1,i+2)]
   for n in range(12):
    t=n/12;curve.append([.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t) for k in [0,1]])
  curve.append(points[-1]);rivers.append({'name':name,'points':curve,'width':width,'geometry':LineString(curve).buffer(width,quad_segs=6)})
 water=unary_union([r['geometry'] for r in rivers]);river_bank=water.buffer(.10,quad_segs=3)
 locations={'t101':(121.5654,25.0330),'dome':(121.578,25.052),'station':(121.517,25.0478),'shinkong':(121.515,25.046),'grand':(121.5264,25.0789),'npm':(121.5494,25.1024),'miramar':(121.556,25.083),'cks':(121.5199,25.0346),'sysm':(121.5603,25.0400),'longshan':(121.4999,25.0372),'redhouse':(121.5069,25.0420),'yangming':(121.55,25.167),'elephant':(121.571,25.027),'maokong':(121.587,24.968),'daan':(121.536,25.030),'beitou':(121.506,25.137),'ntcity':(121.465,25.012),'fort':(121.432,25.175),'jiufen':(121.843,25.109),'shifen':(121.788,25.049),'queen':(121.690,25.206)}
 clusters={'taipei':[(121.530,25.044,9,9,'basin'),(121.568,25.035,5,4,'xinyi'),(121.607,25.052,5,3.5,'nangang'),(121.587,25.082,5,3,'neihu'),(121.572,24.994,4,3.5,'wenshan'),(121.524,25.101,4.5,3,'shilin'),(121.505,25.127,4,3,'beitou')], 'newtaipei':[(121.459,25.012,5,5,'banqiao'),(121.445,25.036,4,4,'xinzhuang'),(121.485,25.064,4,4,'sanchong'),(121.499,24.999,5,3.5,'zhonghe'),(121.535,24.975,3.8,4,'xindian'),(121.468,25.084,3,3,'luzhou'),(121.445,25.168,3.5,3.5,'tamsui'),(121.65,25.064,4,3,'xizhi'),(121.37,24.938,2.8,2.8,'sanxia'),(121.382,25.077,3.2,3.2,'linkou'),(121.35,24.955,2.5,2.5,'yingge')]}
 anchorsTP=[(121.52,25.05),(121.505,25.033),(121.6,25.067),(121.545,25.023),(121.518,25.022),(121.527,25.089),(121.578,25.05),(121.557,25.045),(121.56,25.06),(121.51,25.071),(121.59,25.048),(121.55,25.002),(121.58,25.02),(121.51,25.112),(121.512,25.042),(121.546,25.083),(121.526,25.057)]
 anchorsNT=[(121.457,25.015),(121.483,25.065),(121.496,24.997),(121.516,25.005),(121.535,24.976),(121.446,25.04),(121.651,25.064),(121.468,25.086),(121.443,25.164)]
 data=[];all_landmarks=[];all_cells=[];all_parcels=[]
 for c in ['taipei','newtaipei']:
  source=json.loads((OUT/f'{c}-preview-data.json').read_text());lm=[]
  for l in source['landmarks']:
   lon,lat=locations[l['id']];x,z=project((lon,lat));factor=.42
   if l['id']=='shinkong':factor=.32
   item={**l,'x':x,'z':z,'r':l['r']*factor,'scale':l['scale']*factor,'lon':lon,'lat':lat,'heightScale':1.7 if l['id']=='t101' else 1,'baseY':0}
   lm.append(item);all_landmarks.append({**item,'city':c})
  reserved=unary_union([Point(l['x'],l['z']).buffer(l['r']+.2) for l in lm])
  urban=unary_union([Point(*project((lon,lat))).buffer(1).buffer(0) if False else Polygon([(project((lon,lat))[0]+rx*math.cos(i*math.tau/48),project((lon,lat))[1]+rz*math.sin(i*math.tau/48)) for i in range(48)]) for lon,lat,rx,rz,name in clusters[c]])
  region=city[c].difference(river_bank.buffer(.12)).difference(reserved)
  cells=[];minx,minz,maxx,maxz=city[c].bounds
  for r in range(math.floor(minz/STEP),math.ceil(maxz/STEP)+1):
   for q in range(math.floor(minx/STEP),math.ceil(maxx/STEP)+1):
    x=q*STEP;z=r*STEP;p=box(x-HALF,z-HALF,x+HALF,z+HALF)
    if not region.contains(p.buffer(.10)) or not urban.contains(Point(x,z)):continue
    near=min(clusters[c],key=lambda a:math.hypot((x-project(a[:2])[0])/a[2],(z-project(a[:2])[1])/a[3]))
    cells.append({'id':f'{c}:{q}:{r}','city':c,'q':q,'r':r,'c':[x,z],'poly':[[x-HALF,z-HALF],[x+HALF,z-HALF],[x+HALF,z+HALF],[x-HALF,z+HALF]],'themeId':None,'zone':'commercial' if near[4] in ['xinyi','banqiao','nangang','xizhi'] else 'residential','cluster':near[4]})
  bygrid={(v['q'],v['r']):v for v in cells};used=set();parcels=[]
  def group(cell,nq,nr):
   g=[bygrid.get((cell['q']+a,cell['r']+b)) for a in range(nq) for b in range(nr)]
   return g if all(v and v['id'] not in used for v in g) else None
  def add(g,kind,**extra):
   xs=[v['c'][0] for v in g];zs=[v['c'][1] for v in g];w=max(xs)-min(xs)+STEP;d=max(zs)-min(zs)+STEP
   p={'id':extra.get('id',f'urban-{g[0]["id"]}'),'kind':kind,'cells':[v['id'] for v in g],'x':(min(xs)+max(xs))/2,'z':(min(zs)+max(zs))/2,'w':w,'d':d,'usableW':w-7.4/S,'usableD':d-7.4/S,'zone':g[0]['zone'],'cluster':g[0]['cluster'],'seed':hsh(g[0]['id']),**extra};parcels.append(p)
   for v in g:used.add(v['id']);v['themeId']=p['id'] if kind=='policy' else None
   return p
  themes=[]
  for t,anchor in zip(source['themes'],anchorsTP if c=='taipei' else anchorsNT):
   target=project(anchor);options=[];wanted=2 if len(t['theme']['items'])>=5 else 1
   for v in cells:
    for nq,nr in ([(2,1),(1,2)] if wanted==2 else [(1,1)]):
     g=group(v,nq,nr)
     if g:options.append((math.hypot(sum(b['c'][0] for b in g)/len(g)-target[0],sum(b['c'][1] for b in g)/len(g)-target[1]),g))
   if not options:raise RuntimeError(f'Not enough cells for {t["id"]}; {len(cells)} cells')
   p=add(min(options,key=lambda a:a[0])[1],'policy',id=t['id']);themes.append({**t,'x':p['x'],'z':p['z'],'cells':p['cells']})
  for i in range(4):
   choices=[]
   for v in cells:
    for nq,nr in [(2,2),(2,1),(1,2)]:
     g=group(v,nq,nr)
     if not g:continue
     x=sum(b['c'][0] for b in g)/len(g);z=sum(b['c'][1] for b in g)/len(g)
     if any(p['kind']=='park' and math.hypot(p['x']-x,p['z']-z)<4 for p in parcels):continue
     score=(hsh(v['id']+str(i))%1000)/1000+(0 if len(g)==4 else 1)
     choices.append((score,g))
   if choices:add(min(choices,key=lambda a:a[0])[1],'park',id=f'{c}-lake-{i}')
  for v in sorted(cells,key=lambda v:hsh(v['id'])):
   if v['id'] in used:continue
   sizes=[(2,2),(2,1),(1,2),(1,1)] if hsh(v['id'])%3==0 else [(1,1),(2,1),(1,2)]
   for nq,nr in sizes:
    g=group(v,nq,nr)
    if g:add(g,'urban');break
  owners={v['id']:p['id'] for p in parcels for v in cells if v['id'] in p['cells']};edges={}
  for v in cells:
   for i,a in enumerate(v['poly']):
    b=v['poly'][(i+1)%4];k=tuple(sorted((tuple(round(x,5) for x in a),tuple(round(x,5) for x in b))))
    edges.setdefault(k,[]).append(v['id'])
  roads=[{'a':list(k[0]),'b':list(k[1]),'pedestrian':False} for k,v in edges.items() if len(v)!=2 or owners[v[0]]!=owners[v[1]]]
  ponds=[]
  for i,p in enumerate(v for v in parcels if v['kind']=='park'):
   pts=[]
   for n in range(48):
    a=n*math.tau/48;r=.76+.09*math.sin(a*3+i)+.05*math.cos(a*5+i*.7);pts.append([p['x']+math.cos(a)*p['usableW']*.40*r,p['z']+math.sin(a)*p['usableD']*.40*r])
   def grow(amount):
    return [[x+(x-p['x'])/math.hypot(x-p['x'],z-p['z'])*amount,z+(z-p['z'])/math.hypot(x-p['x'],z-p['z'])*amount] for x,z in pts]
   ponds.append({**p,'points':pts,'bank':grow(.85/S),'walk':grow(1.6/S),'path':i%2==0})
  obj={**source,'coast':[[x,z] for x,z in (city[c].exterior.coords if c=='taipei' else Polygon([project(p) for p in G['cities'][c][0]]).exterior.coords)],'holes':[] if c=='taipei' else [list(map(list,city['taipei'].exterior.coords))],'center':list(city[c].representative_point().coords)[0],'sourceCenter':[0,0],'half':HALF,'cells':cells,'roads':roads,'themes':themes,'landmarks':lm,'plannedParcels':parcels,'geoPonds':ponds}
  data.append(obj);all_cells+=cells;all_parcels+=parcels
  print(c,len(cells),'cells',len(parcels),'parcels',len(themes),'themes',len(ponds),'lakes')
 # Build a single deduplicated graph, connecting neighborhoods on the shared grid.
 edges={tuple(sorted((tuple(round(x,5) for x in r['a']),tuple(round(x,5) for x in r['b'])))) for d in data for r in d['roads']}
 def components():
  adj=defaultdict(set)
  for a,b in edges:adj[a].add(b);adj[b].add(a)
  todo=set(adj);out=[]
  while todo:
   seed=next(iter(todo));seen={seed};todo.remove(seed);stack=[seed]
   while stack:
    for n in adj[stack.pop()]:
     if n in todo:todo.remove(n);seen.add(n);stack.append(n)
   out.append(seen)
  return sorted(out,key=len,reverse=True)
 forbidden=unary_union([Point(l['x'],l['z']).buffer(l['r']+.15) for l in all_landmarks])
 def togrid(p):return (round((p[0]-HALF)/STEP),round((p[1]-HALF)/STEP))
 def fromgrid(q):return (round(q[0]*STEP+HALF,5),round(q[1]*STEP+HALF,5))
 land_for_roads=nation.buffer(.05);allowed={}
 def okay(a,b):
  key=tuple(sorted((a,b)))
  if key not in allowed:
   l=LineString([fromgrid(a),fromgrid(b)]);allowed[key]=land_for_roads.contains(l) and not forbidden.intersects(l)
  return allowed[key]
 connectors=[]
 for _ in range(80):
  cc=components()
  if len(cc)==1:break
  big=cc[0];options=[]
  for other in cc[1:]:
   a,b=min(((a,b) for a in big for b in other),key=lambda pair:abs(pair[0][0]-pair[1][0])+abs(pair[0][1]-pair[1][1]));options.append((math.dist(a,b),a,b))
  _,start,goal=min(options);a=togrid(start);b=togrid(goal);heap=[(0,a)];cost={a:0};prev={};found=False
  while heap:
   _,u=heapq.heappop(heap)
   if u==b:found=True;break
   for dx,dz in [(1,0),(-1,0),(0,1),(0,-1)]:
    v=(u[0]+dx,u[1]+dz)
    if abs(v[0])>100 or abs(v[1])>100 or not okay(u,v):continue
    n=cost[u]+1
    if n<cost.get(v,1e9):cost[v]=n;prev[v]=u;heapq.heappush(heap,(n+abs(v[0]-b[0])+abs(v[1]-b[1]),v))
  if not found:raise RuntimeError('Cannot connect street neighborhoods')
  route=[b]
  while route[-1]!=a:route.append(prev[route[-1]])
  for a,b in zip(route,route[1:]):
   pair=tuple(sorted((fromgrid(a),fromgrid(b))));edges.add(pair);connectors.append({'a':list(pair[0]),'b':list(pair[1]),'pedestrian':False})
 assert len(components())==1
 roads=[{'a':list(a),'b':list(b),'pedestrian':False} for a,b in sorted(edges)]
 road_geom=unary_union([LineString([r['a'],r['b']]) for r in roads])
 bridge_lines=road_geom.intersection(water)
 bridge_segments=[list(map(list,g.coords)) for g in getattr(bridge_lines,'geoms',[bridge_lines]) if g.geom_type=='LineString' and g.length>.10]
 # Continuous terrain owns the coast once. Taipei is a true hole in New Taipei.
 ponds=[p for d in data for p in d['geoPonds']];lake_holes=unary_union([Polygon(p['walk'] if p['path'] else p['bank']) for p in ponds]);holes=river_bank.union(lake_holes)
 selected=unary_union(list(city.values()));b=selected.bounds;field=box(b[0]-16,b[1]-16,b[2]+16,b[3]+16)
 owned=[('context',nation.intersection(field).difference(selected).difference(holes)),('newtaipei',city['newtaipei'].difference(holes)),('taipei',city['taipei'].difference(holes))]
 urban_geom=unary_union([Polygon(c['poly']) for c in all_cells]);built_sites=unary_union([Point(l['x'],l['z']).buffer(l['r']+.1) for l in all_landmarks if not l.get('nature')])
 xmin,zmin,xmax,zmax=field.bounds;gridstep=1.2;nx=math.ceil((xmax-xmin)/gridstep)+1;nz=math.ceil((zmax-zmin)/gridstep)+1
 hills=[(121.55,25.168,4.5,5),(121.55,24.82,6,12),(121.72,24.91,5.2,11),(121.83,25.10,3,7),(121.68,25.125,2.8,5),(121.38,25.08,1.6,5)]
 heights=[]
 coast=nation.boundary
 for j in range(nz):
  for i in range(nx):
   x=xmin+i*gridstep;z=zmin+j*gridstep;pt=Point(x,z)
   h=sum(amp*math.exp(-((x-project((lon,lat))[0])**2+(z-project((lon,lat))[1])**2)/(rad*rad)) for lon,lat,amp,rad in hills)
   h*=smooth((pt.distance(urban_geom)-1.7)/1.5)*smooth((pt.distance(road_geom)-1.5)/1.2)*smooth((pt.distance(built_sites)-1.7)/.8)*smooth(pt.distance(water)/.9)*smooth(pt.distance(coast)/.9)
   h*=float(nation.contains(pt))
   h*=smooth(min(x-xmin,xmax-x,z-zmin,zmax-z)/6)
   heights.append(round(h,5))
 def height(x,z):
  xx=max(0,min(nx-1.001,(x-xmin)/gridstep));zz=max(0,min(nz-1.001,(z-zmin)/gridstep));i=int(xx);j=int(zz);u=xx-i;v=zz-j
  return (heights[j*nx+i]*(1-u)+heights[j*nx+i+1]*u)*(1-v)+(heights[(j+1)*nx+i]*(1-u)+heights[(j+1)*nx+i+1]*u)*v
 vertices=[];indices=[];colors=[];vertexmap={};palettes={'context':(.64,.71,.59),'newtaipei':(.40,.57,.32),'taipei':(.60,.72,.43)}
 points=[(xmin+i*2,zmin+j*2) for j in range(math.ceil((zmax-zmin)/2)+1) for i in range(math.ceil((xmax-xmin)/2)+1)]
 triangles=triangulate(MultiPoint(points))
 for owner,region in owned:
  color=palettes[owner]
  for tri in triangles:
   if not region.intersects(tri):continue
   pieces=[tri] if region.contains(tri) else polys(region.intersection(tri))
   for piece in pieces:
    for t in triangulate(piece):
     if not piece.covers(t.representative_point()) or not piece.buffer(1e-7).covers(t):continue
     ids=[]
     for x,z in list(t.exterior.coords)[:3]:
      key=(owner,round(x,6),round(z,6))
      if key not in vertexmap:
       vertexmap[key]=len(vertices)//3;h=height(x,z);vertices.extend([round(x,6),round(h,5),round(z,6)]);shade=.94+.05*math.sin(x*.53+z*.21)+.04*math.cos(z*.41);colors.extend([round(c*shade,5) for c in color])
      ids.append(vertexmap[key])
     # Three's ground normals face +Y for clockwise x/z ordering.
     a,b,c=[vertices[n*3:n*3+3] for n in ids];cross=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2])
     indices.extend(ids if cross>0 else ids[::-1])
 for d in data:
  for l in d['landmarks']:
   if l.get('nature'):l['baseY']=height(l['x'],l['z'])
 geo={'version':'0.5.0','source_sha256':hashlib.sha256(raw).hexdigest(),'projection':{'origin':[LON,LAT],'unitsPerKm':UNIT,'xPerLongitude':KX,'zPerLatitude':-KZ,'north':'negative Z'},'cities':{c:encode(p) for c,p in city.items()},'context':encode(nation.difference(field)),'base':encode(nation.difference(holes)),'rivers':[{'name':r['name'],'points':r['points'],'width':r['width']} for r in rivers],'riverBanks':encode(river_bank.difference(water)),'riverWater':encode(water),'roads':roads,'connectors':connectors,'bridges':bridge_segments,'terrain':{'positions':vertices,'indices':indices,'colors':colors},'heightGrid':{'origin':[xmin,zmin],'step':gridstep,'nx':nx,'nz':nz,'values':heights},'landmarks':all_landmarks,'urbanFocus':{'taipei':[-13,-12,13,14],'newtaipei':[-18,-7,1,17]},'audit':{'cityIntersectionArea':city['taipei'].intersection(city['newtaipei']).area,'roadComponents':len(components()),'urbanCells':len(all_cells),'roadEdges':len(roads),'bridges':len(bridge_segments)}}
 # Keep existing source scope filtering policy in the new geographic export.
 import sys
 sys.path.insert(0,str(ROOT/'tools'))
 from build_greater_taipei_preserved import scope
 for name,value in [('v05-art-data.json',scope(data)),('v05-geography.json',geo)]:
  (OUT/name).write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n')
 print('GEOGRAPHY',geo['audit'],'terrain vertices',len(vertices)//3,'triangles',len(indices)//3)
if __name__=='__main__':main()
