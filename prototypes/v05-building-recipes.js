// Structural recipes, not colour/floor-count variants. All geometry is local
// to the site. Fingerprints deliberately ignore paint, windows and storeys.
const M=(type,x,z,w,d,b,h,rot=0)=>({type,x,z,w,d,b,h,rot});
const B=(x,z,w,d,b,h,rot=0)=>M('box',x,z,w,d,b,h,rot);
export const ARCHITECTURE_FAMILIES=[
 ['courtyard','圍合中庭街廓',()=>[B(-.34,0,.25,.88,0,.70),B(.34,0,.25,.88,0,1),B(0,-.33,.60,.24,0,.48)]],
 ['ell-corner','L 型轉角住宅',()=>[B(-.27,0,.40,.90,0,.80),B(.12,-.28,.73,.34,0,1)]],
 ['h-court','雙翼空中廊橋',()=>[B(-.30,0,.28,.86,0,1),B(.30,0,.28,.70,0,.73),B(0,0,.48,.20,.28,.14)]],
 ['terrace-pyramid','花園階梯退台',()=>[B(0,0,.95,.9,0,.22),B(-.05,-.04,.74,.72,.22,.22),B(-.1,-.08,.53,.54,.44,.22),B(-.13,-.11,.30,.33,.66,.28)]],
 ['twist-stack','旋轉錯位量體',()=>[B(0,0,.8,.72,0,.22),B(-.08,0,.7,.58,.22,.24,.16),B(.04,-.08,.6,.58,.46,.24,-.2),B(.04,.02,.48,.48,.7,.24,.26)]],
 ['oval-glass','橢圓帷幕塔樓',()=>[B(0,0,.92,.85,0,.14),M('cyl',0,-.04,.64,.82,.14,.83)]],
 ['twin-cylinders','圓筒雙塔與連橋',()=>[M('cyl',-.25,-.12,.40,.48,0,1),M('cyl',.24,.1,.35,.43,0,.74),B(0,0,.38,.17,.32,.11)]],
 ['octagonal','八角塔冠住宅',()=>[B(0,0,.9,.86,0,.15),M('oct',0,0,.62,.72,.15,.68),M('pyramid',0,0,.69,.79,.83,.22)]],
 ['triangular','三角稜線辦公樓',()=>[B(0,.05,.88,.82,0,.12),M('tri',0,-.04,.82,.77,.12,.88)]],
 ['spire','斜撐尖塔辦公樓',()=>[B(0,0,.9,.76,0,.12),B(-.08,0,.46,.55,.12,.68),M('pyramid',-.08,0,.48,.57,.80,.32),B(.3,.16,.22,.35,0,.37)]],
 ['sloped-crown','斜冠玻璃大樓',()=>[B(0,0,.92,.84,0,.14),B(-.1,-.08,.56,.61,.14,.63),M('wedge',-.1,-.08,.56,.61,.77,.22),B(.3,.14,.24,.35,0,.31)]],
 ['cantilever','懸挑盒體展館',()=>[B(-.24,-.1,.25,.64,0,.43),B(.15,.18,.72,.42,.27,.25),B(-.05,-.2,.88,.39,.52,.24),B(.12,.05,.46,.51,.76,.2)]],
 ['barrel-market','拱頂玻璃市場',()=>[B(0,0,.93,.82,0,.28),M('arch',0,0,.93,.82,.28,.39),B(-.38,0,.15,.90,0,.44),B(.38,0,.15,.90,0,.44)]],
 ['sawtooth','鋸齒天窗工坊',()=>[B(0,0,.94,.86,0,.4),...[-.31,0,.31].map(x=>M('wedge',x,0,.31,.87,.4,.23))]],
 ['dome','穹頂公共展館',()=>[M('cyl',0,0,.80,.84,0,.3),M('dome',0,0,.84,.88,.3,.43),B(.34,.26,.24,.32,0,.24)]],
 ['fan-theatre','扇形展演館',()=>[B(-.25,0,.29,.8,0,.48,-.35),B(0,-.05,.3,.90,0,.62),B(.25,0,.29,.8,0,.48,.35),B(0,.36,.82,.20,0,.18)]],
 ['clock-hall','鐘塔市民會館',()=>[B(0,.15,.92,.48,0,.30),M('oct',-.28,-.12,.30,.34,0,.85),M('pyramid',-.28,-.12,.35,.39,.85,.25),B(.29,-.18,.24,.36,0,.42)]],
 ['oval-arena','橢圓開放運動場',()=>[M('ring',0,0,.94,.84,0,.32),B(-.4,-.04,.16,.64,.22,.13),B(.4,-.04,.16,.64,.22,.13),B(0,-.4,.62,.14,.19,.17)]],
 ['garden-village','庭園坡頂聚落',()=>[B(-.26,-.15,.30,.44,0,.36),M('gable',-.26,-.15,.35,.48,.36,.22),B(.22,-.2,.34,.35,0,.54),M('gable',.22,-.2,.39,.4,.54,.22),B(.1,.27,.45,.28,0,.28),M('gable',.1,.27,.49,.32,.28,.18)]],
 ['tiered-pavilion','層簷文化館',()=>[B(0,0,.8,.65,0,.28),M('pyramid',0,0,.98,.82,.28,.25),B(0,-.04,.48,.42,.5,.20),M('pyramid',0,-.04,.64,.57,.70,.22)]],
 ['wedge-hotel','楔形轉角旅館',()=>[M('tri',0,0,.90,.86,0,.65),B(-.18,-.2,.46,.37,.65,.25),M('wedge',-.18,-.2,.46,.37,.90,.16)]],
 ['split-atrium','錯層玻璃中庭',()=>[B(-.3,-.1,.27,.73,0,1),B(.26,.10,.34,.75,0,.70),B(0,0,.38,.55,0,.38),M('arch',0,0,.42,.58,.38,.20)]],
 ['hex-stack','六角退台住宅',()=>[M('hex',0,.04,.91,.87,0,.26),M('hex',-.12,-.02,.70,.70,.26,.28),M('hex',.02,-.08,.48,.53,.54,.36)]],
 ['butterfly','蝶翼雨棚校舍',()=>[B(-.25,-.06,.32,.74,0,.43),B(.25,-.06,.32,.74,0,.56),M('wedge',-.24,-.06,.43,.80,.43,.23),M('wedge',.24,-.06,.43,.80,.56,.23,Math.PI)]],
 ['ribbon-offices','帶狀連通辦公群',()=>[B(-.25,-.18,.34,.57,0,.92),B(.18,.18,.35,.59,0,.64),B(.05,-.3,.67,.18,.45,.15),B(-.04,.3,.58,.18,.14,.16)]],
 ['conservatory','溫室與公共花廊',()=>[M('arch',-.13,0,.62,.90,0,.48),B(.31,-.2,.25,.36,0,.31),M('gable',.31,-.2,.3,.41,.31,.15)]],
 ['arc-row','弧形沿街建築',()=>[-2,-1,0,1,2].map(i=>B(i*.16,-.18+i*i*.055,.20,.46,0,.42+(i+2)*.08,i*.20))],
 ['radial-wings','放射翼文化中心',()=>[-1,0,1].map(i=>B(i*.23,Math.abs(i)*.12,.27,.79,0,.65-Math.abs(i)*.12,i*.58))],
 ['roof-hall','大坡頂公共學苑',()=>[B(0,0,.87,.72,0,.34),M('gable',0,0,.98,.84,.34,.42),B(-.34,.30,.22,.28,0,.24)]],
 ['modular-stack','堆疊立體社區',()=>[B(-.25,-.24,.43,.43,0,.48),B(.24,.17,.45,.49,0,.35),B(.12,-.2,.51,.46,.48,.31),B(-.2,.2,.47,.48,.35,.33),B(-.03,-.02,.44,.46,.79,.23)]],
 ['colonnade','列柱城市圖書館',()=>[B(0,-.17,.9,.43,0,.44),B(-.36,.12,.18,.47,0,.28),B(.36,.12,.18,.47,0,.28),B(0,.32,.82,.13,.27,.11)]],
 ['cascade-hotel','瀑布式退台旅館',()=>[B(-.28,0,.35,.84,0,1),B(-.02,0,.25,.84,0,.74),B(.19,0,.20,.84,0,.48),B(.36,0,.14,.84,0,.23)]],
];

