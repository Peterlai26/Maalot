/* Maalot push reminders: Cloudflare Worker (fetch + cron). Stores only push subscription + reminder prefs + last meal time. */
const ALLOWED_ORIGINS = ["https://maalot-2jx.pages.dev", "https://peterlai26.github.io", "http://localhost:8765", "https://localhost", "capacitor://localhost"];
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
export function iffEvent(iff, min, day) {
  if (!iff) return null; const win = (t) => min >= t && min < t + 35;
  if (win(Math.max(0, iff.s - 30))) return { key: day + "|iopen", msg: "อีก 30 นาทีช่วงกินจะเปิด เตรียมมื้อแรกได้เลย" };
  if (win(iff.e - 60)) return { key: day + "|iclose", msg: "อีก 1 ชั่วโมงช่วงกินจะปิด ถ้ายังไม่ได้กินหรือยังไม่ได้จด รีบเลยนะ" };
  const mid = (iff.e + Math.round((iff.s + 1440 - iff.e) / 2)) % 1440; if (win(mid)) return { key: day + "|iwater", msg: "กำลังงดกินอยู่ ดื่มน้ำสักแก้วนะ" };
  return null;
}
const cleanIff = (x) => { if (!x || typeof x !== "object") return null; const s = Math.round(+x.s), e = Math.round(+x.e); return s >= 0 && s < 1440 && e > s && e <= 1439 && e - s >= 420 && e - s <= 780 ? { s, e } : null; };
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
  return { everyH: every, start: p.start, end: p.end, tzOff: Math.round(tz), iff: cleanIff(p.iff) };
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
  else if (img) task = "ดูรูปอาหารที่แนบมา แล้วแยกเป็นแต่ละรายการที่เห็น (เช่น เนื้อสัตว์แยกจากชีส ข้าวแยกจากกับ) ถ้าไม่ใช่อาหารให้ตอบ []. กติกาสำคัญ (ใช้กับอาหารทุกประเภท): 1) นับจำนวนที่เห็นหรือที่ระบุให้ครบทีละรายการ (ชิ้น จาน ชาม ถ้วย แก้ว ห่อ) แล้วใส่จำนวนในชื่อ เช่น \"ไก่ทอดเทนเดอร์ 6 ชิ้น\" \"ข้าวมันไก่ 2 จาน\" 2) kcal และสารอาหารทุกช่องเป็นยอดรวมของทั้งหมดที่เห็นหรือที่ระบุสำหรับรายการนั้น ห้ามคิดแค่ 1 หน่วยหรือ 1 เสิร์ฟ 3) ประเมินขนาดจริงโดยเทียบกับภาชนะ ช้อนส้อม มือ กล่อง หรือแก้ว ที่เห็น 4) รวมพลังงานที่มองไม่เห็น: น้ำมันทอด/ผัด แป้งชุบ กะทิ น้ำตาลในเครื่องดื่ม ซอส มายองเนส ชีส เนย น้ำสลัด น้ำซุป 5) ถ้าไม่แน่ใจปริมาณ ให้เลือกค่ากลางๆ ไม่ใช่ค่าที่น้อยที่สุด 6) อ้างอิงขนาด (kcal ต่อหน่วย): ข้าวสวย 1 จาน 200, ข้าวมันไก่ 1 จาน 650, ผัดกะเพราไข่ดาวราดข้าว 1 จาน 550, ก๋วยเตี๋ยว 1 ชาม 400, ไก่ทอด 1 ชิ้น 270, เทนเดอร์/นักเก็ตชิ้นใหญ่ 1 ชิ้น 170, ชีสแผ่น 1 แผ่น 70, เฟรนช์ฟรายส์ M 380, พิซซ่า 1 ชิ้น 280, ชานมไข่มุก 1 แก้ว 400, เค้ก 1 ชิ้น 350." + " ตอบเป็น JSON array เท่านั้น ไม่มีข้อความอื่น รูปแบบ [{\"name\":\"ชื่อภาษาไทยสั้นๆ พร้อมจำนวน\",\"kcal\":ตัวเลข,\"protein\":กรัม,\"carb\":กรัม,\"fat\":กรัม,\"fiber\":กรัม,\"sugar\":กรัม,\"sodium\":มิลลิกรัม}] ค่าทั้งหมดเป็นยอดรวมของรายการนั้นทั้งหมดตามจำนวนที่เห็นหรือที่ระบุ";
  else task = "ผู้ใช้พิมพ์บอกว่ากินอะไรมา: \"" + text + "\"\nข้อความอาจพิมพ์ผิด สะกดไม่ครบ ใช้คำย่อ หรือเป็นอาหารจากต่างประเทศ ให้เดาว่าหมายถึงอาหารอะไร แก้ชื่อให้ถูกต้อง (ชื่อต่างประเทศให้ใช้ชื่อที่คนไทยเรียกทั่วไป) แยกเป็นรายการ ถ้าไม่ระบุจำนวนให้คิด 1 เสิร์ฟปกติ."+" ถ้าไม่ใช่อาหารให้ตอบ []. กติกาสำคัญ (ใช้กับอาหารทุกประเภท): 1) นับจำนวนที่เห็นหรือที่ระบุให้ครบทีละรายการ (ชิ้น จาน ชาม ถ้วย แก้ว ห่อ) แล้วใส่จำนวนในชื่อ เช่น \"ไก่ทอดเทนเดอร์ 6 ชิ้น\" \"ข้าวมันไก่ 2 จาน\" 2) kcal และสารอาหารทุกช่องเป็นยอดรวมของทั้งหมดที่เห็นหรือที่ระบุสำหรับรายการนั้น ห้ามคิดแค่ 1 หน่วยหรือ 1 เสิร์ฟ 3) ประเมินขนาดจริงโดยเทียบกับภาชนะ ช้อนส้อม มือ กล่อง หรือแก้ว ที่เห็น 4) รวมพลังงานที่มองไม่เห็น: น้ำมันทอด/ผัด แป้งชุบ กะทิ น้ำตาลในเครื่องดื่ม ซอส มายองเนส ชีส เนย น้ำสลัด น้ำซุป 5) ถ้าไม่แน่ใจปริมาณ ให้เลือกค่ากลางๆ ไม่ใช่ค่าที่น้อยที่สุด 6) อ้างอิงขนาด (kcal ต่อหน่วย): ข้าวสวย 1 จาน 200, ข้าวมันไก่ 1 จาน 650, ผัดกะเพราไข่ดาวราดข้าว 1 จาน 550, ก๋วยเตี๋ยว 1 ชาม 400, ไก่ทอด 1 ชิ้น 270, เทนเดอร์/นักเก็ตชิ้นใหญ่ 1 ชิ้น 170, ชีสแผ่น 1 แผ่น 70, เฟรนช์ฟรายส์ M 380, พิซซ่า 1 ชิ้น 280, ชานมไข่มุก 1 แก้ว 400, เค้ก 1 ชิ้น 350." + " ตอบเป็น JSON array เท่านั้น ไม่มีข้อความอื่น รูปแบบ [{\"name\":\"ชื่อภาษาไทยสั้นๆ พร้อมจำนวน\",\"kcal\":ตัวเลข,\"protein\":กรัม,\"carb\":กรัม,\"fat\":กรัม,\"fiber\":กรัม,\"sugar\":กรัม,\"sodium\":มิลลิกรัม}] ค่าทั้งหมดเป็นยอดรวมของรายการนั้นทั้งหมดตามจำนวนที่เห็นหรือที่ระบุ";
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

