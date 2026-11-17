/* สอนใช้แบบกดตาม: วิธีจดอาหาร (แตะ + → กินอะไรมา → พิมพ์ → ตีความ → บันทึก) */
let TUT = null, TUT_ASKED = false;
const TUT_SAMPLE = "ข้าวมันไก่ 1 จาน กับชานมไข่มุก";
const TUT_STEPS = {
  1: { sel: ".nav .fab", t: "แตะปุ่ม + ตรงกลางเพื่อเริ่มจดอาหาร", up: true },
  2: { sel: '#sheet [data-arg="food"]', t: "เลือก “กินอะไรมา”" },
  3: { sel: "#lgtext", t: "พิมพ์ว่ากินอะไรมา เหมือนเล่าให้เพื่อนฟัง เช่น ข้าวมันไก่ 1 จาน กับชานมไข่มุก", sample: true },
  4: { sel: '[data-act="lgparse"]', t: "กด “ตีความ” ให้น้องก้อนแยกรายการและประมาณแคลอรี่ให้" },
  5: { sel: '[data-act="lgsave"]', t: "ตรวจรายการ แก้จำนวนหรือตัวเลขได้ แล้วกด “บันทึก”" }
};
function tutStep() {
  if (S.meals.length > TUT.meals0) return 6;
  const sub = $("#sub"), ta = $("#lgtext");
  if (!sub.hidden) {
    if (ta && LG && LG.tab === "food") return LG.items.length ? 5 : ((ta.value || "").trim() ? 4 : 3);
    return 0;
  }
  if (!$("#modal").hidden) return 0;
  if (!$("#sheet").hidden) return $('#sheet [data-arg="food"]') ? 2 : 0;
  return 1;
}
function tutEnsure() {
  let o = $("#tut"); if (o) return o;
  o = document.createElement("div"); o.id = "tut";
  o.innerHTML = '<i class="tb t"></i><i class="tb b"></i><i class="tb l"></i><i class="tb r"></i><i class="tring"></i><div class="tbub" role="dialog" aria-live="polite"></div>';
  document.body.appendChild(o); return o;
}
function tutPlace(el, step) {
  const o = tutEnsure(), r = el.getBoundingClientRect(), pad = 7, W = innerWidth, H = innerHeight;
  const x = Math.max(0, r.left - pad), y = Math.max(0, r.top - pad), w = Math.min(W - x, r.width + pad * 2), h = Math.min(H - y, r.height + pad * 2);
  const set = (c, st) => { const e = o.querySelector(c); Object.assign(e.style, st); };
  set(".tb.t", { left: 0, top: 0, width: W + "px", height: y + "px" }); set(".tb.b", { left: 0, top: y + h + "px", width: W + "px", height: Math.max(0, H - y - h) + "px" });
  set(".tb.l", { left: 0, top: y + "px", width: x + "px", height: h + "px" }); set(".tb.r", { left: x + w + "px", top: y + "px", width: Math.max(0, W - x - w) + "px", height: h + "px" });
  set(".tring", { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
  const bub = o.querySelector(".tbub"), below = y + h / 2 < H * 0.5;
  bub.style.top = below ? Math.min(H - 150, y + h + 14) + "px" : ""; bub.style.bottom = below ? "" : Math.max(12, H - y + 14) + "px";
}
function tutRender(step) {
  const o = tutEnsure(), bub = o.querySelector(".tbub");
  if (step === 6) {
    o.classList.add("done"); o.querySelectorAll(".tb,.tring").forEach(e => e.style.display = "none"); bub.style.top = "auto"; bub.style.bottom = "110px";
    bub.innerHTML = `<b>เก่งมาก จดมื้อแรกแล้ว!</b><p>ต่อไปแตะ + หรือพิมพ์ในช่องหน้าแรกได้เลย รายการนี้เป็นตัวอย่าง จะลบก็ได้</p><div class="trow"><button class="btn sm" data-act="tutdel">ลบรายการตัวอย่าง</button><button class="btn sm primary" data-act="tutend">เสร็จแล้ว</button></div>`;
    if (!TUT.celebrated) { TUT.celebrated = true; if (typeof confetti === "function") confetti(); } return;
  }
  const st = TUT_STEPS[step], el = st && document.querySelector(st.sel);
  if (!el) { o.style.display = "none"; return; } o.style.display = "";
  o.classList.remove("done"); o.querySelectorAll(".tb,.tring").forEach(e => e.style.display = "");
  if (step >= 3) { const sc = $("#sub"); const r0 = el.getBoundingClientRect(); if (r0.bottom > innerHeight - 20 || r0.top < 60) el.scrollIntoView({ block: "center" }); }
  tutPlace(el, step);
  const dots = [1, 2, 3, 4, 5].map(i => `<i class="${i === step ? "on" : i < step ? "ok" : ""}"></i>`).join("");
  const key = step + "|" + (st.sample ? 1 : 0); if (bub.dataset.k !== key) { bub.dataset.k = key; bub.innerHTML = `<div class="thead"><span class="tdots">${dots}</span><button class="tskip" data-act="tutskip">ข้าม</button></div><p>${st.t}</p>${st.sample ? '<button class="btn sm primary" data-act="tutsample">ใส่ตัวอย่างให้</button>' : ""}`; } else bub.querySelector(".tdots").innerHTML = dots;
}
function tutTick() {
  if (!TUT) return; const step = tutStep();
  if (step === 0) { const o = $("#tut"); if (o) o.style.display = "none"; return; }
  tutRender(step);
}
function tutStart() {
  if (TUT) return; closeAllSubs && closeAllSubs(); try { closeSheet(); closeModal(); } catch (e) { }
  if (typeof show === "function") show("home");
  TUT = { meals0: S.meals.length, celebrated: false, timer: setInterval(tutTick, 250) };
  S.tut = "started"; save(); setTimeout(tutTick, 60);
}
function tutStop(mark) { if (TUT) { clearInterval(TUT.timer); TUT = null; } const o = $("#tut"); if (o) o.remove(); if (mark) { S.tut = mark; save(); } }
ACT.tutstart = () => { tutStart(); };
ACT.tutskip = () => { tutStop("skipped"); toast("ข้ามแล้ว เปิดดูใหม่ได้ที่ ตั้งค่า > สอนใช้งาน"); };
ACT.tutend = () => { tutStop("done"); };
ACT.tutdel = () => { const ids = new Set(S.meals.slice(TUT ? TUT.meals0 : S.meals.length).map(m => m.id)); S.meals = S.meals.filter(m => !ids.has(m.id)); save(); tutStop("done"); toast("ลบรายการตัวอย่างแล้ว"); if (view === "home") renderHome(); };
ACT.tutsample = () => { const ta = $("#lgtext"); if (!ta) return; ta.value = TUT_SAMPLE; if (LG) LG.text = TUT_SAMPLE; ta.dispatchEvent(new Event("input", { bubbles: true })); setTimeout(tutTick, 30); };
addEventListener("resize", () => { if (TUT) tutTick(); }); addEventListener("scroll", () => { if (TUT) tutTick(); }, true);
/* ชวนครั้งแรก: เฉพาะคนที่ยังไม่เคยจดอาหาร */
function tutInvite() {
  if (TUT_ASKED || TUT || S.tut || !S.onboarded || S.meals.length || view !== "home" || !$("#sub").hidden) return; TUT_ASKED = true;
  const o = document.createElement("div"); o.id = "tutinv";
  o.innerHTML = `<div class="tbub inv"><b>ให้น้องก้อนสอนจดอาหารมื้อแรกไหม</b><p>กดตามทีละขั้น ใช้เวลาไม่ถึง 1 นาที</p><div class="trow"><button class="btn sm" data-act="tutlater">ไว้ก่อน</button><button class="btn sm primary" data-act="tutgo">เริ่มเลย</button></div></div>`;
  document.body.appendChild(o);
}
ACT.tutgo = () => { const o = $("#tutinv"); if (o) o.remove(); tutStart(); };
ACT.tutlater = () => { const o = $("#tutinv"); if (o) o.remove(); S.tut = "later"; save(); };
const _renderHomeT = renderHome; renderHome = function () { _renderHomeT(); const nv = $(".nav"); if (nv) nv.classList.toggle("attn", !S.meals.some(m => m.d === todayKey())); if (!TUT_ASKED) setTimeout(tutInvite, 1600); };
/* ตอนเปิดแอปครั้งแรกของเซสชัน หน้าแรกถูกวาดก่อนไฟล์นี้โหลด จึงตั้งค่าซ้ำตอน load */
addEventListener("load", () => setTimeout(() => { const nv = $(".nav"); if (nv && typeof S === "object" && S) nv.classList.toggle("attn", !S.meals.some(m => m.d === todayKey())); tutInvite(); }, 1800));
