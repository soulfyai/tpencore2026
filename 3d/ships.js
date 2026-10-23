/* ===== ships: ROC Navy, coast guard, container ships, bulk carriers, tankers, ferries, fishing boats, tugs, yachts ===== */
const SHIPS = {};
{
  const flat = new Map();
  const ni = (g) => flat.get(g) || flat.set(g, GEO[g].index ? GEO[g].toNonIndexed() : GEO[g]).get(g);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3(), NM = new THREE.Matrix3();
  /* collect parts into one vertex-coloured geometry */
  const merge = (build) => {
    const pos = [], nor = [], colr = [], glowPos = [], glowNor = [];
    const p = (g, x, y, z, sx, sy, sz, c, ry = 0, rx = 0, rz = 0, glow = false) => {
      const src = ni(g), P = src.attributes.position, N = src.attributes.normal;
      M4.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S.set(sx, sy, sz)); NM.getNormalMatrix(M4);
      const cc = col(c), v = new THREE.Vector3(), n = new THREE.Vector3();
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(M4); n.fromBufferAttribute(N, i).applyMatrix3(NM).normalize();
        (glow ? glowPos : pos).push(v.x, v.y, v.z); (glow ? glowNor : nor).push(n.x, n.y, n.z); if (!glow) colr.push(cc.r, cc.g, cc.b);
      }
    };
    build(p);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(colr, 3));
    const grp = new THREE.Group(), mesh = new THREE.Mesh(g, SHIPS.mat); mesh.castShadow = true; grp.add(mesh);
    if (glowPos.length) { const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.Float32BufferAttribute(glowPos, 3)); gg.setAttribute("normal", new THREE.Float32BufferAttribute(glowNor, 3)); grp.add(new THREE.Mesh(gg, MAT.glow)); }
    return grp;
  };
  SHIPS.mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
  /* ROC national flag on a staff */
  const flag = (p, x, y, z, s = 1) => {
    p("cyl", x, y + 0.25 * s, z, 0.02 * s, 0.5 * s, 0.02 * s, "#d0d4d8");
    p("box", x, y + 0.42 * s, z - 0.15 * s, 0.012, 0.2 * s, 0.3 * s, "#d4202c");
    p("box", x + 0.002, y + 0.47 * s, z - 0.075 * s, 0.014, 0.1 * s, 0.15 * s, "#13358a");
    p("box", x + 0.004, y + 0.47 * s, z - 0.075 * s, 0.016, 0.045 * s, 0.045 * s, "#ffffff");
  };
  const hull = (p, L, W, H, c, deck, stripe) => {
    p("rbox", 0, H / 2, -0.15 * L * 0.1, W, H, L * 0.86, c);
    p("cone4", 0, H / 2, L * 0.45, W * 0.98, L * 0.18, H * 0.98, c, 0, Math.PI / 2, 0);
    p("box", 0, H + 0.005, 0, W * 0.94, 0.02, L * 0.84, deck);
    if (stripe) p("box", 0, H * 0.25, 0, W * 1.01, H * 0.18, L * 0.86, stripe);
  };
  const TYPES = {
    frigate(p) { // grey warship, gun forward, hangar aft, hull number, ROC flag
      hull(p, 3.4, 0.5, 0.32, "#8d969e", "#7d868e");
      p("rbox", 0, 0.5, 0.15, 0.4, 0.36, 0.9, "#a3abb3"); p("rbox", 0, 0.78, 0.25, 0.3, 0.26, 0.5, "#a3abb3");
      p("box", 0, 0.82, 0.48, 0.26, 0.06, 0.02, "#2b3138", 0, 0, 0, true);
      p("cyl", 0, 1.2, 0.2, 0.03, 0.7, 0.03, "#5d656d"); p("box", 0, 1.35, 0.2, 0.36, 0.04, 0.04, "#5d656d"); p("box", 0, 1.5, 0.2, 0.18, 0.08, 0.06, "#c9ced3");
      p("rbox", 0, 0.62, -0.45, 0.22, 0.28, 0.24, "#7d868e"); p("cyl", 0, 0.4, 1.0, 0.18, 0.12, 0.18, "#a3abb3"); p("box", 0, 0.42, 1.2, 0.035, 0.035, 0.36, "#5d656d");
      p("rbox", 0, 0.47, -0.95, 0.42, 0.3, 0.5, "#a3abb3"); p("box", 0, 0.335, -1.42, 0.46, 0.012, 0.36, "#4b5359"); p("cyl", 0, 0.345, -1.42, 0.24, 0.004, 0.24, "#ffffff");
      p("box", 0.255, 0.2, 1.05, 0.004, 0.08, 0.2, "#ffffff"); p("box", -0.255, 0.2, 1.05, 0.004, 0.08, 0.2, "#ffffff");
      flag(p, 0, 0.34, -1.62, 1.1);
    },
    destroyer(p) {
      hull(p, 4.2, 0.6, 0.36, "#868f97", "#778088");
      p("rbox", 0, 0.58, 0.45, 0.5, 0.42, 1.0, "#9ea6ae"); p("rbox", 0, 0.92, 0.55, 0.36, 0.3, 0.55, "#9ea6ae"); p("box", 0, 0.98, 0.83, 0.3, 0.07, 0.02, "#2b3138", 0, 0, 0, true);
      p("cyl", 0, 1.45, 0.5, 0.035, 0.85, 0.035, "#5d656d"); p("box", 0, 1.6, 0.5, 0.42, 0.05, 0.05, "#5d656d"); p("box", 0, 1.78, 0.5, 0.2, 0.1, 0.07, "#c9ced3");
      p("rbox", 0, 0.62, -0.35, 0.3, 0.42, 0.3, "#778088"); p("rbox", 0, 0.62, -0.9, 0.3, 0.36, 0.3, "#778088");
      for (const z of [1.35, -1.55]) { p("cyl", 0, 0.45, z, 0.22, 0.14, 0.22, "#9ea6ae"); p("box", 0, 0.47, z + (z > 0 ? 0.22 : -0.22), 0.04, 0.04, 0.4, "#5d656d"); }
      p("rbox", 0, 0.52, -1.2, 0.46, 0.3, 0.4, "#9ea6ae"); p("cyl", 0, 1.0, -0.6, 0.02, 0.6, 0.02, "#5d656d");
      flag(p, 0, 0.38, -2.02, 1.2);
    },
    coastguard(p) {
      hull(p, 2.6, 0.46, 0.3, "#f6f7f8", "#e7eaed", "#2f6fd6");
      p("box", 0, 0.12, 0.6, 0.47, 0.04, 0.5, "#e0453c", 0, 0, -0.0);
      p("rbox", 0, 0.48, 0.2, 0.36, 0.34, 0.8, "#ffffff"); p("box", 0, 0.58, 0.61, 0.3, 0.08, 0.02, "#2b3138", 0, 0, 0, true);
      p("cyl", 0, 0.95, 0.2, 0.025, 0.6, 0.025, "#9aa3ab"); p("box", 0, 1.05, 0.2, 0.3, 0.04, 0.04, "#9aa3ab");
      flag(p, 0, 0.3, -1.2, 0.9);
    },
    container(p, r) {
      hull(p, 5.4, 0.8, 0.42, "#1d3557", "#3b4148", "#c8102e");
      const CC = ["#e0453c", "#2f6fd6", "#f0c64a", "#28c8c8", "#e48b5c", "#f8f6f1", "#3f8f5a", "#8a6fb5"];
      for (let z = -1.2; z <= 2.0; z += 0.42) for (const x of [-0.24, 0, 0.24]) { const n = 2 + ((r() * 3) | 0); for (let k = 0; k < n; k++) p("box", x, 0.5 + k * 0.13, z, 0.22, 0.12, 0.38, pick(r, CC)); }
      p("rbox", 0, 0.85, -1.85, 0.7, 0.86, 0.45, "#f8f6f1"); p("box", 0, 1.1, -1.62, 0.6, 0.08, 0.02, "#2b3138", 0, 0, 0, true);
      p("rbox", 0, 1.1, -2.15, 0.24, 0.5, 0.24, "#c8102e");
    },
    bulk(p) {
      hull(p, 4.6, 0.72, 0.42, "#7a1f1f", "#5a4a3a", "#14213d");
      for (let k = 0; k < 5; k++) p("box", 0, 0.47, 1.5 - k * 0.62, 0.5, 0.08, 0.42, "#c9533a");
      for (let k = 0; k < 4; k++) { p("cyl", 0.3, 0.75, 1.2 - k * 0.62, 0.05, 0.6, 0.05, "#f0c64a"); p("box", 0.12, 1.02, 1.2 - k * 0.62, 0.4, 0.04, 0.04, "#f0c64a", 0, 0, 0.3); }
      p("rbox", 0, 0.82, -1.75, 0.66, 0.8, 0.4, "#f8f6f1"); p("box", 0, 1.08, -1.54, 0.56, 0.07, 0.02, "#2b3138", 0, 0, 0, true); p("rbox", 0, 1.15, -2.0, 0.2, 0.42, 0.2, "#14213d");
    },
    tanker(p) {
      hull(p, 4.8, 0.74, 0.4, "#b5122b", "#9a3a2a", "#14213d");
      p("box", 0, 0.47, 0.5, 0.06, 0.06, 3.0, "#d8d2c6"); for (let z = -0.8; z <= 1.8; z += 0.65) p("box", 0, 0.5, z, 0.6, 0.08, 0.06, "#d8d2c6");
      p("rbox", 0, 0.82, -1.85, 0.68, 0.8, 0.42, "#f8f6f1"); p("box", 0, 1.08, -1.63, 0.58, 0.07, 0.02, "#2b3138", 0, 0, 0, true); p("rbox", 0, 1.15, -2.1, 0.2, 0.42, 0.2, "#b5122b");
    },
    ferry(p) {
      hull(p, 2.8, 0.6, 0.3, "#f8f6f1", "#e9ecef", "#2f6fd6");
      p("rbox", 0, 0.48, -0.1, 0.56, 0.3, 1.9, "#ffffff"); p("box", 0, 0.5, -0.1, 0.565, 0.1, 1.8, "#bfe3f5", 0, 0, 0, true);
      p("rbox", 0, 0.74, -0.2, 0.48, 0.22, 1.3, "#ffffff"); p("box", 0, 0.76, -0.2, 0.485, 0.08, 1.2, "#bfe3f5", 0, 0, 0, true);
      p("rbox", 0, 0.98, -0.5, 0.18, 0.3, 0.26, "#28c8c8");
    },
    fishing(p) {
      hull(p, 1.3, 0.34, 0.2, "#f8f6f1", "#d8d2c6", "#2f6fd6");
      p("rbox", 0, 0.34, -0.2, 0.24, 0.2, 0.3, "#ffffff"); p("cyl", 0, 0.6, 0.15, 0.015, 0.6, 0.015, "#8a6a4a");
      p("box", 0, 0.52, 0.32, 0.005, 0.005, 0.5, "#3b4148", 0, 0.7); p("sphere", 0, 0.92, 0.15, 0.05, 0.05, 0.05, "#fff3c4", 0, 0, 0, true);
      for (let k = 0; k < 4; k++) p("sphere", 0, 0.62, 0.42 - k * 0.1, 0.035, 0.035, 0.035, "#fff3c4", 0, 0, 0, true);
    },
    tug(p) {
      hull(p, 1.1, 0.42, 0.24, "#c8102e", "#3b4148", "#14213d");
      p("rbox", 0, 0.42, 0.05, 0.32, 0.28, 0.4, "#f8f6f1"); p("rbox", 0, 0.66, 0.0, 0.08, 0.24, 0.08, "#14213d");
      for (const z of [-0.4, 0, 0.4]) for (const x of [-0.22, 0.22]) p("cyl", x, 0.14, z, 0.06, 0.1, 0.06, "#2a2a2a", 0, 0, Math.PI / 2);
    },
    yacht(p) {
      hull(p, 1.2, 0.3, 0.16, "#ffffff", "#c9a27a");
      p("cyl", 0, 0.75, 0.05, 0.02, 1.2, 0.02, "#d0d4d8");
      p("prism", 0, 0.7, -0.15, 0.01, 0.95, 0.5, "#ffffff", Math.PI / 2, 0, 0); p("prism", 0, 0.55, 0.3, 0.01, 0.6, 0.3, "#e0453c", Math.PI / 2, 0, 0);
    },
  };
  SHIPS.make = (type, r) => merge((p) => TYPES[type](p, r));
  const SPEED = { frigate: 0.9, destroyer: 0.8, coastguard: 1.1, container: 0.7, bulk: 0.55, tanker: 0.55, ferry: 0.9, fishing: 0.5, tug: 0.6, yacht: 0.6 };
  const MIX = ["frigate", "destroyer", "coastguard", "container", "container", "bulk", "tanker", "ferry", "fishing", "fishing", "fishing", "tug", "yacht", "yacht", "frigate"];
  const wakeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false });
  const wakeGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

  /* a fleet for a view: ships sail straight lanes at sea and turn back at the ends */
  SHIPS.fleet = (view, group, count, scale) => {
    const R1 = rng(hash(view.city || "overview") + 9), list = [];
    const clearSea = (x, z, m) => view.isSea(x, z) && view.isSea(x + m, z) && view.isSea(x - m, z) && view.isSea(x, z + m) && view.isSea(x, z - m);
    for (let k = 0; k < count * 6 && list.length < count; k++) {
      const a = R1() * Math.PI * 2, d = view.radius * (0.3 + R1() * 1.2), x = view.c.x + Math.cos(a) * d, z = view.c.z + Math.sin(a) * d;
      if (!clearSea(x, z, 2.2 * scale)) continue;
      const h = R1() * Math.PI * 2, len = (10 + R1() * 22) * scale, ex = x + Math.cos(h) * len, ez = z + Math.sin(h) * len;
      let ok = true; for (let t = 0.1; t <= 1; t += 0.1) if (!clearSea(x + (ex - x) * t, z + (ez - z) * t, 1.6 * scale)) { ok = false; break; }
      if (!ok) continue;
      const type = MIX[list.length % MIX.length], r = rng(hash(type) + k);
      const g = merge((p) => TYPES[type](p, r)); g.scale.setScalar(scale);
      const wake = new THREE.Mesh(wakeGeo, wakeMat); wake.scale.set(0.5 * scale, 1, 3 * scale); g.add(wake); wake.position.set(0, 0.01, -2.2); wake.scale.set(0.5, 1, 2.6);
      group.add(g);
      list.push({ g, type, ax: x, az: z, bx: ex, bz: ez, t: R1(), dir: 1, yaw: 0, speed: SPEED[type] * scale / len, bob: R1() * 6 });
    }
    return (dt, time, moving) => {
      for (const s of list) {
        if (moving) { s.t += s.dir * s.speed * dt; if (s.t > 1) { s.t = 1; s.dir = -1; } if (s.t < 0) { s.t = 0; s.dir = 1; } }
        const x = s.ax + (s.bx - s.ax) * s.t, z = s.az + (s.bz - s.az) * s.t, target = Math.atan2((s.bx - s.ax) * s.dir, (s.bz - s.az) * s.dir);
        let d = target - s.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); s.yaw += d * Math.min(1, dt * 0.8 + (moving ? 0 : 1));
        s.g.position.set(x, WATER_Y - 0.06 + Math.sin(time * 1.2 + s.bob) * 0.02, z); s.g.rotation.set(Math.sin(time * 0.9 + s.bob) * 0.02, s.yaw, 0);
      }
    };
  };
}
