/* ระบบโหมดกลางของ Maalot
   โหมดใหม่ในอนาคตลงทะเบียนที่ MODES ที่เดียว ได้ครบ: ช่องในหน้า "ทุกโหมด" (มีตัวกรองหมวดและค้นหา) หัวหน้าโหมดที่มีอนิเมชัน
   และถ้าใส่ tabs จะรวมหลายหน้าเป็นหน้าเดียวแบบแท็บให้เอง (หน้าเดิมแต่ละหน้ายังเปิดตรงๆ ได้ ลิงก์เก่าไม่พัง)
   ฟิลด์: cat หมวด · icon · title · sub คำอธิบายสั้น · name ชื่อหน้า · arg · tone amber/green/blue/rose/violet · kw คำค้นหา
          tabs [{k, label, sub: ชื่อหน้าเดิม}] · lock [k ของแท็บที่ล็อกตอนงด IF] · featured โหมดเด่น (ช่องใหญ่ด้านบน) · live() ข้อความสด
          quick ซ้ำกับแถวทางลัดด้านบน (ซ่อนจากรายการ ยกเว้นตอนค้นหา) · nohero ไม่ต้องใส่หัว (หน้ามีดีไซน์เอง) · soon เร็วๆ นี้ */
const MODES = [
  { cat: "บันทึก", icon: "bowl", title: "กินอะไรมา", sub: "พิมพ์หรือถ่ายรูป", name: "log", arg: "food", tone: "amber", kw: "อาหาร กิน แคลอรี่ รูป", quick: true, nohero: true },
  { cat: "บันทึก", icon: "heart", title: "มื้อประจำและอาหารของฉัน", sub: "จดทั้งมื้อในแตะเดียว", name: "myeat", tone: "amber", kw: "มื้อประจำ ชุด บ่อย ของฉัน ขนม ซอง ฉลาก",
    tabs: [{ k: "combos", label: "มื้อประจำ", sub: "combos" }, { k: "myfoods", label: "อาหารของฉัน", sub: "myfoods" }] },
  { cat: "บันทึก", icon: "scale", title: "น้ำหนักและรอบเอว", sub: "ใส่ตัวเลข ดูแนวโน้ม", name: "body", tone: "amber", kw: "น้ำหนัก ชั่ง เอว วัด",
    tabs: [{ k: "weight", label: "ชั่งน้ำหนัก", sub: "weight" }, { k: "waist", label: "รอบเอว", sub: "waist" }] },
  { cat: "บันทึก", icon: "droplet", title: "น้ำและการนอน", sub: "แตะบันทึกเร็ว", name: "water", tone: "amber", kw: "น้ำ นอน หลับ", quick: true },
  { cat: "ออกกำลังกาย", icon: "dumbbell", title: "โปรแกรมออกกำลังกาย", sub: "แผน คลังท่า GPS สถิติ ในที่เดียว", name: "fit", tone: "amber", quick: true, nohero: true,
    kw: "ออกกำลัง ท่า เซ็ต วิ่ง ปั่น เดิน gps สถิติ กล้ามเนื้อ โปรแกรม ฟื้นตัว ออกกำลังด้วยกัน คลังท่า ตัวอย่าง" },
  { cat: "ช่วยตัดสินใจ", icon: "dice", title: "กินอะไรดี", sub: "สุ่มเมนู · ตู้เย็น · แผนสัปดาห์", name: "eat", tone: "green", kw: "สุ่ม เมนู กินอะไร ตู้เย็น วัตถุดิบ ทำอาหาร แผน มื้อ ซื้อของ สัปดาห์", lock: ["pick", "fridge"],
    tabs: [{ k: "pick", label: "สุ่มเมนู", sub: "pick" }, { k: "fridge", label: "ตู้เย็น", sub: "fridge" }, { k: "plan", label: "แผนสัปดาห์", sub: "plan" }] },
  { cat: "ช่วยตัดสินใจ", icon: "moon", title: "โหมดรับมือ", sub: "หิวดึก · วันหลุดงานเลี้ยง", name: "crave", tone: "green", kw: "หิว ดึก กลางคืน อยากกิน งานเลี้ยง วันหลุด บุฟเฟ่ต์ ปาร์ตี้",
    tabs: [{ k: "night", label: "หิวดึก", sub: "night" }, { k: "cheat", label: "วันหลุด", sub: "cheat" }] },
  { cat: "วินัย", icon: "timer", title: "โหมด IF", sub: "ตั้งวินัยช่วงเวลากิน", name: "iff", tone: "violet", kw: "IF วินัย อด งด ช่วงเวลา ล็อก", featured: true, nohero: true,
    live() {
      const st = typeof iffState === "function" ? iffState() : null;
      if (!st) return { line: "ตั้งช่วงเวลากิน สร้างนิสัยกินเป็นเวลา ให้น้องช่วยจับเวลา", cta: "เริ่มตั้งค่า", pct: 0 };
      const f = st.f;
      if (st.paused) return { line: "วันนี้พักโหมด IF กินได้ตามสบาย", cta: "ดูโหมด", pct: 100 };
      if (st.eating) return { line: "ช่วงกินเปิดอยู่ · เหลือ " + dur(st.left), cta: "ดูโหมด", pct: Math.round((1 - st.left / (f.eat * 60)) * 100) };
      const need = 24 - f.eat, fasted = typeof iffFastedNow === "function" ? iffFastedNow(st) : 0;
      return { line: "กำลังงด · อีก " + dur(st.left) + " ถึงช่วงกิน", cta: "ดูโหมด", pct: fasted === null ? 0 : Math.min(100, Math.round(fasted / need * 100)) };
    } },
  { cat: "ดูความคืบหน้า", icon: "chart", title: "กราฟย้อนหลัง", sub: "น้ำหนัก แคล เซ็ต", name: "charts", tone: "blue", kw: "กราฟ สถิติ", nohero: true },
  { cat: "ดูความคืบหน้า", icon: "chart", title: "โภชนาการละเอียด", sub: "โปรตีน คาร์บ ไขมัน", name: "nutri", tone: "blue", kw: "โภชนาการ โปรตีน คาร์บ ไขมัน น้ำตาล โซเดียม" },
  { cat: "ดูความคืบหน้า", icon: "target", title: "เป้าหมายและรางวัล", sub: "เป้า ภารกิจ เหรียญรางวัล", name: "rewards", tone: "blue", kw: "เป้าหมาย สัปดาห์ เหรียญ ภารกิจ ปลดล็อก รางวัล ความสำเร็จ ถ้วย",
    tabs: [{ k: "goals", label: "เป้าหมาย", sub: "goals" }, { k: "missions", label: "ภารกิจ", sub: "missions" }, { k: "medals", label: "เหรียญ", sub: "medals" }] },
  { cat: "ดูความคืบหน้า", icon: "mail", title: "สรุปและแชร์", sub: "จดหมายสัปดาห์ · การ์ดความคืบหน้า", name: "recap", tone: "blue", kw: "จดหมาย สรุป สัปดาห์ แชร์ การ์ด รูป ไลน์ อินสตาแกรม ส่งต่อ",
    tabs: [{ k: "letter", label: "จดหมายสัปดาห์", sub: "letter" }, { k: "share", label: "แชร์การ์ด", sub: "share" }] },
  { cat: "ดูความคืบหน้า", icon: "heart", title: "บันทึกอารมณ์", sub: "วันนี้รู้สึกยังไง", name: "mood", tone: "rose", kw: "อารมณ์ ความรู้สึก ใจ เครียด เศร้า ดี สดใส" },
  { cat: "ตัวละครของฉัน", icon: "home", title: "ตกแต่งห้อง", sub: "ของแต่ง สัตว์เลี้ยง", name: "room", tone: "rose", kw: "ห้อง ตกแต่ง เฟอร์นิเจอร์ สัตว์เลี้ยง วอลเปเปอร์ พรม", nohero: true },
  { cat: "ตัวละครของฉัน", icon: "hanger", title: "แต่งตัว", sub: "เปลี่ยนได้ทุกเมื่อ", name: "wardrobe", tone: "rose", kw: "แต่งตัว เสื้อ ผม", nohero: true },
  { cat: "ตัวละครของฉัน", icon: "bag", title: "ร้านค้า", sub: "ใช้เหรียญซื้อ", name: "shop", tone: "rose", kw: "ร้าน ซื้อ เหรียญ", nohero: true },
  { cat: "ตัวละครของฉัน", icon: "users", title: "เพื่อนช่วยกัน", sub: "เร็วๆ นี้", name: "", tone: "rose", kw: "เพื่อน", soon: true },
  { cat: "อื่นๆ", icon: "settings", title: "ตั้งค่าและข้อมูล", sub: "เป้าหมาย สำรองข้อมูล", name: "settings", tone: "violet", kw: "ตั้งค่า สำรอง ข้อมูล รีเซ็ต บัญชี", nohero: true }
];
const MODE_TONE = { "บันทึก": "amber", "ออกกำลังกาย": "amber", "ช่วยตัดสินใจ": "green", "วินัย": "violet", "ดูความคืบหน้า": "blue", "ตัวละครของฉัน": "rose", "อื่นๆ": "violet" };
const modeOf = n => MODES.find(m => m.name === n);

