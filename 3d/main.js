/* ===== interaction: labels, pins, selection, flow routes, camera, picking, loop ===== */
buildBatches();

/* island labels hang on the front edge; city names float over each cluster */
const islandLabels = new Map();
for (const isl of islands.filter((i) => i.live)) {
  const el = document.createElement("button");
  el.className = "tlabel" + (isl.rec ? " rec" : "");
  el.style.setProperty("--c", `var(--c-${isl.city})`);
  el.innerHTML = `<b>${String(isl.t.no).padStart(2, "0")}</b><span>${isl.t.name.replace(/^政績・/, "")}</span>`; // 3D tags show the category only; the 2D list keeps the full name
  el.setAttribute("aria-label", `${A.cityById.get(isl.city).cityName} ${isl.t.name}`);
  el.onclick = () => A.openTheme(isl.id);
  const o = new CSS2DObject(el);
  o.position.copy(WORLD.bodies.get(isl.id).anchor);
  WORLD.bodies.get(isl.id).g.add(o);
  islandLabels.set(isl.id, { o, el });
}
for (const c of A.cities) {
  const el = document.createElement("div");
  const live = LIVE_CITIES.has(c.city);
  el.className = "clabel" + (live ? "" : " soon"); el.style.setProperty("--c", live ? `var(--c-${c.city})` : "#8a8f96");
  el.innerHTML = `${c.cityName}<span>${c.candidate}${live ? "" : "<em>建設中</em>"}</span>`;
  const ci = WORLD.cities.get(c.city), top = ci.coast.reduce((m, q) => (q[1] < m[1] ? q : m));
  const o = new CSS2DObject(el); o.center.set(0.5, 1); o.position.set(ci.center[0], live ? 3.4 : 2.2, top[1] - 0.6); scene.add(o);
}

/* one callout per explored island: the items as a numbered list (no stacked pins); tiny numbers sit on each lot */
const CIRC = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
const STATUS_TXT = (it, isl) => (isl.rec || it.phase === "已實施" ? ["done", "已完成"] : /施工|興建|擴線|驗收|機電|擴區|推動中|延續推動|試辦|已宣布/.test(it.phase || "") ? ["build", "推動中"] : ["plan", "政見"]);
let pins = [], pinsFor = null, callout = null, hoverItem = null;
function showPins(id) {
  if (pinsFor === id) return;
  for (const o of pins) { o.parent?.remove(o); o.element.remove(); }
  pins = []; pinsFor = id; callout = null; if (!id) return;
  const isl = islandById.get(id); if (!isl.live) return;
  const its = isl.t.items || [], body = WORLD.bodies.get(id);
  const el = document.createElement("div"); el.className = "callout"; el.style.setProperty("--c", `var(--c-${isl.city})`);
  el.innerHTML = `<div class="co-head"><b>${String(isl.t.no).padStart(2, "0")}</b>${isl.t.name}<span>${its.length} 項</span></div><ol>${its.map((it, k) => { const [st, txt] = STATUS_TXT(it, isl); return `<li><button type="button" data-item="${it.id}"><b>${CIRC[k] || k + 1}</b><span>${it.name}</span><i class="st-${st}" title="${txt}"></i></button></li>`; }).join("")}</ol>`;
  el.querySelectorAll("button[data-item]").forEach((b) => {
    b.onclick = (e) => { e.stopPropagation(); A.openItem(b.dataset.item); };
    b.onmouseenter = () => { hoverItem = b.dataset.item; placeBeam(); dirty = true; };
    b.onmouseleave = () => { hoverItem = null; placeBeam(); dirty = true; };
  });
  let topY = TOP; for (const it of its) { const i = ITEMS3D.get(it.id); if (i) topY = Math.max(topY, i.box.max.y); }
  const o = new CSS2DObject(el); o.center.set(0.5, 1); o.position.set(0, (isl.campusTop || TOP + 0.6) + 0.35, -(isl.campus?.d || 1) * 0.2); body.g.add(o); pins.push(o); callout = el;
}

