/* โหมด IF (วินัย) และออกกำลังด้วยกัน */
const IFFW = { 8: "งด 16 ชม. กิน 8 ชม. (16:8)", 10: "งด 14 ชม. กิน 10 ชม. (14:10)", 12: "งด 12 ชม. กิน 12 ชม. (12:12)" };
const hm = m => pad(Math.floor(m / 60) % 24) + ":" + pad(m % 60);
const dur = m => (m >= 60 ? Math.floor(m / 60) + " ชม. " : "") + (m % 60) + " นาที";
function iffState() {
  const f = S.iff; if (!f || !f.on) return null;
  const d = new Date(), m = d.getHours() * 60 + d.getMinutes(), s = f.start, e = f.start + f.eat * 60, eating = m >= s && m < e;
  const left = eating ? e - m : (m < s ? s - m : 1440 - m + s);
  return { eating, left, s, e, f };
}
function iffDay(k) {
  const st = iffState(), today = todayKey(); if (k > today) return "wait";
  if (k === today) { const d = new Date(), m = d.getHours() * 60 + d.getMinutes(); if (m < st.e) return "wait"; }
  const ms = S.meals.filter(x => x.d === k); if (!ms.length) return "bad";
  return ms.some(x => x.out) ? "bad" : "ok";
}
function iffBanner() {
  const st = iffState(); if (!st) return "";
  return `<button class="card status" data-act="sub" data-n="iff" style="margin-bottom:10px"><div style="flex:1;min-width:0"><div class="big">${st.eating ? "ช่วงกินเปิดอยู่" : "กำลังงดกิน (ดื่มน้ำได้)"}</div><div class="muted sm">${st.eating ? "ปิดในอีก " + dur(st.left) + " (" + hm(st.e) + ")" : "เปิดอีก " + dur(st.left) + " (" + hm(st.s) + ")"} · IF ${24 - st.f.eat}:${st.f.eat}</div></div>${ic("timer", 22)}</button>`;
}
const _rh = renderHome;
renderHome = function () { _rh(); const s = $("#v-home .status"); if (s) s.insertAdjacentHTML("beforebegin", iffBanner()); };
const _rhub = renderHub;
renderHub = function () { _rhub(); const st = iffState(); if (st && !st.eating) $$('#v-hub .tile[data-n="pick"] b, #v-hub .tile[data-n="fridge"] b').forEach(b => b.insertAdjacentHTML("beforeend", " " + ic("lock", 14))); };
TILES.splice(TILES.length - 1, 0, ["วินัย", "timer", "โหมด IF", "ตั้งวินัยช่วงเวลากิน", "iff", "", "d-warn", "IF วินัย อด งด ช่วงเวลา ล็อก"], ["วินัย", "play", "ออกกำลังด้วยกัน", "ตัวละครทำให้ดู", "lib", "", "d-warn", "ออกกำลัง ท่า ทำตาม"]);

