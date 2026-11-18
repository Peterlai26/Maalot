/* หน้าแรกของผู้ใช้ใหม่: ส่วนบนไล่สีม่วงชมพูแบบฝัน ตามด้วยส่วนสีครีมกับการ์ดม่วงเข้ม */
const LFEAT = [
  ["chart", "แนวโน้มน้ำหนักเฉลี่ย 7 วัน", "ตัวเลขแกว่งรายวันไม่ทำให้ตกใจ"],
  ["heart", "บันทึกอารมณ์", "แล้วดูว่าเกี่ยวกับการกินหรือเปล่า"],
  ["target", "ภารกิจเล็กๆ", "เก็บเหรียญไปแต่งตัวและตกแต่งห้อง"],
  ["mail", "จดหมายสัปดาห์จากน้องก้อน", "น้ำเสียงใจดี ไม่ตัดสิน"]
];
const LTRY = ["ส้มตำ ไก่ย่าง ข้าวเหนียว", "กาแฟเย็น 2 แก้ว", "ราดหน้า"];
const LLOOKS = [
  { g: "neutral", skin: "#FBD9BE", hs: "ponytail", hc: "#D9A441", oc: "#F4A6C0", hat: "bow", hand: "balloon" },
  { g: "neutral", skin: "#C68B63", hs: "curly", hc: "#2E2420", oc: "#2B4A9E", hat: "crown", neck: "bowtie", shoe: "red" },
  { g: "neutral", skin: "#F3C9A8", hs: "short", hc: "#3FA7A0", oc: "#FFFFFF", pt: "stripes", hat: "cap", face: "sun", hand: "icecream" }
];
const LHILLS = '<svg class="lhills" viewBox="0 0 480 190" preserveAspectRatio="none" aria-hidden="true"><path d="M0 92C60 62 112 104 172 76S300 34 362 74S450 64 480 52V190H0Z" class="h1"/><path d="M0 130C70 100 122 140 202 112S340 92 402 124S462 114 480 104V190H0Z" class="h2"/><path d="M0 164C80 144 150 172 240 154S400 148 480 160V190H0Z" class="h3"/></svg>';
function landTod() { return "day"; } /* หน้าเริ่มต้นเป็นธีมสว่างเสมอ */
function landRoom(t) { return scene({ look: S.look, mood: "happy", rx: 46, period: t === "day" ? "morning" : "night", owned: {}, room: ROOM_DEFAULT, l1: "สวัสดีนะ", l2: "กินอะไรมาบ้าง" }); }
function renderLanding() {
  const tod = landTod();
  const el = $("#onb"); el.hidden = false; $("#app").hidden = true; $(".nav").hidden = true; el.classList.add("dream");
  const room = landRoom(tod);
  const cast = LLOOKS.map(L => `<svg viewBox="-92 -248 184 262" role="img" aria-label="ตัวละครตัวอย่าง">${figure(L, "happy", 46)}</svg>`).join("");
  el.innerHTML = `<div class="inner land" data-tod="${tod}">
<section class="lhero"><div class="lclouds" aria-hidden="true"><i></i><i></i><i></i></div>
<div class="lbrand"><img src="logo.svg" width="38" height="38" alt=""><span>Maalot</span>
<button class="ltod" data-act="landtod" aria-label="สลับโหมดเช้าและกลางคืน"><i class="ts">${ic("sun", 15)}</i><i class="tm">${ic("moon", 15)}</i><b></b></button></div>
<h1 class="lhead">มื้อนี้กินอะไรมา<br>บอกน้องก้อนได้เลย</h1>
<p class="lsub">พิมพ์เป็นประโยคธรรมดา น้องจดและประมาณแคลอรี่ให้<br>ไม่ต้องนับเอง ไม่มีใครตัดสิน</p>
<button class="lcta" data-act="landgo">เริ่มจดมื้อแรก ${ic("arrow", 18)}</button>
<p class="lfine">สมัครสมาชิกฟรี ใช้เวลาไม่ถึงนาที แล้วสร้างตัวละครได้เลย</p>${isApp() ? "" : `<button class="linst" data-act="pwa">${ic("phone", 16)}${isAndroidWeb() ? "ดาวน์โหลดแอปสำหรับ Android (.apk)" : "ติดตั้งเป็นแอปบนมือถือ"}</button>`}<button class="linst lacct" data-act="acctopen">${ic("user", 16)}มีบัญชีแล้ว? เข้าสู่ระบบ</button>${LHILLS}</section>
<section class="lroom"><div class="lring"><div class="lroom-in">${room}</div></div></section>

<section class="lpaper"><h2>พิมพ์เหมือนเล่าให้เพื่อนฟัง</h2><p class="lp">ไม่ต้องค้นเมนูทีละอย่าง แอปแยกรายการและประมาณพลังงานให้</p>
<div class="lplum"><div class="lin" data-t="ข้าวมันไก่ 1 จาน กับชานมไข่มุก">ข้าวมันไก่ 1 จาน กับชานมไข่มุก</div>
<div class="lrows"></div>
<div class="lsum"><svg viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="34" class="lbg"/><circle cx="42" cy="42" r="34" class="lfg" pathLength="100"/></svg><div><span>รวมมื้อนี้</span><p><b class="lnum">0</b> kcal</p><small class="lpct"></small></div></div>
<p class="lnote">แก้จำนวนและตัวเลขได้ทุกรายการในแอป</p>
<form class="ltry" autocomplete="off"><label for="ltryin">ลองพิมพ์อาหารของคุณเอง</label><div class="ltryrow"><input id="ltryin" type="text" placeholder="เช่น ส้มตำ ไก่ย่าง ข้าวเหนียว" maxlength="80" enterkeyhint="go"><button type="submit" class="ltrybtn">ลอง</button></div>
<div class="ltrychips">${LTRY.map(t => `<button type="button" data-act="landtry" data-t="${t}">${t}</button>`).join("")}</div></form></div>
<ul class="lfeat">${LFEAT.map(f => `<li><span class="lchip">${ic(f[0], 20)}</span><div><b>${f[1]}</b><span>${f[2]}</span></div></li>`).join("")}</ul></section>
<section class="lblue"><h2>แต่งตัวให้น้อง ตกแต่งห้องให้ถูกใจ</h2><div class="lcast">${cast}</div><p>หมวก ทรงผม เสื้อ ของที่ถือ สัตว์เลี้ยง และของตกแต่งห้องกว่า 150 ชิ้น ได้มาจากเหรียญที่เก็บจากการจดบันทึก</p></section>
<section class="lend"><h2>สร้างตัวละครของคุณได้เลย</h2><p class="lp">สมัครสมาชิก สร้างตัวละคร ใส่ส่วนสูงและน้ำหนัก แล้วจดมื้อแรก ใช้เวลาไม่ถึง 3 นาที</p>
<button class="lcta dark" data-act="landgo">เริ่มจดมื้อแรก ${ic("arrow", 18)}</button>
<p class="ldisc">สำหรับผู้ใหญ่ 18 ปีขึ้นไป ใช้เป็นข้อมูลทั่วไป ไม่ใช่คำแนะนำทางการแพทย์ ถ้ามีโรคประจำตัว ตั้งครรภ์ หรือกังวลเรื่องการกิน ควรปรึกษาแพทย์</p></section>
</div>`;
  window.scrollTo(0, 0); landAnim(el);
  if (typeof acctRenderBtn === "function") acctRenderBtn();
  setTimeout(() => { const w = $(".lroom"); if (w) { w.classList.add("wave"); setTimeout(() => w.classList.remove("wave"), 3200); } }, 650);
}
/* ด่านสมัครสมาชิก: ต้องมีบัญชี (สมัครหรือเข้าสู่ระบบ) ก่อนถึงขั้นสร้างตัวละครและแต่งตัว ข้ามไม่ได้ */
/* พรีวิวของ Cloudflare Pages (xxxx.maalot-2jx.pages.dev) เป็นโดเมนใหม่ทุกครั้งและเซิร์ฟเวอร์สมัครสมาชิกไม่อนุญาตโดเมนเหล่านี้
   จึงข้ามด่านสมัครให้เพื่อใช้ทดสอบได้เลย โดเมนจริง (maalot-2jx.pages.dev) ยังบังคับสมัครตามเดิม */
