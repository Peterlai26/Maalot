/* เหรียญรางวัล: ได้เองอัตโนมัติเมื่อทำถึงเป้า 4 ระดับ (ทองแดง เงิน ทอง เพชร) ต่างจากภารกิจที่ต้องกดรับ */
const MEDAL_TIERS = [["ทองแดง", "#E39A5A", "#B5683A"], ["เงิน", "#C5CDD6", "#8E99A6"], ["ทอง", "#F6CF5E", "#D39A1E"], ["เพชร", "#8FD6F2", "#3F9CCB"]];
const MEDAL_COINS = [10, 20, 40, 80];
const MEDALS = [
  { id: "streak", n: "เข้าแอปต่อเนื่อง", d: "วันติดกันที่ยาวที่สุด", icon: "flame", unit: "วัน", tiers: [3, 7, 14, 30], prog: () => S.streak.best || 0 },
  { id: "log", n: "นักจดอาหาร", d: "จำนวนวันที่บันทึกอาหาร", icon: "bowl", unit: "วัน", tiers: [3, 7, 30, 100], prog: () => new Set(S.meals.map(m => m.d)).size },
  { id: "bf", n: "มื้อเช้าสดใส", d: "จำนวนวันที่บันทึกมื้อเช้า (ก่อน 10:30)", icon: "sparkle", unit: "วัน", tiers: [3, 10, 30, 60], prog: () => new Set(S.meals.filter(m => m.t < "10:30").map(m => m.d)).size },
  { id: "bal", n: "วันสมดุล", d: "วันที่กินไม่น้อยเกินไปและไม่เกินเป้า", icon: "heart", unit: "วัน", tiers: [1, 7, 30, 60], prog: () => medalBalDays() },
  { id: "work", n: "นักออกกำลัง", d: "จำนวนครั้งที่บันทึกการออกกำลังกาย", icon: "dumbbell", unit: "ครั้ง", tiers: [5, 20, 50, 100], prog: () => S.works.length },
  { id: "water", n: "สายน้ำ", d: "จำนวนวันที่ดื่มน้ำครบ 8 แก้ว", icon: "droplet", unit: "วัน", tiers: [3, 10, 30, 60], prog: () => Object.keys(S.water).filter(k => S.water[k] >= 8).length },
  { id: "weigh", n: "ชั่งสม่ำเสมอ", d: "จำนวนครั้งที่ชั่งน้ำหนัก", icon: "scale", unit: "ครั้ง", tiers: [3, 10, 30, 60], prog: () => S.weights.length },
  { id: "mood", n: "ใส่ใจใจตัวเอง", d: "จำนวนวันที่บันทึกอารมณ์", icon: "heart", unit: "วัน", tiers: [3, 7, 30, 60], prog: () => Object.keys(S.moods || {}).length },
  { id: "night", n: "ผ่านคืนหิว", d: "จำนวนครั้งที่ผ่านโหมดหิวดึก", icon: "moon", unit: "ครั้ง", tiers: [1, 3, 10, 30], prog: () => S.nights || 0 }
];
function medalBalDays() {
  const lo = floorKcal() * 0.6, days = new Set(S.meals.map(m => m.d)); let n = 0;
  days.forEach(k => { const i = dayInfo(k); if (i.eaten >= lo && i.eaten <= targetOn(k) + i.wk + 150) n++; }); return n;
}
let MEDAL_BUSY = false, MEDAL_T = null;
function medalSoon() { if (MEDAL_BUSY || !S.onboarded) return; clearTimeout(MEDAL_T); MEDAL_T = setTimeout(medalCheck, 700); }
function medalCheck() {
  if (!S.onboarded || MEDAL_BUSY) return; S.medals = S.medals || {}; const got = [];
  MEDALS.forEach(m => { const p = m.prog(); m.tiers.forEach((t, i) => { const k = m.id + ":" + i; if (p >= t && !S.medals[k]) { S.medals[k] = Date.now(); got.push({ m, i }); } }); });
  if (!got.length) return;
  const coins = got.reduce((s, g) => s + MEDAL_COINS[g.i], 0); S.coins += coins;
  MEDAL_BUSY = true; try { save(); } finally { MEDAL_BUSY = false; }
  const top = got.slice().sort((a, b) => b.i - a.i)[0];
  toast(got.length === 1 ? `ได้เหรียญรางวัลระดับ${MEDAL_TIERS[top.i][0]}: ${top.m.n} (+${coins} เหรียญ)` : `ได้เหรียญรางวัลใหม่ ${got.length} อัน (+${coins} เหรียญ) ดูที่หน้าตัวละคร`);
  if (typeof confetti === "function") confetti(); if (typeof popCoins === "function") popCoins(coins);
  if (typeof view !== "undefined" && view === "char" && typeof renderChar === "function") renderChar();
}
function medalDot(i, icon, on, size) {
  const t = MEDAL_TIERS[i], s = size || 52;
  return `<span class="medal ${on ? "" : "off"}" style="width:${s}px;height:${s}px;${on ? `background:linear-gradient(145deg,${t[1]},${t[2]})` : ""}" role="img" aria-label="${t[0]}${on ? "" : " ยังไม่ได้"}">${ic(on ? icon : "lock", Math.round(s * 0.44))}</span>`;
}
function medalCount() { const m = S.medals || {}; return Object.keys(m).length; }
SUBS.medals = () => {
  const total = MEDALS.length * 4, have = medalCount(), got = S.medals || {};
  const cards = MEDALS.map(m => {
    const p = m.prog(), next = m.tiers.findIndex(t => p < t);
    const row = m.tiers.map((t, i) => `<div class="medalcell">${medalDot(i, m.icon, !!got[m.id + ":" + i])}<span class="xs muted">${t} ${m.unit}</span></div>`).join("");
    const prev = next > 0 ? m.tiers[next - 1] : 0, pct = next < 0 ? 100 : Math.round((p - prev) / (m.tiers[next] - prev) * 100);
    return `<div class="card"><div class="row between"><b>${m.n}</b><span class="chip soft">${p} ${m.unit}</span></div><div class="xs muted" style="margin:2px 0 10px">${m.d}</div><div class="medalrow">${row}</div>
<div class="bar" style="margin:10px 0 6px"><i style="width:${pct}%"></i></div><div class="xs muted">${next < 0 ? "ครบทุกระดับแล้ว เก่งมาก" : `ถัดไป: ระดับ${MEDAL_TIERS[next][0]} เหลืออีก ${m.tiers[next] - p} ${m.unit} · รางวัล +${MEDAL_COINS[next]} เหรียญ`}</div></div>`;
  }).join("");
  return { title: "เหรียญรางวัล", html: `<div class="card" style="text-align:center"><div class="muted sm">เหรียญรางวัลที่สะสมแล้ว</div><div class="big-num">${have}<span class="muted" style="font-size:18px"> / ${total}</span></div><div class="xs muted">ได้เองอัตโนมัติจากความสม่ำเสมอ ไม่เกี่ยวกับน้ำหนักตัว แต่ละระดับให้เหรียญเพิ่มไปใช้ในร้านค้า</div></div>${cards}` };
};
