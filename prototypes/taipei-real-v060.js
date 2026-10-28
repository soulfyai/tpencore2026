/*!
 * 台北城市島 Taipei Island — 3D 城市場景引擎
 * 依台北市十二行政區實際邊界、河道與地標程序生成，可嵌入任何網頁容器。
 * 相依：three@0.160.0（與正式網站相同版本）
 * tpencore2026 預覽 v0.6.0：臺北市擬真城市＋政策園區
 */
import * as T3 from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import DISTRICTS from './taipei-real-v060-districts.js';

const THREE = Object.assign({}, T3, { OrbitControls, Sky, RoundedBoxGeometry, EffectComposer, RenderPass, ShaderPass, SSAOPass, UnrealBloomPass, OutputPass });

const DEFAULT_TEXT = {
  title: '台北城市島', subtitle: '依十二行政區實際邊界建模・經貿科技之都', loading: '建模中…',
  rotate: '自動旋轉', marks: '地標', night: '夜景', hq: '高畫質', reset: '重置視角',
  hint: '<b>拖曳</b>旋轉 · <b>滾輪／雙指</b>縮放 · <b>右鍵／雙指拖</b>平移 · 點地名飛過去'
};

/**
 * 在指定容器內建立台北城市島場景。
 * @param {HTMLElement} container 掛載容器（需有寬高）
 * @param {object} [opts] 參數，見 README「options」
 * @returns {object} 控制 API
 */
export function createTaipeiIsland(container, opts = {}) {
if (!container) throw new Error('createTaipeiIsland: container is required');
const ui = Object.assign({ brand: true, controls: true, hint: true }, opts.ui === false ? { brand: false, controls: false, hint: false } : opts.ui || {});
const TX = Object.assign({}, DEFAULT_TEXT, opts.text || {});
if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
const root = document.createElement('div');
root.className = 'tpi-root' + (opts.className ? ' ' + opts.className : '');
root.innerHTML = '<div class="tpi-canvas"></div><div class="tpi-pins"></div>' +
  (ui.brand ? '<div class="tpi-brand"><h1>' + TX.title + '</h1><p>' + TX.subtitle + '</p></div>' : '') +
  (ui.controls ? '<div class="tpi-ctrls">' +
    '<button data-tpi="rotate" type="button" aria-pressed="true">' + TX.rotate + '</button>' +
    '<button data-tpi="marks" type="button" aria-pressed="true">' + TX.marks + '</button>' +
    '<button data-tpi="night" type="button" aria-pressed="false">' + TX.night + '</button>' +
    '<button data-tpi="hq" type="button" aria-pressed="true">' + TX.hq + '</button>' +
    '<button data-tpi="reset" type="button">' + TX.reset + '</button></div>' : '') +
  (ui.hint ? '<div class="tpi-hint">' + TX.hint + '</div>' : '') +
  '<div class="tpi-loading">' + TX.loading + '</div>';
container.appendChild(root);
const pinsRoot = root.querySelector('.tpi-pins');
const q = k => root.querySelector('[data-tpi="' + k + '"]') || document.createElement('button');
const CW = () => Math.max(1, root.clientWidth), CH = () => Math.max(1, root.clientHeight);
let raf = 0, disposed = false, ready = false;
// 嵌入模式：不建立自己的畫布、天空、海、燈光與後製，只產生城市群組交給宿主場景（tpencore2026 正式站）
const EMB = !!opts.embed;
/* 行政區邊界：內政部鄉鎮界（taiwan-atlas），經緯度投影為平面，1 單位 ≈ 135 m */
const DIST=opts.districts||DISTRICTS;
const DN=['北投','士林','內湖','中山','大同','松山','南港','信義','大安','中正','萬華','文山'];
const DP={北投:[.55,7.8,1.7],士林:[.25,7.8,1.9],內湖:[-.2,8.8,2.1],中山:[0,7.8,2.5],大同:[.02,6.8,1.8],松山:[0,8.3,2.5],南港:[.15,8.8,1.9],信義:[0,8.3,2.3],大安:[0,8.3,2.5],中正:[.05,7.8,2.3],萬華:[.32,6.8,1.7],文山:[.42,7.8,1.9]};
const W=240,MS=768,S=MS/W,N=361,CELL=W/(N-1),TS=2048;

/* ---------- utils ---------- */
function hash(i,j){let n=Math.imul(i,374761393)+Math.imul(j,668265263);n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return (n>>>0)/4294967295;}
function vn(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,o){let s=0,a=.5,f=1,t=0;for(let i=0;i<(o||4);i++){s+=a*vn(x*f,y*f);t+=a;f*=2.03;a*=.5;}return s/t;}
function ridged(x,y){let s=0,a=.5,f=1;for(let i=0;i<4;i++){s+=a*(1-Math.abs(2*vn(x*f+17,y*f-9)-1));f*=2.1;a*=.5;}return s/.9375;}
let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
const pick=a=>a[Math.floor(rnd()*a.length)];
const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const G=(x,z,cx,cz,sx,sz)=>Math.exp(-((x-cx)**2/(2*sx*sx)+(z-cz)**2/(2*sz*sz)));
const KX=Math.cos(25.0853*Math.PI/180)*111.32/.135,KZ=110.57/.135,geo=(lo,la)=>[(lo-121.56151)*KX,-(la-25.08534)*KZ];

/* ---------- rivers ---------- */
const V=(x,z)=>new THREE.Vector3(x,0,z);
const keelung=new THREE.CatmullRomCurve3([[-82,-27.5],[-75.1,-25.3],[-70.7,-21.8],[-66.6,-20.8],[-62.4,-22.1],[-55.6,-24],[-49,-21],[-43.5,-17],[-39,-12],[-35.6,-6.5],[-33.4,-1.5],[-31.8,3],[-29,7],[-24,7.6],[-18,6.2],[-13,5.2],[-6,5.2],[1,6.2],[5.5,7.8],[7.8,10.5],[7.6,14.4],[6.3,16.7],[7.1,21.5],[7.6,25.5],[11.4,27.1],[16.9,25.8],[19.8,24.4],[23.2,21.1],[25.9,22],[28.8,21.6],[31.5,21.4],[34.7,20.8],[38.2,17.2],[40.8,17.5],[46,17]].map(p=>V(p[0],p[1])));
const jingmei=new THREE.CatmullRomCurve3([[52,82],[47.4,82.2],[38,81],[28.7,79.7],[22,78],[16,76.6],[11,77.2],[6.3,78.1],[0,80.5],[-4.9,82.2],[-9,80.5],[-12.3,78.1],[-17,75],[-21.3,72.4],[-24.5,70.5]].map(p=>V(p[0],p[1])));
const shuangxi=new THREE.CatmullRomCurve3([[8,-25],[4.8,-21.8],[-0.5,-17.5],[-4.1,-15.3],[-10.1,-12],[-15,-10.6],[-19.8,-9.6],[-24.5,-8],[-28.8,-6.3],[-33.2,-3.4]].map(p=>V(p[0],p[1])));
const RIVERS=[{c:keelung,w:3},{c:jingmei,w:2},{c:shuangxi,w:1.2}];

/* ---------- elevation (meters) ---------- */
const PEAKS=[[-10,-70.7,1120,8,8],[-29,-74,1090,8,8],[-20,-86,1000,9,7],[6,-66,720,12,9],[-20,-53,640,4,4],[-15,-65,420,30,20],[17,-35,650,9,8],[20,-15,380,16,9],[5,-24,450,8,6],[-24,1.5,150,4,2.6],[12,51,330,7,4],[47,44,380,10,9],[24,92,420,16,10],[0,100,320,14,6],[-8,70,150,4,3],[-5,57.6,170,4,3],[-23.5,-14.6,70,1.6,1.6],[-50,-56,260,10,10],[38,-6,300,9,8]];
function elevM(x,z){let e=0;for(const p of PEAKS)e+=p[2]*G(x,z,p[0],p[1],p[3],p[4]);
  if(e<1)return 0;const n=fbm(x*.05+3,z*.05+7);e*=.72+.56*n;e+=e*.32*(ridged(x*.11,z*.11)-.5);return Math.max(0,e);}
const MET=50; // meters per vertical unit (≈3.5× exaggeration)

/* ---------- masks ---------- */
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h||w;return c;}
function polys(g,sc,fill){for(const k in DIST){g.fillStyle=fill(k);DIST[k].forEach(r=>{g.beginPath();r.forEach((p,i)=>{const a=(p[0]+W/2)*sc,b=(p[1]+W/2)*sc;i?g.lineTo(a,b):g.moveTo(a,b);});g.closePath();g.fill();});}}
const mc=canvas(MS),mg=mc.getContext('2d');mg.fillStyle='#000';mg.fillRect(0,0,MS,MS);polys(mg,S,()=>'#fff');
mg.strokeStyle='#000';mg.lineCap=mg.lineJoin='round';
RIVERS.forEach(r=>{mg.lineWidth=r.w*S;mg.beginPath();r.c.getPoints(300).forEach((p,i)=>{const a=(p.x+W/2)*S,b=(p.z+W/2)*S;i?mg.lineTo(a,b):mg.moveTo(a,b);});mg.stroke();});
let mask=new Float32Array(MS*MS);{const d=mg.getImageData(0,0,MS,MS).data;for(let i=0;i<MS*MS;i++)mask[i]=d[i*4]/255;}
function blur(src,w,r){const t=new Float32Array(w*w),o=new Float32Array(w*w),k=2*r+1,cl=v=>v<0?0:v>w-1?w-1:v;
  for(let y=0;y<w;y++){let a=0;for(let x=-r;x<=r;x++)a+=src[y*w+cl(x)];for(let x=0;x<w;x++){t[y*w+x]=a/k;a+=src[y*w+cl(x+r+1)]-src[y*w+cl(x-r)];}}
  for(let x=0;x<w;x++){let a=0;for(let y=-r;y<=r;y++)a+=t[cl(y)*w+x];for(let y=0;y<w;y++){o[y*w+x]=a/k;a+=t[cl(y+r+1)*w+x]-t[cl(y-r)*w+x];}}return o;}
const maskW=blur(blur(mask,MS,11),MS,11);mask=blur(blur(mask,MS,3),MS,3);
const bkc=canvas(MS),bkg=bkc.getContext('2d');bkg.fillStyle='#000';bkg.fillRect(0,0,MS,MS);bkg.strokeStyle='#fff';bkg.lineCap=bkg.lineJoin='round';
RIVERS.forEach(r=>{bkg.lineWidth=(r.w+(r.w>2?2.8:1.4))*S;bkg.beginPath();r.c.getPoints(400).forEach((p,i)=>{const a=(p.x+W/2)*S,b=(p.z+W/2)*S;i?bkg.lineTo(a,b):bkg.moveTo(a,b);});bkg.stroke();});
const BK=new Uint8Array(MS*MS);{const d=bkg.getImageData(0,0,MS,MS).data;for(let i=0;i<MS*MS;i++)BK[i]=d[i*4]>127?1:0;}
const bk=(x,z)=>{const i=Math.floor((x+W/2)*S),j=Math.floor((z+W/2)*S);return i<0||j<0||i>=MS||j>=MS?0:BK[j*MS+i];};
function mkW(x,z){const i=Math.round((x+W/2)*S),j=Math.round((z+W/2)*S);return i<0||j<0||i>=MS||j>=MS?0:maskW[j*MS+i];}
function mk(x,z){const fx=(x+W/2)*S-.5,fz=(z+W/2)*S-.5;if(fx<0||fz<0||fx>=MS-1||fz>=MS-1)return 0;
  const i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*MS+i;return (mask[k]*(1-u)+mask[k+1]*u)*(1-v)+(mask[k+MS]*(1-u)+mask[k+MS+1]*u)*v;}
// district id raster
const DR=1024,dc=canvas(DR),dg=dc.getContext('2d');dg.fillStyle='#000';dg.fillRect(0,0,DR,DR);polys(dg,DR/W,k=>`rgb(${(DN.indexOf(k)+1)*20},0,0)`);
const dd=dg.getImageData(0,0,DR,DR).data,DID=new Uint8Array(DR*DR);for(let i=0;i<DR*DR;i++)DID[i]=Math.round(dd[i*4]/20);
const did=(x,z)=>{const i=Math.floor((x+W/2)/W*DR),j=Math.floor((z+W/2)/W*DR);return i<0||j<0||i>=DR||j>=DR?0:DID[j*DR+i];};

/* ---------- elevation grids ---------- */
const EH=new Float32Array(N*N),EL=new Float32Array(N*N),EM=new Float32Array(N*N);
for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-W/2+i*CELL,z=-W/2+j*CELL,k=j*N+i,L=sm(.3,.7,mk(x,z)),e=L>0?elevM(x,z)*sm(.45,.93,mkW(x,z)):0;
  EL[k]=L;EM[k]=e*L;EH[k]=-2.6+L*3.8+L*L*e/MET;}
const SL=new Float32Array(N*N),HS=new Float32Array(N*N),AO=new Float32Array(N*N);
{const blurred=blur(blur(EH,N,4),N,4),ld=new THREE.Vector3(.55,.75,.38).normalize();
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=j*N+i,a=EH[j*N+Math.max(0,i-1)],b=EH[j*N+Math.min(N-1,i+1)],c=EH[Math.max(0,j-1)*N+i],d=EH[Math.min(N-1,j+1)*N+i];
  const gx=(b-a)/(2*CELL),gz=(d-c)/(2*CELL);SL[k]=Math.hypot(gx,gz);const nx=-gx,ny=1,nz=-gz,nl=Math.hypot(nx,ny,nz);
  HS[k]=Math.max(0,(nx*ld.x+ny*ld.y+nz*ld.z)/nl);AO[k]=Math.min(1.08,Math.max(.62,1-(blurred[k]-EH[k])*.22));}}
function gs(A,x,z){const fx=(x+W/2)/CELL,fz=(z+W/2)/CELL;if(fx<0||fz<0||fx>=N-1||fz>=N-1)return A[0];
  const i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*N+i;return (A[k]*(1-u)+A[k+1]*u)*(1-v)+(A[k+N]*(1-u)+A[k+N+1]*u)*v;}
const Hh=(x,z)=>gs(EH,x,z);

/* ---------- zones & land use ---------- */
const Z=(n,lo,la,r,kind,dx,dz)=>{const [x,z]=geo(lo,la);return {n,x:x+(dx||0),z:z+(dz||0),r,kind};};
const ZONES=[Z('大安森林公園',121.5355,25.03,3.8,'park'),Z('中正紀念堂',121.5218,25.0346,5.4,'plaza'),Z('國父紀念館',121.5603,25.0396,3.9,'plaza'),
 Z('台北大巨蛋',121.5606,25.0438,3.7,'site'),Z('台北101',121.5645,25.034,3.7,'site'),Z('台北市立動物園',121.581,24.9985,4,'park'),Z('花博公園',121.5226,25.0705,2.2,'park',1,2),
 Z('美麗華',121.5576,25.0833,3.6,'site'),Z('兒童新樂園',121.5146,25.0971,2.9,'site'),Z('總統府',121.5119,25.04,3.5,'site'),
 Z('台北車站',121.517,25.0478,3.9,'site'),Z('新光摩天大樓',121.515,25.046,2.6,'site'),Z('台北小巨蛋',121.5497,25.0516,3.1,'site'),
 Z('龍山寺',121.4999,25.0372,2.5,'site'),Z('青年公園',121.507,25.023,2.6,'park'),Z('關渡自然公園',121.473,25.118,3.4,'park'),Z('社子島濕地',121.47,25.108,2.8,'park'),
 Z('圓山大飯店',121.5263,25.0786,4.3,'site',0,-2),Z('南港展覽館',121.6165,25.0565,5.2,'site'),Z('國立臺灣大學',121.5375,25.0173,9.5,'campus'),
 Z('陶朱隱園',121.5676,25.0389,2,'site')];
const ZM={};ZONES.forEach(z=>ZM[z.n]=z);
const zoneAt=(x,z)=>ZONES.find(o=>(x-o.x)**2+(z-o.z)**2<o.r*o.r);
const AP={x:-7.85,z:13.8,a:.17};AP.c=Math.cos(AP.a);AP.s=Math.sin(AP.a);
const apLocal=(x,z)=>{const dx=x-AP.x,dz=z-AP.z;return [dx*AP.c+dz*AP.s,-dx*AP.s+dz*AP.c];};
const airport=(x,z)=>{const [u,v]=apLocal(x,z);return Math.abs(u)<12.2&&v>-3.8&&v<5;};

