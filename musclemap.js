/* แผนที่กล้ามเนื้อของน้องเกี๊ยว: จิ้มส่วนของร่างกายเพื่อกรองท่าออกกำลังกายในคลังท่า
   MMAP.html()  ตัวแผนที่ (ด้านหน้า/ด้านหลัง หมุนตัวได้)
   MMAP.sel     ส่วนที่เลือกอยู่ (Set)    MMAP.score(e)  จำนวนส่วนที่ตรงกับที่เลือก   MMAP.names(e)  ชื่อกล้ามเนื้อที่ท่านั้นใช้ */
const MMAP = (() => {
  /* รหัสส่วนของร่างกาย → ชื่อ และด้านที่เห็น (f หน้า, b หลัง, fb ทั้งสองด้าน) */
  const R = { sh: ["ไหล่", "fb"], ch: ["อก", "f"], bi: ["ไบเซปส์ (แขนหน้า)", "f"], tr: ["ไตรเซปส์ (แขนหลัง)", "b"], ab: ["หน้าท้อง", "f"], ub: ["หลังส่วนบน", "b"], lb: ["หลังส่วนล่าง", "b"], gl: ["ก้น", "b"], qd: ["ต้นขาหน้า", "f"], hm: ["ต้นขาหลัง", "b"], cf: ["น่อง", "fb"], hr: ["หัวใจ (คาร์ดิโอ)", "f"] };
  const SHORT = { bi: "ไบเซปส์", tr: "ไตรเซปส์", hr: "หัวใจ" };
  const nm = k => SHORT[k] || R[k][0];
  /* ท่าไหนใช้กล้ามเนื้อส่วนไหน (เรียงจากส่วนหลักไปส่วนรอง) */
  const M = {};
  const put = (ids, regs) => ids.split(" ").forEach(id => { M[id] = regs.split(" "); });
  put("squat goblet sumo revlunge sidelunge stepup splitsq bbsquat legpress lunge", "qd gl");
  put("jumpsquat boxjump skater", "qd gl hr");
  put("wallsit legext", "qd"); put("calf", "cf"); put("legcurl", "hm");
  put("bridge hipthrust sglbridge", "gl hm"); put("kickback bandwalk", "gl");
  put("deadlift rdl bbdead sglrdl", "hm gl lb"); put("kbswing", "gl hm lb hr"); put("superman backext", "lb gl");
  put("pushup kneepush inclinepush widepush dbbench bbbench chestpress", "ch sh tr"); put("declinepush", "ch sh"); put("fly", "ch");
  put("diamond tricepdip", "tr ch"); put("pike press bandpress", "sh tr"); put("latraise frontraise armcircle", "sh"); put("tricepext", "tr");
  put("curl hammer bandcurl", "bi");
  put("row dbrow bandrow pullup negpull lat cablerow bbrow", "ub bi"); put("facepull", "ub sh");
  put("plank", "ab lb sh"); put("situp crunch cablecrunch bicycle russian boat sideplank legraise hangleg deadbug", "ab"); put("tapplank", "ab sh");
  put("birddog", "lb ab gl"); put("plankleg", "ab gl"); put("climber bearcrawl", "ab sh qd hr"); put("balance", "cf ab");
  put("jack stepjack aerobic", "hr qd cf"); put("walk brisk march", "hr qd cf"); put("treadwalk stairs", "hr qd gl cf"); put("run jog tread", "hr qd hm cf");
  put("highknee", "hr qd ab"); put("buttkick", "hr hm"); put("rope", "hr cf"); put("cycle", "hr qd cf"); put("elliptical", "hr qd gl"); put("rower", "hr ub qd");
  put("shadow", "hr sh"); put("swim", "hr sh ub"); put("burpee", "hr ch qd sh ab");
  put("stretch", "sh ub lb hm qd"); put("child", "lb ub"); put("hamstretch", "hm"); put("quadstretch", "qd"); put("hipstretch", "gl qd");
  put("shoulderstretch", "sh ch"); put("calfstretch", "cf"); put("crossstretch", "sh ub"); put("catcow", "lb ub ab"); put("cobra", "ab lb"); put("sunsal", "sh hm lb"); put("inchworm", "hm ab sh");
  /* ท่าที่ไม่ได้ระบุไว้ข้างบน: เดาจากกลุ่มกล้ามเนื้อหยาบเดิม */
  const COARSE = { "ขา": "qd hm cf", "ก้น": "gl", "อก": "ch", "ไหล่": "sh", "แขน": "bi tr", "หลัง": "ub lb", "แกนกลาง": "ab lb", "คาร์ดิโอ": "hr", "ยืดเหยียด": "" };
  const regs = e => M[e.id] || [...new Set((e.mg || []).flatMap(g => (COARSE[g] || "").split(" ").filter(Boolean)))];
  const sel = new Set();
  const names = e => regs(e).map(nm).join(" · ");
  const score = e => regs(e).filter(k => sel.has(k)).length;
  let view = "f";
  /* นิ้วชี้ชวนจิ้ม: โชว์จนกว่าจะแตะส่วนไหนสักครั้ง แล้วจำไว้ (เป็นความสะดวกต่อเครื่อง ไม่ซิงก์) */
  const hintOn = () => { try { return localStorage.getItem("maalot_mm_seen") !== "1" && !sel.size; } catch (e) { return !sel.size; } };
  const finger = () => `<g class="mfing" aria-hidden="true" transform="translate(84 125)"><circle class="mf-rip" r="6"/><circle class="mf-rip r2" r="6"/><g class="mf-hand"><g transform="rotate(-30)"><rect class="mf-cuff" x="-8" y="37" width="19" height="11" rx="4"/><rect x="-11" y="15" width="24" height="26" rx="9"/><rect x="-3.6" y="-1" width="8.4" height="25" rx="4.2"/><rect x="-1" y="20" width="14" height="6.4" rx="3.2"/><rect x="-1" y="26.4" width="14" height="6.4" rx="3.2"/><rect x="-1" y="32.8" width="13" height="6.4" rx="3.2"/><ellipse cx="-11.5" cy="22.5" rx="4" ry="8.6" transform="rotate(-14 -11.5 22.5)"/></g></g></g>`;

  /* ---------- ตัวน้องเกี๊ยว (โครงร่างเดียวกันทั้งหน้าและหลัง) ---------- */
  const INK = "#2A1D45";
  const limb = (a, b, w, fill) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${fill}" stroke-width="${w}" stroke-linecap="round"/>`;
  function body(front) {
    let sk = "#FFF1D6", sh = "#8155C9";
    try { const lk = normLook(S.look); if (/^#[0-9a-f]{6}$/i.test(lk.skin)) sk = lk.skin; if (/^#[0-9a-f]{6}$/i.test(lk.oc)) sh = lk.oc; } catch (e) { }
    const shorts = sh.toLowerCase() === "#8155c9" ? "#4C5DDA" : "#8155C9";
    const segs = [[[82, 204], [80, 262], 31], [[80, 262], [80, 312], 22], [[118, 204], [120, 262], 31], [[120, 262], [120, 312], 22],
    [[62, 108], [47, 152], 20], [[47, 152], [41, 194], 17], [[138, 108], [153, 152], 20], [[153, 152], [159, 194], 17]];
    const lines = segs.map(s => limb(s[0], s[1], s[2] + 4.5, INK)).join("") + segs.map(s => limb(s[0], s[1], s[2], sk)).join("");
    const hands = `<circle cx="40" cy="198" r="9.5" fill="${sk}" stroke="${INK}" stroke-width="2.2"/><circle cx="160" cy="198" r="9.5" fill="${sk}" stroke="${INK}" stroke-width="2.2"/>`;
    const shoes = `<ellipse cx="76" cy="320" rx="17" ry="8" fill="#F0679B" stroke="${INK}" stroke-width="2.2"/><ellipse cx="124" cy="320" rx="17" ry="8" fill="#F0679B" stroke="${INK}" stroke-width="2.2"/>`;
    const torso = `<path d="M62 104 Q100 92 138 104 L134 150 Q139 176 134 202 Q100 212 66 202 Q61 176 66 150 Z" fill="${sk}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
    const shortsP = `<path d="M65 192 Q100 202 135 192 L141 222 L106 226 L100 212 L94 226 L59 222 Z" fill="${shorts}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`;
    const neck = `<rect x="91" y="84" width="18" height="18" rx="7" fill="${sk}" stroke="${INK}" stroke-width="2"/>`;
    const tuft = `<ellipse cx="100" cy="14" rx="15" ry="9" fill="${sk}" stroke="${INK}" stroke-width="2.2"/><path d="M90 12 Q92 7 94 5 M100 11 Q100 6 100 3 M110 12 Q108 7 106 5" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>`;
    const head = `<ellipse cx="100" cy="52" rx="39" ry="37" fill="${sk}" stroke="${INK}" stroke-width="2.4"/>` + tuft + (front
      ? `<ellipse cx="86" cy="52" rx="4.2" ry="5.2" fill="${INK}"/><ellipse cx="114" cy="52" rx="4.2" ry="5.2" fill="${INK}"/><circle cx="87.5" cy="50" r="1.5" fill="#fff"/><circle cx="115.5" cy="50" r="1.5" fill="#fff"/><ellipse cx="76" cy="63" rx="7" ry="4.5" fill="#F58AB0" opacity=".55"/><ellipse cx="124" cy="63" rx="7" ry="4.5" fill="#F58AB0" opacity=".55"/><path d="M93 64 Q100 71 107 64" fill="none" stroke="#8A4A3A" stroke-width="2.4" stroke-linecap="round"/>`
      : `<path d="M74 40 Q78 30 84 28 M96 32 Q100 26 100 22 M116 28 Q122 30 126 40" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" opacity=".4"/>`);
    return { under: `<g>${lines}${hands}${shoes}</g>`, torso: neck + torso, shorts: shortsP, head };
  }
  /* ส่วนกล้ามเนื้อ: ครึ่งซ้ายของภาพ (กลับด้านเป็นครึ่งขวาให้เอง) หรือรูปกลาง */
  const L = (s) => s, mir = s => `<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
  /* หมุนที่กลุ่มด้านนอก ไม่หมุนที่ตัววงรี เพราะ CSS transform-origin ของ .r จะไปซ้อนกับ attribute transform */
  const el = (cx, cy, rx, ry, rot) => { const e = `<ellipse class="r" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`; return rot ? `<g transform="rotate(${rot} ${cx} ${cy})">${e}</g>` : e; };
  const rc = (x, y, w, h, r) => `<rect class="r" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r || 4}"/>`;
  const both = s => L(s) + mir(s);
  const SHAPES = {
    f: {
      sh: both(`<circle class="r" cx="62" cy="109" r="13"/>`),
      ch: both(el(84, 125, 21, 14)),
      bi: both(el(54, 130, 8.5, 17, 16)),
      ab: both(rc(86, 142, 12, 12) + rc(86, 157, 12, 12) + rc(86, 172, 12, 12) + el(73, 162, 6, 19)),
      qd: both(el(82, 240, 14, 24)),
      cf: both(el(80, 288, 9.5, 20)),
    },
    b: {
      sh: both(`<circle class="r" cx="62" cy="109" r="13"/>`),
      ub: `<path class="r" d="M75 104 Q100 94 125 104 L131 138 Q100 153 69 138 Z"/>`,
      tr: both(el(54, 130, 8.5, 17, 16)),
      lb: `<path class="r" d="M79 152 Q100 146 121 152 L120 186 Q100 191 80 186 Z"/>`,
      gl: both(el(88, 203, 16, 13)),
      hm: both(el(82, 240, 14, 24)),
      cf: both(el(80, 288, 9.5, 20)),
    }
  };
  const LBL = { f: { sh: "ไหล่", ch: "อก", bi: "ไบเซปส์", ab: "หน้าท้อง", qd: "ต้นขาหน้า", cf: "น่อง" }, b: { sh: "ไหล่", ub: "หลังส่วนบน", tr: "ไตรเซปส์", lb: "หลังส่วนล่าง", gl: "ก้น", hm: "ต้นขาหลัง", cf: "น่อง" } };
  const zone = (v, k, i) => `<g class="mz${sel.has(k) ? " on" : ""}" data-act="mz" data-m="${k}" role="button" tabindex="0" aria-pressed="${sel.has(k)}" aria-label="${LBL[v][k]}" style="--d:${(i * .37).toFixed(2)}s">${SHAPES[v][k]}</g>`;
  function fig(v) {
    const b = body(v === "f");
    return `<g class="mview" data-v="${v}"${v === view ? "" : " hidden"}><g class="mbob">${b.under}${b.torso}${b.shorts}${Object.keys(SHAPES[v]).map((k, i) => zone(v, k, i)).join("")}${b.head}</g></g>`;
  }
  const heart = () => `<g class="mz mheart${sel.has("hr") ? " on" : ""}" data-act="mz" data-m="hr" role="button" tabindex="0" aria-pressed="${sel.has("hr")}" aria-label="หัวใจ คาร์ดิโอ"><circle class="r hb" cx="172" cy="40" r="19"/><path class="hi" d="M172 50 C160 41 160 31 167 31 C170 31 172 34 172 34 C172 34 174 31 177 31 C184 31 184 41 172 50 Z"/></g><text x="172" y="72" text-anchor="middle" class="mtxt">คาร์ดิโอ</text>`;
  function html() {
    return `<div class="card mmcard"><div class="mmhead"><b>จิ้มส่วนที่อยากฝึก</b>${hintOn() ? '<span class="mmhint"><i>👆</i>ลองจิ้มดูสิ</span>' : '<span class="xs muted">เลือกได้หลายส่วน</span>'}</div>
<svg class="mmap" viewBox="0 0 200 334" role="group" aria-label="แผนที่กล้ามเนื้อของน้องเกี๊ยว แตะเพื่อเลือกส่วนที่ต้องการ">${fig("f")}${fig("b")}${heart()}${hintOn() && view === "f" ? finger() : ""}</svg>
<div class="seg mmseg" role="tablist"><button class="${view === "f" ? "on" : ""}" data-act="mview" data-v="f" role="tab">ด้านหน้า</button><button class="${view === "b" ? "on" : ""}" data-act="mview" data-v="b" role="tab">ด้านหลัง</button></div></div>`;
  }
  const sync = root => root.querySelectorAll(".mz").forEach(g => { const on = sel.has(g.dataset.m); g.classList.toggle("on", on); g.setAttribute("aria-pressed", on); });
  function afterChange() { const root = document.getElementById("sub"); if (!root) return; sync(root); if (typeof libRes === "function") libRes(); }
  ACT.mz = a => { const k = a.dataset.m; if (!R[k]) return; try { localStorage.setItem("maalot_mm_seen", "1"); } catch (e) { } document.querySelectorAll(".mfing, .mmhint").forEach(n => n.remove()); sel.has(k) ? sel.delete(k) : sel.add(k); if (typeof haptic === "function") haptic(8); afterChange(); };
  ACT.mzclear = () => { sel.clear(); afterChange(); };
  ACT.mview = a => {
    const v = a.dataset.v; if (v === view) return; document.querySelectorAll(".mfing").forEach(n => { n.style.display = v === "f" ? "" : "none"; }); const root = document.getElementById("sub"), svg = root && root.querySelector("svg.mmap"); view = v;
    root.querySelectorAll(".mmseg button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
    if (!svg) return; const cur = svg.querySelector(".mview:not([hidden])"), nxt = svg.querySelector(`.mview[data-v="${v}"]`); if (!cur || !nxt || cur === nxt) return;
    if (!cur.animate || matchMedia("(prefers-reduced-motion:reduce)").matches) { cur.toggleAttribute("hidden", true); nxt.toggleAttribute("hidden", false); return; }
    /* หมุนตัวครึ่งรอบ: บีบด้านเดิมเข้า แล้วคลี่อีกด้านออก */
    const o = { transformBox: "view-box", transformOrigin: "50% 50%" }; Object.assign(cur.style, o); Object.assign(nxt.style, o);
    cur.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: 170, easing: "ease-in" }).onfinish = () => { cur.toggleAttribute("hidden", true); nxt.toggleAttribute("hidden", false); nxt.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 200, easing: "ease-out" }); };
  };
  /* ตัวแมตช์สำหรับกรองรายการ */
  const key = k => R[k][0];
  return { html, sel, score, names, regs, name: nm, key, order: Object.keys(R) };
})();
