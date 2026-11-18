/* กราฟ ตัวละคร โหมดต่างๆ และการเชื่อมเหตุการณ์ */
const baseName = n => String(n).split(" · ")[0].replace(/ ×[\d.]+$/, "");
ACT.sub = (a) => {
  closeSheet(); const n = a.dataset.n;
  if (n === "log") LG = null; if (n === "wardrobe" || n === "room" || n === "shop") EDIT = null;
  openSub(n, { id: a.dataset.arg, tab: a.dataset.arg });
};
ACT.back = () => {
  const top = subStack[subStack.length - 1];
  if (top && (top.name === "wardrobe" || top.name === "room" || top.name === "shop")) EDIT = null;
  if (top && top.name === "night") stopNight();
  closeSub();
};
function logText(tab, text) { LG = null; openSub("log", { tab, text, fresh: true }); }
ACT.logfood = (a) => logText("food", a.dataset.t);

/* ---------- กราฟ ---------- */
function lineSvg(pts, avg, W, H, unit) {
  if (pts.length < 2) return '<p class="muted sm" style="padding:16px 0">ยังมีข้อมูลไม่พอสำหรับกราฟ ชั่งน้ำหนักอีกสักครั้งสองครั้งนะ</p>';
  const all = pts.map(p => p.v).concat(avg.map(p => p.v)), mn = Math.floor(Math.min.apply(null, all) - 0.5), mx = Math.ceil(Math.max.apply(null, all) + 0.5);
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t, X = t => 34 + (t - t0) / Math.max(1, t1 - t0) * (W - 48), Y = v => 14 + (1 - (v - mn) / Math.max(0.5, mx - mn)) * (H - 40);
  const path = avg.map((p, i) => (i ? "L" : "M") + X(p.t).toFixed(1) + " " + Y(p.v).toFixed(1)).join("");
  let g = ""; for (let i = 0; i <= 3; i++) { const v = mn + (mx - mn) * i / 3, y = Y(v); g += `<line class="grid" x1="34" x2="${W - 14}" y1="${y}" y2="${y}"/><text x="30" y="${y + 4}" text-anchor="end">${v.toFixed(1)}</text>`; }
  const d0 = new Date(t0), d1 = new Date(t1);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟน้ำหนักย้อนหลัง">${g}${pts.map(p => `<circle cx="${X(p.t).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="3" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.2"/>`).join("")}<path class="draw" pathLength="1" d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><text x="34" y="${H - 6}">${fmtD(dk(d0))}</text><text x="${W - 14}" y="${H - 6}" text-anchor="end">${fmtD(dk(d1))}</text></svg>`;
}
function renderCharts() {
  const R = CH.range, today = todayKey(), from = addDays(today, -R + 1);
  const ws = S.weights.filter(x => x.d >= from);
  const pts = ws.map(x => ({ t: new Date(x.d + "T12:00:00").getTime(), v: x.w }));
  const avg = ws.map(x => ({ t: new Date(x.d + "T12:00:00").getTime(), v: trendAt(x.d).w }));
  const nd = Math.min(R, 30), days = []; for (let i = nd - 1; i >= 0; i--) days.push(addDays(today, -i));
  const info = days.map(k => dayInfo(k)), mxk = Math.max(1500, ...info.map(i => i.eaten), ...info.map(i => baseBurn(weightOn(i.key)) + i.wk));
  const bw = 340 / nd, bars = info.map((i, n) => {
    const x = 30 + n * ((340 - 20) / nd), w = Math.max(3, (340 - 20) / nd - 3), h = i.eaten / mxk * 110, bh = (baseBurn(weightOn(i.key)) + i.wk) / mxk * 110;
    return `<rect x="${x.toFixed(1)}" y="${(124 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="var(--accent)" opacity=".85"/><rect x="${(x - 1).toFixed(1)}" y="${(124 - bh).toFixed(1)}" width="${(w + 2).toFixed(1)}" height="2" fill="var(--green)"/>`;
  }).join("");
  const wk = {}; S.works.forEach(m => { const d = new Date(m.d + "T12:00:00"), mon = addDays(m.d, -((d.getDay() + 6) % 7)); wk[mon] = (wk[mon] || 0) + (m.sets || (m.reps ? 1 : 0)); });
  const wkeys = []; for (let i = 7; i >= 0; i--) { const d = new Date(), mon = addDays(dk(d), -((d.getDay() + 6) % 7) - i * 7); wkeys.push(mon); }
  const mxs = Math.max(5, ...wkeys.map(k => wk[k] || 0));
  const sb = wkeys.map((k, n) => { const v = wk[k] || 0, h = v / mxs * 90, x = 34 + n * 38; return `<rect x="${x}" y="${108 - h}" width="26" height="${h}" rx="4" fill="var(--blue)"/><text x="${x + 13}" y="${102 - h}" text-anchor="middle">${v || ""}</text><text x="${x + 13}" y="124" text-anchor="middle">${fmtD(k)}</text>`; }).join("");
  const ex = {}; S.works.filter(m => m.d >= from).forEach(m => { const n = baseName(m.n), e = ex[n] = ex[n] || { s: 0, r: 0, c: 0 }; e.c++; e.s += m.sets || 0; e.r += (m.sets || 1) * (m.reps || 0); });
  const exl = Object.keys(ex).sort((a, b) => ex[b].c - ex[a].c).slice(0, 8).map(n => `<div class="item"><div class="grow"><b>${esc(n)}</b></div><span class="muted sm">${ex[n].c} ครั้งที่ทำ · ${ex[n].s} เซ็ต${ex[n].r ? " · " + ex[n].r + " ท่า" : ""}</span></div>`).join("");
  $("#v-charts").innerHTML = `<div class="top"><h1>กราฟย้อนหลัง</h1></div>
<div class="seg">${[14, 30, 90].map(r => `<button class="${R === r ? "on" : ""}" data-act="chrange" data-r="${r}">${r} วัน</button>`).join("")}</div>
<div class="sec">น้ำหนัก (จุดคือรายวัน เส้นคือค่าเฉลี่ย 7 วัน)</div><div class="card">${lineSvg(pts, avg, 360, 190)}</div>
<div class="sec">แคลอรี่ที่กิน (แท่ง) เทียบพลังงานที่ใช้ (ขีดเขียว)</div><div class="card"><svg class="chart" viewBox="0 0 360 140" role="img" aria-label="กราฟแคลอรี่ที่กินและใช้"><line class="grid" x1="30" x2="350" y1="124" y2="124"/><text x="26" y="128" text-anchor="end">0</text><text x="26" y="18" text-anchor="end">${fmtN(mxk)}</text>${bars}</svg><div class="xs muted">${fmtD(days[0])} ถึง ${fmtD(days[days.length - 1])}</div></div>
<div class="sec">จำนวนเซ็ตต่อสัปดาห์</div><div class="card"><svg class="chart" viewBox="0 0 360 134" role="img" aria-label="กราฟเซ็ตต่อสัปดาห์">${sb}</svg></div>
<div class="sec">แต่ละท่าที่ทำในช่วงนี้</div><div class="card" style="padding:4px 14px">${exl || '<div class="muted sm" style="padding:12px 0">ยังไม่มีบันทึกออกกำลังกายในช่วงนี้</div>'}</div>`;
}
ACT.chrange = (a) => { CH.range = +a.dataset.r; renderCharts(); };

/* ---------- ตัวละคร ---------- */
function renderChar() {
  const w = estW(), w0 = S.prof.w0, diff = w0 - w, per = periodOf(new Date().getHours());
  const L = S.look, rxN = shapeRx(w), rx0 = shapeRx(w0);
  const ms = [1, 2, 3, 4, 5].map(k => `<span class="chip ${diff >= k ? "green" : ""}" style="${diff >= k ? "" : "opacity:.5"}">${diff >= k ? ic("check", 14) : ic("lock", 14)}ลด ${k} กก.</span>`).join("");
  $("#v-char").innerHTML = `<div class="top"><div><div class="muted sm">ตัวแทนของคุณ</div><h1>${esc(S.name || "น้องก้อน")}</h1></div><span class="chip soft">${ic("coin", 15)}${S.coins}</span></div>
<div class="stage"><svg viewBox="0 0 380 290" role="img" aria-label="เปรียบเทียบตอนเริ่มกับตอนนี้"><rect width="380" height="290" fill="#FFF1E3"/><rect y="252" width="380" height="38" fill="#F3D9BF"/><g transform="translate(110,268)" opacity=".35" style="filter:grayscale(.6)">${figure(L, "happy", rx0)}</g><g transform="translate(270,268)">${figure(L, "happy", rxN)}</g><text x="110" y="24" text-anchor="middle" font-size="13" fill="#8a7a6a">ตอนเริ่ม ${f1(w0)} กก.</text><text x="270" y="24" text-anchor="middle" font-size="13" fill="#6b4a3a">ตอนนี้ ${f1(w)} กก.</text></svg></div>
<div class="card"><div class="row between"><span class="muted">เปลี่ยนไปแล้ว</span><b style="font-size:20px">${diff >= 0 ? "-" : "+"}${f1(Math.abs(diff))} กก.</b></div><div class="row wrap" style="margin-top:10px">${ms}</div><p class="xs muted" style="margin-top:8px">น้ำหนักตัวละครคำนวณจากน้ำหนักที่ชั่งจริงและแคลอรี่ที่บันทึก ชั่งเป็นประจำจะแม่นขึ้น</p></div>
<div class="grid2" style="margin-top:12px"><button class="tile" data-act="sub" data-n="room"><span class="dot d-rose">${ic("home", 20)}</span><span><b>ตกแต่งห้อง</b><span class="s">ของแต่ง สัตว์เลี้ยง</span></span></button><button class="tile" data-act="sub" data-n="wardrobe"><span class="dot d-rose">${ic("hanger", 20)}</span><span><b>แต่งตัว</b><span class="s">เปลี่ยนหน้าตา</span></span></button><button class="tile" data-act="sub" data-n="shop"><span class="dot d-rose">${ic("bag", 20)}</span><span><b>ร้านค้า</b><span class="s">${S.coins} เหรียญ</span></span></button><button class="tile" data-act="sub" data-n="missions"><span class="dot d-blue">${ic("target", 20)}</span><span><b>ภารกิจ</b><span class="s">รับของรางวัล</span></span></button><button class="tile" data-act="sub" data-n="medals"><span class="dot d-blue">${ic("sparkle", 20)}</span><span><b>เหรียญรางวัล</b><span class="s">${medalCount()} / ${MEDALS.length * 4} อัน</span></span></button><button class="tile" data-act="sub" data-n="share"><span class="dot d-rose">${ic("send", 20)}</span><span><b>แชร์การ์ด</b><span class="s">ส่ง LINE หรือ IG</span></span></button><button class="tile" data-act="sub" data-n="settings"><span class="dot d-blue">${ic("settings", 20)}</span><span><b>ตั้งค่า</b><span class="s">เป้าหมาย ข้อมูล</span></span></button></div>`;
}
SUBS.missions = () => ({
  title: "ภารกิจ", html: `<p class="muted sm" style="margin-bottom:8px">เหรียญได้จากความสม่ำเสมอ ไม่ได้ขึ้นกับน้ำหนัก</p>` + MISSIONS.map(m => {
    const p = Math.min(m.goal, missionProg(m.id)), done = p >= m.goal, got = S.claimed[m.id];
    return `<div class="card"><div class="row between"><b>${m.n}</b><span class="chip soft">${ic("coin", 14)}${m.coins}</span></div><div class="bar" style="margin:8px 0"><i style="width:${p / m.goal * 100}%"></i></div><div class="row between"><span class="xs muted">${p}/${m.goal}${m.item ? " · รางวัล: " + m.itemName : ""}</span>${got ? '<span class="chip green">' + ic("check", 14) + "รับแล้ว</span>" : `<button class="btn sm ${done ? "primary" : ""}" ${done ? "" : "disabled"} data-act="claim" data-id="${m.id}">รับรางวัล</button>`}</div></div>`;
  }).join("")
});
ACT.claim = (a) => {
  const m = MISSIONS.find(x => x.id === a.dataset.id); if (!m || S.claimed[m.id] || missionProg(m.id) < m.goal) return;
  S.claimed[m.id] = true; S.coins += m.coins; if (m.item) S.owned[m.item] = true; save(); confetti(); popCoins(m.coins); toast(m.item ? "ปลดล็อก " + m.itemName + " แล้ว" : "ได้รับเหรียญแล้ว"); rerenderSub();
};

/* ---------- ช่วยตัดสินใจ ---------- */
let PICK = { tag: null, f: null };
function pickTag() { const h = new Date().getHours(); return h < 10 ? "b" : h < 15 ? "m" : h < 17 ? "s" : "m"; }
SUBS.pick = () => {
  if (!PICK.tag) PICK.tag = pickTag();
  const rem = remainingNow(), pool = FOODS.filter(f => f[2] === PICK.tag && f[1] <= Math.max(rem, 250));
  if (!PICK.f || PICK.f[2] !== PICK.tag) PICK.f = (pool.length ? pool : FOODS.filter(f => f[2] === PICK.tag))[Math.floor(Math.random() * (pool.length || 1))] || FOODS[0];
  const f = PICK.f, tags = [["b", "มื้อเช้า"], ["m", "มื้อหลัก"], ["s", "ของว่าง"], ["d", "เครื่องดื่ม"], ["f", "ผลไม้"]];
  return {
    title: "วันนี้กินอะไรดี", html: `<div class="row wrap">${tags.map(t => `<button class="btn sm ${PICK.tag === t[0] ? "sel" : ""}" data-act="pktag" data-t="${t[0]}">${t[1]}</button>`).join("")}</div>
<div class="card pop pickcard"><span class="pk-ic fc-${(typeof foodKind === "function" ? foodKind(f[0]) : { cat: "meal" }).cat}">${ic((typeof foodKind === "function" ? foodKind(f[0]) : { icon: "bowl" }).icon, 34)}</span><div class="pk-n">${esc(f[0])}</div><span class="pk-k">ประมาณ ${fmtN(f[1])} kcal</span></div>
<div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="pkre">${ic("dice", 18)}สุ่มใหม่</button><button class="btn primary go" style="flex:1" data-act="logfood" data-t="${esc(f[0])}">${ic("check", 18)}กินอันนี้</button></div>
<p class="xs muted" style="margin-top:10px">เลือกจากเมนูที่ไม่เกินแคลอรี่ที่เหลือวันนี้ ถ้ามีเมนูพอ</p>`
  };
};
ACT.pktag = (a) => { PICK.tag = a.dataset.t; PICK.f = null; rerenderSub(); };
ACT.pkre = () => { const old = PICK.f; const rem = remainingNow(); let pool = FOODS.filter(f => f[2] === PICK.tag && f[1] <= Math.max(rem, 250) && f !== old); if (!pool.length) pool = FOODS.filter(f => f[2] === PICK.tag && f !== old); PICK.f = pool[Math.floor(Math.random() * pool.length)] || old; rerenderSub(); };
let FR = "";
SUBS.fridge = () => {
  const ing = FR.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
  const res = ing.length ? FOODS.map(f => ({ f, n: f[4].filter(x => ing.some(i => x.indexOf(i) > -1 || i.indexOf(x) > -1)).length })).filter(x => x.n > 0).sort((a, b) => b.n - a.n || a.f[1] - b.f[1]).slice(0, 8) : [];
  return {
    title: "ของในตู้เย็น", keepScroll: true, html: `<label class="f" for="frin">มีอะไรอยู่บ้าง (คั่นด้วยจุลภาคหรือเว้นวรรค)</label><div class="row"><input id="frin" type="text" placeholder="ไข่ หมูสับ ผักบุ้ง" value="${esc(FR)}"/><button class="btn primary" data-act="frgo">หาเมนู</button></div><div class="lgex" style="margin-top:8px">${["ไข่", "หมูสับ", "ไก่", "ผัก", "เต้าหู้", "ข้าว"].map((t, i) => `<button type="button" class="lgx" style="--i:${i}" data-act="fradd" data-t="${t}">${ic("plus", 12)}${t}</button>`).join("")}</div>
${ing.length ? (res.length ? res.map(x => { const rc = typeof recipeOf === "function" ? recipeOf(x.f) : null; return `<div class="frc"><button class="item lgrow" style="width:100%;text-align:left" data-act="fropen" data-t="${esc(x.f[0])}"><span class="lgav fc-${(typeof foodKind === "function" ? foodKind(x.f[0]) : { cat: "meal" }).cat}">${ic((typeof foodKind === "function" ? foodKind(x.f[0]) : { icon: "bowl" }).icon, 20)}</span><div class="grow"><b>${esc(x.f[0])}</b><div class="xs muted">ใช้ของที่มี ${x.n} อย่าง · ต้องมี ${esc(x.f[4].join(", "))}</div></div><span>${fmtN(x.f[1])} kcal</span></button></div>`; }).join("") : emptyState("search", "ยังไม่เจอเมนูที่ตรง", "ลองใส่วัตถุดิบเพิ่มอีกนิดนะ")) : emptyState("fridge", "ในตู้เย็นมีอะไรบ้าง", "ใส่วัตถุดิบที่มี แล้วน้องจะแนะนำเมนูที่ทำได้ แตะเมนูเพื่อดูวิธีทำและบันทึก")}`
  };
};
ACT.fradd = a => { const i = $("#frin"); if (!i) return; i.value = (i.value.trim() + " " + a.dataset.t).trim(); ACT.frgo(); };
ACT.frgo = () => { FR = $("#frin").value; rerenderSub(); };
let NT = null;
function stopNight() { if (NT && NT.iv) clearInterval(NT.iv); NT = null; }
SUBS.night = () => {
  const tip = NIGHT_TIPS[new Date().getDate() % NIGHT_TIPS.length];
  if (NT && NT.done) return { title: "ผ่านมาได้แล้ว", html: `<div class="card" style="text-align:center;padding:28px"><div style="font-size:22px;font-weight:600">เก่งมากเลย</div><p class="muted" style="margin:8px 0 16px">ถ้ายังหิวอยู่จริง กินของเบาๆ ได้เลย ไม่ผิดอะไร</p></div><div class="sec">ตัวเลือกเบาๆ</div>${LIGHT_SNACKS.map(s => `<button class="item" style="width:100%;text-align:left" data-act="logfood" data-t="${esc(s[0])}"><div class="grow"><b>${esc(s[0])}</b></div><span>${s[1]} kcal</span></button>`).join("")}<button class="btn block" style="margin-top:12px" data-act="back">ไม่กินแล้ว นอนดีกว่า</button>` };
  const C = 339.3, run = NT && !NT.done;
  return {
    title: "โหมดหิวดึก", html: `<p class="muted" style="margin-bottom:12px">พัก 10 นาทีก่อนนะ ถ้าผ่านไปแล้วยังหิวอยู่ ค่อยกินได้ไม่ผิดอะไร</p>
<div style="text-align:center"><svg width="160" height="160" viewBox="0 0 120 120" role="img" aria-label="ตัวจับเวลา 10 นาที"><circle cx="60" cy="60" r="54" fill="none" stroke="var(--line)" stroke-width="8"/><circle id="ntc" cx="60" cy="60" r="54" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${run ? 0 : C}" transform="rotate(-90 60 60)"/><text id="ntt" x="60" y="68" text-anchor="middle" font-size="22" fill="currentColor">${run ? "" : "10:00"}</text></svg></div>
<div class="hint">${ic("sparkle", 18)}<span>${tip}</span></div>
<button class="btn primary block" style="margin-top:14px" data-act="ntgo">${run ? "ยกเลิก" : "เริ่มพัก 10 นาที"}</button>`,
    after: () => { if (run) tickNight(); }
  };
};
function tickNight() {
  const c = $("#ntc"), t = $("#ntt"); if (!NT || !c) return;
  const left = Math.max(0, NT.end - Date.now()), s = Math.ceil(left / 1000);
  t.textContent = pad(Math.floor(s / 60)) + ":" + pad(s % 60); c.style.strokeDashoffset = (339.3 * (1 - left / 6e5)).toFixed(1);
  if (left <= 0) { clearInterval(NT.iv); NT.done = true; S.nights = (S.nights || 0) + 1; earn(3); save(); confetti(); rerenderSub(); }
}
ACT.ntgo = () => { if (NT) { stopNight(); rerenderSub(); return; } NT = { end: Date.now() + 6e5, done: false }; NT.iv = setInterval(tickNight, 500); rerenderSub(); };
SUBS.cheat = () => {
  const c = S.cheat, today = todayKey();
  return {
    title: "โหมดวันหลุด", html: `<p class="muted" style="margin-bottom:10px">มีงานเลี้ยงหรือบุฟเฟ่ต์ล่วงหน้า? ค่อยๆ เผื่อที่ไว้ด้วยการลดเป้า 150 kcal ใน 2 วันก่อนหน้า ไม่อดและไม่ต่ำกว่าเกณฑ์ขั้นต่ำ</p>
${c && c.event >= today ? `<div class="card"><b>งานวันที่ ${fmtD(c.event)}</b><div class="xs muted" style="margin-top:4px">ลดเป้าวันที่ ${c.days.map(fmtD).join(", ")}</div><button class="btn block" style="margin-top:10px" data-act="chclear">ยกเลิกแผน</button></div>` : `<label class="f" for="chd">งานจัดวันไหน</label><input id="chd" type="date" min="${addDays(today, 1)}" value="${addDays(today, 2)}"/><button class="btn primary block" style="margin-top:12px" data-act="chset">วางแผน</button>`}
<div class="sec">ตอนวันงาน</div><div class="card"><p class="sm">กินให้เต็มที่ได้เลย เลือกโปรตีนก่อน กินช้าๆ และดื่มน้ำ วันถัดไปกลับมากินปกติ ไม่ต้องอดชดเชย</p></div>`
  };
};
ACT.chset = () => {
  const ev = $("#chd").value, today = todayKey(); if (!ev || ev <= today) { toast("เลือกวันในอนาคตนะ"); return; }
  S.cheat = { event: ev, trim: 150, days: [addDays(ev, -2), addDays(ev, -1)].filter(d => d >= today) }; save(); toast("วางแผนแล้ว"); rerenderSub();
};
ACT.chclear = () => { S.cheat = null; save(); rerenderSub(); };
function makePlan() {
  const tgt = targetOn(todayKey()), by = t => FOODS.filter(f => f[2] === t && f[1] <= 450), pk = a => a[Math.floor(Math.random() * a.length)];
  const days = []; for (let i = 0; i < 7; i++) { let tries = 0, d; do { d = { b: pk(by("b"))[0], l: pk(FOODS.filter(f => f[2] === "m" && f[1] <= 550))[0], d: pk(FOODS.filter(f => f[2] === "m" && f[1] <= 550))[0] }; tries++; } while (tries < 12 && ["b", "l", "d"].reduce((s, k) => s + (FOODS.find(f => f[0] === d[k]) || [0, 0])[1], 0) > tgt); days.push(d); }
  S.mealplan = { made: todayKey(), days }; save();
}
let PLD = 0, PLP = { i: 0, k: "b", tag: "b" };
const PLM = [["b", "sun", "เช้า", "b"], ["l", "bowl", "กลางวัน", "m"], ["d", "moon", "เย็น", "m"]], PLT = [["b", "มื้อเช้า"], ["m", "มื้อหลัก"], ["s", "ของว่าง"], ["f", "ผลไม้"], ["d", "เครื่องดื่ม"]];
const plFood = n => FOODS.find(x => x[0] === n) || [n, 0, "", [], []];
const plWd = i => new Date(((S.mealplan && S.mealplan.made) || todayKey()) + "T12:00:00").getTime() + i * 864e5;
function plRand(k, tag) { const cap = k === "b" ? 450 : 550, pool = FOODS.filter(f => f[2] === (tag || (k === "b" ? "b" : "m")) && f[1] <= cap); return (pool[Math.floor(Math.random() * pool.length)] || FOODS[0])[0]; }
SUBS.plan = () => {
  if (!S.mealplan) makePlan(); const P = S.mealplan, cnt = {}; PLD = Math.min(PLD, P.days.length - 1);
  P.days.forEach(d => ["b", "l", "d"].forEach(k => plFood(d[k])[4].forEach(i => { cnt[i] = (cnt[i] || 0) + 1; })));
  const kc = d => ["b", "l", "d"].reduce((s0, x) => s0 + plFood(d[x])[1], 0), d = P.days[PLD], tgt = targetOn(todayKey()), k = kc(d), items = Object.keys(cnt).sort();
  const strip = P.days.map((x, i) => `<button class="pld${i === PLD ? " on" : ""}" data-act="plday" data-i="${i}"><small>${new Date(plWd(i)).toLocaleDateString("th-TH", { weekday: "short" })}</small><b>${new Date(plWd(i)).getDate()}</b></button>`).join("");
  const meals = PLM.map(m => { const f = plFood(d[m[0]]); return `<div class="plm"><button class="plm-b" data-act="plopen" data-k="${m[0]}"><span class="pl-mi">${ic(m[1], 18)}</span><div class="grow"><small>${m[2]}</small><b>${esc(d[m[0]])}</b></div><span class="xs muted">${fmtN(f[1])} kcal</span><span class="plm-ch">›</span></button><button class="plm-r" data-act="plrm" data-k="${m[0]}" aria-label="สุ่มมื้อ${m[2]}ใหม่">${ic("dice", 18)}</button></div>`; }).join("");
  return { title: "แผนมื้อสัปดาห์", keepScroll: true, html: `<div class="plbar"><button class="btn primary go" data-act="plre">${ic("dice", 18)}สุ่มทั้งสัปดาห์</button><button class="btn" data-act="plrd">สุ่มวันนี้</button></div>
<div class="plstrip">${strip}</div>
<div class="card plcard"><div class="row between"><b>วันที่ ${PLD + 1}</b><span class="pl-k${k > tgt ? " over" : ""}">${fmtN(k)} / ${fmtN(tgt)} kcal</span></div><div class="gbar"><i class="${k > tgt ? "" : "ok"}" style="width:${Math.min(100, Math.round(k / Math.max(1, tgt) * 100))}%"></i></div><div class="plms">${meals}</div><p class="xs muted" style="margin-top:8px">แตะมื้อเพื่อเลือกเอง · กดลูกเต๋าเพื่อสุ่มเฉพาะมื้อนั้น</p></div>
<details class="card plshop"><summary>${ic("bag", 16)}รายการซื้อของ ${items.length} อย่าง</summary><div class="row wrap" style="margin-top:10px">${items.map(i => `<span class="chip shop">${ic("check", 12)}${esc(i)}${cnt[i] > 1 ? " ×" + cnt[i] : ""}</span>`).join("")}</div></details>` };
};
ACT.plre = () => { makePlan(); rerenderSub(); };
ACT.plday = a => { PLD = +a.dataset.i; rerenderSub(); };
ACT.plrd = () => { const d = S.mealplan.days[PLD]; PLM.forEach(m => { d[m[0]] = plRand(m[0]); }); save(); rerenderSub(); };
ACT.plrm = a => { S.mealplan.days[PLD][a.dataset.k] = plRand(a.dataset.k); save(); rerenderSub(); };
ACT.plopen = a => { PLP = { i: PLD, k: a.dataset.k, tag: a.dataset.k === "b" ? "b" : "m" }; openSub("plpick", {}); };
ACT.pltag = a => { PLP.tag = a.dataset.t; rerenderSub(); };
ACT.plset = a => { S.mealplan.days[PLP.i][PLP.k] = a.dataset.n; save(); closeSub(); toast("เปลี่ยนเมนูแล้ว"); };
ACT.plpr = () => { S.mealplan.days[PLP.i][PLP.k] = plRand(PLP.k, PLP.tag); save(); closeSub(); toast("สุ่มให้แล้ว"); };
SUBS.plpick = () => {
  const m = PLM.find(x => x[0] === PLP.k), cur = S.mealplan.days[PLP.i][PLP.k], list = FOODS.filter(f => f[2] === PLP.tag).sort((a, b) => a[1] - b[1]);
  return { title: "เลือก" + m[2], keepScroll: true, html: `<div class="plpt">${PLT.map(t => `<button class="pill${PLP.tag === t[0] ? " on" : ""}" data-act="pltag" data-t="${t[0]}">${t[1]}</button>`).join("")}</div><input id="plq" type="text" placeholder="ค้นหาเมนู" autocomplete="off"/><button class="btn block" style="margin:4px 0 8px" data-act="plpr">${ic("dice", 16)}สุ่มจากหมวดนี้</button><div class="plpl">${list.map(f => `<button class="plpi${f[0] === cur ? " cur" : ""}" data-n="${esc(f[0])}" data-act="plset"><span class="grow">${esc(f[0])}</span><span class="xs muted">${fmtN(f[1])} kcal</span>${f[0] === cur ? ic("check", 14) : ""}</button>`).join("")}</div>` };
};
document.addEventListener("input", e => { if (e.target && e.target.id === "plq") { const q = e.target.value.trim(); document.querySelectorAll(".plpi").forEach(b => { b.hidden = !!q && b.dataset.n.indexOf(q) < 0; }); } });
SUBS.letter = () => {
  const today = todayKey(), days = []; for (let i = 6; i >= 0; i--) days.push(addDays(today, -i));
  const inf = days.map(dayInfo), lg = inf.filter(i => i.logged), avg = lg.length ? lg.reduce((s, i) => s + i.eaten, 0) / lg.length : 0;
  const wc = inf.reduce((s, i) => s + i.works.length, 0), sets = inf.reduce((s, i) => s + i.works.reduce((a, m) => a + (m.sets || 0), 0), 0), wat = days.filter(k => (S.water[k] || 0) >= 8).length;
  const a = trendAt(today), b = trendAt(addDays(today, -7)), ch = a && b && a.d !== b.d ? b.w - a.w : null;
  let body = `ถึง ${esc(S.prof && "เธอ" ? "คนที่ฉันรักที่สุด" : "")}\n`;
  body = "";
  body += lg.length ? `สัปดาห์นี้เราบันทึกอาหารไป ${lg.length} วัน เฉลี่ยวันละ ${fmtN(avg)} kcal\n` : "สัปดาห์นี้ยังไม่ได้บันทึกอาหารเลย ไม่เป็นไรนะ เริ่มใหม่วันนี้ก็ได้\n";
  body += wc ? `ออกกำลังกาย ${wc} ครั้ง รวม ${sets} เซ็ต ขอบคุณที่พาฉันขยับตัวนะ\n` : "สัปดาห์นี้ยังไม่ได้ขยับตัว เดินเล่นสั้นๆ ก็นับนะ\n";
  body += wat ? `ดื่มน้ำครบ ${wat} วัน เก่งมาก\n` : "";
  body += moodWeekNote();
  if (ch !== null) body += ch > 0.05 ? `น้ำหนักเฉลี่ยลดลง ${f1(ch)} กก. เมื่อเทียบกับสัปดาห์ก่อน\n` : ch < -0.05 ? `น้ำหนักเฉลี่ยขึ้น ${f1(-ch)} กก. ซึ่งเป็นเรื่องปกติ ตัวเลขแกว่งได้เสมอ\n` : "น้ำหนักเฉลี่ยทรงตัวจากสัปดาห์ก่อน\n";
  return { title: "จดหมายสัปดาห์นี้", html: `<div class="letter"><p style="white-space:pre-line">${esc(body)}</p><p style="text-align:right;margin-top:14px">รักนะ<br>${esc(S.name || "น้องก้อน")}</p></div><button class="btn primary block" style="margin-top:14px" data-act="wkshare">${ic("send", 18)}แชร์การ์ดสรุปสัปดาห์</button>` };
};

/* ---------- คลังท่า ---------- */
function animSvg(k) {
  const A = (a, v, d) => `<animate attributeName="${a}" values="${v}" dur="${d || "2s"}" repeatCount="indefinite"/>`, ln = (at, an) => `<line ${at} stroke="currentColor" stroke-width="5" stroke-linecap="round">${an}</line>`;
  let b = "";
  if (k === "squat") b = `<circle cx="60" r="9" fill="currentColor"><animate attributeName="cy" values="22;44;22" dur="2s" repeatCount="indefinite"/></circle>` + ln('x1="60" x2="60"', A("y1", "34;56;34") + A("y2", "62;82;62") + A("x2", "60;48;60")) + `<polyline fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${A("points", "60,62 60,80 60,98;48,82 70,86 60,98;60,62 60,80 60,98")}</polyline>` + ln('x1="60" x2="82" y2="50"', A("y1", "40;58;40") + A("y2", "42;56;42"));
  else if (k === "pushup") b = `<circle cx="20" r="8" fill="currentColor"><animate attributeName="cy" values="54;72;54" dur="1.6s" repeatCount="indefinite"/></circle>` + ln('x2="104" y2="92"', A("x1", "30;30;30") + A("y1", "62;80;62", "1.6s")) + ln('x1="30" x2="30" y2="96"', A("y1", "62;80;62", "1.6s")) + `<line x1="10" x2="110" y1="98" y2="98" stroke="var(--line)" stroke-width="3"/>`;
  else if (k === "jack") b = `<circle cx="60" cy="22" r="9" fill="currentColor"><animate attributeName="cy" values="22;16;22" dur="1s" repeatCount="indefinite"/></circle>` + ln('x1="60" y1="34" x2="60" y2="66"', "") + ln('x1="60" y1="40"', A("x2", "40;22;40", "1s") + A("y2", "72;20;72", "1s")) + ln('x1="60" y1="40"', A("x2", "80;98;80", "1s") + A("y2", "72;20;72", "1s")) + ln('x1="60" y1="66" y2="98"', A("x2", "52;36;52", "1s")) + ln('x1="60" y1="66" y2="98"', A("x2", "68;84;68", "1s"));
  else if (k === "plank") b = `<circle cx="20" cy="62" r="8" fill="currentColor"><animate attributeName="cy" values="62;60;62" dur="3s" repeatCount="indefinite"/></circle>` + ln('x1="30" y1="68" x2="102" y2="86"', "") + ln('x1="30" y1="68" x2="30" y2="92"', "") + `<line x1="10" x2="110" y1="98" y2="98" stroke="var(--line)" stroke-width="3"/>`;
  return b ? `<svg viewBox="0 0 120 110" width="140" height="120" style="color:var(--accent)" aria-hidden="true">${b}</svg>` : "";
}
SUBS.lib = (arg) => {
  if (arg.id && arg.id !== "work") { const e = LIB.find(x => x.id === arg.id); if (e) return libDetail(e); }
  return { title: "คลังท่าออกกำลัง", html: LIB.map(e => `<button class="item" style="width:100%;text-align:left" data-act="sub" data-n="lib" data-arg="${e.id}"><div class="grow"><b>${e.n}</b><div class="xs muted">${e.sets ? e.sets + " เซ็ต × " : ""}${e.reps ? e.reps + " ครั้ง" : e.secs ? e.secs + " วินาที" : e.mins ? e.mins + " นาที" : ""}</div></div>${ic("play", 18)}</button>`).join("") };
};
function libDetail(e) {
  const rec = e.reps ? `${e.n} ${e.sets || 3} เซ็ต ${e.reps} ครั้ง` : e.secs ? `${e.n} ${e.sets || 3} เซ็ต ${e.secs} วินาที` : `${e.n} ${e.mins || 10} นาที`;
  return { title: e.n, html: `<div class="card" style="text-align:center">${animSvg(e.anim)}</div><div class="sec">วิธีทำ</div><p>${esc(e.how)}</p><div class="hint">${ic("sparkle", 18)}<span>${esc(e.tip)}</span></div>
<div class="sec">จับเวลาพักระหว่างเซ็ต</div><div class="row"><button class="btn" data-act="rest" data-s="30">30 วินาที</button><button class="btn" data-act="rest" data-s="60">60 วินาที</button><b id="restt" style="margin-left:8px"></b></div>
<button class="btn primary block" style="margin-top:14px" data-act="logwork" data-t="${esc(rec)}">ทำเสร็จแล้ว บันทึก</button>` };
}
let RV = null;
ACT.rest = (a) => { clearInterval(RV); let s = +a.dataset.s; const t = $("#restt"); const f = () => { if (!$("#restt")) { clearInterval(RV); return; } $("#restt").textContent = s > 0 ? "เหลือ " + s + " วินาที" : "พร้อมแล้ว"; if (s-- <= 0) clearInterval(RV); }; f(); RV = setInterval(f, 1000); };
ACT.logwork = (a) => logText("work", a.dataset.t);

/* ---------- ตั้งค่า ---------- */
SUBS.settings = () => {
  const p = S.prof;
  return {
    title: "ตั้งค่าและข้อมูล", html: `<div class="hint" hidden>${ic("cloud", 18)}<span id="syncb"></span></div>
<div class="sec" style="margin-top:0">ธีมแอป</div><div class="palrow">${PALS.map(p => `<button class="palbtn ${(S.pal || "peach") === p[0] ? "on" : ""}" style="background:${p[2]}" data-act="setpal" data-p="${p[0]}" aria-label="ธีม${p[1]}"></button>`).join("")}</div>
<div class="seg" style="margin-top:12px">${[["auto", "ตามเครื่อง"], ["light", "สว่าง"], ["dark", "มืด"]].map(m => `<button class="${(S.mode || "light") === m[0] ? "on" : ""}" data-act="setmode" data-m="${m[0]}">${m[1]}</button>`).join("")}</div>
<div class="sec">ข้อมูลส่วนตัว</div><div class="grid2"><div><label class="f" for="sh">ส่วนสูง (ซม.)</label><input id="sh" type="number" inputmode="decimal" value="${p.h}"/></div><div><label class="f" for="sa">อายุ</label><input id="sa" type="number" inputmode="numeric" value="${p.age}"/></div></div>
<label class="f" for="ssx">สูตรคำนวณใช้ค่าของ</label><select id="ssx"><option value="f" ${p.sex === "f" ? "selected" : ""}>หญิง</option><option value="m" ${p.sex === "m" ? "selected" : ""}>ชาย</option></select>
<label class="f" for="sac">กิจวัตร</label><select id="sac"><option value="1.2" ${p.act === 1.2 ? "selected" : ""}>นั่งเป็นหลัก</option><option value="1.3" ${p.act === 1.3 ? "selected" : ""}>เดินไปมาบ้าง</option><option value="1.4" ${p.act === 1.4 ? "selected" : ""}>ยืนหรือเดินเยอะ</option></select>
<label class="f" for="sdf">ความเร็วในการลด</label><select id="sdf"><option value="300" ${p.def === 300 ? "selected" : ""}>เบา 300 kcal ต่อวัน</option><option value="500" ${p.def === 500 ? "selected" : ""}>ปกติ 500 kcal ต่อวัน</option><option value="700" ${p.def === 700 ? "selected" : ""}>จริงจัง 700 kcal ต่อวัน</option></select>
<button class="btn primary block" style="margin-top:12px" data-act="ssave">บันทึกการตั้งค่า</button>
<div class="sec">สำรองข้อมูล</div><p class="xs muted" style="margin-bottom:8px">${S.lastBackup ? "สำรองไฟล์ล่าสุด " + new Date(S.lastBackup).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "ยังไม่เคยสำรองเป็นไฟล์ ข้อมูลเก็บอยู่ในเบราว์เซอร์นี้เท่านั้น ถ้าล้างข้อมูลเบราว์เซอร์หรือเปลี่ยนเครื่องจะหาย"}</p>
<div class="row"><button class="btn primary" style="flex:1" data-act="bkdl">ดาวน์โหลดไฟล์สำรอง</button><button class="btn" style="flex:1" data-act="bkfile">นำเข้าจากไฟล์</button></div>
<div class="sec">หรือคัดลอกเป็นข้อความ</div><textarea id="bk" rows="3" aria-label="ข้อมูลสำรอง" placeholder="กดคัดลอก หรือวางข้อมูลที่เคยสำรองไว้ที่นี่"></textarea>
<div class="row" style="margin-top:8px"><button class="btn" style="flex:1" data-act="bkout">คัดลอกข้อมูล</button><button class="btn" style="flex:1" data-act="bkin">นำเข้า</button></div>
${remHTML()}
<div class="sec">ติดตั้งเป็นแอป</div><button class="btn block" data-act="pwa">${isAndroidWeb() ? "ดาวน์โหลดแอป Maalot (.apk)" : "เพิ่ม Maalot ลงหน้าจอหลัก"}</button>
<div class="sec">อื่นๆ</div><button class="btn danger block" data-act="resetask">เริ่มใหม่ทั้งหมด</button>
<p class="xs muted" style="margin-top:12px">ใช้เป็นข้อมูลทั่วไป ไม่ใช่คำแนะนำทางการแพทย์ ถ้ามีโรคประจำตัว ตั้งครรภ์ หรือกังวลเรื่องการกิน ควรปรึกษาแพทย์</p>`, after: badge
  };
};
ACT.ssave = () => {
  const h = parseFloat($("#sh").value), a = parseInt($("#sa").value, 10);
  if (!(h >= 120 && h <= 220) || !(a >= 18 && a <= 90)) { toast("ตรวจส่วนสูงและอายุอีกครั้งนะ"); return; }
  S.prof = Object.assign(S.prof, { h, age: a, sex: $("#ssx").value, act: parseFloat($("#sac").value), def: parseInt($("#sdf").value, 10) }); save(); toast("บันทึกแล้ว");
};
ACT.bkout = () => { const t = $("#bk"); t.value = JSON.stringify(S); t.select(); try { navigator.clipboard.writeText(t.value).then(() => toast("คัดลอกแล้ว"), () => toast("เลือกข้อความแล้ว กดคัดลอกเองได้เลย")); } catch (e) { toast("เลือกข้อความแล้ว กดคัดลอกเองได้เลย"); } };
ACT.bkdl = () => {
  S.lastBackup = Date.now(); save();
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: "application/json" }));
  a.download = "maalot-backup-" + dk(new Date()) + ".json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast("ดาวน์โหลดไฟล์สำรองแล้ว"); rerenderSub();
};
ACT.bkfile = () => $("#bkFile").click();
document.addEventListener("change", e => {
  if (!e.target || e.target.id !== "bkFile") return; const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  f.text().then(t => {
    const d = JSON.parse(t); if (!d || !d.v) throw 0;
    if (!confirm("นำเข้าไฟล์นี้จะแทนที่ข้อมูลปัจจุบันทั้งหมด ดำเนินการต่อไหม")) return;
    S = merge(d); save(); toast("นำเข้าแล้ว"); closeAllSubs();
  }).catch(() => toast("ไฟล์ไม่ถูกต้อง"));
});
ACT.wkshare = () => { SHARE.kind = "week"; openSub("share", {}); };
ACT.bkin = () => { try { const d = JSON.parse($("#bk").value); if (!d || !d.v) throw 0; S = merge(d); save(); toast("นำเข้าแล้ว"); closeAllSubs(); } catch (e) { toast("ข้อมูลไม่ถูกต้อง"); } };
ACT.resetask = () => openModal(`<h2>เริ่มใหม่ทั้งหมด?</h2><p class="muted" style="margin:8px 0 14px">ข้อมูลทั้งหมดจะถูกลบและกู้คืนไม่ได้</p><div class="row"><button class="btn" style="flex:1" data-act="modalclose">ยกเลิก</button><button class="btn danger" style="flex:1" data-act="resetgo">ลบทั้งหมด</button></div>`);
ACT.modalclose = closeModal;
ACT.resetgo = () => { closeModal(); S = blank(); save(); closeAllSubsSilent(); ONB = { step: 1, look: Object.assign({}, S.look), name: "", prof: Object.assign({}, S.prof) }; startOnb(); };

