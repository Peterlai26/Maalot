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

(function () {
  const setPage = (n, fn) => { if (typeof ORIG !== "undefined" && ORIG[n]) ORIG[n] = fn; else SUBS[n] = fn; };
  const wrapHero = (n, cfg) => { const o = SUBS[n]; if (!o) return; SUBS[n] = a => { const r = o(a), c = typeof cfg === "function" ? cfg(a, r) : cfg; if (c && r && typeof r.html === "string" && !r.html.includes("mhero")) r.html = modeHero(c) + r.html; return r; }; };
  wrapHero("gps", { icon: "run", title: "คาร์ดิโอ GPS", sub: "วัดระยะ เวลา และเส้นทางสดๆ", tone: "green" });
  wrapHero("setbk", { icon: "cloud", title: "สำรองและนำเข้าข้อมูล", sub: "เก็บข้อมูลของคุณไม่ให้หาย", tone: "blue" });
  wrapHero("pbuild", { icon: "list", title: "สร้างโปรแกรม", sub: "เลือกท่า เซ็ต ครั้ง ตามใจคุณ", tone: "violet" });
  wrapHero("cardio", (a, r) => a && a.id ? { icon: "run", title: r.title, sub: "สรุปการเคลื่อนไหวครั้งนี้", tone: "green" } : null);
  /* ภารกิจ: การ์ดมีไอคอน แถบเดินหน้า เรืองแสงตอนพร้อมรับ และสรุปด้านบน */
  setPage("missions", () => {
    const L = MISSIONS.map(m => ({ m, p: Math.min(m.goal, missionProg(m.id)), got: !!S.claimed[m.id] })), ready = L.filter(x => !x.got && x.p >= x.m.goal).length, gotN = L.filter(x => x.got).length, C = 2 * Math.PI * 34;
    const head = `<div class="card gov"><div class="gov-ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="rb" cx="40" cy="40" r="34"/><circle class="rf" cx="40" cy="40" r="34" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - gotN / L.length)).toFixed(1)}"/></svg><b>${gotN}/${L.length}</b></div><div class="gov-t"><b>${ready ? "มี " + ready + " ภารกิจรอรับรางวัล!" : gotN === L.length ? "ทำครบทุกภารกิจแล้ว" : "ทำต่อเลย ใกล้แล้ว"}</b><span class="xs muted">เหรียญได้จากความสม่ำเสมอ ไม่ได้ขึ้นกับน้ำหนัก</span></div></div>`;
    return { title: "ภารกิจ", html: head + `<div class="mgrid">${L.map(({ m, p, got }, i) => { const done = p >= m.goal; return `<div class="card mcard${got ? " got" : done ? " ready" : ""}" style="--i:${i}"><div class="mc-h"><span class="mc-ic">${ic(m.item ? "sparkle" : "target", 20)}</span><div class="grow"><b>${m.n}</b><span class="xs muted">${p}/${m.goal}${m.item ? " · รางวัล: " + m.itemName : ""}</span></div><span class="gcoin">${ic("coin", 14)}${m.coins}</span></div><div class="gbar"><i class="${got || done ? "ok" : ""}" style="width:${Math.round(p / m.goal * 100)}%"></i></div><div class="mc-f">${got ? `<span class="chip green">${ic("check", 14)}รับแล้ว</span>` : `<button class="btn sm ${done ? "primary go" : ""}" ${done ? "" : "disabled"} data-act="claim" data-id="${m.id}">${done ? "รับรางวัล" : "ยังไม่ครบ"}</button>`}</div></div>`; }).join("")}</div>` };
  });
  /* กราฟย้อนหลัง: แถบสรุปด้านบน เส้นวาดเข้ามา แท่งโตขึ้น */
  if (typeof renderCharts === "function") {
    const orc = renderCharts;
    renderCharts = function () {
      orc(); const v = document.getElementById("v-charts"); if (!v) return;
      try {
        const R = CH.range, today = todayKey(), from = addDays(today, -R + 1), ws = S.weights.filter(x => x.d >= from), nd = Math.min(R, 30), days = []; for (let i = nd - 1; i >= 0; i--) days.push(addDays(today, -i));
        const lg = days.map(k => dayInfo(k)).filter(i => i.logged), avg = lg.length ? Math.round(lg.reduce((a, i) => a + i.eaten, 0) / lg.length) : null, chg = ws.length > 1 ? ws[ws.length - 1].w - ws[0].w : null;
        const hero = `<div class="fdhero chh"><span class="fd-bg" aria-hidden="true"><i></i><i></i></span><div class="chh-t">${ic("chart", 18)}สรุป ${R} วันล่าสุด</div><div class="fd-s"><span><b>${chg === null ? "-" : (chg > 0 ? "+" : "") + f1(chg)}</b>กก. เปลี่ยน</span><span><b>${avg === null ? "-" : fmtN(avg)}</b>kcal ต่อวัน</span><span><b>${lg.length}</b>วันที่จด</span></div></div>`;
        const top = v.querySelector(".top"); if (top) top.insertAdjacentHTML("afterend", hero); else v.insertAdjacentHTML("afterbegin", hero);
      } catch (e) { }
      v.querySelectorAll("svg path[stroke-width]").forEach(p => { try { const L = p.getTotalLength(); if (!L || L < 20) return; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.getBoundingClientRect(); p.style.transition = "stroke-dashoffset 1.3s cubic-bezier(.2,.9,.3,1)"; p.style.strokeDashoffset = 0; } catch (e) { } });
    };
  }
})();
