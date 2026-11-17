/* โภชนาการละเอียด + จับคู่อาหารแบบเดาคำพิมพ์ผิด/ไม่ครบ + เลือกเวลาที่กิน */
const NF = [["p", "โปรตีน", "g"], ["c", "คาร์บ", "g"], ["f", "ไขมัน", "g"], ["fb", "ใยอาหาร", "g"], ["sg", "น้ำตาล", "g"], ["na", "โซเดียม", "mg"]];
/* ---------- จับคู่ชื่อแบบยืดหยุ่น ---------- */
const skel = s => normT(String(s)).toLowerCase().replace(/[็่-์ั]/g, "").replace(/ใ/g, "ไ");
function approxDist(key, text) {
  const m = key.length, n = text.length; let prev = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j - 1] + (key[i - 1] === text[j - 1] ? 0 : 1), prev[j] + 1, cur[j - 1] + 1); prev = cur; }
  return Math.min.apply(null, prev);
}
function fuzzyFood(seg) {
  const t = skel(seg); if (t.length < 3) return null; let best = null, bs = 1e9;
  FOODS.forEach(f => f[3].concat([f[0]]).forEach(k => {
    const kk = skel(k), L = kk.length; if (L < 3) return;
    const allow = L < 5 ? 0 : L < 7 ? 1 : L < 11 ? 2 : 3, d = approxDist(kk, t);
    if (d <= allow) { const sc = d * 100 - L; if (sc < bs) { bs = sc; best = { f, d }; } }
  }));
  return best;
}
const _findFoodExact = findFood;
const fnObj = name => { const v = typeof FN !== "undefined" && FN[name]; return v ? { p: v[0], c: v[1], f: v[2], fb: v[3], sg: v[4], na: v[5] } : null; };
const withNutr = it => { const n = it.p === undefined && (fnObj(it.n) || (S.nutr && S.nutr[it.n])); if (n) NK.forEach(([a]) => { it[a] = n[a] || 0; }); return it; };
/* จับคู่ชื่อ: คืน {f, key, d} (d = จำนวนตัวอักษรที่เดา) ลองตรงตัวก่อน แล้วค่อยเดา */
const foodList = () => (S.myfoods || []).map(m => [m.n, m.k, "m", [m.n], [], m]).concat(FOODS);
function matchFood(seg) {
  const n = normT(seg); let ex = null, bl = 0;
  foodList().forEach(f => f[3].concat([f[0]]).forEach(k => { const kk = normT(k); if (kk.length > bl && n.indexOf(kk) > -1) { ex = { f, key: k, d: 0 }; bl = kk.length; } }));
  const t = skel(seg); let fz = null, bs = 1e9;
  if (t.length >= 3) foodList().forEach(f => f[3].concat([f[0]]).forEach(k => {
    const kk = skel(k), L = kk.length; if (L < 3) return;
    const allow = L < 6 ? 0 : L < 14 ? 1 : 2; if (t.indexOf(kk.slice(0, 2)) < 0) return;
    const d = approxDist(kk, t);
    if (d <= allow) { const sc = d * 100 - L; if (sc < bs) { bs = sc; fz = { f, key: k, d }; } }
  }));
  if (ex && fz) { const se = skel(ex.key).length, sf = skel(fz.key).length - 3 * fz.d; return sf > se ? fz : ex; }
  return ex || fz;
}
const FILLER = /\d+(\.\d+)?|ครึ่ง|จาน|ชิ้น|แก้ว|ถ้วย|ห่อ|ที่|ชุด|อัน|ลูก|ผล|กิน|ทาน|วันนี้|หน่อย|นิดหน่อย|เล็ก|ใหญ่|ธรรมดา|พิเศษ|ใส่|ไม่|หวาน|เพิ่ม|น้อย|มาก|แก้วเล็ก|ร้อน|ไทย|สด|สุก|เย็น|ซอง|กระป๋อง|ขวด|ถุง|ที่|ห่อ|กล่อง|แท่ง|ก้อน|ไม้|ฟอง|คำ|ตัว|แผ่น|อัน|สกู๊ป|ม้วน|ถาด|ช้อน|ชุด/g;
findFood = seg => (matchFood(seg) || {}).f || null;
parseFood = function (text) {
  return text.split(SPLIT).map(s => s.trim()).filter(Boolean).flatMap(splitBySpace).map(seg => {
    const q = qtyOf(seg), r = matchFood(seg);
    if (r) {
      const core = skel(seg.replace(FILLER, "")).length || 1, cov = skel(r.key).length / core;
      const it = { n: r.f[0], k1: r.f[1], q, raw: seg }; const my = r.f[5]; if (my) { it.my = my.id; if (my.p !== undefined) NK.forEach(([a]) => { it[a] = my[a] || 0; }); }
      if (cov >= 0.7) { it.known = true; if (r.d > 0) it.fz = seg; return withNutr(it); }
      /* ชื่อยาวกว่าที่รู้จักมาก เช่น "ซูชิแซลมอน" ไม่ใช่ "แซลมอนย่าง": ให้ AI ดู ถ้า AI ไม่ได้ค่อยใช้ตัวเลือกใกล้เคียง */
      return { n: seg.replace(/\d+(\.\d+)?|ครึ่ง/g, "").trim() || seg, k1: 0, q, known: false, raw: seg, cand: it };
    }
    return { n: seg.replace(/\d+(\.\d+)?|ครึ่ง/g, "").trim() || seg, k1: 0, q, known: false, raw: seg };
  });
};
/* ---------- แคชโภชนาการ + เติมย้อนหลัง ---------- */
function nutrPut(name, it) {
  S.nutr = S.nutr || {}; const o = { k: it.k1 }; NK.forEach(([a]) => { o[a] = it[a] || 0; }); S.nutr[name] = o;
  const ks = Object.keys(S.nutr); if (ks.length > 400) ks.slice(0, ks.length - 400).forEach(k => delete S.nutr[k]);
}
function mealOf(it, d, t) {
  const m = { id: rid(), d, t, n: it.n + (it.q !== 1 ? " ×" + it.q : ""), k: Math.round(it.k1 * it.q) };
  if (it.p !== undefined) NK.forEach(([a]) => { m[a] = Math.round((it[a] || 0) * it.q * 10) / 10; });
  if (it.ai && it.p !== undefined) nutrPut(it.n, it);
  return m;
}
const qOfName = n => { const m = / ×([\d.]+)$/.exec(String(n)); return m ? parseFloat(m[1]) : 1; };
let NB_BUSY = false, NB_STOP = "";
async function nutriBackfill() {
  if (NB_BUSY || !S.onboarded || NB_STOP === todayKey()) return 0; S.nutr = S.nutr || {};
  const miss = S.meals.filter(m => m.p === undefined && m.d >= addDays(todayKey(), -30));
  if (!miss.length) return 0; NB_BUSY = true; let filled = 0;
  try {
    const need = {}; miss.forEach(m => { const b = baseName(m.n); if (!S.nutr[b]) need[b] = m.k / qOfName(m.n); });
    const names = Object.keys(need).slice(0, 12);
    if (names.length) {
      const res = await claudeEstimate(null, null, names.map(n => ({ n, k: Math.round(need[n]) })));
      names.forEach((n, i) => { if (res[i]) nutrPut(n, res[i]); });
    }
    S.meals.forEach(m => { if (m.p === undefined) { const n = S.nutr[baseName(m.n)]; if (n) { const q = qOfName(m.n); NK.forEach(([a]) => { m[a] = Math.round((n[a] || 0) * q * 10) / 10; }); filled++; } } });
    if (filled) save();
  } catch (e) { if (e && (e.message === "limit" || e.message === "busy" || e.message === "nosample")) NB_STOP = todayKey(); }
  NB_BUSY = false; return filled;
}
setTimeout(() => { if (typeof S === "object" && S && S.onboarded) nutriBackfill(); }, 6000);
/* ---------- หน้าบันทึกอาหาร: เวลา + แสดงโภชนาการต่อรายการ ---------- */
const lgTime = () => /^\d{2}:\d{2}$/.test((LG && LG.time) || "") ? LG.time : (LG && LG.when === "yest" ? "12:00" : nowHM());
const _logSub2 = SUBS.log;
SUBS.log = (arg) => {
  const r = _logSub2(arg);
  if (LG && LG.tab === "food") {
    const tm = `<label class="f" for="lgtime">เวลาที่กิน</label><input id="lgtime" type="time" data-in="lgtime" value="${lgTime()}"/>`;
    r.html = r.html.replace('<label class="f" for="lgwhen">', tm + '<label class="f" for="lgwhen">');
    const notes = LG.items.filter(x => x.fz).map(x => `<div class="xs muted" style="margin-top:6px">ตีความ “${esc(x.fz)}” เป็น <b>${esc(x.n)}</b> ถ้าไม่ใช่ แก้ที่ช่องพิมพ์ด้านบน</div>`).join("");
    if (notes) r.html = r.html.replace('<div class="card" style="margin-top:12px;padding:6px 14px">', notes + '<div class="card" style="margin-top:12px;padding:6px 14px">');
  }
  return r;
};
document.addEventListener("change", e => { const t = e.target; if (t.dataset && t.dataset.in === "lgtime" && LG) LG.time = t.value; if (t.dataset && t.dataset.in === "mtime") { const m = S.meals.find(x => x.id === t.dataset.id); if (m && /^\d{2}:\d{2}$/.test(t.value)) { m.t = t.value; save(); } } });
const macroLine = it => it.p === undefined ? "" : `<div class="xs muted">โปรตีน ${fmtN(Math.round((it.p || 0) * it.q))} · คาร์บ ${fmtN(Math.round((it.c || 0) * it.q))} · ไขมัน ${fmtN(Math.round((it.f || 0) * it.q))} g</div>`;
/* ---------- ตัวเลขอ้างอิง ---------- */
function nutriGoal(key) {
  const w = estW(), kc = targetOn(key) + dayInfo(key).wk;
  return { p: Math.round(w * 1.0), c: Math.round(kc * 0.5 / 4), f: Math.round(kc * 0.3 / 9), fb: 25, sg: 50, na: 2000, kc };
}
function nutriSum(meals) {
  const s = { p: 0, c: 0, f: 0, fb: 0, sg: 0, na: 0, k: 0, have: 0, n: meals.length };
  meals.forEach(m => { s.k += m.k || 0; if (m.p !== undefined) { s.have++; NK.forEach(([a]) => { s[a] += m[a] || 0; }); } }); return s;
}
let NUTRI_DAY = 0;
SUBS.nutri = () => {
  const key = addDays(todayKey(), -NUTRI_DAY), info = dayInfo(key), s = nutriSum(info.meals), g = nutriGoal(key);
  const seg = `<div class="seg" style="margin-bottom:12px"><button class="${NUTRI_DAY === 0 ? "on" : ""}" data-act="nutriday" data-d="0">วันนี้</button><button class="${NUTRI_DAY === 1 ? "on" : ""}" data-act="nutriday" data-d="1">เมื่อวาน</button></div>`;
  const bar = (lab, v, goal, unit, over) => { const pct = Math.min(100, Math.round(v / Math.max(1, goal) * 100)), bad = over && v > goal; return `<div style="margin-bottom:12px"><div class="row between"><b>${lab}</b><span class="xs muted">${fmtN(Math.round(v))} / ${over ? "ไม่ควรเกิน " : ""}${fmtN(goal)} ${unit}</span></div><div class="gbar"><i class="${bad ? "" : ""}" style="width:${pct}%;${bad ? "background:#E5534B" : ""}"></i></div></div>`; };
  const en = s.p * 4 + s.c * 4 + s.f * 9, sp = en ? Math.round(s.p * 4 / en * 100) : 0, sc = en ? Math.round(s.c * 4 / en * 100) : 0, sf = en ? 100 - sp - sc : 0;
  const lack = s.n - s.have;
  const meals = info.meals.slice().sort((a, b) => (a.t || "").localeCompare(b.t || "")).map(m => `<div class="item"><div class="grow"><b>${esc(m.n)}</b><div class="xs muted"><input type="time" class="tin" data-in="mtime" data-id="${m.id}" value="${esc(m.t || "")}" aria-label="เวลา"/> ${m.p !== undefined ? `โปรตีน ${fmtN(Math.round(m.p))} · คาร์บ ${fmtN(Math.round(m.c))} · ไขมัน ${fmtN(Math.round(m.f))} g` : "ยังไม่มีข้อมูลโภชนาการ"}</div></div><span>${fmtN(m.k)}</span></div>`).join("");
  return {
    title: "โภชนาการละเอียด", html: `${seg}${info.meals.length ? `<div class="card"><div class="row between"><div><div class="muted xs">พลังงานรวม</div><div class="big-num" style="font-size:30px">${fmtN(s.k)} <span class="xs muted">kcal</span></div></div><div class="xs muted" style="text-align:right">สัดส่วนพลังงาน<br>โปรตีน ${sp}% · คาร์บ ${sc}% · ไขมัน ${sf}%</div></div></div>
<div class="card" style="margin-top:12px">${bar("โปรตีน", s.p, g.p, "g")}${bar("คาร์โบไฮเดรต", s.c, g.c, "g")}${bar("ไขมัน", s.f, g.f, "g")}${bar("ใยอาหาร", s.fb, g.fb, "g")}${bar("น้ำตาล", s.sg, g.sg, "g", true)}${bar("โซเดียม", s.na, g.na, "mg", true)}</div>
${lack ? `<div class="hint" style="margin-top:12px">${ic("sparkle", 18)}<span>มี ${lack} รายการที่ยังไม่มีข้อมูลโภชนาการ ตัวเลขข้างบนจึงต่ำกว่าจริง <button class="linkbtn" data-act="nutrifill">เติมให้เลย</button></span></div>` : ""}
<div class="sec">แต่ละมื้อ (แตะเวลาเพื่อแก้)</div><div class="card" style="padding:4px 14px">${meals}</div>` : `<p class="muted" style="padding:24px 0;text-align:center">ยังไม่มีบันทึกอาหารของวัน${NUTRI_DAY ? "นั้น" : "นี้"}</p>`}
<p class="xs muted" style="margin-top:12px">ตัวเลขทั้งหมดเป็นค่าประมาณจากฐานข้อมูลและ AI ส่วนเป้าหมายเป็นแนวทางทั่วไป (โปรตีนราว 1 กรัมต่อน้ำหนักตัว 1 กก. คาร์บ 50% ไขมัน 30% ของพลังงาน โซเดียมไม่เกิน 2,000 มก. ตามคำแนะนำ WHO) ไม่ใช่คำแนะนำทางการแพทย์</p>`
  };
};
ACT.nutriday = (a) => { NUTRI_DAY = +a.dataset.d; rerenderSub(); };
ACT.nutrifill = async () => {
  NB_STOP = ""; toast("กำลังเติมข้อมูลโภชนาการ…"); const n = await nutriBackfill();
  toast(n ? `เติมข้อมูลให้ ${n} รายการแล้ว` : "ตอนนี้เติมไม่ได้ ลองใหม่ภายหลังนะ"); rerenderSub();
};
/* ---------- ให้ AI ช่วยอัตโนมัติเมื่อไม่รู้จักชื่ออาหาร (พิมพ์ผิดมาก ไม่ครบ หรือเป็นอาหารต่างประเทศ) ---------- */
const UNIT_RE = /(จาน|ชาม|ชิ้น|ลูก|ไม้|ฟอง|แก้ว|ถ้วย|ซอง|ขวด|ถุง|กล่อง|ที่|ถาด|แท่ง|ก้อน|คำ|กระป๋อง|สกู๊ป|ห่อ|ตัว|แผ่น|อัน|ผล|ช้อน|ม้วน)/;
function bigrams(s) { const o = []; for (let i = 0; i < s.length - 1; i++) o.push(s.slice(i, i + 2)); return o; }
function nearFoods(name, k) {
  const a = bigrams(skel(name)); if (!a.length) return [];
  return foodList().map(f => { const b = bigrams(skel(f[0])); if (!b.length) return null; const sa = new Set(a); let hit = 0; b.forEach(x => { if (sa.has(x)) hit++; }); return { n: f[0], k: f[1], s: 2 * hit / (a.length + b.length) }; }).filter(x => x && x.s >= 0.25).sort((x, y) => y.s - x.s).slice(0, k || 3).map(x => ({ n: x.n, k: x.k }));
}
function aiPrep(it) { const raw = (it.raw || it.n || "").trim(), u = (UNIT_RE.exec(raw) || [])[1] || ""; let name = raw.replace(/\d+(\.\d+)?|ครึ่ง|หนึ่ง|สอง|สาม|สี่|ห้า/g, " ").replace(UNIT_RE, " ").replace(/\s+/g, " ").trim(); return { n: name || raw, u, r: nearFoods(name || raw, 3) }; }
async function aiList(items) {
  const api = estApi(); if (!api) throw new Error("nosample");
  let resp; try { resp = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ list: items.map(aiPrep) }) }); } catch (e) { throw new Error("net"); }
  const j = await resp.json().catch(() => ({})); if (!resp.ok) throw new Error(j.error === "limit" || j.error === "busy" ? j.error : j.error === "not_configured" ? "nosample" : "parse");
  const arr = j.items || [], same = arr.length === items.length;
  return arr.map((x, i) => { const o = { n: String(x.name), k1: Math.round(+x.kcal), q: same ? items[i].q || 1 : 1, known: true, ai: true, serv: x.serving || "", lowc: x.conf === "ต่ำ" || !same, pack: !!x.pack }; if (x.protein !== undefined) NK.forEach(([a, b]) => { o[a] = +x[b] || 0; }); return o; });
}
async function aiUnknown(quiet) {
  if (!LG || LG.tab !== "food" || LG.busy) return;
  const unk = LG.items.filter(x => !x.known && (x.raw || x.n || "").trim()), key = unk.map(x => x.raw || x.n).join(", ");
  if (!unk.length) { if (!quiet) toast("พิมพ์ชื่ออาหารก่อนนะ"); return; }
  if (quiet && LG.aiKey === key) return; LG.aiKey = key; LG.busy = true; rerenderSub();
  try { const res = await aiList(unk.slice(0, 8)); LG.items = LG.items.filter(x => x.known).concat(res); }
  catch (e) {
    if (!quiet || !e || e.message !== "nosample") toast(estMsg(e, false));
    if (LG) LG.items = LG.items.map(x => x.cand ? withNutr(Object.assign({}, x.cand, { known: true, fz: x.raw })) : x);
  }
  if (LG) { LG.busy = false; rerenderSub(); }
}
const autoAI = () => aiUnknown(true);
ACT.lgai = () => aiUnknown(false);
const aiNote = it => !it.ai ? "" : `${it.serv ? `<div class="xs muted">ต่อ ${esc(it.serv)} · ค่าประมาณจาก AI</div>` : ""}${it.lowc ? `<div class="xs warnline">AI ไม่แน่ใจเมนูนี้ ตรวจและแก้ตัวเลขได้</div>` : ""}${it.pack ? `<div class="xs warnline">ขนมหรือเครื่องดื่มบรรจุซอง: เทียบกับฉลากด้านหลังซอง หรือกด “ขนมซอง/จากฉลาก”</div>` : ""}`;
const _logSub3 = SUBS.log;
SUBS.log = (arg) => { const fresh = !!(arg.fresh || !LG), r = _logSub3(arg); if (fresh && LG && LG.items && LG.items.some(x => !x.known)) setTimeout(autoAI, 80); return r; };
const _lgparse = ACT.lgparse; ACT.lgparse = (a, e) => { _lgparse(a, e); setTimeout(autoAI, 80); };
const _lgtab = ACT.lgtab; ACT.lgtab = (a, e) => { _lgtab(a, e); setTimeout(autoAI, 80); };
const _lgsave = ACT.lgsave; ACT.lgsave = (a, e) => { _lgsave(a, e); setTimeout(nutriBackfill, 1500); };
