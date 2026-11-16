/* หน้าแรกสำหรับผู้ใช้ใหม่ ก่อนเข้าขั้นสร้างตัวละคร */
function renderLanding() {
  const el = $("#onb"); el.hidden = false; $("#app").hidden = true; $(".nav").hidden = true;
  const feats = [
    ["bowl", "พิมพ์แล้วจดให้", "เขียนว่า ข้าวมันไก่ แล้วก็ชานม แอปช่วยแยกเป็นรายการและประมาณพลังงานให้"],
    ["chart", "ดูแนวโน้มจริงๆ", "กราฟน้ำหนักเฉลี่ย 7 วัน ดูภาพรวมได้โดยไม่ต้องกังวลกับตัวเลขที่แกว่งรายวัน"],
    ["user", "ตัวละครของคุณ", "ตัวละครมีรูปร่างตามคุณ แต่งตัวได้ และได้เหรียญจากการทำภารกิจเล็กๆ"],
    ["mail", "จดหมายประจำสัปดาห์", "สรุปสัปดาห์ที่ผ่านมาด้วยน้ำเสียงอบอุ่น ไม่ตัดสิน ไม่กดดัน"]
  ];
  const steps = [["สร้างตัวละคร", "เลือกหน้าตาที่ชอบ"], ["กรอกข้อมูลเล็กน้อย", "ส่วนสูง น้ำหนัก อายุ"], ["เริ่มจดได้เลย", "ไม่ต้องสมัครสมาชิก"]];
  el.innerHTML = `<div class="inner land">
<div class="land-hero"><span class="chip soft">${ic("sparkle", 15)}ห้องอุ่นๆ สำหรับดูแลตัวเอง</span>
<h1 class="land-h1">Maalot <span class="land-th">มาลด</span></h1>
<p class="land-sub">จดการกิน ออกกำลังกาย และน้ำหนัก โดยมีตัวละครของคุณเป็นเพื่อนในห้องอุ่นๆ ไม่ต้องกดเยอะ ไม่ต้องกดดันตัวเอง</p>
<div class="land-stage">${lookPreview(S.look, 46)}</div>
<button class="btn primary block land-cta" data-act="landgo">เริ่มเลย ใช้เวลาไม่ถึง 2 นาที</button>
<p class="xs muted" style="text-align:center;margin-top:8px">ฟรี ไม่ต้องสมัครสมาชิก</p></div>
<h2 class="land-sec">มีอะไรในนี้</h2>
<div class="col">${feats.map(f => `<div class="card land-feat"><span class="land-ic">${ic(f[0], 22)}</span><div><h3>${f[1]}</h3><p class="muted sm">${f[2]}</p></div></div>`).join("")}</div>
<h2 class="land-sec">เริ่มยังไง</h2>
<div class="col">${steps.map((s, i) => `<div class="row land-step"><span class="land-n">${i + 1}</span><div><b>${s[0]}</b><div class="muted sm">${s[1]}</div></div></div>`).join("")}</div>
<h2 class="land-sec">ข้อมูลของคุณ</h2>
<div class="hint" style="margin-top:0">${ic("lock", 18)}<span>ข้อมูลเก็บในเบราว์เซอร์ของคุณเอง ไม่ถูกส่งไปที่อื่น สำรองเป็นไฟล์ได้ และติดตั้งเป็นแอปบนมือถือได้จากหน้าตั้งค่า</span></div>
<button class="btn primary block land-cta" style="margin-top:18px" data-act="landgo">เริ่มสร้างตัวละคร</button>
<p class="xs muted" style="margin-top:14px;text-align:center">สำหรับผู้ใหญ่ 18 ปีขึ้นไป ใช้เป็นข้อมูลทั่วไป ไม่ใช่คำแนะนำทางการแพทย์ ถ้ามีโรคประจำตัว ตั้งครรภ์ หรือกังวลเรื่องการกิน ควรปรึกษาแพทย์</p>
</div>`;
  window.scrollTo(0, 0);
}
ACT.landgo = () => renderOnb();
