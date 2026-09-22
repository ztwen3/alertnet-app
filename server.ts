import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp as initAdminApp, getApps as getAdminApps, cert, App as AdminApp } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import { initializeApp as initClientApp, getApps as getClientApps } from 'firebase/app';
import { getDatabase, ref as dbRef, onChildAdded, get as dbGet } from 'firebase/database';
import webpush from 'web-push';

const RTDB_URL = 'https://mdf-2abd6-default-rtdb.europe-west1.firebasedatabase.app';
const FIREBASE_API_KEY = 'AIzaSyDFRb0ndm8i51O-l_cnpFF8U4l6vIjFPmY';

export const VAPID_PUBLIC_KEY = 'BPeJnM8NyY-l6I--XJTQ5pgXFXVbeVCYZq8YdmSmnhir2xJabkJdNDbHONSAt3vOHeiO1gm8YJUtqJNdmonGeng';
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'oOdYCLO7NzZnJuhmSTFblFJToN6GPfLkdikzw0obv5Q';
export const VAPID_SUBJECT = 'mailto:support@muscatdutyfree.com';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ WebPush VAPID details configured successfully');
} catch (vapidErr) {
  console.warn('WebPush VAPID setup note:', vapidErr);
}

// Map to track alerts that have already been notified to prevent duplicate pushes
const notifiedAlertIds = new Map<string, number>();

function shouldBroadcastAlert(alertId: string): boolean {
  if (!alertId) return true;
  const now = Date.now();
  // Prune entries older than 10 minutes
  for (const [id, time] of notifiedAlertIds.entries()) {
    if (now - time > 10 * 60 * 1000) {
      notifiedAlertIds.delete(id);
    }
  }
  if (notifiedAlertIds.has(alertId)) {
    return false;
  }
  notifiedAlertIds.set(alertId, now);
  return true;
}

// Lazy Firebase Admin SDK initialization
let firebaseAdminApp: AdminApp | null = null;

function getFirebaseAdmin(): AdminApp | null {
  if (firebaseAdminApp) return firebaseAdminApp;
  try {
    const existing = getAdminApps();
    if (existing.length > 0 && existing[0]) {
      firebaseAdminApp = existing[0];
      return firebaseAdminApp;
    }

    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (serviceAccountEnv) {
      const credentials = typeof serviceAccountEnv === 'string' ? JSON.parse(serviceAccountEnv) : serviceAccountEnv;
      firebaseAdminApp = initAdminApp({
        credential: cert(credentials),
        databaseURL: RTDB_URL,
      });
      console.log('✅ Firebase Admin initialized with Service Account credentials');
    } else {
      // Initialize with project ID / default application credentials
      firebaseAdminApp = initAdminApp({
        projectId: 'mdf-2abd6',
        databaseURL: RTDB_URL,
      });
      console.log('ℹ️ Firebase Admin initialized with default project config (mdf-2abd6)');
    }
    return firebaseAdminApp;
  } catch (err) {
    console.warn('Firebase Admin SDK initialization note:', err);
    return null;
  }
}

/**
 * Broadcasts Push Notifications (WebPush + FCM Admin + APNs) to all active staff tokens and subscriptions
 */
