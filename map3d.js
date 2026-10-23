import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

/* Blocky policy city: every theme is a voxel island, every policy a block-built structure.
   Proposals are translucent blueprint blocks; in-office records are solid blocks. */
const A = window.APP;
const stage = document.getElementById("stage");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const BS = 0.125;          // block size in world units (hex radius = 1)
const HEXR = 0.94;         // island radius, leaves a water channel between islands

/* ---------- palette from CSS tokens ---------- */
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function palette() {
  const p = { route: css("--route"), surface: css("--surface") };
  for (const c of A.cities) p[c.city] = css(`--c-${c.city}`);
  return p;
}
let P = palette();

/* ---------- pixel textures (16x16, drawn here) ---------- */
const TS = 16;
const TILES = ["grass_top", "grass_side", "dirt", "stone", "planks", "log_side", "log_top", "leaves",
  "glass", "brick", "quartz", "sand", "water", "red", "gold", "stonebrick",
  "blue", "iron", "wool_taipei", "wool_newtaipei", "wool_keelung", "wool_taoyuan", "asphalt", "lamp"];
const COLS = 8, ROWS = Math.ceil(TILES.length / COLS);
const atlas = document.createElement("canvas");
atlas.width = COLS * TS; atlas.height = ROWS * TS;
const ag = atlas.getContext("2d");
function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9) >>> 0) / 4294967296); }
const hex2rgb = (h) => { const c = new THREE.Color(h); c.convertLinearToSRGB(); return [c.r * 255, c.g * 255, c.b * 255]; };
const shade = ([r, g, b], f) => `rgb(${Math.max(0, Math.min(255, r * f)) | 0},${Math.max(0, Math.min(255, g * f)) | 0},${Math.max(0, Math.min(255, b * f)) | 0})`;
function paintTile(name, i) {
  const ox = (i % COLS) * TS, oy = Math.floor(i / COLS) * TS, R = rng(i * 7919 + 13);
  const px = (x, y, c) => { ag.fillStyle = c; ag.fillRect(ox + x, oy + y, 1, 1); };
  const noise = (base, amp) => { for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) px(x, y, shade(base, 1 - amp / 2 + R() * amp)); };
  const frame = (c) => { ag.fillStyle = c; ag.fillRect(ox, oy, TS, 1); ag.fillRect(ox, oy, 1, TS); ag.fillRect(ox + TS - 1, oy, 1, TS); ag.fillRect(ox, oy + TS - 1, TS, 1); };
  const grass = [106, 170, 78], dirt = [134, 96, 67], stone = [125, 125, 125];
  switch (name) {
    case "grass_top": noise(grass, 0.35); break;
    case "grass_side": noise(dirt, 0.35); for (let x = 0; x < TS; x++) { const h = 3 + ((R() * 3) | 0); for (let y = 0; y < h; y++) px(x, y, shade(grass, 0.85 + R() * 0.3)); } break;
    case "dirt": noise(dirt, 0.4); break;
    case "stone": noise(stone, 0.3); break;
    case "planks": noise([180, 144, 90], 0.18); for (const y of [3, 7, 11, 15]) for (let x = 0; x < TS; x++) px(x, y, shade([120, 90, 52], 1)); for (let k = 0; k < 4; k++) px((k * 5 + 3) % TS, k * 4 + 1, shade([120, 90, 52], 1)); break;
    case "log_side": for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) px(x, y, shade([104, 82, 50], (x % 4 === 0 ? 0.75 : 1) * (0.9 + R() * 0.2))); break;
    case "log_top": noise([176, 140, 86], 0.15); ag.strokeStyle = shade([120, 92, 56], 1); for (let a = 0; a < 3; a++) ag.strokeRect(ox + 2.5 + a * 2, oy + 2.5 + a * 2, 11 - a * 4, 11 - a * 4); break;
    case "leaves": for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) px(x, y, shade([58, 120, 48], R() < 0.18 ? 0.55 : 0.8 + R() * 0.4)); break;
    case "glass": noise([176, 210, 230], 0.08); frame(shade([232, 240, 244], 1)); px(4, 3, "#fff"); px(5, 4, "#fff"); px(6, 5, "#fff"); break;
    case "brick": noise([150, 74, 58], 0.2); for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) if (y % 4 === 3 || (x + (Math.floor(y / 4) % 2) * 4) % 8 === 0) px(x, y, shade([200, 190, 180], 0.9 + R() * 0.1)); break;
    case "quartz": noise([236, 230, 220], 0.06); break;
    case "sand": noise([219, 207, 160], 0.16); break;
    case "water": for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) px(x, y, shade([78, 160, 204], 0.92 + 0.1 * Math.sin((x + y * 0.6) * 0.8 + R()))); break;
    case "red": noise([196, 52, 44], 0.12); break;
    case "gold": noise([246, 208, 60], 0.15); ag.fillStyle = shade([255, 240, 150], 1); ag.fillRect(ox + 2, oy + 2, 4, 1); break;
    case "stonebrick": noise([140, 140, 136], 0.2); for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) if (y % 8 === 7 || (x + (Math.floor(y / 8) % 2) * 8) % 16 === 15) px(x, y, shade([88, 88, 86], 1)); break;
    case "blue": ag.clearRect(ox, oy, TS, TS); for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) px(x, y, `rgba(150,205,255,${0.32 + R() * 0.1})`); frame("rgba(240,250,255,0.95)"); for (let k = 3; k < TS; k += 4) { px(k, 0, "rgb(90,150,230)"); px(0, k, "rgb(90,150,230)"); } break;
    case "iron": noise([210, 212, 214], 0.08); break;
    case "asphalt": noise([70, 72, 76], 0.25); break;
    case "lamp": noise([250, 220, 140], 0.15); break;
    default: if (name.startsWith("wool_")) { const base = hex2rgb(P[name.slice(5)]); for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) px(x, y, shade(base, ((x + y) % 4 === 0 ? 0.88 : 1) * (0.92 + R() * 0.14))); }
  }
}
function drawAtlas() { ag.clearRect(0, 0, atlas.width, atlas.height); TILES.forEach(paintTile); }
drawAtlas();
const nearest = (tex) => { tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace; return tex; };
const atlasTex = nearest(new THREE.CanvasTexture(atlas));
const T = Object.fromEntries(TILES.map((n, i) => [n, i]));

