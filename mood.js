/* บันทึกอารมณ์: เลือกหน้ายิ้มวันละครั้ง + โน้ตสั้นๆ แล้วดูความเชื่อมโยงกับการกินและการขยับตัวแบบไม่ตัดสิน */
const MOODS = [
  { v: 1, n: "แย่", c: "#A9B8F0" }, { v: 2, n: "เครียด", c: "#F2B49B" }, { v: 3, n: "เฉยๆ", c: "#F6DE8D" }, { v: 4, n: "ดี", c: "#A8DDB5" }, { v: 5, n: "สดใส", c: "#F8B5CB" }
];
const MOOD_INK = "#3B2A24";
function moodFace(v, size, on) {
  const m = MOODS[v - 1], op = on === false ? ' opacity=".38"' : "", E = (x) => `<circle cx="${x}" cy="21" r="2.6" fill="${MOOD_INK}"/>`;
  let f = "";
  if (v === 1) f = `<path d="M12 18l7-4M36 18l-7-4" stroke="${MOOD_INK}" stroke-width="2" stroke-linecap="round"/>${E(17)}${E(31)}<path d="M17 35q7-6 14 0" fill="none" stroke="${MOOD_INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M33 26q2 4 0 6q-2-2 0-6z" fill="#8CC8E8"/>`;
  else if (v === 2) f = `<path d="M12 18l8 3M36 18l-8 3" stroke="${MOOD_INK}" stroke-width="2" stroke-linecap="round"/>${E(17)}${E(31)}<path d="M15 34q3-3 6 0t6 0t6 0" fill="none" stroke="${MOOD_INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  else if (v === 3) f = `${E(17)}${E(31)}<path d="M18 34h12" stroke="${MOOD_INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  else if (v === 4) f = `${E(17)}${E(31)}<path d="M16 31q8 8 16 0" fill="none" stroke="${MOOD_INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  else f = `<path d="M13 22q4-5 8 0M27 22q4-5 8 0" fill="none" stroke="${MOOD_INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M15 30q9 13 18 0z" fill="#8A4A3A"/><circle cx="12" cy="29" r="3.4" fill="#F4A0A8" opacity=".7"/><circle cx="36" cy="29" r="3.4" fill="#F4A0A8" opacity=".7"/><path d="M40 8l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#FFF1B8"/>`;
  return `<svg class="mface" viewBox="0 0 48 48" width="${size}" height="${size}" role="img" aria-label="${m.n}"${op}><circle cx="24" cy="24" r="21" fill="${m.c}"/>${f}</svg>`;
}
const moodOf = (k) => (S.moods && S.moods[k]) || null;
function moodSet(day, v, note) {
  S.moods = S.moods || {}; const o = S.moods[day] || {};
  S.moods[day] = { m: v, note: (note !== undefined ? note : o.note || "").slice(0, 140), t: Date.now() }; save();
}
function moodReact(v) {
  if (v <= 2) setFx("sad", 5000); else if (v === 5) { setFx("joy", 4500); if (typeof cheerStage === "function") setTimeout(cheerStage, 200); } else setFx("ok", 4000);
}
function moodCardHTML() {
  const tk = todayKey(), cur = moodOf(tk);
  const faces = MOODS.map(m => `<button class="mbtn ${cur && cur.m === m.v ? "on" : ""}" data-act="mdquick" data-v="${m.v}" aria-label="${m.n}" aria-pressed="${!!(cur && cur.m === m.v)}">${moodFace(m.v, 40, !cur || cur.m === m.v)}</button>`).join("");
  return `<div class="card moodcard"><div class="row between"><b>${cur ? "วันนี้รู้สึก" + MOODS[cur.m - 1].n : "วันนี้รู้สึกยังไงบ้าง"}</b><button class="chip soft" data-act="sub" data-n="mood">${ic("heart", 14)}${cur ? "เล่าเพิ่ม" : "ดูทั้งหมด"}</button></div><div class="mrow">${faces}</div></div>`;
}
ACT.mdquick = (a) => { const v = +a.dataset.v; moodSet(todayKey(), v); moodReact(v); toast(v <= 2 ? "ขอบคุณที่บอกนะ ไม่เป็นไรเลย" : "บันทึกอารมณ์แล้ว"); };

/* ---------- ข้อสังเกตจากข้อมูล (ไม่ใช่การวินิจฉัย) ---------- */
function moodInsights() {
  const keys = Object.keys(S.moods || {}).filter(k => S.moods[k] && S.moods[k].m), out = [];
  if (keys.length < 5) return { n: keys.length, items: [], need: 5 - keys.length };
  const low = keys.filter(k => S.moods[k].m <= 2), high = keys.filter(k => S.moods[k].m >= 4), logged = ks => ks.filter(k => dayInfo(k).logged);
  const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
  const lf = logged(low), hf = logged(high);
  if (lf.length >= 3 && hf.length >= 3) {
    const a = avg(lf.map(k => dayInfo(k).eaten)), b = avg(hf.map(k => dayInfo(k).eaten)), d = a - b;
    if (Math.abs(d) >= 150 && Math.abs(d) / Math.max(a, b) >= 0.1) out.push(d > 0 ? `วันที่รู้สึกแย่หรือเครียด กินเฉลี่ย ${fmtN(a)} kcal มากกว่าวันที่รู้สึกดี (${fmtN(b)} kcal) อยู่ราว ${fmtN(Math.abs(d))} kcal ลองสังเกตดูว่าบางทีเรากินเพื่อปลอบใจหรือเปล่า` : `วันที่รู้สึกแย่หรือเครียด กินเฉลี่ย ${fmtN(a)} kcal น้อยกว่าวันที่รู้สึกดี (${fmtN(b)} kcal) อยู่ราว ${fmtN(Math.abs(d))} kcal บางทีเวลาไม่สบายใจเราก็ไม่อยากอาหาร อย่าลืมเติมพลังนะ`);
  }
  const sweetShare = k => { const i = dayInfo(k); let s = 0, t = 0; i.meals.forEach(m => { const f = findFood(baseName(m.n)); t += m.k; if (f && (f[2] === "s" || f[2] === "d") && f[0] !== "น้ำเปล่า") s += m.k; }); return t ? s / t : 0; };
  if (lf.length >= 3 && hf.length >= 3) {
    const a = avg(lf.map(sweetShare)) * 100, b = avg(hf.map(sweetShare)) * 100;
    if (a - b >= 8) out.push(`วันที่รู้สึกแย่ ของว่างและเครื่องดื่มคิดเป็น ${r0(a)}% ของที่กิน ส่วนวันที่รู้สึกดี ${r0(b)}% ถ้าอยากลองดู ก่อนหยิบของหวานลองพัก 10 นาทีหรือจิบน้ำก่อน`);
  }
  const wk = keys.filter(k => dayInfo(k).works.length), nw = keys.filter(k => !dayInfo(k).works.length);
  if (wk.length >= 3 && nw.length >= 3) {
    const a = avg(wk.map(k => S.moods[k].m)), b = avg(nw.map(k => S.moods[k].m));
    if (a - b >= 0.5) out.push(`วันที่ได้ขยับตัว อารมณ์เฉลี่ย ${a.toFixed(1)} จาก 5 สูงกว่าวันที่ไม่ได้ขยับ (${b.toFixed(1)}) การเดินเล่นสั้นๆ ก็ช่วยได้`);
  }
  return { n: keys.length, items: out, need: 0 };
}
function moodWeekNote() {
  const today = todayKey(), ms = []; for (let i = 6; i >= 0; i--) { const m = moodOf(addDays(today, -i)); if (m && m.m) ms.push(m.m); }
  if (ms.length < 3) return ""; const a = ms.reduce((s, x) => s + x, 0) / ms.length;
  const cnt = {}; ms.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; }); const top = +Object.keys(cnt).sort((p, q) => cnt[q] - cnt[p])[0];
  return `อารมณ์สัปดาห์นี้ส่วนใหญ่ "${MOODS[top - 1].n}" (บันทึก ${ms.length} วัน)\n` + (a <= 2.2 ? "ถ้าสัปดาห์นี้หนักไป พักใจบ้างนะ ฉันอยู่ตรงนี้เสมอ\n" : a >= 4 ? "ได้เห็นเธอยิ้มแบบนี้ ฉันดีใจจังเลย\n" : "");
}

