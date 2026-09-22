import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Alert, DevicePlatform } from '../types';

export type PushNotificationActionHandler = (alertId: string, alertData?: any) => void;

export class CapacitorNativeService {
  private static isInitialized = false;
  private static fcmToken: string | null = null;
  private static tokenCallbacks: Array<(token: string) => void> = [];
  private static notificationActionHandlers: PushNotificationActionHandler[] = [];
  
  // Deduplication cache: stores alert IDs and timestamps processed within last 30s
  private static processedAlerts = new Map<string, number>();

  public static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public static getPlatform(): DevicePlatform {
    const p = Capacitor.getPlatform();
    if (p === 'android') return 'android';
    if (p === 'ios') return 'ios';
    return 'web';
  }

  public static getDeviceName(): string {
    const platform = this.getPlatform();
    if (typeof navigator === 'undefined') return 'Unknown Device';
    const ua = navigator.userAgent;

    if (platform === 'ios') {
      if (/iPad/.test(ua)) return 'Apple iPad';
      if (/iPhone/.test(ua)) return 'Apple iPhone';
      return 'Apple iOS Device';
    }

    if (platform === 'android') {
      const match = ua.match(/Android\s+([\d.]+);?\s+([^;]+)/i);
      if (match && match[2]) {
        return match[2].trim();
      }
      return 'Android Device';
    }

    // Web / Desktop / Browser
    if (/Macintosh|Mac OS X/.test(ua)) return 'Desktop (macOS)';
    if (/Windows/.test(ua)) return 'Desktop (Windows)';
    if (/Linux/.test(ua)) return 'Desktop (Linux)';
    if (/Android/.test(ua)) return 'Mobile Browser (Android)';
    if (/iPhone|iPad/.test(ua)) return 'Mobile Browser (iOS)';
    return 'Web Client';
  }

