/* โปรแกรมออกกำลังกาย: ถามที่ออก/อุปกรณ์ → สร้างแผน → วิเคราะห์ → โหมดเซสชันนำออกกำลัง → โปรแกรมสำเร็จรูป/สร้างเอง */
const DOWN = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."], DOWF = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
const LOCS = [["home", "ที่บ้าน", "ห้องนั่งเล่น ระเบียง หรือห้องนอน"], ["gym", "ฟิตเนส/ยิม", "มีเครื่องและน้ำหนักให้ใช้"], ["out", "กลางแจ้ง", "สวนสาธารณะ ถนน ลานกีฬา"]];
const GOALS = [["lose", "ลดไขมัน", "เน้นเผาผลาญ เซ็ตพักสั้น มีคาร์ดิโอ"], ["tone", "กระชับรูปร่าง", "สมดุลกล้ามเนื้อและเผาผลาญ"], ["strength", "สร้างกล้ามเนื้อ/ความแข็งแรง", "เซ็ตหนักขึ้น พักนานขึ้น"], ["health", "สุขภาพทั่วไป", "เบา สม่ำเสมอ ไม่หักโหม"]];
const LVLS = [[1, "เริ่มต้น", "ไม่ค่อยได้ออกกำลัง หรือเพิ่งกลับมา"], [2, "ปานกลาง", "ออกสม่ำเสมอ 3 เดือนขึ้นไป"], [3, "ชำนาญ", "ออกจริงจังมาเป็นปี"]];
const LOC_EQ = { home: [], gym: ["dumbbell", "bench", "bar", "machine", "bbell", "kbell", "treadmill", "bike", "band"], out: ["bar", "rope"] };
const libOf = id => LIB.find(e => e.id === id);
const FIT = {};
FIT.fit = () => S.fit;
FIT.has = (e, F) => e.eq.every(k => F.eq.includes(k)) && (!e.out || F.loc.includes("out"));
FIT.pool = (F, lvlBonus) => LIB.filter(e => FIT.has(e, F) && !e.lim.some(l => F.lim.includes(l)) && e.lvl <= Math.min(3, (F.care ? 1 : F.lvl) + (lvlBonus || 0)));
FIT.hash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
FIT.dow = () => (new Date().getDay() + 6) % 7;

/* ---------- สร้างแผน ---------- */
const SPLITS = {
  full: [{ pat: "squat,lunge" }, { pat: "push" }, { pat: "pull" }, { pat: "hinge" }, { mg: "แกนกลาง" }, { pat: "push", mg: "ไหล่,แขน" }, { pat: "pull", mg: "แขน,หลัง" }, { mg: "ก้น" }, { mg: "แกนกลาง" }],
  upper: [{ pat: "push" }, { pat: "pull" }, { pat: "push", mg: "ไหล่,แขน" }, { pat: "pull", mg: "แขน,หลัง" }, { mg: "แกนกลาง" }, { pat: "push" }, { pat: "pull" }, { mg: "แขน" }],
  lower: [{ pat: "squat" }, { pat: "hinge" }, { pat: "lunge" }, { mg: "ก้น" }, { mg: "แกนกลาง" }, { mg: "ขา" }, { pat: "squat,lunge" }],
  push: [{ pat: "push" }, { pat: "push", mg: "ไหล่" }, { pat: "push", mg: "อก" }, { pat: "push", mg: "แขน" }, { mg: "แกนกลาง" }, { pat: "push" }],
  pull: [{ pat: "pull" }, { pat: "pull", mg: "หลัง" }, { pat: "hinge", mg: "หลัง" }, { pat: "pull", mg: "แขน" }, { mg: "แกนกลาง" }, { pat: "pull" }],
  legs: [{ pat: "squat" }, { pat: "hinge" }, { pat: "lunge" }, { mg: "ก้น" }, { mg: "ขา" }, { mg: "แกนกลาง" }],
  corecar: [{ mg: "แกนกลาง" }, { mg: "แกนกลาง" }, { mg: "คาร์ดิโอ" }, { mg: "คาร์ดิโอ" }, { mg: "แกนกลาง" }, { mg: "คาร์ดิโอ" }]
};
const PLANS = { 2: [["ทั้งตัว A", "full"], ["ทั้งตัว B", "full"]], 3: [["ทั้งตัว A", "full"], ["ทั้งตัว B", "full"], ["ทั้งตัว C", "full"]], 4: [["ร่างกายส่วนบน", "upper"], ["ร่างกายส่วนล่าง", "lower"], ["ร่างกายส่วนบน", "upper"], ["ร่างกายส่วนล่าง", "lower"]],
  5: [["ดัน (อก ไหล่ แขน)", "push"], ["ขา", "legs"], ["ดึง (หลัง แขน)", "pull"], ["แกนกลางและคาร์ดิโอ", "corecar"], ["ทั้งตัว", "full"]], 6: [["ดัน", "push"], ["ดึง", "pull"], ["ขา", "legs"], ["ดัน", "push"], ["ดึง", "pull"], ["ขา", "legs"]] };
const DAYSET = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] };
const matchSlot = (e, s) => (!s.pat || s.pat.split(",").includes(e.pat)) && (!s.mg || s.mg.split(",").some(m => e.mg.includes(m)));
function volFor(e, F) {
  const L = F.care ? 1 : F.lvl, heavy = e.eq.some(k => ["dumbbell", "bbell", "kbell", "machine", "bar"].includes(k));
  const o = { id: e.id };
  if (e.mins) { o.mins = Math.max(5, Math.round(e.mins * (L === 1 ? .7 : L === 3 ? 1.15 : 1) / 5) * 5); o.rest = 0; return o; }
  o.sets = e.cat === "ยืดเหยียด" ? (e.sets || 2) : F.goal === "strength" ? (L === 1 ? 3 : 4) : L === 1 ? 2 : 3;
  if (e.reps) { let r = e.reps; if (F.goal === "strength" && heavy) r = Math.round(r * .75); else if (F.goal === "health") r = Math.round(r * .85); if (L === 1) r = Math.round(r * .8); if (L === 3 && !heavy) r = Math.round(r * 1.2); o.reps = Math.max(5, r); } else o.secs = Math.round((e.secs || 30) * (L === 1 ? .8 : L === 3 ? 1.2 : 1) / 5) * 5;
  o.rest = e.cat === "ยืดเหยียด" ? 10 : F.goal === "strength" && heavy ? 90 : F.goal === "lose" ? 30 : e.reps ? 45 : 30;
  return o;
}
function genPlan(F, seed) {
  seed = seed || 0; const use = {}, pool = FIT.pool(F), pool2 = FIT.pool(F, 1), N = clampN(Math.round((F.mins - 8) / 4.5), 3, 9), days = [], dset = DAYSET[F.days] || DAYSET[3];
  (PLANS[F.days] || PLANS[3]).forEach(([name, key], di) => {
    const slots = SPLITS[key].slice(), used = new Set(), items = [];
    while (slots.length < N) slots.push({ mg: "แกนกลาง" });
    for (const s of slots.slice(0, N)) {
      let c = pool.filter(e => matchSlot(e, s) && !used.has(e.id) && e.cat !== "ยืดเหยียด" && !(e.cat === "คาร์ดิโอ" && s.mg !== "คาร์ดิโอ" && !s.pat));
      if (!c.length) c = pool2.filter(e => matchSlot(e, s) && !used.has(e.id) && e.cat !== "ยืดเหยียด");
      if (!c.length) c = pool.filter(e => s.mg && matchSlot(e, { mg: s.mg }) && !used.has(e.id) && e.cat !== "ยืดเหยียด");
      if (!c.length) continue;
      const sc = e => (e.eq.length && (F.goal === "strength" || F.goal === "tone") ? 2 : 0) + (!e.approx ? .8 : 0) + (e.lvl === F.lvl ? 1 : 0) - (use[e.id] || 0) * 1.6 + (FIT.hash(e.id + di + seed) % 100) / 200;
      c.sort((a, b) => sc(b) - sc(a)); const e = c[0]; used.add(e.id); use[e.id] = (use[e.id] || 0) + 1; items.push(volFor(e, F));
    }
    if (items.length < N) { const rest = pool2.filter(e => !used.has(e.id) && e.cat !== "ยืดเหยียด" && e.cat !== "คาร์ดิโอ" && !e.lim.some(l => F.lim.includes(l))).sort((a, b) => (use[a.id] || 0) - (use[b.id] || 0) || (FIT.hash(a.id + di + seed) % 50) - (FIT.hash(b.id + di + seed) % 50)); for (const e of rest) { if (items.length >= N) break; used.add(e.id); use[e.id] = (use[e.id] || 0) + 1; items.push(volFor(e, F)); } }
    if (F.goal === "lose" || key === "corecar") {
      const car = pool.filter(e => e.cat === "คาร์ดิโอ" && !used.has(e.id) && (!F.care || e.lvl === 1)).sort((a, b) => ((FIT.hash(b.id + di + seed) % 10) - (FIT.hash(a.id + di + seed) % 10)));
      if (car.length) { const e = car[0], v = volFor(e, F); if (v.mins) v.mins = Math.min(v.mins, 15); items.push(v); }
    }
    const warm = ["armcircle", "march"].map(libOf).filter(e => e && FIT.has(e, F) && !e.lim.some(l => F.lim.includes(l))).map(e => Object.assign(volFor(e, F), { sets: 1, warm: 1, rest: 0 }));
    const cool = ["hamstretch", "shoulderstretch", "child", "catcow", "quadstretch"].map(libOf).filter(e => e && FIT.has(e, F) && !e.lim.some(l => F.lim.includes(l))).slice(0, 2).map(e => Object.assign(volFor(e, F), { sets: 1, cool: 1, rest: 5 }));
    days.push({ name, dow: dset[di], items: warm.concat(items, cool) });
  });
  return { made: Date.now(), seed, days };
}
function clampN(v, a, b) { return Math.max(a, Math.min(b, v)); }
const itemSecs = it => { const e = libOf(it.id); if (!e) return 0; if (it.mins) return it.mins * 60; const per = it.secs || (it.reps || 10) * (RIG.period(e.rig) || 3) / (e.approx ? 1 : 1); return (it.sets || 1) * (per + (it.rest || 0)); };
const dayMins = d => Math.round(d.items.reduce((a, it) => a + itemSecs(it), 0) / 60);
const volText = it => it.mins ? it.mins + " นาที" : it.reps ? `${it.sets} เซ็ต × ${it.reps} ครั้ง` : `${it.sets || 1} เซ็ต × ${it.secs} วินาที`;
const dayKcal = d => { const kg = estW(); return Math.round(d.items.reduce((a, it) => { const e = libOf(it.id); return a + (e ? (e.met || 3) * 3.5 * kg / 200 * (itemSecs(it) / 60 * .8) : 0); }, 0)); };

