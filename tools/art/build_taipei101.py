"""Build a reusable, original Taipei-101-inspired art asset with Blender.
Dimensions are an artistic reconstruction, not a surveyed architectural model.
Run: blender -b --python tools/art/build_taipei101.py
"""
import bpy, math, random, json
from pathlib import Path
from collections import defaultdict
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/art-v030';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
random.seed(101)
meshes=defaultdict(lambda:[[],[]]);materials={}
def mat(name,c,metal=0,rough=.7):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;materials[name]=m;return name
stone=mat('Limestone / warm ivory',(.62,.60,.51),.05,.78)
frame=mat('Anodized blue-green mullions',(.22,.39,.38),.65,.32)
edge=mat('Weathered silver edge',(.42,.55,.51),.6,.34)
dark=mat('Recessed mechanical louvers',(.065,.13,.14),.35,.63)
roof=mat('Roof paving',(.37,.41,.38),.1,.8)
gold=mat('Bronze details',(.52,.38,.16),.72,.31)
soil=mat('Planter soil',(.11,.15,.075),0,.96)
leaves=[mat('Garden foliage '+str(i),c,0,.9) for i,c in enumerate([(.17,.28,.12),(.27,.37,.15),(.34,.43,.22)])]
glasses=[mat('Curtain glass '+str(i),(.075+i*.004,.28+i*.008,.30+i*.009),.35,.25+i*.008) for i in range(9)]
warm=mat('Occupied interior',(.36,.32,.20),.15,.45)
def poly(name,vs,faces):
 v,f=meshes[name];offset=len(v);v.extend(vs);f.extend(tuple(offset+j for j in face) for face in faces)
