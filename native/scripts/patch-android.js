/* ปรับโปรเจกต์ Android ที่ Capacitor สร้างให้: ใช้ไอคอน Maalot แทนไอคอนเริ่มต้น */
const fs = require("fs"), path = require("path");
const res = path.resolve(__dirname, "../android/app/src/main/res"), icon = path.resolve(__dirname, "../../icon-192.png");
if (!fs.existsSync(res)) { console.error("ยังไม่มีโฟลเดอร์ android ให้รัน cap add android ก่อน"); process.exit(1); }
for (const d of fs.readdirSync(res)) {
  if (d === "mipmap-anydpi-v26") { fs.rmSync(path.join(res, d), { recursive: true, force: true }); continue; } /* ใช้ไอคอน png แทนไอคอนแบบ adaptive ของ Capacitor */
  if (!d.startsWith("mipmap-")) continue;
  for (const n of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]) fs.copyFileSync(icon, path.join(res, d, n));
}
console.log("patched icons");
