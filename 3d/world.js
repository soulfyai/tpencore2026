/* ===== world: each city is one organic island; policy themes are neighbourhoods (irregular Voronoi districts) cut by real-looking streets ===== */
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
    grass: MESH.tex((g, R) => { g.fillStyle = "#93c76a"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 3000; i++) { g.fillStyle = R() < 0.5 ? "#86bb5e" : "#a6d47c"; g.fillRect(R() * 256, R() * 256, 3, 3); } for (let i = 0; i < 60; i++) { g.fillStyle = R() < 0.5 ? "#f6e9a8" : "#ffffff"; g.fillRect(R() * 256, R() * 256, 2, 2); } }, 0.6),
    sand: MESH.tex((g, R) => { g.fillStyle = "#f7d98f"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2500; i++) { g.fillStyle = R() < 0.5 ? "rgba(160,120,60,.10)" : "rgba(255,255,255,.25)"; g.fillRect(R() * 256, R() * 256, 2, 2); } }, 0.7),
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
  GEOM.smooth = (P, it = 1) => { let Q = P; for (let k = 0; k < it; k++) { const R = []; for (let i = 0; i < Q.length; i++) { const a = Q[i], b = Q[(i + 1) % Q.length]; R.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } Q = R; } return Q; };

  /* ---------- each city is an island in its real administrative outline; policy themes are neighbourhoods inside it ---------- */
  const GD = A.D.meta.geo, LON0 = 121.45, LAT0 = 25.0, KX = 111.32 * Math.cos(LAT0 * Math.PI / 180), KZ = 110.57;
  const km = ([lon, lat]) => [(lon - LON0) * KX, -(lat - LAT0) * KZ];
  const CITY_SCALE = { taipei: 1.6, newtaipei: 0.42, keelung: 1.45, taoyuan: 0.55 };
  const outlines = {};
  for (const c of A.cities) {
    const rings = GD.cities[c.city]; let ring = rings.reduce((m, r) => (r.length > m.length ? r : m));
    const K = ring.map(km), cen = GEOM.centroid(K), s = CITY_SCALE[c.city] || 1;
    outlines[c.city] = { cen, local: GEOM.smooth(K.map(([x, z]) => [(x - cen[0]) * s, (z - cen[1]) * s]), 1) };
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
  for (const c of A.cities) {
    const mine = islands.filter((i) => i.city === c.city), live = LIVE_CITIES.has(c.city), R1 = rng(hash(c.city) + 11);
    const o = outlines[c.city], coast = o.local.map(([x, z]) => [x + o.off[0], z + o.off[1]]);
    const [minx, minz, maxx, maxz] = coast.reduce((m, [x, z]) => [Math.min(m[0], x), Math.min(m[1], z), Math.max(m[2], x), Math.max(m[3], z)], [1e9, 1e9, -1e9, -1e9]);
    /* neighbourhood sites: k-means over the land so every theme gets a similar share */
    const samp = []; const st = Math.sqrt(((maxx - minx) * (maxz - minz)) / 1600);
    for (let x = minx; x <= maxx; x += st) for (let z = minz; z <= maxz; z += st) if (GEOM.pip(x, z, coast) && GEOM.pip(x, z, GEOM.offset(coast, -0.8))) samp.push([x, z]);
    let sites = []; sites.push(samp[(R1() * samp.length) | 0]);
    while (sites.length < mine.length) { let best = null, bd = -1; for (const q of samp) { const d = Math.min(...sites.map((s) => Math.hypot(s[0] - q[0], s[1] - q[1]))); if (d > bd) { bd = d; best = q; } } sites.push(best); }
    for (let it = 0; it < 18; it++) { const acc = sites.map(() => [0, 0, 0]); for (const q of samp) { let k = 0, bd = 1e9; sites.forEach((s, j) => { const d = (s[0] - q[0]) ** 2 + (s[1] - q[1]) ** 2; if (d < bd) { bd = d; k = j; } }); acc[k][0] += q[0]; acc[k][1] += q[1]; acc[k][2]++; } sites = acc.map((a, j) => (a[2] ? [a[0] / a[2], a[1] / a[2]] : sites[j])); }
    // keep the 2D map's reading order: themes in row order take sites in row order
    const order = [...mine].sort((a, b) => a.r - b.r || a.q - b.q);
    const rows = Math.max(1, Math.round(Math.sqrt(mine.length * ((maxz - minz) / Math.max(1, maxx - minx))))), byZ = [...sites].sort((a, b) => a[1] - b[1]), per = Math.ceil(byZ.length / rows), siteOrder = [];
    for (let rI = 0; rI < rows; rI++) siteOrder.push(...byZ.slice(rI * per, (rI + 1) * per).sort((a, b) => a[0] - b[0]));
    order.forEach((isl, k) => { const sP = siteOrder[k]; isl.c.set(sP[0], 0, sP[1]); });
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
      mk(pos.wet, MESH.mat("#d8c08a", { side: THREE.DoubleSide }));
      mk(pos.quay, MESH.mat(live ? "#c9c4b8" : "#b3b0a9", { side: THREE.DoubleSide }));
      mk(pos.deck, MESH.mat("#e6e1d6", { side: THREE.DoubleSide }));
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
        const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(wall, 3)); wg.computeVertexNormals(); scene.add(new THREE.Mesh(wg, MESH.mat("#e8cf8a", { side: THREE.DoubleSide })));
      }
    }
    const roadsBase = new THREE.Mesh(MESH.slab(GEOM.offset(coast, -0.15), TOP - 0.05, TOP - 0.03), live ? new THREE.MeshStandardMaterial({ map: MESH.TEX.asphalt, roughness: 0.9 }) : MESH.mat("#8d8f92")); roadsBase.receiveShadow = true; scene.add(roadsBase);
    const inner = GEOM.offset(coast, -0.15);
    for (const isl of mine) {
      let P = inner.slice();
      for (const q of mine) if (q !== isl) P = GEOM.halfPlane(P, [isl.c.x, isl.c.z], [q.c.x, q.c.z]);
      P = GEOM.ccw(P);
      const ins = GEOM.offset(P, -0.22);
      const loc = ins.map(([x, z]) => [x - isl.c.x, z - isl.c.z]);
      isl.poly = loc; isl.polyWorld = P;
      const g = new THREE.Group(); g.position.set(isl.c.x, 0, isl.c.z);
      const plate = new THREE.Mesh(MESH.slab(loc, TOP - 0.04, TOP), live ? new THREE.MeshStandardMaterial({ map: MESH.TEX.grass, color: 0xe8ffe0, roughness: 0.95 }) : MESH.mat("#c9c6bf")); plate.receiveShadow = true;
      plate.userData = { type: "island", id: isl.id };
      const outline = new THREE.Mesh(MESH.ribbon(loc, 0.12, TOP + 0.012, true), new THREE.MeshBasicMaterial({ color: live ? col(cityHex(isl.city)) : col("#9a9a9a"), side: THREE.DoubleSide }));
      outline.visible = false;
      g.add(plate, outline); scene.add(g);
      WORLD.bodies.set(isl.id, { g, top: plate, cliff: plate, outline, baseTop: plate.material.color.clone(), anchor: new THREE.Vector3(0, TOP, 0) });
      const ids = P.map(([x, z]) => node(x, z));
      for (let k = 0; k < P.length; k++) { const a = ids[k], b = ids[(k + 1) % P.length]; if (!edgeSet.has(Math.min(a, b) + "-" + Math.max(a, b))) WORLD.roads.push({ a: P[k], b: P[(k + 1) % P.length], city: c.city, live }); addEdge(a, b, { car: true }); }
      ringNode.set(isl.id, ids); ringPts.set(isl.id, P.map(([x, z]) => [x - isl.c.x, z - isl.c.z]));
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
