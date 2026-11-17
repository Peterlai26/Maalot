/* บันทึกน้ำหนักที่ยก สถิติส่วนตัว กราฟพัฒนาการ และแผนที่กล้ามเนื้อรายสัปดาห์ */
const weighted = e => !!(e && e.reps && ["push", "pull", "squat", "hinge", "lunge"].includes(e.pat));
const est1 = (w, r) => (w > 0 && r > 0 && r <= 12) ? w * (1 + r / 30) : 0;
const r1 = v => Math.round(v * 10) / 10;
const liftsOf = id => (S.lifts || []).filter(l => l.ex === id).sort((a, b) => (a.d + a.t) < (b.d + b.t) ? -1 : 1);
const lastW = id => { const l = liftsOf(id); if (!l.length) return 0; const s = l[l.length - 1].sets; return s.length ? s[s.length - 1].w || 0 : 0; };
const stepW = e => (e && e.eq.some(k => k === "bbell" || k === "machine")) ? 2.5 : 1;
function recStats(l) { let bw = 0, b1 = 0, br = 0, vol = 0; l.sets.forEach(s => { bw = Math.max(bw, s.w || 0); b1 = Math.max(b1, est1(s.w, s.r)); br = Math.max(br, s.r || 0); vol += (s.w || 0) * (s.r || 0); }); return { bw, b1, br, vol }; }
/* ตรวจสถิติใหม่ของบันทึกหนึ่งเทียบกับบันทึกก่อนหน้า */
function prsOf(rec, prior) {
  const e = libOf(rec.ex), out = [], cur = recStats(rec); if (!prior.length) return out;
  const pb = prior.map(recStats), best = k => Math.max.apply(null, pb.map(x => x[k]));
  if (cur.bw > 0) { if (cur.b1 > best("b1") + .01) out.push({ n: e.n, t: "ประมาณ 1RM", v: r1(cur.b1) + " กก." }); else if (cur.bw > best("bw") + .01) out.push({ n: e.n, t: "น้ำหนักสูงสุด", v: cur.bw + " กก." }); }
  else if (cur.br > best("br")) out.push({ n: e.n, t: "ครั้งต่อเซ็ตสูงสุด", v: cur.br + " ครั้ง" });
  return out;
}
const mgOfWork = w => { let e = w.ex && libOf(w.ex); if (!e) e = LIB.slice().sort((a, b) => b.n.length - a.n.length).find(x => (w.n || "").indexOf(x.n) === 0); return e || null; };
function weekMg(from, to) {
  const o = {}; MGS.forEach(m => o[m] = 0); let cardioMin = 0;
  (S.works || []).filter(w => w.d >= from && w.d <= to).forEach(w => { const e = mgOfWork(w); if (!e) return; const n = w.sets || 1;
    e.mg.forEach((m, i) => { if (m === "คาร์ดิโอ") return; o[m] += n * (i ? .5 : 1); });
    if (e.mg.includes("คาร์ดิโอ")) { const mm = /(\d+) นาที/.exec(w.n || ""); cardioMin += mm ? +mm[1] : (w.sets ? w.sets * .75 : 5); } });
  o["คาร์ดิโอ"] = cardioMin; return o;
}
const weekStart = () => addDays(todayKey(), -FIT.dow());

/* ---------- กราฟเส้น ---------- */
function lineChart(pts, unit) {
  if (!pts.length) return "";
  const W = 320, H = 160, pl = 38, pr = 12, pt = 12, pb = 24; let mn = Math.min.apply(null, pts.map(p => p.y)), mx = Math.max.apply(null, pts.map(p => p.y));
  if (mn === mx) { mn -= 1; mx += 1; } const sp = mx - mn; mn = Math.max(0, mn - sp * .15); mx += sp * .15;
  const X = i => pts.length > 1 ? pl + (W - pl - pr) * i / (pts.length - 1) : pl + (W - pl - pr) / 2, Y = v => H - pb - (H - pt - pb) * (v - mn) / (mx - mn);
  const ticks = [mn, (mn + mx) / 2, mx].map(v => `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${Math.round(v * 10) / 10}</text>`).join("");
  const path = pts.map((p, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(p.y).toFixed(1)).join("");
  const dots = pts.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${i === pts.length - 1 ? 4.5 : 3}" fill="var(--accent)"/>`).join("");
  const last = pts[pts.length - 1], lx = Math.min(W - pr - 20, Math.max(pl + 20, X(pts.length - 1)));
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟพัฒนาการ" style="width:100%;height:auto">${ticks}<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}<text x="${lx}" y="${Y(last.y) - 9}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--ink)">${Math.round(last.y * 10) / 10}${unit || ""}</text><text x="${pl}" y="${H - 6}" font-size="10" fill="var(--muted)">${fmtD(pts[0].d)}</text><text x="${W - pr}" y="${H - 6}" text-anchor="end" font-size="10" fill="var(--muted)">${fmtD(last.d)}</text></svg>`;
}

