/* เป้าหมายรายสัปดาห์: เลือกเองได้ 1–2 ข้อ ได้เหรียญพิเศษเมื่อทำสำเร็จ (นับต่อจากตอนเลือก) */
const GPOOL = [
  { id: "log", n: "จดอาหาร", u: "วัน", icon: "bowl", lv: [3, 5, 7], prog: ks => new Set(S.meals.filter(m => ks.has(m.d)).map(m => m.d)).size },
  { id: "water", n: "ดื่มน้ำครบ 8 แก้ว", u: "วัน", icon: "droplet", lv: [3, 5, 7], prog: ks => [...ks].filter(k => (S.water[k] || 0) >= 8).length },
  { id: "work", n: "ออกกำลังกาย", u: "ครั้ง", icon: "dumbbell", lv: [2, 3, 5], prog: ks => S.works.filter(w => ks.has(w.d)).length },
  { id: "mood", n: "บันทึกอารมณ์", u: "วัน", icon: "heart", lv: [3, 5, 7], prog: ks => [...ks].filter(k => typeof moodOf === "function" && moodOf(k)).length },
  { id: "weigh", n: "ชั่งน้ำหนัก", u: "ครั้ง", icon: "scale", lv: [1, 2, 3], prog: ks => S.weights.filter(w => ks.has(w.d)).length }
];
const GREWARD = [10, 20, 35], GBONUS = 10, GMAX = 2, LVN = ["เบาๆ", "พอดี", "ท้าทาย"];
function gWeekStart(k) { const t = k || todayKey(), dow = new Date(t + "T12:00:00").getDay(); return addDays(t, -((dow + 6) % 7)); }
function gKeys(ws) { const s = new Set(); for (let i = 0; i < 7; i++) s.add(addDays(ws, i)); return s; }
function gState() {
  const ws = gWeekStart(); if (!S.goals || S.goals.wk !== ws) S.goals = { wk: ws, picks: [] };
  return S.goals;
}
const gDef = id => GPOOL.find(g => g.id === id);
function gProg(p) { const d = gDef(p.id); return d ? Math.max(0, d.prog(gKeys(S.goals.wk)) - (p.b || 0)) : 0; }
let GOAL_BUSY = false, GOAL_T = null;
function goalSoon() { if (GOAL_BUSY || !S.onboarded) return; clearTimeout(GOAL_T); GOAL_T = setTimeout(goalCheck, 900); }
function goalCheck() {
  if (!S.onboarded || GOAL_BUSY) return; const G = gState(); let coins = 0, names = [];
  G.picks.forEach(p => { if (!p.done && gProg(p) >= p.t) { p.done = true; const lv = Math.max(0, gDef(p.id).lv.indexOf(p.t)); coins += GREWARD[lv]; names.push(gDef(p.id).n); } });
  if (!names.length) return;
  if (G.picks.length >= 2 && G.picks.every(p => p.done)) coins += GBONUS;
  S.coins += coins; GOAL_BUSY = true; try { save(); } finally { GOAL_BUSY = false; }
  toast(`สำเร็จเป้าหมาย “${names.join(", ")}” +${coins} เหรียญ`); if (typeof confetti === "function") confetti();
  if (typeof view !== "undefined" && view === "home" && !subStack.length) renderHome(); else if (subStack.length && typeof rerenderSub === "function") rerenderSub();
}
function goalBar(p) {
  const d = gDef(p.id), v = Math.min(p.t, gProg(p)), pct = Math.round(v / p.t * 100);
  return `<div class="gl"><span class="glic">${ic(d.icon, 18)}</span><div class="grow"><div class="row between"><b>${esc(d.n)}</b><span class="xs muted">${p.done ? "สำเร็จแล้ว" : v + "/" + p.t + " " + d.u}</span></div><div class="gbar"><i class="${p.done ? "ok" : ""}" style="width:${p.done ? 100 : pct}%"></i></div></div></div>`;
}
function goalsHome() {
  if (!S.onboarded) return ""; const G = gState();
  if (!G.picks.length) return `<div class="card goalcard"><span class="evic">${ic("target", 20)}</span><div class="grow"><b>ตั้งเป้าหมายสัปดาห์นี้</b><div class="xs muted">เลือกเองได้ 1–2 ข้อ ทำสำเร็จได้เหรียญพิเศษ</div></div><button class="btn sm primary" data-act="sub" data-n="goals">เลือก</button></div>`;
  return `<div class="card goalcard col"><div class="row between"><b>เป้าหมายสัปดาห์นี้</b><button class="linkbtn" data-act="sub" data-n="goals">แก้ไข</button></div>${G.picks.map(goalBar).join("")}</div>`;
}
SUBS.goals = () => {
  const G = gState(), pick = id => G.picks.find(p => p.id === id);
  const rows = GPOOL.map(d => {
    const p = pick(d.id);
    return `<div class="card gpick"><div class="row"><span class="glic">${ic(d.icon, 18)}</span><b>${esc(d.n)}</b></div><div class="row wrap" style="margin-top:8px;gap:6px">${d.lv.map((t, i) => `<button class="btn sm ${p && p.t === t ? "primary" : ""}" data-act="gpick" data-id="${d.id}" data-t="${t}" aria-pressed="${!!(p && p.t === t)}">${t} ${d.u}<span class="xs"> · +${GREWARD[i]}</span></button>`).join("")}${p ? `<button class="btn sm ghost" data-act="gdrop" data-id="${d.id}">เอาออก</button>` : ""}</div></div>`;
  }).join("");
  return { title: "เป้าหมายสัปดาห์นี้", html: `<p class="muted sm" style="margin-bottom:10px">เลือกได้สูงสุด ${GMAX} ข้อ นับความคืบหน้าตั้งแต่ตอนที่เลือก ทำครบทั้ง 2 ข้อได้โบนัสอีก ${GBONUS} เหรียญ รีเซ็ตทุกวันจันทร์</p>${G.picks.length ? `<div class="card goalcard col" style="margin-bottom:12px">${G.picks.map(goalBar).join("")}</div>` : ""}<div style="display:grid;gap:10px">${rows}</div>` };
};
ACT.gpick = (a) => {
  const G = gState(), id = a.dataset.id, t = +a.dataset.t, cur = G.picks.find(p => p.id === id), d = gDef(id);
  if (cur) { if (cur.done) { toast("ข้อนี้สำเร็จแล้ว"); return; } cur.t = t; }
  else { if (G.picks.length >= GMAX) { toast(`เลือกได้สูงสุด ${GMAX} ข้อ เอาข้อเดิมออกก่อนนะ`); return; } G.picks.push({ id, t, b: d.prog(gKeys(G.wk)), done: false }); }
  save(); rerenderSub();
};
ACT.gdrop = (a) => { const G = gState(), p = G.picks.find(x => x.id === a.dataset.id); if (p && p.done) { toast("ข้อนี้สำเร็จแล้ว"); return; } G.picks = G.picks.filter(x => x.id !== a.dataset.id); save(); rerenderSub(); };
