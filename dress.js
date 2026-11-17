/* หน้าแต่งตัวและตกแต่งห้อง: แท็บหมวดหมู่ + ตารางช่อง + แถบซื้อ ใช้ร่วมกันทั้ง ตู้เสื้อผ้า / ห้อง / ร้านค้า */
const DCROP = { hs: "-72 -214 144 140", hc: "-72 -214 144 140", hat: "-72 -240 144 160", face: "-62 -176 124 100", oc: "-62 -102 124 92", pt: "-62 -102 124 92", neck: "-60 -128 120 104", hand: "0 -108 96 136", shoe: "-42 -40 84 48", back: "-112 -208 224 216" };
const SWATCH_SLOTS = { hc: 1, oc: 1 };
const periodNow = () => { const md = S.mode || "auto", per = periodOf(new Date().getHours()); return md === "dark" ? "night" : md === "light" ? (per === "night" ? "noon" : per) : per; };

function itemOwnedC(code) { return !code || isOwned(code); }
function lockText(it) {
  if (it.medal) { const [fam, ti] = it.medal.split(":"), m = typeof MEDALS !== "undefined" ? MEDALS.find(x => x.id === fam) : null; return "ปลดล็อกด้วยเหรียญรางวัลระดับ" + (typeof MEDAL_TIERS !== "undefined" ? MEDAL_TIERS[+ti][0] : "") + (m ? " หมวด " + m.n : ""); }
  if (LOCKHINT[it.code]) return LOCKHINT[it.code];
  return it.price ? "ซื้อได้ด้วย " + it.price + " เหรียญ" : "";
}
function dressItems(kind, tab) {
  const src = kind === "wear" ? WITEMS[tab] : RITEMS[tab]; if (!src) return [];
  const idx = kind === "wear" ? WINDEX : RINDEX;
  return src.map(a => Object.assign({}, idx[tab + "|" + a[0]]));
}
function dressCur(kind, slot) { return kind === "wear" ? EDIT.look[slot] || SLOT_DEFAULT[slot] : (EDIT.room || {})[slot] || ROOM_DEFAULT[slot]; }

