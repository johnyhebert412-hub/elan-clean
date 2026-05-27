const CACHE = "elan-pilote-v0.4.9";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./logic.js",
  "./version.json",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
const NETWORK_FIRST_FILES = new Set([
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./logic.js",
  "./version.json"
]);

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => caches.open(CACHE))
      .then(cache => Promise.allSettled(APP_FILES.map(file => cache.add(file))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then(openClients => Promise.allSettled(openClients.map(client => client.navigate(client.url))))
  );
});

function requiresFreshResponse(request) {
  if (request.mode === "navigate") return true;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return NETWORK_FIRST_FILES.has(`.${url.pathname}`);
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  if (requiresFreshResponse(event.request)) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, clone));
      return response;
    }))
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(openClients => {
      if (openClients.length) return openClients[0].focus();
      return clients.openWindow("./");
    })
  );
});
