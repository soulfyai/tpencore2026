/* ===== environment: an island nation on open sea, sky driven by Taipei time and live weather ===== */
const ENV = {};
{
  const isDarkUI = () => document.documentElement.dataset.theme === "dark" || (document.documentElement.dataset.theme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  const size = bounds.getSize(new THREE.Vector3());

  /* ---------- sky dome ---------- */
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: col("#6fa8e6") }, uHorizon: { value: col("#eef3f8") }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: col("#fff1d6") }, uStars: { value: 0 }, uGlow: { value: 0.35 } },
    vertexShader: "varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: `varying vec3 vDir;uniform vec3 uTop,uHorizon,uSun,uSunCol;uniform float uStars,uGlow;
      float h3(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
      void main(){float h=vDir.y;vec3 c=mix(uHorizon,uTop,smoothstep(-0.02,0.5,h));float s=max(dot(vDir,normalize(uSun)),0.0);
      c+=uSunCol*(pow(s,24.0)*uGlow+pow(s,900.0)*1.4*uGlow);
      vec3 g=floor(vDir*240.0);float st=step(0.9972,h3(g))*smoothstep(0.05,0.3,h);c+=vec3(st*uStars);
      gl_FragColor=vec4(c,1.0);}`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(230, 32, 18), skyMat);
  sky.renderOrder = -10; sky.position.copy(MID); scene.add(sky);
  /* starfield: world-fixed points just inside the sky dome, so a low camera never meets black void.
     Drawn right after the sky gradient and before everything else, so sea and islands always cover it. */
  const stars = (() => {
    const N = 1100, pos = new Float32Array(N * 3), colr = new Float32Array(N * 3), Rs = rng(777);
    for (let i = 0; i < N; i++) {
      const th = Rs() * Math.PI * 2, y = Rs() * 1.08 - 0.08, r = Math.sqrt(Math.max(0, 1 - y * y)); // mostly above the horizon, a few at it
      pos.set([Math.cos(th) * r, y, Math.sin(th) * r], i * 3);
      const b = 0.45 + Rs() * 0.55, warm = Rs() < 0.18, cool = !warm && Rs() < 0.25;
      colr.set([b * (warm ? 1 : cool ? 0.85 : 1), b * (warm ? 0.9 : cool ? 0.92 : 1), b * (warm ? 0.75 : 1)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(colr, 3));
    const m = new THREE.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false });
    const pts = new THREE.Points(g, m);
    pts.renderOrder = -9; pts.position.copy(MID); pts.scale.setScalar(226); pts.visible = false; scene.add(pts);
    return pts;
  })();
  scene.fog = new THREE.Fog(0xeef3f8, 70, 210);

  /* ---------- open sea ---------- */
  const waterMat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uColor: { value: col("#7fc0d4") }, uDeep: { value: col("#2f7aa3") }, uMid: { value: new THREE.Vector2(MID.x, MID.z) }, uChop: { value: 0.4 }, uGlint: { value: 1 }, uNight: { value: 0 }, uRain: { value: 0 } }]),
    vertexShader: "varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}",
    fragmentShader: `varying vec3 vW;uniform float uTime,uChop,uGlint,uNight,uRain;uniform vec3 uColor,uDeep;uniform vec2 uMid;
      float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      #include <fog_pars_fragment>
      void main(){float d=length(vW.xz-uMid);vec3 c=mix(uColor,uDeep,smoothstep(16.0,70.0,d));
      float b=sin(vW.x*0.8+uTime*0.5*(0.5+uChop))*sin(vW.z*0.65-uTime*0.35*(0.5+uChop));c+=vec3(0.035+0.03*uChop)*b;
      float w=sin(vW.x*2.6+vW.z*0.9+uTime*(1.2+uChop))*sin(vW.z*2.2-uTime*(0.9+uChop));c+=vec3(0.05)*smoothstep(0.82-0.12*uChop,1.0,w)*(1.0-smoothstep(25.0,80.0,d));
      float g=step(0.985,sin(vW.x*3.1+uTime)*sin(vW.z*2.7-uTime*0.8));c+=vec3(0.3)*g*uGlint*(1.0-smoothstep(18.0,50.0,d));
      vec2 cell=floor(vW.xz*3.0);float rp=fract(uTime*1.7+h2(cell));c+=vec3(0.18)*uRain*step(0.9,h2(cell+floor(uTime*1.7)))*smoothstep(0.0,0.2,rp)*(1.0-rp)*(1.0-smoothstep(10.0,30.0,d));
      c*=1.0-0.55*uNight;gl_FragColor=vec4(c,1.0);
      #include <fog_fragment>
      }`,
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(240, 72).rotateX(-Math.PI / 2), waterMat);
  water.position.set(MID.x, WATER_Y, MID.z); scene.add(water);

  /* ---------- islets, lighthouses and boats out at sea (decorative) ---------- */
  const deco = new THREE.Group(); scene.add(deco);
  const R1 = rng(1313), dm = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...extra });
  const rockM = dm("#a59d8e"), grassM = dm("#7fae62"), trunkM = dm("#8a6a4a"), leafM = dm("#5f9a52"), whiteM = dm("#f7f6f2"), redM = dm("#c8102e"), blueM = dm("#1f4fb8"), sandM = dm("#e8dcb8");
  const lampM = new THREE.MeshStandardMaterial({ color: "#fff6d8", emissive: "#ffe9a8", emissiveIntensity: 0 });
  const rx = Math.max(size.x, size.z) / 2;
  const islets = [];
  for (let k = 0; k < 11; k++) {
    let x, z, tries = 0;
    do { const a = R1() * Math.PI * 2, d = rx + 9 + R1() * 26; x = MID.x + Math.cos(a) * d; z = MID.z + Math.sin(a) * d * 0.8 - 6; tries++; } while (tries < 30 && islets.some((i) => Math.hypot(i.x - x, i.z - z) < 7));
    const g = new THREE.Group(); g.position.set(x, WATER_Y, z);
    const s = 1.2 + R1() * 2.2;
    const rock = new THREE.Mesh(GEO.ico1, rockM); rock.scale.set(s * 2.2, s * 0.9, s * 1.8); rock.position.y = s * 0.15; rock.castShadow = true; g.add(rock);
    const cap = new THREE.Mesh(GEO.ico1, R1() < 0.3 ? sandM : grassM); cap.scale.set(s * 1.9, s * 0.45, s * 1.5); cap.position.y = s * 0.5; g.add(cap);
    for (let t = 0; t < 2 + ((R1() * 4) | 0); t++) {
      const tx = (R1() - 0.5) * s * 1.4, tz = (R1() - 0.5) * s;
      const tr = new THREE.Mesh(GEO.cyl, trunkM); tr.scale.set(0.12, 0.5, 0.12); tr.position.set(tx, s * 0.7 + 0.2, tz); g.add(tr);
      const lf = new THREE.Mesh(R1() < 0.5 ? GEO.cone : GEO.ico1, leafM); lf.scale.set(0.6, 0.8, 0.6); lf.position.set(tx, s * 0.7 + 0.75, tz); lf.castShadow = true; g.add(lf);
    }
    if (k % 3 === 0) { // red-and-white lighthouse
      const lh = new THREE.Group(); lh.position.set(s * 0.4, s * 0.7, 0);
      for (let b = 0; b < 4; b++) { const m = new THREE.Mesh(GEO.cyl, b % 2 ? redM : whiteM); m.scale.set(0.5 - b * 0.04, 0.45, 0.5 - b * 0.04); m.position.y = 0.22 + b * 0.45; lh.add(m); }
      const lamp = new THREE.Mesh(GEO.sphere, lampM); lamp.scale.setScalar(0.32); lamp.position.y = 2.0; lh.add(lamp);
      const capM = new THREE.Mesh(GEO.cone, redM); capM.scale.set(0.44, 0.3, 0.44); capM.position.y = 2.25; lh.add(capM);
      g.add(lh);
    }
    deco.add(g); islets.push({ x, z, g });
  }
  const boats = [];
  for (let k = 0; k < 14; k++) {
    const g = new THREE.Group(), sail = k % 3 !== 2;
    const hull = new THREE.Mesh(GEO.rbox, k % 2 ? whiteM : blueM); hull.scale.set(0.5, 0.18, 1.3); hull.position.y = 0.05; hull.castShadow = true; g.add(hull);
    if (sail) { const mast = new THREE.Mesh(GEO.cyl, whiteM); mast.scale.set(0.04, 1.4, 0.04); mast.position.y = 0.75; g.add(mast); const s = new THREE.Mesh(GEO.prism, k % 2 ? redM : whiteM); s.scale.set(0.03, 1.1, 0.8); s.rotation.y = Math.PI / 2; s.position.set(0, 0.85, 0.1); g.add(s); }
    else { const cab = new THREE.Mesh(GEO.rbox, whiteM); cab.scale.set(0.4, 0.3, 0.5); cab.position.set(0, 0.28, -0.2); g.add(cab); const l = new THREE.Mesh(GEO.sphere, lampM); l.scale.setScalar(0.12); l.position.set(0, 0.5, -0.2); g.add(l); }
    const r = rx + 5 + R1() * 22, a0 = R1() * Math.PI * 2;
    deco.add(g); boats.push({ g, r, a: a0, v: (0.008 + R1() * 0.012) * (k % 2 ? 1 : -1) });
  }

  /* ---------- clouds (count and shade follow cloud cover) ---------- */
  const clouds = new THREE.Group(); scene.add(clouds);
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.15, flatShading: true, transparent: true, opacity: 0.95 });
  const R2 = rng(4242);
  for (let c = 0; c < 26; c++) {
    const g = new THREE.Group(); const n = 6 + ((R2() * 6) | 0);
    for (let k = 0; k < n; k++) { const m = new THREE.Mesh(GEO.ico1, cloudMat); const s = 1 + R2() * 1.5; m.scale.set(s * 1.5, s, s * 1.1); m.position.set((R2() - 0.5) * 4.5, (R2() - 0.3) * 0.8, (R2() - 0.5) * 2); g.add(m); }
    { const a = R2() * Math.PI * 2, d = rx + 6 + R2() * 30; g.position.set(MID.x + Math.cos(a) * d, 9 + R2() * 6, MID.z + Math.sin(a) * d * 0.9 - 8); }
    g.userData = { v: 0.15 + R2() * 0.2, rank: R2() }; clouds.add(g);
  }

  /* ---------- rain ---------- */
  const DROPS = QUALITY === "high" ? 5000 : 2600;
  const rainG = new THREE.BufferGeometry(), rp = new Float32Array(DROPS * 6), rseed = new Float32Array(DROPS * 3);
  const R3 = rng(9);
  for (let i = 0; i < DROPS; i++) { rseed[i * 3] = (R3() - 0.5) * (size.x + 20); rseed[i * 3 + 1] = R3() * 16; rseed[i * 3 + 2] = (R3() - 0.5) * (size.z + 20); }
  rainG.setAttribute("position", new THREE.BufferAttribute(rp, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: 0xcfe0ee, transparent: true, opacity: 0.55, depthWrite: false });
  const rain = new THREE.LineSegments(rainG, rainMat); rain.frustumCulled = false; rain.visible = false; scene.add(rain);

  /* ---------- light ---------- */
  const hemi = new THREE.HemisphereLight(0xfff6ea, 0x7d93a6, 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1de, 2.4);
  sun.target.position.copy(MID); scene.add(sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(QUALITY === "high" ? 2048 : 1024, QUALITY === "high" ? 2048 : 1024);
  const half = Math.max(size.x, size.z) / 2 + 3;
  Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 140 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.045;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbfd6ff, 0.35); fill.position.copy(MID).add(new THREE.Vector3(20, 12, -16)); scene.add(fill);

  /* ---------- time of day (Taipei) x weather ---------- */
  const KEYS = [ // minute, sky top, horizon, sun colour, sun intensity, hemi intensity, night amount
    [0, "#0b1430", "#1f2b4a", "#8fa4ff", 0.35, 0.45, 1], [300, "#0e1a3a", "#2c3656", "#8fa4ff", 0.35, 0.5, 1],
    [345, "#3d5a8c", "#f2b48f", "#ffb07a", 1.1, 0.8, 0.45], [420, "#5f97da", "#f6dcc4", "#ffd0a0", 1.9, 1.1, 0.05],
    [720, "#5d9de6", "#eaf2f8", "#fff4e2", 2.5, 1.35, 0], [960, "#5f97da", "#f1e8da", "#ffe2b8", 2.1, 1.2, 0],
    [1035, "#5a6fa8", "#f3a77c", "#ff9d6a", 1.2, 0.9, 0.35], [1095, "#1d2a52", "#3b3f62", "#8fa4ff", 0.45, 0.55, 0.9], [1440, "#0b1430", "#1f2b4a", "#8fa4ff", 0.35, 0.45, 1],
  ];
  const taipeiMinutes = () => { const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()); const g = (t) => +p.find((x) => x.type === t).value; return (g("hour") % 24) * 60 + g("minute"); };
  const lerpKey = (m) => {
    let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= m) i++;
    const a = KEYS[i], b = KEYS[i + 1], t = (m - a[0]) / (b[0] - a[0] || 1);
    return { top: col(a[1]).lerp(col(b[1]), t), hor: col(a[2]).lerp(col(b[2]), t), sun: col(a[3]).lerp(col(b[3]), t), si: a[4] + (b[4] - a[4]) * t, hi: a[5] + (b[5] - a[5]) * t, night: a[6] + (b[6] - a[6]) * t };
  };
  const WMO = (c) => c === 0 || c === 1 ? "clear" : c === 2 ? "partly" : c === 3 ? "overcast" : c === 45 || c === 48 ? "fog" : c >= 51 && c <= 57 ? "drizzle" : (c >= 61 && c <= 67) || (c >= 80 && c <= 82) ? "rain" : c >= 71 && c <= 77 ? "snow" : c >= 95 ? "storm" : "partly";
  const LABEL = { clear: "晴", partly: "多雲時晴", overcast: "陰", fog: "霧", drizzle: "毛毛雨", rain: "雨", snow: "雪", storm: "雷雨" };
  ENV.weather = null; ENV.mode = "live"; ENV.forced = null;
  let flash = 0, nextFlash = 3;

  function apply() {
    const W = ENV.forced?.w || ENV.weather || { cloud: 20, code: 1, precip: 0, wind: 10, temp: 25 };
    const minute = ENV.forced?.minute ?? taipeiMinutes();
    const k = lerpKey(minute), kind = WMO(W.code);
    const cloud = THREE.MathUtils.clamp(W.cloud / 100, 0, 1), wet = kind === "drizzle" ? 0.45 : kind === "rain" ? 0.85 : kind === "storm" ? 1 : 0;
    const grey = col(k.night > 0.5 ? "#2a3142" : "#aeb7c2");
    const gray = Math.max(cloud * 0.55, wet * 0.75, kind === "fog" ? 0.7 : 0);
    skyMat.uniforms.uTop.value.copy(k.top).lerp(grey, gray);
    skyMat.uniforms.uHorizon.value.copy(k.hor).lerp(grey.clone().lerp(col("#ffffff"), 0.2), gray * 0.85);
    skyMat.uniforms.uSunCol.value.copy(k.sun);
    skyMat.uniforms.uGlow.value = (1 - gray) * (1 - k.night) * 0.45;
    skyMat.uniforms.uStars.value = k.night * (1 - cloud) * 0.9;
    // sun path: east (−x) at sunrise to west (+x) at sunset, low arc toward the south (+z)
    const dayT = THREE.MathUtils.clamp((minute - 345) / (1035 - 345), 0, 1);
    const elev = k.night > 0.6 ? 0.9 : 0.2 + Math.sin(dayT * Math.PI) * 0.95, az = Math.PI * (1 - dayT);
    const dir = new THREE.Vector3(Math.cos(az) * Math.cos(elev), Math.sin(elev), 0.45 + Math.sin(az) * 0.3).normalize();
    skyMat.uniforms.uSun.value.copy(dir);
    sun.position.copy(MID).add(dir.clone().multiplyScalar(45)); sun.color.copy(k.sun).lerp(col("#ffffff"), 0.35);
    sun.intensity = k.si * (1 - gray * 0.62);
    hemi.intensity = k.hi * (1 - gray * 0.25); hemi.color.copy(k.hor).lerp(col("#ffffff"), 0.82);
    sun.castShadow = sun.intensity > 0.6;
    scene.fog.color.copy(skyMat.uniforms.uHorizon.value);
    scene.fog.near = kind === "fog" ? 12 : wet > 0.5 ? 40 : 70; scene.fog.far = kind === "fog" ? 70 : wet > 0.5 ? 150 : 210;
    ENV.fog0 = { near: scene.fog.near, far: scene.fog.far }; // base values: main.js scales them up when the camera pulls far back
    waterMat.uniforms.uColor.value.copy(col("#7fc0d4")).lerp(col("#8a9aa6"), gray * 0.7);
    waterMat.uniforms.uDeep.value.copy(col("#2f7aa3")).lerp(col("#4d5c68"), gray * 0.6);
    waterMat.uniforms.uChop.value = THREE.MathUtils.clamp((W.wind || 10) / 40, 0.1, 1.2);
    waterMat.uniforms.uGlint.value = (1 - gray) * (1 - k.night);
    waterMat.uniforms.uNight.value = k.night * 0.8;
    waterMat.uniforms.uRain.value = wet;
    const showN = Math.round(4 + cloud * 22);
    clouds.children.forEach((g) => { g.visible = g.userData.rank * 26 < showN; });
    cloudMat.color.copy(col("#ffffff")).lerp(col(k.night > 0.5 ? "#3a4256" : "#9aa3ad"), Math.max(wet, cloud * 0.5));
    cloudMat.emissiveIntensity = 0.15 * (1 - k.night);
    rain.visible = wet > 0; rainMat.opacity = 0.25 + wet * 0.45; ENV.rainRate = wet;
    // street lights: on from 17:00 (fading up over 20 min) until 06:00 Taipei time, fully off in the daytime
    const lampsOn = minute >= 1020 ? THREE.MathUtils.clamp((minute - 1020) / 20, 0, 1) : minute < 360 ? THREE.MathUtils.clamp((360 - minute) / 20, 0, 1) : 0;
    MAT.glow.emissiveIntensity = lampsOn * (1.1 + k.night * 0.7);
    MAT.glowCool.emissiveIntensity = lampsOn * (1.5 + k.night * 0.9); // LED bands burn a little brighter than the warm lamps
    lampM.emissiveIntensity = lampsOn * 2;
    ENV.lampsOn = lampsOn;
    // stars: out by night, dimmed by cloud, gone in rain/fog (clouds and rain draw later, so they still read in front)
    const starA = Math.max(0, k.night - cloud * 0.35 - wet * 0.6) * 0.95;
    stars.material.opacity = starA; stars.visible = starA > 0.02;
    ENV.state = { minute, kind, label: LABEL[kind], temp: W.temp, night: k.night, time: W.time, storm: kind === "storm" };
    renderer.toneMappingExposure = 1 - k.night * 0.15;
    ENV.onChange?.(ENV.state);
  }
  ENV.apply = apply;
  ENV.setWeather = (w) => { ENV.weather = w; apply(); };
  ENV.retheme = () => apply();
  ENV.update = (dt, t) => {
    waterMat.uniforms.uTime.value = t;
    const wind = (ENV.forced?.w || ENV.weather)?.wind || 10;
    for (const g of clouds.children) { const dx = g.position.x - MID.x, dz = g.position.z - MID.z + 8, d = Math.hypot(dx, dz), w = dt * g.userData.v * (0.6 + wind / 25) / Math.max(d, 1); g.position.x = MID.x + dx * Math.cos(w) - dz * Math.sin(w); g.position.z = MID.z - 8 + dx * Math.sin(w) + dz * Math.cos(w); }
    for (const b of boats) { b.a += b.v * dt; b.g.position.set(MID.x + Math.cos(b.a) * b.r, WATER_Y + Math.sin(t * 1.3 + b.r) * 0.04, MID.z + Math.sin(b.a) * b.r * 0.8 - 6); b.g.rotation.y = -b.a + (b.v > 0 ? 0 : Math.PI); }
    if (rain.visible) {
      const fall = 16, slant = wind / 60;
      for (let i = 0; i < DROPS; i++) {
        const y = ((rseed[i * 3 + 1] - t * 9) % fall + fall) % fall - 1;
        const x = MID.x + rseed[i * 3] + y * slant, z = MID.z + rseed[i * 3 + 2];
        rp.set([x, y, z, x - 0.05 * slant * 6, y + 0.35, z], i * 6);
      }
      rainG.attributes.position.needsUpdate = true;
      rainG.setDrawRange(0, Math.round(DROPS * ENV.rainRate) * 2);
    }
    if (ENV.state?.storm) { // lightning
      nextFlash -= dt;
      if (nextFlash < 0) { flash = 1; nextFlash = 4 + Math.random() * 7; }
      if (flash > 0) { flash = Math.max(0, flash - dt * 4); hemi.intensity += flash * 2.5; skyMat.uniforms.uTop.value.lerp(col("#dfe6ff"), flash * 0.5); }
    }
  };
  ENV.cullClouds = (cam) => { clouds.visible = cam.position.distanceTo(controls.target) > 12; };
  ENV.fit = (d) => { // the Taipei-centred panorama pulls back past the original dome: grow sky/sea and the far plane with it
    const k = Math.max(1, (d + 70) / 230);
    sky.scale.setScalar(k); water.scale.setScalar(k); stars.scale.setScalar(226 * k);
    camera.far = Math.max(420, (d + 70) * 2.4); camera.updateProjectionMatrix();
  };
  ENV.isDarkUI = isDarkUI;
  setInterval(apply, 60000); // follow the clock
}