/* ---------- ธีมและอนิเมชันเพิ่ม ---------- */
const PALS = [["peach", "ฝัน", "#6B3FC0"], ["mint", "มิ้นต์", "#4FA574"], ["sky", "ฟ้า", "#4D93D1"], ["sakura", "ซากุระ", "#E8628A"], ["lavender", "ลาเวนเดอร์", "#8D78D8"]];
function applyTheme() {
  const m = S.mode || "light", dark = m === "dark" || (m === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches), r = document.documentElement;
  r.dataset.theme = dark ? "dark" : "light"; r.dataset.pal = S.pal || "peach";
}
ACT.setpal = (a) => { S.pal = a.dataset.p; applyTheme(); save(); rerenderSub(); };
ACT.setmode = (a) => { S.mode = a.dataset.m; applyTheme(); save(); rerenderSub(); };
function particles(per) {
  const cls = per === "night" ? "fly" : per === "evening" ? "petal" : per === "morning" ? "dust" : "petal";
  let h = ""; for (let i = 0; i < 9; i++) h += `<i style="left:${(i * 11 + 5) % 100}%;animation-delay:${(i * 1.1).toFixed(1)}s;animation-duration:${7 + i % 4}s"></i>`;
  return `<div class="ptl ${cls}" aria-hidden="true">${h}</div>`;
}
ACT.poke = (a, e) => {
  const st = $("#stage"); if (!st || st.classList.contains("poke")) return;
  st.classList.add("poke"); const r = st.getBoundingClientRect();
  for (let i = 0; i < 4; i++) { const h = document.createElement("span"); h.className = "heartpop"; h.textContent = "♥"; h.style.left = (r.width * (0.4 + Math.random() * 0.2)) + "px"; h.style.top = (r.height * 0.4) + "px"; h.style.animationDelay = i * 0.12 + "s"; st.appendChild(h); setTimeout(() => h.remove(), 1600); }
  const lines = ["ฮิฮิ จั๊กจี้", "ขอบคุณที่ดูแลนะ", "วันนี้เป็นไงบ้าง", "อยู่ตรงนี้นะ"]; const tx = st.querySelectorAll("text"); if (tx.length >= 2) { tx[tx.length - 2].textContent = lines[Math.floor(Math.random() * lines.length)]; }
  setTimeout(() => st.classList.remove("poke"), 1200);
};