/* block types: [top, side, bottom] */
const tri = (a) => [a, a, a];
const BLOCK = {
  grass: [T.grass_top, T.grass_side, T.dirt], dirt: tri(T.dirt), stone: tri(T.stone), planks: tri(T.planks),
  log: [T.log_top, T.log_side, T.log_top], leaves: tri(T.leaves), glass: tri(T.glass), brick: tri(T.brick),
  quartz: tri(T.quartz), sand: tri(T.sand), water: tri(T.water), red: tri(T.red), gold: tri(T.gold),
  stonebrick: tri(T.stonebrick), iron: tri(T.iron), asphalt: tri(T.asphalt), lamp: tri(T.lamp), blue: tri(T.blue),
};
for (const c of A.cities) BLOCK["wool_" + c.city] = tri(T["wool_" + c.city]);
const CLEAR = new Set(["blue"]);

/* ---------- renderer / scene ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);
renderer.domElement.setAttribute("aria-label", "3D 方塊政策城市；完整內容與鍵盤操作請用右側清單");
const labelR = new CSS2DRenderer();
labelR.domElement.className = "labels";
stage.appendChild(labelR.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = !reduced.matches;
controls.dampingFactor = 0.08;
controls.minPolarAngle = THREE.MathUtils.degToRad(18);
controls.maxPolarAngle = THREE.MathUtils.degToRad(72);
controls.minDistance = 2.5;
controls.maxDistance = 60;
controls.screenSpacePanning = false;

scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9a7a, 1.3));
const sun = new THREE.DirectionalLight(0xfff6e6, 1.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.far = 90;
sun.shadow.bias = -0.0008;
scene.add(sun);

/* ---------- layout from the 2D atlas ---------- */
const pos = (h) => { const [x, y] = A.px(h.q, h.r); return new THREE.Vector3(x / A.S, 0, y / A.S); };
const tileCenter = new Map();
for (const t of A.themes) tileCenter.set(t.id, pos(A.hexOf.get(t.id)));
const cityCenter = new Map();
for (const c of A.cities) {
  const v = new THREE.Vector3();
  c.themes.forEach((t) => v.add(tileCenter.get(t.id)));
  cityCenter.set(c.city, v.divideScalar(c.themes.length));
}
const all = new THREE.Box3();
for (const v of tileCenter.values()) all.expandByPoint(v);
all.expandByScalar(1.1);
const mid = all.getCenter(new THREE.Vector3());
sun.target.position.copy(mid); scene.add(sun.target);
sun.position.copy(mid).add(new THREE.Vector3(-14, 26, 10));

