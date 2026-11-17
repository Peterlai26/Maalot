/* หน้าจอหลัก การสร้างตัวละคร การบันทึก */
let view = "home", fx = null, fxT = null, subStack = [], LG = null, EDIT = null, ONB = null, CH = { range: 30 };
const ACT = {}, SUBS = {};

/* ---------- เครื่องมือหน้าจอ ---------- */
function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
function popCoins(n) { const c = document.createElement("div"); c.className = "coinpop"; c.style.left = "calc(50% - 24px)"; c.style.top = "38%"; c.innerHTML = "+" + n + " เหรียญ"; document.body.appendChild(c); setTimeout(() => c.remove(), 1300); }
function cheerStage() { const st = $("#stage"); if (!st) return; st.classList.add("cheer"); setTimeout(() => st.classList.remove("cheer"), 1500); }
function confetti() {
  cheerStage();
  const cols = ["#E8845F", "#F7D58A", "#8CC79A", "#8CC8E8", "#F7B7A3"];
  for (let i = 0; i < 30; i++) { const e = document.createElement("i"); e.className = "confetti"; e.style.left = Math.random() * 100 + "vw"; e.style.background = cols[i % cols.length]; e.style.animationDelay = Math.random() * 0.5 + "s"; document.body.appendChild(e); setTimeout(() => e.remove(), 2600); }
}
function countTo(el, to, dec, from0, suf) {
  if (!el) return; const from = from0 || 0, sx = suf || "", t0 = performance.now(), d = 700;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { el.textContent = to.toFixed(dec || 0) + sx; return; }
  (function step(t) { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = (from + (to - from) * e).toFixed(dec || 0) + sx; if (p < 1) requestAnimationFrame(step); })(t0);
}
function setFx(name, ms) { fx = name; clearTimeout(fxT); if (view === "home" && !subStack.length) renderHome(); fxT = setTimeout(() => { fx = null; if (view === "home" && !subStack.length) renderHome(); }, ms); }
function openSheet(html) { const s = $("#sheet"); s.innerHTML = '<div class="panel">' + html + "</div>"; s.hidden = false; }
function closeSheet() { $("#sheet").hidden = true; }
function openModal(html) { const m = $("#modal"); m.innerHTML = '<div class="panel">' + html + "</div>"; m.hidden = false; }
function closeModal() { $("#modal").hidden = true; }
function openSub(name, arg) { subStack.push({ name, arg }); renderSub(); }
function closeSub() { subStack.pop(); if (subStack.length) renderSub(); else { $("#sub").hidden = true; refresh(); } }
function closeAllSubs() { subStack = []; $("#sub").hidden = true; refresh(); }
function renderSub() {
  const top = subStack[subStack.length - 1], def = SUBS[top.name](top.arg || {});
  const el = $("#sub"); el.hidden = false;
  el.innerHTML = '<div class="inner"><div class="subhead"><button class="iconbtn" data-act="back" aria-label="ย้อนกลับ">' + ic("back", 24) + "</button><h2>" + def.title + "</h2>" + (def.right || "") + "</div>" + def.html + "</div>";
  el.classList.remove("dress"); if (def.after) def.after(el); if (!def.keepScroll) el.scrollTop = 0;
}
function rerenderSub() { const el = $("#sub"), y = el.scrollTop; const top = subStack[subStack.length - 1]; if (!top) return; const def = SUBS[top.name](top.arg || {}); el.innerHTML = '<div class="inner"><div class="subhead"><button class="iconbtn" data-act="back" aria-label="ย้อนกลับ">' + ic("back", 24) + "</button><h2>" + def.title + "</h2>" + (def.right || "") + "</div>" + def.html + "</div>"; el.classList.remove("dress"); if (def.after) def.after(el); el.scrollTop = y; }
function show(v) {
  view = v; closeAllSubsSilent();
  $$(".view").forEach(e => { e.hidden = e.id !== "v-" + v; });
  $$(".nav button[data-v]").forEach(b => b.classList.toggle("on", b.dataset.v === v));
  refresh(); window.scrollTo(0, 0);
}
function closeAllSubsSilent() { subStack = []; $("#sub").hidden = true; }
function refresh() { if (view === "home") renderHome(); else if (view === "charts") renderCharts(); else if (view === "hub") renderHub(); else if (view === "char") renderChar(); }

/* ---------- ตัวแก้หน้าตา (ใช้ทั้งตอนเริ่มและในหน้าแต่งตัว) ---------- */
function lookPreview(L, rx) {
  return `<div class="stage"><svg viewBox="0 0 380 290" role="img" aria-label="ตัวอย่างตัวละคร"><rect width="380" height="290" fill="#FFF1E3"/><rect y="252" width="380" height="38" fill="#F3D9BF"/><ellipse cx="190" cy="268" rx="100" ry="14" fill="#FBE3A1"/><g transform="translate(190,268)">${figure(L, "happy", rx || 46)}</g></svg></div>`;
}

