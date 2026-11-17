/* ชวนติดตั้งเป็นแอป: แบนเนอร์ + ปุ่มในหน้าแรก ใช้ได้ทั้ง Android (ป๊อปอัปติดตั้ง) และ iPhone (ขั้นตอนเพิ่มไปหน้าจอโฮม) */
let PWA_EV = null;
const isApp = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const INST_KEY = "wl_inst_skip";
function instSkipped() { try { const t = +localStorage.getItem(INST_KEY) || 0; return Date.now() - t < 3 * 864e5; } catch (e) { return false; } }
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
  b.innerHTML = `<img src="logo.svg" width="44" height="44" alt=""><div class="it"><b>ติดตั้ง Maalot เป็นแอป</b><span>เปิดจากหน้าจอโฮม เร็วขึ้น และรับแจ้งเตือนได้</span></div><button class="ibtn" data-act="pwa">ติดตั้ง</button><button class="ix" data-act="instx" aria-label="ปิด">${ic("x", 16)}</button>`;
  document.body.appendChild(b); requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add("on")));
}
ACT.pwa = () => {
  if (isApp()) { toast("ติดตั้งเป็นแอปอยู่แล้ว"); return; }
  if (PWA_EV) { const ev = PWA_EV; PWA_EV = null; ev.prompt(); ev.userChoice && ev.userChoice.then(r => { if (r.outcome === "accepted") instBar(false); else instBar(true); }); return; }
  instHowTo();
};
ACT.apkdl = () => { openModal(`<h2>ติดตั้งไฟล์ .apk บน Android</h2><ol class="insteps"><li>กดดาวน์โหลดด้านล่าง</li><li>เปิดไฟล์ที่ดาวน์โหลดจากแถบแจ้งเตือนหรือแอปไฟล์</li><li>ถ้าเครื่องถาม ให้อนุญาต “ติดตั้งแอปจากแหล่งนี้” ให้เบราว์เซอร์ที่ใช้ดาวน์โหลด แล้วกดติดตั้ง</li></ol><p class="muted sm" style="margin:10px 0 14px">เป็นแอปที่เปิดหน้าเว็บ Maalot เต็มจอ ข้อมูลของคุณเหมือนในเว็บ อัปเดตตามเว็บอัตโนมัติ ถ้าเครื่องเตือนว่าไม่รู้จักผู้พัฒนา เป็นเรื่องปกติของไฟล์ที่ไม่ได้มาจาก Google Play</p><div class="row"><button class="btn" style="flex:1" data-act="modalclose">ปิด</button><a class="btn primary" style="flex:1;text-align:center;text-decoration:none" href="maalot.apk" download="maalot.apk" data-act="modalclose">ดาวน์โหลด</a></div>`); };
ACT.instx = () => { try { localStorage.setItem(INST_KEY, String(Date.now())); } catch (e) {} instBar(false); };
addEventListener("beforeinstallprompt", e => { e.preventDefault(); PWA_EV = e; });
addEventListener("appinstalled", () => { instBar(false); document.querySelectorAll(".linst").forEach(x => x.remove()); toast("ติดตั้งแล้ว เปิดจากหน้าจอโฮมได้เลย"); });
addEventListener("load", () => setTimeout(() => instBar(true), 2600));
