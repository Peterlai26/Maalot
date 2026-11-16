/* Maalot push reminders: Cloudflare Worker (fetch + cron). Stores only push subscription + reminder prefs + last meal time. */
const ALLOWED_ORIGINS = ["https://maalot-2jx.pages.dev", "https://peterlai26.github.io", "http://localhost:8765"];
const PUSH_HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
const MSG = [[0, "มื้อเช้าได้จดหรือยังนะ เล่าให้น้องฟังได้เลย"], [10, "มื้อเที่ยงกินอะไรไปบ้างนะ จดไว้สักหน่อยไหม"], [15, "มื้อบ่ายหรือของว่างมีไหม เล่าให้น้องฟังได้นะ"], [17, "มื้อเย็นเป็นยังไงบ้าง มาจดไว้ก่อนลืมนะ"], [20, "ก่อนจบวัน ลองจดสิ่งที่กินวันนี้ให้ครบนะ"]];
const b64u = {
  enc: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  dec: (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0)),
};
const enc = new TextEncoder();
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let p = 0; a.forEach((x) => { o.set(x, p); p += x.length; }); return o; };

/* ---- Web Push: RFC 8291 (aes128gcm) + RFC 8292 (VAPID) ---- */
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, len * 8));
}
export async function encryptPayload(sub, payload, fixed) {
  const uaPub = b64u.dec(sub.keys.p256dh), auth = b64u.dec(sub.keys.auth);
  let asKeys, salt;
  if (fixed) { asKeys = fixed.keys; salt = fixed.salt; } else { asKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]); salt = crypto.getRandomValues(new Uint8Array(16)); }
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", asKeys.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asKeys.privateKey, 256));
  const ikm = await hkdf(auth, shared, cat(enc.encode("WebPush: info\0"), uaPub, asPub), 32);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, cat(enc.encode(payload), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]);
  return { body: cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct), cek, nonce };
}
async function vapidHeader(env, endpoint) {
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = b64u.enc(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64u.enc(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT || "https://maalot-2jx.pages.dev" })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(head + "." + claims)));
  return "vapid t=" + head + "." + claims + "." + b64u.enc(sig) + ", k=" + env.VAPID_PUBLIC;
}
async function sendPush(env, sub, payload) {
  const { body } = await encryptPayload(sub, JSON.stringify(payload));
  return fetch(sub.endpoint, { method: "POST", headers: { Authorization: await vapidHeader(env, sub.endpoint), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "3600", Urgency: "normal" }, body });
}

/* ---- schedule: slots = start + k*everyH inside [start, end] in the user's local time ---- */
const hm = (s) => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ""); return m ? Math.min(1439, +m[1] * 60 + +m[2]) : null; };
export function slotsOf(p) {
  const st = hm(p.start), en = hm(p.end), every = Math.round(p.everyH * 60);
  if (st === null || en === null || !(every >= 60 && every <= 720) || en < st) return [];
  const out = []; for (let t = st; t <= en; t += every) out.push(t); return out;
}
export function dueSlot(p, now) {
  const local = new Date(now + p.tzOff * 60000), day = local.toISOString().slice(0, 10), min = local.getUTCHours() * 60 + local.getUTCMinutes();
  for (const s of slotsOf(p)) if (min >= s && min < s + 35) return { key: day + "|" + s, hour: Math.floor(s / 60) };
  return null;
}
const msgFor = (h) => { let m = MSG[0][1]; MSG.forEach((x) => { if (h >= x[0]) m = x[1]; }); return m; };

async function sha(s) { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join(""); }
function cors(req, extra) {
  const o = req.headers.get("Origin"), h = { "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400", Vary: "Origin", ...extra };
  if (ALLOWED_ORIGINS.includes(o)) h["Access-Control-Allow-Origin"] = o; return h;
}
const J = (req, obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: cors(req, { "Content-Type": "application/json" }) });
function cleanPrefs(p) {
  const every = Number(p && p.everyH), st = hm(p && p.start), en = hm(p && p.end), tz = Number(p && p.tzOff);
  if (![1, 2, 3, 4, 6, 8, 12].includes(every) || st === null || en === null || en < st || !(tz >= -840 && tz <= 840)) return null;
  return { everyH: every, start: p.start, end: p.end, tzOff: Math.round(tz) };
}
const okEndpoint = (e) => { try { const u = new URL(e); return u.protocol === "https:" && PUSH_HOSTS.some((r) => r.test(u.hostname)) && e.length < 1000; } catch (_) { return false; } };