/* ---------- วิเคราะห์ ---------- */
const MGT = { "อก": [8, 16], "หลัง": [8, 16], "ไหล่": [6, 12], "แขน": [6, 12], "แกนกลาง": [6, 14], "ขา": [10, 20], "ก้น": [6, 12] };
function analyze(F, plan) {
  const pool = FIT.pool(F), sets = {}; MGS.forEach(m => sets[m] = 0); let push = 0, pull = 0, cardio = 0, mins = 0;
  plan.days.forEach(d => { mins += dayMins(d); d.items.forEach(it => { const e = libOf(it.id); if (!e || it.warm || it.cool) return; const n = it.mins ? 0 : (it.sets || 1); e.mg.forEach((m, i) => { sets[m] += n * (i ? .5 : 1); }); if (e.pat === "push") push += n; if (e.pat === "pull") pull += n; if (e.cat === "คาร์ดิโอ") cardio += it.mins ? it.mins : (itemSecs(it) / 60); }); });
  const gaps = Object.keys(MGT).filter(m => sets[m] < MGT[m][0] * .8);
  const noLim = LIB.filter(e => FIT.has(e, F)), cut = noLim.length - LIB.filter(e => FIT.has(e, F) && !e.lim.some(l => F.lim.includes(l))).length;
  const sug = EQ.filter(q => !F.eq.includes(q[0])).map(q => { const F2 = Object.assign({}, F, { eq: F.eq.concat(q[0]) }), n = FIT.pool(F2).length - pool.length; const forGap = LIB.filter(e => FIT.has(e, F2) && !FIT.has(e, F) && !e.lim.some(l => F.lim.includes(l)) && e.lvl <= F.lvl && e.mg.some(m => gaps.includes(m))).length; return { k: q[0], n, forGap }; }).filter(x => x.n > 0).sort((a, b) => (b.forGap - a.forGap) || (b.n - a.n)).slice(0, 3);
  const notes = [];
  if (pull + 1 < push * .6) notes.push("ท่าดึง (หลัง) น้อยกว่าท่าดัน (อก ไหล่) มาก ระยะยาวทำให้ไหล่ห่อ ควรเพิ่มท่าหลัง");
  if (gaps.length) notes.push("กล้ามเนื้อที่ยังได้น้อยในแผนนี้: " + gaps.join(" ") + (sug.length ? " อุปกรณ์ที่ช่วยเติมได้มากที่สุดคือ " + EQN[sug[0].k] : ""));
  if (F.goal === "lose" && cardio < 60) notes.push("เป้าหมายลดไขมันควรมีคาร์ดิโอสะสมอย่างน้อย 60 นาทีต่อสัปดาห์ ตอนนี้ได้ราว " + Math.round(cardio) + " นาที");
  if (cut > 0) notes.push(`ตัดท่าที่อาจกวน${F.lim.map(l => (LIMS.find(x => x[0] === l) || [, l])[1]).join(" ")} ออก ${cut} ท่า`);
  if (F.care) notes.push("เลือกว่ามีภาวะที่ต้องระวัง จึงจำกัดไว้ที่ท่าเบาและไม่กระแทก ควรปรึกษาแพทย์ก่อนเริ่ม");
  return { n: pool.length, total: LIB.length, sets, mins, cardio, gaps, sug, notes, push, pull, cut, cats: ["ขาและก้น", "อก แขน ไหล่", "หลัง", "แกนกลางลำตัว", "คาร์ดิโอ", "ยืดเหยียด"].map(c => [c, pool.filter(e => e.cat === c).length, LIB.filter(e => e.cat === c).length]) };
}

