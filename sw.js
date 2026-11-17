/* Service worker: network-first so updates show up right after a deploy; cache is the offline fallback */
const V = "maalot-v75";
const CORE = ["./", "style.css", "data.js", "foods2.js", "avatar.js", "face.js", "install.js", "combos.js", "goals.js", "nutri.js", "myfoods.js", "settings2.js", "sync.js", "hub2.js", "today2.js", "tutorial.js", "iff2.js", "events.js", "core.js", "foodicons.js", "chipdrag.js", "app.js", "app2.js", "recipes.js", "app3.js", "musclemap.js", "modes.js", "logui.js", "uplift.js", "rig.js", "lib2.js", "exlib.js", "fit.js", "lifts.js", "gps.js", "recover.js", "log2.js", "landing.js", "reminders.js", "medals.js", "share.js", "mood.js", "items.js", "roomitems.js", "dress.js", "manifest.webmanifest", "logo.svg", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || !(u.origin === location.origin || /(^|\.)(fonts\.googleapis|fonts\.gstatic)\.com$/.test(u.hostname))) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok && res.type !== "opaqueredirect") { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
    return res;
  }).catch(() => caches.match(r).then(m => m || (r.mode === "navigate" ? caches.match("./") : Response.error()))));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { for (const c of cs) { if ("focus" in c) return c.focus(); } return self.clients.openWindow("./"); }));
});
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { }
  e.waitUntil(self.registration.showNotification(d.title || "Maalot (มาลด)", { body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", tag: "maalot-reminder" }));
});