/* ---------- policy campuses (tpencore2026): one campus per policy theme, placed in a fitting district ---------- */
const POL=Array.isArray(opts.policies)?opts.policies:[];
const PCOL=(()=>{const h=(opts.cityColor||'#1F4FB8').replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];})();
const HOME=[[/AI|產業|科技|數位/,'北投'],[/交通|捷運/,'中正'],[/居住|住宅|都更/,'萬華'],[/運動|體育|賽事/,'松山'],[/教育|午餐/,'文山'],[/銀髮|長照|社福|勞動/,'中山'],
 [/育兒|托育/,'大安'],[/青年/,'大同'],[/無菸|食安|衛生|醫/,'內湖'],[/環保/,'士林'],[/文化|觀光/,'大同'],[/治安|消防/,'中正'],[/工務|水利/,'南港'],[/市政|效能/,'信義']];
{const cent=k=>{const r=DIST[k].reduce((a,b)=>b.length>a.length?b:a);let A2=0,cx=0,cz=0;for(let i=0;i<r.length;i++){const p=r[i],q=r[(i+1)%r.length],c=p[0]*q[1]-q[0]*p[1];A2+=c;cx+=(p[0]+q[0])*c;cz+=(p[1]+q[1])*c;}return [cx/3/A2,cz/3/A2];};
 const used={};
 POL.forEach((t,i)=>{const key=(t.area||'')+t.name;let home=(HOME.find(([re])=>re.test(key))||[])[1];
  if(!home||(used[home]||0)>=2)home=DN.slice().sort((a,b)=>(used[a]||0)-(used[b]||0)||DN.indexOf(a)-DN.indexOf(b))[0];
  used[home]=(used[home]||0)+1;
  const [cx,cz]=cent(home),R=opts.campusRadius||3.3;let R2=R;
  // 先在指定行政區找空地；放不下（例如中正區被大型地標占滿）時，改放最靠近該區中心的其他行政區
  const search=strict=>{let best=null,bs=1e9;const hid=DN.indexOf(home)+1;
   for(let z=-W/2;z<W/2;z+=1.2)for(let x=-W/2;x<W/2;x+=1.2){const id=did(x,z);if(!id||(strict&&id!==hid)||landUse(x,z).t!=='urban')continue;
    let ok=true;for(let a=0;a<12&&ok;a++){const an=a/12*6.2832;for(const rr of [R2,R2*.55]){const px=x+Math.cos(an)*rr,pz=z+Math.sin(an)*rr;if(did(px,pz)!==id||landUse(px,pz).t!=='urban'){ok=false;break;}}}
    if(!ok||ZONES.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+R2+(o.kind==='policy'?3:1.2)))continue;
    const sc=Math.hypot(x-cx,z-cz)+hash(i*31+Math.round(x*3),Math.round(z*3))*2;if(sc<bs){bs=sc;best=[x,z,DN[id-1]];}}return best;};
  let best=null,RR=R;for(const f of [1,.85,.72,.6]){RR=R*f;R2=RR;best=search(true)||search(false);if(best)break;}
  if(best)ZONES.push({n:'P:'+t.id,x:best[0],z:best[1],r:RR,kind:'policy',theme:t,home:best[2]});});}
{const LM=ZONES.filter(z=>z.kind!=='park');LM.forEach(z=>{z.x0=z.x;z.z0=z.z;});
 for(let it=0;it<160;it++){
  for(let i=0;i<LM.length;i++)for(let j=i+1;j<LM.length;j++){const a=LM[i],b=LM[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||.01,m=a.r+b.r+.5;if(d<m){const k=(m-d)/2/d;a.x-=dx*k;a.z-=dz*k;b.x+=dx*k;b.z+=dz*k;}}
  LM.forEach(a=>{let wx=0,wz=0;for(let k=0;k<16;k++){const an=k/16*6.2832;for(const rr of [a.r,a.r*.6]){const px=a.x+Math.cos(an)*rr,pz=a.z+Math.sin(an)*rr;if(mk(px,pz)<.82||bk(px,pz)||airport(px,pz)){wx+=Math.cos(an);wz+=Math.sin(an);}}}
   if(wx||wz){const l=Math.hypot(wx,wz);a.x-=wx/l*.3;a.z-=wz/l*.3;}a.x+=(a.x0-a.x)*.015;a.z+=(a.z0-a.z)*.015;});}}
const field=(x,z,d)=>(d===1&&x<-52&&z>-64)||(d===2&&x<-44&&z>-14&&z<5);
function landUse(x,z){const L=gs(EL,x,z),e=gs(EM,x,z),sl=gs(SL,x,z),d=did(x,z);
  if(L<.5)return {t:'sea',L,e,sl,d};if(airport(x,z))return {t:'air',L,e,sl,d};
  const zo=zoneAt(x,z);if(zo&&L>.85)return {t:zo.kind,L,e,sl,d,zo};
  if(L>.5&&e<70&&bk(x,z))return {t:'bank',L,e,sl,d};
  if(d&&L>.9&&e<95&&sl<.5)return {t:'urban',L,e,sl,d};
  if(L<.9&&e<30)return {t:'bank',L,e,sl,d};
  return {t:'wild',L,e,sl,d};}
function roadAt(x,z,d){const p=DP[DN[d-1]];if(!p)return 0;const c=Math.cos(p[0]),s=Math.sin(p[0]),B=p[1];
  const u=x*c+z*s,v=-x*s+z*c,iu=Math.floor(u/B),iv=Math.floor(v/B),mu=u-iu*B,mv=v-iv*B;
  const wu=(iu%3===0)?1.05:.55,wv=(iv%3===0)?1.05:.55;
  if(mu<wu&&mv<wv)return wu>1||wv>1?2:1;
  if(mu<wu){if((mv<wv+.3||mv>B-.3)&&(Math.floor(u*9)&1))return 3;if(wu>1&&Math.abs(mu-wu/2)<.04&&(mv%1.1)<.55)return 3;return wu>1?2:1;}
  if(mv<wv){if((mu<wu+.3||mu>B-.3)&&(Math.floor(v*9)&1))return 3;if(wv>1&&Math.abs(mv-wv/2)<.04&&(mu%1.1)<.55)return 3;return wv>1?2:1;}
  if(mu<wu+.14||mv<wv+.14)return -1;return 0;}

/* ---------- three ---------- */
const app=root.querySelector('.tpi-canvas');
const renderer=EMB?opts.renderer:new THREE.WebGLRenderer({antialias:true,alpha:true});
if(!EMB){renderer.setPixelRatio(Math.min(devicePixelRatio,opts.maxPixelRatio||2));renderer.setSize(CW(),CH());
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.78;app.appendChild(renderer.domElement);}
const MOBILE=Math.min(innerWidth,innerHeight)<600;
const scene=new THREE.Scene();const DAYFOG=new THREE.Color('#c9d8e4'),NIGHTFOG=new THREE.Color('#1b2a52');
scene.fog=new THREE.Fog(DAYFOG,480,1500);
const camera=new THREE.PerspectiveCamera(40,CW()/CH(),2,3000);
const controls=new THREE.OrbitControls(camera,EMB?document.createElement('div'):renderer.domElement);
Object.assign(controls,{enableDamping:true,dampingFactor:.07,maxPolarAngle:1.38,minDistance:10,maxDistance:560,autoRotate:true,autoRotateSpeed:.35,zoomSpeed:.9});
function homeView(){const f=CW()/CH()<.8?1.25:1;return {pos:new THREE.Vector3(-18*f,175*f,232*f),tgt:new THREE.Vector3(0,0,4)};}
{const h=homeView();camera.position.copy(h.pos);controls.target.copy(h.tgt);}
const hemi=new THREE.HemisphereLight('#dfe9f5','#5d6650',.3*Math.PI);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff0d6',2.3*Math.PI);sun.position.set(110,150,75);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-130,right:130,top:130,bottom:-130,near:10,far:500});
const SM=MOBILE?2048:4096;sun.shadow.mapSize.set(SM,SM);sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;scene.add(sun);
const sky=new THREE.Sky();sky.scale.setScalar(2400);{const u=sky.material.uniforms;u.turbidity.value=4.5;u.rayleigh.value=1.25;u.mieCoefficient.value=.004;u.mieDirectionalG.value=.82;u.sunPosition.value.copy(sun.position).normalize();}scene.add(sky);
let envTex=null;if(!EMB){const pm=new THREE.PMREMGenerator(renderer),es=new THREE.Scene(),s2=new THREE.Sky();s2.scale.setScalar(900);Object.keys(sky.material.uniforms).forEach(k=>{const v=sky.material.uniforms[k].value;s2.material.uniforms[k].value=v&&v.clone?v.clone():v;});es.add(s2);envTex=pm.fromScene(es,0,1,2000).texture;scene.environment=envTex;}
const nightMats=[];const nightable=(mat,d,n)=>{nightMats.push({mat,d,n});mat.emissiveIntensity=d;return mat;};

// water with procedural ripple normals
const wc=canvas(256),wg=wc.getContext('2d'),wi=wg.createImageData(256,256);
{const hh=(i,j)=>fbm(i/22,j/22,3)+.5*fbm(i/7+40,j/7,2);for(let j=0;j<256;j++)for(let i=0;i<256;i++){const k=(j*256+i)*4,
  dx=hh((i+1)&255,j)-hh((i+255)&255,j),dy=hh(i,(j+1)&255)-hh(i,(j+255)&255);
  wi.data[k]=128+dx*300;wi.data[k+1]=128+dy*300;wi.data[k+2]=255;wi.data[k+3]=255;}wg.putImageData(wi,0,0);}
const wn=new THREE.CanvasTexture(wc);wn.wrapS=wn.wrapT=THREE.RepeatWrapping;wn.repeat.set(70,70);
const floorM=new THREE.MeshStandardMaterial({color:'#173f57',roughness:1});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000).rotateX(-Math.PI/2),floorM);floor.position.y=-3.2;scene.add(floor);
const waterMat=new THREE.MeshStandardMaterial({color:'#2d6a86',roughness:.05,metalness:.05,transparent:true,opacity:.9,normalMap:wn,normalScale:new THREE.Vector2(.22,.22)});
const water=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000).rotateX(-Math.PI/2),waterMat);water.receiveShadow=true;scene.add(water);

let riverBoats=[],ships=[],clouds=new THREE.Group(),pins=[],fly=null,wheels=[],flyer=new THREE.Group(),beacons=null,lander=null,flag=null,bulbs=[],walkers=[],walkB=null,walkH=null,carParts=null,carGlow=[],carData=[],carB=null,carC=null;
const m4=new THREE.Matrix4(),col=new THREE.Color(),YAX=new THREE.Vector3(0,1,0),qq=new THREE.Quaternion(),pv=new THREE.Vector3(),sv=new THREE.Vector3();