/* ---------- แบบสอบถาม ---------- */
let FQ = null;
const fqDef = () => Object.assign({ step: 0, loc: ["home"], eq: [], goal: "tone", lvl: 1, days: 3, mins: 30, lim: [], care: 0 }, S.fit ? JSON.parse(JSON.stringify(S.fit)) : {}, { step: 0 });
const chip = (on, act, attrs, txt, sub) => `<button class="fchip ${on ? "on" : ""}" data-act="${act}" ${attrs} aria-pressed="${on}"><b>${txt}</b>${sub ? `<span>${sub}</span>` : ""}</button>`;
SUBS.fitq = () => {
  if (!FQ) FQ = fqDef(); const q = FQ, st = q.step, T = 6;
  const prog = `<div class="fprog">${Array.from({ length: T }, (_, i) => `<i class="${i <= st ? "on" : ""}"></i>`).join("")}</div><div class="xs muted" style="margin:6px 0 10px">ข้อ ${st + 1} จาก ${T}</div>`;
  let body = "";
  if (st === 0) body = `<h2>ปกติคุณออกกำลังกายที่ไหน</h2><p class="muted sm" style="margin:4px 0 10px">เลือกได้หลายที่</p>${LOCS.map(l => chip(q.loc.includes(l[0]), "fqloc", `data-v="${l[0]}"`, l[1], l[2])).join("")}`;
  else if (st === 1) body = `<h2>มีอุปกรณ์อะไรบ้าง</h2><p class="muted sm" style="margin:4px 0 10px">ติ๊กเฉพาะที่มีให้ใช้จริง ไม่ติ๊กเลยก็ได้ จะแนะนำท่าใช้น้ำหนักตัว</p><div class="fgrid">${EQ.map(e => chip(q.eq.includes(e[0]), "fqeq", `data-v="${e[0]}"`, e[1])).join("")}</div>`;
  else if (st === 2) body = `<h2>เป้าหมายของคุณคืออะไร</h2><div style="margin:10px 0">${GOALS.map(g => chip(q.goal === g[0], "fqone", `data-k="goal" data-v="${g[0]}"`, g[1], g[2])).join("")}</div><h2 style="margin-top:16px">ระดับตอนนี้</h2><div style="margin-top:10px">${LVLS.map(l => chip(q.lvl === l[0], "fqone", `data-k="lvl" data-v="${l[0]}"`, l[1], l[2])).join("")}</div>`;
  else if (st === 3) body = `<h2>มีเวลาแค่ไหน</h2><div class="sec" style="margin-top:12px">ออกกี่วันต่อสัปดาห์</div><div class="frow">${[2, 3, 4, 5, 6].map(n => chip(q.days === n, "fqone", `data-k="days" data-v="${n}"`, n + " วัน")).join("")}</div><div class="sec">ครั้งละกี่นาที</div><div class="frow">${[15, 20, 30, 45, 60].map(n => chip(q.mins === n, "fqone", `data-k="mins" data-v="${n}"`, n + " นาที")).join("")}</div><p class="xs muted" style="margin-top:12px">แนะนำเริ่มจาก 3 วัน และมีวันพักคั่น</p>`;
  else if (st === 4) body = `<h2>มีส่วนไหนที่ต้องระวังไหม</h2><p class="muted sm" style="margin:4px 0 10px">จะเว้นท่าที่อาจกวนส่วนนั้น</p><div class="fgrid">${LIMS.map(l => chip(q.lim.includes(l[0]), "fqlim", `data-v="${l[0]}"`, l[1])).join("")}</div><div style="margin-top:12px">${chip(!!q.care, "fqcare", "", "ตั้งครรภ์ มีโรคหัวใจ/ความดัน เพิ่งผ่าตัด หรือกำลังเจ็บอยู่", "จะจำกัดเป็นท่าเบา")}</div>${q.care ? `<div class="hint warnh" style="margin-top:10px">${ic("heart", 18)}<span>ควรปรึกษาแพทย์ก่อนเริ่มออกกำลังกาย แอปนี้ไม่ใช่คำแนะนำทางการแพทย์ ถ้าเวียนหัว เจ็บหน้าอก หรือหายใจไม่ออกให้หยุดทันที</span></div>` : ""}`;
  else { const F = fqFit(), plan = genPlan(F, 0), a = analyze(F, plan); body = `<h2>แผนที่ได้</h2>${anaHtml(F, plan, a, true)}`; FQ._plan = plan; }
  const last = st === T - 1;
  return { title: "ตั้งค่าโปรแกรม", html: `${prog}${body}<div class="row" style="margin-top:16px;gap:8px">${st ? `<button class="btn" data-act="fqback">ย้อนกลับ</button>` : ""}<button class="btn primary" style="flex:1" data-act="${last ? "fqsave" : "fqnext"}" ${st === 0 && !q.loc.length ? "disabled" : ""}>${last ? "ใช้แผนนี้" : "ต่อไป"}</button></div>`, keepScroll: false };
};
const fqFit = () => ({ loc: FQ.loc.slice(), eq: FQ.eq.slice(), goal: FQ.goal, lvl: +FQ.lvl, days: +FQ.days, mins: +FQ.mins, lim: FQ.lim.slice(), care: FQ.care ? 1 : 0 });
const tog = (a, v) => { const i = a.indexOf(v); if (i < 0) a.push(v); else a.splice(i, 1); };
ACT.fqloc = a => { const v = a.dataset.v; tog(FQ.loc, v); FQ.eq = Array.from(new Set(FQ.loc.reduce((s, l) => s.concat(LOC_EQ[l] || []), []))); rerenderSub(); };
ACT.fqeq = a => { tog(FQ.eq, a.dataset.v); rerenderSub(); };
ACT.fqlim = a => { tog(FQ.lim, a.dataset.v); rerenderSub(); };
ACT.fqcare = () => { FQ.care = FQ.care ? 0 : 1; rerenderSub(); };
ACT.fqone = a => { const k = a.dataset.k, v = a.dataset.v; FQ[k] = k === "goal" ? v : +v; rerenderSub(); };
ACT.fqnext = () => { FQ.step++; rerenderSub(); };
ACT.fqback = () => { FQ.step = Math.max(0, FQ.step - 1); rerenderSub(); };
ACT.fqsave = () => { S.fit = fqFit(); S.plan = FQ._plan || genPlan(S.fit, 0); FQ = null; save(); toast("สร้างแผนให้แล้ว แก้คำตอบได้ที่ปุ่ม “ปรับคำตอบ”"); confetti(); closeSub(); if (subStack.length && subStack[subStack.length - 1].name === "fit") rerenderSub(); else openSub("fit", {}); };

function anaHtml(F, plan, a, brief) {
  const bar = (m) => { const t = MGT[m], v = a.sets[m], w = Math.min(100, Math.round(v / t[1] * 100)), st = v < t[0] * .8 ? "low" : v > t[1] ? "high" : "ok"; return `<div class="fana"><span>${m}</span><i><b class="${st}" style="width:${w}%"></b></i><em>${Math.round(v)} เซ็ต</em></div>`; };
  const daysH = plan.days.map((d, i) => `<button class="item" style="width:100%;text-align:left" data-act="sub" data-n="fitday" data-arg="plan:${i}"><div class="grow"><b>${DOWF[d.dow]} · ${esc(d.name)}</b><div class="xs muted">${d.items.filter(x => !x.warm && !x.cool).length} ท่า · ประมาณ ${dayMins(d)} นาที · ${dayKcal(d)} kcal</div></div>${ic("play", 18)}</button>`).join("");
  return `<div class="card"><div class="sm">จากที่คุณบอก ใช้ท่าได้ <b>${a.n}</b> จาก ${a.total} ท่า</div><div class="fcats">${a.cats.map(c => `<span><b>${c[1]}</b>/${c[2]} ${c[0]}</span>`).join("")}</div></div>
<div class="sec">ภาพรวมต่อสัปดาห์ (${plan.days.length} วัน · รวม ${a.mins} นาที)</div><div class="card">${Object.keys(MGT).map(bar).join("")}<div class="xs muted" style="margin-top:8px">แถบเต็ม = จำนวนเซ็ตต่อสัปดาห์ที่แนะนำสำหรับกลุ่มนั้น · คาร์ดิโอราว ${Math.round(a.cardio)} นาที</div></div>
${a.notes.length ? `<div class="sec">ข้อสังเกต</div>${a.notes.map(n => `<div class="hint">${ic("sparkle", 18)}<span>${esc(n)}</span></div>`).join("")}` : ""}
${a.sug.length ? `<div class="sec">ถ้าเพิ่มอุปกรณ์</div><div class="card sm">${a.sug.map(s => `${esc(EQN[s.k])}: ปลดล็อกเพิ่ม ${s.n} ท่า${s.forGap ? ` (เติมส่วนที่ยังขาด ${s.forGap} ท่า)` : ""}`).join("<br>")}</div>` : ""}
<div class="sec">แผนรายวัน</div>${daysH}`;
}
SUBS.fitan = () => { const F = S.fit, plan = S.plan; if (!F || !plan) return { title: "วิเคราะห์แผน", html: `<p class="muted">ยังไม่มีแผน</p><button class="btn primary block" data-act="fqstart">ตอบคำถามสร้างแผน</button>` }; return { title: "วิเคราะห์แผน", html: anaHtml(F, plan, analyze(F, plan)) }; };
ACT.fqstart = () => { FQ = null; openSub("fitq", {}); };
/* กดช่องออกกำลังกายบนหน้าแรก: เข้าโปรแกรมก่อน (ยังไม่มีแผนจะเริ่มที่คำถามข้อ 1) ส่วนพิมพ์บันทึกเองมีปุ่มอยู่ในหน้านั้น */
ACT.workhome = () => { closeSheet(); FQ = null; openSub("fit", {}); };

