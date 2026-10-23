/* ===== model variants: the same kind looks different from item to item on one island ===== */
{
  const C = MODELS.C, K = MODELS.kinds;
  const SH = ["#d9573f", "#3e7c8c", "#f0c64a", "#86a373", "#8a6fb5", "#e48b5c", "#4f6fa8"];
  const sh = (r, k = 0) => SH[(((r * 97) | 0) + k) % 7];
  const V = {
    metro: [K.metro,
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.box(0, 0, -0.05, 0.42, 0.06, 0.3, C.stone); p("prism", 0, 0.2, -0.05, 0.5, 0.18, 0.36, C.glass, Math.PI / 2, 0, 0, true); for (const x of [-0.22, 0.22]) h.box(x, 0, -0.05, 0.02, 0.2, 0.32, a);
        h.box(-0.38, 0, 0.18, 0.02, 0.4, 0.02, C.dark); p("cyl", -0.38, 0.42, 0.18, 0.12, 0.12, 0.02, a, 0, Math.PI / 2); for (let k = 0; k < 3; k++) h.person(0.12 + k * 0.1, 0.25, sh(r, k)); h.tree(0.38, -0.3, 0.7); h.bush(-0.35, -0.3); },
      (p, h, a, r) => { h.slab(1, 0.84, C.grass); for (const z of [-0.035, 0.035]) p("box", 0, 0.03, z, 1, 0.01, 0.012, C.steel); for (let x = -0.45; x < 0.5; x += 0.1) p("box", x, 0.024, 0, 0.02, 0.008, 0.12, C.woodD);
        p("rbox", -0.05, 0.11, 0, 0.56, 0.14, 0.14, a); p("box", -0.05, 0.13, 0, 0.5, 0.05, 0.142, C.glass, 0, 0, 0, true); p("rbox", -0.05, 0.19, 0, 0.5, 0.02, 0.1, C.white);
        for (const x of [-0.3, 0.3]) { h.box(x, 0, -0.14, 0.015, 0.34, 0.015, C.dark); p("box", x, 0.33, -0.07, 0.015, 0.015, 0.15, C.dark); } h.house(0.32, 0.26, 0.24, 0.12, 0.12, C.white, a, { roof: "flat", win: false }); h.person(0.25, 0.28, sh(r)); },
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); p("cyl", 0, 0.18, 0, 0.36, 0.9, 0.36, C.glass, 0, 0, Math.PI / 2); p("box", 0, 0.0, 0, 0.95, 0.04, 0.4, C.white); for (const x of [-0.42, 0, 0.42]) p("torus", x, 0.18, 0, 0.36, 0.36, 0.3, a, Math.PI / 2);
        p("rbox", 0.05, 0.09, 0.06, 0.7, 0.1, 0.1, C.white); p("box", 0.05, 0.1, 0.06, 0.66, 0.035, 0.102, C.glass, 0, 0, 0, true); h.person(-0.3, 0.32, sh(r)); h.person(0.3, 0.33, sh(r, 2)); },
      (p, h, a, r) => { h.slab(1, 0.84, "#d9d2c3"); for (const x of [-0.3, 0, 0.3]) { h.box(x, 0, 0, 0.08, 0.36, 0.08, C.stone); p("box", x, 0.38, 0, 0.2, 0.04, 0.16, C.stone); } p("box", -0.15, 0.42, 0, 0.36, 0.04, 0.16, C.stone);
        h.box(0.38, 0, -0.25, 0.04, 0.85, 0.04, C.yellow); p("box", 0.22, 0.86, -0.25, 0.4, 0.03, 0.03, C.yellow); p("box", 0.1, 0.7, -0.25, 0.004, 0.3, 0.004, C.dark); for (let k = 0; k < 4; k++) p("box", -0.35 + k * 0.08, 0.04, 0.3, 0.06, 0.08, 0.02, k % 2 ? C.yellow : C.white); h.person(0.15, 0.28, "#f08a3c"); h.sign(-0.25, 0.1, 0.32, 0.22, a); },
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); for (const x of [-0.3, 0.3]) h.box(x, 0, -0.1, 0.06, 0.3, 0.06, C.stone); p("box", 0, 0.32, -0.1, 1, 0.04, 0.14, "#b9b2a6"); for (const z of [-0.3, 0.25]) h.box(0, 0, z, 0.06, 0.5, 0.06, C.stone); p("box", 0, 0.52, 0, 0.14, 0.04, 0.84, "#b9b2a6");
        p("rbox", -0.25, 0.4, -0.1, 0.38, 0.11, 0.11, a); p("rbox", 0, 0.6, 0.15, 0.11, 0.11, 0.38, C.white); h.tree(0.38, 0.32, 0.6); h.person(-0.3, 0.3, sh(r)); }],
    bus: [K.bus,
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); p("box", 0, 0.3, -0.02, 0.96, 0.03, 0.62, a); for (const x of [-0.45, 0.45]) for (const z of [-0.3, 0.26]) h.box(x, 0, z, 0.03, 0.3, 0.03, C.steel); for (const [x, c] of [[-0.25, a], [0.05, C.white], [0.32, "#86a373"]]) h.bus(x, -0.02, c, Math.PI / 2); h.person(-0.42, 0.35, sh(r)); },
      (p, h, a, r) => { h.slab(1, 0.84, C.grass); p("box", 0, 0.015, 0.05, 1, 0.025, 0.2, "#7d7f84"); p("rbox", -0.1, 0.08, 0.05, 0.24, 0.12, 0.12, C.white); p("box", -0.1, 0.1, 0.05, 0.2, 0.04, 0.122, C.glass, 0, 0, 0, true); p("box", -0.1, 0.06, 0.05, 0.245, 0.02, 0.125, a);
        for (const dx of [-0.07, 0.07]) p("cyl", -0.1 + dx, 0.025, 0.05, 0.05, 0.03, 0.05, C.dark, 0, Math.PI / 2); p("cone", -0.3, 0.2, -0.28, 0.5, 0.4, 0.3, "#9fae87"); p("cone", 0.15, 0.25, -0.3, 0.6, 0.5, 0.3, "#90a37a"); h.tree(0.35, -0.22, 0.6, "cone"); h.house(0.3, 0.3, 0.2, 0.14, 0.14, C.cream, a, { win: false }); h.person(0.12, 0.22, sh(r)); },
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.road(1, 0.24, 0.2); p("box", 0, 0.24, -0.2, 0.5, 0.02, 0.16, a); h.box(0, 0, -0.27, 0.48, 0.24, 0.015, C.glass); p("box", 0.12, 0.13, -0.26, 0.18, 0.14, 0.012, C.white, 0, 0, 0, true); for (let k = 0; k < 3; k++) h.person(-0.15 + k * 0.1, -0.15, sh(r, k)); h.bench(-0.1, -0.22); h.bus(-0.1, 0.2, a, Math.PI); }],
    nursery: [K.nursery,
      (p, h, a, r) => { h.slab(1, 0.84, "#efe3c8"); p("box", -0.18, 0.02, 0.12, 0.4, 0.03, 0.34, "#e8d39a"); p("dome", 0.25, 0, 0.1, 0.32, 0.26, 0.32, C.white); for (let k = 0; k < 6; k++) p("torus", 0.25, 0.04 + k * 0.025, 0.1, 0.33 - k * 0.04, 0.33 - k * 0.04, 0.4, [a, C.yellow, C.red][k % 3], 0, Math.PI / 2);
        h.house(-0.2, -0.25, 0.42, 0.22, 0.2, C.white, C.yellow); for (let k = 0; k < 3; k++) h.person(-0.28 + k * 0.1, 0.12, sh(r, k), k, 0.55); h.person(0.4, 0.32, C.dark); h.fence(-0.45, 0.45, 0.4); },
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.house(0, -0.08, 0.86, 0.5, 0.32, C.white, a, { roof: "flat", win: false }); h.windows(0, 0.04, -0.08, 0.8, 0.26, 0.5, 4, 1); for (let k = 0; k < 5; k++) { const x = -0.34 + k * 0.17; h.box(x, 0.32, 0.12, 0.004, 0.14, 0.004, C.dark); h.ball(x, 0.48, 0.12, 0.05, [C.red, C.yellow, C.sky, C.pink, a][k]); }
        h.person(-0.1, 0.3, C.pink, 0, 0.6); h.person(0.05, 0.3, sh(r), 0, 0.6); h.person(0.2, 0.28, C.dark); },
      (p, h, a, r) => { h.slab(1, 0.84, C.grass); p("cyl", 0, 0.03, 0, 0.66, 0.05, 0.66, C.white); h.cyl(0, 0.05, 0, 0.03, 0.42, C.yellow); p("cone", 0, 0.52, 0, 0.74, 0.18, 0.74, a); for (let k = 0; k < 6; k++) { const t = k / 6 * Math.PI * 2; h.box(Math.cos(t) * 0.24, 0.05, Math.sin(t) * 0.24, 0.012, 0.36, 0.012, C.white); p("rbox", Math.cos(t) * 0.24, 0.16, Math.sin(t) * 0.24, 0.07, 0.07, 0.1, [C.red, C.sky, C.yellow][k % 3], -t); }
        h.person(0.42, 0.3, sh(r)); h.person(-0.42, 0.3, C.pink, 0, 0.6); h.tree(0.4, -0.3, 0.6); }],
    elder: [K.elder,
      (p, h, a, r) => { h.slab(1, 0.84, C.grass); h.house(-0.15, -0.22, 0.6, 0.28, 0.24, C.cream, a); p("cyl", 0.05, 0.015, 0.15, 0.6, 0.02, 0.45, C.stone); for (let k = 0; k < 5; k++) { const t = k / 5 * Math.PI * 2; h.person(0.05 + Math.cos(t) * 0.17, 0.15 + Math.sin(t) * 0.13, k % 2 ? "#c8a46a" : "#8a8a8a", -t); } h.tree(0.4, -0.25, 0.7); h.bush(-0.4, 0.3, 0.8, "#d77a91"); },
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.rbox(-0.2, 0, -0.1, 0.3, 0.34, 0.24, a); p("box", -0.2, 0.2, 0.025, 0.22, 0.14, 0.012, C.white, 0, 0, 0, true); h.coin(-0.2, 0.42, -0.1); p("rbox", 0.22, 0.08, 0.2, 0.32, 0.13, 0.15, C.white); p("box", 0.22, 0.1, 0.2, 0.3, 0.035, 0.152, a);
        for (const dx of [-0.1, 0.1]) p("cyl", 0.22 + dx, 0.025, 0.2, 0.05, 0.03, 0.05, C.dark, 0, Math.PI / 2); h.person(0, 0.15, "#8a8a8a"); h.box(0.06, 0, 0.16, 0.012, 0.09, 0.012, C.woodD); h.person(-0.38, 0.28, "#c8a46a"); h.tree(0.4, -0.3, 0.6); },
      (p, h, a, r) => { h.slab(1, 0.84, "#efe6d6"); h.house(0, -0.15, 0.7, 0.4, 0.3, C.white, a); h.crossMark(0.22, 0.24, 0.056, C.red); p("rbox", -0.15, 0.06, 0.24, 0.1, 0.1, 0.1, C.sky); for (const dx of [-0.04, 0.04]) p("torus", -0.15 + dx, 0.03, 0.29, 0.06, 0.06, 0.06, C.dark); h.person(-0.15, 0.24, "#8a8a8a"); h.person(-0.02, 0.3, C.white); h.bush(0.35, 0.3); }],
    industry: [K.industry,
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.tower(-0.22, -0.12, 0.34, 0.3, 0.44, C.white, a, 3); h.tower(0.2, -0.15, 0.3, 0.26, 0.3, "#dfe5e8", a, 2); for (let k = 0; k < 4; k++) h.car(-0.3 + k * 0.18, 0.28, [a, C.white, C.dark, C.yellow][k], Math.PI / 2); h.tree(0.4, 0.15, 0.6); h.person(0.05, 0.12, sh(r)); },
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.house(-0.1, -0.12, 0.72, 0.4, 0.3, "#d5d0c6", C.steel, { win: false }); for (let k = 0; k < 3; k++) p("box", -0.32 + k * 0.22, 0.12, 0.081, 0.16, 0.22, 0.012, C.dark);
        for (let k = 0; k < 3; k++) p("box", -0.3 + k * 0.17, 0.08, 0.3, 0.15, 0.13, 0.11, ["#d9573f", "#3e7c8c", C.yellow][k]); p("rbox", 0.3, 0.07, 0.24, 0.24, 0.12, 0.12, C.white); p("rbox", 0.42, 0.06, 0.24, 0.08, 0.1, 0.12, a); h.person(0.1, 0.18, "#f08a3c"); },
      (p, h, a, r) => { h.slab(1, 0.84, C.grass); for (const [x, z, ht] of [[-0.25, -0.15, 0.9], [0.05, -0.2, 1.15], [0.3, -0.05, 0.75]]) h.tower(x, z, 0.2, 0.2, ht, C.glass, a, 7); p("box", -0.05, 0.015, 0.25, 0.8, 0.012, 0.12, C.stone); h.tree(-0.38, 0.3, 0.6); h.tree(0.38, 0.32, 0.6); h.person(0.05, 0.26, sh(r)); }],
    tech: [K.tech,
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.box(0, 0, -0.1, 0.8, 0.26, 0.38, "#dfe3e6"); for (let k = 0; k < 7; k++) p("box", -0.33 + k * 0.11, 0.13, 0.091, 0.07, 0.18, 0.012, C.dark); for (let k = 0; k < 4; k++) h.cyl(-0.3 + k * 0.2, 0.26, -0.1, 0.06, 0.06, C.steel);
        h.box(0.3, 0, 0.28, 0.02, 0.4, 0.02, C.steel); p("box", 0.3, 0.42, 0.28, 0.16, 0.012, 0.012, C.steel); h.person(-0.2, 0.28, sh(r)); h.lamp(-0.4, 0.3); },
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); p("dome", -0.1, 0.02, -0.1, 0.6, 0.4, 0.6, C.white); p("torus", -0.1, 0.05, -0.1, 0.62, 0.62, 0.3, a, 0, Math.PI / 2); h.box(0.32, 0, -0.25, 0.1, 0.55, 0.1, C.white); p("sphere", 0.32, 0.6, -0.25, 0.14, 0.14, 0.14, a);
        for (let k = 0; k < 3; k++) { h.box(-0.3 + k * 0.25, 0, 0.3, 0.012, 0.18, 0.012, C.dark); p("box", -0.3 + k * 0.25, 0.2, 0.3, 0.14, 0.09, 0.012, C.sky, 0, 0, 0, true); } h.person(0.15, 0.2, sh(r)); },
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.house(-0.15, -0.1, 0.6, 0.38, 0.22, C.white, a, { roof: "flat" }); for (let k = 0; k < 6; k++) p("box", -0.35 + (k % 3) * 0.2, 0.25, -0.2 + Math.floor(k / 3) * 0.18, 0.16, 0.012, 0.14, "#2f4e7a", 0, 0, 0.3);
        p("rbox", 0.3, 0.42, 0.25, 0.08, 0.025, 0.08, C.dark); for (const [dx, dz] of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]]) p("cyl", 0.3 + dx, 0.44, 0.25 + dz, 0.06, 0.005, 0.06, C.steel); h.person(0.3, 0.25, sh(r)); }],
    renewal: [K.renewal,
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.tower(-0.22, -0.05, 0.3, 0.3, 0.36, "#c9bfae", "#8d8475", 3); p("box", -0.22, 0.38, -0.05, 0.3, 0.02, 0.3, "#8d8475"); h.tower(0.2, -0.08, 0.34, 0.34, 0.85, C.wall, a, 6);
        p("prism", -0.02, 0.28, 0.25, 0.12, 0.06, 0.08, C.red, Math.PI / 2); h.person(-0.05, 0.3, sh(r)); h.tree(-0.4, 0.3, 0.6); },
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.tower(-0.08, -0.05, 0.5, 0.36, 0.55, "#e7dccb", C.red, 4); h.box(0.25, 0, 0.0, 0.14, 0.62, 0.14, C.glass); p("box", 0.25, 0.3, 0.0, 0.1, 0.12, 0.1, a, 0, 0, 0, true); p("box", 0.25, 0.63, 0, 0.16, 0.02, 0.16, a);
        h.person(0.3, 0.25, "#8a8a8a"); h.person(-0.2, 0.28, sh(r)); h.bush(-0.4, 0.3); }],
    school: [K.school,
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.box(0, 0, -0.3, 0.86, 0.32, 0.04, C.cream); p("box", 0, 0.18, -0.275, 0.4, 0.16, 0.01, "#2f4a3a"); for (let row = 0; row < 3; row++) for (let k = 0; k < 4; k++) { const x = -0.3 + k * 0.2, z = -0.1 + row * 0.16; h.box(x, 0, z, 0.12, 0.06, 0.07, C.wood); h.person(x, z + 0.06, sh(r, row + k), Math.PI, 0.55); }
        h.person(0.32, -0.22, C.dark); },
      (p, h, a, r) => { h.slab(1, 0.84, C.grass); h.house(-0.18, -0.15, 0.5, 0.36, 0.3, "#c8553d", C.dark); h.box(0.22, 0, -0.22, 0.16, 0.7, 0.16, "#c8553d"); p("cone4", 0.22, 0.78, -0.22, 0.18, 0.16, 0.18, C.dark); p("cyl", 0.22, 0.6, -0.139, 0.09, 0.012, 0.09, C.white, 0, Math.PI / 2);
        for (let k = 0; k < 3; k++) h.person(-0.2 + k * 0.15, 0.25, sh(r, k)); h.tree(0.4, 0.3, 0.6); }],
    apartment: [K.apartment,
      (p, h, a, r) => { h.slab(1, 0.84, C.grass); h.tower(0, -0.28, 0.86, 0.2, 0.55, C.wall, a, 4); h.tower(-0.33, 0.04, 0.2, 0.44, 0.55, C.wall, a, 4); h.tower(0.33, 0.04, 0.2, 0.44, 0.55, C.wall, a, 4); h.tree(0, 0.05, 0.6); h.bench(0, 0.22); h.person(0.08, 0.25, sh(r)); },
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); for (let k = 0; k < 4; k++) h.house(-0.33 + k * 0.22, -0.05, 0.2, 0.34, 0.3, ["#efe1c8", "#f3ebdf", "#e8d6c0", "#f6efe2"][k], [a, C.red, a, "#7d6a5a"][k], { ridgeZ: true }); h.tree(0.4, 0.32, 0.5); h.person(-0.1, 0.3, sh(r)); }],
    maternity: [K.maternity,
      (p, h, a, r) => { h.slab(1, 0.84, C.grass); p("cyl", -0.1, 0.012, 0.05, 0.4, 0.02, 0.3, C.water); for (const [x, z] of [[0.2, 0.2], [-0.3, 0.25]]) { p("rbox", x, 0.07, z, 0.12, 0.08, 0.08, [C.pink, C.sky][x > 0 ? 0 : 1]); for (const dx of [-0.04, 0.04]) p("torus", x + dx, 0.025, z, 0.04, 0.04, 0.04, C.dark); h.person(x - 0.1, z, C.pink); }
        h.house(0.25, -0.22, 0.3, 0.22, 0.2, C.white, C.pink); h.heart(0.25, 0.3, -0.105); h.tree(-0.4, -0.3, 0.7); }],
    airport: [K.airport,
      (p, h, a, r) => { h.slab(1, 0.9, C.stone); p("box", -0.05, 0.1, -0.15, 0.8, 0.2, 0.3, C.white); p("cyl", -0.05, 0.2, -0.15, 0.3, 0.8, 0.3, C.glass, 0, 0, Math.PI / 2); for (let k = 0; k < 3; k++) p("box", -0.3 + k * 0.25, 0.1, 0.0, 0.04, 0.04, 0.2, C.steel);
        p("rbox", 0.05, 0.08, 0.28, 0.42, 0.06, 0.06, C.white); p("box", 0.05, 0.08, 0.28, 0.1, 0.012, 0.42, C.white); p("box", -0.13, 0.13, 0.28, 0.06, 0.1, 0.012, a); }],
    hospital: [K.hospital,
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.tower(0, -0.1, 0.7, 0.4, 0.62, C.white, C.stone, 4); p("cyl", 0.1, 0.65, -0.1, 0.3, 0.02, 0.3, C.dark); p("box", 0.1, 0.665, -0.1, 0.12, 0.004, 0.03, C.white); p("box", 0.1, 0.665, -0.1, 0.03, 0.004, 0.12, C.white);
        h.crossMark(-0.2, 0.5, 0.106, C.red); p("rbox", -0.25, 0.07, 0.28, 0.22, 0.12, 0.12, C.white); p("box", -0.25, 0.07, 0.28, 0.222, 0.025, 0.122, C.red); h.person(0.25, 0.28, C.sky); }],
    canteen: [K.canteen,
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); h.house(-0.15, -0.18, 0.6, 0.3, 0.24, C.white, a, { roof: "flat" }); p("rbox", 0.22, 0.09, 0.2, 0.36, 0.15, 0.16, C.white); p("box", 0.12, 0.11, 0.2, 0.14, 0.13, 0.162, "#86a373");
        for (let k = 0; k < 4; k++) p("box", 0.3 + (k % 2) * 0.08, 0.2, 0.15 + Math.floor(k / 2) * 0.08, 0.07, 0.05, 0.06, ["#e86a6a", "#9fb58a", "#f0c64a", "#e48b5c"][k]); for (const dx of [-0.1, 0.1]) p("cyl", 0.22 + dx, 0.025, 0.2, 0.05, 0.03, 0.05, C.dark, 0, Math.PI / 2); h.person(-0.05, 0.25, "#c8a46a"); }],
    road: [K.road,
      (p, h, a, r) => { h.slab(1, 0.84, C.stone); p("box", 0, 0.014, 0.05, 1, 0.026, 0.32, C.road); p("box", 0, 0.03, 0.05, 1, 0.004, 0.3, "#b2564a"); h.zebra(0, 0.05, 0.3, 1); p("box", -0.3, 0.035, 0.05, 0.08, 0.02, 0.3, C.yellow);
        for (let k = 0; k < 4; k++) h.person(-0.06 + k * 0.04, 0.05 + (k % 2) * 0.06 - 0.03, C.yellow, Math.PI / 2, 0.55); p("box", 0.3, 0.22, -0.2, 0.12, 0.12, 0.012, C.white); h.box(0.3, 0, -0.2, 0.012, 0.16, 0.012, C.dark); h.house(-0.2, -0.28, 0.4, 0.16, 0.2, C.cream, a); h.tree(0.4, 0.32, 0.6); },
      (p, h, a, r) => { h.slab(1, 0.84, "#d9cdb8"); for (const z of [-0.25, 0.25]) { for (let k = 0; k < 3; k++) h.house(-0.3 + k * 0.3, z, 0.26, 0.16, 0.28, ["#efe1c8", "#f3ebdf", "#e8d6c0"][k], [a, C.red, "#7d6a5a"][k], { roof: "flat" }); }
        for (let k = 0; k < 3; k++) h.tree(-0.3 + k * 0.3, 0, 0.5); for (let k = 0; k < 3; k++) h.person(-0.15 + k * 0.15, 0.05 * (k % 2 ? 1 : -1), sh(r, k), Math.PI / 2); }],
  };
  MODELS.variants = V;
}