/* city landmark tags */
window.LANDMARKS3D = LANDMARKS3D;
for (const L of LANDMARKS3D) {
  const el = document.createElement("div"); el.className = "lmlabel" + (L.nature ? " nature" : ""); el.style.setProperty("--c", L.nature ? "#3f8f3a" : `var(--c-${L.city})`);
  el.innerHTML = `<span class="lm-pin"></span>${L.name}`;
  const o = new CSS2DObject(el);
  if (L.fixed) { o.position.set(L.isl.c.x + L.x, L.top + 0.15, L.isl.c.z + L.z); scene.add(o); } // bridges: anchored to the sea, not to an island that can lift
  else { o.position.set(L.x, L.top + 0.15, L.z); WORLD.bodies.get(L.isl.id).g.add(o); }
}

/* beacon over the selected item */
const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.45, depthWrite: false });
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 6, 12, 1, true).translate(0, 3, 0), beamMat);
const beamRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 6, 32).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xc4462b }));
beam.visible = beamRing.visible = false; scene.add(beam, beamRing);

/* flow routes drawn along the walkways */
const flowViews = [];
const flowShader = (tier) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uTime: { value: 0 }, uColor: { value: col(css("--route") || "#c4462b") }, uMode: { value: tier === "official" ? 0 : tier === "news" ? 1 : 2 }, uLen: { value: 1 }, uA: { value: 0.85 } },
  vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader: "varying vec2 vUv;uniform float uTime,uMode,uLen,uA;uniform vec3 uColor;void main(){float u=vUv.x*uLen*5.0-uTime*1.4;if(uMode>1.5&&fract(u)>.3)discard;if(uMode>.5&&uMode<1.5&&fract(u)>.6)discard;float pulse=.7+.3*smoothstep(.0,.5,fract(u*.2));gl_FragColor=vec4(uColor*pulse+.1,uA);}",
});
for (const r of PEOPLE.routes) {
  const curve = new THREE.CurvePath();
  const pts = r.route.pts.map((v) => v.clone().setY(TOP + 0.06));
  for (let k = 1; k < pts.length; k++) curve.add(new THREE.LineCurve3(pts[k - 1], pts[k]));
  const mat = flowShader(r.f.tier); mat.uniforms.uLen.value = curve.getLength();
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, pts.length * 6), 0.04, 5, false), mat);
  tube.renderOrder = 2; tube.userData = { type: "flow", id: r.f.id }; tube.visible = false; scene.add(tube);
  flowViews.push({ f: r.f, tube, mat });
}

