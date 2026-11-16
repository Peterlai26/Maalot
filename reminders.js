/* เตือนให้บันทึก: push จากเซิร์ฟเวอร์ (Cloudflare Worker) ทำงานแม้ปิดแอป + ตัวสำรองในแอปเมื่อไม่รองรับ push */
const PUSH_API = "https://maalot-push.maalot.workers.dev";
const PUSH_KEY = "BKAKn1HS92zZj9E6ARyLhAJw0Skp-BbEmYucuMfEvQyb8191C2lidRFGJ_7Z8ifIlh_Lask5tYQEw077aHf5doc";
const REM_EVERY = [1, 2, 3, 4, 6];
const REM_MSG = [
  [0, "มื้อเช้าได้จดหรือยังนะ เล่าให้น้องฟังได้เลย"],
  [10, "มื้อเที่ยงกินอะไรไปบ้างนะ จดไว้สักหน่อยไหม"],
  [15, "มื้อบ่ายหรือของว่างมีไหม เล่าให้น้องฟังได้นะ"],
  [17, "มื้อเย็นเป็นยังไงบ้าง มาจดไว้ก่อนลืมนะ"],
  [20, "ก่อนจบวัน ลองจดสิ่งที่กินวันนี้ให้ครบนะ"]
];
function remCfg() {
  const r = S.rem || {};
  return { on: !!r.on, everyH: REM_EVERY.includes(r.everyH) ? r.everyH : 3, start: r.start || "08:00", end: r.end || "21:00", push: !!r.push, fired: r.fired || {} };
}
function remSave(c) { S.rem = { on: c.on, everyH: c.everyH, start: c.start, end: c.end, push: c.push, fired: c.fired }; save(); }
function remPerm() { return "Notification" in window ? Notification.permission : "unsupported"; }
function pushSupported() { return !!(PUSH_API && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window); }
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
function remMin(hm) { const m = /^(\d{1,2}):(\d{2})$/.exec(hm || ""); return m ? Math.min(1439, +m[1] * 60 + +m[2]) : null; }
function remSlots(c) {
  const st = remMin(c.start), en = remMin(c.end), out = [];
  if (st === null || en === null || en < st) return out;
  for (let t = st; t <= en; t += c.everyH * 60) out.push(t); return out;
}
function remMsg(h) { let m = REM_MSG[0][1]; REM_MSG.forEach(x => { if (h >= x[0]) m = x[1]; }); return m; }
function remHM(min) { return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0"); }

/* ---- push (ฝั่งเซิร์ฟเวอร์) ---- */
const b64uBytes = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), c => c.charCodeAt(0));
function pushPost(path, body) {
  return fetch(PUSH_API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).then(r => r.json().catch(() => ({})).then(j => ({ ok: r.ok, status: r.status, j })));
}
async function pushSub(create) {
  const reg = await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription();
  if (!sub && create) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uBytes(PUSH_KEY) });
  return sub;
}
async function pushSync() {
  const c = remCfg(); if (!c.on || !c.push || !pushSupported() || remPerm() !== "granted") return false;
  try {
    const sub = await pushSub(true); if (!sub) return false;
    const r = await pushPost("/subscribe", { sub: sub.toJSON(), prefs: { everyH: c.everyH, start: c.start, end: c.end, tzOff: -new Date().getTimezoneOffset() } });
    return r.ok;
  } catch (e) { return false; }
}
async function pushOff() {
  try { const sub = pushSupported() ? await pushSub(false) : null; if (sub) { await pushPost("/unsubscribe", { endpoint: sub.endpoint }).catch(() => { }); await sub.unsubscribe(); } } catch (e) { }
}
let pingCount = -1;
function pushPing() {
  const n = S.meals.length; if (pingCount < 0) { pingCount = n; return; }
  if (n > pingCount) { pingCount = n; const c = remCfg(); if (c.on && c.push) pushSub(false).then(s => { if (s) pushPost("/ping", { endpoint: s.endpoint }).catch(() => { }); }).catch(() => { }); } else pingCount = n;
}

/* ---- ตัวสำรองในแอป (ใช้เมื่อไม่ได้เปิด push) ---- */
function remNotify(text) {
  if (document.visibilityState === "visible") { toast(text); return; }
  if (remPerm() !== "granted") return;
  const opt = { body: text, icon: "icon-192.png", badge: "icon-192.png", tag: "maalot-reminder" };
  if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification("Maalot (มาลด)", opt)).catch(() => { try { new Notification("Maalot (มาลด)", opt); } catch (e) { } });
  else { try { new Notification("Maalot (มาลด)", opt); } catch (e) { } }
}
function checkReminders(now) {
  now = now || new Date(); const c = remCfg(); if (!c.on || c.push || !S.onboarded) return;
  const tk = todayKey(), min = now.getHours() * 60 + now.getMinutes(); let changed = false;
  remSlots(c).forEach(t => {
    const key = tk + "|" + t; if (c.fired[key] || min < t || min >= t + 90) return;
    c.fired[key] = 1; changed = true;
    if (!S.meals.some(m => m.d === tk && m.t >= remHM(Math.max(0, t - 60)))) remNotify(remMsg(Math.floor(t / 60)));
  });
  if (changed) { Object.keys(c.fired).forEach(k => { if (k.slice(0, 10) !== tk) delete c.fired[k]; }); remSave(c); }
}
function startReminders() {
  pushPing(); pushSync();
  setInterval(() => checkReminders(), 30000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkReminders(); });
  checkReminders();
}