const isPreviewHost = () => /\.maalot-2jx\.pages\.dev$/.test(location.hostname);
function startOnb() {
  if ((typeof loggedIn === "function" && loggedIn()) || isPreviewHost()) { renderOnb(); return; }
  ACC = { mode: "register", busy: false, err: "", gate: true, pop: true, id: ACC.id };
  openGate();
}
ACT.landgo = () => startOnb();
ACT.landtod = () => { return;
  /* ปิดการสลับกลางคืนไว้ */
  const root = $(".land"); if (!root) return; const t = root.dataset.tod === "day" ? "night" : "day";
  root.dataset.tod = t; try { localStorage.setItem("wl_land_tod", t); } catch (e) {}
  const w = $(".lroom-in"); if (w) w.innerHTML = landRoom(t);
  const r = $(".lroom"); if (r) { r.classList.remove("wave"); void r.offsetWidth; r.classList.add("wave"); setTimeout(() => r.classList.remove("wave"), 3200); }
};

const LGOAL = 2000;
function landCount(el, to) {
  cancelAnimationFrame(el._raf); const calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const from = +el.dataset.v || 0; el.dataset.v = to;
  if (calm) { el.textContent = Math.round(to).toLocaleString("en-US"); return; }
  const t0 = performance.now(), d = 800;
  const step = now => { const p = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(from + (to - from) * e).toLocaleString("en-US"); if (p < 1 && el.isConnected) el._raf = requestAnimationFrame(step); };
  el._raf = requestAnimationFrame(step);
}
function landShow(text) {
  const demo = $(".lplum"); if (!demo) return false;
  const items = parseFood(text).slice(0, 6); if (!items.length) return false;
  let tot = 0;
  $(".lrows", demo).innerHTML = items.map((it, i) => {
    const kc = Math.round(it.k1 * it.q); if (it.known) tot += kc;
    const q = it.q !== 1 ? ` × ${it.q}` : "";
    return `<div class="lrow" style="animation-delay:${(i * .28 + .05).toFixed(2)}s"><span>${esc(it.n)}${q}</span>${it.known ? `<b>${kc.toLocaleString("en-US")} kcal</b>` : `<b class="unk">ใส่เองในแอป</b>`}</div>`;
  }).join("");
  const pct = Math.min(100, Math.round(tot / LGOAL * 100));
  demo.classList.add("go");
  const fg = $(".lfg", demo); fg.style.strokeDashoffset = 100; void fg.getBoundingClientRect(); fg.style.strokeDashoffset = 100 - pct;
  landCount($(".lnum", demo), tot);
  $(".lpct", demo).textContent = tot ? `ราว ${pct}% ของพลังงานต่อวัน (อ้างอิง ${LGOAL.toLocaleString("en-US")} kcal)` : "ยังไม่รู้จักเมนูนี้ ในแอปใส่แคลอรี่เองได้";
  return true;
}
function landAnim(el) {
  const demo = $(".lplum", el), feat = $(".lfeat", el), lin = demo && $(".lin", demo);
  const calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const form = $(".ltry", el);
  if (form) form.onsubmit = e => { e.preventDefault(); landTry($("#ltryin").value); };
  const run = () => {
    if (calm || !lin) { landShow(lin.dataset.t); return; }
    const t = lin.dataset.t; let i = 0; lin.textContent = ""; lin.classList.add("typing");
    const tick = () => {
      if (!lin.isConnected || demo.dataset.user) return;
      lin.textContent = t.slice(0, ++i);
      if (i < t.length) setTimeout(tick, 55);
      else setTimeout(() => { lin.classList.remove("typing"); if (!demo.dataset.user) landShow(t); }, 350);
    };
    tick();
  };
  if (!("IntersectionObserver" in window)) { run(); feat && feat.classList.add("in"); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    if (e.target === demo) run(); else e.target.classList.add("in");
  }), { threshold: .35 });
  demo && io.observe(demo); feat && io.observe(feat);
}
function landTry(text) {
  text = (text || "").trim(); const demo = $(".lplum"); if (!demo) return;
  if (!text) { toast("พิมพ์อาหารที่กินก่อนนะ"); return; }
  demo.dataset.user = "1"; const lin = $(".lin", demo); lin.classList.remove("typing"); lin.textContent = text;
  landShow(text);
}
ACT.landtry = a => { const t = a.dataset.t; $("#ltryin").value = t; landTry(t); };
