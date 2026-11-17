/* แคตตาล็อกของแต่งตัว + งานวาด SVG ของแต่ละชิ้น
   พิกัด: หัว = ศูนย์กลางหัวที่ (0,0) ตัว = เท้าอยู่ที่ (0,0) (เหมือน figure() ใน avatar.js) */
const WTABS = [
  { id: "self", n: "ตัวตน" }, { id: "eye", n: "ดวงตา" }, { id: "brow", n: "คิ้ว" }, { id: "mouth", n: "ปาก" }, { id: "cheek", n: "แก้ม" }, { id: "hs", n: "ทรงผม" }, { id: "hc", n: "สีผม" }, { id: "oc", n: "สีเสื้อ" }, { id: "pt", n: "ลายเสื้อ" },
  { id: "hat", n: "หมวก" }, { id: "face", n: "ใบหน้า" }, { id: "neck", n: "คอ" }, { id: "hand", n: "ถือ" }, { id: "shoe", n: "รองเท้า" }, { id: "back", n: "ด้านหลัง" }
];
const SKINS = ["#FBD9BE", "#F3C9A8", "#E0AC84", "#C68B63", "#8D5A3C"];
/* รายการ: [id, ชื่อ, ราคา(0=ฟรี), โค้ดปลดล็อก(ถ้าไม่ใส่ = slot:id), เหรียญรางวัลที่ปลดล็อกให้ฟรี] */
const WITEMS = {
  eye: [["round", "ตากลม", 0], ["bean", "ตาเม็ดถั่ว", 0], ["big", "ตาโต", 0], ["happy", "ตายิ้ม", 0], ["sharp", "ตาเรียว", 30], ["droopy", "ตาง่วง", 30], ["star", "ตาประกาย", 40], ["heart", "ตาหัวใจ", 60]],
  brow: [["auto", "ตามเพศ", 0], ["none", "ไม่มีคิ้ว", 0], ["arch", "คิ้วโค้ง", 0], ["flat", "คิ้วตรง", 0], ["thick", "คิ้วหนา", 0], ["dot", "คิ้วจุด", 20], ["cool", "คิ้วเท่", 30], ["worry", "คิ้วตก", 30]],
  mouth: [["smile", "ยิ้มธรรมดา", 0], ["tiny", "ปากจิ๋ว", 0], ["grin", "ยิ้มกว้าง", 0], ["open", "ยิ้มอ้าปาก", 0], ["cat", "ปากแมว", 30], ["smirk", "ยิ้มมุมปาก", 30]],
  cheek: [["blush", "แก้มแดง", 0], ["none", "ไม่มีแก้ม", 0], ["big", "แก้มป่อง", 0], ["freckles", "กระ", 0], ["lines", "ขีดเขิน", 30], ["heart", "แก้มหัวใจ", 40]],
  hs: [["short", "ผมสั้น", 0], ["bob", "ประบ่า", 0], ["long", "ผมยาว", 0], ["buns", "จุกคู่", 0, "hs:buns"], ["ponytail", "หางม้า", 40], ["pigtails", "ผมแกละ", 40], ["curly", "ผมหยิกฟู", 50], ["messy", "ผมกระเซิง", 40], ["topknot", "มวยผม", 40]],
  hc: [["#6B4A3A", "น้ำตาล", 0], ["#2E2420", "ดำ", 0], ["#C98A4B", "น้ำตาลทอง", 0], ["#9AA0AA", "เทา", 0], ["#E8579A", "ชมพูเข้ม", 0, "hc:#E8579A"], ["#7F77DD", "ม่วง", 60, "hc:#7F77DD"],
    ["#D9A441", "บลอนด์", 40], ["#B5473A", "แดงเข้ม", 40], ["#3FA7A0", "เขียวน้ำทะเล", 60], ["#2B4A9E", "น้ำเงิน", 50], ["#F2F0EA", "ขาว", 60], ["#F4A6C0", "ชมพูพาสเทล", 60], ["#8CC79A", "เขียวมิ้นต์", 60], ["#F08A3C", "ส้ม", 50]],
  oc: [["#F4A58A", "พีช", 0], ["#8CC79A", "เขียวอ่อน", 0], ["#8CC8E8", "ฟ้า", 0], ["#F7D58A", "เหลือง", 0], ["#B7A8F0", "ลาเวนเดอร์", 0, "oc:#B7A8F0"], ["#F0B84A", "ทอง", 80, "oc:#F0B84A"],
    ["#E86A6A", "แดง", 40], ["#FFFFFF", "ขาว", 40], ["#3B3F4A", "ดำ", 40], ["#3FA7A0", "เขียวน้ำทะเล", 40], ["#F08A3C", "ส้ม", 40], ["#F4A6C0", "ชมพู", 40], ["#2B4A9E", "กรมท่า", 40], ["#C9A0DC", "ม่วงอ่อน", 40]],
  pt: [["none", "เรียบ", 0], ["stripes", "ลายขวาง", 30], ["vstripes", "ลายตั้ง", 30], ["dots", "ลายจุด", 30], ["hearts", "หัวใจ", 40], ["stars", "ดาว", 40], ["checks", "ตารางหมากรุก", 40]],
  hat: [["none", "ไม่ใส่", 0], ["beanie", "บีนนี่", 50, "acc:beanie"], ["cap", "หมวกแก๊ปแดง", 40, "hat:cap"], ["capb", "หมวกแก๊ปฟ้า", 40, "hat:capb"], ["bucket", "หมวกบักเก็ต", 50], ["bow", "โบว์", 40], ["ears", "หูแมว", 60], ["flowers", "มงกุฎดอกไม้", 70], ["party", "หมวกปาร์ตี้", 50], ["chef", "หมวกเชฟ", 50], ["straw", "หมวกฟาง", 60], ["phones", "หูฟัง", 70], ["crown", "มงกุฎทอง", 0, "hat:crown", "streak:2"], ["halo", "วงแหวนนางฟ้า", 0, "hat:halo", "mood:1"]],
  face: [["none", "ไม่ใส่", 0], ["glasses", "แว่นกลม", 40, "acc:glasses"], ["square", "แว่นเหลี่ยม", 40], ["sun", "แว่นกันแดด", 50], ["heart", "แว่นหัวใจ", 60], ["star", "แว่นดาว", 60], ["plaster", "พลาสเตอร์", 30], ["freckles", "กระ", 30], ["blush", "แก้มหัวใจ", 30], ["mustache", "หนวด", 40]],
  neck: [["none", "ไม่ใส่", 0], ["scarf", "ผ้าพันคอแดง", 50, "neck:scarf"], ["scarfb", "ผ้าพันคอฟ้า", 50], ["bowtie", "หูกระต่าย", 40], ["tie", "เนคไท", 40], ["pearls", "สร้อยมุก", 60], ["bandana", "ผ้าบันดานา", 40], ["lei", "พวงมาลัยดอกไม้", 60], ["bell", "ปลอกคอกระดิ่ง", 40]],
  hand: [["none", "มือเปล่า", 0], ["balloon", "ลูกโป่งแดง", 40], ["balloonb", "ลูกโป่งฟ้า", 40], ["flower", "ดอกไม้", 30], ["icecream", "ไอศกรีม", 40], ["book", "หนังสือ", 30], ["tea", "ชานมไข่มุก", 50], ["lolly", "อมยิ้ม", 30], ["wand", "ไม้กายสิทธิ์", 70], ["gift", "กล่องของขวัญ", 50]],
  shoe: [["white", "รองเท้าผ้าใบขาว", 0], ["red", "สีแดง", 30], ["blue", "สีฟ้า", 30], ["pink", "สีชมพู", 30], ["black", "บูตดำ", 50], ["rain", "รองเท้าบูตเหลือง", 50], ["rainbow", "รองเท้าสายรุ้ง", 80], ["gold", "รองเท้าทอง", 0, "shoe:gold", "work:3"]],
  back: [["none", "ไม่มี", 0], ["bag", "เป้สะพายหลัง", 60], ["cape", "ผ้าคลุมแดง", 70], ["capeb", "ผ้าคลุมน้ำเงิน", 70], ["bfly", "ปีกผีเสื้อ", 90], ["wings", "ปีกนางฟ้า", 0, "back:wings", "log:2"]]
};
const WINDEX = {}; Object.keys(WITEMS).forEach(slot => WITEMS[slot].forEach(a => { const code = a[3] || (a[2] === 0 ? "" : slot + ":" + a[0]); WINDEX[slot + "|" + a[0]] = { slot, id: a[0], n: a[1], price: a[2], code: a[2] === 0 && !a[3] ? "" : code, medal: a[4] || "" }; }));
const SLOT_DEFAULT = { eye: "round", brow: "auto", mouth: "smile", cheek: "blush", hs: "bob", hc: "#6B4A3A", oc: "#F4A58A", pt: "none", hat: "none", face: "none", neck: "none", hand: "none", shoe: "white", back: "none" };
const LOCKHINT = { "hc:#E8579A": "ปลดล็อกจากภารกิจ: บันทึกอาหารครบ 7 วัน", "oc:#B7A8F0": "ปลดล็อกจากภารกิจ: ออกกำลังกายครบ 10 ครั้ง", "hs:buns": "ปลดล็อกจากภารกิจ: บันทึกมื้อเช้าครบ 5 วัน" };
function itemOfCode(code) { for (const k in WINDEX) if (WINDEX[k].code === code) return WINDEX[k]; return null; }
function medalCodeOf(code) { const w = itemOfCode(code); if (w && w.medal) return w.medal; return (typeof ROOM_CODE_MEDAL !== "undefined" && ROOM_CODE_MEDAL[code]) || ""; }
function itemFree(code) { const m = medalCodeOf(code); return !!(m && S.medals && S.medals[m]); }

