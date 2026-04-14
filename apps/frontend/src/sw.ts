/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { createHandlerBoundToURL } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

// Immediately activate new service worker — don't wait for old tabs to close
self.skipWaiting();
clientsClaim();

// Clean old caches from previous versions
cleanupOutdatedCaches();

// Precache all build assets (injected by vite-plugin-pwa)
// cleanupOutdatedCaches() handles removing stale entries from previous builds
precacheAndRoute(self.__WB_MANIFEST, {
  // Ignore URL params so revised URLs match correctly
  ignoreURLParametersMatching: [/.*/],
});

// SPA navigation fallback — serve index.html for all navigation requests
let navigationHandler: any;
try {
  navigationHandler = createHandlerBoundToURL('/index.html');
} catch {
  // Fallback for development where index.html might not be precached
  navigationHandler = new NetworkFirst();
}

registerRoute(new NavigationRoute(navigationHandler));

// Runtime caching: API calls — NetworkFirst with cache fallback
registerRoute(
  ({ url }) => url.pathname.startsWith('/api'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 5 * 60 }),
    ],
  }),
);

// Runtime caching: i18n locale files — StaleWhileRevalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/i18n/') && url.pathname.endsWith('.json'),
  new StaleWhileRevalidate({
    cacheName: 'i18n-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  }),
);

// Runtime caching: images — CacheFirst with 7-day expiry
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  }),
);

// Runtime caching: fonts (Google Fonts, CDN) — CacheFirst with 30-day expiry
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
);

// Push notification handler
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: { title?: string; description?: string; url?: string; avatar?: string };
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Asoode', description: event.data.text() };
  }

  const title = payload.title || 'Asoode';
  const options: NotificationOptions = {
    body: payload.description || '',
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    data: { url: payload.url || '/' },
    tag: 'asoode-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler — open the app URL
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICK', url });
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    }),
  );
});