let IFF_NEXT = null;
function iffGate(next) {
  const st = iffState(); IFF_NEXT = next;
  openModal(`<h2>ตอนนี้อยู่ช่วงงดกิน</h2><p class="muted" style="margin:8px 0">ช่วงกินจะเปิดอีก ${dur(st.left)} (${hm(st.s)}) ดื่มน้ำได้ตลอด ถ้าหิวมากลองโหมดหิวดึกก่อน ถ้าไม่สบายหรือกินไปแล้วจริงๆ บันทึกตามจริงได้ แต่วันนี้จะนับว่าหลุดวินัย</p><div class="row wrap"><button class="btn primary" style="flex:1" data-act="modalclose">รอก่อน</button><button class="btn" data-act="iffgo">กินไปแล้ว บันทึกตามจริง</button></div>`);
}
ACT.iffgo = () => { closeModal(); const n = IFF_NEXT; IFF_NEXT = null; if (n) n(); };
function iffLockModal(n) {
  const st = iffState();
  openModal(`<h2>${ic("lock", 20)} โหมดนี้ล็อกอยู่</h2><p class="muted" style="margin:8px 0 14px">${n === "pick" ? "สุ่มเมนู" : "ของในตู้เย็น"} เปิดอีก ${dur(st.left)} (${hm(st.s)}) ตามวินัย IF ที่ตั้งไว้ ตอนนี้ลองดื่มน้ำหรือใช้โหมดหิวดึกแทนนะ</p><div class="row"><button class="btn" style="flex:1" data-act="modalclose">ปิด</button><button class="btn primary" style="flex:1" data-act="iffnight">โหมดหิวดึก</button></div>`);
}
ACT.iffnight = () => { closeModal(); openSub("night", {}); };
const _sub = ACT.sub;
ACT.sub = (a) => {
  const n = a.dataset.n, st = iffState();
  if (st && !st.eating) {
    if (n === "pick" || n === "fridge") { closeSheet(); iffLockModal(n); return; }
    if (n === "log" && (a.dataset.arg || "food") === "food") { closeSheet(); iffGate(() => _sub(a)); return; }
  }
  _sub(a);
};
const _lt = logText;
logText = function (tab, text) { const st = iffState(); if (tab === "food" && st && !st.eating) iffGate(() => _lt(tab, text)); else _lt(tab, text); };
const _hs = ACT.homesend;
ACT.homesend = () => { const st = iffState(), v = (($("#homeIn") || {}).value || "").trim(); if (st && !st.eating && v && autoTab(v) === "food") iffGate(_hs); else _hs(); };
const _cam = ACT.camera;
ACT.camera = () => { const st = iffState(); if (st && !st.eating) iffGate(_cam); else _cam(); };
const _lgs = ACT.lgsave;
ACT.lgsave = () => {
  const st = iffState(), n0 = S.meals.length, f = LG && LG.tab === "food" && LG.when === "today";
  _lgs();
  if (st && !st.eating && f && S.meals.length > n0) { for (let i = n0; i < S.meals.length; i++) S.meals[i].out = true; save(); toast("บันทึกแล้ว แต่วันนี้นับว่าหลุดวินัย IF"); }
};

