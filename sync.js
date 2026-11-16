/* บัญชี Google + ซิงก์ข้ามเครื่อง ผ่าน Cloudflare Worker (maalot-push) */
const SYNC_API = "https://maalot-push.maalot.workers.dev";
const GOOGLE_CLIENT_ID = ""; // ใส่ Client ID ของ Google (ค่าสาธารณะ) เพื่อเปิดใช้ระบบบัญชี
const SYNC_SKIP = ["rem", "mode"]; // ค่าของแต่ละเครื่อง ไม่ซิงก์

/* ---------- ตัวรวมข้อมูล (ไม่ผูกกับหน้าจอ) ---------- */
function stableJson(o) {
  if (o === null || typeof o !== "object") return JSON.stringify(o === undefined ? null : o);
  if (Array.isArray(o)) return "[" + o.map(stableJson).join(",") + "]";
  return "{" + Object.keys(o).sort().map(k => JSON.stringify(k) + ":" + stableJson(o[k])).join(",") + "}";
}
function syncStrip(s) { const o = JSON.parse(JSON.stringify(s || {})); SYNC_SKIP.forEach(k => delete o[k]); return o; }
function hasUserData(s) { return !!(s && s.onboarded && ((s.meals || []).length || (s.works || []).length || (s.weights || []).length)); }
function syncMerge(a, b) {
  a = a || {}; b = b || {};
  const newer = (a.upd || 0) >= (b.upd || 0) ? a : b, older = newer === a ? b : a, out = Object.assign({}, older, newer);
  SYNC_SKIP.forEach(k => { if (a[k] !== undefined) out[k] = a[k]; else delete out[k]; });
  const cr = [a.created, b.created].filter(Boolean); if (cr.length) out.created = Math.min.apply(null, cr);
  out.onboarded = !!(a.onboarded || b.onboarded);
  out.nights = Math.max(a.nights || 0, b.nights || 0); out.coins = Math.max(a.coins || 0, b.coins || 0);
  out.upd = Math.max(a.upd || 0, b.upd || 0);
  const del = Object.assign({}, b.del || {}); Object.keys(a.del || {}).forEach(k => { del[k] = Math.max(del[k] || 0, a.del[k]); }); out.del = del;
  const byId = (la, lb, pre) => {
    const m = {}; (lb || []).concat(la || []).forEach(x => { if (x && x.id !== undefined) m[x.id] = x; });
    const aIds = new Set((la || []).map(x => x && x.id)); (lb || []).forEach(x => { if (x && aIds.has(x.id) && newer === b) m[x.id] = x; });
    return Object.keys(m).map(k => m[k]).filter(x => !del[pre + x.id]).sort((p, q) => (p.d || "") < (q.d || "") ? -1 : (p.d || "") > (q.d || "") ? 1 : (p.t || "") < (q.t || "") ? -1 : (p.t || "") > (q.t || "") ? 1 : String(p.id) < String(q.id) ? -1 : 1);
  };
  out.meals = byId(a.meals, b.meals, "m:"); out.works = byId(a.works, b.works, "k:");
  const byDate = (la, lb, pre) => {
    const m = {}; (lb || []).concat(la || []).forEach(x => { if (!x || !x.d) return; const o = m[x.d]; if (!o || (x.t || 0) > (o.t || 0)) m[x.d] = x; });
    return Object.keys(m).map(k => m[k]).filter(x => !(pre && del[pre + x.d] && del[pre + x.d] >= (x.t || 0))).sort((p, q) => p.d < q.d ? -1 : 1);
  };
  out.weights = byDate(a.weights, b.weights, "wt:"); out.waist = byDate(a.waist, b.waist, "");
  const maxMap = (x, y) => { const o = Object.assign({}, y || {}); Object.keys(x || {}).forEach(k => { o[k] = typeof x[k] === "number" && typeof o[k] === "number" ? Math.max(x[k], o[k]) : (o[k] === undefined ? x[k] : o[k]); }); return o; };
  out.water = maxMap(a.water, b.water); out.coinLog = maxMap(a.coinLog, b.coinLog);
  out.sleep = Object.assign({}, older.sleep || {}, newer.sleep || {});
  ["claimed", "owned", "shop", "medals"].forEach(k => { const o = Object.assign({}, b[k] || {}); Object.keys(a[k] || {}).forEach(x => { if (a[k][x]) o[x] = o[x] && typeof o[x] === "number" && typeof a[k][x] === "number" ? Math.min(o[x], a[k][x]) : a[k][x]; }); out[k] = o; });
  const sa = a.streak || {}, sb = b.streak || {}, sl = (sa.last || "") >= (sb.last || "") ? sa : sb; out.streak = Object.assign({}, sl, { best: Math.max(sa.best || 0, sb.best || 0) });
  return out;
}

