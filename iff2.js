/* IF รุ่นใหม่: วัดการงดจากเวลาที่กินจริง นาฬิกางดกิน วันพัก/ขยับช่วงกิน คัดกรองความปลอดภัย แผนมื้อ สถิติ เหรียญ และการเตือนให้เข้ากับ IF
   ไม่มีรูปแบบที่งดเกิน 16 ชั่วโมง ไม่มีการกินมื้อเดียวต่อวัน */
const IFF_GRACE = 30, IFF_CAP_FAST = 16;
const tsOf = (d, t) => new Date(d + "T" + (t || "12:00") + ":00").getTime();
const minOf = t => { const m = /^(\d{2}):(\d{2})$/.exec(t || ""); return m ? +m[1] * 60 + +m[2] : null; };
const hrs = ms => ms / 36e5;
function iffWin(f, k) { const sh = (f.shift || {})[k], s = sh !== undefined ? sh : f.start; return { s, e: Math.min(1439, s + f.eat * 60) }; }
iffState = function () {
  const f = S.iff; if (!f || !f.on) return null; const tk = todayKey(), w = iffWin(f, tk), d = new Date(), m = d.getHours() * 60 + d.getMinutes(), paused = (f.skip || []).includes(tk);
  const eating = paused || (m >= w.s && m < w.e), left = paused ? 0 : eating ? w.e - m : (m < w.s ? w.s - m : 1440 - m + f.start);
  return { eating, left, s: w.s, e: w.e, f, paused };
};
function iffMealsOf(k) { return S.meals.filter(m => m.d === k && minOf(m.t) !== null).map(m => minOf(m.t)).sort((a, b) => a - b); }
function iffFastBefore(k) {
  const prev = iffMealsOf(addDays(k, -1)), cur = iffMealsOf(k); if (!prev.length || !cur.length) return null;
  return (1440 - prev[prev.length - 1] + cur[0]) / 60;
}
/* ผลของวัน: ok / bad / wait / skip / none */
function iffDayR(k) {
  const f = S.iff, tk = todayKey(); if (k > tk) return { r: "wait" };
  if ((f.skip || []).includes(k)) return { r: "skip" };
  const w = iffWin(f, k), ms = iffMealsOf(k), now = new Date(), nm = now.getHours() * 60 + now.getMinutes(), fast = iffFastBefore(k);
  if (!ms.length) return { r: k === tk && nm < w.e ? "wait" : "none", fast };
  const first = ms[0], last = ms[ms.length - 1], violated = first < w.s - IFF_GRACE || last > w.e + IFF_GRACE;
  if (violated) return { r: "bad", fast, first, last };
  if (k === tk && nm < w.e) return { r: "wait", fast, first, last };
  return { r: "ok", fast, first, last };
}
iffDay = k => { const r = iffDayR(k).r; return r === "skip" ? "wait" : r === "none" ? "bad" : r; };
/* บันทึกผลรายวันลง S.iffDays + แจกเหรียญวันละ 3 สำหรับวันที่ผ่าน */
function iffSync(announce) {
  const f = S.iff; if (!f || !f.on) return; S.iffDays = S.iffDays || {}; let gain = 0, changed = false;
  for (let i = 0; i < f.len; i++) {
    const k = addDays(f.from, i); if (k > todayKey()) break; const r = iffDayR(k); if (r.r === "wait") continue;
    const cur = S.iffDays[k] || {}; const nv = { ok: r.r === "ok", r: r.r, fast: r.fast !== null && r.fast !== undefined ? Math.round(r.fast * 10) / 10 : null, paid: cur.paid };
    if (nv.ok && !nv.paid) { nv.paid = true; gain += 3; }
    if (JSON.stringify(cur) !== JSON.stringify(nv)) { S.iffDays[k] = nv; changed = true; }
  }
  if (gain) { S.coins += gain; if (announce) toast(`วินัย IF วันที่ผ่าน +${gain} เหรียญ`); }
  if (changed || gain) save();
}
/* ---------- ตัวเลข ---------- */
function iffFastedNow(st) {
  const now = Date.now(), tk = todayKey(), yk = addDays(tk, -1), last = S.meals.filter(m => (m.d === tk || m.d === yk) && minOf(m.t) !== null).map(m => tsOf(m.d, m.t)).filter(t => t <= now);
  let since = last.length ? Math.max.apply(null, last) : null; const nm = new Date().getHours() * 60 + new Date().getMinutes();
  const winEnd = nm >= st.e ? new Date(tk + "T00:00:00").getTime() + st.e * 60000 : new Date(yk + "T00:00:00").getTime() + iffWin(st.f, yk).e * 60000;
  if (since === null) since = winEnd;
  return Math.min(24, hrs(now - since));
}
const fmtHM = h => { const m = Math.max(0, Math.round(h * 60)); return Math.floor(m / 60) + " ชม. " + (m % 60) + " นาที"; };
function iffNutrWarn(st) {
  const k = todayKey(), eaten = dayInfo(k).eaten, floor = floorKcal(), nm = new Date().getHours() * 60 + new Date().getMinutes();
  if (st.paused) return ""; if (nm >= st.e && eaten < floor * 0.6) return `วันนี้กินน้อยกว่าเกณฑ์ขั้นต่ำมาก (${fmtN(eaten)} จาก ${fmtN(floor)} kcal) ช่วงกินปิดแล้ว พรุ่งนี้ลองกินให้ถึงเกณฑ์ในช่วงที่เปิด`;
  if (st.eating && st.e - nm <= 90 && eaten < floor * 0.6) return `ช่วงกินจะปิดในอีก ${dur(st.e - nm)} แต่วันนี้ยังกินน้อยกว่าเกณฑ์ขั้นต่ำ (${fmtN(eaten)} จาก ${fmtN(floor)} kcal) รีบเติมให้พอก่อนปิดนะ`;
  return "";
}
/* ---------- แบนเนอร์หน้าแรก ---------- */
iffBanner = function () {
  const st = iffState(); if (!st) return ""; iffSync(false);
  if (st.paused) return `<button class="card iffcard" data-act="sub" data-n="iff"><span class="ifc-ic">${ic("moon", 20)}</span><div class="grow"><b>วันนี้พักโหมด IF</b><div class="xs muted">กินได้ตามสบาย พรุ่งนี้กลับมาต่อ</div></div>${ic("back", 16)}</button>`;
  const need = 24 - st.f.eat;
  if (st.eating) return `<button class="card iffcard open" data-act="sub" data-n="iff"><span class="ifc-ic">${ic("bowl", 20)}</span><div class="grow"><b>ช่วงกินเปิดอยู่</b><div class="xs muted">ปิดในอีก ${dur(st.left)} (${hm(st.e)})</div></div>${ic("back", 16)}</button>`;
  const fasted = iffFastedNow(st), pct = Math.min(100, Math.round(fasted / need * 100));
  return `<button class="card iffcard" data-act="sub" data-n="iff"><span class="ifc-ic">${ic("timer", 20)}</span><div class="grow"><b>กำลังงดกิน · ดื่มน้ำได้</b><div class="xs muted">งดมาแล้ว ${fmtHM(fasted)} · เปิดกินอีก ${dur(st.left)} (${hm(st.s)})</div><i class="hq-bar iffbar2"><b style="width:${pct}%"></b></i></div>${ic("back", 16)}</button>`;
};
/* ---------- หน้า IF ---------- */
const IFSCREEN = [["ตั้งครรภ์หรือให้นมบุตร", "pg"], ["เป็นเบาหวาน หรือใช้ยาลดน้ำตาล/อินซูลิน", "db"], ["มีโรคที่แพทย์สั่งคุมการกิน (เช่น โรคหัวใจ ไต ความดัน กรดไหลย้อนรุนแรง)", "dz"], ["เคยหรือกำลังมีปัญหาการกิน (กินไม่หยุด อาเจียนหลังกิน กลัวอ้วนมาก)", "ed"]];
function iffSetup() {
  const under = bmiOf(estW()) < 18.5;
  return { title: "โหมด IF", html: `<p class="muted" style="margin-bottom:10px">ตั้งวินัยช่วงเวลากินให้ชัด กินเฉพาะในช่วงที่เลือก นอกช่วงนั้นโหมดกินบางอย่างจะล็อก และการบันทึกอาหารต้องยืนยันก่อน แอปนี้จำกัดการงดไม่เกิน ${IFF_CAP_FAST} ชั่วโมงต่อวัน</p>
${under ? `<div class="hint">${ic("lock", 18)}<span>น้ำหนักตอนนี้อยู่ในเกณฑ์ต่ำ โหมดนี้จึงปิดไว้เพื่อความปลอดภัย</span></div>` : `<div class="scard"><b class="sm">ก่อนเริ่ม ตอบให้ตรงตามจริง</b><p class="xs muted" style="margin:4px 0 8px">ถ้ามีข้อใดข้อหนึ่ง IF อาจไม่ปลอดภัยสำหรับคุณ ควรปรึกษาแพทย์ก่อน</p>${IFSCREEN.map(q => `<label class="row" style="gap:10px;align-items:flex-start;margin-top:8px"><input type="checkbox" class="ifq" data-q="${q[1]}" style="width:22px;height:22px;margin-top:2px"/><span class="sm">${q[0]}</span></label>`).join("")}<div id="ifwarn" class="hint" style="display:none;margin-top:10px">${ic("heart", 18)}<span>จากที่ตอบ ไม่แนะนำให้เริ่ม IF ด้วยตัวเอง ควรปรึกษาแพทย์หรือนักกำหนดอาหารก่อน แอปนี้ไม่ใช่คำแนะนำทางการแพทย์</span></div></div>
<label class="f" for="ifw">รูปแบบ</label><select id="ifw"><option value="12">${IFFW[12]}</option><option value="10">${IFFW[10]}</option><option value="8" selected>${IFFW[8]}</option></select>
<label class="f" for="ifs">เริ่มกินมื้อแรกเวลา</label><select id="ifs">${[8, 9, 10, 11, 12].map(h => `<option value="${h}" ${h === 11 ? "selected" : ""}>${pad(h)}:00</option>`).join("")}</select>
<label class="f" for="ifl">ตั้งใจทำกี่วัน</label><select id="ifl"><option value="3">3 วัน</option><option value="7" selected>7 วัน</option><option value="14">14 วัน</option></select>
<label class="row" style="margin-top:14px;gap:10px;align-items:flex-start"><input id="ifok" type="checkbox" style="width:22px;height:22px;margin-top:2px"/><span class="sm">เข้าใจว่าถ้าเวียนหัว ใจสั่น มือสั่น หรือไม่ไหว ต้องหยุดและกินทันที ออกจากโหมดได้ทุกเมื่อ</span></label>
<button class="btn primary block" style="margin-top:14px" data-act="iffstart">เริ่มวินัย</button>`}
<div class="sec">สิ่งที่จะเกิดเมื่อเปิดโหมด</div><div class="card sm">ล็อก: สุ่มเมนู และของในตู้เย็น (ช่วงงด)<br>ต้องยืนยัน: บันทึกอาหารนอกช่วงกิน<br>ใช้ได้ตลอด: น้ำ โหมดหิวดึก ออกกำลังกาย ชั่งน้ำหนัก<br>มีวันพัก ผ่อนผัน 30 นาที และปุ่ม “ไม่ไหว” เมื่อไม่สบาย</div>` };
}
document.addEventListener("change", e => { if (e.target && e.target.classList && e.target.classList.contains("ifq")) { const any = [...document.querySelectorAll(".ifq")].some(x => x.checked), w = $("#ifwarn"); if (w) w.style.display = any ? "flex" : "none"; } });
function iffBars(f) {
  const days = []; for (let i = 0; i < f.len; i++) { const k = addDays(f.from, i); if (k > todayKey()) break; days.push(k); }
  const data = days.map(k => ({ k, ...(S.iffDays && S.iffDays[k] || {}) })).filter(d => d.fast !== null && d.fast !== undefined);
  if (!data.length) return `<p class="xs muted">ยังไม่มีข้อมูลชั่วโมงงด ต้องมีมื้อสุดท้ายของเมื่อวานและมื้อแรกของวันนี้ที่บันทึกเวลาไว้</p>`;
  const target = 24 - f.eat, W = 300, H = 110, bw = Math.min(26, (W - 20) / data.length - 6), mx = Math.max(20, ...data.map(d => d.fast), target + 2);
  const bars = data.map((d, i) => { const x = 14 + i * ((W - 20) / data.length), h = d.fast / mx * (H - 24); return `<rect x="${x.toFixed(1)}" y="${(H - 16 - h).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="5" class="${d.ok ? "bok" : "bno"}"/><text x="${(x + bw / 2).toFixed(1)}" y="${H - 3}" text-anchor="middle">${fmtD(d.k).split(" ")[0]}</text><text x="${(x + bw / 2).toFixed(1)}" y="${(H - 20 - h).toFixed(1)}" text-anchor="middle" class="v">${d.fast}</text>`; }).join("");
  const ty = H - 16 - target / mx * (H - 24);
  return `<svg viewBox="0 0 ${W} ${H}" class="iffchart" role="img" aria-label="ชั่วโมงงดกินแต่ละวัน"><line x1="8" x2="${W - 6}" y1="${ty.toFixed(1)}" y2="${ty.toFixed(1)}" class="tl"/><text x="${W - 6}" y="${(ty - 3).toFixed(1)}" text-anchor="end" class="tt">เป้า ${target} ชม.</text>${bars}</svg>`;
}
function iffPlan(st) {
  const f = st.f, n = f.plan === 3 ? 3 : 2, k = todayKey(), tgt = targetOn(k) + dayInfo(k).wk, eaten = dayInfo(k).eaten, g = typeof nutriGoal === "function" ? nutriGoal(k) : { p: 60 };
  const times = n === 2 ? [st.s, st.e - 150] : [st.s, Math.round((st.s + st.e) / 2 / 15) * 15, st.e - 90], share = n === 2 ? [0.55, 0.45] : [0.35, 0.35, 0.3], names = n === 2 ? ["มื้อแรก", "มื้อสุดท้าย"] : ["มื้อแรก", "มื้อกลาง", "มื้อสุดท้าย"];
  return `<div class="sgt">แผนมื้อวันนี้ (ในช่วงกิน ${hm(st.s)}–${hm(st.e)})</div><div class="scard"><div class="seg" style="margin-bottom:10px"><button class="${n === 2 ? "on" : ""}" data-act="iffplan" data-n="2">2 มื้อ</button><button class="${n === 3 ? "on" : ""}" data-act="iffplan" data-n="3">3 มื้อ</button></div>
${times.map((t, i) => `<div class="item"><div class="grow"><b>${names[i]}</b><div class="xs muted">ประมาณ ${hm(Math.max(st.s, t))} · โปรตีนราว ${Math.round(g.p / n)} ก.</div></div><b>${fmtN(tgt * share[i])} kcal</b></div>`).join("")}
<p class="xs muted" style="margin-top:8px">ตอนนี้กินไปแล้ว ${fmtN(eaten)} จากเป้า ${fmtN(tgt)} kcal ${tgt - eaten > 0 ? "· เหลือ " + fmtN(tgt - eaten) : ""} เป็นแนวทางทั่วไป ปรับตามความหิวได้</p></div>`;
}
function iffInsight(f) {
  const days = S.iffDays || {}, oks = [], nos = []; Object.keys(days).forEach(k => { const m = typeof moodOf === "function" ? moodOf(k) : null; if (m && m.m) (days[k].ok ? oks : nos).push(m.m); });
  const avg = a => a.reduce((s, x) => s + x, 0) / a.length; let mood = "";
  if (oks.length >= 3 && nos.length >= 3) mood = `อารมณ์เฉลี่ยวันที่ทำตามช่วงกินได้ ${f1(avg(oks))}/5 เทียบกับวันอื่น ${f1(avg(nos))}/5`;
  const t0 = trendAt(f.from), t1 = trendAt(todayKey()), wt = t0 && t1 && t0.d !== t1.d ? t0.w - t1.w : null;
  const lines = [mood, wt !== null ? `น้ำหนักเฉลี่ยตั้งแต่เริ่ม ${wt >= 0 ? "ลดลง" : "เพิ่มขึ้น"} ${f1(Math.abs(wt))} กก.` : ""].filter(Boolean);
  return `<div class="sgt">สิ่งที่สังเกตได้</div><div class="scard">${lines.length ? lines.map(l => `<p class="sm" style="margin:0 0 6px">${l}</p>`).join("") : '<p class="sm muted" style="margin:0">ข้อมูลยังไม่พอ ต้องมีอารมณ์ที่บันทึกอย่างน้อยฝั่งละ 3 วัน หรือชั่งน้ำหนักสม่ำเสมอ</p>'}<p class="xs muted" style="margin:6px 0 0">เป็นแค่ความสัมพันธ์จากข้อมูลของคุณ ไม่ได้แปลว่า IF เป็นสาเหตุ</p></div>`;
}
SUBS.iff = () => {
  const f = S.iff, st = iffState(); if (!st) return iffSetup(); iffSync(true);
  const tk = todayKey(), need = 24 - f.eat, skips = (f.skip || []).filter(k => k >= f.from && k <= addDays(f.from, f.len - 1)).length, must = Math.max(1, f.len - skips);
  const fasted = st.eating || st.paused ? null : iffFastedNow(st), pct = fasted === null ? 0 : Math.min(100, Math.round(fasted / need * 100));
  const dots = []; for (let i = 0; i < f.len; i++) { const k = addDays(f.from, i), r = iffDayR(k).r; dots.push(`<span class="iffdot ${r === "ok" ? "ok" : r === "bad" || r === "none" ? "bad" : r === "skip" ? "skip" : ""} ${k === tk ? "now" : ""}" title="${fmtD(k)}">${r === "ok" ? ic("check", 14) : r === "bad" || r === "none" ? ic("x", 14) : r === "skip" ? ic("moon", 13) : i + 1}</span>`); }
  const passes = Array.from({ length: f.len }, (_, i) => iffDayR(addDays(f.from, i)).r).filter(r => r === "ok").length;
  const done = Object.values(S.iffDays || {}).filter(d => d.fast !== null && d.fast !== undefined), avgF = done.length ? done.reduce((s, d) => s + d.fast, 0) / done.length : null, maxF = done.length ? Math.max.apply(null, done.map(d => d.fast)) : null, kept = done.length ? Math.round(done.filter(d => d.ok).length / done.length * 100) : null;
  const warn = iffNutrWarn(st), rc = typeof remCfg === "function" ? remCfg() : { on: false };
  const hero = `<div class="dhero">${dayRing(st.paused ? 0 : st.eating ? Math.round((1 - st.left / (f.eat * 60)) * 100) : pct, false)}<div class="dh-in"><div class="xs muted">${st.paused ? "วันพัก" : st.eating ? "ช่วงกินเหลือ" : "งดมาแล้ว"}</div><div class="dh-big" style="font-size:24px">${st.paused ? "พัก" : st.eating ? dur(st.left).replace(" ชม. ", ":").replace(" นาที", "") : fmtHM(fasted).replace(" ชม. ", ":").replace(" นาที", "")}</div><div class="xs muted">${st.paused || st.eating ? "ชม.:นาที" : "ชม.:นาที"}</div></div><div class="dh-side"><div><span class="xs muted">${IFFW[f.eat].split("(")[1].replace(")", "")}</span><b>${st.paused ? "พัก" : st.eating ? "กินได้" : "งดกิน"}</b></div><div><span class="xs muted">ช่วงกิน</span><b>${hm(st.s)}–${hm(st.e)}</b></div><div><span class="xs muted">${st.eating ? "ปิดอีก" : "เปิดอีก"}</span><b>${st.paused ? "-" : dur(st.left)}</b></div></div></div>`;
  const acts = `<div class="ifacts">${!st.eating && !st.paused ? `<button class="btn danger" data-act="iffhelp">${ic("heart", 16)}ไม่ไหว / เวียนหัว</button>` : ""}${st.paused ? `<button class="btn" data-act="iffunskip">${ic("timer", 16)}กลับมาทำต่อวันนี้</button>` : `<button class="btn" data-act="iffskip">${ic("moon", 16)}วันพักวันนี้</button>`}<button class="btn" data-act="iffshift">${ic("timer", 16)}ขยับช่วงกิน</button></div>`;
  return { title: "โหมด IF", html: `${hero}${acts}${warn ? `<div class="hint warnh" style="margin-top:10px">${ic("heart", 18)}<span>${warn}</span></div>` : ""}
<div class="sgt">ความคืบหน้า ผ่านแล้ว ${passes}/${must} วัน${skips ? ` (วันพัก ${skips})` : ""}</div><div class="iffbar">${dots.join("")}</div>
<p class="xs muted" style="margin-top:8px">วันที่ผ่านคือวันที่มื้อแรกและมื้อสุดท้ายอยู่ในช่วงกิน (ผ่อนผัน ${IFF_GRACE} นาที) ผ่านวันละ +3 เหรียญ</p>
${passes >= must && !f.claimed ? `<button class="btn primary block" style="margin-top:12px" data-act="iffclaim">รับรางวัลครบวินัย 40 เหรียญ</button>` : ""}
<div class="sgt">สถิติ</div><div class="scard"><div class="grid3"><div><div class="xs muted">งดเฉลี่ย</div><b>${avgF !== null ? f1(avgF) + " ชม." : "-"}</b></div><div><div class="xs muted">นานที่สุด</div><b>${maxF !== null ? f1(maxF) + " ชม." : "-"}</b></div><div><div class="xs muted">อยู่ในช่วงกิน</div><b>${kept !== null ? kept + "%" : "-"}</b></div></div><div style="margin-top:10px">${iffBars(f)}</div></div>
${st.paused ? "" : iffPlan(st)}${iffInsight(f)}
<div class="sgt">การเตือน</div><div class="scard sm">${rc.on && rc.push ? "เปิดอยู่: เตือนก่อนช่วงกินเปิด 30 นาที ก่อนปิด 1 ชั่วโมง และให้ดื่มน้ำกลางช่วงงด (ไม่เตือนจดมื้ออาหารตอนงด)" : `ยังไม่ได้เปิดการเตือนในโทรศัพท์ <button class="linkbtn" data-act="sub" data-n="setrem">เปิดเลย</button>`}</div>
<div class="sgt">สถานะการล็อก</div><div class="scard sm">${st.eating || st.paused ? "ตอนนี้ทุกโหมดเปิดอยู่" : ic("lock", 14) + " สุ่มเมนู และ ของในตู้เย็น ล็อกถึง " + hm(st.s)}</div>
<div class="sgt">ออกจากโหมด</div><div class="row"><button class="btn" style="flex:1" data-act="iffsick">ไม่สบาย ออกเลย</button><button class="btn danger" style="flex:1" data-act="iffexit">เลิกวินัย</button></div>` };
};
/* ---------- การกระทำ ---------- */
ACT.iffstart = () => {
  if ([...document.querySelectorAll(".ifq")].some(x => x.checked)) { toast("จากที่ตอบ ควรปรึกษาแพทย์ก่อนเริ่ม IF"); return; }
  if (!$("#ifok").checked) { toast("ติ๊กยืนยันก่อนนะ"); return; }
  if (bmiOf(estW()) < 18.5) { toast("โหมดนี้ปิดไว้เพื่อความปลอดภัย"); return; }
  S.iff = { on: true, eat: +$("#ifw").value, start: +$("#ifs").value * 60, len: +$("#ifl").value, from: todayKey(), claimed: false, skip: [], shift: {}, plan: 2 }; S.iffDays = S.iffDays || {}; save(); confetti(); toast("เริ่มวินัยแล้ว สู้ๆ"); iffPush(); rerenderSub();
};
ACT.iffplan = (a) => { S.iff.plan = +a.dataset.n; save(); rerenderSub(); };
ACT.iffskip = () => { const f = S.iff; f.skip = (f.skip || []).concat([todayKey()]); save(); toast("วันนี้พักโหมด IF กินได้ตามสบาย"); iffPush(); rerenderSub(); };
ACT.iffunskip = () => { const f = S.iff; f.skip = (f.skip || []).filter(k => k !== todayKey()); save(); iffPush(); rerenderSub(); };
ACT.iffhelp = () => openModal(`<h2>ถ้าไม่ไหว หยุดก่อนเลย</h2><p class="sm" style="margin:8px 0">1. ดื่มน้ำ นั่งพัก<br>2. กินของว่างเล็กๆ ที่มีโปรตีนหรือแป้ง เช่น นม กล้วย แซนด์วิช<br>3. อย่าฝืนออกกำลังกายหรือขับรถจนกว่าจะดีขึ้น</p><p class="xs muted">ถ้าเป็นลม ใจสั่นมาก หายใจลำบาก หรืออาการไม่ดีขึ้นใน 15 นาที ให้พบแพทย์หรือโทร 1669</p><div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="modalclose">ปิด</button><button class="btn primary" style="flex:1" data-act="iffhelpgo">พักโหมดวันนี้</button></div>`);
ACT.iffhelpgo = () => { closeModal(); ACT.iffskip(); };
ACT.iffshift = () => {
  const st = iffState(), f = S.iff, need = 24 - f.eat, opts = [[-60, "เริ่มเร็วขึ้น 1 ชม."], [60, "เริ่มช้าลง 1 ชม."], [120, "เริ่มช้าลง 2 ชม."]].filter(o => st.s + o[0] >= 360 && need + (st.s + o[0] - f.start) / 60 <= IFF_CAP_FAST);
  openModal(`<h2>ขยับช่วงกินวันนี้</h2><p class="muted sm" style="margin:6px 0 10px">ตอนนี้ ${hm(st.s)}–${hm(st.e)} ขยับได้เฉพาะวันนี้ และงดต่อเนื่องไม่เกิน ${IFF_CAP_FAST} ชั่วโมง</p>${opts.length ? opts.map(o => `<button class="btn block" style="margin-bottom:8px" data-act="iffshiftgo" data-d="${o[0]}">${o[1]} (${hm(st.s + o[0])}–${hm(Math.min(1439, st.e + o[0]))})</button>`).join("") : '<p class="sm">รูปแบบนี้ขยับไม่ได้แล้ว ใช้ “วันพัก” แทนได้</p>'}${f.shift && f.shift[todayKey()] !== undefined ? `<button class="btn block" data-act="iffshiftgo" data-d="reset">กลับเป็นเวลาเดิม</button>` : ""}<button class="btn ghost block" data-act="modalclose">ปิด</button>`);
};
ACT.iffshiftgo = (a) => { const f = S.iff, st = iffState(); f.shift = f.shift || {}; if (a.dataset.d === "reset") delete f.shift[todayKey()]; else f.shift[todayKey()] = st.s + (+a.dataset.d); save(); closeModal(); iffPush(); rerenderSub(); };
ACT.iffclaim = () => { S.iff.claimed = true; S.coins += 40; save(); confetti(); popCoins(40); rerenderSub(); };
const _iffEnd = iffEnd; iffEnd = function (msg) { _iffEnd(msg); iffPush(); };
/* ---------- เตือนผ่านเซิร์ฟเวอร์: ส่งช่วงกินไปด้วย ---------- */
function iffPush() { if (typeof pushSync === "function") setTimeout(pushSync, 200); }
const _pushSync = pushSync;
pushSync = async function () {
  const c = remCfg(); if (!c.on || !c.push || !pushSupported() || remPerm() !== "granted") return false;
  try {
    const sub = await pushSub(true); if (!sub) return false; const f = S.iff, st = f && f.on ? iffState() : null;
    const prefs = { everyH: c.everyH, start: c.start, end: c.end, tzOff: -new Date().getTimezoneOffset() }; if (st) prefs.iff = { s: iffWin(f, todayKey()).s, e: iffWin(f, todayKey()).e, base: f.start, eat: f.eat };
    const r = await pushPost("/subscribe", { sub: sub.toJSON(), prefs }); return r.ok;
  } catch (e) { return false; }
};
/* ---------- เหรียญ IF + แจกเหรียญรายวันเมื่อเปิดแอป ---------- */
if (typeof MEDALS !== "undefined" && !MEDALS.some(m => m.id === "iff")) MEDALS.push({ id: "iff", n: "วินัย IF", d: "จำนวนวันที่ทำตามช่วงกินได้", icon: "timer", unit: "วัน", tiers: [3, 7, 21, 60], prog: () => Object.values(S.iffDays || {}).filter(d => d.ok).length });
addEventListener("load", () => setTimeout(() => { if (S && S.iff && S.iff.on) { iffSync(true); iffPush(); } }, 2500));
