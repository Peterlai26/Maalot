/* วาดตัวละครและฉากห้อง */
const INK = "#3B2A24";

function figure(L, mood, rx) {
  rx = rx || 46; L = normLook(L);
  const sk = L.skin, hc = L.hc, oc = L.oc, oc2 = (typeof DARKO !== "undefined" && DARKO[oc]) || shade(oc, -0.09), g = L.g, hs = L.hs || "bob";
  let back = "", bangs = "";
  if (hs === "short") {
    back = `<circle cx="0" cy="-6" r="52" fill="${hc}"/>`;
    bangs = `<path d="M-50 -2 C-54 -58 54 -58 50 -2 C40 -16 24 -22 0 -14 C-24 -22 -40 -16 -50 -2 Z" fill="${hc}"/>`;
  } else {
    back = `<circle cx="0" cy="-4" r="56" fill="${hc}"/><ellipse cx="-54" cy="14" rx="9" ry="20" fill="${hc}"/><ellipse cx="54" cy="14" rx="9" ry="20" fill="${hc}"/>`;
    if (hs === "long") back += `<ellipse cx="-52" cy="34" rx="12" ry="36" fill="${hc}"/><ellipse cx="52" cy="34" rx="12" ry="36" fill="${hc}"/>`;
    if (hs === "buns") back += `<circle cx="-40" cy="-50" r="16" fill="${hc}"/><circle cx="40" cy="-50" r="16" fill="${hc}"/>`;
    if (hs === "ponytail") back += `<path d="M46 -22C88 -34 100 20 72 58C68 34 58 8 46 -22Z" fill="${hc}"/><circle cx="48" cy="-22" r="7" fill="#F29BB8"/>`;
    if (hs === "pigtails") back += `<ellipse cx="-64" cy="32" rx="13" ry="30" fill="${hc}" transform="rotate(10 -64 32)"/><ellipse cx="64" cy="32" rx="13" ry="30" fill="${hc}" transform="rotate(-10 64 32)"/><circle cx="-58" cy="-2" r="6" fill="#F29BB8"/><circle cx="58" cy="-2" r="6" fill="#F29BB8"/>`;
    if (hs === "topknot") back += `<circle cx="0" cy="-68" r="17" fill="${hc}"/><rect x="-9" y="-58" width="18" height="6" rx="3" fill="#F29BB8"/>`;
    if (hs === "curly") { back = `<circle cx="0" cy="-4" r="58" fill="${hc}"/>`; for (let a = 0; a < 360; a += 36) back += `<circle cx="${(Math.cos(a * Math.PI / 180) * 56).toFixed(1)}" cy="${(-4 + Math.sin(a * Math.PI / 180) * 54).toFixed(1)}" r="19" fill="${hc}"/>`; }
    bangs = `<path d="M-52 -4 C-56 -64 56 -64 52 -4 C42 -24 22 -28 0 -18 C-22 -28 -42 -24 -52 -4 Z" fill="${hc}"/><path d="M-4 -58 C-12 -76 8 -80 10 -64" fill="none" stroke="${hc}" stroke-width="5" stroke-linecap="round"/>`;
    if (hs === "messy") bangs = `<path d="M-52 -4L-50 -62L-36 -46L-30 -70L-16 -48L-6 -74L8 -50L20 -72L28 -48L42 -64L48 -40L52 -4C42 -24 22 -28 0 -18C-22 -28 -42 -24 -52 -4Z" fill="${hc}"/>`;
    if (hs === "curly") { bangs = `<path d="M-52 -4C-56 -50 56 -50 52 -4C46 -26 -46 -26 -52 -4Z" fill="${hc}"/>`; for (let x = -40; x <= 40; x += 16) bangs += `<circle cx="${x}" cy="-30" r="15" fill="${hc}"/>`; }
  }
  const brow = g === "male" ? `<path d="M-31 -2 L-11 -6" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><path d="M11 -6 L31 -2" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>` : "";
  const lash = g === "female" ? `<path d="M-27 8 L-33 3" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/><path d="M27 8 L33 3" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>` : "";
  const bl = g === "male" ? 6 : g === "female" ? 9 : 8;
  let eyes, mouth;
  const open = `<g class="blink"><ellipse cx="-20" cy="14" rx="8" ry="11" fill="${INK}"/><ellipse cx="20" cy="14" rx="8" ry="11" fill="${INK}"/><circle cx="-17" cy="9" r="3.5" fill="#fff"/><circle cx="23" cy="9" r="3.5" fill="#fff"/><circle cx="-22" cy="18" r="1.8" fill="#fff"/><circle cx="18" cy="18" r="1.8" fill="#fff"/></g>`;
  const sleepy = `<path d="M-30 14 Q-20 22 -10 14" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M10 14 Q20 22 30 14" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  const proud = `<path d="M-30 18 Q-20 4 -10 18" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M10 18 Q20 4 30 18" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  const smile = `<path d="M-8 30 Q0 40 8 30" fill="none" stroke="#8A4A3A" stroke-width="3" stroke-linecap="round"/>`;
  if (mood === "sleepy") { eyes = sleepy; mouth = `<ellipse cx="0" cy="34" rx="4" ry="3" fill="#8A4A3A"/>`; }
  else if (mood === "hungry") { eyes = sleepy; mouth = `<ellipse cx="0" cy="34" rx="5" ry="4" fill="#8A4A3A"/>`; }
  else if (mood === "sad") { eyes = open; mouth = `<path d="M-31 2 L-12 -7M12 -7 L31 2" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><path d="M-9 37 Q0 29 9 37" fill="none" stroke="#8A4A3A" stroke-width="3" stroke-linecap="round"/><path d="M-30 26 q4 6 0 9 q-4 -3 0 -9z" fill="#8CC8E8"/>`; }
  else if (mood === "proud" || mood === "joy") { eyes = proud; mouth = `<path d="M-13 28 Q0 48 13 28 Z" fill="#8A4A3A"/><path d="M-6 38 Q0 44 6 38 Q0 34 -6 38 Z" fill="#F4A58A"/>`; }
  else if (mood === "eat") { eyes = open; mouth = `<ellipse class="chew" cx="0" cy="32" rx="9" ry="8" fill="#8A4A3A"/>`; }
  else { eyes = open; mouth = smile; }
  const acc = wearFace(L.face) + wearHat(L.hat, hc);
  const aL = -(rx - 2), aR = rx - 2, hL = -(rx + 4), hR = rx + 4, lw = 14 + Math.round((rx - 42) / 5);
  return `<g class="fig">${wearBack(L.back, rx)}
<rect x="${-19 - (lw - 14) / 2}" y="-28" width="${lw}" height="22" rx="6" fill="${sk}"/><rect x="${5 - (lw - 14) / 2 + 0}" y="-28" width="${lw}" height="22" rx="6" fill="${sk}"/>
${wearShoes(L.shoe, lw)}
<g class="armL"><ellipse cx="${aL}" cy="-54" rx="11" ry="26" fill="${oc}" transform="rotate(12 ${aL} -54)"/><circle cx="${hL}" cy="-30" r="9" fill="${sk}"/></g>
<g class="armR"><ellipse cx="${aR}" cy="-54" rx="11" ry="26" fill="${oc}" transform="rotate(-12 ${aR} -54)"/><circle cx="${hR}" cy="-30" r="9" fill="${sk}"/><g transform="translate(${hR},-30)">${wearHand(L.hand)}</g></g>
<g class="torso"><ellipse cx="0" cy="-54" rx="${rx}" ry="38" fill="${oc}"/><rect x="-22" y="-46" width="44" height="20" rx="9" fill="${oc2}"/>${wearPattern(L.pt, rx, oc)}</g>
<g transform="translate(0,-134)"><g class="head">${back}<ellipse cx="0" cy="6" rx="50" ry="48" fill="${sk}"/>${bangs}${brow}${eyes}${lash}<ellipse cx="-34" cy="30" rx="${bl}" ry="5" fill="#F7B7A3"/><ellipse cx="34" cy="30" rx="${bl}" ry="5" fill="#F7B7A3"/>${mouth}${acc}</g></g>${wearNeck(L.neck)}${wearBackFront(L.back, rx)}
</g>`;
}

