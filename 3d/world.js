/* ===== world: each city is one organic island; equal-size hexagonal city blocks, with compatible policy IDs and an unchanged coastal perimeter ===== */
const WORLD = { bodies: new Map(), graph: { nodes: [], edges: new Map() }, cities: new Map() };
const MESH = {};
const GEOM = {};
{
  /* ---------- 2D geometry helpers (x,z pairs) ---------- */
  GEOM.hull = (pts) => { const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = []; for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); } for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
  GEOM.offsetRound = (hull, r, seg = 6, wob = null) => { // rounded outward offset of a convex CCW polygon
    const out = [], n = hull.length;
    for (let i = 0; i < n; i++) {
      const p = hull[i], a = hull[(i - 1 + n) % n], b = hull[(i + 1) % n];
      const n1 = Math.atan2(-(p[0] - a[0]), p[1] - a[1]), n2 = Math.atan2(-(b[0] - p[0]), b[1] - p[1]);
      let d = n2 - n1; while (d < 0) d += Math.PI * 2; while (d > Math.PI * 2) d -= Math.PI * 2;
      for (let k = 0; k <= seg; k++) { const t = n1 + (d * k) / seg, rr = wob ? r + wob(t, p) : r; out.push([p[0] + Math.cos(t) * rr, p[1] + Math.sin(t) * rr]); }
    }
    return out;
  };
  GEOM.area = (P) => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]); return a / 2; };
  GEOM.ccw = (P) => (GEOM.area(P) < 0 ? P : P.slice().reverse()); // x right, z down: negative signed area = counter-clockwise on screen
  GEOM.clip = (P, a, b) => { // keep the side where cross((b-a),(p-a)) >= 0
    const out = [], side = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    for (let i = 0; i < P.length; i++) {
      const c = P[i], d = P[(i + 1) % P.length], sc = side(c), sd = side(d);
      if (sc >= 0) out.push(c);
      if ((sc >= 0) !== (sd >= 0)) { const t = sc / (sc - sd); out.push([c[0] + (d[0] - c[0]) * t, c[1] + (d[1] - c[1]) * t]); }
    }
    return out;
  };
  GEOM.clipConvex = (P, C) => { let out = P; const cc = GEOM.area(C) > 0 ? C : C.slice().reverse(); for (let i = 0; i < cc.length && out.length; i++) out = GEOM.clip(out, cc[i], cc[(i + 1) % cc.length]); return out; };
  GEOM.halfPlane = (P, a, b) => { // points closer to a than b
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = [b[0] - a[0], b[1] - a[1]];
    const p0 = [m[0] - d[1], m[1] + d[0]], p1 = [m[0] + d[1], m[1] - d[0]];
    const sa = (p1[0] - p0[0]) * (a[1] - p0[1]) - (p1[1] - p0[1]) * (a[0] - p0[0]); return sa >= 0 ? GEOM.clip(P, p0, p1) : GEOM.clip(P, p1, p0);
  };
  GEOM.inset = (P, d) => { // inset a convex polygon by d
    const A = GEOM.area(P) < 0 ? P : P.slice().reverse(); let out = A;
    for (let i = 0; i < A.length && out.length; i++) { const a = A[i], b = A[(i + 1) % A.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L * d, nz = (b[0] - a[0]) / L * d; out = GEOM.clip(out, [a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz]); }
    return out;
  };
  GEOM.pip = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
  GEOM.segDist = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
  GEOM.nearestEdge = (x, z, P) => { let best = 1e9, ang = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], d = GEOM.segDist(x, z, a, b); if (d < best) { best = d; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } } return { d: best, ang }; };
  GEOM.centroid = (P) => { let x = 0, z = 0; for (const p of P) { x += p[0]; z += p[1]; } return [x / P.length, z / P.length]; };

  /* ---------- mesh helpers ---------- */
  MESH.shape = (P) => new THREE.Shape(P.map(([x, z]) => new THREE.Vector2(x, -z)));
  MESH.slab = (P, y0, y1, holes) => { const s = MESH.shape(P); for (const h of holes || []) s.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z)))); const g = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false, curveSegments: 1 }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return g; };
  MESH.mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, ...o });
  MESH.tex = (draw, rep) => { const c = document.createElement("canvas"); c.width = c.height = 256; draw(c.getContext("2d"), rng(3)); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  MESH.TEX = {
    asphalt: MESH.tex((g, R) => { g.fillStyle = "#73787f"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { g.fillStyle = R() < 0.5 ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.07)"; g.fillRect(R() * 256, R() * 256, 2, 2); } for (let i = 0; i < 6; i++) { g.strokeStyle = "rgba(0,0,0,.08)"; g.lineWidth = 1; g.beginPath(); g.moveTo(R() * 256, R() * 256); g.lineTo(R() * 256, R() * 256); g.stroke(); } }, 0.8),
    pavers: MESH.tex((g, R) => { g.fillStyle = "#e9e4da"; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < 256; x += 32) { g.fillStyle = `hsl(38,${12 + R() * 8}%,${84 + R() * 6}%)`; g.fillRect(x + 1, y + 1, 30, 30); } }, 1.1),
    grass: MESH.tex((g, R) => { g.fillStyle = "#bcc9a0"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 3000; i++) { g.fillStyle = R() < 0.5 ? "#aebe92" : "#ccd8ae"; g.fillRect(R() * 256, R() * 256, 3, 3); } for (let i = 0; i < 60; i++) { g.fillStyle = R() < 0.5 ? "#f6e9a8" : "#ffffff"; g.fillRect(R() * 256, R() * 256, 2, 2); } }, 0.6), // sage lawn, low saturation
    sand: MESH.tex((g, R) => { g.fillStyle = "#f9e5b4"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 1600; i++) { g.fillStyle = R() < 0.5 ? "rgba(214,181,120,.12)" : "rgba(255,255,255,.22)"; g.fillRect(R() * 256, R() * 256, 2, 2); } }, 0.7),
  };
  MESH.ribbon = (pts, w, y, closed = false) => { // strip geometry along a polyline
    const pos = [], P = closed ? [...pts, pts[0]] : pts;
    for (let k = 0; k < P.length - 1; k++) {
      const [ax, az] = P[k], [bx, bz] = P[k + 1], L = Math.hypot(bx - ax, bz - az) || 1, nx = (-(bz - az) / L) * w / 2, nz = ((bx - ax) / L) * w / 2;
      pos.push(ax - nx, y, az - nz, bx - nx, y, bz - nz, bx + nx, y, bz + nz, ax - nx, y, az - nz, bx + nx, y, bz + nz, ax + nx, y, az + nz);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
  };

  /* polygon offset by vertex normals (positive = outward); fine for the smooth-ish county outlines */
  GEOM.offset = (P, d) => {
    const s0 = GEOM.area(P) < 0 ? 1 : -1, n = P.length, out = [];
    for (let i = 0; i < n; i++) {
      const a = P[(i - 1 + n) % n], p = P[i], b = P[(i + 1) % n];
      const e1 = [p[0] - a[0], p[1] - a[1]], e2 = [b[0] - p[0], b[1] - p[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
      const n1 = [e1[1] / l1, -e1[0] / l1], n2 = [e2[1] / l2, -e2[0] / l2]; let nx = n1[0] + n2[0], nz = n1[1] + n2[1]; const L = Math.hypot(nx, nz) || 1; nx /= L; nz /= L;
      const k = Math.min(2.5, 1 / Math.max(0.35, nx * n1[0] + nz * n1[1]));
      out.push([p[0] - s0 * nx * d * k, p[1] - s0 * nz * d * k]);
    }
    return out;
  };
  GEOM.relax = (P, it = 2, k = 0.5) => { let Q = P.map((p) => p.slice()); for (let n = 0; n < it; n++) { const R = Q.map((p, i) => { const a = Q[(i - 1 + Q.length) % Q.length], b = Q[(i + 1) % Q.length]; return [p[0] * (1 - k) + (a[0] + b[0]) / 2 * k, p[1] * (1 - k) + (a[1] + b[1]) / 2 * k]; }); Q = R; } return Q; };
  GEOM.smooth = (P, it = 1) => { let Q = P; for (let k = 0; k < it; k++) { const R = []; for (let i = 0; i < Q.length; i++) { const a = Q[i], b = Q[(i + 1) % Q.length]; R.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } Q = R; } return Q; };

  /* ---------- each city is an island in its real administrative outline; policy themes are neighbourhoods inside it ---------- */
  const GD = A.D.meta.geo, LON0 = 121.45, LAT0 = 25.0, KX = 111.32 * Math.cos(LAT0 * Math.PI / 180), KZ = 110.57;
  const km = ([lon, lat]) => [(lon - LON0) * KX, -(lat - LAT0) * KZ];
  const CITY_SCALE = { taipei: 1.6, newtaipei: 0.42, keelung: 1.45, taoyuan: 0.55 };
  const outlines = {};
  for (const c of A.cities) {
    const rings = GD.cities[c.city]; let ring = rings.reduce((m, r) => (r.length > m.length ? r : m));
    const K = ring.map(km), cen = GEOM.centroid(K), s = CITY_SCALE[c.city] || 1;
    outlines[c.city] = { cen, local: GEOM.relax(GEOM.smooth(K.map(([x, z]) => [(x - cen[0]) * s, (z - cen[1]) * s]), 1), 3, 0.5) }; // extra relax passes: resort-smooth shoreline, no jagged pixel steps
  }
  // place Taipei at the origin and the others outward along their real bearing, far enough to stay separate islands
  const rad = (P) => Math.max(...P.map(([x, z]) => Math.hypot(x, z)));
  const tpC = outlines.taipei.cen, tpR = rad(outlines.taipei.local);
  for (const c of A.cities) {
    const o = outlines[c.city]; if (c.city === "taipei") { o.off = [0, 0]; continue; }
    const dir = [o.cen[0] - tpC[0], o.cen[1] - tpC[1]], L = Math.hypot(...dir) || 1;
    const dist = tpR + rad(o.local) + 14; // clear water between islands: room for the ring roads, coasters and shipping lanes
    o.off = [(dir[0] / L) * dist, (dir[1] / L) * dist]; o.dir = [dir[0] / L, dir[1] / L];
  }
  // push the outer islands apart from each other too, along their own bearing
  for (let it = 0; it < 40; it++) {
    let moved = false;
    for (const a of A.cities) for (const b of A.cities) {
      if (a.city >= b.city || a.city === "taipei" || b.city === "taipei") continue;
      const oa = outlines[a.city], ob = outlines[b.city], d = Math.hypot(oa.off[0] - ob.off[0], oa.off[1] - ob.off[1]), need = rad(oa.local) + rad(ob.local) + 12;
      if (d < need) { const o = rad(oa.local) < rad(ob.local) ? oa : ob; o.off[0] += o.dir[0] * 1.5; o.off[1] += o.dir[1] * 1.5; moved = true; }
    }
    if (!moved) break;
  }
  WORLD.geo = (city, lon, lat) => { const o = outlines[city], [x, z] = km([lon, lat]), k = CITY_SCALE[city] || 1; return [(x - o.cen[0]) * k + o.off[0], (z - o.cen[1]) * k + o.off[1]]; };
  const G = WORLD.graph, nodeKey = new Map();
  const node = (x, z) => { const k = Math.round(x * 20) + "," + Math.round(z * 20); if (nodeKey.has(k)) return nodeKey.get(k); G.nodes.push({ p: new THREE.Vector3(x, TOP - 0.025, z) }); nodeKey.set(k, G.nodes.length - 1); return G.nodes.length - 1; };
  const edgeSet = new Set();
  const addEdge = (a, b, info) => { if (a === b) return; const k = Math.min(a, b) + "-" + Math.max(a, b); if (edgeSet.has(k)) return; edgeSet.add(k); const d = G.nodes[a].p.distanceTo(G.nodes[b].p); (G.edges.get(a) || G.edges.set(a, []).get(a)).push([b, d, info]); (G.edges.get(b) || G.edges.set(b, []).get(b)).push([a, d, info]); };
  WORLD.roads = [];
  const ringNode = new Map(), ringPts = new Map();
  // Freeze the existing landmark sites while rebuilding the surrounding city fabric.
  WORLD.landmarkSites = {
    "t101": {"city": "taipei", "x": -2.032513, "z": 5.843775, "r": 1.794, "sc": 2.3},
    "dome": {"city": "taipei", "x": 1.837932, "z": 2.877729, "r": 1.767, "sc": 1.767},
    "station": {"city": "taipei", "x": -6.950167, "z": 6.65239, "r": 1.3158, "sc": 1.548},
    "shinkong": {"city": "taipei", "x": -9.523016, "z": 4.45314, "r": 0.84, "sc": 2},
    "grand": {"city": "taipei", "x": -5.215064, "z": -0.511118, "r": 1.44, "sc": 1.8},
    "npm": {"city": "taipei", "x": -3.615302, "z": -4.757006, "r": 1.568, "sc": 1.6},
    "miramar": {"city": "taipei", "x": 1.337517, "z": -2.413369, "r": 1.116, "sc": 1.488},
    "cks": {"city": "taipei", "x": -4.659188, "z": 12.416863, "r": 1.07328, "sc": 1.376},
    "sysm": {"city": "taipei", "x": -0.710495, "z": 9.782303, "r": 1.2834, "sc": 1.395},
    "longshan": {"city": "taipei", "x": -9.210522, "z": 1.027657, "r": 0.9288, "sc": 1.29},
    "redhouse": {"city": "taipei", "x": -3.346695, "z": 2.678479, "r": 0.8772, "sc": 1.29},
    "yangming": {"city": "taipei", "x": -3.180287, "z": -12.312577, "r": 1.725, "sc": 1.5},
    "elephant": {"city": "taipei", "x": 2.436863, "z": 10.743703, "r": 1.232, "sc": 1.4},
    "maokong": {"city": "taipei", "x": -0.239042, "z": 17.269967, "r": 1.3975, "sc": 1.118},
    "daan": {"city": "taipei", "x": 1.786182, "z": 13.801423, "r": 1.0608, "sc": 1.04},
    "beitou": {"city": "taipei", "x": -10.152986, "z": -9.378161, "r": 1.196, "sc": 1.3},
    "ntcity": {"city": "newtaipei", "x": 15.034505, "z": 51.441223, "r": 1.35, "sc": 1.8},
    "fort": {"city": "newtaipei", "x": 14.687015, "z": 43.871601, "r": 1.36, "sc": 1.6},
    "jiufen": {"city": "newtaipei", "x": 32.873866, "z": 49.441245, "r": 1.29, "sc": 1.29},
    "shifen": {"city": "newtaipei", "x": 27.687368, "z": 51.056556, "r": 1.26, "sc": 1.4},
    "queen": {"city": "newtaipei", "x": 20.327102, "z": 45.68198, "r": 1.1696, "sc": 1.376},
    "port": {"city": "keelung", "x": 52.358077, "z": -18.848294, "r": 1.425, "sc": 1.5},
    "guanyin": {"city": "keelung", "x": 50.266385, "z": -16.706988, "r": 0.81, "sc": 1.8},
    "miaokou": {"city": "keelung", "x": 49.120094, "z": -13.876825, "r": 1.2555, "sc": 1.395},
    "houses": {"city": "keelung", "x": 47.831963, "z": -18.073845, "r": 1.14, "sc": 1.2},
    "heping": {"city": "keelung", "x": 44.600509, "z": -16.908089, "r": 1.064, "sc": 1.12},
    "airport": {"city": "taoyuan", "x": -46.507352, "z": 27.464004, "r": 1.677, "sc": 1.118},
    "xpark": {"city": "taoyuan", "x": -53.506165, "z": 28.727695, "r": 1.2648, "sc": 1.488},
    "daxi": {"city": "taoyuan", "x": -45.760914, "z": 34.426019, "r": 1.44, "sc": 1.6},
    "rainbow": {"city": "taoyuan", "x": -51.965065, "z": 31.479788, "r": 1.152, "sc": 1.28},
    "dam": {"city": "taoyuan", "x": -43.618925, "z": 40.311337, "r": 1.5652, "sc": 1.118},
    "lala": {"city": "taoyuan", "x": -39.521005, "z": 43.210247, "r": 1.2642, "sc": 1.204}
  };
  WORLD.hexCells = [];
  WORLD.zoneFor = (theme) => {
    const name = theme.name || "";
    if (/環保|環境|工務|水利|治水|淨水|防災|韌性|農業/.test(name)) return "environment";
    if (/產業|數位|科技|AI|創新|就業/.test(name)) return "technology";
    if (/居住|都更|住宅/.test(name)) return "residential";
    if (/教育|衛生|醫療|健康|社福|托育|育兒|生養|長照|銀髮|長者|高齡|照顧|照護|食安|無菸|親子|好孕|勞動|治安|消防/.test(name)) return "public";
    if (/文化|觀光|體育|運動|賽事|族群|原民|客家|港市/.test(name)) return "culture";
    return "commercial";
  };
  const wanted = isl => (isl.t.items || []).length >= 9 ? 3 : (isl.t.items || []).length >= 5 ? 2 : 1;
  const outlinesWorld = new Map(A.cities.map(c => [c.city, outlines[c.city].local.map(([x,z]) => [x+outlines[c.city].off[0],z+outlines[c.city].off[1]])]));
  const corners = (x,z,r) => Array.from({length:6},(_,k) => [x+Math.cos(-Math.PI/2+k*Math.PI/3)*r,z+Math.sin(-Math.PI/2+k*Math.PI/3)*r]);
  const grid = (city, radius) => {
    const coast = outlinesWorld.get(city), xs=coast.map(p=>p[0]), zs=coast.map(p=>p[1]);
    const minx=Math.min(...xs),maxx=Math.max(...xs),minz=Math.min(...zs),maxz=Math.max(...zs);
    let best=[];
    for (const px of [0,1/3,2/3]) for (const pz of [0,1/3,2/3]) {
      const ox=outlines[city].off[0]+px*SQ3*radius,oz=outlines[city].off[1]+pz*1.5*radius, cells=[];
      for (let r=Math.floor((minz-oz)/(1.5*radius));r<=Math.ceil((maxz-oz)/(1.5*radius));r++) {
        for(let q=Math.floor((minx-ox)/(SQ3*radius)-r/2);q<=Math.ceil((maxx-ox)/(SQ3*radius)-r/2);q++) {
          const x=ox+SQ3*radius*(q+r/2),z=oz+1.5*radius*r;
          if(!GEOM.pip(x,z,coast)||GEOM.nearestEdge(x,z,coast).d<radius+0.55)continue;
          cells.push({id:`${city}:${q}:${r}`,city,q,r,c:[x,z],poly:corners(x,z,radius),themeId:null});
        }
      }
      if(cells.length>best.length)best=cells;
    }
    return best;
  };
  // One shared radius across all four cities. Reserve spare blocks for landmarks and normal city fabric.
  const reserved=(cell,R)=>Object.values(WORLD.landmarkSites).some(l=>l.city===cell.city&&Math.hypot(cell.c[0]-l.x,cell.c[1]-l.z)<R+l.r+0.2);
  let hexRadius=2.1,layouts;
  for(;hexRadius>=0.7;hexRadius-=0.05){
    layouts=new Map(A.cities.map(c=>[c.city,grid(c.city,hexRadius)]));
    if(A.cities.every(c=>{const themes=islands.filter(i=>i.city===c.city);return layouts.get(c.city).filter(cell=>!reserved(cell,hexRadius)).length>=themes.reduce((n,i)=>n+wanted(i),0)+Math.max(6,Math.ceil(themes.length*0.55))}))break;
  }
  if(hexRadius<0.7)throw new Error("Cannot fit complete policy hex groups inside the city coastlines");
  WORLD.hexRadius=hexRadius;
  const directions=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
  const boundary = cells => {
    const key=p=>p.map(n=>n.toFixed(5)).join(","),edges=new Map();
    for(const cell of cells)for(let i=0;i<6;i++){
      const a=cell.poly[i],b=cell.poly[(i+1)%6],k=[key(a),key(b)].sort().join("|");
      if(edges.has(k))edges.delete(k);else edges.set(k,[a,b]);
    }
    const next=new Map([...edges.values()].map(e=>[key(e[0]),e[1]])),first=[...edges.values()][0][0],out=[first];
    let current=next.get(key(first));
    while(current&&key(current)!==key(first)&&out.length<=edges.size){out.push(current);current=next.get(key(current));}
    return GEOM.ccw(out);
  };
  for (const c of A.cities) {
    const mine = islands.filter((i) => i.city === c.city), live = LIVE_CITIES.has(c.city);
    const coast=outlinesWorld.get(c.city),cells=layouts.get(c.city),available=new Set(cells.filter(cell=>!reserved(cell,hexRadius))),lookup=new Map(cells.map(cell=>[`${cell.q},${cell.r}`,cell]));
    const center0=GEOM.centroid(coast),xs=coast.map(p=>p[0]),zs=coast.map(p=>p[1]),reach=Math.min(Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs))*0.25;
    const zones=["commercial","technology","residential","public","culture","environment"];
    const order=[...mine].sort((a,b)=>zones.indexOf(WORLD.zoneFor(a.t))-zones.indexOf(WORLD.zoneFor(b.t))||wanted(b)-wanted(a)||a.t.no-b.t.no);
    for(const isl of order){
      const zone=WORLD.zoneFor(isl.t),zi=zones.indexOf(zone),angle=-Math.PI/2+zi*Math.PI/3;
      const target=[center0[0]+Math.cos(angle)*reach,center0[1]+Math.sin(angle)*reach];
      const score=cell=>Math.hypot(cell.c[0]-target[0],cell.c[1]-target[1]);
      const candidates=[...available].sort((a,b)=>score(a)-score(b));let group=null;
      for(const seed of candidates){
        const picked=[seed],seen=new Set(picked);
        for(let k=0;k<picked.length&&picked.length<wanted(isl);k++){
          const a=picked[k],adj=directions.map(([dq,dr])=>lookup.get(`${a.q+dq},${a.r+dr}`)).filter(b=>b&&available.has(b)&&!seen.has(b)).sort((a,b)=>score(a)-score(b));
          for(const b of adj){picked.push(b);seen.add(b);if(picked.length===wanted(isl))break;}
        }
        if(picked.length===wanted(isl)){group=picked;break;}
      }
      if(!group)throw new Error(`No contiguous hex group for ${isl.id}`);
      isl.c.set(group[0].c[0],0,group[0].c[1]);isl.cells=group;isl.zone=zone;isl.hexRadius=hexRadius;
      for(const cell of group){available.delete(cell);cell.themeId=isl.id;cell.zone=zone;}
    }
    // Extend the same lattice into usable coastal pockets without moving any policy block.
    const seed=cells[0],ox=seed.c[0]-SQ3*hexRadius*(seed.q+seed.r/2),oz=seed.c[1]-1.5*hexRadius*seed.r;
    const existing=new Set(cells.map(cell=>`${cell.q},${cell.r}`));
    for(let r=Math.floor((Math.min(...zs)-oz)/(1.5*hexRadius));r<=Math.ceil((Math.max(...zs)-oz)/(1.5*hexRadius));r++){
      for(let q=Math.floor((Math.min(...xs)-ox)/(SQ3*hexRadius)-r/2);q<=Math.ceil((Math.max(...xs)-ox)/(SQ3*hexRadius)-r/2);q++){
        if(existing.has(`${q},${r}`))continue;
        const x=ox+SQ3*hexRadius*(q+r/2),z=oz+1.5*hexRadius*r,poly=corners(x,z,hexRadius);
        const samples=poly.flatMap((a,i)=>[a,[(a[0]+poly[(i+1)%6][0])/2,(a[1]+poly[(i+1)%6][1])/2]]);
        if(!samples.every(p=>GEOM.pip(p[0],p[1],coast)&&GEOM.nearestEdge(p[0],p[1],coast).d>.16))continue;
        cells.push({id:`${c.city}:${q}:${r}`,city:c.city,q,r,c:[x,z],poly,themeId:null});
      }
    }
    for(const cell of cells.filter(cell=>!cell.themeId)){const nearest=mine.reduce((a,b)=>Math.hypot(cell.c[0]-a.c.x,cell.c[1]-a.c.z)<Math.hypot(cell.c[0]-b.c.x,cell.c[1]-b.c.z)?a:b);cell.zone=nearest.zone;}
    WORLD.hexCells.push(...cells);
    const center = GEOM.centroid(coast);
    WORLD.cities.set(c.city, { live, coast, center, hull: GEOM.hull(coast), E: 0 });
    /* ground: wide beach, grassy land */
    const sandMat = new THREE.MeshStandardMaterial({ map: MESH.TEX.sand, roughness: 0.95 }), grass = live ? new THREE.MeshStandardMaterial({ map: MESH.TEX.grass, roughness: 0.95 }) : MESH.mat("#b9b6ad");
    const land = new THREE.Mesh(MESH.slab(coast, WATER_Y - 0.35, TOP - 0.05), grass); land.receiveShadow = true; land.castShadow = true;
    const border = new THREE.Mesh(MESH.ribbon(coast, 0.16, TOP - 0.045, true), MESH.mat(live ? cityHex(c.city) : "#9a9a9a"));
    scene.add(land, border);
    /* shoreline: stretches of sandy beach alternate with harbour quays, so the land always meets the sea properly */
    /* bridge narrow pockets in the real outline (river mouths, notches): the shoreline runs straight across and the pocket fills with sand */
    const pockets = [], shoreC = (() => {
      const P = coast, n0 = P.length, cum = [0]; for (let i = 1; i <= n0; i++) cum.push(cum[i - 1] + Math.hypot(P[i % n0][0] - P[i - 1][0], P[i % n0][1] - P[i - 1][1]));
      const skip = new Uint8Array(n0), out = [];
      for (let i = 0; i < n0; i++) {
        if (skip[i]) continue; let bestJ = -1;
        for (let k = 3; k < Math.min(70, n0 / 3); k++) {
          const j = (i + k) % n0, d = Math.hypot(P[j][0] - P[i][0], P[j][1] - P[i][1]); if (d > 3.2) continue;
          const path = i + k <= n0 ? cum[i + k] - cum[i] : cum[n0] - cum[i] + cum[(i + k) % n0];
          const mx = (P[i][0] + P[j][0]) / 2, mz = (P[i][1] + P[j][1]) / 2;
          if (path > d * 2.2 + 0.8 && !GEOM.pip(mx, mz, P)) bestJ = k;
        }
        if (bestJ > 0) { const poly = []; for (let k = 0; k <= bestJ; k++) { poly.push(P[(i + k) % n0]); if (k > 0 && k < bestJ) skip[(i + k) % n0] = 1; } pockets.push(poly); }
      }
      for (let i = 0; i < n0; i++) if (!skip[i]) out.push(P[i]);
      return out;
    })();
    {
      const n = shoreC.length, outward = [], cum = [0], bridgeA = new Set(pockets.map((p) => p[0]));
      for (let i = 0; i < n; i++) {
        const a = shoreC[(i - 1 + n) % n], b = shoreC[(i + 1) % n], tx = b[0] - a[0], tz = b[1] - a[1], L = Math.hypot(tx, tz) || 1;
        let nx = tz / L, nz = -tx / L; const p = shoreC[i]; if (GEOM.pip(p[0] + nx * 0.4, p[1] + nz * 0.4, shoreC)) { nx = -nx; nz = -nz; }
        outward.push([nx, nz]); if (i) cum.push(cum[i - 1] + Math.hypot(p[0] - shoreC[i - 1][0], p[1] - shoreC[i - 1][1]));
      }
      const RS = rng(hash(c.city) + 41), seg = [], total = cum[n - 1];
      // pick a type per ~6 units of shoreline; the north-most stretch is always the port
      const northI = shoreC.reduce((m, q, i) => (q[1] < shoreC[m][1] ? i : m), 0);
      const types = []; for (let s0 = 0; s0 < total + 6; s0 += 6) { const v = RS(); types.push(v < 0.58 ? "beach" : v < 0.86 ? "harbour" : "rocks"); }
      const typeAt = (i) => (Math.abs(cum[i] - cum[northI]) < 4 || total - Math.abs(cum[i] - cum[northI]) < 4 ? "harbour" : types[Math.floor(cum[i] / 6)]);
      const pos = { beach: [], wet: [], foam: [], quay: [], deck: [] }, W = live ? 2.0 : 1.1;
      const Q = (arr, a, b, c2, d) => arr.push(...a, ...b, ...c2, ...a, ...c2, ...d);
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, A0 = shoreC[i], B0 = shoreC[j], na = outward[i], nb = outward[j], t = bridgeA.has(A0) ? "beach" : typeAt(i);
        const P = (pt, nn, o, y) => [pt[0] + nn[0] * o, y, pt[1] + nn[1] * o];
        if (t === "harbour") {
          Q(pos.quay, P(A0, na, 0.02, WATER_Y - 0.35), P(B0, nb, 0.02, WATER_Y - 0.35), P(B0, nb, 0.02, TOP - 0.05), P(A0, na, 0.02, TOP - 0.05));
          Q(pos.deck, P(A0, na, -0.1, TOP - 0.044), P(B0, nb, -0.1, TOP - 0.044), P(B0, nb, 0.06, TOP - 0.044), P(A0, na, 0.06, TOP - 0.044));
          Q(pos.foam, P(A0, na, 0.06, WATER_Y + 0.012), P(B0, nb, 0.06, WATER_Y + 0.012), P(B0, nb, 0.16, WATER_Y + 0.012), P(A0, na, 0.16, WATER_Y + 0.012));
        } else {
          const w = t === "rocks" ? W * 0.6 : W;
          Q(pos.beach, P(A0, na, -0.02, TOP - 0.06), P(B0, nb, -0.02, TOP - 0.06), P(B0, nb, w, WATER_Y + 0.02), P(A0, na, w, WATER_Y + 0.02));
          Q(pos.wet, P(A0, na, w, WATER_Y + 0.02), P(B0, nb, w, WATER_Y + 0.02), P(B0, nb, w + 0.35, WATER_Y - 0.03), P(A0, na, w + 0.35, WATER_Y - 0.03));
          Q(pos.foam, P(A0, na, w + 0.22, WATER_Y + 0.012), P(B0, nb, w + 0.22, WATER_Y + 0.012), P(B0, nb, w + 0.42, WATER_Y + 0.012), P(A0, na, w + 0.42, WATER_Y + 0.012));
        }
        seg.push({ a: A0, b: B0, na, nb, type: t });
      }
      const mk = (arr, mat) => { if (!arr.length) return; const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3)); const uv = []; for (let k = 0; k < arr.length; k += 3) uv.push(arr[k] * 0.6, arr[k + 2] * 0.6); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); };
      mk(pos.beach, new THREE.MeshStandardMaterial({ map: MESH.TEX.sand, roughness: 0.95, side: THREE.DoubleSide }));
      mk(pos.wet, MESH.mat("#ecd49c", { side: THREE.DoubleSide }));
      mk(pos.quay, MESH.mat(live ? "#d9d6cd" : "#b3b0a9", { side: THREE.DoubleSide }));
      mk(pos.deck, MESH.mat("#efece4", { side: THREE.DoubleSide }));
      mk(pos.foam, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide }));
      { // sand cones at every beach vertex: the union with the strips is a true offset, so concave corners and notches get beach too
        const cp = [], H0 = TOP - 0.065, H1 = WATER_Y + 0.02, SEGS = 20;
        for (let i = 0; i < n; i++) {
          const tPrev = seg[(i - 1 + n) % n]?.type, tCur = seg[i]?.type; if (tPrev !== "beach" && tCur !== "beach" && tPrev !== "rocks" && tCur !== "rocks") continue;
          const w = tPrev === "beach" || tCur === "beach" ? W : W * 0.6, [px, pz] = shoreC[i];
          for (let k = 0; k < SEGS; k++) { const a0 = (k / SEGS) * Math.PI * 2, a1 = ((k + 1) / SEGS) * Math.PI * 2; cp.push(px, H0, pz, px + Math.cos(a1) * w, H1, pz + Math.sin(a1) * w, px + Math.cos(a0) * w, H1, pz + Math.sin(a0) * w); }
        }
        if (cp.length) mk(cp, new THREE.MeshStandardMaterial({ map: MESH.TEX.sand, roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
      }
      if (live) { // turquoise shallows fading into the deep sea
        const sp = [], sc = [], C1 = [0.42, 0.9, 0.84, 0.9], C2 = [0.3, 0.78, 0.86, 0];
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n, A0 = shoreC[i], B0 = shoreC[j], na = outward[i], nb = outward[j];
          const P = (pt, nn, o) => [pt[0] + nn[0] * o, WATER_Y + 0.006, pt[1] + nn[1] * o];
          for (const [o1, o2, c1, c2] of [[0, W + 0.5, C1, C1], [W + 0.5, W + 3.2, C1, C2]]) {
            const v = [P(A0, na, o1), P(B0, nb, o1), P(B0, nb, o2), P(A0, na, o2)], cc = [c1, c1, c2, c2];
            for (const k of [0, 1, 2, 0, 2, 3]) { sp.push(...v[k]); sc.push(...cc[k]); }
          }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(sc, 4));
        const bm = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        // stencil: each pixel of the shallows is blended once, so overlapping strips at bends never stack into bright wedges
        bm.stencilWrite = true; bm.stencilRef = 1; bm.stencilFunc = THREE.NotEqualStencilFunc; bm.stencilZPass = THREE.ReplaceStencilOp;
        const m = new THREE.Mesh(g, bm); m.renderOrder = 1; scene.add(m);
      }
      WORLD.shore = WORLD.shore || new Map(); WORLD.shore.set(c.city, seg);
      WORLD.pockets = WORLD.pockets || new Map(); WORLD.pockets.set(c.city, pockets);
      for (const pk of pockets) { // flat sand filling the bridged pocket, level with the top of the beach
        const sh = new THREE.Shape(pk.map(([x, z]) => new THREE.Vector2(x, -z))), g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: MESH.TEX.sand, roughness: 0.95, side: THREE.DoubleSide })); m.position.y = TOP - 0.055; m.receiveShadow = true; scene.add(m);
        const wall = []; for (let k = 0; k < pk.length; k++) { const a = pk[k], b = pk[(k + 1) % pk.length]; wall.push(a[0], TOP - 0.055, a[1], b[0], TOP - 0.055, b[1], b[0], WATER_Y - 0.3, b[1], a[0], TOP - 0.055, a[1], b[0], WATER_Y - 0.3, b[1], a[0], WATER_Y - 0.3, a[1]); }
        const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(wall, 3)); wg.computeVertexNormals(); scene.add(new THREE.Mesh(wg, MESH.mat("#f1dfae", { side: THREE.DoubleSide })));
      }
    }
    const roadsBase = new THREE.Mesh(MESH.slab(GEOM.offset(coast, -0.15), TOP - 0.05, TOP - 0.03), live ? new THREE.MeshStandardMaterial({ map: MESH.TEX.pavers, color:0xc4c2b7, roughness: 0.9 }) : MESH.mat("#aaa99f")); roadsBase.receiveShadow = true; scene.add(roadsBase);
    // Every full hex gets the same inset; gaps form a continuous, shared street network.
    for (const cell of cells) {
      const ids=cell.poly.map(([x,z])=>node(x,z));
      for(let k=0;k<6;k++){
        const a=ids[k],b=ids[(k+1)%6],key=Math.min(a,b)+"-"+Math.max(a,b);
        if(!edgeSet.has(key))WORLD.roads.push({a:cell.poly[k],b:cell.poly[(k+1)%6],city:c.city,live});
        addEdge(a,b,{car:true});
      }
    }
    for (const isl of mine) {
      const P=boundary(isl.cells),loc=P.map(([x,z])=>[x-isl.c.x,z-isl.c.z]);
      isl.poly=loc;isl.polyWorld=P;
      const shapes=isl.cells.map(cell=>MESH.shape(corners(cell.c[0]-isl.c.x,cell.c[1]-isl.c.z,hexRadius-0.18)));
      const geometry=new THREE.ExtrudeGeometry(shapes,{depth:0.04,bevelEnabled:false,curveSegments:1});geometry.rotateX(-Math.PI/2);geometry.translate(0,TOP-0.04,0);
      const g=new THREE.Group();g.position.set(isl.c.x,0,isl.c.z);
      const plate=new THREE.Mesh(geometry,live?new THREE.MeshStandardMaterial({map:MESH.TEX.pavers,color:0xeedcbc,roughness:0.95}):MESH.mat("#c9c6bf"));
      plate.receiveShadow=true;plate.userData={type:"island",id:isl.id};
      const outline=new THREE.Mesh(MESH.ribbon(loc,0.045,TOP+0.012,true),new THREE.MeshBasicMaterial({color:live?col(cityHex(isl.city)):col("#9a9a9a"),side:THREE.DoubleSide}));outline.visible=false;
      g.add(plate,outline);scene.add(g);
      WORLD.bodies.set(isl.id,{g,top:plate,cliff:plate,outline,baseTop:plate.material.color.clone(),anchor:new THREE.Vector3(0,TOP,0)});
      const ids=P.map(([x,z])=>node(x,z));ringNode.set(isl.id,ids);ringPts.set(isl.id,loc);
    }
  }
  WORLD.ringNode = ringNode; WORLD.ringPts = ringPts; WORLD.bridges = [];
  WORLD.shortest = (s, t) => {
    const n = G.nodes.length, dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
    dist[s] = 0;
    for (;;) { let u = -1, best = Infinity; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; } if (u < 0 || u === t) break; done[u] = 1; for (const [v, w] of G.edges.get(u) || []) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } }
    if (!isFinite(dist[t])) return null; const path = []; for (let u = t; u >= 0; u = prev[u]) path.unshift(u); return path;
  };
  WORLD.nodeNear = (islId, p) => { let best = null, bd = Infinity; for (const id of ringNode.get(islId)) { const dd = G.nodes[id].p.distanceToSquared(p); if (dd < bd) { bd = dd; best = id; } } return best; };
  /* the camera and environment frame the real islands */
  bounds.makeEmpty(); for (const ci of WORLD.cities.values()) for (const [x, z] of ci.coast) bounds.expandByPoint(new THREE.Vector3(x, 0, z));
  bounds.expandByScalar(1.5); bounds.getCenter(MID);
}