/* ---------- เริ่มต้นครั้งแรก ---------- */
function renderOnb() {
  const el = $("#onb"); el.hidden = false; $("#app").hidden = true; $(".nav").hidden = true; el.classList.toggle("dream", ONB.step === 1);
  if (ONB.step === 1) {
    EDIT = EDIT && EDIT.host === renderOnb ? Object.assign(EDIT, { look: ONB.look }) : { look: ONB.look, rx: 46, name: ONB.name, host: renderOnb, mode: "wear", tab: "self", onb: true, sel: null };
    el.innerHTML = `<div class="inner"><p class="muted sm">ขั้นที่ 1 จาก 3</p><h1>สร้างตัวแทนของคุณ</h1><p class="muted sm" style="margin:4px 0 12px">เลือกหน้าตาที่ชอบ เปลี่ยนใหม่ได้ทุกเมื่อ แล้วกดต่อไปที่มุมขวาล่างของภาพ</p>${lookEditor()}</div>`;
  } else if (ONB.step === 2) {
    const p = ONB.prof, sx = p.sex;
    el.innerHTML = `<div class="inner"><p class="muted sm">ขั้นที่ 2 จาก 3</p><h1>ตัวละครจะมีรูปร่างเหมือนคุณ</h1><p class="muted sm" style="margin:4px 0 8px">กรอกตัวเลขจริง เก็บไว้ในบัญชีของคุณเท่านั้น</p>
<div class="grid2"><div><label class="f" for="ph">ส่วนสูง (ซม.)</label><input id="ph" type="number" inputmode="decimal" value="${p.h}"/></div><div><label class="f" for="pw">น้ำหนักตอนนี้ (กก.)</label><input id="pw" type="number" inputmode="decimal" step="0.1" value="${p.w0}"/></div></div>
<div class="grid2"><div><label class="f" for="pa">อายุ (ปี)</label><input id="pa" type="number" inputmode="numeric" value="${p.age}"/></div><div><label class="f" for="px">สูตรคำนวณพลังงานใช้ค่าของ</label><select id="px"><option value="f" ${sx === "f" ? "selected" : ""}>หญิง</option><option value="m" ${sx === "m" ? "selected" : ""}>ชาย</option></select></div></div>
<label class="f" for="pc">กิจวัตรประจำวัน</label><select id="pc"><option value="1.2" ${p.act === 1.2 ? "selected" : ""}>นั่งเรียนหรือทำงานเป็นหลัก</option><option value="1.3" ${p.act === 1.3 ? "selected" : ""}>เดินไปมาบ้าง</option><option value="1.4" ${p.act === 1.4 ? "selected" : ""}>ยืนหรือเดินเยอะ</option></select>
<label class="f" for="pd">ความเร็วในการลด</label><select id="pd"><option value="300" ${p.def === 300 ? "selected" : ""}>เบา ค่อยเป็นค่อยไป (ลดวันละ 300 kcal)</option><option value="500" ${p.def === 500 ? "selected" : ""}>ปกติ (ลดวันละ 500 kcal)</option><option value="700" ${p.def === 700 ? "selected" : ""}>จริงจัง (ลดวันละ 700 kcal)</option></select>
<div class="hint" id="onbmsg">${ic("heart", 18)}<span>แอปนี้ออกแบบสำหรับผู้ใหญ่ 18 ปีขึ้นไป และไม่ใช่คำแนะนำทางการแพทย์</span></div>
<div class="row" style="margin-top:16px"><button class="btn" data-act="onbback">ย้อนกลับ</button><button class="btn primary" style="flex:1" data-act="onb2">ต่อไป</button></div></div>`;
  } else {
    const p = ONB.prof, w = p.w0, rx = shapeRx(w);
    S.prof = Object.assign({}, S.prof, p); const base = baseBurn(w), under = bmiOf(w) < 18.5, tgt = Math.max(under ? base : base - p.def, floorKcal());
    el.innerHTML = `<div class="inner"><p class="muted sm">ขั้นที่ 3 จาก 3</p><h1>พร้อมแล้ว ยินดีที่ได้เจอกันนะ</h1><div style="margin:12px 0">${lookPreview(ONB.look, rx)}</div>
<div class="card"><div class="row between"><span class="muted sm">พลังงานที่ใช้ต่อวัน (ประมาณ)</span><b>${fmtN(base)} kcal</b></div><div class="row between" style="margin-top:6px"><span class="muted sm">เป้ากินต่อวัน</span><b>${fmtN(tgt)} kcal</b></div></div>
${under ? '<div class="hint">' + ic("heart", 18) + "<span>น้ำหนักของคุณอยู่ในเกณฑ์ต่ำแล้ว แอปจึงตั้งเป้าให้คงที่ ไม่แนะนำให้ลดต่อ ถ้ากังวลเรื่องการกิน ปรึกษาแพทย์ได้เสมอ</span></div>" : ""}
<div class="hint">${ic("sparkle", 18)}<span>ถ้ากินน้อยเกินไป ตัวละครจะอ่อนแรงและเหนื่อย ไม่ได้ผอมเร็วขึ้น เป้าจะไม่ต่ำกว่า ${fmtN(floorKcal())} kcal เพื่อความปลอดภัย ถ้ามีโรคประจำตัว ตั้งครรภ์ หรือใช้ยา ควรปรึกษาแพทย์ก่อน</span></div>
<div class="row" style="margin-top:16px"><button class="btn" data-act="onbback">ย้อนกลับ</button><button class="btn primary" style="flex:1" data-act="onb3">เริ่มเลย</button></div></div>`;
  }
  window.scrollTo(0, 0);
}
ACT.onb1 = () => { ONB.name = (EDIT && EDIT.name) || ($("#nm") || {}).value || ONB.name; ONB.step = 2; renderOnb(); };
ACT.onbback = () => { ONB.step = Math.max(1, ONB.step - 1); renderOnb(); };
ACT.onb2 = () => {
  const h = parseFloat($("#ph").value), w = parseFloat($("#pw").value), a = parseInt($("#pa").value, 10);
  const msg = $("#onbmsg span");
  if (!(h >= 120 && h <= 220)) { msg.textContent = "ส่วนสูงควรอยู่ระหว่าง 120 ถึง 220 ซม."; return; }
  if (!(w >= 35 && w <= 250)) { msg.textContent = "น้ำหนักควรอยู่ระหว่าง 35 ถึง 250 กก."; return; }
  if (!(a >= 18 && a <= 90)) { msg.textContent = a < 18 ? "แอปนี้ออกแบบสำหรับผู้ใหญ่ 18 ปีขึ้นไป ถ้าอยากปรับน้ำหนักควรคุยกับผู้ปกครองหรือแพทย์ก่อนนะ" : "อายุควรอยู่ระหว่าง 18 ถึง 90 ปี"; return; }
  ONB.prof = { h, w0: w, age: a, sex: $("#px").value, act: parseFloat($("#pc").value), def: parseInt($("#pd").value, 10) };
  ONB.step = 3; renderOnb();
};
ACT.onb3 = () => {
  S.look = Object.assign({}, ONB.look); const bad = fixLocked(S.look); S.name = (ONB.name || "").trim() || "น้องก้อน";
  S.prof = Object.assign({}, ONB.prof); S.weights = [{ d: todayKey(), w: ONB.prof.w0 }]; S.created = Date.now(); S.onboarded = true; touchStreak(); save();
  $("#onb").hidden = true; $("#app").hidden = false; $(".nav").hidden = false; show("home"); confetti();
  if (bad.length) toast("บางอย่างยังล็อกอยู่ เลยใช้แบบมาตรฐานก่อนนะ");
};