/* ---------- เซสชัน ---------- */
const AUTHK = "maalot_auth";
let AUTH = null, SYNCING = false, SYNC_AGAIN = false, SYNC_T = null, SYNC_ST = "idle", SYNC_LASTPUSH = 0;
function authLoad() { try { AUTH = JSON.parse(localStorage.getItem(AUTHK) || "null"); } catch (e) { AUTH = null; } if (AUTH && AUTH.exp * 1000 < Date.now()) AUTH.expired = true; }
function authSave() { try { if (AUTH) localStorage.setItem(AUTHK, JSON.stringify(AUTH)); else localStorage.removeItem(AUTHK); } catch (e) { } }
const syncOn = () => !!(GOOGLE_CLIENT_ID && AUTH && AUTH.token && !AUTH.expired && AUTH.linked);
const loggedIn = () => !!(AUTH && AUTH.token && !AUTH.expired);
async function syncApi(method, path, body, noAuth) {
  const h = { "Content-Type": "application/json" }; if (!noAuth && AUTH) h.Authorization = "Bearer " + AUTH.token;
  const r = await fetch(SYNC_API + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json().catch(() => ({})); if (r.status === 401 && !noAuth && AUTH) { AUTH.expired = true; authSave(); setSyncSt("expired"); }
  return { ok: r.ok, status: r.status, j };
}
function setSyncSt(st) { SYNC_ST = st; const el = $("#syncacct"); if (el) el.innerHTML = acctStatusHTML(); }
function applyRemote(obj) {
  const keep = {}; SYNC_SKIP.forEach(k => { if (S[k] !== undefined) keep[k] = S[k]; });
  S = merge(Object.assign({}, obj, keep)); persistLocal(); applyTheme();
  if (S.onboarded && $("#app").hidden) { $("#onb").hidden = true; $("#onb").innerHTML = ""; $("#app").hidden = false; $(".nav").hidden = false; show("home"); }
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
function syncSoon() { if (!syncOn()) return; clearTimeout(SYNC_T); SYNC_T = setTimeout(syncNow, Math.max(20000, 45000 - (Date.now() - SYNC_LASTPUSH))); }
function startSync() {
  authLoad();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") syncNow(); else if (syncOn()) { clearTimeout(SYNC_T); syncNow(); } });
  addEventListener("online", () => syncNow());
  if (syncOn()) syncNow();
}

/* ---------- เข้าสู่ระบบด้วย Google ---------- */
let GSI_P = null;
function loadGsi() {
  if (window.google && google.accounts && google.accounts.id) return Promise.resolve();
  return GSI_P || (GSI_P = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.onload = res; s.onerror = () => { GSI_P = null; rej(new Error("gsi")); }; document.head.appendChild(s); }));
}
function acctRenderBtn() {
  const boxes = Array.from(document.querySelectorAll(".gbtn")).filter(el => el.offsetParent !== null && !el.firstChild); if (!boxes.length || !GOOGLE_CLIENT_ID) return;
  loadGsi().then(() => {
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleCredential, ux_mode: "popup", auto_select: false });
    boxes.forEach(box => google.accounts.id.renderButton(box, { theme: "outline", size: "large", shape: "pill", text: "signin_with", locale: "th", width: Math.min(300, box.clientWidth || 280) }));
  }).catch(() => { boxes.forEach(box => { box.innerHTML = '<span class="xs muted">โหลดปุ่มของ Google ไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่</span>'; }); });
}
async function onGoogleCredential(resp) {
  try {
    const r = await syncApi("POST", "/auth/google", { credential: resp.credential }, true);
    if (!r.ok) { toast("เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้งนะ"); return; }
    AUTH = { token: r.j.token, exp: r.j.exp, email: r.j.email || "", name: r.j.name || "", linked: false, base: 0 }; authSave();
    await syncLink();
  } catch (e) { toast("เข้าสู่ระบบไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่"); }
}
const dayCount = s => new Set((s.meals || []).map(m => m.d)).size;
async function syncLink() {
  const g = await syncApi("GET", "/sync"); if (!g.ok) { toast("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ"); return; }
  const remote = g.j.data, rupd = g.j.upd || 0, lh = hasUserData(S), rh = hasUserData(remote);
  const done = (msg) => { AUTH.linked = true; AUTH.base = rupd; authSave(); toast(msg); const t = subStack[subStack.length - 1]; if (t && t.name === "settings") rerenderSub(); syncNow(); };
  if (!remote || (!lh && !rh)) { done("เข้าสู่ระบบแล้ว"); return; }
  if (!lh && rh) { applyRemote(remote); done("ดึงข้อมูลจากบัญชีแล้ว"); return; }
  if (lh && !rh) { done("เข้าสู่ระบบแล้ว กำลังส่งข้อมูลขึ้นบัญชี"); return; }
  const mj = stableJson(syncStrip(syncMerge(S, remote)));
  if (mj === stableJson(syncStrip(remote)) || mj === stableJson(syncStrip(S))) { done("เข้าสู่ระบบแล้ว"); return; } // ฝั่งหนึ่งครอบคลุมอีกฝั่งอยู่แล้ว ไม่ต้องถาม
  openModal(`<h2>พบข้อมูลทั้งสองที่</h2><p class="muted" style="margin:8px 0 14px">ในเครื่องนี้ ${dayCount(S)} วันที่จดอาหาร · ในบัญชี ${dayCount(remote)} วัน</p>
<button class="btn primary block" data-act="lkmerge">รวมข้อมูลทั้งสองที่ (แนะนำ)</button>
<button class="btn block" style="margin-top:8px" data-act="lkremote">ใช้ข้อมูลของบัญชี แทนที่เครื่องนี้</button>
<button class="btn block" style="margin-top:8px" data-act="lklocal">ใช้ข้อมูลของเครื่องนี้ แทนที่บัญชี</button>`);
  SYNC_LINK = { remote, rupd, done };
}
let SYNC_LINK = null;
ACT.lkmerge = () => { closeModal(); if (SYNC_LINK) SYNC_LINK.done("รวมข้อมูลแล้ว"); };
ACT.lkremote = () => { closeModal(); if (!SYNC_LINK) return; applyRemote(SYNC_LINK.remote); SYNC_LINK.done("ใช้ข้อมูลของบัญชีแล้ว"); };
ACT.lklocal = async () => {
  closeModal(); if (!SYNC_LINK) return; const L = SYNC_LINK; AUTH.linked = true; authSave();
  const p = await syncApi("PUT", "/sync", { data: syncStrip(S), base: L.rupd }); if (p.ok) { AUTH.base = p.j.upd; authSave(); toast("ใช้ข้อมูลของเครื่องนี้แล้ว"); setSyncSt("ok"); } else toast("อัปโหลดไม่สำเร็จ ลองอีกครั้งนะ");
};
ACT.syncnow = () => { if (!syncOn()) return; syncNow().then(() => toast(SYNC_ST === "ok" ? "ซิงก์แล้ว" : "ซิงก์ไม่สำเร็จ ลองอีกครั้งนะ")); };
ACT.logout = () => { AUTH = null; authSave(); try { if (window.google && google.accounts) google.accounts.id.disableAutoSelect(); } catch (e) { } toast("ออกจากระบบแล้ว ข้อมูลในเครื่องยังอยู่"); rerenderSub(); };
ACT.srvdelask = () => openModal(`<h2>ลบข้อมูลบนเซิร์ฟเวอร์?</h2><p class="muted" style="margin:8px 0 14px">ข้อมูลที่ซิงก์ไว้บนเซิร์ฟเวอร์จะถูกลบถาวร และออกจากระบบ ข้อมูลในเครื่องนี้ยังอยู่</p><div class="row"><button class="btn" style="flex:1" data-act="modalclose">ยกเลิก</button><button class="btn danger" style="flex:1" data-act="srvdel">ลบ</button></div>`);
ACT.srvdel = async () => { closeModal(); const r = await syncApi("DELETE", "/sync"); if (r.ok) { AUTH = null; authSave(); toast("ลบข้อมูลบนเซิร์ฟเวอร์แล้ว"); rerenderSub(); } else toast("ลบไม่สำเร็จ ลองอีกครั้งนะ"); };

