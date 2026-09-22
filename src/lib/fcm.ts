import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { CapacitorNativeService } from './capacitorService';
import { registerStaffDeviceToken, unregisterStaffDeviceToken } from './firebase';
import { AuthUser } from '../types';

export const fcmConfig = {
  apiKey: "AIzaSyDFRb0ndm8i51O-l_cnpFF8U4l6vIjFPmY",
  authDomain: "mdf-2abd6.firebaseapp.com",
  databaseURL: "https://mdf-2abd6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mdf-2abd6",
  storageBucket: "mdf-2abd6.firebasestorage.app",
  messagingSenderId: "394826122700",
  appId: "1:394826122700:web:a0585f4fe7be049af18969"
};

export const DEFAULT_VAPID_KEY = "BPeJnM8NyY-l6I--XJTQ5pgXFXVbeVCYZq8YdmSmnhir2xJabkJdNDbHONSAt3vOHeiO1gm8YJUtqJNdmonGeng";

const VAPID_KEY_STORAGE_KEY = 'mdf_fcm_vapid_key';
const FCM_TOKEN_STORAGE_KEY = 'mdf_fcm_device_token';
const WEBPUSH_SUB_STORAGE_KEY = 'mdf_webpush_subscription';

let messagingInstance: Messaging | null = null;

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getSavedVapidKey(): string {
  if (typeof localStorage === 'undefined') return DEFAULT_VAPID_KEY;
  const saved = localStorage.getItem(VAPID_KEY_STORAGE_KEY);
  if (saved && saved.trim() !== '') return saved.trim();
  return DEFAULT_VAPID_KEY;
}

export function saveVapidKey(key: string): void {
  if (typeof localStorage === 'undefined') return;
  if (key && key.trim()) {
    localStorage.setItem(VAPID_KEY_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(VAPID_KEY_STORAGE_KEY);
  }
}

export function getSavedFcmToken(): string {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(FCM_TOKEN_STORAGE_KEY) || '';
}

export function getSavedSubscription(): any {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WEBPUSH_SUB_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getFcmMessaging(): Messaging | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const existingApps = getApps();
    const fcmApp = existingApps.find(a => a.name === 'mdf-alert-fcm') || 
                   initializeApp(fcmConfig, 'mdf-alert-fcm');
    if (!messagingInstance) {
      messagingInstance = getMessaging(fcmApp);
    }
    return messagingInstance;
  } catch (err) {
    console.warn('FCM Messaging initialization note:', err);
    return null;
  }
}

export interface FcmInitResult {
  success: boolean;
  token: string | null;
  subscription?: any;
  error?: string;
  permission: NotificationPermission | string;
  platform: 'android' | 'ios' | 'web';
  deviceName: string;
  isIosBrowserTab?: boolean;
}

/**
 * Check if the current browser environment is Safari on iOS/iPadOS
 */
export function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isWebkit = /WebKit/i.test(ua);
  return isIOS && isWebkit && !CapacitorNativeService.isNative();
}

/**
 * Check if the app is currently running in standalone PWA mode (added to Home Screen)
 */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Synchronizes FCM token and WebPush subscription with the logged-in staff member in /staffTokens and /userDevices
 */
export async function syncUserFcmToken(user: AuthUser | null): Promise<void> {
  if (!user || !user.employeeId) return;

  const isNative = CapacitorNativeService.isNative();
  const platform = CapacitorNativeService.getPlatform();
  const deviceName = CapacitorNativeService.getDeviceName();
  
  // Check native token first, otherwise web token
  let token = CapacitorNativeService.getDeviceFcmToken();
  if (!token) {
    token = getSavedFcmToken();
  }

  const subscription = getSavedSubscription();

  if (token) {
    await registerStaffDeviceToken(user.employeeId, token, {
      name: user.displayName,
      role: user.role,
      department: user.department,
      platform,
      deviceName,
      isNative,
      appVersion: '2.5.0',
      subscription
    });
  }
}

/**
 * Removes current device's token on logout without erasing other user devices
 */
export async function clearUserFcmToken(user: AuthUser | null): Promise<void> {
  if (!user || !user.employeeId) return;
  const token = CapacitorNativeService.getDeviceFcmToken() || getSavedFcmToken();
  await unregisterStaffDeviceToken(user.employeeId, token || undefined);
}

/**
 * Requests Push notification permission and registers FCM token upon explicit user interaction
 */