function build(){
/* ---------- terrain texture ---------- */
const tc=canvas(TS),ec=canvas(TS),tg=tc.getContext('2d'),eg=ec.getContext('2d'),img=tg.createImageData(TS,TS),eimg=eg.createImageData(TS,TS),D=img.data,E=eimg.data;
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const C={deep:[34,82,104],shal:[96,142,140],sand:[208,196,160],rock:[128,120,104],g1:[88,134,62],g2:[50,100,48],g3:[62,120,58],high:[48,92,52],meadow:[168,176,96],
 lot:[150,147,140],lot2:[138,135,128],road:[78,80,84],art:[64,66,70],curb:[196,194,188],park:[96,146,68],path:[214,200,168],plaza:[224,220,208],site:[206,202,192],tar:[128,132,136],run:[64,66,72]};
const FIELD=[[132,170,72],[160,182,88],[110,150,62],[176,160,104],[98,140,120],[146,176,80]];
const U=new Uint8Array(TS*TS);
for(let j=0;j<TS;j++){const z=-W/2+(j+.5)/TS*W;for(let i=0;i<TS;i++){const x=-W/2+(i+.5)/TS*W,k=(j*TS+i)*4,lu=landUse(x,z),n=vn(x*1.3,z*1.3);let c,e=0,shade=true;
  switch(lu.t){
  case 'sea':c=mix(C.shal,C.deep,sm(.5,.08,lu.L));shade=false;break;
  case 'air':{const [u,v]=apLocal(x,z),au=Math.abs(u);
    c=(Math.floor(u*1.4)&1)?[112,164,80]:[124,174,88];
    if((au<10.3&&Math.abs(v)<.6)||(au<10.5&&Math.abs(v-1.45)<.22)||((Math.abs(au-9.6)<.2||Math.abs(au-3.2)<.2)&&v>.5&&v<1.5))c=[90,92,96];
    else if(u>-7.6&&u<5.2&&v>1.6&&v<3.85)c=[176,178,180];
    else if(u>-6.8&&u<6.6&&v>=3.85){c=C.site;if(v>4.75)c=[160,190,120];}
    else if(v<-1.7&&u>4&&u<11.6)c=C.tar;
    break;}
  case 'park':{c=mix(C.park,C.g1,n*.6);const pth=Math.abs(Math.sin((x-lu.zo.x)*1.7+(z-lu.zo.z)*.9)*Math.cos((z-lu.zo.z)*1.3));if(pth<.05)c=C.path;break;}
  case 'plaza':{const r=Math.hypot(x-lu.zo.x,z-lu.zo.z)/lu.zo.r;c=r<.62?C.plaza:mix(C.park,C.g1,n*.5);break;}
  case 'policy':{c=[111,159,80];break;}
  case 'site':c=mix(C.site,C.plaza,n);break;
  case 'field':{const fu=x*.88+z*.47,fv=-x*.47+z*.88,cu=Math.floor(fu/2.1),cv=Math.floor(fv/1.5);c=FIELD[Math.floor(hash(cu,cv)*FIELD.length)];
    if(fu-cu*2.1<.12||fv-cv*1.5<.1)c=[120,112,86];break;}
  case 'urban':{c=mix(C.lot,C.lot2,n);U[(j*TS+i)]=255;break;}
  case 'bank':c=lu.L<.78?mix(C.sand,C.park,sm(.66,.78,lu.L)):mix(C.park,[150,190,110],n*.5);if(lu.L>.72&&Math.abs(Math.sin(x*.9+z*.4))<.04)c=C.path;break;
  case 'campus':{c=mix(C.park,C.g1,n*.4);const lx=x-lu.zo.x,lz=z-lu.zo.z;if(Math.abs(lz)<.55&&lx>-8&&lx<4)c=C.path;else if(Math.abs(lx+1.5)<.25||Math.abs(lz-4.2)<.22||Math.abs(lz+4.2)<.22)c=mix(C.path,c,.25);break;}
  default:{const hh=Math.min(1,lu.e/900),nn=fbm(x*.22,z*.22,3);c=mix(mix(C.g1,C.g2,nn),C.high,hh);
    if(lu.e<40&&lu.L>.85)c=mix(c,[120,160,80],.35);
    const meadow=0;if(meadow>.3)c=mix(c,C.meadow,Math.min(1,(meadow-.3)*1.6)*(.7+.3*nn));
    if(lu.e>60)c=mix(c,[38,94,44],.5);if(lu.sl>1.1)c=mix(c,C.rock,Math.min(.7,(lu.sl-1.1)*1.2));
    if(lu.L<.85)c=mix(mix(C.sand,C.rock,.4),c,sm(.6,.85,lu.L));}
  }
  // district boundary lines
  if(lu.d&&lu.t!=='sea'){const d2=did(x+.25,z),d3=did(x,z+.25);if((d2&&d2!==lu.d)||(d3&&d3!==lu.d)){c=mix(c,[255,250,230],.55);}}
  let f=1;if(shade){const hs=gs(HS,x,z),ao=gs(AO,x,z);f=(.7+.42*hs)*ao*(.94+.12*n);}
  D[k]=c[0]*f;D[k+1]=c[1]*f;D[k+2]=c[2]*f;D[k+3]=255;E[k]=255*e;E[k+1]=160*e;E[k+2]=70*e;E[k+3]=255;}}
tg.putImageData(img,0,0);eg.putImageData(eimg,0,0);
const tTex=new THREE.CanvasTexture(tc),eTex=new THREE.CanvasTexture(ec);tTex.anisotropy=eTex.anisotropy=8;
const tgeo=new THREE.PlaneGeometry(W,W,N-1,N-1).rotateX(-Math.PI/2),pa=tgeo.attributes.position;
for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);pa.setY(i,gs(EH,x,z));}tgeo.computeVertexNormals();
if(EMB){const ix=tgeo.index.array,keep=[];for(let i=0;i<ix.length;i+=3)if(EL[ix[i]]>.04||EL[ix[i+1]]>.04||EL[ix[i+2]]>.04)keep.push(ix[i],ix[i+1],ix[i+2]);tgeo.setIndex(keep);}
const urbanTex=new THREE.DataTexture(U,TS,TS,THREE.RedFormat,THREE.UnsignedByteType);urbanTex.magFilter=urbanTex.minFilter=THREE.LinearFilter;urbanTex.needsUpdate=true;
const didTex=new THREE.DataTexture(DID,DR,DR,THREE.RedFormat,THREE.UnsignedByteType);didTex.magFilter=didTex.minFilter=THREE.NearestFilter;didTex.needsUpdate=true;
const landMat=nightable(new THREE.MeshStandardMaterial({map:tTex,emissiveMap:eTex,emissive:'#ffffff',roughness:.96}),0,.6);
landMat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{uUrban:{value:urbanTex},uDid:{value:didTex},uW:{value:W},uAng:{value:DN.map(n=>DP[n][0])},uB:{value:DN.map(n=>DP[n][1])}});
 sh.vertexShader='varying vec2 vCity;\n'+sh.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n vCity=position.xz;');
 sh.fragmentShader='uniform sampler2D uUrban,uDid;uniform float uW,uAng[12],uB[12];varying vec2 vCity;float roadGlow=0.;\n'+sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 {float um=texture2D(uUrban,vCity/uW+.5).r;int id=int(texture2D(uDid,vCity/uW+.5).r*255.+.5)-1;
  if(um>.35&&id>=0&&id<12){float a=uAng[id],B=uB[id],c=cos(a),s=sin(a),u=vCity.x*c+vCity.y*s,v=-vCity.x*s+vCity.y*c;
   float iu=floor(u/B),iv=floor(v/B),mu=u-iu*B,mv=v-iv*B,wu=mod(iu,3.)<.5?1.05:.55,wv=mod(iv,3.)<.5?1.05:.55,fw=max(fwidth(u),fwidth(v))*.75;
   float ru=1.-smoothstep(wu-fw,wu+fw,mu),rv=1.-smoothstep(wv-fw,wv+fw,mv),road=max(ru,rv);
   float cu=1.-smoothstep(wu+.13-fw,wu+.13+fw,mu),cv=1.-smoothstep(wv+.13-fw,wv+.13+fw,mv),curb=max(cu,cv)*(1.-road);
   bool art=(ru>rv?wu:wv)>1.;vec3 asph=art?vec3(.105,.11,.12):vec3(.14,.145,.155);
   float paint=0.;
   if(ru>.5&&rv<.5){paint=max(paint,(wu>1.?1.-smoothstep(.022-fw,.022+fw,abs(mu-wu*.5)):0.)*step(fract(v/1.1),.5));
     float near=step(mv,wv+.3)+step(B-.3,mv);paint=max(paint,min(near,1.)*step(.5,fract(u*9.))*step(.06,mu)*step(mu,wu-.06));}
   if(rv>.5&&ru<.5){paint=max(paint,(wv>1.?1.-smoothstep(.022-fw,.022+fw,abs(mv-wv*.5)):0.)*step(fract(u/1.1),.5));
     float near=step(mu,wu+.3)+step(B-.3,mu);paint=max(paint,min(near,1.)*step(.5,fract(v*9.))*step(.06,mv)*step(mv,wv-.06));}
   vec3 col=mix(diffuseColor.rgb,vec3(.62,.61,.58),curb);col=mix(col,asph,road);col=mix(col,vec3(.86,.86,.84),paint*road);
   diffuseColor.rgb=mix(diffuseColor.rgb,col,smoothstep(.35,.6,um));roadGlow=road*(art?1.:.55)*smoothstep(.35,.6,um);}}`).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=emissive*vec3(1.,.62,.3)*roadGlow*.55;');};
landMat.customProgramCacheKey=()=>'tpi-land-roads-v1';
const land=new THREE.Mesh(tgeo,landMat);
land.receiveShadow=true;scene.add(land);

/* ---------- facades ---------- */
function facade(type){const c=canvas(128,256),e=canvas(128,256),g=c.getContext('2d'),h=e.getContext('2d');h.fillStyle='#000';h.fillRect(0,0,128,256);
  const lit=(x,y,w,hh,p,cl)=>{if(rnd()<p){h.fillStyle=cl||(rnd()<.75?'#ffcf86':'#fff0cc');h.fillRect(x,y,w,hh);}};
  const R=(cl,x,y,w,hh)=>{g.fillStyle=cl;g.fillRect(x,y,w,hh);};
  if(type===0){R('#f4f1ea',0,0,128,256);for(let f=0;f<8;f++){const y=f*32;R('#cfc8bb',0,y+27,128,5);R('#e4dfd5',0,y+26,128,1);
    for(let b=0;b<4;b++){const x=b*32;R('#3c4955',x+5,y+7,22,15);lit(x+5,y+7,22,15,.5);g.fillStyle='#b0b7bc';for(let q=0;q<7;q++)g.fillRect(x+4+q*4,y+4,1,21);R('#b0b7bc',x+3,y+4,26,1);R('#b0b7bc',x+3,y+24,26,1);
      if(rnd()<.3)R('#dcdcd6',x+(rnd()<.5?1:25),y+18,6,6);if(rnd()<.15)R(pick(['#6d8fb0','#a35b48','#6e9c6a']),x+4,y+4,24,3);}}}
  else if(type===1){for(let f=0;f<8;f++)for(let b=0;b<4;b++){const x=b*32,y=f*32,t=.9+.12*rnd(),gr=g.createLinearGradient(x,y,x+14,y+32);
      gr.addColorStop(0,`rgb(${Math.min(255,250*t)|0},${Math.min(255,252*t)|0},255)`);gr.addColorStop(1,`rgb(${140*t|0},${150*t|0},${168*t|0})`);g.fillStyle=gr;g.fillRect(x,y,32,32);
      R('#eef3f6',x,y,2,32);R('#d8e0e6',x,y+26,32,6);lit(x+2,y,30,26,.45,rnd()<.6?'#dff0ff':'#ffe2a8');}}
  else if(type===2){R('#efeee8',0,0,128,256);for(let f=0;f<8;f++){const y=f*32;R('#455769',0,y+8,128,17);lit(0,y+8,128,17,.0);
      for(let s=0;s<8;s++){R('#cfd6db',s*16,y+8,2,17);lit(s*16+2,y+8,14,17,.42,'#e8f2ff');}R('#d9d7cf',0,y+25,128,2);}}
  else if(type===3){R('#f1eee7',0,0,128,256);for(let f=0;f<8;f++){const y=f*32;for(let b=0;b<4;b++){const x=b*32;
      if(b%2){R('#cbc4b8',x+2,y+2,28,28);R('#e7e2d8',x+2,y+22,28,2);R('#8a949b',x+2,y+17,28,1);R('#3f4a55',x+8,y+5,14,12);lit(x+8,y+5,14,12,.5);}
      else{R('#3e4955',x+6,y+6,9,18);R('#3e4955',x+17,y+6,9,18);lit(x+6,y+6,9,18,.45);lit(x+17,y+6,9,18,.45);R('#dcd6cc',x+4,y+24,24,2);}}}}
  else if(type===4){R('#c2583c',0,0,128,256);for(let f=0;f<8;f++)R('#efe9de',0,f*32+28,128,3);g.fillStyle='rgba(255,230,210,.18)';for(let y=0;y<256;y+=4)g.fillRect(0,y,128,1);
    for(let f=0;f<8;f++)for(let b=0;b<4;b++){const x=b*32,y=f*32;R('#f1ede4',x+7,y+6,18,19);R('#38424c',x+9,y+8,14,15);R('#f1ede4',x+15,y+8,2,15);lit(x+9,y+8,14,15,.5);}}
  else if(type===6){R('#eee6d6',0,0,128,256);for(let s2=0;s2<8;s2++){R('#fbf7ee',s2*16,0,4,256);}for(let f=0;f<8;f++){R('#d8ccb4',0,f*32+27,128,5);for(let s2=0;s2<8;s2++){R('#3b4a5a',s2*16+6,f*32+4,8,21);lit(s2*16+6,f*32+4,8,21,.45);}}}
  else{R('#e9e4da',0,0,128,256);for(let f=0;f<8;f++){R('#d6d0c4',0,f*32+30,128,2);for(let s=0;s<8;s++){R('#36404a',s*16+5,f*32+3,6,26);lit(s*16+5,f*32+3,6,26,.4);}}}
  const TH=[110,236,120,110,85,110,110][type],W2=c.width,H2=c.height,px=g.getImageData(0,0,W2,H2).data,hm=new Float32Array(W2*H2);
  for(let i=0;i<W2*H2;i++){const l=.3*px[i*4]+.59*px[i*4+1]+.11*px[i*4+2];hm[i]=l<TH?0:1;}
  const rc=canvas(W2,H2),nc=canvas(W2,H2),rg=rc.getContext('2d'),ng=nc.getContext('2d'),ri=rg.createImageData(W2,H2),ni=ng.createImageData(W2,H2);
  const H=(x,y)=>hm[((y+H2)%H2)*W2+((x+W2)%W2)];
  for(let y=0;y<H2;y++)for(let x=0;x<W2;x++){const i=(y*W2+x)*4,w=H(x,y)===0,rv=w?(type===1?14:26):(type===1?150:215)+((x*7+y*13)%17);
    ri.data[i]=ri.data[i+1]=ri.data[i+2]=rv;ri.data[i+3]=255;
    const dx=(H(x+1,y)-H(x-1,y))*1.6,dy=(H(x,y+1)-H(x,y-1))*1.6,l=Math.hypot(dx,dy,1);
    ni.data[i]=(-dx/l*.5+.5)*255;ni.data[i+1]=(dy/l*.5+.5)*255;ni.data[i+2]=(1/l*.5+.5)*255;ni.data[i+3]=255;}
  rg.putImageData(ri,0,0);ng.putImageData(ni,0,0);
  const m=new THREE.CanvasTexture(c),em=new THREE.CanvasTexture(e),rm=new THREE.CanvasTexture(rc),nm=new THREE.CanvasTexture(nc);
  [m,em,rm,nm].forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;});return {m,em,rm,nm};}
const FT=[{fw:2,fh:2.6},{fw:1.6,fh:2.6},{fw:2.4,fh:2.6},{fw:2,fh:2.6},{fw:2,fh:2.4},{fw:1.8,fh:2.6},{fw:1.9,fh:2.6}].map((p,i)=>Object.assign(p,facade(i)));
const FPAL=[['#f3eee2','#e9dccb','#f0d9cf','#dfe6dc','#efe6c8','#d9dde3','#e6d2bb','#cfd6cf','#f2e4e4'],
 ['#8fb6d0','#7fa6b8','#a8c4cc','#9eb0c9','#d6c48e','#b9c9d6','#8ec0bc','#c6ccd4'],['#e8e6e0','#d9d4c8','#cfd5da','#e3d6c3','#d2d9cf'],
 ['#f1ece2','#e2e0d8','#d8cfc2','#eadfce','#d3dadf','#e9dfe4'],['#ffffff','#f3e3d8','#e8d0c0','#f6ede0'],['#f4f0e8','#e0d8c8','#cfc8bc','#d8dde0']];
function patch(mat,fw,fh,ws){mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{uFW:{value:fw},uFH:{value:fh},uWS:{value:ws}});
  sh.vertexShader='uniform float uFW,uFH,uWS;\nvarying float vRoof;\nvarying float vLocalY;\nvarying vec2 vWorldXZ;\n'+sh.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
#ifdef USE_INSTANCING
 vec3 sc=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
 float wd=(abs(normal.x)>0.5?sc.z:sc.x)*uWS;
 float r1=fract(sin(dot(instanceMatrix[3].xz,vec2(12.9898,78.233)))*43758.5453);
 float r2=fract(sin(dot(instanceMatrix[3].xz,vec2(39.346,11.135)))*24634.634);
 vec2 fuv=vec2(uv.x*wd/uFW+floor(r1*4.0)*0.25,uv.y*sc.y/uFH+floor(r2*8.0)*0.125);
#ifdef USE_MAP
 vMapUv=fuv;
#endif
#ifdef USE_EMISSIVEMAP
 vEmissiveMapUv=fuv;
#endif
#ifdef USE_NORMALMAP
 vNormalMapUv=fuv;
#endif
#ifdef USE_ROUGHNESSMAP
 vRoughnessMapUv=fuv;
#endif
 vLocalY=position.y*sc.y;vWorldXZ=instanceMatrix[3].xz;
#else
 vWorldXZ=vec2(0.0);
 vLocalY=1.0;
#endif
 vRoof=step(0.5,abs(normal.y));`);
  sh.fragmentShader='varying float vRoof;\nvarying float vLocalY;\nvarying vec2 vWorldXZ;\n'+sh.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec4 tx=texture2D(map,vMapUv);tx.rgb=mix(tx.rgb,vec3(0.6,0.6,0.58),vRoof);diffuseColor*=tx;
 diffuseColor.rgb*=mix(0.55,1.0,smoothstep(0.0,1.6,vLocalY))*mix(0.94,1.0,smoothstep(0.0,6.0,vLocalY));
#endif`).replace('#include <emissivemap_fragment>',`#ifdef USE_EMISSIVEMAP
 vec2 wcell=floor(vEmissiveMapUv*vec2(4.0,8.0));float wr=fract(sin(dot(wcell,vec2(12.9898,78.233))+dot(floor(vWorldXZ),vec2(3.17,7.31)))*43758.5453);
 totalEmissiveRadiance*=texture2D(emissiveMap,vEmissiveMapUv).rgb*(1.0-vRoof)*step(0.42,wr)*(0.45+0.55*wr);
 totalEmissiveRadiance+=emissive*vec3(1.0,0.72,0.42)*0.9*(1.0-smoothstep(0.16,0.3,vLocalY))*(1.0-vRoof);
#endif`);};
 mat.customProgramCacheKey=()=>'fac160'+fw+'_'+fh+'_'+ws;}

/* ---------- geometries ---------- */
function prism(){const p=[-.5,0,-.5,-.5,0,.5,-.5,1,0, .5,0,.5,.5,0,-.5,.5,1,0, -.5,0,.5,.5,0,.5,.5,1,0, -.5,0,.5,.5,1,0,-.5,1,0, .5,0,-.5,-.5,0,-.5,-.5,1,0, .5,0,-.5,-.5,1,0,.5,1,0];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;}
const GEO={rbox:(THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(1,1,1,1,.022):new THREE.BoxGeometry(1,1,1)).translate(0,.5,0),box:new THREE.BoxGeometry(1,1,1).translate(0,.5,0),oct:new THREE.CylinderGeometry(.5,.5,1,8).rotateY(Math.PI/8).translate(0,.5,0),
 cyl:new THREE.CylinderGeometry(.5,.5,1,22).translate(0,.5,0),gable:prism(),hip:new THREE.ConeGeometry(.7071,1,4,1).rotateY(Math.PI/4).translate(0,.5,0),
 tank:new THREE.CylinderGeometry(.5,.5,1,10).translate(0,.5,0),dome:new THREE.SphereGeometry(.5,24,12,0,Math.PI*2,0,Math.PI/2),
 cone8:new THREE.ConeGeometry(.5,1,8,1).rotateY(Math.PI/8).translate(0,.5,0),bead:new THREE.SphereGeometry(.5,8,6),barrel:new THREE.CylinderGeometry(.5,.5,1,18,1,false,0,Math.PI).rotateZ(Math.PI/2)};
const WS={box:1,oct:3.06,cyl:Math.PI};
const plainM=new THREE.MeshStandardMaterial({roughness:.65,metalness:.05}),metalM=new THREE.MeshStandardMaterial({roughness:.35,metalness:.55});
const beaconM=nightable(new THREE.MeshStandardMaterial({color:'#ff3a2a',emissive:'#ff2a1a'}),.3,2.2),ledM=nightable(new THREE.MeshStandardMaterial({color:'#e3e8ec',emissive:'#d6ecff'}),0,1.8),lampM=nightable(new THREE.MeshStandardMaterial({color:'#fff6d8',emissive:'#fff0b8'}),0,2.6);
const groups={};
function put(g,mt,x,y,z,sx,sy,sz,ry,c){const key=g+'|'+mt;(groups[key]||(groups[key]={g,mt,list:[]})).list.push([x,y,z,sx,sy,sz,ry,c]);}
function flush(){Object.values(groups).forEach(gr=>{let mat;
  if(typeof gr.mt==='number'){const f=FT[gr.mt];mat=nightable(new THREE.MeshStandardMaterial({map:f.m,emissiveMap:f.em,roughnessMap:f.rm,normalMap:f.nm,normalScale:new THREE.Vector2(1.3,1.3),emissive:'#ffffff',roughness:1,metalness:gr.mt===1?.5:.05,envMapIntensity:gr.mt===1?1:.6}),0,.9);patch(mat,f.fw,f.fh,WS[gr.g]||1);}
  else mat=gr.mt==='metal'?metalM:gr.mt==='beacon'?beaconM:gr.mt==='lamp'?lampM:gr.mt==='led'?ledM:plainM;
  const im=new THREE.InstancedMesh(typeof gr.mt==='number'&&gr.g==='box'?GEO.rbox:GEO[gr.g],mat,gr.list.length);
  gr.list.forEach((b,i)=>{qq.setFromAxisAngle(YAX,b[6]);m4.compose(pv.set(b[0],b[1],b[2]),qq,sv.set(b[3],b[4],b[5]));im.setMatrixAt(i,m4);im.setColorAt(i,col.set(b[7]||'#ffffff'));});
  im.castShadow=gr.mt!=='beacon'&&gr.mt!=='lamp'&&gr.mt!=='led';im.receiveShadow=true;scene.add(im);});}

/* ---------- palettes & district character ---------- */
const PAL={
 tile:['#efe6d6','#e4d3bd','#d6c0a4','#c9b08e','#e8ddd0','#d8d4cb','#cbd3cf','#e9d6d0','#d5dbe4','#bfae9a','#ab9a88','#f2ece2','#c6cfc2','#e2cba3','#a4aeab','#d9c6b8','#b8c4ce','#e7d9b8'],
 pastel:['#e3cfc6','#c9d8d0','#e6dcb8','#ccd5e2','#ddd0d8','#efebe2','#d3dcc4','#e4d2bd','#bccdd4','#e2c4b4'],
 vivid:['#b8564a','#c9a24e','#4a6f94','#557f68','#e6e4de','#3a3c42','#9a4a58','#6a6f7a','#c0784a','#4f7f86'],
 glass:['#8fa9bd','#6f8aa0','#a5b8c6','#5a7489','#93a3ad','#b0a48c','#7e9290','#8fb3d1','#6d93b5','#a9c3d3','#557694','#9aa6b1','#b39d74','#78998f','#425a70','#c3ced6','#c9ad7c','#8193a8','#33475b','#9fbfbb','#7c8a9c','#d6dde2','#5c7f7a','#a08a6a'],
 brick:['#ffffff','#f6e6da','#ecd6c4','#f8efe4','#e4c6b4'],
 concrete:['#e6e4de','#d4d1c9','#c4c2bc','#ecebe6','#b9b8b2','#dcd6ca'],
 roof:['#b8503a','#8c4a3a','#5b6b7a','#3e5a7a','#a35a2a','#6f7b64','#476b8a','#9a3f32'],
 shed:['#3f7fc0','#4a9a6a','#d9d9d0','#2f6aa0','#7aa3c2','#5e8f9e','#c9c9c0'],
 tank:['#4d8fd1','#e9eef2','#c9cfd4','#3f74b5','#5d9ad6']};
const PROF={信義:'cbd',松山:'biz',南港:'tech',內湖:'techpark',中山:'mixed',大同:'old',萬華:'old',大安:'res',中正:'res',士林:'res',北投:'sub',文山:'sub'};
const LOTSZ={cbd:[3.6,7],biz:[3.2,6],tech:[3.4,6.4],techpark:[3.8,7],mixed:[2.8,5],old:[2.2,4],res:[2.6,4.6],sub:[2.6,4.4]};
const HOT=[[11,34,4.5,5,4],[-9,27,5,5,2.6],[34,27.5,7.5,4.5,4],[-2,27,3,3,3],[12,32,3.5,5,5],[-33,31,3.5,2.6,2.6],[-26,27,2.5,4,2.5],[11.6,4.4,1.4,7,5],[45,24,2.5,5,4],[-14,34,2,4,2]];
const D101=(x,z)=>{const t=ZM['台北101'];return Math.hypot(x-t.x,z-t.z);},F101=(x,z)=>Math.min(1,(D101(x,z)+3)/17);
const hotH=(x,z)=>HOT.reduce((s,p)=>s+p[2]*G(x,z,p[0],p[1],p[3],p[4]),0);
const extraTrees=[],streetTrees=[],walkPaths=[];
function scaled(o,k){return {at:(a,b)=>o.at(a*k,b*k),P:(g,mt,lx,ly,lz,sx,sy,sz,cl,dr)=>o.P(g,mt,lx*k,ly*k,lz*k,sx*k,sy*k,sz*k,cl,dr)};}
function mkLot(x,z,ry,w,d,yc){const c=Math.cos(ry),s=Math.sin(ry),at=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c];
  let y=1e9;[[-1,-1],[1,-1],[-1,1],[1,1],[0,0]].forEach(([a,b])=>{const [px,pz]=at(a*w/2,b*d/2);y=Math.min(y,Hh(px,pz));});y-=.15;if(yc!==undefined)y=yc;
  const P=(g,mt,lx,ly,lz,sx,sy,sz,cl,dr)=>{const [px,pz]=at(lx,lz);put(g,mt,px,y+ly,pz,sx,sy,sz,ry+(dr||0),cl);};
  return {x,z,ry,w,d,y,at,P};}
