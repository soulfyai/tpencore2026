"""Offline exact junction/shoreline paving export. CI consumes the frozen result."""
from pathlib import Path
import hashlib,json,math
from shapely.geometry import Polygon,MultiPolygon,GeometryCollection,Point
from shapely.ops import unary_union
from shapely import constrained_delaunay_triangles
P=Path(__file__).resolve().parents[1]/'prototypes'
ROAD=.12/14;GROUND=.01/14;JOIN=.82;THICK=.055

def smooth(t):t=max(0,min(1,t));return t*t*t*(10+t*(-15+6*t))
def rect(c,u,length,half,start=-.12):
 n=[-u[1],u[0]];return Polygon([[c[i]+u[i]*s+n[i]*t for i in [0,1]]for s,t in [(start,-half),(length,-half),(length,half),(start,half)]])
def coords(poly):return [[round(v,10)for v in p]for p in list(poly.exterior.coords)[:-1]]
def polygons(g):
 if g.is_empty:return []
 if isinstance(g,Polygon):return [g]if g.area>1e-10 else []
 return [p for q in g.geoms for p in polygons(q)]
def rounded(poly,r=.045,keep=lambda p:False):
 p=coords(poly);out=[]
 for i,q in enumerate(p):
  if keep(q):out.append(q);continue
  prev=p[i-1];nxt=p[(i+1)%len(p)];a=math.dist(prev,q);b=math.dist(nxt,q);d=min(r,a*.18,b*.18)
  if d<1e-7:out.append(q);continue
  A=[q[j]+(prev[j]-q[j])*d/a for j in [0,1]];B=[q[j]+(nxt[j]-q[j])*d/b for j in [0,1]]
  for k in range(6):
   t=k/5;out.append([A[j]*(1-t)**2+q[j]*2*t*(1-t)+B[j]*t*t for j in [0,1]])
 return Polygon(out).buffer(0)
def densify(points,step=.07):
 out=[]
 for a,b in zip(points,points[1:]+points[:1]):
  n=max(1,math.ceil(math.dist(a,b)/step))
  out.extend([[a[i]+(b[i]-a[i])*k/n for i in [0,1]]for k in range(n)])
 return out