/* ---------- เชื่อมเหตุการณ์ ---------- */
document.addEventListener("click", (e) => {
  const sh = $("#sheet"), md = $("#modal");
  if (e.target === sh) { closeSheet(); return; } if (e.target === md) { closeModal(); return; }
  const a = e.target.closest("[data-act]"); if (!a || a.disabled) return;
  if (a.classList.contains("primary") || a.classList.contains("fab") || a.classList.contains("glass") || a.dataset.act === "water1") haptic(10);
  const f = ACT[a.dataset.act]; if (f) f(a, e);
});
document.addEventListener("change", (e) => {
  const t = e.target, k = t.dataset && t.dataset.in; if (!k || !LG) return;
  const i = +t.dataset.i, it = LG.items[i];
  if (k === "lgwhen") LG.when = t.value;
  else if (k === "lgn" && it) it.n = t.value;
  else if (k === "lgk" && it) { it.k1 = Math.max(0, parseFloat(t.value) || 0); rerenderSub(); }
  else if (k === "lgm" && it) { it.km = Math.max(0, parseFloat(t.value) || 0); rerenderSub(); }
  else if (k === "lgw" && it) { it[t.dataset.f] = Math.max(0, parseFloat(t.value) || 0); rerenderSub(); }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "hubq") { hubQ = t.value; renderHub(); }
  else if (t.dataset && t.dataset.in === "lgtext" && LG) LG.text = t.value;
  else if (t.dataset && t.dataset.in === "lgsearch" && LG) lgSearch(t.value);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "homeIn") ACT.homesend();
  if (e.key === "Escape") { if (!$("#modal").hidden) closeModal(); else if (!$("#sheet").hidden) closeSheet(); }
});
["#photoIn", "#photoCam"].forEach(s => $(s).addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; if (f) handlePhoto(f); }));