function roof(o,top,tw,td,lx,lz,rich){
  if(rnd()<.5){const n=1+(rnd()*2|0);for(let i=0;i<n;i++)o.P('tank','plain',lx+(rnd()-.5)*tw*.6,top,lz+(rnd()-.5)*td*.6,.16,.2,.16,pick(PAL.tank));}
  if(rich&&rnd()<.45){const sw=tw*(.45+rnd()*.4),sd=td*(.45+rnd()*.4),ox=lx+(rnd()-.5)*(tw-sw),oz=lz+(rnd()-.5)*(td-sd);
    o.P('box','plain',ox,top,oz,sw,.14,sd,'#d8d6cf');o.P('gable','plain',ox,top+.14,oz,sw,.1,sd,pick(PAL.shed));}
  else if(rnd()<.3)o.P('box','plain',lx,top,lz,tw*.9,.03,td*.9,pick(['#7fae5e','#6a9f55','#3d4f6a']));}
function crownAt(o,lx,lz,top,tw,td){if(tw<.05)return;const r=rnd(),m=Math.min(tw,td);if(rnd()<.55){const n=1+(rnd()*3|0);for(let i=0;i<n;i++)o.P('box','plain',lx+(rnd()-.5)*tw*.5,top,lz+(rnd()-.5)*td*.5,tw*(.15+rnd()*.12),.1+rnd()*.12,td*(.15+rnd()*.12),pick(['#9a9ea2','#b4b6b6','#8a8f94']));}if(rnd()<.38)o.P('box','led',lx,top-.3,lz,tw*1.04,.07,td*1.04);
  if(r<.2){o.P('cone8','plain',lx,top,lz,m*.9,m*1.2,m*.9,pick(['#c9d4dc','#b8a370','#8fa9bd','#e6e6e6','#6f7f8c','#4e6a62']));return;}
  if(r<.38){o.P('hip','plain',lx,top,lz,tw*.95,m*.6,td*.95,pick(['#2f4d66','#cfd6dc','#6a7a86','#b39d74']));return;}
  if(r<.56){o.P('box','metal',lx,top,lz,tw*.96,.45,td*.96,'#dfe5ea');return;}
  if(r<.74){o.P('cyl','metal',lx,top,lz,m*.6,.3,m*.6,'#e6eaee');o.P('tank','metal',lx,top+.3,lz,.05,1.3,.05,'#eef1f3');o.P('bead','beacon',lx,top+1.6,lz,.13,.13,.13);return;}
  if(r<.86){o.P('box','plain',lx,top,lz,tw*.5,.6,td*.5,pick(PAL.glass));o.P('bead','beacon',lx,top+.65,lz,.11,.11,.11);return;}
  o.P('box','plain',lx,top,lz,tw*.96,.1,td*.96,'#9aa3a8');o.P('cyl','plain',lx,top+.1,lz,m*.75,.04,m*.75,'#3d4248');o.P('cyl','plain',lx,top+.14,lz,m*.35,.01,m*.35,'#d8d8d0');[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b])=>o.P('bead','lamp',lx+a*m*.32,top+.16,lz+b*m*.32,.07,.07,.07));}
function cap(o,lx,lz,top,tw,td,cl,round){o.P(round?'cyl':'box','plain',lx,top-.07,lz,tw*1.05,.09,(round?tw:td)*1.05,cl||'#f3efe6');}
function towerBody(o,lx,lz,tw,td,h,t,cl,y0){const r=rnd(),WH='#eeeae2',GOLD='#bfa264';let top=y0+h;
  if(r<.17){o.P('box',t,lx,y0,lz,tw,h,td,cl);cap(o,lx,lz,top,tw,td);if(rnd()<.5){[-.5,.5].forEach(a=>o.P('box','plain',lx+a*tw,y0,lz+.5*td,.08,h,.08,WH));}}
  else if(r<.31){let ww=tw,dd=td,yy=y0;[.46,.3,.24].forEach(p=>{o.P('box',t,lx,yy,lz,ww,h*p,dd,cl);yy+=h*p;cap(o,lx,lz,yy,ww,dd);ww*=.8;dd*=.8;});top=yy;tw=ww/.8;td=dd/.8;}
  else if(r<.45){o.P('cyl',1,lx,y0,lz,tw,h,tw,cl);const fc=rnd()<.6?GOLD:WH;[[.5,0],[-.5,0],[0,.5],[0,-.5]].slice(0,rnd()<.5?2:4).forEach(([a,b])=>o.P('box','plain',lx+a*tw,y0+h*.03,lz+b*tw,a?.07:.14,h*.97,b?.07:.14,fc));cap(o,lx,lz,top,tw,tw,WH,true);td=tw;}
  else if(r<.54){o.P('oct',t,lx,y0,lz,tw,h,tw,cl);cap(o,lx,lz,top,tw*1.02,tw*1.02);td=tw;}
  else if(r<.62){const n=Math.max(6,Math.round(h/.45)),dh=h/n,m=Math.min(tw,td);for(let i=0;i<n;i++)o.P('box',1,lx,y0+i*dh,lz,m,dh*1.002,m*.82,cl,i*.075);tw=td=m*.8;}
  else if(r<.7){o.P('box',t,lx-tw*.18,y0,lz,tw*.62,h,td,cl);o.P('box',1,lx+tw*.24,y0,lz,tw*.5,h*.76,td*.85,pick(PAL.glass));cap(o,lx-tw*.18,lz,top,tw*.62,td);tw*=.6;}
  else if(r<.77){o.P('box',t,lx,y0,lz,tw,h*.58,td,cl);cap(o,lx,lz,y0+h*.58,tw,td);const m=Math.min(tw,td)*.88;o.P('cyl',1,lx,y0+h*.58,lz,m,h*.42,m,cl);tw=td=m;}
  else if(r<.9){const st=pick(['#e9dcc0','#d9c7a5','#efe7d6','#c9b48e','#e3d3c0']);let yy=y0;
    [[.52,1],[.24,.78],[.14,.56]].forEach(([p,k])=>{o.P('box',6,lx,yy,lz,tw*k,h*p,td*k,st);yy+=h*p;cap(o,lx,lz,yy,tw*k,td*k,WH);});
    o.P('cone8','plain',lx,yy,lz,tw*.32,h*.14,tw*.32,GOLD);o.P('tank','metal',lx,yy+h*.14,lz,.04,.8,.04,'#eef1f3');top=yy;tw=0;}
  else{o.P('box',t,lx,y0,lz,tw,h,td,cl);o.P('gable','plain',lx,top,lz,tw,Math.min(tw,td)*.9,td,cl,Math.PI/2);o.P('tank','metal',lx,top+Math.min(tw,td)*.9,lz,.04,.9,.04,'#eef1f3');tw=0;}
  return {top,tw,td};}
const A={
 walkup:o=>{const t=pick([0,0,3,4,5]),h=.75+rnd()*.5,w=o.w*(.92+rnd()*.07),d=o.d*(.9+rnd()*.09),cl=t===4?pick(PAL.brick):pick(rnd()<.22?PAL.pastel:PAL.tile);
   o.P('box',t,0,0,0,w,h,d,cl);if(rnd()<.6)cap(o,0,0,h,w,d,rnd()<.6?'#f3efe6':'#8a6a55');roof(o,h,w,d,0,0,true);},
 shoprow:o=>{const lg=o.w>=o.d,L=lg?o.w:o.d,S=(lg?o.d:o.w)*.9,n=Math.max(2,Math.round(L/(.42+rnd()*.25))),uw=L/n;
   for(let i=0;i<n;i++){const h=.45+rnd()*.5,cl=pick(rnd()<.45?PAL.pastel:rnd()<.6?PAL.tile:PAL.vivid),t=pick([0,4,5,3]),cx=-L/2+(i+.5)*uw;
     if(lg){o.P('box',t,cx,0,0,uw*.97,h,S,cl);if(rnd()<.4)o.P('box','plain',cx,h,-S*.12,uw*.85,.11,S*.55,pick(PAL.shed));}
     else{o.P('box',t,0,0,cx,S,h,uw*.97,cl);if(rnd()<.4)o.P('box','plain',-S*.12,h,cx,S*.55,.11,uw*.85,pick(PAL.shed));}}},
 resTower:o=>{const t=pick([3,3,0,5,2,4,6]),m=Math.min(o.w,o.d),tw=m*(.56+rnd()*.2),td=Math.min(tw*(.8+rnd()*.4),o.d*.92),h=(1.9+rnd()*2.4+(rnd()<.2?1.6:0))*F101(o.x,o.z),cl=pick(rnd()<.25?PAL.pastel:PAL.tile),pod=.18+rnd()*.15;
   o.P('box',2,0,0,0,o.w*.99,pod,o.d*.99,pick(PAL.concrete));const sh=rnd();
   if(sh<.45)o.P('box',t,0,pod,0,tw,h,td,cl);
   else if(sh<.72){o.P('box',t,-tw*.26,pod,0,tw*.58,h,td,cl);o.P('box',t,tw*.3,pod,0,tw*.58,h*.8,td*.8,pick(PAL.tile));}
   else if(sh<.86)o.P('oct',t,0,pod,0,tw,h,tw,cl);
   else{o.P('box',t,0,pod,0,tw,h*.7,td,cl);o.P('box',t,0,pod+h*.7,0,tw*.75,h*.3,td*.75,cl);}
   const top=pod+h;cap(o,0,0,top,tw,td);if(rnd()<.5)o.P('hip','plain',0,top,0,tw*.88,.32,td*.88,pick(PAL.roof));else o.P('box','plain',0,top,0,tw*.45,.22,td*.45,pick(PAL.concrete));
   o.P('box','plain',o.w*.28,pod,o.d*.24,o.w*.22,.03,o.d*.2,'#7fae5e');},
 courtyard:o=>{const t=pick([3,0,5]),h=1.4+rnd()*1.5,cl=pick(PAL.tile),cl2=pick(PAL.tile.concat(PAL.pastel)),a=o.w*.97,b=o.d*.97,th=Math.min(a,b)*.24;
   o.P('box','plain',0,0,0,a,.04,b,'#86b86a');
   o.P('box',t,0,0,-b/2+th/2,a,h,th,cl);o.P('box',t,0,0,b/2-th/2,a,h*(.6+rnd()*.5),th,cl2);
   o.P('box',t,-a/2+th/2,0,0,th,h*.85,b-2*th,cl);if(rnd()<.6)o.P('box',t,a/2-th/2,0,0,th,h*.55,b-2*th,cl2);
   for(let i=0;i<3;i++){const [px,pz]=o.at((rnd()-.5)*a*.3,(rnd()-.5)*b*.3);extraTrees.push([px,pz,.2]);}},
 lshape:o=>{const t=pick([0,3,5,2]),h=1.2+rnd()*1.1,cl=pick(rnd()<.3?PAL.pastel:PAL.tile),a=o.w*.97,b=o.d*.97,th=Math.min(a,b)*.46;
   o.P('box',t,0,0,-b/2+th/2,a,h,th,cl);o.P('box',t,-a/2+th/2,0,th/2,th,h*(.75+rnd()*.5),b-th,rnd()<.5?cl:pick(PAL.tile));roof(o,h,a*.5,th,0,-b/2+th/2,true);},
 houses:o=>{const n=2+(rnd()*3|0);for(let i=0;i<n;i++){const lx=(n>1?i/(n-1)-.5:0)*o.w*.55,hw=o.w*.8/n,hd=o.d*(.4+rnd()*.25),h=.32+rnd()*.25,lz=(rnd()-.5)*o.d*.3;
   o.P('box',rnd()<.4?4:0,lx,0,lz,hw*.9,h,hd,pick(rnd()<.5?PAL.pastel:PAL.tile));o.P('gable','plain',lx,h,lz,hw*.96,.26,hd*1.04,pick(PAL.roof));}
   const [px,pz]=o.at(0,o.d*.36);extraTrees.push([px,pz,.22]);},
 school:o=>{const a=o.w*.97,b=o.d*.97,th=Math.min(a,b)*.2,cl=pick(['#efe2c4','#e7cfb0','#f2ece0','#d9c9b0','#e9d2c2']);
   o.P('box',3,0,0,-b/2+th/2,a,.5,th,cl);o.P('box',3,-a/2+th/2,0,th/2,th,.5,b-th,cl);
   o.P('box','plain',a*.12,0,b*.12,a*.62,.03,b*.6,'#c45a44');o.P('box','plain',a*.12,0,b*.12,a*.48,.045,b*.42,'#5fae55');},
 temple:o=>{const s=Math.min(o.w,o.d)*.82;o.P('box','plain',0,0,0,s,.05,s*1.1,'#c9b48e');o.P('box','plain',0,0,0,s*.8,.32,s*.6,'#b5322b');o.P('hip','plain',0,.32,0,s*.95,.3,s*.75,'#e2a233');
   o.P('box','plain',0,.62,0,s*.4,.15,s*.32,'#b5322b');o.P('hip','plain',0,.77,0,s*.5,.2,s*.4,'#e2a233');},
 pocketPark:o=>{o.P('box','plain',0,0,0,o.w,.04,o.d,'#79b35e');for(let i=0;i<4;i++){const [px,pz]=o.at((rnd()-.5)*o.w*.7,(rnd()-.5)*o.d*.7);extraTrees.push([px,pz,.24]);}},
 market:o=>{o.P('box','plain',0,0,0,o.w*.98,.3,o.d*.98,pick(PAL.concrete));o.P('gable','plain',0,.3,0,o.w*.98,.24,o.d*.98,pick(PAL.shed));},
 tower:o=>{const hh=hotH(o.x,o.z),h=Math.max(3,3+rnd()*3.4+hh*(.6+rnd()*.9)),tt=pick([1,1,1,2,5]),cl=pick(PAL.glass),pod=.45+rnd()*.6;
   o.P('box',pick([2,5,0]),0,0,0,o.w*.99,pod,o.d*.99,pick(rnd()<.5?PAL.concrete:PAL.glass));
   const tw=Math.min(o.w,o.d)*(.56+rnd()*.16),td=Math.min(tw*(.8+rnd()*.4),o.d*.9),lx=(rnd()-.5)*(o.w*.9-tw)*.6,r=towerBody(o,lx,0,tw,td,h,tt,cl,pod);crownAt(o,lx,0,r.top,r.tw,r.td);
   if(rnd()<.35)o.P('box','plain',o.w*.25,pod,o.d*.2,o.w*.3,.04,o.d*.3,'#7fae5e');},
 twin:o=>{const hh=hotH(o.x,o.z),h=3+rnd()*2.6+hh*.7,cl=pick(PAL.glass),tw=Math.min(o.w*.34,o.d*.6);
   o.P('box',2,0,0,0,o.w*.99,.5,o.d*.99,pick(PAL.concrete));[-1,1].forEach(sd=>{const r=towerBody(o,sd*o.w*.24,0,tw,tw*.9,h*(sd>0?.84:1),1,cl,.5);crownAt(o,sd*o.w*.24,0,r.top,r.tw,r.td);});},
 mall:o=>{const h=.7+rnd()*.5,a=o.w*.99,b=o.d*.99,m=Math.min(a,b);o.P('box',2,0,0,0,a,h,b,pick(rnd()<.5?PAL.concrete:PAL.vivid));
   o.P('box','plain',0,h*.6,b/2,a*1.01,.1,.06,pick(PAL.vivid));o.P('cyl',1,a*.25*(rnd()<.5?-1:1),0,b*.3,m*.3,h+.35,m*.3,pick(PAL.glass));
   o.P('box','plain',0,h,0,a*.7,.04,b*.6,rnd()<.6?'#7fae5e':'#9aa3a8');
   if(rnd()<.5){const r=towerBody(o,-a*.2,-b*.15,m*.35,m*.3,(2.6+rnd()*2.6+hotH(o.x,o.z)*.5)*F101(o.x,o.z),pick([1,2,5]),pick(PAL.glass),h);crownAt(o,-a*.2,-b*.15,r.top,r.tw,r.td);}},
 hotel:o=>{const h=2.6+rnd()*2.6+hotH(o.x,o.z)*.5,a=o.w*.75,th=Math.min(o.d*.32,.9);
   o.P('box',2,0,0,0,o.w*.99,.42,o.d*.99,pick(PAL.concrete));o.P('box',pick([2,5,3]),0,.42,0,a,h,th,pick(PAL.tile.concat(PAL.glass)));o.P('box','plain',0,.42+h,0,a*.6,.38,th*.8,pick(PAL.concrete));
   o.P('box','plain',a*.3,.42,o.d*.25,.5,.02,.3,'#4fb6d9');},
 midOffice:o=>{const h=(1.5+rnd()*1.4+hotH(o.x,o.z)*.3)*F101(o.x,o.z),t=pick([2,2,5,1,0]),cl=pick(t===1?PAL.glass:PAL.concrete.concat(PAL.tile)),a=o.w*(.9+rnd()*.09),b=o.d*(.88+rnd()*.11);
   if(rnd()<.6){o.P('box',t,0,0,0,a,h,b,cl);roof(o,h,a,b,0,0,false);}else{o.P('box',t,0,0,0,a,h*.65,b,cl);o.P('box',t,0,h*.65,0,a*.75,h*.35,b*.75,cl);}},
 campusOffice:o=>{const h=1.5+rnd()*1.6+hotH(o.x,o.z)*.35,t=pick([2,1,5]),cl=pick(t===1?PAL.glass:PAL.concrete),a=o.w*.97,b=o.d*.97,m=Math.min(a,b),r=rnd();
   if(r<.4){o.P('box',t,0,0,-b*.2,a,h,b*.5,cl);o.P('box',1,a*.2,0,b*.25,a*.55,h*.7,b*.42,pick(PAL.glass));}
   else if(r<.7){o.P('cyl',1,0,0,0,m*.9,h,m*.9,cl);o.P('box','plain',0,h,0,m*.55,.03,m*.55,'#3d4f6a');}
   else{o.P('box',t,0,0,0,a,h,b,cl);o.P('box','plain',0,h,0,a*.8,.03,b*.8,'#3d4f6a');o.P('box',1,0,0,b/2-.16,a*.3,h*1.15,.3,pick(PAL.glass));}
   o.P('box','plain',-a*.3,0,b*.42,a*.3,.03,b*.1,'#7fae5e');},
 datacenter:o=>{const a=o.w*.98,b=o.d*.98;o.P('box','plain',0,0,0,a,.6,b,pick(['#d9dcde','#c8ccd0','#e4e2dc']));for(let i=0;i<4;i++)o.P('box','plain',(i/3-.5)*a*.7,.6,0,a*.12,.12,b*.5,'#8a9298');}
};
function choose(pf,ar,x,z){const hh=hotH(x,z),r=rnd();if(D101(x,z)<14)return pick(['midOffice','midOffice','resTower','mall','pocketPark']);
 switch(pf){
 case 'cbd':if(ar>9&&r<.15)return 'mall';if(r<.25)return 'twin';if(r<.37)return 'hotel';if(r<.6)return 'midOffice';return 'tower';
 case 'biz':if(r<.58)return 'tower';if(r<.68)return 'twin';if(r<.8)return 'hotel';if(r<.86&&ar>7)return 'mall';if(r<.95)return 'midOffice';return 'resTower';
 case 'tech':if(r<.42)return 'tower';if(r<.58)return 'twin';if(r<.76)return 'campusOffice';if(r<.86)return 'midOffice';if(r<.9)return 'datacenter';if(r<.94&&ar>7)return 'mall';return 'resTower';
 case 'techpark':if(r<.32)return 'campusOffice';if(r<.6)return 'tower';if(r<.7)return 'twin';if(r<.82)return 'midOffice';if(r<.92)return 'resTower';return 'datacenter';
 case 'mixed':if(r<.36)return 'tower';if(r<.5)return 'hotel';if(r<.76)return 'resTower';if(r<.88)return 'midOffice';if(r<.93&&ar>7)return 'mall';return 'shoprow';
 case 'old':if(r<.36)return 'resTower';if(r<.48)return 'tower';if(r<.62)return 'walkup';if(r<.78)return 'shoprow';if(r<.82)return 'temple';if(r<.87)return 'market';if(r<.93)return 'midOffice';return 'pocketPark';
 case 'res':if(r<.5)return 'resTower';if(r<.62)return 'tower';if(r<.74&&ar>5)return 'courtyard';if(r<.82)return 'lshape';if(r<.88)return 'midOffice';if(r<.92&&ar>5)return 'school';if(r<.96)return 'pocketPark';return 'walkup';
 case 'sub':if(r<.42)return 'resTower';if(r<.57&&ar>5)return 'courtyard';if(r<.7)return 'walkup';if(r<.8)return 'lshape';if(r<.85)return 'houses';if(r<.91&&ar>5)return 'school';if(r<.96)return 'pocketPark';return 'tower';}
 return 'resTower';}