/* ---- Google sign-in (ID token) + stateless session + per-user sync blob ---- */
const GOOGLE_CERTS = "https://www.googleapis.com/oauth2/v3/certs";
const SESSION_TTL = 30 * 86400;
const MAX_SYNC_BYTES = 2 * 1024 * 1024;
const strB64u = (str) => b64u.enc(enc.encode(str));
const jsonB64u = (s) => JSON.parse(new TextDecoder().decode(b64u.dec(s)));
export async function verifyGoogleIdToken(idToken, env, certsFetcher) {
  if (!env.GOOGLE_CLIENT_ID) throw new Error("not configured");
  const parts = String(idToken || "").split("."); if (parts.length !== 3) throw new Error("bad token");
  const head = jsonB64u(parts[0]), claims = jsonB64u(parts[1]);
  if (head.alg !== "RS256" || !head.kid) throw new Error("bad alg");
  const certs = await (certsFetcher || (() => fetch(GOOGLE_CERTS, { cf: { cacheTtl: 3600, cacheEverything: true } }).then((r) => r.json())))();
  const jwk = (certs.keys || []).find((k) => k.kid === head.kid); if (!jwk) throw new Error("unknown key");
  const key = await crypto.subtle.importKey("jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u.dec(parts[2]), enc.encode(parts[0] + "." + parts[1]));
  if (!ok) throw new Error("bad signature");
  const now = Math.floor(Date.now() / 1000);
  if (!["accounts.google.com", "https://accounts.google.com"].includes(claims.iss)) throw new Error("bad iss");
  if (claims.aud !== env.GOOGLE_CLIENT_ID) throw new Error("bad aud");
  if (!(claims.exp > now)) throw new Error("expired");
  if (claims.email_verified !== true && claims.email_verified !== "true") throw new Error("email not verified");
  if (typeof claims.sub !== "string" || !claims.sub) throw new Error("no sub");
  return claims;
}
async function hmacKey(env) { if (!env.SESSION_SECRET) throw new Error("no secret"); return crypto.subtle.importKey("raw", enc.encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }
export async function signSession(sub, env, now) {
  const exp = Math.floor((now || Date.now()) / 1000) + SESSION_TTL, body = strB64u(JSON.stringify({ sub, exp }));
  return body + "." + b64u.enc(await crypto.subtle.sign("HMAC", await hmacKey(env), enc.encode(body)));
}
export async function verifySession(token, env, now) {
  const [body, sig] = String(token || "").split("."); if (!body || !sig) return null;
  let ok = false; try { ok = await crypto.subtle.verify("HMAC", await hmacKey(env), b64u.dec(sig), enc.encode(body)); } catch (_) { return null; }
  if (!ok) return null; const c = jsonB64u(body); return c.exp > Math.floor((now || Date.now()) / 1000) && typeof c.sub === "string" ? c : null;
}
async function handleAccount(req, env, url) {
  if (url.pathname === "/auth/google" && req.method === "POST") {
    let b; try { b = JSON.parse(await req.text()); } catch (_) { return J(req, { error: "bad json" }, 400); }
    try {
      const c = await verifyGoogleIdToken(b.credential, env);
      return J(req, { token: await signSession(c.sub, env), exp: Math.floor(Date.now() / 1000) + SESSION_TTL, email: c.email || "", name: c.name || "" });
    } catch (e) { return J(req, { error: "unauthorized" }, 401); }
  }
  if (url.pathname === "/sync") {
    const m = /^Bearer (.+)$/.exec(req.headers.get("Authorization") || ""); const sess = m ? await verifySession(m[1], env) : null;
    if (!sess) return J(req, { error: "unauthorized" }, 401);
    const key = "d:" + await sha(sess.sub);
    if (req.method === "GET") { const rec = JSON.parse((await env.SUBS.get(key)) || "null"); return J(req, rec ? { upd: rec.upd, data: rec.data } : { upd: 0, data: null }); }
    if (req.method === "DELETE") { await env.SUBS.delete(key); return J(req, { ok: true }); }
    if (req.method === "PUT") {
      const t = await req.text(); if (t.length > MAX_SYNC_BYTES) return J(req, { error: "too large" }, 413);
      let b; try { b = JSON.parse(t); } catch (_) { return J(req, { error: "bad json" }, 400); }
      if (!b || typeof b.data !== "object" || b.data === null || Array.isArray(b.data) || typeof b.data.v !== "number") return J(req, { error: "bad data" }, 400);
      const cur = JSON.parse((await env.SUBS.get(key)) || "null"), curUpd = cur ? cur.upd : 0;
      if ((b.base || 0) !== curUpd) return J(req, { error: "conflict", upd: curUpd, data: cur && cur.data }, 409);
      const upd = Date.now(); await env.SUBS.put(key, JSON.stringify({ upd, data: b.data })); return J(req, { ok: true, upd });
    }
  }
  return null;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    if (!ALLOWED_ORIGINS.includes(req.headers.get("Origin"))) return new Response("forbidden", { status: 403 });
    if (req.method === "GET" && url.pathname === "/vapid") return J(req, { key: env.VAPID_PUBLIC });
    if (url.pathname === "/auth/google" || url.pathname === "/sync") { const r = await handleAccount(req, env, url); if (r) return r; }
    if (req.method !== "POST") return J(req, { error: "not found" }, 404);
    let b; try { const t = await req.text(); if (t.length > 4000) throw 0; b = JSON.parse(t); } catch (_) { return J(req, { error: "bad json" }, 400); }
    const ep = b.sub ? b.sub.endpoint : b.endpoint;
    if (!okEndpoint(ep)) return J(req, { error: "bad endpoint" }, 400);
    const key = "s:" + await sha(ep);
    if (url.pathname === "/subscribe") {
      const k = b.sub.keys || {}, prefs = cleanPrefs(b.prefs);
      if (typeof k.p256dh !== "string" || typeof k.auth !== "string" || !prefs) return J(req, { error: "bad subscription" }, 400);
      const old = JSON.parse((await env.SUBS.get(key)) || "null") || {};
      await env.SUBS.put(key, JSON.stringify({ sub: { endpoint: ep, keys: { p256dh: k.p256dh, auth: k.auth } }, ...prefs, lastMeal: old.lastMeal || 0, lastSlot: old.lastSlot || "" }), { expirationTtl: 60 * 86400 });
      return J(req, { ok: true });
    }
    if (url.pathname === "/unsubscribe") { await env.SUBS.delete(key); return J(req, { ok: true }); }
    if (url.pathname === "/ping") {
      const r = JSON.parse((await env.SUBS.get(key)) || "null"); if (!r) return J(req, { ok: false }, 404);
      r.lastMeal = Date.now(); await env.SUBS.put(key, JSON.stringify(r), { expirationTtl: 60 * 86400 }); return J(req, { ok: true });
    }
    if (url.pathname === "/test") {
      const r = JSON.parse((await env.SUBS.get(key)) || "null"); if (!r) return J(req, { ok: false }, 404);
      const res = await sendPush(env, r.sub, { title: "Maalot (มาลด)", body: "ทดสอบเตือนจาก Maalot สำเร็จ" }); return J(req, { ok: res.ok, status: res.status });
    }
    return J(req, { error: "not found" }, 404);
  },
  async scheduled(_evt, env) {
    const now = Date.now(); let cursor;
    do {
      const page = await env.SUBS.list({ prefix: "s:", cursor }); cursor = page.list_complete ? undefined : page.cursor;
      for (const k of page.keys) {
        const r = JSON.parse((await env.SUBS.get(k.name)) || "null"); if (!r) continue;
        const due = dueSlot(r, now); if (!due || r.lastSlot === due.key) continue;
        r.lastSlot = due.key;
        if (now - (r.lastMeal || 0) >= 60 * 60000) {
          try {
            const res = await sendPush(env, r.sub, { title: "Maalot (มาลด)", body: msgFor(due.hour) });
            if (res.status === 404 || res.status === 410) { await env.SUBS.delete(k.name); continue; }
          } catch (_) { }
        }
        await env.SUBS.put(k.name, JSON.stringify(r), { expirationTtl: 60 * 86400 });
      }
    } while (cursor);
  },
};
