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
const GDESC = { log: "จดอาหารอย่างน้อยวันละมื้อ", water: "ดื่มน้ำให้ครบ 8 แก้วในวันนั้น", work: "บันทึกการออกกำลังกายแต่ละครั้ง", mood: "บันทึกอารมณ์ประจำวัน", weigh: "ชั่งน้ำหนักแล้วจดตัวเลข" };
SUBS.goals = () => {
  const G = gState(), pick = id => G.picks.find(p => p.id === id), full = G.picks.length >= GMAX, done = G.picks.filter(p => p.done).length;
  const left = Math.max(1, Math.round((new Date(addDays(G.wk, 7) + "T00:00:00") - new Date(todayKey() + "T00:00:00")) / 864e5));
  const frac = G.picks.reduce((s0, p) => s0 + (p.done ? 1 : Math.min(1, gProg(p) / p.t)), 0) / GMAX, C = 2 * Math.PI * 34;
  const pot = G.picks.reduce((s0, p) => p.done ? s0 : s0 + GREWARD[Math.max(0, gDef(p.id).lv.indexOf(p.t))], 0) + (G.picks.length >= GMAX && done < GMAX ? GBONUS : 0);
  const ov = `<div class="card gov"><div class="gov-ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="rb" cx="40" cy="40" r="34"/><circle class="rf" cx="40" cy="40" r="34" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - frac)).toFixed(1)}"/></svg><b>${done}/${GMAX}</b></div>
<div class="gov-t"><b>${G.picks.length ? (done >= GMAX ? "ครบทุกเป้าแล้ว เก่งมาก!" : "ลุยต่อ เหลืออีก " + (GMAX - done) + " ข้อ") : "เลือกเป้าหมายสัปดาห์นี้"}</b><span class="xs muted">เลือกแล้ว ${G.picks.length}/${GMAX} ข้อ · รีเซ็ตวันจันทร์ (อีก ${left} วัน)</span><span class="gcoin">${ic("coin", 14)}${G.picks.length ? (pot ? "รอรับอีก +" + pot + " เหรียญ" : "รับครบแล้ว") : "ทำครบ 2 ข้อรับโบนัส +" + GBONUS}</span></div></div>`;
  const cards = GPOOL.map((d, n) => {
    const p = pick(d.id), v = p ? Math.min(p.t, gProg(p)) : 0, pct = p ? (p.done ? 100 : Math.round(v / p.t * 100)) : 0;
    return `<div class="card gpick${p ? " on" : ""}${p && p.done ? " ok" : ""}${full && !p ? " full" : ""}" style="--i:${n}"><div class="gp-h"><span class="glic big">${ic(d.icon, 22)}</span><div class="grow"><b>${esc(d.n)}</b><span class="xs muted">${GDESC[d.id] || ""}</span></div>${p ? `<span class="gp-badge">${p.done ? ic("check", 13) + "สำเร็จ" : "ติดตามอยู่"}</span>` : ""}</div>
${p ? `<div class="gp-prog"><div class="row between"><span class="xs muted">${p.done ? "ทำครบแล้ว" : v + "/" + p.t + " " + d.u}</span><span class="xs muted">${pct}%</span></div><div class="gbar"><i class="${p.done ? "ok" : ""}" style="width:${pct}%"></i></div></div>` : ""}
<div class="gp-lv">${d.lv.map((t, i) => `<button class="gpl${p && p.t === t ? " on" : ""}" data-act="gpick" data-id="${d.id}" data-t="${t}" aria-pressed="${!!(p && p.t === t)}"><b>${t} ${d.u}</b><small>${LVN[i]}</small><i>${ic("coin", 12)}+${GREWARD[i]}</i></button>`).join("")}</div>
${p && !p.done ? `<button class="linkbtn gp-drop" data-act="gdrop" data-id="${d.id}">เอาข้อนี้ออก</button>` : ""}</div>`;
  }).join("");
  return { title: "เป้าหมายสัปดาห์นี้", html: `${ov}${full ? `<div class="hint">${ic("sparkle", 18)}<span>เลือกครบ ${GMAX} ข้อแล้ว อยากเปลี่ยนข้อไหนให้กด “เอาข้อนี้ออก” ก่อนนะ</span></div>` : ""}<div class="gpgrid">${cards}</div>` };
};
ACT.gpick = (a) => {
  const G = gState(), id = a.dataset.id, t = +a.dataset.t, cur = G.picks.find(p => p.id === id), d = gDef(id);
  if (cur) { if (cur.done) { toast("ข้อนี้สำเร็จแล้ว"); return; } cur.t = t; }
  else { if (G.picks.length >= GMAX) { toast(`เลือกได้สูงสุด ${GMAX} ข้อ เอาข้อเดิมออกก่อนนะ`); return; } G.picks.push({ id, t, b: d.prog(gKeys(G.wk)), done: false }); }
  save(); rerenderSub();
};
ACT.gdrop = (a) => { const G = gState(), p = G.picks.find(x => x.id === a.dataset.id); if (p && p.done) { toast("ข้อนี้สำเร็จแล้ว"); return; } G.picks = G.picks.filter(x => x.id !== a.dataset.id); save(); rerenderSub(); };