function split(u0,v0,uw,vw,mn,mx,out){const big=Math.max(uw,vw);
  if(big<mn*1.45||(big<=mx&&rnd()<.4)){out.push([u0,v0,uw,vw]);return;}
  const f=.3+rnd()*.4;if(uw>=vw){const a=uw*f;split(u0,v0,a,vw,mn,mx,out);split(u0+a,v0,uw-a,vw,mn,mx,out);}
  else{const a=vw*f;split(u0,v0,uw,a,mn,mx,out);split(u0,v0+a,uw,vw-a,mn,mx,out);}}

const OR=4,ON=W*OR,OCC=new Uint8Array(ON*ON);
function occ(x,z){const i=Math.floor((x+W/2)*OR),j=Math.floor((z+W/2)*OR);return i<0||j<0||i>=ON||j>=ON?1:OCC[j*ON+i];}
function markLot(o){for(let a=-o.w/2;a<=o.w/2+.01;a+=.2)for(let b=-o.d/2;b<=o.d/2+.01;b+=.2){const [x,z]=o.at(a,b),i=Math.floor((x+W/2)*OR),j=Math.floor((z+W/2)*OR);if(i>=0&&j>=0&&i<ON&&j<ON)OCC[j*ON+i]=1;}}
function placeLot(o,pf,x,z){const k=choose(pf,o.w*o.d,x,z);
  if(k==='houses'||k==='school'||k==='courtyard'||k==='pocketPark')o.P('box','plain',0,0,0,o.w,.025,o.d,'#86b86a');
  else if(k==='temple')o.P('box','plain',0,0,0,o.w,.03,o.d,'#a9705a');
  else o.P('box',2,0,0,0,o.w*.995,.16+rnd()*.12,o.d*.995,pick(rnd()<.5?PAL.concrete:PAL.tile));
  A[k](o);markLot(o);}
/* ---------- city grid per district ---------- */
DN.forEach((nm,di)=>{const [ang,B]=DP[nm],c=Math.cos(ang),s=Math.sin(ang),id=di+1,pf=PROF[nm],[mn,mx]=LOTSZ[pf];
  let mnx=1e9,mxx=-1e9,mnz=1e9,mxz=-1e9;DIST[nm].forEach(r=>r.forEach(p=>{mnx=Math.min(mnx,p[0]);mxx=Math.max(mxx,p[0]);mnz=Math.min(mnz,p[1]);mxz=Math.max(mxz,p[1]);}));
  const R=Math.hypot(mxx-mnx,mxz-mnz)/2+B,cx=(mnx+mxx)/2,cz=(mnz+mxz)/2,cu=cx*c+cz*s,cv=-cx*s+cz*c;
  const urb=(x,z)=>landUse(x,z).t==='urban';
  for(let iu=Math.floor((cu-R)/B);iu<=Math.ceil((cu+R)/B);iu++)for(let iv=Math.floor((cv-R)/B);iv<=Math.ceil((cv+R)/B);iv++){
    const wu=(iu%3===0)?1.05:.55,wv=(iv%3===0)?1.05:.55,u0=iu*B+wu+.14,v0=iv*B+wv+.14,bu=B-wu-.14,bv=B-wv-.14;
    const mx0=hash(iu*7+di,iv*13)<.12?Math.max(bu,bv)+.1:mx,lots=[];split(u0,v0,bu,bv,mn,mx0,lots);
    lots.forEach(([a,b,lw,lv])=>{const u=a+lw/2,v=b+lv/2,x=u*c-v*s,z=u*s+v*c;if(did(x,z)!==id||!urb(x,z))return;
      let o=null;for(const f of [1,.8,.62]){const t=mkLot(x,z,-ang,(lw-.16)*f,(lv-.16)*f);
        if(ZONES.some(zn=>{const dx=zn.x-x,dz=zn.z-z,lx=dx*c+dz*s,lz=-dx*s+dz*c;return Math.hypot(Math.max(Math.abs(lx)-t.w/2,0),Math.max(Math.abs(lz)-t.d/2,0))<zn.r+.1;}))continue;
        if([[-1,-1],[1,-1],[-1,1],[1,1],[0,-1],[0,1],[-1,0],[1,0]].every(([p,q])=>{const [px,pz]=t.at(p*t.w/2,q*t.d/2);return urb(px,pz)&&did(px,pz)===id;})){o=t;break;}}
      if(!o)return;
      placeLot(o,pf,x,z);});
    {const vm=iv*B+B/2,um=iu*B+B/2;for(const [uu,vv,dx,dz,L] of [[iu*B+wu+.07,iv*B+wv,-s,c,B-wv],[iu*B+B-.07,iv*B+wv,-s,c,B-wv],[iu*B+wu,iv*B+wv+.07,c,s,B-wu],[iu*B+wu,iv*B+B-.07,c,s,B-wu]]){
      const x0=uu*c-vv*s,z0=uu*s+vv*c,mx=x0+dx*L/2,mz=z0+dz*L/2;if(did(mx,mz)===id&&urb(mx,mz)&&rnd()<.55)walkPaths.push([x0,z0,dx,dz,L]);}}
    if(wu>1)for(let t=0;t<B;t+=1.3){const u=iu*B-.05,v=iv*B+t,x=u*c-v*s,z=u*s+v*c;if(rnd()<.35&&did(x,z)===id&&urb(x,z))streetTrees.push([x,z]);}
    if(wv>1)for(let t=0;t<B;t+=1.3){const u=iu*B+t,v=iv*B-.05,x=u*c-v*s,z=u*s+v*c;if(rnd()<.35&&did(x,z)===id&&urb(x,z))streetTrees.push([x,z]);}
    if(carData.length<700){
    if(wu>1)[[.28,1],[.72,-1]].forEach(([f,sg])=>{if(rnd()<.6){const u=iu*B+wu*f,v0=iv*B+wv,L=B-wv,mx=u*c-(v0+L/2)*s,mz=u*s+(v0+L/2)*c;if(did(mx,mz)===id&&urb(mx,mz)){const vs=sg>0?v0:v0+L;carData.push([u*c-vs*s,u*s+vs*c,-s*sg,c*sg,L,rnd()*L,.5+rnd()*.5,Hh(mx,mz)]);}}});
    if(wv>1)[[.28,-1],[.72,1]].forEach(([f,sg])=>{if(rnd()<.6){const v=iv*B+wv*f,u0=iu*B+wu,L=B-wu,mx=(u0+L/2)*c-v*s,mz=(u0+L/2)*s+v*c;if(did(mx,mz)===id&&urb(mx,mz)){const us=sg>0?u0:u0+L;carData.push([us*c-v*s,us*s+v*c,c*sg,s*sg,L,rnd()*L,.5+rnd()*.5,Hh(mx,mz)]);}}});}
    }});

/* ---------- edge infill: follow coastline, riverbanks and district seams ---------- */
{const okPt=(x,z,id)=>{if(occ(x,z))return false;const lu=landUse(x,z);if(lu.t!=='urban'||lu.d!==id)return false;const r=roadAt(x,z,id);return r===0||r===-1;};
 [[2.8,2.2],[2,1.6],[1.4,1.15],[1,.85],[.75,.65]].forEach(([sw,sd])=>{const st=sw<1?.45:.7;for(let gz=-W/2;gz<W/2;gz+=st)for(let gx=-W/2;gx<W/2;gx+=st){const x=gx+(rnd()-.5)*.3,z=gz+(rnd()-.5)*.3;
   if(occ(x,z))continue;const lu=landUse(x,z);if(lu.t!=='urban'||!DN[lu.d-1])continue;const id=lu.d,nm=DN[id-1];if(roadAt(x,z,id)>0)continue;
   let bx=0,bz=0;for(let k=0;k<12;k++){const a=k/12*Math.PI*2,px=x+Math.cos(a)*2.4,pz=z+Math.sin(a)*2.4,t2=landUse(px,pz);if(t2.t!=='urban'||t2.d!==id){bx-=Math.cos(a);bz-=Math.sin(a);}}
   const gm=Math.hypot(bx,bz),ry=gm>.5?Math.atan2(bx/gm,bz/gm):-DP[nm][0];
   const o=mkLot(x,z,ry,sw,sd);let ok=true;
   for(let a=-1;a<=1&&ok;a+=.5)for(let b=-1;b<=1;b+=.5){const [px,pz]=o.at(a*sw/2,b*sd/2);if(!okPt(px,pz,id)){ok=false;break;}}
   if(ok)placeLot(o,PROF[nm],x,z);}});}

/* ---------- landmarks ---------- */
const L101=ZM['台北101'];
{const t=new THREE.Group(),wt=(()=>{const c=canvas(192,128),e=canvas(192,128),g=c.getContext('2d'),h=e.getContext('2d');g.fillStyle='#4f9e92';g.fillRect(0,0,192,128);h.fillStyle='#000';h.fillRect(0,0,192,128);
   for(let r=0;r<8;r++)for(let q=0;q<12;q++){const x=q*16+2,y=r*16+3,gr=g.createLinearGradient(x,y,x+6,y+12);gr.addColorStop(0,'#c4ece2');gr.addColorStop(1,'#2a6a62');g.fillStyle=gr;g.fillRect(x,y,12,11);
     if(rnd()<.62){h.fillStyle=rnd()<.8?'#ffe2a0':'#e8f6ff';h.fillRect(x,y,12,11);}}
   const m=new THREE.CanvasTexture(c),em=new THREE.CanvasTexture(e);[m,em].forEach(t2=>{t2.wrapS=t2.wrapT=THREE.RepeatWrapping;t2.repeat.set(4,1);t2.anisotropy=4;});return {m,em};})(),
  gl=nightable(new THREE.MeshStandardMaterial({map:wt.m,emissiveMap:wt.em,emissive:'#ffffff',metalness:.3,roughness:.3}),0,1.15),
  gold=new THREE.MeshStandardMaterial({color:'#d9b45a',metalness:.6,roughness:.35});
  const add=(g,m,y)=>{const o=new THREE.Mesh(g,m);o.position.y=y;o.castShadow=o.receiveShadow=true;t.add(o);return o;};
  add(new THREE.BoxGeometry(5.2,1.4,3.6),new THREE.MeshStandardMaterial({color:'#9fb0b4',roughness:.4,metalness:.3}),.7);
  add(new THREE.CylinderGeometry(1.75,2.1,4,4).rotateY(Math.PI/4),gl,2);let y=4;
  for(let i=0;i<8;i++){add(new THREE.CylinderGeometry(1.65,1.22,1.65,4).rotateY(Math.PI/4),gl,y+.82);add(new THREE.BoxGeometry(2.35,.09,2.35),gold,y+1.65);y+=1.65;}
  add(new THREE.CylinderGeometry(.85,1.15,1.2,4).rotateY(Math.PI/4),gl,y+.6);y+=1.2;add(new THREE.CylinderGeometry(.5,.66,1,8),gl,y+.5);y+=1;
  add(new THREE.CylinderGeometry(.05,.18,3.6,6),nightable(new THREE.MeshStandardMaterial({color:'#e6ecef',metalness:.7,roughness:.3,emissive:'#ff4a3a'}),0,1),y+1.8);
  {const fc=canvas(300,200),fg=fc.getContext('2d');fg.fillStyle='#fe0000';fg.fillRect(0,0,300,200);fg.fillStyle='#000095';fg.fillRect(0,0,150,100);
   fg.fillStyle='#ffffff';fg.beginPath();for(let i=0;i<24;i++){const a=i/24*Math.PI*2-Math.PI/2,r=i%2?17:31;fg.lineTo(75+Math.cos(a)*r,50+Math.sin(a)*r);}fg.closePath();fg.fill();
   fg.fillStyle='#000095';fg.beginPath();fg.arc(75,50,16.5,0,7);fg.fill();fg.fillStyle='#ffffff';fg.beginPath();fg.arc(75,50,14,0,7);fg.fill();
   const ft=new THREE.CanvasTexture(fc);ft.anisotropy=4;const fgeo=new THREE.PlaneGeometry(3,2,24,12).translate(1.5,0,0);
   flag=new THREE.Mesh(fgeo,nightable(new THREE.MeshStandardMaterial({map:ft,emissiveMap:ft,emissive:'#ffffff',side:THREE.DoubleSide,roughness:.7}),0,.55));
   flag.userData.base=fgeo.attributes.position.array.slice();flag.scale.set(1.1,.72,1.1);flag.position.set(.05,y+3.68,0);flag.castShadow=true;t.add(flag);
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,2.6,6),new THREE.MeshStandardMaterial({color:'#e6ecef',metalness:.7,roughness:.3}));pole.position.set(0,y+3.6,0);t.add(pole);}
  t.position.set(L101.x,Hh(L101.x,L101.z)-.2,L101.z);t.scale.set(1.05,1.6,1.05);scene.add(t);}
const M=c=>new THREE.MeshStandardMaterial({color:c,roughness:.6});
function grp(x,z,ry,parts,sc){sc=sc||1.6;const g=new THREE.Group(),zn=ZONES.find(o=>Math.hypot(o.x-x,o.z-z)<.05),rr=zn?zn.r-.5:0;let gy=Hh(x,z);for(let k=0;k<16&&rr;k++){const a=k/16*6.2832;gy=Math.min(gy,Hh(x+Math.cos(a)*rr,z+Math.sin(a)*rr));}
  if(rr){const pl=new THREE.Mesh(new THREE.CylinderGeometry(rr*.85,rr*.85,3.2,48),M('#a8a49a'));pl.position.set(x,gy-.08-1.6,z);pl.receiveShadow=true;scene.add(pl);}parts.forEach(([geo,mat,px,py,pz,sx,sy,sz,rr])=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.scale.set(sx,sy,sz);if(rr)m.rotation.y=rr;m.castShadow=m.receiveShadow=true;g.add(m);});
  g.position.set(x,gy-.1,z);g.rotation.y=ry;g.scale.setScalar(sc);scene.add(g);return g;}
