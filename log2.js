/* หน้าบันทึกรวม: อาหารและออกกำลังกายอยู่หน้าเดียว ไม่ต้องสลับแท็บ ช่องเดียวพิมพ์ปนกันได้ (ระบบแยกให้) */
(function () {
  const oLog = SUBS.log;
  const workRow = (it, i, kg) => {
    const c = workCalc(it, kg), fld = (l, f) => `<label class="xs muted">${l}<input type="number" inputmode="numeric" data-in="lgww" data-f="${f}" data-i="${i}" value="${it[f] || ""}" style="min-height:36px;padding:6px 8px"/></label>`;
    return `<div class="item" style="align-items:flex-start"><div class="grow">${it.known ? `<b>${esc(it.n)}</b>` : `<input type="text" data-in="lgwn" data-i="${i}" value="${esc(it.n)}" placeholder="ชื่อกิจกรรม" aria-label="ชื่อกิจกรรม"/>`}
<div class="grid2" style="margin-top:6px;gap:6px">${fld("เซ็ต", "sets")}${fld("ครั้งต่อเซ็ต", "reps")}${fld("วินาที", "secs")}${fld("นาที", "mins")}</div>
${it.known ? (c.assumed ? '<div class="xs muted" style="margin-top:4px">ไม่ได้บอกเวลา ใช้ 10 นาทีเป็นค่าเริ่มต้น</div>' : "") : `<div class="row" style="margin-top:6px"><span class="xs muted">เผาผลาญ</span><input type="number" inputmode="numeric" style="width:80px;min-height:36px;padding:6px 8px" data-in="lgwm" data-i="${i}" value="${it.km || ""}" aria-label="แคลอรี่ที่เผาผลาญ"/><span class="xs muted">kcal</span></div>`}</div>
<div style="text-align:right"><b>${fmtN(c.k)}</b><div class="xs muted">kcal</div><button class="iconbtn" data-act="lgwrm" data-i="${i}" aria-label="ลบรายการ">${ic("trash", 18)}</button></div></div>`;
  };
  SUBS.log = arg => {
    const fresh = !!(arg.fresh || !LG), wasWork = fresh && (arg.tab || arg.id) === "work"; let wtext = "";
    if (wasWork) { wtext = arg.text || ""; arg.tab = "food"; arg.text = ""; }
    const r = oLog(arg); if (!r || !LG) return r;
    if (fresh) { LG.work = wtext ? parseWork(wtext) : []; LG.wtext = wtext; LG.focusW = wasWork; }
    LG.work = LG.work || []; const kg = estW(); let wt = 0; const rows = LG.work.map((it, i) => { wt += workCalc(it, kg).k; return workRow(it, i, kg); }).join("");
    const sec = `<div class="sec" style="margin-top:18px">ออกกำลังกาย</div>
<textarea id="lgwtext" data-in="lgwtext" placeholder="วิดพื้น 3 เซ็ต เซ็ตละ 12 ครั้ง แพลงก์ 3 เซ็ต 45 วินาที วิ่ง 20 นาที">${esc(LG.wtext || "")}</textarea>
<div class="row wrap" style="margin-top:8px"><button class="btn" data-act="lgwparse">${ic("sparkle", 18)}ตีความ</button><button class="btn" data-act="lgwadd">${ic("plus", 18)}เพิ่มเอง</button><button class="btn" data-act="sub" data-n="fit">${ic("play", 18)}โปรแกรมออกกำลัง</button></div>
<div class="card" style="margin-top:10px;padding:6px 14px">${rows || '<div class="muted sm" style="padding:14px 0">ยังไม่มีรายการออกกำลังกาย พิมพ์แล้วกดตีความ หรือเริ่มโปรแกรมได้เลย</div>'}</div>
${LG.work.length ? `<div class="row between" style="margin-top:10px"><span class="muted">เผาผลาญประมาณ</span><b style="font-size:20px">-${fmtN(wt)} kcal</b></div>` : ""}`;
    r.title = "บันทึกวันนี้";
    r.html = r.html.replace(/<div class="seg" role="tablist">[\s\S]*?<\/div>/, '<div class="sec" style="margin-top:0">อาหาร</div>').replace('<label class="f" for="lgwhen">', sec + '<label class="f" for="lgwhen">').replace("ตัวเลขแคลอรี่เป็นค่าประมาณ แก้ไขได้ทุกรายการ", "ตัวเลขแคลอรี่เป็นค่าประมาณ แก้ไขได้ทุกรายการ พิมพ์อาหารกับออกกำลังกายปนกันในช่องแรกได้ ระบบจะแยกให้");
    const af = r.after; r.after = el => { if (af) af(el); if (LG && LG.focusW) { LG.focusW = false; const w = $("#lgwtext"); if (w) setTimeout(() => { w.scrollIntoView({ block: "center" }); }, 50); } };
    return r;
  };
  ACT.lgtab = () => { };
  ACT.lgparse = () => {
    const raw = ($("#lgtext") || {}).value || "", segs = raw.split(SPLIT).map(s => s.trim()).filter(Boolean), fs = [], ws = [];
    segs.forEach(s => (autoTab(s) === "work" ? ws : fs).push(s));
    LG.text = fs.join(", "); const wBox = $("#lgwtext"), wOld = wBox ? wBox.value : (LG.wtext || "");
    if (ws.length) { LG.wtext = (wOld.trim() ? wOld.trim() + ", " : "") + ws.join(", "); LG.work = parseWork(LG.wtext); } else LG.wtext = wOld;
    LG.items = LG.text.trim() ? parseFood(LG.text) : [];
    if (!LG.items.length && !(LG.work || []).length) toast("พิมพ์สิ่งที่กินหรือทำก่อนนะ"); rerenderSub();
  };
  ACT.lgwparse = () => { LG.wtext = ($("#lgwtext") || {}).value || ""; LG.work = LG.wtext.trim() ? parseWork(LG.wtext) : []; if (!LG.work.length) toast("พิมพ์สิ่งที่ทำก่อนนะ"); rerenderSub(); };
  ACT.lgwadd = () => { LG.wtext = ($("#lgwtext") || {}).value || LG.wtext; LG.work.push({ n: "", met: 0, kind: "time", sets: 0, reps: 0, secs: 0, mins: 0, known: false, km: 0 }); rerenderSub(); };
  ACT.lgwrm = a => { LG.wtext = ($("#lgwtext") || {}).value || LG.wtext; LG.work.splice(+a.dataset.i, 1); rerenderSub(); };
  document.addEventListener("input", e => { const t = e.target; if (LG && t.dataset && t.dataset.in === "lgwtext") LG.wtext = t.value; });
  document.addEventListener("change", e => { const t = e.target, k = t.dataset && t.dataset.in; if (!LG || !LG.work || !k || k.indexOf("lgw") !== 0 || k === "lgwhen" || k === "lgwtext") return; const it = LG.work[+t.dataset.i]; if (!it) return;
    if (k === "lgwn") it.n = t.value; else if (k === "lgww") { it[t.dataset.f] = Math.max(0, parseFloat(t.value) || 0); rerenderSub(); } else if (k === "lgwm") { it.km = Math.max(0, parseFloat(t.value) || 0); rerenderSub(); } });
  const oSave = ACT.lgsave;
  ACT.lgsave = () => {
    const works = (LG.work || []).filter(x => (x.n || "").trim() || x.known), foods = LG.items.filter(x => (x.n || "").trim() || x.known);
    if (!works.length && !foods.length) { toast("ยังไม่มีรายการให้บันทึก"); return; }
    if (works.length) {
      const kg = estW(), d = LG.when === "yest" ? addDays(todayKey(), -1) : todayKey(), t = lgTime();
      works.forEach(it => { const c = workCalc(it, kg); S.works.push({ id: rid(), d, t, n: it.n + (workLabel(it) ? " · " + workLabel(it) : ""), sets: it.sets || 0, reps: it.reps || 0, k: c.k }); });
      earn(5); LG.work = []; LG.wtext = "";
      if (!foods.length) { setFx("work", 2600); touchStreak(); save(); LG = null; closeAllSubs(); toast("บันทึกการออกกำลังกายแล้ว"); return; }
    }
    oSave();
  };
})();