/* ---------- หน้าแรก ---------- */
function baseMood(now, info) {
  const h = now.getHours();
  if ((h >= 23 || h < 5) && S.mode !== "light") return "sleepy";
  if (info.works.length) return "proud";
  if (info.logged && h >= 17 && info.eaten < floorKcal() * 0.45) return "hungry";
  return "happy";
}
function speech(mood, per, info, h) {
  if (mood === "sad") return ["ไม่เป็นไรนะ", "ฉันอยู่ตรงนี้"];
  if (mood === "joy") return ["ดีใจด้วยนะ", "ยิ้มแบบนี้ทั้งวันเลย"];
  if (mood === "ok") return ["ขอบคุณที่บอกนะ", "ค่อยๆ ไปด้วยกัน"];
  if (mood === "eat") return ["อร่อยจังเลย", "ขอบคุณที่ป้อนนะ"];
  if (mood === "work") return ["สู้ๆ นะ", "เหนื่อยแต่สนุก"];
  if (mood === "hungry") return ["ท้องร้องแล้วนะ", "เติมพลังหน่อยนะ"];
  if (mood === "proud") return ["ออกกำลังกายแล้ว", "ภูมิใจจังเลย"];
  if (mood === "sleepy") return ["ง่วงแล้วนะ", "พักผ่อนกันเถอะ"];
  if (!info.logged && h >= 11) return ["วันนี้ยังไม่ได้เล่า", "กินอะไรมาบ้างนะ"];
  if (per === "morning") return ["อรุณสวัสดิ์", "วันนี้เริ่มเบาๆ นะ"];
  if (per === "noon") return ["กินข้าวหรือยัง", "อย่าลืมจิบน้ำนะ"];
  if (per === "evening") return ["เย็นแล้วนะ", "คืนนี้กินอะไรดี"];
  return ["คืนนี้สบายๆ นะ", "ดื่มน้ำก่อนนอน"];
}
let RING_PREV = 0, COIN_PREV = null;
function ring(pct) {
  const R = 30, C = 2 * Math.PI * R, from = C * RING_PREV / 100;
  return `<svg class="ring" width="76" height="76" viewBox="0 0 76 76" role="img" aria-label="กินแล้ว ${pct}% ของเป้าวันนี้" data-c="${C.toFixed(1)}" data-pct="${pct}"><circle cx="38" cy="38" r="${R}" fill="none" stroke="var(--soft)" stroke-width="8"/><circle cx="38" cy="38" r="${R}" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${from.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 38 38)"/><text x="38" y="43" text-anchor="middle" font-size="16" font-weight="600" fill="var(--ink)">${RING_PREV}%</text></svg>`;
}
function animateRing() {
  const r = $("#v-home .ring"); if (!r) return; const C = +r.dataset.c, pct = +r.dataset.pct, c = r.querySelectorAll("circle")[1], tx = r.querySelector("text");
  requestAnimationFrame(() => requestAnimationFrame(() => { c.setAttribute("stroke-dasharray", (C * pct / 100).toFixed(1) + " " + C.toFixed(1)); }));
  countTo(tx, pct, 0, RING_PREV, "%"); RING_PREV = pct;
}
function weekStrip(tk) {
  const days = []; for (let i = 6; i >= 0; i--) days.push(addDays(tk, -i));
  return `<div class="weekstrip" aria-label="7 วันที่ผ่านมา">${days.map(k => { const on = dayInfo(k).logged; return `<div class="wd ${k === tk ? "today" : ""}"><span class="xs muted">${THDAY[new Date(k + "T12:00:00").getDay()]}</span><i class="${on ? "on" : ""}">${on ? ic("check", 14) : ""}</i></div>`; }).join("")}</div>`;
}
function freqFoods(tk) {
  const from = addDays(tk, -60), cnt = {};
  S.meals.forEach(m => { if (m.d >= from) { const n = baseName(m.n); cnt[n] = (cnt[n] || 0) + 1; } });
  const today = new Set(S.meals.filter(m => m.d === tk).map(m => baseName(m.n)));
  const top = Object.keys(cnt).filter(n => cnt[n] >= 2 && !today.has(n)).sort((x, y) => cnt[y] - cnt[x]).slice(0, 4);
  return top.length ? `<div class="sec" style="margin-bottom:6px">กินบ่อย แตะเพื่อจดอีกครั้ง</div><div class="logchips" style="margin-top:0">${top.map(n => `<button class="chip" data-act="logfood" data-t="${esc(n)}">${ic("plus", 14)}${esc(n)}</button>`).join("")}</div>` : "";
}
function renderHome() {
  const now = new Date(), h = now.getHours(), per = periodOf(h), tk = todayKey();
  const info = dayInfo(tk), tgt = targetOn(tk), rem = tgt + info.wk - info.eaten;
  const w = estW(), rx = shapeRx(w), mood = fx || baseMood(now, info);
  const md = S.mode || "auto", sper = md === "dark" ? "night" : md === "light" ? (per === "night" ? "noon" : per) : per, isDark = document.documentElement.dataset.theme === "dark";
  const sp = speech(mood, per, info, h);
  const g = per === "morning" ? "อรุณสวัสดิ์" : per === "noon" ? "สวัสดีตอนบ่าย" : per === "evening" ? "สวัสดีตอนเย็น" : "สวัสดีตอนค่ำ";
  const pct = clamp(Math.round(info.eaten / Math.max(1, tgt + info.wk) * 100), 0, 100);
  let line;
  if (info.logged && info.eaten < floorKcal() * 0.45 && h >= 17) line = "วันนี้กินน้อยไปหน่อย ลองเติมพลังด้วยของที่ชอบนะ";
  else if (!info.logged) line = "เริ่มเล่าให้ฟังได้เลย ว่าวันนี้กินอะไรมา";
  else if (rem > 400) line = "ยังเหลืออีกเยอะ ค่อยๆ กินให้อิ่มสบาย";
  else if (rem > 100) line = "ยังเหลือที่ให้ของว่างเบาๆ อีกนิด";
  else if (rem >= -100) line = "วันนี้พอดีเลย เก่งมาก";
  else line = "วันนี้เกินมานิดหน่อย พรุ่งนี้ค่อยๆ ปรับได้";
  const remTxt = info.logged ? (rem >= 0 ? "เหลือ " + fmtN(rem) + " kcal" : "เกิน " + fmtN(-rem) + " kcal") : "เป้า " + fmtN(tgt) + " kcal";
  const water = S.water[tk] || 0;
  const chips = info.meals.map(m => `<span class="chip">${ic("bowl", 15)}${esc(m.n)}</span>`).concat(info.works.map(m => `<span class="chip green">${ic("check", 15)}${esc(m.n)}</span>`)).join("");
  const under = bmiOf(w) < 18.5 ? `<div class="hint">${ic("heart", 18)}<span>น้ำหนักอยู่ในเกณฑ์ต่ำแล้ว แอปจึงตั้งเป้าให้คงที่ ไม่แนะนำให้ลดต่อ</span></div>` : "";
  $("#v-home").innerHTML = `<div class="top"><div><div class="muted sm">${THDAYL[now.getDay()]} ${now.getDate()} ${THMON[now.getMonth()]}</div><h1>${g}</h1></div><div class="chips"><span class="chip warn">${ic("flame", 15)}${S.streak.n || 1} วัน</span><span class="chip soft" id="coinchip">${ic("coin", 15)}${S.coins}</span></div></div>
<div class="stagewrap"><div class="stage" id="stage" data-act="poke" role="button" aria-label="แตะเพื่อทักตัวละคร">${scene({ look: S.look, mood, rx, period: sper, owned: S.owned, room: roomOf(), l1: sp[0], l2: sp[1] })}${particles(sper)}</div><button class="todbtn" data-act="daynight" aria-label="สลับกลางวัน กลางคืน" aria-pressed="${isDark}"><span class="todknob">${ic("sun", 16).replace('class="ic"', 'class="ic sun"')}${ic("moon", 16).replace('class="ic"', 'class="ic moon"')}</span></button></div>
${moodCardHTML()}<button class="card status" data-act="sub" data-n="today">${ring(pct)}<div style="flex:1;min-width:0"><div class="big">${line}</div><div class="muted sm">${remTxt}</div><div class="muted xs" style="margin-top:2px">กินแล้ว ${fmtN(info.eaten)}${info.wk ? " · ออกกำลัง +" + fmtN(info.wk) : ""} kcal</div></div>${ic("list", 20)}</button>
${weekStrip(tk)}
${under}
${chips ? '<div class="logchips">' + chips + "</div>" : ""}
${eventHome()}${goalsHome()}${comboHome()}${freqFoods(tk)}
<div class="row wrap" style="margin-top:10px"><button class="chip" data-act="water1">${ic("droplet", 15)}น้ำ ${water}/8 แก้ว</button><button class="chip" data-act="sub" data-n="weight">${ic("scale", 15)}ชั่งน้ำหนัก</button>${h >= 20 || h < 5 ? `<button class="chip blue" data-act="sub" data-n="night">${ic("moon", 15)}หิวดึก</button>` : ""}</div>
<div class="inputbar"><input id="homeIn" type="text" placeholder="วันนี้กินอะไรมาบ้างนะ…" aria-label="บอกว่ากินหรือทำอะไรมา"/><button class="round" data-act="camera" aria-label="ถ่ายรูปอาหาร">${ic("camera", 22)}</button><button class="round primary" data-act="homesend" aria-label="ส่ง">${ic("send", 22)}</button></div>`;
  animateRing(); const cc = $("#coinchip"); if (cc && COIN_PREV !== null && S.coins > COIN_PREV) cc.classList.add("bump"); COIN_PREV = S.coins;
}
ACT.water1 = () => {
  const k = todayKey(); S.water[k] = Math.min(12, (S.water[k] || 0) + 1);
  if (S.water[k] === 8) { earn(2); toast("ดื่มน้ำครบ 8 แก้วแล้ว เก่งมาก"); }
  save(); renderHome();
};
ACT.homesend = () => { const v = ($("#homeIn").value || "").trim(); if (!v) { openSheet(quickHTML()); return; } openSub("log", { tab: autoTab(v), text: v, fresh: true }); };
function autoTab(t) { return (findEx(t) || /เซ็ต|ครั้ง|นาที|วินาที/.test(t)) && !findFood(t) ? "work" : "food"; }
ACT.camera = () => { const i = $("#photoCam"); i.value = ""; i.click(); };
ACT.gallery = () => { const i = $("#photoIn"); i.value = ""; i.click(); };
ACT.sub = (a) => { closeSheet(); openSub(a.dataset.n, a.dataset.arg ? { id: a.dataset.arg } : {}); };
ACT.back = () => { if (subStack.length > 1 || true) closeSub(); };
function quickHTML() {
  return `<h2 style="margin-bottom:12px">เพิ่มอะไรดี</h2><div class="grid2">
<button class="tile" data-act="sub" data-n="log" data-arg="food"><span class="dot d-warn">${ic("bowl", 20)}</span><span><b>กินอะไรมา</b><span class="s">พิมพ์หรือถ่ายรูป</span></span></button>
<button class="tile" data-act="sub" data-n="log" data-arg="work"><span class="dot d-warn">${ic("dumbbell", 20)}</span><span><b>ออกกำลังกาย</b><span class="s">บอกท่า เซ็ต ครั้ง</span></span></button>
<button class="tile" data-act="sub" data-n="weight"><span class="dot d-warn">${ic("scale", 20)}</span><span><b>ชั่งน้ำหนัก</b><span class="s">ใส่ตัวเลขวันนี้</span></span></button>
<button class="tile" data-act="sub" data-n="water"><span class="dot d-warn">${ic("droplet", 20)}</span><span><b>น้ำและการนอน</b><span class="s">แตะบันทึกเร็ว</span></span></button></div>
<button class="btn ghost block" style="margin-top:12px" data-act="sheetclose">ปิด</button>`;
}
ACT.fab = () => openSheet(quickHTML());
ACT.sheetclose = closeSheet;
ACT.nav = (a) => { closeSheet(); show(a.dataset.v); };

