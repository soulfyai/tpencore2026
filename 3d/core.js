import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/* ===== core: renderer, layout constants, instanced part kit ===== */
const A = window.APP;
const stage = document.getElementById("stage");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const narrowScreen = () => stage.clientWidth < 620;
const QUALITY = innerWidth <= 800 || /Mobi|Android/i.test(navigator.userAgent) ? "medium" : "high";

const R = 2.02;            // island circumradius (pointy-top, corners on ±z)
const SP = 2.28;           // axial spacing; centre distance = SP*√3
const TOP = 0.65;          // island top height
const RING_R = 1.8;        // walkway ring
const INNER = 1.42;        // building zone
const WATER_Y = -0.18;
const SQ3 = Math.sqrt(3);

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const cityHex = (c) => css(`--c-${c}`) || "#888888";
const col = (h) => new THREE.Color(h);
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9) >>> 0) / 4294967296); }
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];

/* renderer */
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, QUALITY === "high" ? 1.5 : 1.25));
renderer.shadowMap.enabled = QUALITY === "high";
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
stage.appendChild(renderer.domElement);
renderer.domElement.setAttribute("aria-label", "3D 政策城市；完整內容與鍵盤操作請用右側清單");
const labelR = new CSS2DRenderer();
labelR.domElement.className = "labels";
stage.appendChild(labelR.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.3, 420);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = !reduced.matches;
controls.dampingFactor = 0.07;
controls.enablePan = true; controls.screenSpacePanning = false; controls.panSpeed = 1.1;
// map-style gestures: drag (one finger / left mouse) pans across the sea to other islands; two fingers pinch-zoom and rotate; right mouse rotates
controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
controls.minPolarAngle = THREE.MathUtils.degToRad(22);
controls.maxPolarAngle = THREE.MathUtils.degToRad(70);
controls.minDistance = 3;
controls.maxDistance = 95; // placeholder — main.js locks this to the Taipei-centred panorama distance on init/resize

/* ---------- layout: 2D axial atlas -> world ---------- */
const K = SP / A.S;
const LIVE_CITIES = new Set(["taipei", "newtaipei", "keelung", "taoyuan"]); // all four cities are built
const CLUSTER_GAP = { newtaipei: 13, keelung: 11, taoyuan: 17 };
const PITCH = 5.0;           // block-island spacing (brick layout, canals between)
const CELL = 0.82;           // one lot inside a block island
const islands = [];            // {t, id, city, c: Vector3, q, r, ground, rec, live}
const islandById = new Map();
for (const t of A.themes) {
  const h = A.hexOf.get(t.id);
  const isl = { t, id: t.id, city: t.city, q: h.q, r: h.r, c: new THREE.Vector3((h.q + h.r / 2) * PITCH, 0, h.r * PITCH), rec: t.kind === "record", lift: 0, liftTo: 0, live: LIVE_CITIES.has(t.city) };
  islands.push(isl); islandById.set(t.id, isl);
}
/* pull the four archipelagos apart so each reads as its own island group */
{
  const cen = (c) => { const v = new THREE.Vector3(), m = islands.filter((i) => i.city === c); m.forEach((i) => v.add(i.c)); return v.divideScalar(m.length); };
  const tp = cen("taipei");
  for (const c of ["newtaipei", "keelung", "taoyuan"]) {
    const d = cen(c).sub(tp).setY(0), off = d.clone().normalize().multiplyScalar(CLUSTER_GAP[c]);
    for (const i of islands) if (i.city === c) i.c.add(off);
  }
}
const cityCenter = new Map();
for (const c of A.cities) {
  const v = new THREE.Vector3(); const mine = islands.filter((i) => i.city === c.city);
  mine.forEach((i) => v.add(i.c)); cityCenter.set(c.city, v.divideScalar(mine.length));
}
const bounds = new THREE.Box3();
for (const i of islands) bounds.expandByPoint(i.c);
bounds.expandByScalar(PITCH * 0.55);
const MID = bounds.getCenter(new THREE.Vector3());
const AXIAL_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const islandAt = new Map(islands.map((i) => [i.q + "," + i.r, i]));
const neighbors = new Map(islands.map((i) => [i.id, AXIAL_DIRS.map(([dq, dr]) => islandAt.get(i.q + dq + "," + (i.r + dr))).filter((n) => n && n.city === i.city)]));
/* local hex helpers (pointy-top, corners at ±z) */
const corner = (k, r = R) => { const a = Math.PI / 180 * (60 * k - 90); return new THREE.Vector2(r * Math.cos(a), r * Math.sin(a)); };
const inHex = (x, z, r) => Math.abs(x) <= (SQ3 / 2) * r && Math.abs(z) + Math.abs(x) / SQ3 <= r;

