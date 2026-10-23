/* ===== fill the city: a policy plaza in each neighbourhood, a BuildIt skyline around it, streets, highway, port, landmarks ===== */
const ITEMS3D = new Map();     // itemId -> {isl, x, z, size, box(Box3 world, unlifted), kind, hero}
const LANDMARKS3D = [], LAMP_POOLS = [], LAMP_BEAMS = [];
{
  const unit = new THREE.Box3(new THREE.Vector3(-0.5, -0.5, -0.5), new THREE.Vector3(0.5, 0.5, 0.5));
  /* cities not built yet: a tidy construction site */
  const site = (isl) => {
    const R1 = rng(hash(isl.id)), ctx = ctxFor(isl.id, null, 0, 0, 1, 0), p = (g, ...a) => part(ctx, g, ...a);
    const Y = "#f0b429", GR = "#9aa0a6";
    const crane = (x, z, h, ry) => {
      for (let y = 0; y < h; y += 0.18) { p("box", x, y + 0.09, z, 0.1, 0.18, 0.1, Y); p("box", x, y + 0.09, z, 0.12, 0.02, 0.12, "#c98f12"); }
      p("box", x + Math.cos(ry) * 0.45, h + 0.04, z - Math.sin(ry) * 0.45, 1.4, 0.06, 0.08, Y, ry);
      p("box", x - Math.cos(ry) * 0.35, h + 0.0, z + Math.sin(ry) * 0.35, 0.22, 0.16, 0.16, "#5d656d", ry);
      p("box", x, h + 0.12, z, 0.16, 0.14, 0.16, "#f8f6f1");
      p("box", x + Math.cos(ry) * 1.0, h - 0.25, z - Math.sin(ry) * 1.0, 0.01, 0.5, 0.01, "#3b4148");
    };
    const frame = (x, z, w, d, h) => {
      p("box", x, 0.03, z, w + 0.1, 0.06, d + 0.1, "#b5b0a6");
      for (let y = 0.2; y <= h; y += 0.2) p("box", x, y, z, w, 0.03, d, "#d7d3cb");
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) p("box", x + dx * w / 2, h / 2, z + dz * d / 2, 0.04, h, 0.04, GR);
      p("box", x, h * 0.45, z + d / 2 + 0.01, w * 0.9, h * 0.7, 0.01, "#f08a3c");
    };
    const n = 1 + (R1() < 0.5 ? 1 : 0);
    frame(-0.35, 0.15, 0.7, 0.6, 0.5 + R1() * 0.5);
    if (n > 1) frame(0.55, -0.4, 0.5, 0.5, 0.3 + R1() * 0.3);
    crane(0.5 + R1() * 0.2, 0.45, 1.3 + R1() * 0.5, R1() * Math.PI * 2);
    for (let k = 0; k < 3; k++) p("box", -0.7 + k * 0.12, 0.05 + k * 0.0, -0.75, 0.5, 0.06, 0.1, "#a8794f");
    p("rbox", -0.95, 0.09, -0.3, 0.3, 0.14, 0.18, Y); p("box", -0.8, 0.2, -0.3, 0.3, 0.04, 0.05, Y, 0, 0, -0.6);
    for (let k = 0; k < 5; k++) { const a = k * 1.25, x = Math.cos(a) * 1.25, z = Math.sin(a) * 1.25; p("cone", x, 0.08, z, 0.08, 0.16, 0.08, "#f08a3c"); p("cyl", x, 0.09, z, 0.06, 0.03, 0.06, "#ffffff"); }
    for (const [x, z, ry] of [[0, -1.05, 0], [0, 1.05, 0], [-1.05, 0, Math.PI / 2], [1.05, 0, Math.PI / 2]]) p("box", x, 0.07, z, 1.6, 0.12, 0.03, (x + z) > 0 ? "#f0c64a" : "#ffffff", ry);
  };


  const pk = (r, a) => a[(r() * a.length) | 0];
  const GLASS = ["#7fd4ec", "#5fa8e4", "#9fd2f2", "#bfe6f6", "#6fc2dc", "#8fb8e8"]; // glass-curtain blues
  const NEON = ["#33e1ff", "#7fb4ff", "#b8f0ff", "#9f8bff"];                          // cool LED accents
  const WALLS = ["#d9c7ab", "#b9c5cc", "#d2d2c0", "#c8aa8d", "#d3c7b7"];              // warm future white
  const ROOFS = ["#c96a4e", "#4e7d9e", "#8a6a4a", "#5b6b7d", "#b9c4ce"];              // clear mid-tone anchors: terracotta, steel blue, deep wood, slate
  /* rooftop solar array: one dark cell slab with a lighter grid sheet, slightly tilted toward the sun */
  const SOLAR = (p, x, y, z, w, d, ry = 0) => { p("box", x, y + 0.028, z, w, 0.016, d, "#22304e", ry, 0, -0.1); p("box", x, y + 0.04, z, w * 0.94, 0.006, d * 0.86, "#3f6cae", ry, 0, -0.1); };

  /* ---------- building kit (local to the building, y=0 at street level + curb) ---------- */
  const B = {
    tower(p,s,h,r) {
      const glass=pk(r,["#38677d","#467c94","#5e8a9c","#42778b"]),wall=pk(r,["#d4d5ce","#dce2df","#b9c5c9"]),d=s*.8;
      // A broad mixed-use podium supports a stepped commercial tower, rather than a needle.
      p("foffice",0,.13,0,s*1.1,.26,d*1.1,wall);
      p("fglass",0,.14,d*.56,s*.85,.17,.025,glass);
      p("box",0,.29,0,s*1.13,.055,d*1.13,"#87969c");
      const variant=Math.floor(r()*4);
      if(variant===0){
        // Terraced volumes: public podium, generous office floors and a smaller sky pavilion.
        for(let i=0;i<3;i++){
          const w=s*(.92-i*.19),hh=h*(i===0?.48:i===1?.33:.19),y=.3+h*(i===0?0:i===1?.48:.81)+hh/2;
          p("fglass",s*i*.07,y,-d*i*.06,w,hh,d*(.92-i*.13),glass);
          p("box",s*i*.07,y+hh/2+.025,-d*i*.06,w*1.04,.05,d*(.96-i*.13),"#bdcbd0");
        }
      }else if(variant===1){
        // A paired research/business silhouette with a shared sky lobby.
        for(const [x,k] of [[-.25,.86],[.25,1.08]]){
          p("fglass",x*s,.3+h*k/2,0,s*.38,h*k,d*.84,glass);
          p("box",x*s,.33+h*k,0,s*.42,.06,d*.9,"#aebfc6");
        }
        p("fglass",0,.3+h*.67,0,s*.86,h*.13,d*.36,"#6b9aa8");
        p("box",0,.3+h*.74,0,s*.9,.035,d*.39,"#d2dbd9");
      }else if(variant===2){
        // Cylindrical atrium tower with a deliberate crown and restrained floor bands.
        p("cyl",0,.3+h/2,0,s*.88,h,s*.88,glass);
        for(let y=.3;y<h+.3;y+=.23)p("cyl",0,y,0,s*.9,.022,s*.9,"#b9cbd0");
        p("cyl",0,h+.33,0,s*.95,.06,s*.95,"#c9d2ce");
        p("cyl",0,h+.43,0,s*.64,.17,s*.64,"#557c8e");
      }else{
        p("fglass",0,.3+h/2,-d*.05,s*.86,h,d*.86,glass);
        for(const x of [-.43,.43])p("box",x*s,.3+h/2,-d*.05,s*.035,h,d*.9,"#c5d3d9");
        p("fglass",s*.08,h+.37+h*.08,-d*.08,s*.62,h*.16,d*.63,glass);
        p("box",s*.08,h*1.16+.4,-d*.08,s*.67,.05,d*.68,"#becbd0");
      }
      const roof=h*1.16+.43;
      for(const side of [-1,1]){const x=variant===1?side*.25:side*.15,top=variant===1?.3+h*(side<0?.86:1.08):variant===2?h+.52:variant===3?h*1.16+.43:h+.35;p("box",s*x,top+.045,-d*.08,s*.19,.09,d*.25,"#71818c");p("cyl",s*x,top+.1,-d*.08,s*.13,.025,s*.13,"#3b4f5e");}
      p("box",0,.235,d*.58,s*.7,.025,.012,"#a9d5df",0,0,0,"cool");
      return roof+.15;
    },
    urban(p,s,h,r,zone) {
      const wall=pk(r,["#c9b393","#b5c3cd","#cfcec1","#c2a993"]),d=s*.78;
      if(zone==="commercial"){return B.tower(p,s,h,r);}
      p("box",0,.025,0,s*1.08,.05,d*1.1,"#b9b6a8");
      if(zone==="residential"){
        // Two wings frame a planted communal courtyard; balconies establish a residential rhythm.
        p("fapt",-s*.25,h/2+.06,0,s*.43,h,d,wall);
        p("fapt",s*.22,h*.42+.06,-d*.15,s*.42,h*.84,d*.7,pk(r,["#c4b39c","#d4d2bf","#aebcc6"]));
        p("box",-s*.25,h+.09,0,s*.47,.06,d*1.03,"#705f54");
        p("box",s*.22,h*.84+.09,-d*.15,s*.46,.06,d*.75,"#7a8e93");
        p("turf",s*.2,.055,d*.39,s*.43,.025,d*.28,"#ffffff");
        for(let y=.24;y<h;y+=.27)p("box",-s*.25,y,d*.52,s*.4,.025,d*.13,"#e7e3d8");
      }else if(zone==="technology"){
        p("foffice",0,h*.22+.06,0,s,h*.44,d,"#a7b7c4");
        p("fglass",-s*.2,h*.5+.06,-d*.12,s*.47,h,d*.7,"#437585");
        if(r()>.45){p("fglass",s*.29,h*.38+.06,-d*.24,s*.29,h*.76,d*.45,"#557d8b");p("fglass",s*.04,h*.68,-d*.24,s*.55,.1,d*.22,"#8aafb8");}
        p("box",0,h*.44+.1,0,s*1.02,.06,d*1.02,"#778b9b");
        SOLAR(p,s*.22,h*.44+.15,d*.1,s*.42,d*.55);
        for(const x of [-.15,.1,.35])p("cyl",x*s,h*.44+.18,-d*.27,s*.13,.13,s*.13,"#8c9ca3");
      }else if(zone==="public"){
        p("foffice",0,h*.38+.06,0,s,h*.76,d*.65,"#dbd6be");
        p("foffice",-s*.32,h*.5+.06,0,s*.3,h,d,"#c7cfce");
        p("box",0,h*.76+.09,0,s*1.03,.06,d*.7,"#4e8790");
        p("box",0,.18,d*.45,s*.57,.035,d*.25,"#76a5ad");
        p("box",s*.3,h*.5,d*.33,s*.08,h*.28,.012,"#4c92a3");
        p("box",s*.3,h*.5,d*.34,s*.24,h*.08,.012,"#4c92a3");
      }else if(zone==="culture"){
        p("foffice",0,h*.32+.05,0,s,h*.64,d,"#c5a07c");
        p("dome",0,h*.64+.07,0,s*1.05,h*.55,d*1.05,"#789497");
        for(const x of [-.32,0,.32]){p("box",x*s,.15,d*.51,s*.25,.2,.012,"#486b79");p("prism",x*s,.3,d*.57,s*.3,.08,d*.2,pk(r,["#bb7650","#cdac61","#648a84"]));}
      }else{
        p("foffice",-s*.2,h*.3+.05,0,s*.55,h*.6,d,"#9baea3");
        SOLAR(p,-s*.2,h*.6+.09,0,s*.5,d*.8);
        for(const z of [-.22,.22]){p("cyl",s*.27,.13,z*d,s*.38,.25,s*.38,"#a1b5ba");p("cyl",s*.27,.27,z*d,s*.32,.018,s*.32,"#4e9cab");}
        p("cyl",s*.25,h*.55,-d*.32,.025,h*1.1,.025,"#d7deda");
        p("box",s*.25,h*1.1,-d*.32,s*.55,.025,.03,"#b8d6dc",0,0,-.15);
      }
      return h+.2;
    },
    architecture(p,s,h,r,form,zone) {
      const d=s*.8,wall=pk(r,["#d5bd9c","#acbec7","#c9c9bb","#c39d80"]),glass=pk(r,["#47788a","#5b8698","#69949e"]);
      const facade=zone==="residential"?"fapt":"foffice";
      if(form==="tower")return B.tower(p,s,h,r);
      const legacy={residence:"residential",laboratory:"technology",civic:"public",gallery:"culture",water:"environment"};
      if(legacy[form])return B.urban(p,s,h,r,legacy[form]);
      p("box",0,.025,0,s*1.08,.05,d*1.08,"#b8b5a8");
      if(form==="courtyard"){
        // Perimeter wings around a real entrance court, instead of three isolated point towers.
        for(const x of [-.36,.36]){
          p(facade,x*s,.06+h*.5,0,s*.24,h,d,wall);
          p("box",x*s,h+.09,0,s*.27,.055,d*1.03,"#637b80");
        }
        p(facade,0,.06+h*.35,-d*.37,s*.62,h*.7,d*.25,wall);
        p("box",0,.065,d*.1,s*.38,.025,d*.45,"#d4c4a5");
        p("box",0,.25,d*.42,s*.47,.035,d*.16,"#7e9ea4");
      }else if(form==="terrace"){
        for(let i=0;i<3;i++){
          const depth=d*(1-i*.23),hh=h*(.45-i*.06),y=.06+(i===0?0:i===1?h*.45:h*.84)+hh/2;
          p(facade,-s*.08*i,y,-d*.12*i,s*(1-i*.16),hh,depth,wall);
          p("box",-s*.08*i,y+hh/2+.025,-d*.12*i,s*(1.03-i*.16),.05,depth*1.03,"#6f8b8d");
          p("turf",s*.2,y+hh/2+.055,d*(.34-i*.16),s*.3,.015,d*.12,"#ffffff");
        }
      }else if(form==="atrium"){
        p(facade,-s*.32,h*.5+.06,0,s*.32,h,d,wall);
        p(facade,s*.29,h*.38+.06,0,s*.34,h*.76,d,"#c6c9bb");
        p("fglass",0,h*.31+.06,0,s*.3,h*.62,d*.86,glass);
        p("prism",0,h*.67+.08,0,s*.34,h*.14,d*.9,"#87a9b2");
        p("box",0,.2,d*.5,s*.63,.03,d*.2,"#98b0b3");
      }else if(form==="datacenter"){
        p("fglass",-s*.12,h*.4+.06,0,s*.75,h*.8,d,"#334d62");
        for(let y=.16;y<h*.8;y+=.14)p("box",-s*.12,y,d*.51,s*.76,.018,.02,"#7b98a8");
        p("foffice",s*.38,h*.25+.06,0,s*.22,h*.5,d*.72,"#b3c4c9");
        for(const x of [-.3,0,.25]){p("box",x*s,h*.8+.13,0,s*.18,.13,d*.4,"#8a9b9f");p("cyl",x*s,h*.8+.21,0,s*.12,.025,s*.12,"#41535e");}
        p("box",0,.11,d*.53,s*.5,.035,.018,"#8bd4dc",0,0,0,"cool");
      }else if(form==="hall"){
        p("fglass",0,h*.25+.06,0,s,h*.5,d*.88,glass);
        for(const side of [-1,1])p("prism",side*s*.22,h*.6+.05,0,s*.62,h*.46,d*1.1,"#dedacc",0,0,side*.13);
        p("box",0,.075,d*.54,s*1.04,.025,d*.16,"#ae9c80");
      }else if(form==="arcade"||form==="workshop"){
        const colour=form==="workshop"?"#bc8d6a":wall;
        p(facade,0,h*.45+.06,-d*.09,s,h*.9,d*.72,colour);
        p("box",0,h*.9+.095,-d*.09,s*1.03,.055,d*.76,"#727d7b");
        for(const x of [-.35,0,.35]){
          p("fglass",x*s,.18,d*.29,s*.24,.23,.015,glass);
          p("box",x*s,.16,d*.48,.025,.29,.025,"#d4cbb6");
        }
        p("box",0,.33,d*.42,s*1.04,.04,d*.37,"#aa815f");
        if(form==="workshop")for(const x of [-.3,0,.3])p("prism",x*s,h+.08,-d*.12,s*.31,.18,d*.72,"#8ba6aa");
      }else if(form==="energy"){
        p("foffice",-s*.27,h*.4+.06,-d*.15,s*.43,h*.8,d*.65,"#9cbbc0");
        p("box",s*.18,.4,d*.08,s*.67,.045,d*.72,"#658e9c");
        for(const x of [0,.38])for(const z of [-.22,.32])p("cyl",x*s,.2,z*d,.024,.39,.024,"#b6c5c6");
        SOLAR(p,s*.18,.44,d*.08,s*.62,d*.66);
        for(const x of [.05,.28,.49])p("rbox",x*s,.15,-d*.38,s*.15,.27,d*.18,"#b9c4b8");
      }
      return h*1.3+.2;
    },
    office(p, s, h, r) {
      const d = s * (0.78 + r() * 0.22), wall = pk(r, WALLS), band = pk(r, ROOFS);
      p("rbox", 0, 0.035, 0, s * 1.14, 0.07, d * 1.14, "#f6f4ec");                   // plinth
      p(r() < 0.55 ? "foffice" : "fapt", 0, 0.07 + h / 2, 0, s, h, d, wall);
      p("box", 0, 0.07 + h + 0.028, 0, s * 1.05, 0.056, d * 1.05, "#f4f2e9");        // parapet
      p("box", 0, 0.07 + h + 0.06, 0, s * 0.96, 0.012, d * 0.96, band);             // roof trim band
      const roof = 0.07 + h + 0.075, kk = r();
      if (kk < 0.4) SOLAR(p, 0, roof, 0, s * 0.68, d * 0.58);                        // rooftop solar farm
      else if (kk < 0.72) { p("turf", 0, roof + 0.012, 0, s * 0.72, 0.024, d * 0.6, "#ffffff"); p("ico1", s * 0.2, roof + 0.08, -d * 0.12, 0.11, 0.09, 0.11, "#739c5f"); p("ico1", -s * 0.22, roof + 0.07, d * 0.1, 0.09, 0.08, 0.09, "#8bab6f"); } // sky garden
      else { p("box", -s * 0.2, roof + 0.05, -d * 0.15, s * 0.3, 0.1, d * 0.3, "#dfe5ec"); p("cyl", s * 0.24, roof + 0.06, d * 0.18, 0.1, 0.12, 0.1, "#c9ced3"); } // mech penthouse
      p("box", 0, 0.17, d / 2 + 0.045, s * 0.5, 0.016, 0.1, "#f6f4ec", 0, -0.25);    // entrance canopy
      p("box", 0, 0.1, d / 2 + 0.008, s * 0.32, 0.15, 0.012, "#cfeefc", 0, 0, 0, true); // glass lobby door
      if (r() < 0.55) p("box", s * 0.18, 0.07 + h * 0.82, d / 2 + 0.012, s * 0.42, 0.045, 0.012, pk(r, NEON), 0, 0, 0, "cool");
      return h + 0.3;
    },
    house(p, s, h, r) {
      const n = s > 0.6 ? 2 : 1;
      p("rbox", 0, 0.02, 0, s * 1.05, 0.04, s * 0.92, "#f2f4f0");                    // tidy plot base
      for (let k = 0; k < n; k++) { const x = n > 1 ? (k - 0.5) * s * 0.5 : 0, w = n > 1 ? s * 0.46 : s * 0.8, hh = 0.24 + r() * 0.12, roof = pk(r, ROOFS);
        p("rbox", x, 0.04 + hh / 2, 0, w, hh, s * 0.7, pk(r, WALLS));
        if (r() < 0.45) { p("box", x, 0.04 + hh + 0.02, 0, w + 0.04, 0.04, s * 0.72, roof); SOLAR(p, x, 0.04 + hh + 0.04, 0, w * 0.58, s * 0.38); } // flat roof + home solar
        else { p("prism", x, 0.04 + hh + 0.075, 0, w + 0.05, 0.15, s * 0.74, roof); p("box", x, 0.04 + hh + 0.006, 0, w + 0.07, 0.014, s * 0.76, "#ffffff"); } // gable + white eave trim
        p("box", x, 0.04 + hh * 0.45, s * 0.35 + 0.006, w * 0.5, hh * 0.32, 0.012, "#fff1c8", 0, 0, 0, true);
        p("box", x, 0.115, s * 0.35 + 0.03, w * 0.3, 0.012, 0.07, "#ffffff"); }      // door canopy
      return 0.55;
    },
    shop(p, s, h, r) {
      const hh = 0.34 + r() * 0.18, d = s * 0.8, aw = pk(r, ["#6fd0dc", "#5fa8e0", "#f8f6f1", "#9fd0f0"]);
      p("rbox", 0, 0.025, 0, s * 1.08, 0.05, d * 1.08, "#f6f4ec");
      p("rbox", 0, 0.05 + hh / 2, 0, s, hh, d, pk(r, WALLS));
      p("box", 0, 0.05 + hh + 0.02, 0, s * 1.03, 0.04, d * 1.03, "#f4f2e9");         // parapet
      p("box", 0, 0.17, d / 2 + 0.006, s * 0.86, 0.2, 0.012, "#cfeefc", 0, 0, 0, true); // storefront glass
      p("box", 0, 0.28, d / 2 + 0.05, s * 0.92, 0.016, 0.1, aw, 0, -0.3);            // awning
      p("box", 0, 0.05 + hh * 0.82, d / 2 + 0.012, s * 0.55, 0.05, 0.012, pk(r, NEON), 0, 0, 0, "cool"); // LED sign
      if (r() < 0.4) SOLAR(p, 0, 0.05 + hh + 0.045, -d * 0.1, s * 0.5, d * 0.38);
      return hh + 0.18;
    },
    park(p, s, h, r) {
      p("cyl", 0, 0.01, 0, s * 1.1, 0.02, s * 1.1, "#a9bf8d");
      if (r() < 0.5) { p("cyl", 0, 0.03, 0, s * 0.5, 0.04, s * 0.5, "#e8ecef"); p("cyl", 0, 0.05, 0, s * 0.42, 0.03, s * 0.42, "#6fd3f0", 0, 0, 0, true); p("cyl", 0, 0.16, 0, 0.05, 0.22, 0.05, "#bff2ff", 0, 0, 0, "cool"); }
      for (let k = 0; k < 4; k++) { const a = k * 1.57 + r(), rr = s * 0.42; p("cyl", Math.cos(a) * rr, 0.1, Math.sin(a) * rr, 0.05, 0.2, 0.05, "#8a6a4a"); p("ico1", Math.cos(a) * rr, 0.3, Math.sin(a) * rr, 0.28, 0.26, 0.28, pk(r, ["#689659", "#7aa567", "#5e8750"])); }
      return 0.5;
    },
  };

  /* ---------- live neighbourhoods ---------- */
  const occ = new Map(); // islId -> [{x,z,r}]
  const free = (id, x, z, r) => (occ.get(id) || []).every((o) => Math.hypot(o.x - x, o.z - z) > o.r + r);
  const hold = (id, x, z, r) => { (occ.get(id) || occ.set(id, []).get(id)).push({ x, z, r }); };
  const cityInfo = (c) => WORLD.cities.get(c);
  /* ---------- each theme = a "policy campus": one lot per item with its matching building, on a paved block with a city-colour kerb ---------- */
  for (const isl of islands) {
    if (!isl.live) { site(isl); continue; }
    const its = [...(isl.t.items || [])].sort((a, b) => MODELS.isHero(b.id) - MODELS.isHero(a.id));
    const accent = cityHex(isl.city), used = {}, zone = isl.zone;
    // Each policy owns 1–3 adjacent, equal hexes. Distribute items evenly across them.
    const slots=[], R=isl.hexRadius;
    for(let ci=0;ci<isl.cells.length;ci++){
      const cell=isl.cells[ci],items=its.filter((_,i)=>i%isl.cells.length===ci),n=items.length;
      const offsets=n===1?[[0,0]]:n===2?[[-.3,0],[.3,0]]:n===3?[[0,-.32],[-.3,.22],[.3,.22]]:n<=4?[[-.3,-.28],[.3,-.28],[-.3,.28],[.3,.28]]:Array.from({length:n},(_,i)=>[Math.cos(-Math.PI/2+i*Math.PI*2/n)*.47,Math.sin(-Math.PI/2+i*Math.PI*2/n)*.47]);
      const size=R*(n===1?.95:n<=3?.67:n<=4?.56:.44);
      items.forEach((it,i)=>slots.push({it,hero:MODELS.isHero(it.id),x:cell.c[0]-isl.c.x+offsets[i][0]*R,z:cell.c[1]-isl.c.z+offsets[i][1]*R,s:size}));
    }
    const xs=isl.cells.map(c=>c.c[0]-isl.c.x),zs=isl.cells.map(c=>c.c[1]-isl.c.z);
    const cw=Math.max(...xs)-Math.min(...xs)+R*1.73,cd=Math.max(...zs)-Math.min(...zs)+R*2;
    isl.campus={w:cw,d:cd,cx:(Math.min(...xs)+Math.max(...xs))/2,cz:(Math.min(...zs)+Math.max(...zs))/2};isl.plazaR=R*.65;
    const pc=ctxFor(isl.id,null,0,0,1,0),pp=(g,...a)=>part(pc,g,...a);
    // Fine city-colour kerbs follow all six edges, including the seams in multi-cell themes.
    for(const cell of isl.cells)for(let k=0;k<6;k++){
      const angle=-Math.PI/2+k*Math.PI/3, a=[Math.cos(angle)*(R-.21),Math.sin(angle)*(R-.21)],b=[Math.cos(angle+Math.PI/3)*(R-.21),Math.sin(angle+Math.PI/3)*(R-.21)];
      pp("box",cell.c[0]-isl.c.x+(a[0]+b[0])/2,.018,cell.c[1]-isl.c.z+(a[1]+b[1])/2,Math.hypot(b[0]-a[0],b[1]-a[1]),.025,.025,accent,-Math.atan2(b[1]-a[1],b[0]-a[0]));
    }
    const LOT_GROUND = { school: "#e0bd8e", sport: "#a2bd82", park: "#a2bd82", nursery: "#eecfbc", hospital: "#dfe5ec", clinic: "#dfe5ec", elder: "#d9e0c2", metro: "#d6c9ab", bus: "#d6c9ab", bike: "#d6c9ab", road: "#d6c9ab" }; // mid-tone pads: one step below the cream board
    let campusTop = TOP;
    for (const sl of slots) {
      const r = (hash(sl.it.id) % 1000) / 1000, kind = MODELS.kindFor(sl.it, isl.t);
      pp("box", sl.x, 0.066, sl.z, sl.s - 0.12, 0.01, sl.s - 0.12, LOT_GROUND[kind] || "#e2d3b1"); // slim lot pad, generous margins between lots
      const ctx = ctxFor(isl.id, sl.it.id, sl.x, sl.z, sl.s * 0.95, 0, zone, null);
      ctx.base.premultiply(new THREE.Matrix4().makeTranslation(0, 0.07, 0));
      const start = parts.length, p = (g, ...a) => part(ctx, g, ...a);
      const vs = MODELS.variants[kind], k = (used[kind] = (used[kind] || 0) + 1) - 1;
      (sl.hero ? MODELS.heroes[sl.it.id] : vs ? vs[k % vs.length] : MODELS.kinds[kind])(p, MODELS.helpers(p, accent), accent, r);
      const box = new THREE.Box3(); for (let q = start; q < parts.length; q++) box.union(unit.clone().applyMatrix4(parts[q].m));
      hold(isl.id,sl.x,sl.z,sl.s*.65);
      campusTop = Math.max(campusTop, box.max.y);
      box.translate(new THREE.Vector3(isl.c.x, 0, isl.c.z));
      ITEMS3D.set(sl.it.id, { isl: isl.id, x: sl.x, z: sl.z, size: sl.s, box, kind, hero: sl.hero });
    }
    isl.campusTop = campusTop;
    // One compact light pool per hex; keep the existing people/night-light interface.
    for(const cell of isl.cells){
      const x=cell.c[0]-isl.c.x,z=cell.c[1]-isl.c.z+R*.78;
      pp("cyl",x,.36,z,.025,.72,.025,"#3b4148");pp("box",x,.73,z,.2,.045,.12,"#fff6d8",0,0,0,true);
      LAMP_POOLS.push([cell.c[0],TOP+.075,cell.c[1],R*.8]);
    }
    const body=WORLD.bodies.get(isl.id);body.anchor.set(isl.campus.cx,TOP,isl.campus.cz+R*.58);

  }

  /* ---------- city landmarks for the live city ---------- */
  const LM = { taipei: [["t101", "台北 101", (i) => i.c.x, 2.3], ["dome", "台北大巨蛋", (i) => i.c.x * 0.8 - Math.abs(i.c.z) * 0.5, 1.9], ["station", "台北車站", (i) => -i.c.x - Math.abs(i.c.z) * 0.6, 1.8], ["shinkong", "新光摩天大樓", (i) => -i.c.x - Math.abs(i.c.z - 1.5) * 0.6 + 0.01, 2.0], ["grand", "圓山大飯店", (i) => -i.c.z, 1.8], ["npm", "國立故宮博物院", (i) => -i.c.z + i.c.x * 0.2, 1.6], ["miramar", "美麗華摩天輪", (i) => -i.c.z * 0.7 + i.c.x * 0.7, 1.6], ["cks", "中正紀念堂", (i) => i.c.z * 0.5 - Math.abs(i.c.x + 2), 1.6], ["sysm", "國父紀念館", (i) => i.c.x - Math.abs(i.c.z) * 0.8, 1.5], ["longshan", "艋舺龍山寺", (i) => -i.c.x + i.c.z * 0.5, 1.5], ["redhouse", "西門紅樓", (i) => -i.c.x - Math.abs(i.c.z) * 0.3, 1.5], ["yangming", "陽明山", (i) => -i.c.z * 1.2 - i.c.x * 0.2, 1.5, 1], ["elephant", "象山", (i) => i.c.x * 1.2 + i.c.z * 0.4, 1.4, 1], ["maokong", "貓空", (i) => i.c.x * 0.7 + i.c.z, 1.3, 1], ["daan", "大安森林公園", (i) => -Math.hypot(i.c.x - 2, i.c.z - 1), 1.3, 1], ["beitou", "北投溫泉", (i) => -i.c.z - i.c.x * 0.6, 1.3, 1]],
    newtaipei: [["ntcity", "新北市政府", null, 1.8], ["fort", "淡水紅毛城", null, 1.6], ["jiufen", "九份老街", null, 1.5], ["shifen", "十分瀑布・天燈", null, 1.4, 1], ["queen", "野柳女王頭", null, 1.6, 1]], // 淡江大橋 is now the real cross-strait bridge below, not an on-island model
    keelung: [["port", "基隆港", null, 1.5], ["guanyin", "中正公園大觀音", null, 1.8], ["miaokou", "廟口夜市", null, 1.5], ["houses", "正濱漁港彩色屋", null, 1.5], ["heping", "和平島", null, 1.4, 1]],
    taoyuan: [["airport", "桃園國際機場", null, 1.3], ["xpark", "Xpark 水族館", null, 1.6], ["daxi", "大溪老街", null, 1.6], ["rainbow", "永安漁港彩虹橋", null, 1.6], ["dam", "石門水庫", null, 1.3, 1], ["lala", "拉拉山", null, 1.4, 1]] };
  for (const [city, list] of Object.entries(LM)) {
    if (!LIVE_CITIES.has(city)) continue;
    const mine = islands.filter((i) => i.city === city), taken = new Set(), coast = cityInfo(city).coast;
    // footprint radius of each model (model units) and which ones belong inland rather than near the shore
    const FP = { t101: 0.78, dome: 1.0, station: 0.85, shinkong: 0.42, grand: 0.8, npm: 0.98, miramar: 0.75, cks: 0.78, sysm: 0.92, longshan: 0.72, redhouse: 0.68, yangming: 1.15, elephant: 0.88, maokong: 1.25, daan: 1.02, beitou: 0.92, ntcity: 0.75, danjiang: 1.75, fort: 0.85, jiufen: 1.0, shifen: 0.9, queen: 0.85, port: 0.95, guanyin: 0.45, miaokou: 0.9, houses: 0.95, heping: 0.95, airport: 1.5, xpark: 0.85, daxi: 0.9, rainbow: 0.9, dam: 1.4, lala: 1.05 };
    // Preserve the established geographic sites (before the hex rebuild).
    for (const [id, name, score, sc0, nature] of list) {
      let isl = null, best = null, sc = sc0;
      const saved=WORLD.landmarkSites[id];
      if(saved){
        const wx=saved.x,wz=saved.z;
        isl=mine.reduce((a,b)=>Math.hypot(a.c.x-wx,a.c.z-wz)<Math.hypot(b.c.x-wx,b.c.z-wz)?a:b);
        best=[wx-isl.c.x,wz-isl.c.z];sc=saved.sc;
      }
      if (!best) continue; if (!nature) taken.add(isl.id);
      const ctx = { isl: isl.id, owner: null, base: new THREE.Matrix4().compose(new THREE.Vector3(best[0], TOP, best[1]), new THREE.Quaternion(), new THREE.Vector3(sc, sc, sc)), s: sc, zone: "L" };
      const pl = (g, ...a) => { const q = part(ctx, g, ...a); q.landmark = id; return q; };
      { const pctx = { isl: isl.id, owner: null, base: new THREE.Matrix4().makeTranslation(best[0], TOP, best[1]), s: 1, zone: "L" }, pp = (g, ...a) => { const q = part(pctx, g, ...a); q.landmark = id; return q; }, PR = Math.min(2.6, ((FP[id] || 0.8) * sc + 0.15) * 2);
        pp("turfc", 0, 0.02, 0, PR, 0.04, PR, "#ffffff"); if (!nature) { pp("torus", 0, 0.04, 0, PR, PR, 0.12, cityHex(city), 0, Math.PI / 2);
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; pp("cyl", Math.cos(a) * PR * 0.45, 0.12, Math.sin(a) * PR * 0.45, 0.03, 0.2, 0.03, "#3b4148"); pp("sphere", Math.cos(a) * PR * 0.45, 0.24, Math.sin(a) * PR * 0.45, 0.06, 0.06, 0.06, "#fff3c4", 0, 0, 0, true); } } }
      const top = LANDMARK_BUILD[id](pl);
      for (const m of mine) { const lx = isl.c.x + best[0] - m.c.x, lz = isl.c.z + best[1] - m.c.z; if (Math.hypot(lx, lz) < 12) hold(m.id, lx, lz, (FP[id] || 0.8) * sc + 0.15); }
      LANDMARKS3D.push({ id, name, isl, x: best[0], z: best[1], top: TOP + top * sc, city, sc, r: (FP[id] || 0.8) * sc, nature: !!nature });
    }
  }

  /* ---------- planned city fabric: six distinct functional skylines ---------- */
  const profiles={
    commercial:{height:1.65,tint:"#c4c3b5",forms:["tower","atrium","terrace","arcade"]},
    technology:{height:1.2,tint:"#bac9cb",forms:["datacenter","laboratory","atrium","terrace"]},
    residential:{height:1.05,tint:"#c9c5af",forms:["courtyard","terrace","residence","arcade"]},
    public:{height:.95,tint:"#c7c9bc",forms:["civic","courtyard","hall","atrium"]},
    culture:{height:.85,tint:"#cfbda6",forms:["hall","gallery","arcade","workshop"]},
    environment:{height:1.05,tint:"#b6c3a4",forms:["energy","water","laboratory","terrace"]}
  };
  // Different spatial organisations, not one repeated main tower with two small front buildings.
  // [x,z,footprint,height,secondary] uses hex-radius units; every footprint is checked on the real site.
  const layouts=[
    {name:"court",lots:[[-.34,-.22,.4,1,0],[.31,-.12,.5,.78,0],[-.1,.4,.34,.5,1]]},
    {name:"parallel",lots:[[-.36,0,.49,1.12,0],[.36,0,.49,.76,0]]},
    {name:"campus",lots:[[0,-.08,.86,.9,0]]},
    {name:"staggered",lots:[[-.31,-.29,.38,.7,0],[.31,-.29,.38,1.25,0],[-.31,.29,.38,.48,1],[.31,.29,.38,.84,0]]},
    {name:"terraced",lots:[[-.06,-.1,.91,1,0]]},
    {name:"market",lots:Array.from({length:5},(_,i)=>[Math.cos(i*Math.PI*2/5)*.48,Math.sin(i*Math.PI*2/5)*.48,.28,.32,1])},
    {name:"mixed-core",lots:[[-.28,-.12,.55,1.35,0],[.35,.2,.4,.55,1]]}
  ];
  WORLD.buildingCounts=Object.fromEntries(Object.keys(profiles).map(k=>[k,0]));
  WORLD.blockPlans=[];
  const chosen=new Map(),neighbours=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
  const quarter=cell=>`${cell.city}:${Math.floor(cell.q/3)}:${Math.floor(cell.r/2)}`;
  GEO.hexTile=new THREE.CylinderGeometry(.5,.5,1,6);
  for(const cell of WORLD.hexCells){
    if(!LIVE_CITIES.has(cell.city))continue;
    const isl=cell.themeId?islandById.get(cell.themeId):islands.filter(i=>i.city===cell.city).reduce((a,b)=>Math.hypot(a.c.x-cell.c[0],a.c.z-cell.c[1])<Math.hypot(b.c.x-cell.c[0],b.c.z-cell.c[1])?a:b);
    const R=WORLD.hexRadius,r=rng(hash(cell.id)),profile=profiles[cell.zone];
    const lx=cell.c[0]-isl.c.x,lz=cell.c[1]-isl.c.z;
    const rotation=(hash(quarter(cell))%3+((cell.q-cell.r)%3+3)%3)*Math.PI/3;
    const rotate=(x,z)=>[x*Math.cos(rotation)+z*Math.sin(rotation),-x*Math.sin(rotation)+z*Math.cos(rotation)];
    const contextAt=(x,z,rot=0)=>cell.themeId?ctxFor(isl.id,null,lx+x,lz+z,1,rot):ctxFor("_static",null,cell.c[0]+x,cell.c[1]+z,1,rot);
    const ctx=contextAt(0,0),p=(g,...a)=>part(ctx,g,...a);
    const clear=(x,z,s)=>free(isl.id,lx+x,lz+z,s)&&!LANDMARKS3D.some(L=>Math.hypot(L.isl.c.x+L.x-cell.c[0]-x,L.isl.c.z+L.z-cell.c[1]-z)<L.r+s+.18);
    if(!cell.themeId)p("hexTile",0,-.02,0,(R-.18)*2,.04,(R-.18)*2,profile.tint);
    const used=new Set(neighbours.map(([q,r])=>chosen.get(`${cell.city}:${cell.q+q}:${cell.r+r}`)));
    let choice=hash(cell.id+":layout")%layouts.length;
    while(used.has(choice))choice=(choice+1)%layouts.length;
    chosen.set(`${cell.city}:${cell.q}:${cell.r}`,choice);
    const plan=layouts[choice],form=profile.forms[(hash(cell.id+":form")+choice)%profile.forms.length];
    const lots=cell.themeId?[[-.48,-.24,.32,.48,1],[.45,.3,.3,.65,1]]:plan.lots;
    const record={cell:cell.id,city:cell.city,zone:cell.zone,plan:plan.name,form,rotation,buildings:[]};
    for(let li=0;li<lots.length;li++){
      const [u,v,w,hf,secondary]=lots[li],[x,z]=rotate(u*R,v*R),size=w*R,footprint=size*.68;
      if(!clear(x,z,footprint)||GEOM.nearestEdge(cell.c[0]+x,cell.c[1]+z,cell.poly).d<footprint+.04)continue;
      const type=plan.name==="terraced"&&!secondary?"terrace":secondary?(cell.zone==="culture"||plan.name==="market"?"shop":li%2?"arcade":"workshop"):profile.forms[(profile.forms.indexOf(form)+li)%profile.forms.length];
      const aspect=type==="tower"?3.3:["arcade","workshop","hall","energy","datacenter"].includes(type)?1.45:2.25;
      const h=Math.min(profile.height*hf*(.86+r()*.28)*(isl.rec?1.08:1),size*aspect),start=parts.length;
      const bp=(g,...a)=>part(contextAt(x,z,rotation),g,...a);
      if(type==="shop")B.shop(bp,size,h,r);else B.architecture(bp,size,h,r,type,cell.zone);
      for(let i=start;i<parts.length;i++)parts[i].fabric=!cell.themeId;
      hold(isl.id,lx+x,lz+z,footprint);WORLD.buildingCounts[cell.zone]++;
      record.buildings.push({x:cell.c[0]+x,z:cell.c[1]+z,type,height:h,size});
    }
    if(!cell.themeId)WORLD.blockPlans.push(record);
    // Each organisation has its own forecourt/walk axis; avoid an identical tree-and-lamp stamp.
    const [ex,ez]=rotate(0,R*.59);
    if(!cell.themeId&&clear(ex,ez,R*.1)){
      const ap=(g,...a)=>part(contextAt(ex,ez,rotation),g,...a);
      ap("box",0,.008,0,R*.18,.012,R*.33,choice%2?"#b6c3c2":"#ccbea4");
      if(choice%3===0){ap("box",0,.1,0,R*.32,.07,.065,"#9d8064");}
      else if(choice%3===1){ap("cyl",0,.11,0,.025,.22,.025,"#80735e");ap("ico1",0,.27,0,R*.16,.23,R*.16,"#8b9c64");}
      else{ap("box",0,.32,0,R*.3,.025,R*.15,"#89adb6");for(const x of [-.12,.12])ap("cyl",x,.15,0,.015,.3,.015,"#768c94");}
      ap("cyl",R*.15,.2,0,.018,.4,.018,"#425260");ap("sphere",R*.15,.41,0,.05,.05,.05,"#ffe5ae",0,0,0,true);
      const [px,pz]=rotate(R*.15,0);LAMP_POOLS.push([cell.c[0]+ex+px,TOP+.012,cell.c[1]+ez+pz,.4]);
    }
  }
  // Shared background edges within a quarter become pedestrian links, not six black roads per tile.
  // Policy ring roads remain unchanged, so existing cars and citizen routes keep their contract.
  const pointKey=p=>p.map(v=>Math.round(v*1e5)).join(","),edgeKey=(a,b)=>[pointKey(a),pointKey(b)].sort().join("|");
  const owners=new Map();
  for(const cell of WORLD.hexCells)for(let k=0;k<6;k++){
    const key=edgeKey(cell.poly[k],cell.poly[(k+1)%6]);if(!owners.has(key))owners.set(key,[]);owners.get(key).push(cell);
  }
  WORLD.streetTypes={road:0,pedestrian:0};
  for(const rd of WORLD.roads){
    const cells=owners.get(edgeKey(rd.a,rd.b))||[];
    rd.pedestrian=cells.length===2&&cells.every(c=>!c.themeId)&&cells[0].zone===cells[1].zone&&quarter(cells[0])===quarter(cells[1]);
    WORLD.streetTypes[rd.pedestrian?"pedestrian":"road"]++;
  }
  /* ---------- streets: centre dashes and zebra crossings (static) ---------- */
  const sctx = { isl: "_static", owner: null, base: new THREE.Matrix4(), s: 1 }, sp = (g, ...a) => part(sctx, g, ...a);
  for (const rd of WORLD.roads) {
    if (!rd.live) continue;
    const L = Math.hypot(rd.b[0] - rd.a[0], rd.b[1] - rd.a[1]), ang = Math.atan2(rd.b[1] - rd.a[1], rd.b[0] - rd.a[0]), ux = Math.cos(ang), uz = Math.sin(ang);
    if(rd.pedestrian){
      sp("box",(rd.a[0]+rd.b[0])/2,TOP-.024,(rd.a[1]+rd.b[1])/2,L+.03,.008,.30,"#b6beb4",-ang);
      sp("box",(rd.a[0]+rd.b[0])/2,TOP-.017,(rd.a[1]+rd.b[1])/2,L*.8,.004,.018,"#8ab3b6",-ang);
      continue;
    }
    sp("box",(rd.a[0]+rd.b[0])/2,TOP-.024,(rd.a[1]+rd.b[1])/2,L+.03,.008,.30,"#455764",-ang);
    for(let t=.25;t<L-.2;t+=.32)sp("box",rd.a[0]+ux*t,TOP-.017,rd.a[1]+uz*t,.13,.004,.015,"#e7d6a2",-ang);
    for (const t of [0.22, L - 0.22]) for (let k = -2; k <= 2; k++) sp("box", rd.a[0] + ux * t - uz * k * 0.045, TOP - 0.016, rd.a[1] + uz * t + ux * k * 0.045, 0.09, 0.004, 0.022, "#ffffff", -ang + Math.PI / 2);
  }

  /* ---------- elevated expressway around the live city, and a container port ---------- */
  WORLD.highways = [];
  for (const c of A.cities) {
    if (!LIVE_CITIES.has(c.city)) continue;
    const info = cityInfo(c.city), H = 1.05;
    // an expressway that follows the streets across the city, west to east, smoothed into sweeping curves
    const Gn = WORLD.graph.nodes, mineIds = [...new Set(islands.filter((i) => i.city === c.city).flatMap((i) => WORLD.ringNode.get(i.id)))];
    const inner = mineIds.filter((id) => (WORLD.graph.edges.get(id) || []).length >= 3);
    const w = inner.reduce((m, id) => (Gn[id].p.x < Gn[m].p.x ? id : m), inner[0]), e = inner.reduce((m, id) => (Gn[id].p.x > Gn[m].p.x ? id : m), inner[0]);
    const route = WORLD.shortest(w, e) || [];
    let path = GEOM.smooth(route.map((id) => [Gn[id].p.x, Gn[id].p.z]), 0); { let Q = path; for (let it = 0; it < 3; it++) { const R = [Q[0]]; for (let i = 0; i < Q.length - 1; i++) { const a = Q[i], b = Q[i + 1]; R.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } R.push(Q[Q.length - 1]); Q = R; } path = Q; }
    const pts = []; for (let k = 0; k < path.length - 1; k++) { const a = path[k], b = path[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 0.6)); for (let j = 0; j < n; j++) pts.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); }
    pts.push(path[path.length - 1]);
    const CROSS = false; if (CROSS) for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k], b = pts[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      sp("box", mx, TOP + H, mz, L + 0.04, 0.08, 0.5, "#8b9097", -ang); sp("box", mx, TOP + H + 0.045, mz, L + 0.04, 0.012, 0.44, "#5d6168", -ang);
      for (const o of [-0.24, 0.24]) sp("box", mx - Math.sin(ang) * o, TOP + H + 0.09, mz + Math.cos(ang) * o, L + 0.04, 0.08, 0.03, "#eef1f5", -ang);
      if (k % 2 === 0) sp("box", mx, TOP + H + 0.052, mz, L * 0.45, 0.004, 0.025, "#ffffff", -ang);
      if (k % 3 === 0) { sp("cyl", mx, (TOP + H) / 2 - 0.05, mz, 0.12, TOP + H + 0.1, 0.12, "#cfc9bd"); sp("box", mx, TOP + H - 0.08, mz, 0.12, 0.08, 0.5, "#cfc9bd", -ang); }
      if (k % 5 === 0) for (const o of [-0.25, 0.25]) { sp("cyl", mx - Math.sin(ang) * o, TOP + H + 0.3, mz + Math.cos(ang) * o, 0.015, 0.4, 0.015, "#3b4148"); sp("sphere", mx - Math.sin(ang) * o, TOP + H + 0.5, mz + Math.cos(ang) * o, 0.04, 0.04, 0.04, "#fff3c4", 0, 0, 0, true); }
    }
    if (CROSS) WORLD.highways.push({ city: c.city, pts: pts.map(([x, z]) => new THREE.Vector3(x, TOP + H + 0.06, z)) });
    { // the coastal ring expressway (環道高架): rides on piers just past the surf line, all the way round
      // radial distance field: walk out from the centre past the last bit of land, then on until we are D clear of the coast
      const [cx, cz] = GEOM.centroid(info.coast), D = 2.75, NA = 360, rr = [];
      for (let k = 0; k < NA; k++) {
        const a = (k / NA) * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a); let r = 0, last = 0;
        for (r = 0; r < 60; r += 0.1) if (GEOM.pip(cx + dx * r, cz + dz * r, info.coast)) last = r;
        const nP = info.coast.reduce((m, p) => (p[1] < m[1] ? p : m)), PX = nP[0] - 2.2, PZ = nP[1] - 1.8;
        r = last; while ((GEOM.nearestEdge(cx + dx * r, cz + dz * r, info.coast).d < D || Math.hypot(cx + dx * r - PX, cz + dz * r - PZ) < 3.4) && r < 80) r += 0.05;
        rr.push(r);
      }
      // dilate (local max) then box-blur repeatedly: the ring keeps its clearance but every bend becomes a broad, even curve
      const W2 = 10; let sm = rr.map((_, k) => { let m = 0; for (let j = -W2; j <= W2; j++) m = Math.max(m, rr[(k + j + NA) % NA] - Math.abs(j) * 0.02); return m; });
      for (let it = 0; it < 8; it++) { const prev = sm; sm = prev.map((_, k) => { let s2 = 0; for (let j = -6; j <= 6; j++) s2 += prev[(k + j + NA) % NA]; return Math.max(rr[k] - 0.35, s2 / 13); }); }
      for (let it = 0; it < 4; it++) { const prev = sm; sm = prev.map((v, k) => (prev[(k - 1 + NA) % NA] + v * 2 + prev[(k + 1) % NA]) / 4); }
      const ring = sm.map((r, k) => { const a = (k / NA) * Math.PI * 2; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; });
      const rp = []; for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 0.6)); for (let j = 0; j < n; j++) rp.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]); }
      const RH = 0.85, base = WATER_Y;
      for (let k = 0; k < rp.length; k++) {
        const a = rp[k], b = rp[(k + 1) % rp.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue;
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
        sp("box", mx, TOP + RH, mz, L + 0.2, 0.08, 0.52, "#8b9097", -ang); sp("box", mx, TOP + RH + 0.045, mz, L + 0.2, 0.012, 0.46, "#5d6168", -ang);
        for (const o of [-0.25, 0.25]) sp("box", mx - Math.sin(ang) * o, TOP + RH + 0.09, mz + Math.cos(ang) * o, L + 0.12, 0.08, 0.03, "#eef1f5", -ang);
        if (k % 5 === 0) for (const o of [-0.25, 0.25]) sp("box", mx - Math.sin(ang) * o, TOP + RH + 0.136, mz + Math.cos(ang) * o, 0.05, 0.016, 0.016, "#bfeaff", -ang, 0, 0, "cool"); // sparse cool markers, not a light bar
        if (k % 2 === 0) sp("box", mx, TOP + RH + 0.052, mz, L * 0.45, 0.004, 0.025, "#ffffff", -ang);
        if (k % 3 === 0) { const ph = TOP + RH - base; sp("cyl", mx, base + ph / 2 - 0.05, mz, 0.13, ph, 0.13, "#cfc9bd"); sp("box", mx, TOP + RH - 0.08, mz, 0.12, 0.08, 0.52, "#cfc9bd", -ang); sp("cyl", mx, base + 0.02, mz, 0.22, 0.05, 0.22, "#ffffff"); }
        if (k % 6 === 0) for (const o of [k % 12 === 0 ? -0.26 : 0.26]) { LAMP_POOLS.push([mx - Math.sin(ang) * o * 0.4, TOP + RH + 0.055, mz + Math.cos(ang) * o * 0.4, 0.42]); sp("cyl", mx - Math.sin(ang) * o, TOP + RH + 0.3, mz + Math.cos(ang) * o, 0.015, 0.4, 0.015, "#3b4148"); sp("sphere", mx - Math.sin(ang) * o, TOP + RH + 0.5, mz + Math.cos(ang) * o, 0.04, 0.04, 0.04, "#fff3c4", 0, 0, 0, true); } // sparse: no glowing band over the ring
      }
      WORLD.rings = WORLD.rings || {}; WORLD.rings[c.city] = { pts: rp, center: [cx, cz], deck: TOP + RH };
      WORLD.highways.push({ city: c.city, closed: true, pts: rp.map(([x, z]) => new THREE.Vector3(x, TOP + RH + 0.06, z)) });
    }
    // port on the north shore
    const north = info.coast.reduce((m, p) => (p[1] < m[1] ? p : m)), px = north[0] - 2.2, pz = north[1] - 0.6;
    sp("box", px, TOP - 0.12, pz - 0.6, 4.2, 0.18, 1.6, "#c9c3b7"); for (let x = -1.9; x <= 1.9; x += 0.6) sp("box", px + x, (TOP + WATER_Y) / 2 - 0.2, pz - 1.35, 0.12, TOP - WATER_Y + 0.3, 0.12, "#9a958c");
    const CC = ["#e0453c", "#2f6fd6", "#f0c64a", "#28c8c8", "#e48b5c", "#f8f6f1", "#3f8f5a"], R2 = rng(77);
    for (let x = -1.5; x <= 1.6; x += 0.42) for (let z = -0.25; z <= 0.1; z += 0.2) { const n = 1 + ((R2() * 3) | 0); for (let s2 = 0; s2 < n; s2++) sp("box", px + x, TOP - 0.02 + s2 * 0.11, pz - 0.6 + z, 0.38, 0.1, 0.17, pk(R2, CC)); }
    for (const x of [-1.3, 0, 1.3]) { for (const dx of [-0.15, 0.15]) sp("box", px + x + dx, TOP + 0.45, pz - 1.0, 0.05, 1.1, 0.05, "#28c8c8"); sp("box", px + x, TOP + 1.0, pz - 1.35, 0.4, 0.07, 1.6, "#28c8c8"); sp("box", px + x, TOP + 0.95, pz - 0.95, 0.36, 0.14, 0.16, "#f8f6f1"); }
    WORLD.port = { x: px, z: pz - 2.2 };
  }

  /* ---------- shoreline life (SimCity BuildIt style): boardwalk + palms, dense umbrellas, kiosks, a pleasure pier, a marina ---------- */
  for (const c of A.cities) {
    if (!LIVE_CITIES.has(c.city)) continue;
    const seg = WORLD.shore.get(c.city), R3 = rng(hash(c.city) + 99), W = 2.0, info = cityInfo(c.city);
    const north = info.coast.reduce((m, p) => (p[1] < m[1] ? p : m));
    const yAt = (o) => TOP - 0.06 + (WATER_Y + 0.02 - TOP + 0.06) * Math.min(1, o / W);
    const UMB = ["#f8f6f1", "#6fd0dc"];                       // resort canvas: white + aqua only
    const TOWEL = ["#bfeef4", "#f8f6f1", "#ffd9c0"];           // lounger towels, low-saturation
    const palm = (px, py, pz, s = 1) => { for (let k = 0; k < 4; k++) sp("cyl", px + k * 0.025 * s, py + (0.12 + k * 0.22) * s, pz, 0.05 * s, 0.24 * s, 0.05 * s, "#a8794f", 0, 0, -0.12); for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; sp("box", px + (0.1 + Math.cos(a) * 0.24) * s, py + 0.9 * s, pz + Math.sin(a) * 0.24 * s, 0.52 * s, 0.025, 0.13 * s, k % 2 ? "#5e8750" : "#6c9655", -a, 0, -0.35); } sp("sphere", px + 0.1 * s, py + 0.95 * s, pz, 0.1 * s, 0.1 * s, 0.1 * s, "#7a5a3a"); };
    const umbrella = (x, y, z, cc) => { sp("cyl", x, y + 0.22, z, 0.018, 0.44, 0.018, "#f8f6f1"); sp("cone", x, y + 0.46, z, 0.48, 0.13, 0.48, cc); sp("sphere", x, y + 0.535, z, 0.028, 0.028, 0.028, "#f8f6f1"); };
    const lounger = (x, y, z, a2, cc) => { const ca = Math.cos(a2), sa = Math.sin(a2);
      sp("box", x, y + 0.035, z, 0.3, 0.028, 0.13, "#f8f6f1", -a2);
      sp("box", x - ca * 0.1, y + 0.085, z - sa * 0.1, 0.1, 0.028, 0.13, "#f8f6f1", -a2, 0, -0.6);
      sp("box", x + ca * 0.03, y + 0.054, z + sa * 0.03, 0.2, 0.01, 0.1, cc, -a2); };
    const kiosk = (x, y, z, a) => { const cc = pk(R3, ["#6fd0dc", "#5fa8e0"]);
      sp("rbox", x, y + 0.15, z, 0.44, 0.3, 0.32, "#f8f6f1", -a);
      sp("box", x + Math.cos(a) * 0.17, y + 0.18, z + Math.sin(a) * 0.17, 0.02, 0.1, 0.26, "#cfeefc", -a, 0, 0, true);
      for (let k = -2; k <= 2; k++) sp("box", x - Math.sin(a) * k * 0.09 + Math.cos(a) * 0.21, y + 0.34, z + Math.cos(a) * k * 0.09 + Math.sin(a) * 0.21, 0.2, 0.025, 0.09, k % 2 ? cc : "#f8f6f1", -a, 0, 0.35);
      sp("box", x, y + 0.315, z, 0.48, 0.04, 0.36, "#f8f6f1", -a);
      sp("box", x - Math.cos(a) * 0.1, y + 0.38, z - Math.sin(a) * 0.1, 0.2, 0.035, 0.012, cc, -a, 0, 0, "cool");
      for (const sd of [-0.32, 0.32]) { const tx = x + Math.cos(a) * 0.34 - Math.sin(a) * sd, tz = z + Math.sin(a) * 0.34 + Math.cos(a) * sd;
        sp("cyl", tx, y + 0.08, tz, 0.08, 0.02, 0.08, "#f8f6f1"); sp("cyl", tx, y + 0.2, tz, 0.01, 0.24, 0.01, "#f8f6f1"); sp("cone", tx, y + 0.33, tz, 0.22, 0.06, 0.22, cc); } };
    /* one resort cluster: a tilted sun deck, two umbrellas, a row of three loungers facing the sea, a plank walk to the boardwalk */
    const cluster = (x0, z0, nx, nz, ux, uz, an, ci) => {
      const tilt = Math.atan2(yAt(1.45) - yAt(0.55), 0.9);
      const at = (o, sdd) => [x0 + nx * o + ux * sdd, z0 + nz * o + uz * sdd];
      { const [px, pz] = at(1.0, 0); sp("box", px, yAt(1.0) + 0.012, pz, 0.9, 0.022, 1.1, "#f3ddb0", -an, 0, tilt); }
      { const [px, pz] = at(0.5, 0); sp("box", px, yAt(0.5) + 0.02, pz, 0.55, 0.02, 0.16, "#e4c08b", -an, 0, tilt); }
      for (const sdd of [-0.26, 0.26]) { const [px, pz] = at(0.82, sdd); umbrella(px, yAt(0.82) + 0.02, pz, UMB[(ci + (sdd > 0 ? 1 : 0)) % 2]); }
      for (let k = -1; k <= 1; k++) { const [px, pz] = at(1.22, k * 0.32); lounger(px, yAt(1.22) + 0.02, pz, an, TOWEL[(ci + k + 1) % TOWEL.length]); }
    };
    // longest beach stretch gets the pleasure pier, the longest harbour stretch away from the port gets the marina
    const runs = []; let cur = null;
    for (const sg of seg) { if (!cur || cur.type !== sg.type) { cur = { type: sg.type, list: [], len: 0 }; runs.push(cur); } const L = Math.hypot(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]); cur.list.push(sg); cur.len += L; }
    const mid = (run) => { let h = run.len / 2; for (const sg of run.list) { const L = Math.hypot(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]); if (h <= L) { const t = h / (L || 1); return { x: sg.a[0] + (sg.b[0] - sg.a[0]) * t, z: sg.a[1] + (sg.b[1] - sg.a[1]) * t, nx: (sg.na[0] + sg.nb[0]) / 2, nz: (sg.na[1] + sg.nb[1]) / 2, ux: (sg.b[0] - sg.a[0]) / (L || 1), uz: (sg.b[1] - sg.a[1]) / (L || 1) }; } h -= L; } };
    const bR = runs.filter((r) => r.type === "beach").sort((a, b) => b.len - a.len), hR = runs.filter((r) => r.type === "harbour" && (() => { const m = mid(r); return m && Math.hypot(m.x - north[0], m.z - north[1]) > 6; })()).sort((a, b) => b.len - a.len);
    const pierAt = bR[0] && mid(bR[0]), marinaAt = (hR[0] && mid(hR[0])) || (bR[1] && mid(bR[1]));
    const nearPier = (x, z) => pierAt && Math.hypot(x - pierAt.x, z - pierAt.z) < 1.2;
    let acc = 1.2, accH = 0, accK = 3.5, ci = 0, buoyAcc = 0;
    for (const sg of seg) {
      const L = Math.hypot(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]); if (!L) continue;
      const ux = (sg.b[0] - sg.a[0]) / L, uz = (sg.b[1] - sg.a[1]) / L, nx = (sg.na[0] + sg.nb[0]) / 2, nz = (sg.na[1] + sg.nb[1]) / 2, ang = Math.atan2(uz, ux), an = Math.atan2(nz, nx);
      if (sg.type === "beach") { // boardwalk along the land edge: pale planks with a white rail curb
        const mx = (sg.a[0] + sg.b[0]) / 2 + nx * 0.28, mz = (sg.a[1] + sg.b[1]) / 2 + nz * 0.28;
        sp("box", mx, yAt(0.28) + 0.03, mz, L + 0.06, 0.04, 0.36, "#e4c08b", -ang);
        sp("box", mx - nx * 0.19, yAt(0.28) + 0.058, mz - nz * 0.19, L + 0.06, 0.016, 0.028, "#f8f6f1", -ang);
      }
      for (let t = 0; t < L; t += 0.1) {
        const x0 = sg.a[0] + ux * t, z0 = sg.a[1] + uz * t;
        if (sg.type === "beach") {
          acc += 0.1; accK += 0.1; buoyAcc += 0.1;
          if (acc >= 2.1) { acc = 0; ci++; // resort rhythm: one cluster, then open sand; palms between every other pair
            if (!nearPier(x0, z0)) {
              cluster(x0, z0, nx, nz, ux, uz, an, ci);
              if (ci % 2 === 0) { palm(x0 + nx * 0.16 + ux * 0.85, TOP - 0.05, z0 + nz * 0.16 + uz * 0.85, 1.05); palm(x0 + nx * 0.3 + ux * 1.1, TOP - 0.05, z0 + nz * 0.3 + uz * 1.1, 0.85); }
            }
          }
          if (buoyAcc >= 1.4) { buoyAcc = 0; const o = W + 0.55; sp("sphere", x0 + nx * o, WATER_Y + 0.045, z0 + nz * o, 0.07, 0.07, 0.07, ci % 2 ? "#f8f6f1" : "#6fd0dc"); } // swim-line buoys
          if (accK >= 7.5 && !nearPier(x0, z0)) { accK = 0; const o = 0.5; kiosk(x0 + nx * o, yAt(o), z0 + nz * o, an);
            const fx = x0 + nx * 0.4 + ux * 0.9, fz = z0 + nz * 0.4 + uz * 0.9; // beach shower + flag beside the kiosk
            sp("cyl", fx, yAt(0.4) + 0.2, fz, 0.016, 0.4, 0.016, "#f8f6f1"); sp("box", fx + ux * 0.06, yAt(0.4) + 0.4, fz + uz * 0.06, 0.12, 0.05, 0.01, "#6fd0dc", -ang); }
          if (Math.abs(t - 0.05) < 0.051 && R3() < 0.12 && !nearPier(x0, z0)) { // lifeguard tower: white frame, aqua cabin
            const o = 1.35, lx = x0 + nx * o, lz = z0 + nz * o, ly = yAt(o);
            for (const [dx, dz] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) sp("box", lx + dx, ly + 0.25, lz + dz, 0.02, 0.5, 0.02, "#f8f6f1");
            sp("box", lx, ly + 0.52, lz, 0.26, 0.12, 0.26, "#6fd0dc"); sp("cone4", lx, ly + 0.66, lz, 0.3, 0.14, 0.3, "#f8f6f1"); }
        } else if (sg.type === "harbour") {
          accH += 0.1;
          if (accH >= 0.55) { accH = 0; sp("cyl", x0 - nx * 0.02, TOP - 0.01, z0 - nz * 0.02, 0.06, 0.08, 0.06, "#3b4148"); if (R3() < 0.3) sp("cyl", x0 - nx * 0.25, TOP + 0.17, z0 - nz * 0.25, 0.018, 0.34, 0.018, "#3b4148"), sp("sphere", x0 - nx * 0.25, TOP + 0.35, z0 - nz * 0.25, 0.045, 0.045, 0.045, "#fff3c4", 0, 0, 0, true); }
        } else {
          acc += 0.1; if (acc < 0.65) continue; acc = 0; // sparser, lighter rocks: tidy outcrops, not rubble
          const o = 0.2 + R3() * 0.45; sp("ico", x0 + nx * o, WATER_Y + 0.05 + R3() * 0.06, z0 + nz * o, 0.2 + R3() * 0.16, 0.15 + R3() * 0.1, 0.2 + R3() * 0.16, pk(R3, ["#b8b2a6", "#c6c0b4", "#a9a396"]), R3() * 3);
        }
      }
    }
    // bridged pockets become quiet coves: one kiosk, a few neat umbrella-and-lounger spots, palms, open sand
    for (const pkt of (WORLD.pockets && WORLD.pockets.get(c.city)) || []) {
      let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9; for (const [x, z] of pkt) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); minz = Math.min(minz, z); maxz = Math.max(maxz, z); }
      let k = 0, kioskDone = false;
      for (let x = minx + 0.45; x < maxx; x += 1.0) for (let z = minz + 0.45; z < maxz; z += 1.0) {
        if (!GEOM.pip(x, z, pkt) || GEOM.nearestEdge(x, z, pkt).d < 0.45) continue; k++;
        if (!kioskDone && GEOM.nearestEdge(x, z, pkt).d > 0.6) { kioskDone = true; kiosk(x, TOP - 0.055, z, 0); continue; }
        if (k % 3 === 0) { palm(x, TOP - 0.05, z, 1.0); continue; }
        umbrella(x - 0.12, TOP - 0.055, z, UMB[k % 2]);
        lounger(x + 0.26, TOP - 0.055, z - 0.12, Math.PI / 2, TOWEL[k % 3]);
        lounger(x + 0.26, TOP - 0.055, z + 0.14, Math.PI / 2, TOWEL[(k + 1) % 3]);
      }
    }
    // pleasure pier: a long boardwalk into the sea, shops on it and a ferris wheel at the end
    if (pierAt) {
      const { x, z, nx, nz, ux, uz } = pierAt, an = Math.atan2(nz, nx), len = 4.4, yP = TOP - 0.02;
      const at = (f, s2 = 0) => [x + nx * f - nz * s2 * 0 + ux * s2, z + nz * f + uz * s2];
      { const [mx, mz] = at(len / 2); sp("box", mx, yP, mz, len, 0.07, 0.62, "#e2bd8c", -an); }
      for (let f = 0.4; f <= len; f += 0.5) for (const s2 of [-0.26, 0.26]) { const [px, pz] = at(f, s2); sp("cyl", px, (yP + WATER_Y) / 2 - 0.15, pz, 0.05, yP - WATER_Y + 0.3, 0.05, "#8a6a4a"); }
      for (let f = 0.3; f <= len; f += 0.3) for (const s2 of [-0.3, 0.3]) { const [px, pz] = at(f, s2); sp("box", px, yP + 0.08, pz, 0.025, 0.12, 0.025, "#f8f6f1"); }
      { const [a1, a2] = at(len / 2, -0.31), [b1, b2] = at(len / 2, 0.31); sp("box", a1, yP + 0.14, a2, len, 0.02, 0.02, "#f8f6f1", -an); sp("box", b1, yP + 0.14, b2, len, 0.02, 0.02, "#f8f6f1", -an); }
      // gate on the beach
      { const [gx, gz] = at(0.3); for (const s2 of [-0.32, 0.32]) { const [px, pz] = at(0.3, s2); sp("box", px, yP + 0.3, pz, 0.08, 0.6, 0.08, "#f8f6f1"); } sp("box", gx, yP + 0.62, gz, 0.1, 0.14, 0.8, "#6fd0dc", -an); }
      for (const [f, s2, cc] of [[1.0, -0.17, "#6fd0dc"], [1.4, 0.17, "#5fa8e0"], [1.8, -0.17, "#ffb3a0"]]) { const [px, pz] = at(f, s2); sp("rbox", px, yP + 0.17, pz, 0.32, 0.28, 0.24, "#f8f6f1", -an); sp("cone4", px, yP + 0.38, pz, 0.36, 0.14, 0.3, cc, -an + Math.PI / 4); }
      // platform + ferris wheel
      const [ex, ez] = at(len - 0.3); sp("cyl", ex, yP, ez, 1.5, 0.07, 1.5, "#e2bd8c");
      const [wx, wz] = at(len - 0.15), R = 0.78, hub = yP + R + 0.18, ca = Math.cos(an + Math.PI / 2), sa = Math.sin(an + Math.PI / 2);
      for (const s2 of [-0.12, 0.12]) { const px = wx + nx * s2, pz = wz + nz * s2; sp("box", px + ca * 0.3, (yP + hub) / 2, pz + sa * 0.3, 0.04, hub - yP, 0.04, "#f8f6f1", 0, 0, 0); sp("box", px - ca * 0.3, (yP + hub) / 2, pz - sa * 0.3, 0.04, hub - yP, 0.04, "#f8f6f1"); }
      const N = 16; for (let k = 0; k < N; k++) { const a = (k / N) * Math.PI * 2, a2 = ((k + 1) / N) * Math.PI * 2;
        const p1 = [Math.cos(a) * R, Math.sin(a) * R], p2 = [Math.cos(a2) * R, Math.sin(a2) * R], cx = (p1[0] + p2[0]) / 2, cy = (p1[1] + p2[1]) / 2, segL = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        for (const s2 of [-0.07, 0.07]) sp("box", wx + ca * cx + nx * s2, hub + cy, wz + sa * cx + nz * s2, segL + 0.01, 0.03, 0.03, "#f8f6f1", -(an + Math.PI / 2), 0, Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 1);
        sp("box", wx + ca * cx / 2, hub + cy / 2, wz + sa * cx / 2, R, 0.015, 0.015, "#dfe6ee", -(an + Math.PI / 2), 0, (a + a2) / 2);
        sp("rbox", wx + ca * p1[0], hub + p1[1] - 0.08, wz + sa * p1[0], 0.13, 0.12, 0.13, UMB[k % UMB.length]);
        sp("sphere", wx + ca * p1[0], hub + p1[1], wz + sa * p1[0], 0.03, 0.03, 0.03, "#fff3c4", 0, 0, 0, true);
      }
      sp("sphere", wx, hub, wz, 0.08, 0.08, 0.08, "#5fa8e0");
    }
    // marina: floating docks with finger slips and yachts
    if (marinaAt) {
      const { x, z, nx, nz, ux, uz } = marinaAt, an = Math.atan2(nz, nx), yD = WATER_Y + 0.05, P = (f, s2) => [x + nx * f + ux * s2, z + nz * f + uz * s2];
      for (const f of [0.1]) { const [mx, mz] = P(0.8, 0); sp("box", mx, yD, mz, 1.6, 0.04, 0.16, "#e9e2d2", -an); }
      for (const f of [1.6]) { const [mx, mz] = P(f, 0); sp("box", mx, yD, mz, 0.16, 0.04, 4.2, "#e9e2d2", -an); }
      for (let s2 = -1.9; s2 <= 1.9; s2 += 0.55) {
        for (const side of [-1, 1]) { const [fx, fz] = P(1.6 + side * 0.4, s2); sp("box", fx, yD, fz, 0.7, 0.035, 0.07, "#e9e2d2", -an); }
        for (const side of [-1, 1]) { if (R3() < 0.25) continue; const [bx, bz] = P(1.6 + side * 0.42, s2 + 0.27); if (typeof SHIPS !== "undefined") { const g = SHIPS.make(R3() < 0.75 ? "yacht" : "fishing", rng(hash(c.city) + s2 * 13 + side)); g.scale.setScalar(0.45); g.position.set(bx, WATER_Y - 0.03, bz); g.rotation.y = Math.atan2(nx, nz) + (side < 0 ? Math.PI : 0); scene.add(g); } }
      }
      const [hx, hz] = P(-0.4, 0); sp("rbox", hx, TOP + 0.15, hz, 0.7, 0.3, 0.45, "#f8f6f1", -an); sp("box", hx, TOP + 0.32, hz, 0.78, 0.04, 0.53, "#2f6fd6", -an);
      const [tx, tz] = P(-0.4, 0.6); sp("cyl", tx, TOP + 0.35, tz, 0.02, 0.7, 0.02, "#f8f6f1"); sp("box", tx + ux * 0.1, TOP + 0.62, tz + uz * 0.1, 0.18, 0.12, 0.01, "#2f6fd6", -Math.atan2(uz, ux));
    }
  }

  /* ---------- bridges between the islands (joining the ring expressways) and ferry routes ---------- */
  WORLD.bridges = []; WORLD.ferryRoutes = []; WORLD.bridgeEnds = [];
  {
    const R = WORLD.rings || {}, cities = Object.keys(R), hub = R.taipei ? "taipei" : cities[0];
    // ring network: Taipei and New Taipei each link to Keelung and Taoyuan; Taipei–New Taipei gets the two named bridges below
    const pairs = [];
    for (const c of cities) if (c !== hub && c !== "newtaipei") { pairs.push([hub, c]); if (R.newtaipei) pairs.push(["newtaipei", c]); }
    const coasts = cities.map((c) => cityInfo(c).coast);
    const overWater = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / 0.8); for (let k = 1; k < n; k++) { const x = a[0] + (b[0] - a[0]) * k / n, z = a[1] + (b[1] - a[1]) * k / n; if (coasts.some((P) => GEOM.pip(x, z, P))) return false; } return true; };
    /* shared roadway: deck segments, kerbs, dashes, lamps and piers; returns the traffic path and the frame vectors */
    const deck = (a, b, Y) => {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, ang = Math.atan2(uz, ux), nx = -uz, nz = ux;
      const n = Math.max(2, Math.round(L / 0.6)), pts = [];
      for (let k = 0; k < n; k++) {
        const f0 = k / n, f1 = (k + 1) / n, mx = a[0] + (b[0] - a[0]) * (f0 + f1) / 2, mz = a[1] + (b[1] - a[1]) * (f0 + f1) / 2, seg = L / n;
        sp("box", mx, Y, mz, seg + 0.08, 0.1, 0.58, "#8b9097", -ang); sp("box", mx, Y + 0.05, mz, seg + 0.08, 0.012, 0.5, "#5d6168", -ang);
        for (const o of [-0.28, 0.28]) sp("box", mx + nx * o, Y + 0.1, mz + nz * o, seg + 0.08, 0.08, 0.03, "#eef1f5", -ang);
        if (k % 4 === 0) for (const o of [-0.28, 0.28]) sp("box", mx + nx * o, Y + 0.146, mz + nz * o, 0.05, 0.016, 0.016, "#bfeaff", -ang, 0, 0, "cool");
        if (k % 2 === 0) sp("box", mx, Y + 0.058, mz, seg * 0.45, 0.004, 0.025, "#ffffff", -ang);
        if (k % 4 === 0 && k > 0) { const ph = Y - WATER_Y; sp("cyl", mx, WATER_Y + ph / 2 - 0.05, mz, 0.16, ph, 0.16, "#cfc9bd"); sp("cyl", mx, WATER_Y + 0.02, mz, 0.26, 0.05, 0.26, "#ffffff"); }
        if (k % 4 === 1) { const o = k % 8 === 1 ? -0.3 : 0.3; sp("cyl", mx + nx * o, Y + 0.3, mz + nz * o, 0.015, 0.4, 0.015, "#3b4148"); sp("sphere", mx + nx * o, Y + 0.5, mz + nz * o, 0.04, 0.04, 0.04, "#fff3c4", 0, 0, 0, true); LAMP_POOLS.push([mx + nx * o * 0.4, Y + 0.06, mz + nz * o * 0.4, 0.42]); }
        pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * f0, Y + 0.07, a[1] + (b[1] - a[1]) * f0));
      }
      pts.push(new THREE.Vector3(b[0], Y + 0.07, b[1]));
      return { pts, L, ux, uz, nx, nz, ang };
    };
    /* generic link: two white A-frame pylons with fanned stay cables */
    const stays = (a, b, d, Y) => {
      const { L, ux, uz, nx, nz, ang } = d;
      for (const f of [1 / 3, 2 / 3]) {
        const px = a[0] + (b[0] - a[0]) * f, pz = a[1] + (b[1] - a[1]) * f, PH = 2.4;
        for (const o of [-0.36, 0.36]) sp("box", px + nx * o * 0.6, Y + PH / 2, pz + nz * o * 0.6, 0.12, PH + 0.2, 0.12, "#f4f6f8", -ang, 0, 0);
        sp("box", px, Y + PH, pz, 0.14, 0.12, 0.6, "#f4f6f8", -ang); sp("sphere", px, Y + PH + 0.12, pz, 0.06, 0.06, 0.06, "#ff5a5a", 0, 0, 0, true);
        const ph = Y - WATER_Y; sp("box", px, WATER_Y + ph / 2, pz, 0.5, ph, 0.7, "#cfc9bd", -ang);
        for (const side of [-1, 1]) for (let c = 1; c <= 5; c++) { const dd = c * (L / 3 / 2) / 5.5 * side, ex = px + ux * dd, ez = pz + uz * dd, len = Math.hypot(dd, PH - 0.15); for (const o of [-0.22, 0.22]) sp("box", (px + ex) / 2 + nx * o, Y + (PH - 0.1) / 2 + 0.05, (pz + ez) / 2 + nz * o, len, 0.012, 0.012, "#e8edf2", -ang, 0, Math.atan2(-(PH - 0.15), dd)); }
      }
      return Y + 2.55;
    };
    /* 關渡大橋: red steel through-arch over the deck with vertical hangers (original low-poly take) */
    const arch = (a, b, d, Y) => {
      const { L, nx, nz, ang } = d, f0 = 0.2, f1 = 0.8, AH = Math.min(2.0, L * 0.14), NS = 14;
      const yAt = (t) => Y + 0.08 + Math.sin(Math.PI * t) * AH;
      for (const o of [-0.3, 0.3]) {
        let pf = f0, py = yAt(0);
        for (let k = 1; k <= NS; k++) {
          const t = k / NS, f = f0 + (f1 - f0) * t, y = yAt(t);
          const x0 = a[0] + (b[0] - a[0]) * pf + nx * o, z0 = a[1] + (b[1] - a[1]) * pf + nz * o;
          const x1 = a[0] + (b[0] - a[0]) * f + nx * o, z1 = a[1] + (b[1] - a[1]) * f + nz * o;
          const run = L * (f - pf), rise = y - py, len = Math.hypot(run, rise);
          sp("box", (x0 + x1) / 2, (py + y) / 2, (z0 + z1) / 2, len + 0.02, 0.08, 0.08, "#e0453c", -ang, 0, Math.atan2(rise, run));
          pf = f; py = y;
        }
      }
      for (let k = 1; k < NS; k++) {
        const t = k / NS, f = f0 + (f1 - f0) * t, y = yAt(t), x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
        if (k % 2 === 0) sp("box", x, y, z, 0.06, 0.06, 0.66, "#e0453c", -ang); // wind braces between the two ribs
        if (y - Y > 0.4) for (const o of [-0.3, 0.3]) sp("box", x + nx * o, (y + Y) / 2 + 0.03, z + nz * o, 0.025, y - Y - 0.16, 0.025, "#f0a39a"); // hangers
      }
      return Y + 0.08 + AH;
    };
    /* 淡江大橋: one white pylon, inclined legs meeting over the deck, cables fanning both ways */
    const mono = (a, b, d, Y) => {
      const { L, ux, uz, nx, nz, ang } = d, f = 0.42, PH = 3.3;
      const px = a[0] + (b[0] - a[0]) * f, pz = a[1] + (b[1] - a[1]) * f, ph = Y - WATER_Y;
      sp("box", px, WATER_Y + ph / 2, pz, 0.55, ph, 0.9, "#cfc9bd", -ang);
      for (const s of [-1, 1]) {
        const legH = PH * 0.62, run = -s * 0.36, len = Math.hypot(run, legH);
        sp("box", px + nx * s * 0.28, Y + legH / 2, pz + nz * s * 0.28, len, 0.16, 0.14, "#f4f6f8", -(ang + Math.PI / 2), 0, Math.atan2(legH, run));
      }
      sp("box", px, Y + PH * 0.62 + (PH * 0.38) / 2, pz, 0.14, PH * 0.38 + 0.1, 0.14, "#f4f6f8");
      sp("box", px, Y + 0.95, pz, 0.12, 0.1, 1.0, "#f4f6f8", -ang);
      sp("sphere", px, Y + PH + 0.1, pz, 0.06, 0.06, 0.06, "#ff5a5a", 0, 0, 0, true);
      for (const side of [-1, 1]) for (let c = 1; c <= 7; c++) {
        const reach = Math.min(L * 0.36, 5.2), dd = (c / 7) * reach * side, ex = px + ux * dd, ez = pz + uz * dd;
        const topY = Y + PH - 0.15 - c * 0.06, len = Math.hypot(dd, topY - Y - 0.1);
        for (const o of [-0.2, 0.2]) sp("box", (px + ex) / 2 + nx * o, (topY + Y + 0.1) / 2, (pz + ez) / 2 + nz * o, len, 0.012, 0.012, "#e8edf2", -ang, 0, Math.atan2(-(topY - Y - 0.1), dd));
      }
      return Y + PH + 0.15;
    };
    const build = (a, b, ca, cb, kind, name) => {
      const Y = R[ca].deck, d = deck(a, b, Y);
      const top = kind === "arch" ? arch(a, b, d, Y) : kind === "mono" ? mono(a, b, d, Y) : stays(a, b, d, Y);
      WORLD.bridgeEnds.push(a, b);
      WORLD.highways.push({ city: ca, pts: d.pts });
      WORLD.bridges.push({ a, b, ca, cb, name });
      if (name) { // a named bridge carries a landmark tag over its main span (anchored to the sea, not to an island lift)
        const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
        const isl = islands.reduce((p, m) => (Math.hypot(m.c.x - mx, m.c.z - mz) < Math.hypot(p.c.x - mx, p.c.z - mz) ? m : p));
        LANDMARKS3D.push({ id: name, name, isl, x: mx - isl.c.x, z: mz - isl.c.z, top: top + 0.1, city: cb, sc: 1, r: 1, nature: false, fixed: true });
      }
      return d;
    };
    for (const [ca, cb] of pairs) {
      const A2 = R[ca], B2 = R[cb]; let best = null, bd = Infinity;
      for (let i = 0; i < A2.pts.length; i += 2) for (let j = 0; j < B2.pts.length; j += 2) { const a = A2.pts[i], b = B2.pts[j], dd = Math.hypot(a[0] - b[0], a[1] - b[1]); if (dd < bd) { bd = dd; best = [a, b]; } }
      const [a, b] = best, d = build(a, b, ca, cb, "stays");
      // ferries shuttle alongside the bridge, kept between the two ring roads so bigger boats never pass under a deck
      for (const off of [-3.2, 3.4]) {
        const sx = a[0] + d.nx * off, sz = a[1] + d.nz * off, ex = b[0] + d.nx * off, ez = b[1] + d.nz * off;
        WORLD.ferryRoutes.push({ ax: sx + d.ux * 1.2, az: sz + d.uz * 1.2, bx: ex - d.ux * 1.2, bz: ez - d.uz * 1.2 });
      }
    }
    /* Taipei–New Taipei: the two named crossings span the strait face-to-face — picked on the stretches of each ring
       that look at the other island (not by their real coordinates), kept a third of that frontage apart */
    if (R.taipei && R.newtaipei) {
      const NAMED = [["淡江大橋", "mono"], ["關渡大橋", "arch"]]; // white single-pylon cable-stay at sea, red steel arch inland of it
      const cenOf = (pts) => pts.reduce((m, q) => [m[0] + q[0] / pts.length, m[1] + q[1] / pts.length], [0, 0]);
      const cA = cenOf(R.taipei.pts), cB = cenOf(R.newtaipei.pts), dirAB = Math.atan2(cB[1] - cA[1], cB[0] - cA[0]);
      const facing = (pts, cen, dir) => pts.filter((q) => { let d = Math.atan2(q[1] - cen[1], q[0] - cen[0]) - dir; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) < Math.PI / 3; });
      const fA = facing(R.taipei.pts, cA, dirAB), fB = facing(R.newtaipei.pts, cB, dirAB + Math.PI);
      const tAng = (q) => { let d = Math.atan2(q[1] - cA[1], q[0] - cA[0]) - dirAB; return Math.atan2(Math.sin(d), Math.cos(d)); };
      const byAng = [...fA].sort((q1, q2) => tAng(q1) - tAng(q2));
      let arc = 0; for (let i = 1; i < byAng.length; i++) arc += Math.hypot(byAng[i][0] - byAng[i - 1][0], byAng[i][1] - byAng[i - 1][1]);
      const ptAt = (f) => { let h = arc * f; for (let i = 1; i < byAng.length; i++) { const L2 = Math.hypot(byAng[i][0] - byAng[i - 1][0], byAng[i][1] - byAng[i - 1][1]); if (h <= L2) return byAng[i - 1]; h -= L2; } return byAng[byAng.length - 1] || cA; };
      const targets = [ptAt(0.28), ptAt(0.72)], sep = Math.max(5, arc / 3);
      WORLD.namedBridgeSpacing = sep;
      const segX = (a, b, c2, d2) => { const cr = (q1, q2, q3) => (q2[0] - q1[0]) * (q3[1] - q1[1]) - (q2[1] - q1[1]) * (q3[0] - q1[0]); return cr(a, b, c2) * cr(a, b, d2) < 0 && cr(c2, d2, a) * cr(c2, d2, b) < 0; };
      const crosses = (a, b) => WORLD.bridges.some((B2) => segX(a, b, B2.a, B2.b)) || WORLD.ferryRoutes.some((f2) => segX(a, b, [f2.ax, f2.az], [f2.bx, f2.bz]));
      const placed = [];
      NAMED.forEach(([name, kind], ni) => {
        const tgt = targets[ni], cand = [];
        for (const a of fA) for (const b of fB) cand.push([Math.hypot(a[0] - b[0], a[1] - b[1]) + 0.9 * Math.hypot(a[0] - tgt[0], a[1] - tgt[1]), a, b]);
        cand.sort((q1, q2) => q1[0] - q2[0]);
        const ok = (need) => cand.find(([, a, b]) => overWater(a, b) && !crosses(a, b) && placed.every(([pa, pb]) => Math.min(Math.hypot(a[0] - pa[0], a[1] - pa[1]), Math.hypot(b[0] - pb[0], b[1] - pb[1])) > need));
        const hit = ok(sep); // keep the requested minimum spacing; never silently narrow the crossings
        if (!hit) return;
        const [, a, b] = hit; placed.push([a, b]);
        build(a, b, "taipei", "newtaipei", kind, name);
      });
    }
  }
  /* ---------- occupied waterfront fragments: promenade retail, mobility hubs and exhibition pavilions ---------- */
  WORLD.waterfrontPlots=[];
  for(const [city,info] of WORLD.cities){
    const cells=WORLD.hexCells.filter(c=>c.city===city),placed=[];
    let distance=0;
    for(let k=0;k<info.coast.length;k++){
      const edge=info.coast[k],prev=info.coast[(k+info.coast.length-1)%info.coast.length];
      distance+=Math.hypot(edge[0]-prev[0],edge[1]-prev[1]);if(distance<1.15)continue;distance=0;
      const dx=info.center[0]-edge[0],dz=info.center[1]-edge[1],d=Math.hypot(dx,dz),wx=edge[0]+dx/d*.65,wz=edge[1]+dz/d*.65;
      if(!GEOM.pip(wx,wz,info.coast)||GEOM.nearestEdge(wx,wz,info.coast).d<.35)continue;
      if(cells.some(c=>GEOM.pip(wx,wz,c.poly)||GEOM.nearestEdge(wx,wz,c.poly).d<.25))continue;
      if(placed.some(p=>Math.hypot(p[0]-wx,p[1]-wz)<.8)||(WORLD.bridgeEnds||[]).some(p=>Math.hypot(p[0]-wx,p[1]-wz)<2))continue;
      if(LANDMARKS3D.some(L=>Math.hypot(L.isl.c.x+L.x-wx,L.isl.c.z+L.z-wz)<L.r+.5))continue;
      const r=rng(k+hash(city)),ctx=ctxFor("_static",null,wx,wz,1,-Math.atan2(dz,dx)+Math.PI/2),p=(g,...a)=>part(ctx,g,...a);
      p("box",0,.01,0,.58,.02,.5,"#c7c1ad");
      if(placed.length%3===0){
        p("fglass",0,.2,0,.44,.38,.3,"#638b99");p("prism",0,.45,0,.55,.13,.44,"#b8c6c4");
        p("box",0,.09,.21,.5,.025,.13,"#537a83");
      }else if(placed.length%3===1){
        B.shop(p,.46,.4,r);p("box",0,.55,0,.47,.025,.37,"#ad8563");SOLAR(p,0,.58,0,.35,.26);
      }else{
        p("box",0,.035,0,.54,.07,.45,"#b2b8b4");
        for(const x of [-.18,0,.18]){p("box",x,.17,0,.09,.27,.1,"#7fa7a7");p("box",x,.18,.055,.06,.09,.01,"#b4e1e7",0,0,0,"cool");}
        p("box",0,.39,0,.58,.035,.4,"#8aa3a6");SOLAR(p,0,.42,0,.5,.3);
      }
      placed.push([wx,wz]);WORLD.waterfrontPlots.push({city,x:wx,z:wz});
    }
  }

}
