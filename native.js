/* สะพานเชื่อมแอปมือถือ (Capacitor): ถ้าเปิดในแอปที่ห่อด้วย Capacitor จะได้ปลั๊กอินนับก้าวเบื้องหลังและอ่านก้าวจากแอปสุขภาพของเครื่อง
   ถ้าเปิดในเว็บปกติ ตัวแปรเหล่านี้จะว่าง และทุกอย่างทำงานแบบเว็บเหมือนเดิม */
const NATIVE = !!(window.Capacitor && typeof Capacitor.isNativePlatform === "function" && Capacitor.isNativePlatform());
const NAT = { bg: null, health: null };
if (NATIVE) { try { NAT.bg = Capacitor.registerPlugin("BackgroundGeolocation"); } catch (e) { } try { NAT.health = Capacitor.registerPlugin("Health"); } catch (e) { } document.documentElement.classList.add("native"); }
