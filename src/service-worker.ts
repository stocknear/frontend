/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

function getIconPath(size: string) {
  return new URL(`/pwa-${size}.png`, self.location.origin).href;
}

const ICONS = {
  DEFAULT: getIconPath('192x192'),
  SMALL: getIconPath('64x64'),
  LARGE: getIconPath('512x512')
};

self.addEventListener('install', (event) => {
  // Delete all existing caches on install
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('[SW] Deleting cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      console.log('[SW] Installed - no caching enabled');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('[SW] Deleting cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      console.log('[SW] Activated - claiming clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // No caching - always fetch from network
  return;
});

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let title = 'Stocknear';
  let body: string;
  let url = '/';

  try {
    const payload = event.data.text();
    try {
      const jsonData = JSON.parse(payload);
      if (jsonData.title) {
        title = jsonData.title;
        body = jsonData.body;
        url = jsonData.url || '/';
      } else {
        body = payload;
      }
    } catch {
      body = payload;
    }
  } catch {
    body = 'New notification';
  }

  const options: NotificationOptions = {
    body,
    icon: ICONS.DEFAULT,
    badge: ICONS.SMALL,
    timestamp: Date.now(),
    requireInteraction: true,
    tag: 'stocknear-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      suppressNotificationFrom: true,
      url: url
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlPath = event.notification.data.url || '/';
  const urlToOpen = new URL(urlPath, self.location.origin).href;

  event?.waitUntil(
    clients?.matchAll({ type: 'window', includeUncontrolled: true })?.then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients?.openWindow) {
        return clients?.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // All caching-related messages are ignored since caching is disabled
});

// The browser can re-mint a subscription on its own (key change, expiry). Without this the new
// endpoint never reaches the server and the device goes silent with no visible symptom.
self.addEventListener('pushsubscriptionchange', (event: any) => {
  event.waitUntil(
    (async () => {
      try {
        // Firefox hands us the replacement directly; use it before deriving anything.
        let subscription = event.newSubscription;

        if (!subscription) {
          // Chrome fires this event with neither property populated, so fall back to the
          // build-time public key (already shipped to the client - nothing secret is added to
          // the SW bundle). Preferred over oldSubscription's key, which on a rotation is dead.
          const applicationServerKey =
            import.meta.env.VITE_VAPID_PUBLIC_KEY ??
            event.oldSubscription?.options?.applicationServerKey;
          if (!applicationServerKey) return;

          subscription = await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        }

        // This can fire days later with no page open, so the auth cookie may have expired.
        const res = await fetch('/api/addPushSubscription', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription }),
        });
        if (!res.ok) {
          console.error('pushsubscriptionchange sync failed:', res.status);
        }
      } catch (error) {
        console.error('pushsubscriptionchange resubscribe failed:', error);
      }
    })()
  );
});