/* water: one big sheet tiled with the water block texture */
const waterCanvas = document.createElement("canvas"); waterCanvas.width = waterCanvas.height = TS;
waterCanvas.getContext("2d").drawImage(atlas, (T.water % COLS) * TS, Math.floor(T.water / COLS) * TS, TS, TS, 0, 0, TS, TS);
const waterTex = new THREE.CanvasTexture(waterCanvas);
waterTex.magFilter = THREE.NearestFilter; waterTex.minFilter = THREE.LinearMipmapLinearFilter; waterTex.colorSpace = THREE.SRGBColorSpace; waterTex.anisotropy = 4;
waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
const WATER_SIZE = 80;
waterTex.repeat.set(WATER_SIZE / BS, WATER_SIZE / BS);
const water = new THREE.Mesh(new THREE.PlaneGeometry(WATER_SIZE, WATER_SIZE).rotateX(-Math.PI / 2),
  new THREE.MeshLambertMaterial({ map: waterTex, transparent: true, opacity: 0.9 }));
water.position.set(mid.x, -BS * 1.35, mid.z);
water.receiveShadow = true;
scene.add(water);

/* ---------- voxel structures ---------- */
const KIND_BY_NAME = [
  [/交通|軌道/, "transit"], [/居住|都更|住宅|都市發展/, "housing"], [/托育|育兒|親子|好孕|家庭/, "family"],
  [/長照|長者|銀髮|醫療|高齡|衛生/, "care"], [/教育|午餐/, "school"], [/產業|AI|科技|就業/, "tower"],
  [/治水|防災/, "water"], [/運動|賽事/, "stadium"], [/觀光|港市|文化/, "landmark"],
  [/環境|城市建設|無菸|食安/, "park"], [/青年/, "loft"], [/族群|地方/, "temple"],
];
const KIND_BY_AREA = { 交通: "transit", 住宅都更: "housing", 社福: "family", 衛生: "care", 教育: "school", 產業: "tower",
  勞動: "loft", 環保: "park", 工務水利: "water", 文化觀光: "landmark", 體育: "stadium", 數位: "tower", 市政效能: "civic", 治安消防: "civic" };
const kindOf = (t, item) => {
  if (t.kind === "record") return KIND_BY_AREA[item.area] || "house";
  for (const [re, k] of KIND_BY_NAME) if (re.test(t.name)) return k;
  return "house";
};
const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) / 4294967295; };

/* each builder places blocks in local coords; footprint w x w centred on (0,0), ground at y=0 */
function builders(put, w, r, wool) {
  const lo = -Math.floor(w / 2), hi = lo + w - 1;
  const fill = (x0, x1, y0, y1, z0, z1, t) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(x, y, z, t); };
  const shell = (h, wall, win) => {
    if (w >= 3) for (let y = 1; y < h; y += 2) for (let k = lo + 1; k < hi; k++) { put(k, y, lo, win); put(k, y, hi, win); put(lo, y, k, win); put(hi, y, k, win); }
    fill(lo, hi, 0, h - 1, lo, hi, wall);
  };
  const pyramid = (y, t) => { for (let k = 0; lo + k <= hi - k; k++) fill(lo + k, hi - k, y + k, y + k, lo + k, hi - k, t); };
  const tree = (x, z, h = 2) => { fill(x, x, 0, h - 1, z, z, "log"); put(x, h + 1, z, "leaves"); fill(x - 1, x + 1, h, h, z - 1, z + 1, "leaves"); };
  return {
    house() { shell(2, "planks", "glass"); pyramid(2, "brick"); },
    family() { shell(2, "quartz", "glass"); pyramid(2, wool); put(hi + 1, 0, lo, "leaves"); },
    housing() { const h = 4 + w + Math.floor(r * 4); fill(lo, hi, h, h, lo, hi, wool); shell(h, "quartz", "glass"); },
    tower() { const h = 7 + w + Math.floor(r * 4); fill(0, 0, h + 1, h + 2, 0, 0, "iron"); fill(lo, hi, h, h, lo, hi, "stone"); for (const x of [lo, hi]) for (const z of [lo, hi]) fill(x, x, 0, h - 1, z, z, "quartz"); fill(lo, hi, 0, h - 1, lo, hi, "glass"); },
    transit() { if (w >= 3) put(lo, 4, 0, "glass"); fill(lo, hi, 4, 4, 0, 0, wool); fill(lo - 1, hi + 1, 3, 3, 0, 0, "stonebrick"); for (const x of [lo, hi]) fill(x, x, 0, 2, 0, 0, "stone"); },
    care() { if (w >= 3) { for (const [x, z] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) put(x, 3, z, "red"); } else put(0, 3, 0, "red"); shell(3, "quartz", "glass"); },
    school() { fill(hi + 1, hi + 1, 3, 4, hi - 1, hi - 1, wool); fill(hi + 1, hi + 1, 0, 4, hi, hi, "log"); fill(lo, hi, 2, 2, lo, hi, "stonebrick"); shell(2, "brick", "glass"); },
    water() { for (let x = lo - 1; x <= hi + 1; x++) for (let z = lo - 1; z <= hi + 1; z++) put(x, 0, z, x < lo || x > hi || z < lo || z > hi ? "stonebrick" : "water"); },
    stadium() { for (let x = lo - 1; x <= hi + 1; x++) for (let z = lo - 1; z <= hi + 1; z++) if (x < lo || x > hi || z < lo || z > hi) { put(x, 1, z, (x + z) % 2 ? wool : "quartz"); put(x, 0, z, "quartz"); } },
    landmark() { const h = 5 + w + Math.floor(r * 3); put(0, h + 1, 0, "gold"); fill(0, 0, 1, h, 0, 0, "stonebrick"); fill(lo, hi, 0, 0, lo, hi, "quartz"); },
    park() { const n = Math.max(1, Math.min(3, w - 1)); for (let k = 0; k < n; k++) tree(lo + k * 2, k % 2 ? hi : lo, 2 + (k % 2)); },
    loft() { fill(lo, hi, 3, 3, lo, 0, wool); fill(lo, hi, 0, 2, lo, 0, "planks"); fill(lo, hi, 0, 1, 1, hi, "glass"); },
    temple() { put(0, 4, 0, "gold"); if (w >= 2) fill(lo, hi, 3, 3, lo, hi, "red"); fill(lo - 1, hi + 1, 2, 2, lo - 1, hi + 1, "red"); fill(lo, hi, 0, 1, lo, hi, "brick"); },
    civic() { fill(lo, hi, 3, 3, lo, hi, "stonebrick"); for (const x of [lo, hi]) for (const z of [lo, hi]) fill(x, x, 1, 2, z, z, "quartz"); fill(lo + 1, hi - 1, 1, 2, lo + 1, hi - 1, "glass"); fill(lo, hi, 0, 0, lo, hi, "stonebrick"); },
  };
}