def box(name,x,y,z,w,d,h):
 v=[(x+sx*w/2,y+sy*d/2,z+sz*h/2)for sx,sy,sz in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
 poly(name,v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
def profile(w,d,b=1):return[(-w/2+b,-d/2),(w/2-b,-d/2),(w/2,-d/2+b),(w/2,d/2-b),(w/2-b,d/2),(-w/2+b,d/2),(-w/2,d/2-b),(-w/2,-d/2+b)]
def taper(name,z,h,w0,w1,d0=None,d1=None,b=.8):
 p0=profile(w0,d0 or w0,b);p1=profile(w1,d1 or w1,b);v=[(x,y,z)for x,y in p0]+[(x,y,z+h)for x,y in p1];poly(name,v,[tuple(range(7,-1,-1)),tuple(range(8,16))]+[(i,(i+1)%8,(i+1)%8+8,i+8)for i in range(8)])
def oriented_quad(name,points,side):
 a=side*math.pi/2;c,s=math.cos(a),math.sin(a);poly(name,[(x*c-y*s,x*s+y*c,z)for x,y,z in points],[(0,1,2,3)])
def facade(z,h,w0,w1,rows,cols,side):
 def width(t):return (w0+(w1-w0)*t)/2
 for row in range(rows):
  t0=(row+.08)/rows;t1=(row+.88)/rows;z0=z+h*t0;z1=z+h*t1;v0=width(t0);v1=width(t1)
  for col in range(cols):
   u0=-1+2*(col+.08)/cols;u1=-1+2*(col+.92)/cols
   color=warm if random.random()<.025 else random.choice(glasses)
   oriented_quad(color,[(u0*(v0-1.2),v0+.045,z0),(u1*(v0-1.2),v0+.045,z0),(u1*(v1-1.2),v1+.045,z1),(u0*(v1-1.2),v1+.045,z1)],side)
  # continuous floor transoms, not a printed grid
  t=(row+.97)/rows;v=width(t);zz=z+h*t
  oriented_quad(edge,[(-v+1,v+.09,zz-.09),(v-1,v+.09,zz-.09),(v-1,v+.09,zz+.09),(-v+1,v+.09,zz+.09)],side)
 for col in range(cols+1):
  u=-1+2*col/cols;v0=width(0);v1=width(1)
  oriented_quad(frame,[(u*(v0-1.2)-.10,v0+.10,z),(u*(v0-1.2)+.10,v0+.10,z),(u*(v1-1.2)+.10,v1+.10,z+h),(u*(v1-1.2)-.10,v1+.10,z+h)],side)
def cyl(name,x,y,z,r,h,n=16,r2=None):
 r2=r if r2 is None else r2;v=[(x+math.cos(i*math.tau/n)*rr,y+math.sin(i*math.tau/n)*rr,zz)for rr,zz in [(r,z),(r2,z+h)]for i in range(n)];poly(name,v,[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)])
def ring(name,x,y,z,r,t,side=0):
 # Decorative circular motifs on each facade; y is the front-face depth.
 for i in range(32):
  a,b=i*math.tau/32,(i+1)*math.tau/32
  oriented_quad(name,[(x+math.cos(a)*(r-t),y,z+math.sin(a)*(r-t)),(x+math.cos(a)*r,y,z+math.sin(a)*r),(x+math.cos(b)*r,y,z+math.sin(b)*r),(x+math.cos(b)*(r-t),y,z+math.sin(b)*(r-t))],side)
# Public podium: chamfered stone base, layered retail frontage and colonnade.
taper(stone,0,2,116,116,90,90,3)
taper(glasses[5],2,23,104,104,80,80,2)
for z in [2,9,17,25]:taper(stone,z,.65,107,107,83,83,2)
for side in range(4):
 for k in range(-9,10):
  if side%2==0:box(stone,k*5.2,40.4,13,.55,.8,22)
  else:box(stone,52.4,k*4.0,13,.8,.55,22)
# All four elevations, doors, vertical frames, and entrance porticoes.
for sign in [-1,1]:
 for x in range(-45,46,5):box(frame,x,sign*40.15,13,.22,.30,22)
 for y in range(-35,36,5):box(frame,sign*52.15,y,13,.3,.22,22)
 box(edge,0,sign*46,8.5,26,12,.6)
 for x in [-11,11]:box(stone,x,sign*49,4.2,.8,.8,8.4)
 for x in [-6,-2,2,6]:box(glasses[7],x,sign*40.4,4,3.7,.2,7.2)
# Roof terraces with original geometric planting, skylights, ventilation and paving seams.
taper(roof,25.7,.5,103,103,79,79,2)
for x in [-42,42]:
 for y in [-28,-10,10,28]:
  box(stone,x,y,26.8,6,8,1.2);box(soil,x,y,27.45,5.6,7.6,.15)
  for k in range(6):cyl(leaves[k%3],x+random.uniform(-2,2),y+random.uniform(-3,3),27.5,random.uniform(.7,1.4),random.uniform(.9,1.8),8,.45)
for x in [-31,31]:
 for y in [-23,23]:
  taper(glasses[6],26.4,2,12,9,10,7,1)
  box(edge,x,y,27,9,6,.5)
for y in [-32,32]:
 for x in [-22,-12,12,22]:box(dark,x,y,27.5,6,4,2)
# Lower tapered tower and setback decks.
taper(dark,26,7,62,62,b=2)
taper(glasses[3],33,61,57,46,b=2)
for side in range(4):facade(33,61,57,46,14,12,side)
taper(edge,94,1.4,49,49,b=1.5)
# Eight outward-sloping modules, with eight storeys each and recessed transfer floors.
for section in range(8):
 z=98+section*41
 taper(dark,z,3,41,41,b=1.2)
 taper(glasses[4],z+3,36.3,42,50,b=1.3)
 for side in range(4):facade(z+3,36.3,42,50,8,12,side)
 taper(frame,z+39.3,.5,51.4,51.4,b=1.5)
 taper(edge,z+39.8,.45,51.8,51.8,b=1.5)
 # Corner fins make the tier silhouette legible even at panorama scale.
 for x in [-1,1]:
  for y in [-1,1]:box(frame,x*24.7,y*24.7,z+37.5,.8,.8,5.5)
 if section in [0,3,6]:
  for side in range(4):ring(gold,0,25.18,z+20,3.2,.6,side);ring(frame,0,25.2,z+20,3.8,.3,side)
# Crown, observation levels and slender spire.
taper(dark,426,4,40,40,b=1)
taper(glasses[6],430,19,33,28,b=1)
for side in range(4):facade(430,19,33,28,4,8,side)
taper(edge,449,1,30,30,b=1)
taper(glasses[4],450,14,20,16,b=.8)
for side in range(4):facade(450,14,20,16,3,5,side)
taper(frame,464,6,12,10,b=.5)
cyl(edge,0,0,470,2.0,28,16,.8);cyl(dark,0,0,498,.65,10,12,.3)
# Consolidated meshes: export costs depend on material families rather than pane count.
for name,(verts,faces) in meshes.items():
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.data.materials.append(materials[name])
# Correct outward normals for physically lit, opaque PBR materials.
for ob in list(bpy.context.scene.objects):
 bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');ob.select_set(False)
bpy.ops.export_scene.gltf(filepath=str(OUT/'taipei101-v1.glb'),export_format='GLB',export_apply=True,export_yup=True)
report={'name':'Taipei 101 art reconstruction','version':'1.0.0','author':'TPEncore original procedural asset','source':'tools/art/build_taipei101.py','height_metres':508,'note':'Artistic reconstruction; not a surveyed architectural model. No external purchased model or image used.','meshes':len(meshes),'vertices':sum(len(v) for v,f in meshes.values()),'faces':sum(len(f) for v,f in meshes.values()),'bytes':(OUT/'taipei101-v1.glb').stat().st_size}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n');print('ART_ASSET',json.dumps(report))
