/* ===== roller coaster: a looping, rolling track that circles the island just outside the ring expressway ===== */
const COASTER = { update() {} };
{
  const UPD = [];
  for (const R of Object.values(WORLD.rings || {})) {
    const [cx, cz] = R.center, P = R.pts, n = P.length, OFF = 0.78, up = new THREE.Vector3(0, 1, 0);
    // outward direction per ring point, so the track runs parallel just beyond the expressway
    const pts = [], lat = [];
    const LOOPS = [0.18, 0.52, 0.81]; // fraction of the circuit where vertical loops sit
    let loopDone = new Set(), shift = 0;
    for (let k = 0; k < n; k++) {
      const a = P[(k - 1 + n) % n], b = P[(k + 1) % n], p = P[k];
      const tx = b[0] - a[0], tz = b[1] - a[1], L = Math.hypot(tx, tz) || 1; let nx = tz / L, nz = -tx / L;
      if ((p[0] - cx) * nx + (p[1] - cz) * nz < 0) { nx = -nx; nz = -nz; }
      const u = k / n, x = p[0] + nx * OFF, z = p[1] + nz * OFF;
      // rolling hills: big crests and dives toward the water, always above the waves
      const h = R.deck + 0.55 + 0.75 * Math.sin(u * Math.PI * 2 * 6) + 0.45 * Math.sin(u * Math.PI * 2 * 13 + 1.3);
      const nearB = Math.min(99, ...(WORLD.bridgeEnds || []).map((e) => Math.hypot(e[0] - x, e[1] - z)));
      const kB = THREE.MathUtils.clamp((nearB - 1.2) / 2.2, 0, 1); // dip low under the island bridges
      const y = TOP + 0.1 + (Math.max(TOP + 0.15, h) - TOP - 0.1) * kB;
      const L0 = new THREE.Vector3(nx, 0, nz), T0 = new THREE.Vector3(tx / L, 0, tz / L);
      const li = nearB < 5 ? -1 : LOOPS.findIndex((f) => !loopDone.has(f) && u >= f);
      if (li >= 0) { // a vertical loop: forward, up and over, with a small sideways shift so the track clears itself
        loopDone.add(LOOPS[li]); const RL = 0.85, base = new THREE.Vector3(x, y, z);
        for (let j = 1; j < 24; j++) { const th = (j / 24) * Math.PI * 2; pts.push(base.clone().addScaledVector(T0, Math.sin(th) * RL).addScaledVector(up, (1 - Math.cos(th)) * RL).addScaledVector(L0, (j / 24) * 0.3)); lat.push(L0.clone()); }
        shift = 0.3; // then ease back onto the line
      } else shift = Math.max(0, shift - 0.03);
      pts.push(new THREE.Vector3(x + nx * shift, y, z + nz * shift)); lat.push(L0);
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal", 0.5), TS = Math.max(600, Math.round(curve.getLength() * 9));
    const N = 1600, F = [], LT = [];
    for (let i = 0; i < N; i++) { const u = i / N; F.push(curve.getPointAt(u)); }
    // lateral vector along the curve (from the nearest source point), for rails and banking
    const srcU = pts.map((_, i) => i / pts.length);
    for (let i = 0; i < N; i++) { const k = Math.min(pts.length - 1, Math.round((i / N) * pts.length)); LT.push(lat[k]); }
    const rail = (o) => new THREE.CatmullRomCurve3(F.map((p, i) => p.clone().addScaledVector(LT[i], o)), true);
    const red = new THREE.MeshStandardMaterial({ color: 0xe0453c, roughness: 0.45, metalness: 0.2 }), white = new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.6 });
    for (const o of [-0.08, 0.08]) { const m = new THREE.Mesh(new THREE.TubeGeometry(rail(o), TS, 0.022, 5, true), red); m.castShadow = true; scene.add(m); }
    { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(F.map((p) => p.clone().addScaledVector(up, -0.06)), true), TS, 0.03, 5, true), red); scene.add(m); }
    // ties and supports
    const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.02, 0.035), white, Math.ceil(N / 2));
    const sup = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.025, 0.035, 1, 6).translate(0, 0.5, 0), white, Math.ceil(N / 16));
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), D = new THREE.Vector3();
    let ti = 0, si = 0;
    for (let i = 0; i < N; i += 2) {
      const p = F[i], q = F[(i + 1) % N]; D.subVectors(q, p).normalize();
      const sg0 = new THREE.Vector3().crossVectors(F[1].clone().sub(F[0]), LT[0]).y < 0 ? -1 : 1, X = LT[i].clone().multiplyScalar(sg0);
      const nrm = new THREE.Vector3().crossVectors(D, X).normalize(); X.crossVectors(nrm, D).normalize();
      const basis = new THREE.Matrix4().makeBasis(X, nrm, D); Q.setFromRotationMatrix(basis);
      M.compose(p.clone().addScaledVector(nrm, -0.03), Q, S.set(1, 1, 1)); ties.setMatrixAt(ti++, M);
      if (i % 16 === 0 && nrm.y > 0.6) { const h = p.y - 0.06 - WATER_Y; M.compose(new THREE.Vector3(p.x, WATER_Y, p.z), new THREE.Quaternion(), S.set(1, h, 1)); sup.setMatrixAt(si++, M); }
    }
    ties.count = ti; sup.count = si; scene.add(ties, sup);
    // the train: five cars with riders in white
    const train = [], CAR = ["#e0453c", "#f6f6f2", "#e0453c", "#f6f6f2", "#e0453c"];
    for (let k = 0; k < 5; k++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.24), new THREE.MeshStandardMaterial({ color: CAR[k], roughness: 0.4 })); body.position.y = 0.06; g.add(body);
      for (const sx of [-0.05, 0.05]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.08, 6), new THREE.MeshStandardMaterial({ color: 0xffffff })); r.position.set(sx, 0.14, 0); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshStandardMaterial({ color: 0xf1c9a6 })); hd.position.set(sx, 0.2, 0); g.add(r, hd); }
      scene.add(g); train.push(g);
    }
    let s = 0, v = 0.9; const total = curve.getLength(), yMax = Math.max(...F.map((p) => p.y));
    const tmpT = new THREE.Vector3(), tmpN = new THREE.Vector3(), tmpX = new THREE.Vector3();
    const SG = new THREE.Vector3().crossVectors(curve.getTangentAt(0.001), LT[0]).y < 0 ? -1 : 1; // lateral sign that makes the track's normal point up
    UPD.push((dt, moving) => {
      if (!moving) return;
      const lead = curve.getPointAt(((s / total) % 1 + 1) % 1);
      v = Math.max(0.8, Math.sqrt(0.8 + 2 * 3.2 * (yMax - lead.y)) * 0.75); s += v * dt;
      train.forEach((g, k) => {
        const u = (((s - k * 0.27) / total) % 1 + 1) % 1, p = curve.getPointAt(u), t = curve.getTangentAt(u, tmpT);
        const i = Math.floor(u * N) % N; tmpX.copy(LT[i]).multiplyScalar(SG); tmpN.crossVectors(t, tmpX).normalize(); tmpX.crossVectors(tmpN, t).normalize();
        g.position.copy(p); g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tmpX, tmpN, t));
      });
    });
    COASTER.curves = (COASTER.curves || []).concat(curve); COASTER.curve = COASTER.curve || curve;
  }
  COASTER.update = (dt, moving) => UPD.forEach((f) => f(dt, moving));
}
window.COASTER = COASTER;
window.LAMP_POOLS = LAMP_POOLS;