/* ---------- บัญชีผู้ใช้ (ไอดี + รหัสผ่าน) และซิงก์ข้ามเครื่อง ----------
   เบราว์เซอร์เป็นคนยืดรหัสผ่านด้วย PBKDF2 (250k รอบ) แล้วส่งเฉพาะค่าที่ได้ (k) มา เซิร์ฟเวอร์เก็บ HMAC(pepper, salt + k) เท่านั้น
   รหัสกู้คืนใช้หลักการเดียวกัน (rk) เพราะไม่มีอีเมลยืนยันสำหรับรีเซ็ตรหัสผ่าน */
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/, cleanEmail = (s) => { const e = String(s || "").trim().toLowerCase(); return e.length <= 120 && EMAIL_RE.test(e) ? e : ""; }, maskEmail = (e) => { if (!e) return ""; const [u, d] = e.split("@"); return u.slice(0, 1) + "***@" + d; };
const SESSION_TTL = 30 * 86400, MAX_SYNC_BYTES = 2 * 1024 * 1024, ID_RE = /^[a-z0-9._@+-]{3,40}$/, HEX64 = /^[0-9a-f]{64}$/;
const strB64u = (str) => b64u.enc(enc.encode(str));
const jsonB64u = (s) => JSON.parse(new TextDecoder().decode(b64u.dec(s)));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
async function hmacKey(env) { if (!env.SESSION_SECRET) throw new Error("no secret"); return crypto.subtle.importKey("raw", enc.encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }
const pw = async (env, salt, k) => hex(await crypto.subtle.sign("HMAC", await hmacKey(env), enc.encode(salt + "|" + k)));
const ctEq = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
export async function signSession(sub, tv, env, now) {
  const exp = Math.floor((now || Date.now()) / 1000) + SESSION_TTL, body = strB64u(JSON.stringify({ sub, tv, exp }));
  return body + "." + b64u.enc(await crypto.subtle.sign("HMAC", await hmacKey(env), enc.encode(body)));
}
export async function verifySession(token, env, now) {
  const [body, sig] = String(token || "").split("."); if (!body || !sig) return null;
  let ok = false; try { ok = await crypto.subtle.verify("HMAC", await hmacKey(env), b64u.dec(sig), enc.encode(body)); } catch (_) { return null; }
  if (!ok) return null; const c = jsonB64u(body); return c.exp > Math.floor((now || Date.now()) / 1000) && typeof c.sub === "string" ? c : null;
}
const FAILS = new Map(); /* ตัวกันยิงรหัสผ่านต่อ IP ภายในเครื่องเซิร์ฟเวอร์ (ไม่เขียน KV จึงไม่กินโควตาเขียนฟรี) */
function ipBlocked(ip) { const now = Date.now(), a = (FAILS.get(ip) || []).filter((t) => now - t < 600000); FAILS.set(ip, a); return a.length >= 15; }
const ipFail = (ip) => { const a = FAILS.get(ip) || []; a.push(Date.now()); FAILS.set(ip, a); };
async function readJson(req, max) { const t = await req.text(); if (t.length > (max || 4000)) throw new Error("big"); return JSON.parse(t); }
async function accountOf(env, id) { const uid = await env.SUBS.get("u:" + (await sha(id))); if (!uid) return null; const a = JSON.parse((await env.SUBS.get("a:" + uid)) || "null"); return a ? { uid, a } : null; }
async function lockedOut(env, uid) { const f = JSON.parse((await env.SUBS.get("f:" + uid)) || "null"); return !!(f && f.n >= 8 && Date.now() - f.t < 15 * 60000); }
async function noteFail(env, uid) { const f = JSON.parse((await env.SUBS.get("f:" + uid)) || "null") || { n: 0, t: 0 }; const fresh = Date.now() - f.t > 15 * 60000; await env.SUBS.put("f:" + uid, JSON.stringify({ n: fresh ? 1 : f.n + 1, t: Date.now() }), { expirationTtl: 3600 }); }
async function sessionOut(req, env, a, uid) { return J(req, { token: await signSession(uid, a.tv, env), exp: Math.floor(Date.now() / 1000) + SESSION_TTL, id: a.id, em: maskEmail(a.em) }); }
/* ส่งอีเมลผ่าน Resend (ต้องตั้ง secret RESEND_API_KEY และตัวแปร MAIL_FROM) */
export async function sendMail(env, to, subject, text, html) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return false;
  try { const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, text, html }) }); return r.ok; } catch (_) { return false; }
}
async function authed(req, env) {
  const m = /^Bearer (.+)$/.exec(req.headers.get("Authorization") || ""); const s = m ? await verifySession(m[1], env) : null; if (!s) return null;
  const a = JSON.parse((await env.SUBS.get("a:" + s.sub)) || "null"); return a && a.tv === s.tv ? { uid: s.sub, a } : null;
}
export async function handleAccount(req, env, url) {
  const p = url.pathname, ip = req.headers.get("CF-Connecting-IP") || "x";
  if (p.startsWith("/auth/") && req.method === "POST") {
    let b; try { b = await readJson(req); } catch (_) { return J(req, { error: "bad json" }, 400); }
    const id = String(b.id || "").trim().toLowerCase();
    if (p === "/auth/register") {
      if (!ID_RE.test(id) || !HEX64.test(b.k || "") || !HEX64.test(b.rk || "")) return J(req, { error: "bad input" }, 400);
      if (ipBlocked(ip)) return J(req, { error: "slow down" }, 429);
      if (await env.SUBS.get("u:" + (await sha(id)))) return J(req, { error: "taken" }, 409);
      const uid = hex(crypto.getRandomValues(new Uint8Array(16))), salt = hex(crypto.getRandomValues(new Uint8Array(16))), a = { id, salt, h: await pw(env, salt, b.k), rh: await pw(env, salt, "r" + b.rk), tv: 1, created: Date.now() };
      const em = cleanEmail(b.email) || cleanEmail(id); if (em && !(await env.SUBS.get("m:" + (await sha(em))))) { a.em = em; await env.SUBS.put("m:" + (await sha(em)), uid); }
      await env.SUBS.put("a:" + uid, JSON.stringify(a)); await env.SUBS.put("u:" + (await sha(id)), uid); ipFail(ip); /* นับการสมัครด้วย กันสมัครรัว */
      return sessionOut(req, env, a, uid);
    }
    if (p === "/auth/login") {
      if (!ID_RE.test(id) || !HEX64.test(b.k || "")) return J(req, { error: "bad input" }, 400);
      if (ipBlocked(ip)) return J(req, { error: "slow down" }, 429);
      const r = await accountOf(env, id); if (!r) { ipFail(ip); return J(req, { error: "wrong" }, 401); }
      if (await lockedOut(env, r.uid)) return J(req, { error: "locked" }, 429);
      if (!ctEq(await pw(env, r.a.salt, b.k), r.a.h)) { ipFail(ip); await noteFail(env, r.uid); return J(req, { error: "wrong" }, 401); }
      if (await env.SUBS.get("f:" + r.uid)) await env.SUBS.delete("f:" + r.uid);
      return sessionOut(req, env, r.a, r.uid);
    }
    if (p === "/auth/recover") {
      if (!ID_RE.test(id) || !HEX64.test(b.rk || "") || !HEX64.test(b.k2 || "") || !HEX64.test(b.rk2 || "")) return J(req, { error: "bad input" }, 400);
      if (ipBlocked(ip)) return J(req, { error: "slow down" }, 429);
      const r = await accountOf(env, id); if (!r) { ipFail(ip); return J(req, { error: "wrong" }, 401); }
      if (await lockedOut(env, r.uid)) return J(req, { error: "locked" }, 429);
      if (!ctEq(await pw(env, r.a.salt, "r" + b.rk), r.a.rh)) { ipFail(ip); await noteFail(env, r.uid); return J(req, { error: "wrong" }, 401); }
      r.a.h = await pw(env, r.a.salt, b.k2); r.a.rh = await pw(env, r.a.salt, "r" + b.rk2); r.a.tv += 1; await env.SUBS.put("a:" + r.uid, JSON.stringify(r.a));
      return sessionOut(req, env, r.a, r.uid);
    }
    if (p === "/auth/forgot") { /* ส่งลิงก์ตั้งรหัสใหม่ทางอีเมล: ตอบเหมือนกันเสมอ ไม่บอกว่ามีบัญชีหรือไม่ */
      const q = String(b.id || "").trim().toLowerCase(); if (!q || q.length > 120) return J(req, { error: "bad input" }, 400);
      if (ipBlocked(ip)) return J(req, { error: "slow down" }, 429); ipFail(ip);
      if (!env.RESEND_API_KEY || !env.MAIL_FROM) return J(req, { ok: true, mail: false });
      let r = ID_RE.test(q) ? await accountOf(env, q) : null;
      if (!r && EMAIL_RE.test(q)) { const uid = await env.SUBS.get("m:" + (await sha(q))); if (uid) { const a = JSON.parse((await env.SUBS.get("a:" + uid)) || "null"); if (a) r = { uid, a }; } }
      if (r && r.a.em && !(await env.SUBS.get("rl:" + r.uid))) {
        await env.SUBS.put("rl:" + r.uid, "1", { expirationTtl: 60 });
        const token = hex(crypto.getRandomValues(new Uint8Array(32)));
        await env.SUBS.put("rt:" + (await sha(token)), JSON.stringify({ uid: r.uid, exp: Date.now() + 30 * 60000 }), { expirationTtl: 1800 });
        const link = (env.APP_URL || "https://maalot-2jx.pages.dev") + "/#reset=" + token + "&id=" + encodeURIComponent(r.a.id);
        await sendMail(env, r.a.em, "ตั้งรหัสผ่านใหม่ Maalot", "มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชี Maalot ของคุณ\n\nเปิดลิงก์นี้ภายใน 30 นาที:\n" + link + "\n\nถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้ตามปกติ", "<p>มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชี Maalot ของคุณ</p><p><a href=\"" + link + "\">ตั้งรหัสผ่านใหม่</a> (ใช้ได้ภายใน 30 นาที)</p><p>ถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้ตามปกติ</p>");
      }
      return J(req, { ok: true, mail: true });
    }
    if (p === "/auth/reset") {
      const token = String(b.token || ""); if (!/^[0-9a-f]{64}$/.test(token) || !HEX64.test(b.k2 || "") || !HEX64.test(b.rk2 || "")) return J(req, { error: "bad input" }, 400);
      if (ipBlocked(ip)) return J(req, { error: "slow down" }, 429);
      const tk = "rt:" + (await sha(token)), rec = JSON.parse((await env.SUBS.get(tk)) || "null");
      if (!rec || rec.exp < Date.now()) { ipFail(ip); return J(req, { error: "expired" }, 410); }
      const a = JSON.parse((await env.SUBS.get("a:" + rec.uid)) || "null"); if (!a || (id && a.id !== id)) { ipFail(ip); return J(req, { error: "wrong" }, 401); }
      a.h = await pw(env, a.salt, b.k2); a.rh = await pw(env, a.salt, "r" + b.rk2); a.tv += 1; await env.SUBS.put("a:" + rec.uid, JSON.stringify(a));
      await env.SUBS.delete(tk); if (await env.SUBS.get("f:" + rec.uid)) await env.SUBS.delete("f:" + rec.uid);
      return sessionOut(req, env, a, rec.uid);
    }
    const me = await authed(req, env); if (!me) return J(req, { error: "unauthorized" }, 401);
    if (p === "/auth/email") { /* ตั้ง/เปลี่ยน/ลบอีเมลกู้รหัสผ่าน ต้องยืนยันรหัสผ่านก่อน */
      if (!HEX64.test(b.k || "") || !ctEq(await pw(env, me.a.salt, b.k), me.a.h)) { ipFail(ip); return J(req, { error: "wrong" }, 401); }
      const em = cleanEmail(b.email); if (String(b.email || "").trim() && !em) return J(req, { error: "bad email" }, 400);
      if (em) { const cur = await env.SUBS.get("m:" + (await sha(em))); if (cur && cur !== me.uid) return J(req, { error: "email taken" }, 409); }
      if (me.a.em && me.a.em !== em) await env.SUBS.delete("m:" + (await sha(me.a.em)));
      if (em) { me.a.em = em; await env.SUBS.put("m:" + (await sha(em)), me.uid); } else delete me.a.em;
      await env.SUBS.put("a:" + me.uid, JSON.stringify(me.a)); return J(req, { ok: true, em: maskEmail(me.a.em) });
    }
    if (p === "/auth/password") {
      if (!HEX64.test(b.k || "") || !HEX64.test(b.k2 || "")) return J(req, { error: "bad input" }, 400);
      if (!ctEq(await pw(env, me.a.salt, b.k), me.a.h)) { ipFail(ip); return J(req, { error: "wrong" }, 401); }
      me.a.h = await pw(env, me.a.salt, b.k2); me.a.tv += 1; await env.SUBS.put("a:" + me.uid, JSON.stringify(me.a)); return sessionOut(req, env, me.a, me.uid);
    }
    if (p === "/auth/delete") {
      if (!HEX64.test(b.k || "") || !ctEq(await pw(env, me.a.salt, b.k), me.a.h)) { ipFail(ip); return J(req, { error: "wrong" }, 401); }
      await env.SUBS.delete("a:" + me.uid); await env.SUBS.delete("u:" + (await sha(me.a.id))); if (me.a.em) await env.SUBS.delete("m:" + (await sha(me.a.em))); await env.SUBS.delete("d:" + me.uid); await env.SUBS.delete("p:" + me.uid); await env.SUBS.delete("fr:" + me.uid); return J(req, { ok: true });
    }
    return J(req, { error: "not found" }, 404);
  }
  if (p === "/sync") {
    const me = await authed(req, env); if (!me) return J(req, { error: "unauthorized" }, 401);
    const key = "d:" + me.uid;
    if (req.method === "GET") { const rec = JSON.parse((await env.SUBS.get(key)) || "null"); return J(req, rec ? { upd: rec.upd, data: rec.data } : { upd: 0, data: null }); }
    if (req.method === "DELETE") { await env.SUBS.delete(key); return J(req, { ok: true }); }
    if (req.method === "PUT") {
      let b; try { b = await readJson(req, MAX_SYNC_BYTES); } catch (e) { return J(req, { error: e.message === "big" ? "too large" : "bad json" }, e.message === "big" ? 413 : 400); }
      if (!b || typeof b.data !== "object" || b.data === null || Array.isArray(b.data) || typeof b.data.v !== "number") return J(req, { error: "bad data" }, 400);
      const cur = JSON.parse((await env.SUBS.get(key)) || "null"), curUpd = cur ? cur.upd : 0;
      if ((b.base || 0) !== curUpd) return J(req, { error: "conflict", upd: curUpd, data: cur && cur.data }, 409);
      const upd = Date.now(); await env.SUBS.put(key, JSON.stringify({ upd, data: b.data })); return J(req, { ok: true, upd });
    }
  }
  return null;
}

