/* DRISHTI-X offline shell: cache-first same-origin GETs, network-first navigations. */
const CACHE = 'drishti-v3';
const CORE = ['/safety', '/emergency', '/learn', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()).catch(() => {})
  );
});
self.addEventListener('activate', (event) => {
  // Drop caches from previous app versions so returning visitors never run
  // stale shells (e.g. pre-authentication-gate renders) from old caches.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .catch(() => {})
  );
});
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // NEVER intercept API traffic: cached auth/data responses would resurrect
  // logged-out sessions (stale /me 200) or mask fresh state. API goes direct.
  if (url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('/safety')))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
      return res;
    }))
  );
});

// Web Push (free, VAPID): show notification, focus/open app on click.
self.addEventListener('push', (event) => {
  let data = { title: 'DRISHTI-X alert', body: 'New warning — open the app.' };
  try { data = Object.assign(data, event.data ? event.data.json() : {}); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.svg',
      tag: data.tag || 'drishti-alert',
    })
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((wins) => {
      for (const w of wins) { try { w.focus(); return; } catch (e) {} }
      return self.clients.openWindow('/alerts');
    })
  );
});
