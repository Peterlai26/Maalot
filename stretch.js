/* โหมดพักยืดเส้น: ตั้งเตือนให้ลุกยืดทุก 30/45/60 นาที + ยืดนำทาง 3 นาที (เตือนทำงานตอนเปิดแอปค้างไว้) */
const STR_MOVES = [
  ["ยืดคอ", "เอียงศีรษะไปทางซ้ายช้าๆ ค้างไว้ แล้วสลับไปขวา ไหล่ผ่อนคลาย ไม่เกร็ง", "user"],
  ["หมุนไหล่", "ยกไหล่ขึ้นหูแล้วหมุนไปด้านหลังเป็นวงกลมใหญ่ ช้าๆ ต่อเนื่อง", "dumbbell"],
  ["ยืดแขนและข้อมือ", "เหยียดแขนตรงไปด้านหน้า ใช้มืออีกข้างกดปลายนิ้วกลับเข้าหาตัว สลับข้าง", "heart"],
  ["บิดตัวนั่ง", "นั่งหลังตรง บิดลำตัวไปด้านหนึ่ง มือจับพนักเก้าอี้ ค้างแล้วสลับข้าง", "sparkle"],
  ["ยืดน่องและหลังขา", "ยืนก้าวขาข้างหนึ่งไปหน้า ส้นเท้าชิดพื้น โน้มตัวไปหน้านิดๆ สลับขา", "run"],
  ["พักสายตา", "มองวัตถุไกลออกไปกว่า 6 เมตร นาน 20 วินาที กะพริบตาบ่อยๆ ให้ชุ่มชื้น", "sun"]
];
const STR_SEC = 30;
function strData() { if (!S.stretch) S.stretch = { on: false, every: 45, next: 0, log: {} }; return S.stretch; }
const strToday = () => (strData().log[todayKey()] || 0);
let SG = null, STR_ASK = 0;
function strSchedule() { const d = strData(); d.next = Date.now() + d.every * 60000; save(); }
function strDue() {
  const d = strData(); if (!d.on || !d.next || Date.now() < d.next) return;
  const h = new Date().getHours(); if (h < 7 || h >= 22) { d.next = Date.now() + 30 * 60000; save(); return; } /* ไม่เตือนกลางคืน */
  if (STR_ASK > Date.now()) return;
  if (document.visibilityState === "visible") { if (!$("#modal").hidden || (SG && SG.run)) return; STR_ASK = Date.now() + 60000; strPop(); }
  else { remNotify("ถึงเวลาลุกยืดเส้นแล้ว นั่งนานแล้วนะ"); d.next = Date.now() + d.every * 60000; save(); }
}
function strPop() { const d = strData(); d.next = 0; save(); try { if (navigator.vibrate) navigator.vibrate([150, 80, 150]); } catch (e) { }
  openModal(`<div class="nask"><span class="nask-ic">${ic("timer", 34)}<i></i></span><h2>ถึงเวลาลุกยืดเส้นแล้ว</h2><p class="muted sm">นั่งมานานแล้ว ยืดสัก 3 นาที ปวดหลังปวดไหล่จะน้อยลง</p><button class="btn primary block go" data-act="strgo">${ic("play", 18)}ยืดเลย 3 นาที</button><button class="btn block" style="margin-top:8px" data-act="strlater">อีก 10 นาที</button><button class="btn block" style="margin-top:8px;background:none;border:0" data-act="strskip">ข้ามรอบนี้</button></div>`); }
ACT.strlater = () => { closeModal(); strData().next = Date.now() + 10 * 60000; save(); };
ACT.strskip = () => { closeModal(); strSchedule(); };
setInterval(strDue, 5000); document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") strDue(); });

