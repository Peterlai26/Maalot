/* หน้า "บันทึกวันนี้" แบบใหม่: สรุปวันด้วยวงแหวน เลื่อนดูย้อนหลัง ไทม์ไลน์แยกช่วงมื้อ แตะรายการเพื่อแก้ไข */
let TODAY_OFF = 0;
const mealPeriod = t => { const v = t || "12:00"; return v < "05:00" ? "ดึก" : v < "10:30" ? "เช้า" : v < "15:00" ? "กลางวัน" : v < "18:00" ? "ของว่างบ่าย" : v < "22:00" ? "เย็น" : "ดึก"; };
const PERIODS = [["เช้า", "sun"], ["กลางวัน", "bowl"], ["ของว่างบ่าย", "sparkle"], ["เย็น", "moon"], ["ดึก", "moon"]];
function dayRing(pct, over) {
  const C = 2 * Math.PI * 42, v = Math.min(100, pct);
  return `<svg class="tring2" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" class="bg"/><circle cx="50" cy="50" r="42" class="fg ${over ? "over" : ""}" stroke-dasharray="${(C * v / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 50 50)"/></svg>`;
}
SUBS.today = () => {
  const key = addDays(todayKey(), -TODAY_OFF), info = dayInfo(key), tgt = targetOn(key), total = tgt + info.wk, rem = total - info.eaten, pct = Math.round(info.eaten / Math.max(1, total) * 100);
  const label = TODAY_OFF === 0 ? "วันนี้" : TODAY_OFF === 1 ? "เมื่อวาน" : THDAYL[new Date(key + "T12:00:00").getDay()];
  const canAdd = TODAY_OFF <= 1, sum = typeof nutriSum === "function" ? nutriSum(info.meals) : null, water = S.water[key] || 0, wgt = S.weights.find(w => w.d === key), md = typeof moodOf === "function" ? moodOf(key) : null;
  const nav = `<div class="dnav"><button class="iconbtn" data-act="todaynav" data-d="1" ${TODAY_OFF >= 30 ? "disabled" : ""} aria-label="วันก่อนหน้า">${ic("back", 20)}</button><div><b>${label}</b><div class="xs muted">${fmtD(key)} ${new Date(key + "T12:00:00").getFullYear() + 543}</div></div><button class="iconbtn fwd" data-act="todaynav" data-d="-1" ${TODAY_OFF <= 0 ? "disabled" : ""} aria-label="วันถัดไป">${ic("back", 20)}</button></div>`;
  const hero = `<div class="dhero">${dayRing(pct, rem < -100)}<div class="dh-in"><div class="xs muted">กินแล้ว</div><div class="dh-big">${fmtN(info.eaten)}</div><div class="xs muted">kcal</div></div><div class="dh-side"><div><span class="xs muted">เป้า${info.wk ? " (รวมออกกำลัง)" : ""}</span><b>${fmtN(total)}</b></div><div><span class="xs muted">${rem >= 0 ? "เหลือ" : "เกิน"}</span><b class="${rem < -100 ? "warnt" : ""}">${fmtN(Math.abs(rem))}</b></div>${info.wk ? `<div><span class="xs muted">ออกกำลัง</span><b>-${fmtN(info.wk)}</b></div>` : ""}</div></div>`;
  const macros = sum && sum.have ? `<button class="dmac" data-act="sub" data-n="nutri"><span><i class="m1"></i>โปรตีน <b>${fmtN(sum.p)}</b> g</span><span><i class="m2"></i>คาร์บ <b>${fmtN(sum.c)}</b> g</span><span><i class="m3"></i>ไขมัน <b>${fmtN(sum.f)}</b> g</span>${ic("back", 14)}</button>` : "";
  const chips = `<div class="dchips"><span class="chip blue">${ic("droplet", 14)}น้ำ ${water}/8</span>${wgt ? `<span class="chip">${ic("scale", 14)}${f1(wgt.w)} กก.</span>` : ""}${md && typeof MOODS !== "undefined" ? `<span class="chip soft">${ic("heart", 14)}${MOODS[md.m - 1].n}</span>` : ""}</div>`;
  const by = {}; info.meals.slice().sort((a, b) => (a.t || "").localeCompare(b.t || "")).forEach(m => { (by[mealPeriod(m.t)] = by[mealPeriod(m.t)] || []).push(m); });
  const meals = PERIODS.filter(p => by[p[0]]).map(p => { const L = by[p[0]], k = L.reduce((s, m) => s + m.k, 0); return `<div class="dper"><span class="dper-ic">${ic(p[1], 16)}</span><b>${p[0]}</b><span class="xs muted">${fmtN(k)} kcal</span></div><div class="card dlist">${L.map(m => `<button class="dit" data-act="mealedit" data-id="${m.id}"><span class="dt">${esc(m.t || "")}</span><span class="dn"><b>${esc(m.n)}</b>${m.p !== undefined ? `<small>โปรตีน ${fmtN(m.p)} · คาร์บ ${fmtN(m.c)} · ไขมัน ${fmtN(m.f)} g</small>` : ""}</span><span class="dk">${fmtN(m.k)}</span></button>`).join("")}</div>`; }).join("");
  const works = info.works.slice().sort((a, b) => (a.t || "").localeCompare(b.t || ""));
  const wsec = works.length ? `<div class="dper"><span class="dper-ic w">${ic("dumbbell", 16)}</span><b>ออกกำลังกาย</b><span class="xs muted">-${fmtN(info.wk)} kcal</span></div><div class="card dlist">${works.map(m => `<div class="dit"><span class="dt">${esc(m.t || "")}</span>${typeof workThumb === "function" ? workThumb(m, 1) : ""}<span class="dn"><b>${esc(m.n)}</b></span><span class="dk w">-${fmtN(m.k)}</span><button class="iconbtn" data-act="delwk" data-id="${m.id}" aria-label="ลบ">${ic("trash", 18)}</button></div>`).join("")}</div>` : "";
  const empty = !info.meals.length && !works.length ? `<div class="dempty"><div class="dempty-ic">${ic("bowl", 30)}</div><b>ยังไม่มีบันทึก${TODAY_OFF ? "ของวันนี้" : ""}</b><p class="muted sm">${canAdd ? "แตะปุ่มด้านล่างเพื่อเล่าให้น้องก้อนฟังว่ากินอะไรมา" : "วันนี้ไม่ได้บันทึกไว้"}</p></div>` : "";
  const add = canAdd ? `<div class="dadd"><button class="btn primary" data-act="todayadd" data-t="food">${ic("plus", 18)}เพิ่มอาหาร</button><button class="btn" data-act="todayadd" data-t="work">${ic("plus", 18)}เพิ่มออกกำลัง</button></div>` : `<p class="xs muted" style="text-align:center;margin-top:14px">เพิ่มย้อนหลังได้เฉพาะวันนี้และเมื่อวาน</p>`;
  return { title: "บันทึกวันนี้", html: `${nav}${hero}${macros}${chips}${empty}${meals}${wsec}<p class="xs muted" style="margin:12px 4px 0">แตะรายการอาหารเพื่อแก้ชื่อ แคลอรี่ หรือเวลา</p>${add}` };
};
ACT.todaynav = (a) => { TODAY_OFF = Math.max(0, Math.min(30, TODAY_OFF + (+a.dataset.d))); rerenderSub(); };
ACT.todayadd = (a) => { const off = TODAY_OFF; logText(a.dataset.t, ""); if (LG && off === 1) { LG.when = "yest"; rerenderSub(); } };
ACT.mealedit = (a) => {
  const m = S.meals.find(x => x.id === a.dataset.id); if (!m) return;
  openModal(`<h2>แก้รายการอาหาร</h2><label class="f" for="mn">ชื่อ</label><input id="mn" type="text" maxlength="40" value="${esc(m.n)}"/><div class="grid2"><div><label class="f" for="mk">แคลอรี่ (kcal)</label><input id="mk" type="number" inputmode="numeric" min="0" value="${m.k}"/></div><div><label class="f" for="mt">เวลา</label><input id="mt" type="time" value="${esc(m.t || "")}"/></div></div><div class="row" style="margin-top:14px"><button class="btn danger" data-act="mealdel" data-id="${m.id}">${ic("trash", 16)}ลบ</button><button class="btn" style="flex:1" data-act="modalclose">ยกเลิก</button><button class="btn primary" style="flex:1" data-act="mealsave" data-id="${m.id}">บันทึก</button></div>`);
};
ACT.mealsave = (a) => {
  const m = S.meals.find(x => x.id === a.dataset.id); if (!m) return; const n = ($("#mn").value || "").trim(), k = Math.max(0, parseFloat($("#mk").value) || 0), t = $("#mt").value;
  if (!n) { toast("ใส่ชื่อก่อนนะ"); return; }
  if (m.k > 0 && m.p !== undefined && k !== m.k) { const r = k / m.k; ["p", "c", "f", "fb", "sg", "na"].forEach(x => { if (m[x] !== undefined) m[x] = Math.round(m[x] * r * 10) / 10; }); }
  m.n = n; m.k = Math.round(k); if (/^\d{2}:\d{2}$/.test(t)) m.t = t; save(); closeModal(); rerenderSub();
};
ACT.mealdel = (a) => { S.meals = S.meals.filter(x => x.id !== a.dataset.id); (S.del = S.del || {})["m:" + a.dataset.id] = Date.now(); save(); closeModal(); rerenderSub(); toast("ลบแล้ว"); };
/* เปิดหน้านี้ใหม่ทุกครั้งเริ่มที่วันนี้ */
const _openSubT = openSub; openSub = function (name, arg) { if (name === "today") TODAY_OFF = 0; return _openSubT(name, arg); };