/* ---------- meshing (face-culled, atlas-textured) ---------- */
const FACES = [
  { d: [-1, 0, 0], s: 1, sh: 0.8, c: [[0, 1, 0, 0, 1], [0, 0, 0, 0, 0], [0, 1, 1, 1, 1], [0, 0, 1, 1, 0]] },
  { d: [1, 0, 0], s: 1, sh: 0.8, c: [[1, 1, 1, 0, 1], [1, 0, 1, 0, 0], [1, 1, 0, 1, 1], [1, 0, 0, 1, 0]] },
  { d: [0, -1, 0], s: 2, sh: 0.5, c: [[1, 0, 1, 1, 0], [0, 0, 1, 0, 0], [1, 0, 0, 1, 1], [0, 0, 0, 0, 1]] },
  { d: [0, 1, 0], s: 0, sh: 1.0, c: [[0, 1, 1, 1, 1], [1, 1, 1, 0, 1], [0, 1, 0, 1, 0], [1, 1, 0, 0, 0]] },
  { d: [0, 0, -1], s: 1, sh: 0.68, c: [[1, 0, 0, 0, 0], [0, 0, 0, 1, 0], [1, 1, 0, 0, 1], [0, 1, 0, 1, 1]] },
  { d: [0, 0, 1], s: 1, sh: 0.68, c: [[0, 0, 1, 0, 0], [1, 0, 1, 1, 0], [0, 1, 1, 0, 1], [1, 1, 1, 1, 1]] },
];
function mesh(blocks, wantClear) {
  const pos = [], nor = [], uv = [], col = [], idx = [], owner = [];
  const eps = 0.02; // inset UVs a hair to avoid atlas bleeding
  for (const [key, b] of blocks) {
    const clear = CLEAR.has(b.t);
    if (clear !== wantClear) continue;
    const [x, y, z] = key.split(",").map(Number);
    const tex = BLOCK[b.t];
    for (const f of FACES) {
      const nb = blocks.get(`${x + f.d[0]},${y + f.d[1]},${z + f.d[2]}`);
      if (nb && (!CLEAR.has(nb.t) || clear)) continue; // hidden behind an opaque block, or inside a blueprint volume
      const ti = tex[f.s], tu = ti % COLS, tv = Math.floor(ti / COLS);
      const n = pos.length / 3;
      for (const [cx, cy, cz, u, v] of f.c) {
        pos.push((x + cx) * BS, (y + cy) * BS, (z + cz) * BS);
        nor.push(...f.d);
        const uu = u ? 1 - eps : eps, vv = v ? 1 - eps : eps;
        uv.push((tu + uu) / COLS, 1 - (tv + 1 - vv) / ROWS);
        col.push(f.sh, f.sh, f.sh);
      }
      idx.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
      owner.push(b.o, b.o);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return { g, owner };
}

/* ---------- build islands ---------- */
const tiles = new Map();
const pickables = [];
const SQ3 = Math.sqrt(3);
const inHex = (x, z, R) => Math.abs(x) <= (SQ3 / 2) * R && Math.abs(z) + Math.abs(x) / SQ3 <= R;
function spots(n) {
  if (n === 1) return [[0, 0]];
  const out = [], spread = n > 12 ? 0.68 : 0.56;
  for (let k = 0; k < n; k++) { const r = spread * Math.sqrt((k + 0.5) / n), a = k * 2.39996 + 0.4; out.push([Math.cos(a) * r, Math.sin(a) * r]); }
  return out;
}
function buildTile(t) {
  const blocks = new Map();
  const put = (x, y, z, type, o) => { const k = `${x},${y},${z}`; if (!blocks.has(k)) blocks.set(k, { t: type, o }); };
  const rec = t.kind === "record", wool = "wool_" + t.city;
  const N = Math.ceil(HEXR / BS) + 1;
  const ground = [];
  for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) {
    const cx = (i + 0.5) * BS, cz = (j + 0.5) * BS;
    if (!inHex(cx, cz, HEXR)) continue;
    ground.push([i, j, !inHex(cx, cz, HEXR - BS * 1.2)]);
  }
  const its = t.items || [], sp = spots(its.length);
  const size = Math.min(0.42, 0.98 / Math.sqrt(Math.max(1, its.length)));
  const w = Math.max(2, Math.min(5, Math.round(size / BS) - 1));
  const itemBox = new Map();
  its.forEach((it, k) => {
    const ox = Math.round(sp[k][0] / BS), oz = Math.round(sp[k][1] / BS);
    const plan = !rec, r = hash(it.id);
    const box = new THREE.Box3();
    const local = (x, y, z, type) => {
      const gx = x + ox, gz = z + oz;
      if (!inHex((gx + 0.5) * BS, (gz + 0.5) * BS, HEXR - BS * 1.2)) return;
      const key = `${gx},${y},${gz}`;
      if (blocks.has(key)) return;
      blocks.set(key, { t: plan ? "blue" : type, o: it.id });
      box.expandByPoint(new THREE.Vector3(gx * BS, y * BS, gz * BS)).expandByPoint(new THREE.Vector3((gx + 1) * BS, (y + 1) * BS, (gz + 1) * BS));
    };
    builders(local, w, r, wool)[kindOf(t, it)]();
    itemBox.set(it.id, box);
  });
  for (const [i, j, rim] of ground) {
    put(i, -1, j, rim ? wool : rec ? "stonebrick" : "grass", "tile");
    put(i, -2, j, "dirt", "tile");
    put(i, -3, j, "stone", "tile");
  }
  if (!rec) { // two decorative trees on proposal islands
    const R = rng(Math.floor(hash(t.id) * 1e9));
    for (let n = 0, tries = 0; n < 2 && tries < 60; tries++) {
      const [i, j, rim] = ground[(R() * ground.length) | 0];
      if (rim || !inHex((i + 0.5) * BS, (j + 0.5) * BS, HEXR - BS * 2.5)) continue;
      let free = true;
      for (let dx = -1; dx <= 1 && free; dx++) for (let dz = -1; dz <= 1 && free; dz++) for (let y = 0; y < 4; y++) if (blocks.has(`${i + dx},${y},${j + dz}`)) { free = false; break; }
      if (!free) continue;
      put(i, 0, j, "log", "tile"); put(i, 1, j, "log", "tile"); put(i, 3, j, "leaves", "tile");
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) put(i + dx, 2, j + dz, "leaves", "tile");
      n++;
    }
  }
  return { blocks, itemBox };
}
for (const t of A.themes) {
  const { blocks, itemBox } = buildTile(t);
  const group = new THREE.Group();
  group.position.copy(tileCenter.get(t.id));
  const mats = {
    solid: new THREE.MeshLambertMaterial({ map: atlasTex, vertexColors: true }),
    clear: new THREE.MeshLambertMaterial({ map: atlasTex, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  };
  const S = mesh(blocks, false), C = mesh(blocks, true);
  const solid = new THREE.Mesh(S.g, mats.solid);
  solid.castShadow = true; solid.receiveShadow = true;
  solid.userData = { type: "voxel", theme: t.id, owner: S.owner };
  const clear = new THREE.Mesh(C.g, mats.clear);
  clear.renderOrder = 2;
  clear.userData = { type: "voxel", theme: t.id, owner: C.owner };
  group.add(solid, clear);
  pickables.push(solid, clear);
  scene.add(group);
  tiles.set(t.id, { t, group, mats, itemBox, lift: 0, liftTo: 0 });
}

/* ---------- clouds ---------- */
const clouds = new THREE.Group();
{
  const R = rng(4242), mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  const geo = new THREE.BoxGeometry(BS * 4, BS * 1.5, BS * 4);
  const size = all.getSize(new THREE.Vector3());
  for (let c = 0; c < 6; c++) {
    const g = new THREE.Group(), n = 4 + ((R() * 5) | 0);
    for (let k = 0; k < n; k++) { const m = new THREE.Mesh(geo, mat); m.position.set(((k % 3) - 1) * BS * 4, 0, (Math.floor(k / 3) - 0.5) * BS * 4); g.add(m); }
    g.position.set(all.min.x + R() * size.x, 7.5 + R() * 1.5, all.min.z - 2 + R() * (size.z + 4));
    clouds.add(g);
  }
  scene.add(clouds);
}

/* ---------- labels ---------- */
const tileLabels = new Map();
for (const t of A.themes) {
  const el = document.createElement("button");
  el.className = "tlabel" + (t.kind === "record" ? " rec" : "");
  el.style.setProperty("--c", `var(--c-${t.city})`);
  el.innerHTML = `<b>${A.CODE[t.city]}·${String(t.no).padStart(2, "0")}</b>${t.name}`;
  el.setAttribute("aria-label", `${A.cityById.get(t.city).cityName} ${t.name}`);
  el.onclick = () => A.openTheme(t.id);
  const o = new CSS2DObject(el);
  o.position.set(0, -BS, HEXR * 0.82);
  tiles.get(t.id).group.add(o);
  tileLabels.set(t.id, { o, el });
}
for (const c of A.cities) {
  const el = document.createElement("div");
  el.className = "clabel";
  el.style.setProperty("--c", `var(--c-${c.city})`);
  el.innerHTML = `${c.cityName}<span>${c.candidate}</span>`;
  const ts = c.themes.map((t) => tileCenter.get(t.id));
  const south = c.city === "newtaipei";
  const edge = ts.reduce((a, b) => ((south ? b.z > a.z : b.z < a.z) ? b : a));
  const o = new CSS2DObject(el);
  o.position.set(edge.x, 1.1, edge.z + (south ? 1.5 : -1.2));
  scene.add(o);
}
const CIRC = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
let pins = [], pinsFor = null;
function showPins(themeId) {
  if (pinsFor === themeId) return;
  for (const o of pins) { o.parent?.remove(o); o.element.remove(); }
  pins = []; pinsFor = themeId;
  if (!themeId) return;
  const TT = tiles.get(themeId), t = TT.t, many = (t.items || []).length > 5;
  (t.items || []).forEach((it, k) => {
    const box = TT.itemBox.get(it.id);
    if (!box || box.isEmpty()) return;
    const el = document.createElement("button");
    el.className = "pin" + (many ? " mini" : "");
    el.dataset.item = it.id;
    el.innerHTML = `<b>${CIRC[k] || k + 1}</b><span>${it.name}</span>`;
    el.setAttribute("aria-label", it.name);
    el.onclick = (e) => { e.stopPropagation(); A.openItem(it.id); };
    const o = new CSS2DObject(el);
    const c = box.getCenter(new THREE.Vector3());
    o.position.set(c.x, box.max.y + 0.1, c.z);
    TT.group.add(o); pins.push(o);
  });
}

/* beacon beam + outline over the selected item */
const beamMat = new THREE.MeshBasicMaterial({ color: 0xcdeeff, transparent: true, opacity: 0.5, depthWrite: false });
const beam = new THREE.Mesh(new THREE.BoxGeometry(BS * 0.9, 8, BS * 0.9).translate(0, 4, 0), beamMat);
beam.visible = false; beam.renderOrder = 4; scene.add(beam);
const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0x111111 }));
outline.visible = false; scene.add(outline);

