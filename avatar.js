/* วาดตัวละครและฉากห้อง */
const INK = "#3B2A24";

function figure(L, mood, rx) {
  rx = rx || 46;
  const sk = L.skin, hc = L.hc, oc = L.oc, oc2 = DARKO[oc] || oc, g = L.g, hs = L.hs || "bob";
  let back = "", bangs = "";
  if (hs === "short") {
    back = `<circle cx="0" cy="-6" r="52" fill="${hc}"/>`;
    bangs = `<path d="M-50 -2 C-54 -58 54 -58 50 -2 C40 -16 24 -22 0 -14 C-24 -22 -40 -16 -50 -2 Z" fill="${hc}"/>`;
  } else {
    back = `<circle cx="0" cy="-4" r="56" fill="${hc}"/><ellipse cx="-54" cy="14" rx="9" ry="20" fill="${hc}"/><ellipse cx="54" cy="14" rx="9" ry="20" fill="${hc}"/>`;
    if (hs === "long") back += `<ellipse cx="-52" cy="34" rx="12" ry="36" fill="${hc}"/><ellipse cx="52" cy="34" rx="12" ry="36" fill="${hc}"/>`;
    if (hs === "buns") back += `<circle cx="-40" cy="-50" r="16" fill="${hc}"/><circle cx="40" cy="-50" r="16" fill="${hc}"/>`;
    bangs = `<path d="M-52 -4 C-56 -64 56 -64 52 -4 C42 -24 22 -28 0 -18 C-22 -28 -42 -24 -52 -4 Z" fill="${hc}"/><path d="M-4 -58 C-12 -76 8 -80 10 -64" fill="none" stroke="${hc}" stroke-width="5" stroke-linecap="round"/>`;
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
  else if (mood === "proud") { eyes = proud; mouth = `<path d="M-13 28 Q0 48 13 28 Z" fill="#8A4A3A"/><path d="M-6 38 Q0 44 6 38 Q0 34 -6 38 Z" fill="#F4A58A"/>`; }
  else if (mood === "eat") { eyes = open; mouth = `<ellipse class="chew" cx="0" cy="32" rx="9" ry="8" fill="#8A4A3A"/>`; }
  else { eyes = open; mouth = smile; }
  let acc = "";
  if (L.acc === "glasses") acc = `<circle cx="-20" cy="14" r="14" fill="none" stroke="${INK}" stroke-width="2.5"/><circle cx="20" cy="14" r="14" fill="none" stroke="${INK}" stroke-width="2.5"/><path d="M-6 14 L6 14" stroke="${INK}" stroke-width="2.5"/>`;
  if (L.acc === "beanie") acc = `<path d="M-54 -10 C-58 -70 58 -70 54 -10 Z" fill="#E57373"/><rect x="-57" y="-16" width="114" height="13" rx="6" fill="#C75B5B"/><circle cx="0" cy="-66" r="8" fill="#F4E3E3"/>`;
  const aL = -(rx - 2), aR = rx - 2, hL = -(rx + 4), hR = rx + 4, lw = 14 + Math.round((rx - 42) / 5);
  return `<g class="fig">
<rect x="${-19 - (lw - 14) / 2}" y="-28" width="${lw}" height="22" rx="6" fill="${sk}"/><rect x="${5 - (lw - 14) / 2 + 0}" y="-28" width="${lw}" height="22" rx="6" fill="${sk}"/>
<ellipse cx="-13" cy="-4" rx="16" ry="8" fill="#fff"/><ellipse cx="13" cy="-4" rx="16" ry="8" fill="#fff"/>
<g class="armL"><ellipse cx="${aL}" cy="-54" rx="11" ry="26" fill="${oc}" transform="rotate(12 ${aL} -54)"/><circle cx="${hL}" cy="-30" r="9" fill="${sk}"/></g>
<g class="armR"><ellipse cx="${aR}" cy="-54" rx="11" ry="26" fill="${oc}" transform="rotate(-12 ${aR} -54)"/><circle cx="${hR}" cy="-30" r="9" fill="${sk}"/></g>
<g class="torso"><ellipse cx="0" cy="-54" rx="${rx}" ry="38" fill="${oc}"/><rect x="-22" y="-46" width="44" height="20" rx="9" fill="${oc2}"/></g>
<g transform="translate(0,-134)"><g class="head">${back}<ellipse cx="0" cy="6" rx="50" ry="48" fill="${sk}"/>${bangs}${brow}${eyes}${lash}<ellipse cx="-34" cy="30" rx="${bl}" ry="5" fill="#F7B7A3"/><ellipse cx="34" cy="30" rx="${bl}" ry="5" fill="#F7B7A3"/>${mouth}${acc}</g></g>
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
  const own = o.owned || {};
  const sunY = o.period === "morning" ? 78 : o.period === "noon" ? 46 : o.period === "evening" ? 88 : 52;
  let sky = `<rect x="28" y="30" width="80" height="76" rx="10" fill="${P.sky}"/><circle class="sunball" cx="${night ? 84 : 70}" cy="${sunY - 10}" r="${night ? 11 : 13}" fill="${P.sun}"/>`;
  if (night) sky += `<circle class="star" cx="44" cy="46" r="1.8" fill="#fff"/><circle class="star" style="animation-delay:.9s" cx="52" cy="90" r="1.8" fill="#fff"/><circle class="star" style="animation-delay:1.7s" cx="96" cy="96" r="1.8" fill="#fff"/><circle class="star" style="animation-delay:.4s" cx="60" cy="62" r="1.3" fill="#fff"/>`;
  else sky += `<ellipse class="cloud" cx="52" cy="88" rx="20" ry="7" fill="#fff"/>`;
  const lights = [170, 210, 250, 290, 332].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 36 : 32}" r="5" fill="${i % 2 ? "#F7B7A3" : "#FBE3A1"}"/>`).join("");
  const lamp = (o.period === "evening" || night) ? `<circle class="glow" cx="326" cy="150" r="${night ? 34 : 24}" fill="#FBE3A1" opacity="${night ? 0.28 : 0.35}"/><rect x="324" y="160" width="4" height="70" fill="${night ? "#8A7BB0" : "#C9A98A"}"/><path d="M314 160 L338 160 L333 142 L319 142 Z" fill="#FBE3A1"/>` : "";
  const plant = own["room:plant"] ? `<rect x="42" y="214" width="30" height="34" rx="6" fill="#E98E70"/><path d="M57 214 C44 190 48 172 57 162 C66 172 70 190 57 214 Z" fill="#8CC79A"/><path d="M57 214 C70 196 80 190 86 196 C82 208 70 214 57 214 Z" fill="#6FB583"/>` : "";
  const poster = own["room:poster"] ? `<rect x="130" y="52" width="46" height="60" rx="4" fill="${P.frame}"/><rect x="135" y="57" width="36" height="50" rx="2" fill="${night ? "#6A5F8C" : "#F7D58A"}"/><circle cx="153" cy="76" r="9" fill="${night ? "#FBE3A1" : "#F4A58A"}"/><path d="M135 107 L148 90 L158 100 L165 92 L171 107 Z" fill="${night ? "#4A3F66" : "#8CC79A"}"/>` : "";
  const m = o.mood;
  const fx = (m === "eat" ? `<g transform="translate(250,100)"><g class="heart"><path d="M0 0 C-6 -8 -14 -2 0 10 C14 -2 6 -8 0 0 Z" fill="#F4A58A"/></g></g><g transform="translate(130,96)"><g class="heart h2"><path d="M0 0 C-6 -8 -14 -2 0 10 C14 -2 6 -8 0 0 Z" fill="#F4A58A"/></g></g><g transform="translate(190,166)"><g class="bowl"><path d="M-16 0 H16 Q14 16 0 16 Q-14 16 -16 0 Z" fill="#fff" stroke="#E8C9A8" stroke-width="2"/><ellipse cx="0" cy="0" rx="16" ry="4" fill="#FBF5DC"/></g></g>` : "")
    + (m === "work" ? `<g transform="translate(252,112)"><g class="sweat"><path d="M0 -8 C6 0 6 6 0 6 C-6 6 -6 0 0 -8 Z" fill="#8CC8E8"/></g></g><g transform="translate(112,84)"><g class="spark"><path d="M0 -8 l2.5 5.5 5.5 2.5 -5.5 2.5 -2.5 5.5 -2.5 -5.5 -5.5 -2.5 5.5 -2.5 z" fill="#FBE3A1"/></g></g><g transform="translate(274,74)"><g class="spark"><path d="M0 -8 l2.5 5.5 5.5 2.5 -5.5 2.5 -2.5 5.5 -2.5 -5.5 -5.5 -2.5 5.5 -2.5 z" fill="#FBE3A1"/></g></g>` : "")
    + (m === "sleepy" ? `<g transform="translate(250,118)" fill="#8A7BB0" font-weight="700"><text class="zz" font-size="16" x="0" y="0">z</text><text class="zz" style="animation-delay:1s" font-size="22" x="12" y="-12">Z</text><text class="zz" style="animation-delay:2s" font-size="28" x="26" y="-26">Z</text></g>` : "")
    + (m === "hungry" ? `<g transform="translate(302,214)"><g class="rumble"><rect x="-40" y="-16" width="80" height="28" rx="14" fill="#fff"/><text x="0" y="3" text-anchor="middle" font-size="13" font-weight="600" fill="#8A4A3A">ครืดดด</text></g></g>` : "");
  const l1 = o.l1 || "", l2 = o.l2 || "";
  const bubble = l1 ? `<g class="bubble"><rect x="228" y="56" width="136" height="${l2 ? 48 : 34}" rx="16" fill="#fff"/><path d="M242 ${l2 ? 102 : 88} L236 ${l2 ? 120 : 106} L258 ${l2 ? 102 : 88} Z" fill="#fff"/><text x="296" y="${l2 ? 76 : 78}" text-anchor="middle" font-size="13" font-weight="600" fill="#6B4A3A">${l1}</text>${l2 ? `<text x="296" y="94" text-anchor="middle" font-size="12" fill="#8A4A3A">${l2}</text>` : ""}</g>` : "";
  const fm = m === "work" ? "proud" : m;
  return `<svg class="scene ${m}" viewBox="0 0 380 300" role="img" aria-label="ตัวละครของคุณในห้อง"><rect width="380" height="300" fill="${P.wall}"/><rect y="250" width="380" height="50" fill="${P.floor}"/><rect y="246" width="380" height="6" fill="${P.frame}"/>
${sky}<rect x="24" y="26" width="88" height="84" rx="12" fill="none" stroke="${P.frame}" stroke-width="5"/><path d="M70 30 V106 M28 68 H108" stroke="${P.wall}" stroke-width="4"/>
<path d="M150 18 Q190 40 230 18 Q270 40 310 18 Q340 34 366 20" fill="none" stroke="#C9A98A" stroke-width="1.5"/>${lights}${poster}${lamp}${plant}
<ellipse cx="190" cy="268" rx="124" ry="18" fill="${P.rug}"/><ellipse cx="190" cy="268" rx="98" ry="12" fill="${P.rug2}"/><ellipse cx="190" cy="270" rx="46" ry="7" fill="${night ? "#3B3355" : "#E8C9A8"}" opacity="0.7"/>
<g transform="translate(190,268)">${figure(o.look, fm === "eat" ? "eat" : fm, o.rx)}</g>
${fx}${bubble}</svg>`;
}