/* ---------- หน้าบันทึกอารมณ์ ---------- */
SUBS.mood = (arg) => {
  const st = arg.st = arg.st || { day: todayKey(), v: null, note: null }, cur = moodOf(st.day);
  const v = st.v !== null ? st.v : (cur ? cur.m : null), note = st.note !== null ? st.note : (cur ? cur.note || "" : "");
  const days = []; for (let i = 13; i >= 0; i--) days.push(addDays(todayKey(), -i));
  const hist = days.map(k => { const m = moodOf(k); return `<div class="mh"><span class="xs muted">${THDAY[new Date(k + "T12:00:00").getDay()]}</span>${m ? moodFace(m.m, 30) : '<span class="mnone"></span>'}</div>`; }).join("");
  const ins = moodInsights(), recent = days.slice(-7).map(moodOf).filter(x => x && x.m), low = recent.length >= 4 && recent.reduce((s, x) => s + x.m, 0) / recent.length <= 2;
  const insHTML = ins.need ? `<p class="muted sm">บันทึกอารมณ์ต่ออีก ${ins.need} วัน แล้วจะเริ่มเห็นความเชื่อมโยงกับการกินและการขยับตัว</p>` : (ins.items.length ? ins.items.map(t => `<p class="sm" style="margin-top:8px">${esc(t)}</p>`).join("") : '<p class="muted sm">ตอนนี้ยังไม่เห็นรูปแบบที่ชัดเจน ซึ่งก็เป็นเรื่องปกติ ลองบันทึกต่อไปอีกสักพัก</p>');
  return {
    title: "บันทึกอารมณ์", keepScroll: true,
    html: `<div class="seg"><button class="${st.day === todayKey() ? "on" : ""}" data-act="mdday" data-d="0">วันนี้</button><button class="${st.day !== todayKey() ? "on" : ""}" data-act="mdday" data-d="1">เมื่อวาน</button></div>
<div class="card" style="margin-top:12px"><b>${st.day === todayKey() ? "วันนี้รู้สึกยังไงบ้าง" : "เมื่อวานรู้สึกยังไงบ้าง"}</b><div class="mrow big">${MOODS.map(m => `<button class="mbtn ${v === m.v ? "on" : ""}" data-act="mdpick" data-v="${m.v}" aria-pressed="${v === m.v}">${moodFace(m.v, 52, v === null || v === m.v)}<span class="xs">${m.n}</span></button>`).join("")}</div>
<label class="f" for="mdnote">อยากเล่าอะไรไหม (ไม่บังคับ)</label><textarea id="mdnote" rows="2" maxlength="140" placeholder="เช่น งานเยอะ แต่ได้เดินเล่นตอนเย็น">${esc(note)}</textarea>
<div class="row" style="margin-top:10px"><button class="btn primary" style="flex:1" data-act="mdsave"${v === null ? " disabled" : ""}>บันทึก</button>${cur ? '<button class="btn" data-act="mddel">ลบ</button>' : ""}</div></div>
<div class="sec">14 วันที่ผ่านมา</div><div class="card"><div class="mhist">${hist}</div></div>
<div class="sec">ข้อสังเกตจากข้อมูลของคุณ</div><div class="card">${insHTML}<p class="xs muted" style="margin-top:10px">เป็นแค่ข้อสังเกตจากข้อมูลที่บันทึก ไม่ใช่การวินิจฉัย และความเกี่ยวข้องไม่ได้แปลว่าเป็นสาเหตุ</p></div>
${low ? `<div class="hint">${ic("heart", 18)}<span>ช่วงนี้ดูเหมือนจะหนักอยู่นะ ถ้ารู้สึกแย่ติดต่อกันหลายวัน คุยกับคนที่ไว้ใจได้ หรือโทรสายด่วนสุขภาพจิต 1323 (ฟรี 24 ชั่วโมง) ได้เสมอ</span></div>` : ""}
<p class="xs muted" style="margin-top:12px">อารมณ์ที่บันทึกเก็บในเครื่องนี้ และรวมอยู่ในไฟล์สำรองข้อมูล</p>`
  };
};
const mdSt = () => { const t = subStack[subStack.length - 1]; return t && t.arg && t.arg.st; };
const mdKeepNote = () => { const st = mdSt(), el = $("#mdnote"); if (st && el) st.note = el.value; };
ACT.mdday = (a) => { const st = mdSt(); if (!st) return; st.day = a.dataset.d === "0" ? todayKey() : addDays(todayKey(), -1); st.v = null; st.note = null; rerenderSub(); };
ACT.mdpick = (a) => { const st = mdSt(); if (!st) return; mdKeepNote(); st.v = +a.dataset.v; rerenderSub(); };
ACT.mdsave = () => {
  const st = mdSt(); if (!st) return; mdKeepNote(); const cur = moodOf(st.day), v = st.v !== null ? st.v : (cur ? cur.m : null); if (v === null) return;
  moodSet(st.day, v, st.note !== null ? st.note : undefined); toast("บันทึกแล้ว"); const isToday = st.day === todayKey(); closeSub(); if (isToday) moodReact(v);
};
ACT.mddel = () => { const st = mdSt(); if (!st || !S.moods) return; delete S.moods[st.day]; (S.del = S.del || {})["md:" + st.day] = Date.now(); st.v = null; st.note = null; save(); toast("ลบแล้ว"); rerenderSub(); };