function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) { } }
ACT.daynight = () => {
  const dark = document.documentElement.dataset.theme === "dark"; S.mode = dark ? "light" : "dark"; applyTheme(); save(); haptic(12);
  const st = $("#stage"); if (!st) { renderHome(); return; }
  st.classList.add("todfade");
  setTimeout(() => { renderHome(); const s2 = $("#stage"); if (s2) { s2.classList.add("todin"); setTimeout(() => s2.classList.remove("todin"), 650); } }, 280);
};
function greetStage(cls, ms) { const st = $("#stage"); if (!st) return; st.classList.add(cls); setTimeout(() => st.classList.remove(cls), ms); }
function startIdleDirector() {
  setInterval(() => {
    if (view !== "home" || subStack.length || fx || document.visibilityState !== "visible" || !$("#stage") || !$("#sheet").hidden) return;
    const st = $("#stage"); if (st.classList.contains("wave") || st.classList.contains("cheer") || st.classList.contains("poke")) return;
    if (Math.random() < 0.6) greetStage("wave", 3200); else greetStage("hop", 1500);
  }, 14000);
}
function endSplash(minMs, t0) {
  const sp = $("#splash"); if (!sp) return; let done = false;
  const go = () => { if (done) return; done = true; sp.classList.add("out"); setTimeout(() => { sp.remove(); if (view === "home" && S.onboarded) greetStage("wave", 3200); }, 520); };
  sp.addEventListener("click", go); setTimeout(go, Math.max(0, minMs - (performance.now() - t0)));
}
/* ทางลัดจากการกดไอคอนแอปค้าง (Android): ?a=food|work|water|weight|mood */
function shortcutGo() {
  let a = ""; try { a = new URLSearchParams(location.search).get("a") || ""; } catch (e) { }
  if (!a) return; try { history.replaceState(null, "", location.pathname); } catch (e) { }
  setTimeout(() => {
    if (a === "food" || a === "work") logText(a, "");
    else if (a === "water") ACT.water1();
    else if (a === "weight") openSub("weight", {});
    else if (a === "mood") openSub("mood", {});
  }, 400);
}
(async function init() {
  const t0 = performance.now(); let first = true; try { first = !sessionStorage.getItem("maalot_splash"); sessionStorage.setItem("maalot_splash", "1"); } catch (e) { }
  await loadStore(); applyTheme(); if (S && S.dumpToast && S.onboarded) { delete S.dumpToast; save(); setTimeout(() => toast("น้องก้อนกลายเป็นน้องเกี๊ยวแล้ว ผมเดิมเลือกกลับได้ในห้องแต่งตัว"), 1500); } if (typeof startSync === "function") startSync();
  endSplash(first ? 1900 : 500, t0);
  if (!S.onboarded) { ONB = { step: 1, look: Object.assign({}, S.look), name: "", prof: Object.assign({}, S.prof) }; renderLanding(); }
  else { $("#onb").hidden = true; $("#app").hidden = false; $(".nav").hidden = false; touchStreak(); save(); show("home"); startReminders(); shortcutGo(); }
  startIdleDirector();
  setInterval(() => { if (view === "home" && !subStack.length && !fx && document.activeElement && document.activeElement.id !== "homeIn") renderHome(); }, 300000);
})();