/* ---------- หน้าหลักโปรแกรมออกกำลัง ---------- */
const sessionsOf = (from, to) => (S.sessions || []).filter(s => s.d >= from && s.d <= to);
function nextDay(plan) {
  const t = FIT.dow(), doneToday = (S.sessions || []).some(s => s.d === todayKey() && s.src && s.src.indexOf("plan:") === 0), ds = plan.days.map((d, i) => [d, i]);
  let c = ds.find(([d]) => d.dow === t && !doneToday); if (c) return { d: c[0], i: c[1], today: true };
  c = ds.find(([d]) => d.dow > t) || ds[0]; return { d: c[0], i: c[1], today: false };
}
/* ทางเข้าหลักของหน้าโปรแกรม: ท่าทั้งหมด (มีภาพน้องเกี๊ยวขยับให้ดู) สถิติและแผนที่กล้ามเนื้อ และวัดด้วย GPS */
function hubTiles() {
  const pool = LIB.filter(e => e.rig && typeof RIG !== "undefined" && RIG.has(e.rig)), day = Math.floor(Date.now() / 864e5), pick = [];
  for (let i = 0; pick.length < 4 && pool.length && i < 40; i++) { const e = pool[(day * 7 + i * 29) % pool.length]; if (!pick.some(x => x.rig === e.rig)) pick.push(e); }
  const th = pick.map((e, i) => `<canvas class="rigthumb rt" data-ex="${e.rig}"${e.noDumb ? ' data-nd="1"' : ""} style="--i:${i}" aria-hidden="true"></canvas>`).join("");
  return `<div class="pgrid"><button class="pbig" data-act="sub" data-n="lib"><span class="pb-top"><b>ท่าทั้งหมด ${LIB.length} ท่า</b><span class="pb-go">${ic("back", 18)}</span></span><span class="pb-s">ดูท่าตัวอย่างทุกท่า หรือจิ้มกล้ามเนื้อของน้องเกี๊ยวเพื่อหาท่า</span><span class="pb-th">${th}</span></button>
<button class="hubt t-stat" data-act="sub" data-n="progress"><span class="pt-ic"><i></i><i></i><i></i></span><b>สถิติและ<br>แผนที่กล้ามเนื้อ</b><span class="pt-s">ดูว่าสัปดาห์นี้ฝึกส่วนไหน</span></button>
<button class="hubt t-gps" data-act="sub" data-n="cardio"><span class="pt-ic">${ic("run", 22)}</span><b>วิ่ง เดิน ปั่น<br>วัดด้วย GPS</b><span class="pt-s">เก็บระยะทางและเส้นทาง</span></button></div>`;
}
SUBS.fit = () => {
  if (S.fit && !S.plan) { S.plan = genPlan(S.fit, 0); save(); }
  if (!S.fit || !S.plan) return SUBS.fitq(); /* ต้องตอบคำถามก่อน ข้ามไม่ได้ */
  const F = S.fit, plan = S.plan, mon = addDays(todayKey(), -FIT.dow()), done = new Set(sessionsOf(mon, addDays(mon, 6)).map(s => s.d));
  const week = `<div class="fweek">${DOWN.map((n, i) => { const k = addDays(mon, i), pl = plan && plan.days.some(d => d.dow === i), dn = done.has(k); return `<span class="${dn ? "dn" : pl ? "pl" : ""} ${k === todayKey() ? "now" : ""}"><em>${n}</em>${dn ? ic("check", 14) : pl ? "•" : ""}</span>`; }).join("")}</div>`;
  let top;
  { const n = nextDay(plan);
    top = `<div class="card"><div class="muted xs">${n.today ? "วันนี้" : "ครั้งถัดไป " + DOWF[n.d.dow]}</div><div style="font-size:19px;font-weight:600;margin:2px 0">${esc(n.d.name)}</div><div class="sm muted">${n.d.items.filter(x => !x.warm && !x.cool).length} ท่า · ประมาณ ${dayMins(n.d)} นาที · ${dayKcal(n.d)} kcal</div><div class="row" style="margin-top:12px;gap:8px"><button class="btn primary" style="flex:1" data-act="sesstart" data-src="plan:${n.i}">${ic("play", 18)}เริ่มเลย</button><button class="btn" data-act="sub" data-n="fitday" data-arg="plan:${n.i}">ดูรายการ</button></div></div>${week}
<div class="row" style="gap:8px;margin-top:10px"><button class="btn" style="flex:1" data-act="sub" data-n="fitan">วิเคราะห์แผน</button><button class="btn" style="flex:1" data-act="fqstart">ปรับคำตอบ</button></div>
<p class="xs muted" style="margin-top:8px">${F.loc.map(l => (LOCS.find(x => x[0] === l) || [, l])[1]).join(" · ")} · ${F.eq.length ? F.eq.length + " อุปกรณ์" : "ไม่มีอุปกรณ์"} · ${F.days} วัน/สัปดาห์ · ${F.mins} นาที<br>อยากเปลี่ยนที่ออกกำลัง อุปกรณ์ หรือเป้าหมาย กดปุ่ม “ปรับคำตอบ” ได้ตลอด</p>`; }
  const PSTY = { p15: ["sun", "amber"], pbeg: ["home", "green"], hiit: ["flame", "rose"], core10: ["target", "violet"], glute: ["heart", "rose"], lowimp: ["droplet", "blue"], db: ["dumbbell", "violet"], band: ["timer", "green"], gym: ["bag", "blue"], bar: ["dumbbell", "amber"], stretch: ["moon", "blue"], office: ["list", "green"], walk: ["run", "green"] };
  const progs = (S.progs || []).map((p, i) => `<button class="pcard violet" style="--i:${i}" data-act="sub" data-n="fitday" data-arg="prog:${p.id}"><span class="pc-i">${ic("list", 22)}</span><b>${esc(p.name)}</b><span class="pc-d">${p.items.length} ท่า</span><span class="pc-m"><i>${ic("timer", 12)}ประมาณ ${dayMins(p)} นาที</i></span></button>`).join("");
  const pre = PRESETS.map((p, i) => { const need = presetNeed(p), ok = !F || need.every(k => F.eq.includes(k)), st = PSTY[p.id] || ["dumbbell", "violet"]; return `<button class="pcard ${st[1]}" style="--i:${i}" data-act="sub" data-n="fitday" data-arg="pre:${p.id}"><span class="pc-i">${ic(st[0], 22)}</span><b>${p.n}</b><span class="pc-d">${p.d}</span><span class="pc-m"><i>${ic("timer", 12)}ประมาณ ${dayMins(p)} นาที</i><i>${need.length ? need.map(k => EQN[k].split(" ")[0]).join(" ") : "ไม่ใช้อุปกรณ์"}</i></span>${F && ok ? `<em class="pc-ok">${ic("check", 11)}ทำได้</em>` : ""}</button>`; }).join("");
  return { title: "โปรแกรมออกกำลังกาย", after: el => { if (typeof RIG !== "undefined") RIG.thumbs(el); }, html: `${top}${hubTiles()}<div class="sec">โปรแกรมของฉัน</div>${progs ? `<div class="pcgrid">${progs}</div>` : emptyState("list", "ยังไม่มีโปรแกรมของฉัน", "สร้างชุดท่าของตัวเองได้ เลือกท่า เซ็ต ครั้ง ตามใจ")}<div class="pcact"><button class="btn primary go" data-act="pbnew">${ic("plus", 18)}สร้างโปรแกรมเอง</button><button class="btn" data-act="sub" data-n="log" data-arg="work">${ic("dumbbell", 18)}พิมพ์บันทึกเอง</button></div><div class="sec">โปรแกรมสำเร็จรูป</div><div class="pcgrid">${pre}</div>` };
};