/* ทะเบียนเดิม (TILES) สร้างใหม่จาก MODES เพื่อให้ที่เดียวเป็นจริง */
TILES.length = 0; MODES.forEach(m => TILES.push([m.cat, m.icon, m.title, m.sub, m.name, m.arg || "", m.tone || "", m.kw || ""]));

/* ---------- หัวหน้าโหมด: แถบสีไล่เฉด มีฟองลอย ไอคอนเต้นเบาๆ ---------- */
function modeHero(m, extra) {
  return `<div class="mhero ${m.tone || MODE_TONE[m.cat] || "violet"}"><span class="mh-bg" aria-hidden="true"><i></i><i></i><i></i></span><span class="mh-ic">${ic(m.icon, 28)}</span><div class="mh-t"><b>${m.title}</b><span>${m.sub}</span></div>${extra || ""}</div>`;
}
/* หน้าที่ไม่ใช่แท็บและยังไม่มีหัว: ครอบหัวให้อัตโนมัติ */
MODES.forEach(m => {
  if (!m.name || m.tabs || m.nohero || !SUBS[m.name]) return;
  const orig = SUBS[m.name];
  SUBS[m.name] = a => { const r = orig(a); if (r && typeof r.html === "string") r.html = modeHero(m) + r.html; return r; };
});

