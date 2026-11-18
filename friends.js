/* เพื่อนช่วยกัน: ขอเป็นเพื่อนด้วยไอดีบัญชี แล้วแข่งคะแนนรายสัปดาห์ (แชร์เฉพาะชื่อตัวละคร สตรีค คะแนน — ไม่แชร์น้ำหนักหรืออาหาร) */
const frWeek = () => addDays(todayKey(), -((new Date().getDay() + 6) % 7));
function frScore() {
  const wk = frWeek(), t = todayKey(), meals = new Set((S.meals || []).filter(m => m.d >= wk).map(m => m.d)).size, works = (S.works || []).filter(w => w.d >= wk).length;
  let hab = 0, str = 0, steps = 0; for (let d = wk; d <= t; d = addDays(d, 1)) { hab += ((S.habits && S.habits.done && S.habits.done[d]) || []).length; str += (S.stretch && S.stretch.log && S.stretch.log[d]) || 0; steps += typeof wkSteps === "function" ? wkSteps(d) : 0; }
  const parts = [["จดอาหาร", meals * 10, meals + " วัน"], ["ออกกำลังกาย", works * 15, works + " ครั้ง"], ["นิสัย", hab * 3, hab + " ข้อ"], ["ยืดเส้น", str * 2, str + " รอบ"], ["ก้าว", Math.round(steps / 1000), fmtN(steps) + " ก้าว"]];
  return { pts: parts.reduce((s0, p) => s0 + p[1], 0), parts, wk };
}
let FRD = { data: null, loading: false, err: "", busy: false, edit: false, loaded: false };
async function frApi(method, path, body) { try { return await syncApi(method, path, body); } catch (e) { return { ok: false, status: 0, j: {} }; } }
async function frLoad() {
  if (!loggedIn() || !S.frOk || FRD.loading) return; FRD.loading = true; FRD.err = "";
  const sc = frScore(); await frApi("POST", "/friends/stat", { name: S.name || "เพื่อน", streak: (S.streak && S.streak.n) || 0, pts: sc.pts, wk: sc.wk });
  const r = await frApi("GET", "/friends"); FRD.loading = false; FRD.loaded = true;
  if (r.ok) FRD.data = r.j; else FRD.err = r.status === 0 || r.status === 403 ? "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (โหมดเพื่อนใช้ได้เฉพาะเว็บจริงและต้องล็อกอินบัญชี)" : r.status === 401 ? "เซสชันหมดอายุ เข้าสู่ระบบใหม่อีกครั้ง" : "โหลดไม่สำเร็จ ลองใหม่อีกครั้ง";
  const t = subStack[subStack.length - 1]; if (t && t.name === "friends") rerenderSub();
}
const frMsg = { notfound: "ไม่พบไอดีนี้ ตรวจตัวสะกดอีกครั้ง", self: "นี่คือไอดีของคุณเอง", full: "รายชื่อเพื่อนเต็มแล้ว", busy: "อีกฝ่ายมีคำขอค้างเยอะเกินไป" };
SUBS.friends = () => {
  const after = () => { if (!FRD.loaded && !FRD.loading) frLoad(); };
  if (!loggedIn()) return { title: "เพื่อนช่วยกัน", html: `<div class="card flc0"><span class="nask-ic">${ic("users", 34)}</span><h3>เข้าสู่ระบบก่อนนะ</h3><p class="muted sm">ต้องมีบัญชีเพื่อให้เพื่อนค้นหาและแข่งคะแนนกับคุณได้</p><button class="btn primary block go" data-act="frgate">เข้าสู่ระบบ / สมัครสมาชิก</button></div>` };
  if (!S.frOk) return { title: "เพื่อนช่วยกัน", html: `<div class="card flc0"><span class="nask-ic">${ic("users", 34)}</span><h3>แข่งกันเบาๆ กับเพื่อน</h3><p class="muted sm">เพื่อนที่คุณยอมรับจะเห็นเฉพาะ <b>ชื่อตัวละคร สตรีค และคะแนนสัปดาห์นี้</b> เท่านั้น ไม่เห็นน้ำหนัก อาหาร หรือรูปของคุณ เลิกเป็นเพื่อนหรือปิดการแชร์ได้ทุกเมื่อ</p><button class="btn primary block go" data-act="frok">${ic("check", 18)}เข้าใจแล้ว เริ่มเลย</button></div>`, after: null };
  const sc = frScore(), D = FRD.data, me = { id: (D && D.me && D.me.id) || (AUTH && AUTH.id) || "", name: S.name || "คุณ", streak: (S.streak && S.streak.n) || 0, pts: sc.pts, me: true };
  const rows = [me].concat(((D && D.friends) || []).map(f => ({ id: f.id, name: f.name, streak: f.streak, pts: f.wk === sc.wk ? f.pts : 0 }))).sort((a, b) => b.pts - a.pts);
  const medal = ["#E8B14A", "#9AA6B8", "#C98A5A"], mx = Math.max(1, rows[0].pts);
  const inc = ((D && D.incoming) || []).map(x => `<div class="flq"><span class="fln">${ic("user", 16)}</span><div class="grow"><b>${esc(x.name)}</b><span class="xs muted">@${esc(x.id)} ขอเป็นเพื่อน</span></div><button class="btn sm primary" data-act="frresp" data-id="${esc(x.id)}" data-a="1">รับ</button><button class="btn sm" data-act="frresp" data-id="${esc(x.id)}" data-a="0">ไม่รับ</button></div>`).join("");
  const out = ((D && D.outgoing) || []).map(x => `<span class="chip">${esc(x.id)} · รอตอบรับ</span>`).join("");
  return { title: "เพื่อนช่วยกัน", keepScroll: true, after, html: `<div class="card flme"><div class="row between"><div><span class="xs muted">คะแนนสัปดาห์นี้</span><div class="flpts">${fmtN(sc.pts)}</div></div><div class="flst">${ic("flame", 16)}${me.streak} วัน</div></div><div class="flparts">${sc.parts.map(p => `<span><b>+${p[1]}</b>${p[0]}<small>${p[2]}</small></span>`).join("")}</div></div>
${FRD.err ? `<div class="hint">${ic("sparkle", 18)}<span>${esc(FRD.err)}</span></div><button class="btn block" style="margin-bottom:10px" data-act="frreload">ลองใหม่</button>` : ""}
${inc ? `<div class="sec">คำขอเป็นเพื่อน</div>${inc}` : ""}
<div class="sec">อันดับสัปดาห์นี้${FRD.loading ? " · กำลังอัปเดต" : ""}</div><div class="card fllb">${rows.map((r, i) => `<div class="flr${r.me ? " me" : ""}" style="--i:${i}"><span class="flk" style="${i < 3 ? "background:" + medal[i] + ";color:#fff" : ""}">${i + 1}</span><div class="grow"><b>${esc(r.name)}${r.me ? " (คุณ)" : ""}</b><i class="flbar"><u style="width:${Math.round(r.pts / mx * 100)}%"></u></i></div><span class="fls">${ic("flame", 12)}${r.streak}</span><b class="flp">${fmtN(r.pts)}</b>${FRD.edit && !r.me ? `<button class="hbx flx" data-act="frdel" data-id="${esc(r.id)}" aria-label="ลบเพื่อน">${ic("trash", 14)}</button>` : ""}</div>`).join("")}${rows.length === 1 && FRD.loaded && !FRD.err ? `<p class="xs muted" style="text-align:center;padding:10px 0 2px">ยังไม่มีเพื่อน ชวนเพื่อนด้วยไอดีด้านล่างได้เลย</p>` : ""}</div>
${out ? `<div class="row wrap" style="margin-top:8px;gap:6px">${out}</div>` : ""}
<div class="sec">เพิ่มเพื่อน</div><div class="hbadd"><input id="frid" type="text" maxlength="40" placeholder="ไอดีบัญชีของเพื่อน" autocomplete="off" autocapitalize="off"/><button class="btn primary" data-act="fradd2">${ic("plus", 16)}ขอ</button></div>
<div class="card sm" style="margin-top:10px;display:flex;align-items:center;gap:8px">${ic("user", 16)}<span class="grow">ไอดีของคุณ <b>${esc(me.id)}</b></span><button class="btn sm" data-act="frcopy" data-id="${esc(me.id)}">คัดลอก</button></div>
<div style="display:flex;gap:8px;margin-top:12px"><button class="btn" style="flex:1" data-act="frreload">${ic("send", 14)}รีเฟรช</button><button class="btn" style="flex:1" data-act="fredit">${FRD.edit ? "เสร็จแล้ว" : "จัดการเพื่อน"}</button></div>
<button class="btn block" style="margin-top:8px;background:none;border:0;color:var(--muted)" data-act="froff">หยุดแชร์คะแนนของฉัน</button>` };
};
ACT.frgate = () => openGate();
ACT.frok = () => { S.frOk = true; save(); FRD.loaded = false; rerenderSub(); };
ACT.froff = () => { S.frOk = false; FRD = { data: null, loading: false, err: "", busy: false, edit: false, loaded: false }; save(); toast("หยุดแชร์แล้ว เพื่อนจะไม่เห็นคะแนนใหม่ของคุณ"); rerenderSub(); };
ACT.frreload = () => { FRD.loaded = false; FRD.loading = false; frLoad(); rerenderSub(); };
ACT.fredit = () => { FRD.edit = !FRD.edit; rerenderSub(); };
ACT.frcopy = async a => { try { await navigator.clipboard.writeText(a.dataset.id); toast("คัดลอกไอดีแล้ว"); } catch (e) { toast("คัดลอกไม่ได้ ลองจดไอดีเอง"); } };
ACT.fradd2 = async () => { const i = $("#frid"), v = (i && i.value || "").trim().toLowerCase(); if (!v) { toast("พิมพ์ไอดีของเพื่อนก่อนนะ"); return; } const r = await frApi("POST", "/friends/add", { id: v }); if (r.ok) { toast(r.j.state === "friends" ? "เป็นเพื่อนกันแล้ว" : "ส่งคำขอแล้ว รอเพื่อนตอบรับ"); FRD.loaded = false; frLoad(); } else toast(frMsg[r.j && r.j.error] || "ส่งคำขอไม่สำเร็จ ลองใหม่อีกครั้ง"); };
ACT.frresp = async a => { const r = await frApi("POST", "/friends/respond", { id: a.dataset.id, accept: a.dataset.a === "1" }); if (r.ok) { toast(a.dataset.a === "1" ? "เป็นเพื่อนกันแล้ว" : "ปฏิเสธแล้ว"); FRD.loaded = false; frLoad(); } else toast("ทำรายการไม่สำเร็จ"); };
ACT.frdel = async a => { if (!confirm("เลิกเป็นเพื่อนกับ " + a.dataset.id + " ไหม")) return; const r = await frApi("POST", "/friends/remove", { id: a.dataset.id }); if (r.ok) { FRD.loaded = false; frLoad(); } else toast("ลบไม่สำเร็จ"); };
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.id === "frid") ACT.fradd2(); });
(function () { const m = modeOf("friends"); if (!m) return; const o = SUBS.friends; SUBS.friends = a => { const r = o(a); if (r && typeof r.html === "string") r.html = modeHero(m) + r.html; return r; }; })();
