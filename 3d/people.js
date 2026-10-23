/* ===== citizens: flow carriers walk the bridge network between cities; residents stroll island rings ===== */
const PEOPLE = { list: [], routes: [] };
{
  const R1 = rng(41);
  /* --- chibi character kit (heart-island style): big round heads, soft low-saturation wardrobe, roles told by silhouette + props --- */
  const SKIN = ["#f6d7b8", "#eec49e", "#dcae82", "#c69468"];
  const HAIRC = ["#33291f", "#201f23", "#4a3a2e", "#6b5444", "#8a6a4a", "#58514b"];
  const GREYH = ["#c6c9cd", "#e2e4e6", "#979da3"];
  const CASUAL = ["#8ea6c0", "#a3b78f", "#c48d7e", "#d9c38c", "#9c8fb5", "#7f9e99", "#d8d2c6", "#b5c4b1", "#6f7f93", "#d3a788", "#c2b4a3", "#a8bfc9"];
  const PANTSC = ["#3b4148", "#5a6b7d", "#7a6f63", "#44525f", "#8b8378", "#4a4e57"];
  const SUITC = ["#46525e", "#3a4652", "#5b5e66", "#6b6257"];
  const prop = (o, g, c, p, s, r) => o.props.push({ g, c, p, s, r });
  /* hairstyles: short / bob / bun / ponytail / curly — hat-wearing roles pass plain=true to stay under the brim */
  const hairOf = (o, R, colr, plain) => {
    const c = colr || pick(R, HAIRC), st = plain ? R() * 0.64 : R();
    o.topC = c; o.topT = [[0, 0.19, -0.004], [0.138, 0.075, 0.138]]; // short crop by default
    if (st >= 0.42 && st < 0.64) o.topT = [[0, 0.172, -0.01], [0.15, 0.115, 0.148]]; // bob
    else if (st >= 0.64 && st < 0.8) prop(o, "sph", c, [0, 0.265, -0.025], [0.052, 0.046, 0.052]); // bun
    else if (st >= 0.8 && st < 0.92) prop(o, "sph", c, [0, 0.16, -0.08], [0.046, 0.1, 0.05]); // ponytail
    else if (st >= 0.92) o.topT = [[0, 0.185, 0], [0.158, 0.1, 0.158]]; // curly puff
  };
  const DRESS = {
    office(o, R) { /* 上班族：西裝色＋公事包（少數改拿咖啡） */
      o.shirt = pick(R, SUITC); o.pants = pick(R, ["#3b4148", "#44525f", "#4a4e57"]); hairOf(o, R);
      if (R() < 0.7) prop(o, "rbox", "#4a4038", [0.104, -0.002, 0.015], [0.026, 0.068, 0.098]);
      else prop(o, "cyl", "#f4efe6", [0.1, 0.05, 0.05], [0.032, 0.042, 0.032]);
    },
    commuter(o, R) { /* 通勤族：便服＋側背包，半數拿咖啡 */
      o.shirt = pick(R, CASUAL); o.pants = pick(R, PANTSC); hairOf(o, R);
      prop(o, "rbox", "#5a5248", [0.086, 0.04, -0.012], [0.05, 0.068, 0.036]);
      if (R() < 0.5) prop(o, "cyl", "#f4efe6", [-0.1, 0.05, 0.05], [0.03, 0.042, 0.03]);
    },
    student(o, R) { /* 學童：小黃帽＋書包，個子小、步伐快 */
      o.sc = 0.56; o.speed *= 1.25; o.shirt = pick(R, ["#d8d2c6", "#8ea6c0", "#b5c4b1", "#a8bfc9"]); o.pants = pick(R, ["#44525f", "#5a6b7d"]); hairOf(o, R, null, true);
      prop(o, "dome", "#f2c84b", [0, 0.198, 0.004], [0.152, 0.082, 0.152]);
      prop(o, "cyl", "#f2c84b", [0, 0.21, 0.088], [0.12, 0.012, 0.1]);
      prop(o, "rbox", pick(R, ["#c4756b", "#6b86a8", "#c9a86b", "#8f6f8f"]), [0, 0.085, -0.078], [0.098, 0.112, 0.052]);
    },
    elder(o, R) { /* 長者：灰髮＋拐杖，微駝、走得慢 */
      o.sc = 0.74; o.speed = 0.05 + R() * 0.05; o.stoop = true;
      o.shirt = pick(R, ["#8b8378", "#7a6f63", "#9c8fb5", "#7f9e99", "#c2b4a3"]); o.pants = pick(R, ["#7a6f63", "#5a6b7d", "#8b8378"]); hairOf(o, R, pick(R, GREYH), true);
      prop(o, "cyl", "#7a5c42", [0.1, -0.015, 0.03], [0.012, 0.135, 0.012]);
    },
    parent(o, R) { /* 家長：推嬰兒車（車身＋頂篷＋滾輪＋把手） */
      o.speed = Math.min(o.speed, 0.12); o.shirt = pick(R, CASUAL); o.pants = pick(R, PANTSC); hairOf(o, R);
      prop(o, "rbox", pick(R, ["#9aa8b5", "#b59aa8", "#a8b59a"]), [0, 0.035, 0.165], [0.11, 0.062, 0.15]);
      prop(o, "dome", pick(R, ["#c9a8a8", "#a8bfc9", "#c2b4a3"]), [0, 0.068, 0.215], [0.115, 0.068, 0.1]);
      prop(o, "cyl", "#3b4148", [0, -0.063, 0.1], [0.036, 0.128, 0.036], [0, 0, 1.5708]);
      prop(o, "cyl", "#3b4148", [0, -0.063, 0.235], [0.036, 0.128, 0.036], [0, 0, 1.5708]);
      prop(o, "cyl", "#6a6f75", [0, 0.05, 0.085], [0.012, 0.13, 0.012], [0.5, 0, 0]);
    },
    worker(o, R) { /* 工地人員：工程帽（黃/白）＋工作服 */
      o.shirt = pick(R, ["#e0995c", "#d9c38c", "#8b8378"]); o.pants = pick(R, ["#4a4e57", "#44525f"]); hairOf(o, R, null, true);
      const hc = R() < 0.7 ? "#f0b03c" : "#e8e4da";
      prop(o, "dome", hc, [0, 0.196, 0], [0.165, 0.1, 0.165]);
      prop(o, "cyl", hc, [0, 0.198, 0], [0.195, 0.013, 0.195]);
    },
    hiker(o, R) { /* 登山客：大背包＋圓盤帽＋登山杖 */
      o.shirt = pick(R, ["#a3b78f", "#c48d7e", "#7f9e99", "#d3a788"]); o.pants = pick(R, ["#7a6f63", "#44525f"]); hairOf(o, R, null, true);
      prop(o, "rbox", pick(R, ["#7d8f6a", "#a8744f", "#8f6f8f"]), [0, 0.095, -0.088], [0.105, 0.155, 0.07]);
      prop(o, "dome", "#8a9471", [0, 0.2, 0], [0.148, 0.07, 0.148]);
      prop(o, "cyl", "#8a9471", [0, 0.202, 0], [0.2, 0.012, 0.2]);
      prop(o, "cyl", "#8a8f94", [0.1, -0.01, 0.04], [0.011, 0.165, 0.011], [0.12, 0, 0]);
    },
    umbrella(o, R) { /* 撐傘路人：陽傘是遠觀最醒目的柔色點 */
      o.shirt = pick(R, CASUAL); o.pants = pick(R, PANTSC); hairOf(o, R);
      prop(o, "cyl", "#6a6f75", [0.1, 0.17, 0.02], [0.013, 0.35, 0.013]);
      prop(o, "cone", pick(R, ["#c98a8a", "#8aa6c9", "#a6c98f", "#d9c38c"]), [0.1, 0.35, 0.02], [0.37, 0.1, 0.37]);
    },
    balloonkid(o, R) { /* 拿氣球的小孩 */
      o.sc = 0.54; o.speed *= 1.3; o.shirt = pick(R, ["#d3a788", "#a8bfc9", "#b5c4b1", "#d9c38c"]); o.pants = pick(R, ["#5a6b7d", "#8ea6c0"]); hairOf(o, R);
      prop(o, "cyl", "#d8d8d8", [0.115, 0.26, 0.015], [0.005, 0.27, 0.005]);
      prop(o, "sph", pick(R, ["#e88c7d", "#8fb8d8", "#f0c64a", "#9fc48f"]), [0.118, 0.44, 0.015], [0.095, 0.115, 0.095]);
    },
    tourist(o, R) { /* 旅客：遮陽帽＋拖行李箱 */
      o.shirt = pick(R, ["#d3a788", "#7f9e99", "#c48d7e", "#a8bfc9", "#d9c38c"]); o.pants = pick(R, ["#d8d2c6", "#5a6b7d", "#8b8378"]); hairOf(o, R, null, true);
      prop(o, "dome", "#e8dcc0", [0, 0.202, 0], [0.148, 0.068, 0.148]);
      prop(o, "cyl", "#e8dcc0", [0, 0.205, 0], [0.235, 0.011, 0.235]);
      prop(o, "rbox", pick(R, ["#7d99b5", "#b57d7d", "#c9b27d"]), [-0.105, -0.02, -0.055], [0.055, 0.118, 0.085]);
      prop(o, "cyl", "#3f444b", [-0.105, 0.065, -0.055], [0.009, 0.08, 0.009]);
    },
    farmer(o, R) { /* 小農：斗笠＋提籃 */
      o.shirt = pick(R, ["#a3b78f", "#c2b4a3", "#8b8378"]); o.pants = pick(R, ["#7a6f63", "#44525f"]); hairOf(o, R, null, true);
      prop(o, "cone", "#d9c08a", [0, 0.23, 0], [0.27, 0.095, 0.27]);
      prop(o, "rbox", "#c9a86b", [0.104, 0.012, 0.025], [0.066, 0.05, 0.066]);
    },
  };
  /* who walks where: role mixes keyed off the policy theme of the island the walker lives on */
  const POOLS = [
    [/教育|午餐|學|閱讀/, ["student", "student", "student", "student", "parent", "balloonkid", "commuter"]],
    [/托育|育兒|親子|好孕|家庭|婦幼|生養/, ["parent", "parent", "balloonkid", "student", "commuter", "umbrella"]],
    [/銀髮|長照|長者|高齡|社福|健康|醫療|衛生/, ["elder", "elder", "elder", "umbrella", "parent", "commuter"]],
    [/工務|水利|居住|都更|住宅|建設|韌性/, ["worker", "worker", "worker", "commuter", "office", "umbrella"]],
    [/交通|軌道|捷運/, ["commuter", "commuter", "worker", "office", "student", "umbrella"]],
    [/產業|科技|AI|經濟|財政|市政|市府|治理/, ["office", "office", "commuter", "umbrella", "worker", "tourist"]],
    [/青年|運動|體育/, ["commuter", "student", "office", "balloonkid", "hiker", "umbrella"]],
    [/觀光|文化|藝文|港|海洋/, ["tourist", "tourist", "umbrella", "balloonkid", "farmer", "commuter"]],
    [/環保|公園|綠|山/, ["hiker", "hiker", "parent", "balloonkid", "elder", "umbrella"]],
    [/農|客家|原住民/, ["farmer", "farmer", "hiker", "elder", "commuter"]],
    [/治安|消防|防災/, ["worker", "office", "commuter", "elder", "umbrella"]],
  ];
  const MIX = ["commuter", "office", "umbrella", "elder", "parent", "student", "tourist", "commuter", "balloonkid", "hiker", "worker", "farmer"];
  const BEACH = ["tourist", "tourist", "balloonkid", "umbrella", "parent", "hiker", "commuter", "tourist"];
  const poolFor = (name) => { for (const [re, p] of POOLS) if (re.test(name)) return p; return MIX; };
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
    o.skin = col(pick(R1, SKIN)); o.sc = 0.8; o.props = [];
    if (o.kind === "flow") { hairOf(o, R1); o.pants = "#3b4148"; } // flow walkers keep the city-colour shirt they were given (route identification only)
    else (DRESS[o.role] || DRESS.commuter)(o, R1);
    o.shirt = col(o.shirt); o.pants = col(o.pants); o.topC = col(o.topC); o.ph = R1() * 6;
    PEOPLE.list.push(o);
  };
  const perRoute = QUALITY === "high" ? 3 : 2;
  PEOPLE.routes.forEach((rt, ri) => {
    for (let k = 0; k < perRoute; k++) add({ kind: "flow", flow: rt.f.id, rt: rt.route, s: (k / perRoute) * rt.route.total, dir: k % 2 ? -1 : 1, speed: 0.32 + R1() * 0.1, wait: 0, side: (k % 2 ? 1 : -1) * 0.06, carry: rt.f.carry, shirt: cityHex(rt.from) });
  });
  for (const isl of islands.filter((i) => i.live)) {
    const ids = WORLD.ringNode.get(isl.id), n = QUALITY === "high" ? 7 : 4, pool = poolFor(isl.t.name);
    for (let k = 0; k < n; k++) {
      const a = (R1() * ids.length) | 0, len = 3 + ((R1() * 3) | 0);
      const pts = []; for (let j = 0; j <= len; j++) pts.push(WORLD.graph.nodes[ids[(a + j) % ids.length]].p.clone());
      add({ kind: "ambient", isl: isl.id, rt: routeOf(pts), s: R1() * 2, dir: 1, speed: 0.12 + R1() * 0.08, wait: R1() * 3, side: (R1() < 0.5 ? 1 : -1) * 0.21, role: pick(R1, pool) });
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

  /* beach promenade strollers: walk the boardwalk of each continuous beach stretch — a seaside crowd (tourists, kids, parasols) */
  for (const [city, seg] of WORLD.shore || []) {
    if (!LIVE_CITIES.has(city)) continue;
    let run = [];
    const flush = () => {
      if (run.length >= 4) { const rt = routeOf(run), n = Math.max(1, Math.round(rt.total / 1.4)); for (let k = 0; k < n; k++) add({ kind: "ambient", rt, s: R1() * rt.total, dir: R1() < 0.5 ? 1 : -1, speed: 0.08 + R1() * 0.08, wait: R1() * 4, side: (R1() - 0.5) * 0.24, role: pick(R1, BEACH) }); }
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

  /* instanced body parts — chibi proportions (head ≈ 1 : body+legs ≈ 1.7); role props share five instanced pools */
  const N = PEOPLE.list.length;
  const mk = (g, n, mat) => { const m = new THREE.InstancedMesh(g, mat, n); m.castShadow = true; m.frustumCulled = false; scene.add(m); return m; };
  const pm = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  /* one shared comic face (dot eyes + smile + blush) drawn dark-on-white so the per-instance skin tint colours the rest of the head */
  const faceTex = (() => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 128);
    const ex = 64; // face centre sits at u = 0.25 — the +z side the walker faces
    g.fillStyle = "#2b2420";
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(ex + s * 13, 56, 4.5, 6.5, 0, 0, 7); g.fill(); }
    g.strokeStyle = "#2b2420"; g.lineWidth = 3.5; g.lineCap = "round"; g.beginPath(); g.arc(ex, 61, 7, 0.4, Math.PI - 0.4); g.stroke();
    g.fillStyle = "#ffd3c4"; for (const s of [-1, 1]) { g.beginPath(); g.arc(ex + s * 25, 66, 6, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const legG = new THREE.BoxGeometry(0.042, 0.085, 0.05).translate(0, -0.042, 0);
  const armG = new THREE.BoxGeometry(0.034, 0.095, 0.04).translate(0, -0.048, 0);
  const bodyG = new RoundedBoxGeometry(0.135, 0.135, 0.1, 2, 0.045);
  const legs = mk(legG, N * 2, pm), arms = mk(armG, N * 2, pm), bodies = mk(bodyG, N, pm);
  const heads = mk(GEO.sphere, N, new THREE.MeshStandardMaterial({ roughness: 0.8, map: faceTex })), tops = mk(GEO.dome, N, pm);
  const PROPG = { rbox: GEO.rbox, cyl: GEO.cyl, dome: GEO.dome, sph: GEO.sphere, cone: GEO.cone };
  const want = {}; for (const o of PEOPLE.list) for (const pr of o.props) want[pr.g] = (want[pr.g] || 0) + 1;
  const propIM = {}, nextI = {}; for (const k in want) { propIM[k] = mk(PROPG[k], want[k], pm); nextI[k] = 0; }
  const E2 = new THREE.Euler(), Q2 = new THREE.Quaternion(), mat4 = () => new THREE.Matrix4();
  PEOPLE.list.forEach((o, i) => {
    legs.setColorAt(i * 2, o.pants); legs.setColorAt(i * 2 + 1, o.pants); arms.setColorAt(i * 2, o.shirt); arms.setColorAt(i * 2 + 1, o.shirt);
    bodies.setColorAt(i, o.shirt); heads.setColorAt(i, o.skin); tops.setColorAt(i, o.topC);
    const st = o.stoop; // elders lean a little forward
    o.bodyLoc = mat4().compose(new THREE.Vector3(0, 0.065, st ? 0.014 : 0), Q2.setFromEuler(E2.set(st ? 0.18 : 0, 0, 0)), new THREE.Vector3(1, 1, 1));
    o.headLoc = mat4().compose(new THREE.Vector3(0, st ? 0.174 : 0.182, st ? 0.022 : 0.004), Q2.identity(), new THREE.Vector3(0.128, 0.122, 0.128));
    o.topLoc = mat4().compose(new THREE.Vector3(o.topT[0][0], o.topT[0][1] + (st ? -0.008 : 0), o.topT[0][2] + (st ? 0.018 : 0)), Q2.identity(), new THREE.Vector3(o.topT[1][0], o.topT[1][1], o.topT[1][2]));
    o.parts = o.props.map((pr) => {
      const k = nextI[pr.g]++; propIM[pr.g].setColorAt(k, col(pr.c));
      const r = pr.r || [0, 0, 0];
      return { im: propIM[pr.g], i: k, m: mat4().compose(new THREE.Vector3(pr.p[0], pr.p[1], pr.p[2]), Q2.setFromEuler(E2.set(r[0], r[1], r[2])), new THREE.Vector3(pr.s[0], pr.s[1], pr.s[2])) };
    });
  });
  PEOPLE.stats = { people: N, props: want };
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
  PEOPLE.filter = null;   // Set of flow ids to show, or null for all
  PEOPLE.update = (dt, time, moving) => {
    PEOPLE.list.forEach((o, i) => {
      if (moving) {
        if (o.wait > 0) o.wait -= dt;
        else { o.s += o.dir * o.speed * dt; if (o.s > o.rt.total) { o.s = o.rt.total; o.dir = -1; o.wait = 1.4; } else if (o.s < 0) { o.s = 0; o.dir = 1; o.wait = 1.4; } }
      }
      const pos = sample(o.rt, o.s);
      const isl = o.kind === "ambient" ? islandById.get(o.isl) : null;
      const lift = isl ? isl.lift : 0;
      const dir = Dv.clone().multiplyScalar(o.dir);
      const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(o.side);
      const visible = o.kind === "ambient" || !PEOPLE.filter || PEOPLE.filter.has(o.flow);
      const sc = visible ? o.sc : 0.0001;
      const yaw = Math.atan2(dir.x, dir.z);
      const walking = moving && o.wait <= 0;
      const ph = time * (o.sc < 0.7 ? 11 : 9) + o.ph, sw = walking ? Math.sin(ph) * 0.55 : 0, bob = walking ? Math.abs(Math.sin(ph)) * 0.014 : 0;
      base.compose(new THREE.Vector3(pos.x + side.x, pos.y + lift + (0.084 + bob) * sc, pos.z + side.z), q.setFromEuler(e.set(0, yaw, 0)), new THREE.Vector3(sc, sc, sc));
      for (const [k, sgn] of [[0, 1], [1, -1]]) {
        loc.compose(new THREE.Vector3(sgn * 0.028, 0, 0), q.setFromEuler(e.set(sgn * sw, 0, 0)), one); legs.setMatrixAt(i * 2 + k, out.multiplyMatrices(base, loc));
        loc.compose(new THREE.Vector3(sgn * 0.083, 0.122, 0), q.setFromEuler(e.set(-sgn * sw * 0.7, 0, sgn * 0.1)), one); arms.setMatrixAt(i * 2 + k, out.multiplyMatrices(base, loc));
      }
      bodies.setMatrixAt(i, out.multiplyMatrices(base, o.bodyLoc));
      heads.setMatrixAt(i, out.multiplyMatrices(base, o.headLoc));
      tops.setMatrixAt(i, out.multiplyMatrices(base, o.topLoc));
      for (const pt of o.parts) pt.im.setMatrixAt(pt.i, out.multiplyMatrices(base, pt.m));
      if (o.badge) { o.badge.visible = visible && PEOPLE.badges; o.badge.position.set(pos.x + side.x, pos.y + 0.38, pos.z + side.z); }
    });
    for (const m of [legs, arms, bodies, heads, tops]) m.instanceMatrix.needsUpdate = true;
    for (const k in propIM) propIM[k].instanceMatrix.needsUpdate = true;
    if (PEOPLE.lampPools) { const on = ENV.lampsOn || 0; PEOPLE.lampPools.opacity = on * 0.55; PEOPLE.lampPools.visible = on > 0.01; PEOPLE.campusPools.opacity = on; PEOPLE.campusPools.visible = on > 0.01; PEOPLE.lampBeams.opacity = on * 0.16; PEOPLE.lampBeams.visible = on > 0.01; } PEOPLE.updateCars(dt, moving); PEOPLE.updateShips(dt, time, moving); PEOPLE.updatePlanes(dt, time, moving); if (typeof COASTER !== "undefined") COASTER.update(dt, moving);
  };
  PEOPLE.badges = false;
}
