/* แกนกลาง: ไอคอน ข้อมูลผู้ใช้ การคำนวณ การตีความข้อความ */
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4"/>',
  dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  scale: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9a4 4 0 0 1 8 0"/><path d="M12 9l2-2"/>',
  droplet: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  ruler: '<rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="12" cy="12" r="1"/>',
  fridge: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 11h12M9 7v1M9 14v2"/>',
  arrow: '<path d="M7 17L17 7M8 7h9v9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  party: '<path d="M4 20l5-12 7 7z"/><path d="M14 4v2M19 8h2M17 12l2 1"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  run: '<circle cx="14" cy="5" r="2"/><path d="M12 9l-3 4 3 2 1 5M12 9l4 3 3-1M9 13l-4 1"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  hanger: '<path d="M12 8a2 2 0 1 0-2-2"/><path d="M12 8l9 7a1 1 0 0 1-1 2H4a1 1 0 0 1-1-2z"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 4 2 4 4"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  send: '<path d="M4 12l16-8-6 16-3-7z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  minus: '<path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 3h6"/>',
  sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  bed: '<path d="M3 18v-8M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="1.5"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>', play: '<path d="M7 4l13 8-13 8z"/>'
};
function ic(n, s) { s = s || 20; return `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`; }

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = n => String(n).padStart(2, "0");
function dk(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function todayKey() { return dk(new Date()); }
function addDays(key, n) { const d = new Date(key + "T12:00:00"); d.setDate(d.getDate() + n); return dk(d); }
const THMON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const THDAY = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const THDAYL = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
function fmtD(key) { const d = new Date(key + "T12:00:00"); return d.getDate() + " " + THMON[d.getMonth()]; }
function nowHM() { const d = new Date(); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function r0(n) { return Math.round(n); }
function f1(n) { return (Math.round(n * 10) / 10).toFixed(1); }
function fmtN(n) { return Math.round(n).toLocaleString("en-US"); }

/* ---------- ข้อมูลผู้ใช้ ---------- */
let S = blank();
let dbRef = null, syncMode = "local", saveT = null;
function blank() {
  return {
    v: 1, upd: 0, created: Date.now(), onboarded: false, name: "",
    look: { g: "neutral", skin: "#FFF1D6", hs: "pleat", hc: "#6B4A3A", oc: "#F4A58A", acc: "none" },
    prof: { h: 165, w0: 70, age: 20, sex: "f", act: 1.2, def: 500 },
    owned: {}, coins: 20, coinLog: {}, weights: [], meals: [], works: [], water: {}, sleep: {}, waist: [],
    claimed: {}, del: {}, moods: {}, streak: { last: "", n: 0, best: 0 }, cheat: null, plan: null, shop: {}, nights: 0
  };
}
function merge(d) { const b = blank(); const o = Object.assign({}, b, d || {}); o.look = Object.assign({}, b.look, (d && d.look) || {}); o.prof = Object.assign({}, b.prof, (d && d.prof) || {}); o.streak = Object.assign({}, b.streak, (d && d.streak) || {}); return o; }
function persistLocal() { try { localStorage.setItem("wl_state_v1", JSON.stringify(S)); } catch (e) { } }
function save() {
  S.upd = Date.now(); persistLocal(); clearTimeout(saveT);
  if (typeof pushPing === "function") pushPing();
  if (typeof medalSoon === "function") medalSoon();
  if (typeof goalSoon === "function") goalSoon();
  if (typeof syncSoon === "function") syncSoon();
  saveT = setTimeout(async () => {
    if (!dbRef) { syncMode = "local"; badge(); return; }
    try { await dbRef.set(JSON.parse(JSON.stringify(S))); syncMode = "cloud"; } catch (e) { syncMode = "local"; }
    badge();
  }, 900);
}
function badge() { const b = $("#syncb"); if (b) { b.textContent = syncMode === "cloud" ? "บันทึกในบัญชีของคุณแล้ว ใช้ต่อได้ทุกเครื่อง" : ""; b.parentElement.hidden = !b.textContent; } }
function readSnap(s) {
  if (!s) return null;
  try { const ex = typeof s.exists === "function" ? s.exists() : s.exists; if (ex === false) return null; } catch (e) { }
  try { const d = typeof s.data === "function" ? s.data() : (s.data !== undefined ? s.data : s); return d && typeof d === "object" ? d : null; } catch (e) { return null; }
}
function withTimeout(p, ms) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]); }
async function loadStore() {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
  try { const raw = localStorage.getItem("wl_state_v1"); if (raw) S = merge(JSON.parse(raw)); } catch (e) { }
  let cloud = null;
  try {
    if (typeof claude !== "undefined" && claude && claude.use) {
      const user = await withTimeout(claude.use("user"), 6000), db = await withTimeout(claude.use("db"), 6000);
      if (user && db) {
        const id = await user.id();
        dbRef = db.collection("data/users/" + id).doc("state");
        const d = readSnap(await withTimeout(dbRef.get(), 8000));
        if (d && d.v) cloud = merge(d);
      }
    }
  } catch (e) { dbRef = dbRef || null; }
  if (cloud && (cloud.upd || 0) >= (S.upd || 0)) { S = cloud; persistLocal(); }
  migDumpling();
  syncMode = dbRef ? "cloud" : "local";
  if (dbRef && S.onboarded && !cloud) save();
}