export async function initPushNotifications(vapidKeyOverride?: string): Promise<FcmInitResult> {
  const platform = CapacitorNativeService.getPlatform();
  const deviceName = CapacitorNativeService.getDeviceName();

  // If running natively on Android or iOS, Capacitor Native handles Push registration
  if (CapacitorNativeService.isNative()) {
    try {
      await CapacitorNativeService.init();
      const token = CapacitorNativeService.getDeviceFcmToken();
      return {
        success: true,
        token,
        permission: 'granted',
        platform,
        deviceName
      };
    } catch (err: any) {
      return {
        success: false,
        token: null,
        error: err?.message,
        permission: 'default',
        platform,
        deviceName
      };
    }
  }

  // Check Web Push availability
  const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const hasNotificationAPI = typeof window !== 'undefined' && 'Notification' in window;
  const isIOS = isIOSSafari();
  const isPWA = isStandalonePWA();

  // On iOS Safari in regular browser tabs (non-PWA), Notification API is disabled by Apple (requires Add to Home Screen in iOS 16.4+)
  if (isIOS && !isPWA && !hasNotificationAPI) {
    return {
      success: false,
      token: null,
      error: 'على نظام iOS Safari، تتطلب الإشعارات تثبيت التطبيق أولاً على الشاشة الرئيسية (مشاركة -> إضافة إلى الصفحة الرئيسية)',
      permission: 'unsupported',
      platform: 'ios',
      deviceName,
      isIosBrowserTab: true
    };
  }

  if (!hasServiceWorker || !hasNotificationAPI) {
    return {
      success: false,
      token: null,
      error: 'الإشعارات الفورية غير مدعومة في هذا المتصفح. تأكد من استخدام Safari أو Chrome مع HTTPS',
      permission: 'unsupported',
      platform: isIOS ? 'ios' : 'web',
      deviceName
    };
  }

  try {
    // 1. Register Firebase Messaging Service Worker
    let registration: ServiceWorkerRegistration | null = null;
    try {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      await navigator.serviceWorker.ready;
      console.log('✅ Firebase Messaging Service Worker is ready:', registration);
    } catch (swErr: any) {
      console.warn('Service worker registration note:', swErr);
      return {
        success: false,
        token: null,
        error: `فشل تسجيل Service Worker: ${swErr?.message || 'خطأ غير معروف'}`,
        permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
        platform: isIOS ? 'ios' : 'web',
        deviceName
      };
    }

    // 2. Request notification permission safely with user interaction
    let permission: NotificationPermission = 'default';
    if (typeof Notification !== 'undefined' && typeof Notification.requestPermission === 'function') {
      try {
        permission = await Notification.requestPermission();
      } catch (permErr) {
        console.warn('Permission request note:', permErr);
        permission = Notification.permission || 'default';
      }
    }

    if (permission !== 'granted') {
      return {
        success: false,
        token: null,
        error: permission === 'denied' 
          ? 'تم رفض إذن الإشعارات من إعدادات المتصفح. يرجى تفعيل الإشعارات في إعدادات الموقع'
          : 'لم يتم منح إذن الإشعارات بعد',
        permission,
        platform: isIOS ? 'ios' : 'web',
        deviceName
      };
    }

    // 3. Obtain Messaging instance
    const messaging = getFcmMessaging();
    if (!messaging || !registration) {
      return {
        success: false,
        token: null,
        error: 'خدمة Firebase Messaging غير متوفرة',
        permission,
        platform: isIOS ? 'ios' : 'web',
        deviceName
      };
    }

    // 4. Retrieve Device Token & Native WebPush Subscription
    const effectiveVapidKey = vapidKeyOverride || getSavedVapidKey();
    let token: string | null = null;
    let pushSubscription: any = null;

    // A. Direct WebPush subscription with PushManager (works universally on iOS Safari PWA + Chrome + Firefox)
    try {
      if ('pushManager' in registration) {
        let sub = await registration.pushManager.getSubscription();
        if (!sub) {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(effectiveVapidKey)
          });
        }
        if (sub) {
          pushSubscription = sub.toJSON();
          token = sub.endpoint;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(WEBPUSH_SUB_STORAGE_KEY, JSON.stringify(pushSubscription));
          }
          console.log('✅ WebPush Native PushManager subscription active:', pushSubscription);
        }
      }
    } catch (subErr) {
      console.warn('Native pushManager subscription note:', subErr);
    }

    // B. Also attempt Firebase FCM Token for FCM multicast compatibility
    try {
      const tokenOptions: { serviceWorkerRegistration: ServiceWorkerRegistration; vapidKey?: string } = {
        serviceWorkerRegistration: registration,
      };
      if (effectiveVapidKey && effectiveVapidKey.trim() !== '') {
        tokenOptions.vapidKey = effectiveVapidKey.trim();
      }
      const fcmTok = await getToken(messaging, tokenOptions);
      if (fcmTok) {
        token = fcmTok;
        console.log('✅ FCM Web Push token obtained:', fcmTok);
      }
    } catch (primaryTokenErr: any) {
      console.warn('Primary getToken note:', primaryTokenErr);
    }

    if (!token && !pushSubscription) {
      const existingToken = getSavedFcmToken();
      if (existingToken) {
        token = existingToken;
      } else {
        return {
          success: false,
          token: null,
          error: 'تم منح الإذن ولكن تعذر توليد رمز الجهاز (Web Push / FCM Token). يرجى التحقق من اتصال الإنترنت وتحديث الصفحة.',
          permission,
          platform: isIOS ? 'ios' : 'web',
          deviceName
        };
      }
    }

    const effectiveFinalToken = token || (pushSubscription ? pushSubscription.endpoint : '');

    if (effectiveFinalToken) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(FCM_TOKEN_STORAGE_KEY, effectiveFinalToken);
      }

      // Automatically register to current saved user in Realtime Database
      try {
        const savedUserStr = localStorage.getItem('mdf_logged_user');
        if (savedUserStr) {
          const user: AuthUser = JSON.parse(savedUserStr);
          await registerStaffDeviceToken(user.employeeId, effectiveFinalToken, {
            name: user.displayName,
            role: user.role,
            department: user.department,
            platform: isIOS ? 'ios' : 'web',
            deviceName,
            isNative: false,
            appVersion: '2.5.0',
            subscription: pushSubscription
          });
        }
      } catch (syncErr) {
        console.warn('Token sync to DB note:', syncErr);
      }
    }

    // 5. Setup foreground message listener
    try {
      onMessage(messaging, (payload) => {
        console.log('📬 Foreground FCM Web Push Message received:', payload);
        const title = payload.notification?.title || payload.data?.title || 'MDF-AlertNet • بلاغ عاجل';
        const body = payload.notification?.body || payload.data?.body || payload.data?.message || 'يوجد بلاغ صيانة ومساعدة جديد';
        const alertId = payload.data?.alertId || '';

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            const notif = new Notification(title, {
              body,
              icon: '/icon.png',
              badge: '/icon.png',
              tag: alertId || 'fcm-foreground-alert',
              data: {
                alertId,
                url: alertId ? `/?alertId=${encodeURIComponent(alertId)}&tab=alerts` : '/?tab=alerts'
              }
            });

            notif.onclick = (e) => {
              e.preventDefault();
              window.focus();
              window.location.href = alertId ? `/?alertId=${encodeURIComponent(alertId)}&tab=alerts` : '/?tab=alerts';
            };
          } catch (notifErr) {
            console.warn('Foreground notification display note:', notifErr);
          }
        }
      });
    } catch (msgErr) {
      console.warn('onMessage listener note:', msgErr);
    }

    return {
      success: true,
      token: effectiveFinalToken,
      subscription: pushSubscription,
      permission,
      platform: isIOS ? 'ios' : 'web',
      deviceName
    };
  } catch (err: any) {
    console.error('Error setting up push notifications:', err);
    return {
      success: false,
      token: null,
      error: err?.message || 'Failed to initialize notifications',
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
      platform: isIOS ? 'ios' : 'web',
      deviceName
    };
  }
}

/**
 * Trigger a real test push notification through server endpoint
 */
export async function sendTestPushToDevice(
  token: string,
  deviceName: string,
  platform: string,
  options?: { delayMs?: number; title?: string; message?: string }
): Promise<any> {
  const subscription = getSavedSubscription();
  const res = await fetch('/api/fcm/test-device', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      subscription,
      deviceName,
      platform,
      delayMs: options?.delayMs || 0,
      title: options?.title || '🧪 فحص إشعارات MDF AlertNet السحابية',
      message: options?.message || `تم التحقق بنجاح من استقبال الإشعارات على جهازك (${deviceName}) في ${new Date().toLocaleTimeString('ar-OM')}`
    })
  });
  return res.json();
}
