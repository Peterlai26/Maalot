/* ปรับหน้าที่ยังดูเก่า โล่ง หรือน่าเบื่อ ให้มีหัว อนิเมชัน และสถานะว่างที่มีชีวิต
   (ต้องโหลดหลัง modes.js เพราะหน้าที่รวมเป็นแท็บเก็บต้นฉบับไว้ใน ORIG) */
(function () {
  /* หัวหน้าสำหรับหน้าที่ยังไม่มี (หน้าที่มีดีไซน์เองหรือเป็นแท็บได้หัวจาก modes.js แล้ว) */
  const HERO = {
    cardio: { icon: "run", title: "คาร์ดิโอและเส้นทาง", sub: "วัดวิ่ง เดิน ปั่นด้วย GPS", tone: "green", skipArg: true },
    recover: { icon: "heart", title: "ฟื้นตัวและความปลอดภัย", sub: "ฟังร่างกายก่อนออกแรงทุกครั้ง", tone: "rose" },
    progress: { icon: "chart", title: "สถิติและกล้ามเนื้อ", sub: "ดูว่าสัปดาห์นี้ฝึกส่วนไหนไปแล้ว", tone: "blue" },
    fitan: { icon: "chart", title: "วิเคราะห์แผน", sub: "แผนครอบคลุมกล้ามเนื้อพอหรือยัง", tone: "blue" },
    fitq: { icon: "target", title: "ตั้งค่าโปรแกรม", sub: "ตอบสั้นๆ แล้วน้องสร้างแผนให้", tone: "amber" },
    setprof: { icon: "user", title: "ข้อมูลส่วนตัว", sub: "ใช้คำนวณพลังงานและเป้าหมาย", tone: "violet" },
    setrem: { icon: "timer", title: "เตือนให้บันทึก", sub: "ให้น้องทักตอนลืมจด", tone: "amber" },
    account: { icon: "user", title: "บัญชีและซิงก์", sub: "ใช้ข้อมูลเดียวกันได้ทุกเครื่อง", tone: "violet" }
  };
  Object.keys(HERO).forEach(n => {
    const o = SUBS[n]; if (!o) return;
    SUBS[n] = a => { const r = o(a); if (r && typeof r.html === "string" && !r.html.includes("mhero") && !(HERO[n].skipArg && a && a.id)) r.html = modeHero(HERO[n]) + r.html; return r; };
  });
  /* ปรับ html ของหน้าด้วยฟังก์ชัน (หน้าที่เป็นแท็บแก้ที่ต้นฉบับใน ORIG) */
  const fix = (n, fn) => { const tab = typeof ORIG !== "undefined" && ORIG[n], o = tab || SUBS[n]; if (!o) return; const w = a => { const r = o(a); if (r && typeof r.html === "string") r.html = fn(r.html, a); return r; }; if (tab) ORIG[n] = w; else SUBS[n] = w; };
  fix("combos", h => h.replace(/<p class="muted" style="padding:24px 0;text-align:center">ยังไม่มีมื้อประจำ[\s\S]*?<\/p>/, emptyState("heart", "ยังไม่มีมื้อประจำ", "ในหน้าบันทึกอาหาร ใส่รายการแล้วกด “บันทึกเป็นมื้อประจำ” ครั้งหน้าแตะครั้งเดียวจดได้เลย")));
  fix("myfoods", h => h.replace(/<p class="muted" style="padding:24px 0;text-align:center">ยังไม่มีอาหารของฉัน[\s\S]*?<\/p>/, emptyState("bowl", "ยังไม่มีอาหารของฉัน", "ในหน้าบันทึกอาหารกด “ขนมซอง/จากฉลาก” ถ่ายฉลากแล้วเก็บไว้ ครั้งหน้าแตะเดียวจด")));
  fix("waist", h => h.includes('<div class="sec">ย้อนหลัง</div>') ? h : h.replace('<p class="xs muted" style="margin-top:12px">รูปความคืบหน้า', emptyState("ruler", "ยังไม่มีบันทึกรอบเอว", "วัดสัปดาห์ละครั้งก็พอ ดูแนวโน้มได้ชัดกว่าตัวเลขรายวัน") + '<p class="xs muted" style="margin-top:12px">รูปความคืบหน้า'));
  fix("cardio", h => { const o = h => h.replace('<p class="xs muted">ยังไม่มีบันทึก</p>', emptyState("run", "ยังไม่มีบันทึกคาร์ดิโอ", "กด “เริ่มวัดด้วย GPS” ตอนวิ่ง เดิน หรือปั่น น้องเก็บระยะทางกับเส้นทางให้")).replace('class="btn primary block" data-act="gpsnew"', 'class="btn primary block go" data-act="gpsnew"'); const r = o(h); return r.includes("ยังไม่มีบันทึกคาร์ดิโอ") ? r.replace(/<div class="sec">ระยะทางรายสัปดาห์ \(กม\.\)<\/div><div class="card">[\s\S]*?<\/div>/, "") : r; });
  /* หน้าฟื้นตัว: ข้อความยาวเป็นข้อๆ ให้กลายเป็นรายการเคล็ดลับที่อ่านง่าย */
  fix("recover", h => h.replace(/<div class="card sm">(•[\s\S]*?)<\/div>/g, (m, t) => `<div class="card tips">${t.split("<br>").map(x => x.replace(/^\s*•\s*/, "").trim()).filter(Boolean).map((x, i) => `<div class="tip" style="--i:${i}"><span>${ic("check", 14)}</span><p>${x}</p></div>`).join("")}</div>`));
})();
