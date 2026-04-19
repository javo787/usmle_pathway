'use client';
// components/NotificationManager.jsx
// Бу компонентни layout.js га қўшинг: <NotificationManager />

import { useEffect } from 'react';

// =============================================
// КУНДАЛИК ЭСЛАТМАЛАР ЖАДВАЛИ
// Вақтларни ўзингизга мос ўзгартиринг
// =============================================
const REMINDERS = [
  { hour: 6,  minute: 0,  title: '🌅 Субҳ вақти!',        body: 'бугунги режани тузинг.' },
  { hour: 9,  minute: 0,  title: '📚 Ўқиш вақти!',        body: 'UWorld ва First Aid — бошланг!' },
  { hour: 13, minute: 0,  title: '🕐 Тушлик паузаси',      body: 'режангизни текширинг.' },
  { hour: 17, minute: 0,  title: '📖 Анки вақти!',         body: 'Кун охирида такрорлашни унутманг.' },
  { hour: 21, minute: 30, title: '🌙 Кун якуни',           body: 'Рефлексия ёзинг ва эртанги режани тузинг!' },
  { hour: 22, minute: 30, title: '😴 Ухлаш вақти!',        body: 'Телефонни қўйинг. Эрта ётиш — муваффақият.' },
];

function scheduleLocalReminders() {
  // Browser Notification API орқали (Push сервер сиз бўлмаса ҳам ишлайди)
  const now = new Date();

  REMINDERS.forEach(({ hour, minute, title, body }) => {
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    // Агар бугун ўтиб кетган бўлса — эртага
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();

    setTimeout(() => {
      // Service Worker орқали уведомление
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            tag: `reminder-${hour}-${minute}`,
            renotify: true,
            requireInteraction: hour === 21, // Кун якуни — обязательное
          });
        });
      } else {
        // Fallback: оддий Notification
        new Notification(title, { body, icon: '/icon-192.png' });
      }

      // Эртага ҳам режалаштир (рекурсив — 24 соат кейин)
      setTimeout(() => scheduleLocalReminders(), 24 * 60 * 60 * 1000 - delay + 1000);
    }, delay);
  });
}

export default function NotificationManager() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    // 1. Service Worker'ни рўйхатга олиш
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('✅ SW registered:', reg.scope);
        })
        .catch((err) => {
          console.error('SW registration failed:', err);
        });
    }

    // 2. Рухсат сўраш ва эслатмаларни режалаштириш
    if (Notification.permission === 'granted') {
      scheduleLocalReminders();
    } else if (Notification.permission !== 'denied') {
      // Биринчи мартада рухсат сўраймиз — фақат 1 кунда бир марта
      const lastAsked = localStorage.getItem('notif_permission_asked');
      const today = new Date().toISOString().split('T')[0];

      if (lastAsked !== today) {
        localStorage.setItem('notif_permission_asked', today);

        // Кичик пауза — саҳифа юкланганидан кейин сўраймиз
        setTimeout(() => {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              scheduleLocalReminders();
            }
          });
        }, 3000);
      }
    }
  }, []);

  return null; // UI йўқ — фақат логика
}
