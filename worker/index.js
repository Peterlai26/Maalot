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
  const o = req.headers.get("Origin"), h = { "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin", ...extra };
  if (ALLOWED_ORIGINS.includes(o)) h["Access-Control-Allow-Origin"] = o; return h;
}
const J = (req, obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: cors(req, { "Content-Type": "application/json" }) });
function cleanPrefs(p) {
  const every = Number(p && p.everyH), st = hm(p && p.start), en = hm(p && p.end), tz = Number(p && p.tzOff);
  if (![1, 2, 3, 4, 6, 8, 12].includes(every) || st === null || en === null || en < st || !(tz >= -840 && tz <= 840)) return null;
  return { everyH: every, start: p.start, end: p.end, tzOff: Math.round(tz) };
}
const okEndpoint = (e) => { try { const u = new URL(e); return u.protocol === "https:" && PUSH_HOSTS.some((r) => r.test(u.hostname)) && e.length < 1000; } catch (_) { return false; } };


/* ---------- ประเมินแคลอรี่ด้วย Claude (รูปหรือข้อความ) ---------- */
const EST_MODEL = "claude-haiku-5-5", EST_PER_IP = 30, EST_GLOBAL = 600;
const CF_VISION = ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct", "@cf/meta/llama-3.2-11b-vision-instruct", "@cf/llava-hf/llava-1.5-7b-hf"];
const CF_TEXT = ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/google/gemma-3-12b-it", "@cf/meta/llama-3.1-8b-instruct-fast", "@cf/meta/llama-3.2-3b-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
const b64bytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
/* Workers AI (ฟรีตามโควตารายวันของ Cloudflare): ลองโมเดลตามลำดับ ข้ามตัวที่เลิกให้บริการแล้ว */
async function cfAI(env, task, img, mime) {
  const txt = (r) => (r && (typeof r.response === "string" ? r.response : r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content) || r.description) || "";
  const tried = [];
  for (const model of img ? CF_VISION : CF_TEXT) {
    try {
      let r;
      if (img && model.includes("llava")) r = await env.AI.run(model, { image: [...b64bytes(img)], prompt: task, max_tokens: 500 });
      else {
        const content = img ? [{ type: "text", text: task }, { type: "image_url", image_url: { url: "data:" + mime + ";base64," + img } }] : task;
        const call = () => env.AI.run(model, { messages: [{ role: "user", content }], max_tokens: 500 });
        try { r = await call(); } catch (e) { if (/agree|5016|license/i.test(String(e && e.message))) { await env.AI.run(model, { prompt: "agree" }); r = await call(); } else throw e; }
      }
      const t = txt(r); if (t) return { out: t, model };
      tried.push(model + ": empty");
    } catch (e) { tried.push(model + ": " + String((e && e.message) || e).slice(0, 90)); if (/neuron|quota|10000|4006|limit/i.test(String(e && e.message))) break; }
  }
  const err = new Error("all failed"); err.tried = tried; throw err;
}
const NUM_KEYS = [["protein", 500], ["carb", 500], ["fat", 500], ["fiber", 200], ["sugar", 500], ["sodium", 20000]];
const FMT = ' ตอบเป็น JSON array เท่านั้น ไม่มีข้อความอื่น รูปแบบ [{"name":"ชื่อภาษาไทยสั้นๆ","kcal":ตัวเลข,"protein":กรัม,"carb":กรัม,"fat":กรัม,"fiber":กรัม,"sugar":กรัม,"sodium":มิลลิกรัม}] ค่าทั้งหมดเป็นของ 1 รายการตามปริมาณที่ระบุหรือ 1 เสิร์ฟปกติ ถ้าไม่แน่ใจให้ประเมินแบบกลางๆ';
async function estimate(req, env) {
  if (!env.ANTHROPIC_API_KEY && !env.AI) return J(req, { error: "not_configured" }, 503);
  let b; try { const t = await req.text(); if (t.length > 2500000) throw 0; b = JSON.parse(t); } catch (_) { return J(req, { error: "bad json" }, 400); }
  const text = typeof b.text === "string" ? b.text.trim().slice(0, 300) : "", img = typeof b.image === "string" ? b.image : "";
  const list = Array.isArray(b.list) ? b.list.slice(0, 8).filter((f) => f && typeof f.n === "string" && f.n.trim()).map((f) => ({ n: f.n.trim().slice(0, 40), u: typeof f.u === "string" ? f.u.slice(0, 12) : "", r: Array.isArray(f.r) ? f.r.slice(0, 3).filter((x) => x && typeof x.n === "string").map((x) => ({ n: x.n.slice(0, 40), k: Math.max(0, Math.min(5000, Math.round(+x.k || 0))) })) : [] })) : [];
  const foods = Array.isArray(b.foods) ? b.foods.slice(0, 12).filter((f) => f && typeof f.n === "string").map((f) => ({ n: f.n.slice(0, 40), k: Math.max(0, Math.min(5000, Math.round(+f.k || 0))) })) : [];
  const mime = ["image/jpeg", "image/png", "image/webp"].includes(b.mime) ? b.mime : "image/jpeg";
  if (!text && !img && !foods.length && !list.length) return J(req, { error: "empty" }, 400);
  if (img && (img.length > 2000000 || !/^[A-Za-z0-9+/=]+$/.test(img))) return J(req, { error: "bad image" }, 400);
  const day = new Date().toISOString().slice(0, 10), ip = req.headers.get("CF-Connecting-IP") || "x", kIp = "rl:" + day + ":" + (await sha(ip)).slice(0, 16), kAll = "rlg:" + day;
  const [nIp, nAll] = await Promise.all([env.SUBS.get(kIp), env.SUBS.get(kAll)]);
  if ((+nAll || 0) >= EST_GLOBAL) return J(req, { error: "busy" }, 429);
  if ((+nIp || 0) >= EST_PER_IP) return J(req, { error: "limit" }, 429);
  /* นับรวมทั้งระบบแบบสุ่ม (เขียน KV น้อยลง ไม่ให้เกินโควตาเขียนฟรีต่อวัน) */
  await env.SUBS.put(kIp, String((+nIp || 0) + 1), { expirationTtl: 172800 });
  if (Math.random() < 0.2) await env.SUBS.put(kAll, String((+nAll || 0) + 5), { expirationTtl: 172800 });
  const label = b.label === true && !!img;
  let task;
  if (list.length) task = "คุณคือผู้ช่วยประเมินโภชนาการอาหาร (เน้นอาหารไทยและอาหารที่คนไทยกิน) ให้ข้อมูลของแต่ละรายการต่อไปนี้ ตามลำดับเดิม ห้ามข้ามรายการ:\n" + list.map((f, i) => `${i + 1}. ${f.n} (ต่อ ${f.u ? "1 " + f.u : "1 เสิร์ฟปกติ"})${f.r.length ? " [เมนูใกล้เคียงในฐานข้อมูลสำหรับเทียบขนาดเสิร์ฟ: " + f.r.map((x) => x.n + " = " + x.k + " kcal").join(", ") + "]" : ""}`).join("\n") + `\nกติกา:\n- ชื่ออาจพิมพ์ผิดหรือสะกดไม่ครบ ให้เดาว่าคืออาหารอะไร แล้วแก้เป็นชื่อที่ถูกต้องใน name (ไม่ต้องใส่จำนวนหรือหน่วย)\n- ค่าทั้งหมดเป็นของ 1 หน่วยที่ระบุ ไม่ต้องคูณจำนวน ถ้าไม่ระบุหน่วยให้ใช้ 1 เสิร์ฟปกติ\n- serving คือคำอธิบายหน่วยที่ใช้คิด เช่น "1 ซองกลาง 48 ก." "1 ชาม" "1 ชิ้น"\n- conf เป็น "สูง" ถ้ามั่นใจว่ารู้จักอาหารนี้และขนาดเสิร์ฟ เป็น "ต่ำ" ถ้าเดา\n- pack เป็น true ถ้าเป็นขนมหรือเครื่องดื่มบรรจุซองหรือขวดที่มีฉลากโภชนาการ\n- ขนาดอ้างอิงเพื่อให้ตัวเลขสมเหตุสมผล: มันฝรั่งทอดกรอบ 1 ซองกลาง 48 ก. = 257 kcal, ช็อกโกแลตแท่ง 45 ก. = 240 kcal, ผัดไทย 1 จาน = 650 kcal, ราเมง 1 ชาม = 500 kcal, ไก่ทอด 1 ชิ้น = 270 kcal, ชานมไข่มุก 1 แก้ว = 400 kcal, ข้าวสวย 1 จาน = 200 kcal\nตอบเป็น JSON array เท่านั้น ไม่มีข้อความอื่น รูปแบบ [{"name":"ชื่อ","serving":"1 ...","conf":"สูง","pack":false,"kcal":ตัวเลข,"protein":กรัม,"carb":กรัม,"fat":กรัม,"fiber":กรัม,"sugar":กรัม,"sodium":มิลลิกรัม}]`;
  else if (label) task = 'นี่คือรูปฉลากโภชนาการ (ด้านหลังซองอาหาร) ให้อ่านค่าจากตาราง "ข้อมูลโภชนาการ" ตามที่เขียนไว้จริง ห้ามเดา ถ้าอ่านค่าไหนไม่ได้ให้ใส่ null ตอบเป็น JSON object เดียวเท่านั้น รูปแบบ {"name":"ชื่อสินค้าถ้าเห็น","servingsPerPack":จำนวนหน่วยบริโภคต่อซอง,"kcal":พลังงานต่อ 1 หน่วยบริโภค (กิโลแคลอรี),"protein":กรัม,"carb":กรัม,"fat":กรัม,"fiber":กรัม,"sugar":กรัม,"sodium":มิลลิกรัม} ค่าทั้งหมดเป็นต่อ 1 หน่วยบริโภค';
  else if (foods.length) task = "ให้ข้อมูลโภชนาการต่อ 1 เสิร์ฟของอาหารต่อไปนี้ ตามลำดับเดิมและใช้ชื่อเดิมทุกชื่อ (ค่า kcal ในวงเล็บเป็นค่าอ้างอิงที่ควรใกล้เคียง):\n" + foods.map((f, i) => `${i + 1}. ${f.n} (${f.k} kcal)`).join("\n") + "\n" + FMT;
  else if (img) task = "ดูรูปอาหารที่แนบมา แล้วแยกเป็นแต่ละรายการที่เห็น ประเมินโภชนาการตามปริมาณในรูป ถ้าไม่ใช่อาหารให้ตอบ []." + FMT;
  else task = "ผู้ใช้พิมพ์บอกว่ากินอะไรมา: \"" + text + "\"\nข้อความอาจพิมพ์ผิด สะกดไม่ครบ ใช้คำย่อ หรือเป็นอาหารจากต่างประเทศ ให้เดาว่าหมายถึงอาหารอะไร แก้ชื่อให้ถูกต้อง (ชื่อต่างประเทศให้ใช้ชื่อที่คนไทยเรียกทั่วไป) แยกเป็นรายการ ถ้าระบุจำนวนให้คิดตามจำนวนนั้น ถ้าไม่ระบุให้คิด 1 เสิร์ฟปกติ ถ้าไม่ใช่อาหารให้ตอบ []." + FMT;
  let out = "", used = "";
  if (env.ANTHROPIC_API_KEY) {
    const content = img ? [{ type: "image", source: { type: "base64", media_type: mime, data: img } }, { type: "text", text: task }] : task;
    let r; try { r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: EST_MODEL, max_tokens: 900, messages: [{ role: "user", content }] }) }); } catch (_) { return J(req, { error: "upstream" }, 502); }
    if (!r.ok) return J(req, { error: "upstream", status: r.status }, 502);
    const j = await r.json().catch(() => null); out = (j && j.content && j.content[0] && j.content[0].text) || "";
  } else {
    try { const r = await cfAI(env, task, img, mime); out = r.out; used = r.model; }
    catch (e) { const t = (e.tried || [String(e.message || e)]).join(" | "); return J(req, { error: /neuron|quota|10000|4006/i.test(t) ? "busy" : "upstream", detail: t.slice(0, 600) }, /neuron|quota|10000|4006/i.test(t) ? 429 : 502); }
  }
  if (label) {
    const mo = out.match(/\{[\s\S]*\}/); let o; try { o = JSON.parse(mo ? mo[0] : "null"); } catch (_) { o = null; }
    if (!o || typeof o !== "object") return J(req, { error: "parse" }, 502);
    const num = (v, mx) => { if (v === null || v === undefined || v === "") return null; const x = +v; return isFinite(x) && x >= 0 && x < mx ? Math.round(x * 10) / 10 : null; };
    return J(req, { label: { name: typeof o.name === "string" ? o.name.slice(0, 40) : "", servingsPerPack: num(o.servingsPerPack, 100), kcal: num(o.kcal, 5000), protein: num(o.protein, 500), carb: num(o.carb, 500), fat: num(o.fat, 500), fiber: num(o.fiber, 200), sugar: num(o.sugar, 500), sodium: num(o.sodium, 20000) }, model: used });
  }
  const m = out.match(/\[[\s\S]*\]/);
  let arr; try { arr = JSON.parse(m ? m[0] : "null"); } catch (_) { arr = null; }
  if (!Array.isArray(arr)) return J(req, { error: "parse" }, 502);
  const hasN = (x) => ["protein", "carb", "fat"].some((k) => isFinite(+x[k]) && x[k] !== null && x[k] !== "");
  const clean = (x) => {
    const o = { name: x.name.slice(0, 40), kcal: Math.round(+x.kcal) };
    if (list.length) { o.serving = typeof x.serving === "string" ? x.serving.slice(0, 30) : ""; o.conf = x.conf === "ต่ำ" ? "ต่ำ" : "สูง"; o.pack = x.pack === true; }
    if (hasN(x)) NUM_KEYS.forEach(([k, mx]) => { const v = +x[k]; o[k] = isFinite(v) && v >= 0 && v < mx ? Math.round(v * 10) / 10 : 0; });
    return o;
  };
  const items = arr.filter((x) => x && typeof x.name === "string" && isFinite(+x.kcal) && +x.kcal >= 0 && +x.kcal < 5000).slice(0, 12).map(clean);
  if (list.length && items.length !== list.length) items.forEach((x) => { x.conf = "ต่ำ"; });
  /* ถ้าโมเดลลืมใส่โภชนาการ ขอซ้ำเฉพาะรายการที่ขาด */
  const lack = items.filter((x) => x.protein === undefined);
  if (lack.length && !foods.length) {
    try {
      const t2 = "ให้ข้อมูลโภชนาการต่อ 1 เสิร์ฟของอาหารต่อไปนี้ ตามลำดับเดิมและใช้ชื่อเดิมทุกชื่อ (ค่า kcal ในวงเล็บเป็นค่าอ้างอิงที่ควรใกล้เคียง):\n" + lack.map((f, i) => `${i + 1}. ${f.name} (${f.kcal} kcal)`).join("\n") + "\n" + FMT;
      let o2 = "";
      if (env.ANTHROPIC_API_KEY) { const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: EST_MODEL, max_tokens: 900, messages: [{ role: "user", content: t2 }] }) }); const j = await r.json(); o2 = (j.content && j.content[0] && j.content[0].text) || ""; }
      else o2 = (await cfAI(env, t2, "", mime)).out;
      const m2 = o2.match(/\[[\s\S]*\]/), a2 = JSON.parse(m2 ? m2[0] : "[]");
      lack.forEach((it, i) => { const x = a2[i]; if (x && hasN(x)) NUM_KEYS.forEach(([k, mx]) => { const v = +x[k]; it[k] = isFinite(v) && v >= 0 && v < mx ? Math.round(v * 10) / 10 : 0; }); });
    } catch (_) { }
  }
  return J(req, { items, model: used });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    if (!ALLOWED_ORIGINS.includes(req.headers.get("Origin"))) return new Response("forbidden", { status: 403 });
    if (req.method === "GET" && url.pathname === "/vapid") return J(req, { key: env.VAPID_PUBLIC });
    if (req.method !== "POST") return J(req, { error: "not found" }, 404);
    if (url.pathname === "/estimate") return estimate(req, env);
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