async function sendFCMAlertBroadcast(alert: {
  id: string;
  title: string;
  message: string;
  type: string;
  location: string;
  deviceId: string;
}): Promise<{ successCount: number; failureCount: number; totalTokens: number }> {
  try {
    // 1. Fetch all registered staff tokens from Realtime Database (/staffTokens)
    const tokensRes = await fetch(`${RTDB_URL}/staffTokens.json?auth=${FIREBASE_API_KEY}`);
    if (!tokensRes.ok) {
      console.warn('Could not fetch /staffTokens from RTDB:', await tokensRes.text());
      return { successCount: 0, failureCount: 0, totalTokens: 0 };
    }

    const tokensData = await tokensRes.json();
    if (!tokensData) {
      console.log('No registered staff FCM tokens in /staffTokens');
      return { successCount: 0, failureCount: 0, totalTokens: 0 };
    }

    const isVoid = alert.type === 'VOID' || alert.type === 'it_support' || (alert.title && alert.title.includes('VOID'));
    const channelId = isVoid ? 'mdf_urgent_channel' : 'mdf_alerts_channel';
    const locPart = alert.location || alert.deviceId ? ` [${alert.location || alert.deviceId}]` : '';
    const pushTitle = isVoid
      ? `🚨 طلب تفويض عاجل (VOID)${locPart}`
      : `🚨 ${alert.title || 'طلب نداء ومساعدة'}${locPart}`;
    const pushBody = alert.message || 'طلب مساعدة وتفويض فوري من الجهاز';

    // Mark as notified in memory to prevent duplicate triggers from simultaneous web/RTDB events
    if (alert.id) {
      shouldBroadcastAlert(alert.id);
    }

    const webpushPayload = JSON.stringify({
      title: pushTitle,
      body: pushBody,
      notification: {
        title: pushTitle,
        body: pushBody,
        icon: '/icon.png',
        badge: '/icon.png'
      },
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [300, 100, 300, 100, 300],
      requireInteraction: true,
      data: {
        alertId: alert.id || '',
        id: alert.id || '',
        deviceId: alert.deviceId || '',
        location: alert.location || '',
        type: alert.type || '',
        title: pushTitle,
        body: pushBody,
        message: alert.message || pushBody,
        url: alert.id ? `/?alertId=${encodeURIComponent(alert.id)}&tab=alerts` : '/?tab=alerts'
      }
    });

    let successCount = 0;
    let failureCount = 0;
    const standardFcmTokens: string[] = [];

    // 2. Dispatch via WebPush protocol to any device with subscription or endpoint
    const tokenKeys = Object.keys(tokensData);
    for (const key of tokenKeys) {
      const item = tokensData[key];
      const sub = item?.subscription;
      const endpoint = item?.endpoint || (item?.token && item.token.startsWith('http') ? item.token : null);
      const keys = item?.keys || (sub && sub.keys);

      if (sub && sub.endpoint) {
        try {
          // Send high-priority WebPush with APNs headers (WITHOUT apns-expiration: 0 which drops locked iPhone notifications)
          await webpush.sendNotification(sub, webpushPayload, {
            TTL: 60 * 60 * 24,
            urgency: 'high',
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'alert'
            }
          });
          successCount++;
          console.log(`✅ WebPush notification delivered to device [${item?.deviceName || key}]`);
        } catch (wpErr: any) {
          console.warn(`WebPush delivery attempt note for [${key}]:`, wpErr?.message || wpErr);
          if (wpErr?.statusCode === 404 || wpErr?.statusCode === 410) {
            // Subscription expired or unregistered
            fetch(`${RTDB_URL}/staffTokens/${key}.json?auth=${FIREBASE_API_KEY}`, { method: 'DELETE' }).catch(() => {});
          }
        }
      } else if (endpoint && keys) {
        try {
          await webpush.sendNotification({ endpoint, keys }, webpushPayload, {
            TTL: 60 * 60 * 24,
            urgency: 'high',
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'alert'
            }
          });
          successCount++;
          console.log(`✅ WebPush direct endpoint delivered to [${item?.deviceName || key}]`);
        } catch (wpErr: any) {
          console.warn(`Direct endpoint delivery note:`, wpErr?.message);
        }
      } else {
        const tok = item?.token || item?.fcmToken;
        if (tok && typeof tok === 'string' && tok.trim() !== '' && !tok.startsWith('http')) {
          if (!standardFcmTokens.includes(tok)) {
            standardFcmTokens.push(tok);
          }
        }
      }
    }

    // 3. Dispatch via FCM Admin Multicast for native Android / standard FCM tokens
    if (standardFcmTokens.length > 0) {
      console.log(`📡 Sending FCM High-Priority Push to ${standardFcmTokens.length} active device(s)...`);

      const message: MulticastMessage = {
        tokens: standardFcmTokens,
        notification: {
          title: pushTitle,
          body: pushBody,
        },
        data: {
          alertId: alert.id || '',
          id: alert.id || '',
          deviceId: alert.deviceId || '',
          location: alert.location || '',
          type: alert.type || '',
          title: alert.title || '',
          message: alert.message || '',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          ttl: 60 * 60 * 24,
          notification: {
            title: pushTitle,
            body: pushBody,
            channelId: channelId,
            icon: 'ic_stat_notification',
            color: '#D2122E',
            sound: 'default',
            priority: 'max',
            visibility: 'public',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              alert: {
                title: pushTitle,
                body: pushBody,
              },
              badge: 1,
              sound: 'default',
              'content-available': 1,
              category: 'MDF_ALERT',
            },
          },
        },
        webpush: {
          headers: {
            Urgency: 'high',
          },
          notification: {
            title: pushTitle,
            body: pushBody,
            icon: '/icon.png',
            badge: '/icon.png',
            vibrate: [300, 100, 300, 100, 300],
            requireInteraction: true,
            data: {
              alertId: alert.id || '',
              url: '/',
            },
          },
          fcmOptions: {
            link: '/',
          },
        },
      };

      const adminApp = getFirebaseAdmin();
      if (adminApp) {
        try {
          const messaging = getMessaging(adminApp);
          const response = await messaging.sendEachForMulticast(message);
          console.log(`📡 FCM Admin SDK Broadcast Result: ${response.successCount} sent, ${response.failureCount} failed.`);
          successCount += response.successCount;
          failureCount += response.failureCount;

          // Inspect responses and automatically prune unregistered / stale tokens from RTDB
          response.responses.forEach((resp, idx) => {
            const tok = standardFcmTokens[idx];
            if (resp.success) {
              console.log(`✅ FCM token delivered [${tok.slice(-8)}]`);
            } else {
              const errCode = resp.error?.code || 'unknown';
              console.warn(`⚠️ FCM token delivery failed [${tok.slice(-8)}]: ${errCode}`);
              if (
                errCode === 'messaging/registration-token-not-registered' ||
                errCode === 'messaging/invalid-registration-token' ||
                errCode === 'messaging/invalid-argument'
              ) {
                tokenKeys.forEach((key) => {
                  if (tokensData[key]?.token === tok || tokensData[key]?.fcmToken === tok) {
                    fetch(`${RTDB_URL}/staffTokens/${key}.json?auth=${FIREBASE_API_KEY}`, { method: 'DELETE' }).catch(() => {});
                  }
                });
              }
            }
          });
        } catch (adminErr: any) {
          console.warn('FCM Admin SDK dispatch note:', adminErr?.message || adminErr);
        }
      }
    }

    return {
      successCount,
      failureCount,
      totalTokens: tokenKeys.length,
    };
  } catch (fcmErr) {
    console.error('Error during FCM broadcast dispatch:', fcmErr);
    return { successCount: 0, failureCount: 0, totalTokens: 0 };
  }
}