/* ---------- บันทึกอาหารและออกกำลังกาย ---------- */
SUBS.log = (arg) => {
  if (arg.fresh || !LG) {
    LG = { tab: arg.tab || arg.id || "food", text: arg.text || "", items: [], when: "today", busy: false };
    if (LG.text) LG.items = LG.tab === "food" ? parseFood(LG.text) : parseWork(LG.text);
    arg.fresh = false; if (arg.id) arg.id = null;
  }
  const kg = estW(), isF = LG.tab === "food";
  let tot = 0;
  const rows = LG.items.map((it, i) => {
    if (isF) {
      const k = Math.round(it.k1 * it.q); tot += k;
      return `<div class="item"><div class="grow">${it.known ? `<b>${esc(it.n)}</b>${it.ai ? ' <span class="chip blue xs">Claude ประเมิน</span>' : ""}` : `<input type="text" data-in="lgn" data-i="${i}" value="${esc(it.n)}" placeholder="ชื่ออาหาร" aria-label="ชื่ออาหาร"/><div class="xs muted" style="margin-top:4px">ไม่รู้จักเมนูนี้ กรอกแคลอรี่เองหรือให้ Claude ประเมิน</div>`}
<div class="row" style="margin-top:6px"><div class="stepper"><button data-act="lgq" data-i="${i}" data-d="-0.5" aria-label="ลดปริมาณ">${ic("minus", 16)}</button><span style="min-width:34px;text-align:center">${it.q}</span><button data-act="lgq" data-i="${i}" data-d="0.5" aria-label="เพิ่มปริมาณ">${ic("plus", 16)}</button></div>
<span class="xs muted">× </span><input type="number" inputmode="numeric" style="width:80px;min-height:36px;padding:6px 8px" data-in="lgk" data-i="${i}" value="${it.k1}" aria-label="แคลอรี่ต่อหน่วย"/><span class="xs muted">kcal</span></div></div>
<div style="text-align:right"><b>${fmtN(k)}</b><div class="xs muted">kcal</div><button class="iconbtn" data-act="lgrm" data-i="${i}" aria-label="ลบรายการ">${ic("trash", 18)}</button></div></div>`;
    }
    const c = workCalc(it, kg); tot += c.k;
    return `<div class="item" style="align-items:flex-start"><div class="grow">${it.known ? `<b>${esc(it.n)}</b>` : `<input type="text" data-in="lgn" data-i="${i}" value="${esc(it.n)}" placeholder="ชื่อกิจกรรม" aria-label="ชื่อกิจกรรม"/>`}
<div class="grid2" style="margin-top:6px;gap:6px"><label class="xs muted">เซ็ต<input type="number" inputmode="numeric" data-in="lgw" data-f="sets" data-i="${i}" value="${it.sets || ""}" style="min-height:36px;padding:6px 8px"/></label><label class="xs muted">ครั้งต่อเซ็ต<input type="number" inputmode="numeric" data-in="lgw" data-f="reps" data-i="${i}" value="${it.reps || ""}" style="min-height:36px;padding:6px 8px"/></label>
<label class="xs muted">วินาที<input type="number" inputmode="numeric" data-in="lgw" data-f="secs" data-i="${i}" value="${it.secs || ""}" style="min-height:36px;padding:6px 8px"/></label><label class="xs muted">นาที<input type="number" inputmode="numeric" data-in="lgw" data-f="mins" data-i="${i}" value="${it.mins || ""}" style="min-height:36px;padding:6px 8px"/></label></div>
${it.known ? (c.assumed ? '<div class="xs muted" style="margin-top:4px">ไม่ได้บอกเวลา ใช้ 10 นาทีเป็นค่าเริ่มต้น</div>' : "") : `<div class="row" style="margin-top:6px"><span class="xs muted">เผาผลาญ</span><input type="number" inputmode="numeric" style="width:80px;min-height:36px;padding:6px 8px" data-in="lgm" data-i="${i}" value="${it.km || ""}"/><span class="xs muted">kcal</span></div>`}</div>
<div style="text-align:right"><b>${fmtN(c.k)}</b><div class="xs muted">kcal</div><button class="iconbtn" data-act="lgrm" data-i="${i}" aria-label="ลบรายการ">${ic("trash", 18)}</button></div></div>`;
  }).join("");
  const hasUnknown = isF && LG.items.some(x => !x.known);
  return {
    title: isF ? "กินอะไรมา" : "ออกกำลังกาย", keepScroll: true,
    html: `<div class="seg" role="tablist"><button class="${isF ? "on" : ""}" data-act="lgtab" data-t="food">กิน</button><button class="${!isF ? "on" : ""}" data-act="lgtab" data-t="work">ออกกำลัง</button></div>
<label class="f" for="lgtext">${isF ? "พิมพ์ว่ากินอะไร เช่น ข้าวมันไก่ 1 จาน กับชานมไข่มุก" : "พิมพ์ว่าทำอะไร เช่น วิดพื้น 3 เซ็ต 12 ครั้ง วิ่ง 20 นาที"}</label>
<textarea id="lgtext" data-in="lgtext" placeholder="${isF ? "ข้าวมันไก่ 1 จาน, ชานมไข่มุก 1 แก้ว" : "วิดพื้น 3 เซ็ต เซ็ตละ 12 ครั้ง แพลงก์ 3 เซ็ต 45 วินาที"}">${esc(LG.text)}</textarea>
${isF ? `<label class="f" for="lgsearch" style="margin-top:10px">หรือค้นหาเมนู แตะเพื่อเพิ่ม</label><input id="lgsearch" type="text" data-in="lgsearch" placeholder="เช่น กะเพรา ชาเขียว ส้มโอ" autocomplete="off"/><div id="lgres" class="logchips" style="margin-top:8px"></div>` : ""}
<div class="row wrap" style="margin-top:8px"><button class="btn" data-act="lgparse">${ic("sparkle", 18)}ตีความ</button>${isF ? `<button class="btn" data-act="camera">${ic("camera", 18)}ถ่ายรูป</button><button class="btn" data-act="gallery">${ic("book", 18)}เลือกรูป</button>` : ""}<button class="btn" data-act="lgadd">${ic("plus", 18)}เพิ่มเอง</button>${hasUnknown ? `<button class="btn" data-act="lgai">ให้ Claude ประเมิน</button>` : ""}</div>
${LG.busy ? '<div class="hint pulse-ring">' + ic("sparkle", 18) + "<span>กำลังดูให้อยู่…</span></div>" : ""}
<div class="card" style="margin-top:12px;padding:6px 14px">${rows || '<div class="muted sm" style="padding:14px 0">ยังไม่มีรายการ พิมพ์แล้วกดตีความ หรือกดเพิ่มเอง</div>'}</div>
${LG.items.length ? `<div class="row between" style="margin-top:12px"><span class="muted">${isF ? "รวมมื้อนี้" : "เผาผลาญประมาณ"}</span><b style="font-size:20px">${isF ? "+" : "-"}${fmtN(tot)} kcal</b></div>` : ""}
<label class="f" for="lgwhen">บันทึกของวัน</label><select id="lgwhen" data-in="lgwhen"><option value="today" ${LG.when === "today" ? "selected" : ""}>วันนี้</option><option value="yest" ${LG.when === "yest" ? "selected" : ""}>เมื่อวาน</option></select>
<button class="btn primary block" style="margin-top:14px" data-act="lgsave">บันทึก</button>
<p class="xs muted" style="margin-top:8px;text-align:center">${isF ? "ตัวเลขแคลอรี่เป็นค่าประมาณ แก้ไขได้ทุกรายการ" : "แคลอรี่คำนวณจากชนิดกิจกรรม เวลา และน้ำหนักตัว เป็นค่าประมาณ"}</p>`
  };
};
ACT.lgtab = (a) => { LG.text = ($("#lgtext") || {}).value || LG.text; LG.tab = a.dataset.t; LG.items = LG.text ? (LG.tab === "food" ? parseFood(LG.text) : parseWork(LG.text)) : []; rerenderSub(); };
function lgSearch(q) {
  const box = $("#lgres"); if (!box) return; const n = normT(q || "").trim();
  if (!n) { box.innerHTML = ""; return; }
  const hit = FOODS.map((f, i) => { const keys = f[3].concat([f[0]]).map(normT); const j = keys.findIndex(k => k.indexOf(n) > -1); return { f, i, s: j < 0 ? -1 : (keys[j].indexOf(n) === 0 ? 0 : 1) }; }).filter(x => x.s >= 0).sort((a, b) => a.s - b.s).slice(0, 8);
  box.innerHTML = hit.length ? hit.map(x => `<button class="chip" data-act="lgpick" data-i="${x.i}">${ic("plus", 14)}${esc(x.f[0])} · ${x.f[1]}</button>`).join("") : '<span class="xs muted">ไม่พบเมนูนี้ พิมพ์ในช่องด้านบนแล้วกดตีความ หรือให้ Claude ประเมินได้</span>';
}
ACT.lgpick = (a) => { const f = FOODS[+a.dataset.i]; if (!f) return; LG.text = ($("#lgtext") || {}).value || LG.text; LG.items.push({ n: f[0], k1: f[1], q: 1, known: true }); rerenderSub(); };
ACT.lgparse = () => { LG.text = $("#lgtext").value; LG.items = LG.text.trim() ? (LG.tab === "food" ? parseFood(LG.text) : parseWork(LG.text)) : []; if (!LG.items.length) toast("พิมพ์สิ่งที่ทำก่อนนะ"); rerenderSub(); };
ACT.lgq = (a) => { const it = LG.items[+a.dataset.i]; it.q = Math.max(0.5, Math.round((it.q + parseFloat(a.dataset.d)) * 2) / 2); rerenderSub(); };
ACT.lgrm = (a) => { LG.items.splice(+a.dataset.i, 1); rerenderSub(); };
ACT.lgadd = () => { LG.items.push(LG.tab === "food" ? { n: "", k1: 0, q: 1, known: false } : { n: "", met: 0, kind: "time", sets: 0, reps: 0, secs: 0, mins: 0, known: false, km: 0 }); rerenderSub(); };
ACT.lgai = async () => {
  const unk = LG.items.filter(x => !x.known && x.n.trim()); if (!unk.length) { toast("พิมพ์ชื่ออาหารก่อนนะ"); return; }
  LG.busy = true; rerenderSub();
  try { const res = await claudeEstimate(unk.map(x => x.n).join(", ")); LG.items = LG.items.filter(x => x.known).concat(res); }
  catch (e) { toast(e.message === "nosample" ? "ตอนนี้ให้ Claude ประเมินไม่ได้ กรอกแคลอรี่เองได้เลย" : "ประเมินไม่สำเร็จ ลองกรอกเองนะ"); }
  LG.busy = false; rerenderSub();
};
async function handlePhoto(file) {
  if (!file) return;
  if (!LG || !$("#sub") || $("#sub").hidden) { LG = { tab: "food", text: "", items: [], when: "today", busy: false }; subStack = [{ name: "log", arg: {} }]; }
  LG.tab = "food"; LG.busy = true; renderSub();
  try { const b = await shrinkImage(file); const res = await claudeEstimate(null, b); if (!res.length) throw new Error("empty"); LG.items = res; toast("ดูรูปแล้ว ลองตรวจตัวเลขอีกที"); }
  catch (e) { toast(e.message === "nosample" || e.message === "noimg" ? "ถ่ายรูปได้แล้ว แต่ตอนนี้ยังให้ AI อ่านรูปไม่ได้ พิมพ์ชื่ออาหารแทนได้เลย" : "อ่านรูปไม่ชัด พิมพ์ชื่ออาหารแทนได้นะ"); }
  LG.busy = false; renderSub();
}
ACT.lgsave = () => {
  const isF = LG.tab === "food", kg = estW(), d = LG.when === "yest" ? addDays(todayKey(), -1) : todayKey(), t = LG.when === "yest" ? "12:00" : nowHM();
  const items = LG.items.filter(x => x.n.trim() || x.known);
  if (!items.length) { toast("ยังไม่มีรายการให้บันทึก"); return; }
  if (isF) {
    items.forEach(it => { const k = Math.round(it.k1 * it.q); S.meals.push({ id: rid(), d, t, n: it.n + (it.q !== 1 ? " ×" + it.q : ""), k }); });
    earn(2); setFx("eat", 2600);
  } else {
    items.forEach(it => { const c = workCalc(it, kg); S.works.push({ id: rid(), d, t, n: it.n + (workLabel(it) ? " · " + workLabel(it) : ""), sets: it.sets || 0, reps: it.reps || 0, k: c.k }); });
    earn(5); setFx("work", 2600);
  }
  touchStreak(); save(); LG = null; closeAllSubs(); toast(isF ? "ป้อนข้าวให้น้องแล้ว" : "บันทึกการออกกำลังกายแล้ว");
};

