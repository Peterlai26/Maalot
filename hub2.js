/* หน้า "ทุกโหมด" แบบใหม่: ทางลัดวันนี้ (มีตัวเลขสด) + ตัวกรองหมวด + การ์ดโหมดทั้งหมดแบ่งสี */
(function () {
  const add = (cat, idx, row) => { if (!TILES.some(t => t[4] === row[4])) TILES.splice(idx, 0, row); };
  add("บันทึก", 1, ["บันทึก", "heart", "มื้อประจำ", "จดทั้งมื้อในแตะเดียว", "combos", "", "d-warn", "มื้อประจำ ชุด บ่อย"]);
  add("บันทึก", 2, ["บันทึก", "bowl", "อาหารของฉัน", "ขนมซอง จากฉลาก", "myfoods", "", "d-warn", "ของฉัน ขนม ซอง ฉลาก"]);
  add("ดูความคืบหน้า", TILES.findIndex(t => t[4] === "charts") + 1, ["ดูความคืบหน้า", "chart", "โภชนาการละเอียด", "โปรตีน คาร์บ ไขมัน", "nutri", "", "d-blue", "โภชนาการ โปรตีน คาร์บ ไขมัน น้ำตาล โซเดียม"]);
  add("ดูความคืบหน้า", TILES.findIndex(t => t[4] === "charts") + 2, ["ดูความคืบหน้า", "target", "เป้าหมายสัปดาห์", "เลือกเอง ได้เหรียญ", "goals", "", "d-blue", "เป้าหมาย สัปดาห์ เหรียญ"]);
})();
const HUBCATS = [["all", "ทั้งหมด"], ["บันทึก", "บันทึก"], ["ช่วยตัดสินใจ", "ช่วยตัดสินใจ"], ["ดูความคืบหน้า", "ความคืบหน้า"], ["ตัวละครของฉัน", "ตัวละคร"], ["อื่นๆ", "อื่นๆ"]];
const HUBTONE = { "บันทึก": "amber", "ช่วยตัดสินใจ": "green", "ดูความคืบหน้า": "blue", "ตัวละครของฉัน": "rose", "อื่นๆ": "violet" };
let hubCat = "all";
function hubTile(t) {
  const dis = !t[4], tone = HUBTONE[t[0]] || "violet";
  return `<button class="htile ${tone}" ${dis ? "disabled" : `data-act="${t[4] === "charts" ? "nav" : "sub"}" data-n="${t[4]}" data-v="charts" ${t[5] ? `data-arg="${t[5]}"` : ""}`}><span class="hic">${ic(t[1], 22)}</span><b>${t[2]}</b><span class="s">${t[3]}</span></button>`;
}
function hubQuick() {
  const k = todayKey(), i = dayInfo(k), tgt = targetOn(k) + i.wk, wat = S.water[k] || 0, lw = S.weights[S.weights.length - 1];
  const bar = (v, mx) => `<i class="hq-bar"><b style="width:${Math.min(100, Math.round(v / Math.max(1, mx) * 100))}%"></b></i>`;
  const q = (cls, ic_, title, sub, act, bar_) => `<button class="hq ${cls}" ${act}><span class="hq-ic">${ic(ic_, 22)}</span><b>${title}</b><span class="hq-s">${sub}</span>${bar_ || ""}</button>`;
  return `<div class="hq-grid">${q("q-food", "bowl", "กินอะไรมา", `วันนี้ ${fmtN(i.eaten)} / ${fmtN(tgt)} kcal`, 'data-act="sub" data-n="log" data-arg="food"', bar(i.eaten, tgt))}${q("q-work", "dumbbell", "ออกกำลังกาย", i.works.length ? `วันนี้ ${i.works.length} ครั้ง` : "ยังไม่ได้ขยับวันนี้", 'data-act="sub" data-n="log" data-arg="work"')}${q("q-water", "droplet", "น้ำและการนอน", `น้ำ ${wat}/8 แก้ว`, 'data-act="sub" data-n="water"', bar(wat, 8))}${q("q-weigh", "scale", "ชั่งน้ำหนัก", lw ? `ล่าสุด ${f1(lw.w)} กก.` : "ใส่ตัวเลขวันนี้", 'data-act="sub" data-n="weight"')}</div>`;
}
renderHub = function () {
  const q = hubQ.trim(), cats = [], by = {};
  const quick = t => (t[4] === "log" && (t[5] === "food" || t[5] === "work")) || t[4] === "weight" || t[4] === "water";
  TILES.forEach(t => { if (q ? (t[2] + t[3] + t[7]).indexOf(q) < 0 : quick(t)) return; if (!by[t[0]]) { by[t[0]] = []; cats.push(t[0]); } by[t[0]].push(t); });
  const shown = q ? cats : cats.filter(c => hubCat === "all" || c === hubCat);
  const secs = shown.map(c => `<div class="sec hubsec">${c} <span class="hubn">${by[c].length}</span></div><div class="hgrid">${by[c].map(hubTile).join("")}</div>`).join("");
  const chips = q ? "" : `<div class="hubchips" role="tablist">${HUBCATS.map(c => `<button class="hchip ${hubCat === c[0] ? "on" : ""}" data-act="hubcat" data-c="${c[0]}" role="tab" aria-selected="${hubCat === c[0]}">${c[1]}</button>`).join("")}</div>`;
  $("#v-hub").innerHTML = `<div class="top"><div><h1>ทุกโหมด</h1><div class="xs muted">ทุกอย่างของ Maalot ที่เดียว</div></div></div><div class="hubsearch"><span class="muted">${ic("search", 18)}</span><input id="hubq" type="text" placeholder="ค้นหา เช่น หิว น้ำหนัก เมนู" value="${esc(hubQ)}" aria-label="ค้นหาโหมด"/></div>${q ? "" : hubQuick()}${chips}${secs || '<p class="muted" style="margin:24px 4px;text-align:center">ไม่พบ ลองคำอื่น เช่น น้ำ กราฟ ตัวละคร</p>'}`;
  const inp = $("#hubq"); if (hubQ) { inp.focus(); inp.setSelectionRange(hubQ.length, hubQ.length); }
};
ACT.hubcat = (a) => { hubCat = a.dataset.c; renderHub(); };
