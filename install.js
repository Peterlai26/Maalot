/* ชวนติดตั้งเป็นแอป: แบนเนอร์ + ปุ่มในหน้าแรก ใช้ได้ทั้ง Android (ป๊อปอัปติดตั้ง) และ iPhone (ขั้นตอนเพิ่มไปหน้าจอโฮม) */
let PWA_EV = null;
const isApp = () => (typeof NATIVE !== "undefined" && NATIVE) || matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const INST_KEY = "wl_inst_skip";
function instSkipped() { try { const t = +localStorage.getItem(INST_KEY) || 0; return Date.now() - t < 3 * 864e5; } catch (e) { return false; } }
const APK_URL = "https://github.com/Peterlai26/Maalot/releases/download/app-latest/maalot.apk";
const isAndroidWeb = () => /Android/i.test(navigator.userAgent) && !isApp();
function apkModal() {
  const steps = ["แตะปุ่ม ดาวน์โหลด ด้านบน (ถ้าเบราว์เซอร์เตือนว่าไฟล์อาจเป็นอันตราย เลือก ดาวน์โหลดต่อ)", "เปิดไฟล์ maalot.apk ที่โหลดมา ถ้าระบบบอกไม่อนุญาตแหล่งนี้ แตะ การตั้งค่า แล้วเปิด อนุญาตจากแหล่งนี้", "แตะ ติดตั้ง (ถ้า Play Protect เตือน เลือก ติดตั้งต่อไป)", "เปิดแอป Maalot แล้วเข้าสู่ระบบด้วยบัญชีเดิม ข้อมูลจะตามมาให้"];
  openModal(`<h2>ดาวน์โหลดแอป Maalot (.apk)</h2><p class="muted sm" style="margin:6px 0 12px">นับก้าวต่อเบื้องหลังแม้ปิดจอ และอ่านก้าวจาก Health Connect ได้ ต้องใช้ Android 8 ขึ้นไป</p><a class="btn primary block go" href="${APK_URL}" download="maalot.apk" rel="noopener">${ic("send", 18)}ดาวน์โหลด .apk</a><ol class="insteps" style="margin-top:14px">${steps.map(t => `<li>${t}</li>`).join("")}</ol>${PWA_EV ? '<button class="btn block" data-act="pwaweb" style="margin-bottom:8px">หรือติดตั้งแบบเว็บแอปแทน</button>' : ""}<button class="btn block" data-act="modalclose">ปิด</button>`);
}
function instHowTo() {
  const steps = isIOS()
    ? ["แตะปุ่มแชร์ (สี่เหลี่ยมมีลูกศรขึ้น) ที่แถบล่างของ Safari", "เลื่อนลงแล้วเลือก เพิ่มไปยังหน้าจอโฮม", "กด เพิ่ม ที่มุมขวาบน แล้วเปิดแอป Maalot จากหน้าจอโฮม"]
    : ["เปิดเมนู ⋮ ของเบราว์เซอร์ที่มุมขวาบน", "เลือก ติดตั้งแอป หรือ เพิ่มไปยังหน้าจอหลัก", "เปิดแอป Maalot จากหน้าจอหลัก"];
  openModal(`<h2>ติดตั้ง Maalot เป็นแอป</h2><ol class="insteps">${steps.map(s => `<li>${s}</li>`).join("")}</ol><p class="muted sm" style="margin:10px 0 14px">เปิดเร็วขึ้น เต็มจอ และรับการเตือนให้บันทึกได้${isIOS() ? " (ต้องเปิดจากแอปบนหน้าจอโฮมเท่านั้น)" : ""}</p><button class="btn primary block" data-act="modalclose">เข้าใจแล้ว</button>`);
}
function instBar(show) {
  let b = $("#instbar");
  if (!show) { if (b) { b.classList.remove("on"); setTimeout(() => b && b.remove(), 300); } return; }
  if (b || isApp() || instSkipped()) return;
  b = document.createElement("div"); b.id = "instbar"; b.setAttribute("role", "region"); b.setAttribute("aria-label", "ติดตั้งแอป");
  b.innerHTML = `<img src="logo.svg" width="44" height="44" alt=""><div class="it">${isAndroidWeb() ? "<b>ดาวน์โหลดแอป Maalot (.apk)</b><span>นับก้าวเบื้องหลัง อ่านก้าวจาก Health Connect ได้</span></div><button class=\"ibtn\" data-act=\"pwa\">ดาวน์โหลด</button>" : "<b>ติดตั้ง Maalot เป็นแอป</b><span>เปิดจากหน้าจอโฮม เร็วขึ้น และรับแจ้งเตือนได้</span></div><button class=\"ibtn\" data-act=\"pwa\">ติดตั้ง</button>"}<button class="ix" data-act="instx" aria-label="ปิด">${ic("x", 16)}</button>`;
  document.body.appendChild(b); requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add("on")));
}
ACT.pwa = () => {
  if (isApp()) { toast("ติดตั้งเป็นแอปอยู่แล้ว"); return; }
  if (isAndroidWeb()) { apkModal(); return; }
  ACT.pwaweb();
};
ACT.pwaweb = () => {
  if (!$("#modal").hidden) closeModal();
  if (PWA_EV) { const ev = PWA_EV; PWA_EV = null; ev.prompt(); ev.userChoice && ev.userChoice.then(r => { if (r.outcome === "accepted") instBar(false); else instBar(true); }); return; }
  instHowTo();
};
ACT.instx = () => { try { localStorage.setItem(INST_KEY, String(Date.now())); } catch (e) {} instBar(false); };
addEventListener("beforeinstallprompt", e => { e.preventDefault(); PWA_EV = e; });
addEventListener("appinstalled", () => { instBar(false); document.querySelectorAll(".linst").forEach(x => x.remove()); toast("ติดตั้งแล้ว เปิดจากหน้าจอโฮมได้เลย"); });
addEventListener("load", () => setTimeout(() => instBar(true), 2600));
