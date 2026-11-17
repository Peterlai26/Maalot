/* หน้าตาน้องก้อน: ดวงตา คิ้ว ปาก แก้ม (พิกัดหัว: ตาอยู่ที่ x ±20 y 14) */
function wearEyes(id, sk) {
  const D = "#3B2A24", pair = (f) => `<g class="blink">${f(-20, -1)}${f(20, 1)}</g>`, hi = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`;
  switch (id) {
    case "bean": return pair((x) => `<ellipse cx="${x}" cy="14" rx="5.5" ry="6.5" fill="${D}"/>${hi(x + 2, 12, 1.8)}`);
    case "big": return pair((x) => `<ellipse cx="${x}" cy="14" rx="10" ry="13" fill="${D}"/>${hi(x + 3, 8, 4.5)}${hi(x - 3, 19, 2.2)}`);
    case "sharp": return pair((x, s) => `<ellipse cx="${x}" cy="14" rx="9.5" ry="7" fill="${D}" transform="rotate(${-12 * s} ${x} 14)"/>${hi(x + 3, 12, 2.4)}`);
    case "droopy": return pair((x) => `<ellipse cx="${x}" cy="14" rx="8" ry="11" fill="${D}"/>${hi(x + 3, 9, 3)}<rect x="${x - 10}" y="1" width="20" height="9.5" fill="${sk}"/><path d="M${x - 10} 10.5H${x + 10}" stroke="${D}" stroke-width="3.5" stroke-linecap="round"/>`);
    case "star": return pair((x) => `<ellipse cx="${x}" cy="14" rx="9" ry="12" fill="${D}"/><path d="${starPath(x + 3, 9, 5)}" fill="#fff"/>${hi(x - 3, 19, 1.8)}`);
    case "heart": return pair((x) => `<path d="${heartPath(x, 13, 8)}" fill="#F0679B"/>${hi(x - 3, 10, 2)}`);
    case "happy": return `<path d="M-30 18Q-20 4-10 18" fill="none" stroke="${D}" stroke-width="4" stroke-linecap="round"/><path d="M10 18Q20 4 30 18" fill="none" stroke="${D}" stroke-width="4" stroke-linecap="round"/>`;
  }
  return `<g class="blink"><ellipse cx="-20" cy="14" rx="8" ry="11" fill="${D}"/><ellipse cx="20" cy="14" rx="8" ry="11" fill="${D}"/><circle cx="-17" cy="9" r="3.5" fill="#fff"/><circle cx="23" cy="9" r="3.5" fill="#fff"/><circle cx="-22" cy="18" r="1.8" fill="#fff"/><circle cx="18" cy="18" r="1.8" fill="#fff"/></g>`;
}
function wearBrow(id, g, c) {
  const P = (d, w) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  switch (id) {
    case "none": return "";
    case "arch": return P("M-31 -1Q-20 -11-9 -3", 3) + P("M9 -3Q20 -11 31 -1", 3);
    case "flat": return P("M-31 -4L-10 -4", 3.5) + P("M10 -4L31 -4", 3.5);
    case "thick": return P("M-31 -3L-10 -6", 6) + P("M10 -6L31 -3", 6);
    case "dot": return `<circle cx="-20" cy="-5" r="3.2" fill="${c}"/><circle cx="20" cy="-5" r="3.2" fill="${c}"/>`;
    case "cool": return P("M-31 -8L-10 -2", 4) + P("M10 -2L31 -8", 4);
    case "worry": return P("M-31 -2L-10 -8", 3.5) + P("M10 -8L31 -2", 3.5);
  }
  return g === "male" ? P("M-31 -2L-11 -6", 3.5) + P("M11 -6L31 -2", 3.5) : "";
}
function wearMouth(id) {
  const M = "#8A4A3A", S = (d) => `<path d="${d}" fill="none" stroke="${M}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  switch (id) {
    case "tiny": return S("M-4 32Q0 36 4 32");
    case "grin": return `<path d="M-13 28Q0 29 13 28Q10 43 0 43Q-10 43-13 28Z" fill="${M}"/><path d="M-11 28.5Q0 29.5 11 28.5L10 33Q0 34-10 33Z" fill="#fff"/>`;
    case "open": return `<ellipse cx="0" cy="34" rx="7" ry="6" fill="${M}"/><path d="M-4 37Q0 33 4 37Q0 40-4 37Z" fill="#F4A58A"/>`;
    case "cat": return S("M-13 29Q-6 39 0 31Q6 39 13 29");
    case "smirk": return S("M-8 33Q2 39 11 28");
  }
  return S("M-8 30Q0 40 8 30");
}
function wearCheek(id, bl) {
  const E = (x, rx, ry, f, o) => `<ellipse cx="${x}" cy="30" rx="${rx}" ry="${ry}" fill="${f}" ${o ? `opacity="${o}"` : ""}/>`;
  switch (id) {
    case "none": return "";
    case "big": return E(-34, bl + 4, 7, "#F7A0A8", .8) + E(34, bl + 4, 7, "#F7A0A8", .8);
    case "freckles": { const d = (x, y) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#B5764F"/>`; return E(-34, bl, 5, "#F7B7A3", .6) + E(34, bl, 5, "#F7B7A3", .6) + [-38, -33, -28].map((x, i) => d(x, 28 + (i % 2) * 5)).join("") + [28, 33, 38].map((x, i) => d(x, 28 + (i % 2) * 5)).join(""); }
    case "lines": { const L = (x) => `<path d="M${x} 25l3 6M${x + 5} 24l3 6M${x + 10} 25l3 6" stroke="#E88A8A" stroke-width="2" stroke-linecap="round"/>`; return L(-44) + L(31); }
    case "heart": return `<path d="${heartPath(-34, 30, 5.5)}" fill="#F4849C"/><path d="${heartPath(34, 30, 5.5)}" fill="#F4849C"/>`;
  }
  return E(-34, bl, 5, "#F7B7A3") + E(34, bl, 5, "#F7B7A3");
}
