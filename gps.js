/* คาร์ดิโอด้วย GPS: เดิน/วิ่ง/ปั่นจักรยาน วัดระยะ เวลา ความเร็ว เส้นทาง และสถิติ (ใช้ได้ตอนเปิดหน้าจอแอปอยู่) */
const GT = { walk: { n: "เดินเร็ว", ex: "brisk", max: 4.2, ic: "run" }, run: { n: "วิ่ง", ex: "jog", max: 9.5, ic: "run" }, bike: { n: "ปั่นจักรยาน", ex: "cycle", max: 20, ic: "run" } };
const hav = (a, b, c, d) => { const R = 6371000, p = Math.PI / 180, x = Math.sin((c - a) * p / 2) ** 2 + Math.cos(a * p) * Math.cos(c * p) * Math.sin((d - b) * p / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const metOf = (type, kmh) => type === "bike" ? (kmh < 16 ? 5.8 : kmh < 19 ? 6.8 : kmh < 22 ? 8 : kmh < 26 ? 10 : 12) : type === "run" ? (kmh < 8 ? 7.5 : kmh < 9.7 ? 9 : kmh < 11.3 ? 10.5 : kmh < 12.9 ? 11.8 : 13) : (kmh < 3.2 ? 2.8 : kmh < 4.5 ? 3.3 : kmh < 5.5 ? 4 : kmh < 6.5 ? 5 : 6.3);
const hms = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
const paceTxt = sp => sp > .3 ? hms(1000 / sp) + " /กม." : "-";
let GP = null, GWID = null, GTICK = null;
const gpNew = type => ({ type, phase: "ready", acc: 0, seg: 0, dist: 0, pts: [], recent: [], last: null, splits: [], sig: "", startedAt: 0, gaps: 0, err: "" });
const gpActive = (g, t) => g.acc + (g.phase === "run" ? ((t || Date.now()) - g.seg) / 1000 : 0);
function gpOnPos(pos) {
  const g = GP; if (!g || g.phase !== "run") return; const c = pos.coords, t = pos.timestamp || Date.now(), acc = c.accuracy || 99;
  g.sig = acc <= 15 ? "ดี" : acc <= 30 ? "พอใช้" : "อ่อน"; if (acc > 35) return;
  const cur = { la: c.latitude, lo: c.longitude, t };
  if (!g.last) { g.last = cur; g.pts.push([cur.la, cur.lo]); return; }
  const d = hav(g.last.la, g.last.lo, cur.la, cur.lo), dt = (t - g.last.t) / 1000; if (dt <= 0) return;
  if (d < Math.max(3, Math.min(acc, 12) * .35)) return;
  if (d / dt > GT[g.type].max * 1.6) return;
  if (dt > 60) g.gaps++;
  const before = g.dist; g.dist += d; g.last = cur; g.pts.push([cur.la, cur.lo]);
  const a = gpActive(g, t), k0 = Math.floor(before / 1000), k1 = Math.floor(g.dist / 1000);
  for (let k = k0 + 1; k <= k1; k++) g.splits.push(Math.round(a));
  g.recent.push({ t, dist: g.dist }); while (g.recent.length > 2 && t - g.recent[0].t > 40000) g.recent.shift();
}
function gpSpeed(g) { const r = g.recent; if (r.length < 2) return 0; const a = r[0], b = r[r.length - 1], dt = (b.t - a.t) / 1000; return dt > 3 ? (b.dist - a.dist) / dt : 0; }
function gpKcal(g, secs) { const kmh = secs > 0 ? g.dist / secs * 3.6 : 0; return workCalc({ n: GT[g.type].n, met: metOf(g.type, kmh), kind: "time", mins: secs / 60, known: true, km: 0 }, estW()).k; }
function routeSvg(pts, cur) {
  if (!pts || pts.length < 2) return `<div class="gpsmap${cur ? " live" : ""}" role="img" aria-label="แผนที่เส้นทาง"><svg viewBox="0 0 300 160" preserveAspectRatio="none" aria-hidden="true"><g class="gm-grid">${[40, 80, 120].map(y => `<path d="M0 ${y}H300"/>`).join("")}${[60, 120, 180, 240].map(x => `<path d="M${x} 0V160"/>`).join("")}</g><path class="gm-route" d="M30 130C70 130 70 80 120 85S170 130 210 90 250 40 275 38"/></svg>${cur ? `<span class="gm-dot"></span><span class="gm-ping"></span>` : ""}<div class="gm-t">${cur ? "กำลังรอสัญญาณ GPS เดินหรือวิ่งต่อเพื่อให้เห็นเส้นทาง" : "ไม่มีข้อมูลเส้นทาง"}</div></div>`;
  const la0 = pts.reduce((a, p) => a + p[0], 0) / pts.length, kx = Math.cos(la0 * Math.PI / 180), xs = pts.map(p => p[1] * kx), ys = pts.map(p => -p[0]);
  const mnx = Math.min.apply(null, xs), mxx = Math.max.apply(null, xs), mny = Math.min.apply(null, ys), mxy = Math.max.apply(null, ys), W = 300, H = 170, pad = 14, sc = Math.min((W - 2 * pad) / Math.max(mxx - mnx, 1e-7), (H - 2 * pad) / Math.max(mxy - mny, 1e-7));
  const ox = (W - (mxx - mnx) * sc) / 2, oy = (H - (mxy - mny) * sc) / 2, X = i => ox + (xs[i] - mnx) * sc, Y = i => oy + (ys[i] - mny) * sc, n = pts.length;
  const path = pts.map((p, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(i).toFixed(1)).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="เส้นทาง" style="width:100%;height:auto;background:var(--soft);border-radius:14px"><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${X(0).toFixed(1)}" cy="${Y(0).toFixed(1)}" r="5" fill="var(--green)"/><circle cx="${X(n - 1).toFixed(1)}" cy="${Y(n - 1).toFixed(1)}" r="5.5" fill="#F0679B" stroke="#fff" stroke-width="2"/></svg>`;
}
const decim = (pts, m) => { if (pts.length <= m) return pts.map(p => [+p[0].toFixed(5), +p[1].toFixed(5)]); const o = []; for (let i = 0; i < m; i++) o.push(pts[Math.round(i * (pts.length - 1) / (m - 1))]); return o.map(p => [+p[0].toFixed(5), +p[1].toFixed(5)]); };

SUBS.gps = () => {
  if (!GP) GP = gpNew("run"); const g = GP, T = GT[g.type], ph = g.phase;
  if (ph === "done") return gpSummary(g);
  const types = Object.keys(GT).map(k => `<button class="fchip sm ${g.type === k ? "on" : ""}" data-act="gpstype" data-v="${k}" ${ph !== "ready" ? "disabled" : ""}>${GT[k].n}</button>`).join("");
  const btns = ph === "ready" ? `<button class="btn primary" style="flex:1" data-act="gpsstart">เริ่ม</button>` : ph === "run" ? `<button class="btn" style="flex:1" data-act="gpspause">${ic("pause", 18)}หยุดพัก</button><button class="btn danger" data-act="gpsend">จบ</button>` : `<button class="btn primary" style="flex:1" data-act="gpspause">${ic("play", 18)}ไปต่อ</button><button class="btn danger" data-act="gpsend">จบ</button>`;
  return { title: "คาร์ดิโอ GPS", keepScroll: true, html: `<div class="frow" style="margin-bottom:8px">${types}</div>
<div class="card" style="text-align:center"><div class="muted xs" id="gstate">${ph === "ready" ? "พร้อมแล้วกดเริ่ม" : ph === "paused" ? "หยุดพักอยู่" : "กำลังบันทึก"}</div><div class="tcount" id="gdist">0.00</div><div class="muted">กิโลเมตร</div>
<div class="gstats"><div><b id="gtime">0:00</b><span>เวลา</span></div><div><b id="gpace">-</b><span>${g.type === "bike" ? "ความเร็วตอนนี้" : "เพซตอนนี้"}</span></div><div><b id="gavg">-</b><span>${g.type === "bike" ? "เฉลี่ย กม./ชม." : "เพซเฉลี่ย"}</span></div><div><b id="gkc">0</b><span>kcal</span></div></div></div>
<div class="row" style="margin-top:12px;gap:8px">${btns}</div>
<div class="xs muted" id="gsig" style="margin-top:8px;text-align:center">${g.err ? esc(g.err) : ph === "ready" ? "เปิดหน้าจอแอปค้างไว้ระหว่างบันทึก ถ้าจอดับหรือสลับแอป GPS อาจหยุดบันทึก" : ""}</div>
<div class="sec">เส้นทาง</div><div id="gmap">${routeSvg(g.pts, true)}</div><div class="sec">เวลาต่อกิโลเมตร</div><div id="gsplit" class="xs muted">ยังไม่ครบ 1 กม.</div>`, after: () => { if (ph === "run") gpTick(); } };
};
function gpTick() {
  const g = GP; if (!g) return; const el = $("#gdist"); if (!el) return; const a = gpActive(g), kmh = a > 0 ? g.dist / a * 3.6 : 0, sp = gpSpeed(g);
  el.textContent = (g.dist / 1000).toFixed(2); $("#gtime").textContent = hms(a);
  $("#gpace").textContent = g.type === "bike" ? (sp * 3.6).toFixed(1) + " กม./ชม." : paceTxt(sp);
  $("#gavg").textContent = g.dist > 20 ? (g.type === "bike" ? kmh.toFixed(1) : paceTxt(g.dist / a)) : "-"; $("#gkc").textContent = g.dist > 20 ? gpKcal(g, a) : 0;
  const s = $("#gsig"); if (s && g.phase === "run") s.textContent = g.err ? g.err : "สัญญาณ GPS: " + (g.sig || "กำลังค้นหา") + (g.gaps ? " · มีช่วงที่สัญญาณขาด " + g.gaps + " ครั้ง" : "");
  if (g.pts.length !== g._mp) { g._mp = g.pts.length; const m = $("#gmap"); if (m) m.innerHTML = routeSvg(g.pts, true); }
  const sp2 = $("#gsplit"); if (sp2 && g.splits.length) sp2.innerHTML = g.splits.map((x, i) => `<div class="item"><div class="grow">กม. ${i + 1}</div><b>${hms(x - (g.splits[i - 1] || 0))}</b></div>`).join("");
}
function gpWatch() {
  if (!navigator.geolocation) { GP.err = "เครื่องนี้ไม่รองรับ GPS ในเบราว์เซอร์ ใช้บันทึกเองแทนได้"; return false; }
  try { GWID = navigator.geolocation.watchPosition(gpOnPos, e => { if (!GP) return; GP.err = e.code === 1 ? "ไม่ได้รับอนุญาตใช้ตำแหน่ง เปิดสิทธิ์ตำแหน่งให้เบราว์เซอร์แล้วลองใหม่" : "สัญญาณ GPS อ่อน ลองออกที่โล่ง"; }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }); } catch (e) { GP.err = "เปิด GPS ไม่ได้"; return false; }
  return true;
}
function gpStopWatch() { try { if (GWID != null) navigator.geolocation.clearWatch(GWID); } catch (e) { } GWID = null; clearInterval(GTICK); GTICK = null; }
ACT.gpstype = a => { if (GP && GP.phase === "ready") { GP.type = a.dataset.v; rerenderSub(); } };
ACT.gpsstart = () => { GP.err = ""; GP.phase = "run"; GP.seg = Date.now(); GP.startedAt = Date.now(); GP.last = null; if (!gpWatch()) { GP.phase = "ready"; rerenderSub(); return; } wakeOn(); clearInterval(GTICK); GTICK = setInterval(gpTick, 1000); beep(990, .12); rerenderSub(); };
ACT.gpspause = () => { const g = GP; if (g.phase === "run") { g.acc = gpActive(g); g.phase = "paused"; gpStopWatch(); wakeOff(); } else { g.phase = "run"; g.seg = Date.now(); g.last = null; g.recent = []; gpWatch(); wakeOn(); GTICK = setInterval(gpTick, 1000); } rerenderSub(); };
ACT.gpsend = () => { const g = GP; if (g.phase === "run") { g.acc = gpActive(g); } gpStopWatch(); wakeOff(); g.phase = "done"; g.secs = Math.round(g.acc); g.k = gpKcal(g, g.acc); rerenderSub(); };
const cardioBest = type => { const L = (S.cardio || []).filter(c => c.type === type); return { far: Math.max.apply(null, [0].concat(L.map(c => c.m))), pace: Math.min.apply(null, [1e9].concat(L.filter(c => c.m >= 1000).map(c => c.secs / c.m))), split: Math.min.apply(null, [1e9].concat(L.reduce((a, c) => a.concat((c.sp || []).map((x, i) => x - (c.sp[i - 1] || 0))), []))) }; };
function gpSummary(g) {
  const T = GT[g.type], km = g.dist / 1000, pace = g.dist > 0 ? g.secs / g.dist : 0, prior = cardioBest(g.type), prs = [];
  if (g.dist >= 1000 && g.type !== "bike") { if (pace < prior.pace && prior.pace < 1e8) prs.push("เพซเฉลี่ยดีที่สุด " + hms(pace * 1000) + " /กม."); const bs = Math.min.apply(null, g.splits.map((x, i) => x - (g.splits[i - 1] || 0)).concat([1e9])); if (bs < prior.split && prior.split < 1e8) prs.push("1 กม. เร็วที่สุด " + hms(bs)); }
  if (g.dist > prior.far && prior.far > 0) prs.push("ระยะไกลที่สุด " + km.toFixed(2) + " กม.");
  g._prs = prs; const tiny = g.dist < 50;
  return { title: "สรุป " + T.n, html: `<div class="card" style="text-align:center"><div class="muted">${T.n}</div><div class="big-num">${km.toFixed(2)} กม.</div><div class="sm">${hms(g.secs)} · ${g.type === "bike" ? (g.dist / Math.max(1, g.secs) * 3.6).toFixed(1) + " กม./ชม." : paceTxt(g.dist / Math.max(1, g.secs))} · ประมาณ ${g.k} kcal</div></div>
<div class="sec">เส้นทาง</div>${routeSvg(g.pts, false)}${g.splits.length ? `<div class="sec">เวลาต่อกิโลเมตร</div>${g.splits.map((x, i) => `<div class="item"><div class="grow">กม. ${i + 1}</div><b>${hms(x - (g.splits[i - 1] || 0))}</b></div>`).join("")}` : ""}
${prs.length ? `<div class="sec">สถิติใหม่</div>${prs.map(p => `<div class="hint">${ic("sparkle", 18)}<span>${p}</span></div>`).join("")}` : ""}
${g.gaps ? `<p class="xs muted" style="margin-top:8px">มีช่วงที่สัญญาณขาด ${g.gaps} ครั้ง ระยะอาจคลาดเคลื่อนเล็กน้อย</p>` : ""}${tiny ? `<div class="hint warnh">${ic("heart", 18)}<span>ระยะสั้นมาก (ไม่ถึง 50 เมตร) ถ้าเป็นการทดสอบ กดทิ้งได้</span></div>` : ""}
<div class="row" style="margin-top:14px;gap:8px"><button class="btn danger" data-act="gpsdrop">ทิ้ง</button><button class="btn primary" style="flex:1" data-act="gpssave">บันทึก</button></div><p class="xs muted" style="margin-top:8px">kcal ประมาณจากความเร็วเฉลี่ยและน้ำหนักตัว</p>` };
}
ACT.gpsdrop = () => { GP = null; closeSub(); if (subStack.length) rerenderSub(); };
ACT.gpssave = () => { const g = GP; if (!g || g.saved) return; g.saved = 1; cardioSave({ type: g.type, m: Math.round(g.dist), secs: g.secs, k: g.k, pts: decim(g.pts, 120), sp: g.splits }); GP = null; closeAllSubs(); openSub("cardio", {}); };
function cardioSave(r) {
  const T = GT[r.type], rec = Object.assign({ id: rid(), d: todayKey(), t: nowHM() }, r); S.cardio = (S.cardio || []).concat([rec]).slice(-300);
  const km = r.m / 1000, label = `${T.n} ${km.toFixed(2)} กม. · ${Math.max(1, Math.round(r.secs / 60))} นาที`;
  S.works.push({ id: rid(), d: rec.d, t: rec.t, n: label, ex: T.ex, sets: 0, reps: 0, k: r.k, g: rec.id }); earn(5 + Math.min(5, Math.floor(km))); touchStreak(); save(); confetti(); setFx("proud", 3000); toast("บันทึกแล้ว " + label);
}
document.addEventListener("visibilitychange", () => { if (GP && GP.phase === "run" && !document.hidden) wakeOn(); });
window.GPSX = { onPos: gpOnPos, get: () => GP };

/* ---------- ประวัติและสถิติคาร์ดิโอ ---------- */
function barChart(vals, labels) {
  const W = 320, H = 130, pl = 8, pb = 22, pt = 14, mx = Math.max.apply(null, vals.concat([1])), bw = (W - pl * 2) / vals.length;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="ระยะทางรายสัปดาห์" style="width:100%;height:auto">${vals.map((v, i) => { const h = (H - pb - pt) * v / mx, x = pl + i * bw + bw * .18; return `<rect x="${x.toFixed(1)}" y="${(H - pb - h).toFixed(1)}" width="${(bw * .64).toFixed(1)}" height="${Math.max(h, v ? 2 : 0).toFixed(1)}" rx="4" fill="${i === vals.length - 1 ? "var(--accent)" : "color-mix(in srgb, var(--accent) 40%, var(--soft))"}"/>${v ? `<text x="${(x + bw * .32).toFixed(1)}" y="${(H - pb - h - 4).toFixed(1)}" text-anchor="middle" font-size="9.5" fill="var(--muted)">${v.toFixed(1)}</text>` : ""}<text x="${(x + bw * .32).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="9.5" fill="var(--muted)">${labels[i]}</text>`; }).join("")}</svg>`;
}
SUBS.cardio = arg => {
  const L = (S.cardio || []).slice().sort((a, b) => (a.d + a.t) < (b.d + b.t) ? 1 : -1);
  if (arg && arg.id && arg.id.indexOf("g:") === 0) { const c = (S.cardio || []).find(x => x.id === arg.id.slice(2)); if (c) return cardioDetail(c); }
  const mon = weekStart(), weeks = Array.from({ length: 8 }, (_, i) => { const f = addDays(mon, -7 * (7 - i)), t = addDays(f, 6); return [fmtD(f).split(" ")[0], (S.cardio || []).filter(c => c.d >= f && c.d <= t).reduce((a, c) => a + c.m, 0) / 1000]; });
  const tot = L.reduce((a, c) => a + c.m, 0) / 1000, wk = weeks[7][1], bests = Object.keys(GT).map(k => ({ k, b: cardioBest(k) })).filter(x => x.b.far > 0);
  const row = c => `<button class="item" style="width:100%;text-align:left" data-act="sub" data-n="cardio" data-arg="g:${c.id}"><div class="grow"><b>${GT[c.type] ? GT[c.type].n : c.type} ${(c.m / 1000).toFixed(2)} กม.</b><div class="xs muted">${fmtD(c.d)} ${c.t} · ${hms(c.secs)} · ${c.type === "bike" ? (c.m / Math.max(1, c.secs) * 3.6).toFixed(1) + " กม./ชม." : paceTxt(c.m / Math.max(1, c.secs))}${c.man ? " · บันทึกเอง" : ""}</div></div>${ic("play", 16)}</button>`;
  return { title: "คาร์ดิโอและเส้นทาง", html: `<button class="btn primary block" data-act="gpsnew">${ic("play", 18)}เริ่มวัดด้วย GPS</button><button class="btn block" style="margin-top:8px" data-act="cardioman">บันทึกเอง (ลู่วิ่ง จักรยานฟิตเนส)</button>
<div class="ptiles" style="margin-top:12px"><div class="ptile"><b>${wk.toFixed(1)}</b><span>กม. สัปดาห์นี้</span></div><div class="ptile"><b>${tot.toFixed(1)}</b><span>กม. ทั้งหมด</span></div><div class="ptile"><b>${L.length}</b><span>ครั้ง</span></div></div>
<div class="sec">ระยะทางรายสัปดาห์ (กม.)</div><div class="card">${barChart(weeks.map(w => w[1]), weeks.map(w => w[0]))}</div>
${bests.length ? `<div class="sec">สถิติ</div>${bests.map(x => `<div class="item"><div class="grow"><b>${GT[x.k].n}</b><div class="xs muted">ไกลสุด ${(x.b.far / 1000).toFixed(2)} กม.${x.b.pace < 1e8 && x.k !== "bike" ? " · เพซดีสุด " + hms(x.b.pace * 1000) + " /กม." : ""}${x.b.split < 1e8 && x.k !== "bike" ? " · 1 กม. เร็วสุด " + hms(x.b.split) : ""}</div></div></div>`).join("")}` : ""}
<div class="sec">ประวัติ</div>${L.slice(0, 30).map(row).join("") || `<p class="xs muted">ยังไม่มีบันทึก</p>`}` };
};
function cardioDetail(c) { return { title: GT[c.type] ? GT[c.type].n + " " + fmtD(c.d) : "คาร์ดิโอ", html: `<div class="card" style="text-align:center"><div class="big-num">${(c.m / 1000).toFixed(2)} กม.</div><div class="sm">${hms(c.secs)} · ${c.type === "bike" ? (c.m / Math.max(1, c.secs) * 3.6).toFixed(1) + " กม./ชม." : paceTxt(c.m / Math.max(1, c.secs))} · ${c.k} kcal</div></div>${c.pts && c.pts.length > 1 ? `<div class="sec">เส้นทาง</div>${routeSvg(c.pts, false)}` : ""}${c.sp && c.sp.length ? `<div class="sec">เวลาต่อกิโลเมตร</div>${c.sp.map((x, i) => `<div class="item"><div class="grow">กม. ${i + 1}</div><b>${hms(x - (c.sp[i - 1] || 0))}</b></div>`).join("")}` : ""}<button class="btn danger block" style="margin-top:14px" data-act="cardiodel" data-id="${c.id}">ลบบันทึกนี้</button>` }; }
ACT.gpsnew = () => { if (GP && GP.phase !== "ready" && GP.phase !== "done") { openSub("gps", {}); return; } GP = null; openSub("gps", {}); };
ACT.cardiodel = a => { const id = a.dataset.id, i = (S.cardio || []).findIndex(x => x.id === id); if (i < 0) return; const it = S.cardio[i]; S.cardio.splice(i, 1); S.del["g:" + id] = Date.now(); const wi = S.works.findIndex(w => w.g === id); let w = null; if (wi >= 0) { w = S.works.splice(wi, 1)[0]; S.del["k:" + w.id] = Date.now(); } save(); closeSub(); if (subStack.length) rerenderSub(); toastUndo("ลบแล้ว", () => { S.cardio.push(it); delete S.del["g:" + id]; if (w) { S.works.push(w); delete S.del["k:" + w.id]; } save(); if (subStack.length) rerenderSub(); }); };
ACT.cardioman = () => openModal(`<h2>บันทึกคาร์ดิโอเอง</h2><label class="f" for="cmt">ชนิด</label><select id="cmt">${Object.keys(GT).map(k => `<option value="${k}">${GT[k].n}</option>`).join("")}</select><div class="grid2"><div><label class="f" for="cmk">ระยะ (กม.)</label><input id="cmk" type="number" inputmode="decimal" min="0" step="0.1" value="3"/></div><div><label class="f" for="cmm">เวลา (นาที)</label><input id="cmm" type="number" inputmode="numeric" min="1" value="30"/></div></div><div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="modalclose">ยกเลิก</button><button class="btn primary" style="flex:1" data-act="cardiomansave">บันทึก</button></div>`);
ACT.cardiomansave = () => { const type = $("#cmt").value, km = Math.max(0, +$("#cmk").value || 0), min = Math.max(1, Math.round(+$("#cmm").value || 0)); if (!km) { toast("ใส่ระยะก่อน"); return; } const secs = min * 60, g = { type, dist: km * 1000 }; closeModal(); cardioSave({ type, m: Math.round(km * 1000), secs, k: gpKcal(g, secs), pts: [], sp: [], man: 1 }); rerenderSub(); };
/* ---------- ทางเข้า ---------- */
(function () {
  if (!TILES.some(t => t[4] === "cardio")) TILES.splice(TILES.findIndex(t => t[4] === "progress") + 1, 0, ["บันทึก", "run", "วิ่ง เดิน ปั่น (GPS)", "วัดระยะ เพซ เส้นทาง", "cardio", "", "d-warn", "วิ่ง เดิน ปั่นจักรยาน จีพีเอส gps ระยะ เพซ กิโล เส้นทาง"]);
  const oLib = SUBS.lib; SUBS.lib = a => { const r = oLib(a), id = a && a.id; if (r && r.html && (id === "jog" || id === "brisk" || id === "cycle")) r.html = r.html.replace('<div class="sec">วิธีทำ</div>', `<button class="btn block" style="margin:10px 0" data-act="gpsgo" data-v="${id === "jog" ? "run" : id === "cycle" ? "bike" : "walk"}">${ic("run", 18)}วัดด้วย GPS ตอนออกไปทำ</button><div class="sec">วิธีทำ</div>`); return r; };
  ACT.gpsgo = a => { GP = gpNew(a.dataset.v); openSub("gps", {}); };
  const oBack = ACT.back; ACT.back = () => { const t = subStack[subStack.length - 1]; if (t && t.name === "gps" && GP && (GP.phase === "run" || GP.phase === "paused") && !confirmBack()) return; if (t && t.name === "gps" && GP && GP.phase === "ready") GP = null; oBack(); };
  function confirmBack() { openModal(`<h2>จบการวัดตอนนี้ไหม</h2><p class="muted" style="margin:8px 0 14px">ถ้าจบ จะดูสรุปและเลือกบันทึกได้</p><div class="row"><button class="btn primary" style="flex:1" data-act="modalclose">วัดต่อ</button><button class="btn danger" style="flex:1" data-act="gpsendm">จบ</button></div>`); return false; }
  ACT.gpsendm = () => { closeModal(); ACT.gpsend(); };
})();