const red=M('#b5322b'),orange=M('#e2a233'),white=M('#f2f0ea'),blue=M('#2b4f9e'),brick=M('#a8513a'),dark=M('#3e4247');
{const z=ZM['圓山大飯店'];grp(z.x,z.z,.1,[[GEO.box,red,0,0,0,4.6,1.8,1.5],[GEO.hip,orange,0,1.8,0,4.9,1,1.8],[GEO.box,red,0,2.5,0,2.2,.7,1.1],[GEO.hip,orange,0,3.2,0,2.6,.75,1.3]],1.6);}
{const z=ZM['國父紀念館'];grp(z.x,z.z,0,[[GEO.box,M('#efe6d2'),0,0,0,2.6,.9,2.6],[GEO.hip,M('#e2b43c'),0,.9,0,3.3,.9,3.3]],1.6);}
{const z=ZM['中正紀念堂'];grp(z.x,z.z,0,[[GEO.box,white,0,0,0,2.4,.6,2.4],[GEO.oct,white,0,.6,0,1.8,1.6,1.8],[GEO.cone8,blue,0,2.2,0,2.3,1.1,2.3],[GEO.box,white,0,0,2.9,1.4,.7,.45],[GEO.hip,blue,0,.7,2.9,1.6,.35,.6]]);}
{const z=ZM['總統府'];grp(z.x,z.z,-.05,[[GEO.box,brick,0,0,0,3.8,1.2,1.6],[GEO.box,white,0,1.2,0,3.8,.12,1.6],[GEO.box,brick,0,0,0,1,4.2,1],[GEO.hip,dark,0,4.2,0,1.05,.7,1.05]]);}
{const z=ZM['台北車站'];grp(z.x,z.z,0,[[GEO.box,M('#e8e2d6'),0,0,0,3.4,1.1,2.4],[GEO.hip,dark,0,1.1,0,3.8,.9,2.8]]);}
{const z=ZM['新光摩天大樓'];put('box',2,z.x,Hh(z.x,z.z)-.2,z.z,4.4,1.4,3.8,0,'#d4d1c9');put('box',1,z.x,Hh(z.x,z.z)-.2,z.z,3,17.8,2.6,0,'#cbb98a');put('box','led',z.x,Hh(z.x,z.z)+17.2,z.z,3.1,.12,2.7,0);put('box',1,z.x,Hh(z.x,z.z)+17.6,z.z,2,1.4,1.8,0,'#cbb98a');}
{const z=ZM['台北小巨蛋'];grp(z.x,z.z,0,[[GEO.cyl,M('#d9dde0'),0,0,0,3.4,.6,3.4],[GEO.dome,M('#eef1f3'),0,.6,0,3.4,1.2,3.4]]);}
{const z=ZM['龍山寺'];grp(z.x,z.z,.3,[[GEO.box,red,0,0,0,2,.6,1.4],[GEO.hip,orange,0,.6,0,2.3,.55,1.7],[GEO.box,red,0,1.15,0,1.1,.35,.8],[GEO.hip,orange,0,1.5,0,1.4,.45,1.1]]);}
// 大巨蛋
{const z=ZM['台北大巨蛋'];grp(z.x,z.z,.25,[[GEO.cyl,M('#cfd5da'),0,0,0,3.5,.4,3],[GEO.dome,new THREE.MeshStandardMaterial({color:'#eef1f3',metalness:.5,roughness:.26}),0,.4,0,3.5,2.3,3],[GEO.cyl,M('#5d6b78'),0,1.52,0,1.1,.03,.9],[GEO.box,M('#dfe3e6'),0,0,1.9,2.4,.25,.6]],1.6);}
// 南港展覽館
{const z=ZM['南港展覽館'],sil=new THREE.MeshStandardMaterial({color:'#e3e8ec',metalness:.35,roughness:.35});
 grp(z.x,z.z,-.1,[[GEO.box,M('#d4dade'),0,0,0,5.6,.55,3],[GEO.dome,sil,-1.9,.55,0,2,1,3],[GEO.dome,sil,0,.55,0,2,1.25,3],[GEO.dome,sil,1.9,.55,0,2,1,3],[GEO.box,new THREE.MeshStandardMaterial({color:'#7fa6c2',metalness:.4,roughness:.2}),0,0,1.52,5.4,.5,.06]],1.6);}
// 臺大：首都研究型大學
{const z=ZM['國立臺灣大學'],o=mkLot(z.x,z.z,0,18,18,Hh(z.x,z.z)-.12),GL=['#3f7fd0','#4f9be0','#8fb3d1','#5b4bb0','#2f9fb0','#c3ced6'];
 o.P('box','plain',-7.8,0,-1,.4,1.3,.4,'#d8cbb0');o.P('box','plain',-7.8,0,1,.4,1.3,.4,'#d8cbb0');o.P('box','plain',-7.8,1.3,0,.55,.32,2.5,'#b5553c');
 o.P('box',6,5.6,0,0,3.4,1.9,4.6,'#e8dcc4');o.P('hip','plain',5.6,1.9,0,3.8,1.1,5,'#7a3b2e');o.P('box','plain',3.7,0,0,.5,1.6,2.6,'#f3efe6');o.P('box','plain',3.6,1.6,0,.7,.15,2.8,'#e8dcc4');
 [-5,-2.2,.6].forEach(a=>[-1,1].forEach(sd=>{o.P('box',4,a,0,sd*2.6,2.2,1.05,1.6,'#ffffff');o.P('gable','plain',a,1.05,sd*2.6,2.3,.5,1.7,'#7a3b2e');}));
 o.P('box','plain',-1.5,0,1.2,.42,1.2,.42,'#e8dcc4');o.P('hip','plain',-1.5,1.2,1.2,.6,.42,.6,'#3b4a5a');
 [[-5.6,6,3.6],[-1.8,6.4,5],[2.1,6,3.8],[-5.6,-6.1,4.4],[-1.7,-6.4,6],[2.4,-6,3.2]].forEach(([a,b,h])=>{o.P('box',2,a,0,b,2.6,.5,2.2,'#e3dfd6');const r=towerBody(o,a,b,1.9,1.6,h,pick([1,2,6]),pick(GL),.5);crownAt(o,a,b,r.top,r.tw,r.td);});
 o.P('box','plain',6.4,0,-6,4.2,.03,3,'#c45a44');o.P('box','plain',6.4,0,-6,3.3,.045,2.1,'#5fae55');
 o.P('cyl','plain',6.4,0,6,2.8,.04,2.2,'#2aa8c8');
 for(let i=-7;i<=3;i++){[-.8,.8].forEach(dz=>{const [px,pz]=o.at(i,dz);extraTrees.push([px,pz,.2,'palm']);});}}
// 陶朱隱園
{const z=ZM['陶朱隱園'],o=scaled(mkLot(z.x,z.z,0,3.6,3.6,Hh(z.x,z.z)-.12),1.8);for(let i=0;i<14;i++){o.P('box',1,0,i*.3,0,1.3,.3,1.05,'#a9c2b4',i*.075);if(i%2)o.P('box','plain',.62,i*.3+.28,0,.18,.06,1.05,'#5fa35a',i*.075);}}
// 松山機場
{const ry=-AP.a,at=(u,v)=>[AP.x+u*AP.c-v*AP.s,AP.z+u*AP.s+v*AP.c];
 const P=(g,mt,u,y,v,sx,sy,sz,cl,dr)=>{const [x,z]=at(u,v);put(g,mt,x,Math.max(Hh(x,z),0)-.12+y,z,sx,sy,sz,ry+(dr||0),cl);};
 const gy=Math.max(...[-10,-5,0,5,10].map(u=>{const [x,z]=at(u,1);return Hh(x,z);}))+.035;
 const tex=(w,h,f)=>{const c=canvas(w,h),g=c.getContext('2d');f(g,w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=8;return t;};
 const pad=(uw,vw,u,v,map,y)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(uw,vw).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map,roughness:.85,polygonOffset:true,polygonOffsetFactor:-2}));
   const [x,z]=at(u,v);m.position.set(x,gy+(y||0),z);m.rotation.y=-AP.a;m.receiveShadow=true;scene.add(m);};
 pad(20.6,1.12,0,0,tex(2048,112,(g,w,h)=>{g.fillStyle='#45484e';g.fillRect(0,0,w,h);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(150,h/2-14,w-300,28);g.fillStyle='#efefea';
   g.fillRect(0,5,w,4);g.fillRect(0,h-9,w,4);for(let x=230;x<w-230;x+=56)g.fillRect(x,h/2-2,30,4);
   [14,w-104].forEach(x0=>{for(let k=0;k<8;k++){if(k===3||k===4)continue;g.fillRect(x0,14+k*11,90,7);}});
   [[250,1],[330,1],[410,1],[w-290,1],[w-370,1],[w-450,1]].forEach(([x])=>{g.fillRect(x,h/2-30,40,9);g.fillRect(x,h/2+21,40,9);});
   g.font='bold 44px sans-serif';g.textAlign='center';g.textBaseline='middle';
   g.save();g.translate(150,h/2);g.rotate(Math.PI/2);g.fillText('10',0,0);g.restore();g.save();g.translate(w-150,h/2);g.rotate(-Math.PI/2);g.fillText('28',0,0);g.restore();}));
 pad(21,.4,0,1.45,tex(1024,20,(g,w,h)=>{g.fillStyle='#5a5d62';g.fillRect(0,0,w,h);g.fillStyle='#e8c23c';g.fillRect(0,h/2-1,w,2);}));
 [-9.6,-3.2,3.2,9.6].forEach(u=>pad(.4,.9,u,.97,tex(20,48,(g,w,h)=>{g.fillStyle='#5a5d62';g.fillRect(0,0,w,h);g.fillStyle='#e8c23c';g.fillRect(w/2-1,0,2,h);}),-.005));
 pad(12.8,2.25,-1.2,2.72,tex(1024,180,(g,w,h)=>{g.fillStyle='#b4b6b8';g.fillRect(0,0,w,h);g.fillStyle='#e8c23c';g.fillRect(0,22,w,3);
   for(let k=0;k<7;k++){const x=(k*1.6+.4+.6)/12.8*w;g.fillRect(x-1,30,3,h-40);g.fillRect(x-14,h-30,28,3);}}),-.01);
 for(let u=-10;u<=10;u+=1){P('bead','lamp',u,.06,.6,.07,.07,.07);P('bead','lamp',u,.06,-.6,.07,.07,.07);}
 P('box',2,-1.4,0,4.35,9.6,.62,.95,'#eef1f3');P('box','plain',-1.4,.62,4.35,10,.07,1.2,'#9fb6c8');P('box',1,-1.4,0,3.86,9.6,.55,.04,'#7fa6c2');
 P('box',1,4.7,0,4.3,2.8,.75,1.05,'#c9d6e0');P('hip','plain',4.7,.75,4.3,3,.35,1.2,'#e8ecef');
 for(let u=-6;u<=2.1;u+=1.6){P('box','plain',u,.32,3.6,.12,.12,.6,'#d6dadd');}
 P('cyl','plain',6.4,0,3.4,.34,2.6,.34,'#eef0f2');P('cyl',1,6.4,2.6,3.4,.82,.42,.82,'#5f8fb0');P('cyl','plain',6.4,3.02,3.4,.92,.08,.92,'#eef0f2');P('tank','metal',6.4,3.1,3.4,.04,.7,.04,'#e8ecef');P('bead','beacon',6.4,3.8,3.4,.1,.1,.1);
 [6,7.8,9.6].forEach(u=>P('barrel','plain',u,0,-2.9,1.5,1.1,1.25,'#cfd3d6'));
 P('box','plain',-9.2,0,3.2,1.2,.35,.9,'#d5d0c4');P('box','plain',-11,0,-1.4,.8,.05,1.4,'#e8e8e2');
 const tails=['#2d6fd2','#c8102e','#1f7a5c','#f0a020','#6a3fa0','#0f4c81'];
 [-6,-4.4,-2.8,-1.2,.4,2].forEach((u,i)=>{const pl=plane(.3,tails[i]),[x,z]=at(u,2.85);pl.position.set(x,gy+.12,z);pl.rotation.y=Math.atan2(-AP.c,-AP.s);scene.add(pl);});
 {const pl=plane(.3,'#c8102e'),[x,z]=at(-9.6,1.45);pl.position.set(x,gy+.12,z);pl.rotation.y=Math.atan2(-AP.s,AP.c);scene.add(pl);}
 lander=plane(.32,'#0f4c81');lander.rotation.y=-AP.a;scene.add(lander);}

/* ---------- policy campus buildings ---------- */
const CH=opts.campusHeight||1,campusMat={lawn:new THREE.MeshStandardMaterial({color:'#6f9f50',roughness:.95,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
 white:new THREE.MeshStandardMaterial({color:'#f1efe8',roughness:.7,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),
 ring:new THREE.MeshStandardMaterial({color:'rgb('+PCOL.join(',')+')',roughness:.6,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3})};
function drapeDisc(cx,cz,r0,r1,mat){const g=r0>0?new THREE.RingGeometry(r0,r1,160,2):new THREE.CircleGeometry(r1,160);g.rotateX(-Math.PI/2);const p=g.attributes.position;
 for(let i=0;i<p.count;i++)p.setY(i,Hh(cx+p.getX(i),cz+p.getZ(i))+.04);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.position.set(cx,0,cz);m.receiveShadow=true;scene.add(m);}
ZONES.filter(z=>z.kind==='policy').forEach(z=>{const t=z.theme,nm=(t.area||'')+t.name,s=z.r,o0=mkLot(z.x,z.z,0,s*1.6,s*1.6,Hh(z.x,z.z)-.1);
  drapeDisc(z.x,z.z,0,s*.86,campusMat.lawn);drapeDisc(z.x,z.z,s*.86,s*.91,campusMat.white);drapeDisc(z.x,z.z,s*.91,s,campusMat.ring);
  let zt=0;const o={x:o0.x,z:o0.z,w:o0.w,d:o0.d,y:o0.y,at:o0.at,P:(g,mt,lx,ly,lz,sx,sy,sz,cl,dr)=>{zt=Math.max(zt,(ly+sy)*CH);o0.P(g,mt,lx,ly*CH,lz,sx,sy*CH,sz,cl,dr);}};
  const K=/交通|捷運/.test(nm)?'station':/居住|住宅|都更/.test(nm)?'homes':/AI|產業|科技|數位/.test(nm)?'tech':/育兒|托育/.test(nm)?'kinder':/教育|午餐/.test(nm)?'school':
    /銀髮|社福|衛生|無菸|食安|醫|勞動/.test(nm)?'care':/運動|體育|賽事/.test(nm)?'stadium':/青年/.test(nm)?'youth':/環保/.test(nm)?'eco':/文化|觀光/.test(nm)?'culture':'civic';
  if(K==='station'){o.P('box',2,0,0,0,s*1.1,.55,s*.6,'#dfe3e6');o.P('barrel','plain',0,.55,0,s*1.15,.9,s*.62,'#9fb6c8');o.P('box','plain',0,0,s*.45,s*1.2,.04,.25,'#555a60');}
  else if(K==='homes'){[[-.35,-.2,3.2],[.3,-.25,2.6],[0,.32,2.2]].forEach(([a,b,h])=>{const r=towerBody(o,a*s,b*s,s*.42,s*.36,h,3,pick(PAL.tile),0);crownAt(o,a*s,b*s,r.top,r.tw,r.td);});}
  else if(K==='tech'){o.P('box',2,0,0,0,s*1.2,.4,s*.6,'#e3dfd6');[-1,1].forEach(sd=>{const r=towerBody(o,sd*s*.28,0,s*.4,s*.36,sd>0?4.2:5.2,1,pick(PAL.glass),.4);crownAt(o,sd*s*.28,0,r.top,r.tw,r.td);});}
  else if(K==='kinder'){[[-.3,0,'#f2c9c1'],[.05,.2,'#c8d6ec'],[.35,-.1,'#e6dcb8']].forEach(([a,b,c])=>{o.P('box',0,a*s,0,b*s,s*.38,.42,s*.34,c);o.P('gable','plain',a*s,.42,b*s,s*.4,.25,s*.36,pick(PAL.roof));});o.P('box','plain',0,0,-s*.4,s*.5,.03,s*.22,'#e8a95c');}
  else if(K==='school'){A.school(o);}
  else if(K==='care'){o.P('box',3,0,0,0,s*1.1,1.6,s*.36,'#f2f0ea');o.P('box',3,-s*.42,0,0,s*.28,1.2,s*.9,'#f2f0ea');o.P('box',3,s*.42,0,0,s*.28,1.2,s*.9,'#f2f0ea');o.P('box','plain',0,1.6,0,s*.12,.06,s*.36,'#2f8f6a');o.P('box','plain',0,1.6,0,s*.36,.06,s*.12,'#2f8f6a');}
  else if(K==='stadium'){o.P('cyl','plain',0,0,0,s*1.25,.5,s*1.0,'#d9dde0');o.P('cyl','plain',0,0,0,s*1.15,.51,s*.92,'#c45a44');o.P('cyl','plain',0,0,0,s*1.05,.52,s*.82,'#5fae55');}
  else if(K==='youth'){[[0,0,1.0,'#e3cfc6'],[.15,1.0,.8,'#bccdd4'],[-.1,1.8,.7,'#e6dcb8']].forEach(([a,y,h,c],i)=>o.P('box',i%2?5:2,a*s,y,(i-1)*s*.08,s*(.9-i*.15),h,s*(.6-i*.08),c));}
  else if(K==='eco'){o.P('box',2,0,0,0,s*.9,.6,s*.6,'#e8e6e0');o.P('box','plain',0,.6,0,s*.85,.05,s*.56,'#3d4f6a');}
  else if(K==='culture'){o.P('box','plain',0,0,0,s*.9,.8,s*.7,'#e8dcc4');o.P('hip','plain',0,.8,0,s*1.05,.6,s*.85,'#7a3b2e');}
  else{o.P('box',6,0,0,0,s*.9,1.2,s*.7,'#e9dcc0');o.P('hip','plain',0,1.2,0,s,.5,s*.8,'#4e6a62');}
  [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b])=>{o.P('tank','metal',a*s*.68,0,b*s*.68,.05,1.2,.05,'#d9dde0');o.P('bead','lamp',a*s*.68,1.22,b*s*.68,.13,.13,.13);});
  for(let k=0;k<9;k++){const an=k/9*6.2832+.3;extraTrees.push([z.x+Math.cos(an)*s*.78,z.z+Math.sin(an)*s*.78,.26]);}
  z.topH=Math.max(zt,1.2);
});

/* ---------- ferris wheels ---------- */
function ferris(z,ry,R,ring){const g=new THREE.Group(),wh=new THREE.Group(),wM=new THREE.MeshStandardMaterial({color:'#f3f3f3',roughness:.4,metalness:.3});
  const rim=nightable(new THREE.MeshStandardMaterial({color:ring,roughness:.4,emissive:ring}),.05,1.5);
  wh.add(new THREE.Mesh(new THREE.TorusGeometry(R,.12,6,60),rim));
  for(let i=0;i<12;i++){const s=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,R*2,4),wM);s.rotation.z=i*Math.PI/12;wh.add(s);}
  const cc=['#e94b4b','#f7c843','#4bb3e9','#6ad16a'];for(let i=0;i<18;i++){const a=i/18*Math.PI*2,c=new THREE.Mesh(new THREE.BoxGeometry(.32,.36,.32),new THREE.MeshStandardMaterial({color:cc[i%4]}));c.position.set(Math.cos(a)*R,Math.sin(a)*R,0);wh.add(c);}
  {const nb=64,bm=new THREE.MeshBasicMaterial({toneMapped:false}),bi=new THREE.InstancedMesh(new THREE.SphereGeometry(.07,8,6),bm,nb+24);let k=0;
   for(let i=0;i<nb;i++){const a=i/nb*6.2832;m4.makeTranslation(Math.cos(a)*(R+.13),Math.sin(a)*(R+.13),0);bi.setMatrixAt(k,m4);bi.setColorAt(k++,col.set('#ffffff'));}
   for(let i=0;i<12;i++)for(const f of [.4,.7]){const a=i/12*Math.PI*2;m4.makeTranslation(Math.cos(a)*R*f,Math.sin(a)*R*f,.04);bi.setMatrixAt(k,m4);bi.setColorAt(k++,col.set('#ffffff'));}
   wh.add(bi);bulbs.push({im:bi,n:k,mat:bm});}
  wh.position.y=R+.9;g.add(wh);
  [-1,1].forEach(sd=>[-1,1].forEach(fb=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,R+1.2,5),wM);l.position.set(sd*R*.28,(R+.9)/2,fb*.4);l.rotation.z=-sd*.28;g.add(l);}));
  if(z.n==='美麗華'){const b=new THREE.Mesh(new THREE.BoxGeometry(3.6,1.6,2.4),M('#e9e2d6'));b.position.set(0,.8,1.6);g.add(b);wh.position.y=R+2.2;wh.position.z=.2;}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.position.set(z.x,Hh(z.x,z.z)-.15,z.z);g.rotation.y=ry;g.scale.setScalar(1.7);scene.add(g);wheels.push(wh);}
