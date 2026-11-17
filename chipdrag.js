/* ชิปเมนู (หน้าแรก): เรียงเป็นแถวเดียวเลื่อนไปด้านข้าง กดค้างที่ชิปแล้วลากไปที่ปุ่ม + ปุ่มจะกลายเป็นถังขยะ ปล่อยเพื่อลบ มี “เลิกทำ” */
let CD = null, NOCLICK = 0;
const CD_HOLD = 260, CD_RANGE = 78;
function toastUndo(msg, fn) {
  document.querySelectorAll(".toast.undo").forEach(t => t.remove());
  const t = document.createElement("div"); t.className = "toast undo"; t.innerHTML = `<span>${esc(msg)}</span><button type="button">เลิกทำ</button>`;
  t.querySelector("button").onclick = () => { fn(); t.remove(); }; document.body.appendChild(t); setTimeout(() => t.remove(), 6500);
}
function cdRefresh() { if (typeof view !== "undefined" && view === "home" && !subStack.length) renderHome(); else if (typeof refresh === "function") refresh(); }
function cdRemove(kind, id) {
  S.del = S.del || {};
  if (kind === "meal" || kind === "work") {
    const key = kind === "meal" ? "meals" : "works", pre = kind === "meal" ? "m:" : "k:", i = S[key].findIndex(x => x.id === id); if (i < 0) return;
    const item = S[key][i]; S[key].splice(i, 1); S.del[pre + id] = Date.now(); save();
    toastUndo(`ลบ “${item.n}” แล้ว`, () => { S[key].splice(Math.min(i, S[key].length), 0, item); delete S.del[pre + id]; save(); cdRefresh(); });
  } else if (kind === "combo") {
    const i = (S.combos || []).findIndex(x => x.id === id); if (i < 0) return;
    const item = S.combos[i]; S.combos.splice(i, 1); S.del["c:" + id] = Date.now(); save();
    toastUndo(`ลบมื้อประจำ “${item.n}” แล้ว`, () => { S.combos.splice(Math.min(i, S.combos.length), 0, item); delete S.del["c:" + id]; save(); cdRefresh(); });
  }
  cdRefresh();
}
const fabEl = () => document.querySelector(".nav .fab");
function fabTrash(on) {
  const f = fabEl(); if (!f) return;
  if (on && !f.classList.contains("trash")) { f.dataset.h = f.innerHTML; f.innerHTML = ic("trash", 28) + '<span class="fl">ลบ</span>'; f.classList.add("trash"); }
  if (!on && f.classList.contains("trash")) { f.innerHTML = f.dataset.h || f.innerHTML; f.classList.remove("trash", "hot"); delete f.dataset.h; }
}
function cdLift() {
  if (!CD) return; const el = CD.el, r = el.getBoundingClientRect(); CD.drag = true; CD.r = r;
  const cl = el.cloneNode(true); cl.removeAttribute("data-act"); cl.classList.add("lifted"); Object.assign(cl.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
  document.body.appendChild(cl); CD.clone = cl; el.classList.add("ghost"); document.body.classList.add("chip-drag"); fabTrash(true);
  try { el.setPointerCapture(CD.pid); } catch (_) { } if (navigator.vibrate) navigator.vibrate(15);
  cdMove(CD.lx, CD.ly);
}
function cdMove(x, y) {
  if (!CD || !CD.drag) return; CD.lx = x; CD.ly = y;
  CD.clone.style.transform = `translate(${x - CD.x}px, ${y - CD.y}px) scale(1.08)`;
  const f = fabEl(); if (!f) return; const b = f.getBoundingClientRect(), d = Math.hypot(x - (b.left + b.width / 2), y - (b.top + b.height / 2)), hot = d < CD_RANGE;
  if (hot !== !!CD.hot) { CD.hot = hot; f.classList.toggle("hot", hot); CD.clone.classList.toggle("arm", hot); if (hot && navigator.vibrate) navigator.vibrate(10); }
}
function cdEnd() {
  if (!CD) return; const c = CD; CD = null; clearTimeout(c.timer); if (!c.drag) return; NOCLICK = Date.now();
  const f = fabEl(), fb = f && f.getBoundingClientRect(), cl = c.clone;
  document.body.classList.remove("chip-drag"); c.el.releasePointerCapture && (() => { try { c.el.releasePointerCapture(c.pid); } catch (_) { } })();
  cl.classList.add("dropping");
  if (c.hot && fb) { cl.style.transform = `translate(${fb.left + fb.width / 2 - c.x}px, ${fb.top + fb.height / 2 - c.y}px) scale(.15)`; cl.style.opacity = "0"; setTimeout(() => { cl.remove(); fabTrash(false); cdRemove(c.el.dataset.drag, c.el.dataset.id); }, 230); }
  else { cl.style.transform = "translate(0,0) scale(1)"; setTimeout(() => { cl.remove(); c.el.classList.remove("ghost"); fabTrash(false); }, 220); }
}
document.addEventListener("pointerdown", e => {
  const el = e.target.closest && e.target.closest("[data-drag]"); if (!el || (e.pointerType === "mouse" && e.button !== 0)) return;
  CD = { el, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, pid: e.pointerId, drag: false, hot: false, timer: setTimeout(cdLift, CD_HOLD) };
});
document.addEventListener("pointermove", e => {
  if (!CD) return;
  if (!CD.drag) { if (Math.hypot(e.clientX - CD.x, e.clientY - CD.y) > 10) { clearTimeout(CD.timer); CD = null; } return; }
  cdMove(e.clientX, e.clientY);
});
document.addEventListener("pointerup", cdEnd); document.addEventListener("pointercancel", cdEnd);
document.addEventListener("touchmove", e => { if (CD && CD.drag) e.preventDefault(); }, { passive: false });
document.addEventListener("contextmenu", e => { if (e.target.closest && e.target.closest("[data-drag]")) e.preventDefault(); });
document.addEventListener("click", e => { if (Date.now() - NOCLICK < 450 && e.target.closest && e.target.closest("[data-drag]")) { e.stopPropagation(); e.preventDefault(); } }, true);
