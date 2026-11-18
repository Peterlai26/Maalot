/* โหมดใหม่ 3 อย่าง: นิสัยประจำวัน · เดินวันนี้ (นับก้าวจาก GPS) · กินนอกบ้าน — ลงทะเบียนผ่าน MODES */
function registerMode(m, fn) {
  SUBS[m.name] = a => { const r = fn(a); if (r && typeof r.html === "string") r.html = modeHero(m) + r.html; return r; };
  MODES.push(m); TILES.push([m.cat, m.icon, m.title, m.sub, m.name, m.arg || "", m.tone || "", m.kw || ""]);
}
const hbRing = (p, label, big) => { const C = 2 * Math.PI * 34; return `<div class="gov-ring${big ? " hbbig" : ""}"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="rb" cx="40" cy="40" r="34"/><circle class="rf" cx="40" cy="40" r="34" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - Math.min(1, p))).toFixed(1)}"/></svg><b>${label}</b></div>`; };

/* ---------- 1) นิสัยประจำวัน ---------- */
const HAB_DEF = [["h_veg", "กินผักอย่างน้อย 2 มื้อ", "bowl"], ["h_sweet", "งดน้ำหวานวันนี้", "droplet"], ["h_move", "ขยับตัวหรือเดิน 15 นาที", "run"], ["h_water", "ดื่มน้ำให้พอ", "droplet"], ["h_sleep", "เข้านอนก่อนเที่ยงคืน", "moon"]];
let HEDIT = false;
function habData() { if (!S.habits) S.habits = { list: HAB_DEF.map(h => ({ id: h[0], n: h[1], i: h[2] })), done: {}, rew: "" }; return S.habits; }
const habOn = (id, d) => ((habData().done[d] || []).indexOf(id) > -1);
function habStreak(id) { let d = todayKey(), n = 0; if (!habOn(id, d)) d = addDays(d, -1); while (habOn(id, d) && n < 400) { n++; d = addDays(d, -1); } return n; }
SUBS.habits = () => {
  const H = habData(), t = todayKey(), done = H.list.filter(h => habOn(h.id, t)).length, tot = H.list.length, all = tot && done === tot;
  const rows = H.list.map((h, i) => { const on = habOn(h.id, t), st = habStreak(h.id), dots = [6, 5, 4, 3, 2, 1, 0].map(k => `<i class="${habOn(h.id, addDays(t, -k)) ? "on" : ""}"></i>`).join(""); return `<div class="hbrow${on ? " on" : ""}" style="--i:${i}"><button class="hbk" data-act="habtog" data-id="${h.id}" aria-pressed="${on}" aria-label="${esc(h.n)}"><span class="hbc">${ic("check", 18)}</span><span class="hbi">${ic(h.i || "check", 16)}</span><div class="grow"><b>${esc(h.n)}</b><div class="hbd">${dots}</div></div>${st ? `<span class="hbs">${ic("flame", 13)}${st}</span>` : ""}</button>${HEDIT ? `<button class="hbx" data-act="habdel" data-id="${h.id}" aria-label="ลบ">${ic("trash", 16)}</button>` : ""}</div>`; }).join("");
  return { title: "นิสัยประจำวัน", keepScroll: true, html: `<div class="card gov">${hbRing(tot ? done / tot : 0, done + "/" + tot)}<div class="gov-t"><b>${all ? "ครบทุกข้อแล้ว เก่งมาก!" : done ? "ไปต่ออีกนิดนะ" : "เริ่มจากข้อง่ายๆ ก่อนก็ได้"}</b><span class="xs muted">${all ? "ได้เหรียญของวันนี้แล้ว" : "ติ๊กครบทุกข้อวันละครั้ง รับ 10 เหรียญ"}</span></div></div>
<div class="hblist">${rows || emptyState("check", "ยังไม่มีนิสัย", "เพิ่มข้อแรกด้านล่างได้เลย")}</div>
<div class="hbadd"><input id="habin" type="text" maxlength="30" placeholder="เพิ่มนิสัยของคุณ เช่น ไม่กินจุบจิบหลัง 3 ทุ่ม" autocomplete="off"/><button class="btn primary" data-act="habadd">${ic("plus", 16)}เพิ่ม</button></div>
<button class="btn block" style="margin-top:10px" data-act="habedit">${HEDIT ? "เสร็จแล้ว" : "แก้ไขรายการ"}</button>` };
};
ACT.habtog = a => {
  const H = habData(), t = todayKey(), id = a.dataset.id, d = H.done[t] || (H.done[t] = []), i = d.indexOf(id); if (i > -1) d.splice(i, 1); else d.push(id);
  if (H.list.length && H.list.every(h => d.indexOf(h.id) > -1) && H.rew !== t) { H.rew = t; S.coins += 10; confetti(); popCoins(10); }
  save(); rerenderSub();
};
ACT.habadd = () => { const i = $("#habin"), v = (i && i.value || "").trim(); if (!v) { toast("พิมพ์ชื่อนิสัยก่อนนะ"); return; } const H = habData(); if (H.list.length >= 12) { toast("เพิ่มได้สูงสุด 12 ข้อ"); return; } H.list.push({ id: "h" + Date.now().toString(36), n: v, i: "check" }); save(); rerenderSub(); };
ACT.habdel = a => { const H = habData(); H.list = H.list.filter(h => h.id !== a.dataset.id); save(); rerenderSub(); };
ACT.habedit = () => { HEDIT = !HEDIT; rerenderSub(); };
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.id === "habin") ACT.habadd(); });