function periodOf(h) { return h >= 5 && h < 10 ? "morning" : h >= 10 && h < 16 ? "noon" : h >= 16 && h < 19 ? "evening" : "night"; }
const PAL = {
  morning: { wall: "#FFF1E3", floor: "#F3D9BF", sky: "#BFE3F2", sun: "#FBE3A1", rug: "#FBE3A1", rug2: "#FDEFC4", frame: "#E8C9A8" },
  noon: { wall: "#FFF8E1", floor: "#F0D2A8", sky: "#9FD3F0", sun: "#FAC775", rug: "#FBE3A1", rug2: "#FDEFC4", frame: "#E8C9A8" },
  evening: { wall: "#FBE0CF", floor: "#E8BFA0", sky: "#F5A98A", sun: "#F7D58A", rug: "#F5C99A", rug2: "#F9DDB8", frame: "#D9A98A" },
  night: { wall: "#3B3355", floor: "#4A3F66", sky: "#1E1A3A", sun: "#FBE3A1", rug: "#5A4F7C", rug2: "#6A5F8C", frame: "#6B5E8F" }
};

function scene(o) {
  const P = PAL[o.period], night = o.period === "night";
  const sunY = o.period === "morning" ? 78 : o.period === "noon" ? 46 : o.period === "evening" ? 88 : 52;
  const R = Object.assign({}, ROOM_DEFAULT, o.room || {}), cx = { P, night, sunY, period: o.period };
  const D = (slot) => { const t = RDRAW[slot] || {}, f = t[R[slot]] || t[ROOM_DEFAULT[slot]]; return f ? f(cx) : ""; };
  const m = o.mood;
  const fx = (m === "eat" ? `<g transform="translate(250,100)"><g class="heart"><path d="M0 0 C-6 -8 -14 -2 0 10 C14 -2 6 -8 0 0 Z" fill="#F4A58A"/></g></g><g transform="translate(130,96)"><g class="heart h2"><path d="M0 0 C-6 -8 -14 -2 0 10 C14 -2 6 -8 0 0 Z" fill="#F4A58A"/></g></g><g transform="translate(190,166)"><g class="bowl"><path d="M-16 0 H16 Q14 16 0 16 Q-14 16 -16 0 Z" fill="#fff" stroke="#E8C9A8" stroke-width="2"/><ellipse cx="0" cy="0" rx="16" ry="4" fill="#FBF5DC"/></g></g>` : "")
    + (m === "work" ? `<g transform="translate(252,112)"><g class="sweat"><path d="M0 -8 C6 0 6 6 0 6 C-6 6 -6 0 0 -8 Z" fill="#8CC8E8"/></g></g><g transform="translate(112,84)"><g class="spark"><path d="M0 -8 l2.5 5.5 5.5 2.5 -5.5 2.5 -2.5 5.5 -2.5 -5.5 -5.5 -2.5 5.5 -2.5 z" fill="#FBE3A1"/></g></g><g transform="translate(274,74)"><g class="spark"><path d="M0 -8 l2.5 5.5 5.5 2.5 -5.5 2.5 -2.5 5.5 -2.5 -5.5 -5.5 -2.5 5.5 -2.5 z" fill="#FBE3A1"/></g></g>` : "")
    + (m === "sleepy" ? `<g transform="translate(250,118)" fill="#8A7BB0" font-weight="700"><text class="zz" font-size="16" x="0" y="0">z</text><text class="zz" style="animation-delay:1s" font-size="22" x="12" y="-12">Z</text><text class="zz" style="animation-delay:2s" font-size="28" x="26" y="-26">Z</text></g>` : "")
    + (m === "sad" || m === "joy" ? `<g transform="translate(250,100)"><g class="heart"><path d="M0 0 C-6 -8 -14 -2 0 10 C14 -2 6 -8 0 0 Z" fill="#F4A58A"/></g></g><g transform="translate(130,96)"><g class="heart h2"><path d="M0 0 C-6 -8 -14 -2 0 10 C14 -2 6 -8 0 0 Z" fill="#F4A58A"/></g></g>` : "")
    + (m === "hungry" ? `<g transform="translate(302,214)"><g class="rumble"><rect x="-40" y="-16" width="80" height="28" rx="14" fill="#fff"/><text x="0" y="3" text-anchor="middle" font-size="13" font-weight="600" fill="#8A4A3A">ครืดดด</text></g></g>` : "");
  const l1 = o.l1 || "", l2 = o.l2 || "";
  const bubble = l1 ? `<g class="bubble"><rect x="228" y="56" width="136" height="${l2 ? 48 : 34}" rx="16" fill="#fff"/><path d="M242 ${l2 ? 102 : 88} L236 ${l2 ? 120 : 106} L258 ${l2 ? 102 : 88} Z" fill="#fff"/><text x="296" y="${l2 ? 76 : 78}" text-anchor="middle" font-size="13" font-weight="600" fill="#6B4A3A">${l1}</text>${l2 ? `<text x="296" y="94" text-anchor="middle" font-size="12" fill="#8A4A3A">${l2}</text>` : ""}</g>` : "";
  const fm = m === "work" ? "proud" : m;
  return `<svg class="scene ${m}" viewBox="0 0 380 300" role="img" aria-label="ตัวละครของคุณในห้อง"><rect width="380" height="300" fill="${P.wall}"/><rect y="250" width="380" height="50" fill="${P.floor}"/><rect y="246" width="380" height="6" fill="${P.frame}"/>
${D("wall")}${D("floor")}${D("win")}<rect x="24" y="26" width="88" height="84" rx="12" fill="none" stroke="${P.frame}" stroke-width="5"/><path d="M70 30 V106 M28 68 H108" stroke="${P.wall}" stroke-width="4"/>
${D("ceil")}${D("wallC")}${D("wallR")}${D("floorL")}${D("floorR")}
${D("rug")}<ellipse cx="190" cy="270" rx="46" ry="7" fill="${night ? "#3B3355" : "#E8C9A8"}" opacity="0.7"/>${D("pet")}
<g transform="translate(190,268)">${figure(o.look, fm === "eat" ? "eat" : fm, o.rx)}</g>
${fx}${bubble}</svg>`;
}
