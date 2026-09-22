const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function triggered automatically when a new alert is created in Firebase Realtime Database (/alerts/{alertId}).
 * Sends High-Priority Android Push Notifications via FCM to all logged-in staff tokens stored in /staffTokens.
 */
exports.onAlertCreatedSendPush = functions
  .region('europe-west1')
  .database.ref('/alerts/{alertId}')
  .onCreate(async (snapshot, context) => {
    const alertId = context.params.alertId;
    const alertData = snapshot.val() || {};

    console.log(`🚨 New Realtime Alert detected: ${alertId}`, alertData);

    try {
      // 1. Fetch all registered staff tokens from /staffTokens
      const tokensSnap = await admin.database().ref('/staffTokens').once('value');
      if (!tokensSnap.exists()) {
        console.log('No staff tokens registered in /staffTokens, skipping push.');
        return null;
      }

      const tokensData = tokensSnap.val() || {};
      const registrationTokens = [];

      Object.keys(tokensData).forEach((key) => {
        const staff = tokensData[key];
        if (staff && staff.fcmToken && typeof staff.fcmToken === 'string' && staff.fcmToken.trim() !== '') {
          if (!registrationTokens.includes(staff.fcmToken)) {
            registrationTokens.push(staff.fcmToken);
          }
        }
      });

      if (registrationTokens.length === 0) {
        console.log('No active FCM tokens found.');
        return null;
      }

      const rawType = (alertData.type || '').toString();
      const rawTitle = alertData.title || '';
      const isVoid = rawType === 'VOID' || rawType === 'it_support' || rawTitle.includes('VOID');
      const channelId = isVoid ? 'mdf_urgent_channel' : 'mdf_alerts_channel';
      
      const deviceId = alertData.deviceID || alertData.deviceId || 'POS';
      const location = alertData.location || deviceId || 'صالة السوق الحرة';
      const title = rawTitle || (isVoid ? `طلب تفويض إلغاء (${deviceId})` : 'تنبيه طوارئ ومساعدة');
      const body = alertData.message || 'طلب مساعدة عاجل من الجهاز!';

      const pushTitle = isVoid ? `🚨 طلب تفويض عاجل (VOID) - [${location}]` : `🚨 ${title} [${location}]`;

      // Multicast FCM Payload with Android, iOS (APNs), and Webpush support
      const message = {
        tokens: registrationTokens,
        notification: {
          title: pushTitle,
          body: body,
        },
        data: {
          alertId: alertId,
          id: alertId,
          deviceId: deviceId,
          location: location,
          type: rawType,
          title: title,
          message: body,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          ttl: 60 * 60 * 24, // 24h
          notification: {
            title: pushTitle,
            body: body,
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
                body: body,
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
            body: body,
            icon: '/icon.png',
            badge: '/icon.png',
            vibrate: [300, 100, 300, 100, 300],
            requireInteraction: true,
            data: {
              alertId: alertId,
              url: '/',
            },
          },
          fcmOptions: {
            link: '/',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`✅ Push Broadcast Result: ${response.successCount} succeeded, ${response.failureCount} failed.`);

      // Clean up stale or unregistered tokens
      if (response.failureCount > 0) {
        const cleanupPromises = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error ? resp.error.code : '';
            if (
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/registration-token-not-registered'
            ) {
              const staleToken = registrationTokens[idx];
              console.log('🧹 Removing stale token from /staffTokens:', staleToken);
              Object.keys(tokensData).forEach((staffKey) => {
                if (tokensData[staffKey] && tokensData[staffKey].fcmToken === staleToken) {
                  cleanupPromises.push(admin.database().ref(`/staffTokens/${staffKey}`).remove());
                }
              });
            }
          }
        });
        await Promise.all(cleanupPromises);
      }

      return null;
    } catch (err) {
      console.error('Error dispatching push notifications from Cloud Function:', err);
      return null;
    }
  });

/**
 * Cloud Function triggered automatically when an alert status is updated (e.g., staff taps 'Seen' / 'ذاهب للحل').
 * Sends High-Priority FCM Push Notification informing all other staff members that [Staff Name] is attending.
 */
exports.onAlertUpdatedSendPush = functions
  .region('europe-west1')
  .database.ref('/alerts/{alertId}')
  .onUpdate(async (change, context) => {
    const before = change.before.val() || {};
    const after = change.after.val() || {};
    const alertId = context.params.alertId;

    // Check if status transitioned to in_progress / Seen and responder is assigned
    const becameInProgress = (after.status === 'in_progress' || after.status === 'Seen') && 
                             (before.status !== 'in_progress' && before.status !== 'Seen');
    const responder = after.responder || after.viewedBy || '';

    if (!becameInProgress || !responder) {
      return null;
    }

    console.log(`🏃‍♂️ Alert status changed to in_progress by responder: ${responder} for alert: ${alertId}`);

    try {
      const tokensSnap = await admin.database().ref('/staffTokens').once('value');
      if (!tokensSnap.exists()) return null;

      const tokensData = tokensSnap.val() || {};
      const registrationTokens = [];

      Object.keys(tokensData).forEach((key) => {
        const staff = tokensData[key];
        if (staff && staff.fcmToken && typeof staff.fcmToken === 'string' && staff.fcmToken.trim() !== '') {
          if (!registrationTokens.includes(staff.fcmToken)) {
            registrationTokens.push(staff.fcmToken);
          }
        }
      });

      if (registrationTokens.length === 0) return null;

      const location = after.location || after.deviceId || after.deviceID || 'صالة السوق الحرة';
      const pushTitle = `🏃‍♂️ ${responder} ذاهب لحل البلاغ!`;
      const pushBody = `قام ${responder} بقبول البلاغ [${location}] وهو في الطريق للمعالجة الآن.`;

      const message = {
        tokens: registrationTokens,
        notification: {
          title: pushTitle,
          body: pushBody,
        },
        data: {
          alertId: alertId,
          responder: responder,
          location: location,
          type: 'responder_attending',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          notification: {
            title: pushTitle,
            body: pushBody,
            channelId: 'mdf_alerts_channel',
            icon: 'ic_stat_notification',
            color: '#2563EB',
            sound: 'default',
            priority: 'high',
            visibility: 'public',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`✅ Responder Push Broadcast: ${response.successCount} succeeded, ${response.failureCount} failed.`);
      return null;
    } catch (err) {
      console.error('Error sending responder push notification from Cloud Function:', err);
      return null;
    }
  });