/* ---------- state -> scene ---------- */
const GRAY = col("#a7aaa9");
let focusId = null, dirty = true;
function recolorIsland(isl, dim) {
  for (const p of partsByIsland.get(isl.id) || []) { p.mesh.setColorAt(p.index, dim ? p.c.clone().lerp(GRAY, 0.72) : p.c); p.mesh.instanceColor.needsUpdate = true; }
  const b = WORLD.bodies.get(isl.id); b.top.material.color.copy(dim ? b.baseTop.clone().lerp(GRAY, 0.6) : b.baseTop);
}
const dimState = new Map();
/* when a neighbourhood is in focus, tall buildings in the blocks between it and the camera step aside */
for (const p of parts) { const e = p.m.elements; p.tall = !p.owner && !p.landmark && e[13] + Math.abs(e[5]) / 2 > TOP + 0.95; }
let occFor = null;
function setOccluders(id) {
  if (occFor === id) return; occFor = id;
  const t = id && islandById.get(id);
  for (const isl of islands) {
    const occ = !!t && isl !== t && isl.live && isl.c.z > t.c.z - 0.5 && isl.c.z - t.c.z < 7 && Math.abs(isl.c.x - t.c.x) < 6;
    if (!!isl.occluding !== occ) { isl.occluding = occ; placeIslandParts(isl); }
  }
  dirty = true;
}
function paint() {
  const st = A.state, q = st.query;
  const selF = st.selFlow && A.flows.find((x) => x.id === st.selFlow);
  for (const isl of islands) {
    let dim = !!st.cityFilter && isl.city !== st.cityFilter;
    if (selF) dim = !selF.cities.includes(isl.city);
    dim = false; if (dimState.get(isl.id) !== dim) { recolorIsland(isl, dim); dimState.set(isl.id, dim); }
    const sel = isl.id === st.selTheme, hit = !!q && A.matches(isl.t);
    isl.liftTo = sel ? 0.14 : 0;
    const b = WORLD.bodies.get(isl.id); b.outline.visible = sel; b.top.material.emissive.set(hit ? (css("--route") || "#c4462b") : 0x000000); b.top.material.emissiveIntensity = hit ? 0.25 : 0;
    const L = islandLabels.get(isl.id); if (L) { L.el.classList.toggle("sel", sel); L.el.classList.toggle("dim", dim); }
  }
  const shown = new Set();
  for (const v of flowViews) {
    const picked = st.selFlow === v.f.id;
    const vis = (st.flowsOn || picked) && !(st.cityFilter && !v.f.cities.includes(st.cityFilter));
    v.tube.visible = vis; v.mat.uniforms.uA.value = picked ? 1 : 0.7;
    if (vis) shown.add(v.f.id);
  }
  PEOPLE.filter = st.selFlow ? new Set([st.selFlow]) : null;
  PEOPLE.badges = !!st.selFlow || st.flowsOn;
  focusId = st.selItem; setOccluders(st.selTheme || null);
  if (!st.selTheme) showPins(null);
  document.querySelectorAll(".callout [data-item], .lotno").forEach((p) => p.classList.toggle("sel", p.dataset.item === st.selItem));
  placeBeam(); dirty = true;
}
function placeBeam() {
  const fid = hoverItem || focusId, info = fid && ITEMS3D.get(fid);
  if (!info) { beam.visible = beamRing.visible = false; return; }
  const isl = islandById.get(info.isl), c = info.box.getCenter(new THREE.Vector3());
  beam.position.set(c.x, info.box.max.y + isl.lift, c.z); beamRing.position.set(c.x, TOP + 0.03 + isl.lift, c.z); beamRing.scale.setScalar(info.size * 0.75);
  beam.visible = beamRing.visible = true;
}

/* ---------- camera ---------- */
let fly = null;
function overview() {
  // panorama: Taipei island centred, the other three in frame around it; this is also the farthest zoom allowed
  const tc = WORLD.cities.get("taipei"), C = tc ? new THREE.Vector3(tc.center[0], 0.3, tc.center[1]) : MID.clone().setY(0.3);
  const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
  const sx = 2 * Math.max(bounds.max.x - C.x, C.x - bounds.min.x), sz = 2 * Math.max(bounds.max.z - C.z, C.z - bounds.min.z);
  const span = Math.max(sx / Math.max(aspect, 0.6), sz) * 1.02;
  const dist = span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * (aspect < 1 ? 1.3 : 1.12);
  return { target: C, pos: C.clone().add(new THREE.Vector3(0, 0.56, 0.83).normalize().multiplyScalar(dist)), dist };
}
function flyTo(target, pos) {
  if (reduced.matches) { camera.position.copy(pos); controls.target.copy(target); controls.update(); dirty = true; return; }
  fly = { t0: performance.now(), p0: camera.position.clone(), p1: pos, q0: controls.target.clone(), q1: target };
}
let entered = null;   // city whose archipelago the camera is in (null = all four)
const drawerShift = (t, dist) => { if (!document.documentElement.classList.contains("drawer-open") || narrowScreen()) return t.clone(); const right = new THREE.Vector3().subVectors(camera.position, controls.target).cross(new THREE.Vector3(0, 1, 0)).normalize(); return t.clone().add(right.multiplyScalar(-dist * 0.16)); };
function cityFrame(city) {
  const box = new THREE.Box3(); for (const i of islands) if (i.city === city) box.expandByPoint(i.c); box.expandByScalar(R + 0.4);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3()).setY(0.3), aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
  const span = Math.max(size.x / Math.max(aspect, 0.6), size.z) * 1.05, dist = span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * (aspect < 1 ? 1.25 : 1.1);
  return { target: c, pos: c.clone().add(new THREE.Vector3(0, 0.62, 0.79).normalize().multiplyScalar(dist)), dist };
}
function enterCity(city) { entered = city; const f = cityFrame(city); flyTo(drawerShift(f.target, f.dist), drawerShift(f.target, f.dist).add(f.pos.clone().sub(f.target))); showPins(null); }
function panorama() { entered = null; const o = overview(); flyTo(o.target, o.pos); showPins(null); }
function home() { if (entered) enterCity(entered); else panorama(); }
function focusTheme(id) {
  const isl = islandById.get(id); if (!isl) return;
  showPins(id);
  entered = isl.city;
  const D = isl.campus ? Math.hypot(isl.campus.w, isl.campus.d) : 3.5;
  const off = new THREE.Vector3(1.2, 6.4, 6.6).multiplyScalar(Math.max(0.85, D / 3.6) * (narrowScreen() ? 1.5 : 1));
  let t = isl.c.clone().setY(TOP).add(new THREE.Vector3(0, 0, -D * 0.32)); t = drawerShift(t, off.length() * 0.9);
  flyTo(t, t.clone().add(off));
}
function focusItem(id) {
  const info = ITEMS3D.get(id); if (!info) return;
  showPins(info.isl);
  document.querySelectorAll(".callout [data-item], .lotno").forEach((p) => p.classList.toggle("sel", p.dataset.item === id));
  entered = islandById.get(info.isl).city;
  const off = new THREE.Vector3(0.6, 3.0, 3.1).multiplyScalar(Math.max(1.3, info.size * 1.5) * (narrowScreen() ? 1.4 : 1));
  let c = info.box.getCenter(new THREE.Vector3()).setY(TOP + 0.2); c = drawerShift(c, off.length() * 0.9);
  if (narrowScreen()) c.add(new THREE.Vector3(0, 0, 0.8));
  flyTo(c, c.clone().add(off));
}
function focusFlow(id) {
  showPins(null);
  const v = flowViews.filter((x) => x.f.id === id); if (!v.length) return;
  const box = new THREE.Box3(); v.forEach((x) => box.expandByObject(x.tube));
  const c = box.getCenter(new THREE.Vector3()).setY(0.4), s = box.getSize(new THREE.Vector3()).length();
  flyTo(c, c.clone().add(new THREE.Vector3(0.2, 0.75, 0.7).normalize().multiplyScalar(Math.max(14, s * 1.15))));
}

