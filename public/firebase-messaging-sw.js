// MDF-AlertNet Service Worker for Web Push & FCM Background Notifications
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase App for MDF-AlertNet in Service Worker
try {
  firebase.initializeApp({
    apiKey: "AIzaSyDFRb0ndm8i51O-l_cnpFF8U4l6vIjFPmY",
    authDomain: "mdf-2abd6.firebaseapp.com",
    databaseURL: "https://mdf-2abd6-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mdf-2abd6",
    storageBucket: "mdf-2abd6.firebasestorage.app",
    messagingSenderId: "394826122700",
    appId: "1:394826122700:web:a0585f4fe7be049af18969"
  });
} catch (e) {
  console.warn('[SW] Firebase init note:', e);
}

// Immediate Service Worker activation so notifications work immediately without reload
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Helper function to safely display notifications across all platforms (iOS Safari, Android, Desktop)
function showPushNotification(title, body, targetUrl, alertId, extraData) {
  const safeTitle = title || '🚨 MDF-AlertNet • سوق مسقط الحرة';
  const safeBody = body || 'طلب مساعدة وتفويض عاجل من صالة الكاشير';

  // Detect iOS Safari / PWA environment
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  // Standard options compatible with iOS Safari PWA + Android + Desktop
  const options = {
    body: safeBody,
    icon: '/icon.png',
    badge: '/icon.png',
    tag: alertId ? `mdf_${alertId}` : `mdf_push_${Date.now()}`,
    data: {
      url: targetUrl || '/?tab=alerts',
      alertId: alertId || '',
      ...(extraData || {})
    }
  };

  // Add rich interactive options only on platforms supporting them (Android / Chrome / Desktop)
  // On iOS Safari WebKit, passing unsupported properties can throw TypeError
  if (!isIOS) {
    try {
      options.vibrate = [300, 100, 300, 100, 300];
      options.requireInteraction = true;
      options.renotify = true;
    } catch (e) {}
  }

  return self.registration.showNotification(safeTitle, options)
    .catch((err) => {
      console.warn('[SW] Rich showNotification failed, falling back to minimal payload for iOS:', err);
      // Minimal fallback specifically for iOS Safari APNs constraints
      return self.registration.showNotification(safeTitle, {
        body: safeBody,
        icon: '/icon.png',
        data: { url: targetUrl || '/?tab=alerts' }
      });
    });
}

// Primary WebPush Push Event Listener (Works universally on iOS Safari PWA + WebPush + APNs)
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received from APNs / WebPush server');
  let title = '🚨 MDF-AlertNet • سوق مسقط الحرة';
  let body = 'طلب مساعدة وتفويض عاجل من صالة الكاشير';
  let alertId = '';
  let customData = {};

  if (event.data) {
    try {
      const rawData = event.data.json();
      console.log('[SW] Push JSON payload:', rawData);

      title = rawData.notification?.title || rawData.data?.title || rawData.title || title;
      body = rawData.notification?.body || rawData.data?.body || rawData.data?.message || rawData.message || rawData.body || body;
      alertId = rawData.data?.alertId || rawData.data?.id || rawData.alertId || '';
      customData = rawData.data || rawData;
    } catch (jsonErr) {
      try {
        const text = event.data.text();
        if (text) body = text;
      } catch (textErr) {}
    }
  }

  const targetUrl = alertId ? `/?alertId=${encodeURIComponent(alertId)}&tab=alerts` : '/?tab=alerts';

  event.waitUntil(
    showPushNotification(title, body, targetUrl, alertId, customData)
  );
});

// Handle push notification click and navigate to the maintenance request / alert
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const alertId = (event.notification.data && event.notification.data.alertId) || '';
  const targetUrl = (event.notification.data && event.notification.data.url) || (alertId ? `/?alertId=${encodeURIComponent(alertId)}&tab=alerts` : '/?tab=alerts');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. If an existing window/tab is open, focus it and tell it to navigate
      for (const client of windowClients) {
        if (client.url && client.url.includes(self.location.origin)) {
          client.postMessage({
            type: 'OPEN_ALERT',
            alertId: alertId,
            url: targetUrl
          });
          if ('focus' in client) {
            return client.focus();
          }
        }
      }

      // 2. If no window is currently open, open a new window with the direct URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
