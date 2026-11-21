/* เตือนวันออกกำลังตามแผน: ผ่านเซิร์ฟเวอร์ (ถึงแม้ปิดแอป) และตัวสำรองในแอป (เมื่อเปิดแอปค้างอยู่) */
(function () {
  const cfg = () => Object.assign({ on: false, min: 1080, pushed: false, fired: "", pinged: "" }, S.wkrem || {});
  const saveCfg = c => { S.wkrem = { on: c.on, min: c.min, pushed: c.pushed, fired: c.fired, pinged: c.pinged }; save(); };
  const hmOf = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"), minOf = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ""); return m ? +m[1] * 60 + +m[2] : null; };
  const days = () => (S.plan && S.plan.days ? S.plan.days.map(d => ({ d: d.dow, n: d.name })) : []);
  const todayPlan = () => days().find(x => x.d === FIT.dow());
  const trainedToday = () => (S.sessions || []).some(s => s.d === todayKey());
  /* ส่งค่าเตือนมื้อ (เดิม) + เตือนออกกำลัง ไปให้เซิร์ฟเวอร์ ใช้แทนฟังก์ชันเดิมของ iff2.js */
  const _ps = pushSync;
  pushSync = async function () {
    const c = remCfg(), w = cfg(), meal = !!(c.on && c.push), wk = !!(w.on && S.plan && days().length);
    if (!meal && !wk) return false; if (!pushSupported() || remPerm() !== "granted") return false;
    if (meal && !wk) return _ps();
    try {
      const sub = await pushSub(true); if (!sub) return false; const f = S.iff, st = meal && f && f.on && typeof iffState === "function" ? iffState() : null;
      const prefs = { everyH: c.everyH, start: c.start, end: c.end, tzOff: -new Date().getTimezoneOffset(), meal };
      if (st && typeof iffWin === "function") prefs.iff = { s: iffWin(f, todayKey()).s, e: iffWin(f, todayKey()).e, base: f.start, eat: f.eat };
      if (wk) prefs.wk = { min: w.min, days: days() };
      const r = await pushPost("/subscribe", { sub: sub.toJSON(), prefs }); const x = cfg(); x.pushed = !!(r.ok && r.j && r.j.wk); saveCfg(x); return r.ok;
    } catch (e) { return false; }
  };
  /* ทำเซสชันวันนี้แล้ว: บอกเซิร์ฟเวอร์ไม่ต้องเตือนซ้ำ */
  async function doneInfo() {
    const c = cfg(); if (!c.on || !c.pushed || c.pinged === todayKey() || !trainedToday() || !pushSupported()) return;
    try { const s = await pushSub(false); if (s) { const r = await pushPost("/wkdone", { endpoint: s.endpoint, day: todayKey() }); if (r.ok) { c.pinged = todayKey(); saveCfg(c); } } } catch (e) { }
  }
  const _sf = sesFinish; sesFinish = function () { _sf.apply(this, arguments); setTimeout(doneInfo, 800); };
  /* ตัวสำรองในแอป: เมื่อเปิดแอปค้างไว้และไม่ได้ใช้การเตือนผ่านเซิร์ฟเวอร์ */
  function check() {
    const c = cfg(); if (!c.on || !S.onboarded || !S.plan || c.fired === todayKey()) return; if (c.pushed && remPerm() === "granted") { doneInfo(); return; }
    const t = todayPlan(), now = new Date(), min = now.getHours() * 60 + now.getMinutes(); if (!t || trainedToday() || min < c.min || min >= c.min + 120) return;
    c.fired = todayKey(); saveCfg(c); remNotify("วันนี้ถึงคิว " + (t.n || "ออกกำลังกาย") + " แล้ว พร้อมไหม แตะเพื่อเริ่มได้เลย");
  }
  setInterval(check, 30000); document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check(); }); addEventListener("load", () => setTimeout(() => { check(); if (cfg().on) pushSync(); }, 3000));
  /* แผนเปลี่ยน: ส่งวันใหม่ไปให้เซิร์ฟเวอร์ */
  ["fqsave", "adaptapply"].forEach(k => { const o = ACT[k]; if (o) ACT[k] = function () { const r = o.apply(this, arguments); setTimeout(() => { if (cfg().on) pushSync(); }, 600); return r; }; });
  /* ---------- การ์ดตั้งค่าในหน้าโปรแกรม ---------- */
  const card = () => {
    const c = cfg(), perm = remPerm(), d = days(), dn = d.map(x => DOWN[x.d]).join(" "), sup = pushSupported() && !(isIOS() && !isStandalone());
    const st = !c.on ? "ปิดอยู่" : perm === "denied" ? "เบราว์เซอร์บล็อกการแจ้งเตือนไว้ เปิดสิทธิ์ที่ตั้งค่าของเว็บไซต์" : c.pushed && perm === "granted" ? "ส่งเข้าโทรศัพท์ได้แม้ปิดแอป" : sup ? "กำลังเชื่อมต่อเซิร์ฟเวอร์ ถ้าไม่ขึ้นภายในไม่กี่วินาที จะเตือนเฉพาะตอนเปิดแอปค้างไว้" : "เตือนเฉพาะตอนเปิดแอปค้างไว้ (เครื่องนี้ไม่รองรับแจ้งเตือนจากเซิร์ฟเวอร์)";
    return `<div class="sec">เตือนวันออกกำลัง</div><div class="card"><div class="row between"><div><b>เตือนตามวันในแผน</b><div class="xs muted">${d.length ? "วัน " + dn : "ยังไม่มีแผน ตั้งค่าโปรแกรมก่อน"}</div></div><button class="btn ${c.on ? "primary" : ""}" data-act="wkremtoggle" aria-pressed="${c.on}" ${d.length ? "" : "disabled"}>${c.on ? "เปิดอยู่" : "ปิดอยู่"}</button></div>
${c.on ? `<label class="f" for="wkt">เวลาที่เตือน</label><input id="wkt" type="time" value="${hmOf(c.min)}" data-wkt="1"/><button class="btn block" style="margin-top:8px" data-act="wkremtest">ทดสอบการเตือน</button>` : ""}<p class="xs muted" style="margin-top:8px">${st}</p></div>`;
  };
  ACT.wkremtoggle = async () => {
    const c = cfg(); c.on = !c.on; c.fired = ""; saveCfg(c);
    if (c.on) {
      if ("Notification" in window && Notification.permission === "default") { try { await Notification.requestPermission(); } catch (e) { } }
      if (pushSupported() && remPerm() === "granted" && !(isIOS() && !isStandalone())) { const ok = await pushSync(); if (!ok) toast("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ จะเตือนเฉพาะตอนเปิดแอป"); }
      else toast("จะเตือนเมื่อเปิดแอปค้างไว้ในเวลาที่ตั้ง");
    } else { c.pushed = false; saveCfg(c); if (!(remCfg().on && remCfg().push)) { try { const s = pushSupported() ? await pushSub(false) : null; if (s) await pushPost("/subscribe", { sub: s.toJSON(), prefs: { everyH: 3, start: "08:00", end: "21:00", tzOff: -new Date().getTimezoneOffset(), meal: false } }); } catch (e) { } } }
    rerenderSub();
  };
  ACT.wkremtest = () => { const t = todayPlan(); remNotify("ทดสอบ: วันนี้ถึงคิว " + ((t && t.n) || "ออกกำลังกาย") + " แล้ว พร้อมไหม"); if (document.visibilityState === "visible") return; };
  document.addEventListener("change", e => { if (e.target && e.target.dataset && e.target.dataset.wkt) { const m = minOf(e.target.value); if (m === null || m < 300 || m > 1380) { toast("เลือกเวลาระหว่าง 05:00 ถึง 23:00"); rerenderSub(); return; } const c = cfg(); c.min = m; c.fired = ""; saveCfg(c); pushSync(); rerenderSub(); } });
  const oFit = SUBS.fit; SUBS.fit = a => { const r = oFit(a); if (r && r.html) { const m = '<div class="sec">เป้าและการฟื้นตัว</div>'; r.html = r.html.indexOf(m) > -1 ? r.html.replace(m, card() + m) : r.html + card(); } return r; };
})();