export function hash(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
function inside(m,x,y,z){const cs=Math.cos(m.rot),sn=Math.sin(m.rot),dx=x-m.x,dz=z-m.z;const xx=(dx*cs-dz*sn)/(m.w/2),zz=(dx*sn+dz*cs)/(m.d/2),u=(y-m.b)/m.h;if(u<0||u>1||Math.abs(xx)>1||Math.abs(zz)>1)return false;
 if(['cyl','oct','hex'].includes(m.type))return xx*xx+zz*zz<=1;
 if(m.type==='tri')return Math.abs(xx)<(1-zz)/2;
 if(m.type==='dome')return xx*xx+zz*zz+u*u<=1;
 if(m.type==='arch')return xx*xx+u*u<=1;
 if(m.type==='gable')return u<=1-Math.abs(xx);
 if(m.type==='wedge')return u<=(1+xx)/2;
 if(m.type==='pyramid')return Math.max(Math.abs(xx),Math.abs(zz))<=1-u;
 if(m.type==='ring')return xx*xx+zz*zz<=1&&xx*xx+zz*zz>=.48;
 return true;
}
function occupancy(masses){const maxH=Math.max(...masses.map(m=>m.b+m.h)),options=[];
 for(let turn=0;turn<4;turn++){const a=new Uint32Array(54);let k=0;for(const fy of [.22,.60,.96])for(let iz=0;iz<24;iz++)for(let ix=0;ix<24;ix++,k++){
 const x=(ix+.5)/24*1.24-.62,z=(iz+.5)/24*1.24-.62,theta=turn*Math.PI/2,xx=x*Math.cos(theta)-z*Math.sin(theta),zz=x*Math.sin(theta)+z*Math.cos(theta);
 if(masses.some(m=>inside(m,xx,fy*maxH,zz)))a[k>>>5]|=1<<(k&31);
 }options.push(a);}
 options.sort((a,b)=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;});return options[0];
}
function pop(n){n-=(n>>>1)&0x55555555;n=(n&0x33333333)+((n>>>2)&0x33333333);return (((n+(n>>>4))&0x0f0f0f0f)*0x01010101)>>>24;}
export function similarity(a,b){let inter=0,union=0;for(let i=0;i<a.length;i++){inter+=pop(a[i]&b[i]);union+=pop(a[i]|b[i]);}return union?inter/union:1;}
export function makeRecipe(family,variant){let masses=ARCHITECTURE_FAMILIES[family][2]().map(m=>({...m}));
 if(variant){const mode=(variant-1)%4,cycle=Math.floor((variant-1)/4),extra=.018*cycle;
  if(mode===0){masses=masses.map(m=>({...m,x:m.x*.64+.14,w:m.w*.64}));masses.push(B(-.34,-.08,.24,.66+extra,0,.39));}
  if(mode===1){masses=masses.map(m=>({...m,z:m.z*.61-.15,d:m.d*.61}));masses.push(M('cyl',-.24,.31,.32+extra,.32,0,.36),B(.21,.29,.36,.26,0,.28));}
  if(mode===2){masses=masses.map(m=>({...m,x:m.x*.67-.15,z:m.z*.78,w:m.w*.67,d:m.d*.78}));masses.push(M('hex',.32,-.22,.28,.33+extra,0,.60),B(.31,.22,.28,.37,0,.22));}
  if(mode===3){masses=masses.map(m=>({...m,z:m.z*.65+.13,d:m.d*.65}));masses.push(B(-.27,-.33,.32,.25,0,.28),M('gable',-.27,-.33,.37,.30,.28,.22),B(.25,-.32,.24,.3,0,.67));}
 }
 const voxels=occupancy(masses),signature=Array.from(voxels,n=>n.toString(16).padStart(8,'0')).join('');return {family,variant,masses,voxels,signature,name:ARCHITECTURE_FAMILIES[family][1],key:ARCHITECTURE_FAMILIES[family][0]};
}
const REGISTRY={used:new Set(),placed:[],families:new Map(),maxNearSimilarity:0};
export function allocateRecipe(parcel,candidates=null){const allowed=candidates||ARCHITECTURE_FAMILIES.map((_,i)=>i),neighbors=REGISTRY.placed.filter(r=>Math.hypot(r.x-parcel.x,r.z-parcel.z)<85);let best=null;
 const shift=hash(parcel.id)%allowed.length;
 search: for(let pass=0;pass<12;pass++)for(let j=0;j<allowed.length;j++){
  const family=allowed[(j+shift)%allowed.length],variant=(REGISTRY.families.get(family)||0)+pass,r=makeRecipe(family,variant);if(REGISTRY.used.has(r.signature)||neighbors.some(n=>n.family===family))continue;
  const near=neighbors.reduce((v,n)=>Math.max(v,similarity(r.voxels,n.voxels)),0);if(!best||near<best.near)best={r,near};if(near<=.86){best={r,near};break search;}
 }
 if(!best)throw Error('No non-repeating architecture recipe for '+parcel.id);
 if(best.near>.94)throw Error('Neighbor silhouettes too similar: '+parcel.id+' '+best.near);
 const r=best.r;REGISTRY.used.add(r.signature);REGISTRY.families.set(r.family,Math.max(REGISTRY.families.get(r.family)||0,r.variant+1));REGISTRY.maxNearSimilarity=Math.max(REGISTRY.maxNearSimilarity,best.near);REGISTRY.placed.push({...r,x:parcel.x,z:parcel.z,id:parcel.id});return {...r,nearSimilarity:best.near};
}
export function architectureAudit(){return {buildings:REGISTRY.placed.length,uniqueSilhouettes:REGISTRY.used.size,familyCount:REGISTRY.families.size,maxNeighborSimilarity:REGISTRY.maxNearSimilarity,entries:REGISTRY.placed.map(({id,family,variant,name,key,signature,x,z})=>({id,family,variant,name,key,signature,x,z}))};}