function dressScene() { return scene({ look: EDIT.look, mood: "happy", rx: EDIT.rx, period: periodNow(), owned: S.owned, room: EDIT.room || ROOM_DEFAULT, l1: "", l2: "" }); }
const NEXTBTN = (cls) => `<button class="btn primary dnext ${cls || ""}" data-act="onb1">ต่อไป ${ic("arrow", 14)}</button>`;
function dressPreview(sc) {
  return `<div class="dprevwrap"><div class="dwin"><div class="dprev stage">${sc.replace('viewBox="0 0 380 300"', 'viewBox="66 50 248 234"')}</div></div>${EDIT.onb ? NEXTBTN() : ""}</div>`;
}
function wearThumb(slot, id) {
  const L = normLook(EDIT.look); L[slot] = id;
  return `<svg viewBox="${DCROP[slot]}" preserveAspectRatio="xMidYMid slice" class="dthumb-svg" role="img">${figure(L, "happy", 46)}</svg>`;
}
function dressCell(kind, tab, it) {
  const cur = dressCur(kind, tab), on = cur === it.id, owned = itemOwnedC(it.code), sel = EDIT.sel && EDIT.sel.slot === tab && EDIT.sel.id === it.id;
  const badge = on ? `<span class="dbadge ok">${ic("check", 11)}ใส่อยู่</span>` : !owned ? (it.price ? `<span class="dbadge tag">${ic("coin", 11)}${it.price}</span>` : `<span class="dbadge lk">${it.medal ? ic("sparkle", 13) : ic("lock", 13)}</span>`) : "";
  if (kind === "wear" && SWATCH_SLOTS[tab]) return `<button class="dcell dcolor ${on ? "on" : ""} ${sel ? "sel" : ""} ${owned ? "" : "locked"}" data-act="dpick" data-slot="${tab}" data-id="${esc(it.id)}"><span class="dthumb" style="background:${it.id}"></span><span class="dname">${esc(it.n)}</span>${badge}</button>`;
  const thumb = kind === "wear" ? wearThumb(tab, it.id) : roomThumb(tab, it.id, periodNow() === "night");
  return `<button class="dcell ${on ? "on" : ""} ${sel ? "sel" : ""} ${owned ? "" : "locked"}" data-act="dpick" data-slot="${tab}" data-id="${esc(it.id)}"><span class="dthumb">${thumb}</span><span class="dname">${esc(it.n)}</span>${badge}</button>`;
}
function dressSelf() {
  const L = EDIT.look, chip = (v, n) => `<button class="btn sm ${L.g === v ? "sel" : ""}" data-act="dgender" data-v="${v}">${n}</button>`;
  return `<label class="f" for="nm">ชื่อตัวละคร</label><input id="nm" type="text" maxlength="14" placeholder="เช่น ก้อน หรือ เบนซ์" value="${esc(EDIT.name != null ? EDIT.name : S.name || "")}" data-in="dname"/>
<label class="f">เพศของตัวละคร</label><div class="row wrap">${chip("male", "ชาย")}${chip("female", "หญิง")}${chip("neutral", "กลางๆ")}</div>
<label class="f">สีผิว</label><div class="dgrid cl">${SKINS.map((c, i) => `<button class="dcell dcolor ${L.skin === c ? "on" : ""}" data-act="dskin" data-id="${c}" aria-label="สีผิว ${i + 1}"><span class="dthumb" style="background:${c}"></span><span class="dname">สีผิว ${i + 1}</span>${L.skin === c ? `<span class="dbadge ok">${ic("check", 11)}ใส่อยู่</span>` : ""}</button>`).join("")}</div>`;
}
function dressBar() {
  const s = EDIT.sel, kind = EDIT.mode;
  let info = "แตะของเพื่อลองใส่ได้เลย", buy = "";
  if (s) {
    const it = (kind === "wear" ? WINDEX : RINDEX)[s.slot + "|" + s.id];
    if (it) {
      const owned = itemOwnedC(it.code);
      if (owned) info = `ใส่ <b>${esc(it.n)}</b> อยู่`;
      else { info = `<b>${esc(it.n)}</b> · ${esc(lockText(it))}`; if (it.price) buy = `<button class="btn buy ${S.coins >= it.price ? "" : "poor"}" data-act="dbuy">${ic("coin", 15)}ซื้อ ${it.price}</button>`; }
    }
  }
  return `<div class="dbar"><div class="dinfo sm">${info}</div><div class="dbtns">${buy}<button class="btn ${buy ? "" : "primary"}" data-act="dsave">บันทึก</button></div></div>`;
}
function dressHTML() {
  const kind = EDIT.mode, tabs = kind === "wear" ? WTABS : ROOM_SLOTS, tab = EDIT.tab && tabs.some(t => t.id === EDIT.tab) ? EDIT.tab : tabs[0].id; EDIT.tab = tab;
  let body;
  if (kind === "wear" && tab === "self") body = dressSelf();
  else {
    let items = dressItems(kind, tab); const f = EDIT.filter || "all";
    if (f === "locked") items = items.filter(i => !itemOwnedC(i.code)); else if (f === "owned") items = items.filter(i => itemOwnedC(i.code));
    const sw = kind === "wear" && SWATCH_SLOTS[tab];
    body = items.length ? `<div class="dgrid ${sw ? "cl" : "th"}">${items.map(i => dressCell(kind, tab, i)).join("")}</div>` : `<p class="muted sm" style="padding:24px 0;text-align:center">${f === "locked" ? "หมวดนี้ปลดล็อกครบแล้ว เก่งมาก" : "ยังไม่มีของในหมวดนี้"}</p>`;
  }
  const seg = EDIT.onb ? "" : `<div class="seg dmode"><button class="${kind === "wear" ? "on" : ""}" data-act="dmode" data-m="wear">ตัวละคร</button><button class="${kind === "room" ? "on" : ""}" data-act="dmode" data-m="room">ห้อง</button></div>`;
  const flt = EDIT.onb ? "" : `<div class="dfilter">${[["all", "ทั้งหมด"], ["locked", "ยังไม่มี"], ["owned", "มีแล้ว"]].map(f => `<button class="chip ${(EDIT.filter || "all") === f[0] ? "on" : ""}" data-act="dfilter" data-f="${f[0]}">${f[1]}</button>`).join("")}</div>`;
  const tabsHTML = `<div class="dtabs" role="tablist">${tabs.map(t => `<button class="dtab ${t.id === tab ? "on" : ""}" data-act="dtab" data-t="${t.id}" role="tab">${t.n}</button>`).join("")}</div>`;
  const sc = dressScene(), mini = `<span class="dmini">${sc.replace('viewBox="0 0 380 300"', 'viewBox="104 40 172 172"')}</span>`;
  return `${seg}${dressPreview(sc)}<div class="dstick">${mini}${tabsHTML}</div><div class="dbody">${flt}${body}</div>${EDIT.onb ? NEXTBTN("fab") : dressBar()}`;
}
/* ใช้ในหน้าแรกของผู้ใช้ใหม่ (ขั้นที่ 1) */
function lookEditor() { return dressHTML(); }