def export():
 D=json.loads((P/'v044-art-data.json').read_text());T=json.loads((P/'v046-transport-plan.json').read_text());bridges=[]
 for b in T['bridges']:
  u=[(b['b'][i]-b['a'][i])/b['length']for i in [0,1]];ends=[]
  for ei,d in enumerate(D):
   node=b['b'if ei else'a'];off=d.get('sourceCenter',[0,0]);out=[-v if ei else v for v in u];neighbors=[]
   for road in d['roads']:
    for key,other in [('a','b'),('b','a')]:
     a=[road[key][i]+off[i]for i in [0,1]];p=[road[other][i]+off[i]for i in [0,1]]
     if math.dist(a,node)<1e-6:neighbors.append([(p[i]-a[i])/math.dist(p,a)for i in [0,1]])
   grassCoast=[[p[i]+off[i]for i in [0,1]]for p in d['coast']];coast=[[p[i]*1.035+off[i]for i in [0,1]]for p in d['coast']];land=Polygon(coast);shore=0
   for k in range(1,401):
    r=k*.025
    if not land.covers(Point(node[0]+out[0]*r,node[1]+out[1]*r)):shore=r;break
   ramp=max(6.4,shore+2.8);dirs=neighbors+[out];run=[.66]*len(neighbors)+[JOIN]
   def shape(half,extension=0):
    x,z=node;square=Polygon([(x-half,z-half),(x+half,z-half),(x+half,z+half),(x-half,z+half)])
    raw=unary_union([square]+[rect(node,v,l+extension,half)for v,l in zip(dirs,run)])
    def keep(p):return any(abs(sum((p[i]-node[i])*v[i]for i in [0,1])-l-extension)<1e-6 for v,l in zip(dirs,run))
    return rounded(raw,keep=keep)
   outer=shape(6.7/28);inner=shape(4.8/28,.01).intersection(outer);walk=outer.difference(inner)
   assert inner.is_valid and outer.is_valid and walk.is_valid and isinstance(inner,Polygon)
   assert sum(p.area for p in polygons(walk))+inner.area-outer.area<1e-7
   assert not any(p.interiors for p in polygons(walk)),'Pedestrian wedges should open to their street ends'
   def height(s):return ROAD+(b['deck']-ROAD)*smooth((s-JOIN)/ramp)
   start=JOIN+.1
   while height(start)-THICK<GROUND+.002:start+=.01
   stop=shore+.10;pieces=[];footprints=[]
   if stop>start:
    n=math.ceil((stop-start)/.07)
    for k in range(n):
     s=start+(stop-start)*k/n;t=start+(stop-start)*(k+1)/n;w0=(4.8/14+(b['width']-4.8/14)*smooth((s-JOIN)/2.6))/2+(6.7-4.8)/28+.035;w1=(4.8/14+(b['width']-4.8/14)*smooth((t-JOIN)/2.6))/2+(6.7-4.8)/28+.035;normal=[-out[1],out[0]]
     q=Polygon([[node[i]+out[i]*a+normal[i]*h for i in [0,1]]for a,h in [(s,-w0),(t,-w1),(t,w1),(s,w0)]]).intersection(land)
     for poly in polygons(q):pieces.append(coords(poly));footprints.append(poly)
   outlines=[densify(coords(poly))for poly in polygons(unary_union(footprints))]if footprints else[]
   foundationStart=max(.05,shore-.55);foundationStop=shore+.04;foundations=[];foot=[];n=max(1,math.ceil((foundationStop-foundationStart)/.07))
   for k in range(n):
    s=foundationStart+(foundationStop-foundationStart)*k/n;t=foundationStart+(foundationStop-foundationStart)*(k+1)/n
    w=(4.8/14+(b['width']-4.8/14)*smooth((t-JOIN)/2.6))/2+(6.7-4.8)/28+.045
    q=rect([node[i]+out[i]*s for i in [0,1]],out,t-s,w,0).intersection(land)
    for poly in polygons(q):
     foundations.append([[p[i]+out[i]*.006 if land.boundary.distance(Point(p))<1e-6 else p[i]for i in [0,1]]for p in coords(poly)]);foot.append(poly)
   foundationOutlines=[]
   for poly in polygons(unary_union(foot)):
    loop=densify(coords(poly));foundationOutlines.append([[p[i]+out[i]*.006 if land.boundary.distance(Point(p))<1e-6 else p[i] for i in [0,1]]for p in loop])
   end=dict(id=b['id']+'-'+d['city']['city'],city=d['city']['city'],node=node,outward=out,neighbors=neighbors,dirs=dirs,run=run,coast=coast,grassCoast=grassCoast,shore=shore,ramp=ramp,inner=coords(inner),outer=coords(outer),innerTriangles=[coords(t)for t in polygons(constrained_delaunay_triangles(inner))],outerTriangles=[coords(t)for t in polygons(constrained_delaunay_triangles(outer))],sidewalkTriangles=[coords(t)for t in polygons(constrained_delaunay_triangles(walk))],sidewalkPolygons=[coords(p)for p in polygons(walk)],abutmentPieces=pieces,abutmentOutlines=outlines,foundationPieces=foundations,foundationOutlines=foundationOutlines)
   ends.append(end);print(end['id'],'road',round(inner.area,5),'walk',round(walk.area,5),'wedges',len(end['sidewalkPolygons']),'shore',shore,'fill slices',len(pieces))
  bridges.append(dict(id=b['id'],ends=ends))
 result=dict(version='0.4.7',source_sha256=hashlib.sha256((P/'v044-art-data.json').read_bytes()).hexdigest(),transport_sha256=hashlib.sha256((P/'v046-transport-plan.json').read_bytes()).hexdigest(),bridges=bridges)
 (P/'v047-bridge-finishes.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
if __name__=='__main__':export()
