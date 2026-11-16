/* เตือนให้บันทึก: ทำงานตอนเปิดแอปไว้หรืออยู่เบื้องหลัง (ไม่มีเซิร์ฟเวอร์ส่งแจ้งเตือนตอนปิดแอปสนิท) */
const REM_DEFAULT = { on: false, times: ["12:30", "19:00", "21:00"], fired: {} };
const REM_MSG = [
  [11, "มื้อเที่ยงกินอะไรไปบ้างนะ จดไว้สักหน่อยไหม"],
  [16, "มื้อบ่ายหรือของว่างมีไหม เล่าให้น้องฟังได้นะ"],
  [18, "มื้อเย็นเป็นยังไงบ้าง มาจดไว้ก่อนลืมนะ"],
  [20, "ก่อนจบวัน ลองจดสิ่งที่กินวันนี้ให้ครบนะ"]
];
function remCfg() { const r = S.rem || {}; return { on: !!r.on, times: Array.isArray(r.times) && r.times.length ? r.times : REM_DEFAULT.times.slice(), fired: r.fired || {} }; }
function remPerm() { return "Notification" in window ? Notification.permission : "unsupported"; }
function remHM(now) { return String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0"); }
function remMinus(hm, mins) { const [h, m] = hm.split(":").map(Number), t = Math.max(0, h * 60 + m - mins); return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); }
function remMsg(hm) { const h = +hm.split(":")[0]; let m = REM_MSG[0][1]; REM_MSG.forEach(x => { if (h >= x[0]) m = x[1]; }); return m; }

function remNotify(text) {
  if (document.visibilityState === "visible") { toast(text); return; }
  if (remPerm() !== "granted") return;
  const opt = { body: text, icon: "icon-192.png", badge: "icon-192.png", tag: "maalot-reminder" };
  if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification("Maalot (มาลด)", opt)).catch(() => { try { new Notification("Maalot (มาลด)", opt); } catch (e) { } });
  else { try { new Notification("Maalot (มาลด)", opt); } catch (e) { } }
}
function checkReminders(now) {
  now = now || new Date(); const c = remCfg(); if (!c.on || !S.onboarded) return;
  const tk = todayKey(), hm = remHM(now); let changed = false;
  c.times.forEach(t => {
    const key = tk + "|" + t;
    if (c.fired[key] || hm < t || hm > remMinus(t, -90)) return;
    c.fired[key] = 1; changed = true;
    const done = S.meals.some(m => m.d === tk && m.t >= remMinus(t, 60));
    if (!done) remNotify(remMsg(t));
  });
  if (changed) { Object.keys(c.fired).forEach(k => { if (k.slice(0, 10) !== tk) delete c.fired[k]; }); S.rem = { on: c.on, times: c.times, fired: c.fired }; save(); }
}
function startReminders() {
  setInterval(() => checkReminders(), 30000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkReminders(); });
  checkReminders();
}
function remHTML() {
  const c = remCfg(), p = remPerm();
  const st = p === "unsupported" ? "เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนของระบบ จะเตือนเป็นข้อความในแอปตอนเปิดอยู่"
    : p === "granted" ? "เปิดการแจ้งเตือนของระบบแล้ว" : p === "denied" ? "เบราว์เซอร์บล็อกการแจ้งเตือนไว้ จะเตือนเป็นข้อความในแอปตอนเปิดอยู่ ปลดบล็อกได้ที่ตั้งค่าของเว็บไซต์" : "ยังไม่ได้อนุญาตการแจ้งเตือนของระบบ";
  return `<div class="sec">เตือนให้บันทึก</div>
<div class="row between"><span>เตือนเมื่อยังไม่ได้จดมื้ออาหาร</span><button class="btn ${c.on ? "primary" : ""}" data-act="remtoggle" aria-pressed="${c.on}">${c.on ? "เปิดอยู่" : "ปิดอยู่"}</button></div>
${c.on ? `<div class="grid2" style="margin-top:10px">${c.times.map((t, i) => `<div><label class="f" for="rt${i}">เวลาที่ ${i + 1}</label><input id="rt${i}" type="time" value="${t}" data-remt="${i}"/></div>`).join("")}</div>
<button class="btn block" style="margin-top:10px" data-act="remtest">ทดสอบการเตือน</button>` : ""}
<p class="xs muted" style="margin-top:8px">${st}</p>
<p class="xs muted" style="margin-top:4px">เตือนได้ตอนเปิดแอปค้างไว้หรืออยู่เบื้องหลัง ถ้าปิดแอปสนิทจะยังไม่เตือน แต่จะเตือนทันทีที่เปิดแอปกลับมา ถ้าถึงเวลาไม่เกิน 90 นาที และจะไม่เตือนถ้าคุณเพิ่งจดมื้ออาหารไป</p>`;
}
ACT.remtoggle = () => {
  const c = remCfg(); c.on = !c.on; S.rem = c; save();
  if (c.on && "Notification" in window && Notification.permission === "default") {
    try { const r = Notification.requestPermission(); if (r && r.then) r.then(() => rerenderSub()); } catch (e) { }
  }
  rerenderSub();
};
ACT.remtest = () => {
  if (document.visibilityState === "visible" && remPerm() === "granted") {
    const opt = { body: "ทดสอบเตือนจาก Maalot สำเร็จ", icon: "icon-192.png", tag: "maalot-test" };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification("Maalot (มาลด)", opt)).catch(() => toast(opt.body)); else toast(opt.body);
  } else toast("ทดสอบเตือนจาก Maalot สำเร็จ");
};
document.addEventListener("change", e => {
  const i = e.target && e.target.dataset && e.target.dataset.remt; if (i === undefined || !e.target.value) return;
  const c = remCfg(); c.times[+i] = e.target.value; S.rem = c; save();
});