ferris(ZM['美麗華'],.5,2.8,'#ff6aa2');ferris(ZM['兒童新樂園'],-.3,2.2,'#58c8ff');

/* ---------- bridges ---------- */
const bW=new THREE.MeshStandardMaterial({color:'#f2f2ee',roughness:.5,metalness:.2}),dk=new THREE.MeshStandardMaterial({color:'#7c7f86',roughness:.8}),rainbow=M('#d8453a');
function bridge(r,tt,type){const p=r.c.getPointAt(tt),T=r.c.getTangentAt(tt),Px=-T.z,Pz=T.x,g=new THREE.Group(),len=r.w+4.6;
  const deck=new THREE.Mesh(new THREE.BoxGeometry(len,.3,1.4),dk);deck.position.y=1.35;g.add(deck);
  [-1,1].forEach(s=>{const rl=new THREE.Mesh(new THREE.BoxGeometry(len,.14,.06),bW);rl.position.set(0,1.56,s*.68);g.add(rl);});
  if(type==='arch'||type==='rainbow'){const m=type==='rainbow'?rainbow:bW;[-1,1].forEach(s=>{const c=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-len*.42,1.4,s*.64),new THREE.Vector3(0,6,s*.64),new THREE.Vector3(len*.42,1.4,s*.64));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c,24,.12,6),m));for(let k=1;k<8;k++){const q=c.getPoint(k/8),hh=q.y-1.45,h1=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,hh,3),bW);h1.position.set(q.x,1.45+hh/2,s*.64);g.add(h1);}});}
  else if(type==='cable'){const py=new THREE.Mesh(new THREE.BoxGeometry(.35,6,.35),bW);py.position.set(-len*.15,4,0);g.add(py);const pts=[];
    for(let k=1;k<=6;k++)[-1,1].forEach(s=>{pts.push(new THREE.Vector3(-len*.15,6.7,0),new THREE.Vector3(-len*.15+k*len*.1,1.5,s*.64),new THREE.Vector3(-len*.15,6.7,0),new THREE.Vector3(-len*.15-k*len*.05,1.5,s*.64));});
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#ffffff'})));}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.position.set(p.x,0,p.z);g.rotation.y=Math.atan2(-Pz,Px);scene.add(g);}
[[.1,'flat'],[.19,'arch'],[.27,'flat'],[.35,'flat'],[.42,'arch'],[.5,'cable'],[.57,'flat'],[.65,'flat'],[.74,'rainbow'],[.83,'flat'],[.92,'arch']].forEach(([t,k])=>bridge(RIVERS[0],t,k));
[[.3,'flat'],[.52,'arch'],[.72,'flat'],[.88,'flat']].forEach(([t,k])=>bridge(RIVERS[1],t,k));[[.5,'flat'],[.75,'flat']].forEach(([t,k])=>bridge(RIVERS[2],t,k));

/* ---------- planes / boats ---------- */
function plane(s,tail){const p=new THREE.Group(),wM=new THREE.MeshStandardMaterial({color:'#f6f7f9',roughness:.4}),bM=M(tail||'#2d6fd2');
  const f=new THREE.Mesh(new THREE.CylinderGeometry(.38,.3,4.4,10).rotateZ(Math.PI/2),wM);p.add(f);const n=new THREE.Mesh(new THREE.SphereGeometry(.38,10,8),wM);n.scale.set(1.6,1,1);n.position.x=2.2;p.add(n);
  const w=new THREE.Mesh(new THREE.BoxGeometry(1.1,.08,5.2),wM);w.position.x=.1;p.add(w);const hs=new THREE.Mesh(new THREE.BoxGeometry(.6,.06,1.8),wM);hs.position.x=-2;p.add(hs);
  const tl=new THREE.Mesh(new THREE.BoxGeometry(.8,1.1,.08),bM);tl.position.set(-1.9,.6,0);p.add(tl);p.scale.setScalar(s);p.traverse(o=>{if(o.isMesh)o.castShadow=true;});return p;}
const fi=plane(1.3);fi.rotation.x=-.32;flyer.add(fi);scene.add(flyer);
function boat(len,cab){const b=new THREE.Group(),hull=new THREE.Mesh(new THREE.BoxGeometry(len,len*.18,len*.32),M('#f4f4f2'));hull.position.y=len*.09;b.add(hull);
  const ck=new THREE.Mesh(new THREE.BoxGeometry(len*.5,len*.16,len*.24),M(cab));ck.position.set(-len*.08,len*.26,0);b.add(ck);
  if(len>4){for(let k=1;k<3;k++){const d=new THREE.Mesh(new THREE.BoxGeometry(len*(.62-k*.12),len*.08,len*.26),M('#ffffff'));d.position.set(-len*.05,len*(.22+k*.09),0);b.add(d);}
    const fn=new THREE.Mesh(new THREE.CylinderGeometry(len*.04,len*.05,len*.14,8),M('#d63a35'));fn.position.set(-len*.2,len*.52,0);b.add(fn);}
  b.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(b);return b;}
[[0,.3,'#2f6fb5',.02],[0,.7,'#d84b3a',.016],[0,.5,'#37946b',.013],[1,.4,'#f0b429',.02]].forEach(([ri,ph,c,sp])=>riverBoats.push({b:boat(1.1,c),r:RIVERS[ri],ph:ph*6.28,sp}));
ships=[boat(7,'#1f4f8a'),boat(6,'#9b2d2d'),boat(5,'#1f4f8a')];

/* ---------- trees ---------- */
function mergeG(items){const P=[],Nn=[],Cc=[],I=[];let base=0;items.forEach(([g,cf])=>{if(!g.attributes.normal)g.computeVertexNormals();const p=g.attributes.position,nm=g.attributes.normal;
    for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));Nn.push(nm.getX(i),nm.getY(i),nm.getZ(i));const c=cf(p.getY(i));Cc.push(c[0],c[1],c[2]);}
    const ix=g.index?g.index.array:[...Array(p.count).keys()];for(let i=0;i<ix.length;i++)I.push(ix[i]+base);base+=p.count;});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));g.setIndex(I);return g;}
function blobGeo(lobes,seg,sd){return mergeG(lobes.map(([ox,oy,oz,r])=>{const g=new THREE.SphereGeometry(r,seg,Math.round(seg*.7)),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+(vn(x*2.4+sd,z*2.4+y*1.9)-.5)*.32;p.setXYZ(i,x*k+ox,y*k*.9+oy,z*k+oz);}g.computeVertexNormals();
    return [g,y=>{const t=.58+.42*Math.min(1,Math.max(0,y/2.2));return [t,t,t*.97];}];}));}
const TG={round:blobGeo([[0,1.05,0,1]],12,3),clump:blobGeo([[0,1.15,0,.85],[.55,.85,.25,.6],[-.45,.8,-.3,.62]],9,9),
  pine:mergeG([[new THREE.ConeGeometry(.7,1.6,14).translate(0,1.1,0),y=>{const t=.66+.3*Math.min(1,y/2.4);return [t,t,t];}],[new THREE.ConeGeometry(.5,1.3,14).translate(0,1.9,0),y=>{const t=.74+.26*Math.min(1,y/2.6);return [t,t,t];}],[new THREE.CylinderGeometry(.07,.09,.5,8).translate(0,.25,0),()=>[.5,.38,.28]]]),
  palm:mergeG([[new THREE.CylinderGeometry(.05,.07,1.6,8).translate(0,.8,0),()=>[.62,.5,.38]],[new THREE.SphereGeometry(.42,12,8).scale(1,.45,1).translate(0,1.7,0),()=>[1,1,1]]])};
/* continuous forest canopy over the mountains */
const FD=new Float32Array(N*N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-W/2+i*CELL,z=-W/2+j*CELL,lu=landUse(x,z);FD[j*N+i]=(lu.t==='wild'&&lu.L>.86&&lu.e>22)?1:0;}
const FB=blur(FD,N,2);for(let k=0;k<N*N;k++)FB[k]=FD[k]?Math.max(FB[k],.5):0;
{const cc=canvas(2048),cx=cc.getContext('2d');cx.fillStyle='#22441f';cx.fillRect(0,0,2048,2048);const CG=['#2b5127','#335b2c','#3c6631','#284a24','#467137','#507a3d','#37602e','#5a8146','#41532c'];
 for(let k=0;k<80000;k++){const x=rnd()*2048,y=rnd()*2048,r=2.2+rnd()*4.6;cx.fillStyle=pick(CG);cx.beginPath();cx.arc(x,y,r,0,6.2832);cx.fill();cx.fillStyle='rgba(255,250,215,.12)';cx.beginPath();cx.arc(x-r*.3,y-r*.32,r*.55,0,6.2832);cx.fill();cx.fillStyle='rgba(0,18,0,.2)';cx.beginPath();cx.arc(x+r*.38,y+r*.42,r*.45,0,6.2832);cx.fill();}
 const cd=cx.getImageData(0,0,2048,2048).data,nc=canvas(2048),nx=nc.getContext('2d'),ni=nx.createImageData(2048,2048),L=(x,y)=>{const i=(((y+2048)%2048)*2048+((x+2048)%2048))*4;return (cd[i]+cd[i+1]+cd[i+2])/765;};
 for(let y=0;y<2048;y++)for(let x=0;x<2048;x++){const i=(y*2048+x)*4,dx=(L(x+1,y)-L(x-1,y))*6,dy=(L(x,y+1)-L(x,y-1))*6,l=Math.hypot(dx,dy,1);ni.data[i]=(-dx/l*.5+.5)*255;ni.data[i+1]=(dy/l*.5+.5)*255;ni.data[i+2]=(1/l*.5+.5)*255;ni.data[i+3]=255;}
 nx.putImageData(ni,0,0);const cn=new THREE.CanvasTexture(nc);cn.anisotropy=8;
 const ct=new THREE.CanvasTexture(cc);ct.anisotropy=8;const cg2=new THREE.PlaneGeometry(W,W,N-1,N-1).rotateX(-Math.PI/2),cp=cg2.attributes.position;
 for(let i=0;i<cp.count;i++){const x=cp.getX(i),z=cp.getZ(i),f=gs(FB,x,z),b=fbm(x*.6+9,z*.6-4,3);cp.setY(i,gs(EH,x,z)+(f<.25?-1.4:(.35+f*.7+b*.95*f)));}
 cg2.computeVertexNormals();if(EMB){const ix=cg2.index.array,keep=[];for(let i=0;i<ix.length;i+=3)if(FB[ix[i]]>.2||FB[ix[i+1]]>.2||FB[ix[i+2]]>.2)keep.push(ix[i],ix[i+1],ix[i+2]);cg2.setIndex(keep);}const can=new THREE.Mesh(cg2,new THREE.MeshStandardMaterial({map:ct,normalMap:cn,normalScale:new THREE.Vector2(1.6,1.6),roughness:.95,envMapIntensity:.35}));can.castShadow=true;can.receiveShadow=true;scene.add(can);}
const TL={round:[],clump:[],pine:[],palm:[]};
const LOWG=['#4a7f3a','#3f7436','#57893f','#5f8e45','#3a6b32','#527f3c'],MIDG=['#2f6a32','#3a7438','#2a5e2e','#456f38','#34622e'],HIGHG=['#264f30','#2e5a36','#22462c','#365f3e'],AUT=['#8f8a40','#a07a3a','#8a5a3a'];
const STEP=MOBILE?1.05:.82;
for(let gz=-W/2;gz<W/2;gz+=STEP)for(let gx=-W/2;gx<W/2;gx+=STEP){const x=gx+(rnd()-.5)*STEP*1.2,z=gz+(rnd()-.5)*STEP*1.2,lu=landUse(x,z);
  let p=0,yo=0;if(lu.t==='wild'){const f=gs(FB,x,z);if(f>.25){p=f<.8?.55:.2;yo=f<.8?0:(.35+f*.7+fbm(x*.6+9,z*.6-4,3)*.95*f)-.9;}else{p=.35;const cl=fbm(x*.13+50,z*.13,3);p*=cl>.42?1:.35;if(lu.L<.9)p*=.15;}}
  else if(lu.t==='park')p=.3;else if(lu.t==='campus')p=.03;else if(lu.t==='plaza')p=Math.hypot(x-lu.zo.x,z-lu.zo.z)>lu.zo.r*.7?.3:0;else if(lu.t==='bank')p=.04;
  if(rnd()>p)continue;const y=Hh(x,z)-.12+yo,e=lu.e,tp=(e>650&&rnd()<.35)?'pine':rnd()<.55?'round':'clump';
  const pal=tp==='pine'?HIGHG:e>350?MIDG:LOWG,c=rnd()<.02&&e>150?pick(AUT):pick(pal),s=(tp==='pine'?.34:.28)+rnd()*.24+(e>22?.22:.03);
  TL[tp].push([x,y,z,s,s*(.9+rnd()*.45),s,rnd()*6.28,c]);}
streetTrees.forEach(([x,z])=>TL.round.push([x,Hh(x,z)-.1,z,.2,.24,.2,rnd()*6,pick(LOWG)]));
extraTrees.forEach(([x,z,sz,k])=>{if(k==='palm')TL.palm.push([x,Hh(x,z)-.1,z,.28,.55,.28,rnd()*6,'#4f9a3e']);else TL.round.push([x,Hh(x,z)-.1,z,sz,sz*1.15,sz,rnd()*6,pick(LOWG)]);});
const tM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,envMapIntensity:.4});
Object.keys(TL).forEach(k=>{const l=TL[k];if(!l.length)return;const im=new THREE.InstancedMesh(TG[k],tM,l.length);
  l.forEach((b,i)=>{qq.setFromAxisAngle(YAX,b[6]);m4.compose(pv.set(b[0],b[1],b[2]),qq,sv.set(b[3],b[4],b[5]));im.setMatrixAt(i,m4);im.setColorAt(i,col.set(b[7]));});
  im.castShadow=true;im.receiveShadow=true;scene.add(im);});
flush();
if(carData.length){const RB=THREE.RoundedBoxGeometry,n=carData.length,one=()=>[1,1,1];
 const body=mergeG([[new RB(.34,.075,.16,2,.028).translate(0,.06,0),one],[new RB(.3,.03,.165,1,.012).translate(0,.035,0),()=>[.55,.55,.55]]]);
 const cabin=new RB(.18,.075,.14,2,.026).translate(-.025,.125,0);
 const wheel=mergeG([[-.1,.077],[.1,.077],[-.1,-.077],[.1,-.077]].map(([x,z])=>[new THREE.CylinderGeometry(.032,.032,.022,12).rotateX(Math.PI/2).translate(x,.032,z),()=>[.08,.08,.09]]));
 const head=mergeG([.05,-.05].map(z=>[new THREE.BoxGeometry(.012,.02,.035).translate(.171,.07,z),()=>[1,.96,.85]]));
 const tail=mergeG([.055,-.055].map(z=>[new THREE.BoxGeometry(.012,.018,.03).translate(-.171,.07,z),()=>[1,.12,.08]]));
 carB=new THREE.InstancedMesh(body,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.45,envMapIntensity:.9}),n);
 carC=new THREE.InstancedMesh(cabin,new THREE.MeshStandardMaterial({color:'#1c2731',roughness:.12,metalness:.6,envMapIntensity:1.2}),n);
 const wM=new THREE.InstancedMesh(wheel,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8}),n);
 const hM=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}),tM=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
 const hI=new THREE.InstancedMesh(head,hM,n),tI=new THREE.InstancedMesh(tail,tM,n);carGlow=[[hM,.5,2.6],[tM,.45,2.2]];
 const CC=['#f2c230','#f2c230','#f4f4f2','#1e1f22','#b9bcc0','#2a3a55','#8e1e1e','#e6e6e6','#5c6670','#f4f4f2','#3d4a3e','#c9ccd0'];
 carData.forEach((c,i)=>carB.setColorAt(i,col.set(CC[(i*7)%CC.length])));
 carB.castShadow=true;carParts=[carB,carC,wM,hI,tI];scene.add(...carParts);}
/* ---------- pedestrians: sidewalks, campus lawns, plazas ---------- */
{const add=(x,z,dx,dz,L,sp,kind)=>walkers.push([x,z,dx,dz,L,rnd()*L,sp,kind,rnd()*6.28]);
 for(const [x,z,dx,dz,L] of walkPaths){const n=1+(rnd()*2.2|0);for(let i=0;i<n;i++)add(x,z,dx*(rnd()<.5?1:-1),dz,L,.05+rnd()*.07,0);}
 ZONES.forEach(zn=>{const n=zn.kind==='policy'?16:zn.kind==='park'||zn.kind==='plaza'?10:zn.kind==='campus'?18:5;for(let i=0;i<n;i++){const r=zn.r*(.35+rnd()*.5),a=rnd()*6.28;walkers.push([zn.x,zn.z,r,a,0,0,(.04+rnd()*.05)/r*(rnd()<.5?1:-1),1,rnd()*6.28]);}});
 if(walkers.length>2600)walkers.length=2600;
 const n=walkers.length,bodyG=new THREE.CapsuleGeometry(.02,.055,3,8).translate(0,.048,0),headG=new THREE.SphereGeometry(.017,10,8).translate(0,.1,0);
 walkB=new THREE.InstancedMesh(bodyG,new THREE.MeshStandardMaterial({roughness:.8}),n);walkH=new THREE.InstancedMesh(headG,new THREE.MeshStandardMaterial({roughness:.7}),n);
 const CL=['#f4f4f2','#2a3a55','#1e1f22','#c9405e','#4a6f94','#e6dcb8','#557f68','#9aa3ad','#e3cfc6','#3a6ea5','#d8d2c4','#7a1f28'],SK=['#e8c4a0','#d9b38c','#c69a76','#f0d2b4'];
 for(let i=0;i<n;i++){walkB.setColorAt(i,col.set(CL[(i*5)%CL.length]));walkH.setColorAt(i,col.set(SK[i%SK.length]));}
 walkB.castShadow=true;scene.add(walkB,walkH);}