/* ---------- 2) เดินวันนี้ (GPS) ---------- */
let WK = { on: false, last: null, wid: null, tick: null, err: "", t0: 0 };
const wkLog = d => { if (!S.walkLog) S.walkLog = {}; return S.walkLog[d] || (S.walkLog[d] = { m: 0, extra: 0, secs: 0 }); };
const wkStride = () => ((S.prof && S.prof.h) || 165) * .415 / 100;
const wkSteps = d => { const l = (S.walkLog || {})[d]; return l ? Math.max(l.health || 0, Math.round(l.m / wkStride())) + (l.extra || 0) : 0; };
function wkOnPos(p) {
  const c = p.coords; if (c.accuracy > 40) { WK.err = "สัญญาณ GPS ยังไม่แม่น รอสักครู่หรือออกที่โล่ง"; return; } WK.err = "";
  const cur = { la: c.latitude, lo: c.longitude, t: p.timestamp };
  if (WK.last) {
    const d = hav(WK.last.la, WK.last.lo, cur.la, cur.lo), dt = (cur.t - WK.last.t) / 1000;
    if (d < Math.max(4, c.accuracy * .5)) return;
    if (dt > 0 && d / dt > 4) { WK.last = cur; return; } /* เร็วเกินเดิน เช่น นั่งรถ ไม่นับ */
    const l = wkLog(todayKey()); l.m += d; l.secs += Math.min(dt, 30); WK.since = (WK.since || 0) + 1; if (WK.since % 5 === 0) save();
    const goal = S.walkGoal || 8000; if (wkSteps(todayKey()) >= goal && S.walkRew !== todayKey()) { S.walkRew = todayKey(); S.coins += 10; save(); confetti(); popCoins(10); toast("ถึงเป้าก้าววันนี้แล้ว"); }
  }
  WK.last = cur;
}
let WKL = null;
async function wkLock() { try { if (!NAT.bg && "wakeLock" in navigator && WK.on && document.visibilityState === "visible" && !WKL) { WKL = await navigator.wakeLock.request("screen"); WKL.addEventListener("release", () => { WKL = null; }); } } catch (e) { WKL = null; } }
function wkUnlock() { try { if (WKL) WKL.release(); } catch (e) { } WKL = null; }
document.addEventListener("visibilitychange", () => { if (WK.on && document.visibilityState === "visible") wkLock(); });
function wkStart() {
  if (NAT.bg) { /* แอปมือถือ: นับต่อเบื้องหลังได้ มีแจ้งเตือนค้างขณะนับ */
    WK.on = true; WK.last = null; WK.err = "รอสัญญาณ GPS"; S.walkAsked = true; save();
    NAT.bg.addWatcher({ backgroundTitle: "Maalot กำลังนับก้าว", backgroundMessage: "แตะเพื่อกลับไปที่แอป", requestPermissions: true, stale: false, distanceFilter: 5 }, (loc, err) => {
      if (err) { WK.err = err.code === "NOT_AUTHORIZED" ? "ยังไม่ได้อนุญาตตำแหน่ง เปิดสิทธิ์ที่ตั้งค่าของเครื่องแล้วลองใหม่" : "สัญญาณ GPS อ่อน ลองออกที่โล่ง"; if (err.code === "NOT_AUTHORIZED") wkStop(); return; }
      wkOnPos({ coords: { latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy }, timestamp: loc.time || Date.now() });
    }).then(id => { WK.nid = id; if (!WK.on) NAT.bg.removeWatcher({ id }); });
    clearInterval(WK.tick); WK.tick = setInterval(() => { const t = subStack[subStack.length - 1]; if (t && t.name === "walk" && !$("#sub").hidden) rerenderSub(); }, 2500); rerenderSub(); return;
  }
  if (!navigator.geolocation) { toast("เครื่องนี้ไม่รองรับ GPS ในเบราว์เซอร์ ใช้เพิ่มก้าวเองแทนได้"); return; }
  WK.on = true; WK.last = null; WK.err = "รอสัญญาณ GPS";
  try { WK.wid = navigator.geolocation.watchPosition(wkOnPos, e => { WK.err = e.code === 1 ? "ไม่ได้รับอนุญาตใช้ตำแหน่ง เปิดสิทธิ์ตำแหน่งให้เบราว์เซอร์แล้วลองใหม่" : "สัญญาณ GPS อ่อน ลองออกที่โล่ง"; if (e.code === 1) wkStop(); }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }); } catch (e) { WK.err = "เปิด GPS ไม่สำเร็จ"; WK.on = false; }
  wkLock();
  clearInterval(WK.tick); WK.tick = setInterval(() => { const t = subStack[subStack.length - 1]; if (t && t.name === "walk" && !$("#sub").hidden) rerenderSub(); }, 2500); rerenderSub();
}
function wkStop() { try { if (NAT.bg && WK.nid != null) NAT.bg.removeWatcher({ id: WK.nid }); } catch (e) { } WK.nid = null; try { if (WK.wid != null) navigator.geolocation.clearWatch(WK.wid); } catch (e) { } WK.wid = null; WK.on = false; WK.last = null; wkUnlock(); clearInterval(WK.tick); WK.tick = null; save(); }
let HLT = { busy: false, t: 0 };
function wkHealthSync(silent) { if (!NAT.health) return Promise.resolve(false); if (HLT.p) return HLT.p; HLT.p = wkHealthRun(silent).finally(() => { HLT.p = null; }); return HLT.p; }
async function wkHealthRun(silent) {
  try {
    const av = await NAT.health.isAvailable(); if (av && av.available === false) { if (!silent) toast("เครื่องนี้ยังใช้ Health Connect ไม่ได้ ติดตั้ง Health Connect จาก Play Store ก่อน"); return false; }
    const au = await NAT.health.requestAuthorization({ read: ["steps"] }); if (au && au.readAuthorized && au.readAuthorized.indexOf("steps") < 0) { if (!silent) toast("ยังไม่ได้อนุญาตให้อ่านก้าว"); return false; }
    const st = new Date(); st.setHours(0, 0, 0, 0); st.setDate(st.getDate() - 6);
    const r = await NAT.health.queryAggregated({ dataType: "steps", startDate: st.toISOString(), endDate: new Date().toISOString(), bucket: "day" });
    (r.samples || []).forEach(x => { const d0 = new Date(x.startDate), k = d0.getFullYear() + "-" + String(d0.getMonth() + 1).padStart(2, "0") + "-" + String(d0.getDate()).padStart(2, "0"); wkLog(k).health = Math.round(x.value || 0); });
    HLT.t = Date.now(); save(); const t = subStack[subStack.length - 1]; if (t && t.name === "walk") rerenderSub(); return true;
  } catch (e) { if (!silent) toast("อ่านก้าวจากแอปสุขภาพไม่สำเร็จ"); return false; } }

