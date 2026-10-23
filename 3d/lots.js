/* ===== filler lots: BuildIt-style buildings sized to their lot (w x d cells, 1 cell = 1 unit). y=0 is the block top ===== */
const LOTS = {};
{
  const WALLS = ["#fdf6ea", "#f6efe3", "#fbe8d0", "#eef4fa", "#fff8ee", "#f3f1ec"];
  const ROOFS = ["#e0453c", "#2f6fd6", "#38a9c9", "#f08a3c", "#5b6b7d", "#e0453c", "#2f6fd6", "#f8f6f1"];
  const GLASS = ["#9fd0f0", "#7fb8e6", "#b5dcf2"];
  const AWN = ["#e0453c", "#2f6fd6", "#f8f6f1", "#f0c64a", "#28c8c8"];
  const pk = (r, a) => a[(r() * a.length) | 0];
  const kit = (p) => ({
    tree(x, z, s = 1, cone = false) {
      p("cyl", x, 0.14 * s, z, 0.07 * s, 0.28 * s, 0.07 * s, "#8a6a4a");
      if (cone) { p("cone", x, 0.46 * s, z, 0.42 * s, 0.56 * s, 0.42 * s, "#4f8f4a"); p("cone", x, 0.68 * s, z, 0.3 * s, 0.4 * s, 0.3 * s, "#5c9c52"); }
      else { p("ico1", x, 0.44 * s, z, 0.5 * s, 0.42 * s, 0.5 * s, "#5fa752"); p("ico1", x + 0.05 * s, 0.6 * s, z - 0.04 * s, 0.32 * s, 0.28 * s, 0.32 * s, "#7cc062"); }
    },
    bush: (x, z, s = 1) => p("ico1", x, 0.08 * s, z, 0.26 * s, 0.18 * s, 0.26 * s, "#6fae5a"),
    windows(x, y0, z, w, h, d, cols, rows, side = false) {
      const pw = (w / cols) * 0.55, ph = (h / rows) * 0.5;
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const cx = x - w / 2 + (k + 0.5) * (w / cols), cy = y0 + (r + 0.55) * (h / rows);
        p("box", cx, cy, z + d / 2 + 0.008, pw, ph, 0.016, "#bfe3f5", 0, 0, 0, true);
      }
      if (side) for (let r = 0; r < rows; r++) for (let k = 0; k < Math.max(1, Math.round(cols * d / w)); k++) {
        const n = Math.max(1, Math.round(cols * d / w)), cz = z - d / 2 + (k + 0.5) * (d / n), cy = y0 + (r + 0.55) * (h / rows);
        p("box", x + w / 2 + 0.008, cy, cz, 0.016, ph, (d / n) * 0.55, "#bfe3f5", 0, 0, 0, true);
      }
    },
    car(x, z, c, ry = 0) { p("rbox", x, 0.07, z, 0.36, 0.1, 0.18, c, ry); p("rbox", x, 0.15, z, 0.2, 0.08, 0.16, "#cfe8f6", ry); },
    lamp(x, z) { p("cyl", x, 0.25, z, 0.03, 0.5, 0.03, "#3b4148"); p("sphere", x, 0.52, z, 0.08, 0.08, 0.08, "#fff3c4", 0, 0, 0, true); },
    bench(x, z, ry = 0) { p("box", x, 0.08, z, 0.3, 0.03, 0.1, "#a8794f", ry); p("box", x, 0.04, z, 0.26, 0.08, 0.06, "#3b4148", ry); },
  });
  const house = (p, x, z, r, s = 1) => {
    const w = 0.62 * s, d = 0.56 * s, h = (0.36 + r() * 0.2) * s, ridge = r() < 0.5;
    p("rbox", x, h / 2, z, w, h, d, pk(r, WALLS));
    p("prism", x, h + 0.12 * s, z, w + 0.08 * s, 0.24 * s, d + 0.08 * s, pk(r, ROOFS), ridge ? Math.PI / 2 : 0);
    p("box", x, h * 0.5, z + d / 2 + 0.006, w * 0.45, h * 0.32, 0.012, "#fff1c8", 0, 0, 0, true);
    p("box", x - w * 0.3, h * 0.25, z + d / 2 + 0.006, 0.1 * s, 0.2 * s, 0.012, "#8a5a3a");
    if (r() < 0.5) p("box", x + w * 0.22, h + 0.2 * s, z - d * 0.1, 0.08 * s, 0.18 * s, 0.08 * s, "#c9c3b7");
  };
  const lawn = (p, w, d, c = "#a3d47c") => p("box", 0, 0.01, 0, w - 0.12, 0.02, d - 0.12, c);

  /* each generator gets (p, kit, w, d, rng) and builds centred on the lot */
  const R = {
    house(p, k, w, d, r) { lawn(p, w, d); house(p, 0, -0.06, r); k.tree(w / 2 - 0.2, d / 2 - 0.2, 0.55); },
    pair(p, k, w, d, r) { lawn(p, w, d); const ax = w > d; for (const s of [-1, 1]) house(p, ax ? s * w / 4 : 0, ax ? -0.05 : s * d / 4, r, 0.95); },
    apartment(p, k, w, d, r) {
      lawn(p, w, d); const bw = w * 0.72, bd = d * 0.5, h = 0.9 + r() * 0.5, trim = pk(r, ROOFS);
      p("rbox", 0, h / 2, -d * 0.12, bw, h, bd, pk(r, WALLS)); p("box", 0, h + 0.03, -d * 0.12, bw + 0.04, 0.06, bd + 0.04, trim);
      k.windows(0, 0.08, -d * 0.12, bw * 0.9, h - 0.14, bd, Math.round(bw / 0.22), Math.round(h / 0.22), true);
      for (let y = 0.24; y < h - 0.05; y += 0.22) p("box", 0, y, -d * 0.12 + bd / 2 + 0.05, bw * 0.92, 0.025, 0.1, "#ffffff");
      p("box", bw * 0.25, h + 0.12, -d * 0.18, 0.2, 0.16, 0.2, "#d7dbe0");
      k.tree(-w / 2 + 0.3, d / 2 - 0.3, 0.8); k.tree(w / 2 - 0.3, d / 2 - 0.3, 0.75); k.bush(0, d / 2 - 0.25, 1.2);
    },
    estate(p, k, w, d, r) { // two bars + playground
      lawn(p, w, d);
      for (const s of [-1, 1]) { const h = 0.8 + r() * 0.4, x = s * w / 4; p("rbox", x, h / 2, -d * 0.15, w * 0.36, h, d * 0.42, pk(r, WALLS)); p("box", x, h + 0.03, -d * 0.15, w * 0.37, 0.06, d * 0.43, pk(r, ROOFS)); k.windows(x, 0.08, -d * 0.15, w * 0.32, h - 0.14, d * 0.42, 6, Math.round(h / 0.22)); }
      p("box", 0, 0.025, d * 0.28, 0.7, 0.03, 0.4, "#f0c64a"); p("box", -0.15, 0.12, d * 0.28, 0.25, 0.04, 0.08, "#e0453c", 0, 0, -0.5); p("box", 0.18, 0.15, d * 0.28, 0.04, 0.3, 0.04, "#2f6fd6");
      k.tree(-w / 2 + 0.35, d / 2 - 0.35, 0.8); k.tree(w / 2 - 0.35, d / 2 - 0.35, 0.8);
    },
  };
  const C = {
    shop(p, k, w, d, r) {
      p("box", 0, 0.01, 0, w - 0.1, 0.02, d - 0.1, "#e8e2d4");
      const h = 0.55 + r() * 0.45, bw = w - 0.24, bd = d * 0.62;
      p("rbox", 0, h / 2, -d * 0.1, bw, h, bd, pk(r, WALLS));
      p("box", 0, 0.14, -d * 0.1 + bd / 2 + 0.008, bw * 0.86, 0.2, 0.016, pk(r, GLASS), 0, 0, 0, true);
      p("box", 0, 0.3, -d * 0.1 + bd / 2 + 0.08, bw * 0.92, 0.025, 0.16, pk(r, AWN), 0, -0.35);
      p("box", 0, h * 0.75, -d * 0.1 + bd / 2 + 0.012, bw * 0.5, 0.12, 0.016, pk(r, AWN), 0, 0, 0, true);
      if (h > 0.75) k.windows(0, 0.38, -d * 0.1, bw * 0.85, h - 0.44, bd, Math.max(2, Math.round(bw / 0.25)), 1);
      p("box", bw * 0.2, h + 0.06, -d * 0.2, 0.18, 0.12, 0.18, "#d7dbe0");
    },
    office(p, k, w, d, r) {
      p("box", 0, 0.01, 0, w - 0.1, 0.02, d - 0.1, "#e8e2d4");
      const h = 1.0 + r() * 0.6, bw = w * 0.66, bd = d * 0.6;
      p("rbox", 0, h / 2, -d * 0.06, bw, h, bd, "#eaf2fa");
      for (let y = 0.15; y < h - 0.05; y += 0.16) { p("box", 0, y, -d * 0.06 + bd / 2 + 0.008, bw * 0.92, 0.08, 0.016, pk(r, GLASS), 0, 0, 0, true); p("box", bw / 2 + 0.008, y, -d * 0.06, 0.016, 0.08, bd * 0.92, pk(r, GLASS), 0, 0, 0, true); }
      p("box", 0, h + 0.03, -d * 0.06, bw + 0.04, 0.06, bd + 0.04, "#2f6fd6");
      p("box", -bw * 0.2, h + 0.12, -d * 0.12, 0.24, 0.12, 0.24, "#d7dbe0");
      k.tree(-w / 2 + 0.3, d / 2 - 0.3, 0.7); k.tree(w / 2 - 0.3, d / 2 - 0.3, 0.7);
    },
    mall(p, k, w, d, r) { // big box + parking
      p("box", 0, 0.008, 0, w - 0.1, 0.016, d - 0.1, "#8f949b");
      for (let x = -w / 2 + 0.4; x < w / 2 - 0.2; x += 0.4) p("box", x, 0.02, d * 0.28, 0.02, 0.005, 0.5, "#ffffff");
      const bw = w * 0.86, bd = d * 0.46, h = 0.62;
      p("rbox", 0, h / 2, -d * 0.2, bw, h, bd, "#f4f1ea"); p("box", 0, h + 0.02, -d * 0.2, bw + 0.02, 0.04, bd + 0.02, pk(r, AWN));
      p("box", 0, 0.18, -d * 0.2 + bd / 2 + 0.008, bw * 0.5, 0.26, 0.016, "#bfe3f5", 0, 0, 0, true);
      p("box", 0, h * 0.78, -d * 0.2 + bd / 2 + 0.01, bw * 0.3, 0.14, 0.016, "#e0453c", 0, 0, 0, true);
      for (let i = 0; i < 6; i++) k.car(-w / 2 + 0.45 + i * ((w - 0.9) / 5), d * 0.28 + (i % 2 ? 0.16 : -0.16), pk(r, AWN), Math.PI / 2);
    },
    hotel(p, k, w, d, r) {
      p("box", 0, 0.01, 0, w - 0.1, 0.02, d - 0.1, "#e8e2d4");
      p("rbox", 0, 0.2, 0, w * 0.8, 0.4, d * 0.7, "#f6efe3");
      const h = 1.5 + r() * 0.3; p("rbox", -w * 0.12, 0.4 + h / 2, -d * 0.08, w * 0.4, h, d * 0.36, "#fbe8d0");
      k.windows(-w * 0.12, 0.45, -d * 0.08, w * 0.36, h - 0.1, d * 0.36, 5, 7, true);
      p("box", -w * 0.12, 0.42 + h, -d * 0.08, w * 0.42, 0.06, d * 0.38, "#2f6fd6");
      p("cyl", w * 0.25, 0.44, d * 0.15, 0.6, 0.04, 0.4, "#7fc6e0"); k.tree(w * 0.38, -d * 0.3, 0.8);
    },
  };
  const I = {
    shed(p, k, w, d, r) {
      p("box", 0, 0.008, 0, w - 0.1, 0.016, d - 0.1, "#cfcac0");
      const bw = w * 0.8, bd = d * 0.6, h = 0.38;
      p("box", 0, h / 2, -d * 0.12, bw, h, bd, "#e6e2da");
      const n = Math.max(2, Math.round(bw / 0.4)); for (let i = 0; i < n; i++) p("prism", -bw / 2 + (i + 0.5) * (bw / n), h + 0.08, -d * 0.12, bw / n, 0.16, bd, i % 2 ? "#8fa3ba" : "#a8b8c9", Math.PI / 2);
      p("box", 0, 0.14, -d * 0.12 + bd / 2 + 0.008, 0.36, 0.26, 0.016, "#f0c64a");
      p("rbox", w * 0.25, 0.12, d * 0.32, 0.5, 0.2, 0.22, "#f8f6f1"); p("rbox", w * 0.25 - 0.32, 0.1, d * 0.32, 0.16, 0.18, 0.2, "#2f6fd6");
    },
    factory(p, k, w, d, r) {
      I.shed(p, k, w, d, r);
      const x = w / 2 - 0.4, z = -d / 2 + 0.4;
      p("cyl", x, 0.6, z, 0.16, 1.2, 0.16, "#f8f6f1"); for (let y = 0.2; y < 1.2; y += 0.3) p("cyl", x, y, z, 0.17, 0.1, 0.17, "#e0453c");
      p("cyl", -w / 2 + 0.45, 0.25, -d / 2 + 0.45, 0.5, 0.5, 0.5, "#dfe3e6"); p("dome", -w / 2 + 0.45, 0.5, -d / 2 + 0.45, 0.5, 0.16, 0.5, "#cfd4d9");
    },
    yard(p, k, w, d, r) { // container yard
      p("box", 0, 0.008, 0, w - 0.1, 0.016, d - 0.1, "#bdb7ab");
      const CC = ["#e0453c", "#2f6fd6", "#f0c64a", "#28c8c8", "#e48b5c", "#f8f6f1", "#3f8f5a"];
      for (let i = -w / 2 + 0.5; i < w / 2 - 0.3; i += 0.75) for (let j = -d / 2 + 0.4; j < d / 2 - 0.3; j += 0.38) { const n = 1 + ((r() * 3) | 0); for (let s = 0; s < n; s++) p("box", i, 0.1 + s * 0.17, j, 0.68, 0.16, 0.32, pk(r, CC)); }
      p("box", -w / 2 + 0.2, 0.6, 0, 0.08, 1.2, 0.08, "#f0c64a"); p("box", w / 2 - 0.2, 0.6, 0, 0.08, 1.2, 0.08, "#f0c64a"); p("box", 0, 1.2, 0, w - 0.3, 0.08, 0.1, "#f0c64a");
    },
  };
  const P = {
    park(p, k, w, d, r) {
      p("box", 0, 0.01, 0, w - 0.1, 0.02, d - 0.1, "#8ccf68");
      p("box", 0, 0.025, 0, w - 0.2, 0.012, 0.16, "#e6dcc6"); p("box", 0, 0.025, 0, 0.16, 0.012, d - 0.2, "#e6dcc6");
      if (w * d >= 4 && r() < 0.6) { p("cyl", 0, 0.04, 0, Math.min(w, d) * 0.4, 0.04, Math.min(w, d) * 0.4, "#cfc9bd"); p("cyl", 0, 0.05, 0, Math.min(w, d) * 0.34, 0.04, Math.min(w, d) * 0.34, "#7fc6e0"); p("cyl", 0, 0.18, 0, 0.06, 0.26, 0.06, "#f8f6f1"); }
      const n = Math.round(w * d * 1.4);
      for (let i = 0; i < n; i++) { const x = (r() - 0.5) * (w - 0.5), z = (r() - 0.5) * (d - 0.5); if (Math.abs(x) < 0.25 || Math.abs(z) < 0.25) continue; k.tree(x, z, 0.7 + r() * 0.4, r() < 0.3); }
      k.bench(0.35, 0.2, Math.PI / 2); k.lamp(-0.3, 0.3);
    },
    field(p, k, w, d, r) { // sports field + track
      p("box", 0, 0.01, 0, w - 0.1, 0.02, d - 0.1, "#8ccf68");
      p("cyl", 0, 0.03, 0, w * 0.86, 0.02, d * 0.8, "#c9603f"); p("cyl", 0, 0.04, 0, w * 0.68, 0.02, d * 0.58, "#7fbf5a");
      p("box", 0, 0.052, 0, 0.03, 0.004, d * 0.5, "#ffffff"); p("cyl", 0, 0.052, 0, 0.5, 0.004, 0.5, "#ffffff");
      p("box", 0, 0.2, -d / 2 + 0.25, w * 0.6, 0.3, 0.3, "#e6e2da"); p("box", 0, 0.38, -d / 2 + 0.25, w * 0.62, 0.04, 0.36, "#2f6fd6");
    },
    school(p, k, w, d, r) {
      p("box", 0, 0.01, 0, w - 0.1, 0.02, d - 0.1, "#d8b49a");
      const h = 0.7; p("rbox", -w * 0.18, h / 2, -d * 0.18, w * 0.56, h, d * 0.4, "#fdf6ea"); p("box", -w * 0.18, h + 0.03, -d * 0.18, w * 0.57, 0.06, d * 0.41, "#e0453c");
      k.windows(-w * 0.18, 0.08, -d * 0.18, w * 0.5, h - 0.14, d * 0.4, 8, 3);
      p("cyl", w * 0.28, 0.03, d * 0.12, w * 0.36, 0.02, d * 0.5, "#c9603f"); p("cyl", w * 0.28, 0.04, d * 0.12, w * 0.24, 0.02, d * 0.34, "#7fbf5a");
      p("cyl", -w * 0.42, 0.45, d * 0.3, 0.02, 0.9, 0.02, "#d0d4d8"); p("box", -w * 0.42 + 0.12, 0.82, d * 0.3, 0.22, 0.14, 0.01, "#2f6fd6");
    },
  };
  const FARM = {
    farm(p, k, w, d, r) {
      const C2 = ["#cfe08a", "#9fc86a", "#e2c86a", "#b7d27a"];
      const n = Math.max(2, Math.round(d * 2));
      for (let i = 0; i < n; i++) p("box", 0, 0.012, -d / 2 + (i + 0.5) * (d / n), w - 0.1, 0.024, d / n - 0.04, pk(r, C2));
      if (r() < 0.5) house(p, w / 2 - 0.45, -d / 2 + 0.45, r, 0.9);
    },
  };
  LOTS.build = (zone, p, w, d, r) => {
    const k = kit(p), a = w * d;
    if (zone === "R") { if (a <= 1) return R.house(p, k, w, d, r); if (a <= 2) return R.pair(p, k, w, d, r); if (a <= 4) return r() < 0.75 ? R.apartment(p, k, w, d, r) : R.pair(p, k, w, d, r); return r() < 0.7 ? R.estate(p, k, w, d, r) : P.school(p, k, w, d, r); }
    if (zone === "C") { if (a <= 2) return C.shop(p, k, w, d, r); if (a <= 4) return r() < 0.55 ? C.office(p, k, w, d, r) : C.shop(p, k, w, d, r); if (a <= 8) return r() < 0.6 ? C.mall(p, k, w, d, r) : C.hotel(p, k, w, d, r); return C.mall(p, k, w, d, r); }
    if (zone === "I") { if (a <= 4) return I.shed(p, k, w, d, r); return r() < 0.5 ? I.factory(p, k, w, d, r) : I.yard(p, k, w, d, r); }
    if (zone === "F") return FARM.farm(p, k, w, d, r);
    if (a >= 8 && r() < 0.35) return P.field(p, k, w, d, r);
    return P.park(p, k, w, d, r);
  };
  /* split a w x d rect into lots; zone decides how coarse */
  LOTS.split = (w, d, zone, r) => {
    const out = [], target = { R: 1.6, C: 3.2, I: 8, P: 16, F: 8 }[zone] || 2;
    const rec = (x, z, w2, d2) => {
      const a = w2 * d2;
      if (a <= 1 || (a <= target * 2 && r() < 0.55) || a <= target) { out.push([x, z, w2, d2]); return; }
      if (w2 >= d2) { const h = Math.max(1, Math.round(w2 / 2)); rec(x, z, h, d2); rec(x + h, z, w2 - h, d2); }
      else { const h = Math.max(1, Math.round(d2 / 2)); rec(x, z, w2, h); rec(x, z + h, w2, d2 - h); }
    };
    rec(0, 0, w, d);
    return out;
  };
}
