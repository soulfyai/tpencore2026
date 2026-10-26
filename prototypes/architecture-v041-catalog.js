// Architectural silhouettes for the v0.4 street fabric. No geographic/layout changes.
const M=(g,x,z,w,d,y,h,rot=0)=>({g,x,z,w,d,y,h,rot}),B=(...a)=>M('box',...a);
export const BUILDING_TYPES=[
 ['courtyard','三翼庭院住宅','balcony',.83,v=>[B(-.33,0,.28,.91,0,.82),B(.33,-.07,.28,.77,0,1),B(0,-.32,.45,.25,0,.64)]],
 ['corner-hotel','圓角轉角旅館','ribbon',1.12,v=>[B(-.21,-.08,.52,.84,0,1),M('cyl',.22,.19,.54,.54,0,.83),B(.22,-.28,.53,.20,0,.56)]],
 ['garden-terraces','層層退台花園住宅','terrace',.95,v=>[B(0,0,.96,.88,0,.34),B(-.12,-.11,.74,.65,.34,.34),B(-.21,-.19,.52,.46,.68,.32)]],
 ['brick-market','紅磚山牆市場','arches',.48,v=>[B(0,0,.88,.84,0,.62),M('gable',0,0,.98,.94,.62,.35),B(-.38,.08,.19,.82,0,.43),B(.38,.08,.19,.82,0,.43)]],
 ['barrel-library','拱頂玻璃圖書館','colonnade',.55,v=>[B(-.14,0,.65,.89,0,.44),M('barrel',-.14,0,.65,.89,.44,.52),B(.31,-.12,.24,.65,0,.65)]],
 ['art-deco','階梯冠頂街角商樓','deco',1.18,v=>[B(0,0,.91,.86,0,.25),B(0,-.03,.72,.67,.25,.43),B(.03,-.06,.47,.47,.68,.24),B(.03,-.06,.24,.27,.92,.15)]],
 ['oval-balconies','橢圓陽台集合住宅','round',1.02,v=>[M('cyl',-.07,0,.82,.94,0,.88),B(.32,-.13,.24,.60,0,1)]],
 ['paired-gables','雙山牆街屋','timber',.60,v=>[B(-.25,-.09,.42,.81,0,.68),M('gable',-.25,-.09,.48,.88,.68,.31),B(.23,.10,.42,.68,0,.52),M('gable',.23,.10,.48,.74,.52,.30)]],
 ['ribbon-office','折線連廊辦公樓','curtain',1.02,v=>[B(-.25,-.14,.38,.67,0,.93),B(.21,.16,.39,.65,0,.66),B(0,-.31,.49,.20,.44,.19),B(0,.32,.49,.20,.17,.18)]],
 ['sawtooth-workshop','鋸齒天窗工坊','industrial',.43,v=>[B(0,0,.93,.86,0,.58),...[-.31,0,.31].map(x=>M('wedge',x,0,.31,.86,.58,.39))]],
 ['clock-civic','鐘樓社區會館','arches',.63,v=>[B(.04,.05,.86,.73,0,.55),B(-.28,-.13,.28,.31,.55,.37),M('pyramid',-.28,-.13,.37,.40,.92,.27)]],
 ['fan-theatre','扇翼文化展館','fins',.62,v=>[B(-.27,.06,.31,.74,0,.72,-.42),B(0,-.10,.33,.86,0,1),B(.27,.06,.31,.74,0,.65,.42)]],
 ['glass-atrium','玻璃中庭旅舍','atrium',.93,v=>[B(-.31,-.06,.25,.84,0,1),B(.28,.11,.31,.70,0,.78),M('barrel',-.02,-.03,.38,.72,0,.48)]],
 ['zigzag-housing','錯位街角住宅','bay',.90,v=>[B(-.27,-.26,.43,.40,0,.90),B(.15,-.05,.43,.40,0,.69),B(.29,.29,.33,.31,0,1),B(-.20,.18,.40,.45,0,.43)]],
 ['deep-balconies','水平長陽台住宅','horizontal',1.04,v=>[B(-.03,-.12,.91,.68,0,.90),B(.34,-.10,.18,.76,0,1),B(-.27,.28,.33,.24,0,.38)]],
 ['chamfered-corner','切角退台商住樓','polygon',1.03,v=>[M('oct',0,0,.94,.92,0,.68),M('oct',-.08,-.07,.72,.72,.68,.32),B(.31,-.23,.20,.37,0,.45)]],
 ['loft-warehouse','高窗紅磚倉庫','loft',.63,v=>[B(0,0,.94,.78,0,.63),M('gable',0,0,.98,.85,.63,.28),B(-.27,.30,.30,.23,0,.90),M('gable',-.27,.30,.35,.28,.90,.17)]],
 ['butterfly-gallery','蝶翼屋頂美術館','gallery',.50,v=>[B(-.25,-.03,.38,.82,0,.49),M('wedge',-.25,-.03,.45,.88,.49,.40),B(.24,.09,.36,.66,0,.59),M('wedge',.24,.09,.45,.74,.59,.34,Math.PI)]],
 ['colonnade-reading','列柱閱讀學苑','colonnade',.57,v=>[B(0,-.18,.93,.45,0,.69),B(-.34,.15,.23,.45,0,.45),B(.34,.15,.23,.45,0,.45),B(0,.35,.79,.12,.34,.11)]],
 ['stacked-community','堆疊露台社區','box',.92,v=>[B(-.23,-.23,.46,.43,0,.41),B(.23,.20,.47,.45,0,.28),B(.16,-.18,.48,.45,.41,.33),B(-.20,.21,.43,.44,.28,.38),B(-.03,-.03,.43,.43,.74,.26)]],
 ['dome-hall','穹頂公共展館','dome',.63,v=>[M('cyl',-.05,-.06,.79,.80,0,.55),M('dome',-.05,-.06,.83,.84,.55,.40),B(.33,.28,.24,.30,0,.30)]],
 ['arc-shopping','弧形商業街廊','arcade',.72,v=>[-2,-1,0,1,2].map(i=>B(i*.17,-.17+i*i*.052,.20,.51,0,.60+(i+2)*.085,i*.19))],
 ['brick-court','紅磚合院生活館','brick',.51,v=>[B(-.33,0,.27,.87,0,.64),M('gable',-.33,0,.33,.95,.64,.24),B(.33,0,.27,.87,0,.64),M('gable',.33,0,.33,.95,.64,.24),B(0,-.32,.45,.25,0,.74),M('gable',0,-.32,.52,.32,.74,.25)]],
 ['eco-wedge','斜頂綠能辦公樓','diagonal',1.10,v=>[B(-.16,-.09,.59,.82,0,.68),M('wedge',-.16,-.09,.59,.82,.68,.34),B(.29,.15,.30,.54,0,.44),B(.29,-.24,.25,.24,.44,.17)]]
];
export function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function blueprint(type,variant){let masses=BUILDING_TYPES[type][4](variant).map(m=>({...m}));
 if(variant){const mode=(variant-1)%4,tier=Math.floor((variant-1)/4),q=.018*tier;
  if(mode===0){masses=masses.map(m=>({...m,x:m.x*.77+.08,w:m.w*.77}));masses.push(B(-.36,.13,.19,.52+q,0,.37));}
  if(mode===1){masses=masses.map(m=>({...m,z:m.z*.73-.10,d:m.d*.73}));masses.push(B(.19,.34,.40+q,.23,0,.33));}
  if(mode===2){masses=masses.map(m=>({...m,x:m.x*.76-.11,w:m.w*.76}));masses.push(M('oct',.34,-.21,.27,.31+q,0,.57));}
  if(mode===3){masses=masses.map(m=>({...m,z:m.z*.77+.09,d:m.d*.77}));masses.push(B(-.25,-.35,.35,.22,0,.30),M('gable',-.25,-.35,.4,.27,.30,.20),B(.27,-.33,.24,.27,0,.62+q));}
 }
 // A canonical mass descriptor excludes color, floor count and presentation rotation.
 const signatures=[];for(let turn=0;turn<4;turn++){const a=turn*Math.PI/2,c=Math.cos(a),s=Math.sin(a);signatures.push(masses.map(m=>[m.g,...[m.x*c-m.z*s,m.z*c+m.x*s,m.w,m.d,m.y,m.h,((m.rot+a)%(Math.PI*2))].map(n=>Math.round(n*1000))].join('/')).sort().join('|'));}
 return {type,variant,masses,signature:signatures.sort()[0],name:BUILDING_TYPES[type][1],key:BUILDING_TYPES[type][0],style:BUILDING_TYPES[type][2],heightFactor:BUILDING_TYPES[type][3]};
}
const catalog={placed:[],signatures:new Set(),counts:new Map()};
export function selectBuilding(id,city,x,z){const near=catalog.placed.filter(r=>r.city===city&&Math.hypot(r.x-x,r.z-z)<48),shift=hash(id)%BUILDING_TYPES.length;
 const options=BUILDING_TYPES.map((_,t)=>t).filter(t=>!near.some(n=>n.type===t)).sort((a,b)=>(catalog.counts.get(a)||0)-(catalog.counts.get(b)||0)||((a-shift+24)%24)-((b-shift+24)%24));
 for(const type of options){for(let variant=catalog.counts.get(type)||0;variant<100;variant++){const r=blueprint(type,variant);if(catalog.signatures.has(r.signature))continue;catalog.signatures.add(r.signature);catalog.counts.set(type,variant+1);catalog.placed.push({...r,id,city,x,z});return r;}}
 throw Error('No distinct building available: '+id);
}
export function buildingAudit(){return {count:catalog.placed.length,uniqueStructures:catalog.signatures.size,types:catalog.counts.size,entries:catalog.placed.map(({masses,...r})=>r)};}