/* ---------- picking ---------- */
const ray = new THREE.Raycaster();
const pickables = () => [...batches.values(), ...[...WORLD.bodies.values()].flatMap((b) => [b.top, b.cliff]), ...flowViews.filter((v) => v.tube.visible).map((v) => v.tube)];
const ndc = (e) => { const r = renderer.domElement.getBoundingClientRect(); return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
function pickAt(e) {
  ray.setFromCamera(ndc(e), camera);
  for (const h of ray.intersectObjects(pickables(), false)) {
    const u = h.object.userData;
    if (u.type === "flow") return { type: "flow", id: u.id };
    if (u.type === "island") return { type: "island", id: u.id };
    if (u.type === "parts") {
      const owner = u.owners[h.instanceId], isl = u.isl[h.instanceId];
      if (owner) return { type: "item", id: owner, isl: ITEMS3D.get(owner)?.isl };
      if (isl && islandById.has(isl)) return { type: "island", id: isl };
    }
  }
  return null;
}
let down = null, hoverEl = null;
renderer.domElement.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; fly = null; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; }
  down = null; const u = pickAt(e); if (!u) return;
  const target = u.type === "island" ? islandById.get(u.id) : null;
  if (target && !target.live) { UI?.toast(`${A.cityById.get(target.city).cityName}還在建設中，先逛逛台北吧。`); return; }
  if (u.type === "item") { if (A.state.selTheme === u.isl) A.openItem(u.id); else A.openTheme(u.isl); }
  else if (u.type === "island") A.openTheme(u.id);
  else if (u.type === "flow") A.openFlow(u.id);
});
let hoverT = 0;
renderer.domElement.addEventListener("pointermove", (e) => {
  if (e.buttons || performance.now() - hoverT < 60) return; hoverT = performance.now();
  const u = pickAt(e);
  renderer.domElement.style.cursor = u ? "pointer" : "grab";
  const id = u && (u.type === "island" ? u.id : u.type === "item" ? u.isl : null);
  const el = id ? islandLabels.get(id)?.el : null;
  if (el !== hoverEl) { hoverEl?.classList.remove("hot"); el?.classList.add("hot"); hoverEl = el; }
});
controls.addEventListener("change", () => {
  dirty = true;
  // keep panning over the archipelago: clamp the look-at point to the islands' bounds and move the camera with it
  const lo = bounds.min, hi = bounds.max, t = controls.target, cx = THREE.MathUtils.clamp(t.x, lo.x, hi.x), cz = THREE.MathUtils.clamp(t.z, lo.z, hi.z);
  if (cx !== t.x || cz !== t.z || t.y !== 0) { const dx = cx - t.x, dz = cz - t.z; t.x = cx; t.z = cz; camera.position.x += dx; camera.position.z += dz; }
});

