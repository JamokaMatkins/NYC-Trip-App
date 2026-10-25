// Offline cache for the NYC trip app. Bump VERSION to push an update.
const VERSION = 'nyc27-2026-10-25.9';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const pn = new URL(req.url).pathname; const nav = req.mode === 'navigate' || pn.endsWith('/') || pn.endsWith('/index.html');
    const key = nav ? './index.html' : req;
    if (nav) {
      // Page: network first (so updates show right away), cached copy when offline
      const fresh = await Promise.race([fetch(req, {cache: 'no-store'}).then(r => r.ok ? r : null).catch(() => null), new Promise(r => setTimeout(() => r(null), 4000))]);
      if (fresh) { c.put(key, fresh.clone()); return fresh; }
      return (await c.match(key, {ignoreSearch: true})) || fetch(req);
    }
    const hit = await c.match(key, {ignoreSearch: true});
    const net = fetch(req).then(res => { if (res.ok) c.put(key, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || c.match('./index.html');
  }));
});
