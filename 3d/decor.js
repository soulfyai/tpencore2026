/* ===== fill the city: a policy plaza in each neighbourhood, a BuildIt skyline around it, streets, highway, port, landmarks ===== */
const ITEMS3D = new Map();     // itemId -> {isl, x, z, size, box(Box3 world, unlifted), kind, hero}
const LANDMARKS3D = [], LAMP_POOLS = [], LAMP_BEAMS = [];
{
  const unit = new THREE.Box3(new THREE.Vector3(-0.5, -0.5, -0.5), new THREE.Vector3(0.5, 0.5, 0.5));
  /* cities not built yet: a tidy construction site */
  const site = (isl) => {
    const R1 = rng(hash(isl.id)), ctx = ctxFor(isl.id, null, 0, 0, 1, 0), p = (g, ...a) => part(ctx, g, ...a);
    const Y = "#f0b429", GR = "#9aa0a6";
    const crane = (x, z, h, ry) => {
      for (let y = 0; y < h; y += 0.18) { p("box", x, y + 0.09, z, 0.1, 0.18, 0.1, Y); p("box", x, y + 0.09, z, 0.12, 0.02, 0.12, "#c98f12"); }
      p("box", x + Math.cos(ry) * 0.45, h + 0.04, z - Math.sin(ry) * 0.45, 1.4, 0.06, 0.08, Y, ry);
      p("box", x - Math.cos(ry) * 0.35, h + 0.0, z + Math.sin(ry) * 0.35, 0.22, 0.16, 0.16, "#5d656d", ry);
      p("box", x, h + 0.12, z, 0.16, 0.14, 0.16, "#f8f6f1");
      p("box", x + Math.cos(ry) * 1.0, h - 0.25, z - Math.sin(ry) * 1.0, 0.01, 0.5, 0.01, "#3b4148");
    };
    const frame = (x, z, w, d, h) => {
      p("box", x, 0.03, z, w + 0.1, 0.06, d + 0.1, "#b5b0a6");
      for (let y = 0.2; y <= h; y += 0.2) p("box", x, y, z, w, 0.03, d, "#d7d3cb");
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) p("box", x + dx * w / 2, h / 2, z + dz * d / 2, 0.04, h, 0.04, GR);
      p("box", x, h * 0.45, z + d / 2 + 0.01, w * 0.9, h * 0.7, 0.01, "#f08a3c");
    };
    const n = 1 + (R1() < 0.5 ? 1 : 0);
    frame(-0.35, 0.15, 0.7, 0.6, 0.5 + R1() * 0.5);
    if (n > 1) frame(0.55, -0.4, 0.5, 0.5, 0.3 + R1() * 0.3);
    crane(0.5 + R1() * 0.2, 0.45, 1.3 + R1() * 0.5, R1() * Math.PI * 2);
    for (let k = 0; k < 3; k++) p("box", -0.7 + k * 0.12, 0.05 + k * 0.0, -0.75, 0.5, 0.06, 0.1, "#a8794f");
    p("rbox", -0.95, 0.09, -0.3, 0.3, 0.14, 0.18, Y); p("box", -0.8, 0.2, -0.3, 0.3, 0.04, 0.05, Y, 0, 0, -0.6);
    for (let k = 0; k < 5; k++) { const a = k * 1.25, x = Math.cos(a) * 1.25, z = Math.sin(a) * 1.25; p("cone", x, 0.08, z, 0.08, 0.16, 0.08, "#f08a3c"); p("cyl", x, 0.09, z, 0.06, 0.03, 0.06, "#ffffff"); }
    for (const [x, z, ry] of [[0, -1.05, 0], [0, 1.05, 0], [-1.05, 0, Math.PI / 2], [1.05, 0, Math.PI / 2]]) p("box", x, 0.07, z, 1.6, 0.12, 0.03, (x + z) > 0 ? "#f0c64a" : "#ffffff", ry);
  };


  const ZONE = (name) => { for (const [re, z] of [[/環保|運動|體育|賽事/, "P"], [/交通|軌道|工務|水利|治水|防災|治安|消防|城市建設/, "I"], [/產業|AI|科技|就業|觀光|港市|文化|族群|地方|其他/, "C"]]) if (re.test(name)) return z; return "R"; };
  const pk = (r, a) => a[(r() * a.length) | 0];
  const GLASS = ["#5fc4d4", "#4f8fe0", "#7f8ff0", "#9fd0f0", "#6fb7c9", "#a7b8d8"];
  const NEON = ["#ff4fa3", "#33e1ff", "#ffd23f", "#b06bff", "#ff6b3d"];
  const WALLS = ["#fdf6ea", "#f6efe3", "#fbe8d0", "#eef4fa", "#e9eef5"];
  const ROOFS = ["#e0453c", "#2f6fd6", "#38a9c9", "#f08a3c", "#5b6b7d"];

  /* ---------- building kit (local to the building, y=0 at street level + curb) ---------- */
  const B = {
    tower(p, s, h, r) {
      const gl = pk(r, GLASS), round = r() < 0.25, d = s * (0.8 + r() * 0.2);
      p("rbox", 0, 0.16, 0, s * 1.18, 0.32, d * 1.18, "#eef1f5"); p("box", 0, 0.12, d * 0.59 + 0.004, s * 1.0, 0.14, 0.01, "#ffe9b0", 0, 0, 0, true);
      p("box", s * 0.25, 0.27, d * 0.59 + 0.012, s * 0.45, 0.09, 0.012, pk(r, NEON), 0, 0, 0, true);
      if (round) { p("cyl", 0, 0.32 + h / 2, 0, s, h, s, gl); for (let y = 0.5; y < h + 0.2; y += 0.2) p("cyl", 0, y, 0, s * 1.02, 0.03, s * 1.02, "#e8f6ff", 0, 0, 0, true); }
      else { p("fglass", 0, 0.32 + h / 2, 0, s, h, d, gl); p("box", 0, 0.32 + h * 0.5, 0, s * 0.18, h * 0.98, d * 1.01, "#e9eef4"); }
      if (r() < 0.25) { p("cyl", 0, 0.32 + h + 0.04, 0, s * 0.6, 0.05, s * 0.6, "#5d6168"); p("cyl", 0, 0.32 + h + 0.07, 0, s * 0.42, 0.01, s * 0.42, "#f0c64a"); }
      const top = 0.32 + h, k = r();
      if (k < 0.35) { p("box", 0, top + h * 0.09, 0, s * 0.7, h * 0.18, d * 0.7, gl); p("cone4", 0, top + h * 0.18 + 0.2, 0, s * 0.7, 0.4, d * 0.7, "#dfe8f2"); }
      else if (k < 0.65) { p("box", 0, top + 0.05, 0, s * 1.04, 0.1, d * 1.04, "#dfe8f2"); p("cyl", 0, top + 0.4, 0, 0.03, 0.7, 0.03, "#dfe3e6"); p("sphere", 0, top + 0.76, 0, 0.06, 0.06, 0.06, "#ff5a5a", 0, 0, 0, true); }
      else { p("frust", 0, top + 0.18, 0, s * 0.9, 0.36, d * 0.9, gl); p("box", 0, top + 0.4, 0, s * 0.4, 0.1, d * 0.4, pk(r, NEON), 0, 0, 0, true); }
      return top + 0.8;
    },
    office(p, s, h, r) {
      const d = s * (0.75 + r() * 0.25), wall = pk(r, WALLS);
      p(r() < 0.5 ? "foffice" : "fapt", 0, h / 2, 0, s, h, d, wall); p("box", 0, h + 0.03, 0, s * 1.03, 0.06, d * 1.03, pk(r, ROOFS));
      if (r() < 0.4) { p("cyl", s * 0.25, h + 0.16, d * 0.2, 0.14, 0.2, 0.14, "#b9a58c"); p("cone", s * 0.25, h + 0.3, d * 0.2, 0.16, 0.08, 0.16, "#8a7458"); }
      p("box", 0, 0.08, d / 2 + 0.06, s * 0.9, 0.02, 0.12, pk(r, ROOFS), 0, -0.3);
      if (r() < 0.5) p("box", s * 0.2, h * 0.7, d / 2 + 0.012, s * 0.4, 0.1, 0.012, pk(r, NEON), 0, 0, 0, true);
      p("box", -s * 0.2, h + 0.1, -d * 0.15, s * 0.25, 0.1, d * 0.25, "#d7dbe0");
      return h + 0.2;
    },
    house(p, s, h, r) {
      const n = s > 0.6 ? 2 : 1;
      for (let k = 0; k < n; k++) { const x = n > 1 ? (k - 0.5) * s * 0.5 : 0, w = n > 1 ? s * 0.46 : s * 0.8, hh = 0.22 + r() * 0.12;
        p("rbox", x, hh / 2, 0, w, hh, s * 0.7, pk(r, WALLS)); p("prism", x, hh + 0.08, 0, w + 0.05, 0.16, s * 0.74, pk(r, ROOFS));
        p("box", x, hh * 0.45, s * 0.35 + 0.006, w * 0.5, hh * 0.3, 0.012, "#fff1c8", 0, 0, 0, true); }
      return 0.5;
    },
    shop(p, s, h, r) {
      const hh = 0.32 + r() * 0.2, d = s * 0.8;
      p("rbox", 0, hh / 2, 0, s, hh, d, pk(r, WALLS)); p("box", 0, 0.1, d / 2 + 0.006, s * 0.86, 0.14, 0.012, "#bfe3f5", 0, 0, 0, true);
      p("box", 0, 0.2, d / 2 + 0.05, s * 0.92, 0.02, 0.1, pk(r, ["#e0453c", "#2f6fd6", "#f0c64a", "#28c8c8"]), 0, -0.35);
      p("box", 0, hh * 0.8, d / 2 + 0.01, s * 0.55, 0.09, 0.012, pk(r, NEON), 0, 0, 0, true);
      return hh + 0.1;
    },
    park(p, s, h, r) {
      p("cyl", 0, 0.01, 0, s * 1.1, 0.02, s * 1.1, "#8ccf68");
      if (r() < 0.5) { p("cyl", 0, 0.03, 0, s * 0.5, 0.04, s * 0.5, "#cfc9bd"); p("cyl", 0, 0.05, 0, s * 0.42, 0.03, s * 0.42, "#6fd3f0", 0, 0, 0, true); p("cyl", 0, 0.16, 0, 0.05, 0.22, 0.05, "#bff2ff", 0, 0, 0, true); }
      for (let k = 0; k < 4; k++) { const a = k * 1.57 + r(), rr = s * 0.42; p("cyl", Math.cos(a) * rr, 0.1, Math.sin(a) * rr, 0.05, 0.2, 0.05, "#8a6a4a"); p("ico1", Math.cos(a) * rr, 0.3, Math.sin(a) * rr, 0.28, 0.26, 0.28, pk(r, ["#5fa752", "#7cc062", "#4f9a3f"])); }
      return 0.5;
    },
  };

  /* ---------- live neighbourhoods ---------- */
  const occ = new Map(); // islId -> [{x,z,r}]
  const free = (id, x, z, r) => (occ.get(id) || []).every((o) => Math.hypot(o.x - x, o.z - z) > o.r + r);
  const hold = (id, x, z, r) => { (occ.get(id) || occ.set(id, []).get(id)).push({ x, z, r }); };
  const cityInfo = (c) => WORLD.cities.get(c);
  /* ---------- each theme = a "policy campus": one lot per item with its matching building, on a paved block with a city-colour kerb ---------- */
  for (const isl of islands) {
    if (!isl.live) { site(isl); continue; }
    const its = [...(isl.t.items || [])].sort((a, b) => MODELS.isHero(b.id) - MODELS.isHero(a.id));
    const accent = cityHex(isl.city), used = {}, zone = ZONE(isl.t.name);
    // layout: heroes in the back row (big lots), the rest in rows of 2-3 in front
    const heroes = its.filter((i) => MODELS.isHero(i.id)), rest = its.filter((i) => !MODELS.isHero(i.id));
    const LOT = rest.length <= 2 ? 1.8 : rest.length <= 4 ? 1.5 : 1.3, HLOT = 2.3, GAP = 0.18, perRow = rest.length > 4 ? 3 : 2;
    const rows = []; if (heroes.length) rows.push(heroes.map((it) => ({ it, s: HLOT, hero: true })));
    for (let k = 0; k < rest.length; k += perRow) rows.push(rest.slice(k, k + perRow).map((it) => ({ it, s: LOT, hero: false })));
    const rowW = rows.map((r) => r.reduce((a, l) => a + l.s, 0) + GAP * (r.length - 1)), rowD = rows.map((r) => Math.max(...r.map((l) => l.s)));
    const W = Math.max(...rowW), D = rowD.reduce((a, b) => a + b, 0) + GAP * (rows.length - 1);
    // shrink to fit the neighbourhood
    let inR = 1e9; for (let k = 0; k < isl.poly.length; k++) inR = Math.min(inR, GEOM.segDist(0, 0, isl.poly[k], isl.poly[(k + 1) % isl.poly.length]));
    const fit = Math.min(1, (inR * 1.55) / Math.hypot(W + 0.5, D + 0.5));
    const slots = []; let z = -D / 2;
    rows.forEach((r, i) => { let x = -rowW[i] / 2; for (const l of r) { slots.push({ ...l, x: (x + l.s / 2) * fit, z: (z + rowD[i] / 2) * fit, s: l.s * fit }); x += l.s + GAP; } z += rowD[i] + GAP; });
    const cw = (W + 0.4) * fit, cd = (D + 0.4) * fit;
    isl.campus = { w: cw, d: cd }; isl.plazaR = Math.hypot(cw, cd) / 2;
    const pc = ctxFor(isl.id, null, 0, 0, 1, 0, zone, null), pp = (g, ...a) => part(pc, g, ...a);
    pp("rbox", 0, 0.025, 0, cw + 0.14, 0.05, cd + 0.14, accent);
    pp("turf", 0, 0.035, 0, cw, 0.05, cd, "#ffffff");
    const LOT_GROUND = { school: "#d8b49a", sport: "#7fbf5a", park: "#8ccf68", nursery: "#f3d6cf", hospital: "#e9eef3", clinic: "#e9eef3", elder: "#e8f0dc", metro: "#d9d4ca", bus: "#d9d4ca", bike: "#d9d4ca", road: "#d9d4ca" };
    let campusTop = TOP;
    for (const sl of slots) {
      const r = (hash(sl.it.id) % 1000) / 1000, kind = MODELS.kindFor(sl.it, isl.t);
      pp(LOT_GROUND[kind] ? "box" : "turf", sl.x, 0.065, sl.z, sl.s - 0.06, 0.012, sl.s - 0.06, LOT_GROUND[kind] || "#f2ffe8");
      const ctx = ctxFor(isl.id, sl.it.id, sl.x, sl.z, sl.s * 0.95, 0, zone, null);
      ctx.base.premultiply(new THREE.Matrix4().makeTranslation(0, 0.07, 0));
      const start = parts.length, p = (g, ...a) => part(ctx, g, ...a);
      const vs = MODELS.variants[kind], k = (used[kind] = (used[kind] || 0) + 1) - 1;
      (sl.hero ? MODELS.heroes[sl.it.id] : vs ? vs[k % vs.length] : MODELS.kinds[kind])(p, MODELS.helpers(p, accent), accent, r);
      const box = new THREE.Box3(); for (let q = start; q < parts.length; q++) box.union(unit.clone().applyMatrix4(parts[q].m));
      campusTop = Math.max(campusTop, box.max.y);
      box.translate(new THREE.Vector3(isl.c.x, 0, isl.c.z));
      ITEMS3D.set(sl.it.id, { isl: isl.id, x: sl.x, z: sl.z, size: sl.s, box, kind, hero: sl.hero });
    }
    isl.campusTop = campusTop;
    // stadium-style floodlights on the campus corners: hooded heads aimed at the middle, lit after 17:00
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const px = sx * (cw / 2 + 0.12), pz = sz * (cd / 2 + 0.12), H = 1.15, a = Math.atan2(-pz, -px);
      pp("cyl", px, H / 2, pz, 0.035, H, 0.035, "#3b4148"); pp("cyl", px, 0.03, pz, 0.1, 0.06, 0.1, "#3b4148");
      const hx = px + Math.cos(a) * 0.12, hz = pz + Math.sin(a) * 0.12;
      pp("box", (px + hx) / 2, H, (pz + hz) / 2, 0.16, 0.025, 0.025, "#3b4148", -a);
      pp("box", hx, H + 0.02, hz, 0.2, 0.08, 0.16, "#2b3036", -a, 0, -0.5);          // hood
      pp("box", hx + Math.cos(a) * 0.02, H - 0.02, hz + Math.sin(a) * 0.02, 0.16, 0.02, 0.12, "#fff6d8", -a, 0, -0.5, true); // lamp face
      LAMP_BEAMS.push([isl.c.x + hx, TOP + H - 0.03, isl.c.z + hz, isl.c.x + px * 0.25, TOP + 0.07, isl.c.z + pz * 0.25, Math.max(cw, cd) * 0.42]);
    }
    LAMP_POOLS.push([isl.c.x, TOP + 0.075, isl.c.z, Math.max(cw, cd) * 0.42]);
    hold(isl.id, 0, 0, Math.hypot(cw, cd) / 2 + 0.1);
    const body = WORLD.bodies.get(isl.id); body.anchor.set(0, TOP, cd / 2 + 0.28);
  }

  /* ---------- city landmarks for the live city ---------- */
  const LM = { taipei: [["t101", "台北 101", (i) => i.c.x, 2.3], ["dome", "台北大巨蛋", (i) => i.c.x * 0.8 - Math.abs(i.c.z) * 0.5, 1.9], ["station", "台北車站", (i) => -i.c.x - Math.abs(i.c.z) * 0.6, 1.8], ["shinkong", "新光摩天大樓", (i) => -i.c.x - Math.abs(i.c.z - 1.5) * 0.6 + 0.01, 2.0], ["grand", "圓山大飯店", (i) => -i.c.z, 1.8], ["npm", "國立故宮博物院", (i) => -i.c.z + i.c.x * 0.2, 1.6], ["miramar", "美麗華摩天輪", (i) => -i.c.z * 0.7 + i.c.x * 0.7, 1.6], ["cks", "中正紀念堂", (i) => i.c.z * 0.5 - Math.abs(i.c.x + 2), 1.6], ["sysm", "國父紀念館", (i) => i.c.x - Math.abs(i.c.z) * 0.8, 1.5], ["longshan", "艋舺龍山寺", (i) => -i.c.x + i.c.z * 0.5, 1.5], ["redhouse", "西門紅樓", (i) => -i.c.x - Math.abs(i.c.z) * 0.3, 1.5], ["yangming", "陽明山", (i) => -i.c.z * 1.2 - i.c.x * 0.2, 1.5, 1], ["elephant", "象山", (i) => i.c.x * 1.2 + i.c.z * 0.4, 1.4, 1], ["maokong", "貓空", (i) => i.c.x * 0.7 + i.c.z, 1.3, 1], ["daan", "大安森林公園", (i) => -Math.hypot(i.c.x - 2, i.c.z - 1), 1.3, 1], ["beitou", "北投溫泉", (i) => -i.c.z - i.c.x * 0.6, 1.3, 1]],
    newtaipei: [["ntcity", "新北市政府", null, 1.8], ["danjiang", "淡江大橋", null, 1.2], ["fort", "淡水紅毛城", null, 1.6], ["jiufen", "九份老街", null, 1.5], ["shifen", "十分瀑布・天燈", null, 1.4, 1], ["queen", "野柳女王頭", null, 1.6, 1]],
    keelung: [["port", "基隆港", null, 1.5], ["guanyin", "中正公園大觀音", null, 1.8], ["miaokou", "廟口夜市", null, 1.5], ["houses", "正濱漁港彩色屋", null, 1.5], ["heping", "和平島", null, 1.4, 1]],
    taoyuan: [["airport", "桃園國際機場", null, 1.3], ["xpark", "Xpark 水族館", null, 1.6], ["daxi", "大溪老街", null, 1.6], ["rainbow", "永安漁港彩虹橋", null, 1.6], ["dam", "石門水庫", null, 1.3, 1], ["lala", "拉拉山", null, 1.4, 1]] };
  for (const [city, list] of Object.entries(LM)) {
    if (!LIVE_CITIES.has(city)) continue;
    const mine = islands.filter((i) => i.city === city), taken = new Set(), coast = cityInfo(city).coast;
    // footprint radius of each model (model units) and which ones belong inland rather than near the shore
    const FP = { t101: 0.78, dome: 1.0, station: 0.85, shinkong: 0.42, grand: 0.8, npm: 0.98, miramar: 0.75, cks: 0.78, sysm: 0.92, longshan: 0.72, redhouse: 0.68, yangming: 1.15, elephant: 0.88, maokong: 1.25, daan: 1.02, beitou: 0.92, ntcity: 0.75, danjiang: 1.75, fort: 0.85, jiufen: 1.0, shifen: 0.9, queen: 0.85, port: 0.95, guanyin: 0.45, miaokou: 0.9, houses: 0.95, heping: 0.95, airport: 1.5, xpark: 0.85, daxi: 0.9, rainbow: 0.9, dam: 1.4, lala: 1.05 };
    // real positions (lon, lat): each landmark goes to the nearest spot on land where its whole footprint fits
    const GEO_LL = { t101: [121.5645, 25.034], dome: [121.5606, 25.0437], station: [121.517, 25.0478], shinkong: [121.515, 25.0461], grand: [121.5262, 25.0784], npm: [121.5485, 25.1024], miramar: [121.5575, 25.0835], cks: [121.5219, 25.035], sysm: [121.5603, 25.04], longshan: [121.4999, 25.0372], redhouse: [121.5068, 25.042], yangming: [121.545, 25.155], elephant: [121.5767, 25.0275], maokong: [121.588, 24.968], daan: [121.5355, 25.03], beitou: [121.508, 25.137],
      ntcity: [121.4648, 25.0123], danjiang: [121.429, 25.168], fort: [121.433, 25.1753], jiufen: [121.8445, 25.1092], shifen: [121.787, 25.0475], queen: [121.69, 25.2063],
      port: [121.74, 25.133], guanyin: [121.7445, 25.1290], miaokou: [121.7435, 25.1285], houses: [121.774, 25.15], heping: [121.765, 25.16],
      airport: [121.233, 25.0797], xpark: [121.215, 25.0137], daxi: [121.287, 24.883], rainbow: [121.013, 24.989], dam: [121.24, 24.815], lala: [121.44, 24.718] };
    for (const [id, name, score, sc0, nature] of list) {
      let isl = null, best = null, sc = sc0;
      const [tx, tz] = GEO_LL[id] ? WORLD.geo(city, ...GEO_LL[id]) : [0, 0];
      // spiral out from the real spot: the footprint must sit on land and clear every policy campus and other landmark (it may span a street)
      const cells = []; for (let x = -14; x <= 14; x += 0.25) for (let z = -14; z <= 14; z += 0.25) cells.push([tx + x, tz + z, Math.hypot(x, z)]); cells.sort((p, q) => p[2] - q[2]);
      const okAt = (wx, wz, R) => GEOM.pip(wx, wz, coast) && GEOM.nearestEdge(wx, wz, coast).d >= R + 0.35 &&
        mine.every((m) => Math.hypot(wx - m.c.x, wz - m.c.z) - m.plazaR >= R * 0.92) &&
        !LANDMARKS3D.some((L) => Math.hypot(L.isl.c.x + L.x - wx, L.isl.c.z + L.z - wz) < R + L.r + 0.7); // generous gaps so labels never stack
      for (const f of [1, 0.93, 0.86, 0.8]) { // keep sizes consistent: move a landmark further before shrinking it much
        const s2 = sc0 * f, R = (FP[id] || 0.8) * s2, lim = f === 1 ? 3 : f > 0.9 ? 5 : f > 0.85 ? 8 : 99;
        const hit = cells.find(([wx, wz, dd]) => dd <= lim && okAt(wx, wz, R));
        if (hit) { const [wx, wz] = hit; isl = mine.find((m) => GEOM.pip(wx - m.c.x, wz - m.c.z, m.poly)) || mine.reduce((p, m) => (Math.hypot(m.c.x - wx, m.c.z - wz) < Math.hypot(p.c.x - wx, p.c.z - wz) ? m : p)); best = [wx - isl.c.x, wz - isl.c.z]; sc = s2; break; }
      }
      if (!best) continue; if (!nature) taken.add(isl.id);
      const ctx = { isl: isl.id, owner: null, base: new THREE.Matrix4().compose(new THREE.Vector3(best[0], TOP, best[1]), new THREE.Quaternion(), new THREE.Vector3(sc, sc, sc)), s: sc, zone: "L" };
      const pl = (g, ...a) => { const q = part(ctx, g, ...a); q.landmark = id; return q; };
      { const pctx = { isl: isl.id, owner: null, base: new THREE.Matrix4().makeTranslation(best[0], TOP, best[1]), s: 1, zone: "L" }, pp = (g, ...a) => { const q = part(pctx, g, ...a); q.landmark = id; return q; }, PR = Math.min(2.6, ((FP[id] || 0.8) * sc + 0.15) * 2);
        pp("turfc", 0, 0.02, 0, PR, 0.04, PR, "#ffffff"); if (!nature) { pp("torus", 0, 0.04, 0, PR, PR, 0.12, cityHex(city), 0, Math.PI / 2);
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; pp("cyl", Math.cos(a) * PR * 0.45, 0.12, Math.sin(a) * PR * 0.45, 0.03, 0.2, 0.03, "#3b4148"); pp("sphere", Math.cos(a) * PR * 0.45, 0.24, Math.sin(a) * PR * 0.45, 0.06, 0.06, 0.06, "#fff3c4", 0, 0, 0, true); } } }
      const top = LANDMARK_BUILD[id](pl);
      for (const m of mine) { const lx = isl.c.x + best[0] - m.c.x, lz = isl.c.z + best[1] - m.c.z; if (Math.hypot(lx, lz) < 12) hold(m.id, lx, lz, (FP[id] || 0.8) * sc + 0.15); }
      LANDMARKS3D.push({ id, name, isl, x: best[0], z: best[1], top: TOP + top * sc, city, sc, r: (FP[id] || 0.8) * sc, nature: !!nature });
    }
  }

  /* ---------- skyline: fill every live neighbourhood around its plaza ---------- */
  for (const c of A.cities) {
    if (!LIVE_CITIES.has(c.city)) continue;
    const info = cityInfo(c.city), mine = islands.filter((i) => i.city === c.city);
    const maxD = Math.max(...mine.map((i) => Math.hypot(i.c.x - info.center[0], i.c.z - info.center[1]))) || 1;
    for (const isl of mine) {
      const r = rng(hash(isl.id) + 5), dd = Math.hypot(isl.c.x - info.center[0], isl.c.z - info.center[1]) / maxD, zone = ZONE(isl.t.name);
      const cand = []; for (let x = -6; x <= 6; x += 0.5) for (let z = -6; z <= 6; z += 0.5) cand.push([x + (r() - 0.5) * 0.2, z + (r() - 0.5) * 0.2]);
      cand.sort(() => r() - 0.5);
      for (const [x, z] of cand) {
        if (!GEOM.pip(x, z, isl.poly)) continue;
        const ne = GEOM.nearestEdge(x, z, isl.poly); if (ne.d < 0.22) continue;
        const v = r(), downtown = dd < 0.42;
        if (r() < (downtown ? 0.22 : 0.4)) { // leave room for greenery: a small grove instead of another building
          if (!free(isl.id, x, z, 0.22)) continue; hold(isl.id, x, z, 0.22);
          const gp = (g, ...a) => part(ctxFor(isl.id, null, x, z, 1, 0, zone, null), g, ...a), nT = 1 + ((r() * 3) | 0);
          for (let k = 0; k < nT; k++) { const ox = (r() - 0.5) * 0.3, oz = (r() - 0.5) * 0.3, th = 0.16 + r() * 0.12; gp("cyl", ox, th / 2, oz, 0.03, th, 0.03, "#8a6a4a"); gp(r() < 0.3 ? "cone" : "ico1", ox, th + 0.1, oz, 0.2 + r() * 0.08, 0.22 + r() * 0.1, 0.2 + r() * 0.08, pk(r, ["#5fa752", "#7cc062", "#4f9a3f", "#8fcf6a"])); }
          if (r() < 0.5) gp("sphere", (r() - 0.5) * 0.3, 0.05, (r() - 0.5) * 0.3, 0.1, 0.07, 0.1, "#6fb85a");
          continue;
        }
        let type = downtown ? (v < 0.5 ? "tower" : v < 0.84 ? "office" : v < 0.93 ? "shop" : "park") : (v < 0.16 ? "tower" : v < 0.52 ? "office" : v < 0.76 ? "house" : v < 0.88 ? "shop" : "park");
        if (zone === "P" && v > 0.6) type = "park";
        let s = type === "tower" ? 0.5 + r() * 0.25 : type === "office" ? 0.5 + r() * 0.3 : type === "park" ? 0.55 + r() * 0.3 : 0.4 + r() * 0.3;
        s = Math.min(s, ne.d * 1.6);
        if (s < 0.3 || !free(isl.id, x, z, s * 0.62)) continue;
        // keep the plaza visible: nothing tall in front of it (south = +z)
        const front = z > -0.3 && Math.abs(x) < isl.campus.w / 2 + 1.6;
        let h = type === "tower" ? (downtown ? 1.8 + r() * 2.6 : 1.2 + r() * 1.0) : 0.55 + r() * 0.8;
        if (front) { if (type === "tower") type = z > 0.8 ? "shop" : "office"; h = Math.min(h, z > 0.8 ? 0.4 : 0.6); }
        if (type === "tower") type = "office"; h = Math.min(h, 1.0);
        if (LANDMARKS3D.some((L) => L.isl === isl && Math.hypot(L.x - x, L.z - z) < 3.2)) { if (type === "tower") type = "office"; h = Math.min(h, 0.9); }
        const ctx = ctxFor(isl.id, null, x, z, 1, -ne.ang, zone, null), p = (g, ...a) => part(ctx, g, ...a);
        B[type](p, s, h, r); hold(isl.id, x, z, s * 0.62);
      }
      // street trees along the kerb
      const P = isl.poly, tc = ctxFor(isl.id, null, 0, 0, 1, 0, zone, null), tp = (g, ...a) => part(tc, g, ...a);
      for (let k = 0; k < P.length; k++) {
        const a = P[k], b = P[(k + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
        for (let t = 0.25, j = 0; t < L - 0.15; t += 0.42, j++) {
          let x = a[0] + ux * t - uz * 0.14, z = a[1] + uz * t + ux * 0.14; if (!GEOM.pip(x, z, P)) { x = a[0] + ux * t + uz * 0.14; z = a[1] + uz * t - ux * 0.14; }
          if (!GEOM.pip(x, z, P) || (Math.abs(x) < isl.campus.w / 2 + 0.15 && Math.abs(z) < isl.campus.d / 2 + 0.15)) continue;
          if (LANDMARKS3D.some((L) => Math.hypot(L.isl.c.x + L.x - isl.c.x - x, L.isl.c.z + L.z - isl.c.z - z) < L.r + 0.2)) continue;
          if (j % 2 === 1) { if (r() < 0.25) continue; tp("cyl", x, 0.1, z, 0.035, 0.2, 0.035, "#8a6a4a"); tp("ico1", x, 0.28, z, 0.2, 0.2, 0.2, pk(r, ["#5fa752", "#7cc062", "#4f9a3f"])); }
          else { tp("cyl", x, 0.17, z, 0.018, 0.34, 0.018, "#3b4148"); tp("sphere", x, 0.35, z, 0.045, 0.045, 0.045, "#fff3c4", 0, 0, 0, true); LAMP_POOLS.push([isl.c.x + x, TOP + 0.012, isl.c.z + z, 0.42]); }
        }
      }
    }
  }

  /* ---------- streets: centre dashes and zebra crossings (static) ---------- */
  const sctx = { isl: "_static", owner: null, base: new THREE.Matrix4(), s: 1 }, sp = (g, ...a) => part(sctx, g, ...a);
  for (const rd of WORLD.roads) {
    if (!rd.live) continue;
    const L = Math.hypot(rd.b[0] - rd.a[0], rd.b[1] - rd.a[1]), ang = Math.atan2(rd.b[1] - rd.a[1], rd.b[0] - rd.a[0]), ux = Math.cos(ang), uz = Math.sin(ang);
    for (let t = 0.45; t < L - 0.4; t += 0.5) sp("box", rd.a[0] + ux * t, TOP - 0.026, rd.a[1] + uz * t, 0.22, 0.004, 0.03, "#ffffff", -ang);
    for (const t of [0.22, L - 0.22]) for (let k = -2; k <= 2; k++) sp("box", rd.a[0] + ux * t - uz * k * 0.07, TOP - 0.026, rd.a[1] + uz * t + ux * k * 0.07, 0.16, 0.004, 0.035, "#ffffff", -ang + Math.PI / 2);
  }

  /* ---------- elevated expressway around the live city, and a container port ---------- */
  WORLD.highways = [];
  for (const c of A.cities) {
    if (!LIVE_CITIES.has(c.city)) continue;
    const info = cityInfo(c.city), H = 1.05;
    // an expressway that follows the streets across the city, west to east, smoothed into sweeping curves
    const Gn = WORLD.graph.nodes, mineIds = [...new Set(islands.filter((i) => i.city === c.city).flatMap((i) => WORLD.ringNode.get(i.id)))];
    const inner = mineIds.filter((id) => (WORLD.graph.edges.get(id) || []).length >= 3);
    const w = inner.reduce((m, id) => (Gn[id].p.x < Gn[m].p.x ? id : m), inner[0]), e = inner.reduce((m, id) => (Gn[id].p.x > Gn[m].p.x ? id : m), inner[0]);
    const route = WORLD.shortest(w, e) || [];
    let path = GEOM.smooth(route.map((id) => [Gn[id].p.x, Gn[id].p.z]), 0); { let Q = path; for (let it = 0; it < 3; it++) { const R = [Q[0]]; for (let i = 0; i < Q.length - 1; i++) { const a = Q[i], b = Q[i + 1]; R.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } R.push(Q[Q.length - 1]); Q = R; } path = Q; }
    const pts = []; for (let k = 0; k < path.length - 1; k++) { const a = path[k], b = path[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 0.6)); for (let j = 0; j < n; j++) pts.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); }
    pts.push(path[path.length - 1]);
    const CROSS = false; if (CROSS) for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k], b = pts[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      sp("box", mx, TOP + H, mz, L + 0.04, 0.08, 0.5, "#8b9097", -ang); sp("box", mx, TOP + H + 0.045, mz, L + 0.04, 0.012, 0.44, "#5d6168", -ang);
      for (const o of [-0.24, 0.24]) sp("box", mx - Math.sin(ang) * o, TOP + H + 0.09, mz + Math.cos(ang) * o, L + 0.04, 0.08, 0.03, "#eef1f5", -ang);
      if (k % 2 === 0) sp("box", mx, TOP + H + 0.052, mz, L * 0.45, 0.004, 0.025, "#ffffff", -ang);
      if (k % 3 === 0) { sp("cyl", mx, (TOP + H) / 2 - 0.05, mz, 0.12, TOP + H + 0.1, 0.12, "#cfc9bd"); sp("box", mx, TOP + H - 0.08, mz, 0.12, 0.08, 0.5, "#cfc9bd", -ang); }
      if (k % 5 === 0) for (const o of [-0.25, 0.25]) { sp("cyl", mx - Math.sin(ang) * o, TOP + H + 0.3, mz + Math.cos(ang) * o, 0.015, 0.4, 0.015, "#3b4148"); sp("sphere", mx - Math.sin(ang) * o, TOP + H + 0.5, mz + Math.cos(ang) * o, 0.04, 0.04, 0.04, "#fff3c4", 0, 0, 0, true); }
    }
    if (CROSS) WORLD.highways.push({ city: c.city, pts: pts.map(([x, z]) => new THREE.Vector3(x, TOP + H + 0.06, z)) });
    { // the coastal ring expressway (環道高架): rides on piers just past the surf line, all the way round
      // radial distance field: walk out from the centre past the last bit of land, then on until we are D clear of the coast
      const [cx, cz] = GEOM.centroid(info.coast), D = 2.75, NA = 360, rr = [];
      for (let k = 0; k < NA; k++) {
        const a = (k / NA) * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a); let r = 0, last = 0;
        for (r = 0; r < 60; r += 0.1) if (GEOM.pip(cx + dx * r, cz + dz * r, info.coast)) last = r;
        const nP = info.coast.reduce((m, p) => (p[1] < m[1] ? p : m)), PX = nP[0] - 2.2, PZ = nP[1] - 1.8;
        r = last; while ((GEOM.nearestEdge(cx + dx * r, cz + dz * r, info.coast).d < D || Math.hypot(cx + dx * r - PX, cz + dz * r - PZ) < 3.4) && r < 80) r += 0.05;
        rr.push(r);
      }
      // dilate (local max) then box-blur repeatedly: the ring keeps its clearance but every bend becomes a broad, even curve
      const W2 = 10; let sm = rr.map((_, k) => { let m = 0; for (let j = -W2; j <= W2; j++) m = Math.max(m, rr[(k + j + NA) % NA] - Math.abs(j) * 0.02); return m; });
      for (let it = 0; it < 8; it++) { const prev = sm; sm = prev.map((_, k) => { let s2 = 0; for (let j = -6; j <= 6; j++) s2 += prev[(k + j + NA) % NA]; return Math.max(rr[k] - 0.35, s2 / 13); }); }
      for (let it = 0; it < 4; it++) { const prev = sm; sm = prev.map((v, k) => (prev[(k - 1 + NA) % NA] + v * 2 + prev[(k + 1) % NA]) / 4); }
      const ring = sm.map((r, k) => { const a = (k / NA) * Math.PI * 2; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; });
      const rp = []; for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 0.6)); for (let j = 0; j < n; j++) rp.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); }
      const RH = 0.85, base = WATER_Y;
      for (let k = 0; k < rp.length; k++) {
        const a = rp[k], b = rp[(k + 1) % rp.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue;
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
        sp("box", mx, TOP + RH, mz, L + 0.2, 0.08, 0.52, "#8b9097", -ang); sp("box", mx, TOP + RH + 0.045, mz, L + 0.2, 0.012, 0.46, "#5d6168", -ang);
        for (const o of [-0.25, 0.25]) sp("box", mx - Math.sin(ang) * o, TOP + RH + 0.09, mz + Math.cos(ang) * o, L + 0.12, 0.08, 0.03, "#eef1f5", -ang);
        if (k % 2 === 0) sp("box", mx, TOP + RH + 0.052, mz, L * 0.45, 0.004, 0.025, "#ffffff", -ang);
        if (k % 3 === 0) { const ph = TOP + RH - base; sp("cyl", mx, base + ph / 2 - 0.05, mz, 0.13, ph, 0.13, "#cfc9bd"); sp("box", mx, TOP + RH - 0.08, mz, 0.12, 0.08, 0.52, "#cfc9bd", -ang); sp("cyl", mx, base + 0.02, mz, 0.22, 0.05, 0.22, "#ffffff"); }
        if (k % 2 === 0) for (const o of [k % 4 === 0 ? -0.26 : 0.26]) { LAMP_POOLS.push([mx - Math.sin(ang) * o * 0.4, TOP + RH + 0.055, mz + Math.cos(ang) * o * 0.4, 0.42]); sp("cyl", mx - Math.sin(ang) * o, TOP + RH + 0.3, mz + Math.cos(ang) * o, 0.015, 0.4, 0.015, "#3b4148"); sp("sphere", mx - Math.sin(ang) * o, TOP + RH + 0.5, mz + Math.cos(ang) * o, 0.04, 0.04, 0.04, "#fff3c4", 0, 0, 0, true); }
      }
      WORLD.rings = WORLD.rings || {}; WORLD.rings[c.city] = { pts: rp, center: [cx, cz], deck: TOP + RH };
      WORLD.highways.push({ city: c.city, closed: true, pts: rp.map(([x, z]) => new THREE.Vector3(x, TOP + RH + 0.06, z)) });
    }
    // port on the north shore
    const north = info.coast.reduce((m, p) => (p[1] < m[1] ? p : m)), px = north[0] - 2.2, pz = north[1] - 0.6;
    sp("box", px, TOP - 0.12, pz - 0.6, 4.2, 0.18, 1.6, "#c9c3b7"); for (let x = -1.9; x <= 1.9; x += 0.6) sp("box", px + x, (TOP + WATER_Y) / 2 - 0.2, pz - 1.35, 0.12, TOP - WATER_Y + 0.3, 0.12, "#9a958c");
    const CC = ["#e0453c", "#2f6fd6", "#f0c64a", "#28c8c8", "#e48b5c", "#f8f6f1", "#3f8f5a"], R2 = rng(77);
    for (let x = -1.5; x <= 1.6; x += 0.42) for (let z = -0.25; z <= 0.1; z += 0.2) { const n = 1 + ((R2() * 3) | 0); for (let s2 = 0; s2 < n; s2++) sp("box", px + x, TOP - 0.02 + s2 * 0.11, pz - 0.6 + z, 0.38, 0.1, 0.17, pk(R2, CC)); }
    for (const x of [-1.3, 0, 1.3]) { for (const dx of [-0.15, 0.15]) sp("box", px + x + dx, TOP + 0.45, pz - 1.0, 0.05, 1.1, 0.05, "#28c8c8"); sp("box", px + x, TOP + 1.0, pz - 1.35, 0.4, 0.07, 1.6, "#28c8c8"); sp("box", px + x, TOP + 0.95, pz - 0.95, 0.36, 0.14, 0.16, "#f8f6f1"); }
    WORLD.port = { x: px, z: pz - 2.2 };
  }

  /* ---------- shoreline life (SimCity BuildIt style): boardwalk + palms, dense umbrellas, kiosks, a pleasure pier, a marina ---------- */
  for (const c of A.cities) {
    if (!LIVE_CITIES.has(c.city)) continue;
    const seg = WORLD.shore.get(c.city), R3 = rng(hash(c.city) + 99), W = 2.0, info = cityInfo(c.city);
    const north = info.coast.reduce((m, p) => (p[1] < m[1] ? p : m));
    const yAt = (o) => TOP - 0.06 + (WATER_Y + 0.02 - TOP + 0.06) * Math.min(1, o / W);
    const UMB = ["#e0453c", "#2f6fd6", "#f0c64a", "#28c8c8", "#f8f6f1", "#ff7aa8", "#ff9a3c"];
    const palm = (px, py, pz, s = 1) => { for (let k = 0; k < 4; k++) sp("cyl", px + k * 0.025 * s, py + (0.12 + k * 0.22) * s, pz, 0.05 * s, 0.24 * s, 0.05 * s, "#a8794f", 0, 0, -0.12); for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; sp("box", px + (0.1 + Math.cos(a) * 0.24) * s, py + 0.9 * s, pz + Math.sin(a) * 0.24 * s, 0.52 * s, 0.025, 0.13 * s, k % 2 ? "#4f9a3f" : "#62b04e", -a, 0, -0.35); } sp("sphere", px + 0.1 * s, py + 0.95 * s, pz, 0.1 * s, 0.1 * s, 0.1 * s, "#7a5a3a"); };
    const umbrella = (x, y, z, a, cc = pk(R3, UMB)) => { sp("cyl", x, y + 0.2, z, 0.02, 0.4, 0.02, "#f8f6f1"); sp("cone", x, y + 0.42, z, 0.46, 0.12, 0.46, cc); sp("sphere", x, y + 0.49, z, 0.03, 0.03, 0.03, "#f8f6f1"); for (const sd of [-0.11, 0.11]) sp("box", x + Math.cos(a) * 0.2 - Math.sin(a) * sd, y + 0.02, z + Math.sin(a) * 0.2 + Math.cos(a) * sd, 0.26, 0.03, 0.1, pk(R3, ["#f8f6f1", "#f0c64a", "#28c8c8", "#ff7aa8"]), -a); if (R3() < 0.6) { const px = x + Math.cos(a) * 0.2 + Math.sin(a) * 0.11, pz = z + Math.sin(a) * 0.2 - Math.cos(a) * 0.11; sp("box", px, y + 0.06, pz, 0.2, 0.05, 0.06, pk(R3, ["#e0453c", "#2f6fd6", "#3e7c8c", "#f0c64a"]), -a); sp("sphere", px - Math.cos(a) * 0.12, y + 0.07, pz - Math.sin(a) * 0.12, 0.06, 0.06, 0.06, "#f1c9a6"); } };
    const kiosk = (x, y, z, a) => { const cc = pk(R3, ["#e0453c", "#2f6fd6", "#28c8c8", "#ff9a3c"]); sp("rbox", x, y + 0.14, z, 0.42, 0.28, 0.3, "#f8f6f1", -a); for (let k = -2; k <= 2; k++) sp("box", x - Math.sin(a) * k * 0.085 + Math.cos(a) * 0.2, y + 0.32, z + Math.cos(a) * k * 0.085 + Math.sin(a) * 0.2, 0.18, 0.025, 0.085, k % 2 ? cc : "#f8f6f1", -a, 0, 0.35); sp("box", x, y + 0.3, z, 0.46, 0.04, 0.34, cc, -a); for (const sd of [-0.3, 0.3]) { sp("cyl", x + Math.cos(a) * 0.32 - Math.sin(a) * sd, y + 0.08, z + Math.sin(a) * 0.32 + Math.cos(a) * sd, 0.08, 0.02, 0.08, "#f8f6f1"); sp("cyl", x + Math.cos(a) * 0.32 - Math.sin(a) * sd, y + 0.2, z + Math.sin(a) * 0.32 + Math.cos(a) * sd, 0.01, 0.24, 0.01, "#f8f6f1"); sp("cone", x + Math.cos(a) * 0.32 - Math.sin(a) * sd, y + 0.32, z + Math.sin(a) * 0.32 + Math.cos(a) * sd, 0.22, 0.06, 0.22, cc); } };
    // longest beach stretch gets the pleasure pier, the longest harbour stretch away from the port gets the marina
    const runs = []; let cur = null;
    for (const sg of seg) { if (!cur || cur.type !== sg.type) { cur = { type: sg.type, list: [], len: 0 }; runs.push(cur); } const L = Math.hypot(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]); cur.list.push(sg); cur.len += L; }
    const mid = (run) => { let h = run.len / 2; for (const sg of run.list) { const L = Math.hypot(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]); if (h <= L) { const t = h / (L || 1); return { x: sg.a[0] + (sg.b[0] - sg.a[0]) * t, z: sg.a[1] + (sg.b[1] - sg.a[1]) * t, nx: (sg.na[0] + sg.nb[0]) / 2, nz: (sg.na[1] + sg.nb[1]) / 2, ux: (sg.b[0] - sg.a[0]) / (L || 1), uz: (sg.b[1] - sg.a[1]) / (L || 1) }; } h -= L; } };
    const bR = runs.filter((r) => r.type === "beach").sort((a, b) => b.len - a.len), hR = runs.filter((r) => r.type === "harbour" && (() => { const m = mid(r); return m && Math.hypot(m.x - north[0], m.z - north[1]) > 6; })()).sort((a, b) => b.len - a.len);
    const pierAt = bR[0] && mid(bR[0]), marinaAt = (hR[0] && mid(hR[0])) || (bR[1] && mid(bR[1]));
    const nearPier = (x, z) => pierAt && Math.hypot(x - pierAt.x, z - pierAt.z) < 1.2;
    let acc = 0, accH = 0, accK = 0, ci = 0;
    for (const sg of seg) {
      const L = Math.hypot(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]); if (!L) continue;
      const ux = (sg.b[0] - sg.a[0]) / L, uz = (sg.b[1] - sg.a[1]) / L, nx = (sg.na[0] + sg.nb[0]) / 2, nz = (sg.na[1] + sg.nb[1]) / 2, ang = Math.atan2(uz, ux), an = Math.atan2(nz, nx);
      if (sg.type === "beach") { // boardwalk along the land edge
        const mx = (sg.a[0] + sg.b[0]) / 2 + nx * 0.28, mz = (sg.a[1] + sg.b[1]) / 2 + nz * 0.28;
        sp("box", mx, yAt(0.28) + 0.03, mz, L + 0.06, 0.04, 0.36, "#d6a874", -ang);
      }
      for (let t = 0; t < L; t += 0.1) {
        const x0 = sg.a[0] + ux * t, z0 = sg.a[1] + uz * t;
        if (sg.type === "beach") {
          acc += 0.1; accK += 0.1;
          if (acc >= 0.44) { acc = 0; ci++;
            if (ci % 2 === 0 && !nearPier(x0, z0)) palm(x0 + nx * 0.06, TOP - 0.05, z0 + nz * 0.06, 1.05);
            for (let row = 0; row < 3; row++) { // umbrellas in tidy rows, colours stepping diagonally like a resort beach
              const o = 0.82 + row * 0.38, x = x0 + nx * o + ux * (row % 2) * 0.2, z = z0 + nz * o + uz * (row % 2) * 0.2;
              if (nearPier(x, z) || (ci + row) % 9 === 4) continue; umbrella(x, yAt(o), z, an + Math.PI / 2, UMB[(ci + row * 2) % UMB.length]);
            }
            if (ci % 3 === 0) { const o = W + 0.15 + R3() * 0.5, x = x0 + nx * o, z = z0 + nz * o; sp("torus", x, WATER_Y + 0.02, z, 0.16, 0.16, 0.05, pk(R3, ["#ff7aa8", "#f0c64a", "#28c8c8", "#e0453c"]), 0, Math.PI / 2); sp("sphere", x, WATER_Y + 0.06, z, 0.07, 0.07, 0.07, pk(R3, ["#2e2620", "#4a3a2e", "#f1c9a6"])); }
            if (ci % 4 === 1) { const o = W - 0.05, x = x0 + nx * o, z = z0 + nz * o, y = yAt(o); sp("cyl", x, y + 0.08, z, 0.05, 0.14, 0.05, pk(R3, ["#e0453c", "#2f6fd6", "#f0c64a", "#28c8c8"])); sp("sphere", x, y + 0.19, z, 0.06, 0.06, 0.06, "#f1c9a6"); }
          }
          if (accK >= 4.2 && !nearPier(x0, z0)) { accK = 0; const o = 0.55; kiosk(x0 + nx * o, yAt(o), z0 + nz * o, an);
            if (R3() < 0.5) { const x = x0 + nx * 0.6 + ux * 0.8, z = z0 + nz * 0.6 + uz * 0.8, y = yAt(0.6); sp("rbox", x, y + 0.03, z, 0.7, 0.06, 0.42, "#f8f6f1", -ang); sp("box", x, y + 0.065, z, 0.6, 0.01, 0.32, "#38d0e8", -ang); for (const sd of [-0.45, 0.45]) sp("box", x + ux * sd, y + 0.05, z + uz * sd, 0.12, 0.02, 0.2, "#f8f6f1", -ang); } }
          if (Math.abs(t - 0.05) < 0.051 && R3() < 0.12) { const o = 1.3; for (const [dx, dz] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) sp("box", x0 + nx * o + dx, yAt(o) + 0.25, z0 + nz * o + dz, 0.02, 0.5, 0.02, "#f8f6f1"); sp("box", x0 + nx * o, yAt(o) + 0.52, z0 + nz * o, 0.26, 0.12, 0.26, "#e0453c"); sp("cone4", x0 + nx * o, yAt(o) + 0.66, z0 + nz * o, 0.3, 0.14, 0.3, "#f8f6f1"); }
        } else if (sg.type === "harbour") {
          accH += 0.1;
          if (accH >= 0.55) { accH = 0; sp("cyl", x0 - nx * 0.02, TOP - 0.01, z0 - nz * 0.02, 0.06, 0.08, 0.06, "#3b4148"); if (R3() < 0.3) sp("cyl", x0 - nx * 0.25, TOP + 0.17, z0 - nz * 0.25, 0.018, 0.34, 0.018, "#3b4148"), sp("sphere", x0 - nx * 0.25, TOP + 0.35, z0 - nz * 0.25, 0.045, 0.045, 0.045, "#fff3c4", 0, 0, 0, true); }
        } else {
          acc += 0.1; if (acc < 0.35) continue; acc = 0;
          const o = 0.2 + R3() * 0.5; sp("ico", x0 + nx * o, WATER_Y + 0.05 + R3() * 0.08, z0 + nz * o, 0.22 + R3() * 0.2, 0.18 + R3() * 0.12, 0.22 + R3() * 0.2, pk(R3, ["#a59d8e", "#b8b2a6", "#8f887c"]), R3() * 3);
        }
      }
    }
    // bridged pockets become sandy coves: umbrellas in tidy rows, a kiosk and a few sunbathers
    for (const pk of (WORLD.pockets && WORLD.pockets.get(c.city)) || []) {
      let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9; for (const [x, z] of pk) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); minz = Math.min(minz, z); maxz = Math.max(maxz, z); }
      let k = 0, kioskDone = false;
      for (let x = minx + 0.3; x < maxx; x += 0.42) for (let z = minz + 0.3; z < maxz; z += 0.42) {
        if (!GEOM.pip(x, z, pk) || GEOM.nearestEdge(x, z, pk).d < 0.3) continue; k++;
        if (!kioskDone && GEOM.nearestEdge(x, z, pk).d > 0.6) { kioskDone = true; kiosk(x, TOP - 0.055, z, 0); continue; }
        if (k % 5 === 2) continue; umbrella(x, TOP - 0.055, z, 0, UMB[k % UMB.length]);
      }
    }
    // pleasure pier: a long boardwalk into the sea, shops on it and a ferris wheel at the end
    if (pierAt) {
      const { x, z, nx, nz, ux, uz } = pierAt, an = Math.atan2(nz, nx), len = 4.4, yP = TOP - 0.02;
      const at = (f, s2 = 0) => [x + nx * f - nz * s2 * 0 + ux * s2, z + nz * f + uz * s2];
      { const [mx, mz] = at(len / 2); sp("box", mx, yP, mz, len, 0.07, 0.62, "#c99a68", -an); }
      for (let f = 0.4; f <= len; f += 0.5) for (const s2 of [-0.26, 0.26]) { const [px, pz] = at(f, s2); sp("cyl", px, (yP + WATER_Y) / 2 - 0.15, pz, 0.05, yP - WATER_Y + 0.3, 0.05, "#8a6a4a"); }
      for (let f = 0.3; f <= len; f += 0.3) for (const s2 of [-0.3, 0.3]) { const [px, pz] = at(f, s2); sp("box", px, yP + 0.08, pz, 0.025, 0.12, 0.025, "#f8f6f1"); }
      { const [a1, a2] = at(len / 2, -0.31), [b1, b2] = at(len / 2, 0.31); sp("box", a1, yP + 0.14, a2, len, 0.02, 0.02, "#f8f6f1", -an); sp("box", b1, yP + 0.14, b2, len, 0.02, 0.02, "#f8f6f1", -an); }
      // gate on the beach
      { const [gx, gz] = at(0.3); for (const s2 of [-0.32, 0.32]) { const [px, pz] = at(0.3, s2); sp("box", px, yP + 0.3, pz, 0.08, 0.6, 0.08, "#f8f6f1"); } sp("box", gx, yP + 0.62, gz, 0.1, 0.14, 0.8, "#e0453c", -an); }
      for (const [f, s2, cc] of [[1.0, -0.17, "#ff9a3c"], [1.4, 0.17, "#28c8c8"], [1.8, -0.17, "#ff7aa8"]]) { const [px, pz] = at(f, s2); sp("rbox", px, yP + 0.17, pz, 0.32, 0.28, 0.24, "#f8f6f1", -an); sp("cone4", px, yP + 0.38, pz, 0.36, 0.14, 0.3, cc, -an + Math.PI / 4); }
      // platform + ferris wheel
      const [ex, ez] = at(len - 0.3); sp("cyl", ex, yP, ez, 1.5, 0.07, 1.5, "#c99a68");
      const [wx, wz] = at(len - 0.15), R = 0.78, hub = yP + R + 0.18, ca = Math.cos(an + Math.PI / 2), sa = Math.sin(an + Math.PI / 2);
      for (const s2 of [-0.12, 0.12]) { const px = wx + nx * s2, pz = wz + nz * s2; sp("box", px + ca * 0.3, (yP + hub) / 2, pz + sa * 0.3, 0.04, hub - yP, 0.04, "#f8f6f1", 0, 0, 0); sp("box", px - ca * 0.3, (yP + hub) / 2, pz - sa * 0.3, 0.04, hub - yP, 0.04, "#f8f6f1"); }
      const N = 16; for (let k = 0; k < N; k++) { const a = (k / N) * Math.PI * 2, a2 = ((k + 1) / N) * Math.PI * 2;
        const p1 = [Math.cos(a) * R, Math.sin(a) * R], p2 = [Math.cos(a2) * R, Math.sin(a2) * R], cx = (p1[0] + p2[0]) / 2, cy = (p1[1] + p2[1]) / 2, segL = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        for (const s2 of [-0.07, 0.07]) sp("box", wx + ca * cx + nx * s2, hub + cy, wz + sa * cx + nz * s2, segL + 0.01, 0.03, 0.03, "#f8f6f1", -(an + Math.PI / 2), 0, Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 1);
        sp("box", wx + ca * cx / 2, hub + cy / 2, wz + sa * cx / 2, R, 0.015, 0.015, "#dfe6ee", -(an + Math.PI / 2), 0, (a + a2) / 2);
        sp("rbox", wx + ca * p1[0], hub + p1[1] - 0.08, wz + sa * p1[0], 0.13, 0.12, 0.13, UMB[k % UMB.length]);
        sp("sphere", wx + ca * p1[0], hub + p1[1], wz + sa * p1[0], 0.03, 0.03, 0.03, "#fff3c4", 0, 0, 0, true);
      }
      sp("sphere", wx, hub, wz, 0.08, 0.08, 0.08, "#e0453c");
    }
    // marina: floating docks with finger slips and yachts
    if (marinaAt) {
      const { x, z, nx, nz, ux, uz } = marinaAt, an = Math.atan2(nz, nx), yD = WATER_Y + 0.05, P = (f, s2) => [x + nx * f + ux * s2, z + nz * f + uz * s2];
      for (const f of [0.1]) { const [mx, mz] = P(0.8, 0); sp("box", mx, yD, mz, 1.6, 0.04, 0.16, "#e9e2d2", -an); }
      for (const f of [1.6]) { const [mx, mz] = P(f, 0); sp("box", mx, yD, mz, 0.16, 0.04, 4.2, "#e9e2d2", -an); }
      for (let s2 = -1.9; s2 <= 1.9; s2 += 0.55) {
        for (const side of [-1, 1]) { const [fx, fz] = P(1.6 + side * 0.4, s2); sp("box", fx, yD, fz, 0.7, 0.035, 0.07, "#e9e2d2", -an); }
        for (const side of [-1, 1]) { if (R3() < 0.25) continue; const [bx, bz] = P(1.6 + side * 0.42, s2 + 0.27); if (typeof SHIPS !== "undefined") { const g = SHIPS.make(R3() < 0.75 ? "yacht" : "fishing", rng(hash(c.city) + s2 * 13 + side)); g.scale.setScalar(0.32); g.position.set(bx, WATER_Y - 0.03, bz); g.rotation.y = Math.atan2(nx, nz) + (side < 0 ? Math.PI : 0); scene.add(g); } }
      }
      const [hx, hz] = P(-0.4, 0); sp("rbox", hx, TOP + 0.15, hz, 0.7, 0.3, 0.45, "#f8f6f1", -an); sp("box", hx, TOP + 0.32, hz, 0.78, 0.04, 0.53, "#2f6fd6", -an);
      const [tx, tz] = P(-0.4, 0.6); sp("cyl", tx, TOP + 0.35, tz, 0.02, 0.7, 0.02, "#f8f6f1"); sp("box", tx + ux * 0.1, TOP + 0.62, tz + uz * 0.1, 0.18, 0.12, 0.01, "#2f6fd6", -Math.atan2(uz, ux));
    }
  }

  /* ---------- bridges between the islands (cable-stayed, joining the ring expressways) and ferry routes ---------- */
  WORLD.bridges = []; WORLD.ferryRoutes = []; WORLD.bridgeEnds = [];
  {
    const R = WORLD.rings || {}, cities = Object.keys(R), hub = R.taipei ? "taipei" : cities[0];
    const pairs = cities.filter((c) => c !== hub).map((c) => [hub, c]);
    // also link each outer island to its nearest neighbour if that is much closer than Taipei
    for (const c of cities) if (c !== hub) { let best = null, bd = Infinity; for (const o of cities) if (o !== c && o !== hub) { const d = Math.hypot(R[c].center[0] - R[o].center[0], R[c].center[1] - R[o].center[1]); if (d < bd) { bd = d; best = o; } } const dh = Math.hypot(R[c].center[0] - R[hub].center[0], R[c].center[1] - R[hub].center[1]); if (best && bd < dh * 0.85 && !pairs.some(([a, b]) => (a === best && b === c) || (a === c && b === best))) pairs.push([c, best]); }
    for (const [ca, cb] of pairs) {
      const A = R[ca], B = R[cb]; let best = null, bd = Infinity;
      for (let i = 0; i < A.pts.length; i += 2) for (let j = 0; j < B.pts.length; j += 2) { const a = A.pts[i], b = B.pts[j], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < bd) { bd = d; best = [a, b]; } }
      const [a, b] = best, Y = A.deck, L = bd, ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, ang = Math.atan2(uz, ux), nx = -uz, nz = ux;
      WORLD.bridgeEnds.push(a, b);
      const n = Math.max(2, Math.round(L / 0.6)), pts = [];
      for (let k = 0; k < n; k++) {
        const f0 = k / n, f1 = (k + 1) / n, mx = a[0] + (b[0] - a[0]) * (f0 + f1) / 2, mz = a[1] + (b[1] - a[1]) * (f0 + f1) / 2, seg = L / n;
        sp("box", mx, Y, mz, seg + 0.08, 0.1, 0.58, "#8b9097", -ang); sp("box", mx, Y + 0.05, mz, seg + 0.08, 0.012, 0.5, "#5d6168", -ang);
        for (const o of [-0.28, 0.28]) sp("box", mx + nx * o, Y + 0.1, mz + nz * o, seg + 0.08, 0.08, 0.03, "#eef1f5", -ang);
        if (k % 2 === 0) sp("box", mx, Y + 0.058, mz, seg * 0.45, 0.004, 0.025, "#ffffff", -ang);
        if (k % 4 === 0 && k > 0) { const ph = Y - WATER_Y; sp("cyl", mx, WATER_Y + ph / 2 - 0.05, mz, 0.16, ph, 0.16, "#cfc9bd"); sp("cyl", mx, WATER_Y + 0.02, mz, 0.26, 0.05, 0.26, "#ffffff"); }
        if (k % 2 === 1) { const o = k % 4 === 1 ? -0.3 : 0.3; sp("cyl", mx + nx * o, Y + 0.3, mz + nz * o, 0.015, 0.4, 0.015, "#3b4148"); sp("sphere", mx + nx * o, Y + 0.5, mz + nz * o, 0.04, 0.04, 0.04, "#fff3c4", 0, 0, 0, true); LAMP_POOLS.push([mx + nx * o * 0.4, Y + 0.06, mz + nz * o * 0.4, 0.42]); }
        pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * f0, Y + 0.07, a[1] + (b[1] - a[1]) * f0));
      }
      pts.push(new THREE.Vector3(b[0], Y + 0.07, b[1]));
      // two white A-frame pylons with fanned stay cables
      for (const f of [1 / 3, 2 / 3]) {
        const px = a[0] + (b[0] - a[0]) * f, pz = a[1] + (b[1] - a[1]) * f, PH = 2.4;
        for (const o of [-0.36, 0.36]) sp("box", px + nx * o * 0.6, Y + PH / 2, pz + nz * o * 0.6, 0.12, PH + 0.2, 0.12, "#f4f6f8", -ang, 0, 0);
        sp("box", px, Y + PH, pz, 0.14, 0.12, 0.6, "#f4f6f8", -ang); sp("sphere", px, Y + PH + 0.12, pz, 0.06, 0.06, 0.06, "#ff5a5a", 0, 0, 0, true);
        const ph = Y - WATER_Y; sp("box", px, WATER_Y + ph / 2, pz, 0.5, ph, 0.7, "#cfc9bd", -ang);
        for (const side of [-1, 1]) for (let c = 1; c <= 5; c++) { const dd = c * (L / 3 / 2) / 5.5 * side, ex = px + ux * dd, ez = pz + uz * dd, len = Math.hypot(dd, PH - 0.15); for (const o of [-0.22, 0.22]) sp("box", (px + ex) / 2 + nx * o, Y + (PH - 0.1) / 2 + 0.05, (pz + ez) / 2 + nz * o, len, 0.012, 0.012, "#e8edf2", -ang, 0, Math.atan2(-(PH - 0.15), dd)); }
      }
      WORLD.highways.push({ city: ca, pts });
      WORLD.bridges.push({ a, b, ca, cb });
      // ferries cross alongside the bridge, harbour to harbour, a little way off to either side
      const ca0 = cityInfo(ca).coast, cb0 = cityInfo(cb).coast;
      for (const off of [-3.2, 3.4]) {
        const sx = a[0] + nx * off, sz = a[1] + nz * off, ex = b[0] + nx * off, ez = b[1] + nz * off;
        // start/end just outside each island's coaster belt
        WORLD.ferryRoutes.push({ ax: sx - ux * 2.6, az: sz - uz * 2.6, bx: ex + ux * 2.6, bz: ez + uz * 2.6 });
      }
    }
  }
}
