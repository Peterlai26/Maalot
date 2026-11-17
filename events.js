/* ของจำกัดเวลาตามเทศกาล: ซื้อได้เฉพาะช่วงงาน ซื้อแล้วเป็นของเราตลอด */
const EVENTS = [
  { id: "loy", n: "ลอยกระทง", from: [11, 10], to: [12, 1] },
  { id: "ny", n: "ปีใหม่", from: [12, 20], to: [1, 10] },
  { id: "song", n: "สงกรานต์", from: [4, 8], to: [4, 20] }
];
const EV_MON = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const evById = id => EVENTS.find(e => e.id === id);
function evActive(id, now) {
  const e = evById(id); if (!e) return false; const d = now || new Date(), m = d.getMonth() + 1, day = d.getDate(), v = m * 100 + day, a = e.from[0] * 100 + e.from[1], b = e.to[0] * 100 + e.to[1];
  return a <= b ? v >= a && v <= b : v >= a || v <= b;
}
const evActiveList = () => EVENTS.filter(e => evActive(e.id));
const evRange = e => `${e.from[1]} ${EV_MON[e.from[0]]} – ${e.to[1]} ${EV_MON[e.to[0]]}`;
const evYear = () => { const d = new Date(); return d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear(); };

/* [id, ชื่อ, ราคา, เทศกาล] */
const EV_WEAR = {
  hat: [["loylotus", "มงกุฎดอกบัว", 60, "loy"], ["nytop", "หมวกทรงสูงสีทอง", 70, "ny"]],
  neck: [["marigold", "พวงมาลัยดาวเรือง", 50, "loy"]],
  hand: [["krathong", "กระทงใบตอง", 50, "loy"], ["sparkler", "ดอกไม้ไฟ", 50, "ny"], ["watergun", "ปืนฉีดน้ำ", 50, "song"]],
  face: [["nystar", "แว่นดาวทอง", 60, "ny"], ["goggles", "แว่นว่ายน้ำ", 50, "song"]],
  pt: [["hawaii", "เสื้อลายดอกสงกรานต์", 50, "song"]]
};
const EV_ROOM = {
  ceil: [["khomloi", "โคมลอย", 60, "loy"]],
  floorL: [["krabasin", "อ่างกระทง", 60, "loy"], ["nytree", "ต้นสนปีใหม่", 70, "ny"], ["waterbowl", "ขันน้ำดอกไม้", 60, "song"]],
  win: [["fireworks", "วิวพลุ", 70, "ny"]]
};
Object.keys(EV_WEAR).forEach(slot => EV_WEAR[slot].forEach(a => { WITEMS[slot].push([a[0], a[1], a[2], "ev:" + a[0]]); WINDEX[slot + "|" + a[0]] = { slot, id: a[0], n: a[1], price: a[2], code: "ev:" + a[0], medal: "", ev: a[3] }; }));
Object.keys(EV_ROOM).forEach(slot => EV_ROOM[slot].forEach(a => { RITEMS[slot].push([a[0], a[1], a[2], "ev:" + a[0]]); RINDEX[slot + "|" + a[0]] = { slot, id: a[0], n: a[1], price: a[2], code: "ev:" + a[0], medal: "", ev: a[3] }; }));
const evClosed = it => !!(it && it.ev && !evActive(it.ev));