/* ---------- แผนที่กล้ามเนื้อ ---------- */
function mmapSvg(v) {
  const ratio = m => { const t = MGT[m]; return t ? v[m] / ((t[0] + t[1]) / 2) : 0; };
  const f = m => { const r = ratio(m); return v[m] > 0 ? `fill="var(--accent)" fill-opacity="${Math.min(1, .22 + r * .6).toFixed(2)}"` : `fill="var(--soft)"`; };
  const sh = `stroke="var(--line)" stroke-width="1"`;
  const body = dx => `<circle cx="${55 + dx}" cy="16" r="11" fill="var(--soft)" ${sh}/><rect x="${50 + dx}" y="25" width="10" height="8" fill="var(--soft)"/>`;
  const legs = (dx, m) => `<rect x="${41 + dx}" y="112" width="13" height="78" rx="6" ${f(m)} ${sh}/><rect x="${56 + dx}" y="112" width="13" height="78" rx="6" ${f(m)} ${sh}/>`;
  const front = `${body(0)}<ellipse cx="32" cy="46" rx="10" ry="8" ${f("ไหล่")} ${sh}/><ellipse cx="78" cy="46" rx="10" ry="8" ${f("ไหล่")} ${sh}/><rect x="42" y="38" width="26" height="28" rx="10" ${f("อก")} ${sh}/><rect x="44" y="68" width="22" height="40" rx="8" ${f("แกนกลาง")} ${sh}/><rect x="19" y="54" width="11" height="48" rx="5.5" ${f("แขน")} ${sh}/><rect x="80" y="54" width="11" height="48" rx="5.5" ${f("แขน")} ${sh}/>${legs(0, "ขา")}`;
  const back = `${body(110)}<ellipse cx="142" cy="46" rx="10" ry="8" ${f("ไหล่")} ${sh}/><ellipse cx="188" cy="46" rx="10" ry="8" ${f("ไหล่")} ${sh}/><rect x="152" y="38" width="26" height="50" rx="10" ${f("หลัง")} ${sh}/><rect x="129" y="54" width="11" height="48" rx="5.5" ${f("แขน")} ${sh}/><rect x="190" y="54" width="11" height="48" rx="5.5" ${f("แขน")} ${sh}/><rect x="152" y="90" width="26" height="22" rx="9" ${f("ก้น")} ${sh}/>${legs(110, "ขา")}`;
  return `<svg viewBox="0 0 220 196" role="img" aria-label="แผนที่กล้ามเนื้อที่ฝึกสัปดาห์นี้" style="width:100%;max-width:340px;display:block;margin:0 auto">${front}${back}<text x="55" y="194" text-anchor="middle" font-size="10" fill="var(--muted)">ด้านหน้า</text><text x="165" y="194" text-anchor="middle" font-size="10" fill="var(--muted)">ด้านหลัง</text></svg>`;
}