/**
 * Broadcasts an FCM / WebPush Push Notification when a staff member accepts / goes to solve an alert
 */
async function sendFCMResponderBroadcast(params: {
  alertId: string;
  responderName: string;
  location?: string;
  deviceId?: string;
  type?: string;
}): Promise<{ successCount: number; failureCount: number; totalTokens: number }> {
  try {
    const tokensRes = await fetch(`${RTDB_URL}/staffTokens.json?auth=${FIREBASE_API_KEY}`);
    if (!tokensRes.ok) {
      return { successCount: 0, failureCount: 0, totalTokens: 0 };
    }

    const tokensData = await tokensRes.json();
    if (!tokensData) return { successCount: 0, failureCount: 0, totalTokens: 0 };

    const loc = params.location || params.deviceId || '';
    const pushTitle = `🏃‍♂️ ${params.responderName} ذاهب لحل البلاغ!`;
    const pushBody = loc 
      ? `قام ${params.responderName} بقبول البلاغ [${loc}] وهو في الطريق للمعالجة الآن.`
      : `قام ${params.responderName} بقبول البلاغ وهو في الطريق للمعالجة الآن.`;

    const webpushPayload = JSON.stringify({
      title: pushTitle,
      body: pushBody,
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: {
        alertId: params.alertId || '',
        type: 'responder_attending',
        url: params.alertId ? `/?alertId=${encodeURIComponent(params.alertId)}&tab=alerts` : '/?tab=alerts'
      }
    });

    let successCount = 0;
    let failureCount = 0;
    const standardTokens: string[] = [];

    const tokenKeys = Object.keys(tokensData);
    for (const key of tokenKeys) {
      const item = tokensData[key];
      const sub = item?.subscription;
      const endpoint = item?.endpoint || (item?.token && item.token.startsWith('http') ? item.token : null);
      const keys = item?.keys || (sub && sub.keys);

      if (sub && sub.endpoint) {
        try {
          await webpush.sendNotification(sub, webpushPayload, {
            TTL: 60 * 60 * 2,
            urgency: 'high',
            headers: { 'apns-priority': '10', 'apns-push-type': 'alert' }
          });
          successCount++;
        } catch (wpErr) {}
      } else if (endpoint && keys) {
        try {
          await webpush.sendNotification({ endpoint, keys }, webpushPayload, { TTL: 60 * 60 * 2, urgency: 'high' });
          successCount++;
        } catch (wpErr) {}
      } else {
        const tok = item?.token || item?.fcmToken;
        if (tok && typeof tok === 'string' && tok.trim() !== '' && !tok.startsWith('http')) {
          if (!standardTokens.includes(tok)) standardTokens.push(tok);
        }
      }
    }

    if (standardTokens.length > 0) {
      const adminApp = getFirebaseAdmin();
      if (adminApp) {
        try {
          const messaging = getMessaging(adminApp);
          const response = await messaging.sendEachForMulticast({
            tokens: standardTokens,
            notification: { title: pushTitle, body: pushBody },
            data: { alertId: params.alertId || '', click_action: 'FLUTTER_NOTIFICATION_CLICK' },
            android: { priority: 'high', notification: { title: pushTitle, body: pushBody, channelId: 'mdf_alerts_channel', icon: 'ic_stat_notification', color: '#10B981' } },
            apns: { headers: { 'apns-priority': '10', 'apns-push-type': 'alert' }, payload: { aps: { alert: { title: pushTitle, body: pushBody }, sound: 'default', badge: 1 } } }
          });
          successCount += response.successCount;
          failureCount += response.failureCount;
        } catch (adminErr) {}
      }
    }

    return { successCount, failureCount, totalTokens: tokenKeys.length };
  } catch (err) {
    console.error('Error in sendFCMResponderBroadcast:', err);
    return { successCount: 0, failureCount: 0, totalTokens: 0 };
  }
}