/* ---------- เพื่อนช่วยกัน: ขอเป็นเพื่อน/ตอบรับ + คะแนนรายสัปดาห์ (แชร์เฉพาะชื่อตัวละคร สตรีค คะแนน) ---------- */
const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/, MAX_FRIENDS = 30, MAX_REQ = 20;
const kvj = async (env, k, d) => JSON.parse((await env.SUBS.get(k)) || "null") || d;
const cleanName = (s) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 20) || "เพื่อน";
async function uidOfId(env, id) { return env.SUBS.get("u:" + (await sha(String(id || "").trim().toLowerCase()))); }
async function idOfUid(env, uid) { const a = await kvj(env, "a:" + uid, null); return a ? a.id : null; }
export async function handleFriends(req, env, url) {
  const p = url.pathname, ip = req.headers.get("CF-Connecting-IP") || "x";
  const me = await authed(req, env); if (!me) return J(req, { error: "unauthorized" }, 401);
  const frKey = (u) => "fr:" + u, load = (u) => kvj(env, frKey(u), { f: [], inn: [], out: [] }), save = (u, v) => env.SUBS.put(frKey(u), JSON.stringify(v));
  if (p === "/friends" && req.method === "GET") {
    const m = await load(me.uid), pub = async (u) => { const st = await kvj(env, "p:" + u, null), id = await idOfUid(env, u); return id ? { id, name: st ? st.name : id, streak: st ? st.streak : 0, pts: st ? st.pts : 0, wk: st ? st.wk : "" } : null; };
    const friends = (await Promise.all(m.f.map(pub))).filter(Boolean), incoming = (await Promise.all(m.inn.map(pub))).filter(Boolean).map((x) => ({ id: x.id, name: x.name })), outgoing = (await Promise.all(m.out.map(async (u) => { const id = await idOfUid(env, u); return id ? { id } : null; }))).filter(Boolean);
    return J(req, { me: { id: me.a.id }, friends, incoming, outgoing });
  }
  if (req.method !== "POST") return J(req, { error: "not found" }, 404);
  let b; try { b = await readJson(req, 600); } catch (_) { return J(req, { error: "bad json" }, 400); }
  if (p === "/friends/stat") {
    const pts = Math.round(Number(b.pts)), streak = Math.round(Number(b.streak));
    if (!(pts >= 0 && pts <= 100000) || !(streak >= 0 && streak <= 10000) || !WEEK_RE.test(String(b.wk || ""))) return J(req, { error: "bad input" }, 400);
    await env.SUBS.put("p:" + me.uid, JSON.stringify({ name: cleanName(b.name), streak, pts, wk: b.wk })); return J(req, { ok: true });
  }
  const tid = String(b.id || "").trim().toLowerCase(); if (!ID_RE.test(tid)) return J(req, { error: "bad input" }, 400);
  if (p === "/friends/add") {
    if (ipBlocked(ip)) return J(req, { error: "slow down" }, 429);
    if (tid === me.a.id) return J(req, { error: "self" }, 400);
    const tu = await uidOfId(env, tid); if (!tu) { ipFail(ip); return J(req, { error: "notfound" }, 404); }
    const mine = await load(me.uid), theirs = await load(tu);
    if (mine.f.includes(tu)) return J(req, { ok: true, state: "friends" });
    if (mine.inn.includes(tu)) { /* อีกฝ่ายขอมาก่อน = ตอบรับเลย */
      mine.inn = mine.inn.filter((x) => x !== tu); theirs.out = theirs.out.filter((x) => x !== me.uid); mine.f.push(tu); theirs.f.push(me.uid); await save(me.uid, mine); await save(tu, theirs); return J(req, { ok: true, state: "friends" });
    }
    if (mine.f.length >= MAX_FRIENDS) return J(req, { error: "full" }, 400);
    if (!theirs.inn.includes(me.uid)) { if (theirs.inn.length >= MAX_REQ) return J(req, { error: "busy" }, 400); theirs.inn.push(me.uid); }
    if (!mine.out.includes(tu)) mine.out.push(tu); await save(tu, theirs); await save(me.uid, mine); return J(req, { ok: true, state: "sent" });
  }
  const tu = await uidOfId(env, tid); if (!tu) return J(req, { error: "notfound" }, 404);
  if (p === "/friends/respond") {
    const mine = await load(me.uid), theirs = await load(tu); if (!mine.inn.includes(tu)) return J(req, { error: "no request" }, 404);
    mine.inn = mine.inn.filter((x) => x !== tu); theirs.out = theirs.out.filter((x) => x !== me.uid);
    if (b.accept) { if (mine.f.length >= MAX_FRIENDS || theirs.f.length >= MAX_FRIENDS) return J(req, { error: "full" }, 400); if (!mine.f.includes(tu)) mine.f.push(tu); if (!theirs.f.includes(me.uid)) theirs.f.push(me.uid); }
    await save(me.uid, mine); await save(tu, theirs); return J(req, { ok: true });
  }
  if (p === "/friends/remove") {
    const mine = await load(me.uid), theirs = await load(tu), rm = (m, u) => { m.f = m.f.filter((x) => x !== u); m.inn = m.inn.filter((x) => x !== u); m.out = m.out.filter((x) => x !== u); };
    rm(mine, tu); rm(theirs, me.uid); await save(me.uid, mine); await save(tu, theirs); return J(req, { ok: true });
  }
  return J(req, { error: "not found" }, 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    if (!ALLOWED_ORIGINS.includes(req.headers.get("Origin"))) return new Response("forbidden", { status: 403 });
    if (req.method === "GET" && url.pathname === "/vapid") return J(req, { key: env.VAPID_PUBLIC });
    if (url.pathname.startsWith("/auth/") || url.pathname === "/sync") { const r = await handleAccount(req, env, url); if (r) return r; }
    if (url.pathname === "/friends" || url.pathname.startsWith("/friends/")) return handleFriends(req, env, url);
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
      await env.SUBS.put(key, JSON.stringify({ sub: { endpoint: ep, keys: { p256dh: k.p256dh, auth: k.auth } }, ...prefs, lastMeal: old.lastMeal || 0, lastSlot: old.lastSlot || "", lastIff: old.lastIff || "" }), { expirationTtl: 60 * 86400 });
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
        let changed = false;
        if (r.iff) {
          const local = new Date(now + r.tzOff * 60000), day = local.toISOString().slice(0, 10), min = local.getUTCHours() * 60 + local.getUTCMinutes(), ev = iffEvent(r.iff, min, day);
          if (ev && r.lastIff !== ev.key) {
            r.lastIff = ev.key; changed = true;
            try { const res = await sendPush(env, r.sub, { title: "Maalot (มาลด)", body: ev.msg }); if (res.status === 404 || res.status === 410) { await env.SUBS.delete(k.name); continue; } } catch (_) { }
            await env.SUBS.put(k.name, JSON.stringify(r), { expirationTtl: 60 * 86400 });
          }
        }
        let due = dueSlot(r, now);
        if (due && r.iff) { const local = new Date(now + r.tzOff * 60000), min = local.getUTCHours() * 60 + local.getUTCMinutes(); if (min < r.iff.s || min >= r.iff.e) due = null; }
        if (!due || r.lastSlot === due.key) continue;
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