  public static getDeviceFcmToken(): string | null {
    return this.fcmToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('mdf_fcm_device_token') : null);
  }

  public static onTokenReceived(callback: (token: string) => void): () => void {
    if (this.fcmToken) {
      callback(this.fcmToken);
    }
    this.tokenCallbacks.push(callback);
    return () => {
      this.tokenCallbacks = this.tokenCallbacks.filter(cb => cb !== callback);
    };
  }

  public static onNotificationActionPerformed(handler: PushNotificationActionHandler): () => void {
    this.notificationActionHandlers.push(handler);
    return () => {
      this.notificationActionHandlers = this.notificationActionHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Check if an alert was already processed/alerted recently to prevent duplicate sounds
   */
  public static shouldProcessAlert(alertId: string): boolean {
    const now = Date.now();
    // Clean up older items (> 60 seconds)
    for (const [id, time] of this.processedAlerts.entries()) {
      if (now - time > 60000) {
        this.processedAlerts.delete(id);
      }
    }

    if (this.processedAlerts.has(alertId)) {
      return false; // Already alerted
    }

    this.processedAlerts.set(alertId, now);
    return true;
  }

  public static async init() {
    if (this.isInitialized || !this.isNative()) return;
    this.isInitialized = true;

    try {
      // 1. Configure Dark Status Bar for full immersive experience
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0A0A0A' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (e) {
      console.warn('Capacitor StatusBar init note:', e);
    }

    try {
      // 2. Request Notification Permissions on Android & iOS (APNs / FCM)
      const pushPerm = await PushNotifications.checkPermissions();
      let isGranted = pushPerm.receive === 'granted';

      if (!isGranted) {
        const requested = await PushNotifications.requestPermissions();
        isGranted = requested.receive === 'granted';
      }

      if (isGranted) {
        // 3. Create high-priority Android Notification Channels if on Android
        if (this.getPlatform() === 'android') {
          await this.createAndroidNotificationChannels();
        }

        // 4. Register with Apple APNs / Google FCM backend
        await PushNotifications.register();
        console.log('📲 PushNotifications registered successfully on', this.getPlatform());
      }

      // 5. Register push notifications event listeners
      this.setupPushListeners();

    } catch (e) {
      console.warn('Capacitor PushNotifications setup note:', e);
    }

    try {
      // 6. Check Local Notifications permissions
      const localPerm = await LocalNotifications.checkPermissions();
      if (localPerm.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
    } catch (e) {
      console.warn('Capacitor LocalNotifications perm error:', e);
    }

    try {
      // 7. Keep screen awake during operations dashboard mode
      await KeepAwake.keepAwake();
      console.log('📱 KeepAwake enabled: Screen will not sleep in operations mode');
    } catch (e) {
      console.warn('Capacitor KeepAwake error:', e);
    }
  }

  /**
   * Creates Android Notification Channels with high priority, sound, lights, and vibration
   */
  private static async createAndroidNotificationChannels() {
    try {
      // Main Emergency & POS Channel
      await PushNotifications.createChannel({
        id: 'mdf_alerts_channel',
        name: 'MDF Emergency & POS Alerts',
        description: 'Instant Supervisor Authorizations (VOID) and Emergency POS Alerts',
        importance: 5, // High / Urgent
        visibility: 1, // Public (shows full content on lock screen)
        sound: 'alert_sound',
        vibration: true,
        lights: true,
        lightColor: '#D2122E'
      });

      // Urgent VOID Channel
      await PushNotifications.createChannel({
        id: 'mdf_urgent_channel',
        name: 'MDF Urgent Supervisor Alerts (VOID)',
        description: 'Highest Priority Cashier Approvals and Terminal Overrides',
        importance: 5,
        visibility: 1,
        sound: 'alert_sound',
        vibration: true,
        lights: true,
        lightColor: '#FF9800'
      });

      console.log('🔔 Android Notification Channels created: mdf_alerts_channel, mdf_urgent_channel');
    } catch (e) {
      console.warn('Error creating Android notification channels:', e);
    }
  }

  /**
   * Set up push notifications listeners for registration, incoming messages, and taps
   */
  private static setupPushListeners() {
    // 1. On Device Token Registration
    PushNotifications.addListener('registration', (token: Token) => {
      console.log(`🔥 Push Registration Token (${Capacitor.getPlatform()}):`, token.value);
      this.fcmToken = token.value;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mdf_fcm_device_token', token.value);
      }
      this.tokenCallbacks.forEach(cb => {
        try {
          cb(token.value);
        } catch (err) {
          console.error('Token callback error:', err);
        }
      });
    });

    // 2. On Registration Error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ Push registration error:', error);
    });

    // 3. On Foreground Push Notification Received
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('📬 Push notification received (foreground):', notification);
      const alertId = notification.data?.alertId || notification.data?.id;
      if (alertId) {
        // Register in deduplication map to avoid double chime if RTDB triggers simultaneously
        this.processedAlerts.set(alertId, Date.now());
      }
    });

    // 4. On Notification Action Performed (User tapped notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('👆 Push notification clicked/tapped:', notification);
      const data = notification.notification?.data || {};
      const alertId = data.alertId || data.id || data.key || '';
      
      console.log('🎯 Navigating to Alert ID from notification:', alertId);
      this.notificationActionHandlers.forEach(handler => {
        try {
          handler(alertId, data);
        } catch (err) {
          console.error('Notification action handler error:', err);
        }
      });
    });
  }

  /**
   * Trigger native Android/iOS haptic feedback vibration
   */
  public static async vibrateAlert(type: string = 'warning') {
    if (!this.isNative()) {
      // Fallback to web vibration if in browser
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([300, 100, 300, 100, 300]);
      }
      return;
    }

    try {
      if (type === 'error' || type === 'urgent') {
        await Haptics.notification({ type: NotificationType.Error });
      } else {
        await Haptics.notification({ type: NotificationType.Warning });
      }
      // Additional strong impact
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      console.warn('Capacitor Haptics error:', e);
    }
  }

  /**
   * Send Native Android/iOS Local Notification (Used when app is open or local fallback)
   */
  public static async scheduleAlertNotification(alert: Alert) {
    if (!this.isNative()) return;

    try {
      const isVoid = alert.title.includes('VOID') || alert.type === 'it_support';
      const locPart = alert.location || alert.deviceId ? ` [${alert.location || alert.deviceId}]` : '';
      const notificationTitle = isVoid
        ? `🚨 طلب تفويض عاجل (VOID)${locPart}`
        : `🚨 ${alert.title}${locPart}`;
      const notificationBody = alert.message || 'بلاغ طوارئ جديد';

      await LocalNotifications.schedule({
        notifications: [
          {
            title: notificationTitle,
            body: notificationBody,
            id: Math.floor(Math.random() * 100000),
            channelId: isVoid ? 'mdf_urgent_channel' : 'mdf_alerts_channel',
            schedule: { at: new Date(Date.now() + 50) },
            extra: {
              alertId: alert.id,
              deviceId: alert.deviceId,
              type: alert.type
            }
          }
        ]
      });
    } catch (e) {
      console.warn('Capacitor LocalNotification schedule error:', e);
    }
  }

  /**
   * Send Native Android/iOS Notification when a colleague responds / attends an alert
   */
  public static async scheduleResponderNotification(alert: Alert, responderName: string) {
    if (!this.isNative()) return;

    try {
      const locPart = alert.location || alert.deviceId ? ` [${alert.location || alert.deviceId}]` : '';
      const notificationTitle = `🏃‍♂️ ${responderName} ذاهب لحل البلاغ!`;
      const notificationBody = `تم قبول البلاغ${locPart} من قِبل ${responderName} وهو في الطريق للمعالجة الآن.`;

      await LocalNotifications.schedule({
        notifications: [
          {
            title: notificationTitle,
            body: notificationBody,
            id: Math.floor(Math.random() * 100000),
            channelId: 'mdf_alerts_channel',
            schedule: { at: new Date(Date.now() + 50) },
            extra: {
              alertId: alert.id,
              responder: responderName,
              action: 'responder_attending'
            }
          }
        ]
      });
    } catch (e) {
      console.warn('Capacitor LocalNotification responder note:', e);
    }
  }

  /**
   * Toggle KeepAwake dynamically
   */
  public static async setKeepAwake(enable: boolean) {
    if (!this.isNative()) return;
    try {
      if (enable) {
        await KeepAwake.keepAwake();
      } else {
        await KeepAwake.allowSleep();
      }
    } catch (e) {
      console.warn('Capacitor setKeepAwake error:', e);
    }
  }
}

