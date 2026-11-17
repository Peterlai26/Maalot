/* มื้อประจำ: บันทึกชุดอาหารที่กินบ่อยไว้ แตะครั้งเดียวจดได้ทั้งมื้อ */
const COMBO_MAX = 8;
const comboKcal = c => c.items.reduce((s, x) => s + (x.k || 0), 0);
function comboHome() {
  const cs = S.combos || []; if (!cs.length) return "";
  return `<div class="sec" style="margin-bottom:6px">มื้อประจำ แตะครั้งเดียวจดเลย <button class="linkbtn" data-act="sub" data-n="combos">จัดการ</button></div><div class="logchips" style="margin-top:0">${cs.map(c => `<button class="chip mchip" data-drag="combo" data-act="combolog" data-id="${esc(c.id)}"><span class="ci" data-ic="plus">${ic("plus", 14)}</span>${esc(c.n)} · ${fmtN(comboKcal(c))}</button>`).join("")}</div>`;
}
ACT.combolog = (a) => {
  const c = (S.combos || []).find(x => x.id === a.dataset.id); if (!c) return;
  const d = todayKey(), t = nowHM();
  c.items.forEach(it => S.meals.push({ id: rid(), d, t, n: it.n, k: it.k }));
  earn(2); touchStreak(); save(); setFx("eat", 2600); toast(`จด “${c.n}” แล้ว`);
};
/* ในหน้าบันทึกอาหาร: แถวมื้อประจำ + ปุ่มบันทึกเป็นมื้อประจำ */
const _logSub = SUBS.log;
SUBS.log = (arg) => {
  const r = _logSub(arg);
  if (LG && LG.tab === "food") {
    const cs = S.combos || [];
    const chips = cs.length ? `<div class="sec" style="margin:0 0 6px">มื้อประจำ แตะเพื่อเพิ่มรายการ</div><div class="logchips" style="margin:0 0 10px">${cs.map(c => `<button class="chip" data-act="comboload" data-id="${esc(c.id)}">${ic("plus", 14)}${esc(c.n)}</button>`).join("")}</div>` : "";
    const save = LG.items.some(x => (x.n || "").trim()) ? `<button class="btn block" style="margin-top:12px" data-act="comboask">${ic("heart", 18)}บันทึกเป็นมื้อประจำ</button>` : "";
    r.html = r.html.replace('<label class="f" for="lgtext"', chips + '<label class="f" for="lgtext"').replace('<label class="f" for="lgwhen">', save + '<label class="f" for="lgwhen">');
  }
  return r;
};
ACT.comboload = (a) => {
  const c = (S.combos || []).find(x => x.id === a.dataset.id); if (!c) return;
  LG.text = ($("#lgtext") || {}).value || LG.text;
  c.items.forEach(it => LG.items.push({ n: it.n, k1: it.k, q: 1, known: true }));
  rerenderSub();
};
ACT.comboask = () => {
  LG.text = ($("#lgtext") || {}).value || LG.text;
  if ((S.combos || []).length >= COMBO_MAX) { toast(`เก็บมื้อประจำได้สูงสุด ${COMBO_MAX} ชุด ลบอันเก่าก่อนนะ`); return; }
  const first = (LG.items.find(x => (x.n || "").trim()) || {}).n || "";
  openModal(`<h2>ตั้งชื่อมื้อประจำ</h2><p class="muted sm" style="margin:6px 0 10px">เช่น “กาแฟเช้า” หรือ “ข้าวกลางวันที่ออฟฟิศ”</p><input id="cbn" type="text" maxlength="16" value="${esc(first.replace(/\s*×.*$/, "").slice(0, 16))}" placeholder="ชื่อมื้อประจำ"/><div class="row" style="margin-top:14px"><button class="btn" style="flex:1" data-act="modalclose">ยกเลิก</button><button class="btn primary" style="flex:1" data-act="combosave">บันทึก</button></div>`);
};
ACT.combosave = () => {
  const n = (($("#cbn") || {}).value || "").trim(); if (!n) { toast("ใส่ชื่อก่อนนะ"); return; }
  const items = LG.items.filter(x => (x.n || "").trim()).map(x => ({ n: x.n + (x.q !== 1 ? " ×" + x.q : ""), k: Math.round(x.k1 * x.q) }));
  if (!items.length) { closeModal(); return; }
  S.combos = (S.combos || []).concat([{ id: rid(), n, items }]); save(); closeModal(); toast("เก็บเป็นมื้อประจำแล้ว"); rerenderSub();
};
SUBS.combos = () => {
  const cs = S.combos || [];
  return { title: "มื้อประจำ", html: cs.length ? `<div class="card" style="padding:4px 14px">${cs.map(c => `<div class="item"><div class="grow"><b>${esc(c.n)}</b><div class="xs muted">${c.items.map(x => esc(x.n)).join(", ")} · ${fmtN(comboKcal(c))} kcal</div></div><button class="iconbtn" data-act="combodel" data-id="${esc(c.id)}" aria-label="ลบ ${esc(c.n)}">${ic("trash", 18)}</button></div>`).join("")}</div>` : `<p class="muted" style="padding:24px 0;text-align:center">ยังไม่มีมื้อประจำ ในหน้าบันทึกอาหาร ใส่รายการแล้วกด “บันทึกเป็นมื้อประจำ”</p>` };
};
ACT.combodel = (a) => { S.combos = (S.combos || []).filter(x => x.id !== a.dataset.id); (S.del = S.del || {})["c:" + a.dataset.id] = Date.now(); save(); rerenderSub(); };