/* ---------- flows: drifting block particles along arcs ---------- */
const flowViews = [];
const pairN = {};
const flowGeo = new THREE.BoxGeometry(BS * 0.7, BS * 0.7, BS * 0.7);
for (const f of A.flows) {
  const cs = f.cities.filter((x) => cityCenter.has(x)), hub = cs[0];
  for (const other of cs.slice(1)) {
    const key = [hub, other].sort().join("|"); const n = (pairN[key] = (pairN[key] || 0) + 1);
    const a = cityCenter.get(hub).clone().setY(0.4), b = cityCenter.get(other).clone().setY(0.4);
    const m = a.clone().lerp(b, 0.5);
    const d = b.clone().sub(a), side = new THREE.Vector3(-d.z, 0, d.x).normalize();
    m.add(side.multiplyScalar(((n % 2 ? 1 : -1) * Math.ceil(n / 2)) * 0.55)).setY(2.4 + d.length() * 0.18 + n * 0.25);
    const curve = new THREE.QuadraticBezierCurve3(a, m, b);
    const count = Math.max(8, Math.round(curve.getLength() / (BS * 2.2)));
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(P.route), transparent: true, opacity: 0.6 });
    const inst = new THREE.InstancedMesh(flowGeo, mat, count);
    inst.frustumCulled = false;
    const hit = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.12, 5, false), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
    hit.userData = { type: "flow", id: f.id };
    scene.add(inst, hit); pickables.push(hit);
    const pattern = f.tier === "official" ? [1] : f.tier === "news" ? [1, 1, 0] : [1, 0, 0];
    flowViews.push({ f, inst, hit, mat, curve, count, pattern });
  }
}
const dummy = new THREE.Object3D();
function layFlow(v, phase) {
  for (let k = 0; k < v.count; k++) {
    v.curve.getPointAt(((k + phase) / v.count) % 1, dummy.position);
    dummy.scale.setScalar(v.pattern[k % v.pattern.length] ? 1 : 0.0001);
    dummy.updateMatrix();
    v.inst.setMatrixAt(k, dummy.matrix);
  }
  v.inst.instanceMatrix.needsUpdate = true;
}
flowViews.forEach((v) => layFlow(v, 0));

