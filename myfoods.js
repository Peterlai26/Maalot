/* อาหารของฉัน: ขนมซองหรืออาหารที่มีแคลอรี่บนฉลาก ใส่ครั้งเดียวแล้วจำไว้ + ถ่ายรูปฉลากให้ AI อ่านค่าให้ */
const MYF_MAX = 100;
let MYF = null;
const myfNum = v => { const x = parseFloat(v); return isFinite(x) && x >= 0 ? x : null; };
function myfForm() {
  const m = MYF, v = (k) => m[k] === null || m[k] === undefined ? "" : esc(m[k]);
  const ni = (id, lab, k, ph) => `<label class="xs muted" style="display:block">${lab}<input id="${id}" type="number" inputmode="decimal" step="any" min="0" placeholder="${ph || ""}" value="${v(k)}" style="min-height:40px;padding:6px 10px"/></label>`;
  return `<h2>${m.id ? "แก้อาหารของฉัน" : "เพิ่มจากฉลาก"}</h2>
<button class="btn block" style="margin:8px 0 6px" data-act="myfshoot">${ic("camera", 18)}ถ่ายรูปฉลากให้ AI อ่านค่า</button>
${m.msg ? `<p class="xs muted" style="margin:0 0 8px">${esc(m.msg)}</p>` : '<p class="xs muted" style="margin:0 0 8px">หรือพิมพ์ตัวเลขจากฉลากเองก็ได้ ค่าต่อ “1 หน่วยบริโภค”</p>'}
<label class="xs muted" style="display:block">ชื่อ (เช่น สาหร่ายทอดกรอบ)<input id="myn" type="text" maxlength="30" value="${v("n")}" style="min-height:40px;padding:6px 10px"/></label>
<div class="grid2" style="margin-top:8px;gap:8px">${ni("myk", "พลังงาน (kcal) ต่อ 1 หน่วยบริโภค", "k", "เช่น 90")}${ni("mynp", "มีกี่หน่วยบริโภคต่อซอง", "np", "1")}</div>
<details style="margin-top:8px"${m.p !== null && m.p !== undefined ? " open" : ""}><summary class="xs muted" style="cursor:pointer;padding:6px 0">ใส่โภชนาการอื่นๆ (ไม่บังคับ)</summary><div class="grid2" style="gap:8px">${ni("myp", "โปรตีน (g)", "p")}${ni("myc", "คาร์บ (g)", "c")}${ni("myf", "ไขมัน (g)", "f")}${ni("myfb", "ใยอาหาร (g)", "fb")}${ni("mysg", "น้ำตาล (g)", "sg")}${ni("myna", "โซเดียม (mg)", "na")}</div></details>
<p class="xs muted" style="margin:8px 0 12px">แอปจะบันทึกเป็น “1 ซอง” (คูณจำนวนหน่วยบริโภคให้) กินครึ่งซองก็ปรับจำนวนเป็น 0.5 ได้</p>
<div class="row"><button class="btn" style="flex:1" data-act="modalclose">ยกเลิก</button><button class="btn primary" style="flex:1" data-act="myfsave">บันทึก</button></div>`;
}
function myfRead() {
  if (!MYF) return; const g = id => { const e = $("#" + id); return e ? e.value : ""; };
  MYF.n = g("myn"); MYF.k = myfNum(g("myk")); MYF.np = myfNum(g("mynp"));
  [["p", "myp"], ["c", "myc"], ["f", "myf"], ["fb", "myfb"], ["sg", "mysg"], ["na", "myna"]].forEach(([a, id]) => { if ($("#" + id)) MYF[a] = myfNum(g(id)); });
}
const myfShow = () => { openModal(myfForm()); };
ACT.myfadd = () => { if ((S.myfoods || []).length >= MYF_MAX) { toast("เก็บอาหารของฉันได้สูงสุด " + MYF_MAX + " รายการ ลบอันเก่าก่อนนะ"); return; } if (LG) LG.text = ($("#lgtext") || {}).value || LG.text; MYF = { id: null, n: "", k: null, np: 1, p: null, c: null, f: null, fb: null, sg: null, na: null }; myfShow(); };
ACT.myfedit = (a) => {
  const m = (S.myfoods || []).find(x => x.id === a.dataset.id); if (!m) return; const np = m.np || 1, d = x => x === undefined ? null : Math.round(x / np * 10) / 10;
  MYF = { id: m.id, n: m.n, k: Math.round(m.k / np * 10) / 10, np, p: d(m.p), c: d(m.c), f: d(m.f), fb: d(m.fb), sg: d(m.sg), na: d(m.na) }; myfShow();
};
ACT.myfshoot = () => { myfRead(); const i = $("#photoLabel"); i.value = ""; i.click(); };
async function myfLabel(file) {
  if (!MYF || !file) return; myfRead(); MYF.msg = "กำลังอ่านฉลาก…"; myfShow();
  try {
    const blob = await shrinkImage(file), api = estApi(); if (!api) throw new Error("nosample");
    let resp; try { resp = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: await blobB64(blob), mime: blob.type || "image/jpeg", label: true }) }); } catch (e) { throw new Error("net"); }
    const j = await resp.json().catch(() => ({})); if (!resp.ok || !j.label) throw new Error(j.error === "limit" || j.error === "busy" ? j.error : "parse");
    const L = j.label; if (!MYF) return;
    if (L.name && !MYF.n) MYF.n = L.name; if (L.kcal !== null) MYF.k = L.kcal; if (L.servingsPerPack) MYF.np = L.servingsPerPack;
    ["protein:p", "carb:c", "fat:f", "fiber:fb", "sugar:sg", "sodium:na"].forEach(s => { const [a, b] = s.split(":"); if (L[a] !== null) MYF[b] = L[a]; });
    MYF.msg = L.kcal === null ? "อ่านพลังงานไม่ได้ ลองถ่ายให้ชัดขึ้น หรือพิมพ์เอง" : "อ่านได้แล้ว ตรวจตัวเลขกับซองอีกครั้งนะ เพราะ AI อาจอ่านผิดได้";
  } catch (e) { if (MYF) MYF.msg = e.message === "limit" || e.message === "busy" || e.message === "net" ? estMsg(e, true) : "อ่านฉลากไม่ได้ พิมพ์ตัวเลขเองได้เลย"; }
  if (MYF) myfShow();
}
$("#photoLabel").addEventListener("change", e => { const f = e.target.files && e.target.files[0]; if (f) myfLabel(f); });
ACT.myfsave = () => {
  myfRead(); const m = MYF; if (!m) return; const n = (m.n || "").trim();
  if (!n) { toast("ใส่ชื่อก่อนนะ"); return; } if (!(m.k > 0)) { toast("ใส่พลังงาน (kcal) ต่อหน่วยบริโภคก่อนนะ"); return; }
  const np = m.np > 0 ? m.np : 1, rec = { id: m.id || rid(), n, k: Math.round(m.k * np), np };
  ["p", "c", "f", "fb", "sg", "na"].forEach(a => { if (m[a] !== null && m[a] !== undefined) rec[a] = Math.round(m[a] * np * 10) / 10; });
  S.myfoods = S.myfoods || []; const i = S.myfoods.findIndex(x => x.id === rec.id);
  if (i >= 0) S.myfoods[i] = rec; else S.myfoods.push(rec);
  save(); closeModal(); MYF = null;
  if (LG && LG.tab === "food" && i < 0) { LG.items.push(withNutr(Object.assign({ n: rec.n, k1: rec.k, q: 1, known: true, my: rec.id }, rec.p !== undefined ? { p: rec.p, c: rec.c || 0, f: rec.f || 0, fb: rec.fb || 0, sg: rec.sg || 0, na: rec.na || 0 } : {}))); toast("เก็บไว้และเพิ่มในรายการแล้ว"); }
  else toast("บันทึกแล้ว");
  if ($("#sub") && !$("#sub").hidden) rerenderSub();
};
ACT.mypick = (a) => {
  const m = (S.myfoods || []).find(x => x.id === a.dataset.id); if (!m || !LG) return; LG.text = ($("#lgtext") || {}).value || LG.text;
  LG.items.push(withNutr(Object.assign({ n: m.n, k1: m.k, q: 1, known: true, my: m.id }, m.p !== undefined ? { p: m.p, c: m.c || 0, f: m.f || 0, fb: m.fb || 0, sg: m.sg || 0, na: m.na || 0 } : {}))); rerenderSub();
};
ACT.myfdel = (a) => { S.myfoods = (S.myfoods || []).filter(x => x.id !== a.dataset.id); (S.del = S.del || {})["f:" + a.dataset.id] = Date.now(); save(); rerenderSub(); };
/* หน้าบันทึกอาหาร: แถวอาหารของฉัน + ปุ่มเพิ่มจากฉลาก */
const _logSub4 = SUBS.log;
SUBS.log = (arg) => {
  const r = _logSub4(arg);
  if (LG && LG.tab === "food") {
    const my = S.myfoods || [];
    const chips = my.length ? `<div class="sec" style="margin:0 0 6px">อาหารของฉัน แตะเพื่อเพิ่ม <button class="linkbtn" data-act="sub" data-n="myfoods">จัดการ</button></div><div class="logchips" style="margin:0 0 10px">${my.slice(-6).reverse().map(m => `<button class="chip" data-act="mypick" data-id="${esc(m.id)}">${ic("plus", 14)}${esc(m.n)} · ${fmtN(m.k)}</button>`).join("")}</div>` : "";
    const btn = `<button class="btn" data-act="myfadd">${ic("plus", 18)}ขนมซอง/จากฉลาก</button>`;
    r.html = r.html.replace('<label class="f" for="lgtext"', chips + '<label class="f" for="lgtext"').replace('<button class="btn" data-act="lgadd">', btn + '<button class="btn" data-act="lgadd">');
  }
  return r;
};
const _lgSearch = lgSearch;
lgSearch = (q) => {
  _lgSearch(q); const box = $("#lgres"); if (!box) return; const n = skel(q || ""); if (!n) return;
  const hit = (S.myfoods || []).filter(m => skel(m.n).indexOf(n) > -1).slice(0, 4);
  if (hit.length) { const h = hit.map(m => `<button class="chip" data-act="mypick" data-id="${esc(m.id)}">${ic("plus", 14)}${esc(m.n)} · ${fmtN(m.k)} (ของฉัน)</button>`).join(""); box.innerHTML = h + (box.querySelector(".chip") ? box.innerHTML : ""); }
};
SUBS.myfoods = () => {
  const my = S.myfoods || [];
  return { title: "อาหารของฉัน", html: (my.length ? `<div class="card" style="padding:4px 14px">${my.map(m => `<div class="item"><div class="grow"><b>${esc(m.n)}</b><div class="xs muted">${fmtN(m.k)} kcal ต่อ 1 ซอง${m.p !== undefined ? ` · โปรตีน ${fmtN(Math.round(m.p))} คาร์บ ${fmtN(Math.round(m.c || 0))} ไขมัน ${fmtN(Math.round(m.f || 0))} g` : ""}</div></div><button class="iconbtn" data-act="myfedit" data-id="${esc(m.id)}" aria-label="แก้ ${esc(m.n)}">${ic("settings", 18)}</button><button class="iconbtn" data-act="myfdel" data-id="${esc(m.id)}" aria-label="ลบ ${esc(m.n)}">${ic("trash", 18)}</button></div>`).join("")}</div>` : `<p class="muted" style="padding:24px 0;text-align:center">ยังไม่มีอาหารของฉัน ในหน้าบันทึกอาหารกด “ขนมซอง/จากฉลาก” เพื่อเพิ่ม</p>`) + `<button class="btn primary block" style="margin-top:14px" data-act="myfadd">${ic("plus", 18)}เพิ่มอาหารใหม่</button>` };
};