ACT.wkhealth = async () => { S.walkHealth = !S.walkHealth; save(); rerenderSub(); if (S.walkHealth) { const ok = await wkHealthSync(false); if (!ok) { S.walkHealth = false; save(); rerenderSub(); } else toast("ดึงก้าวจากแอปสุขภาพแล้ว"); } };
SUBS.walk = () => {
  const t = todayKey(), goal = S.walkGoal || 8000, st = wkSteps(t), l = (S.walkLog || {})[t] || { m: 0, secs: 0 }, km = l.m / 1000, wt = (S.weights && S.weights.length ? S.weights[S.weights.length - 1].w : (S.prof && S.prof.w0)) || 60, kc = Math.round(.5 * wt * km + (l.extra || 0) * .04);
  const days = [6, 5, 4, 3, 2, 1, 0].map(k => { const d = addDays(t, -k), s = wkSteps(d); return { d, s }; }), mx = Math.max(goal, ...days.map(x => x.s));
  const wd = d => new Date(d + "T12:00:00").toLocaleDateString("th-TH", { weekday: "short" });
  return { title: "เดินวันนี้", keepScroll: true, after: () => { if (S.walkHealth && NAT.health && Date.now() - HLT.t > 120000) wkHealthSync(true); }, html: `<div class="card wkc">${hbRing(st / goal, fmtN(st), true)}<div class="wkt"><b>${fmtN(st)} / ${fmtN(goal)} ก้าว</b><span class="xs muted">${st >= goal ? "ถึงเป้าแล้ว!" : "อีก " + fmtN(goal - st) + " ก้าวถึงเป้า"}</span></div></div>
<div class="wkstat"><span><b>${km.toFixed(2)}</b>กม.</span><span><b>${fmtN(kc)}</b>kcal</span><span><b>${Math.round(l.secs / 60)}</b>นาที</span></div>
<button class="btn ${WK.on ? "" : "primary"} block go wkbtn${WK.on ? " live" : ""}" data-act="wkgo">${ic(WK.on ? "pause" : "run", 18)}${WK.on ? "หยุดนับ" : "เริ่มนับก้าวด้วย GPS"}</button>
<p class="xs muted wkn">${WK.on ? esc(WK.err || (NAT.bg ? "กำลังนับ นับต่อให้แม้ปิดจอหรือสลับแอป" : "wakeLock" in navigator ? "กำลังนับ จอจะไม่ดับระหว่างเดิน อย่าสลับไปแอปอื่นหรือล็อกจอเอง" : "กำลังนับ เบราว์เซอร์นี้กันจอดับไม่ได้ ตั้งเวลาหน้าจอให้นานขึ้นและเปิดแอปค้างไว้")) : (NAT.bg ? "นับต่อให้แม้ปิดจอหรือสลับแอป (จะมีแจ้งเตือนค้างขณะนับ) ตำแหน่งอยู่ในเครื่องคุณเท่านั้น ก้าวคำนวณจากระยะทางและส่วนสูง (ค่าประมาณ)" : "ระหว่างนับ แอปจะกันจอดับให้ แต่ต้องเปิดแอปค้างไว้ ตำแหน่งอยู่ในเครื่องคุณเท่านั้น ก้าวคำนวณจากระยะทางและส่วนสูง (ค่าประมาณ)")}</p>${NAT.health ? `<div class="card sm hlc"><div class="row between"><b>${ic("heart", 16)} ก้าวจากแอปสุขภาพของเครื่อง</b><button class="swt${S.walkHealth ? " on" : ""}" data-act="wkhealth" role="switch" aria-checked="${!!S.walkHealth}" aria-label="เปิดปิดอ่านก้าวจากแอปสุขภาพ"><i></i></button></div><p class="xs muted" style="margin-top:6px">อ่านจำนวนก้าวต่อวันจาก ${isIOS() ? "Apple Health" : "Health Connect"} ใช้ค่าที่มากกว่าระหว่างก้าวจากสุขภาพกับที่นับด้วย GPS</p></div>` : ""}
<div class="sec">เป้าก้าวต่อวัน</div><div class="pills">${[5000, 8000, 10000].map(g => `<button class="pill${goal === g ? " on" : ""}" data-act="wkgoal" data-v="${g}">${fmtN(g)}</button>`).join("")}</div>
<div class="sec">เพิ่มก้าวเอง</div><div class="hbadd"><input id="wkin" type="number" inputmode="numeric" placeholder="เช่น 1500" /><button class="btn" data-act="wkadd">${ic("plus", 16)}เพิ่ม</button></div>
<div class="sec">7 วันล่าสุด</div><div class="card wkbars">${days.map(x => `<div class="wkb${x.d === t ? " today" : ""}"><i style="height:${Math.max(4, Math.round(x.s / mx * 100))}%" class="${x.s >= goal ? "ok" : ""}"></i><small>${wd(x.d)}</small></div>`).join("")}</div>` };
};
ACT.wkgo = () => {
  if (WK.on) { wkStop(); rerenderSub(); return; }
  const go = () => wkStart();
  const ask = () => openModal(`<div class="nask"><span class="nask-ic">${ic("run", 34)}</span><h2>ขออนุญาตใช้ตำแหน่ง</h2><p class="muted sm">ใช้วัดระยะทางที่เดินเพื่อนับก้าว ใช้เฉพาะตอนที่กดเริ่มนับและเปิดแอปไว้ ตำแหน่งเก็บอยู่ในเครื่องคุณ ไม่ส่งออกไปที่ไหน เมื่อกดยืนยัน เบราว์เซอร์จะถามสิทธิ์อีกครั้ง</p><button class="btn primary block go" data-act="wkok">${ic("check", 18)}ยืนยัน</button><button class="btn block" style="margin-top:8px" data-act="notifno">ไม่ใช่ตอนนี้</button></div>`);
  if (NAT.bg && S.walkAsked) { go(); return; }
  if (!NAT.bg && navigator.permissions && navigator.permissions.query) navigator.permissions.query({ name: "geolocation" }).then(r => { if (r.state === "granted") go(); else ask(); }).catch(ask); else ask();
};
ACT.wkok = () => { closeModal(); wkStart(); };
ACT.wkgoal = a => { S.walkGoal = +a.dataset.v; save(); rerenderSub(); };
ACT.wkadd = () => { const v = parseInt(($("#wkin") || {}).value, 10); if (!(v > 0 && v <= 50000)) { toast("ใส่จำนวนก้าวให้ถูกต้อง"); return; } wkLog(todayKey()).extra += v; save(); rerenderSub(); };