/* ---------- instanced part kit ---------- */
function prismGeo() { // gable roof: ridge along x, unit box footprint
  const g = new THREE.BufferGeometry();
  const v = [-0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5];
  const i = [0, 3, 1, 1, 3, 2, 4, 5, 3, 5, 2, 3, 0, 4, 3, 1, 2, 5, 0, 1, 4, 1, 5, 4];
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.setIndex(i);
  const ng = g.toNonIndexed(); ng.computeVertexNormals(); return ng;
}
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  rbox: new RoundedBoxGeometry(1, 1, 1, 2, 0.14),
  turf: new RoundedBoxGeometry(1, 1, 1, 2, 0.14),
  turfc: new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
  cone: new THREE.ConeGeometry(0.5, 1, 12),
  cone4: new THREE.ConeGeometry(0.71, 1, 4).rotateY(Math.PI / 4),
  prism: prismGeo(),
  sphere: new THREE.SphereGeometry(0.5, 14, 10),
  dome: new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  torus: new THREE.TorusGeometry(0.5, 0.11, 8, 22),
  ico: new THREE.IcosahedronGeometry(0.5, 0),
  ico1: new THREE.IcosahedronGeometry(0.5, 1),
};
const MAT = {
  solid: new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0.02 }),
  glow: new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0, emissive: 0xffd08a, emissiveIntensity: 0 }),
  glowCool: new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0, emissive: 0xaee8ff, emissiveIntensity: 0 }), // futuristic LED strips: cool white-blue after dark
};
/* ---------- procedural facade materials: window grids that keep their size on any box (UVs from instance scale) ---------- */
const FACADE = {};
{
  const cv = (draw) => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"); draw(g, rng(7)); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const roofPatch = (g, col) => { g.fillStyle = col; g.fillRect(0, 240, 16, 16); };
  const grid = (cols, rows, wall, draw) => (g, R) => { g.fillStyle = wall; g.fillRect(0, 0, 256, 256); const cw = 256 / cols, rh = 256 / rows; for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) draw(g, k * cw, r * rh, cw, rh, R); };
  const glassPane = (g, x, y, w, h) => { const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, "#d9eefc"); gr.addColorStop(0.45, "#8fb8d8"); gr.addColorStop(1, "#5f86ad"); g.fillStyle = gr; g.fillRect(x, y, w, h); };
  const T = {
    fglass: cv((g, R) => { grid(4, 4, "#e9eef4", (g, x, y, w, h) => { glassPane(g, x + 2, y + 3, w - 4, h - 5); g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.moveTo(x + w * 0.1, y + h); g.lineTo(x + w * 0.45, y + 3); g.lineTo(x + w * 0.6, y + 3); g.lineTo(x + w * 0.25, y + h); g.fill(); })(g, R); roofPatch(g, "#dfe5ec"); }),
    foffice: cv((g, R) => { grid(4, 4, "#f4f2ee", (g, x, y, w, h) => { glassPane(g, x + 9, y + 12, w - 18, h - 24); g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(x, y + h - 6, w, 6); })(g, R); roofPatch(g, "#d9dadc"); }),
    fapt: cv((g, R) => { grid(4, 4, "#f7f3ec", (g, x, y, w, h, R) => { glassPane(g, x + 12, y + 10, w - 24, h - 30); g.fillStyle = "#ffffff"; g.fillRect(x + 4, y + h - 20, w - 8, 9); g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(x + 4, y + h - 11, w - 8, 3); if (R() < 0.3) { g.fillStyle = "#c9ced3"; g.fillRect(x + w - 18, y + h - 34, 12, 10); } })(g, R); roofPatch(g, "#d6d2c8"); }),
  };
  const lit = (cols, rows, inset) => cv((g, R) => { g.fillStyle = "#000"; g.fillRect(0, 0, 256, 256); const cw = 256 / cols, rh = 256 / rows; for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) if (R() < 0.45) { g.fillStyle = R() < 0.7 ? "#ffd27a" : "#cfe6ff"; g.fillRect(k * cw + inset[0], r * rh + inset[1], cw - inset[0] * 2, rh - inset[1] * 2); } });
  const E = { fglass: lit(4, 4, [3, 4]), foffice: lit(4, 4, [9, 12]), fapt: lit(4, 4, [12, 12]) };
  const SIZE = { fglass: [0.9, 0.72], foffice: [1.0, 0.8], fapt: [1.0, 0.76] };
  for (const name of Object.keys(T)) {
    const m = new THREE.MeshStandardMaterial({ map: T[name], emissiveMap: E[name], emissive: 0xffffff, emissiveIntensity: 0, roughness: name === "fglass" ? 0.28 : 0.75, metalness: name === "fglass" ? 0.12 : 0 });
    const [sx, sy] = SIZE[name];
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace("#include <uv_vertex>", `#include <uv_vertex>
        vec3 fsc = vec3(1.0);
        #ifdef USE_INSTANCING
          fsc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        #endif
        vec2 fuv = abs(normal.x) > 0.5 ? vec2(position.z * fsc.z, (position.y + 0.5) * fsc.y) : vec2(position.x * fsc.x, (position.y + 0.5) * fsc.y);
        fuv /= vec2(${sx.toFixed(2)}, ${sy.toFixed(2)});
        if (abs(normal.y) > 0.5) fuv = vec2(0.02, 0.02);
        vMapUv = fuv;
        #ifdef USE_EMISSIVEMAP
          vEmissiveMapUv = fuv;
        #endif`);
    };
    m.customProgramCacheKey = () => "facade-" + name;
    FACADE[name] = m;
  }
  /* turf: lawn texture mapped in world XZ so it tiles evenly on bases of any size; instance colour tints it */
  const turfTex = cv((g, R) => { g.fillStyle = "#a9bd87"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2200; i++) { const x = R() * 256, y = R() * 256; g.fillStyle = R() < 0.5 ? "rgba(100,125,75,.3)" : "rgba(214,226,180,.35)"; g.fillRect(x, y, 2, 4); }
    g.fillStyle = "rgba(255,255,255,.06)"; for (let y = 0; y < 256; y += 64) g.fillRect(0, y, 256, 32); });
  const tm = new THREE.MeshStandardMaterial({ map: turfTex, roughness: 0.95 });
  tm.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("#include <uv_vertex>", `#include <uv_vertex>
      vec4 twp = vec4(position, 1.0);
      #ifdef USE_INSTANCING
        twp = instanceMatrix * twp;
      #endif
      twp = modelMatrix * twp;
      vMapUv = twp.xz * 0.45;`);
  };
  tm.customProgramCacheKey = () => "turf";
  FACADE.turf = tm; FACADE.turfc = tm;
}
const parts = [];               // {g, glow, m, c, owner, isl}
const partsByIsland = new Map();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
/* model context: places parts in model space, transformed by slot (x,z,scale,rot) into island space */
function ctxFor(isl, owner, x, z, s, rot) {
  const base = new THREE.Matrix4().compose(new THREE.Vector3(x, TOP, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), new THREE.Vector3(s, s, s));
  return { isl, owner, base, s };
}
function part(ctx, g, x, y, z, sx, sy, sz, color, ry = 0, rx = 0, rz = 0, glow = false) {
  const m = new THREE.Matrix4().compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
  m.premultiply(ctx.base);
  const p = { g, glow, m, c: col(color), owner: ctx.owner, isl: ctx.isl };
  parts.push(p);
  if (!partsByIsland.has(ctx.isl)) partsByIsland.set(ctx.isl, []);
  partsByIsland.get(ctx.isl).push(p);
  return p;
}
const batches = new Map();     // key -> InstancedMesh
function buildBatches() {
  const groups = new Map();
  for (const p of parts) { const k = (p.glow === "cool" ? "c:" : p.glow ? "g:" : "s:") + p.g; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
  for (const [k, list] of groups) {
    const [kind, gname] = k.split(":");
    const im = new THREE.InstancedMesh(GEO[gname] || GEO.box, kind === "g" ? MAT.glow : kind === "c" ? MAT.glowCool : FACADE[gname] || MAT.solid, list.length);
    im.castShadow = true; im.receiveShadow = true;
    im.userData = { type: "parts", owners: list.map((p) => p.owner), isl: list.map((p) => p.isl) };
    list.forEach((p, n) => { p.mesh = im; p.index = n; im.setColorAt(n, p.c); });
    scene.add(im); batches.set(k, im);
  }
  for (const isl of islands) placeIslandParts(isl);
  for (const p of partsByIsland.get("_static") || []) { p.mesh.setMatrixAt(p.index, p.m); p.mesh.instanceMatrix.needsUpdate = true; }
}
const islandMatrix = (isl) => new THREE.Matrix4().makeTranslation(isl.c.x, isl.lift, isl.c.z);
function placeIslandParts(isl) {
  const M = islandMatrix(isl);
  const Z = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const p of partsByIsland.get(isl.id) || []) { p.mesh.setMatrixAt(p.index, isl.occluding && p.tall ? Z : _m.multiplyMatrices(M, p.m)); p.mesh.instanceMatrix.needsUpdate = true; }
}
