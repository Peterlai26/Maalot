/* หน้าบันทึกกิน/ออกกำลังกาย: ชิปมื้อประจำและอาหารของฉันที่โมดูลอื่นแทรกไว้ในกรอบพิมพ์ ย้ายไปอยู่ในหน้าต่างทางลัด
   หน้าหลักจึงเหลือแค่ช่องพิมพ์ + ปุ่มตีความ + ปุ่มทางลัด (ต้องโหลดหลังโมดูลที่แทรกชิปทั้งหมด) */
(function () {
  const o = SUBS.log;
  SUBS.log = arg => {
    const r = o(arg); if (!r || typeof r.html !== "string") return r;
    const m = r.html.match(/(<div class="composer [^"]*">)([\s\S]*?)(<label class="f" for="lgtext")/);
    LOGX.chips = m ? m[2] : ""; if (m) r.html = r.html.replace(m[0], m[1] + m[3]);
    r.html = r.html.replace("<!--lgmenu-->", lgMenuHTML(LG && LG.tab === "food", !!LOGX.chips.trim()));
    return r;
  };
})();
