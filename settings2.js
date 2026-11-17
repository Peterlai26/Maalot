/* หน้าตั้งค่าแบบใหม่: การ์ดโปรไฟล์ + กลุ่มรายการที่กดเข้าไปตั้งค่าแต่ละเรื่อง (แทนฟอร์มยาวหน้าเดียว) */
const chev = () => `<span class="schev">${ic("back", 18)}</span>`;
function srow(act, data, icon, tone, title, sub, extra) {
  return `<button class="srow" data-act="${act}" ${data || ""}><span class="sic ${tone || ""}">${ic(icon, 20)}</span><span class="grow"><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}</span>${extra || ""}${chev()}</button>`;
}
/* ตัวอย่างหน้าตาของแต่ละธีม (พื้น การ์ด สีหลัก) เป็นการ์ดจำลองเล็กๆ ให้เห็นก่อนเลือก */
const PCOL = {
  peach: { n: "ฝัน", d: "ม่วงนุ่ม ค่าเริ่มต้น", L: ["#F9F5ED", "#ECE7F6", "#6B3FC0", "#24193B"], D: ["#170F27", "#34274F", "#B79CFF", "#F4EEFB"] },
  mint: { n: "มิ้นต์", d: "เขียวสดชื่น", L: ["#F1FAF4", "#DDF1E4", "#4FA574", "#243A2E"], D: ["#10201A", "#264236", "#7CC795", "#E7F6EC"] },
  sky: { n: "ฟ้า", d: "ฟ้าใส สบายตา", L: ["#F0F7FD", "#DCEBF8", "#4D93D1", "#22364A"], D: ["#0F1B27", "#28325F", "#7DB8E8", "#E6F1FB"] },
  sakura: { n: "ซากุระ", d: "ชมพูหวาน", L: ["#FFF3F6", "#FFE0E8", "#E8628A", "#42262F"], D: ["#26121B", "#55303F", "#F28BAA", "#FBE9EF"] },
  lavender: { n: "ลาเวนเดอร์", d: "ม่วงอ่อนละมุน", L: ["#F6F3FD", "#E8E1F8", "#8D78D8", "#2E2744"], D: ["#1A1526", "#34274F", "#B3A2EE", "#F0ECFA"] }
};
function palCard(q) {
  const dark = document.documentElement.dataset.theme === "dark", c = PCOL[q[0]] || PCOL.peach, k = dark ? c.D : c.L, on = (S.pal || "peach") === q[0];
  return `<button class="pcard ${on ? "on" : ""}" data-act="setpal" data-p="${q[0]}" aria-label="ธีม${c.n} ${c.d}" aria-pressed="${on}" style="--pb:${k[0]};--ps:${k[1]};--pa:${k[2]};--pi:${k[3]}"><span class="pmini"><i class="pm-top"></i><span class="pm-mid"><i class="pm-ring"></i><span><i class="pm-line"></i><i class="pm-line s"></i></span></span><i class="pm-btn"></i><i class="pm-nav"><b></b><b class="on"></b><b></b></i></span><span class="pname">${c.n}</span><span class="pdesc">${c.d}</span>${on ? `<span class="pchk">${ic("check", 14)}</span>` : ""}</button>`;
}
function setHead() {
  const w = estW(), rx = shapeRx(w), tgt = targetOn(todayKey());
  return `<div class="setprof"><div class="setav"><svg viewBox="-62 -204 124 130" role="img" aria-label="ตัวละคร">${figure(S.look, "happy", rx)}</svg></div><div class="grow"><b>${esc(S.name || "น้องก้อน")}</b><span>เป้าวันนี้ ${fmtN(tgt)} kcal</span><span class="setchips"><i>${ic("flame", 13)}${S.streak.n || 0} วัน</i><i>${ic("coin", 13)}${S.coins}</i></span></div><button class="btn sm" data-act="sub" data-n="wardrobe">แต่งตัว</button></div>`;
}
SUBS.settings = () => {
  const p = S.prof, md = S.mode || "auto", c = typeof remCfg === "function" ? remCfg() : { on: false };
  const sexT = p.sex === "m" ? "ชาย" : "หญิง", bk = S.lastBackup ? "สำรองล่าสุด " + new Date(S.lastBackup).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "ยังไม่เคยสำรอง";
  const modes = [["auto", "ตามเครื่อง", "phone"], ["light", "สว่าง", "sun"], ["dark", "มืด", "moon"]];
  return {
    title: "ตั้งค่า", after: () => { badge(); const sp = $(".spal"), on = $(".pcard.on"); if (sp && on) sp.scrollLeft += on.getBoundingClientRect().left - sp.getBoundingClientRect().left - (sp.clientWidth - on.clientWidth) / 2; }, html: `<div class="hint" hidden>${ic("cloud", 18)}<span id="syncb"></span></div>${setHead()}
<div class="sgt">หน้าตาแอป</div>
<div class="scard"><div class="spal" role="group" aria-label="เลือกสีธีม">${PALS.map(palCard).join("")}</div>
<div class="smode">${modes.map(m => `<button class="${md === m[0] ? "on" : ""}" data-act="setmode" data-m="${m[0]}" aria-pressed="${md === m[0]}">${ic(m[2], 16)}${m[1]}</button>`).join("")}</div></div>
<div class="sgt">ของฉัน</div>
<div class="scard rows">${srow("sub", 'data-n="setprof"', "user", "", "ข้อมูลส่วนตัว", `ส่วนสูง ${p.h} ซม. · อายุ ${p.age} · ${sexT}`)}${srow("sub", 'data-n="setrem"', "timer", "amber", "เตือนให้บันทึก", c.on ? `เปิดอยู่ ทุก ${c.everyH} ชั่วโมง` : "ปิดอยู่")}${srow("sub", 'data-n="myfoods"', "bowl", "pink", "อาหารของฉัน", `${(S.myfoods || []).length} รายการ`)}${srow("sub", 'data-n="combos"', "heart", "pink", "มื้อประจำ", `${(S.combos || []).length} ชุด`)}</div>
<div class="sgt">ข้อมูลและแอป</div>
<div class="scard rows">${srow("sub", 'data-n="setbk"', "cloud", S.lastBackup ? "green" : "warn", "สำรองและนำเข้าข้อมูล", bk)}${isApp() ? "" : srow("pwa", "", "phone", "", "ติดตั้งเป็นแอป", "เปิดจากหน้าจอโฮม เร็วขึ้น")}${srow("resetask", "", "trash", "danger", "เริ่มใหม่ทั้งหมด", "ลบข้อมูลทั้งหมดในเครื่องนี้")}</div>
<p class="xs muted" style="margin:14px 4px 0">ใช้เป็นข้อมูลทั่วไป ไม่ใช่คำแนะนำทางการแพทย์ ถ้ามีโรคประจำตัว ตั้งครรภ์ หรือกังวลเรื่องการกิน ควรปรึกษาแพทย์</p>`
  };
};
SUBS.setprof = () => {
  const p = S.prof;
  return { title: "ข้อมูลส่วนตัว", html: `<p class="muted sm" style="margin-bottom:10px">ใช้คำนวณพลังงานที่ร่างกายใช้และเป้าหมายแต่ละวัน เปลี่ยนได้ทุกเมื่อ</p><div class="scard"><div class="grid2"><div><label class="f" for="sh">ส่วนสูง (ซม.)</label><input id="sh" type="number" inputmode="decimal" value="${p.h}"/></div><div><label class="f" for="sa">อายุ</label><input id="sa" type="number" inputmode="numeric" value="${p.age}"/></div></div>
<label class="f" for="ssx">สูตรคำนวณใช้ค่าของ</label><select id="ssx"><option value="f" ${p.sex === "f" ? "selected" : ""}>หญิง</option><option value="m" ${p.sex === "m" ? "selected" : ""}>ชาย</option></select>
<label class="f" for="sac">กิจวัตร</label><select id="sac"><option value="1.2" ${p.act === 1.2 ? "selected" : ""}>นั่งเป็นหลัก</option><option value="1.3" ${p.act === 1.3 ? "selected" : ""}>เดินไปมาบ้าง</option><option value="1.4" ${p.act === 1.4 ? "selected" : ""}>ยืนหรือเดินเยอะ</option></select>
<label class="f" for="sdf">ความเร็วในการลด</label><select id="sdf"><option value="300" ${p.def === 300 ? "selected" : ""}>เบา 300 kcal ต่อวัน</option><option value="500" ${p.def === 500 ? "selected" : ""}>ปกติ 500 kcal ต่อวัน</option><option value="700" ${p.def === 700 ? "selected" : ""}>จริงจัง 700 kcal ต่อวัน</option></select></div>
<button class="btn primary block" style="margin-top:14px" data-act="ssave">บันทึก</button>` };
};
SUBS.setrem = () => ({ title: "เตือนให้บันทึก", html: `<div class="scard">${remHTML().replace('<div class="sec">เตือนให้บันทึก</div>', "")}</div>` });
SUBS.setbk = () => ({ title: "สำรองและนำเข้าข้อมูล", html: `<div class="scard"><p class="sm" style="margin-bottom:10px">${S.lastBackup ? "สำรองไฟล์ล่าสุด " + new Date(S.lastBackup).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "ยังไม่เคยสำรองเป็นไฟล์"}</p><p class="xs muted" style="margin-bottom:12px">ข้อมูลทั้งหมดเก็บอยู่ในเบราว์เซอร์นี้ ถ้าล้างข้อมูลเบราว์เซอร์หรือเปลี่ยนเครื่อง ข้อมูลจะหาย ควรดาวน์โหลดไฟล์สำรองเก็บไว้เป็นระยะ</p>
<div class="row"><button class="btn primary" style="flex:1" data-act="bkdl">ดาวน์โหลดไฟล์สำรอง</button><button class="btn" style="flex:1" data-act="bkfile">นำเข้าจากไฟล์</button></div></div>
<div class="sgt">หรือคัดลอกเป็นข้อความ</div><div class="scard"><textarea id="bk" rows="3" aria-label="ข้อมูลสำรอง" placeholder="กดคัดลอก หรือวางข้อมูลที่เคยสำรองไว้ที่นี่"></textarea><div class="row" style="margin-top:8px"><button class="btn" style="flex:1" data-act="bkout">คัดลอกข้อมูล</button><button class="btn" style="flex:1" data-act="bkin">นำเข้า</button></div></div>` });
const _ssave = ACT.ssave;
ACT.ssave = (a, e) => { const h = parseFloat($("#sh").value), ag = parseInt($("#sa").value, 10); _ssave(a, e); if (h >= 120 && h <= 220 && ag >= 18 && ag <= 90) closeSub(); };
