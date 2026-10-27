from pathlib import Path
R=Path(__file__).resolve().parents[1];P=R/'prototypes'
s=(P/'greater-taipei-v0.4.8.html').read_text().replace('transport-network-v047.js','transport-network-v049.js').replace('v046-art.js','v049-art.js').replace('content="0.4.8"','content="0.4.9"')
s=s.replace('<span>${clockLabels[current]}</span>','<span>時間</span>')
s=s.replace('  const phoneOrder=', '''  const policy=el("div","hi-policy"),policyTrigger=el("button",null,"政策 ▾"),policyMenu=el("div","hi-policy-menu");
  policyTrigger.type="button";policyTrigger.setAttribute("aria-expanded","false");policyTrigger.setAttribute("aria-controls","policy-options");policyMenu.id="policy-options";policyMenu.hidden=true;
  policyMenu.append(btn.list,btn.time);policy.append(policyTrigger,policyMenu);
  const closePolicy=()=>{policyMenu.hidden=true;policyTrigger.setAttribute("aria-expanded","false");};
  policyTrigger.onclick=()=>{policyMenu.hidden=!policyMenu.hidden;policyTrigger.setAttribute("aria-expanded",String(!policyMenu.hidden));};
  policyMenu.addEventListener("click",closePolicy);
  document.addEventListener("pointerdown",e=>{if(!policy.contains(e.target))closePolicy();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!policyMenu.hidden){closePolicy();policyTrigger.focus();}});
  const dataHelp=el("details","hi-data-help","<summary>資料說明</summary>"+viewAbout());intro.querySelector(".hi-actions").before(dataHelp);
  document.querySelector('[data-tab="about"]')?.remove();
  const phoneOrder=''')
s=s.replace('const phoneOrder=[btn.list,btn.time,help,btn.pano,tourBtn,landmarkButton,music]','const phoneOrder=[landmarkButton,tourBtn,music,clockControl,btn.pano,policy,help]')
s=s.replace('clockTrigger.hidden=phoneTools.matches;clockMenu.hidden=!phoneTools.matches;','clockTrigger.hidden=false;clockMenu.hidden=true;')
s=s.replace('toolsPanel.replaceChildren(...phoneOrder,clockControl);','toolsPanel.replaceChildren(...phoneOrder);').replace('[landmarkButton,tourBtn,music].filter','[landmarkButton,tourBtn,music,clockControl].filter').replace('modes.replaceChildren(btn.pano,btn.list,btn.time,help);','modes.replaceChildren(btn.pano,policy,help);').replace('toolsPanel.replaceChildren(mapTools,modes,clockControl);','toolsPanel.replaceChildren(mapTools,modes);')
s=s.replace('phoneTools.matches && e.target.closest("button")','phoneTools.matches && e.target.closest("button") && !e.target.closest(".hi-policy,.hi-clock")')
s=s.replace('</style>','''</style><style>
.hi-clock{position:relative!important;top:auto!important;right:auto!important;margin:0!important;padding:0!important;border:0!important}
.hi-policy{position:relative}.hi-policy-menu{position:absolute;top:calc(100% + 8px);right:0;width:172px;padding:8px;background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:0 8px 30px #0003;z-index:20}
.hi-policy-menu button{display:block;width:100%;text-align:left}.hi-data-help{margin:16px 0}.hi-data-help summary{cursor:pointer;font-weight:700}.hi-intro{max-height:calc(100dvh - 48px);overflow:auto}
@media(max-width:860px){.hi-policy,.hi-clock{width:100%}.hi-policy>button,.hi-clock-trigger{width:100%}.hi-policy-menu{position:static;width:auto;box-shadow:none}.hi-policy-menu .hi-mode-label{display:inline}.hi-policy-menu .hi-mode-short{display:none}}
</style>''',1)
(P/'greater-taipei-v0.4.9.html').write_text(s)
art=(P/'v046-art.js').read_text().replace('v044-taipei-life.js','v049-taipei-life.js').replace('v044-regional-life.js','v049-regional-life.js');(P/'v049-art.js').write_text(art)
for city in ['taipei','regional']:
 t=(P/f'v044-{city}-life.js').read_text()
 t=t.replace("import * as THREE from 'three';","import * as THREE from 'three';\nimport {makeBus} from './v049-bus.js';")
 t=t.replace('Math.min(26,driving.length)','Math.min(120,driving.length*3)').replace('const route=driving[i];','const route=driving[i%driving.length];').replace('variant:i%4,position','variant:i%8,position').replace('i<84','i<280')
 t=t.replace('  root.updateMatrixWorld(true);','  if(kind===\'car\'&&index>=6){root.removeFromParent();root=makeBus(index===7);}\n  root.updateMatrixWorld(true);')
 (P/f'v049-{city}-life.js').write_text(t)
t=(P/'transport-network-v047.js').read_text().replace('k<8;k++','k<16;k++').replace('phase:k/8','phase:k/16').replace('for(const r of plan.boats){','for(const r of plan.boats.flatMap(r=>[r,{...r,id:r.id+"-extra",phase:r.phase+Math.PI}])){').replace('i<4;i++','i<8;i++').replace('[.58,.66,.72,.62][i]','[.58,.66,.72,.62][i%4]').replace('phase:i*Math.PI/2','phase:i*Math.PI/4')
(P/'transport-network-v049.js').write_text(t)
print('Built isolated v049 activity and navigation preview')
