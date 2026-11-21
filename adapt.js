/* สรุปรายสัปดาห์รวมออกกำลังกาย + ปรับแผนตามที่ทำจริง (ข้ามท่าสองครั้งติด ล้าต่อเนื่อง ทำครบสบายๆ) */
(function () {
  /* ---------- จดหมายสัปดาห์ ---------- */
  const oLetter = SUBS.letter;
  SUBS.letter = a => {
    const r = oLetter(a); if (!r || !r.html) return r;
    const t = todayKey(), from = addDays(t, -6), sess = (S.sessions || []).filter(s => s.d >= from && s.d <= t), L = [];
    if (sess.length) L.push(`เซสชันนำออกกำลัง ${sess.length} ครั้ง รวม ${Math.max(1, Math.round(sess.reduce((x, s) => x + (s.secs || 0), 0) / 60))} นาที`);
    const lifts = (S.lifts || []).filter(l => l.d >= from && l.d <= t), vol = lifts.reduce((x, l) => x + recStats(l).vol, 0); if (vol) L.push(`ยกน้ำหนักรวม ${fmtN(vol)} กก.`);
    const byEx = {}, prs = []; (S.lifts || []).slice().sort((x, y) => (x.d + x.t) < (y.d + y.t) ? -1 : 1).forEach(l => { prsOf(l, byEx[l.ex] || []).forEach(p => { if (l.d >= from) prs.push(p.n); }); (byEx[l.ex] = byEx[l.ex] || []).push(l); });
    if (prs.length) L.push(`ทำสถิติใหม่ ${prs.length} อย่าง (${Array.from(new Set(prs)).slice(0, 3).join(" ")}) เก่งมากเลย`);
    const km = (S.cardio || []).filter(c => c.d >= from && c.d <= t).reduce((x, c) => x + c.m, 0) / 1000; if (km >= 0.1) L.push(`เดิน วิ่ง ปั่น รวม ${km.toFixed(1)} กม.`);
    const mon = weekStart(), n = wkSess(mon), g = wkGoal(); if (S.fit) L.push(n >= g ? `ครบเป้าออกกำลังสัปดาห์นี้แล้ว (${n}/${g} วัน)` : `เป้าออกกำลังสัปดาห์นี้ ${n}/${g} วัน อีก ${g - n} วันถึงเป้า`);
    const mg = weekMg(from, t), none = ["อก", "หลัง", "ไหล่", "แขน", "แกนกลาง", "ขา", "ก้น"].filter(m => !mg[m]); if (sess.length && none.length && none.length < 7) L.push(`ส่วนที่ยังไม่ได้ฝึก: ${none.join(" ")} ลองเพิ่มสักท่านะ`);
    if (!L.length) return r;
    r.html = r.html.replace('<p style="text-align:right', `<p style="white-space:pre-line;margin-top:10px">${esc(L.join("\n"))}</p><p style="text-align:right`);
    return r;
  };
  /* ---------- ข้อเสนอปรับแผน ---------- */
  const mainItems = d => d.items.filter(x => !x.warm && !x.cool);
  function altFor(e, F, taken, seed) {
    const pool = FIT.pool(F).filter(x => x.id !== e.id && !taken.has(x.id) && x.cat !== "ยืดเหยียด" && x.cat === e.cat && x.pat === e.pat && x.mg.some(m => e.mg.includes(m)));
    if (!pool.length) return null; pool.sort((a, b) => ((FIT.hash(a.id + seed) % 100) - (FIT.hash(b.id + seed) % 100)) + (Math.abs(a.lvl - e.lvl) - Math.abs(b.lvl - e.lvl)) * 40); return pool[0];
  }
  function adaptProposals() {
    const F = S.fit, P = S.plan, out = []; if (!F || !P || !P.days) return out;
    const ss = (S.sessions || []).filter(s => s.plan && s.done), recent = ss.slice(-6);
    P.days.forEach((d, i) => {
      const mine = recent.filter(s => s.src === "plan:" + i).slice(-2); if (mine.length < 2) return; const taken = new Set(d.items.map(x => x.id));
      mainItems(d).forEach(it => { if (mine.every(s => s.plan.includes(it.id) && !s.done.includes(it.id))) { const e = libOf(it.id), alt = e && altFor(e, F, taken, i + it.id); if (alt) { taken.add(alt.id); out.push({ type: "swap", day: i, from: it.id, to: alt.id, why: `ข้าม “${e.n}” สองครั้งติด เปลี่ยนเป็น “${alt.n}” ที่ใช้กล้ามเนื้อส่วนเดียวกัน` }); } } });
    });
    const body = (S.body || []).slice().sort((a, b) => a.d < b.d ? -1 : 1).slice(-3);
    if (body.length >= 3 && body.reduce((x, b) => x + b.fat, 0) / body.length >= 4 && !P.deloaded) out.push({ type: "deload", why: "เช็กร่างกายล่าสุดล้าต่อเนื่อง 3 ครั้ง ลดเซ็ตลงอย่างละ 1 เพื่อให้ร่างกายฟื้น" });
    const last3 = ss.slice(-3);
    if (!out.some(o => o.type === "deload") && last3.length === 3 && last3.every(s => s.plan.length && s.plan.every(id => s.done.includes(id))) && body.every(b => b.fat <= 3) && !(P.harder && Date.now() - P.harder < 14 * 86400000)) out.push({ type: "harder", why: "ทำครบทุกท่า 3 เซสชันติดและไม่ล้า เพิ่มความท้าทายท่าน้ำหนักตัว (+2 ครั้ง หรือ +5 วินาที)" });
    return out;
  }
  window.ADAPT = { proposals: adaptProposals };
  ACT.adaptapply = () => {
    const P = S.plan; if (!P) return; const ps = adaptProposals(), log = [];
    ps.forEach(p => {
      if (p.type === "swap") { const d = P.days[p.day], it = d.items.find(x => x.id === p.from), e = libOf(p.to); if (it && e) { const v = volFor(e, S.fit); Object.keys(it).forEach(k => delete it[k]); Object.assign(it, v); log.push(p.why); } }
      else if (p.type === "deload") { P.days.forEach(d => mainItems(d).forEach(x => { if (x.sets > 1) x.sets--; })); P.deloaded = Date.now(); log.push(p.why); }
      else if (p.type === "harder") { P.days.forEach(d => mainItems(d).forEach(x => { const e = libOf(x.id); if (!e || (weighted(e) && e.eq.length)) return; if (x.reps) x.reps = Math.min(30, x.reps + 2); else if (x.secs) x.secs = Math.min(90, x.secs + 5); })); P.harder = Date.now(); log.push(p.why); }
    });
    P.adapted = Date.now(); P.log = (P.log || []).concat(log.map(t => ({ d: todayKey(), t }))).slice(-20); save(); toast("ปรับแผนแล้ว"); if (subStack.length) rerenderSub();
  };
  ACT.adaptskip = () => { S.adaptSkip = todayKey(); save(); if (subStack.length) rerenderSub(); };
  const oFit = SUBS.fit;
  SUBS.fit = a => {
    const r = oFit(a); if (!r || !r.html) return r; const ps = S.adaptSkip && S.adaptSkip >= addDays(todayKey(), -6) ? [] : adaptProposals(); if (!ps.length) return r;
    const card = `<div class="sec">แผนควรปรับตามที่ทำจริง</div><div class="card">${ps.map(p => `<div class="xs" style="margin:4px 0">• ${esc(p.why)}</div>`).join("")}<div class="row" style="margin-top:10px;gap:8px"><button class="btn primary" style="flex:1" data-act="adaptapply">ปรับแผนให้</button><button class="btn" data-act="adaptskip">ไว้ก่อน</button></div></div>`;
    r.html = r.html.replace('<div class="sec">เป้าและการฟื้นตัว</div>', card + '<div class="sec">เป้าและการฟื้นตัว</div>'); return r;
  };
})();
