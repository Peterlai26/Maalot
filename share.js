/* การ์ดแชร์ความคืบหน้า: วาดรูป PNG ด้วย canvas ฝั่งเครื่อง ไม่แสดงแคลอรี่ อาหาร หรือน้ำหนักตัวจริง */
const SHARE = { kind: "progress", opt: { weight: false }, blob: null, url: "", seq: 0 };
const SH_C = { bg1: "#FFF6EC", bg2: "#FDE3D2", ink: "#3B2A24", muted: "#8A6F63", accent: "#E8845F", card: "#FFFFFF", soft: "#FDE7D9", green: "#5FA877", line: "#EBD9C8" };
function shImg(svg) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); }); }
const shIcon = (n, color) => shImg(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`);
function shRR(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
async function shFonts() {
  try { await Promise.race([Promise.all([document.fonts.load('600 40px Mali'), document.fonts.load('400 30px "Noto Sans Thai"'), document.fonts.load('600 30px "Noto Sans Thai"')]), new Promise(r => setTimeout(r, 1500))]); } catch (e) { }
}
function shStats() {
  const w0 = S.prof.w0, diff = w0 - estW(), logged = new Set(S.meals.map(m => m.d)).size;
  const fourth = SHARE.opt.weight && diff >= 0.1 ? { icon: "scale", v: f1(diff), l: "กก. ที่ลดไป" } : { icon: "dumbbell", v: String(S.works.length), l: "ครั้งออกกำลังกาย" };
  return { logged, cells: [{ icon: "flame", v: String(S.streak.n || 0), l: "วันต่อเนื่อง" }, { icon: "bowl", v: String(logged), l: "วันที่จดอาหาร" }, { icon: "sparkle", v: String(typeof medalCount === "function" ? medalCount() : 0), l: "เหรียญรางวัล" }, fourth] };
}
async function shDraw() {
  const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  await shFonts();
  const F = (w, s) => `${w} ${s}px Mali, "Noto Sans Thai", system-ui, sans-serif`, T = (t, x, y, font, col, al) => { g.font = font; g.fillStyle = col; g.textAlign = al || "center"; g.textBaseline = "middle"; g.fillText(t, x, y); };
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, SH_C.bg1); bg.addColorStop(1, SH_C.bg2); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  T("Maalot", 70, 78, F(600, 56), SH_C.accent, "left"); T("มาลด", W - 70, 80, F(600, 34), SH_C.muted, "right");
  const st = shStats(), now = new Date();
  let svg = scene({ look: S.look, mood: "happy", rx: shapeRx(estW()), period: "noon", owned: S.owned, room: roomOf(), l1: "", l2: "" });
  svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="760" height="600" ');
  let room = null; try { room = await shImg(svg); } catch (e) { }
  const sx = 120, sy = 130, sw = 840, sh = 663;
  g.save(); shRR(g, sx, sy, sw, sh, 44); g.clip(); if (room) g.drawImage(room, sx, sy, sw, sh); else { g.fillStyle = SH_C.soft; g.fillRect(sx, sy, sw, sh); } g.restore();
  g.lineWidth = 4; g.strokeStyle = SH_C.line; shRR(g, sx, sy, sw, sh, 44); g.stroke();
  T(S.name || "น้องก้อน", W / 2, 855, F(600, 58), SH_C.ink);
  T(st.logged > 0 ? `จดอาหารมาแล้ว ${st.logged} วัน` : "เริ่มดูแลตัวเองไปด้วยกัน", W / 2, 912, F(400, 34), SH_C.muted);
  // 7 วันล่าสุด
  const tk = todayKey(), days = []; for (let i = 6; i >= 0; i--) days.push(addDays(tk, -i));
  days.forEach((k, i) => {
    const cx = 210 + i * 110, cy = 1000, on = dayInfo(k).logged;
    T(THDAY[new Date(k + "T12:00:00").getDay()], cx, 944, F(400, 26), k === tk ? SH_C.accent : SH_C.muted);
    g.beginPath(); g.arc(cx, cy, 30, 0, Math.PI * 2); g.fillStyle = on ? SH_C.green : SH_C.soft; g.fill(); if (!on) { g.lineWidth = 3; g.strokeStyle = SH_C.line; g.stroke(); }
    if (on) { g.strokeStyle = "#fff"; g.lineWidth = 6; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); g.moveTo(cx - 12, cy + 1); g.lineTo(cx - 3, cy + 11); g.lineTo(cx + 14, cy - 9); g.stroke(); }
    if (k === tk) { g.beginPath(); g.arc(cx, cy, 35, 0, Math.PI * 2); g.lineWidth = 4; g.strokeStyle = SH_C.accent; g.stroke(); }
  });
  // สถิติ 2x2
  const icons = await Promise.all(st.cells.map(cl => shIcon(cl.icon, SH_C.accent).catch(() => null)));
  st.cells.forEach((cl, i) => {
    const x = 70 + (i % 2) * 480, y = 1065 + Math.floor(i / 2) * 120, w = 460, h = 104;
    g.fillStyle = SH_C.card; shRR(g, x, y, w, h, 28); g.fill(); g.lineWidth = 3; g.strokeStyle = SH_C.line; g.stroke();
    if (icons[i]) g.drawImage(icons[i], x + 24, y + 28, 48, 48);
    T(cl.v, x + 92, y + 50, F(600, 52), SH_C.ink, "left"); T(cl.l, x + 92 + g.measureText(cl.v).width + 14, y + 56, F(400, 26), SH_C.muted, "left");
  });
  const host = location.host && !/^localhost/.test(location.host) ? location.host + (location.pathname.length > 1 ? location.pathname.replace(/\/$/, "") : "") : "Maalot";
  T(`${host}  ·  ${now.getDate()} ${THMON[now.getMonth()]} ${now.getFullYear() + 543}`, W / 2, 1322, F(400, 26), SH_C.muted);
  return c;
}

/* การ์ดสรุปสัปดาห์: โทนฝัน ไม่มีแคลอรี่ อาหาร หรือน้ำหนัก */
async function shDrawWeek() {
  const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  await shFonts();
  const F = (w, s) => `${w} ${s}px Prompt, Mali, "Noto Sans Thai", system-ui, sans-serif`, T = (t, x, y, font, col, al) => { g.font = font; g.fillStyle = col; g.textAlign = al || "center"; g.textBaseline = "middle"; g.fillText(t, x, y); };
  const PL = "#24193B", MU = "#6B6080", PK = "#F0679B", LN = "#DDD5EC";
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#A699E9"); bg.addColorStop(.42, "#8155C9"); bg.addColorStop(1, "#4F2681"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const pink = g.createRadialGradient(W * .85, 260, 10, W * .85, 260, 420); pink.addColorStop(0, "rgba(247,150,190,.55)"); pink.addColorStop(1, "rgba(247,150,190,0)"); g.fillStyle = pink; g.fillRect(0, 0, W, 700);
  const tk = todayKey(), days = []; for (let i = 6; i >= 0; i--) days.push(addDays(tk, -i));
  const inf = days.map(dayInfo), logged = inf.filter(i => i.logged).length, wc = inf.reduce((a, i) => a + i.works.length, 0), wat = days.filter(k => (S.water[k] || 0) >= 8).length;
  const ms = days.map(k => moodOf(k)).filter(m => m && m.m), good = ms.filter(m => m.m >= 4).length;
  const d0 = new Date(days[0] + "T12:00:00"), d1 = new Date(tk + "T12:00:00");
  T("Maalot", 70, 84, F(700, 54), "#fff", "left");
  T(`${d0.getDate()} ${THMON[d0.getMonth()]} – ${d1.getDate()} ${THMON[d1.getMonth()]} ${d1.getFullYear() + 543}`, W - 70, 86, F(500, 30), "rgba(255,255,255,.85)", "right");
  T("สัปดาห์ของ" + (S.name || "น้องก้อน"), W / 2, 200, F(700, 70), "#fff");
  let svg = scene({ look: S.look, mood: "happy", rx: shapeRx(estW()), period: "noon", owned: S.owned, room: roomOf(), l1: "", l2: "" });
  svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="760" height="600" ');
  let room = null; try { room = await shImg(svg); } catch (e) { }
  const sx = 150, sy = 275, sw = 780, sh = 616;
  const ring = g.createLinearGradient(sx, sy, sx + sw, sy + sh); ring.addColorStop(0, "#8155C9"); ring.addColorStop(.55, PK); ring.addColorStop(1, "#4C5DDA");
  g.fillStyle = ring; shRR(g, sx - 10, sy - 10, sw + 20, sh + 20, 52); g.fill();
  g.save(); shRR(g, sx, sy, sw, sh, 44); g.clip(); if (room) g.drawImage(room, sx, sy, sw, sh); else { g.fillStyle = "#ECE7F6"; g.fillRect(sx, sy, sw, sh); } g.restore();
  // แถบ 7 วัน
  g.fillStyle = "#F9F5ED"; shRR(g, 60, 930, W - 120, 360, 48); g.fill();
  days.forEach((k, i) => {
    const cx = 175 + i * 121.7, cy = 1020, on = inf[i].logged;
    T(THDAY[new Date(k + "T12:00:00").getDay()], cx, 975, F(500, 25), k === tk ? PK : MU);
    g.beginPath(); g.arc(cx, cy + 12, 31, 0, Math.PI * 2); g.fillStyle = on ? PL : "#ECE7F6"; g.fill();
    if (on) { g.strokeStyle = "#fff"; g.lineWidth = 6; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); g.moveTo(cx - 12, cy + 13); g.lineTo(cx - 3, cy + 23); g.lineTo(cx + 14, cy + 3); g.stroke(); }
  });
  const cells = [{ icon: "bowl", v: `${logged}/7`, l: "วันที่จดอาหาร" }, { icon: "dumbbell", v: String(wc), l: "ครั้งที่ออกกำลังกาย" }, { icon: "droplet", v: String(wat), l: "วันดื่มน้ำครบ" },
    ms.length >= 2 ? { icon: "heart", v: String(good), l: "วันที่อารมณ์ดี" } : { icon: "flame", v: String(S.streak.n || 0), l: "วันต่อเนื่อง" }];
  const icons = await Promise.all(cells.map(cl => shIcon(cl.icon, "#6B3FC0").catch(() => null)));
  cells.forEach((cl, i) => {
    const x = 90 + (i % 2) * 450, y = 1085 + Math.floor(i / 2) * 100, w = 420, h = 86;
    g.fillStyle = "#fff"; shRR(g, x, y, w, h, 43); g.fill(); g.lineWidth = 2; g.strokeStyle = LN; g.stroke();
    if (icons[i]) g.drawImage(icons[i], x + 22, y + 21, 44, 44);
    T(cl.v, x + 82, y + 44, F(700, 42), PL, "left"); const vw = g.measureText(cl.v).width; T(cl.l, x + 82 + vw + 12, y + 49, F(400, 22), MU, "left");
  });
  const host = location.host && !/^localhost/.test(location.host) ? location.host : "Maalot";
  T(host, W / 2, 1322, F(500, 26), "rgba(255,255,255,.8)");
  return c;
}
function renderShare() {
  const seq = ++SHARE.seq;
  (SHARE.kind === "week" ? shDrawWeek() : shDraw()).then(c => c.toBlob(b => {
    if (seq !== SHARE.seq || !b) return;
    if (SHARE.url) URL.revokeObjectURL(SHARE.url);
    SHARE.blob = b; SHARE.url = URL.createObjectURL(b); const im = $("#shareimg"); if (im) im.src = SHARE.url;
  }, "image/png")).catch(() => toast("สร้างการ์ดไม่สำเร็จ ลองอีกครั้งนะ"));
}
SUBS.share = () => {
  const on = SHARE.opt.weight;
  return {
    title: "แชร์ความคืบหน้า", after: renderShare,
    html: `<div class="seg" style="margin-bottom:10px"><button class="${SHARE.kind === "progress" ? "on" : ""}" data-act="shkind" data-k="progress">ความคืบหน้า</button><button class="${SHARE.kind === "week" ? "on" : ""}" data-act="shkind" data-k="week">สรุปสัปดาห์</button></div><div class="card" style="padding:10px"><img id="shareimg" alt="การ์ดความคืบหน้า" style="width:100%;aspect-ratio:4/5;object-fit:contain;border-radius:14px;display:block;background:var(--soft)"/></div>
${SHARE.kind === "week" ? "" : `<div class="sec">แสดงในการ์ด</div>
<div class="row between"><span>น้ำหนักที่ลดไป<br><span class="xs muted">แสดงเฉพาะตอนลดลงเท่านั้น</span></span><button class="btn ${on ? "primary" : ""}" data-act="shopt" data-k="weight" aria-pressed="${on}">${on ? "แสดง" : "ซ่อน"}</button></div>`}
<p class="xs muted" style="margin-top:8px">การ์ดไม่มีแคลอรี่ ไม่มีอาหารที่กิน และไม่มีน้ำหนักตัวจริง ทุกอย่างสร้างในเครื่องของคุณ ไม่ถูกอัปโหลดไปที่ไหน</p>
<div class="row" style="margin-top:12px"><button class="btn primary" style="flex:1" data-act="shsend">${ic("send", 18)}แชร์</button><button class="btn" style="flex:1" data-act="shsave">บันทึกรูป</button></div>`
  };
};
ACT.shkind = (a) => { SHARE.kind = a.dataset.k; rerenderSub(); };
ACT.shopt = (a) => { SHARE.opt[a.dataset.k] = !SHARE.opt[a.dataset.k]; rerenderSub(); };
ACT.shsave = () => {
  if (!SHARE.blob) { toast("รอสักครู่ กำลังสร้างการ์ด"); return; }
  const a = document.createElement("a"); a.href = SHARE.url; a.download = "maalot-" + todayKey() + ".png"; document.body.appendChild(a); a.click(); a.remove(); toast("บันทึกรูปแล้ว");
};
ACT.shsend = async () => {
  if (!SHARE.blob) { toast("รอสักครู่ กำลังสร้างการ์ด"); return; }
  const file = new File([SHARE.blob], "maalot.png", { type: "image/png" });
  const url = location.origin + (/^\/?$/.test(location.pathname) ? "" : location.pathname.replace(/index\.html$/, ""));
  const text = `${SHARE.kind === "week" ? "สรุปสัปดาห์ของฉันกับ Maalot" : "ฉันดูแลตัวเองกับ Maalot ต่อเนื่อง " + (S.streak.n || 0) + " วันแล้ว"} ${/localhost/.test(location.host) ? "" : url}`.trim();
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text }); } catch (e) { if (e && e.name !== "AbortError") ACT.shsave(); } }
  else { ACT.shsave(); toast("เครื่องนี้แชร์ตรงๆ ไม่ได้ บันทึกรูปไว้แล้ว นำไปส่งต่อได้เลย"); }
};
