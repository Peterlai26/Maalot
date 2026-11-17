/* หน้าแรกของผู้ใช้ใหม่: ส่วนบนไล่สีม่วงชมพูแบบฝัน ตามด้วยส่วนสีครีมกับการ์ดม่วงเข้ม */
const LFEAT = [
  ["chart", "แนวโน้มน้ำหนักเฉลี่ย 7 วัน", "ตัวเลขแกว่งรายวันไม่ทำให้ตกใจ"],
  ["heart", "บันทึกอารมณ์", "แล้วดูว่าเกี่ยวกับการกินหรือเปล่า"],
  ["target", "ภารกิจเล็กๆ", "เก็บเหรียญไปแต่งตัวและตกแต่งห้อง"],
  ["mail", "จดหมายสัปดาห์จากน้องก้อน", "น้ำเสียงใจดี ไม่ตัดสิน"]
];
const LLOOKS = [
  { g: "neutral", skin: SKINS[0], hs: "ponytail", hc: "#D9A441", oc: "#F4A6C0", hat: "bow", hand: "balloon" },
  { g: "neutral", skin: SKINS[3], hs: "curly", hc: "#2E2420", oc: "#2B4A9E", hat: "crown", neck: "bowtie", shoe: "red" },
  { g: "neutral", skin: SKINS[1], hs: "short", hc: "#3FA7A0", oc: "#FFFFFF", pt: "stripes", hat: "cap", face: "sun", hand: "icecream" }
];
const LHILLS = '<svg class="lhills" viewBox="0 0 480 190" preserveAspectRatio="none" aria-hidden="true"><path d="M0 92C60 62 112 104 172 76S300 34 362 74S450 64 480 52V190H0Z" class="h1"/><path d="M0 130C70 100 122 140 202 112S340 92 402 124S462 114 480 104V190H0Z" class="h2"/><path d="M0 164C80 144 150 172 240 154S400 148 480 160V190H0Z" class="h3"/></svg>';
function landTod() { try { const v = localStorage.getItem("wl_land_tod"); if (v) return v; } catch (e) {} const h = new Date().getHours(); return h >= 5 && h < 18 ? "day" : "night"; }
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
<p class="lfine">ฟรี ไม่ต้องสมัคร เริ่มได้ในสองนาที</p>${LHILLS}</section>
<section class="lroom"><div class="lring"><div class="lroom-in">${room}</div></div></section>
${typeof GOOGLE_CLIENT_ID !== "undefined" && GOOGLE_CLIENT_ID ? '<div class="llogin"><p>มีบัญชีอยู่แล้ว เข้าสู่ระบบเพื่อดึงข้อมูลเดิมกลับมา</p><div class="gbtn" style="min-height:44px;display:flex;justify-content:center"></div></div>' : ""}
<section class="lpaper"><h2>พิมพ์เหมือนเล่าให้เพื่อนฟัง</h2><p class="lp">ไม่ต้องค้นเมนูทีละอย่าง แอปแยกรายการและประมาณพลังงานให้</p>
<div class="lplum"><div class="lin" data-t="ข้าวมันไก่ 1 จาน กับชานมไข่มุก">ข้าวมันไก่ 1 จาน กับชานมไข่มุก</div>
<div class="lrow"><span>ข้าวมันไก่</span><b>600 kcal</b></div><div class="lrow"><span>ชานมไข่มุก</span><b>400 kcal</b></div>
<div class="ltot"><span>รวมมื้อนี้</span><b>1,000 kcal</b></div><p class="lnote">แก้จำนวนและตัวเลขได้ทุกรายการ</p></div>
<ul class="lfeat">${LFEAT.map(f => `<li><span class="lchip">${ic(f[0], 20)}</span><div><b>${f[1]}</b><span>${f[2]}</span></div></li>`).join("")}</ul></section>
<section class="lblue"><h2>แต่งตัวให้น้อง ตกแต่งห้องให้ถูกใจ</h2><div class="lcast">${cast}</div><p>หมวก ทรงผม เสื้อ ของที่ถือ สัตว์เลี้ยง และของตกแต่งห้องกว่า 150 ชิ้น ได้มาจากเหรียญที่เก็บจากการจดบันทึก</p></section>
<section class="lend"><h2>สร้างตัวละครของคุณได้เลย</h2><p class="lp">สร้างตัวละคร ใส่ส่วนสูงและน้ำหนัก แล้วจดมื้อแรก ใช้เวลาไม่ถึง 2 นาที</p>
<button class="lcta dark" data-act="landgo">เริ่มจดมื้อแรก ${ic("arrow", 18)}</button>
<p class="ldisc">สำหรับผู้ใหญ่ 18 ปีขึ้นไป ใช้เป็นข้อมูลทั่วไป ไม่ใช่คำแนะนำทางการแพทย์ ถ้ามีโรคประจำตัว ตั้งครรภ์ หรือกังวลเรื่องการกิน ควรปรึกษาแพทย์</p></section>
</div>`;
  window.scrollTo(0, 0); landAnim(el);
  if (typeof acctRenderBtn === "function") acctRenderBtn();
  setTimeout(() => { const w = $(".lroom"); if (w) { w.classList.add("wave"); setTimeout(() => w.classList.remove("wave"), 3200); } }, 650);
}
ACT.landgo = () => renderOnb();
ACT.landtod = () => {
  const root = $(".land"); if (!root) return; const t = root.dataset.tod === "day" ? "night" : "day";
  root.dataset.tod = t; try { localStorage.setItem("wl_land_tod", t); } catch (e) {}
  const w = $(".lroom-in"); if (w) w.innerHTML = landRoom(t);
  const r = $(".lroom"); if (r) { r.classList.remove("wave"); void r.offsetWidth; r.classList.add("wave"); setTimeout(() => r.classList.remove("wave"), 3200); }
};

function landAnim(el) {
  const demo = $(".lplum", el), feat = $(".lfeat", el), lin = demo && $(".lin", demo);
  const calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const run = () => {
    if (calm || !lin) { demo && demo.classList.add("go"); return; }
    const t = lin.dataset.t; let i = 0; lin.textContent = ""; lin.classList.add("typing");
    const tick = () => {
      if (!lin.isConnected) return;
      lin.textContent = t.slice(0, ++i);
      if (i < t.length) setTimeout(tick, 55);
      else setTimeout(() => { lin.classList.remove("typing"); demo.classList.add("go"); }, 350);
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
