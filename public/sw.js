/**
 * Service worker for the TVK Nandhivaram Guduvancheri Municipality app.
 *
 * Deliberately conservative: member data is edited by admins and must never be
 * served stale, so nothing from the network is cached. The only job here is to
 * make the app installable and to show a readable page when the phone is offline
 * instead of the browser's error screen.
 */
const VERSION = "v1";
const SHELL_CACHE = `ward-tracker-shell-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only page loads get the offline fallback. Everything else — data, actions,
  // assets — is left to the browser so nothing is ever answered from a stale copy.
  if (request.mode !== "navigate" || request.method !== "GET") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(SHELL_CACHE);
      const fallback = await cache.match(OFFLINE_URL);
      return (
        fallback ??
        new Response("You are offline.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    })
  );
});