/* ---------- หน้าสถิติ ---------- */
SUBS.progress = () => {
  const mon = weekStart(), sun = addDays(mon, 6), pm = addDays(mon, -7), cur = weekMg(mon, sun), prev = weekMg(pm, addDays(mon, -1));
  const sess = (S.sessions || []).filter(s => s.d >= mon && s.d <= sun), works = (S.works || []).filter(w => w.d >= mon && w.d <= sun);
  const lifts = (S.lifts || []).filter(l => l.d >= mon && l.d <= sun), vol = lifts.reduce((a, l) => a + recStats(l).vol, 0), kc = works.reduce((a, w) => a + (w.k || 0), 0);
  const tile = (n, l) => `<div class="ptile"><b>${n}</b><span>${l}</span></div>`;
  const rows = Object.keys(MGT).map(m => { const t = MGT[m], v = cur[m], w = Math.min(100, Math.round(v / t[1] * 100)), st = v === 0 ? "none" : v < t[0] * .8 ? "low" : v > t[1] ? "high" : "ok"; return `<div class="fana"><span>${m}</span><i><b class="${st}" style="width:${w}%"></b></i><em>${Math.round(v * 10) / 10} เซ็ต<small>${prev[m] ? " · ก่อน " + Math.round(prev[m]) : ""}</small></em></div>`; }).join("");
  const none = Object.keys(MGT).filter(m => cur[m] === 0);
  const prs = []; const byEx = {}; (S.lifts || []).slice().sort((a, b) => (a.d + a.t) < (b.d + b.t) ? -1 : 1).forEach(l => { const pr = prsOf(l, byEx[l.ex] || []); pr.forEach(p => prs.push(Object.assign({ d: l.d }, p))); (byEx[l.ex] = byEx[l.ex] || []).push(l); });
  const exs = Object.keys(byEx).map(id => { const e = libOf(id), l = byEx[id], b = l.reduce((a, x) => Math.max(a, recStats(x).b1 || recStats(x).bw), 0); return e ? `<button class="item" style="width:100%;text-align:left" data-act="sub" data-n="liftx" data-arg="${id}"><div class="grow"><b>${e.n}</b><div class="xs muted">${l.length} ครั้งที่บันทึก · ล่าสุด ${fmtD(l[l.length - 1].d)}</div></div><span class="sm">${b ? r1(b) + " กก." : "น้ำหนักตัว"}</span></button>` : ""; }).join("");
  return { title: "สถิติและกล้ามเนื้อ", html: `<div class="ptiles">${tile(sess.length, "เซสชันสัปดาห์นี้")}${tile(Math.round(cur["ขา"] + cur["อก"] + cur["หลัง"] + cur["ไหล่"] + cur["แขน"] + cur["แกนกลาง"] + cur["ก้น"]), "เซ็ตทั้งหมด")}${tile(vol ? fmtN(vol) : "-", "ปริมาตร (กก.)")}${tile(fmtN(kc), "kcal จากออกกำลัง")}</div>
<div class="sec">แผนที่กล้ามเนื้อสัปดาห์นี้</div><div class="card">${mmapSvg(cur)}<div class="mleg"><span>ยังไม่ได้ฝึก</span><i></i><span>ถึงเกณฑ์</span></div></div>
<div class="card" style="margin-top:8px">${rows}<div class="xs muted" style="margin-top:6px">คาร์ดิโอสัปดาห์นี้ ${Math.round(cur["คาร์ดิโอ"])} นาที (เป้า 150) · แถบเต็ม = เซ็ตต่อสัปดาห์ที่แนะนำสูงสุด</div></div>
${none.length ? `<div class="hint">${ic("sparkle", 18)}<span>สัปดาห์นี้ยังไม่ได้ฝึก: ${none.join(" ")} ลองเพิ่มสักท่าเพื่อให้สมดุล</span></div>` : ""}
<div class="sec">สถิติใหม่ล่าสุด</div>${prs.length ? prs.slice(-6).reverse().map(p => `<div class="item"><div class="grow"><b>${esc(p.n)}</b><div class="xs muted">${p.t} · ${fmtD(p.d)}</div></div><b>${p.v}</b></div>`).join("") : `<p class="xs muted">ยังไม่มีสถิติใหม่ บันทึกน้ำหนักที่ยกในเซสชันหรือกดปุ่มด้านล่าง แล้วสถิติส่วนตัวจะขึ้นที่นี่</p>`}
<div class="sec">ท่าที่บันทึกน้ำหนัก</div>${exs || `<p class="xs muted">ยังไม่มีบันทึก</p>`}
<button class="btn block" style="margin-top:12px" data-act="liftadd">${ic("plus", 18)}บันทึกน้ำหนักที่ยกเอง</button>` };
};
SUBS.liftx = arg => {
  const e = libOf(arg.id), l = liftsOf(arg.id); if (!e) return { title: "สถิติ", html: "" };
  const st = l.map(recStats), pts = l.map((x, i) => ({ d: x.d, y: st[i].b1 || st[i].bw || st[i].br })), unit = st.some(s => s.bw) ? " กก." : " ครั้ง";
  const best = k => Math.max.apply(null, [0].concat(st.map(s => s[k])));
  const rows = l.slice(-12).reverse().map(x => `<div class="item"><div class="grow"><b>${fmtD(x.d)}</b><div class="xs muted">${x.sets.map(s => s.w ? `${s.r}×${s.w}` : `${s.r} ครั้ง`).join(" · ")}</div></div><button class="linkb" data-act="liftdel" data-id="${x.id}" aria-label="ลบบันทึก">ลบ</button></div>`).join("");
  return { title: e.n, html: `<div class="ptiles">${tile3(best("b1") ? r1(best("b1")) : "-", "1RM ประมาณ (กก.)")}${tile3(best("bw") || "น้ำหนักตัว", "หนักสุด (กก.)")}${tile3(l.length, "ครั้งที่บันทึก")}</div>
<div class="sec">พัฒนาการ ${st.some(s => s.bw) ? "(1RM ประมาณ)" : "(ครั้งต่อเซ็ตสูงสุด)"}</div><div class="card">${pts.length ? lineChart(pts, unit.trim() === "กก." ? " กก." : "") : `<p class="xs muted">ยังไม่มีข้อมูล</p>`}${pts.length === 1 ? `<div class="xs muted">บันทึกอีกครั้งจะเห็นเส้นกราฟ</div>` : ""}</div>
<div class="sec">ประวัติ (เซ็ต ครั้ง × กก.)</div>${rows || ""}<button class="btn block" style="margin-top:12px" data-act="liftadd" data-id="${e.id}">${ic("plus", 18)}บันทึกเพิ่ม</button><p class="xs muted" style="margin-top:10px">1RM ประมาณจากสูตร Epley (น้ำหนัก × (1 + ครั้ง ÷ 30)) ใช้ได้กับเซ็ตไม่เกิน 12 ครั้ง เป็นค่าประมาณเท่านั้น ไม่ควรลองยก 1 ครั้งเต็มโดยไม่มีคนช่วยดู</p>` };
};
const tile3 = (n, l) => `<div class="ptile"><b>${n}</b><span>${l}</span></div>`;
ACT.liftdel = a => { const i = (S.lifts || []).findIndex(x => x.id === a.dataset.id); if (i < 0) return; const it = S.lifts[i]; S.lifts.splice(i, 1); S.del["l:" + it.id] = Date.now(); save(); rerenderSub(); toastUndo("ลบบันทึกแล้ว", () => { S.lifts.push(it); delete S.del["l:" + it.id]; save(); rerenderSub(); }); };
ACT.liftadd = a => {
  const opts = LIB.filter(weighted).map(e => `<option value="${e.id}" ${a.dataset.id === e.id ? "selected" : ""}>${e.n}</option>`).join("");
  openModal(`<h2>บันทึกน้ำหนักที่ยก</h2><label class="f" for="lxe">ท่า</label><select id="lxe">${opts}</select><div class="grid2"><div><label class="f" for="lxw">น้ำหนัก (กก.)</label><input id="lxw" type="number" inputmode="decimal" min="0" step="0.5" value="0"/></div><div><label class="f" for="lxr">ครั้งต่อเซ็ต</label><input id="lxr" type="number" inputmode="numeric" min="1" value="10"/></div></div><label class="f" for="lxs">กี่เซ็ต</label><input id="lxs" type="number" inputmode="numeric" min="1" max="10" value="3"/><p class="xs muted" style="margin-top:6px">น้ำหนัก 0 = ใช้น้ำหนักตัว</p><div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="modalclose">ยกเลิก</button><button class="btn primary" style="flex:1" data-act="liftsave">บันทึก</button></div>`);
};
ACT.liftsave = () => {
  const ex = $("#lxe").value, w = Math.max(0, +$("#lxw").value || 0), r = Math.max(1, Math.round(+$("#lxr").value || 0)), n = clampN(Math.round(+$("#lxs").value || 1), 1, 10);
  const rec = { id: rid(), d: todayKey(), t: nowHM(), ex, sets: Array.from({ length: n }, () => ({ w, r })) }, pr = prsOf(rec, liftsOf(ex));
  S.lifts = (S.lifts || []).concat([rec]); save(); closeModal(); toast(pr.length ? "สถิติใหม่! " + pr[0].t + " " + pr[0].v : "บันทึกแล้ว"); if (pr.length) confetti(); rerenderSub();
};
/* ---------- ทางเข้า ---------- */
(function () {
  if (!TILES.some(t => t[4] === "progress")) TILES.splice(TILES.findIndex(t => t[4] === "fit") + 1, 0, ["ดูความคืบหน้า", "chart", "สถิติและกล้ามเนื้อ", "น้ำหนักที่ยก สถิติ แผนที่กล้ามเนื้อ", "progress", "", "d-blue", "สถิติ น้ำหนักที่ยก 1rm กล้ามเนื้อ แผนที่ กราฟ ออกกำลัง"]);
  const oFit = SUBS.fit; SUBS.fit = a => { const r = oFit(a); if (r && r.html) r.html = r.html.replace('<div class="sec">โปรแกรมของฉัน</div>', `<button class="btn block" style="margin-top:12px" data-act="sub" data-n="progress">${ic("chart", 18)}สถิติและแผนที่กล้ามเนื้อ</button><div class="sec">โปรแกรมของฉัน</div>`); return r; };
})();