/* ---------- resize / theme / loop ---------- */
let labelTH = 99; // camera distance beyond which landmark/policy tags hide (the city neon signs always stay)
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
  camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); labelR.setSize(w, h);
  const o = overview(); controls.maxDistance = o.dist; ENV.fit?.(o.dist); // the panorama IS the farthest zoom
  labelTH = Math.min(o.dist * 0.94, Math.max(...A.cities.filter((c) => LIVE_CITIES.has(c.city)).map((c) => cityFrame(c.city).dist)) * 1.12);
  dirty = true;
}
new ResizeObserver(resize).observe(stage);
const retheme = () => { ENV.retheme(); for (const v of flowViews) v.mat.uniforms.uColor.value.set(css("--route") || "#c4462b"); dirty = true; };
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme);
new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

let last = performance.now(), clock = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  let busy = false;
  if (fly) {
    const t = Math.min(1, (now - fly.t0) / 1000), k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(fly.p0, fly.p1, k); controls.target.lerpVectors(fly.q0, fly.q1, k);
    if (t === 1) fly = null; busy = true;
  }
  for (const isl of islands) if (Math.abs(isl.lift - isl.liftTo) > 0.0005) {
    isl.lift += (isl.liftTo - isl.lift) * (reduced.matches ? 1 : Math.min(1, dt * 9));
    WORLD.bodies.get(isl.id).g.position.y = isl.lift; placeIslandParts(isl); busy = true;
    if (focusId && ITEMS3D.get(focusId)?.isl === isl.id) placeBeam();
  }
  for (const f of Object.values(FACADE)) f.emissiveIntensity = MAT.glow.emissiveIntensity * 0.9;
  const moving = !reduced.matches;
  if (moving) { clock += dt; ENV.update(dt, clock); for (const v of flowViews) if (v.tube.visible) v.mat.uniforms.uTime.value = clock; if (focusId) beamMat.opacity = 0.32 + 0.16 * Math.sin(clock * 3); busy = true; }
  PEOPLE.update(dt, clock, moving);
  ENV.cullClouds(camera);
  const camDist = camera.position.distanceTo(controls.target);
  stage.classList.toggle("far", camDist > 40);
  stage.classList.toggle("pano", camDist > labelTH);
  if (ENV.fog0) { const fk = Math.max(1, camDist / 80); scene.fog.near = ENV.fog0.near * fk; scene.fog.far = ENV.fog0.far * fk; }
  if (controls.update()) busy = true;
  if (busy || dirty) { renderer.render(scene, camera); labelR.render(scene, camera); dirty = false; }
  requestAnimationFrame(loop);
}
resize();
{ const o = overview(); controls.maxDistance = o.dist; ENV.fit?.(o.dist); camera.position.copy(o.pos); controls.target.copy(o.target); controls.update(); stage.classList.add("pano"); }
window.MAP3D = { paint, focusTheme, focusItem, focusFlow, home, panorama, enterCity, flyTo, cityFrame };
window.CITY3D = { WORLD, islands, ITEMS3D, parts, batches, PEOPLE, renderer, camera, controls, scene, ENV };

