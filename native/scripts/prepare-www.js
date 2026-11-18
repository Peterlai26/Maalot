/* คัดลอกไฟล์เว็บแอปจากรากโปรเจกต์ไปไว้ที่ native/www เพื่อให้ Capacitor ห่อเป็นแอป */
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "../.."), out = path.resolve(__dirname, "../www");
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const skip = new Set(["native", "worker", "node_modules", ".git", ".github", "README.md"]);
for (const f of fs.readdirSync(root)) {
  if (skip.has(f) || f.startsWith(".")) continue;
  const p = path.join(root, f); if (!fs.statSync(p).isFile()) continue;
  if (/\.(html|js|css|svg|png|webmanifest)$/.test(f)) fs.copyFileSync(p, path.join(out, f));
}
fs.copyFileSync(path.resolve(__dirname, "../privacypolicy.html"), path.join(out, "privacypolicy.html"));
console.log("www ready:", fs.readdirSync(out).length, "files");
