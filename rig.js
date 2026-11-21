/* ก้อนเกี๊ยว: ตัวละครแบบโครงกระดูก 2D มองด้านข้าง ใช้ IK ขยับท่าออกกำลังกาย
   วาดบน canvas  RIG.mount(canvas, {ex, mode:"loop"|"session", state:()=>({tm,expr,idle,cheer})}) */
const RIG = (() => {
  let SKIN = "#FFF1D6"; const PI = Math.PI, cl = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t, lerp2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
  const sm = (a, b, x) => { x = cl((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const hexv = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hexv(a), B = hexv(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const D = { H: .8, neck: -.2, T: .7, a1: .38, a2: .36, l1: .45, l2: .45, f: .32, shoe: .22, tw: [.7, .76], aw: [.24, .22], lw: [.3, .27], ol: .04 };
  D.L = D.a1 + D.a2; D.l = (D.l1 + D.l2) / 2; D.ah = D.shoe / 2;
  const INK = "#2A1D45", CHEEK = "#F58AB0";

  function ik(p0, p1, l1, l2, bend) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy) || 1e-6;
    const dd = cl(d, Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3), a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, l1 * l1 - a * a)), ux = dx / d, uy = dy / d;
    return { mid: [p0[0] + ux * a - uy * h * bend, p0[1] + uy * a + ux * h * bend], end: [p0[0] + ux * dd, p0[1] + uy * dd] };
  }
  function bodyLine(Sy, A) {
    const Lb = D.l1 + D.l2 + D.T, dy = Sy - A[1], dx = Math.sqrt(Math.max(.01, Lb * Lb - dy * dy)), k = (D.l1 + D.l2) / Lb;
    return { S: [A[0] + dx, Sy], hip: [A[0] + dx * k, A[1] + dy * k], th: Math.atan2(dx * (1 - k), dy * (1 - k)), dx };
  }
  const raw = (tm, p) => .5 - .5 * Math.cos(tm / p * 2 * PI), ph2 = (tm, p) => Math.sin(tm / p * 2 * PI) > 0;
  const stand = (hip, th, hb, o) => Object.assign({ hip, th, hb, d: 0, ox: 0, ph: "คงท่า", feet: [{ a: [.08, D.ah], fa: 0 }, { a: [0, D.ah], fa: 0 }], hands: S => [[S[0] + .02, S[1] - D.L * .95], [S[0], S[1] - D.L * .95]] }, o);
  function gait(tm, per, st, lift, bob, lean, amp) {
    const ph = tm / per * 2 * PI, S = st * D.l, hy = Math.sqrt(Math.max(.1, ((D.l1 + D.l2) * .985) ** 2 - S * S));
    const leg = p0 => { const p = ((p0 / (2 * PI)) % 1 + 1) % 1; if (p < .5) { const u = p / .5; return { a: [S * (1 - 2 * u), D.ah], fa: 0 }; } const u = (p - .5) / .5; return { a: [S * (-1 + 2 * u), D.ah + lift * D.l * Math.sin(PI * u)], fa: -.45 * Math.sin(PI * u) }; };
    const arm = (c, Sh) => [Sh[0] + D.L * (.1 + amp * c), Sh[1] + D.L * (-.5 + .3 * amp * c - (amp > .4 ? .0 : .0))];
    return { hip: [0, D.ah + hy - bob * D.l * Math.cos(2 * ph)], th: lean, hb: -.12, d: .5, ph: "ก้าว", ox: 0, run: true, feet: [leg(ph + PI), leg(ph)], hands: Sh => [arm(Math.cos(ph), Sh), arm(-Math.cos(ph), Sh)] };
  }
  const EX = {
    squat: { period: 3, pose(tm, P) { const d = sm(.04, .96, raw(tm, P)), th = .08 + .8 * d; return { hip: lerp2([0, D.l1 + D.l2 + D.ah - .02], [-.48 * D.l1, D.ah + 1.04 * D.l2], d), th, hb: -.55 * th, d, ph: ph2(tm, P) ? "ลง" : "ขึ้น", ox: .05, feet: [{ a: [.08, D.ah], fa: 0 }, { a: [0, D.ah], fa: 0 }], hands: S => { const t = [S[0] + D.L * .9, S[1] + D.L * .05 - .1 * d]; return [[t[0] + .05, t[1]], t]; } }; } },
    pushup: { period: 2.6, pose(tm, P) { const d = sm(.04, .96, raw(tm, P)), hr = D.aw[0] / 2, A = [0, .89 * D.f + D.ah], B = bodyLine(lerp(D.L * .97 + hr, D.L * .34 + hr, d), A); return { hip: B.hip, th: B.th, hb: 0, d, ph: ph2(tm, P) ? "ลง" : "ขึ้น", ox: B.dx * .5, feet: [{ a: A, fa: -1.1 }, { a: A, fa: -1.1 }], hands: S => [[S[0] + .04, hr], [S[0], hr]] }; } },
    plank: { period: 4, pose(tm, P) { const hr = D.aw[0] / 2, A = [0, .89 * D.f + D.ah], B = bodyLine(D.a1 + hr + .03 + .015 * Math.sin(tm * 1.6), A); return { hip: B.hip, th: B.th, hb: 0, d: .3, ph: "คงท่า", ox: B.dx * .5 + D.a2 * .3, feet: [{ a: A, fa: -1.1 }, { a: A, fa: -1.1 }], hands: S => [[S[0] + D.a2 * .98 + .04, hr], [S[0] + D.a2 * .98, hr]] }; } },
    lunge: { period: 3.4, pose(tm, P) { const d = sm(.04, .96, raw(tm, P)), l = D.l; return { hip: lerp2([0, 1.6 * l + D.ah], [.1 * l, 1.15 * l + D.ah], d), th: .06, hb: 0, d, ph: ph2(tm, P) ? "ลง" : "ขึ้น", ox: -.1, feet: [{ a: [-1.1 * l, .78 * D.f + D.ah], fa: -.9 }, { a: [.9 * l, D.ah], fa: 0 }], hands: S => [[S[0] - .02, S[1] - .6 * D.L], [S[0] + .05 * D.L, S[1] - .6 * D.L]] }; } },
    jack: { period: 1.3, pose(tm, P) {
      const d = sm(0, 1, raw(tm, P)), sp = .55 * D.l * d, hop = .14 * D.l * Math.sin(PI * d), a = lerp(-PI / 2, PI / 2 * .95, d), hy = D.ah + Math.sqrt(Math.max(.1, ((D.l1 + D.l2) * .985) ** 2 - sp * sp)) + hop;
      return { hip: [0, hy], th: .03, hb: 0, d, ph: "กระโดด", ox: 0, feet: [{ a: [-sp, D.ah + hop], fa: 0 }, { a: [sp + .06, D.ah + hop], fa: 0 }], hands: S => [[S[0] + .95 * D.L * Math.cos(a) + .04, S[1] + .95 * D.L * Math.sin(a)], [S[0] + .95 * D.L * Math.cos(a), S[1] + .95 * D.L * Math.sin(a)]] }; } },
    situp: { period: 3, pose(tm, P) {
      const d = sm(.06, .94, raw(tm, P)), y = D.tw[0] / 2 + .02;
      return { hip: [0, y], th: lerp(-1.52, .2, d), hb: lerp(.95, 0, d), d, ph: ph2(tm, P) ? "ขึ้น" : "ลง", ox: lerp(-.55, -.1, d), feet: [{ a: [.62, D.ah], fa: 0 }, { a: [.55, D.ah], fa: 0 }], hands: S => [[S[0] + .1, S[1] - .28 * D.L], [S[0] + .05, S[1] - .3 * D.L]] }; } },
    walk: { period: 1.15, pose: (tm, P) => Object.assign(gait(tm, P, .4, .16, .015, .05, .3), { ph: "เดิน", ox: 0 }) },
    run: { period: .72, pose: (tm, P) => gait(tm, P, .65, .55, .05, .22, .5) },
    fold: { period: 4.2, pose(tm, P) { const d = sm(.05, .95, raw(tm, P)), l = D.l; return { hip: [-.2 * l * d, D.ah + D.l1 + D.l2 - .01], th: .05 + 1.5 * d, hb: .25 * d, d, ph: ph2(tm, P) ? "ลง" : "ขึ้น", ox: .3 * l * d, feet: [{ a: [.04, D.ah], fa: 0 }, { a: [0, D.ah], fa: 0 }], hands: S => { const h = [S[0] + .05, S[1] - D.L * .98], f = [.3 * D.f + .2 * l, .12], t = lerp2(h, f, d * .85); return [[t[0] + .04, t[1]], t]; } }; } }
  };

  /* ---------- ท่าเพิ่ม ---------- */
  const Hs = D.l1 + D.l2, hr0 = D.aw[0] / 2, lyY = D.tw[0] / 2 + .02, reach = (p, L, a) => [p[0] + L * Math.cos(a), p[1] + L * Math.sin(a)];
  const hang = S => [[S[0] + .02, S[1] - D.L * .95], [S[0], S[1] - D.L * .95]];
  const ground2 = (x, a) => S => [[S[0] + x, hr0], [S[0] + a, hr0]];
  const blend = (A, B, w) => ({ hip: lerp2(A.hip, B.hip, w), th: lerp(A.th, B.th, w), hb: lerp(A.hb, B.hb, w), d: lerp(A.d || 0, B.d || 0, w), ox: lerp(A.ox || 0, B.ox || 0, w), ph: "เบอร์ปี",
    feet: A.feet.map((f, i) => ({ a: lerp2(f.a, B.feet[i].a, w), fa: lerp(f.fa, B.feet[i].fa, w) })), hands: S => { const a = A.hands(S), b = B.hands(S); return a.map((h, i) => lerp2(h, b[i], w)); } });
  const upd = (tm, P) => ((tm / P) % 1 + 1) % 1, seg = (u, a, b) => sm(0, 1, (u - a) / (b - a));
  Object.assign(EX, {
    calf: { period: 2, pose(tm, P) { const d = sm(.08, .92, raw(tm, P)), fa = -d * .75, tip = [.08 + .8 * D.f, D.ah], an = [tip[0] - .8 * D.f * Math.cos(fa), tip[1] - .8 * D.f * Math.sin(fa)];
      return stand([an[0], an[1] + Hs - .02], .02, 0, { d, ph: ph2(tm, P) ? "ขึ้น" : "ลง", feet: [{ a: [an[0] + .05, an[1]], fa }, { a: an, fa }] }); } },
    bridge: { period: 3, pose(tm, P) { const d = sm(.08, .92, raw(tm, P)), S0 = [-.78, .4], hy = lerp(.36, .74, d), hx = S0[0] + Math.sqrt(Math.max(.01, D.T * D.T - (hy - S0[1]) ** 2)), th = Math.atan2(S0[0] - hx, S0[1] - hy);
      return { hip: [hx, hy], th, hb: -.6 - th, d, ph: ph2(tm, P) ? "ขึ้น" : "ลง", ox: -.25, feet: [{ a: [.55, D.ah], fa: 0 }, { a: [.5, D.ah], fa: 0 }], hands: ground2(.62, .58) }; } },
    highknee: { period: .6, pose: (tm, P) => Object.assign(gait(tm, P, .1, 1.05, .05, .02, .55), { ph: "ยกเข่า" }) },
    buttkick: { period: .7, pose(tm, P) { const ph = tm / P * 2 * PI, l = D.l, leg = p0 => { const p = ((p0 / (2 * PI)) % 1 + 1) % 1; if (p < .5) { const u = p / .5; return { a: [.22 * l * (1 - 2 * u), D.ah], fa: 0 }; } const u = (p - .5) / .5, s = Math.sin(PI * u); return { a: [-.22 * l - .5 * l * s, D.ah + 1.05 * l * s], fa: -.8 * s }; };
      return { hip: [0, D.ah + Hs * .97 - .04 * Math.cos(2 * ph)], th: .05, hb: 0, d: .5, ph: "เตะส้น", ox: 0, feet: [leg(ph + PI), leg(ph)], hands: Sh => { const c = Math.cos(ph), f = (k) => [Sh[0] + D.L * (.1 + .3 * k), Sh[1] - D.L * (.5 - .2 * k)]; return [f(-c), f(c)]; } }; } },
    climber: { period: 1, pose(tm, P) { const A = [0, .89 * D.f + D.ah], B = bodyLine(D.L * .9 + hr0 + .02, A), f = tm / P * 2 * PI, K = [B.hip[0] + .2, .42], s1 = Math.max(0, Math.sin(f)), s2 = Math.max(0, -Math.sin(f));
      return { hip: [B.hip[0], B.hip[1] + .03], th: B.th, hb: 0, d: .5, ph: "ปีน", ox: B.dx * .5, feet: [{ a: lerp2(A, K, s2), fa: lerp(-1.1, -.5, s2) }, { a: lerp2(A, K, s1), fa: lerp(-1.1, -.5, s1) }], hands: S => [[S[0] + .04, hr0], [S[0], hr0]] }; } },
    burpee: { period: 4.4, pose(tm, P) {
      const u = upd(tm, P), kStand = () => stand([0, Hs + D.ah - .02], .03, 0), kSquat = () => Object.assign(EX.squat.pose(1.5, 3), { hands: S => [[.52, hr0], [.46, hr0]] }), kPlank = () => EX.pushup.pose(0, 2.6),
        kJump = () => stand([0, Hs + D.ah + .2], 0, 0, { feet: [{ a: [.08, D.ah + .2], fa: .2 }, { a: [0, D.ah + .2], fa: .2 }], hands: S => [[S[0] + .2, S[1] + D.L * .9], [S[0] + .1, S[1] + D.L * .95]] });
      let A, B, w = 0;
      if (u < .12) { A = kStand; B = kSquat; w = seg(u, 0, .12); } else if (u < .3) { A = kSquat; B = kPlank; w = seg(u, .12, .3); } else if (u < .4) { A = B = kPlank; } else if (u < .55) { A = kPlank; B = kSquat; w = seg(u, .4, .55); }
      else if (u < .75) { A = kSquat; B = kJump; w = seg(u, .55, .75); } else if (u < .9) { A = kJump; B = kStand; w = seg(u, .75, .9); } else { A = B = kStand; }
      const r = blend(A(), B(), w); r.d = u > .08 && u < .92 ? .5 : 0; return r; } },
    legraise: { period: 3.2, pose(tm, P) { const d = sm(.08, .92, raw(tm, P)), hip = [0, lyY], a = lerp(.08, 1.45, d), p1 = reach(hip, Hs * .985, a), p2 = reach(hip, Hs * .985, a - .05);
      return { hip, th: -1.52, hb: .92, d, ph: ph2(tm, P) ? "ขึ้น" : "ลง", ox: -.1, feet: [{ a: p2, fa: a }, { a: p1, fa: a }], hands: ground2(.7, .66) }; } },
    crunch: { period: 2.4, pose(tm, P) { const d = sm(.06, .94, raw(tm, P)); return { hip: [0, lyY], th: lerp(-1.52, -.75, d), hb: lerp(.92, .45, d), d, ph: ph2(tm, P) ? "ขึ้น" : "ลง", ox: -.3, feet: [{ a: [.62, D.ah], fa: 0 }, { a: [.55, D.ah], fa: 0 }], hands: S => [[S[0] + .1, S[1] - .28 * D.L], [S[0] + .05, S[1] - .3 * D.L]] }; } },
    superman: { period: 3.4, pose(tm, P) { const d = sm(.08, .92, raw(tm, P)), hip = [0, lyY], a = .02 + .3 * d, th = 1.52 - .25 * d;
      return { hip, th, hb: -th - .12 * d, d, ph: ph2(tm, P) ? "ยก" : "ลง", ox: .27, feet: [{ a: [hip[0] - Hs * .985 * Math.cos(a - .04), hip[1] + Hs * .985 * Math.sin(a - .04)], fa: PI - a }, { a: [hip[0] - Hs * .985 * Math.cos(a), hip[1] + Hs * .985 * Math.sin(a)], fa: PI - a }], hands: S => { const b = .05 + .35 * d; return [[S[0] + .95 * D.L * Math.cos(b - .03), S[1] + .95 * D.L * Math.sin(b - .03)], reach(S, .95 * D.L, b)]; } }; } },
    jumpsquat: { period: 2.4, pose(tm, P) { const u = upd(tm, P); let d = 0, hop = 0; if (u < .4) d = sm(0, 1, u / .4); else if (u < .5) d = 1; else if (u < .62) d = 1 - sm(0, 1, (u - .5) / .12); if (u >= .6) hop = Math.sin(PI * (u - .6) / .4) * .26;
      const hip = lerp2([0, Hs + D.ah - .02], [-.48 * D.l1, D.ah + 1.04 * D.l2], d), th = .08 + .8 * d, g = lerp(.05, 1.25, cl(hop / .26, 0, 1));
      return { hip: [hip[0], hip[1] + hop], th, hb: -.55 * th, d, ph: u < .5 ? "ลง" : "กระโดด", ox: .05, feet: [{ a: [.08, D.ah + hop], fa: 0 }, { a: [0, D.ah + hop], fa: 0 }], hands: S => [reach(S, D.L * .9, g + .04), reach(S, D.L * .9, g)] }; } },
    press: { period: 3, dumb: true, pose(tm, P) { const d = sm(.06, .94, raw(tm, P)), rel = lerp2([.16, .08], [.05, D.L * .97], d); return stand([0, Hs + D.ah - .02], .03, 0, { d, dumb: true, ph: ph2(tm, P) ? "ดัน" : "ลง", hands: S => [[S[0] + rel[0] + .03, S[1] + rel[1]], [S[0] + rel[0], S[1] + rel[1]]] }); } },
    curl: { period: 2.8, pose(tm, P) { const d = sm(.06, .94, raw(tm, P)), f = lerp(.12, 2.35, d); return stand([0, Hs + D.ah - .02], .02, 0, { d, dumb: true, ph: ph2(tm, P) ? "ม้วน" : "ลง", hands: S => { const e = [S[0] + .02, S[1] - D.a1], h = [e[0] + D.a2 * Math.sin(f), e[1] - D.a2 * Math.cos(f)]; return [[h[0] + .03, h[1]], h]; } }); } },
    row: { period: 2.8, pose(tm, P) { const d = sm(.06, .94, raw(tm, P)), rel = lerp2([.03, -D.L * .97], [-.12, -.34 * D.L], d);
      return { hip: [-.2, D.ah + Hs * .93], th: 1.1, hb: -.5, d, dumb: true, ph: ph2(tm, P) ? "ดึง" : "ปล่อย", ox: 0, feet: [{ a: [.08, D.ah], fa: 0 }, { a: [0, D.ah], fa: 0 }], hands: S => [[S[0] + rel[0] + .03, S[1] + rel[1]], [S[0] + rel[0], S[1] + rel[1]]] }; } },
    deadlift: { period: 3.2, pose(tm, P) { const d = sm(.06, .94, raw(tm, P)); return { hip: lerp2([0, Hs + D.ah - .02], [-.32 * D.l, Hs + D.ah - .02 - .18 * D.l], d), th: .08 + 1.05 * d, hb: -.4 * d, d, dumb: true, ph: ph2(tm, P) ? "ลง" : "ขึ้น", ox: .1, feet: [{ a: [.08, D.ah], fa: 0 }, { a: [0, D.ah], fa: 0 }], hands: S => [[S[0] + .05, S[1] - D.L * .95], [S[0] + .02, S[1] - D.L * .95]] }; } },
    armcircle: { period: 2.2, pose(tm, P) { const al = tm / P * 2 * PI; return stand([0, Hs + D.ah - .02], .02, 0, { d: .4, ph: "หมุน", hands: S => [reach(S, .95 * D.L, al - .4), reach(S, .95 * D.L, al)] }); } },
    rope: { period: .55, pose(tm, P) { const b = tm / P * 2 * PI, hop = Math.abs(Math.sin(PI * tm / P)) * .1; return stand([0, Hs + D.ah - .02 + hop], .02, 0, { d: .5, ph: "กระโดด", rope: b, feet: [{ a: [.08, D.ah + hop * .9], fa: 0 }, { a: [0, D.ah + hop * .9], fa: 0 }], hands: S => [[S[0] + D.L * (.35 + .1 * Math.cos(b)) + .03, S[1] - D.L * (.5 - .13 * Math.sin(b))], [S[0] + D.L * (.35 + .1 * Math.cos(b)), S[1] - D.L * (.5 - .13 * Math.sin(b))]] }); } },
    catcow: { period: 4, pose(tm, P) { const d = raw(tm, P), th = 1.35 + .3 * (d - .5), hip = [0, .5];
      return { hip, th, hb: lerp(-.5, .6, d), d: .3, ph: ph2(tm, P) ? "โค้งหลัง" : "แอ่นหลัง", ox: .1, feet: [{ a: [-.5, D.ah], fa: PI }, { a: [-.52, D.ah], fa: PI }], hands: S => [[S[0] + .03, hr0], [S[0], hr0]] }; } },
    cobra: { period: 4, pose(tm, P) { const d = sm(.08, .92, raw(tm, P)), hip = [-.2, lyY], th = lerp(1.5, .8, d), a = [hip[0] - Hs * .98, D.ah + .02];
      return { hip, th, hb: -th * .85, d: .3, ph: ph2(tm, P) ? "ยก" : "ลง", ox: .2, feet: [{ a: [a[0] - .03, a[1]], fa: PI }, { a, fa: PI }], hands: S => [[.5, hr0], [.44, hr0]] }; } },
    cycle: { period: 1.2, pose(tm, P) { const f = tm / P * 2 * PI, cr = [.2, .4], R = .24, ped = a => [cr[0] + R * Math.cos(a), cr[1] + R * Math.sin(a)];
      return { hip: [-.12, .96], th: .95, hb: -.45, d: .5, ph: "ปั่น", ox: .3, bike: { cr, f }, feet: [{ a: ped(f + PI), fa: 0 }, { a: ped(f), fa: 0 }], hands: S => [[.98, 1.08], [.95, 1.06]] }; } },
    shadow: { period: 1, pose(tm, P) { const f = tm / P * 2 * PI, a = Math.max(0, Math.sin(f)), b = Math.max(0, -Math.sin(f)), bob = .02 * Math.abs(Math.sin(f * 2));
      return { hip: [0, Hs * .93 + D.ah - bob], th: .12, hb: 0, d: .5, ph: "ชก", ox: 0, feet: [{ a: [-.2, D.ah], fa: 0 }, { a: [.25, D.ah], fa: 0 }], hands: S => { const g = [S[0] + .22 * D.L, S[1] - .05], x = [S[0] + .95 * D.L, S[1]]; return [lerp2(g, x, b), lerp2(g, x, a)]; } }; } },
    wallsit: { period: 4, pose(tm, P) { const hip = [-.48 * D.l1, D.ah + 1.04 * D.l2 + .008 * Math.sin(tm * 11)];
      return { hip, th: .02, hb: 0, d: .6, ph: "คงท่า", ox: -.1, wall: hip[0] - D.tw[0] / 2 - .02, feet: [{ a: [.02, D.ah], fa: 0 }, { a: [0, D.ah], fa: 0 }], hands: S => [[S[0] + D.L * .9 + .05, S[1] - .08], [S[0] + D.L * .9, S[1] - .08]] }; } }
  });

  /* ---------- ท่าเพิ่ม (มีอุปกรณ์ประกอบฉาก pose.props) ---------- */
  const prop = {
    rect: (x0, y0, x1, y1, c) => ({ t: "rect", x0, y0, x1, y1, c: c || "#C9B6EA" }),
    line: (a, b, c, w) => ({ t: "line", a, b, c: c || "#F0679B", w: w || .05 }),
    disc: (x, y, rr, c) => ({ t: "disc", x, y, r: rr, c: c || "#52456E" })
  };
  const sqBase = (tm, P) => EX.squat.pose(tm, P);
  Object.assign(EX, {
    goblet: { period: 3, pose(tm, P) { const b = sqBase(tm, P); return Object.assign(b, { dumb: true, hands: S => [[S[0] + .2, S[1] - .22 * D.L], [S[0] + .16, S[1] - .24 * D.L]] }); } },
    bbsquat: { period: 3.4, pose(tm, P) { const b = sqBase(tm, P * .88 + 0); return Object.assign(b, { hands: S => [[S[0] + .12, S[1] + .04], [S[0] + .08, S[1] + .02]], propsFn: sk => [prop.disc(sk.sh[0] - .06, sk.sh[1] + .04, .3, "#52456E"), prop.disc(sk.sh[0] - .06, sk.sh[1] + .04, .13, "#8E7FB5")] }); } },
    kneepush: { period: 2.6, pose(tm, P) { const d = sm(.04, .96, raw(tm, P)), hr = D.aw[0] / 2, K = [0, D.shoe * .5 + .05], Lb = D.T + D.l1, Sy = lerp(D.L * .97 + hr, D.L * .34 + hr, d), dy = Sy - K[1], dx = Math.sqrt(Math.max(.01, Lb * Lb - dy * dy)), S = [K[0] + dx, Sy], k = D.l1 / Lb, hip = [K[0] + dx * k, K[1] + dy * k], th = Math.atan2(dx * (1 - k), dy * (1 - k));
      return { hip, th, hb: 0, d, ph: ph2(tm, P) ? "ลง" : "ขึ้น", ox: dx * .5, feet: [{ a: [K[0] - D.l2 * .9, D.ah], fa: PI }, { a: [K[0] - D.l2 * .86, D.ah], fa: PI }], hands: S2 => [[S2[0] + .04, hr], [S2[0], hr]] }; } },
    inclinepush: { period: 2.6, pose(tm, P) { const d = sm(.04, .96, raw(tm, P)), hr = D.aw[0] / 2, bh = .62, A = [0, .89 * D.f + D.ah], Sy = bh + lerp(D.L * .97, D.L * .34, d) + hr, B = bodyLine(Sy, A);
      return { hip: B.hip, th: B.th, hb: 0, d, ph: ph2(tm, P) ? "ลง" : "ขึ้น", ox: B.dx * .5, feet: [{ a: A, fa: -1.1 }, { a: A, fa: -1.1 }], hands: S => [[S[0] + .04, bh + hr], [S[0], bh + hr]], props: [prop.rect(B.S[0] - .45, 0, B.S[0] + .45, bh, "#C9B6EA")] }; } },
    dbbench: { period: 3, pose(tm, P) { const d = sm(.06, .94, raw(tm, P)), bh = .55, y = bh + D.tw[0] / 2 + .02, hip = [0, y];
      return { hip, th: -1.52, hb: .92, d, dumb: true, ph: ph2(tm, P) ? "ดัน" : "ลง", ox: -.3, feet: [{ a: [.62, D.ah], fa: 0 }, { a: [.56, D.ah], fa: 0 }], hands: S => { const t = lerp2([S[0] + .12, S[1] + .32 * D.L], [S[0] + .05, S[1] + .97 * D.L], d); return [[t[0] + .03, t[1]], t]; }, props: [prop.rect(-1.25, 0, .45, bh, "#C9B6EA")] }; } },
    pullup: { period: 3, pose(tm, P) { const d = sm(.06, .94, raw(tm, P)), barY = 2.8, Sy = lerp(barY - D.L * .97, barY - .25, d), S = [0, Sy], hip = [0, Sy - D.T];
      return { hip, th: 0, hb: -.2 * d, d, ph: ph2(tm, P) ? "ขึ้น" : "ลง", ox: .1, feet: [{ a: [-.08, hip[1] - Hs * .96], fa: -1.2 }, { a: [.04, hip[1] - Hs * .94], fa: -1.2 }], topY: 3.7, hands: () => [[.04, barY], [0, barY]], props: [prop.line([-1.35, barY + .04], [1.35, barY + .04], "#52456E", .07), prop.line([-1.35, barY + .04], [-1.35, 0], "#CBBCE0", .06), prop.line([1.35, barY + .04], [1.35, 0], "#CBBCE0", .06)] }; } },
    lat: { period: 3, pose(tm, P) { const d = sm(.06, .94, raw(tm, P)), sy = .5, hip = [-.2, sy + .05];
      return { hip, th: -.12 - .18 * d, hb: .1, d, ph: ph2(tm, P) ? "ดึง" : "ปล่อย", ox: .1, feet: [{ a: [.78, D.ah], fa: 0 }, { a: [.72, D.ah], fa: 0 }], hands: S => { const t = lerp2([S[0] + .18, S[1] + D.L * .95], [S[0] + .3, S[1] + .02], d); return [[t[0] + .03, t[1]], t]; }, topY: 3.5, propsFn: sk => { const h = sk.arms[1].hand; return [prop.rect(-.62, 0, .12, sy, "#C9B6EA"), prop.line([h[0], h[1]], [h[0] - .15, 3.2], "#52456E", .035), prop.line([h[0] - .3, h[1]], [h[0] + .3, h[1]], "#F0679B", .06)]; } }; } },
    stepup: { period: 2.8, pose(tm, P) { const d = sm(.06, .94, raw(tm, P)), bh = .6, hy = D.ah + Hs * .92 + bh * d, lift = .28 * Math.sin(PI * d);
      return { hip: [lerp(.1, .85, d), hy], th: .08, hb: 0, d, ph: ph2(tm, P) ? "ขึ้น" : "ลง", ox: .4, feet: [{ a: [lerp(-.05, .78, d), D.ah + bh * d + lift], fa: 0 }, { a: [.9, bh + D.ah], fa: 0 }], hands: S => [[S[0] + .02, S[1] - D.L * .95], [S[0], S[1] - D.L * .95]], props: [prop.rect(.6, 0, 1.3, bh, "#C9B6EA")] }; } },
    kbswing: { period: 1.8, pose(tm, P) { const ph = raw(tm, P), d = sm(0, 1, ph), th = .08 + .95 * (1 - d); const a = lerp(-1.25, .1, d);
      return { hip: lerp2([0, Hs + D.ah - .02], [-.3 * D.l, Hs + D.ah - .1], 1 - d), th, hb: -.35 * (1 - d), d: .5, dumb: true, ph: "สวิง", ox: .1, feet: [{ a: [.08, D.ah], fa: 0 }, { a: [0, D.ah], fa: 0 }], hands: S => [reach(S, .95 * D.L, a - .05), reach(S, .95 * D.L, a)] }; } },
    tricepdip: { period: 2.8, pose(tm, P) { const d = sm(.06, .94, raw(tm, P)), bh = .55, hr = D.aw[0] / 2, hx = -.18, Sy = bh + hr + lerp(D.L * .97, D.L * .4, d), S = [hx + .02, Sy], hip = [hx, Sy - D.T];
      return { hip, th: 0, hb: 0, d, ph: ph2(tm, P) ? "ลง" : "ขึ้น", ox: .1, feet: [{ a: [Hs * .88, D.ah], fa: .2 }, { a: [Hs * .84, D.ah], fa: .2 }], hands: () => [[hx - .06, bh + hr], [hx - .1, bh + hr]], props: [prop.rect(-1.0, 0, -.1, bh, "#C9B6EA")] }; } },
    revlunge: { period: 3.4, pose(tm, P) { const d = sm(.04, .96, raw(tm, P)), l = D.l, e = Math.min(1, d * 1.7), hip = lerp2([.85 * l, 1.78 * l + D.ah], [.12 * l, 1.15 * l + D.ah], d);
      return { hip, th: .06, hb: 0, d, ph: ph2(tm, P) ? "ลง" : "ขึ้น", ox: -.1, feet: [{ a: [lerp(.7 * l, -1.1 * l, e), lerp(D.ah, .78 * D.f + D.ah, e)], fa: lerp(0, -.9, e) }, { a: [.9 * l, D.ah], fa: 0 }], hands: S => [[S[0] - .02, S[1] - .6 * D.L], [S[0] + .05 * D.L, S[1] - .6 * D.L]] }; } }
  });
  EX.stretch = EX.fold;
  const CHEER = (tm) => { const hop = Math.abs(Math.sin(tm * 6)) * .18, a = .15 * Math.sin(tm * 6); return stand([0, D.l1 + D.l2 + D.ah + hop], 0, 0, { d: 0, ox: 0, ph: "เสร็จแล้ว", feet: [{ a: [.08, D.ah + hop * .9], fa: 0 }, { a: [0, D.ah + hop * .9], fa: 0 }], hands: S => [[S[0] + .25 + a, S[1] + D.L * .9], [S[0] + .12 - a, S[1] + D.L * .95]] }); };

  function solve(p) {
    const hip = p.hip, th = p.th, ha = th + p.hb, sh = [hip[0] + D.T * Math.sin(th), hip[1] + D.T * Math.cos(th)], hd = D.neck + D.H;
    return { hip, sh, ha, th, head: [sh[0] + hd * Math.sin(ha), sh[1] + hd * Math.cos(ha)],
      legs: p.feet.map(f => { const r = ik(hip, f.a, D.l1, D.l2, 1); return { knee: r.mid, ankle: r.end, fa: f.fa }; }),
      arms: p.hands(sh).map(h => { const r = ik(sh, h, D.a1, D.a2, -1); return { elbow: r.mid, hand: r.end }; }) };
  }
  function line(ctx, list, col, ol, olw) {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (ol) { ctx.strokeStyle = ol; for (const [a, b, w] of list) { ctx.lineWidth = w + 2 * olw; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
    ctx.strokeStyle = col; for (const [a, b, w] of list) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  }
  function circ(ctx, x, y, r, fill, olw) { ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * PI); ctx.lineWidth = olw * 2; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = fill; ctx.fill(); }
  function face(ctx, R, expr, blink, tm) {
    ctx.lineCap = "round";
    if (expr !== "tired") { ctx.globalAlpha = .75; ctx.fillStyle = CHEEK; ctx.beginPath(); ctx.ellipse(.58 * R, .2 * R, .16 * R, .1 * R, 0, 0, 2 * PI); ctx.fill(); ctx.globalAlpha = 1; }
    const ex = .38 * R, ey = -.02 * R; ctx.fillStyle = INK; ctx.strokeStyle = INK;
    if (expr === "cheer") { ctx.lineWidth = R * .07; ctx.beginPath(); ctx.arc(ex, ey + .08 * R, .11 * R, 1.15 * PI, 1.85 * PI); ctx.stroke(); }
    else { const ry = blink ? .02 * R : (expr === "tired" ? .08 * R : .13 * R); ctx.beginPath(); ctx.ellipse(ex, ey, .09 * R, Math.max(ry, .012 * R), 0, 0, 2 * PI); ctx.fill(); if (!blink && expr !== "tired") { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex + .025 * R, ey - .04 * R, .03 * R, 0, 2 * PI); ctx.fill(); } }
    if (expr === "focus" || expr === "tired") { ctx.lineWidth = R * .06; ctx.beginPath(); if (expr === "focus") { ctx.moveTo(.2 * R, -.3 * R); ctx.lineTo(.55 * R, -.2 * R); } else { ctx.moveTo(.2 * R, -.2 * R); ctx.lineTo(.55 * R, -.28 * R); } ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = R * .06;
    if (expr === "smile") { ctx.beginPath(); ctx.arc(.42 * R, .2 * R, .15 * R, .15 * PI, .85 * PI); ctx.stroke(); }
    else if (expr === "focus") { ctx.beginPath(); ctx.moveTo(.32 * R, .38 * R); ctx.lineTo(.52 * R, .38 * R); ctx.stroke(); }
    else if (expr === "tired") { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(.42 * R, .36 * R, .09 * R, .12 * R, 0, 0, 2 * PI); ctx.fill(); ctx.fillStyle = "#4FB3F2"; const sx = .78 * R, sy = -.5 * R + Math.sin(tm * 5) * .03 * R; ctx.beginPath(); ctx.moveTo(sx, sy - .16 * R); ctx.quadraticCurveTo(sx + .14 * R, sy + .06 * R, sx, sy + .1 * R); ctx.quadraticCurveTo(sx - .14 * R, sy + .06 * R, sx, sy - .16 * R); ctx.fill(); }
    else if (expr === "cheer") { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(.42 * R, .2 * R, .17 * R, 0, PI); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#F0679B"; ctx.beginPath(); ctx.ellipse(.42 * R, .33 * R, .08 * R, .045 * R, 0, 0, PI); ctx.fill(); }
  }
  function drawChar(ctx, sk, P, sc, expr, blink, tm, cols) {
    const olw = D.ol * sc, far = c => mix(c, "#24193B", .2), Hp = P(sk.hip), Sp = P(sk.sh), mid2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
    const leg = (i, dk) => { const L = sk.legs[i], kn = P(L.knee), an = P(L.ankle); line(ctx, [[Hp, kn, D.lw[0] * sc], [kn, an, D.lw[1] * sc]], dk ? far(SKIN) : SKIN, INK, olw); line(ctx, [[Hp, mid2(Hp, kn, .6), D.lw[0] * sc * 1.12]], dk ? far(cols.shorts) : cols.shorts, INK, olw);
      const dir = [Math.cos(L.fa), -Math.sin(L.fa)], f = D.f * sc; line(ctx, [[[an[0] - dir[0] * .12 * f, an[1] - dir[1] * .12 * f], [an[0] + dir[0] * f * .8, an[1] + dir[1] * f * .8], D.shoe * sc]], dk ? far(cols.shoe) : cols.shoe, INK, olw); };
    const arm = (i, dk) => { const A = sk.arms[i], el = P(A.elbow), ha = P(A.hand); line(ctx, [[Sp, el, D.aw[0] * sc], [el, ha, D.aw[1] * sc]], dk ? far(SKIN) : SKIN, INK, olw); line(ctx, [[Sp, mid2(Sp, el, .35), D.aw[0] * sc * 1.15]], dk ? far(cols.shirt) : cols.shirt, INK, olw); circ(ctx, ha[0], ha[1], D.aw[1] * sc * .62, dk ? far(SKIN) : SKIN, olw); if (cols.dumb) circ(ctx, ha[0], ha[1], .15 * sc, dk ? "#3d3352" : "#52456E", olw); };
    arm(0, true); leg(0, true);
    line(ctx, [[Hp, Sp, D.tw[0] * sc]], cols.shirt, INK, olw); line(ctx, [[Hp, mid2(Hp, Sp, .3), D.tw[0] * sc * 1.04]], cols.shorts, null, 0);
    const R = D.H * sc, [hx, hy] = P(sk.head); ctx.save(); ctx.translate(hx, hy); ctx.rotate(sk.ha);
    circ(ctx, 0, 0, R, SKIN, olw);
    ctx.fillStyle = SKIN; ctx.strokeStyle = INK; ctx.lineWidth = olw; ctx.beginPath(); ctx.ellipse(-.1 * R, -1.02 * R, .3 * R, .2 * R, -.2, 0, 2 * PI); ctx.fill(); ctx.stroke();
    ctx.lineWidth = R * .04; for (const a of [-.5, 0, .5]) { ctx.beginPath(); ctx.moveTo(-.1 * R + Math.sin(a) * .05 * R, -.93 * R); ctx.lineTo(-.1 * R + Math.sin(a) * .26 * R, -1.1 * R); ctx.stroke(); }
    ctx.globalAlpha = .35; ctx.lineWidth = R * .05; for (const x of [-.55, -.3, -.05]) { ctx.beginPath(); ctx.moveTo(x * R, -.78 * R + Math.abs(x) * .1 * R); ctx.quadraticCurveTo((x - .05) * R, -.9 * R, (x - .1) * R, -.96 * R); ctx.stroke(); } ctx.globalAlpha = 1;
    face(ctx, R, expr, blink, tm); ctx.restore();
    leg(1, false); arm(1, false);
  }
  /* ---------- มุมมองด้านหน้า ----------
     ท่าทั้งหมดคำนวณเป็นภาพด้านข้าง (x ไปข้างหน้า, y ขึ้นบน) ด้านหน้าจึงต่อยอดจากจุดข้อต่อเดิมเป็นสามมิติ:
     เติมระยะซ้ายขวาให้แต่ละข้อตามท่า แล้วฉายแบบเฉียงจากด้านหน้าเยื้องขึ้นบน (ส่วนที่ยื่นมาข้างหน้าจะต่ำลงบนจอและสั้นลงเอง) */
  const VIEW = { v: "side" }; try { if (localStorage.getItem("maalot_rigview") === "front") VIEW.v = "front"; } catch (e) { }
  const YAWX = { pushup: 52, plank: 52, climber: 52, catcow: 52, cobra: 48, superman: 48, fold: 40, stretch: 40, bridge: 42, legraise: 48, situp: 42, crunch: 42, burpee: 30, row: 30, deadlift: 25, cycle: 25, shadow: 18 };
  const camOf = ex => { const a = (YAWX[ex] || 0) * PI / 180; return { fk: FKX[ex] || FK, c: Math.cos(a), s: Math.sin(a), a }; };
  const FK = .42, FKX = { pushup: .75, plank: .75, climber: .7, catcow: .7, cobra: .6, superman: .6, fold: .55, stretch: .55, bridge: .55, legraise: .6, situp: .5, crunch: .5, burpee: .55, row: .5, deadlift: .5 };
  /* ระยะซ้ายขวา: l = ขา [สะโพก, เข่า, ข้อเท้า], a = แขน [ไหล่, ศอก, มือ], mode "lat" = หมุนระนาบแขนให้แกว่งออกข้างลำตัว */
  const lat = (ex, pose) => {
    const d = pose.d || 0; let l = [.11, .14, .16], a = [.27, .31, .31], mode = "sag";
    switch (ex) {
      case "squat": case "jumpsquat": l = [.11, .14 + .13 * d, .17 + .04 * d]; a = [.27, .2, .08]; break;
      case "lunge": l = [.11, .13, .13]; break;
      case "jack": l = [.11, .14 + .28 * d, .17 + .5 * d]; mode = "lat"; break;
      case "pushup": l = [.1, .11, .11]; a = [.27, .36 + .1 * d, .34]; break;
      case "plank": l = [.1, .11, .11]; a = [.27, .29, .29]; break;
      case "situp": case "crunch": l = [.11, .17, .17]; a = [.27, .3, .17]; break;
      case "legraise": l = [.07, .08, .08]; a = [.27, .34, .36]; break;
      case "bridge": l = [.12, .19, .2]; a = [.27, .33, .36]; break;
      case "superman": l = [.08, .09, .09]; a = [.2, .17, .14]; break;
      case "press": a = [.27, .5, .45 + .2 * d]; break;
      case "curl": a = [.27, .32, .31]; break;
      case "row": a = [.27, .3, .28]; break;
      case "deadlift": l = [.11, .14, .15]; a = [.27, .22, .2]; break;
      case "armcircle": a = [.27, .5, .7]; break;
      case "rope": l = [.09, .1, .1]; a = [.27, .36, .4]; break;
      case "fold": case "stretch": l = [.1, .11, .11]; a = [.27, .2, .16]; break;
      case "catcow": case "cobra": l = [.11, .12, .12]; a = [.27, .28, .28]; break;
      case "shadow": l = [.12, .17, .2]; a = [.27, .24, .13]; break;
      case "climber": l = [.1, .12, .12]; a = [.27, .3, .3]; break;
      case "burpee": l = [.12, .15, .16]; break;
      case "wallsit": l = [.12, .16, .16]; break;
      case "cheer": a = [.27, .62, .95]; break;
      case "run": case "buttkick": l = [.1, .12, .12]; break;
    }
    return { l, a, mode };
  };
  function faceF(ctx, R, expr, blink, tm) {
    ctx.lineCap = "round"; const ex = .36 * R, ey = -.02 * R;
    if (expr !== "tired") { ctx.globalAlpha = .75; ctx.fillStyle = CHEEK; for (const q of [-1, 1]) { ctx.beginPath(); ctx.ellipse(q * .62 * R, .22 * R, .16 * R, .1 * R, 0, 0, 2 * PI); ctx.fill(); } ctx.globalAlpha = 1; }
    ctx.fillStyle = INK; ctx.strokeStyle = INK;
    for (const q of [-1, 1]) {
      if (expr === "cheer") { ctx.lineWidth = R * .07; ctx.beginPath(); ctx.arc(q * ex, ey + .08 * R, .11 * R, 1.15 * PI, 1.85 * PI); ctx.stroke(); }
      else { const ry = blink ? .02 * R : (expr === "tired" ? .08 * R : .13 * R); ctx.beginPath(); ctx.ellipse(q * ex, ey, .09 * R, Math.max(ry, .012 * R), 0, 0, 2 * PI); ctx.fill(); if (!blink && expr !== "tired") { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(q * ex + .025 * R, ey - .04 * R, .03 * R, 0, 2 * PI); ctx.fill(); ctx.fillStyle = INK; } }
      if (expr === "focus" || expr === "tired") { ctx.lineWidth = R * .06; ctx.beginPath(); ctx.moveTo(q * .18 * R, (expr === "focus" ? -.3 : -.2) * R); ctx.lineTo(q * .56 * R, (expr === "focus" ? -.2 : -.28) * R); ctx.stroke(); }
    }
    ctx.strokeStyle = INK; ctx.lineWidth = R * .06;
    if (expr === "focus") { ctx.beginPath(); ctx.moveTo(-.13 * R, .38 * R); ctx.lineTo(.13 * R, .38 * R); ctx.stroke(); }
    else if (expr === "tired") { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, .36 * R, .09 * R, .12 * R, 0, 0, 2 * PI); ctx.fill(); ctx.fillStyle = "#4FB3F2"; const sx = .8 * R, sy = -.5 * R + Math.sin(tm * 5) * .03 * R; ctx.beginPath(); ctx.moveTo(sx, sy - .16 * R); ctx.quadraticCurveTo(sx + .14 * R, sy + .06 * R, sx, sy + .1 * R); ctx.quadraticCurveTo(sx - .14 * R, sy + .06 * R, sx, sy - .16 * R); ctx.fill(); }
    else if (expr === "cheer") { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, .2 * R, .2 * R, 0, PI); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#F0679B"; ctx.beginPath(); ctx.ellipse(0, .34 * R, .1 * R, .055 * R, 0, 0, PI); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(0, .18 * R, .17 * R, .15 * PI, .85 * PI); ctx.stroke(); }
  }
  function headF(ctx, x, y, R, pitch, yaw, expr, blink, tm) {
    ctx.save(); ctx.translate(x, y); const olw = D.ol * R / D.H;
    circ(ctx, 0, 0, R, SKIN, olw);
    if (pitch > 1.15 && pitch < 2.3) { /* ก้มหน้า: เห็นด้านบนศีรษะ มีจุกเกี๊ยวอยู่กลางหัว */
      const bx = Math.sin(yaw) * .18 * R; circ(ctx, bx, -.04 * R, .36 * R, SKIN, olw * .8); ctx.strokeStyle = INK; ctx.lineWidth = R * .04; ctx.lineCap = "round"; ctx.globalAlpha = .55;
      for (let k = 0; k < 6; k++) { const t = k / 6 * 2 * PI, cy = -.04 * R; ctx.beginPath(); ctx.moveTo(bx + Math.cos(t) * .1 * R, cy + Math.sin(t) * .1 * R); ctx.lineTo(bx + Math.cos(t) * .3 * R, cy + Math.sin(t) * .3 * R); ctx.stroke(); } ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = SKIN; ctx.strokeStyle = INK; ctx.lineWidth = olw; const tx = Math.sin(yaw) * .12 * R; ctx.beginPath(); ctx.ellipse(tx, -1.02 * R, .3 * R, .2 * R, 0, 0, 2 * PI); ctx.fill(); ctx.stroke();
      ctx.lineWidth = R * .04; ctx.lineCap = "round"; for (const a of [-.5, 0, .5]) { ctx.beginPath(); ctx.moveTo(tx + Math.sin(a) * .05 * R, -.93 * R); ctx.lineTo(tx + Math.sin(a) * .26 * R, -1.1 * R); ctx.stroke(); }
      ctx.save(); ctx.translate(Math.sin(yaw) * .3 * R, 0); ctx.scale(1 - .3 * Math.abs(Math.sin(yaw)), 1); faceF(ctx, R, expr, blink, tm); ctx.restore();
    }
    ctx.restore();
  }
  /* ข้อต่อสามมิติ [ซ้ายขวา, สูง, ไปข้างหน้า] */
  function jointsF(ex, pose, sk, T) {
    T = T || lat(ex, pose);
    return { hip: [0, sk.hip[1], sk.hip[0]], sh: [0, sk.sh[1], sk.sh[0]], head: [0, sk.head[1], sk.head[0]],
      legs: sk.legs.map((L, i) => { const q = i ? 1 : -1; return { h: [q * T.l[0], sk.hip[1], sk.hip[0]], k: [q * T.l[1], L.knee[1], L.knee[0]], a: [q * T.l[2], L.ankle[1], L.ankle[0]] }; }),
      arms: sk.arms.map((A, i) => { const q = i ? 1 : -1, sz = sk.sh[0]; let e, h;
        if (T.mode === "lat") { /* หมุนระนาบแขนให้กางออกข้างลำตัว: มุมจากแนวห้อยลง กางออก ไปจนยกสูง (จำกัดไม่ให้ตั้งตรงจนไปซ่อนหลังหัว) */
          const sw = (pt) => { const rx = pt[0] - sz, ry = pt[1] - sk.sh[1], L = Math.hypot(rx, ry), b = Math.min(Math.atan2(rx, -ry), 2.45); return [q * (T.a[0] + L * Math.sin(b)), sk.sh[1] - L * Math.cos(b), sz]; };
          e = sw(A.elbow); h = sw(A.hand); }
        else { const g = A.hand[1] < .3; e = [q * (g ? Math.max(T.a[1], .3) : T.a[1]), A.elbow[1], A.elbow[0]]; h = [q * (g ? Math.max(T.a[2], .33) : T.a[2]), A.hand[1], A.hand[0]]; }
        return { s: [q * T.a[0], sk.sh[1], sz], e, h }; }) };
  }
  /* กรอบภาพของท่านั้นทั้งรอบการเคลื่อนไหว (คำนวณครั้งเดียวแล้วจำไว้) ให้ขนาดและตำแหน่งนิ่ง ไม่กระโดดตามจังหวะ */
  const FBOX = {};
  function frontBox(ex) {
    if (FBOX[ex]) return FBOX[ex]; const def = EX[ex] || EX.squat, cam = camOf(ex); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const add = (X, Y, m) => { x0 = Math.min(x0, X - m); x1 = Math.max(x1, X + m); y0 = Math.min(y0, Y - m); y1 = Math.max(y1, Y + m); };
    for (let i = 0; i < 24; i++) {
      const pose = def.pose(i / 24 * def.period, def.period), sk = solve(pose), J = jointsF(ex, pose, sk), pj = (j, m) => add(j[0] * cam.c + j[2] * cam.s, j[1] - cam.fk * (j[2] * cam.c - j[0] * cam.s), m);
      pj(J.hip, .2); pj(J.sh, .3); pj(J.head, D.H); J.legs.forEach(l => { pj(l.k, .15); pj(l.a, .22); }); J.arms.forEach(a => { pj(a.e, .15); pj(a.h, .2); });
      add(0, 0, 0);
    }
    return FBOX[ex] = { x0, x1, y0, y1, cam };
  }
  function sceneFront(ctx, W, H, ex, pose, sk, st, now) {
    const stH = D.l1 + D.l2 + D.ah + D.T + 2 * D.H + .5, ext = D.l1 + D.l2 + D.T + 2 * D.H + .9, tm = st.tm || 0, bb = frontBox(st.cheer ? "calf" : ex), cam = bb.cam, fk = cam.fk, zc = 0, dep = j => j[2] * cam.c - j[0] * cam.s;
    const sc = Math.min(H * .8 / stH, W * .86 / ext, W * .92 / (bb.x1 - bb.x0), H * .8 / (bb.y1 - bb.y0)), cx = W / 2 - (bb.x0 + bb.x1) / 2 * sc, gy = H * .9 + bb.y0 * sc;
    const cols = { shirt: look().shirt, shorts: "#8155C9", shoe: "#F0679B", dumb: !!pose.dumb && !st.nodumb }; if (cols.shirt.toLowerCase() === "#8155c9") cols.shorts = "#4C5DDA";
    const T = lat(st.cheer ? "cheer" : ex, pose), olw = D.ol * sc, far = c => mix(c, "#24193B", .2), mid2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
    const J = jointsF(ex, pose, sk, T);
    const P = j => [cx + (j[0] * cam.c + j[2] * cam.s) * sc, gy - (j[1] - fk * dep(j)) * sc];
    const zs = [J.hip[2], J.sh[2], J.head[2]].concat(J.legs.map(l => l.a[2]), J.arms.map(a => a.h[2])), zmin = Math.min(...zs), zmax = Math.max(...zs);
    /* พื้นเป็นเสื่อ: ฉายมุมของพื้นที่ที่ตัวทอดไปถึง แล้วเอากรอบมาวาด */
    const cs = [[-.75, zmin - .4], [.75, zmin - .4], [-.75, zmax + .4], [.75, zmax + .4]].map(q => P([q[0], 0, q[1]])), mx0 = Math.min(...cs.map(q => q[0])), mx1 = Math.max(...cs.map(q => q[0])), my0 = Math.min(...cs.map(q => q[1])), my1 = Math.max(...cs.map(q => q[1]));
    const mxL = Math.min(mx0, W * .5 - W * .42), mxR = Math.max(mx1, W * .5 + W * .42), my = my0 - 2, mh = Math.max(my1 - my0 + 4, .26 * sc);
    if (pose.wall != null) { ctx.fillStyle = "#E8D9F5"; ctx.fillRect(0, 0, W, my + 6); }
    ctx.fillStyle = "#F3D9BF"; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(mxL, my, mxR - mxL, mh, Math.min(20, mh / 2)); else ctx.rect(mxL, my, mxR - mxL, mh); ctx.fill();
    const fz = (J.legs[0].a[2] + J.legs[1].a[2]) / 2, fy = P([0, 0, fz])[1]; ctx.fillStyle = "rgba(36,25,59,.14)"; ctx.beginPath(); ctx.ellipse(P([0, 0, fz])[0], Math.min(Math.max(fy, my + 4), my + mh - 3), Math.max(14, .75 * sc), Math.max(3, sc * .1), 0, 0, 2 * PI); ctx.fill();
    if (pose.rope != null) { const c = P([0, Hs * .95 + D.ah, zc]), rr = (Hs * .95 + D.ah) * sc; ctx.save(); ctx.strokeStyle = "#F0679B"; ctx.lineWidth = 3; ctx.setLineDash([rr * .5, rr * .35]); ctx.lineDashOffset = -pose.rope * rr * .3; ctx.beginPath(); ctx.ellipse(c[0], c[1], rr * .78, rr, 0, 0, 2 * PI); ctx.stroke(); ctx.restore(); }
    if (pose.bike) { const w = P([0, .52, 1.0]); ctx.save(); ctx.strokeStyle = "#2A1D45"; ctx.lineWidth = Math.max(2, .05 * sc); ctx.beginPath(); ctx.ellipse(w[0], w[1], .08 * sc, .52 * sc, 0, 0, 2 * PI); ctx.stroke(); const a = P([-.4, 1.07, .95]), b = P([.4, 1.07, .95]); ctx.strokeStyle = "#F0679B"; ctx.lineWidth = Math.max(3, .06 * sc); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore(); }
    const tz = (dep(J.hip) + dep(J.sh)) / 2, zOf = (...ps) => ps.reduce((q, p) => q + dep(p), 0) / ps.length, blink = (now % 3600) < 130;
    const drawLeg = L => { const dk = zOf(L.h, L.k, L.a) < tz - .35, h = P(L.h), k = P(L.k), a = P(L.a), sg = L.a[0] < 0 ? -1 : 1;
      line(ctx, [[h, k, D.lw[0] * sc * 1.1], [k, a, D.lw[1] * sc * 1.1]], dk ? far(SKIN) : SKIN, INK, olw); line(ctx, [[h, mid2(h, k, .6), D.lw[0] * sc * 1.26]], dk ? far(cols.shorts) : cols.shorts, INK, olw);
      ctx.beginPath(); ctx.ellipse(a[0] + sg * .04 * sc, a[1] + .03 * sc, .15 * sc, .1 * sc, 0, 0, 2 * PI); ctx.lineWidth = olw * 2; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = dk ? far(cols.shoe) : cols.shoe; ctx.fill(); };
    const drawArm = A => { const dk = zOf(A.e, A.h) < tz - .4, s = P(A.s), e = P(A.e), h = P(A.h);
      line(ctx, [[s, e, D.aw[0] * sc], [e, h, D.aw[1] * sc]], dk ? far(SKIN) : SKIN, INK, olw); line(ctx, [[s, mid2(s, e, .38), D.aw[0] * sc * 1.18]], dk ? far(cols.shirt) : cols.shirt, INK, olw);
      if (cols.dumb) { ctx.lineCap = "round"; ctx.strokeStyle = INK; ctx.lineWidth = .1 * sc + olw * 2; ctx.beginPath(); ctx.moveTo(h[0] - .15 * sc, h[1]); ctx.lineTo(h[0] + .15 * sc, h[1]); ctx.stroke(); ctx.strokeStyle = "#52456E"; ctx.lineWidth = .1 * sc; ctx.stroke(); }
      circ(ctx, h[0], h[1], D.aw[1] * sc * .62, dk ? far(SKIN) : SKIN, olw); };
    const drawTorso = () => { const sw = .28, hw = .21, sL = P([-sw, J.sh[1], J.sh[2]]), sR = P([sw, J.sh[1], J.sh[2]]), hL = P([-hw, J.hip[1], J.hip[2]]), hR = P([hw, J.hip[1], J.hip[2]]), nk = P(J.sh), hd = P(J.head);
      line(ctx, [[nk, hd, D.aw[0] * sc * .8]], SKIN, INK, olw);
      ctx.lineJoin = "round"; ctx.lineWidth = olw * 2; ctx.strokeStyle = INK; ctx.fillStyle = cols.shirt; ctx.beginPath(); ctx.moveTo(sL[0], sL[1]); ctx.lineTo(sR[0], sR[1]); ctx.lineTo(hR[0], hR[1]); ctx.lineTo(hL[0], hL[1]); ctx.closePath(); ctx.stroke(); ctx.fill();
      const pL = mid2(hL, sL, .3), pR = mid2(hR, sR, .3); ctx.fillStyle = cols.shorts; ctx.beginPath(); ctx.moveTo(hL[0], hL[1]); ctx.lineTo(hR[0], hR[1]); ctx.lineTo(pR[0], pR[1]); ctx.lineTo(pL[0], pL[1]); ctx.closePath(); ctx.fill(); };
    const drawHead = () => { const hd = P(J.head); headF(ctx, hd[0], hd[1], D.H * sc, sk.ha, cam.a, st.expr && st.expr !== "auto" ? st.expr : autoExpr(ex, pose), blink, tm); };
    const headBack = dep(J.head) < dep(J.sh) - .3;
    if (headBack) drawHead();
    J.legs.slice().sort((a, b) => zOf(a.h, a.k, a.a) - zOf(b.h, b.k, b.a)).forEach(drawLeg);
    drawTorso();
    J.arms.slice().sort((a, b) => zOf(a.e, a.h) - zOf(b.e, b.h)).forEach(drawArm);
    if (!headBack) drawHead();
  }
  function autoExpr(ex, pose) { if (/^(plank|run|walk|wallsit|catcow|cobra|armcircle|rope|climber|highknee|buttkick|cycle|shadow)$/.test(ex)) return ex === "catcow" || ex === "cobra" ? "smile" : "focus"; return pose.d > .82 ? "tired" : pose.d < .14 ? "smile" : "focus"; }

  function look() { try { const L = normLook(S.look); SKIN = /^#[0-9a-f]{6}$/i.test(L.skin) ? L.skin : "#FFF1D6"; return { shirt: /^#[0-9a-f]{6}$/i.test(L.oc) ? L.oc : "#8155C9" }; } catch (e) { return { shirt: "#8155C9" }; } }
  function scene(cv, ex, st, now) {
    const ctx = cv.getContext("2d"), dpr = cv._dpr, W = cv.width / dpr, H = cv.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = "#FFF1E3"; ctx.fillRect(0, 0, W, H);
    const def = EX[ex] || EX.squat, tm = st.tm || 0;
    let pose = st.cheer ? CHEER(tm) : def.pose(tm, st.period || def.period);
    if (st.idle) { pose.hip = [pose.hip[0], pose.hip[1] + .02 * Math.sin(now / 420) * (st.heavy ? 2.2 : 1)]; }
    const sk = solve(pose), stH = Math.max(D.l1 + D.l2 + D.ah + D.T + 2 * D.H + .5, pose.topY || 0), ext = D.l1 + D.l2 + D.T + 2 * D.H + .9, sc = Math.min(H * .8 / stH, W * .86 / ext), gy = H * .87, cx = W / 2;
    const P = pt => [cx + (pt[0] - pose.ox) * sc, gy - pt[1] * sc];
    if (!st.side && VIEW.v === "front") { sceneFront(ctx, W, H, ex, pose, sk, st, now); return pose; }
    ctx.fillStyle = "#F3D9BF"; ctx.fillRect(0, gy + 2, W, H - gy);
    const cols = { shirt: look().shirt, shorts: "#8155C9", shoe: "#F0679B", dumb: !!pose.dumb && !st.nodumb };
    if (cols.shirt.toLowerCase() === "#8155c9") cols.shorts = "#4C5DDA";
    const xs = [sk.hip[0], sk.sh[0], sk.head[0], ...sk.legs.map(l => l.ankle[0]), ...sk.arms.map(a => a.hand[0])], x0 = P([Math.min(...xs), 0])[0], x1 = P([Math.max(...xs), 0])[0];
    ctx.fillStyle = "rgba(36,25,59,.14)"; ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, gy + 4, Math.max(10, (x1 - x0) / 2 * .9), Math.max(3, sc * .08), 0, 0, 2 * PI); ctx.fill();
    if (pose.run) { ctx.strokeStyle = "rgba(36,25,59,.18)"; ctx.lineWidth = 3; ctx.lineCap = "round"; const off = (tm * sc * (ex === "run" ? 3.2 : 1.2)) % (sc * .9); for (let x = W * .06 - off; x < W * .94; x += sc * .9) { if (x < W * .06) continue; ctx.beginPath(); ctx.moveTo(x, gy + 16); ctx.lineTo(x + sc * .35, gy + 16); ctx.stroke(); } }
    { const pr = (pose.props || []).concat(pose.propsFn ? pose.propsFn(sk) : []); pr.forEach(o => { ctx.save(); ctx.lineCap = "round";
      if (o.t === "rect") { const a = P([o.x0, o.y1]), b = P([o.x1, o.y0]); ctx.fillStyle = o.c; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, .025 * sc); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(a[0], a[1], b[0] - a[0], b[1] - a[1], 6) : ctx.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.fill(); ctx.stroke(); }
      else if (o.t === "line") { const a = P(o.a), b = P(o.b); ctx.strokeStyle = o.c; ctx.lineWidth = Math.max(2, o.w * sc); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      else if (o.t === "disc") { const a = P([o.x, o.y]); ctx.fillStyle = o.c; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, .025 * sc); ctx.beginPath(); ctx.arc(a[0], a[1], o.r * sc, 0, 2 * PI); ctx.fill(); ctx.stroke(); }
      ctx.restore(); }); }
    if (pose.wall != null) { const wx = P([pose.wall, 0])[0]; ctx.fillStyle = "#E8D9F5"; ctx.fillRect(0, 0, wx, gy + 2); ctx.fillStyle = "#CDB6EA"; ctx.fillRect(wx - 4, 0, 4, gy + 2); }
    if (pose.rope != null) { const c = P([0, Hs * .95 + D.ah]), rr = (Hs * .95 + D.ah) * sc; ctx.save(); ctx.strokeStyle = "#F0679B"; ctx.lineWidth = 3; ctx.setLineDash([rr * .5, rr * .35]); ctx.lineDashOffset = -pose.rope * rr * .3; ctx.beginPath(); ctx.arc(c[0], c[1], rr, 0, 2 * PI); ctx.stroke(); ctx.restore(); }
    if (pose.bike) { const bk = pose.bike, W1 = P([-.85, .52]), W2 = P([.95, .52]), C = P(bk.cr), Sd = P([-.2, .8]), St = P([.88, 1.0]), Hb = P([.86, .74]), rr = .52 * sc; ctx.save(); ctx.lineCap = "round"; ctx.strokeStyle = "#2A1D45"; ctx.lineWidth = Math.max(2, .05 * sc);
      [W1, W2].forEach(w => { ctx.beginPath(); ctx.arc(w[0], w[1], rr, 0, 2 * PI); ctx.stroke(); }); ctx.lineWidth = Math.max(1, .02 * sc); ctx.setLineDash([rr * .25, rr * .2]); ctx.lineDashOffset = -bk.f * rr * .6; [W1, W2].forEach(w => { ctx.beginPath(); ctx.arc(w[0], w[1], rr * .75, 0, 2 * PI); ctx.stroke(); }); ctx.setLineDash([]);
      ctx.strokeStyle = "#F0679B"; ctx.lineWidth = Math.max(3, .06 * sc); ctx.beginPath(); ctx.moveTo(W1[0], W1[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(Sd[0], Sd[1]); ctx.lineTo(W1[0], W1[1]); ctx.moveTo(Sd[0], Sd[1]); ctx.lineTo(St[0], St[1]); ctx.lineTo(C[0], C[1]); ctx.moveTo(St[0], St[1]); ctx.lineTo(Hb[0], Hb[1]); ctx.lineTo(W2[0], W2[1]); ctx.stroke();
      ctx.strokeStyle = "#2A1D45"; ctx.lineWidth = Math.max(4, .07 * sc); ctx.beginPath(); ctx.moveTo(Sd[0] - .12 * sc, Sd[1]); ctx.lineTo(Sd[0] + .12 * sc, Sd[1]); ctx.stroke(); ctx.restore(); }
    const blink = (now % 3600) < 130;
    drawChar(ctx, sk, P, sc, st.expr && st.expr !== "auto" ? st.expr : autoExpr(ex, pose), blink, tm, cols);
    return pose;
  }
  function mount(cv, opt) {
    if (!cv) return; const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches, t0 = performance.now();
    const fit = () => { const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr)); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } cv._dpr = dpr; };
    const per = (EX[opt.ex] || EX.squat).period;
    const frame = now => {
      if (!cv.isConnected) return; fit();
      const st = opt.state ? opt.state(now) : { tm: (now - t0) / 1000 * (opt.speed || 1) }; if (opt.nodumb) st.nodumb = 1;
      if (reduce && !opt.state) st.tm = per * .45;
      scene(cv, opt.ex, st, now);
      if (!(reduce && !opt.state)) requestAnimationFrame(frame);
    };
    cv._redraw = () => { if (reduce && !opt.state) frame(performance.now()); };
    requestAnimationFrame(frame);
  }
  /* ภาพเล็กในรายการ: วาดทีละหลายภาพด้วยลูปเดียว วาดเฉพาะที่เห็นอยู่บนจอ และจำกัดความถี่ให้เครื่องไม่ร้อน */
  const TH = { set: new Set(), raf: 0, io: null, last: 0 }, reduceM = () => matchMedia("(prefers-reduced-motion:reduce)").matches;
  function drawThumb(cv, now, still) { const ex = cv.dataset.ex, per = (EX[ex] || EX.squat).period; scene(cv, ex, { tm: still ? per * .4 : (now - cv._t0) / 1000, nodumb: cv.dataset.nd ? 1 : 0, side: 1 }, now); }
  function thumbLoop(now) {
    TH.raf = 0; for (const cv of TH.set) if (!cv.isConnected) { TH.set.delete(cv); if (TH.io) TH.io.unobserve(cv); }
    if (!TH.set.size) return;
    if (now - TH.last > 50) { TH.last = now; for (const cv of TH.set) if (cv._vis) drawThumb(cv, now, false); }
    TH.raf = requestAnimationFrame(thumbLoop);
  }
  function thumbs(root) {
    if (!root) return; const dpr = Math.min(2, devicePixelRatio || 1), still = reduceM();
    root.querySelectorAll("canvas.rigthumb").forEach(cv => {
      if (cv._on || !EX[cv.dataset.ex]) return; cv._on = 1; cv._dpr = dpr; cv.width = cv.height = Math.round(64 * dpr); cv._t0 = performance.now() - Math.random() * 1500; cv._vis = false;
      drawThumb(cv, performance.now(), true);
      if (still) return;
      if (!TH.io) TH.io = new IntersectionObserver(es => es.forEach(en => { en.target._vis = en.isIntersecting; }), { rootMargin: "80px" });
      TH.io.observe(cv); TH.set.add(cv);
    });
    if (TH.set.size && !TH.raf) TH.raf = requestAnimationFrame(thumbLoop);
  }
  const togHtml = () => `<div class="rigtog" role="group" aria-label="มุมมองของตัวอย่างท่า"><button type="button" data-act="rigview" data-v="side" class="${VIEW.v === "side" ? "on" : ""}" aria-pressed="${VIEW.v === "side"}">ด้านข้าง</button><button type="button" data-act="rigview" data-v="front" class="${VIEW.v === "front" ? "on" : ""}" aria-pressed="${VIEW.v === "front"}">ด้านหน้า</button></div>`;
  ACT.rigview = a => {
    const v = a.dataset.v === "front" ? "front" : "side"; VIEW.v = v; try { localStorage.setItem("maalot_rigview", v); } catch (e) { }
    document.querySelectorAll(".rigtog button").forEach(b => { const on = b.dataset.v === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    document.querySelectorAll("canvas.rig").forEach(c => { if (c._redraw) c._redraw(); });
  };
  return { mount, thumbs, has: k => !!EX[k], period: k => EX[k] && EX[k].period, html: (k, extra) => `<div class="stage rigstage"><canvas class="rig" data-rig="${k}" role="img" aria-label="ตัวละครก้อนเกี๊ยวทำท่าตัวอย่าง"></canvas>${togHtml()}${extra || ""}</div>`, view: () => VIEW.v };
})();

/* ต่อเข้าคลังท่า และหน้า "ออกกำลังด้วยกัน" */
(() => {
  const oLib = SUBS.lib, oTrain = SUBS.train;
  let mineOnly = false;
  const tags = e => `${["", "เริ่มต้น", "ปานกลาง", "ชำนาญ"][e.lvl] || ""}${e.eq.length ? " · " + e.eq.map(k => (EQN[k] || k).split(" ")[0]).join(" ") : " · ไม่ใช้อุปกรณ์"}${e.out ? " · กลางแจ้ง" : ""}`;
  const thumbOf = (e, sm) => e && e.rig && RIG.has(e.rig) ? `<canvas class="rigthumb rt${sm ? " sm" : ""}" data-ex="${e.rig}"${e.noDumb ? ' data-nd="1"' : ""} role="img" aria-label="ภาพตัวอย่างท่า${esc(e.n)}"></canvas>` : `<span class="rt${sm ? " sm" : ""} ph" aria-hidden="true">${ic("dumbbell", sm ? 20 : 26)}</span>`;
  /* ใช้ได้ทุกหน้าที่ขึ้นชื่อท่า: exThumb(ท่า) และ workThumb(รายการที่บันทึกไว้ จับคู่กับท่าในคลังตามชื่อ) */
  window.exThumb = thumbOf;
  window.workThumb = (w, sm) => thumbOf(typeof mgOfWork === "function" ? mgOfWork(w) : null, sm);
  const libRow = e => { const m = typeof MMAP !== "undefined" ? MMAP.names(e) : e.mus; return `<button class="item" style="width:100%;text-align:left" data-act="sub" data-n="lib" data-arg="${e.id}">${thumbOf(e)}<div class="grow"><b>${e.n}</b><div class="xs muted">${e.sets ? e.sets + " เซ็ต × " : ""}${e.reps ? e.reps + " ครั้ง" : e.secs ? e.secs + " วินาที" : e.mins ? e.mins + " นาที" : ""}${m ? " · " + esc(m) : ""}</div><div class="xs muted">${tags(e)}</div></div>${ic("play", 18)}</button>`; };
  /* รายการท่า: ไม่ได้เลือกส่วนไหนจะแบ่งตามหมวด ถ้าเลือกส่วนของร่างกายจะเรียงท่าที่ตรงมากที่สุดก่อน */
  const ORDER = ["ขาและก้น", "อก แขน ไหล่", "หลัง", "แกนกลางลำตัว", "คาร์ดิโอ", "ยืดเหยียด"];
  const okOf = () => { const F = S.fit; return e => !mineOnly || !F || (FIT.has(e, F) && !e.lim.some(l => F.lim.includes(l))); };
  function resHtml() {
    const ok = okOf(), M = typeof MMAP !== "undefined" ? MMAP : null;
    if (M && M.sel.size) {
      const chips = [...M.sel].map(k => `<button class="chip on" data-act="mz" data-m="${k}" aria-label="เอา${esc(M.name(k))}ออก">${esc(M.name(k))} ${ic("x", 12)}</button>`).join("");
      const hit = LIB.filter(ok).map(e => ({ e, n: M.score(e) })).filter(x => x.n > 0).sort((a, b) => b.n - a.n || a.e.lvl - b.e.lvl);
      return `<div class="mmsel"><div class="row between"><b>ท่าที่ตรงกับที่เลือก ${hit.length} ท่า</b><button class="linkbtn" data-act="mzclear">ล้างทั้งหมด</button></div><div class="chips">${chips}</div></div>` + (hit.length ? hit.map(x => libRow(x.e)).join("") : `<p class="muted sm" style="padding:14px 0">ไม่มีท่าที่ตรง ลองเอาตัวกรองอุปกรณ์ออก หรือเลือกส่วนอื่นเพิ่ม</p>`);
    }
    return ORDER.map(c => { const l = LIB.filter(e => e.cat === c && ok(e)); return l.length ? `<div class="sec" style="margin-top:14px">${c} (${l.length})</div>` + l.map(libRow).join("") : ""; }).join("");
  }
  window.libRes = () => { const box = document.getElementById("libres"); if (!box) return; box.innerHTML = resHtml(); RIG.thumbs(box); };
  ACT.libmine = () => { mineOnly = !mineOnly; rerenderSub(); };
  SUBS.lib = arg => {
    const id = arg && arg.id;
    if (!id || id === "work") {
      const F = S.fit, ok = okOf(), n = LIB.filter(ok).length;
      return { title: "คลังท่าออกกำลัง " + LIB.length + " ท่า", after: el => RIG.thumbs(el.querySelector("#libres")), html: `${typeof MMAP !== "undefined" ? MMAP.html() : ""}${F ? `<button class="fchip sm ${mineOnly ? "on" : ""}" data-act="libmine" aria-pressed="${mineOnly}">เฉพาะที่ฉันทำได้ตามอุปกรณ์ (${n})</button>` : `<button class="btn block" data-act="sub" data-n="fit">ตั้งค่าโปรแกรมเพื่อกรองตามอุปกรณ์</button>`}<div id="libres">${resHtml()}</div>` };
    }
    const r = oLib(arg), e = LIB.find(x => x.id === id);
    if (e && r && r.html) {
      const card = /<div class="card" style="text-align:center">[\s\S]*?<\/div>/;
      const meta = `<div class="xs muted" style="margin:8px 0">${tags(e)} · ${esc(e.mus)}</div>`;
      if (e.rig && RIG.has(e.rig)) {
        r.html = r.html.replace(card, RIG.html(e.rig) + (e.approx ? `<p class="xs muted" style="margin-top:6px">ภาพเป็นท่าใกล้เคียง ทำตามวิธีทำด้านล่างให้ถูกท่า</p>` : "") + meta);
        const af = r.after; r.after = el => { if (af) af(el); RIG.mount(el.querySelector("canvas.rig"), { ex: e.rig, speed: 1, nodumb: e.noDumb }); };
      } else r.html = r.html.replace(card, meta);
    }
    return r;
  };
  SUBS.train = arg => {
    const r = oTrain(arg), s = SESS;
    if (!s || !r) return r; const rk = s.e.rig;
    if (!s.tempoSet) { s.tempoSet = 1; if (s.e.reps) s.tempo = Math.max(1.2, RIG.period(rk) || s.tempo); }
    if (!rk || !RIG.has(rk)) return r;
    r.html = r.html.replace(/<div class="stage"><svg[\s\S]*?<\/svg><\/div>/, RIG.html(rk));
    const af = r.after;
    r.after = el => {
      if (af) af(el);
      RIG.mount(el.querySelector("canvas.rig"), { ex: rk, nodumb: s.e.noDumb, state: now => {
        if (!SESS || SESS !== s) return { tm: 0, idle: true };
        const ph = s.phase;
        if (ph === "done") return { tm: now / 1000, cheer: true, expr: "cheer" };
        if (ph === "go") { const el = (Date.now() - s.t0) / 1000; return { tm: el, period: s.e.reps ? s.tempo : undefined, expr: "auto" }; }
        return { tm: 0, idle: true, heavy: ph === "rest", expr: ph === "rest" ? "tired" : "smile" };
      } });
    };
    return r;
  };
})();