/* ---------- ชั่งน้ำหนัก น้ำ นอน รอบเอว วันนี้ ---------- */
SUBS.weight = () => {
  const last = S.weights[S.weights.length - 1], tr = trendAt(todayKey());
  const hist = S.weights.slice(-7).reverse().map(x => `<div class="item"><div class="grow">${fmtD(x.d)}</div><b>${f1(x.w)} กก.</b><button class="iconbtn" data-act="delw" data-d="${x.d}" aria-label="ลบ">${ic("trash", 18)}</button></div>`).join("");
  return {
    title: "ชั่งน้ำหนัก", html: `<div class="card" style="text-align:center"><div class="muted sm">เฉลี่ย 7 วัน</div><div class="big-num" id="wavg">${tr ? f1(tr.w) : "-"}</div><div class="muted sm">กก.</div></div>
<label class="f" for="wv">น้ำหนักวันนี้ (กก.)</label><input id="wv" type="number" inputmode="decimal" step="0.1" value="${last ? f1(last.w) : ""}"/>
<p class="xs muted" style="margin-top:6px">ตัวเลขรายวันขึ้นลงได้เป็นเรื่องปกติ ดูค่าเฉลี่ยจะเห็นแนวโน้มจริงกว่า</p>
<button class="btn primary block" style="margin-top:14px" data-act="wsave">บันทึก</button>
${hist ? '<div class="sec">ย้อนหลัง</div><div class="card" style="padding:4px 14px">' + hist + "</div>" : ""}`,
    after: () => { if (tr) countTo($("#wavg"), tr.w, 1); }
  };
};
ACT.wsave = () => {
  const w = parseFloat($("#wv").value); if (!(w >= 30 && w <= 300)) { toast("ใส่น้ำหนักให้ถูกต้องนะ"); return; }
  const d = todayKey(); S.weights = S.weights.filter(x => x.d !== d).concat([{ d, w }]).sort((a, b) => a.d < b.d ? -1 : 1);
  earn(3); touchStreak(); save(); closeAllSubs(); toast("บันทึกน้ำหนักแล้ว " + f1(w) + " กก."); refresh();
};
ACT.delw = (a) => { S.weights = S.weights.filter(x => x.d !== a.dataset.d); save(); rerenderSub(); };
SUBS.water = () => {
  const k = todayKey(), n = S.water[k] || 0, sl = S.sleep[k] || 0;
  return {
    title: "น้ำและการนอน", html: `<div class="sec" style="margin-top:0">น้ำวันนี้ ${n} / 8 แก้ว</div><div class="row wrap">${[1, 2, 3, 4, 5, 6, 7, 8].map(i => `<button class="glass ${n >= i ? "on" : ""}" data-act="wset" data-n="${i}" aria-label="แก้วที่ ${i}"></button>`).join("")}</div>
<div class="sec">เมื่อคืนนอนกี่ชั่วโมง</div><div class="row wrap">${[4, 5, 6, 7, 8, 9, 10].map(h => `<button class="btn sm ${sl === h ? "sel" : ""}" data-act="sleepset" data-h="${h}">${h} ชม.</button>`).join("")}</div>
<p class="xs muted" style="margin-top:12px">นอนไม่พอทำให้หิวง่ายขึ้น ลองให้ได้ 7 ชั่วโมงขึ้นไป</p>`
  };
};
ACT.wset = (a) => { const k = todayKey(), i = +a.dataset.n; S.water[k] = (S.water[k] === i) ? i - 1 : i; if (S.water[k] === 8) { earn(2); toast("ครบ 8 แก้วแล้ว"); } save(); rerenderSub(); };
ACT.sleepset = (a) => { S.sleep[todayKey()] = +a.dataset.h; save(); rerenderSub(); };
SUBS.waist = () => {
  const hist = S.waist.slice(-8).reverse().map(x => `<div class="item"><div class="grow">${fmtD(x.d)}</div><b>${f1(x.c)} ซม.</b></div>`).join("");
  return { title: "รอบเอว", html: `<label class="f" for="cv">รอบเอววันนี้ (ซม.)</label><input id="cv" type="number" inputmode="decimal" step="0.5"/><button class="btn primary block" style="margin-top:12px" data-act="csave">บันทึก</button>${hist ? '<div class="sec">ย้อนหลัง</div><div class="card" style="padding:4px 14px">' + hist + "</div>" : ""}<p class="xs muted" style="margin-top:12px">รูปความคืบหน้ายังไม่มีในเวอร์ชันนี้ ตอนนี้เก็บเป็นตัวเลขส่วนตัว</p>` };
};
ACT.csave = () => { const c = parseFloat($("#cv").value); if (!(c >= 30 && c <= 250)) { toast("ใส่รอบเอวให้ถูกต้องนะ"); return; } const d = todayKey(); S.waist = S.waist.filter(x => x.d !== d).concat([{ d, c }]).sort((a, b) => a.d < b.d ? -1 : 1); save(); rerenderSub(); toast("บันทึกรอบเอวแล้ว"); };
SUBS.today = () => {
  const k = todayKey(), i = dayInfo(k), tgt = targetOn(k);
  const ml = i.meals.map(m => `<div class="item"><div class="grow"><b>${esc(m.n)}</b><div class="xs muted">${m.t}</div></div><span>+${fmtN(m.k)}</span><button class="iconbtn" data-act="delm" data-id="${m.id}" aria-label="ลบ">${ic("trash", 18)}</button></div>`).join("");
  const wl = i.works.map(m => `<div class="item"><div class="grow"><b>${esc(m.n)}</b><div class="xs muted">${m.t}</div></div><span class="muted">-${fmtN(m.k)}</span><button class="iconbtn" data-act="delwk" data-id="${m.id}" aria-label="ลบ">${ic("trash", 18)}</button></div>`).join("");
  return {
    title: "บันทึกวันนี้", html: `<div class="grid2"><div class="card"><div class="muted xs">กินแล้ว</div><div style="font-size:22px;font-weight:600">${fmtN(i.eaten)}</div></div><div class="card"><div class="muted xs">เป้าวันนี้</div><div style="font-size:22px;font-weight:600">${fmtN(tgt)}</div></div></div>
<div class="sec">อาหาร</div><div class="card" style="padding:4px 14px">${ml || '<div class="muted sm" style="padding:12px 0">ยังไม่มีบันทึก</div>'}</div>
<div class="sec">ออกกำลังกาย</div><div class="card" style="padding:4px 14px">${wl || '<div class="muted sm" style="padding:12px 0">ยังไม่มีบันทึก</div>'}</div>
<div class="row" style="margin-top:14px"><button class="btn" style="flex:1" data-act="sub" data-n="log" data-arg="food">${ic("plus", 18)}เพิ่มอาหาร</button><button class="btn" style="flex:1" data-act="sub" data-n="log" data-arg="work">${ic("plus", 18)}เพิ่มออกกำลัง</button></div>`
  };
};
ACT.delm = (a) => { S.meals = S.meals.filter(m => m.id !== a.dataset.id); save(); rerenderSub(); };
ACT.delwk = (a) => { S.works = S.works.filter(m => m.id !== a.dataset.id); save(); rerenderSub(); };