/* ---------- โปรแกรมสำเร็จรูป ---------- */
const parseP = s => { const [id, v] = s.split(":"); let m; if ((m = /^(\d+)x(\d+)s$/.exec(v))) return { id, sets: +m[1], secs: +m[2], rest: 30 }; if ((m = /^(\d+)x(\d+)$/.exec(v))) return { id, sets: +m[1], reps: +m[2], rest: 45 }; if ((m = /^(\d+)m$/.exec(v))) return { id, mins: +m[1], rest: 0 }; return { id }; };
const PRESETS = [
  { id: "p15", n: "15 นาทีตื่นเช้า", d: "ทั้งตัว เบาๆ ไม่ใช้อุปกรณ์", l: ["armcircle:1x30s", "squat:2x12", "kneepush:2x8", "bridge:2x12", "plank:2x20s", "stretch:1x30s"] },
  { id: "pbeg", n: "เริ่มต้นทั้งตัวที่บ้าน", d: "ไม่ใช้อุปกรณ์ · 25 นาที", l: ["march:1x45s", "squat:3x12", "kneepush:3x8", "bridge:3x12", "birddog:3x8", "plank:3x20s", "child:1x30s"] },
  { id: "hiit", n: "เผาผลาญ 20 นาที", d: "คาร์ดิโอสลับท่า ไม่ใช้อุปกรณ์", l: ["march:1x45s", "jack:3x30s", "highknee:3x30s", "climber:3x30s", "buttkick:3x30s", "jumpsquat:3x10", "hamstretch:1x30s"] },
  { id: "core10", n: "แกนกลางแน่น 10 นาที", d: "หน้าท้องและหลัง ไม่ใช้อุปกรณ์", l: ["crunch:3x15", "deadbug:3x10", "bicycle:3x20", "plank:3x30s", "sideplank:2x20s", "superman:2x10"] },
  { id: "glute", n: "ก้นและขาที่บ้าน", d: "ไม่ใช้อุปกรณ์ · 25 นาที", l: ["squat:3x15", "sumo:3x15", "revlunge:3x10", "bridge:3x15", "kickback:3x12", "calf:3x15", "wallsit:2x30s", "quadstretch:1x30s"] },
  { id: "lowimp", n: "เบาข้อ ไม่กระโดด", d: "เหมาะกับคนเข่าไม่ดีหรือเพิ่งเริ่ม", l: ["march:1x45s", "stepjack:3x30s", "bridge:3x12", "birddog:3x8", "kneepush:3x8", "deadbug:3x8", "calf:2x15", "child:1x30s"] },
  { id: "db", n: "ดัมเบลล์ทั้งตัว", d: "ดัมเบลล์หรือขวดน้ำ · 30 นาที", l: ["armcircle:1x30s", "goblet:3x12", "rdl:3x10", "dbrow:3x10", "press:3x10", "curl:3x12", "tricepext:3x12", "plank:3x30s"] },
  { id: "band", n: "ยางยืดทั้งตัว", d: "ยางยืดออกกำลัง · 25 นาที", l: ["armcircle:1x30s", "squat:3x15", "bandrow:3x15", "bandpress:3x12", "bandcurl:3x15", "bandwalk:3x12", "bridge:3x15"] },
  { id: "gym", n: "ยิมเริ่มต้น เครื่องเวท", d: "เครื่องเวทในฟิตเนส · 40 นาที", l: ["treadwalk:1x5m".replace("1x5m", "5m"), "legpress:3x12", "chestpress:3x12", "lat:3x12", "legcurl:3x12", "cablerow:3x12", "cablecrunch:3x15", "hamstretch:1x30s"] },
  { id: "bar", n: "บาร์เบลพื้นฐาน", d: "บาร์เบล ม้านั่ง · 45 นาที", l: ["armcircle:1x30s", "bbsquat:4x8", "bbbench:4x8", "bbrow:4x8", "bbdead:3x6", "plank:3x30s", "hamstretch:1x30s"] },
  { id: "stretch", n: "ยืดเหยียดผ่อนคลาย 10 นาที", d: "ก่อนนอนหรือหลังตื่น", l: ["catcow:1x45s", "child:2x30s", "cobra:2x30s", "hamstretch:2x30s", "quadstretch:2x30s", "hipstretch:2x30s", "shoulderstretch:2x30s"] },
  { id: "office", n: "ออฟฟิศ 8 นาที", d: "ใช้แค่เก้าอี้และผนัง", l: ["armcircle:1x30s", "march:1x45s", "calf:2x15", "inclinepush:2x10", "wallsit:2x30s", "shoulderstretch:1x30s"] },
  { id: "walk", n: "เดินเร็วกลางแจ้ง", d: "30 นาที เหมาะกับทุกวัย", l: ["brisk:30m"] }
].map(p => Object.assign(p, { items: p.l.map(parseP) }));
const presetNeed = p => Array.from(new Set(p.items.reduce((a, it) => a.concat((libOf(it.id) || { eq: [] }).eq), []))).concat(p.id === "walk" ? [] : []);
function srcOf(src) {
  const [k, id] = src.split(":");
  if (k === "plan") { const d = S.plan && S.plan.days[+id]; return d && { name: d.name, items: d.items, key: src, d }; }
  if (k === "pre") { const p = PRESETS.find(x => x.id === id); return p && { name: p.n, items: p.items, key: src, d: p, desc: p.d }; }
  if (k === "prog") { const p = (S.progs || []).find(x => x.id === id); return p && { name: p.name, items: p.items, key: src, d: p, mine: p }; }
  return null;
}
SUBS.fitday = arg => {
  const s = srcOf(arg.id || ""); if (!s) return { title: "โปรแกรม", html: `<p class="muted">ไม่พบโปรแกรม</p>` };
  const body = s.items.map(it => { const e = libOf(it.id); return e ? `<button class="item" style="width:100%;text-align:left" data-act="sub" data-n="lib" data-arg="${e.id}">${exThumb(e)}<div class="grow"><b>${e.n}${it.warm ? ' <span class="ftag">อุ่นเครื่อง</span>' : it.cool ? ' <span class="ftag">ยืด</span>' : ""}</b><div class="xs muted">${volText(it)}${e.eq.length ? " · " + e.eq.map(k => EQN[k].split(" ")[0]).join(" ") : ""}</div></div>${ic("play", 16)}</button>` : ""; }).join("");
  return { title: s.name, html: `${s.desc ? `<p class="fd-desc">${esc(s.desc)}</p>` : ""}<div class="fdhero"><span class="fd-bg" aria-hidden="true"><i></i><i></i></span><div class="fd-s"><span><b>${s.items.filter(x => !x.warm && !x.cool).length || s.items.length}</b>ท่า</span><span><b>${dayMins(s.d || s)}</b>นาที</span><span><b>${dayKcal(s.d || s)}</b>kcal</span></div></div><button class="btn primary block go" style="margin:12px 0" data-act="sesstart" data-src="${s.key}">${ic("play", 18)}เริ่มออกกำลังกาย</button>${body}
${s.mine ? `<div class="row" style="margin-top:14px;gap:8px"><button class="btn" style="flex:1" data-act="pbedit" data-id="${s.mine.id}">แก้ไข</button><button class="btn danger" style="flex:1" data-act="pbdel" data-id="${s.mine.id}">ลบ</button></div>` : ""}` };
};