/* ---------- live weather: page db (refreshed hourly by a scheduled task), else the snapshot built into the page ---------- */
{
  const wx = document.createElement("div"); wx.className = "wx"; wx.setAttribute("aria-live", "polite"); stage.appendChild(wx);
  const NAMES = { taipei: "台北", newtaipei: "新北", keelung: "基隆", taoyuan: "桃園" };
  const KIND = (c) => c <= 1 ? "晴" : c === 2 ? "多雲" : c === 3 ? "陰" : c === 45 || c === 48 ? "霧" : c <= 57 ? "毛毛雨" : c <= 67 || (c >= 80 && c <= 82) ? "雨" : c >= 95 ? "雷雨" : "多雲";
  const fmtT = (iso) => { try { return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso)); } catch { return iso; } };
  let doc = A.D.meta?.weather || null, live = false;
  const render = () => {
    if (!doc?.cities) { wx.hidden = true; ENV.apply(); return; }
    const tp = doc.cities.taipei || Object.values(doc.cities)[0];
    ENV.setWeather({ temp: tp.temp, code: tp.code, cloud: tp.cloud, precip: tp.precip, wind: tp.wind, time: doc.updatedAt });
    const now = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    wx.innerHTML = "";
    const head = document.createElement("span"); head.innerHTML = "<b></b>"; head.firstChild.textContent = `台北 ${now}`; wx.appendChild(head);
    for (const [id, c] of Object.entries(doc.cities)) { const s = document.createElement("span"); s.textContent = `${NAMES[id] || id} ${Math.round(c.temp)}°C ${KIND(c.code)}`; wx.appendChild(s); }
    const note = document.createElement("small"); note.textContent = `天空依台北時間與天氣呈現・${live ? "每小時更新" : "頁面內建資料"}，${fmtT(doc.updatedAt)}・Open-Meteo`; wx.appendChild(note);
    dirty = true;
  };
  ENV.onChange = () => { dirty = true; };
  render(); setInterval(render, 60000);
  (async () => {
    try {
      const db = await window.claude?.use?.("db"); if (!db) return;
      db.doc("weather/now").onSnapshot((snap) => {
        const d = snap?.data ? (typeof snap.data === "function" ? snap.data() : snap.data) : snap;
        if (d?.cities && Object.values(d.cities).every((c) => Number.isFinite(c.temp) && Number.isFinite(c.code))) { doc = d; live = true; render(); }
      }, (e) => console.warn("weather db", e?.code));
    } catch (e) { console.warn("weather db unavailable", e); }
  })();
}
/* ---------- label visibility: 3D-layer rules + a landmark-tag toggle, bottom-left (kept out of the shared stylesheets) ---------- */
{
  const st = document.createElement("style");
  st.textContent = `
.stage.pano .tlabel{display:none!important}
.stage .lmlabel{display:none}
.stage.lm-on:not(.pano) .lmlabel{display:flex}
.lmbtn{position:absolute;left:20px;bottom:76px;z-index:31;display:flex;align-items:center;gap:7px;min-height:40px;min-width:40px;padding:0 14px;border:1.5px solid var(--line);border-radius:999px;background:color-mix(in srgb,var(--surface) 92%,transparent);color:var(--ink);font:700 13px var(--f-body);cursor:pointer;box-shadow:0 4px 14px rgba(20,33,61,.18);backdrop-filter:blur(6px)}
.lmbtn i{width:12px;height:12px;border-radius:50%;background:#cfd4da;border:2px solid #fff;box-shadow:0 0 0 1px var(--line)}
.lmbtn.on{background:var(--ink);color:var(--surface);border-color:var(--ink)}
.lmbtn.on i{background:#ffd23f}
@media (max-width:860px){.lmbtn{left:10px;bottom:62px;font-size:12.5px;padding:0 12px}}
`;
  document.head.appendChild(st);
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "lmbtn"; btn.setAttribute("aria-pressed", "false"); btn.title = "顯示或隱藏地標標籤";
  btn.innerHTML = "<i></i>地標標籤";
  btn.onclick = () => { const on = stage.classList.toggle("lm-on"); btn.classList.toggle("on", on); btn.setAttribute("aria-pressed", String(on)); dirty = true; };
  stage.appendChild(btn);
}
paint();
stage.classList.add("ready");
requestAnimationFrame(loop);
const st0 = A.state;
if (st0.selItem) focusItem(st0.selItem); else if (st0.selTheme) focusTheme(st0.selTheme);