/* ---------- ทุกโหมด ---------- */
const TILES = [
  ["บันทึก", "bowl", "กินอะไรมา", "พิมพ์หรือถ่ายรูป", "log", "food", "d-warn", "อาหาร กิน แคลอรี่ รูป"],
  ["บันทึก", "dumbbell", "ออกกำลังกาย", "พิมพ์เซ็ตและครั้ง", "log", "work", "d-warn", "ออกกำลัง ท่า เซ็ต วิ่ง"],
  ["บันทึก", "scale", "ชั่งน้ำหนัก", "ใส่ตัวเลขวันนี้", "weight", "", "d-warn", "น้ำหนัก ชั่ง"],
  ["บันทึก", "droplet", "น้ำและการนอน", "แตะบันทึกเร็ว", "water", "", "d-warn", "น้ำ นอน หลับ"],
  ["บันทึก", "ruler", "รอบเอว", "เก็บเป็นส่วนตัว", "waist", "", "d-warn", "เอว วัด"],
  ["ช่วยตัดสินใจ", "dice", "วันนี้กินอะไรดี", "สุ่มเมนูไทย", "pick", "", "d-green", "สุ่ม เมนู กินอะไร"],
  ["ช่วยตัดสินใจ", "fridge", "ของในตู้เย็น", "บอกของที่มี", "fridge", "", "d-green", "ตู้เย็น วัตถุดิบ ทำอาหาร"],
  ["ช่วยตัดสินใจ", "moon", "โหมดหิวดึก", "พัก 10 นาทีก่อน", "night", "", "d-green", "หิว ดึก กลางคืน อยากกิน"],
  ["ช่วยตัดสินใจ", "party", "โหมดวันหลุด", "วางแผนล่วงหน้า", "cheat", "", "d-green", "งานเลี้ยง วันหลุด บุฟเฟ่ต์ ปาร์ตี้"],
  ["ช่วยตัดสินใจ", "calendar", "แผนมื้อสัปดาห์", "พร้อมรายการซื้อของ", "plan", "", "d-green", "แผน มื้อ ซื้อของ สัปดาห์"],
  ["ดูความคืบหน้า", "chart", "กราฟย้อนหลัง", "น้ำหนัก แคล เซ็ต", "charts", "", "d-blue", "กราฟ สถิติ"],
  ["ดูความคืบหน้า", "mail", "จดหมายสัปดาห์", "จากตัวละคร", "letter", "", "d-blue", "จดหมาย สรุป สัปดาห์"],
  ["ดูความคืบหน้า", "run", "คลังท่าออกกำลัง", "มีภาพอนิเมชัน", "lib", "", "d-blue", "ท่า สอน ออกกำลัง ตัวจับเวลา"],
  ["ดูความคืบหน้า", "heart", "บันทึกอารมณ์", "วันนี้รู้สึกยังไง", "mood", "", "d-rose", "อารมณ์ ความรู้สึก ใจ เครียด เศร้า ดี สดใส"],
  ["ดูความคืบหน้า", "target", "ภารกิจ", "ปลดล็อกของใหม่", "missions", "", "d-blue", "ภารกิจ เหรียญ รางวัล"],
  ["ดูความคืบหน้า", "send", "แชร์การ์ดความคืบหน้า", "ส่ง LINE หรือ IG", "share", "", "d-blue", "แชร์ การ์ด รูป ไลน์ อินสตาแกรม ส่งต่อ"],
  ["ดูความคืบหน้า", "sparkle", "เหรียญรางวัล", "ได้เองจากความสม่ำเสมอ", "medals", "", "d-blue", "เหรียญ รางวัล ความสำเร็จ ถ้วย"],
  ["ตัวละครของฉัน", "home", "ตกแต่งห้อง", "ของแต่ง สัตว์เลี้ยง", "room", "", "d-rose", "ห้อง ตกแต่ง เฟอร์นิเจอร์ สัตว์เลี้ยง วอลเปเปอร์ พรม"],
  ["ตัวละครของฉัน", "hanger", "แต่งตัว", "เปลี่ยนได้ทุกเมื่อ", "wardrobe", "", "d-rose", "แต่งตัว เสื้อ ผม"],
  ["ตัวละครของฉัน", "bag", "ร้านค้า", "ใช้เหรียญซื้อ", "shop", "", "d-rose", "ร้าน ซื้อ เหรียญ"],
  ["ตัวละครของฉัน", "users", "เพื่อนช่วยกัน", "เร็วๆ นี้", "", "", "d-rose", "เพื่อน"],
  ["อื่นๆ", "settings", "ตั้งค่าและข้อมูล", "เป้าหมาย สำรองข้อมูล", "settings", "", "d-blue", "ตั้งค่า สำรอง ข้อมูล รีเซ็ต"]
];
let hubQ = "";
function renderHub() {
  const q = hubQ.trim(); let sec = "", out = "";
  TILES.forEach(t => {
    if (q && (t[2] + t[3] + t[7]).indexOf(q) < 0) return;
    if (t[0] !== sec) { if (sec) out += "</div>"; sec = t[0]; out += `<div class="sec">${sec}</div><div class="grid2">`; }
    const dis = !t[4];
    out += `<button class="tile" ${dis ? "disabled" : `data-act="${t[4] === "charts" ? "nav" : "sub"}" data-n="${t[4]}" data-v="charts" ${t[5] ? `data-arg="${t[5]}"` : ""}`}><span class="dot ${t[6]}">${ic(t[1], 20)}</span><span><b>${t[2]}</b><span class="s">${t[3]}</span></span></button>`;
  });
  if (sec) out += "</div>";
  $("#v-hub").innerHTML = `<div class="top"><h1>ทุกโหมด</h1></div><div class="row" style="background:var(--card);border:1px solid var(--line);border-radius:24px;padding:0 14px"><span class="muted">${ic("search", 18)}</span><input id="hubq" type="text" placeholder="ค้นหา เช่น หิว น้ำหนัก เมนู" value="${esc(hubQ)}" style="border:0;background:transparent;padding-left:6px" aria-label="ค้นหาโหมด"/></div><p class="xs muted" style="margin:6px 4px 0">เปิดได้ 3 ทาง: ปุ่ม + หน้าแรก แท็บทั้งหมด หรือค้นหา</p>${out || '<p class="muted" style="margin-top:20px">ไม่เจอโหมดที่ค้นหา ลองคำอื่นดูนะ</p>'}`;
  const inp = $("#hubq"); if (hubQ) { inp.focus(); inp.setSelectionRange(hubQ.length, hubQ.length); }
}