/* ---------- ตัวช่วย ---------- */
function shade(hex, f) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return hex; const n = parseInt(m[1], 16), c = x => Math.max(0, Math.min(255, Math.round(x * (1 + f))));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c).map(v => v.toString(16).padStart(2, "0")).join("");
}
function normLook(L) {
  L = Object.assign({}, L || {});
  if (L.acc === "glasses" && !L.face) L.face = "glasses"; if (L.acc === "beanie" && !L.hat) L.hat = "beanie"; delete L.acc;
  Object.keys(SLOT_DEFAULT).forEach(k => { if (!L[k]) L[k] = SLOT_DEFAULT[k]; }); return L;
}
const heartPath = (cx, cy, s) => `M${cx} ${cy + s * 0.95}C${cx - s * 1.7} ${cy - s * 0.1} ${cx - s * 0.8} ${cy - s * 1.2} ${cx} ${cy - s * 0.35}C${cx + s * 0.8} ${cy - s * 1.2} ${cx + s * 1.7} ${cy - s * 0.1} ${cx} ${cy + s * 0.95}Z`;
const starPath = (cx, cy, r) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? "L" : "M") + (cx + Math.cos(a) * rr).toFixed(1) + " " + (cy + Math.sin(a) * rr).toFixed(1); } return d + "Z"; };
const INK2 = "#3B2A24";

