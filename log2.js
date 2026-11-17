/* หน้าบันทึกแยกกัน: กดอาหารเข้าอาหาร กดออกกำลังกายเข้าออกกำลังกาย ไม่มีแท็บให้สลับไปมา */
(function () {
  const oLog = SUBS.log;
  SUBS.log = arg => { const r = oLog(arg); if (r && r.html) r.html = r.html.replace(/<div class="seg" role="tablist">[\s\S]*?<\/div>/, ""); return r; };
  ACT.lgtab = () => { };
})();
