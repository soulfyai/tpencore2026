/* ===== citizens: flow carriers walk the bridge network between cities; residents stroll island rings ===== */
const PEOPLE = { list: [], routes: [] };
{
  const R1 = rng(41);
  const SKIN = ["#f1c9a6", "#e2b38c", "#c99772", "#f4d4b8"], HAIR = ["#2e2620", "#4a3a2e", "#6b5444", "#1f1f22", "#9a9a9a"];
  const SHIRT = ["#ebe5d9", "#9aa99a", "#b8a6aa", "#81949a", "#c4ae8e", "#c2bdac"]; // muted everyday clothes, independent of city identity colors
  const ROLES = ["commuter", "student", "elder", "parent", "worker", "hiker", "umbrella", "balloon", "runner", "shopper"];
  PEOPLE.roles = ROLES;
  const routeOf = (pts) => { const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + pts[k].distanceTo(pts[k - 1])); return { pts, cum, total: cum[cum.length - 1] }; };

  /* flow routes: nearest island pair between the hub city and each partner city, walked over bridges */
  const nearestPair = (ca, cb) => { let best = null, bd = Infinity; for (const a of islands) if (a.city === ca) for (const b of islands) if (b.city === cb) { const d = a.c.distanceToSquared(b.c); if (d < bd) { bd = d; best = [a, b]; } } return best; };
  for (const f of []) { // cross-city flows are off while only Taipei is built
    const cs = f.cities.filter((x) => cityCenter.has(x)), hub = cs[0];
    for (const other of cs.slice(1)) {
      const pair = nearestPair(hub, other); if (!pair) continue;
      // start a little inside the hub city so the route visibly leaves it
      const start = islands.filter((i) => i.city === hub).sort((x, y) => x.c.distanceTo(cityCenter.get(hub)) - y.c.distanceTo(cityCenter.get(hub)))[0];
      const end = islands.filter((i) => i.city === other).sort((x, y) => x.c.distanceTo(cityCenter.get(other)) - y.c.distanceTo(cityCenter.get(other)))[0];
      const path = WORLD.shortest(WORLD.nodeNear(start.id, end.c), WORLD.nodeNear(end.id, start.c));
      if (!path || path.length < 2) continue;
      const pts = path.map((n) => WORLD.graph.nodes[n].p.clone());
      PEOPLE.routes.push({ f, from: hub, to: other, route: routeOf(pts) });
    }
  }

  /* people */
  const add = (o) => {
    const topic = islandById.get(o.isl)?.t.name || "";
    const local = /教育|育兒|青年/.test(topic) ? ["student", "parent", "balloon"] : /社福|長照|衛生/.test(topic) ? ["elder", "parent", "shopper"] : /工務|交通|產業/.test(topic) ? ["worker", "commuter", "shopper"] : ["hiker", "runner", "umbrella", "balloon", "parent"];
    o.role = PEOPLE.list.length < ROLES.length ? ROLES[PEOPLE.list.length] : pick(R1, R1() < 0.7 ? local : ROLES);
    o.size = o.role === "student" || o.role === "balloon" ? 0.76 : o.role === "elder" ? 0.93 : 1;
    if (o.role === "elder") o.speed *= 0.65;
    if (o.role === "runner") o.speed *= 1.45;
    o.skin = col(pick(R1, SKIN)); o.hair = col(pick(R1, HAIR)); o.shirt = col(o.shirt || pick(R1, SHIRT)); o.pants = col(R1() < 0.5 ? "#3b4148" : "#5a6b7d"); o.ph = R1() * 6; PEOPLE.list.push(o); };
  const perRoute = QUALITY === "high" ? 3 : 2;
  PEOPLE.routes.forEach((rt, ri) => {
    for (let k = 0; k < perRoute; k++) add({ kind: "flow", flow: rt.f.id, rt: rt.route, s: (k / perRoute) * rt.route.total, dir: k % 2 ? -1 : 1, speed: 0.32 + R1() * 0.1, wait: 0, side: (k % 2 ? 1 : -1) * 0.06, carry: rt.f.carry, shirt: pick(R1, SHIRT) });
  });
  for (const isl of islands.filter((i) => i.live)) {
    const ids = WORLD.ringNode.get(isl.id), n = QUALITY === "high" ? 7 : 4;
    for (let k = 0; k < n; k++) {
      const a = (R1() * ids.length) | 0, len = 3 + ((R1() * 3) | 0);
      const pts = []; for (let j = 0; j <= len; j++) pts.push(WORLD.graph.nodes[ids[(a + j) % ids.length]].p.clone());
      add({ kind: "ambient", isl: isl.id, rt: routeOf(pts), s: R1() * 2, dir: 1, speed: 0.12 + R1() * 0.08, wait: R1() * 3, side: (R1() < 0.5 ? 1 : -1) * 0.21 });
    }
  }

  /* pools of warm light under the street lamps: invisible by day, they fade in when the lamps switch on at 17:00 */
  {
    const tex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,226,150,1)"); gr.addColorStop(0.5, "rgba(255,210,120,.45)"); gr.addColorStop(1, "rgba(255,200,110,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    const M = new THREE.Matrix4();
    const mkPools = (list, colr) => {
      const pm = new THREE.MeshBasicMaterial({ map: tex, color: colr, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false, fog: false });
      const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), pm, Math.max(1, list.length));
      list.forEach(([x, y, z, r], i) => im.setMatrixAt(i, M.makeScale(r * 3, 1, r * 3).setPosition(x, y + 0.01, z)));
      im.count = list.length; im.frustumCulled = false; im.renderOrder = 2; scene.add(im); return pm;
    };
    // street lamps and the policy-campus floodlights (the wide pools) are lit separately, so the campuses stand out at night
    PEOPLE.lampPools = mkPools(LAMP_POOLS.filter((p2) => p2[3] <= 0.6), new THREE.Color(1.8, 1.55, 1.1));
    PEOPLE.campusPools = mkPools(LAMP_POOLS.filter((p2) => p2[3] > 0.6), new THREE.Color(2.4, 2.15, 1.5));
    // soft light cones from each floodlight down onto its campus
    const bm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.9, 0.65), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false });
    const cone = new THREE.ConeGeometry(1, 1, 20, 1, true).translate(0, -0.5, 0); // apex at origin, opening downward along -y
    const bim = new THREE.InstancedMesh(cone, bm, Math.max(1, LAMP_BEAMS.length)), Q = new THREE.Quaternion(), V = new THREE.Vector3(), DN = new THREE.Vector3(0, -1, 0);
    LAMP_BEAMS.forEach(([hx, hy, hz, tx, ty, tz, r], i) => { V.set(tx - hx, ty - hy, tz - hz); const L = V.length(); Q.setFromUnitVectors(DN, V.normalize()); M.compose(new THREE.Vector3(hx, hy, hz), Q, new THREE.Vector3(r * 0.55, L, r * 0.55)); bim.setMatrixAt(i, M); });
    bim.count = LAMP_BEAMS.length; bim.frustumCulled = false; bim.renderOrder = 3; scene.add(bim); PEOPLE.lampBeams = bm;
  }

  /* beach promenade strollers: walk the boardwalk of each continuous beach stretch */
  for (const [city, seg] of WORLD.shore || []) {
    if (!LIVE_CITIES.has(city)) continue;
    let run = [];
    const flush = () => {
      if (run.length >= 4) { const rt = routeOf(run), n = Math.max(1, Math.round(rt.total / 1.4)); for (let k = 0; k < n; k++) add({ kind: "ambient", rt, s: R1() * rt.total, dir: R1() < 0.5 ? 1 : -1, speed: 0.08 + R1() * 0.08, wait: R1() * 4, side: (R1() - 0.5) * 0.24 }); }
      run = [];
    };
    for (const sg of seg) { if (sg.type !== "beach") { flush(); continue; } const nx = (sg.na[0] + sg.nb[0]) / 2, nz = (sg.na[1] + sg.nb[1]) / 2; run.push(new THREE.Vector3(sg.a[0] + nx * 0.28, TOP - 0.03, sg.a[1] + nz * 0.28)); }
    flush();
  }

  /* cars: each built block has a couple of cars looping its ring road */
  const CARS = [];
  for (const isl of islands.filter((i) => i.live)) {
    const pts = WORLD.ringPts.get(isl.id).map(([x, z]) => new THREE.Vector3(isl.c.x + x, TOP, isl.c.z + z)); pts.push(pts[0].clone());
    const rt = routeOf(pts);
    for (let k = 0; k < 2; k++) CARS.push({ rt, s: (k / 2) * rt.total + R1(), speed: 0.35 + R1() * 0.2, col: pick(R1, ["#e0453c", "#2f6fd6", "#f8f6f1", "#28c8c8", "#f0c64a", "#f8f6f1"]), bus: R1() < 0.15, isl });
  }
  for (const hw of WORLD.highways || []) {
    const pts = hw.closed ? [...hw.pts, hw.pts[0]] : [...hw.pts, ...hw.pts.slice(0, -1).reverse()], rt = routeOf(pts), NC = hw.closed ? 28 : 16;
    for (let k = 0; k < NC; k++) CARS.push({ rt, s: (k / NC) * rt.total, speed: (k % 2 ? 0.9 : -0.9) * (0.9 + R1() * 0.3), col: pick(R1, ["#e0453c", "#2f6fd6", "#f8f6f1", "#28c8c8", "#f0c64a"]), bus: R1() < 0.12, isl: { lift: 0 }, hw: true });
  }
  const carB = new THREE.InstancedMesh(GEO.rbox, new THREE.MeshStandardMaterial({ roughness: 0.55 }), Math.max(1, CARS.length));
  const carG = new THREE.InstancedMesh(GEO.rbox, new THREE.MeshStandardMaterial({ roughness: 0.3, color: 0xbfe3f5, emissive: 0xffd08a, emissiveIntensity: 0 }), Math.max(1, CARS.length));
  carB.castShadow = true; carB.frustumCulled = carG.frustumCulled = false; scene.add(carB, carG); PEOPLE.carGlass = carG.material;
  CARS.forEach((c, k) => carB.setColorAt(k, col(c.bus ? "#2bb3a6" : c.col)));
  const cm = new THREE.Matrix4(), cq = new THREE.Quaternion(), cv = new THREE.Vector3(), cs = new THREE.Vector3(), ce = new THREE.Euler(), CP = new THREE.Vector3(), CD = new THREE.Vector3();
  const carAt = (rt, s) => { s = ((s % rt.total) + rt.total) % rt.total; let k = 1; while (k < rt.cum.length - 1 && rt.cum[k] < s) k++; const a = rt.pts[k - 1], b = rt.pts[k], t = (s - rt.cum[k - 1]) / Math.max(1e-6, rt.cum[k] - rt.cum[k - 1]); CP.lerpVectors(a, b, t); CD.subVectors(b, a).normalize(); };
  PEOPLE.updateCars = (dt, moving) => {
    CARS.forEach((c, k) => {
      if (moving) c.s += c.speed * dt;
      carAt(c.rt, c.s); const dirS = c.speed < 0 ? -1 : 1; if (dirS < 0) CD.negate(); const lane = c.hw ? 0.11 : 0.07, x = CP.x - CD.z * lane, z = CP.z + CD.x * lane, y = (c.hw ? CP.y - TOP : 0) + TOP - 0.03 + c.isl.lift, yaw = Math.atan2(CD.x, CD.z), L = c.bus ? 0.36 : 0.22;
      cm.compose(cv.set(x, y + 0.05, z), cq.setFromEuler(ce.set(0, yaw, 0)), cs.set(0.11, 0.07, L)); carB.setMatrixAt(k, cm);
      cm.compose(cv.set(x, y + 0.1, z), cq, cs.set(0.1, 0.05, c.bus ? L * 0.9 : 0.12)); carG.setMatrixAt(k, cm);
    });
    carB.instanceMatrix.needsUpdate = carG.instanceMatrix.needsUpdate = true;
  };

  /* ships: a container ship docked at the port, others sailing lanes between the islands.
     Toy-town scale (not true to life, by request): big ships read clearly even from the panorama. */
  PEOPLE.ships = [];
  const SHIP_SCL = { frigate: 1.5, destroyer: 1.5, coastguard: 1.3, container: 1.9, bulk: 1.8, tanker: 1.8, ferry: 1.6, fishing: 1.15, tug: 1.25, yacht: 1.15 };
  if (typeof SHIPS !== "undefined") {
    const seaOK = (x, z) => [...WORLD.cities.values()].every((ci) => !GEOM.pip(x, z, ci.seaGuard || (ci.seaGuard = GEOM.offsetRound(GEOM.hull(ci.coast), ci.live ? 4.6 : 2.4, 3))));
    const bridgeClear = (x, z, m) => (WORLD.bridges || []).every((B) => GEOM.segDist(x, z, B.a, B.b) > m);
    const TALL = new Set(["frigate", "destroyer", "container", "bulk", "tanker", "ferry"]); // too tall at this scale to pass under a bridge deck
    if (WORLD.port) { const g = SHIPS.make("container", rng(5)); g.position.set(WORLD.port.x, WATER_Y - 0.06, WORLD.port.z); g.rotation.y = Math.PI / 2; g.scale.setScalar(1.3); scene.add(g); }
    const MIXS = ["frigate", "container", "fishing", "ferry", "coastguard", "tanker", "yacht", "fishing", "bulk", "tug", "destroyer", "yacht", "container", "fishing", "yacht", "tanker", "coastguard", "fishing", "bulk", "yacht", "container", "tug", "frigate", "bulk", "yacht", "container", "coastguard", "tanker", "fishing", "destroyer"];
    const WANT = QUALITY === "high" ? MIXS.length : 20;
    const bx = bounds.clone().expandByScalar(18), Rs = rng(19);
    for (let tries = 0; tries < 900 && PEOPLE.ships.length < WANT; tries++) {
      const type = MIXS[PEOPLE.ships.length % MIXS.length], m = TALL.has(type) ? 3.6 : 1.4;
      const x = bx.min.x + Rs() * (bx.max.x - bx.min.x), z = bx.min.z + Rs() * (bx.max.z - bx.min.z), h = Rs() * Math.PI * 2, len = 8 + Rs() * 14, ex = x + Math.cos(h) * len, ez = z + Math.sin(h) * len;
      let ok = true; for (let s = 0; s <= 1.001 && ok; s += 0.1) { const qx = x + (ex - x) * s, qz = z + (ez - z) * s; ok = seaOK(qx, qz) && bridgeClear(qx, qz, m); } if (!ok) continue;
      const g = SHIPS.make(type, rng(tries)); g.scale.setScalar(SHIP_SCL[type] || 1); scene.add(g);
      PEOPLE.ships.push({ g, ax: x, az: z, bx: ex, bz: ez, t: Rs(), dir: 1, yaw: Math.atan2(ex - x, ez - z), speed: 0.35 / len, bob: Rs() * 6 });
    }
    // fishing fleets working each island's near waters — Keelung, the fishing harbour, gets the biggest one
    for (const c of A.cities) {
      if (!LIVE_CITIES.has(c.city)) continue;
      const info = WORLD.cities.get(c.city), [fcx, fcz] = GEOM.centroid(info.coast), Rf = rng(hash(c.city) + 23);
      const want = c.city === "keelung" ? (QUALITY === "high" ? 7 : 5) : (QUALITY === "high" ? 4 : 2);
      for (let k = 0, tries = 0; k < want && tries < 260; tries++) {
        const aa = Rf() * Math.PI * 2; let rr = 2;
        while (rr < 70 && (GEOM.pip(fcx + Math.cos(aa) * rr, fcz + Math.sin(aa) * rr, info.coast) || GEOM.nearestEdge(fcx + Math.cos(aa) * rr, fcz + Math.sin(aa) * rr, info.coast).d < 5.0)) rr += 0.4;
        const x = fcx + Math.cos(aa) * (rr + Rf() * 1.6), z = fcz + Math.sin(aa) * (rr + Rf() * 1.6);
        const h = Rf() * Math.PI * 2, len = 2.5 + Rf() * 3, ex = x + Math.cos(h) * len, ez = z + Math.sin(h) * len;
        let ok = true; for (let s = 0; s <= 1.001 && ok; s += 0.2) { const qx = x + (ex - x) * s, qz = z + (ez - z) * s; ok = seaOK(qx, qz) && bridgeClear(qx, qz, 1.4); } if (!ok) continue;
        const g = SHIPS.make("fishing", rng(900 + hash(c.city) + tries)); g.scale.setScalar(1.1 + Rf() * 0.2); scene.add(g);
        PEOPLE.ships.push({ g, ax: x, az: z, bx: ex, bz: ez, t: Rf(), dir: 1, yaw: Math.atan2(ex - x, ez - z), speed: 0.3 / len, bob: Rf() * 6 });
        k++;
      }
    }
  }
  // scheduled ferries between the islands: they shuttle harbour to harbour and wait a moment at each end
  if (typeof SHIPS !== "undefined") (WORLD.ferryRoutes || []).forEach((r, i) => {
    const len = Math.hypot(r.bx - r.ax, r.bz - r.az); if (len < 2) return;
    // a route that passes under another bridge keeps a small, low ferry so nothing clips the deck
    let under = false; for (let s = 0; s <= 1.001 && !under; s += 0.05) under = (WORLD.bridges || []).some((B) => GEOM.segDist(r.ax + (r.bx - r.ax) * s, r.az + (r.bz - r.az) * s, B.a, B.b) < 1.4);
    for (const ph of [0, 0.5]) { const type = under ? "ferry" : ph ? "ferry" : (i % 3 === 2 ? "container" : "ferry"), g = SHIPS.make(type, rng(300 + i * 7 + ph * 3)); g.scale.setScalar(under ? 0.8 : Math.min(SHIP_SCL[type], len * (type === "container" ? 0.11 : 0.22))); scene.add(g);
      PEOPLE.ships.push({ g, ax: r.ax, az: r.az, bx: r.bx, bz: r.bz, t: ph, dir: ph ? -1 : 1, yaw: Math.atan2(r.bx - r.ax, r.bz - r.az), speed: 0.6 / len, bob: i + ph * 3, dwell: 2.5, wait: 0 }); }
  });
  /* airliners: one circles the archipelago, two shuttle 桃園機場 ↔ 松山機場 with a climb-and-descend profile */
  PEOPLE.planes = [];
  if (typeof SHIPS !== "undefined" && WORLD.geo) {
    const blinkR = new THREE.MeshBasicMaterial({ color: 0xff5a5a, toneMapped: false, fog: false });
    const blinkW = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false });
    const mk = () => {
      const g = SHIPS.make("plane", rng(71)); g.scale.setScalar(1.7); scene.add(g);
      const l1 = new THREE.Mesh(GEO.sphere, blinkR), l2 = new THREE.Mesh(GEO.sphere, blinkW);
      l1.scale.setScalar(0.09); l2.scale.setScalar(0.07); l1.position.set(0, 0.78, -1.28); l2.position.set(0, -0.22, 0.5);
      l1.visible = l2.visible = false; g.add(l1, l2); return { g, l1, l2 };
    };
    const TA = WORLD.geo("taoyuan", 121.233, 25.0797), SS = WORLD.geo("taipei", 121.5525, 25.0694); // 桃園國際機場 / 松山機場
    const RAD = Math.max(bounds.max.x - bounds.min.x, bounds.max.z - bounds.min.z) * 0.42;
    PEOPLE.planes.push({ ...mk(), kind: "orbit", r: RAD, h: 12, w: 0.055, a: rng(3)() * 6 });
    PEOPLE.planes.push({ ...mk(), kind: "shuttle", ax: TA[0], az: TA[1], bx: SS[0], bz: SS[1], t: 0.2, dir: 1, speed: 0.045, hi: 10.5 });  // cruise stays above 台北 101
    PEOPLE.planes.push({ ...mk(), kind: "shuttle", ax: TA[0], az: TA[1], bx: SS[0], bz: SS[1], t: 0.72, dir: -1, speed: 0.045, hi: 10.5 });
  }
  PEOPLE.updatePlanes = (dt, time, moving) => {
    const night = (ENV.lampsOn || 0) > 0.05, on1 = time % 1 < 0.16, on2 = (time + 0.5) % 1 < 0.16;
    for (const pl of PEOPLE.planes) {
      pl.l1.visible = night && on1; pl.l2.visible = night && on2; // blinking navigation lights after dark
      if (pl.kind === "orbit") {
        if (moving) pl.a += pl.w * dt;
        pl.g.position.set(MID.x + Math.cos(pl.a) * pl.r, TOP + pl.h, MID.z + Math.sin(pl.a) * pl.r * 0.82);
        pl.g.rotation.set(0, Math.atan2(-Math.sin(pl.a), Math.cos(pl.a) * 0.82), 0.12);
      } else {
        if (moving) { pl.t += pl.dir * pl.speed * dt; if (pl.t > 1) { pl.t = 1; pl.dir = -1; } if (pl.t < 0) { pl.t = 0; pl.dir = 1; } }
        const x = pl.ax + (pl.bx - pl.ax) * pl.t, z = pl.az + (pl.bz - pl.az) * pl.t;
        const y = TOP + 2.6 + Math.sin(Math.PI * pl.t) * pl.hi, slope = Math.PI * Math.cos(Math.PI * pl.t) * pl.hi;
        const hLen = Math.hypot(pl.bx - pl.ax, pl.bz - pl.az);
        pl.g.position.set(x, y, z);
        pl.g.rotation.set(-Math.atan2(slope * pl.dir, hLen) * 0.6, Math.atan2((pl.bx - pl.ax) * pl.dir, (pl.bz - pl.az) * pl.dir), 0);
      }
    }
  };
  PEOPLE.updateShips = (dt, time, moving) => {
    for (const s of PEOPLE.ships) {
      if (moving) { if (s.wait > 0) s.wait -= dt; else { s.t += s.dir * s.speed * dt; if (s.t > 1) { s.t = 1; s.dir = -1; s.wait = s.dwell || 0; } if (s.t < 0) { s.t = 0; s.dir = 1; s.wait = s.dwell || 0; } } }
      const target = Math.atan2((s.bx - s.ax) * s.dir, (s.bz - s.az) * s.dir); let d = target - s.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); s.yaw += d * Math.min(1, dt * 0.7);
      s.g.position.set(s.ax + (s.bx - s.ax) * s.t, WATER_Y - 0.06 + Math.sin(time * 1.2 + s.bob) * 0.02, s.az + (s.bz - s.az) * s.t); s.g.rotation.set(Math.sin(time * 0.9 + s.bob) * 0.02, s.yaw, 0);
    }
  };

  /* instanced body parts */
  const N = PEOPLE.list.length;
  const mk = (g, n, mat) => { const m = new THREE.InstancedMesh(g, mat, n); m.castShadow = true; m.frustumCulled = false; scene.add(m); return m; };
  const pm = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const legG = new THREE.BoxGeometry(0.045, 0.1, 0.055).translate(0, -0.05, 0);
  const armG = new THREE.BoxGeometry(0.036, 0.115, 0.04).translate(0, -0.0575, 0);
  const bodyG = new RoundedBoxGeometry(0.125, 0.145, 0.085, 2, 0.022);
  const legs = mk(legG, N * 2, pm), arms = mk(armG, N * 2, pm), bodies = mk(bodyG, N, pm), heads = mk(GEO.sphere, N, pm), hairs = mk(GEO.dome, N, pm);
  PEOPLE.list.forEach((o, i) => {
    legs.setColorAt(i * 2, o.pants); legs.setColorAt(i * 2 + 1, o.pants); arms.setColorAt(i * 2, o.shirt); arms.setColorAt(i * 2 + 1, o.shirt);
    bodies.setColorAt(i, o.shirt); heads.setColorAt(i, o.skin); hairs.setColorAt(i, o.hair);
  });
  /* Accessories share geometry/material batches across every citizen. Local +z is the face. */
  const accessoryParts = [];
  const accessory = (owner, g, xyz, scale, color, rotation = [0, 0, 0]) => {
    const matrix = new THREE.Matrix4().compose(new THREE.Vector3(...xyz), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(...scale));
    accessoryParts.push({ owner, g, matrix, color });
  };
  PEOPLE.list.forEach((o, i) => {
    const a = (g, xyz, scale, color, rotation) => accessory(i, g, xyz, scale, color, rotation);
    // Tiny eyes and shoes give each silhouette a face and a grounded, rounded stance.
    for (const side of [-1, 1]) {
      a("sphere", [side * 0.026, 0.27, 0.074], [0.012, 0.016, 0.008], "#333237");
      a("rbox", [side * 0.03, -0.09, 0.016], [0.055, 0.032, 0.085], "#4c4b49");
    }
    if (o.role === "commuter") {
      a("box", [0, 0.13, 0.047], [0.018, 0.1, 0.012], "#5a6067"); // tie
      a("cyl", [0.115, 0.12, 0.075], [0.045, 0.07, 0.045], "#e2d4bd"); // coffee
      a("cyl", [0.115, 0.158, 0.075], [0.049, 0.012, 0.049], "#f0e9db");
      a("rbox", [-0.11, 0.015, 0], [0.055, 0.095, 0.09], "#6d625b"); // briefcase
    } else if (o.role === "student") {
      a("dome", [0, 0.32, 0], [0.18, 0.1, 0.18], "#d8bd67");
      a("cyl", [0, 0.32, 0.015], [0.21, 0.014, 0.2], "#d8bd67"); // school hat brim
      a("rbox", [0, 0.13, -0.07], [0.115, 0.13, 0.06], "#a18070");
    } else if (o.role === "elder") {
      a("cyl", [0.11, 0.015, 0.075], [0.018, 0.22, 0.018], "#89745f"); // cane
      a("torus", [0.1, 0.128, 0.075], [0.035, 0.035, 0.018], "#89745f");
      for (const side of [-1, 1]) a("torus", [side * 0.03, 0.27, 0.08], [0.045, 0.04, 0.012], "#77777b");
      o.hair = col("#bdb7ad"); hairs.setColorAt(i, o.hair);
    } else if (o.role === "parent") {
      a("rbox", [0, 0.015, 0.25], [0.2, 0.105, 0.24], "#a6afa5"); // pram
      a("dome", [0, 0.095, 0.21], [0.21, 0.15, 0.19], "#bba6a1");
      a("box", [0, 0.1, 0.12], [0.18, 0.018, 0.025], "#62666a");
      for (const side of [-1, 1]) for (const z of [0.17, 0.33]) a("cyl", [side * 0.105, -0.055, z], [0.06, 0.025, 0.06], "#54575a", [0, 0, Math.PI / 2]);
    } else if (o.role === "worker") {
      a("dome", [0, 0.32, 0], [0.18, 0.12, 0.18], "#d9c18a");
      a("cyl", [0, 0.32, 0.01], [0.2, 0.018, 0.2], "#d9c18a");
      a("box", [0, 0.13, 0.05], [0.105, 0.12, 0.014], "#c4aa7e"); // vest, reflective stripes
      for (const x of [-0.035, 0.035]) a("box", [x, 0.13, 0.06], [0.012, 0.12, 0.008], "#e8e3cb");
    } else if (o.role === "hiker") {
      a("rbox", [0, 0.14, -0.085], [0.14, 0.18, 0.1], "#89977b");
      a("box", [0, 0.18, -0.145], [0.12, 0.03, 0.02], "#c2b294");
      a("cyl", [0.12, 0.04, 0.07], [0.013, 0.27, 0.013], "#777b78");
      a("cyl", [0, 0.33, 0], [0.22, 0.025, 0.22], "#c2b294");
    } else if (o.role === "umbrella") {
      a("cyl", [0.11, 0.26, 0.03], [0.012, 0.37, 0.012], "#6f7276");
      a("dome", [0.08, 0.44, 0.02], [0.4, 0.16, 0.4], "#8d9ba9");
      a("sphere", [0.08, 0.525, 0.02], [0.022, 0.025, 0.022], "#6f7276");
    } else if (o.role === "balloon") {
      a("cyl", [0.11, 0.34, 0.02], [0.006, 0.42, 0.006], "#c4bba8");
      a("sphere", [0.11, 0.61, 0.02], [0.16, 0.2, 0.16], "#c2a0ac");
    } else if (o.role === "runner") {
      a("box", [0, 0.285, 0.065], [0.13, 0.025, 0.025], "#c1b7a5"); // sweatband
      a("cyl", [0.11, 0.05, 0.04], [0.035, 0.08, 0.035], "#9bb3b2");
    } else if (o.role === "shopper") {
      for (const side of [-1, 1]) {
        a("rbox", [side * 0.12, 0.015, 0.01], [0.075, 0.12, 0.065], side > 0 ? "#c1af92" : "#a5afa1");
        a("torus", [side * 0.12, 0.09, 0.01], [0.04, 0.04, 0.012], "#8c826f");
      }
    }
  });
  const accessoryBatches = new Map();
  for (const item of accessoryParts) {
    if (!accessoryBatches.has(item.g)) accessoryBatches.set(item.g, []);
    accessoryBatches.get(item.g).push(item);
  }
  PEOPLE.accessories = [];
  for (const [geo, items] of accessoryBatches) {
    const mesh = mk(GEO[geo], items.length, pm);
    items.forEach((item, i) => mesh.setColorAt(i, col(item.color)));
    PEOPLE.accessories.push({ mesh, items });
  }
  const citizenMatrices = Array.from({ length: N }, () => new THREE.Matrix4());

  /* carry badges over flow walkers */
  const badgeTex = new Map();
  const badgeFor = (txt) => {
    if (badgeTex.has(txt)) return badgeTex.get(txt);
    const c = document.createElement("canvas"); c.width = 128; c.height = 64; const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.strokeStyle = css("--route") || "#c4462b"; g.lineWidth = 6; g.beginPath(); g.roundRect(4, 4, 120, 56, 26); g.fill(); g.stroke();
    g.fillStyle = "#1a2531"; g.font = "700 28px 'Noto Sans TC',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(txt || "").slice(0, 3), 64, 34);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.SpriteMaterial({ map: t, depthWrite: false }); badgeTex.set(txt, m); return m;
  };
  for (const o of PEOPLE.list) if (o.kind === "flow") { o.badge = new THREE.Sprite(badgeFor(o.carry)); o.badge.scale.set(0.34, 0.17, 1); o.badge.renderOrder = 5; scene.add(o.badge); }

  const P = new THREE.Vector3(), Dv = new THREE.Vector3(), base = new THREE.Matrix4(), loc = new THREE.Matrix4(), out = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
  const sample = (rt, s) => {
    let k = 1; while (k < rt.cum.length - 1 && rt.cum[k] < s) k++;
    const a = rt.pts[k - 1], b = rt.pts[k], t = (s - rt.cum[k - 1]) / Math.max(1e-6, rt.cum[k] - rt.cum[k - 1]);
    P.lerpVectors(a, b, THREE.MathUtils.clamp(t, 0, 1)); Dv.subVectors(b, a).normalize(); return P;
  };
  const citizenPos = new THREE.Vector3(), localPos = new THREE.Vector3(), localScale = new THREE.Vector3(), sideVector = new THREE.Vector3();
  PEOPLE.meshes = [legs, arms, bodies, heads, hairs, ...PEOPLE.accessories.map(a => a.mesh)];
  PEOPLE.filter = null;   // Set of flow ids to show, or null for all
  PEOPLE.update = (dt, time, moving) => {
    const detailed = camera.position.distanceTo(controls.target) < (QUALITY === "high" ? 24 : 18);
    PEOPLE.detailVisible = detailed;
    arms.visible = hairs.visible = detailed;
    for (const batch of PEOPLE.accessories) batch.mesh.visible = detailed;
    PEOPLE.list.forEach((o, i) => {
      if (moving) {
        if (o.wait > 0) o.wait -= dt;
        else { o.s += o.dir * o.speed * dt; if (o.s > o.rt.total) { o.s = o.rt.total; o.dir = -1; o.wait = 1.4; } else if (o.s < 0) { o.s = 0; o.dir = 1; o.wait = 1.4; } }
      }
      const pos = sample(o.rt, o.s);
      const isl = o.kind === "ambient" ? islandById.get(o.isl) : null;
      const lift = isl ? isl.lift : 0;
      const dir = Dv.multiplyScalar(o.dir);
      const side = sideVector.set(-dir.z, 0, dir.x).multiplyScalar(o.side);
      const visible = o.kind === "ambient" || !PEOPLE.filter || PEOPLE.filter.has(o.flow);
      const sc = visible ? 0.95 * o.size : 0.0001;
      const yaw = Math.atan2(dir.x, dir.z);
      base.compose(citizenPos.set(pos.x + side.x, pos.y + lift + 0.105 * sc, pos.z + side.z), q.setFromEuler(e.set(0, yaw, 0)), localScale.set(sc, sc, sc));
      citizenMatrices[i].copy(base);
      const walking = moving && o.wait <= 0;
      const ph = time * 9 + o.ph, sw = walking ? Math.sin(ph) * 0.55 : 0, bob = walking ? Math.abs(Math.sin(ph)) * 0.01 : 0;
      for (let k = 0; k < 2; k++) {
        const sgn = k === 0 ? 1 : -1;
        loc.compose(localPos.set(sgn * 0.03, 0, 0), q.setFromEuler(e.set(sgn * sw, 0, 0)), one); legs.setMatrixAt(i * 2 + k, out.multiplyMatrices(base, loc));
        loc.compose(localPos.set(sgn * 0.082, 0.14 + bob, 0), q.setFromEuler(e.set(-sgn * sw * 0.8, 0, sgn * 0.08)), one); arms.setMatrixAt(i * 2 + k, out.multiplyMatrices(base, loc));
      }
      loc.compose(localPos.set(0, 0.085 + bob, 0), q.identity(), one); bodies.setMatrixAt(i, out.multiplyMatrices(base, loc));
      loc.compose(localPos.set(0, 0.265 + bob, 0), q.identity(), localScale.set(0.16, 0.16, 0.16)); heads.setMatrixAt(i, out.multiplyMatrices(base, loc));
      loc.compose(localPos.set(0, 0.29 + bob, -0.008), q.identity(), localScale.set(0.168, 0.115, 0.168)); hairs.setMatrixAt(i, out.multiplyMatrices(base, loc));
      if (o.badge) { o.badge.visible = visible && PEOPLE.badges; o.badge.position.set(pos.x + side.x, pos.y + 0.38, pos.z + side.z); }
    });
    if (detailed) for (const { mesh, items } of PEOPLE.accessories) {
      items.forEach((item, i) => mesh.setMatrixAt(i, out.multiplyMatrices(citizenMatrices[item.owner], item.matrix)));
      mesh.instanceMatrix.needsUpdate = true;
    }
    for (const m of [legs, arms, bodies, heads, hairs]) m.instanceMatrix.needsUpdate = true;
    if (PEOPLE.lampPools) { const on = ENV.lampsOn || 0; PEOPLE.lampPools.opacity = on * 0.55; PEOPLE.lampPools.visible = on > 0.01; PEOPLE.campusPools.opacity = on; PEOPLE.campusPools.visible = on > 0.01; PEOPLE.lampBeams.opacity = on * 0.16; PEOPLE.lampBeams.visible = on > 0.01; } PEOPLE.updateCars(dt, moving); PEOPLE.updateShips(dt, time, moving); PEOPLE.updatePlanes(dt, time, moving); if (typeof COASTER !== "undefined") COASTER.update(dt, moving);
  };
  PEOPLE.badges = false;
}