/* ---------- การคำนวณ ---------- */
function bmr(w) { const p = S.prof; return 10 * w + 6.25 * p.h - 5 * p.age + (p.sex === "m" ? 5 : -161); }
function baseBurn(w) { return Math.round(bmr(w) * S.prof.act); }
function floorKcal() { return S.prof.sex === "m" ? 1500 : 1200; }
function bmiOf(w) { const m = S.prof.h / 100; return w / (m * m); }
function trendAt(key) {
  const ws = S.weights.filter(x => x.d <= key);
  if (!ws.length) return null;
  const last = ws[ws.length - 1], lt = new Date(last.d + "T12:00:00").getTime();
  const win = ws.filter(x => lt - new Date(x.d + "T12:00:00").getTime() <= 6 * 864e5);
  return { w: win.reduce((s, x) => s + x.w, 0) / win.length, d: last.d };
}
function weightOn(key) { const t = trendAt(key); return t ? t.w : S.prof.w0; }
function dayInfo(key) {
  const meals = S.meals.filter(m => m.d === key), works = S.works.filter(m => m.d === key);
  return { key, meals, works, eaten: meals.reduce((s, m) => s + m.k, 0), wk: works.reduce((s, m) => s + m.k, 0), logged: meals.length > 0 };
}
function dayBal(key) { const i = dayInfo(key); const burn = baseBurn(weightOn(key)) + i.wk; return { burn, eaten: i.eaten, bal: burn - i.eaten, capped: Math.min(1000, burn - i.eaten), logged: i.logged }; }
function estW() {
  const t = trendAt(todayKey()) || { w: S.prof.w0, d: dk(new Date(S.created)) };
  const today = todayKey(), days = new Set(S.meals.filter(m => m.d > t.d && m.d < today).map(m => m.d));
  let def = 0; days.forEach(k => { def += dayBal(k).capped; });
  return clamp(t.w - def / 7700, t.w - 4, t.w + 4);
}
function targetOn(key) {
  const w = weightOn(key), base = baseBurn(w), under = bmiOf(w) < 18.5;
  let t = under ? base : base - S.prof.def;
  const c = S.cheat; if (c && c.days && c.days.indexOf(key) > -1) t -= c.trim;
  return Math.round(Math.max(t, floorKcal()));
}
function remainingNow() { const i = dayInfo(todayKey()); return targetOn(todayKey()) + i.wk - i.eaten; }
function shapeRx(w) { return clamp(Math.round(34 + (bmiOf(w) - 16) * 1.1), 32, 60); }
function touchStreak() {
  const t = todayKey(), s = S.streak;
  if (s.last === t) return;
  s.n = s.last === addDays(t, -1) ? s.n + 1 : 1; s.last = t; s.best = Math.max(s.best || 0, s.n);
}
function earn(n) {
  const d = todayKey(); S.coinLog[d] = S.coinLog[d] || 0;
  const g = Math.min(n, Math.max(0, 12 - S.coinLog[d]));
  if (g > 0) { S.coins += g; S.coinLog[d] += g; if (typeof popCoins === "function") popCoins(g); }
  return g;
}
function missionProg(id) {
  switch (id) {
    case "m_log7": return new Set(S.meals.map(m => m.d)).size;
    case "m_ex10": return S.works.length;
    case "m_bf5": return new Set(S.meals.filter(m => m.t < "10:30").map(m => m.d)).size;
    case "m_water": return Object.keys(S.water).filter(k => S.water[k] >= 8).length;
    case "m_weigh": return S.weights.length;
    case "m_streak": return S.streak.best || 0;
    case "m_night": return S.nights || 0;
  }
  return 0;
}
function isOwned(code) { return !code || !!S.owned[code] || (typeof itemFree === "function" && itemFree(code)); }