/* ---------- หมวก (พิกัดหัว) ---------- */
function wearHat(id, hc) {
  switch (id) {
    case "beanie": return `<path d="M-54 -10 C-58 -70 58 -70 54 -10 Z" fill="#E57373"/><rect x="-57" y="-16" width="114" height="13" rx="6" fill="#C75B5B"/><circle cx="0" cy="-66" r="8" fill="#F4E3E3"/>`;
    case "cap": case "capb": { const c = id === "cap" ? "#E5534B" : "#4D7FD1", d = shade(c, -0.18); return `<path d="M-52 -8C-56 -70 56 -70 52 -8Z" fill="${c}"/><path d="M-2 -12C22 -22 56 -20 72 -6C56 -9 22 -6 -2 -2Z" fill="${d}"/><circle cx="0" cy="-60" r="4.5" fill="${d}"/><path d="M0 -58V-14" stroke="${d}" stroke-width="2" opacity=".5"/>`; }
    case "bucket": return `<ellipse cx="0" cy="-14" rx="68" ry="15" fill="#9DB7E8"/><path d="M-42 -16C-44 -64 44 -64 42 -16Z" fill="#B8CCF2"/><rect x="-43" y="-27" width="86" height="9" fill="#6F8FD0"/>`;
    case "bow": return `<g transform="translate(36,-48) rotate(18)"><path d="M0 0L-26 -15L-26 15ZM0 0L26 -15L26 15Z" fill="#F29BB8"/><circle r="6.5" fill="#D97098"/></g>`;
    case "ears": return `<path d="M-54 -20L-50 -80L-14 -54Z" fill="${hc}"/><path d="M-46 -34L-44 -66L-26 -52Z" fill="#F4A0B0"/><path d="M54 -20L50 -80L14 -54Z" fill="${hc}"/><path d="M46 -34L44 -66L26 -52Z" fill="#F4A0B0"/>`;
    case "flowers": { let s = '<path d="M-52 -18C-40 -62 40 -62 52 -18" fill="none" stroke="#6FB583" stroke-width="7" stroke-linecap="round"/>'; const cs = ["#F29BB8", "#FFE08A", "#FFFFFF", "#B7A8F0", "#F4A58A"]; for (let i = 0; i < 7; i++) { const x = -46 + i * 15.3, y = -26 - Math.sin(i / 6 * Math.PI) * 28; s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5" fill="${cs[i % 5]}"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="#F5C242"/>`; } return s; }
    case "party": return `<g transform="translate(16,-54) rotate(14)"><path d="M-22 0L0 -62L22 0Z" fill="#8D78D8"/><path d="M-15 -18L15 -18L11 -30L-11 -30Z" fill="#F5C242" opacity=".9"/><path d="M-9 -42L9 -42L5 -52L-5 -52Z" fill="#F29BB8"/><circle cx="0" cy="-64" r="7" fill="#FFE08A"/></g>`;
    case "chef": return `<circle cx="-24" cy="-60" r="19" fill="#fff" stroke="#E6E1D8" stroke-width="2"/><circle cx="0" cy="-70" r="22" fill="#fff" stroke="#E6E1D8" stroke-width="2"/><circle cx="24" cy="-60" r="19" fill="#fff" stroke="#E6E1D8" stroke-width="2"/><rect x="-38" y="-52" width="76" height="30" rx="6" fill="#fff" stroke="#E6E1D8" stroke-width="2"/>`;
    case "straw": return `<ellipse cx="0" cy="-16" rx="80" ry="16" fill="#E8C58A"/><path d="M-40 -18C-42 -66 42 -66 40 -18Z" fill="#F2D6A0"/><rect x="-41" y="-30" width="82" height="9" fill="#E5534B"/>`;
    case "phones": return `<path d="M-55 -2C-55 -78 55 -78 55 -2" fill="none" stroke="#4A4A5A" stroke-width="8" stroke-linecap="round"/><ellipse cx="-57" cy="12" rx="11" ry="17" fill="#E5534B"/><ellipse cx="57" cy="12" rx="11" ry="17" fill="#E5534B"/><ellipse cx="-57" cy="12" rx="5" ry="9" fill="#C7403A"/><ellipse cx="57" cy="12" rx="5" ry="9" fill="#C7403A"/>`;
    case "crown": return `<path d="M-32 -44L-34 -80L-16 -62L0 -88L16 -62L34 -80L32 -44Z" fill="#F5C242" stroke="#D39A1E" stroke-width="3" stroke-linejoin="round"/><circle cx="0" cy="-70" r="4.5" fill="#E5534B"/><circle cx="-20" cy="-58" r="3.5" fill="#4D7FD1"/><circle cx="20" cy="-58" r="3.5" fill="#4D7FD1"/><rect x="-33" y="-47" width="66" height="7" rx="3" fill="#E8B33A"/>`;
    case "halo": return `<ellipse cx="0" cy="-74" rx="34" ry="9" fill="none" stroke="#FFD66B" stroke-width="7"/><ellipse cx="0" cy="-74" rx="34" ry="9" fill="none" stroke="#FFF1B8" stroke-width="2.5"/>`;
  } return "";
}
/* ---------- ใบหน้า (พิกัดหัว ตาอยู่ y=14) ---------- */
function wearFace(id) {
  switch (id) {
    case "glasses": return `<circle cx="-20" cy="14" r="14" fill="none" stroke="${INK2}" stroke-width="2.5"/><circle cx="20" cy="14" r="14" fill="none" stroke="${INK2}" stroke-width="2.5"/><path d="M-6 14L6 14" stroke="${INK2}" stroke-width="2.5"/>`;
    case "square": return `<rect x="-38" y="3" width="32" height="24" rx="7" fill="none" stroke="#4D7FD1" stroke-width="3"/><rect x="6" y="3" width="32" height="24" rx="7" fill="none" stroke="#4D7FD1" stroke-width="3"/><path d="M-6 12L6 12" stroke="#4D7FD1" stroke-width="3"/>`;
    case "sun": return `<rect x="-38" y="4" width="32" height="22" rx="9" fill="#2E2A33"/><rect x="6" y="4" width="32" height="22" rx="9" fill="#2E2A33"/><path d="M-6 11L6 11" stroke="#2E2A33" stroke-width="3"/><path d="M-32 9L-22 9M12 9L22 9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>`;
    case "heart": return `<path d="${heartPath(-21, 14, 13)}" fill="#F29BB8" fill-opacity=".7" stroke="#D97098" stroke-width="3" stroke-linejoin="round"/><path d="${heartPath(21, 14, 13)}" fill="#F29BB8" fill-opacity=".7" stroke="#D97098" stroke-width="3" stroke-linejoin="round"/><path d="M-9 8L9 8" stroke="#D97098" stroke-width="2.5"/>`;
    case "star": return `<path d="${starPath(-21, 14, 17)}" fill="#FFE08A" fill-opacity=".8" stroke="#E8B33A" stroke-width="3" stroke-linejoin="round"/><path d="${starPath(21, 14, 17)}" fill="#FFE08A" fill-opacity=".8" stroke="#E8B33A" stroke-width="3" stroke-linejoin="round"/><path d="M-6 12L6 12" stroke="#E8B33A" stroke-width="2.5"/>`;
    case "plaster": return `<g transform="translate(31,25) rotate(-28)"><rect x="-14" y="-5.5" width="28" height="11" rx="5" fill="#F6D3B3" stroke="#D9AE8A" stroke-width="1.5"/><rect x="-5" y="-5.5" width="10" height="11" fill="#E8B98F"/></g>`;
    case "freckles": return [[-40, 24], [-33, 28], [-26, 24], [26, 24], [33, 28], [40, 24], [-34, 21], [34, 21]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="1.8" fill="#A9674A"/>`).join("");
    case "blush": return `<path d="${heartPath(-35, 30, 5.5)}" fill="#F2819E"/><path d="${heartPath(35, 30, 5.5)}" fill="#F2819E"/>`;
    case "mustache": return `<path d="M-24 28Q-12 18 0 27Q12 18 24 28Q12 37 0 31Q-12 37 -24 28Z" fill="#5A3A2A"/>`;
  } return "";
}
/* ---------- คอ (พิกัดตัว วาดหลังหัว คางอยู่ที่ y≈-80) ---------- */
function wearNeck(id) {
  switch (id) {
    case "scarf": case "scarfb": { const c = id === "scarf" ? "#E5534B" : "#4D7FD1", d = shade(c, -0.2); return `<path d="M-36 -86Q0 -62 36 -86L38 -73Q0 -48 -38 -73Z" fill="${c}"/><path d="M14 -64L32 -30L16 -26L6 -58Z" fill="${c}"/><path d="M12 -44L28 -38M10 -36L25 -31" stroke="${d}" stroke-width="3" opacity=".7"/>`; }
    case "bowtie": return `<path d="M0 -75L-20 -88L-20 -62ZM0 -75L20 -88L20 -62Z" fill="#E5534B"/><circle cx="0" cy="-75" r="5" fill="#C7403A"/>`;
    case "tie": return `<path d="M-6 -80L6 -80L9 -72L-9 -72Z" fill="#2B4A9E"/><path d="M-9 -72L9 -72L12 -34L0 -24L-12 -34Z" fill="#3A5DBE"/>`;
    case "pearls": { let s = ""; for (let i = 0; i < 9; i++) { const x = -34 + i * 8.5; s += `<circle cx="${x.toFixed(1)}" cy="${(-82 + Math.pow(x / 34, 2) * 14).toFixed(1)}" r="5" fill="#FFF8F0" stroke="#D8CFC4" stroke-width="1.2"/>`; } return s; }
    case "bandana": return `<path d="M-38 -86L38 -86L0 -46Z" fill="#E5534B"/><path d="M-38 -86L38 -86L34 -80L-34 -80Z" fill="#C7403A"/>` + [[-12, -76], [8, -74], [-2, -62], [16, -82], [-20, -84]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="#fff"/>`).join("");
    case "lei": { const cs = ["#F29BB8", "#FFE08A", "#B7A8F0", "#F4A58A", "#fff"]; let s = ""; for (let i = 0; i < 9; i++) { const x = -38 + i * 9.5; s += `<circle cx="${x.toFixed(1)}" cy="${(-80 + Math.pow(x / 38, 2) * 22).toFixed(1)}" r="7.5" fill="${cs[i % 5]}"/><circle cx="${x.toFixed(1)}" cy="${(-80 + Math.pow(x / 38, 2) * 22).toFixed(1)}" r="2.4" fill="#F5C242"/>`; } return s; }
    case "bell": return `<path d="M-32 -82Q0 -64 32 -82L33 -75Q0 -56 -33 -75Z" fill="#E5534B"/><circle cx="0" cy="-64" r="8" fill="#F5C242" stroke="#D39A1E" stroke-width="2"/><path d="M-5 -62H5" stroke="#D39A1E" stroke-width="2"/><circle cx="0" cy="-60" r="2" fill="#D39A1E"/>`;
  } return "";
}
/* ---------- ของที่ถือ (พิกัด: ศูนย์กลางมือ = 0,0; อยู่ในกลุ่มแขนขวา ขยับตามตอนโบกมือ) ---------- */
function wearHand(id) {
  switch (id) {
    case "balloon": case "balloonb": { const c = id === "balloon" ? "#E5534B" : "#4D9FE0"; return `<path d="M0 -6Q-6 -16 2 -26" fill="none" stroke="#9A9AA6" stroke-width="1.6"/><ellipse cx="2" cy="-40" rx="12.5" ry="15" fill="${c}"/><ellipse cx="-3" cy="-45" rx="3.4" ry="5" fill="#fff" opacity=".5"/><path d="M2 -25L-1 -21L5 -21Z" fill="${shade(c, -0.2)}"/>`; }
    case "flower": return `<path d="M0 -4L2 -30" stroke="#4FA574" stroke-width="3" stroke-linecap="round"/><path d="M1 -14Q12 -18 14 -10Q6 -8 1 -14Z" fill="#6FB583"/>` + [0, 72, 144, 216, 288].map(a => `<ellipse cx="2" cy="-40" rx="5" ry="7.5" fill="#F29BB8" transform="rotate(${a} 2 -34)"/>`).join("") + `<circle cx="2" cy="-34" r="4.5" fill="#FFD66B"/>`;
    case "icecream": return `<path d="M-6.5 -2L0 24L6.5 -2Z" fill="#E8B77A"/><path d="M-4 3L4 3M-3 9L3 9M-2 15L2 15" stroke="#C9955A" stroke-width="1.5"/><circle cx="0" cy="-8" r="10" fill="#F9B8CE"/><circle cx="1" cy="-20" r="9" fill="#FFF3D6"/><circle cx="2" cy="-30" r="3.4" fill="#E5534B"/>`;
    case "book": return `<rect x="-9" y="-30" width="24" height="30" rx="3" fill="#4D7FD1"/><rect x="-6" y="-27" width="3" height="24" fill="#3B66AD"/><rect x="2" y="-22" width="9" height="3" rx="1.5" fill="#fff" opacity=".85"/><rect x="2" y="-15" width="9" height="3" rx="1.5" fill="#fff" opacity=".85"/>`;
    case "tea": return `<path d="M-10 -38L10 -38L7 2L-7 2Z" fill="#F2E3CF" stroke="#D7C3A8" stroke-width="1.5"/><path d="M-9 -38L9 -38L9 -33L-9 -33Z" fill="#E8D5BC"/><path d="M2 -38L6 -56" stroke="#E5534B" stroke-width="3" stroke-linecap="round"/>` + [[-4, -2], [2, -4], [-1, 1], [4, 0], [-5, -6]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.3" fill="#3B2A24"/>`).join("");
    case "lolly": return `<path d="M0 -4L0 -30" stroke="#E6E1D8" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-42" r="12" fill="#F29BB8"/><path d="M0 -42m-7 0a7 7 0 1 1 14 0a4 4 0 1 1 -8 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`;
    case "wand": return `<path d="M-3 6L9 -32" stroke="#8D6A4A" stroke-width="3.4" stroke-linecap="round"/><path d="${starPath(10, -40, 11)}" fill="#FFD66B" stroke="#E8B33A" stroke-width="1.6" stroke-linejoin="round"/><circle cx="20" cy="-48" r="1.8" fill="#FFF1B8"/><circle cx="-2" cy="-46" r="1.5" fill="#FFF1B8"/>`;
    case "gift": return `<rect x="-12" y="-22" width="26" height="22" rx="3" fill="#E5534B"/><rect x="-12" y="-22" width="26" height="7" rx="3" fill="#C7403A"/><rect x="-1" y="-22" width="4" height="22" fill="#FFE08A"/><path d="M1 -22Q-8 -34 -3 -30M1 -22Q10 -34 5 -30" fill="none" stroke="#FFE08A" stroke-width="3" stroke-linecap="round"/>`;
  } return "";
}
/* ---------- รองเท้า ---------- */
function wearShoes(id, lw) {
  const col = { white: "#FFFFFF", red: "#E5534B", blue: "#4D7FD1", pink: "#F29BB8", black: "#3B3F4A", rain: "#F5C242", gold: "#F5C242" }[id] || "#FFFFFF", boot = id === "black" || id === "rain";
  const lx = [-19 - (lw - 14) / 2, 5 - (lw - 14) / 2];
  let s = boot ? lx.map(x => `<rect x="${x}" y="-24" width="${lw}" height="20" rx="5" fill="${col}"/><rect x="${x}" y="-24" width="${lw}" height="5" rx="2" fill="${shade(col, -0.18)}"/>`).join("") : "";
  const fill = id === "rainbow" ? "url(#rbshoe)" : col;
  const def = id === "rainbow" ? `<defs><linearGradient id="rbshoe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F29BB8"/><stop offset=".35" stop-color="#FFE08A"/><stop offset=".7" stop-color="#8CC79A"/><stop offset="1" stop-color="#8CC8E8"/></linearGradient></defs>` : "";
  s += def + `<ellipse cx="-13" cy="-4" rx="16" ry="8" fill="${fill}"/><ellipse cx="13" cy="-4" rx="16" ry="8" fill="${fill}"/>`;
  if (id === "white" || id === "red" || id === "blue" || id === "pink" || id === "gold") s += `<path d="M-24 -2H-4M2 -2H22" stroke="${shade(col, -0.25)}" stroke-width="1.6" opacity=".55"/>`;
  if (id === "gold") s += `<circle cx="-18" cy="-8" r="1.6" fill="#fff"/><circle cx="9" cy="-8" r="1.6" fill="#fff"/>`;
  return s;
}
/* ---------- ด้านหลัง (วาดก่อนตัว) ---------- */
function wearBack(id, rx) {
  const mir = (d, extra) => `<g>${d}</g><g transform="scale(-1,1)">${d}</g>`;
  switch (id) {
    case "wings": return mir(`<path d="M-26 -80C-98 -132 -128 -62 -54 -32C-64 -50 -40 -58 -26 -50Z" fill="#fff" stroke="#D9E3F2" stroke-width="3" stroke-linejoin="round"/><path d="M-50 -74C-82 -94 -98 -76 -76 -58M-44 -60C-70 -66 -82 -52 -64 -42" fill="none" stroke="#D9E3F2" stroke-width="2.4" stroke-linecap="round"/>`);
    case "bfly": return mir(`<path d="M-24 -82C-92 -144 -134 -84 -40 -54Z" fill="#F29BB8"/><path d="M-34 -50C-86 -36 -92 -2 -46 -22Z" fill="#B7A8F0"/><circle cx="-76" cy="-92" r="7" fill="#fff" opacity=".7"/><circle cx="-66" cy="-34" r="5" fill="#fff" opacity=".7"/><path d="M-24 -82C-92 -144 -134 -84 -40 -54Z" fill="none" stroke="#D97098" stroke-width="2.5"/>`);
    case "bag": return `<rect x="-${rx + 12}" y="-100" width="${(rx + 12) * 2}" height="72" rx="22" fill="#6FB583"/><rect x="-${rx + 6}" y="-60" width="${(rx + 6) * 2}" height="26" rx="10" fill="#5AA070"/>`;
    case "cape": case "capeb": { const c = id === "cape" ? "#E5534B" : "#2B4A9E"; return `<path d="M-38 -88L38 -88L${rx + 34} -6L-${rx + 34} -6Z" fill="${c}"/><path d="M-${rx + 34} -6L${rx + 34} -6L${rx + 30} -2L-${rx + 30} -2Z" fill="${shade(c, -0.25)}"/><path d="M-20 -86L-${rx + 10} -12M20 -86L${rx + 10} -12" stroke="${shade(c, -0.25)}" stroke-width="2.5" opacity=".5"/>`; }
  } return "";
}
function wearBackFront(id, rx) { /* สายเป้ที่พาดหน้าอก */
  if (id === "bag") return `<path d="M-22 -90L-16 -40M22 -90L16 -40" stroke="#4A8A60" stroke-width="7" stroke-linecap="round" fill="none"/>`; return "";
}
/* ---------- ลายเสื้อ (ตัดด้วยรูปทรงลำตัว) ---------- */
function wearPattern(id, rx, oc) {
  if (!id || id === "none") return "";
  const dark = shade(oc, -0.16), light = shade(oc, 0.28), W = rx * 2 + 4; let s = "";
  const clip = `<clipPath id="tc${rx}"><ellipse cx="0" cy="-54" rx="${rx}" ry="38"/></clipPath>`;
  if (id === "stripes") for (let y = -90; y < -16; y += 14) s += `<rect x="${-rx}" y="${y}" width="${W}" height="6.5" fill="${dark}" opacity=".75"/>`;
  else if (id === "vstripes") for (let x = -rx; x < rx; x += 14) s += `<rect x="${x}" y="-94" width="6.5" height="80" fill="${light}" opacity=".85"/>`;
  else if (id === "dots") for (let y = -84, r = 0; y < -14; y += 15, r++) for (let x = -rx + (r % 2 ? 7 : 0); x < rx; x += 15) s += `<circle cx="${x + 5}" cy="${y}" r="3.4" fill="#fff" opacity=".85"/>`;
  else if (id === "hearts") for (let y = -80, r = 0; y < -14; y += 20, r++) for (let x = -rx + (r % 2 ? 10 : 0); x < rx; x += 20) s += `<path d="${heartPath(x + 8, y, 4.2)}" fill="#fff" opacity=".85"/>`;
  else if (id === "stars") for (let y = -80, r = 0; y < -14; y += 20, r++) for (let x = -rx + (r % 2 ? 10 : 0); x < rx; x += 20) s += `<path d="${starPath(x + 8, y, 6)}" fill="#FFE08A" opacity=".95"/>`;
  else if (id === "checks") for (let y = -94, r = 0; y < -14; y += 12, r++) for (let x = -rx - 12 + (r % 2 ? 12 : 0); x < rx; x += 24) s += `<rect x="${x}" y="${y}" width="12" height="12" fill="${dark}" opacity=".6"/>`;
  return `<defs>${clip}</defs><g clip-path="url(#tc${rx})">${s}</g>`;
}