// Live RTDB Watcher: Listens for incoming alerts added directly to /alerts in Firebase Realtime Database
// (from ESP32 hardware buttons, REST API, or other devices) and broadcasts push notifications automatically
function setupRTDBAlertListener() {
  try {
    const existingApps = getClientApps();
    const clientApp = existingApps.find(a => a.name === 'server-rtdb-listener') || 
                      initClientApp({
                        apiKey: FIREBASE_API_KEY,
                        databaseURL: RTDB_URL,
                        projectId: 'mdf-2abd6'
                      }, 'server-rtdb-listener');

    const db = getDatabase(clientApp);
    const alertsRef = dbRef(db, 'alerts');

    let initialLoadComplete = false;
    // Mark existing alerts so we don't broadcast old historical alerts on server startup
    dbGet(alertsRef).then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          if (child.key) {
            notifiedAlertIds.set(child.key, Date.now());
          }
        });
      }
      initialLoadComplete = true;
      console.log('✅ RTDB Alert Live Watcher connected (listening for incoming alerts in real-time)');
    }).catch((err) => {
      console.warn('Initial RTDB alerts sync note:', err);
      initialLoadComplete = true;
    });

    onChildAdded(alertsRef, (snapshot) => {
      if (!initialLoadComplete) return;
      const key = snapshot.key;
      if (!key) return;

      const raw = snapshot.val() || {};
      const status = raw.status || 'pending';
      const createdAt = raw.createdAt || raw.timestamp || Date.now();

      // Only broadcast for pending / new alerts created recently (< 3 minutes)
      const ageMs = Date.now() - (typeof createdAt === 'number' ? createdAt : Date.now());
      if ((status === 'pending' || status === 'New') && ageMs < 3 * 60 * 1000) {
        if (shouldBroadcastAlert(key)) {
          console.log(`🔔 New alert detected from RTDB live stream [${key}]: ${raw.title || raw.type}`);
          sendFCMAlertBroadcast({
            id: key,
            title: raw.title || (raw.type === 'VOID' ? 'طلب تفويض عاجل (VOID)' : 'طلب نداء ومساعدة'),
            message: raw.message || 'طلب مساعدة وتفويض عاجل من صالة الكاشير',
            type: raw.type || 'customer_assistance',
            location: raw.location || raw.deviceID || raw.deviceId || '',
            deviceId: raw.deviceId || raw.deviceID || '',
          }).catch((err) => {
            console.error('Error broadcasting RTDB incoming alert:', err);
          });
        }
      }
    }, (err) => {
      console.error('RTDB onChildAdded listener error:', err);
    });
  } catch (err) {
    console.warn('Could not setup RTDB alert listener:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Realtime Database Alert Watcher for background push notifications
  setupRTDBAlertListener();

  // Middleware for parsing JSON and urlencoded
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS headers for ESP32 and external devices
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-ESP32-Key');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Muscat Duty Free Alert System (Realtime Database & FCM Gateway)',
      timestamp: new Date().toISOString(),
      rtdbUrl: RTDB_URL,
      fcmAdminReady: !!getFirebaseAdmin(),
    });
  });

  // ESP32 System Status API
  app.get('/api/esp32/status', (req, res) => {
    res.json({
      online: true,
      system: 'Muscat Duty Free ESP32 Alert Gateway (RTDB & FCM Push)',
      version: '2.5.0',
      database: 'Firebase Realtime Database europe-west1',
      rtdbPath: '/alerts',
      fcmPath: '/staffTokens',
      activePort: PORT,
      time: new Date().toISOString()
    });
  });

  // Manual FCM Push Broadcast Endpoint
  app.post('/api/fcm/broadcast', async (req, res) => {
    try {
      const { title, message, type, location, deviceId, id } = req.body || {};
      const result = await sendFCMAlertBroadcast({
        id: id || `manual_${Date.now()}`,
        title: title || 'تنبيه طوارئ ومساعدة',
        message: message || 'إشعار فوري من إدارة السوق الحرة',
        type: type || 'customer_assistance',
        location: location || 'صالة المغادرون',
        deviceId: deviceId || 'ADMIN_PANEL',
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // VAPID Public Key endpoint for clients
  app.get('/api/fcm/vapid-public-key', (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  // Direct Device Test FCM / WebPush Notification Endpoint (For testing a specific token, subscription, or current device)
  app.post('/api/fcm/test-device', async (req, res) => {
    try {
      const { token, subscription, platform, deviceName, title, message, delayMs } = req.body || {};

      if (delayMs && typeof delayMs === 'number' && delayMs > 0 && delayMs <= 30000) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const testTitle = title || `🚨 فحص إشعار شاشة القفل (${platform || 'iPhone'})`;
      const testBody = message || `تجربة ناجحة: إشعار MDF AlertNet يعمل خارج التطبيق وعلى شاشة القفل! (${new Date().toLocaleTimeString('ar-OM')})`;

      // 1. If WebPush subscription is provided (iOS Safari PWA, Chrome, Firefox WebPush)
      const targetSubscription = subscription || (token && token.startsWith('http') ? { endpoint: token } : null);
      if (targetSubscription && targetSubscription.endpoint) {
        try {
          const webpushPayload = JSON.stringify({
            title: testTitle,
            body: testBody,
            icon: '/icon.png',
            badge: '/icon.png',
            vibrate: [300, 100, 300],
            requireInteraction: true,
            data: {
              test: 'true',
              timestamp: String(Date.now()),
              url: '/?tab=alerts'
            }
          });

          await webpush.sendNotification(targetSubscription, webpushPayload, {
            TTL: 60 * 60 * 2,
            urgency: 'high',
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'alert'
            }
          });

          console.log(`✅ Direct WebPush test sent successfully to [${deviceName || platform || 'device'}]`);
          return res.json({
            success: true,
            method: 'webpush',
            info: `تم إرسال إشعار فحص WebPush بنجاح إلى جهازك (${deviceName || platform || 'iPhone/PWA'})`
          });
        } catch (wpErr: any) {
          console.warn('Direct WebPush test dispatch error:', wpErr?.message || wpErr);
        }
      }

      // 2. Standard FCM Token dispatch (Android native / FCM registered tokens)
      if (token && typeof token === 'string' && token.trim() !== '' && !token.startsWith('http')) {
        const adminApp = getFirebaseAdmin();
        if (adminApp) {
          try {
            const messaging = getMessaging(adminApp);
            const sendRes = await messaging.send({
              token: token,
              notification: {
                title: testTitle,
                body: testBody,
              },
              data: {
                alertId: `test_${Date.now()}`,
                test: 'true',
                timestamp: String(Date.now()),
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
              },
              android: {
                priority: 'high',
                notification: {
                  title: testTitle,
                  body: testBody,
                  channelId: 'mdf_alerts_channel',
                  icon: 'ic_stat_notification',
                  color: '#10B981',
                  sound: 'default'
                }
              },
              apns: {
                headers: {
                  'apns-priority': '10',
                  'apns-push-type': 'alert'
                },
                payload: {
                  aps: {
                    alert: { title: testTitle, body: testBody },
                    sound: 'default',
                    badge: 1
                  }
                }
              },
              webpush: {
                headers: {
                  Urgency: 'high'
                },
                notification: {
                  title: testTitle,
                  body: testBody,
                  icon: '/icon.png',
                  badge: '/icon.png',
                  vibrate: [300, 100, 300]
                }
              }
            });

            return res.json({
              success: true,
              messageId: sendRes,
              recipient: token.slice(-10),
              info: `Push sent successfully via Admin SDK to [${deviceName || platform || 'device'}]`
            });
          } catch (sendErr: any) {
            console.warn('Admin SDK direct send note:', sendErr?.message || sendErr);
            return res.json({
              success: false,
              error: sendErr?.message || 'FCM direct delivery failed',
              info: `FCM Token verification issue: ${sendErr?.code || sendErr?.message}`
            });
          }
        }
      } else {
        // Fallback to broadcast test to all registered staff devices
        const result = await sendFCMAlertBroadcast({
          id: `test_${Date.now()}`,
          title: testTitle,
          message: testBody,
          type: 'customer_assistance',
          location: 'فحص النظام',
          deviceId: 'TEST_CONSOLE'
        });
        return res.json({ success: true, ...result, isBroadcast: true });
      }
    } catch (err: any) {
      console.error('Error sending test push notification:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Staff Responder Notification Endpoint (when a staff member taps "I am attending / ذاهب للحل")
  app.post('/api/fcm/respond', async (req, res) => {
    try {
      const { alertId, responderName, location, deviceId, type } = req.body || {};
      if (!responderName) {
        return res.status(400).json({ success: false, error: 'responderName is required' });
      }
      const result = await sendFCMResponderBroadcast({
        alertId: alertId || '',
        responderName,
        location: location || 'صالة السوق الحرة',
        deviceId: deviceId || '',
        type: type || 'responder_attending',
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Primary ESP32 Alert Trigger Endpoint
  // Handles POST requests from ESP32 physical hardware buttons, writes to RTDB, and sends FCM Push Notifications
  const handleIncomingAlert = async (req: express.Request, res: express.Response) => {
    try {
      const payload = req.body || {};
      console.log('Incoming ESP32/REST Alert Payload:', JSON.stringify(payload));

      // Support direct ESP32 REST JSON format as well as FCM legacy format
      const notificationObj = payload.notification || {};
      const rawTitle = notificationObj.title || payload.title || payload.alert_type || '';
      let rawMessage = notificationObj.body || payload.body || payload.message || 'طلب مساعدة عاجل من الجهاز!';
      const rawType = payload.type || (rawTitle.includes('الدعم') || rawTitle.includes('كمبيوتر') || rawMessage.includes('كمبيوتر') ? 'it_support' : 'customer_assistance');
      const deviceID = payload.deviceID || payload.deviceId || payload.device_id || 'POS-012';
      const location = payload.location || payload.device || deviceID || 'PN0012';
      const status = payload.status || 'pending';

      const now = new Date();
      const timestampStr = now.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const createdAtMs = Date.now();

      // Write directly to Firebase Realtime Database at /alerts.json
      const rtdbAlertPayload = {
        deviceID,
        deviceId: deviceID,
        type: rawType,
        title: rawTitle || (rawType === 'VOID' ? `طلب تفويض إلغاء (${deviceID})` : rawType === 'it_support' ? 'الدعم الفني والكمبيوتر' : 'تنبيه طوارئ ومساعدة'),
        message: rawMessage,
        location,
        status,
        responder: payload.responder || '',
        timestamp: createdAtMs,
        createdAt: createdAtMs,
        formattedTime: timestampStr
      };

      const rtdbRes = await fetch(`${RTDB_URL}/alerts.json?auth=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rtdbAlertPayload)
      });

      if (!rtdbRes.ok) {
        const errorText = await rtdbRes.text();
        console.error('Realtime Database REST error:', errorText);
        res.status(500).json({ error: 'Failed to write alert to Realtime Database', details: errorText });
        return;
      }

      const rtdbData = await rtdbRes.json();
      const generatedKey = rtdbData.name;
      console.log('Successfully pushed alert to Firebase Realtime Database key:', generatedKey);

      // Trigger asynchronous FCM push notification to all background Android devices
      sendFCMAlertBroadcast({
        id: generatedKey,
        title: rtdbAlertPayload.title,
        message: rtdbAlertPayload.message,
        type: rtdbAlertPayload.type,
        location: rtdbAlertPayload.location,
        deviceId: rtdbAlertPayload.deviceId,
      }).catch((fcmErr) => {
        console.error('Background FCM dispatch warning:', fcmErr);
      });

      res.status(200).json({
        success: true,
        message: 'Notification pushed to Firebase Realtime Database and FCM dispatched.',
        id: generatedKey,
        databaseURL: RTDB_URL,
        path: `/alerts/${generatedKey}`,
        alert: {
          id: generatedKey,
          ...rtdbAlertPayload
        }
      });
    } catch (err: unknown) {
      console.error('Error handling ESP32 request:', err);
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Internal Server Error'
      });
    }
  };

  app.post('/api/esp32/alert', handleIncomingAlert);
  app.post('/api/trigger-alert', handleIncomingAlert);
  app.post('/api/alert', handleIncomingAlert);
  app.post('/api/alerts', handleIncomingAlert);
  app.post('/fcm/send', handleIncomingAlert);

  // Vite development middleware vs Static Production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Muscat Duty Free Alert Gateway running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