/* ---------- ตีความข้อความ ---------- */
const normT = s => s.replace(/\s+/g, "");
const NUMW = { "หนึ่ง": 1, "สอง": 2, "สาม": 3, "สี่": 4, "ห้า": 5, "หก": 6 };
const SPLIT = /[,，+\n]|แล้วก็|ตามด้วย|พร้อม|และ|กับ|แล้ว/;
function qtyOf(seg) {
  if (/ครึ่ง/.test(seg)) return 0.5;
  const m = seg.match(/(\d+(?:\.\d+)?)/); if (m) return parseFloat(m[1]);
  for (const k in NUMW) if (seg.indexOf(k) > -1) return NUMW[k];
  return 1;
}
function findFood(seg) {
  const n = normT(seg); let best = null, bl = 0;
  FOODS.forEach(f => f[3].concat([f[0]]).forEach(k => { const kk = normT(k); if (kk.length > bl && n.indexOf(kk) > -1) { best = f; bl = kk.length; } }));
  return best;
}
/* "ส้มตำปู ข้าวเหนียว ไก่ย่าง" -> 3 รายการ: แยกด้วยเว้นวรรคเมื่อมีเมนูที่รู้จักตั้งแต่ 2 คำ (คำที่ไม่ใช่เมนู เช่น 1 จาน ติดกับเมนูก่อนหน้า) */
function splitBySpace(seg) {
  const toks = seg.split(/\s+/).filter(Boolean); if (toks.length < 2 || toks.filter(t => findFood(t)).length < 2) return [seg];
  const out = []; toks.forEach(t => { if (findFood(t) || !out.length) out.push(t); else out[out.length - 1] += " " + t; }); return out;
}
function parseFood(text) {
  return text.split(SPLIT).map(s => s.trim()).filter(Boolean).flatMap(splitBySpace).map(seg => {
    const f = findFood(seg), q = qtyOf(seg);
    if (f) return { n: f[0], k1: f[1], q, known: true };
    return { n: seg.replace(/\d+(\.\d+)?|ครึ่ง/g, "").trim() || seg, k1: 0, q, known: false };
  });
}
function findEx(seg) {
  const n = normT(seg); let best = null, bl = 0;
  EXERCISES.forEach(e => e[3].forEach(k => { if (k.length > bl && n.indexOf(normT(k)) > -1) { best = e; bl = k.length; } }));
  return best;
}
function parseWork(text) {
  return text.split(SPLIT).map(s => s.trim()).filter(Boolean).map(seg => {
    const e = findEx(seg);
    const num = (re) => { const m = seg.match(re); return m ? parseFloat(m[1]) : 0; };
    let sets = num(/(\d+(?:\.\d+)?)\s*(?:เซ็ต|เซต|เซ็ท|sets?)/i), reps = num(/(\d+)\s*(?:ครั้ง|ที|reps?)/i);
    const mx = seg.match(/(\d+)\s*[x×]\s*(\d+)/i); if (mx) { sets = sets || parseInt(mx[1]); reps = reps || parseInt(mx[2]); }
    const secs = num(/(\d+(?:\.\d+)?)\s*(?:วินาที|วิ(?![ด่])|sec)/i);
    let mins = num(/(\d+(?:\.\d+)?)\s*(?:นาที|min)/i); const hrs = num(/(\d+(?:\.\d+)?)\s*(?:ชั่วโมง|ชม)/i); if (hrs) mins += hrs * 60;
    if (e) return { n: e[0], met: e[1], kind: e[2], sets, reps, secs, mins, known: true, km: 0 };
    return { n: seg, met: 0, kind: "time", sets, reps, secs, mins, known: false, km: 0 };
  });
}
function workCalc(it, kg) {
  let minutes = 0, assumed = false;
  if (it.mins) minutes = it.mins;
  else if (it.secs) { const s = it.sets || 1; minutes = s * it.secs / 60 + (s - 1) * 0.5; }
  else if (it.reps) { const s = it.sets || 1; minutes = s * it.reps * 3 / 60 + (s - 1) * 0.5; }
  else { minutes = 10; assumed = true; }
  const k = it.known ? it.met * 3.5 * kg / 200 * minutes : (it.km || 0);
  return { k: Math.round(k), minutes, assumed };
}
function workLabel(it) {
  const p = [];
  if (it.sets && (it.reps || it.secs)) p.push(it.sets + " เซ็ต × " + (it.reps ? it.reps + " ครั้ง" : it.secs + " วินาที"));
  else if (it.reps) p.push(it.reps + " ครั้ง"); else if (it.secs) p.push(it.secs + " วินาที");
  if (it.mins) p.push(it.mins + " นาที");
  return p.join(" · ");
}

