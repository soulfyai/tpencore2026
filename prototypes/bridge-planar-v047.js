// Small deterministic planar operations shared by junction cutting and paving.
// All polygons use native X/Z coordinates, counter-clockwise with interior left.
const EPS=1e-8;
export const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
export function area(p){return p.reduce((n,a,i)=>{const b=p[(i+1)%p.length];return n+a[0]*b[1]-b[0]*a[1];},0)/2;}
export function ccw(p){const q=p.filter((v,i)=>Math.hypot(v[0]-p[(i+p.length-1)%p.length][0],v[1]-p[(i+p.length-1)%p.length][1])>1e-9);return area(q)<0?[...q].reverse():q;}
export function pointIn(p,poly,boundary=true){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i];if(Math.abs(cross(a,b,p))<EPS&&p[0]>=Math.min(a[0],b[0])-EPS&&p[0]<=Math.max(a[0],b[0])+EPS&&p[1]>=Math.min(a[1],b[1])-EPS&&p[1]<=Math.max(a[1],b[1])+EPS)return boundary;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function clipHalf(vertices,a,b,keepInside,position){if(!vertices.length)return [];const out=[];for(let i=0;i<vertices.length;i++){const p=vertices[i],q=vertices[(i+1)%vertices.length],dp=cross(a,b,position(p)),dq=cross(a,b,position(q)),ip=keepInside?dp>=-EPS:dp< -EPS,iq=keepInside?dq>=-EPS:dq< -EPS;if(ip)out.push(p);if(ip!==iq){const t=dp/(dp-dq);out.push(p.map((v,k)=>v+(q[k]-v)*t));}}return out;}
export function intersectConvex(poly,clip){let q=poly;for(let i=0;i<clip.length&&q.length;i++)q=clipHalf(q,clip[i],clip[(i+1)%clip.length],true,p=>p);return q;}
export function subtractConvex(vertices,clip,position=v=>[v[0],v[2]]){let inside=vertices;const outside=[];for(let i=0;i<clip.length&&inside.length;i++){const a=clip[i],b=clip[(i+1)%clip.length],out=clipHalf(inside,a,b,false,position);if(out.length>=3)outside.push(out);inside=clipHalf(inside,a,b,true,position);}return outside;}