/* ---------- state -> scene ---------- */
const GRAY = new THREE.Color(0x8c9196), WHITE = new THREE.Color(0xffffff);
let focusId = null, dirty = true;
function paint() {
  const st = A.state, q = st.query;
  const selF = st.selFlow && A.flows.find((x) => x.id === st.selFlow);
  for (const [id, TT] of tiles) {
    const t = TT.t;
    let dim = !!st.cityFilter && t.city !== st.cityFilter;
    if (selF) dim = !selF.cities.includes(t.city);
    const sel = id === st.selTheme, hit = !!q && A.matches(t);
    TT.mats.solid.color.copy(dim ? GRAY : WHITE);
    TT.mats.solid.emissive.set(hit ? P.route : 0x000000);
    TT.mats.solid.emissiveIntensity = hit ? 0.18 : 0;
    TT.mats.clear.opacity = dim ? 0.25 : 1;
    TT.liftTo = sel ? BS * 1.5 : 0;
    const L = tileLabels.get(id);
    L.el.classList.toggle("sel", sel);
    L.el.classList.toggle("dim", dim);
  }
  for (const v of flowViews) {
    const picked = st.selFlow === v.f.id;
    const vis = (st.flowsOn || picked) && !(st.cityFilter && !v.f.cities.includes(st.cityFilter));
    v.inst.visible = vis; v.hit.visible = vis;
    v.mat.opacity = picked ? 1 : 0.6;
  }
  focusId = st.selItem;
  if (!st.selTheme) showPins(null);
  document.querySelectorAll(".pin").forEach((p) => p.classList.toggle("sel", p.dataset.item === st.selItem));
  placeBeam();
  dirty = true;
}
function placeBeam() {
  const it = focusId && A.items.get(focusId);
  const TT = it && tiles.get(it.theme), box = TT && TT.itemBox.get(focusId);
  if (!box || box.isEmpty()) { beam.visible = outline.visible = false; return; }
  TT.group.updateMatrixWorld();
  const wc = TT.group.localToWorld(box.getCenter(new THREE.Vector3()));
  const s = box.getSize(new THREE.Vector3());
  beam.position.set(wc.x, wc.y + s.y / 2, wc.z); beam.visible = true;
  outline.position.copy(wc); outline.scale.copy(s).addScalar(0.02); outline.visible = true;
}