/* ---------- ถาม Claude (ประเมินอาหารที่ไม่รู้จักหรือจากรูป) ---------- */
const estApi = () => (typeof PUSH_API !== "undefined" && PUSH_API) ? PUSH_API + "/estimate" : "";
function blobB64(b) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] || ""); r.onerror = rej; r.readAsDataURL(b); }); }
const NK = [["p", "protein"], ["c", "carb"], ["f", "fat"], ["fb", "fiber"], ["sg", "sugar"], ["na", "sodium"]];
/* ประเมินอาหาร/โภชนาการด้วย AI: text = ข้อความ, blob = รูป, foods = [{n,k}] ขอข้อมูลโภชนาการของอาหารที่รู้ชื่อแล้ว */
async function claudeEstimate(text, blob, foods) {
  const sample = (typeof claude !== "undefined" && claude && claude.use) ? await claude.use("sample") : null;
  let arr;
  const FMT = ' ตอบเป็น JSON array เท่านั้น ไม่มีข้อความอื่น รูปแบบ [{"name":"ชื่อภาษาไทยสั้นๆ","kcal":ตัวเลข,"protein":กรัม,"carb":กรัม,"fat":กรัม,"fiber":กรัม,"sugar":กรัม,"sodium":มิลลิกรัม}] ค่าทั้งหมดเป็นของ 1 รายการตามปริมาณที่ระบุหรือ 1 เสิร์ฟปกติ ถ้าไม่แน่ใจให้ประเมินแบบกลางๆ';
  if (sample) {
    const opts = { modelTier: "quick" };
    if (blob) { const lim = await sample.limits(); if (!lim || !lim.images) throw new Error("noimg"); opts.images = [blob]; }
    const task = foods ? "ให้ข้อมูลโภชนาการต่อ 1 เสิร์ฟของอาหารต่อไปนี้ ตามลำดับเดิมและใช้ชื่อเดิม:\n" + foods.map((f, i) => `${i + 1}. ${f.n} (${f.k} kcal)`).join("\n") : blob ? "ดูรูปอาหารที่แนบมา แยกเป็นแต่ละรายการที่เห็น ประเมินโภชนาการตามปริมาณในรูป" : "ผู้ใช้พิมพ์บอกว่ากินอะไรมา (อาจพิมพ์ผิดหรือไม่ครบ ให้เดาและแก้ชื่อให้ถูก): " + text;
    const r = await sample(task + FMT, opts);
    const m = (r.text || "").match(/\[[\s\S]*\]/); if (!m) throw new Error("parse");
    arr = JSON.parse(m[0]);
  } else {
    const api = estApi(); if (!api) throw new Error("nosample");
    let resp;
    try { resp = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(foods ? { foods } : blob ? { image: await blobB64(blob), mime: blob.type || "image/jpeg" } : { text }) }); }
    catch (e) { throw new Error("net"); }
    const j = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(j.error === "limit" || j.error === "busy" ? j.error : j.error === "not_configured" ? "nosample" : "parse");
    arr = j.items || [];
  }
  return arr.filter(x => x && x.name && isFinite(+x.kcal)).map(x => { const o = { n: String(x.name), k1: Math.round(+x.kcal), q: 1, known: true, ai: true }; if (x.protein !== undefined || x.carb !== undefined || x.fat !== undefined) NK.forEach(([a, b]) => { const v = +x[b]; o[a] = isFinite(v) && v >= 0 ? Math.round(v * 10) / 10 : 0; }); return o; });
}
function shrinkImage(file) {
  return new Promise((res) => {
    try {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const sc = Math.min(1, 1024 / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        c.toBlob(b => { URL.revokeObjectURL(url); res(b || file); }, "image/jpeg", 0.8);
      };
      im.onerror = () => res(file); im.src = url;
    } catch (e) { res(file); }
  });
}
