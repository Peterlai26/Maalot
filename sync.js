/* บัญชีผู้ใช้ (ไอดี + รหัสผ่าน) และซิงก์ข้ามเครื่อง ผ่าน Cloudflare Worker
   รหัสผ่านถูกยืดด้วย PBKDF2 ในเครื่องก่อน ส่งขึ้นเซิร์ฟเวอร์เฉพาะค่าที่ได้ ไม่เคยส่งรหัสผ่านจริง ไม่มีอีเมลยืนยัน จึงใช้ "รหัสกู้คืน" แทนการรีเซ็ตทางอีเมล */
const SYNC_API = "https://maalot-push.maalot.workers.dev";
const SYNC_SKIP = ["rem", "mode", "pal", "tut", "lastBackup"]; // ค่าเฉพาะแต่ละเครื่อง ไม่ซิงก์
const TOMB_TTL = 120 * 864e5;

/* ---------- ตัวรวมข้อมูล (ไม่ผูกกับหน้าจอ) ---------- */
function stableJson(o) {
  if (o === null || typeof o !== "object") return JSON.stringify(o === undefined ? null : o);
  if (Array.isArray(o)) return "[" + o.map(stableJson).join(",") + "]";
  return "{" + Object.keys(o).sort().map(k => JSON.stringify(k) + ":" + stableJson(o[k])).join(",") + "}";
}
function syncStrip(s) { const o = JSON.parse(JSON.stringify(s || {})); SYNC_SKIP.forEach(k => delete o[k]); return o; }
function hasUserData(s) { return !!(s && s.onboarded && ((s.meals || []).length || (s.works || []).length || (s.weights || []).length || (s.moods && Object.keys(s.moods).length))); }
function syncMerge(a, b) {
  a = a || {}; b = b || {};
  const newer = (a.upd || 0) >= (b.upd || 0) ? a : b, older = newer === a ? b : a, out = Object.assign({}, older, newer);
  SYNC_SKIP.forEach(k => { if (a[k] !== undefined) out[k] = a[k]; else delete out[k]; });
  const cr = [a.created, b.created].filter(Boolean); if (cr.length) out.created = Math.min.apply(null, cr);
  out.onboarded = !!(a.onboarded || b.onboarded); out.nights = Math.max(a.nights || 0, b.nights || 0); out.coins = Math.max(a.coins || 0, b.coins || 0); out.upd = Math.max(a.upd || 0, b.upd || 0);
  const del = {}, now = Date.now(); [b.del, a.del].forEach(m => Object.keys(m || {}).forEach(k => { if (now - m[k] < TOMB_TTL) del[k] = Math.max(del[k] || 0, m[k]); })); out.del = del;
  const byId = (la, lb, pre, sortFn) => {
    const m = {}; (lb || []).concat(la || []).forEach(x => { if (x && x.id !== undefined) m[x.id] = x; });
    const aIds = new Set((la || []).map(x => x && x.id)); (lb || []).forEach(x => { if (x && aIds.has(x.id) && newer === b) m[x.id] = x; });
    const r = Object.keys(m).map(k => m[k]).filter(x => !del[pre + x.id]); return sortFn ? r.sort(sortFn) : r;
  };
  const byDT = (p, q) => (p.d || "") < (q.d || "") ? -1 : (p.d || "") > (q.d || "") ? 1 : (p.t || "") < (q.t || "") ? -1 : (p.t || "") > (q.t || "") ? 1 : 0;
  out.meals = byId(a.meals, b.meals, "m:", byDT); out.works = byId(a.works, b.works, "k:", byDT);
  out.combos = byId(a.combos, b.combos, "c:"); out.myfoods = byId(a.myfoods, b.myfoods, "f:"); out.progs = byId(a.progs, b.progs, "p:"); out.lifts = byId(a.lifts, b.lifts, "l:", byDT); out.cardio = byId(a.cardio, b.cardio, "g:", byDT); out.sessions = byId(a.sessions, b.sessions, "s:", byDT);
  const byDate = (la, lb, pre) => {
    const m = {}; (lb || []).concat(la || []).forEach(x => { if (!x || !x.d) return; const o = m[x.d]; if (!o || (x.t || 0) > (o.t || 0)) m[x.d] = x; });
    return Object.keys(m).map(k => m[k]).filter(x => !(pre && del[pre + x.d] && del[pre + x.d] >= (x.t || 0))).sort((p, q) => p.d < q.d ? -1 : 1);
  };
  out.weights = byDate(a.weights, b.weights, "wt:"); out.body = byDate(a.body, b.body, ""); out.waist = byDate(a.waist, b.waist, "");
  const maxMap = (x, y) => { const o = Object.assign({}, y || {}); Object.keys(x || {}).forEach(k => { o[k] = typeof x[k] === "number" && typeof o[k] === "number" ? Math.max(x[k], o[k]) : (o[k] === undefined ? x[k] : o[k]); }); return o; };
  out.water = maxMap(a.water, b.water); out.coinLog = maxMap(a.coinLog, b.coinLog);
  out.sleep = Object.assign({}, older.sleep || {}, newer.sleep || {});
  out.nutr = Object.assign({}, older.nutr || {}, newer.nutr || {});
  const moods = {}; [b.moods, a.moods].forEach(m => Object.keys(m || {}).forEach(d => { const x = m[d]; if (x && (!moods[d] || (x.t || 0) >= (moods[d].t || 0))) moods[d] = x; })); Object.keys(moods).forEach(d => { if (del["md:" + d] && del["md:" + d] >= (moods[d].t || 0)) delete moods[d]; }); out.moods = moods;
  const days = {}; [b.iffDays, a.iffDays].forEach(m => Object.keys(m || {}).forEach(d => { const x = m[d], o = days[d]; days[d] = o ? Object.assign({}, x, { paid: !!(o.paid || x.paid) }) : x; })); out.iffDays = days;
  ["claimed", "owned", "shop", "medals", "wkClaim"].forEach(k => { const o = Object.assign({}, b[k] || {}); Object.keys(a[k] || {}).forEach(x => { if (a[k][x]) o[x] = o[x] && typeof o[x] === "number" && typeof a[k][x] === "number" ? Math.min(o[x], a[k][x]) : (o[x] || a[k][x]); }); out[k] = o; });
  const sa = a.streak || {}, sb = b.streak || {}, sl = (sa.last || "") >= (sb.last || "") ? sa : sb; out.streak = Object.assign({}, sl, { best: Math.max(sa.best || 0, sb.best || 0) });
  return out;
}