/* ---- หน้าตั้งค่า ---- */
function remHTML() {
  const c = remCfg(), p = remPerm(), sup = pushSupported();
  let st;
  if (c.on && c.push && p === "granted") st = "เปิดอยู่ ส่งแจ้งเตือนเข้าโทรศัพท์ได้แม้ปิดแอป";
  else if (isIOS() && !isStandalone()) st = "บน iPhone ต้องติดตั้งเป็นแอปก่อน (ปุ่มด้านล่าง) ถึงจะรับแจ้งเตือนได้ ตอนนี้จะเตือนเป็นข้อความในแอปตอนเปิดอยู่";
  else if (!sup) st = "เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนจากเซิร์ฟเวอร์ จะเตือนเป็นข้อความในแอปตอนเปิดอยู่";
  else if (p === "denied") st = "เบราว์เซอร์บล็อกการแจ้งเตือนไว้ ปลดบล็อกได้ที่ตั้งค่าของเว็บไซต์ แล้วกดปิดเปิดปุ่มด้านบนอีกครั้ง";
  else st = c.on ? "ยังไม่ได้รับอนุญาตการแจ้งเตือน กดปิดแล้วเปิดใหม่เพื่อขออนุญาต" : "ตั้งรอบเวลาได้หลังเปิด";
  return `<div class="sec">เตือนให้บันทึก</div>
<div class="row between"><span>เตือนให้จดมื้ออาหาร</span><button class="btn ${c.on ? "primary" : ""}" data-act="remtoggle" aria-pressed="${c.on}">${c.on ? "เปิดอยู่" : "ปิดอยู่"}</button></div>
${c.on ? `<label class="f" for="rev">เตือนทุกกี่ชั่วโมง</label><select id="rev" data-rem="everyH">${REM_EVERY.map(h => `<option value="${h}" ${h === c.everyH ? "selected" : ""}>ทุก ${h} ชั่วโมง</option>`).join("")}</select>
<div class="grid2"><div><label class="f" for="rst">เริ่มเตือน</label><input id="rst" type="time" value="${c.start}" data-rem="start"/></div><div><label class="f" for="ren">หยุดเตือน</label><input id="ren" type="time" value="${c.end}" data-rem="end"/></div></div>
<p class="xs muted" style="margin-top:6px">จะเตือนที่เวลา ${remSlots(c).map(remHM).join(" · ") || "-"}</p>
<button class="btn block" style="margin-top:10px" data-act="remtest">ทดสอบการเตือน</button>` : ""}
<p class="xs muted" style="margin-top:8px">${st}</p>
<p class="xs muted" style="margin-top:4px">ไม่เตือนในรอบที่คุณเพิ่งจดมื้ออาหารภายใน 1 ชั่วโมง เซิร์ฟเวอร์เก็บเฉพาะที่อยู่รับแจ้งเตือนของเครื่อง เวลาที่ตั้ง และเวลาที่จดมื้อล่าสุด ไม่เก็บชื่ออาหารหรือน้ำหนัก</p>`;
}
ACT.remtoggle = async () => {
  const c = remCfg(); c.on = !c.on;
  if (!c.on) { c.push = false; remSave(c); await pushOff(); rerenderSub(); return; }
  remSave(c);
  if ("Notification" in window && Notification.permission === "default") { try { await Notification.requestPermission(); } catch (e) { } }
  if (pushSupported() && remPerm() === "granted" && !(isIOS() && !isStandalone())) { c.push = true; remSave(c); const ok = await pushSync(); if (!ok) { c.push = false; remSave(c); toast("เชื่อมต่อเซิร์ฟเวอร์แจ้งเตือนไม่สำเร็จ จะเตือนในแอปแทน"); } }
  rerenderSub();
};
ACT.remtest = async () => {
  const c = remCfg();
  if (c.push) {
    try { const s = await pushSub(false); if (s) { const r = await pushPost("/test", { endpoint: s.endpoint }); toast(r.ok && r.j && r.j.ok ? "ส่งแล้ว รอสักครู่ แจ้งเตือนจะเด้งขึ้นมา" : "ส่งไม่สำเร็จ ลองปิดแล้วเปิดใหม่"); return; } } catch (e) { }
    toast("ยังไม่ได้สมัครรับแจ้งเตือน ลองปิดแล้วเปิดใหม่"); return;
  }
  remNotify("ทดสอบเตือนจาก Maalot สำเร็จ"); if (document.visibilityState === "visible") return;
};
document.addEventListener("change", e => {
  const k = e.target && e.target.dataset && e.target.dataset.rem; if (!k || !e.target.value) return;
  const c = remCfg(); c[k] = k === "everyH" ? +e.target.value : e.target.value; remSave(c); pushSync(); rerenderSub();
});