/* ---------- clouds ---------- */
{const cc=canvas(128),cx=cc.getContext('2d'),gr=cx.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.45,'rgba(255,255,255,.6)');gr.addColorStop(1,'rgba(255,255,255,0)');cx.fillStyle=gr;cx.fillRect(0,0,128,128);
 const ct=new THREE.CanvasTexture(cc);
 [[-130,42,-80],[-150,36,40],[130,46,-100],[150,38,60],[20,52,-170],[-50,44,160],[80,40,160],[-200,50,-10],[200,48,-20]].forEach(([x,y,z])=>{const c=new THREE.Group();
  for(let i=0;i<16;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:ct,transparent:true,depthWrite:false,opacity:.42+rnd()*.35,color:new THREE.Color().setHSL(.58,.12,.9+rnd()*.1)}));const sz=12+rnd()*16;sp.scale.set(sz,sz*.55,1);sp.position.set((rnd()-.5)*30,(rnd()-.35)*3.5,(rnd()-.5)*14);c.add(sp);}
  c.position.set(x,y,z);clouds.add(c);});cloudScene.add(clouds);}

scene.traverse(o=>{if(!o.material)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{['map','emissiveMap'].forEach(k=>{if(m[k]&&m[k].colorSpace!==THREE.SRGBColorSpace){m[k].colorSpace=THREE.SRGBColorSpace;m[k].needsUpdate=true;}});if(m.isMeshStandardMaterial&&m.envMapIntensity===1)m.envMapIntensity=m.metalness>.25?.85:.4;m.needsUpdate=true;});});
/* ---------- pins ---------- */
const pinsEl=pinsRoot;
const addPin=(name,x,z,kind,yo)=>{const el=document.createElement('button');el.type='button';el.className='tpi-pin'+(kind==='mark'?' tpi-mark':'');el.textContent=name;
  const pos=new THREE.Vector3(x,Math.max(Hh(x,z),1)+(yo||3.2),z),go=()=>flyTo(new THREE.Vector3(x,Math.max(Hh(x,z),0),z),kind==='mark'?32:55),
    info={name,type:kind==='mark'?'landmark':'district',position:{x,y:Math.max(Hh(x,z),0),z},top:pos.y};
  el.addEventListener('click',()=>{if(typeof opts.onSelect==='function'&&opts.onSelect(info)===false)return;go();});pinsEl.appendChild(el);pins.push({el,pos,name,info,go});};
[['北投',-47,-40],['士林',-27,-20],['內湖',20,5],['中山',-18,18],['大同',-37,17],['松山',2,24],['南港',36,34],['信義',10,49],['大安',-12,52],['中正',-30,50],['萬華',-49,45],['文山',2,84]].forEach(([n,x,z])=>addPin(n,x,z,'dist',4));
addPin('陽明山',-10,-70.7,'mark',4);addPin('台北 101',L101.x,L101.z,'mark',45);
[['圓山大飯店',7],['國父紀念館',3.8],['中正紀念堂',6],['總統府',8],['台北車站',4.2],['台北小巨蛋',3.8],['龍山寺',3.8],['台北大巨蛋',4.4],['南港展覽館',4.4],['國立臺灣大學',8],['陶朱隱園',9],['美麗華',10.5],['兒童新樂園',8.2],['台北市立動物園',2],['大安森林公園',2]].forEach(([n,yo])=>{const z=ZM[n];addPin(n,z.x,z.z,'mark',yo);});
addPin('松山機場',AP.x,AP.z+4.3,'mark',2);
{let pno=0;ZONES.filter(z=>z.kind==='policy').forEach(z=>{const t=z.theme;pno++;const el=document.createElement('button');el.type='button';
  el.className='tpi-pin tpi-policy'+(t.kind==='record'?' tpi-rec':'');el.innerHTML='<b>'+String(t.no||pno).padStart(2,'0')+'</b><span>'+String(t.name).replace(/^政績・/,'')+'</span>';
  el.setAttribute('aria-label',(t.kind==='record'?'任內政績 ':'政見 ')+t.name);
  const gy=Math.max(Hh(z.x,z.z),0),pos=new THREE.Vector3(z.x,Math.max(gy,1)+6.5,z.z),go=()=>flyTo(new THREE.Vector3(z.x,gy,z.z),30),
    info={name:t.name,type:'policy',id:t.id,theme:t,district:z.home,position:{x:z.x,y:gy,z:z.z},radius:z.r,top:gy+(z.topH||1.8)+.4};
  el.addEventListener('click',()=>{if(typeof opts.onSelect==='function'&&opts.onSelect(info)===false)return;go();});pinsEl.appendChild(el);pins.push({el,pos,name:t.name,info,go,id:t.id});});}addPin('內湖科技園區',11.6,4.4,'mark',3);{const [x,z]=geo(121.509,25.056);addPin('大稻埕',x-1.5,z,'mark',3);}{const [x,z]=geo(121.588,24.968);addPin('貓空',x,z,'mark',3);}
}

/* ---------- interaction ---------- */
function flyTo(tgt,dist){const dir=camera.position.clone().sub(controls.target);dir.y=0;if(dir.lengthSq()<1)dir.set(0,0,1);dir.normalize();
  if(opts.focusOffset){const k=opts.focusOffset();if(k){tgt=tgt.clone().addScaledVector(dir,dist*k);}}
  fly={t:0,p0:camera.position.clone(),t0:controls.target.clone(),p1:tgt.clone().add(dir.multiplyScalar(dist*.75)).add(new THREE.Vector3(0,dist*.65,0)),t1:tgt};setRotate(false);}
const bRot=q('rotate'),bNight=q('night'),bMarks=q('marks');
function setRotate(on){controls.autoRotate=!!on;bRot.setAttribute('aria-pressed',!!on);}
bRot.onclick=()=>setRotate(!controls.autoRotate);
function setLandmarkLabels(on){bMarks.setAttribute('aria-pressed',!!on);pinsRoot.classList.toggle('tpi-nomarks',!on);}
bMarks.onclick=()=>setLandmarkLabels(bMarks.getAttribute('aria-pressed')!=='true');
function resetView(){const h=homeView();fly={t:0,p0:camera.position.clone(),t0:controls.target.clone(),p1:h.pos,t1:h.tgt};}
q('reset').onclick=resetView;
controls.addEventListener('start',()=>{fly=null;setRotate(false);});
let night=false;
function setNight(v){night=!!v;bNight.setAttribute('aria-pressed',night);root.classList.toggle('tpi-night',night);
  scene.fog.color.copy(night?NIGHTFOG:DAYFOG);sky.visible=!night;scene.background=night?new THREE.Color('#0a1530'):null;if(bloomPass){bloomPass.strength=night?.85:.12;bloomPass.threshold=night?.5:.9;bloomPass.radius=night?.6:.45;}scene.environment=night?null:envTex;hemi.intensity=(night?.18:.3)*Math.PI;hemi.color.set(night?'#7f98d8':'#dfe9f5');
  sun.intensity=(night?.25:2.3)*Math.PI;sun.color.set(night?'#9fb6ff':'#fff0d6');waterMat.color.set(night?'#0e2a44':'#2d6a86');floorM.color.set(night?'#081a2c':'#173f57');
  const NB=opts.nightBoost||1;nightMats.forEach(n=>n.mat.emissiveIntensity=night?n.n*NB:n.d);carGlow.forEach(([m,d,n2])=>m.color.setScalar(night?n2:d));}
bNight.onclick=()=>setNight(!night);
const onResize=()=>{const w=CW(),h=CH();camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);if(composer)composer.setSize(w,h);};
const ro=EMB?null:typeof ResizeObserver!=='undefined'?new ResizeObserver(onResize):null;if(ro)ro.observe(root);else if(!EMB)addEventListener('resize',onResize);
/* ---------- post: ambient occlusion, bloom, display transform ---------- */
const cloudScene=new THREE.Scene();
let composer=null,saoPass=null,bloomPass=null,HQ=opts.quality?opts.quality==='high':!MOBILE;
const OUT={uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float d=length(vUv-0.5);c*=1.0-0.2*smoothstep(0.42,0.85,d);gl_FragColor=vec4(c,1.0);}'};
try{if(opts.postprocessing!==false&&!EMB){const w=CW(),h=CH(),pr=renderer.getPixelRatio();
  const rt=new THREE.WebGLRenderTarget(w*pr,h*pr,{type:THREE.HalfFloatType,samples:4});composer=new THREE.EffectComposer(renderer,rt);composer.setPixelRatio(pr);composer.setSize(w,h);
  saoPass=new THREE.SSAOPass(scene,camera,w*pr,h*pr);saoPass.beautyRenderTarget.dispose();saoPass.beautyRenderTarget=new THREE.WebGLRenderTarget(w*pr,h*pr,{type:THREE.HalfFloatType,samples:4});
  saoPass.kernelRadius=2.5;saoPass.minDistance=.00008;saoPass.maxDistance=.008;composer.addPass(saoPass);
  const cpass=new THREE.RenderPass(cloudScene,camera);cpass.clear=false;composer.addPass(cpass);
  bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(w,h),.12,.45,.9);composer.addPass(bloomPass);composer.addPass(new THREE.ShaderPass(OUT));composer.addPass(new THREE.OutputPass());}}catch(err){composer=null;}
const bHQ=q('hq');if(!composer)bHQ.hidden=true;bHQ.setAttribute('aria-pressed',HQ);bHQ.onclick=()=>{HQ=!HQ;bHQ.setAttribute('aria-pressed',HQ);};
if(matchMedia('(prefers-reduced-motion: reduce)').matches)setRotate(false);

const clock=new THREE.Clock(),v3=new THREE.Vector3();let tA=0;const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function animate(dt){tA+=dt;
  if(fly){fly.t=Math.min(1,fly.t+dt/1.3);const e=ease(fly.t);camera.position.lerpVectors(fly.p0,fly.p1,e);controls.target.lerpVectors(fly.t0,fly.t1,e);if(fly.t>=1)fly=null;}
  controls.update();wn.offset.set(tA*.004,tA*.0025);
  wheels.forEach((w,i)=>w.rotation.z+=dt*(i?.12:-.1));
  riverBoats.forEach(o=>{const a=tA*o.sp+o.ph,tt=.5+.42*Math.sin(a),p=o.r.c.getPointAt(tt),T=o.r.c.getTangentAt(tt),dr=Math.cos(a)>=0?1:-1;o.b.position.set(p.x,.05,p.z);o.b.rotation.y=Math.atan2(-T.z*dr,T.x*dr);});
  ships.forEach((s,i)=>{const sg=i===1?-1:1,a=tA*.01*sg+i*2.1,rx=108+i*7,rz=132+i*6;s.position.set(Math.cos(a)*rx,.05,Math.sin(a)*rz);s.rotation.y=Math.atan2(-Math.cos(a)*rz*sg,-Math.sin(a)*rx*sg);});
  const fa=tA*.11;flyer.position.set(Math.cos(fa)*95,50+Math.sin(tA*.4)*2,Math.sin(fa)*120);flyer.rotation.y=Math.atan2(-Math.cos(fa)*120,-Math.sin(fa)*95);
  if(lander){const T=(tA%28)/28;let u,h=0;if(T<.5){const k=T/.5;u=-58+48.5*k;h=8.5*Math.pow(1-k,1.2);}else{const k=Math.min(1,(T-.5)/.28);u=-9.5+11.5*(1-(1-k)*(1-k));}
    lander.visible=T<.8;const x=AP.x+u*AP.c,z=AP.z+u*AP.s;lander.position.set(x,Math.max(Hh(x,z),1.25)+.16+h,z);lander.rotation.z=h>0?.06:0;}
  if(flag){const a=flag.geometry.attributes.position,b=flag.userData.base;for(let i=0;i<a.count;i++){const x=b[i*3];a.array[i*3+2]=Math.sin(x*2.4-tA*5)*.2*(x/3);}a.needsUpdate=true;flag.geometry.computeVertexNormals();}
  if(carParts){carData.forEach((c,i)=>{const d=(c[5]+tA*c[6])%c[4];qq.setFromAxisAngle(YAX,Math.atan2(-c[3],c[2]));m4.compose(pv.set(c[0]+c[2]*d,c[7]-.03,c[1]+c[3]*d),qq,sv.setScalar(opts.carScale||1));for(const m of carParts)m.setMatrixAt(i,m4);});for(const m of carParts)m.instanceMatrix.needsUpdate=true;}
  if(walkB){for(let i=0;i<walkers.length;i++){const w=walkers[i];let x,z,yaw;
    if(w[7]===0){const d=((w[5]+tA*w[6])%w[4]+w[4])%w[4];x=w[0]+w[2]*d;z=w[1]+w[3]*d;yaw=Math.atan2(-w[3],w[2]);}
    else{const a=w[3]+tA*w[6];x=w[0]+Math.cos(a)*w[2];z=w[1]+Math.sin(a)*w[2];yaw=Math.atan2(Math.cos(a)*Math.sign(w[6]),-Math.sin(a)*Math.sign(w[6]))-Math.PI/2;}
    const y=Hh(x,z)-.02+Math.abs(Math.sin(tA*9+w[8]))*.008;qq.setFromAxisAngle(YAX,yaw);m4.compose(pv.set(x,y,z),qq,sv.setScalar(opts.walkerScale||1));walkB.setMatrixAt(i,m4);walkH.setMatrixAt(i,m4);}
   walkB.instanceMatrix.needsUpdate=walkH.instanceMatrix.needsUpdate=true;}
  for(const b of bulbs){for(let i=0;i<b.n;i++){if(night)col.setHSL(((i/b.n)*2+tA*.12)%1,1,.5);else col.setRGB(.9,.88,.82);b.im.setColorAt(i,col);}b.im.instanceColor.needsUpdate=true;b.mat.color.setScalar(night?1.35:.7);}
  clouds.rotation.y+=dt*.005;}
function loop(){if(disposed)return;raf=requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);animate(dt);
  if(HQ&&composer)composer.render();else{renderer.render(scene,camera);renderer.autoClear=false;renderer.render(cloudScene,camera);renderer.autoClear=true;}
  const w=CW(),h=CH();
  pins.forEach(p=>{if(p.el.classList.contains('tpi-mark')&&pinsRoot.classList.contains('tpi-nomarks'))return;
    v3.copy(p.pos).project(camera);const vis=v3.z<1&&Math.abs(v3.x)<1.15&&Math.abs(v3.y)<1.15;p.el.hidden=!vis;
    if(vis){const d=camera.position.distanceTo(p.pos),sc=Math.max(.7,Math.min(1.12,170/d));p.el.style.transform=`translate(${(v3.x*.5+.5)*w}px,${(-v3.y*.5+.5)*h}px) translate(-50%,-100%) scale(${sc})`;p.el.style.zIndex=Math.round((1-v3.z)*1e5);}});}
if(opts.autoRotate===false)setRotate(false);if(opts.night)setNight(true);if(opts.landmarkLabels===false)setLandmarkLabels(false);
if(EMB){build();ready=true;}else raf=requestAnimationFrame(()=>setTimeout(()=>{if(disposed)return;build();const ld=root.querySelector('.tpi-loading');if(ld)ld.remove();ready=true;loop();if(typeof opts.onReady==='function')opts.onReady(api);},30));
let embedRoot=null;
if(EMB){embedRoot=new THREE.Group();embedRoot.name='taipei-real-city';const skip=new Set([hemi,sun,sky,floor,water,flyer,...ships]);
  [...scene.children].forEach(o=>{if(!skip.has(o))embedRoot.add(o);});
  let mnx=1e9,mxx=-1e9,mnz=1e9,mxz=-1e9;Object.values(DIST).forEach(rs=>rs.forEach(r=>r.forEach(([x,z])=>{mnx=Math.min(mnx,x);mxx=Math.max(mxx,x);mnz=Math.min(mnz,z);mxz=Math.max(mxz,z);})));
  embedRoot.userData.landBounds={minX:mnx,maxX:mxx,minZ:mnz,maxZ:mxz};}
const api={
  /** 嵌入模式：城市群組（城市單位，海平面 y=0）與逐幀更新 */
  root:embedRoot,update:dt=>animate(Math.min(dt,.05)),
  /** 嵌入模式：判斷城市座標點是否為陸地 */
  isLand:(x,z)=>gs(EL,x,z)>.5,
  /** 飛到指定行政區或地標（名稱需與標籤一致） */
  flyTo(name){const p=pins.find(p=>p.name===name);if(p){p.go();return true;}return false;},
  resetView,setNight,setAutoRotate:setRotate,setLandmarkLabels,
  setQuality(q2){HQ=q2==='high'&&!!composer;bHQ.setAttribute('aria-pressed',HQ);},
  /** 回傳所有可選取的行政區與地標 */
  getPlaces(){return pins.map(p=>p.info);},
  /** 飛到指定政策主題（theme.id） */
  focusPolicy(id){const p=pins.find(p=>p.id===id);if(p){p.go();return true;}return false;},
  /** 標示目前選取的政策主題標籤 */
  setActivePolicy(id){pins.forEach(p=>p.el.classList.toggle('is-active',!!id&&p.id===id));},
  isReady(){return ready;},
  three:{THREE,scene,camera,renderer,controls},
  destroy(){disposed=true;cancelAnimationFrame(raf);if(ro)ro.disconnect();else removeEventListener('resize',onResize);controls.dispose();
    scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{Object.values(m).forEach(v=>{if(v&&v.isTexture)v.dispose();});m.dispose();});});
    cloudScene.traverse(o=>{if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose();}if(o.geometry)o.geometry.dispose();});
    if(composer){composer.passes.forEach(p=>{if(p.dispose)p.dispose();});if(composer.dispose)composer.dispose();}
    if(envTex)envTex.dispose();renderer.renderLists.dispose();renderer.dispose();renderer.forceContextLoss();root.remove();}
};
return api;
}
export default createTaipeiIsland;
