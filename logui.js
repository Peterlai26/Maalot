/* หน้าบันทึกกิน/ออกกำลังกาย: ชิปมื้อประจำและอาหารของฉันที่โมดูลอื่นแทรกไว้ในกรอบพิมพ์ ย้ายไปอยู่ในหน้าต่างทางลัด
   หน้าหลักจึงเหลือแค่ช่องพิมพ์ + ปุ่มตีความ + ปุ่มทางลัด (ต้องโหลดหลังโมดูลที่แทรกชิปทั้งหมด) */
(function () {
  const o = SUBS.log;
  SUBS.log = arg => {
    const r = o(arg); if (!r || typeof r.html !== "string") return r;
    const m = r.html.match(/(<div class="composer [^"]*">)([\s\S]*?)(<label class="f" for="lgtext")/);
    LOGX.chips = m ? m[2] : ""; if (m) r.html = r.html.replace(m[0], m[1] + m[3]);
    r.html = r.html.replace("<!--lgmenu-->", lgMenuHTML(LG && LG.tab === "food"));
    /* เวลากับวันอยู่แถวเดียวกัน: วันเป็นปุ่มสลับ วันนี้/เมื่อวาน (มีแถบเลื่อน) */
    const seg = `<label class="f">บันทึกของวัน</label><div class="seg whenseg" role="tablist"><i class="wsi" style="transform:translateX(${LG.when === "yest" ? "100%" : "0"})"></i>${[["today", "วันนี้"], ["yest", "เมื่อวาน"]].map(w => `<button type="button" role="tab" class="${LG.when === w[0] ? "on" : ""}" data-act="lgwhenset" data-v="${w[0]}">${w[1]}</button>`).join("")}</div>`;
    r.html = r.html.replace(/(<label class="f" for="lgtime">[\s\S]*?<input id="lgtime"[^>]*\/>)\s*<label class="f" for="lgwhen">[\s\S]*?<\/select>/, (m, tm) => `<div class="lgdt"><div class="lgdt-c">${tm}</div><div class="lgdt-c">${seg}</div></div>`);
    r.html = r.html.replace(/<label class="f" for="lgwhen">[\s\S]*?<\/select>/, `<div class="lgdt one"><div class="lgdt-c">${seg}</div></div>`);
    return r;
  };
  /* พิมพ์แล้วปุ่ม "ตีความ" เรืองแสงชวนกด */
  document.addEventListener("input", e => { if (e.target && e.target.id === "lgtext") { const b = document.querySelector(".lgbar .btn.primary"); if (b) b.classList.toggle("ready", e.target.value.trim().length > 0); } });
})();
