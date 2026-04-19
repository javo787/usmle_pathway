// public/sw.js — Service Worker

const CACHE_NAME = 'muslim-doctor-v1';

// ==========================================
// УСТАНОВКА
// ==========================================
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ==========================================
// PUSH УВЕДОМЛЕНИЯ
// ==========================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || '📋 Muslim Doctor';
  const options = {
    body: data.body || 'Бугунги режангизни тузинг!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'daily-reminder',
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'open', title: '✅ Очиш' },
      { action: 'dismiss', title: '❌ Кейин' }
    ],
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ==========================================
// УВЕДОМЛЕНИЯДАН КЛИК
// ==========================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Агар илова очиқ бўлса — фокус
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Очиқ бўлмаса — янги tab
      return clients.openWindow(urlToOpen);
    })
  );
});