/* ---------- โหมดเซสชัน ---------- */
let SES = null, SEV = null, WL = null;
const snd = () => { try { return localStorage.getItem("wl_snd") !== "0"; } catch (e) { return true; } };
let AC = null;
function beep(f, d) { if (!snd()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f || 880; g.gain.value = .08; o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + (d || .12)); } catch (e) { } }
function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p || 80); } catch (e) { } }
async function wakeOn() { try { if (navigator.wakeLock) WL = await navigator.wakeLock.request("screen"); } catch (e) { } }
function wakeOff() { try { if (WL) WL.release(); } catch (e) { } WL = null; }
document.addEventListener("visibilitychange", () => { if (!document.hidden && SES && SES.phase !== "done") wakeOn(); });
const tempoOf = e => e.reps ? clampN(RIG.period(e.rig) || 3, 1.5, 5) : 1;
ACT.sesstart = a => {
  const s = srcOf(a.dataset.src); if (!s) return;
  SES = newSes(s.name, s.key, s.items);
  openSub("session", {});
};
const newSes = (name, key, items) => ({ name, key, items: items.filter(it => libOf(it.id)), i: 0, set: 1, phase: "ready", t0: 0, startedAt: Date.now(), done: {}, paused: false, pausedAt: 0, restLen: 0, w: {}, sets: {}, int: 1, last: null });
const curW = () => { const e = curE(); if (!weighted(e)) return 0; return SES.w[SES.i] != null ? SES.w[SES.i] : (SES.w[SES.i] = lastW(e.id)); };
const cur = () => SES.items[SES.i], curE = () => libOf(cur().id), setsOf = it => it.mins ? 1 : (it.sets || 1);
function beginWork() { SES.between = 0; SES.phase = "work"; SES.t0 = Date.now(); SES.paused = false; wakeOn(); beep(990, .15); startSesTick(); rerenderSub(); }
function endSet(manual) {
  const it = cur(), e = curE(), d = SES.done[SES.i] = SES.done[SES.i] || { sets: 0, sec: 0, reps: 0 }, el = (Date.now() - SES.t0) / 1000;
  d.sets++; d.sec += it.reps ? Math.min(el, it.reps * tempoOf(e)) : Math.min(el, it.mins ? it.mins * 60 : it.secs || el); if (it.reps) d.reps += manual ? Math.min(it.reps, Math.max(1, Math.floor(el / tempoOf(e)))) : it.reps;
  if (it.reps) { const arr = SES.sets[SES.i] = SES.sets[SES.i] || []; arr.push({ w: curW(), r: manual ? Math.min(it.reps, Math.max(1, Math.floor(el / tempoOf(e)))) : it.reps }); SES.last = { i: SES.i, k: arr.length - 1 }; }
  buzz([60, 40, 60]); beep(660, .2);
  if (SES.set < setsOf(it)) { SES.set++; SES.phase = "rest"; SES.restLen = it.rest || 30; SES.t0 = Date.now(); }
  else if (SES.i < SES.items.length - 1) { SES.i++; SES.set = 1; SES.phase = "rest"; SES.restLen = Math.max(15, it.rest || 15); SES.t0 = Date.now(); SES.between = 1; }
  else return sesFinish();
  rerenderSub();
}
function sesTick() {
  if (!SES || SES.paused || SES.phase === "done") return; const c = $("#tcount"); if (!c) return;
  const el = (Date.now() - SES.t0) / 1000, it = cur(), e = curE();
  if (SES.phase === "work") {
    if (it.reps) { const n = Math.floor(el / tempoOf(e)); if (n >= it.reps) return endSet(false); c.textContent = n; }
    else { const tot = it.mins ? it.mins * 60 : it.secs, left = Math.ceil(tot - el); if (left <= 0) return endSet(false); c.textContent = it.mins ? Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0") : left; if (left <= 3) beep(740, .06); }
  } else if (SES.phase === "rest") {
    const left = Math.ceil(SES.restLen - el); if (left <= 0) return beginWork(); c.textContent = left; if (left <= 3) beep(740, .06);
  }
}
function startSesTick() { clearInterval(SEV); SEV = setInterval(sesTick, 200); }
ACT.sesgo = () => beginWork();
ACT.seswt = a => { const d = +a.dataset.d, e = curE(); SES.w[SES.i] = Math.max(0, r1(curW() + d * stepW(e))); rerenderSub(); };
ACT.seswin = null;
ACT.sesint = a => { SES.int = +a.dataset.v; rerenderSub(); };
ACT.seslast = a => { const L = SES.last; if (!L) return; const st = SES.sets[L.i][L.k], e = libOf(SES.items[L.i].id), what = a.dataset.w, d = +a.dataset.d; if (what === "w") { st.w = Math.max(0, r1(st.w + d * stepW(e))); SES.w[L.i] = st.w; } else st.r = Math.max(1, st.r + d); rerenderSub(); };
ACT.sesdone = () => { if (SES.phase === "work") endSet(true); };
ACT.sesskiprest = () => beginWork();
ACT.sesplus = () => { SES.restLen += 15; rerenderSub(); };
ACT.sespause = () => { if (!SES) return; if (SES.paused) { SES.t0 += Date.now() - SES.pausedAt; SES.paused = false; } else { SES.paused = true; SES.pausedAt = Date.now(); } rerenderSub(); };
ACT.sesnext = () => { if (SES.i < SES.items.length - 1) { SES.i++; SES.set = 1; SES.phase = "ready"; SES.paused = false; clearInterval(SEV); rerenderSub(); } else sesFinish(); };
ACT.sesprev = () => { if (SES.i > 0) { SES.i--; SES.set = 1; SES.phase = "ready"; SES.paused = false; clearInterval(SEV); rerenderSub(); } };
ACT.sesend = () => { openModal(`<h2>จบการออกกำลังกายตอนนี้ไหม</h2><p class="muted" style="margin:8px 0 14px">บันทึกเฉพาะท่าที่ทำเสร็จแล้ว</p><div class="row"><button class="btn primary" style="flex:1" data-act="modalclose">ทำต่อ</button><button class="btn danger" style="flex:1" data-act="sesconfirm">จบและบันทึก</button></div>`); };
ACT.sesconfirm = () => { closeModal(); sesFinish(); };
ACT.sesstat = () => { clearInterval(SEV); wakeOff(); SES = null; closeAllSubs(); openSub("progress", {}); };
ACT.sesquit = () => { closeModal(); clearInterval(SEV); wakeOff(); SES = null; closeAllSubs(); };
ACT.sessnd = () => { try { localStorage.setItem("wl_snd", snd() ? "0" : "1"); } catch (e) { } rerenderSub(); };
function sesFinish() {
  clearInterval(SEV); wakeOff(); const s = SES, kg = estW(); let k = 0, ex = 0, sets = 0, active = 0;
  const prs = [], FI = [.85, 1, 1.2][s.int == null ? 1 : s.int];
  Object.keys(s.done).forEach(i => { const d = s.done[i], it = s.items[i], e = libOf(it.id); if (!d.sets) return; ex++; sets += d.sets; active += d.sec;
    const kc = workCalc({ n: e.n, met: (e.met || 3.5) * FI, kind: "time", mins: d.sec / 60, known: true, km: 0 }, kg).k; k += kc;
    const ss = (s.sets[i] || []).filter(x => x.r > 0);
    if (ss.length && (weighted(e) || ss.some(x => x.w > 0))) { const rec = { id: rid(), d: todayKey(), t: nowHM(), ex: e.id, sets: ss.map(x => ({ w: x.w || 0, r: x.r })) }; prs.push.apply(prs, prsOf(rec, liftsOf(e.id))); S.lifts = (S.lifts || []).concat([rec]).slice(-2500); }
    const label = e.n + (it.mins ? " · " + Math.round(d.sec / 60) + " นาที" : e.reps || it.reps ? ` · ${d.sets} เซ็ต ${it.reps} ครั้ง` : ` · ${d.sets} เซ็ต ${it.secs} วินาที`);
    S.works.push({ id: rid(), d: todayKey(), t: nowHM(), n: label, ex: e.id, sets: d.sets, reps: it.reps || 0, k: kc }); });
  s.sum = { secs: Math.round((Date.now() - s.startedAt) / 1000), k, ex, sets, active: Math.round(active), prs }; s.phase = "done"; if (prs.length) earn(Math.min(prs.length, 3) * 2);
  if (ex) { S.sessions = (S.sessions || []).concat([{ id: rid(), d: todayKey(), t: nowHM(), name: s.name, src: s.key, secs: s.sum.secs, k, ex }]).slice(-400); earn(5 + Math.min(ex, 5)); touchStreak(); confetti(); setFx("proud", 3000); beep(1100, .3); buzz([100, 60, 100, 60, 200]); }
  save(); rerenderSub();
}
SUBS.session = () => {
  const s = SES; if (!s) return { title: "ออกกำลังกาย", html: `<p class="muted">ไม่มีเซสชัน</p>` };
  if (s.phase === "done") { const m = s.sum, mm = Math.floor(m.secs / 60);
    return { title: "สรุปการออกกำลังกาย", html: `<div class="card" style="text-align:center">${m.ex ? `<div class="muted">${esc(s.name)}</div><div class="big-num">${mm} นาที</div><div class="sm">${m.ex} ท่า · ${m.sets} เซ็ต · ประมาณ ${m.k} kcal</div><div class="xs muted" style="margin-top:6px">kcal คำนวณจากเวลาที่ทำจริง ไม่รวมเวลาพัก ปรับตามความหนักที่เลือก</div>` : `<div class="sm">ยังไม่ได้ทำท่าไหนเสร็จ จึงไม่ได้บันทึก</div>`}</div>${m.prs && m.prs.length ? `<div class="sec">สถิติใหม่</div>${m.prs.map(p => `<div class="item"><div class="grow"><b>${esc(p.n)}</b><div class="xs muted">${p.t}</div></div><b>${p.v}</b></div>`).join("")}` : ""}${m.ex ? `<p class="sm" style="margin:12px 0">บันทึกลงรายการวันนี้แล้ว ได้เหรียญและต่อสตรีค</p>` : ""}<button class="btn primary block" data-act="sesquit">เสร็จ</button><button class="btn block" style="margin-top:8px" data-act="sesstat">ดูสถิติและแผนที่กล้ามเนื้อ</button>` }; }
  const it = cur(), e = curE(), n = s.items.length, ph = s.phase, nx = s.items[s.i + 1] && libOf(s.items[s.i + 1].id), tot = setsOf(it);
  const label = ph === "ready" ? "พร้อมแล้วกดเริ่ม" : ph === "rest" ? (s.between ? "พักก่อนท่าถัดไป" : "พักระหว่างเซ็ต") : s.paused ? "หยุดชั่วคราว" : e.cat === "ยืดเหยียด" ? "ค้างไว้ หายใจช้าๆ" : "ทำเลย";
  const big = ph === "work" ? (it.reps ? "0" : it.mins ? it.mins + ":00" : it.secs) : ph === "rest" ? s.restLen : "-";
  const sub = it.reps ? `จาก ${it.reps} ครั้ง` : it.mins ? "นาที" : "วินาที";
  const wOn = weighted(e), w = wOn ? curW() : 0, L = s.last, ls = L && s.sets[L.i] && s.sets[L.i][L.k], le = L && libOf(s.items[L.i].id);
  const wRow = !wOn ? "" : ph === "work" ? `<div class="xs muted" style="text-align:center;margin-top:6px">น้ำหนัก ${w ? w + " กก." : "น้ำหนักตัว"}</div>` : `<div class="fwt"><span>น้ำหนักที่ใช้</span><button data-act="seswt" data-d="-1" aria-label="ลดน้ำหนัก">−</button><b>${w ? w + " กก." : "น้ำหนักตัว"}</b><button data-act="seswt" data-d="1" aria-label="เพิ่มน้ำหนัก">+</button></div>`;
  const recap = ph === "rest" && ls && weighted(le) ? `<div class="fwt recap"><span>เซ็ตที่แล้ว ${esc(le.n)}: แก้ได้</span><button data-act="seslast" data-w="r" data-d="-1" aria-label="ลดจำนวนครั้ง">−</button><b>${ls.r} ครั้ง</b><button data-act="seslast" data-w="r" data-d="1" aria-label="เพิ่มจำนวนครั้ง">+</button><button data-act="seslast" data-w="w" data-d="-1" aria-label="ลดน้ำหนัก">−</button><b>${ls.w ? ls.w + " กก." : "BW"}</b><button data-act="seslast" data-w="w" data-d="1" aria-label="เพิ่มน้ำหนัก">+</button></div>` : "";
  const intRow = ph === "ready" && s.i === 0 && s.set === 1 ? `<div class="frow" style="margin-top:10px;justify-content:center">${["เบา", "กลาง", "หนัก"].map((n, i) => `<button class="fchip sm ${s.int === i ? "on" : ""}" data-act="sesint" data-v="${i}">${n}</button>`).join("")}</div><div class="xs muted" style="text-align:center">ความหนักของวันนี้ ใช้ปรับ kcal</div>` : "";
  const btns = ph === "ready" ? `<button class="btn primary" style="flex:1" data-act="sesgo">เริ่ม</button>` : ph === "rest" ? `<button class="btn" data-act="sesplus">+15 วิ</button><button class="btn primary" style="flex:1" data-act="sesskiprest">พร้อมแล้ว</button>` : `<button class="btn" data-act="sespause">${ic(s.paused ? "play" : "pause", 18)}${s.paused ? "ต่อ" : "หยุด"}</button><button class="btn primary" style="flex:1" data-act="sesdone">${it.reps ? "ทำครบแล้ว" : "จบเซ็ต"}</button>`;
  const rigH = e.rig ? RIG.html(e.rig, e.approx ? `<span class="fapx">ภาพใกล้เคียง</span>` : "") : `<div class="stage"><div class="fnorig">${ic("dumbbell", 40)}<div>ยังไม่มีภาพท่านี้ ดูวิธีทำด้านล่าง</div></div></div>`;
  return { title: `${s.i + 1}/${n} · ${e.n}`, keepScroll: true, html: `<div class="fprog">${s.items.map((_, i) => `<i class="${i < s.i ? "on" : i === s.i ? "cur" : ""}"></i>`).join("")}</div>${rigH}
<div class="muted sm" style="text-align:center;margin-top:8px">${label}</div><div class="tcount" id="tcount">${big}</div><div class="muted" style="text-align:center">${ph === "rest" ? "วินาที · ถัดไป: " + esc(e.n) : sub} · เซ็ต ${Math.min(s.set, tot)}/${tot}</div>
${recap}${wRow}${intRow}<div class="row" style="margin-top:14px;gap:8px">${btns}</div>
<div class="row" style="margin-top:8px;gap:8px"><button class="btn" style="flex:1" data-act="sesprev" ${s.i ? "" : "disabled"}>ท่าก่อนหน้า</button><button class="btn" style="flex:1" data-act="sesnext">ข้ามท่า</button><button class="btn danger" data-act="sesend">จบ</button></div>
<div class="hint" style="margin-top:12px">${ic("sparkle", 18)}<span>${esc(e.tip)}</span></div><details style="margin-top:8px"><summary class="sm">วิธีทำ</summary><p class="sm" style="margin-top:6px">${esc(e.how)}</p></details>
${nx && ph !== "rest" ? `<div class="xs muted" style="margin-top:10px">ท่าถัดไป: ${esc(nx.n)}</div>` : ""}<div class="xs" style="margin-top:8px"><button class="linkb" data-act="sessnd">เสียงเตือน: ${snd() ? "เปิด" : "ปิด"}</button></div>`,
    after: el => { if (e.rig) RIG.mount(el.querySelector("canvas.rig"), { ex: e.rig, nodumb: e.noDumb, state: now => { if (!SES || SES !== s || s.phase === "done") return { tm: 0, idle: true }; if (s.phase === "work" && !s.paused) { const t = (Date.now() - s.t0) / 1000; return { tm: t, period: it.reps ? tempoOf(e) : undefined, expr: "auto" }; } if (s.phase === "work") return { tm: (s.pausedAt - s.t0) / 1000, period: it.reps ? tempoOf(e) : undefined, expr: "auto" }; return { tm: 0, idle: true, heavy: s.phase === "rest", expr: s.phase === "rest" ? "tired" : "smile" }; } }); if ((ph === "work" || ph === "rest") && !s.paused) startSesTick(); } };
};
const _bk2 = ACT.back;
ACT.back = () => { const t = subStack[subStack.length - 1]; if (t && t.name === "session" && SES && SES.phase !== "done") { ACT.sesend(); return; } if (t && t.name === "session") { clearInterval(SEV); wakeOff(); SES = null; } _bk2(); };

/* ---------- ตัวสร้างโปรแกรมเอง ---------- */
let PB = null;
const pbList = () => { const F = S.fit, q = (PB.q || "").trim(), cats = PB.cat; return LIB.filter(e => (cats === "all" || e.cat === cats) && (!PB.mine || !F || (FIT.has(e, F))) && (!q || (e.n + e.mus).indexOf(q) > -1)).slice(0, 80).map(e => `<button class="item" style="width:100%;text-align:left" data-act="pbadd" data-id="${e.id}">${exThumb(e, 1)}<div class="grow"><b>${e.n}</b><div class="xs muted">${e.mus}${e.eq.length ? " · " + e.eq.map(k => EQN[k].split(" ")[0]).join(" ") : ""} · ${["", "เริ่มต้น", "กลาง", "สูง"][e.lvl]}</div></div>${ic("plus", 18)}</button>`).join("") || `<p class="xs muted">ไม่พบท่า</p>`; };
const defItem = e => { const o = { id: e.id, rest: e.cat === "ยืดเหยียด" ? 10 : 45 }; if (e.mins) o.mins = e.mins; else { o.sets = e.sets || 3; if (e.reps) o.reps = e.reps; else o.secs = e.secs || 30; } return o; };
SUBS.pbuild = () => {
  const p = PB, cats = ["all", "ขาและก้น", "อก แขน ไหล่", "หลัง", "แกนกลางลำตัว", "คาร์ดิโอ", "ยืดเหยียด"];
  const items = p.items.map((it, i) => { const e = libOf(it.id); return `<div class="pbit">${exThumb(e, 1)}<div class="grow"><b>${e.n}</b><div class="xs muted">${volText(it)}</div></div><div class="pbctl"><button data-act="pbstep" data-i="${i}" data-d="-1" aria-label="ลด">−</button><button data-act="pbstep" data-i="${i}" data-d="1" aria-label="เพิ่ม">+</button><button data-act="pbup" data-i="${i}" aria-label="เลื่อนขึ้น">▲</button><button data-act="pbdn" data-i="${i}" aria-label="เลื่อนลง">▼</button><button data-act="pbrm" data-i="${i}" aria-label="เอาออก">✕</button></div></div>`; }).join("");
  return { title: p.id ? "แก้ไขโปรแกรม" : "สร้างโปรแกรม", keepScroll: true, html: `<label class="f" for="pbname">ชื่อโปรแกรม</label><input id="pbname" value="${esc(p.name)}" placeholder="เช่น ขาวันจันทร์"/>
<div class="sec">ท่าในโปรแกรม (${p.items.length})</div>${items || `<p class="xs muted">เลือกท่าจากด้านล่างได้เลย</p>`}${p.items.length ? `<div class="card sm" style="margin-top:8px">ประมาณ ${dayMins(p)} นาที · ${dayKcal(p)} kcal</div>` : ""}
<div class="row" style="margin-top:10px;gap:8px"><button class="btn primary" style="flex:1" data-act="pbsave">บันทึก</button><button class="btn" style="flex:1" data-act="pbrun" ${p.items.length ? "" : "disabled"}>เริ่มเลย</button></div>
<div class="sec">เพิ่มท่า</div><div class="row" style="gap:6px;overflow-x:auto;padding-bottom:6px">${cats.map(c => `<button class="fchip sm ${p.cat === c ? "on" : ""}" data-act="pbcat" data-c="${c}">${c === "all" ? "ทั้งหมด" : c}</button>`).join("")}</div>
<input id="pbq" placeholder="ค้นหาท่า" value="${esc(p.q || "")}" style="margin:8px 0"/><label class="row" style="gap:8px;margin-bottom:6px"><input id="pbmine" type="checkbox" ${p.mine ? "checked" : ""} style="width:20px;height:20px"/><span class="sm">เฉพาะท่าที่ฉันทำได้ตามอุปกรณ์</span></label><div id="pblist">${pbList()}</div>` };
};
const pbSync = () => { if (!PB) return; const n = $("#pbname"); if (n) PB.name = n.value; };
document.addEventListener("input", e => { if (!PB) return; if (e.target.id === "pbq") { PB.q = e.target.value; const l = $("#pblist"); if (l) l.innerHTML = pbList(); } });
document.addEventListener("change", e => { if (PB && e.target.id === "pbmine") { pbSync(); PB.mine = e.target.checked; rerenderSub(); } });
ACT.pbnew = () => { PB = { id: null, name: "", items: [], cat: "all", q: "", mine: !!S.fit }; openSub("pbuild", {}); };
ACT.pbedit = a => { const p = (S.progs || []).find(x => x.id === a.dataset.id); if (!p) return; PB = { id: p.id, name: p.name, items: JSON.parse(JSON.stringify(p.items)), cat: "all", q: "", mine: false }; openSub("pbuild", {}); };
ACT.pbadd = a => { pbSync(); PB.items.push(defItem(libOf(a.dataset.id))); rerenderSub(); };
ACT.pbrm = a => { pbSync(); PB.items.splice(+a.dataset.i, 1); rerenderSub(); };
ACT.pbup = a => { pbSync(); const i = +a.dataset.i; if (i > 0) { const t = PB.items[i]; PB.items[i] = PB.items[i - 1]; PB.items[i - 1] = t; } rerenderSub(); };
ACT.pbdn = a => { pbSync(); const i = +a.dataset.i; if (i < PB.items.length - 1) { const t = PB.items[i]; PB.items[i] = PB.items[i + 1]; PB.items[i + 1] = t; } rerenderSub(); };
ACT.pbstep = a => { pbSync(); const it = PB.items[+a.dataset.i], d = +a.dataset.d; if (it.reps) it.reps = Math.max(3, it.reps + d); else if (it.secs) it.secs = Math.max(10, it.secs + 5 * d); else if (it.mins) it.mins = Math.max(1, it.mins + d); rerenderSub(); };
ACT.pbcat = a => { pbSync(); PB.cat = a.dataset.c; rerenderSub(); };
function pbCommit() { pbSync(); if (!PB.items.length) { toast("เพิ่มท่าก่อน"); return null; } const name = (PB.name || "").trim() || "โปรแกรมของฉัน"; S.progs = S.progs || []; let p = PB.id && S.progs.find(x => x.id === PB.id); if (!p) { p = { id: rid() }; S.progs.push(p); PB.id = p.id; } p.name = name; p.items = JSON.parse(JSON.stringify(PB.items)); save(); return p; }
ACT.pbsave = () => { if (pbCommit()) { toast("บันทึกโปรแกรมแล้ว"); closeSub(); if (subStack.length) rerenderSub(); } };
ACT.pbrun = () => { const p = pbCommit(); if (p) { SES = newSes(p.name, "prog:" + p.id, p.items); openSub("session", {}); } };
ACT.pbdel = a => { const id = a.dataset.id, i = (S.progs || []).findIndex(x => x.id === id); if (i < 0) return; const it = S.progs[i]; S.progs.splice(i, 1); S.del["p:" + id] = Date.now(); save(); closeSub(); if (subStack.length) rerenderSub(); toastUndo(`ลบ “${it.name}” แล้ว`, () => { S.progs.push(it); delete S.del["p:" + id]; save(); if (subStack.length) rerenderSub(); }); };

/* ---------- ทางเข้า ---------- */
(function () {
  if (!TILES.some(t => t[4] === "fit")) TILES.splice(TILES.findIndex(t => t[4] === "log" && t[5] === "work") + 1, 0, ["บันทึก", "target", "โปรแกรมออกกำลัง", "แผน ตั้งเวลา นำออกกำลัง", "fit", "", "d-warn", "โปรแกรม แผน ออกกำลัง ที่บ้าน ยิม อุปกรณ์ เซสชัน"]);
  const oLog = SUBS.log; SUBS.log = a => { const r = oLog(a); if (r && r.title === "ออกกำลังกาย" && r.html) r.html = r.html.replace("<!--logcta-->", `<button class="progcta" data-act="sub" data-n="fit"><span class="pc-ic">${ic("play", 22)}</span><span class="pc-t"><b>โปรแกรมออกกำลังกาย</b><small>นำออกกำลังทีละท่า มีน้องเกี๊ยวทำให้ดู</small></span><span class="pc-go">${ic("back", 20)}</span></button>`); return r; };
})();