/* ---------- camera ---------- */
let fly = null;
function overview() {
  const size = all.getSize(new THREE.Vector3());
  const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
  const span = Math.max(size.x / Math.max(aspect, 0.6), size.z) * 1.05;
  const dist = span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * (aspect < 1 ? 1.22 : 1.04);
  const dir = new THREE.Vector3(0.12, 0.92, 0.75).normalize();
  return { target: mid.clone(), pos: mid.clone().add(dir.multiplyScalar(dist)) };
}
function flyTo(target, offset) {
  const p = target.clone().add(offset);
  if (reduced.matches) { camera.position.copy(p); controls.target.copy(target); controls.update(); dirty = true; return; }
  fly = { t0: performance.now(), p0: camera.position.clone(), p1: p, q0: controls.target.clone(), q1: target };
}
function home() { const o = overview(); flyTo(o.target, o.pos.clone().sub(o.target)); showPins(null); }
function focusTheme(id) {
  const TT = tiles.get(id); if (!TT) return;
  showPins(id);
  const narrow = stage.clientWidth < 520;
  flyTo(TT.group.position.clone().setY(0.2), new THREE.Vector3(1.6, narrow ? 7.6 : 6.4, narrow ? 7.2 : 6.2));
}
function focusItem(id) {
  const it = A.items.get(id); if (!it) return;
  const TT = tiles.get(it.theme);
  showPins(it.theme);
  document.querySelectorAll(".pin").forEach((p) => p.classList.toggle("sel", p.dataset.item === id));
  const box = TT.itemBox.get(id);
  TT.group.updateMatrixWorld();
  const c = box && !box.isEmpty() ? TT.group.localToWorld(box.getCenter(new THREE.Vector3())) : TT.group.position.clone();
  flyTo(c.setY(0.25), new THREE.Vector3(1.1, 3.0, 3.2));
}
function focusFlow(id) {
  showPins(null);
  const v = flowViews.filter((x) => x.f.id === id); if (!v.length) return;
  const box = new THREE.Box3(); v.forEach((x) => box.expandByObject(x.hit));
  const c = box.getCenter(new THREE.Vector3()).setY(0.4), s = box.getSize(new THREE.Vector3()).length();
  flyTo(c, new THREE.Vector3(0.2, 0.8, 0.7).normalize().multiplyScalar(Math.max(8, s * 1.3)));
}