/* ---------- งานวาดของตัวละคร ---------- */
const GOLD = "#F5C242", GOLD2 = "#D39A1E";
const EVART = {
  hat: {
    loylotus: () => { let s = ""; [-60, -30, 0, 30, 60].forEach(a => { s += `<ellipse cx="0" cy="-20" rx="9" ry="20" fill="#F9C5D6" stroke="#F29BB8" stroke-width="1.5" transform="translate(0,-48) rotate(${a})"/>`; }); return s + `<ellipse cx="0" cy="-60" rx="7" ry="9" fill="#FFF3B0"/>`; },
    nytop: () => `<ellipse cx="0" cy="-52" rx="40" ry="9" fill="#24193B"/><rect x="-24" y="-100" width="48" height="50" rx="5" fill="#24193B"/><rect x="-24" y="-68" width="48" height="9" fill="${GOLD}"/><text x="0" y="-81" text-anchor="middle" font-size="13" font-weight="700" fill="${GOLD}" font-family="sans-serif">${evYear()}</text><path d="${starPath(18, -104, 7)}" fill="${GOLD}"/>`
  },
  neck: {
    marigold: () => { let s = `<path d="M-34 -84Q0 -56 34 -84" fill="none" stroke="#6FB583" stroke-width="2"/>`; for (let i = 0; i <= 8; i++) { const t = i / 8, x = -34 + 68 * t, y = -84 + 4 * (1 - Math.pow(2 * t - 1, 2)) * -1 + 32 * (1 - Math.pow(2 * t - 1, 2)) * .5; s += `<circle cx="${x.toFixed(1)}" cy="${(-84 + 28 * (1 - Math.pow(2 * t - 1, 2))).toFixed(1)}" r="6.5" fill="${i % 2 ? "#F5A623" : "#E8861A"}"/><circle cx="${x.toFixed(1)}" cy="${(-84 + 28 * (1 - Math.pow(2 * t - 1, 2))).toFixed(1)}" r="2.4" fill="#FFD66B"/>`; } return s + `<path d="M0 -56V-44" stroke="#6FB583" stroke-width="2"/><circle cx="0" cy="-41" r="5" fill="#F29BB8"/>`; }
  },
  hand: {
    krathong: () => `<ellipse cx="2" cy="-6" rx="17" ry="7" fill="#5FA877"/><ellipse cx="2" cy="-9" rx="13" ry="5" fill="#8FD0A0"/><path d="M-9 -11Q-8 -22 -2 -14Q2 -24 6 -14Q12 -22 13 -11Z" fill="#F9C5D6" stroke="#F29BB8" stroke-width="1"/><rect x="0.5" y="-30" width="3" height="16" rx="1" fill="#FFF1B8"/><path d="M2 -40Q-2 -34 2 -30Q6 -34 2 -40Z" fill="#FFB93D"/><circle cx="-12" cy="-8" r="3.5" fill="#F5A623"/><circle cx="16" cy="-8" r="3.5" fill="#F5A623"/>`,
    sparkler: () => { let s = `<path d="M0 -2L0 -30" stroke="#9A9AA6" stroke-width="2.5" stroke-linecap="round"/>`; for (let a = 0; a < 360; a += 40) { const r = a % 80 ? 11 : 16, x = Math.sin(a * Math.PI / 180) * r, y = -38 - Math.cos(a * Math.PI / 180) * r; s += `<path d="M0 -38L${x.toFixed(1)} ${y.toFixed(1)}" stroke="${a % 80 ? "#F0679B" : GOLD}" stroke-width="2" stroke-linecap="round"/>`; } return s + `<circle cx="0" cy="-38" r="3" fill="#fff"/>`; },
    watergun: () => `<rect x="-10" y="-16" width="30" height="13" rx="6" fill="#4D9FE0"/><rect x="-6" y="-3" width="8" height="12" rx="3" fill="#3A83C0"/><rect x="2" y="-26" width="12" height="11" rx="3" fill="#8CC8E8"/><rect x="18" y="-13" width="12" height="6" rx="3" fill="${GOLD}"/><path d="M32 -10Q40 -14 46 -8M32 -10Q42 -8 48 -2" fill="none" stroke="#8CC8E8" stroke-width="2.5" stroke-linecap="round"/><circle cx="50" cy="-14" r="2" fill="#8CC8E8"/>`
  },
  face: {
    nystar: () => `<path d="${starPath(-20, 14, 18)}" fill="${GOLD}" fill-opacity=".5" stroke="${GOLD2}" stroke-width="2.5" stroke-linejoin="round"/><path d="${starPath(20, 14, 18)}" fill="${GOLD}" fill-opacity=".5" stroke="${GOLD2}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-5 12L5 12" stroke="${GOLD2}" stroke-width="2.5"/>`,
    goggles: () => `<path d="M-50 12L-36 12M36 12L50 12" stroke="#3A83C0" stroke-width="5" stroke-linecap="round"/><circle cx="-20" cy="14" r="15" fill="#BFE6F7" fill-opacity=".55" stroke="#3A83C0" stroke-width="4"/><circle cx="20" cy="14" r="15" fill="#BFE6F7" fill-opacity=".55" stroke="#3A83C0" stroke-width="4"/><path d="M-5 14L5 14" stroke="#3A83C0" stroke-width="4"/><path d="M-27 8Q-22 5 -16 8" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`
  },
  pt: {
    hawaii: (rx, oc) => { let s = `<clipPath id="tch${rx}"><ellipse cx="0" cy="-54" rx="${rx}" ry="38"/></clipPath><g clip-path="url(#tch${rx})">`; const cs = ["#fff", "#FFD66B", "#F29BB8"]; for (let y = -84, r = 0; y < -14; y += 22, r++) for (let x = -rx + (r % 2 ? 14 : 0); x < rx + 10; x += 28) { const c = cs[(r + Math.round(x / 28) + 9) % 3]; s += `<g transform="translate(${x + 6},${y})">` + [0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-4.5" rx="3.2" ry="5" fill="${c}" transform="rotate(${a})"/>`).join("") + `<circle r="2" fill="#E8861A"/></g>`; } return s + `</g>`; }
  }
};
const _wHat = wearHat; wearHat = (id, hc) => EVART.hat[id] ? EVART.hat[id](hc) : _wHat(id, hc);
const _wNeck = wearNeck; wearNeck = (id) => EVART.neck[id] ? EVART.neck[id]() : _wNeck(id);
const _wHand = wearHand; wearHand = (id) => EVART.hand[id] ? EVART.hand[id]() : _wHand(id);
const _wFace = wearFace; wearFace = (id) => EVART.face[id] ? EVART.face[id]() : _wFace(id);
const _wPt = wearPattern; wearPattern = (id, rx, oc) => EVART.pt[id] ? EVART.pt[id](rx, oc) : _wPt(id, rx, oc);

/* ---------- ของตกแต่งห้อง ---------- */
RDRAW.ceil.khomloi = () => [[176, 20, 1], [236, 34, .85], [296, 16, 1.05], [346, 38, .8]].map((l, i) => `<g transform="translate(${l[0]},${l[1]}) scale(${l[2]})"><circle r="26" fill="#FFB93D" opacity=".22"/><g class="cloud" style="animation-delay:${i * .7}s"><path d="M-11 12L-14 -8Q0 -22 14 -8L11 12Z" fill="#F5A23B"/><ellipse cx="0" cy="-6" rx="8" ry="10" fill="#FFE08A" opacity=".85"/><path d="M-11 12H11" stroke="#C9742B" stroke-width="2"/></g></g>`).join("");
RDRAW.floorL.krabasin = () => `<ellipse cx="70" cy="244" rx="52" ry="14" fill="#8E6B4F"/><ellipse cx="70" cy="240" rx="47" ry="11" fill="#8CC8E8"/><ellipse cx="70" cy="241" rx="30" ry="6" fill="#6FB1D6" opacity=".5"/><g transform="translate(62,238)"><ellipse rx="14" ry="5" fill="#5FA877"/><path d="M-8 -3Q-6 -12 0 -5Q4 -13 8 -4Z" fill="#F9C5D6"/><rect x="-1.5" y="-18" width="3" height="12" fill="#FFF1B8"/><path d="M0 -25Q-3 -20 0 -17Q3 -20 0 -25Z" fill="#FFB93D"/></g><circle cx="88" cy="238" r="3.5" fill="#F5A623"/>`;
RDRAW.floorL.nytree = () => `<rect x="64" y="236" width="12" height="14" fill="#8A5A44"/><path d="M70 150L40 196H100Z" fill="#3F8F5F"/><path d="M70 172L32 222H108Z" fill="#4FA574"/><path d="M70 196L24 244H116Z" fill="#5FB583"/><path d="${starPath(70, 146, 9)}" fill="${GOLD}"/>` + [[56, 188, "#E5534B"], [84, 204, "#4D9FE0"], [50, 224, "#F5C242"], [92, 232, "#F0679B"], [72, 218, "#fff"]].map(b => `<circle cx="${b[0]}" cy="${b[1]}" r="4.5" fill="${b[2]}"/>`).join("") + `<rect x="46" y="244" width="48" height="8" rx="3" fill="#E5534B"/>`;
RDRAW.floorL.waterbowl = () => `<path d="M26 214Q70 250 114 214Z" fill="#C9D3DE" stroke="#9AA7B5" stroke-width="2"/><ellipse cx="70" cy="214" rx="44" ry="8" fill="#8CC8E8"/><circle cx="56" cy="213" r="5" fill="#F29BB8"/><circle cx="72" cy="215" r="5" fill="#fff"/><circle cx="86" cy="212" r="4.5" fill="#FFD66B"/><rect x="52" y="236" width="36" height="8" rx="3" fill="#9AA7B5"/><path d="M52 244H88" stroke="#7C8A99" stroke-width="2"/>`;
RDRAW.win.fireworks = () => `${WINCLIP}<g clip-path="url(#wclip)"><rect x="28" y="30" width="80" height="76" fill="#1F1A45"/>` + [[52, 54, "#F0679B", 0], [86, 46, GOLD, .6], [70, 78, "#8CC8E8", 1.2]].map(f => `<g class="star" style="animation-delay:${f[3]}s">` + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M${f[0]} ${f[1]}L${(f[0] + Math.sin(a * Math.PI / 180) * 13).toFixed(1)} ${(f[1] - Math.cos(a * Math.PI / 180) * 13).toFixed(1)}" stroke="${f[2]}" stroke-width="2" stroke-linecap="round"/>`).join("") + `<circle cx="${f[0]}" cy="${f[1]}" r="2.5" fill="#fff"/></g>`).join("") + `<path d="M28 106Q46 92 62 100T108 96V106Z" fill="#14102E"/></g>`;

/* ---------- แสดงบนหน้า ---------- */
function eventHome() {
  const act = evActiveList(); if (!act.length) return "";
  const e = act[0], free = EV_WEAR_SLOTS_FOR(e.id);
  return `<div class="card evcard"><span class="evic">${ic("sparkle", 20)}</span><div class="grow"><b>กิจกรรม${esc(e.n)}</b><div class="xs muted">ของจำกัดเวลา ถึง ${e.to[1]} ${EV_MON[e.to[0]]} ซื้อแล้วเป็นของเราตลอด</div></div><button class="btn sm primary" data-act="evgo" data-id="${e.id}">ดูของ</button></div>`;
}
function EV_WEAR_SLOTS_FOR(id) { return Object.keys(EV_WEAR).filter(s => EV_WEAR[s].some(a => a[3] === id)); }
ACT.evgo = (a) => {
  const id = a.dataset.id, slot = EV_WEAR_SLOTS_FOR(id)[0];
  EDIT = null; openSub("wardrobe", {}); if (EDIT && slot) { EDIT.tab = slot; EDIT.filter = "all"; rerenderSub(); }
};
const _lockText = lockText;
lockText = (it) => {
  if (it && it.ev) { const e = evById(it.ev); return evActive(it.ev) ? `ของกิจกรรม${e.n} ซื้อได้ถึง ${e.to[1]} ${EV_MON[e.to[0]]} ด้วย ${it.price} เหรียญ` : `ของกิจกรรม${e.n} (${evRange(e)}) กลับมาอีกครั้งปีหน้า`; }
  return _lockText(it);
};