/* ---------- หน้าแบบแท็บ: รวมหลายโหมดเป็นหน้าเดียว ---------- */
const HOSTTAB = {}, HOSTFRESH = {}, ORIG = {};
MODES.forEach(m => (m.tabs || []).forEach(t => { ORIG[t.sub] = SUBS[t.sub]; }));
function lockedTab(st) {
  return `<div class="card mlock"><span class="ml-ic">${ic("lock", 26)}</span><b>ล็อกอยู่ตามวินัย IF</b><p class="muted sm">เปิดอีก ${dur(st.left)} (${hm(st.s)}) ตอนนี้ลองดื่มน้ำ หรือไปที่โหมดรับมือ</p><button class="btn primary" data-act="sub" data-n="crave" data-arg="night">ไปโหมดรับมือหิวดึก</button></div>`;
}
MODES.forEach(m => {
  if (!m.tabs) return;
  SUBS[m.name] = arg => {
    const tabs = m.tabs, want = arg && arg.id, k = tabs.some(t => t.k === want) ? want : (HOSTTAB[m.name] || tabs[0].k), tab = tabs.find(t => t.k === k) || tabs[0];
    HOSTTAB[m.name] = tab.k; const fresh = HOSTFRESH[m.name]; HOSTFRESH[m.name] = false;
    const st = typeof iffState === "function" ? iffState() : null;
    const locked = st && !st.eating && (m.lock || []).includes(tab.k);
    const r = locked ? { html: lockedTab(st) } : (ORIG[tab.sub]({}) || { html: "" });
    const seg = `<div class="seg mtabs" role="tablist" style="--n:${tabs.length}">${tabs.map(t => `<button class="${t.k === tab.k ? "on" : ""}" role="tab" aria-selected="${t.k === tab.k}" data-act="modetab" data-m="${m.name}" data-k="${t.k}">${t.label}</button>`).join("")}</div>`;
    return { title: m.title, keepScroll: !!r.keepScroll, after: r.after, html: `${modeHero(m)}${seg}<div class="mbody${fresh ? " swap" : ""}">${r.html}</div>` };
  };
});
/* เปิดหน้าเดิมโดยตรง (เช่น ปุ่ม "แก้ไข" เป้าหมายบนหน้าแรก) ก็เข้าหน้าแบบแท็บเหมือนกัน: หัวและแท็บเดียวกันทุกทางเข้า */
MODES.forEach(m => (m.tabs || []).forEach(t => {
  SUBS[t.sub] = arg => { const top = subStack[subStack.length - 1]; if (top && top.name === t.sub) { top.name = m.name; top.arg = { id: t.k }; } HOSTTAB[m.name] = t.k; return SUBS[m.name]({ id: t.k }); };
}));
ACT.modetab = a => {
  const n = a.dataset.m; if (n === "crave" && a.dataset.k !== "night" && typeof stopNight === "function") stopNight();
  HOSTTAB[n] = a.dataset.k; HOSTFRESH[n] = true; const top = subStack[subStack.length - 1]; if (top && top.name === n) top.arg = { id: a.dataset.k }; rerenderSub();
};
{ const _b = ACT.back; ACT.back = () => { const t = subStack[subStack.length - 1]; if (t && t.name === "crave" && typeof stopNight === "function") stopNight(); _b(); }; }

