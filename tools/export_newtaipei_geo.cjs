const topo=require('topojson-client');const t=require('./node_modules/taiwan-atlas/towns-10t.json');
const lon0=121.56151096043834,lat0=25.085336082624437,KX=Math.cos(lat0*Math.PI/180)*111.32/0.135,KZ=110.57/0.135;
const pr=([lon,lat])=>[+((lon-lon0)*KX).toFixed(2),+(-(lat-lat0)*KZ).toFixed(2)];
function simplify(pts,eps){if(pts.length<3)return pts;const [a,b]=[pts[0],pts[pts.length-1]];let dm=0,id=0;
 for(let i=1;i<pts.length-1;i++){const p=pts[i],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,d=Math.abs(dy*p[0]-dx*p[1]+b[0]*a[1]-b[1]*a[0])/L;if(d>dm){dm=d;id=i;}}
 if(dm>eps)return simplify(pts.slice(0,id+1),eps).slice(0,-1).concat(simplify(pts.slice(id),eps));return [a,b];}
function sring(r,eps){let far=0,fd=0;r.forEach((p,i)=>{const d=Math.hypot(p[0]-r[0][0],p[1]-r[0][1]);if(d>fd){fd=d;far=i;}});
 return simplify(r.slice(0,far+1),eps).slice(0,-1).concat(simplify(r.slice(far),eps).slice(0,-1)).map(([x,z])=>[+x.toFixed(1),+z.toFixed(1)]);}
const area=r=>Math.abs(r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2);
const out={districts:{},outer:null};
for(const f of topo.feature(t,t.objects.towns).features){if(f.properties.COUNTYNAME!=='新北市')continue;
 const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
 out.districts[f.properties.TOWNNAME.replace(/區$/,'')]=polys.map(p=>sring(p[0].map(pr),0.6)).filter(r=>area(r)>6);}
const cf=topo.feature(t,t.objects.counties).features.find(f=>f.properties.COUNTYNAME==='新北市');
const cp=cf.geometry.type==='Polygon'?[cf.geometry.coordinates]:cf.geometry.coordinates;
let best=null;for(const p of cp){const r=p[0].map(pr);if(!best||area(r)>area(best.r))best={r,holes:p.slice(1).map(h=>h.map(pr))};}
out.outer=sring(best.r,0.6);out.holes=best.holes.map(h=>sring(h,0.6)).filter(h=>area(h)>20);
{const kf=topo.feature(t,t.objects.counties).features.find(f=>f.properties.COUNTYNAME==='基隆市');const kp=kf.geometry.type==='Polygon'?[kf.geometry.coordinates]:kf.geometry.coordinates;
 out.keelung=kp.map(p=>sring(p[0].map(pr),0.6)).filter(r=>area(r)>6);}
let n=0;for(const k in out.districts)n+=out.districts[k].reduce((s,r)=>s+r.length,0);
let mnx=1e9,mxx=-1e9,mnz=1e9,mxz=-1e9;out.outer.forEach(([x,z])=>{mnx=Math.min(mnx,x);mxx=Math.max(mxx,x);mnz=Math.min(mnz,z);mxz=Math.max(mxz,z);});
console.error('districts',Object.keys(out.districts).length,'pts',n,'outer',out.outer.length,'holes',out.holes.map(h=>h.length),'bbox',mnx,mxx,mnz,mxz);
console.log(JSON.stringify(out));