function dressMinUpdate() {
  const w = document.querySelector(".dprevwrap"), st = document.querySelector(".dstick");
  if (!w || !st) { document.body.classList.remove("dmin"); return; }
  const out = w.getBoundingClientRect().bottom < 70; st.classList.toggle("min", out); document.body.classList.toggle("dmin", out);
}
addEventListener("scroll", dressMinUpdate, { passive: true }); document.addEventListener("DOMContentLoaded", () => { const s = document.querySelector("#sub"); if (s) s.addEventListener("scroll", dressMinUpdate, { passive: true }); });
function dressAfter(el) { el.classList.add("dress"); dressMinUpdate(); }
function dressRerender() {
  const nm = $("#nm"); if (nm) EDIT.name = nm.value;
  const sub = $("#sub"), y = !sub.hidden ? sub.scrollTop : window.scrollY, ox = (document.querySelector(".dtabs") || {}).scrollLeft || 0;
  EDIT.host(); const tb = document.querySelector(".dtabs"); if (tb) tb.scrollLeft = ox;
  if (!sub.hidden) sub.scrollTop = y; else window.scrollTo(0, y);
  dressMinUpdate();
  const on = document.querySelector(".dtab.on"); if (on && tb) { const r = on.getBoundingClientRect(), t = tb.getBoundingClientRect(); if (r.left < t.left || r.right > t.right) tb.scrollLeft += r.left - t.left - 20; }
}
function dressState(opts) {
  if (!EDIT || EDIT.host !== rerenderSub) EDIT = Object.assign({ look: normLook(S.look), room: roomOf(), rx: shapeRx(estW()), name: S.name, host: rerenderSub, mode: "wear", tab: "self", filter: "all", sel: null }, opts || {});
  return EDIT;
}
SUBS.wardrobe = () => { dressState(); return { title: "แต่งตัวและห้อง", keepScroll: true, right: `<span class="chip soft">${ic("coin", 14)}${S.coins}</span>`, html: dressHTML(), after: dressAfter }; };
SUBS.room = () => { dressState({ mode: "room", tab: "wall" }); return { title: "แต่งตัวและห้อง", keepScroll: true, right: `<span class="chip soft">${ic("coin", 14)}${S.coins}</span>`, html: dressHTML(), after: dressAfter }; };
SUBS.shop = () => { dressState({ filter: "locked", tab: "hs" }); return { title: "ร้านค้า", keepScroll: true, right: `<span class="chip soft">${ic("coin", 14)}${S.coins}</span>`, html: dressHTML(), after: dressAfter }; };

ACT.dmode = (a) => { EDIT.mode = a.dataset.m; EDIT.tab = null; EDIT.sel = null; dressRerender(); };
ACT.dtab = (a) => { EDIT.tab = a.dataset.t; dressRerender(); const s = $("#sub"); if (!s.hidden) s.scrollTop = 0; };
ACT.dfilter = (a) => { EDIT.filter = a.dataset.f; dressRerender(); };
ACT.dpick = (a) => {
  const slot = a.dataset.slot, id = a.dataset.id;
  if (EDIT.mode === "wear") EDIT.look[slot] = id; else EDIT.room = Object.assign({}, EDIT.room, { [slot]: id });
  EDIT.sel = { slot, id }; dressRerender();
};
ACT.dgender = (a) => { const v = a.dataset.v; EDIT.look.g = v; EDIT.look.hs = v === "male" ? "short" : v === "female" ? "long" : "bob"; dressRerender(); };
ACT.dskin = (a) => { EDIT.look.skin = a.dataset.id; dressRerender(); };
ACT.dbuy = () => {
  const s = EDIT.sel; if (!s) return; const it = (EDIT.mode === "wear" ? WINDEX : RINDEX)[s.slot + "|" + s.id]; if (!it || itemOwnedC(it.code) || !it.price) return;
  if (S.coins < it.price) { toast("เหรียญยังไม่พอ ทำภารกิจเพิ่มได้นะ"); return; }
  S.coins -= it.price; S.owned[it.code] = true; save(); toast("ซื้อ " + it.n + " แล้ว"); if (typeof popCoins === "function") confetti(); dressRerender();
  const chip = document.querySelector("#sub .subhead .chip"); if (chip) chip.innerHTML = ic("coin", 14) + S.coins;
};
function fixLocked(L, R, prevL, prevR) {
  const bad = [], keep = (it, prev, def) => (prev && prev !== it.id && itemOwnedC(((WINDEX[it.slot + "|" + prev] || RINDEX[it.slot + "|" + prev]) || {}).code) ? prev : def);
  Object.keys(SLOT_DEFAULT).forEach(slot => { const it = WINDEX[slot + "|" + L[slot]]; if (it && !itemOwnedC(it.code)) { L[slot] = keep(it, prevL && prevL[slot], SLOT_DEFAULT[slot]); bad.push(lockText(it)); } });
  if (R) Object.keys(ROOM_DEFAULT).forEach(slot => { const it = RINDEX[slot + "|" + R[slot]]; if (it && !itemOwnedC(it.code)) { R[slot] = keep(it, prevR && prevR[slot], ROOM_DEFAULT[slot]); bad.push(lockText(it)); } });
  return bad;
}
ACT.dsave = () => {
  const nm = $("#nm"); if (nm) EDIT.name = nm.value;
  const L = Object.assign({}, EDIT.look), R = Object.assign({}, EDIT.room), bad = fixLocked(L, R, normLook(S.look), roomOf());
  S.look = L; S.room = R; S.name = (EDIT.name || "").trim() || S.name; save(); EDIT = null; closeAllSubs();
  toast(bad.length ? "บางอย่างยังล็อกอยู่ เลยไม่ได้ใส่" : "บันทึกแล้ว");
};
document.addEventListener("input", (e) => { if (e.target && e.target.dataset && e.target.dataset.in === "dname" && EDIT) EDIT.name = e.target.value; });