/* ---------- 3) กินนอกบ้าน ---------- */
const DINE = [
  { k: "rice", n: "ร้านข้าวแกง", ic: "bowl", tip: ["เลือกกับข้าวต้มหรือผัดผักก่อนของทอด", "ตักข้าวพอดี ไม่เกินหนึ่งทัพพีครึ่ง", "แกงกะทิและของทอด เลือกอย่างใดอย่างหนึ่ง"], f: ["ข้าวราดแกง", "แกงจืดเต้าหู้หมูสับ", "ผัดผักรวม", "ไข่พะโล้", "ปลาทอด", "แกงเลียง", "ต้มโคล้งปลากรอบ", "แกงส้มผักรวมกุ้ง", "ข้าวสวย"] },
  { k: "order", n: "ตามสั่ง", ic: "flame", tip: ["ขอไข่ดาวไม่ทอดน้ำมันมาก หรือเปลี่ยนเป็นไข่ต้ม", "ขอผักเพิ่ม และน้ำจิ้มแยก", "ข้าวผัดมันกว่าข้าวราดผัด เลือกอย่างหลังจะเบากว่า"], f: ["ข้าวกะเพราไก่ไข่ดาว", "กะเพราหมูสับราดข้าว", "ข้าวผัดหมู", "ข้าวผัดกุ้ง", "ข้าวไข่เจียว", "ผัดผักบุ้งไฟแดง", "ข้าวหมูทอดกระเทียม", "ผัดพริกขิงหมู", "ข้าวกะเพราทะเล"] },
  { k: "noodle", n: "ก๋วยเตี๋ยว", ic: "bowl", tip: ["เลือกน้ำใสแทนน้ำข้น", "ซดน้ำน้อยลง ลดโซเดียม", "ขอผักและถั่วงอกเพิ่ม"], f: ["ก๋วยเตี๋ยวไก่", "ก๋วยเตี๋ยวหมู", "ก๋วยเตี๋ยวเนื้อ", "ก๋วยเตี๋ยวเรือ", "ก๋วยเตี๋ยวต้มยำ", "เย็นตาโฟ", "บะหมี่เกี๊ยว", "ราดหน้า", "ผัดซีอิ๊ว", "ก๋วยจั๊บ"] },
  { k: "isan", n: "ส้มตำ อีสาน", ic: "sun", tip: ["ไก่ย่างเอาหนังออกจะเบากว่า", "ข้าวเหนียวหนึ่งห่อพอดีแล้ว", "ส้มตำเลือกไม่หวานมาก"], f: ["ส้มตำ", "ลาบหมู", "ลาบไก่", "น้ำตกหมู", "ไก่ย่าง", "สะโพกไก่ย่าง", "คอหมูย่าง 1 จาน", "ตำถั่ว", "ข้าวเหนียว 1 ห่อ", "ไส้กรอกอีสาน 1 อัน"] },
  { k: "conv", n: "ร้านสะดวกซื้อ", ic: "bag", tip: ["ไข่ต้มกับนมจืดเป็นมื้อเบาที่อิ่มนาน", "ดูแคลอรี่ที่ฉลากก่อนหยิบ", "เลี่ยงขนมซองและน้ำอัดลม"], f: ["ไข่ต้ม", "นมจืด 1 กล่อง", "โยเกิร์ต", "แซนด์วิชทูน่า", "แซนด์วิชแฮมชีส", "ข้าวโพดต้ม", "กล้วย", "ถั่วลิสง 1 กำมือ", "ขนมปังโฮลวีท 2 แผ่น", "บะหมี่กึ่งสำเร็จรูป"] },
  { k: "cafe", n: "คาเฟ่ เบเกอรี่", ic: "heart", tip: ["เลือกหวานน้อยหรือไม่ใส่น้ำเชื่อม", "ขนมแบ่งกินกับเพื่อนครึ่งชิ้นก็ได้", "มื้อนี้ถ้ากินขนมแล้ว มื้อหลักเบาลงนิดหน่อย"], f: ["โยเกิร์ตปั่น", "สมูทตี้ผลไม้", "แซนด์วิชไข่", "นมเย็น", "โกโก้เย็น", "มอคค่า", "ครัวซองต์ 1 ชิ้น", "คุกกี้ 1 ชิ้น", "เค้ก 1 ชิ้น", "โดนัท 1 ชิ้น"] },
  { k: "fast", n: "ฟาสต์ฟู้ดและต่างชาติ", ic: "sparkle", tip: ["เลือกขนาดเล็กหรือไม่ต่อเซ็ตก็ได้", "เปลี่ยนน้ำอัดลมเป็นน้ำเปล่า", "สั่งสลัดหรือซุปเพิ่มให้อิ่มโดยไม่หนักมัน"], f: ["ไก่ทอด 1 ชิ้น", "เฟรนช์ฟรายส์", "สเต๊กไก่", "สเต๊กหมู", "สปาเก็ตตี้ซอสมะเขือเทศ", "ราเมง 1 ชาม", "ซูชิ 1 ชิ้น", "เกี๊ยวซ่า 5 ชิ้น", "ปลาแซลมอนย่าง", "สลัดผักอกไก่"] },
  { k: "buffet", n: "บุฟเฟ่ต์ หมูกระทะ", ic: "party", tip: ["กินผักและโปรตีนไม่ติดมันก่อน แล้วค่อยของที่ชอบ", "ตั้งใจกี่รอบไว้ก่อน และกินช้าๆ", "มีงานบุฟเฟ่ต์ล่วงหน้า? ใช้โหมดวันหลุดเผื่อที่ไว้ได้"], f: ["คอหมูย่าง 1 จาน", "สลัดผักอกไก่", "ปลานึ่งมะนาว", "อกไก่ต้ม", "ผัดผักรวม", "ต้มยำกุ้ง", "ปลาแซลมอนย่าง"] }
];
let DNK = "rice";
SUBS.dineout = () => {
  const rem = remainingNow(), h = new Date().getHours(), left = h < 11 ? 3 : h < 16 ? 2 : 1, bud = rem > 0 ? Math.max(200, Math.round(rem / left)) : 250, v = DINE.find(x => x.k === DNK) || DINE[0];
  const items = v.f.map(n => FOODS.find(x => x[0] === n)).filter(Boolean).map(f => ({ f, s: f[1] <= bud ? 0 : f[1] <= bud * 1.25 ? 1 : 2 })).sort((a, b) => a.s - b.s || a.f[1] - b.f[1]);
  const lab = ["พอดี", "เกินนิด", "เกินมื้อนี้"];
  return { title: "กินนอกบ้าน", keepScroll: true, html: `<div class="card dnbud"><span>${ic("flame", 16)}เหลือวันนี้ <b>${fmtN(Math.max(0, rem))}</b> kcal</span><span class="xs muted">ประมาณมื้อละ ${fmtN(bud)} kcal</span></div>
<div class="dnv">${DINE.map((x, i) => `<button class="dnvb${x.k === v.k ? " on" : ""}" style="--i:${i}" data-act="dnv" data-k="${x.k}">${ic(x.ic, 20)}<span>${x.n}</span></button>`).join("")}</div>
<div class="sec">ข้อแนะนำสำหรับ ${v.n}</div><div class="card dntip">${v.tip.map(t => `<div>${ic("check", 14)}<span>${esc(t)}</span></div>`).join("")}</div>
<div class="sec">เมนูแนะนำ</div>${items.map((x, i) => `<button class="item lgrow dni s${x.s}" style="--i:${i};width:100%;text-align:left" data-act="logfood" data-t="${esc(x.f[0])}"><div class="grow"><b>${esc(x.f[0])}</b><div class="xs muted">แตะเพื่อบันทึกเป็นมื้อนี้</div></div><span class="dnb">${lab[x.s]}</span><span>${fmtN(x.f[1])} kcal</span></button>`).join("")}
${v.k === "buffet" ? `<button class="btn block" style="margin-top:10px" data-act="sub" data-n="cheat">${ic("moon", 16)}วางแผนวันหลุดล่วงหน้า</button>` : ""}` };
};
ACT.dnv = a => { DNK = a.dataset.k; rerenderSub(); };

[
  [{ cat: "วินัย", icon: "check", title: "นิสัยประจำวัน", sub: "ติ๊กเล็กๆ ทุกวัน สะสมสตรีค", name: "habits", isnew: true, tone: "green", kw: "นิสัย เช็กลิสต์ ติ๊ก สตรีค ผัก น้ำหวาน นอน วินัย" }, SUBS.habits],
  [{ cat: "ออกกำลังกาย", icon: "run", title: "เดินวันนี้", sub: "นับก้าวจาก GPS ตั้งเป้ารายวัน", name: "walk", isnew: true, tone: "green", kw: "เดิน ก้าว gps ระยะ นับก้าว เป้า" }, SUBS.walk],
  [{ cat: "ช่วยตัดสินใจ", icon: "bag", title: "กินนอกบ้าน", sub: "เลือกร้านแล้วแนะนำเมนูที่พอดี", name: "dineout", isnew: true, tone: "amber", kw: "นอกบ้าน ร้าน ข้าวแกง ตามสั่ง ก๋วยเตี๋ยว เซเว่น บุฟเฟ่ต์ คาเฟ่ ฟาสต์ฟู้ด" }, SUBS.dineout]
].forEach(x => registerMode(x[0], x[1]));