/* ---------- หน้าทุกโหมด ---------- */
function featCard(m) {
  const L = m.live ? m.live() : { line: m.sub, cta: "เปิดดู", pct: 0 }, C = 2 * Math.PI * 34;
  return `<button class="hfeat ${m.tone || "violet"}" data-act="sub" data-n="${m.name}"><span class="hf-bg" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
<span class="hf-tag">${ic("sparkle", 13)}โหมดเด่น</span>
<span class="hf-main"><b class="hf-t">${m.title}</b><span class="hf-line">${L.line}</span><span class="hf-cta">${L.cta || "เปิดดู"}${ic("back", 16)}</span></span>
<span class="hf-ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="rb" cx="40" cy="40" r="34"/><circle class="rf" cx="40" cy="40" r="34" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - Math.max(0, Math.min(100, L.pct)) / 100)).toFixed(1)}"/></svg><span class="hf-ic">${ic(m.icon, 28)}</span></span></button>`;
}
function modeTile(m, i) {
  const tone = m.tone || MODE_TONE[m.cat] || "violet", st = `style="--i:${i}"`;
  if (m.soon || !m.name) return `<button class="htile ${tone} soon" disabled ${st}><span class="hic">${ic(m.icon, 22)}</span><b>${m.title}</b><span class="s">${m.sub}</span><i class="soonbadge">เร็วๆ นี้</i></button>`;
  return `<button class="htile ${tone}" ${st} data-act="${m.name === "charts" ? "nav" : "sub"}" data-n="${m.name}" data-v="charts" ${m.arg ? `data-arg="${m.arg}"` : ""}><span class="hic">${ic(m.icon, 22)}</span><b>${m.title}</b><span class="s">${m.sub}</span>${m.isnew ? `<i class="newbadge">ใหม่</i>` : ""}${m.tabs ? `<i class="tabsbadge">${m.tabs.length} ในหนึ่ง</i>` : ""}</button>`;
}
const HUB_ORD = ["บันทึก", "ออกกำลังกาย", "วินัย", "ช่วยตัดสินใจ", "ดูความคืบหน้า", "ตัวละครของฉัน", "อื่นๆ"], HUB_REC = ["eat", "habits", "walk", "body", "rewards", "crave"];
const HUB_CI = { rec: "sparkle", all: "grid", "บันทึก": "bowl", "ออกกำลังกาย": "dumbbell", "วินัย": "timer", "ช่วยตัดสินใจ": "dice", "ดูความคืบหน้า": "chart", "ตัวละครของฉัน": "hanger", "อื่นๆ": "settings" };
hubCat = "rec";
const hubCatName = c => c === "rec" ? "แนะนำ" : c === "all" ? "ทั้งหมด" : c;
renderHub = function () {
  const q = hubQ.trim(), feats = MODES.filter(m => m.featured), home = !q && hubCat === "rec";
  const ord = c => HUB_ORD.indexOf(c) < 0 ? 99 : HUB_ORD.indexOf(c), byCat = (a, b) => ord(a.cat) - ord(b.cat);
  let list;
  if (q) list = MODES.filter(m => (m.title + m.sub + m.kw).toLowerCase().indexOf(q.toLowerCase()) > -1).sort(byCat);
  else if (hubCat === "rec") list = HUB_REC.map(n => modeOf(n)).filter(m => m && !m.quick && !m.featured).sort((a, b) => (b.isnew ? 1 : 0) - (a.isnew ? 1 : 0));
  else if (hubCat === "all") list = MODES.filter(m => !m.quick && !m.featured).sort(byCat);
  else list = MODES.filter(m => m.cat === hubCat);
  const on = !q && hubCat !== "rec";
  const bar = `<div class="hubtop"><div class="hubsearch"><span class="muted">${ic("search", 18)}</span><input id="hubq" type="text" placeholder="ค้นหา เช่น หิว น้ำหนัก เมนู" value="${esc(hubQ)}" aria-label="ค้นหาโหมด"/></div><button class="hubfb${on ? " on" : ""}" data-act="hubfilter" aria-label="กรองโหมด">${ic("sliders", 20)}${on ? "<i></i>" : ""}</button></div>${on ? `<button class="hubact" data-act="hubcat" data-c="rec">${ic(HUB_CI[hubCat] || "grid", 14)}${esc(hubCatName(hubCat))}<span>✕</span></button>` : ""}`;
  $("#v-hub").innerHTML = `<div class="top"><div><h1>ทุกโหมด</h1></div></div>${bar}${home ? feats.map(featCard).join("") + hubQuick() : ""}${list.length ? `<div class="sec hubsec">${q ? "ผลการค้นหา" : esc(hubCatName(hubCat))} <span class="hubn">${list.length}</span></div><div class="hgrid">${list.map((m, i) => modeTile(m, i)).join("")}</div>` : '<p class="muted" style="margin:24px 4px;text-align:center">ไม่พบ ลองคำอื่น เช่น น้ำ กราฟ ตัวละคร</p>'}`;
  const inp = $("#hubq"); if (hubQ) { inp.focus(); inp.setSelectionRange(hubQ.length, hubQ.length); }
};

ACT.hubfilter = () => {
  const cats = HUB_ORD.filter(c => MODES.some(m => m.cat === c)), rows = [["rec", MODES.length ? HUB_REC.length : 0], ["all", MODES.filter(m => !m.quick && !m.featured).length]].concat(cats.map(c => [c, MODES.filter(m => m.cat === c).length]));
  openModal(`<h2>กรองโหมด</h2><div class="hfl">${rows.map(r => `<button class="hfr${hubCat === r[0] ? " on" : ""}" data-act="hubcat" data-c="${r[0]}"><span class="hfr-i">${ic(HUB_CI[r[0]] || "grid", 18)}</span><b>${esc(hubCatName(r[0]))}</b><em>${r[1]}</em>${hubCat === r[0] ? ic("check", 16) : ""}</button>`).join("")}</div>`);
};
ACT.hubcat = a => { hubCat = a.dataset.c; if (!$("#modal").hidden) closeModal(); renderHub(); const v = $("#v-hub"); if (v) window.scrollTo(0, 0); };