SUBS.stretch = () => {
  const d = strData(), left = d.on && d.next ? Math.max(0, d.next - Date.now()) : 0, tot = d.every * 60000, mm = Math.ceil(left / 60000), days = [6, 5, 4, 3, 2, 1, 0].map(k => ({ k: addDays(todayKey(), -k), n: d.log[addDays(todayKey(), -k)] || 0 }));
  return { title: "พักยืดเส้น", keepScroll: true, html: `<div class="card strc">${hbRing(d.on && d.next ? 1 - left / tot : 0, d.on ? (d.next ? mm + " น." : "—") : "ปิด", true)}<div class="wkt"><b>${d.on ? (d.next ? "อีก " + mm + " นาทีถึงรอบยืด" : "รอรอบถัดไป") : "ยังไม่ได้เปิดเตือน"}</b><span class="xs muted">วันนี้ยืดไปแล้ว ${strToday()} รอบ</span></div></div>
<button class="btn primary block go" data-act="strgo">${ic("play", 18)}ยืดเส้นเลย 3 นาที</button>
<div class="sec">เตือนให้ลุกยืด</div><div class="card strsw"><div class="row between"><b>${d.on ? "เปิดอยู่" : "ปิดอยู่"}</b><button class="swt${d.on ? " on" : ""}" data-act="strtoggle" role="switch" aria-checked="${d.on}" aria-label="เปิดปิดเตือน"><i></i></button></div><div class="pills" style="margin:10px 0 0">${[30, 45, 60].map(m => `<button class="pill${d.every === m ? " on" : ""}" data-act="strevery" data-v="${m}">ทุก ${m} นาที</button>`).join("")}</div><p class="xs muted" style="margin-top:8px">เตือนระหว่าง 07:00–22:00 เฉพาะตอนเปิดแอปค้างไว้ ถ้าอยู่หน้าอื่นจะเด้งเป็นหน้าต่างให้ยืด ถ้าปิดแอปไปแล้วเตือนไม่ได้</p></div>
<div class="sec">ท่าในรอบ 3 นาที</div><div class="card strl">${STR_MOVES.map((m, i) => `<div class="strm"><span class="strn">${i + 1}</span><div><b>${m[0]}</b><span>${m[1]}</span></div></div>`).join("")}</div>
<div class="sec">7 วันล่าสุด</div><div class="card strd">${days.map(x => `<div class="${x.n ? "on" : ""}"><b>${x.n || "·"}</b><small>${new Date(x.k + "T12:00:00").toLocaleDateString("th-TH", { weekday: "short" })}</small></div>`).join("")}</div>` };
};
ACT.strtoggle = async () => { const d = strData(); d.on = !d.on; if (d.on) { strSchedule(); if ("Notification" in window && Notification.permission === "default") { try { await Notification.requestPermission(); } catch (e) { } } } else { d.next = 0; save(); } rerenderSub(); };
ACT.strevery = a => { const d = strData(); d.every = +a.dataset.v; if (d.on) strSchedule(); else save(); rerenderSub(); };
ACT.strgo = () => { if (!$("#modal").hidden) closeModal(); SG = { i: 0, left: STR_SEC, run: true, t: null }; const top = subStack[subStack.length - 1]; if (!(top && top.name === "stretchgo")) openSub("stretchgo", {}); else rerenderSub(); clearInterval(SG.t); SG.t = setInterval(strTick, 1000); };
function strTick() {
  if (!SG) return; SG.left--;
  if (SG.left <= 0) { SG.i++; SG.left = STR_SEC; try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) { } if (SG.i >= STR_MOVES.length) { strFinish(); return; } rerenderSub(); return; }
  const n = $("#sgn"), r = $("#sgr"); if (n) n.textContent = SG.left; if (r) r.style.strokeDashoffset = (2 * Math.PI * 34 * (1 - SG.left / STR_SEC)).toFixed(1);
}
function strFinish() { clearInterval(SG.t); SG = null; const d = strData(); d.log[todayKey()] = (d.log[todayKey()] || 0) + 1; if (d.on) d.next = Date.now() + d.every * 60000; S.coins += 3; save(); confetti(); popCoins(3); toast("ยืดครบแล้ว เก่งมาก"); const t = subStack[subStack.length - 1]; if (t && t.name === "stretchgo") closeSub(); }
SUBS.stretchgo = () => {
  if (!SG) return { title: "ยืดเส้น", html: emptyState("timer", "จบรอบแล้ว", "กลับไปที่หน้าพักยืดเส้นได้เลย") };
  const m = STR_MOVES[SG.i], C = 2 * Math.PI * 34;
  return { title: "ยืดเส้น " + (SG.i + 1) + "/" + STR_MOVES.length, html: `<div class="sgv"><div class="onbdots">${STR_MOVES.map((x, i) => `<i class="${i < SG.i ? "done" : i === SG.i ? "on" : ""}"></i>`).join("")}</div>
<div class="sgring gov-ring hbbig"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="rb" cx="40" cy="40" r="34"/><circle id="sgr" class="rf" cx="40" cy="40" r="34" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - SG.left / STR_SEC)).toFixed(1)};animation:none"/></svg><b id="sgn">${SG.left}</b></div>
<h2 class="sgt">${m[0]}</h2><p class="sgp">${m[1]}</p>
<div class="row" style="gap:8px;margin-top:18px"><button class="btn" data-act="strnext">ข้ามท่า</button><button class="btn" data-act="strstop">หยุด</button></div></div>` };
};
ACT.strnext = () => { if (!SG) return; SG.i++; SG.left = STR_SEC; if (SG.i >= STR_MOVES.length) strFinish(); else rerenderSub(); };
ACT.strstop = () => { if (SG) clearInterval(SG.t); SG = null; closeSub(); };
registerMode({ cat: "วินัย", icon: "timer", title: "พักยืดเส้น", sub: "เตือนลุกยืด · ยืดนำทาง 3 นาที", name: "stretch", isnew: true, tone: "blue", kw: "ยืด พัก ลุก ปวดหลัง ไหล่ นั่งนาน ออฟฟิศ เตือน" }, SUBS.stretch);
