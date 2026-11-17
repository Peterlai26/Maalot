/* ลากชิปเมนู (หน้าแรก) ไปด้านข้างเพื่อลบ: ไอคอนเปลี่ยนเป็นถังขยะเมื่อถึงระยะ ปล่อยแล้วลบ มี “เลิกทำ” */
let CD = null, NOCLICK = 0;
const CD_ARM = 70;
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
document.addEventListener("pointerdown", e => {
  const el = e.target.closest && e.target.closest("[data-drag]"); if (!el || (e.pointerType === "mouse" && e.button !== 0)) return;
  CD = { el, x: e.clientX, y: e.clientY, moved: false, armed: false };
});
document.addEventListener("pointermove", e => {
  if (!CD) return; const dx = e.clientX - CD.x, dy = e.clientY - CD.y;
  if (!CD.moved) { if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { CD = null; return; } if (Math.abs(dx) < 8) return; CD.moved = true; CD.el.classList.add("dragging"); try { CD.el.setPointerCapture(e.pointerId); } catch (_) { } }
  CD.el.style.transform = `translateX(${dx}px) rotate(${(dx / 40).toFixed(1)}deg)`;
  const arm = Math.abs(dx) >= CD_ARM; if (arm !== CD.armed) { CD.armed = arm; CD.el.classList.toggle("arm", arm); const ci = CD.el.querySelector(".ci"); if (ci) ci.innerHTML = arm ? ic("trash", 16) : ic(ci.dataset.ic, ci.dataset.ic === "plus" ? 14 : 16); if (arm && navigator.vibrate) navigator.vibrate(12); }
});
function cdEnd() {
  if (!CD) return; const c = CD; CD = null; if (!c.moved) return; NOCLICK = Date.now(); c.el.classList.remove("dragging");
  if (c.armed) { const dir = parseFloat(c.el.style.transform.replace("translateX(", "")) < 0 ? -1 : 1; c.el.classList.add("gone"); c.el.style.transform = `translateX(${dir * 320}px) rotate(${dir * 12}deg)`; setTimeout(() => cdRemove(c.el.dataset.drag, c.el.dataset.id), 180); }
  else { c.el.style.transform = ""; }
}
document.addEventListener("pointerup", cdEnd); document.addEventListener("pointercancel", cdEnd);
document.addEventListener("click", e => { if (Date.now() - NOCLICK < 450 && e.target.closest && e.target.closest("[data-drag]")) { e.stopPropagation(); e.preventDefault(); } }, true);
