/* ===== model library: one small diorama per policy item (model space: ~1x1 footprint, y up from 0) ===== */
const MODELS = {};
{
  const C = { wall: "#f3ebdf", white: "#f8f6f1", cream: "#efe1c8", stone: "#cfc8bb", dark: "#3b4148", road: "#5d6168", line: "#f5f1e6", glass: "#a8cfe0",
    wood: "#a8794f", woodD: "#7d5a3a", leaf: "#6f9e57", leafL: "#8db96a", red: "#d9573f", yellow: "#f0c64a", skin: "#f1c9a6", hair: "#3a2e28", grass: "#9cc27c", water: "#7fc0d4", pink: "#f2b3b0", sky: "#8fc6e8", steel: "#9aa3ab" };
  const SHIRTS = ["#1f4fb8", "#c8102e", "#f8f6f1", "#28c8c8", "#14213d", "#e48b5c", "#4f6fa8"];

  /* --- helpers (p = part placer bound to a model context) --- */
  const H = (p, a) => ({
    slab: (w, d, c = C.stone, x = 0, z = 0) => p("box", x, 0.012, z, w, 0.024, d, c),
    box: (x, y, z, w, h, d, c, ry = 0) => p("box", x, y + h / 2, z, w, h, d, c, ry),
    rbox: (x, y, z, w, h, d, c, ry = 0) => p("rbox", x, y + h / 2, z, w, h, d, c, ry),
    cyl: (x, y, z, r, h, c, g = "cyl") => p(g, x, y + h / 2, z, r * 2, h, r * 2, c),
    ball: (x, y, z, r, c, g = "sphere") => p(g, x, y, z, r * 2, r * 2, r * 2, c),
    windows(x, y0, z, w, h, d, cols, rows, face = "front") { // glow panes on a facade
      const pw = w / cols * 0.55, ph = h / rows * 0.5;
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const cx = x - w / 2 + (k + 0.5) * (w / cols), cy = y0 + (r + 0.55) * (h / rows);
        if (face === "front") p("box", cx, cy, z + d / 2 + 0.006, pw, ph, 0.012, C.glass, 0, 0, 0, true);
        else p("box", x + w / 2 + 0.006, cy, z - d / 2 + (k + 0.5) * (d / cols), 0.012, ph, d / cols * 0.55, C.glass, 0, 0, 0, true);
      }
    },
    house(x, z, w, d, h, wall, roof, opt = {}) {
      p("box", x, h / 2, z, w, h, d, wall);
      if (opt.roof === "flat") { p("box", x, h + 0.02, z, w + 0.04, 0.04, d + 0.04, roof); }
      else p("prism", x, h + d * 0.24, z, w + 0.06, d * 0.48, d + 0.06, roof, opt.ridgeZ ? Math.PI / 2 : 0);
      if (opt.door !== false) p("box", x, 0.09, z + d / 2 + 0.006, 0.09, 0.18, 0.012, C.woodD);
      if (opt.win !== false) this.windows(x, h * 0.25, z, w * 0.9, h * 0.7, d, Math.max(2, Math.round(w / 0.16)), Math.max(1, Math.round(h / 0.2)));
    },
    tower(x, z, w, d, h, wall, cap, floors) {
      p("foffice", x, h / 2, z, w, h, d, wall);
      p("box", x, h + 0.02, z, w * 1.04, 0.04, d * 1.04, cap);
    },
    person(x, z, shirt, ry = 0, sc = 1) {
      const s = 0.62 * sc;
      p("box", x, 0.06 * s, z, 0.07 * s, 0.12 * s, 0.05 * s, C.dark, ry);
      p("rbox", x, 0.17 * s, z, 0.1 * s, 0.12 * s, 0.07 * s, shirt, ry);
      p("sphere", x, 0.27 * s, z, 0.085 * s, 0.085 * s, 0.085 * s, C.skin);
      p("dome", x, 0.285 * s, z, 0.09 * s, 0.07 * s, 0.09 * s, C.hair);
    },
    tree(x, z, s = 1, kind = "round") {
      p("cyl", x, 0.1 * s, z, 0.04 * s, 0.2 * s, 0.04 * s, C.wood);
      if (kind === "cone") { p("cone", x, 0.32 * s, z, 0.24 * s, 0.34 * s, 0.24 * s, "#4f7d4a"); p("cone", x, 0.46 * s, z, 0.17 * s, 0.24 * s, 0.17 * s, "#5c8c52"); }
      else { p("ico1", x, 0.28 * s, z, 0.26 * s, 0.22 * s, 0.26 * s, C.leaf); p("ico1", x + 0.03 * s, 0.37 * s, z - 0.02 * s, 0.18 * s, 0.16 * s, 0.18 * s, C.leafL); }
    },
    bush: (x, z, s = 1, c = C.leaf) => p("ico1", x, 0.05 * s, z, 0.14 * s, 0.1 * s, 0.14 * s, c),
    car(x, z, c, ry = 0) { p("rbox", x, 0.05, z, 0.16, 0.06, 0.09, c, ry); p("rbox", x, 0.1, z, 0.09, 0.05, 0.08, C.glass, ry); for (const [dx, dz] of [[-0.05, 0.045], [0.05, 0.045], [-0.05, -0.045], [0.05, -0.045]]) { const cx = Math.cos(ry), sx = Math.sin(ry); p("cyl", x + dx * cx + dz * sx, 0.025, z - dx * sx + dz * cx, 0.04, 0.02, 0.04, C.dark, 0, Math.PI / 2, ry); } },
    bus(x, z, c, ry = 0) {
      p("rbox", x, 0.1, z, 0.42, 0.16, 0.14, c, ry);
      p("box", x, 0.13, z, 0.38, 0.05, 0.142, C.glass, ry, 0, 0, true);
      p("box", x, 0.185, z, 0.4, 0.015, 0.12, C.white, ry);
      const cx = Math.cos(ry), sx = Math.sin(ry);
      for (const dx of [-0.13, 0.13]) for (const dz of [-0.07, 0.07]) p("cyl", x + dx * cx + dz * sx, 0.03, z - dx * sx + dz * cx, 0.06, 0.025, 0.06, C.dark, 0, Math.PI / 2, ry);
    },
    road(len, w = 0.28, z = 0, ry = 0) { p("box", 0, 0.014, z, len, 0.028, w, C.road, ry); for (let k = -len / 2 + 0.08; k < len / 2; k += 0.16) p("box", k * Math.cos(ry), 0.03, z - k * Math.sin(ry), 0.07, 0.004, 0.015, C.line, ry); },
    zebra(x, z, w = 0.26, ry = 0) { for (let k = -2; k <= 2; k++) p("box", x + (ry ? 0 : k * 0.05), 0.03, z + (ry ? k * 0.05 : 0), ry ? w : 0.03, 0.004, ry ? 0.03 : w, C.line); },
    bench: (x, z, ry = 0) => { p("box", x, 0.05, z, 0.16, 0.02, 0.05, C.wood, ry); p("box", x, 0.025, z, 0.14, 0.05, 0.03, C.dark, ry); },
    lamp: (x, z) => { p("cyl", x, 0.14, z, 0.012, 0.28, 0.012, C.dark); p("sphere", x, 0.29, z, 0.04, 0.04, 0.04, "#fff3c4", 0, 0, 0, true); },
    flag: (x, z, c, h = 0.45) => { p("cyl", x, h / 2, z, 0.012, h, 0.012, C.steel); p("box", x + 0.06, h - 0.05, z, 0.12, 0.07, 0.008, c); },
    sign: (x, y, z, w, c) => { p("box", x, y, z, w, 0.07, 0.012, c); },
    fence(x0, x1, z) { for (let x = x0; x <= x1 + 1e-6; x += 0.08) p("box", x, 0.035, z, 0.012, 0.07, 0.012, C.white); p("box", (x0 + x1) / 2, 0.055, z, x1 - x0, 0.012, 0.01, C.white); },
    crossMark: (x, y, z, c = C.red) => { p("box", x, y, z, 0.1, 0.03, 0.012, c); p("box", x, y, z, 0.03, 0.1, 0.012, c); },
    heart: (x, y, z, c = C.pink) => { p("sphere", x - 0.022, y + 0.015, z, 0.05, 0.05, 0.02, c); p("sphere", x + 0.022, y + 0.015, z, 0.05, 0.05, 0.02, c); p("box", x, y - 0.012, z, 0.045, 0.045, 0.02, c, 0, 0, Math.PI / 4); },
    coin: (x, y, z) => { p("cyl", x, y, z, 0.12, 0.025, 0.12, C.yellow, 0, Math.PI / 2); p("cyl", x, y, z + 0.003, 0.07, 0.027, 0.07, "#e3ae2b", 0, Math.PI / 2); },
    slide(x, z) { p("box", x - 0.06, 0.08, z, 0.03, 0.16, 0.03, C.yellow); p("box", x + 0.02, 0.09, z, 0.18, 0.02, 0.07, C.red, 0, 0, -0.6); p("box", x - 0.06, 0.16, z, 0.07, 0.015, 0.07, C.yellow); },
    swing(x, z) { for (const dx of [-0.08, 0.08]) p("box", x + dx, 0.1, z, 0.015, 0.2, 0.015, C.dark); p("box", x, 0.2, z, 0.18, 0.015, 0.015, C.dark); p("box", x, 0.06, z, 0.06, 0.012, 0.04, a); },
  });

  /* --- the dioramas; a = city accent colour, r = per-item random --- */
  const K = {
    metro(p, h, a, r) { h.slab(0.98, 0.84, C.stone); for (const x of [-0.32, 0.32]) h.box(x, 0, 0, 0.07, 0.34, 0.07, C.stone); h.box(0, 0.34, 0, 1.0, 0.05, 0.16, "#b9b2a6");
      p("rbox", -0.12, 0.43, 0, 0.5, 0.13, 0.13, C.white); p("box", -0.12, 0.45, 0, 0.46, 0.04, 0.135, C.glass, 0, 0, 0, true); p("box", -0.12, 0.38, 0.0675, 0.5, 0.025, 0.002, a);
      h.house(0.22, 0.24, 0.42, 0.24, 0.2, C.white, a, { roof: "flat" }); h.sign(0.22, 0.24, 0.363, 0.2, a); h.person(-0.3, 0.3, SHIRTS[(r * 7) | 0]); h.tree(0.4, -0.3, 0.8); },
    bus(p, h, a, r) { h.slab(1, 0.84, C.stone); h.road(1, 0.32, 0.05); h.bus(-0.1, 0.05, a); p("box", 0.3, 0.12, -0.22, 0.26, 0.015, 0.1, a); for (const x of [0.2, 0.4]) h.box(x, 0, -0.26, 0.015, 0.12, 0.015, C.dark); h.bench(0.3, -0.23); h.person(0.38, -0.15, SHIRTS[(r * 7) | 0]); h.tree(-0.38, -0.3, 0.7); h.lamp(0.42, 0.28); },
    bike(p, h, a, r) { h.slab(1, 0.84, C.grass); p("box", 0, 0.014, 0.1, 1, 0.026, 0.22, "#6aa3c9"); for (let k = -0.4; k < 0.45; k += 0.2) p("box", k, 0.03, 0.1, 0.07, 0.004, 0.02, C.white);
      for (const x of [-0.25, 0, 0.25]) { p("torus", x - 0.05, 0.06, -0.22, 0.1, 0.1, 0.1, C.dark); p("torus", x + 0.05, 0.06, -0.22, 0.1, 0.1, 0.1, C.dark); p("box", x, 0.09, -0.22, 0.12, 0.012, 0.012, a, 0, 0, 0.3); p("box", x + 0.04, 0.12, -0.22, 0.012, 0.06, 0.012, C.dark); }
      h.box(0.4, 0, -0.22, 0.05, 0.18, 0.05, a); h.person(-0.35, 0.1, SHIRTS[(r * 7) | 0], Math.PI / 2); h.tree(0.38, 0.32, 0.7); },
    bridge(p, h, a) { p("box", 0, 0.012, 0, 1, 0.02, 0.84, C.grass); p("box", 0, 0.02, 0, 1, 0.012, 0.38, C.water); for (let k = 0; k < 7; k++) { const x = -0.42 + k * 0.14; p("box", x, 0.1 + Math.sin((k / 6) * Math.PI) * 0.06, 0, 0.15, 0.03, 0.2, C.cream); }
      for (const x of [-0.18, 0.18]) h.box(x, 0, 0, 0.05, 0.12, 0.08, C.stone); for (const z of [-0.1, 0.1]) p("box", 0, 0.18, z, 0.9, 0.012, 0.012, a); h.person(0.05, 0.02, C.yellow, Math.PI / 2, 0.8); h.tree(-0.4, -0.32, 0.7); h.tree(0.4, 0.32, 0.7); },
    road(p, h, a, r) { h.slab(1, 0.9, C.stone); p("box", 0, 0.014, 0, 1, 0.026, 0.3, C.road); p("box", 0, 0.015, 0, 0.3, 0.027, 0.9, C.road); h.zebra(0.28, 0, 0.26); h.zebra(-0.28, 0, 0.26); h.zebra(0, 0.28, 0.26, 1);
      h.car(-0.3, -0.06, a); h.car(0.05, 0.06, C.white, Math.PI); h.person(0.3, 0.32, C.yellow, 0, 0.8); h.person(0.36, 0.3, SHIRTS[(r * 7) | 0]); for (const [x, z] of [[-0.3, -0.32], [0.3, -0.32]]) h.tree(x, z, 0.6); h.lamp(-0.22, 0.24); },
    parking(p, h, a) { h.slab(1, 0.84, C.stone); for (let f = 0; f < 3; f++) { p("box", 0, 0.03 + f * 0.13, 0, 0.8, 0.03, 0.6, "#cfcac0"); } for (const x of [-0.38, 0.38]) for (const z of [-0.28, 0.28]) h.box(x, 0, z, 0.04, 0.4, 0.04, C.stone);
      h.car(-0.2, 0.1, a); h.car(0.15, -0.1, C.white); p("box", 0, 0.29, 0, 0.1, 0.01, 0.1, C.line); h.sign(0.3, 0.46, 0.31, 0.2, a); },
    apartment(p, h, a, r) { h.slab(1, 0.84, C.stone); h.tower(-0.18, -0.05, 0.36, 0.34, 0.9 + r * 0.25, C.wall, a, 6); h.tower(0.25, 0.08, 0.3, 0.3, 0.6, "#e9e1d3", a, 4); h.tree(0.32, -0.3, 0.7); h.bench(-0.2, 0.3); h.person(0.05, 0.33, SHIRTS[(r * 7) | 0]); },
    renewal(p, h, a) { h.slab(1, 0.84, C.stone); h.tower(-0.12, 0, 0.42, 0.36, 0.55, C.wall, C.stone, 4); for (let f = 0; f < 4; f++) p("box", -0.12, 0.6 + f * 0.1, 0, 0.44, 0.012, 0.38, C.yellow);
      for (const x of [-0.34, 0.1]) for (const z of [-0.19, 0.19]) h.box(x, 0.55, z, 0.012, 0.4, 0.012, C.yellow);
      h.box(0.35, 0, -0.2, 0.05, 1.05, 0.05, C.yellow); p("box", 0.18, 1.06, -0.2, 0.55, 0.04, 0.04, C.yellow); p("box", 0.46, 1.04, -0.2, 0.08, 0.06, 0.06, C.dark); p("box", 0.05, 0.85, -0.2, 0.005, 0.4, 0.005, C.dark); h.person(0.3, 0.3, "#f08a3c"); },
    nursery(p, h, a, r) { h.slab(1, 0.84, "#f3e7c4"); h.house(-0.18, -0.12, 0.5, 0.36, 0.26, C.white, a); h.slide(0.25, 0.15); h.swing(0.25, -0.22);
      h.ball(-0.05, 0.035, 0.28, 0.035, C.red); h.ball(0.05, 0.03, 0.3, 0.03, C.yellow); h.person(-0.3, 0.28, SHIRTS[(r * 7) | 0], 0, 0.6); h.person(-0.2, 0.3, C.pink, 0, 0.6); h.person(-0.38, 0.24, C.dark, 0, 1); h.fence(-0.45, 0.45, 0.4); },
    maternity(p, h, a) { h.slab(1, 0.84, "#f6e3e1"); h.house(-0.1, -0.12, 0.56, 0.36, 0.3, C.white, C.pink); h.heart(-0.1, 0.45, 0.07); h.crossMark(-0.36, 0.22, 0.07, a);
      p("rbox", 0.3, 0.07, 0.25, 0.12, 0.08, 0.08, a); for (const dx of [-0.04, 0.04]) p("torus", 0.3 + dx, 0.025, 0.25, 0.04, 0.04, 0.04, C.dark); h.person(0.2, 0.25, C.pink); h.tree(0.4, -0.3, 0.6); },
    school(p, h, a, r) { h.slab(1, 0.84, "#d8b49a"); h.house(0, -0.18, 0.86, 0.3, 0.32, C.cream, a, { roof: "flat" }); h.box(0, 0.32, -0.18, 0.18, 0.14, 0.18, C.cream); p("cyl", 0, 0.42, -0.085, 0.08, 0.012, 0.08, C.white, 0, Math.PI / 2);
      h.flag(0.4, 0.2, a); for (let k = 0; k < 4; k++) h.person(-0.3 + k * 0.14, 0.22, SHIRTS[(k + r * 7) % 7 | 0], Math.PI, 0.6); p("box", 0, 0.012, 0.22, 0.7, 0.004, 0.25, C.white); },
    canteen(p, h, a, r) { h.slab(1, 0.84, "#efe6d6"); h.house(-0.1, -0.2, 0.7, 0.28, 0.24, C.white, a); for (const x of [-0.2, 0.15]) { h.box(x, 0, 0.18, 0.28, 0.08, 0.12, C.wood); h.person(x - 0.08, 0.3, SHIRTS[(r * 7 + x * 10) % 7 | 0], Math.PI, 0.6); h.person(x + 0.08, 0.3, C.yellow, Math.PI, 0.6); }
      for (let k = 0; k < 3; k++) { h.box(0.36 + 0.035 * k, 0, -0.3, 0.03, 0.07, 0.03, C.white); p("cone4", 0.36 + 0.035 * k, 0.085, -0.3, 0.03, 0.03, 0.03, C.sky); } h.ball(-0.2, 0.1, 0.18, 0.025, C.red); },
    elder(p, h, a, r) { h.slab(1, 0.84, C.grass); h.house(-0.12, -0.15, 0.6, 0.36, 0.26, C.cream, a); p("box", 0.24, 0.04, 0.01, 0.2, 0.012, 0.16, C.stone, 0, 0, 0.25); h.bench(0.1, 0.28); h.person(0.04, 0.3, "#8a8a8a"); h.person(0.18, 0.3, "#c8a46a");
      h.box(0.25, 0, 0.32, 0.012, 0.09, 0.012, C.woodD); h.tree(0.38, -0.25, 0.8); h.bush(-0.38, 0.28); h.bush(-0.28, 0.32, 0.8, "#d77a91"); },
    hospital(p, h, a, r) { h.slab(1, 0.84, C.stone); h.tower(-0.12, -0.08, 0.6, 0.38, 0.5, C.white, C.stone, 3); h.box(-0.12, 0.5, -0.08, 0.2, 0.08, 0.16, C.white); h.crossMark(-0.12, 0.6, 0.0, C.red); p("box", -0.12, 0.012, 0.25, 0.3, 0.004, 0.15, C.red);
      p("rbox", 0.33, 0.07, 0.25, 0.22, 0.12, 0.12, C.white); p("box", 0.33, 0.07, 0.25, 0.222, 0.025, 0.122, C.red); h.crossMark(0.33, 0.1, 0.312); h.person(0.15, 0.3, C.sky); },
    clinic(p, h, a, r) { h.slab(1, 0.84, C.stone); h.house(-0.1, -0.12, 0.5, 0.34, 0.28, C.white, a, { roof: "flat" }); h.crossMark(-0.1, 0.22, 0.056, C.red); p("cyl", 0.3, 0.12, 0.2, 0.05, 0.24, 0.05, C.white, 0, 0, 0.6); p("cyl", 0.3, 0.12, 0.2, 0.06, 0.06, 0.06, C.sky, 0, 0, 0.6);
      h.person(0.15, 0.28, SHIRTS[(r * 7) | 0]); h.person(0.05, 0.3, C.white); h.tree(0.38, -0.28, 0.7); },
    counsel(p, h, a, r) { h.slab(1, 0.84, C.grass); h.house(-0.15, -0.12, 0.5, 0.36, 0.26, C.cream, a); h.heart(-0.15, 0.42, 0.07, C.pink); h.rbox(0.28, 0, 0.12, 0.16, 0.3, 0.16, a); p("box", 0.28, 0.17, 0.2, 0.12, 0.16, 0.012, C.glass, 0, 0, 0, true);
      h.bench(-0.15, 0.3); h.person(-0.22, 0.32, SHIRTS[(r * 7) | 0]); h.person(-0.08, 0.32, C.sky); h.bush(0.4, -0.3); },
    welfare(p, h, a) { h.slab(1, 0.84, C.stone); h.house(-0.15, -0.15, 0.56, 0.34, 0.26, C.cream, a, { roof: "flat" }); p("box", 0.25, 0.04, -0.05, 0.3, 0.012, 0.12, C.stone, 0, 0, 0.22);
      p("rbox", 0.18, 0.08, 0.26, 0.3, 0.13, 0.15, C.white); p("box", 0.18, 0.1, 0.26, 0.28, 0.04, 0.152, a); for (const dx of [-0.09, 0.09]) p("cyl", 0.18 + dx, 0.025, 0.26, 0.05, 0.03, 0.05, C.dark, 0, Math.PI / 2); h.person(-0.3, 0.28, SHIRTS[3]); },
    tech(p, h, a, r) { h.slab(1, 0.84, C.stone); h.tower(-0.15, -0.08, 0.34, 0.34, 1.05 + r * 0.25, C.glass, a, 8); h.box(-0.15, 1.1 + r * 0.25, -0.08, 0.02, 0.18, 0.02, C.steel);
      h.house(0.25, 0.1, 0.3, 0.3, 0.22, C.white, C.steel, { roof: "flat" }); for (let k = 0; k < 3; k++) h.box(0.18 + k * 0.07, 0.24, 0.1, 0.05, 0.1, 0.18, C.dark); h.person(0.05, 0.32, SHIRTS[(r * 7) | 0]); h.tree(-0.38, 0.3, 0.6); },
    industry(p, h, a, r) { h.slab(1, 0.84, C.stone); h.house(-0.1, -0.08, 0.66, 0.42, 0.28, "#dcd6ca", a, { ridgeZ: false }); for (const x of [0.32]) { h.cyl(x, 0, -0.25, 0.05, 0.62, C.stone); p("box", x, 0.6, -0.25, 0.1, 0.02, 0.1, a); }
      for (let k = 0; k < 3; k++) h.box(-0.3 + k * 0.12, 0, 0.3, 0.1, 0.08, 0.08, k % 2 ? a : C.yellow); p("rbox", 0.28, 0.08, 0.28, 0.24, 0.12, 0.12, C.white); h.person(0.05, 0.32, "#f08a3c"); },
    youth(p, h, a, r) { h.slab(1, 0.84, "#e6dccb"); h.house(-0.1, -0.15, 0.62, 0.36, 0.3, C.white, C.dark, { roof: "flat" }); p("box", -0.1, 0.26, 0.05, 0.62, 0.015, 0.1, a, 0, 0.25);
      for (const x of [-0.22, 0.05]) { h.box(x, 0, 0.22, 0.14, 0.06, 0.1, C.wood); p("box", x, 0.07, 0.22, 0.07, 0.005, 0.05, C.dark); h.person(x - 0.05, 0.32, SHIRTS[(r * 7 + x * 5) % 7 | 0], Math.PI, 0.7); } h.flag(0.4, -0.25, a, 0.35); h.tree(0.38, 0.28, 0.6); },
    money(p, h, a, r) { h.slab(1, 0.84, C.stone); h.rbox(0, 0, -0.1, 0.36, 0.32, 0.26, a); p("box", 0, 0.2, 0.031, 0.28, 0.12, 0.012, C.white, 0, 0, 0, true); h.coin(0, 0.48, -0.1); h.coin(-0.3, 0.07, 0.2); h.coin(0.3, 0.07, 0.24);
      h.person(-0.12, 0.25, SHIRTS[(r * 7) | 0]); h.person(0.1, 0.27, C.yellow, 0, 0.6); h.bush(0.4, -0.3); h.bush(-0.4, -0.3); },
    park(p, h, a, r) { h.slab(1, 0.84, C.grass); p("cyl", -0.1, 0.012, 0.05, 0.36, 0.02, 0.26, C.water); for (const [x, z, s] of [[-0.35, -0.28, 0.9], [0.32, -0.25, 1], [0.35, 0.28, 0.8], [-0.4, 0.28, 0.7], [0.05, -0.32, 0.75]]) h.tree(x, z, s, r > 0.6 ? "cone" : "round");
      h.bench(0.12, 0.25); h.person(0.15, 0.32, SHIRTS[(r * 7) | 0]); h.bush(-0.15, 0.3, 0.8, "#d77a91"); },
    water(p, h, a) { h.slab(1, 0.84, C.grass); p("box", 0, 0.03, 0, 0.8, 0.02, 0.6, C.water); for (const z of [-0.31, 0.31]) h.box(0, 0, z, 0.84, 0.06, 0.03, C.stone); for (const x of [-0.41, 0.41]) h.box(x, 0, 0, 0.03, 0.06, 0.64, C.stone);
      h.house(0.28, -0.22, 0.2, 0.16, 0.16, C.stone, a, { win: false }); p("cyl", 0.12, 0.05, -0.22, 0.03, 0.18, 0.03, C.steel, 0, 0, Math.PI / 2); h.tree(-0.38, 0.38, 0.5); },
    fire(p, h, a, r) { h.slab(1, 0.84, C.stone); h.house(-0.12, -0.15, 0.62, 0.38, 0.32, "#e8e0d2", C.red, { roof: "flat", win: false }); for (const x of [-0.3, -0.06]) p("box", x, 0.12, 0.045, 0.18, 0.22, 0.012, C.dark);
      h.box(0.3, 0, -0.2, 0.08, 0.5, 0.08, C.red); p("rbox", 0.2, 0.08, 0.25, 0.32, 0.13, 0.14, C.red); p("box", 0.2, 0.17, 0.25, 0.26, 0.02, 0.03, C.steel, 0, 0, 0.1); for (const dx of [-0.1, 0.1]) p("cyl", 0.2 + dx, 0.03, 0.25, 0.055, 0.03, 0.055, C.dark, 0, Math.PI / 2); h.person(-0.35, 0.3, C.yellow); },
    police(p, h, a) { h.slab(1, 0.84, C.stone); h.house(-0.1, -0.14, 0.6, 0.36, 0.3, C.white, "#4f6fa8", { roof: "flat" }); h.sign(-0.1, 0.25, 0.046, 0.25, "#4f6fa8"); p("rbox", 0.28, 0.06, 0.25, 0.24, 0.09, 0.12, C.white); p("box", 0.28, 0.12, 0.25, 0.06, 0.025, 0.04, "#4f6fa8"); h.flag(0.38, -0.25, a); h.person(0.05, 0.3, "#3d4f7a"); },
    recycle(p, h, a, r) { h.slab(1, 0.84, C.stone); h.house(-0.15, -0.12, 0.6, 0.38, 0.26, "#d5dccf", "#6f9e57", { roof: "flat" }); h.cyl(0.3, 0, -0.22, 0.06, 0.58, C.stone);
      for (let k = 0; k < 4; k++) h.rbox(-0.32 + k * 0.12, 0, 0.26, 0.09, 0.12, 0.09, ["#3e7c8c", "#f0c64a", "#6f9e57", "#d9573f"][k]); for (let k = 0; k < 3; k++) p("box", 0.22 + k * 0.08, 0.2, 0.18, 0.07, 0.003, 0.14, "#2f4e7a", 0, -0.5); h.tree(0.4, 0.35, 0.6); },
    ev(p, h, a) { h.slab(1, 0.84, C.stone); p("box", 0, 0.32, -0.05, 0.9, 0.025, 0.42, C.steel); for (const x of [-0.4, 0.4]) h.box(x, 0, -0.05, 0.03, 0.32, 0.03, C.steel);
      h.bus(-0.18, -0.05, a); h.bus(0.24, -0.05, "#6f9e57"); for (const x of [-0.18, 0.24]) h.box(x, 0, 0.2, 0.04, 0.16, 0.04, C.white); for (let k = 0; k < 4; k++) p("box", -0.3 + k * 0.2, 0.34, -0.05, 0.16, 0.004, 0.36, "#2f4e7a", 0, 0); },
    sport(p, h, a, r) { h.slab(1, 0.84, "#6aa66b"); p("box", 0, 0.026, 0, 0.82, 0.004, 0.6, C.white); p("box", 0, 0.028, 0, 0.78, 0.004, 0.56, "#6aa66b"); p("box", 0, 0.03, 0, 0.006, 0.004, 0.56, C.white); p("torus", 0, 0.03, 0, 0.18, 0.18, 0.04, C.white, 0, Math.PI / 2);
      for (const x of [-0.4, 0.4]) { h.box(x, 0, 0, 0.012, 0.12, 0.2, C.white); } h.person(-0.15, 0.1, a, 0.5); h.person(0.18, -0.1, C.yellow, 3); h.ball(0.02, 0.03, 0.05, 0.025, C.white); h.lamp(-0.46, 0.38); h.lamp(0.46, -0.38); },
    gym(p, h, a, r) { h.slab(1, 0.84, C.stone); h.house(-0.05, -0.1, 0.72, 0.46, 0.3, C.white, a); h.windows(-0.05, 0.05, -0.1, 0.66, 0.2, 0.46, 6, 1); h.person(0.25, 0.3, SHIRTS[(r * 7) | 0]); h.person(-0.3, 0.32, C.yellow); h.tree(0.4, 0.3, 0.6); },
    stadium(p, h, a) { h.slab(1, 0.9, C.stone); p("cyl", 0, 0.06, 0, 0.9, 0.12, 0.74, C.white); p("dome", 0, 0.12, 0, 0.86, 0.36, 0.7, "#eef0f2"); for (let k = 0; k < 10; k++) { const t = (k / 10) * Math.PI * 2; p("box", Math.cos(t) * 0.44, 0.1, Math.sin(t) * 0.36, 0.02, 0.06, 0.02, a, -t); }
      h.flag(-0.45, 0.4, a, 0.35); h.person(0.3, 0.42, SHIRTS[2]); },
    tourism(p, h, a, r) { h.slab(1, 0.84, C.grass); p("torus", -0.08, 0.42, 0, 0.72, 0.72, 0.3, C.white, 0); for (let k = 0; k < 8; k++) { const t = (k / 8) * Math.PI * 2; p("rbox", -0.08 + Math.cos(t) * 0.36, 0.42 + Math.sin(t) * 0.36, 0, 0.07, 0.07, 0.07, [a, C.yellow, C.sky, C.pink][k % 4]); }
      for (const x of [-0.2, 0.04]) h.box(x, 0, 0, 0.02, 0.42, 0.03, C.steel); h.box(0.35, 0, 0.22, 0.14, 0.12, 0.1, a); h.person(0.3, 0.35, SHIRTS[(r * 7) | 0]); h.tree(0.38, -0.3, 0.6); },
    port(p, h, a) { p("box", 0, 0.012, -0.2, 1, 0.024, 0.44, C.stone); p("box", 0, 0.012, 0.22, 1, 0.024, 0.4, C.water); p("rbox", 0.05, 0.06, 0.24, 0.5, 0.1, 0.18, C.white); p("box", 0.05, 0.13, 0.24, 0.24, 0.07, 0.12, a);
      h.box(-0.35, 0, -0.18, 0.05, 0.62, 0.05, C.red); p("box", -0.25, 0.6, -0.18, 0.32, 0.04, 0.04, C.red); for (let k = 0; k < 3; k++) h.box(0.15 + k * 0.11, 0.024, -0.25, 0.1, 0.08, 0.16, [a, C.yellow, "#3e7c8c"][k]); },
    culture(p, h, a) { h.slab(1, 0.84, C.stone); p("box", 0, 0.04, -0.08, 0.76, 0.06, 0.5, C.cream); for (let k = 0; k < 5; k++) h.cyl(-0.3 + k * 0.15, 0.07, 0.12, 0.025, 0.26, C.white); h.box(0, 0.07, -0.12, 0.66, 0.26, 0.38, C.cream);
      p("prism", 0, 0.38, -0.08, 0.8, 0.12, 0.52, a); h.box(0, 0.33, 0.12, 0.72, 0.03, 0.06, C.white); h.person(0.2, 0.36, SHIRTS[1]); h.tree(-0.42, 0.34, 0.5); },
    library(p, h, a, r) { h.slab(1, 0.84, C.stone); h.house(-0.05, -0.12, 0.72, 0.4, 0.34, C.cream, a); for (let k = 0; k < 4; k++) h.box(-0.3 + k * 0.08, 0.36, -0.12, 0.05, 0.12 + (k % 2) * 0.03, 0.12, [C.red, C.sky, C.yellow, a][k]);
      h.bench(0.2, 0.28); h.person(0.15, 0.3, SHIRTS[(r * 7) | 0]); h.tree(-0.38, 0.3, 0.6); },
    temple(p, h, a) { h.slab(1, 0.84, C.stone); h.box(0, 0, -0.08, 0.6, 0.24, 0.4, "#c94e3a"); p("prism", 0, 0.3, -0.08, 0.8, 0.12, 0.54, "#e0b04a"); h.box(0, 0.36, -0.08, 0.36, 0.08, 0.26, "#c94e3a"); p("prism", 0, 0.46, -0.08, 0.5, 0.1, 0.36, "#e0b04a");
      for (const x of [-0.2, 0.2]) h.box(x, 0, 0.18, 0.04, 0.22, 0.04, C.red); h.person(0.3, 0.3, SHIRTS[4]); h.ball(-0.3, 0.12, 0.25, 0.04, C.red); },
    civic(p, h, a, r) { h.slab(1, 0.84, C.stone); p("box", 0, 0.03, -0.05, 0.86, 0.05, 0.56, C.cream); h.box(0, 0.05, -0.12, 0.7, 0.34, 0.36, C.white); for (let k = 0; k < 6; k++) h.cyl(-0.3 + k * 0.12, 0.05, 0.1, 0.022, 0.34, C.white);
      p("box", 0, 0.42, -0.05, 0.8, 0.04, 0.48, a); p("dome", 0, 0.44, -0.12, 0.24, 0.16, 0.24, C.white); h.flag(-0.42, 0.32, a, 0.4); h.person(0.2, 0.34, "#3d4f7a"); h.person(0.32, 0.32, SHIRTS[(r * 7) | 0]); },
    airport(p, h, a) { h.slab(1, 0.9, C.grass); p("box", 0.05, 0.026, 0.05, 0.96, 0.004, 0.24, C.road); for (let k = -0.4; k < 0.45; k += 0.13) p("box", k, 0.03, 0.05, 0.06, 0.003, 0.02, C.line);
      p("rbox", 0.05, 0.08, 0.05, 0.4, 0.06, 0.06, C.white); p("box", 0.05, 0.08, 0.05, 0.12, 0.012, 0.42, C.white); p("box", -0.13, 0.13, 0.05, 0.06, 0.1, 0.012, a); h.house(-0.15, -0.3, 0.5, 0.18, 0.18, C.white, C.glass, { roof: "flat" }); h.box(0.35, 0, -0.3, 0.06, 0.4, 0.06, C.white); p("box", 0.35, 0.42, -0.3, 0.14, 0.06, 0.14, C.glass, 0, 0, 0, true); },
    station(p, h, a, r) { h.slab(1, 0.84, C.stone); h.house(0, -0.12, 0.8, 0.36, 0.3, C.white, a, { roof: "flat" }); p("cyl", 0, 0.36, -0.12, 0.12, 0.012, 0.12, C.white, 0, Math.PI / 2); h.sign(0, 0.27, 0.065, 0.36, a);
      h.road(1, 0.2, 0.3); h.bus(0.15, 0.3, a); h.person(-0.3, 0.16, SHIRTS[(r * 7) | 0]); h.person(-0.2, 0.17, C.yellow); },
    farm(p, h, a) { for (let k = 0; k < 5; k++) p("box", -0.25 + k * 0.1, 0.02, 0.08, 0.08, 0.03, 0.6, k % 2 ? "#8bb35f" : "#a07c55"); h.house(0.32, -0.2, 0.26, 0.22, 0.2, "#c8553d", C.white); h.person(0.1, 0.25, "#c8a46a"); p("cone", 0.1, 0.19, 0.25, 0.1, 0.03, 0.1, C.yellow); },
    market(p, h, a, r) { h.slab(1, 0.84, C.stone); for (let k = 0; k < 3; k++) { const x = -0.3 + k * 0.3; h.box(x, 0, -0.05, 0.22, 0.1, 0.16, C.wood); p("prism", x, 0.26, -0.05, 0.26, 0.06, 0.2, [a, C.yellow, C.red][k]); for (const dx of [-0.1, 0.1]) h.box(x + dx, 0.1, -0.12, 0.012, 0.13, 0.012, C.dark);
        h.ball(x - 0.04, 0.12, -0.02, 0.025, [C.red, "#f08a3c", C.leaf][k]); } for (let k = 0; k < 3; k++) h.person(-0.3 + k * 0.28, 0.25, SHIRTS[(k + r * 7) % 7 | 0], Math.PI); },
    house(p, h, a, r) { h.slab(1, 0.84, C.grass); h.house(-0.15, -0.1, 0.42, 0.34, 0.26, C.wall, a); h.house(0.26, 0.05, 0.28, 0.26, 0.2, C.cream, C.red); h.tree(-0.38, 0.3, 0.7); h.person(0.05, 0.32, SHIRTS[(r * 7) | 0]); h.bush(0.4, -0.3); },
  };
  MODELS.kinds = K;
  /* keyword routing: item text first, then theme, then fallback */
  const RULES = [
    [/行政中心|行政園區|市政中心/, "civic"],
    [/機場|松機|航空/, "airport"], [/巨蛋/, "stadium"], [/電動公車|充電/, "ev"], [/基隆塔|地標|摩天輪|纜車/, "tourism"],
    [/捷運|輕軌|軌道|環狀|萬大|三鶯|汐東|基捷|棕線|綠線|機捷|列車|鐵路|台鐵/, "metro"], [/轉乘|車站|站區/, "station"],
    [/公車|巴士|小巴|幹線|客運|司機|候車|接駁|自駕/, "bus"], [/YouBike|自行車|單車|機車/, "bike"], [/橋/, "bridge"], [/停車/, "parking"],
    [/路口|圓環|道路|人行|通學|步道|騎樓|行人|交通安全|事故/, "road"],
    [/都更|危老|重建|容積|電梯|5099/, "renewal"], [/社宅|住宅|宅|公寓|安居|居住/, "apartment"],
    [/托嬰|公托|托育|臨托|幼兒|親子館|兒童樂園|育兒|專班|幼兒園/, "nursery"], [/生育|好孕|孕|產後|凍卵|新生兒|婦幼/, "maternity"],
    [/午餐|營養|鮮奶|食材|食安|廚房/, "canteen"], [/教科書|教室|小班|學校|校園|師資|教師|課|學習|學生|國中|國小|大學|教育/, "school"],
    [/敬老|長者|銀髮|老人|長照|日照|共照|伯公|65|高齡|失智/, "elder"], [/醫院|急診|醫療|救護/, "hospital"], [/疫苗|診所|健檢|口腔|衛生|篩檢|皮蛇/, "clinic"],
    [/心理|諮商|專線|關懷|熱線|1999|陪伴/, "counsel"], [/身障|復康|罕病|爬梯|弱勢|無障礙/, "welfare"],
    [/消防|災害|防災|特搜/, "fire"], [/警|派出所|治安|詐騙/, "police"],
    [/焚化|廚餘|回收|垃圾|減碳|生質|空污|定檢|保育|環保|淨零|碳/, "recycle"],
    [/滯洪|排水|下水道|淹|防洪|水利|汙水|治水|抽水/, "water"],
    [/田徑|球場|運動中心|體能館|運動|體育|賽|健身|足球|棒球/, "sport"],
    [/AI|人工智慧|科技|數據|智慧|數位|資訊|APP|平台|雲|網路|5G/, "tech"], [/產業|園區|招商|投資|就業|工廠|物流|輝達|北士科|職訓|勞動|減工時/, "industry"],
    [/青年|創業|圓夢|錢包|新創/, "youth"], [/補助|津貼|禮金|點數|幣|免費|獎勵|減稅|月票|TPASS|周遊券|基金/, "money"],
    [/港口|商港|港埠|港區|碼頭|郵輪|海洋/, "port"], [/觀光|旅遊|觀光巴士/, "tourism"], [/圖書館|閱讀|書/, "library"], [/廟|宮|客家|族群|原住民/, "temple"], [/文化|博物館|藝文|美術|展/, "culture"],
    [/公園|綠|森林|樹|遊戲場|共融|花/, "park"], [/農|菜|果/, "farm"], [/市場|商圈|店家|夜市/, "market"],
    [/市府|局|治理|行政|議會|共治|成立|委員會|條例|機制|預算|債務|效能/, "civic"],
  ];
  const THEME_KIND = [[/教育|午餐/, "school"], [/托育|育兒|親子|好孕|家庭/, "nursery"], [/銀髮|長照|長者|高齡/, "elder"], [/醫療|衛生|健康/, "hospital"], [/無菸|食安/, "clinic"],
    [/運動|體育|賽事/, "sport"], [/交通|軌道/, "metro"], [/居住|都更|住宅/, "apartment"], [/AI|產業|科技/, "tech"], [/環保/, "park"], [/文化|觀光/, "culture"],
    [/社福/, "welfare"], [/青年/, "youth"], [/治安|消防|防災/, "fire"], [/工務|水利/, "water"], [/其他|外交|市府/, "civic"]];
  const WEAK = new Set(["money", "civic", "canteen", "youth", "counsel", "tech"]);
  MODELS.kindFor = (item, theme) => {
    const text = `${item.name} ${item.plain || ""}`;
    let nameKind = null; for (const [re, k] of RULES) if (re.test(item.name)) { nameKind = k; break; }
    let themeKind = null; for (const [re, k] of THEME_KIND) if (re.test(theme.name)) { themeKind = k; break; }
    if (themeKind && (!nameKind || (WEAK.has(nameKind) && nameKind !== themeKind))) return themeKind;
    if (nameKind) return nameKind;
    for (const [re, k] of RULES) if (re.test(text)) return k;
    for (const [re, k] of RULES) if (re.test(theme.name)) return k;
    return "house";
  };
  MODELS.helpers = H;
  MODELS.C = C;
}
