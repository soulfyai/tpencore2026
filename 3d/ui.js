/* ===== page shell in the spirit of a policy-island site: brand, view modes, intro, guided tour, timeline, detail drawer ===== */
const UI = {};
{
  const html = document.documentElement; html.classList.add("hi");
  // role="img" (set by build.py on #stage) would hide the island-label buttons from assistive tech
  const stageEl = document.getElementById("stage"); if (stageEl) stageEl.setAttribute("role", "group");
  // the city being explored; everything below (brand, tour, list, timeline) follows it
  const CITIES = ["taipei", "newtaipei", "keelung", "taoyuan"].filter((c) => LIVE_CITIES.has(c) && A.cityById.get(c));
  let LIVE = CITIES[0], city, liveThemes, rows, nPlan, nRec;
  const load = (c) => { LIVE = c; city = A.cityById.get(c); liveThemes = A.themes.filter((t) => t.city === c).sort((a, b) => a.no - b.no); rows = liveThemes.flatMap((t) => (t.items || []).map((it) => ({ it, t }))); nPlan = rows.filter((r) => r.t.kind !== "record").length; nRec = rows.length - nPlan; };
  load(LIVE);
  const allRows = A.themes.filter((t) => LIVE_CITIES.has(t.city)).flatMap((t) => t.items || []).length, allThemes = A.themes.filter((t) => LIVE_CITIES.has(t.city)).length;
  const el = (tag, cls, inner) => { const e = document.createElement(tag); if (cls) e.className = cls; if (inner != null) e.innerHTML = inner; return e; };
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const statusOf2 = (it, t) => (t.kind === "record" || it.phase === "已實施" ? "done" : /施工|興建|擴線|驗收|機電|擴區|推動中|延續推動|試辦|已宣布/.test(it.phase || "") ? "build" : "plan");

  /* ---------- brand block: the neon sign is a persistent tab, details pop out below it ---------- */
  const brand = document.querySelector("header.top .brand");
  const h1 = brand.querySelector("h1");
  // Art-directed B assets retain the approved neon detail and typography.
  // Build embeds both images so the standalone HTML has no asset-path dependency.
  const brandBtn = el("button", "hi-brandbtn", `<picture class="hi-brandart"><source media="(max-width:860px)" srcset="__BRAND_B_MOBILE__"><img src="__BRAND_B_DESKTOP__" width="2158" height="729" alt="" decoding="sync"></picture><span class="hi-brand-copy">台北安可・一起打造你我的北北基桃</span>`);
  brandBtn.type = "button"; brandBtn.setAttribute("aria-expanded", "false"); brandBtn.setAttribute("aria-controls", "hi-pop");
  if (h1) { h1.innerHTML = ""; h1.appendChild(brandBtn); }
  brand.querySelector("p")?.remove(); // no lede under the sign
  // The user moved the full independence statement into help.
  const notice = document.querySelector("header.top .notice");
  const independence = notice?.innerHTML || "獨立整理，非任何候選人或政黨官方網站";
  notice?.remove();
  const watermark = el("footer", "hi-watermark", `<span>Designed by TPEncore © 2026</span><a href="mailto:TPEncore2026@gmail.com">Contact / TPEncore2026@gmail.com</a>`);
  document.body.appendChild(watermark);
  const visitCounter=el("span","hi-visit-counter");visitCounter.hidden=true;
  watermark.insertBefore(visitCounter,watermark.lastElementChild);
  const recordVisit=config=>{
    if(config.counterEnabled===false)return;
    const path=config.counterUrl||(/(^|\.)tpencore\.tw$/i.test(location.hostname)?"counter.php":null);
    if(!path)return;
    let url;try{url=new URL(path,location.href);}catch{return;}
    if(url.origin!==location.origin)return;
    fetch(url,{method:"POST",credentials:"omit",cache:"no-store",headers:{Accept:"application/json"},signal:AbortSignal.timeout(10000)})
      .then(r=>r.ok?r.json():null).then(data=>{
        if(!data?.ok||!Number.isSafeInteger(data.views)||data.views<0)return;
        visitCounter.textContent=`瀏覽次數 ${data.views.toLocaleString("zh-TW")}`;visitCounter.hidden=false;
      }).catch(()=>{/* Counter availability never blocks the map or music. */});
  };
  const cand = el("div", "hi-cand"), count = el("div", "hi-count"), chips = el("div", "hi-cities");
  chips.setAttribute("role", "tablist"); chips.setAttribute("aria-label", "選擇城市");
  // City switcher colors match the map and city signs.
  UI.enterCity = (c) => { setMode("pano"); MAP3D.enterCity(c); };
  for (const c of CITIES) { const ci = A.cityById.get(c), b = el("button", null, esc(ci.cityName.replace(/市$/, ""))); b.type = "button"; b.setAttribute("role", "tab"); b.dataset.city = c; b.style.setProperty("--c", `var(--c-${c})`); b.onclick = () => UI.enterCity(c); chips.appendChild(b); }
  const pop = el("div", "hi-pop"); pop.id = "hi-pop"; pop.hidden = true;
  pop.append(cand, count, chips);
  // re-home the live weather element (built and updated by main.js) into the popover; keeping
  // the same node means ENV/weather updates keep flowing into it unchanged
  const wxEl = document.querySelector(".stage .wx"); if (wxEl) pop.appendChild(wxEl);
  brand.append(pop);
  const setPop = (on) => { pop.hidden = !on; brandBtn.setAttribute("aria-expanded", String(on)); brand.classList.toggle("open", on); };
  brandBtn.onclick = () => setPop(pop.hidden);
  document.addEventListener("pointerdown", (e) => { if (!pop.hidden && !brand.contains(e.target)) setPop(false); }); // tap outside collapses
  UI.togglePop = setPop;
  function paintBrand() {
    WEATHER_UI.setCity(LIVE);
    cand.innerHTML = `<i style="background:var(--c-${LIVE})"></i>${esc(city.cityName)}・${esc(city.candidate)}`;
    count.innerHTML = `<b>${rows.length}</b><span>項政見與政績<br>${liveThemes.length} 個政策區塊</span>`;
    chips.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.city === LIVE)));
  }
  function setCur(c) { if (!c || !CITIES.includes(c)) return; const changed = c !== LIVE; load(c); paintBrand(); if (changed) { A.setCity(c); if (!timeline.hidden) renderTimeline(); } }
  UI.setCity = setCur;

  /* ---------- view modes ---------- */
  const modes = el("div", "hi-modes"); modes.setAttribute("role", "toolbar"); modes.setAttribute("aria-label", "檢視方式");
  const toolbar=el("div","hi-toolbar"),mapTools=el("div","hi-maptools");
  mapTools.setAttribute("role","group");mapTools.setAttribute("aria-label","地圖輔助工具");
  const landmarkButton=document.querySelector(".lmbtn");if(landmarkButton)mapTools.appendChild(landmarkButton);
  const MODES = [["pano", "全景"], ["list", "政策清單"], ["time", "政策進度"]];
  const btn = {};
  for (const [id, name] of MODES) { const b = el("button", null, `<span class="hi-mode-label">${name}</span><span class="hi-mode-short">${id==="list"?"清單":id==="time"?"進度":name}</span>`); b.type = "button"; b.setAttribute("aria-label",name); b.dataset.mode = id; b.onclick = () => setMode(id); modes.appendChild(b); btn[id] = b; }
  const help = el("button", "hi-help", "?"); help.type = "button"; help.setAttribute("aria-label", "使用說明"); help.onclick = () => showIntro(true); modes.appendChild(help);
  help.innerHTML = `<span aria-hidden="true">?</span><span class="hi-help-label">使用說明</span>`;
  const toolsPanel = el("div", "hi-tools-panel"); toolsPanel.id = "hi-tools-panel"; toolsPanel.append(mapTools,modes);
  const toolsToggle = el("button", "hi-tools-toggle", `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`);
  toolsToggle.type = "button"; toolsToggle.setAttribute("aria-label", "地圖工具"); toolsToggle.setAttribute("aria-controls", toolsPanel.id);
  const phoneTools = matchMedia("(max-width:860px)");
  function setTools(on) {
    const restoreFocus = !on && toolsPanel.contains(document.activeElement);
    toolsPanel.hidden = phoneTools.matches && !on;
    if(!on&&!phoneTools.matches){const menu=toolsPanel.querySelector(".hi-clock-options");if(menu)menu.hidden=true;toolsPanel.querySelector(".hi-clock-trigger")?.setAttribute("aria-expanded","false");}
    toolsToggle.setAttribute("aria-expanded", String(phoneTools.matches && on));
    if (restoreFocus && phoneTools.matches) toolsToggle.focus();
  }
  setTools(false); phoneTools.addEventListener("change", () => setTools(false));
  toolsToggle.onclick = () => { setPop(false); setTools(toolsPanel.hidden); };
  toolsPanel.addEventListener("click", (e) => { if (phoneTools.matches && e.target.closest("button")) setTools(false); });
  document.addEventListener("pointerdown", (e) => { if (!toolbar.contains(e.target)) setTools(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && phoneTools.matches && !toolsPanel.hidden) { setTools(false); toolsToggle.focus(); } });
  toolbar.append(toolsPanel,toolsToggle);document.querySelector(".mapwrap").appendChild(toolbar);
  let mode = "pano";
  function setMode(m) {
    mode = m; for (const [id] of MODES) btn[id].setAttribute("aria-pressed", String(id === m));
    timeline.hidden = m !== "time";
    if (m === "pano") { setTools(false); endTour(); setPop(false); showIntro(false); closeDrawer(); clearSel(); MAP3D.panorama(); }
    if (m === "list") { A.setCity(LIVE); A.setTab("list"); openDrawer(); }
    if (m === "time") { closeDrawer(true); renderTimeline(); }
  }

  /* ---------- detail drawer (the existing panel) ---------- */
  const aside = document.querySelector("aside.panel");
  const close = el("button", "hi-close", "✕"); close.type = "button"; close.setAttribute("aria-label", "關閉"); close.onclick = () => closeDrawer();
  aside.prepend(close);
  aside.inert = true; // the drawer starts off-screen; keep its contents out of the tab order until it opens
  function openDrawer() { html.classList.add("drawer-open"); aside.inert = false; }
  const clearSel = () => { if (A.state.selTheme || A.state.selItem || A.state.selFlow) document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); };
  function closeDrawer(keepMode) {
    if (!html.classList.contains("drawer-open")) return;
    html.classList.remove("drawer-open"); aside.inert = true;
    if (A.state.selItem && A.state.selTheme) A.openTheme(A.state.selTheme); // back to the island's list bubble
    if (!keepMode && mode === "list") { mode = "pano"; for (const [id] of MODES) btn[id].setAttribute("aria-pressed", String(id === "pano")); }
  }
  UI.openDrawer = openDrawer; UI.closeDrawer = closeDrawer;
  { const f = MAP3D.enterCity; MAP3D.enterCity = (c) => { setCur(c); f(c); }; }
  const cityOfTheme = (id) => A.themes.find((t) => t.id === id)?.city, cityOfItem = (id) => A.themes.find((t) => (t.items || []).some((i) => i.id === id))?.city;
  for (const k of ["focusTheme", "focusItem", "focusFlow"]) {
    const f = MAP3D[k];
    MAP3D[k] = (id) => { if (k === "focusTheme") setCur(cityOfTheme(id)); if (k === "focusItem") setCur(cityOfItem(id)); if (k !== "focusTheme" || mode === "list") openDrawer(); timeline.hidden = true; if (mode === "time") { mode = "pano"; for (const [m] of MODES) btn[m].setAttribute("aria-pressed", String(m === "pano")); } f(id); syncTour(id); };
  }

  /* ---------- intro ---------- */
  const intro = el("section", "hi-intro", `
    <button type="button" class="hi-x" aria-label="關閉說明">✕</button>
    <div class="hi-eyebrow">使用說明</div>
    <h2>一個政策區塊，一個政策主題。</h2>
    <p>這裡把北北基桃四位候選人的 <b>${allRows}</b> 項政見與任內政績，分成 <b>${allThemes}</b> 個政策區塊，散在台北、新北、基隆、桃園四座城市島上。每一棟建築就是一項內容，點進去可以看白話說明、怎麼做，以及原始來源。</p>
    <ul><li><b>全景</b>：看整座群島，點島就飛過去</li><li><b>政策清單</b>：用文字一項一項瀏覽</li><li><b>政策進度</b>：依已完成、推動中、規劃中排好</li><li><b>時間顯示</b>：右上角切換白天、晚上或實際時間（台北時間）</li></ul>
    <p class="hi-soon">拖曳地圖可以移動到其他城市，或用左上角的城市按鈕切換。</p>
    <p><a href="./2d.html">開啟文字政策導覽 ↗</a> · <a href="https://github.com/soulfyai/tpencore2026/issues/new/choose" target="_blank" rel="noopener noreferrer">提供資料／回報問題</a></p>
    <p class="hi-independence">${independence}</p>
    <div class="hi-actions"><button type="button" class="hi-primary">開始導覽 →</button><button type="button" class="hi-ghost">自己逛逛</button></div>`);
  intro.setAttribute("aria-label", "使用說明");
  document.querySelector(".mapwrap").appendChild(intro);
  const showIntro = (on) => { intro.hidden = !on; };
  intro.querySelector(".hi-x").onclick = () => showIntro(false);
  intro.querySelector(".hi-ghost").onclick = () => setMode("pano");
  intro.querySelector(".hi-primary").onclick = () => { showIntro(false); startTour(); };
  intro.hidden = false; // Explain the policy city on each fresh visit; map tap or X dismisses it.

  /* ---------- guided tour ---------- */
  let touring = false, step = 0;
  const tour = el("section", "hi-tour"); tour.setAttribute("aria-label", "城市導覽");
  tour.innerHTML = `<div class="hi-tour-head"><span class="hi-eyebrow">城市導覽</span><span class="hi-step"></span></div>
    <h3></h3><p></p>
    <div class="hi-tour-btns"><button type="button" data-a="prev" aria-label="上一站">←</button><button type="button" data-a="more" class="hi-ghost">看細節</button><button type="button" data-a="next" class="hi-primary">下一站 →</button><button type="button" data-a="end" class="hi-ghost">結束</button></div>`;
  const tourBtn = el("button", "hi-tourbtn", "▶ 導覽"); tourBtn.type = "button"; tourBtn.onclick = () => startTour();
  document.querySelector(".mapwrap").appendChild(tour);mapTools.appendChild(tourBtn);
  tour.hidden = true;
  let STEPS = [];
  function renderStep() {
    const s = STEPS[step];
    tour.querySelector(".hi-step").textContent = `${String(step).padStart(2, "0")} / ${STEPS.length - 1}`;
    if (s.intro) {
      tour.querySelector("h3").textContent = `${city.cityName}・${city.candidate}`;
      tour.querySelector("p").textContent = `從全景開始。接下來 ${liveThemes.length} 站，每站一個政策區塊，帶你看區塊裡的重點。`;
      MAP3D.enterCity(LIVE); closeDrawer(true); clearSel();
    } else {
      const its = s.t.items || [], done = its.filter((i) => statusOf2(i, s.t) === "done").length;
      tour.querySelector("h3").innerHTML = `<b style="color:var(--c-${LIVE})">${String(s.t.no).padStart(2, "0")}</b> ${esc(s.t.name)}`;
      tour.querySelector("p").textContent = `${(s.t.summary || "").slice(0, 90)}${(s.t.summary || "").length > 90 ? "…" : ""}　共 ${its.length} 項${done ? `，其中 ${done} 項已完成` : ""}。`;
      A.openTheme(s.t.id);
    }
    tour.querySelector('[data-a="prev"]').disabled = step === 0;
    tour.querySelector('[data-a="next"]').textContent = step === STEPS.length - 1 ? "回到全景" : "下一站 →";
    tour.querySelector('[data-a="more"]').hidden = !!s.intro;
  }
  function startTour() { STEPS = [{ intro: true }, ...liveThemes.map((t) => ({ t }))]; touring = true; step = 0; tour.hidden = false; tourBtn.hidden = true; timeline.hidden = true; renderStep(); }
  function endTour() { touring = false; tour.hidden = true; tourBtn.hidden = false; }
  function syncTour(id) { if (!touring) return; const k = STEPS.findIndex((s) => s.t && s.t.id === id); if (k > 0 && k !== step) { step = k; renderStep(); } }
  tour.addEventListener("click", (e) => {
    const a = e.target.closest("button")?.dataset.a; if (!a) return;
    if (a === "prev" && step > 0) { step--; renderStep(); }
    if (a === "next") { if (step < STEPS.length - 1) { step++; renderStep(); } else { endTour(); setMode("pano"); } }
    if (a === "more") openDrawer();
    if (a === "end") { endTour(); closeDrawer(); clearSel(); MAP3D.enterCity(LIVE); }
  });

  /* ---------- timeline ---------- */
  const timeline = el("section", "hi-timeline"); timeline.setAttribute("aria-label", "時間檢視"); timeline.hidden = true; document.querySelector(".mapwrap").appendChild(timeline);
  const COLS = [["done", "已完成", "任內已實施或已上路"], ["build", "推動中", "施工、試辦或已啟動"], ["plan", "規劃中", "競選政見，尚待推動"]];
  const yearOf = (p) => { const m = String(p || "").match(/20\d\d/); return m ? +m[0] : 9999; };
  function renderTimeline() {
    const by = { done: [], build: [], plan: [] };
    for (const r of rows) by[statusOf2(r.it, r.t)].push(r);
    by.plan.sort((a, b) => yearOf(a.it.phase) - yearOf(b.it.phase));
    timeline.innerHTML = `<div class="hi-tl-head"><div><span class="hi-eyebrow">時間</span><h2>${esc(city.candidate)}的政策進度</h2></div><button type="button" class="hi-x" aria-label="關閉時間檢視">✕</button></div>
      <div class="hi-tl-cols">${COLS.map(([k, name, sub]) => `<div class="hi-tl-col" data-k="${k}"><h3><i></i>${name}<span>${by[k].length}</span></h3><small>${sub}</small><ol>${by[k].map((r) => `<li><button type="button" data-item="${esc(r.it.id)}"><span class="hi-tl-no" style="color:var(--c-${LIVE})">${String(r.t.no).padStart(2, "0")}</span><b>${esc(r.it.name)}</b><em>${esc(r.t.name.replace(/^政績・/, ""))}${r.it.phase && r.it.phase !== "已實施" ? "・" + esc(r.it.phase) : ""}</em></button></li>`).join("")}</ol></div>`).join("")}</div>`;
    timeline.querySelector(".hi-x").onclick = () => setMode("pano");
    timeline.querySelectorAll("[data-item]").forEach((b) => (b.onclick = () => A.openItem(b.dataset.item)));
  }

  /* ---------- toast ---------- */
  const toast = el("div", "hi-toast"); toast.setAttribute("role", "status"); document.querySelector(".mapwrap").appendChild(toast);
  let tt = 0; UI.toast = (msg) => { toast.textContent = msg; toast.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("on"), 2600); };

  /* Music is configured per host; NAS-local files remain on the NAS. */
  const music = el("button", "hi-music", `<span aria-hidden="true">♫</span> 音樂`);
  music.type="button";music.hidden=true;music.setAttribute("aria-pressed","false");
  music.setAttribute("aria-label","播放背景音樂");mapTools.appendChild(music);
  // Scene lighting modes. The default always follows the actual Taipei clock.
  const clockIcon=(mode)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${mode==="day"?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>':mode==="night"?'<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>':'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>'}</svg>`;
  const clockLabels={day:"白天",night:"晚上",live:"實際時間"};
  const clockControl=el("div","hi-clock");
  const clockTrigger=el("button","hi-clock-trigger");clockTrigger.type="button";clockTrigger.setAttribute("aria-expanded","false");clockTrigger.setAttribute("aria-controls","hi-clock-options");
  const clockMenu=el("div","hi-clock-options",'<p class="hi-clock-title">時間顯示</p>');clockMenu.id="hi-clock-options";clockMenu.setAttribute("role","group");clockMenu.setAttribute("aria-label","時間顯示模式");
  const clockButtons={};
  function syncClock(){
    const current=CITY3D.ENV.mode;
    clockTrigger.innerHTML=`${clockIcon(current)}<span>${clockLabels[current]}</span><span aria-hidden="true">▾</span>`;
    clockTrigger.setAttribute("aria-label",`時間顯示：${clockLabels[current]}`);
    for(const [mode,b] of Object.entries(clockButtons))b.setAttribute("aria-pressed",String(current===mode));
  }
  for(const [mode,label] of Object.entries(clockLabels)){
    const b=el("button",null,`${clockIcon(mode)}<span>${label}</span><span class="hi-clock-check" aria-hidden="true">✓</span>`);
    b.type="button";b.dataset.timeMode=mode;b.setAttribute("aria-pressed",String(mode==="live"));
    b.onclick=()=>{CITY3D.ENV.setTimeMode(mode);syncClock();if(!phoneTools.matches){clockMenu.hidden=true;clockTrigger.setAttribute("aria-expanded","false");clockTrigger.focus();}};
    clockButtons[mode]=b;clockMenu.appendChild(b);
  }
  clockTrigger.onclick=()=>{clockMenu.hidden=!clockMenu.hidden;clockTrigger.setAttribute("aria-expanded",String(!clockMenu.hidden));};
  clockControl.append(clockTrigger,clockMenu);syncClock();
  document.addEventListener("pointerdown",e=>{if(!phoneTools.matches&&!clockControl.contains(e.target)){clockMenu.hidden=true;clockTrigger.setAttribute("aria-expanded","false");}});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!phoneTools.matches&&!clockMenu.hidden){clockMenu.hidden=true;clockTrigger.setAttribute("aria-expanded","false");clockTrigger.focus();}});
  // Reuse the same controls and events, with matching visual and keyboard order.
  const phoneOrder=[btn.list,btn.time,help,btn.pano,tourBtn,landmarkButton,music].filter(Boolean);
  function layoutTools(){
    clockTrigger.hidden=phoneTools.matches;clockMenu.hidden=!phoneTools.matches;clockTrigger.setAttribute("aria-expanded","false");
    if(phoneTools.matches){
      toolsPanel.replaceChildren(...phoneOrder,clockControl);
    }else{
      mapTools.replaceChildren(...[landmarkButton,tourBtn,music].filter(Boolean));
      modes.replaceChildren(btn.pano,btn.list,btn.time,help);
      toolsPanel.replaceChildren(mapTools,modes,clockControl);
    }
  }
  toolsPanel.setAttribute("role","group");toolsPanel.setAttribute("aria-label","地圖工具");
  layoutTools();phoneTools.addEventListener("change",layoutTools);
  const audio = new Audio();audio.loop=true;audio.preload="none";audio.volume=.35;
  let autoStartPending=true,playSequence=0,manualPlayback=false,musicHint="";
  const syncMusic=()=>{const playing=!audio.paused;music.setAttribute("aria-pressed",String(playing));music.setAttribute("aria-label",playing?"暫停背景音樂":"播放背景音樂");music.title=playing?"暫停背景音樂":musicHint||"播放背景音樂";};
  function stopAutoStart(){
    autoStartPending=false;
    document.removeEventListener("pointerup",autoStartOnGesture,true);
    document.removeEventListener("keydown",autoStartOnGesture,true);
  }
  function playMusic(automatic){
    const sequence=++playSequence;manualPlayback=!automatic;musicHint="";
    if(audio.error)audio.load();
    audio.play().then(()=>{
      if(sequence!==playSequence)return;
      stopAutoStart();syncMusic();
    }).catch(e=>{
      if(sequence!==playSequence||e.name==="AbortError")return;
      syncMusic();
      if(e.name==="NotAllowedError"){
        musicHint="點選畫面後播放背景音樂";syncMusic();return;
      }
      stopAutoStart();musicHint="音樂暫時無法播放，點此重試";syncMusic();
      if(!automatic)UI.toast("音樂暫時無法播放，請稍後再試。");
    });
  }
  function autoStartOnGesture(e){
    if(!autoStartPending||!audio.src||!e.isTrusted||music.contains(e.target))return;
    if(e.type==="keydown"&&(e.repeat||e.ctrlKey||e.metaKey||e.altKey||["Escape","Shift","Control","Alt","Meta"].includes(e.key)))return;
    playMusic(true);
  }
  document.addEventListener("pointerup",autoStartOnGesture,true);
  document.addEventListener("keydown",autoStartOnGesture,true);
  audio.addEventListener("playing",syncMusic);audio.addEventListener("pause",syncMusic);
  audio.addEventListener("error",()=>{
    ++playSequence;stopAutoStart();musicHint="音樂暫時無法播放，點此重試";audio.pause();syncMusic();
    if(manualPlayback)UI.toast("音樂暫時無法播放，請稍後再試。");
  });
  music.onclick=()=>{
    stopAutoStart();++playSequence;
    if(!audio.paused){manualPlayback=false;audio.pause();return;}
    playMusic(false);
  };
  fetch(new URL("site-config.json",location.href),{cache:"no-cache"}).then(r=>r.ok?r.json():null).then(config=>{
    if(config)recordVisit(config);
    if(!config?.musicUrl){stopAutoStart();return;}
    const url=new URL(config.musicUrl,location.href);
    if(!["https:","http:"].includes(url.protocol)||location.protocol==="https:"&&url.protocol!=="https:"){stopAutoStart();return;}
    audio.src=url.href;music.hidden=false;
    if(config.musicAutoplay===false)stopAutoStart();else playMusic(true);
  }).catch(()=>{stopAutoStart();/* Hide music when this host has no usable configuration. */});

  UI.hasOverlays=()=>!pop.hidden||!intro.hidden||!timeline.hidden||!tour.hidden||html.classList.contains("drawer-open")||(phoneTools.matches&&!toolsPanel.hidden)||(!phoneTools.matches&&!clockMenu.hidden)||!!(A.state.selTheme||A.state.selFlow);
  UI.dismissOverlays=()=>{
    const pos=CITY3D.camera.position.clone(),target=CITY3D.controls.target.clone();
    setPop(false);setTools(false);showIntro(false);endTour();timeline.hidden=true;
    clearSel();closeDrawer(true);mode="pano";
    for(const [id] of MODES)btn[id].setAttribute("aria-pressed",String(id==="pano"));
    MAP3D.flyTo(target,pos);
  };

  UI.followCity=(c)=>{
    if(c===LIVE)return;
    if(A.state.selTheme||A.state.selItem||A.state.selFlow||!tour.hidden)UI.dismissOverlays();
    setCur(c);
  };

  // Escape: first collapse the brand popover, then (once the 2D page's handler has cleared any selection) close the drawer
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!pop.hidden) { setPop(false); return; }
    if (html.classList.contains("drawer-open") && !A.state.selTheme && !A.state.selFlow) closeDrawer();
  });

  for (const [id] of MODES) btn[id].setAttribute("aria-pressed", String(id === "pano"));
  paintBrand(); A.setCity(LIVE);
}
