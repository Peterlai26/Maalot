/* ขออนุญาตแจ้งเตือนตอนเข้าแอป: ป๊อปอัปหลังทำความรู้จักแอปเสร็จ ถ้ายังไม่ได้ตอบ จะถามอีกวันละครั้ง */
function notifCanAsk() {
  if (!("Notification" in window) || Notification.permission !== "default") return false;
  if (!S.onboarded || S.notifAsk === todayKey()) return false;
  if (!(S.tut || S.meals.length)) return false;
  if ($("#tut") || $("#tutinv") || $("#gate") || !$("#modal").hidden || !$("#sub").hidden || view !== "home") return false;
  return true;
}
function notifAsk() {
  if (!notifCanAsk()) return; S.notifAsk = todayKey(); save();
  openModal(`<div class="nask"><span class="nask-ic">${ic("bell", 34)}<i></i></span><h2>เปิดการแจ้งเตือนไหม</h2><p class="muted sm">ให้น้องเตือนตอนถึงเวลากินและดื่มน้ำ ไม่ลืมจดมื้ออาหาร ไม่เตือนถี่เกินไป ปิดได้ทุกเมื่อในตั้งค่า</p><button class="btn primary block go" data-act="notifyes">${ic("check", 18)}อนุญาตการแจ้งเตือน</button><button class="btn block" style="margin-top:8px" data-act="notifno">ไว้ก่อน</button></div>`);
}
ACT.notifyes = async () => {
  closeModal();
  try { if (typeof ACT.remtoggle === "function" && !remCfg().on) await ACT.remtoggle(); else await Notification.requestPermission(); } catch (e) { }
  if (Notification.permission === "granted") toast("เปิดการแจ้งเตือนแล้ว"); else if (Notification.permission === "denied") toast("เบราว์เซอร์ปิดกั้นการแจ้งเตือนไว้ เปิดได้ที่ตั้งค่าของเบราว์เซอร์");
};
ACT.notifno = () => { closeModal(); };
setInterval(notifAsk, 3000);