SUBS.iff = () => {
  const f = S.iff, st = iffState();
  if (!st) {
    const under = bmiOf(estW()) < 18.5;
    return {
      title: "โหมด IF", html: `<p class="muted" style="margin-bottom:10px">ตั้งวินัยช่วงเวลากินให้ชัด กินเฉพาะในช่วงที่เลือก นอกช่วงนั้นโหมดกินบางอย่างจะล็อก และการบันทึกอาหารต้องยืนยันก่อน</p>
<div class="hint">${ic("heart", 18)}<span>ไม่เหมาะกับคนที่มีเบาหวาน โรคประจำตัว ตั้งครรภ์ ให้นมบุตร หรือเคยมีปัญหาเรื่องการกิน ถ้าไม่แน่ใจ ปรึกษาแพทย์ก่อน แอปนี้ไม่ใช่คำแนะนำทางการแพทย์</span></div>
${under ? '<div class="hint">' + ic("lock", 18) + "<span>น้ำหนักตอนนี้อยู่ในเกณฑ์ต่ำ โหมดนี้จึงปิดไว้เพื่อความปลอดภัย</span></div>" : `<label class="f" for="ifw">รูปแบบ</label><select id="ifw"><option value="12">${IFFW[12]}</option><option value="10">${IFFW[10]}</option><option value="8" selected>${IFFW[8]}</option></select>
<label class="f" for="ifs">เริ่มกินมื้อแรกเวลา</label><select id="ifs">${[8, 9, 10, 11, 12].map(h => `<option value="${h}" ${h === 11 ? "selected" : ""}>${pad(h)}:00</option>`).join("")}</select>
<label class="f" for="ifl">ตั้งใจทำกี่วัน</label><select id="ifl"><option value="3">3 วัน</option><option value="7" selected>7 วัน</option><option value="14">14 วัน</option></select>
<label class="row" style="margin-top:14px;gap:10px;align-items:flex-start"><input id="ifok" type="checkbox" style="width:22px;height:22px;margin-top:2px"/><span class="sm">เข้าใจว่าถ้าเวียนหัว ใจสั่น มือสั่น หรือไม่ไหว ต้องหยุดและกินทันที ออกจากโหมดได้ทุกเมื่อ</span></label>
<button class="btn primary block" style="margin-top:14px" data-act="iffstart">เริ่มวินัย</button>`}
<div class="sec">สิ่งที่จะเกิดเมื่อเปิดโหมด</div><div class="card sm">ล็อก: สุ่มเมนู และของในตู้เย็น<br>ต้องยืนยัน: บันทึกอาหารนอกช่วงกิน<br>ใช้ได้ตลอด: น้ำ โหมดหิวดึก ออกกำลังกาย ชั่งน้ำหนัก</div>`
    };
  }
  const dots = []; for (let i = 0; i < f.len; i++) { const k = addDays(f.from, i), r = iffDay(k); dots.push(`<span class="iffdot ${r === "ok" ? "ok" : r === "bad" ? "bad" : ""} ${k === todayKey() ? "now" : ""}" title="${fmtD(k)}">${r === "ok" ? ic("check", 14) : r === "bad" ? ic("x", 14) : i + 1}</span>`); }
  const passes = Array.from({ length: f.len }, (_, i) => iffDay(addDays(f.from, i))).filter(r => r === "ok").length;
  return {
    title: "โหมด IF", html: `<div class="card" style="text-align:center"><div class="muted sm">${IFFW[f.eat]}</div><div class="big-num">${st.eating ? "กินได้" : "งดกิน"}</div><div class="sm">${st.eating ? "ปิดช่วงกินอีก " + dur(st.left) + " (" + hm(st.e) + ")" : "เปิดช่วงกินอีก " + dur(st.left) + " (" + hm(st.s) + ")"}</div><div class="muted xs" style="margin-top:6px">ช่วงกิน ${hm(st.s)} ถึง ${hm(st.e)}</div></div>
<div class="sec">ความคืบหน้า ผ่านแล้ว ${passes}/${f.len} วัน</div><div class="iffbar">${dots.join("")}</div>
<p class="xs muted" style="margin-top:8px">วันที่ผ่านคือวันที่บันทึกอาหารและไม่มีมื้อนอกช่วงกิน</p>
${passes >= f.len && !f.claimed ? `<button class="btn primary block" style="margin-top:14px" data-act="iffclaim">รับรางวัลครบวินัย 40 เหรียญ</button>` : ""}
<div class="sec">สถานะการล็อก</div><div class="card sm">${st.eating ? "ตอนนี้ทุกโหมดเปิดอยู่" : ic("lock", 14) + " สุ่มเมนู และ ของในตู้เย็น ล็อกถึง " + hm(st.s)}</div>
<div class="sec">ออกจากโหมด</div><div class="row"><button class="btn" style="flex:1" data-act="iffsick">ไม่สบาย ออกเลย</button><button class="btn danger" style="flex:1" data-act="iffexit">เลิกวินัย</button></div>`
  };
};
ACT.iffstart = () => {
  if (!$("#ifok").checked) { toast("ติ๊กยืนยันก่อนนะ"); return; }
  if (bmiOf(estW()) < 18.5) { toast("โหมดนี้ปิดไว้เพื่อความปลอดภัย"); return; }
  S.iff = { on: true, eat: +$("#ifw").value, start: +$("#ifs").value * 60, len: +$("#ifl").value, from: todayKey(), claimed: false }; save(); confetti(); toast("เริ่มวินัยแล้ว สู้ๆ"); rerenderSub();
};
ACT.iffclaim = () => { S.iff.claimed = true; S.coins += 40; save(); confetti(); popCoins(40); rerenderSub(); };
function iffEnd(msg) { S.iffHist = (S.iffHist || []).concat([{ from: S.iff.from, to: todayKey(), len: S.iff.len }]); S.iff = null; save(); closeModal(); toast(msg); rerenderSub(); }
ACT.iffsick = () => iffEnd("ออกจากโหมดแล้ว พักผ่อนและกินให้สบายนะ");
let EXV = null;
ACT.iffexit = () => {
  let n = 10; openModal(`<h2>เลิกวินัยจริงๆ ไหม</h2><p class="muted" style="margin:8px 0 14px">รอสักครู่เพื่อคิดอีกที ความคืบหน้าจะไม่ถูกนับเป็นรางวัล</p><div class="row"><button class="btn primary" style="flex:1" data-act="modalclose">สู้ต่อ</button><button class="btn danger" id="exb" style="flex:1" disabled data-act="iffsure">เลิก (${n})</button></div>`);
  clearInterval(EXV); EXV = setInterval(() => { const b = $("#exb"); if (!b) { clearInterval(EXV); return; } n--; if (n <= 0) { b.disabled = false; b.textContent = "เลิก"; clearInterval(EXV); } else b.textContent = "เลิก (" + n + ")"; }, 1000);
};
ACT.iffsure = () => { clearInterval(EXV); iffEnd("เลิกวินัยแล้ว เริ่มใหม่ได้ทุกเมื่อ"); };
setInterval(() => { if (iffState() && view === "home" && !subStack.length && $("#modal").hidden && $("#sheet").hidden && document.activeElement && document.activeElement.id !== "homeIn") renderHome(); }, 60000);