/* ---------- picking ---------- */
const ray = new THREE.Raycaster();
let down = null, hoverEl = null;
const ndc = (e) => { const r = renderer.domElement.getBoundingClientRect(); return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
function pick(e) {
  ray.setFromCamera(ndc(e), camera);
  for (const h of ray.intersectObjects(pickables.filter((o) => o.visible), false)) {
    const u = h.object.userData;
    if (u.type === "flow") return { type: "flow", id: u.id };
    if (u.type === "voxel") { const o = u.owner[h.faceIndex]; return o && o !== "tile" ? { type: "item", id: o, theme: u.theme } : { type: "tile", id: u.theme }; }
  }
  return null;
}
renderer.domElement.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; fly = null; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
  const u = pick(e); down = null;
  if (!u) return;
  if (u.type === "item") { if (A.state.selTheme === u.theme) A.openItem(u.id); else A.openTheme(u.theme); }
  else if (u.type === "tile") A.openTheme(u.id);
  else if (u.type === "flow") A.openFlow(u.id);
});
renderer.domElement.addEventListener("pointermove", (e) => {
  if (e.buttons) return;
  const u = pick(e);
  renderer.domElement.style.cursor = u ? "pointer" : "grab";
  const tid = u && (u.type === "tile" ? u.id : u.type === "item" ? u.theme : null);
  const el = tid ? tileLabels.get(tid).el : null;
  if (el !== hoverEl) { hoverEl?.classList.remove("hot"); el?.classList.add("hot"); hoverEl = el; }
});
controls.addEventListener("change", () => (dirty = true));

/* ---------- resize / theme ---------- */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h); labelR.setSize(w, h); dirty = true;
}
new ResizeObserver(resize).observe(stage);
function retheme() {
  P = palette();
  drawAtlas(); atlasTex.needsUpdate = true;
  for (const v of flowViews) v.mat.color.set(P.route);
  paint();
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme);
new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

/* ---------- loop ---------- */
let last = performance.now(), clock = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  let busy = false;
  if (fly) {
    const t = Math.min(1, (now - fly.t0) / 900), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.q0, fly.q1, e);
    if (t === 1) fly = null; busy = true;
  }
  for (const TT of tiles.values()) {
    if (Math.abs(TT.lift - TT.liftTo) > 0.0005) {
      TT.lift += (TT.liftTo - TT.lift) * (reduced.matches ? 1 : Math.min(1, dt * 10));
      TT.group.position.y = TT.lift; busy = true;
      if (focusId && A.items.get(focusId)?.theme === TT.t.id) placeBeam();
    }
  }
  if (!reduced.matches) {
    clock += dt;
    for (const v of flowViews) if (v.inst.visible) layFlow(v, clock * 1.6);
    for (const g of clouds.children) { g.position.x += dt * 0.08; if (g.position.x > all.max.x + 3) g.position.x = all.min.x - 3; }
    if (focusId) beamMat.opacity = 0.38 + 0.18 * Math.sin(clock * 3);
    busy = true;
  }
  stage.classList.toggle("far", camera.position.distanceTo(controls.target) > 22);
  if (controls.update()) busy = true;
  if (busy || dirty) { renderer.render(scene, camera); labelR.render(scene, camera); dirty = false; }
  requestAnimationFrame(loop);
}

resize();
{ const o = overview(); camera.position.copy(o.pos); controls.target.copy(o.target); controls.update(); }
window.MAP3D = { paint, focusTheme, focusItem, focusFlow, home };
paint();
stage.classList.add("ready");
requestAnimationFrame(loop);
const st0 = A.state;
if (st0.selItem) focusItem(st0.selItem); else if (st0.selTheme) focusTheme(st0.selTheme);
