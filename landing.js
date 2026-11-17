/* หน้าแรกของผู้ใช้ใหม่: ร้านเล็กๆ ที่มีกันสาด ตัวละครยืนอยู่หน้าต่างร้าน และป้ายเมนูว่าในแอปทำอะไรได้บ้าง */
const BOARD = [
  ["พิมพ์ว่ากินอะไร", "แอปแยกรายการและประมาณแคลอรี่ให้ แก้ตัวเลขเองได้"],
  ["ดูแนวโน้มน้ำหนัก", "เฉลี่ย 7 วัน ตัวเลขแกว่งรายวันไม่ทำให้ตกใจ"],
  ["เล่าอารมณ์วันนี้", "ดูว่าอารมณ์เกี่ยวกับการกินหรือเปล่า"],
  ["ทำภารกิจเล็กๆ", "เก็บเหรียญไปแต่งตัวและตกแต่งห้องให้น้อง"],
  ["อ่านจดหมายสัปดาห์", "น้องสรุปให้ด้วยน้ำเสียงใจดี ไม่ตัดสิน"]
];
const BUN = '<svg class="bunbul" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 15c0-6 4-10 9-10s9 4 9 10c0 3-4 5-9 5s-9-2-9-5Z" fill="#fff" stroke="#1F1915" stroke-width="1.8"/><path d="M12 5.4c-.3 1.4-.8 2.2-1.6 3M12 5.4c.3 1.4.8 2.2 1.6 3" stroke="#1F1915" stroke-width="1.4" stroke-linecap="round" fill="none"/></svg>';
function renderLanding() {
  const el = $("#onb"); el.hidden = false; $("#app").hidden = true; $(".nav").hidden = true; el.classList.add("shopwall");
  const room = scene({ look: S.look, mood: "happy", rx: 46, period: "noon", owned: {}, room: ROOM_DEFAULT, l1: "สวัสดีนะ", l2: "กินอะไรมาบ้าง" });
  el.innerHTML = `<div class="inner land">
<div class="lawn" aria-hidden="true"></div>
<div class="lsign"><span class="lsign-name">Maalot</span><span class="lsign-th">มาลด</span></div>
<div class="lwin"><div class="lwin-in">${room}</div><span class="ltag">ใช้เวลา<br>2 นาที</span></div>
<h1 class="lhead">มื้อนี้กินอะไรมา<br>บอกน้องก้อนได้เลย</h1>
<p class="lsub">พิมพ์เป็นประโยคธรรมดา เดี๋ยวน้องจดและประมาณแคลอรี่ให้ ไม่ต้องนับเอง และไม่มีใครตัดสิน</p>
<button class="lcta" data-act="landgo">เริ่มจดมื้อแรก</button>
<p class="lfine">ฟรี ไม่ต้องสมัคร ข้อมูลอยู่ในเครื่องของคุณ</p>
${typeof GOOGLE_CLIENT_ID !== "undefined" && GOOGLE_CLIENT_ID ? '<div class="llogin"><p>มีบัญชีอยู่แล้ว เข้าสู่ระบบเพื่อดึงข้อมูลเดิมกลับมา</p><div class="gbtn" style="min-height:44px;display:flex;justify-content:center"></div></div>' : ""}
<section class="lboard" aria-label="ในแอปมีอะไรบ้าง"><h2>ในแอปมีอะไรบ้าง</h2>${BOARD.map(r => `<div class="lrow">${BUN}<div><b>${r[0]}</b><span>${r[1]}</span></div></div>`).join("")}</section>
<ol class="lsteps"><li>สร้างตัวละคร</li><li>ใส่ส่วนสูงและน้ำหนัก</li><li>จดมื้อแรก</li></ol>
<p class="ldisc">สำหรับผู้ใหญ่ 18 ปีขึ้นไป ใช้เป็นข้อมูลทั่วไป ไม่ใช่คำแนะนำทางการแพทย์ ถ้ามีโรคประจำตัว ตั้งครรภ์ หรือกังวลเรื่องการกิน ควรปรึกษาแพทย์</p>
</div>`;
  window.scrollTo(0, 0);
  if (typeof acctRenderBtn === "function") acctRenderBtn();
  setTimeout(() => { const w = $(".lwin"); if (w) { w.classList.add("wave"); setTimeout(() => w.classList.remove("wave"), 3200); } }, 650);
}
ACT.landgo = () => renderOnb();