/* ---------- รหัสผ่าน (ยืดในเครื่อง) ---------- */
const _enc = new TextEncoder(), normId = s => String(s || "").trim().toLowerCase();
async function pbk(secret, salt, iter) {
  const k = await crypto.subtle.importKey("raw", _enc.encode(secret), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: _enc.encode(salt), iterations: iter }, k, 256);
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("");
}
const authKey = (id, pw) => pbk(pw, "maalot-auth-v1|" + normId(id), 250000);
const recCode = s => String(s || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
const recKey = (id, rc) => pbk(recCode(rc), "maalot-rec-v1|" + normId(id), 120000);
function newRecovery() { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", b = crypto.getRandomValues(new Uint8Array(20)); let s = ""; b.forEach(x => { s += A[x % 32]; }); return s.match(/.{1,4}/g).join("-"); }
const ID_OK = s => /^[a-z0-9._@+-]{3,40}$/.test(normId(s));

/* ---------- เซสชัน ---------- */
const AUTHK = "maalot_auth";
let AUTH = null, SYNCING = false, SYNC_AGAIN = false, SYNC_T = null, SYNC_ST = "idle", SYNC_LASTPUSH = 0;
function authLoad() { try { AUTH = JSON.parse(localStorage.getItem(AUTHK) || "null"); } catch (e) { AUTH = null; } if (AUTH && AUTH.exp * 1000 < Date.now()) AUTH.expired = true; }
function authSave() { try { if (AUTH) localStorage.setItem(AUTHK, JSON.stringify(AUTH)); else localStorage.removeItem(AUTHK); } catch (e) { } }
const loggedIn = () => !!(AUTH && AUTH.token && !AUTH.expired);
const syncOn = () => loggedIn() && !!AUTH.linked;
async function syncApi(method, path, body, noAuth) {
  const h = { "Content-Type": "application/json" }; if (!noAuth && AUTH) h.Authorization = "Bearer " + AUTH.token;
  const r = await fetch(SYNC_API + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json().catch(() => ({})); if (r.status === 401 && !noAuth && AUTH) { AUTH.expired = true; authSave(); setSyncSt("expired"); }
  return { ok: r.ok, status: r.status, j };
}
function setSyncSt(st) { SYNC_ST = st; const el = $("#syncacct"); if (el) el.innerHTML = acctStatusText(); }
function applyRemote(obj) {
  const keep = {}; SYNC_SKIP.forEach(k => { if (S[k] !== undefined) keep[k] = S[k]; });
  S = merge(Object.assign({}, obj, keep)); if (typeof migDumpling === "function") migDumpling(); persistLocal(); applyTheme();
  if (S.onboarded && $("#app").hidden) { $("#onb").hidden = true; $("#onb").innerHTML = ""; $("#app").hidden = false; $(".nav").hidden = false; closeAllSubsSilent && closeAllSubsSilent(); show("home"); }
  else if (!subStack.length) refresh();
}
async function syncNow() {
  if (!syncOn()) return; if (SYNCING) { SYNC_AGAIN = true; return; }
  SYNCING = true; setSyncSt("syncing");
  try {
    for (let i = 0; i < 3; i++) {
      const g = await syncApi("GET", "/sync"); if (g.status === 401) return; if (!g.ok) throw new Error("get");
      const remote = g.j.data, rupd = g.j.upd || 0;
      if (!remote && !hasUserData(S)) { AUTH.base = rupd; break; }
      const merged = remote ? syncMerge(S, remote) : S;
      if (remote && stableJson(syncStrip(merged)) !== stableJson(syncStrip(S))) applyRemote(merged);
      if (remote && stableJson(syncStrip(merged)) === stableJson(syncStrip(remote))) { AUTH.base = rupd; break; }
      const p = await syncApi("PUT", "/sync", { data: syncStrip(merged), base: rupd });
      if (p.status === 409) continue; if (p.status === 401) return; if (!p.ok) throw new Error("put");
      AUTH.base = p.j.upd; SYNC_LASTPUSH = Date.now(); break;
    }
    AUTH.last = Date.now(); authSave(); setSyncSt("ok");
  } catch (e) { setSyncSt(navigator.onLine === false ? "offline" : "error"); }
  finally { SYNCING = false; if (SYNC_AGAIN) { SYNC_AGAIN = false; syncSoon(); } }
}
/* ซิงก์เมื่อข้อมูลเปลี่ยน แต่ไม่ถี่เกินไป (โควตาเขียนฟรีของเซิร์ฟเวอร์มีจำกัด) */
function syncSoon() { if (!syncOn()) return; clearTimeout(SYNC_T); SYNC_T = setTimeout(syncNow, Math.max(30000, 120000 - (Date.now() - SYNC_LASTPUSH))); }
function startSync() {
  authLoad();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") syncNow(); else if (syncOn()) { clearTimeout(SYNC_T); syncNow(); } });
  addEventListener("online", () => syncNow());
  if (syncOn()) syncNow();
}

/* ---------- รวมข้อมูลตอนเข้าสู่ระบบครั้งแรกของเครื่อง ---------- */
const dayCount = s => new Set((s.meals || []).map(m => m.d)).size;
let SYNC_LINK = null;
async function syncLink() {
  const g = await syncApi("GET", "/sync"); if (!g.ok) { toast("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ"); return; }
  const remote = g.j.data, rupd = g.j.upd || 0, lh = hasUserData(S), rh = hasUserData(remote);
  const done = (msg) => { AUTH.linked = true; AUTH.base = rupd; authSave(); toast(msg); const t = subStack[subStack.length - 1]; if (t && (t.name === "account" || t.name === "settings")) rerenderSub(); syncNow(); };
  if (!remote || (!lh && !rh)) { done("เข้าสู่ระบบแล้ว"); return; }
  if (!lh && rh) { applyRemote(remote); done("ดึงข้อมูลจากบัญชีแล้ว"); return; }
  if (lh && !rh) { done("เข้าสู่ระบบแล้ว กำลังส่งข้อมูลขึ้นบัญชี"); return; }
  const mj = stableJson(syncStrip(syncMerge(S, remote)));
  if (mj === stableJson(syncStrip(remote)) || mj === stableJson(syncStrip(S))) { done("เข้าสู่ระบบแล้ว"); return; }
  SYNC_LINK = { remote, rupd, done };
  openModal(`<h2>พบข้อมูลทั้งสองที่</h2><p class="muted" style="margin:8px 0 14px">ในเครื่องนี้ ${dayCount(S)} วันที่จดอาหาร · ในบัญชี ${dayCount(remote)} วันที่จดอาหาร</p>
<button class="btn primary block" data-act="lkmerge">รวมข้อมูลทั้งสองที่ (แนะนำ)</button>
<button class="btn block" style="margin-top:8px" data-act="lkremote">ใช้ข้อมูลของบัญชี แทนที่เครื่องนี้</button>
<button class="btn block" style="margin-top:8px" data-act="lklocal">ใช้ข้อมูลของเครื่องนี้ แทนที่บัญชี</button>`);
}
ACT.lkmerge = () => { closeModal(); if (SYNC_LINK) SYNC_LINK.done("รวมข้อมูลแล้ว"); };
ACT.lkremote = () => { closeModal(); if (!SYNC_LINK) return; applyRemote(SYNC_LINK.remote); SYNC_LINK.done("ใช้ข้อมูลของบัญชีแล้ว"); };
ACT.lklocal = async () => {
  closeModal(); if (!SYNC_LINK) return; const L = SYNC_LINK; AUTH.linked = true; authSave();
  const p = await syncApi("PUT", "/sync", { data: syncStrip(S), base: L.rupd }); if (p.ok) { AUTH.base = p.j.upd; authSave(); toast("ใช้ข้อมูลของเครื่องนี้แล้ว"); setSyncSt("ok"); } else toast("อัปโหลดไม่สำเร็จ ลองซิงก์อีกครั้งนะ");
};

/* ---------- หน้าบัญชี ---------- */
let ACC = { mode: "login", busy: false, err: "" };
function acctStatusText() {
  if (!AUTH) return "";
  const t = AUTH.last ? new Date(AUTH.last).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "";
  const m = { syncing: "กำลังซิงก์…", ok: t ? "ซิงก์ล่าสุด " + t : "ซิงก์แล้ว", error: "ซิงก์ไม่สำเร็จ จะลองใหม่เอง", offline: "ออฟไลน์ จะซิงก์เมื่อมีเน็ต", expired: "เซสชันหมดอายุ เข้าสู่ระบบใหม่เพื่อซิงก์ต่อ", idle: t ? "ซิงก์ล่าสุด " + t : "" };
  return `<span class="xs muted">${m[AUTH.expired ? "expired" : SYNC_ST] || ""}</span>`;
}
function acctRowSub() { if (!AUTH) return "ยังไม่ได้เข้าสู่ระบบ ข้อมูลอยู่ในเครื่องนี้"; if (AUTH.expired) return "เซสชันหมดอายุ แตะเพื่อเข้าสู่ระบบใหม่"; return esc(AUTH.id) + " · " + acctStatusText().replace(/<[^>]+>/g, ""); }
function accParts() {
  const m = ACC.mode, reg = m === "register", rec = m === "recover";
  const tabs = `<div class="seg" style="margin-bottom:14px"><button class="${m === "login" ? "on" : ""}" data-act="accmode" data-m="login">เข้าสู่ระบบ</button><button class="${reg ? "on" : ""}" data-act="accmode" data-m="register">สมัครสมาชิก</button></div>`;
  const expired = AUTH && AUTH.expired ? `<div class="hint">${ic("lock", 18)}<span>เซสชันหมดอายุ เข้าสู่ระบบอีกครั้งเพื่อซิงก์ต่อ (ข้อมูลในเครื่องยังอยู่)</span></div>` : "";
  const err = ACC.err ? `<div class="hint warnh" style="margin:10px 0">${ic("heart", 18)}<span>${esc(ACC.err)}</span></div>` : "";
  const idv = esc((AUTH && AUTH.id) || ACC.id || "");
  const form = rec ? `<h3 style="margin:0 0 6px">ลืมรหัสผ่าน</h3><p class="muted sm" style="margin-bottom:8px">ข้อมูลของคุณยังอยู่ เลือกวิธีตั้งรหัสผ่านใหม่</p>
<label class="f" for="aid">ไอดีหรืออีเมล</label><input id="aid" type="text" autocomplete="username" autocapitalize="none" value="${idv}"/>
${ACC.msg ? `<div class="hint" style="margin:10px 0">${ic("sparkle", 18)}<span>${esc(ACC.msg)}</span></div>` : ""}
<button class="btn primary block" style="margin-top:12px" data-act="accforgot" ${ACC.busy ? "disabled" : ""}>${ic("mail", 18)}ส่งลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล</button>
<p class="xs muted" style="margin-top:6px">ใช้ได้เมื่อบัญชีนี้เคยตั้งอีเมลไว้ ลิงก์ใช้ได้ 30 นาที ถ้าไม่เห็นอีเมล ดูในกล่องสแปมด้วย</p>
<div class="sec" style="margin-top:16px">หรือใช้รหัสกู้คืน (รูปแบบ XXXX-XXXX-…)</div>
<label class="f" for="arc">รหัสกู้คืน</label><input id="arc" type="text" autocapitalize="characters" autocomplete="off" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"/>
<label class="f" for="apw">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</label><input id="apw" type="password" autocomplete="new-password"/>
<button class="btn block" style="margin-top:14px" data-act="accgo" ${ACC.busy ? "disabled" : ""}>${ACC.busy ? "กำลังทำงาน…" : "ตั้งรหัสผ่านใหม่ด้วยรหัสกู้คืน"}</button><button class="linkbtn" style="margin-top:8px" data-act="accmode" data-m="login">กลับไปเข้าสู่ระบบ</button>`
    : `${tabs}<label class="f" for="aid">ไอดี (อีเมลหรือชื่อผู้ใช้)</label><input id="aid" type="text" autocomplete="username" autocapitalize="none" placeholder="เช่น mali@example.com หรือ mali_01" value="${idv}"/>
<label class="f" for="apw">รหัสผ่าน${reg ? " (อย่างน้อย 8 ตัว)" : ""}</label><input id="apw" type="password" autocomplete="${reg ? "new-password" : "current-password"}"/>
${reg ? `<label class="f" for="apw2">ยืนยันรหัสผ่าน</label><input id="apw2" type="password" autocomplete="new-password"/><label class="f" for="aem">อีเมล (ไม่บังคับ ไว้กู้รหัสผ่าน)</label><input id="aem" type="email" autocomplete="email" autocapitalize="none" placeholder="mali@example.com"/><p class="xs muted" style="margin-top:8px">ใส่อีเมลไว้ ถ้าลืมรหัสผ่านจะส่งลิงก์ตั้งรหัสใหม่ให้ทางอีเมลได้ (ถ้าไอดีเป็นอีเมลอยู่แล้ว ใช้ไอดีนั้นเลย) หรือกู้ด้วย “รหัสกู้คืน” ที่แอปให้หลังสมัคร เก็บไว้ให้ดี ถ้าไม่มีทั้งอีเมลและรหัสกู้คืน จะเข้าบัญชีไม่ได้</p>` : ""}
<button class="btn primary block" style="margin-top:14px" data-act="accgo" ${ACC.busy ? "disabled" : ""}>${ACC.busy ? "กำลังทำงาน…" : reg ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</button>${reg ? "" : `<button class="linkbtn" style="margin-top:8px" data-act="accmode" data-m="recover">ลืมรหัสผ่าน?</button>`}`;
  return { m, reg, rec, err, expired, form };
}
/* ---------- ป๊อปอัพสมัครสมาชิก (ด่านก่อนสร้างตัวละคร) ---------- */
function gateHtml() {
  const P = accParts();
  const head = P.rec ? ["ลืมรหัสผ่านใช่ไหม", "ใช้รหัสกู้คืนตั้งรหัสใหม่ ข้อมูลของคุณยังอยู่"] : P.reg ? ["สมัครสมาชิกก่อนสร้างน้องเกี๊ยว", "ข้อมูลที่จดไว้จะอยู่กับบัญชี ไม่หายเวลาเปลี่ยนมือถือ ใช้ได้ทุกเครื่อง"] : ["ยินดีต้อนรับกลับมา", "เข้าสู่ระบบเพื่อดึงน้องเกี๊ยวและข้อมูลของคุณกลับมา"];
  const form = P.reg ? P.form.replace(/(id="apw"[^>]*>)/, '$1<i class="pwbar" aria-hidden="true"><b></b></i>') : P.form;
  return `<div class="gate"><button class="gx" data-act="modalclose" aria-label="ปิด">${ic("x", 18)}</button>
<h2>${head[0]}</h2><p class="muted sm gsub">${head[1]}</p>${P.err}${form}</div>`;
}
function openGate() { openModal(gateHtml()); const p = document.querySelector("#modal .panel"); if (p) p.classList.add("gatep"); }
/* วาดฟอร์มบัญชีใหม่: ถ้าเป็นป๊อปอัพให้เปลี่ยนเนื้อในกรอบเดิม (ไม่เล่นอนิเมชันเข้าซ้ำ) ไม่งั้นวาดหน้าย่อยใหม่ */
function accDraw() { const p = document.querySelector("#modal .panel.gatep"); if (ACC.pop && p && !document.querySelector("#modal").hidden) p.innerHTML = gateHtml(); else rerenderSub(); }
document.addEventListener("input", e => {
  if (e.target.id !== "apw") return; const b = document.querySelector(".pwbar b"); if (!b) return; const v = e.target.value;
  const sc = Math.min(4, (v.length >= 8 ? 1 : 0) + (v.length >= 12 ? 1 : 0) + (/[a-z]/.test(v) && /[A-Z0-9]/.test(v) ? 1 : 0) + (/[^A-Za-z0-9]/.test(v) ? 1 : 0));
  b.style.width = (v ? Math.max(12, sc * 25) : 0) + "%"; b.dataset.l = v.length < 8 ? "0" : sc <= 1 ? "1" : sc === 2 ? "2" : "3";
});
SUBS.account = () => {
  if (loggedIn()) {
    return { title: "บัญชีและซิงก์", html: `<div class="scard"><div class="row between"><div><div class="xs muted">เข้าสู่ระบบเป็น</div><b style="font-size:17px">${esc(AUTH.id)}</b></div><span id="syncacct">${acctStatusText()}</span></div>
<div class="row" style="margin-top:12px"><button class="btn primary" style="flex:1" data-act="syncnow">ซิงก์ตอนนี้</button><button class="btn" style="flex:1" data-act="logout">ออกจากระบบ</button></div></div>
<p class="xs muted" style="margin:10px 4px">ข้อมูลที่ซิงก์ (อาหาร ออกกำลังกาย น้ำหนัก อารมณ์ ของที่ซื้อ ฯลฯ) ถูกเก็บบนเซิร์ฟเวอร์ของแอปที่ Cloudflare โดยไม่ได้เข้ารหัสแบบ end-to-end ส่วนรหัสผ่านไม่เคยถูกส่งหรือเก็บเป็นตัวจริง ซิงก์เมื่อข้อมูลเปลี่ยนและตอนเปิดแอป ค่าที่ตั้งเฉพาะเครื่อง (ธีมสี โหมดสว่าง/มืด การเตือน) ไม่ซิงก์</p>
<div class="sgt">จัดการบัญชี</div><div class="scard rows"><button class="srow" data-act="emailset"><span class="sic">${ic("mail", 20)}</span><span class="grow"><b>อีเมลกู้รหัสผ่าน</b><small>${AUTH.em ? esc(AUTH.em) : "ยังไม่ได้ตั้ง ตั้งไว้เพื่อกู้รหัสผ่านทางอีเมล"}</small></span></button><button class="srow" data-act="pwchange"><span class="sic">${ic("lock", 20)}</span><span class="grow"><b>เปลี่ยนรหัสผ่าน</b><small>เครื่องอื่นจะต้องเข้าสู่ระบบใหม่</small></span></button><button class="srow" data-act="srvdelask"><span class="sic danger">${ic("trash", 20)}</span><span class="grow"><b>ลบบัญชีและข้อมูลบนเซิร์ฟเวอร์</b><small>ข้อมูลในเครื่องนี้ยังอยู่</small></span></button></div>` };
  }
  const P = accParts(), reg = P.reg, rec = P.rec, err = P.err, expired = P.expired, form = P.form;
  return { title: reg ? "สมัครสมาชิก" : rec ? "ลืมรหัสผ่าน" : "เข้าสู่ระบบ", html: `${expired}${ACC.gate ? `<div class="card" style="text-align:center;margin-bottom:12px"><b style="font-size:17px">สมัครสมาชิกก่อนเริ่มสร้างตัวละคร</b><p class="muted sm" style="margin-top:6px">น้องเกี๊ยวและข้อมูลที่จดไว้จะอยู่กับบัญชีของคุณ ไม่หายเวลาเปลี่ยนมือถือ และใช้ได้ทุกเครื่อง มีบัญชีอยู่แล้วเลือก “เข้าสู่ระบบ”</p></div>` : `<p class="muted sm" style="margin-bottom:12px">สมัครสมาชิกเพื่อใช้ข้อมูลเดียวกันได้ทุกเครื่อง และไม่หายเวลาเปลี่ยนมือถือ</p>`}${err}${form}` };
};
/* gate = true เมื่อเปิดจากหน้าแรกก่อนสร้างตัวละคร: สมัครหรือเข้าสู่ระบบเสร็จแล้วไปขั้นสร้างตัวละครต่อทันที */
ACT.acctopen = () => { const onb = !S.onboarded && !$("#onb").hidden; ACC = { mode: "login", busy: false, err: "", id: ACC.id, gate: onb, pop: onb }; if (onb) openGate(); else openSub("account", {}); };
ACT.accmode = (a) => { const e = $("#aid"); if (e) ACC.id = e.value; ACC.mode = a.dataset.m; ACC.err = ""; ACC.msg = ""; accDraw(); };
function accBusy(b, err) {
  const g = id => { const e = $("#" + id); return e ? e.value : undefined; }, keep = { aid: g("aid"), apw: g("apw"), apw2: g("apw2"), arc: g("arc"), aem: g("aem") };
  ACC.busy = b; ACC.err = err || ""; if (keep.aid !== undefined) ACC.id = keep.aid; accDraw();
  Object.keys(keep).forEach(k => { const e = $("#" + k); if (e && keep[k] !== undefined) e.value = keep[k]; });
}
const accMsg = s => s === 409 ? "ไอดีนี้มีคนใช้แล้ว ลองไอดีอื่น" : s === 401 ? "ไอดีหรือรหัสผ่านไม่ถูกต้อง" : s === 429 ? "ลองผิดหลายครั้ง รอสักครู่ (ประมาณ 15 นาที) แล้วลองใหม่" : s === 0 ? "เชื่อมต่อไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่" : "ทำไม่สำเร็จ ลองอีกครั้งนะ";
async function accReq(path, body) { try { return await syncApi("POST", path, body, true); } catch (e) { return { ok: false, status: 0, j: {} }; } }
ACT.accgo = async () => {
  if (ACC.busy) return; const id = normId($("#aid").value), pw = ($("#apw") || {}).value || "", m = ACC.mode;
  if (!ID_OK(id)) { accBusy(false, "ไอดีใช้ตัวอักษรอังกฤษ ตัวเลข . _ - @ + ยาว 3–40 ตัว"); return; }
  if (pw.length < 8) { accBusy(false, "รหัสผ่านต้องยาวอย่างน้อย 8 ตัว"); return; }
  if (m === "register" && pw !== $("#apw2").value) { accBusy(false, "รหัสผ่านสองช่องไม่ตรงกัน"); return; }
  if (m === "recover" && recCode($("#arc").value).length < 20) { accBusy(false, "ใส่รหัสกู้คืนให้ครบ"); return; }
  const rcIn = m === "recover" ? $("#arc").value : ""; accBusy(true);
  let r, rcNew = null;
  try {
    if (m === "login") r = await accReq("/auth/login", { id, k: await authKey(id, pw) });
    else if (m === "register") { rcNew = newRecovery(); r = await accReq("/auth/register", { id, k: await authKey(id, pw), rk: await recKey(id, rcNew), email: (($("#aem") || {}).value || "").trim() }); }
    else { rcNew = newRecovery(); r = await accReq("/auth/recover", { id, rk: await recKey(id, rcIn), k2: await authKey(id, pw), rk2: await recKey(id, rcNew) }); }
  } catch (e) { accBusy(false, "เครื่องนี้ไม่รองรับการเข้ารหัสที่ต้องใช้ ลองเปิดด้วย Chrome หรือ Safari รุ่นใหม่"); return; }
  if (!r.ok) { accBusy(false, accMsg(r.status)); return; }
  const gate = !!ACC.gate;
  const prev = AUTH; AUTH = { token: r.j.token, exp: r.j.exp, id: r.j.id, em: r.j.em || "", linked: prev && prev.id === r.j.id ? !!prev.linked : false, base: prev && prev.id === r.j.id ? prev.base || 0 : 0 }; authSave(); ACC = { mode: "login", busy: false, err: "" };
  /* ผ่านด่านแล้ว: ถ้าบัญชีนี้มีข้อมูลเดิม applyRemote จะพาเข้าหน้าแรกเอง ถ้าเป็นบัญชีใหม่ไปขั้นสร้างตัวละคร */
  const go = () => { closeModal(); if (subStack.length) closeSub(); syncLink().then(() => { if (m !== "login" && typeof settingsRefresh === "function") settingsRefresh(); if (gate && !S.onboarded && typeof ONB !== "undefined" && ONB && !$("#onb").hidden) { renderOnb(); if (typeof confetti === "function") confetti(); } }); };
  if (rcNew) showRecovery(rcNew, go); else go();
};
function showRecovery(code, next) {
  openModal(`<h2>เก็บรหัสกู้คืนไว้ให้ดี</h2><p class="sm" style="margin:8px 0">ถ้าลืมรหัสผ่าน ใช้รหัสนี้ตั้งรหัสใหม่ได้ แอปแสดงรหัสนี้ครั้งเดียวเท่านั้น</p><div class="reckey" id="reckey">${esc(code)}</div>
<div class="row" style="margin-top:8px"><button class="btn" style="flex:1" data-act="reccopy">คัดลอก</button><button class="btn" style="flex:1" data-act="recsave">บันทึกเป็นไฟล์</button></div>
<label class="row" style="margin-top:12px;gap:10px;align-items:flex-start"><input id="recok" type="checkbox" style="width:22px;height:22px;margin-top:2px"/><span class="sm">ฉันจดหรือเก็บรหัสนี้ไว้แล้ว</span></label>
<button class="btn primary block" style="margin-top:12px" data-act="recnext">ต่อไป</button>`);
  REC_NEXT = next; REC_CODE = code;
}
let REC_NEXT = null, REC_CODE = "";
ACT.reccopy = () => { try { navigator.clipboard.writeText(REC_CODE).then(() => toast("คัดลอกแล้ว"), () => toast("เลือกข้อความแล้ว กดคัดลอกเองได้")); } catch (e) { toast("คัดลอกไม่ได้ จดไว้เองได้เลย"); } };
ACT.recsave = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["Maalot รหัสกู้คืนบัญชี\n" + REC_CODE + "\nเก็บไว้ในที่ปลอดภัย ใช้ตอนลืมรหัสผ่าน\n"], { type: "text/plain" })); a.download = "maalot-recovery.txt"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast("บันทึกไฟล์แล้ว"); };
ACT.recnext = () => { if (!$("#recok").checked) { toast("ติ๊กยืนยันก่อนนะ"); return; } const n = REC_NEXT; REC_NEXT = null; REC_CODE = ""; if (n) n(); };
ACT.syncnow = () => { if (!syncOn()) return; syncNow().then(() => toast(SYNC_ST === "ok" ? "ซิงก์แล้ว" : "ซิงก์ไม่สำเร็จ ลองอีกครั้งนะ")); };
ACT.logout = () => { AUTH = null; authSave(); toast("ออกจากระบบแล้ว ข้อมูลในเครื่องยังอยู่"); if (subStack.length) rerenderSub(); };
ACT.pwchange = () => openModal(`<h2>เปลี่ยนรหัสผ่าน</h2><label class="f" for="pw0">รหัสผ่านเดิม</label><input id="pw0" type="password" autocomplete="current-password"/><label class="f" for="pw1">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</label><input id="pw1" type="password" autocomplete="new-password"/><div class="row" style="margin-top:14px"><button class="btn" style="flex:1" data-act="modalclose">ยกเลิก</button><button class="btn primary" style="flex:1" data-act="pwgo">เปลี่ยน</button></div>`);
ACT.pwgo = async () => {
  const p0 = $("#pw0").value, p1 = $("#pw1").value; if (p1.length < 8) { toast("รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัว"); return; }
  toast("กำลังเปลี่ยนรหัสผ่าน…"); try {
    const r = await syncApi("POST", "/auth/password", { k: await authKey(AUTH.id, p0), k2: await authKey(AUTH.id, p1) });
    if (!r.ok) { toast(r.status === 401 ? "รหัสผ่านเดิมไม่ถูกต้อง" : "ทำไม่สำเร็จ ลองอีกครั้งนะ"); return; }
    AUTH.token = r.j.token; AUTH.exp = r.j.exp; AUTH.expired = false; authSave(); closeModal(); toast("เปลี่ยนรหัสผ่านแล้ว เครื่องอื่นต้องเข้าสู่ระบบใหม่");
  } catch (e) { toast("ทำไม่สำเร็จ ลองอีกครั้งนะ"); }
};
ACT.srvdelask = () => openModal(`<h2>ลบบัญชีและข้อมูลบนเซิร์ฟเวอร์?</h2><p class="muted sm" style="margin:8px 0 10px">บัญชีและข้อมูลที่ซิงก์ไว้จะถูกลบถาวร กู้คืนไม่ได้ ข้อมูลในเครื่องนี้ยังอยู่ ใส่รหัสผ่านเพื่อยืนยัน</p><input id="pwd" type="password" autocomplete="current-password" placeholder="รหัสผ่าน"/><div class="row" style="margin-top:14px"><button class="btn" style="flex:1" data-act="modalclose">ยกเลิก</button><button class="btn danger" style="flex:1" data-act="srvdel">ลบ</button></div>`);
ACT.srvdel = async () => {
  const p = $("#pwd").value; if (!p) { toast("ใส่รหัสผ่านก่อนนะ"); return; } toast("กำลังลบ…");
  try { const r = await syncApi("POST", "/auth/delete", { k: await authKey(AUTH.id, p) }); if (!r.ok) { toast(r.status === 401 ? "รหัสผ่านไม่ถูกต้อง" : "ลบไม่สำเร็จ ลองอีกครั้งนะ"); return; } AUTH = null; authSave(); closeModal(); toast("ลบบัญชีและข้อมูลบนเซิร์ฟเวอร์แล้ว"); rerenderSub(); } catch (e) { toast("ลบไม่สำเร็จ ลองอีกครั้งนะ"); }
};
ACT.accforgot = async () => {
  if (ACC.busy) return; const q = (($("#aid") || {}).value || "").trim().toLowerCase(); if (q.length < 3) { accBusy(false, "ใส่ไอดีหรืออีเมลของบัญชีก่อน"); return; }
  accBusy(true); const r = await accReq("/auth/forgot", { id: q });
  if (!r.ok) { ACC.busy = false; accBusy(false, r.status === 429 ? "ขอบ่อยเกินไป รอสักครู่แล้วลองใหม่" : "ส่งไม่สำเร็จ ลองอีกครั้ง หรือใช้รหัสกู้คืนแทน"); return; }
  ACC.msg = r.j.mail === false ? "ตอนนี้ระบบยังไม่เปิดส่งอีเมล ใช้รหัสกู้คืนด้านล่างแทนนะ" : "ถ้าไอดีหรืออีเมลนี้มีบัญชีและเคยตั้งอีเมลไว้ เราส่งลิงก์ให้แล้ว เช็กอีเมลภายใน 30 นาที (ดูในสแปมด้วย)";
  accBusy(false, "");
};
/* ลิงก์จากอีเมล: https://…/#reset=TOKEN&id=ไอดี */
function resetFromHash() {
  const m = /^#reset=([0-9a-f]{64})&id=(.+)$/.exec(location.hash || ""); if (!m) return;
  let id = ""; try { id = decodeURIComponent(m[2]); } catch (e) { return; } RESET = { token: m[1], id: normId(id) };
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { }
  resetModal("");
}
let RESET = null;
function resetModal(err) {
  openModal(`<h2>ตั้งรหัสผ่านใหม่</h2><p class="muted sm" style="margin:6px 0 10px">บัญชี <b>${esc(RESET.id)}</b></p>${err ? `<div class="hint warnh" style="margin-bottom:10px">${ic("heart", 18)}<span>${esc(err)}</span></div>` : ""}<label class="f" for="rpw">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</label><input id="rpw" type="password" autocomplete="new-password"/><label class="f" for="rpw2">ยืนยันรหัสผ่านใหม่</label><input id="rpw2" type="password" autocomplete="new-password"/><button class="btn primary block" style="margin-top:14px" data-act="pwresetgo">ตั้งรหัสผ่านใหม่</button><button class="linkbtn" style="margin-top:8px" data-act="pwresetcancel">ยกเลิก</button>`);
}
ACT.pwresetcancel = () => { RESET = null; closeModal(); };
ACT.pwresetgo = async () => {
  if (!RESET) return; const p1 = ($("#rpw") || {}).value || "", p2 = ($("#rpw2") || {}).value || "";
  if (p1.length < 8) { resetModal("รหัสผ่านต้องยาวอย่างน้อย 8 ตัว"); return; } if (p1 !== p2) { resetModal("รหัสผ่านสองช่องไม่ตรงกัน"); return; }
  toast("กำลังตั้งรหัสผ่านใหม่…"); let r, rcNew;
  try { rcNew = newRecovery(); r = await accReq("/auth/reset", { token: RESET.token, id: RESET.id, k2: await authKey(RESET.id, p1), rk2: await recKey(RESET.id, rcNew) }); } catch (e) { resetModal("เครื่องนี้ไม่รองรับการเข้ารหัสที่ต้องใช้ ลองเปิดด้วย Chrome หรือ Safari รุ่นใหม่"); return; }
  if (!r.ok) { resetModal(r.status === 410 ? "ลิงก์หมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่จากหน้าเข้าสู่ระบบได้" : accMsg(r.status)); return; }
  const prev = AUTH; AUTH = { token: r.j.token, exp: r.j.exp, id: r.j.id, em: r.j.em || "", linked: prev && prev.id === r.j.id ? !!prev.linked : false, base: prev && prev.id === r.j.id ? prev.base || 0 : 0 }; authSave(); RESET = null;
  showRecovery(rcNew, () => { closeModal(); syncLink().then(() => { if (typeof settingsRefresh === "function") settingsRefresh(); }); toast("ตั้งรหัสผ่านใหม่แล้ว"); });
};
ACT.emailset = () => openModal(`<h2>อีเมลกู้รหัสผ่าน</h2><p class="muted sm" style="margin:6px 0 10px">ใช้รับลิงก์ตั้งรหัสผ่านใหม่ตอนลืมรหัสผ่าน ปัจจุบัน: ${AUTH && AUTH.em ? esc(AUTH.em) : "ยังไม่ได้ตั้ง"}</p><label class="f" for="em1">อีเมลใหม่ (เว้นว่างเพื่อลบ)</label><input id="em1" type="email" autocomplete="email" autocapitalize="none"/><label class="f" for="em2">รหัสผ่านปัจจุบัน</label><input id="em2" type="password" autocomplete="current-password"/><div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="modalclose">ยกเลิก</button><button class="btn primary" style="flex:1" data-act="emailgo">บันทึก</button></div>`);
ACT.emailgo = async () => {
  const em = ($("#em1").value || "").trim(), pw = $("#em2").value; if (!pw) { toast("ใส่รหัสผ่านก่อนนะ"); return; }
  toast("กำลังบันทึก…"); try {
    const r = await syncApi("POST", "/auth/email", { k: await authKey(AUTH.id, pw), email: em });
    if (!r.ok) { toast(r.status === 401 ? "รหัสผ่านไม่ถูกต้อง" : r.status === 409 ? "อีเมลนี้ถูกใช้กับบัญชีอื่นแล้ว" : r.status === 400 ? "รูปแบบอีเมลไม่ถูกต้อง" : "ทำไม่สำเร็จ ลองอีกครั้งนะ"); return; }
    AUTH.em = r.j.em || ""; authSave(); closeModal(); toast(em ? "ตั้งอีเมลแล้ว" : "ลบอีเมลแล้ว"); if (subStack.length) rerenderSub();
  } catch (e) { toast("ทำไม่สำเร็จ ลองอีกครั้งนะ"); }
};
addEventListener("hashchange", resetFromHash); addEventListener("load", () => setTimeout(resetFromHash, 600));
function settingsRefresh() { const t = subStack[subStack.length - 1]; if (t && t.name === "settings") rerenderSub(); }