/* ---------- ออกกำลังด้วยกัน ---------- */
let SESS = null, SIV = null;
function libDetail(e) {
  const rec = e.reps ? `${e.n} ${e.sets || 3} เซ็ต ${e.reps} ครั้ง` : e.secs ? `${e.n} ${e.sets || 3} เซ็ต ${e.secs} วินาที` : `${e.n} ${e.mins || 10} นาที`;
  return { title: e.n, html: `<div class="card" style="text-align:center">${animSvg(e.anim)}</div>
<button class="btn primary block" style="margin-top:12px" data-act="sub" data-n="train" data-arg="${e.id}">${ic("play", 18)}ออกกำลังด้วยกัน (ตัวละครทำให้ดู)</button>
<div class="sec">วิธีทำ</div><p>${esc(e.how)}</p><div class="hint">${ic("sparkle", 18)}<span>${esc(e.tip)}</span></div>
<div class="sec">จับเวลาพักระหว่างเซ็ต</div><div class="row"><button class="btn" data-act="rest" data-s="30">30 วินาที</button><button class="btn" data-act="rest" data-s="60">60 วินาที</button><b id="restt" style="margin-left:8px"></b></div>
<button class="btn block" style="margin-top:14px" data-act="logwork" data-t="${esc(rec)}">ทำมาแล้ว บันทึกเอง</button>` };
}
const EXCLS = { squat: "exsq", jack: "exjk", pushup: "expu", plank: "exbr", lunge: "exlg" };
SUBS.train = (arg) => {
  const e = LIB.find(x => x.id === arg.id) || LIB[0];
  if (!SESS || SESS.e !== e) { stopTrain(); SESS = { e, set: 1, sets: e.reps || e.secs ? (e.sets || 3) : 1, phase: "ready", t0: 0, rep: 0, tempo: e.anim === "jack" ? 1.5 : 3, dur: e.secs || (e.mins ? e.mins * 60 : 60) }; }
  const s = SESS, ph = s.phase, base = EXCLS[e.anim] || "exdf", lying = base === "expu" || base === "exbr";
  const cls = ph === "go" ? base : ph === "done" ? "exdone" : "idle", x = ph === "go" && lying ? 300 : 190;
  const drops = ph === "go" ? `<circle cx="-30" cy="-150" r="3.5" fill="#8CC8E8" style="animation:drop 1.2s infinite"/><circle cx="32" cy="-146" r="3" fill="#8CC8E8" style="animation:drop 1.2s .5s infinite"/>` : "";
  const L = S.look, rx = shapeRx(estW());
  const label = ph === "ready" ? "พร้อมแล้วก็เริ่มเลย ทำตามน้องนะ" : ph === "rest" ? "พักก่อน หายใจลึกๆ" : ph === "done" ? "เสร็จแล้ว เก่งมาก" : e.reps ? "ครั้งที่ทำแล้ว" : "เหลืออีก";
  return {
    title: "ออกกำลังด้วยกัน · " + e.n, html: `<div class="stage"><svg viewBox="0 0 380 290" role="img" aria-label="ตัวละครกำลังทำท่า${esc(e.n)}"><rect width="380" height="290" fill="#FFF1E3"/><rect y="252" width="380" height="38" fill="#F3D9BF"/><g transform="translate(${x},252)"><g class="exg ${cls}">${figure(L, ph === "done" ? "proud" : ph === "go" ? "work" : "happy", rx)}${drops}</g></g>${ph === "done" ? '<text x="190" y="30" text-anchor="middle" font-size="18" fill="#6b4a3a">เสร็จแล้วด้วยกัน</text>' : ""}</svg></div>
<div class="muted sm" style="text-align:center;margin-top:8px">${label}</div><div class="tcount" id="tcount">${ph === "go" ? (e.reps ? "0" : s.dur) : ph === "rest" ? "30" : ph === "done" ? ic("check", 48) : "-"}</div>
<div class="muted" style="text-align:center">${e.reps ? "จาก " + e.reps + " ครั้ง" : "วินาที"} · เซ็ต ${Math.min(s.set, s.sets)}/${s.sets}</div>
<div class="row" style="margin-top:14px">${ph === "ready" ? `<button class="btn primary" style="flex:1" data-act="trgo">เริ่ม</button>` : ph === "done" ? `<button class="btn primary" style="flex:1" data-act="trlog">บันทึกและจบ</button>` : `<button class="btn" style="flex:1" data-act="trstop">จบแค่นี้</button>`}</div>
<p class="xs muted" style="margin-top:10px;text-align:center">แอปนับตามจังหวะ ทำตามจังหวะของน้อง ถ้าเจ็บหรือเวียนหัวให้หยุดทันที</p>`,
    after: () => { if (ph === "go" || ph === "rest") startTick(); }
  };
};
function stopTrain() { clearInterval(SIV); SIV = null; SESS = null; }
function startTick() { clearInterval(SIV); SIV = setInterval(trTick, 200); }
function trTick() {
  const s = SESS, c = $("#tcount"); if (!s || !c) { clearInterval(SIV); return; }
  const el = (Date.now() - s.t0) / 1000;
  if (s.phase === "go") {
    if (s.e.reps) { const r = Math.floor(el / s.tempo); if (r >= s.e.reps) return trEnd(); c.textContent = r; }
    else { const left = Math.ceil(s.dur - el); if (left <= 0) return trEnd(); c.textContent = left; }
  } else if (s.phase === "rest") { const left = Math.ceil(30 - el); if (left <= 0) { s.phase = "go"; s.t0 = Date.now(); rerenderSub(); return; } c.textContent = left; }
}
function trEnd() {
  const s = SESS; clearInterval(SIV);
  if (s.set >= s.sets) { s.phase = "done"; confetti(); } else { s.set++; s.phase = "rest"; s.t0 = Date.now(); }
  rerenderSub();
}
ACT.trgo = () => { SESS.phase = "go"; SESS.t0 = Date.now(); rerenderSub(); };
function trSave(sets) {
  const s = SESS, e = s.e, ex = findEx(e.n);
  if (!ex || !sets) { if (!ex && sets) logText("work", e.reps ? `${e.n} ${sets} เซ็ต ${e.reps} ครั้ง` : `${e.n} ${sets} เซ็ต ${e.secs || 60} วินาที`); return false; }
  const it = { n: ex[0], met: ex[1], kind: ex[2], sets: s.sets === 1 && !e.reps && !e.secs ? 0 : sets, reps: e.reps || 0, secs: e.secs || 0, mins: !e.reps && !e.secs ? (e.mins || 1) : 0, known: true, km: 0 };
  const c = workCalc(it, estW());
  S.works.push({ id: rid(), d: todayKey(), t: nowHM(), n: it.n + (workLabel(it) ? " · " + workLabel(it) : ""), sets: it.sets, reps: it.reps, k: c.k });
  earn(5); touchStreak(); save(); return true;
}
ACT.trlog = () => { const ok = trSave(SESS.sets); stopTrain(); closeAllSubs(); if (ok) { setFx("proud", 3000); toast("บันทึกการออกกำลังกายแล้ว"); } };
ACT.trstop = () => { const s = SESS, done = s.phase === "done" ? s.sets : s.set - 1; const ok = done > 0 && trSave(done); stopTrain(); closeAllSubs(); if (ok) { setFx("proud", 3000); toast("บันทึก " + done + " เซ็ตแล้ว"); } };
const _bk = ACT.back;
ACT.back = () => { const t = subStack[subStack.length - 1]; if (t && t.name === "train") stopTrain(); _bk(); };