/* ---------- หน้าตั้งค่า ---------- */
function acctStatusHTML() {
  if (!AUTH) return "";
  const t = AUTH.last ? new Date(AUTH.last).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "";
  const m = { syncing: "กำลังซิงก์…", ok: "ซิงก์ล่าสุด " + t, error: "ซิงก์ไม่สำเร็จ จะลองใหม่เอง", offline: "ออฟไลน์ จะซิงก์เมื่อมีอินเทอร์เน็ต", expired: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง", idle: AUTH.last ? "ซิงก์ล่าสุด " + t : "รอซิงก์" };
  return `<span class="xs muted">${m[AUTH.expired ? "expired" : SYNC_ST] || ""}</span>`;
}
function acctHTML() {
  if (!GOOGLE_CLIENT_ID) return "";
  const note = `<p class="xs muted" style="margin-top:8px">ข้อมูลที่ซิงก์ (อาหาร ออกกำลังกาย น้ำหนัก ฯลฯ) จะถูกเก็บบนเซิร์ฟเวอร์ของ Maalot (Cloudflare) ผู้ดูแลระบบเข้าถึงได้ในทางเทคนิค แอปเก็บเฉพาะรหัสบัญชี Google ไม่เก็บอีเมล และลบข้อมูลบนเซิร์ฟเวอร์ได้ทุกเมื่อ</p>`;
  if (loggedIn()) return `<div class="sec">บัญชีและซิงก์</div><div class="card"><div class="row between"><b>${esc(AUTH.email || AUTH.name || "บัญชี Google")}</b><span id="syncacct">${acctStatusHTML()}</span></div>
<div class="row" style="margin-top:10px"><button class="btn" style="flex:1" data-act="syncnow">ซิงก์ตอนนี้</button><button class="btn" style="flex:1" data-act="logout">ออกจากระบบ</button></div>
<button class="btn danger block" style="margin-top:8px" data-act="srvdelask">ลบข้อมูลบนเซิร์ฟเวอร์</button></div>${note}`;
  return `<div class="sec">บัญชีและซิงก์</div><div class="card"><p class="sm">${AUTH && AUTH.expired ? "เซสชันหมดอายุ เข้าสู่ระบบอีกครั้งเพื่อซิงก์ต่อ" : "เข้าสู่ระบบด้วย Google เพื่อใช้ข้อมูลเดียวกันได้ทุกเครื่อง และไม่หายเมื่อเปลี่ยนเครื่อง"}</p><div class="gbtn" style="margin-top:10px;min-height:44px;display:flex;justify-content:center"></div></div>${note}<p class="xs muted" style="margin-top:4px">ปุ่มด้านบนโหลดจาก Google</p>`;
}
function acctAfter() { if (!loggedIn()) acctRenderBtn(); }
