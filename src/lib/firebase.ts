import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  onValue,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  push, 
  set, 
  update, 
  remove, 
  get,
  serverTimestamp,
  DataSnapshot
} from 'firebase/database';
import { Alert, ESP32Device, StaffUser, AppSettings, AlertStatus, AlertType } from '../types';

// ==========================================
// Firebase Realtime Database Configuration
// ==========================================
export const firebaseConfig = {
  apiKey: "AIzaSyDFRb0ndm8i51O-l_cnpFF8U4l6vIjFPmY",
  authDomain: "mdf-2abd6.firebaseapp.com",
  databaseURL: "https://mdf-2abd6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mdf-2abd6",
  storageBucket: "mdf-2abd6.firebasestorage.app",
  messagingSenderId: "394826122700",
  appId: "1:394826122700:web:a0585f4fe7be049af18969"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Realtime Database
export const rtdb = getDatabase(app);

// Initial default settings
export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  customerSound: 'chime_dual',
  itSound: 'siren_tech',
  generalSound: 'melody_up',
  customerAlertsEnabled: true,
  itAlertsEnabled: true,
  generalAlertsEnabled: true,
  volume: 0.8,
  soundRepeatCount: 1,
  vibrationEnabled: true,
  browserNotificationsEnabled: true,
  highPriorityPopup: true,
  autoAcknowledgeSec: 0,
};

// Initial default staff users with Employee ID (الرقم الوظيفي)
export const INITIAL_STAFF: StaffUser[] = [
  { id: 'usr_1', employeeId: 'MDF-1042', name: 'عايشة الحبسي (Aisha Al-Habsi)', role: 'Duty Manager', department: 'Operations & Ground Services', active: true },
  { id: 'usr_2', employeeId: 'MDF-2088', name: 'أمينة البلوشي (Amina Al-Balushi)', role: 'Customer Staff', department: 'Perfumes & Cosmetics Floor', active: true },
  { id: 'usr_3', employeeId: 'MDF-3115', name: 'سالم الحارثي (Salim Al-Harthy)', role: 'IT Support', department: 'IT Infrastructure & POS', active: true },
  { id: 'usr_4', employeeId: 'MDF-4099', name: 'زايد الكندي (Zayed Al-Kindi)', role: 'Admin', department: 'Executive Duty Free Ops', active: true },
  { id: 'usr_5', employeeId: 'MDF-5520', name: 'محمد المعمري (Mohammed Al-Maamari)', role: 'Customer Staff', department: 'Electronics & Confectionery', active: true },
];

// Initial default ESP32 devices
export const INITIAL_DEVICES: ESP32Device[] = [
  { id: 'dev_1', deviceId: 'POS-012', name: 'POS Terminal 012 - Cash Desk', location: 'PN012', type: 'IT Support Button', status: 'Online', lastPing: new Date().toISOString(), apiKey: 'mdf_esp32_key_882', batteryLevel: 94 },
  { id: 'dev_2', deviceId: 'ESP32_CUST_01', name: 'Perfumes Bay 4 - Customer Assistance', location: 'PN0012', type: 'Customer Assistance Button', status: 'Online', lastPing: new Date().toISOString(), apiKey: 'mdf_esp32_key_881', batteryLevel: 98 },
  { id: 'dev_3', deviceId: 'ESP32_CUST_02', name: 'Liquor & Tobacco Bay 2', location: 'PN0045', type: 'Customer Assistance Button', status: 'Online', lastPing: new Date().toISOString(), apiKey: 'mdf_esp32_key_883', batteryLevel: 88 },
  { id: 'dev_4', deviceId: 'ESP32_DUAL_01', name: 'Information Desk Main Hub', location: 'GATE_14', type: 'Dual Alert Console', status: 'Online', lastPing: new Date().toISOString(), apiKey: 'mdf_esp32_key_884', batteryLevel: 100 },
];

/**
 * Normalizes raw alert data from Firebase Realtime Database into the standard Alert interface.
 * Supports both ESP32 REST format:
 * {
 *   "deviceID": "POS-012",
 *   "type": "VOID",
 *   "message": "Supervisor authorization needed.",
 *   "status": "pending",
 *   "responder": "",
 *   "timestamp": 1740298000
 * }
 * and legacy/standard web alert format.
 */
export function normalizeRTDBAlert(id: string, raw: Record<string, any>): Alert {
  // Normalize Status
  let status: AlertStatus = 'New';
  const rawStatus = (raw.status || '').toString().toLowerCase();
  if (rawStatus === 'pending' || rawStatus === 'new' || rawStatus === 'unread') {
    status = 'New';
  } else if (rawStatus === 'seen' || rawStatus === 'in_progress' || rawStatus === 'acknowledged') {
    status = 'Seen';
  } else if (rawStatus === 'completed' || rawStatus === 'resolved' || rawStatus === 'done') {
    status = 'Completed';
  }

  // Normalize Type
  const rawType = (raw.type || '').toString();
  let type: AlertType = 'customer_assistance';
  const isIT = rawType === 'it_support' || 
               rawType === 'VOID' || 
               rawType.toLowerCase().includes('it') || 
               rawType.toLowerCase().includes('pc') ||
               rawType.toLowerCase().includes('pos') ||
               (raw.title && raw.title.includes('دعم')) ||
               (raw.title && raw.title.includes('كمبيوتر')) ||
               (raw.message && raw.message.includes('كمبيوتر'));

  const isGeneral = rawType === 'general_notice' || rawType.toLowerCase().includes('general');

  if (isIT) {
    type = 'it_support';
  } else if (isGeneral) {
    type = 'general_notice';
  } else {
    type = 'customer_assistance';
  }

  // Normalize Title
  let title = raw.title || '';
  if (!title) {
    if (rawType === 'VOID') {
      title = `طلب تفويض إلغاء (VOID - ${raw.deviceID || raw.deviceId || 'POS'})`;
    } else if (type === 'it_support') {
      title = 'الدعم الفني والكمبيوتر';
    } else if (type === 'general_notice') {
      title = 'نداء وإشعار عام';
    } else {
      title = 'طلب مساعدة زبون';
    }
  }

  // Normalize Device ID & Location
  const deviceId = raw.deviceID || raw.deviceId || raw.device_id || 'ESP32_DEVICE';
  const location = raw.location || raw.deviceID || raw.deviceId || 'صالة السوق الحرة';

  // Normalize Message
  const message = raw.message || raw.body || 'تنبيه تشغيلي عاجل من الجهاز';

  // Normalize Timestamp & CreatedAt
  let createdAt = Date.now();
  let timestampStr = new Date().toLocaleString('en-GB');

  if (typeof raw.createdAt === 'number') {
    createdAt = raw.createdAt;
    timestampStr = new Date(createdAt).toLocaleString('en-GB');
  } else if (typeof raw.timestamp === 'number') {
    // Check if timestamp is in seconds or milliseconds
    createdAt = raw.timestamp > 10000000000 ? raw.timestamp : raw.timestamp * 1000;
    timestampStr = new Date(createdAt).toLocaleString('en-GB');
  } else if (typeof raw.timestamp === 'string') {
    timestampStr = raw.timestamp;
    const parsed = Date.parse(raw.timestamp);
    if (!isNaN(parsed)) {
      createdAt = parsed;
    }
  }

  return {
    id,
    title,
    type,
    message,
    location,
    deviceId,
    status,
    timestamp: timestampStr,
    createdAt,
    viewedBy: raw.responder || raw.viewedBy || undefined,
    viewedAt: raw.viewedAt || undefined,
    completedBy: raw.completedBy || (status === 'Completed' ? raw.responder : undefined),
    completedAt: raw.completedAt || undefined,
    completedAtTimestamp: raw.completedAtTimestamp || (typeof raw.completedAt === 'number' ? raw.completedAt : undefined),
    durationSeconds: raw.durationSeconds || undefined,
    notes: raw.notes || undefined,
  };
}

// ==========================================
// 1. Subscribe to Alerts in Realtime Database (/alerts)
// ==========================================
export interface AlertEventCallbacks {
  onChildAdded: (alert: Alert, isLive: boolean) => void;
  onChildChanged?: (alert: Alert) => void;
  onChildRemoved?: (alertId: string) => void;
}

/**
 * Subscribes to the /alerts path in Firebase Realtime Database using onChildAdded, onChildChanged, onChildRemoved.
 * Does NOT use onValue, does NOT re-fetch or re-process all alerts when a new alert arrives.
 * Directly emits individual alert updates with millisecond timing tracking.
 */
export function subscribeAlerts(
  callbacks: AlertEventCallbacks | ((alerts: Alert[]) => void)
): () => void {
  const alertsRef = ref(rtdb, 'alerts');
  let isInitialSync = true;

  // Mark initial sync complete after initial dataset is loaded once
  get(alertsRef).then(() => {
    isInitialSync = false;
  }).catch(() => {
    isInitialSync = false;
  });

  if (typeof callbacks === 'function') {
    // Array mode without onValue: maintain in-memory map on child events only
    const alertsMap = new Map<string, Alert>();

    const unsubAdd = onChildAdded(alertsRef, (snapshot: DataSnapshot) => {
      const receivedTime = Date.now();
      console.log("REALTIME ALERT RECEIVED", receivedTime);

      const key = snapshot.key || '';
      const raw = snapshot.val() || {};
      const normalized = normalizeRTDBAlert(key, raw);

      if (typeof window !== 'undefined') {
        (window as any).__alertReceivedTimestamps = (window as any).__alertReceivedTimestamps || {};
        (window as any).__alertReceivedTimestamps[key] = receivedTime;
      }

      alertsMap.set(key, normalized);
      const sorted = Array.from(alertsMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      callbacks(sorted);
    }, (error) => {
      console.error('Firebase RTDB onChildAdded error:', error);
    });

    const unsubChange = onChildChanged(alertsRef, (snapshot: DataSnapshot) => {
      const key = snapshot.key || '';
      const raw = snapshot.val() || {};
      const normalized = normalizeRTDBAlert(key, raw);
      alertsMap.set(key, normalized);
      const sorted = Array.from(alertsMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      callbacks(sorted);
    });

    const unsubRemove = onChildRemoved(alertsRef, (snapshot: DataSnapshot) => {
      const key = snapshot.key || '';
      alertsMap.delete(key);
      const sorted = Array.from(alertsMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      callbacks(sorted);
    });

    return () => {
      unsubAdd();
      unsubChange();
      unsubRemove();
    };
  }

  // Granular Event Mode
  const unsubAdd = onChildAdded(alertsRef, (snapshot: DataSnapshot) => {
    const receivedTime = Date.now();
    console.log("REALTIME ALERT RECEIVED", receivedTime);

    const key = snapshot.key || '';
    const raw = snapshot.val() || {};
    const normalized = normalizeRTDBAlert(key, raw);
    const isLive = !isInitialSync || (raw.createdAt && Date.now() - Number(raw.createdAt) < 60000);

    if (typeof window !== 'undefined') {
      (window as any).__alertReceivedTimestamps = (window as any).__alertReceivedTimestamps || {};
      (window as any).__alertReceivedTimestamps[key] = receivedTime;
    }

    callbacks.onChildAdded(normalized, isLive);
  }, (error) => {
    console.error('Firebase Realtime Database onChildAdded error:', error);
  });

  const unsubChange = onChildChanged(alertsRef, (snapshot: DataSnapshot) => {
    const key = snapshot.key || '';
    const raw = snapshot.val() || {};
    const normalized = normalizeRTDBAlert(key, raw);
    if (callbacks.onChildChanged) {
      callbacks.onChildChanged(normalized);
    }
  }, (error) => {
    console.error('Firebase Realtime Database onChildChanged error:', error);
  });

  const unsubRemove = onChildRemoved(alertsRef, (snapshot: DataSnapshot) => {
    const key = snapshot.key || '';
    if (callbacks.onChildRemoved) {
      callbacks.onChildRemoved(key);
    }
  }, (error) => {
    console.error('Firebase Realtime Database onChildRemoved error:', error);
  });

  return () => {
    unsubAdd();
    unsubChange();
    unsubRemove();
  };
}

// ==========================================
// 2. Create Alert in Realtime Database (/alerts)
// ==========================================
export async function createAlertInRTDB(alertData: Omit<Alert, 'id'>): Promise<string> {
  const alertsRef = ref(rtdb, 'alerts');
  const newAlertRef = push(alertsRef);
  
  // Format data compatible with ESP32 standard
  const payload = {
    deviceID: alertData.deviceId,
    deviceId: alertData.deviceId,
    type: alertData.type,
    title: alertData.title,
    message: alertData.message,
    location: alertData.location,
    status: alertData.status === 'New' ? 'pending' : alertData.status,
    responder: alertData.viewedBy || '',
    createdAt: alertData.createdAt || Date.now(),
    timestamp: alertData.timestamp || new Date().toLocaleString('en-GB'),
  };

  await set(newAlertRef, payload);

  // Trigger background FCM push notification broadcast to all registered staff devices
  try {
    fetch('/api/fcm/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newAlertRef.key || '',
        title: alertData.title,
        message: alertData.message,
        type: alertData.type,
        location: alertData.location,
        deviceId: alertData.deviceId,
      }),
    }).catch((fcmErr) => console.warn('FCM broadcast trigger note:', fcmErr));
  } catch (err) {
    console.warn('Could not post FCM broadcast:', err);
  }

  return newAlertRef.key || '';
}

// Alias for backward compatibility
export const createAlertInFirestore = createAlertInRTDB;

// ==========================================
// 3. Update Alert Status in Realtime Database
// ==========================================
export async function updateAlertStatusInRTDB(
  alertId: string, 
  status: AlertStatus, 
  staffName: string,
  notes?: string
) {
  const alertRef = ref(rtdb, `alerts/${alertId}`);
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  const updatePayload: Record<string, any> = {
    status: status === 'New' ? 'pending' : status === 'Seen' ? 'in_progress' : 'completed',
  };
  
  if (status === 'Seen') {
    updatePayload.viewedBy = staffName;
    updatePayload.responder = staffName;
    updatePayload.viewedAt = nowStr;
  } else if (status === 'Completed') {
    const nowTime = Date.now();
    updatePayload.completedBy = staffName;
    updatePayload.responder = staffName;
    updatePayload.completedAt = nowStr;
    updatePayload.completedAtTimestamp = nowTime;
    if (notes) {
      updatePayload.notes = notes;
    }
  }

  await update(alertRef, updatePayload);

  // If status is 'Seen', also dispatch FCM responder broadcast via backend API
  if (status === 'Seen') {
    try {
      fetch('/api/fcm/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          responderName: staffName,
        }),
      }).catch((e) => console.warn('Responder FCM broadcast note:', e));
    } catch {}
  }
}

// Alias for backward compatibility
export const updateAlertStatusInFirestore = updateAlertStatusInRTDB;

// ==========================================
// 4. Delete Alert in Realtime Database
// ==========================================
export async function deleteAlertInRTDB(alertId: string) {
  const alertRef = ref(rtdb, `alerts/${alertId}`);
  await remove(alertRef);
}

// ==========================================
// 5. ESP32 Devices in Realtime Database (/devices)
// ==========================================
export function subscribeDevices(callback: (devices: ESP32Device[]) => void) {
  const devicesRef = ref(rtdb, 'devices');

  return onValue(devicesRef, (snapshot: DataSnapshot) => {
    const list: ESP32Device[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        list.push({ id: childSnap.key, ...childSnap.val() } as ESP32Device);
      });
      callback(list);
    } else {
      // Seed default devices if empty
      INITIAL_DEVICES.forEach((dev) => {
        const { id, ...data } = dev;
        set(ref(rtdb, `devices/${id}`), data);
      });
      callback(INITIAL_DEVICES);
    }
  }, (err) => {
    console.error('Realtime Database /devices listener error:', err);
    callback(INITIAL_DEVICES);
  });
}

export async function addESP32DeviceInRTDB(device: Omit<ESP32Device, 'id'>) {
  const devicesRef = ref(rtdb, 'devices');
  const newDevRef = push(devicesRef);
  await set(newDevRef, device);
}
export const addESP32DeviceInFirestore = addESP32DeviceInRTDB;

export async function deleteESP32DeviceInRTDB(id: string) {
  await remove(ref(rtdb, `devices/${id}`));
}
export const deleteESP32DeviceInFirestore = deleteESP32DeviceInRTDB;

export async function updateESP32DeviceInRTDB(id: string, updates: Partial<ESP32Device>) {
  await update(ref(rtdb, `devices/${id}`), updates);
}
export const updateESP32DeviceInFirestore = updateESP32DeviceInRTDB;

export async function clearAllAlertsInRTDB() {
  await remove(ref(rtdb, 'alerts'));
}
export const clearAllAlertsInFirestore = clearAllAlertsInRTDB;

export async function importDevicesInRTDB(devices: ESP32Device[]) {
  const devicesRef = ref(rtdb, 'devices');
  const updates: Record<string, any> = {};
  devices.forEach((dev) => {
    const key = dev.id || dev.deviceId || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const { id, ...data } = dev;
    updates[`devices/${key}`] = data;
  });
  await update(ref(rtdb), updates);
}

export async function importStaffInRTDB(staffList: StaffUser[]) {
  const updates: Record<string, any> = {};
  staffList.forEach((st) => {
    const key = st.id || st.employeeId || `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const { id, ...data } = st;
    updates[`staff/${key}`] = data;
  });
  await update(ref(rtdb), updates);
}

export async function restoreFullBackupInRTDB(snapshot: {
  devices?: ESP32Device[];
  staff?: StaffUser[];
  alerts?: Alert[];
  settings?: AppSettings;
}) {
  const rootRef = ref(rtdb);
  const payload: Record<string, any> = {};

  if (snapshot.settings) {
    payload['settings'] = snapshot.settings;
  }
  if (snapshot.devices && snapshot.devices.length > 0) {
    const devObj: Record<string, any> = {};
    snapshot.devices.forEach(d => {
      const key = d.id || d.deviceId || `dev_${Date.now()}`;
      const { id, ...data } = d;
      devObj[key] = data;
    });
    payload['devices'] = devObj;
  }
  if (snapshot.staff && snapshot.staff.length > 0) {
    const staffObj: Record<string, any> = {};
    snapshot.staff.forEach(s => {
      const key = s.id || s.employeeId || `staff_${Date.now()}`;
      const { id, ...data } = s;
      staffObj[key] = data;
    });
    payload['staff'] = staffObj;
  }

  await update(rootRef, payload);
}

// ==========================================
// 6. Staff Users in Realtime Database (/staff)
// ==========================================
export function subscribeStaff(callback: (staff: StaffUser[]) => void) {
  const staffRef = ref(rtdb, 'staff');

  return onValue(staffRef, (snapshot: DataSnapshot) => {
    const list: StaffUser[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        list.push({ id: childSnap.key, ...childSnap.val() } as StaffUser);
      });
      callback(list);
    } else {
      // Seed default staff if empty
      INITIAL_STAFF.forEach((st) => {
        const { id, ...data } = st;
        set(ref(rtdb, `staff/${id}`), data);
      });
      callback(INITIAL_STAFF);
    }
  }, (err) => {
    console.error('Realtime Database /staff listener error:', err);
    callback(INITIAL_STAFF);
  });
}

export async function addStaffUserInRTDB(staff: Omit<StaffUser, 'id'>) {
  const staffRef = ref(rtdb, 'staff');
  const newStaffRef = push(staffRef);
  await set(newStaffRef, staff);
}
export const addStaffUserInFirestore = addStaffUserInRTDB;

export async function deleteStaffUserInRTDB(id: string) {
  await remove(ref(rtdb, `staff/${id}`));
}
export const deleteStaffUserInFirestore = deleteStaffUserInRTDB;

export async function updateStaffUserInRTDB(id: string, updates: Partial<StaffUser>) {
  await update(ref(rtdb, `staff/${id}`), updates);
}
export const updateStaffUserInFirestore = updateStaffUserInRTDB;

export async function setOnlinePresenceInRTDB(user: { uid: string; displayName: string; employeeId: string; department?: string; role?: string }) {
  const presenceRef = ref(rtdb, `online_users/${user.uid || user.employeeId}`);
  await set(presenceRef, {
    uid: user.uid || user.employeeId,
    displayName: user.displayName,
    name: user.displayName,
    employeeId: user.employeeId,
    department: user.department || 'Duty Free Floor Operations',
    role: user.role || 'Staff',
    online: true,
    lastSeen: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
  });
}

export async function setOfflinePresenceInRTDB(uidOrEmployeeId: string) {
  if (!uidOrEmployeeId) return;
  const presenceRef = ref(rtdb, `online_users/${uidOrEmployeeId}`);
  await remove(presenceRef);
}

/**
 * Admin action to force-disconnect / kick an online user session
 */
export async function kickUserFromRTDB(uidOrEmployeeId: string, kickedByName: string = 'Zico (Admin)') {
  if (!uidOrEmployeeId) return;
  // 1. Remove from active presence
  const presenceRef = ref(rtdb, `online_users/${uidOrEmployeeId}`);
  await remove(presenceRef);
  
  // 2. Set kick signal in RTDB
  const kickRef = ref(rtdb, `kicked_sessions/${uidOrEmployeeId}`);
  await set(kickRef, {
    kickedAt: Date.now(),
    kickedBy: kickedByName,
    reason: 'Admin Remote Kick',
  });
}

/**
 * Listen to personal kick status to immediately terminate session on client
 */
export function subscribeKickedStatus(uidOrEmployeeId: string, onKicked: (data: { kickedAt: number; kickedBy: string; reason: string }) => void) {
  if (!uidOrEmployeeId) return () => {};
  const kickRef = ref(rtdb, `kicked_sessions/${uidOrEmployeeId}`);
  return onValue(kickRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (data && data.kickedAt && Date.now() - data.kickedAt < 60000) {
        onKicked(data);
      }
    }
  });
}

export async function clearKickedStatus(uidOrEmployeeId: string) {
  if (!uidOrEmployeeId) return;
  await remove(ref(rtdb, `kicked_sessions/${uidOrEmployeeId}`));
}

export function subscribeOnlineUsers(callback: (users: Array<{ uid: string; displayName: string; employeeId: string; department: string; role: string; lastSeen: string; online: boolean }>) => void) {
  const onlineRef = ref(rtdb, 'online_users');
  return onValue(onlineRef, (snapshot: DataSnapshot) => {
    const list: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        list.push({ uid: childSnap.key, ...childSnap.val() });
      });
    }
    callback(list);
  }, (err) => {
    console.error('Realtime Database /online_users listener error:', err);
    callback([]);
  });
}

// ==========================================
// 7. App Settings in Realtime Database (/settings)
// ==========================================
export function subscribeSettings(callback: (settings: AppSettings) => void) {
  const settingsRef = ref(rtdb, 'settings');

  return onValue(settingsRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as AppSettings);
    } else {
      set(settingsRef, DEFAULT_SETTINGS);
      callback(DEFAULT_SETTINGS);
    }
  }, (err) => {
    console.error('Realtime Database /settings listener error:', err);
    callback(DEFAULT_SETTINGS);
  });
}

export async function saveSettingsInRTDB(settings: AppSettings) {
  await set(ref(rtdb, 'settings'), settings);
}
export const saveSettingsInFirestore = saveSettingsInRTDB;

// Seeding helper
export async function seedInitialDataIfEmpty() {
  try {
    const alertsSnap = await get(ref(rtdb, 'alerts'));
    if (!alertsSnap.exists()) {
      const sampleInitial = [
        {
          deviceID: 'POS-012',
          type: 'VOID',
          message: 'Supervisor authorization needed for VOID.',
          status: 'pending',
          location: 'PN012',
          title: 'طلب تفويض إلغاء (VOID - POS-012)',
          createdAt: Date.now() - 2 * 60 * 1000,
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toLocaleString('en-GB'),
        },
        {
          deviceID: 'ESP32_CUST_01',
          type: 'customer_assistance',
          message: 'PN0012 Customer is currently present and requires assistance.',
          status: 'pending',
          location: 'PN0012',
          title: 'طلب مساعدة زبون',
          createdAt: Date.now() - 5 * 60 * 1000,
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toLocaleString('en-GB'),
        }
      ];

      for (const alert of sampleInitial) {
        const newRef = push(ref(rtdb, 'alerts'));
        await set(newRef, alert);
      }
    }
  } catch (err) {
    console.warn('Realtime Database seed warning:', err);
  }
}

export const seedInitialFirestoreData = seedInitialDataIfEmpty;

export async function ensureFirebaseAuth() {
  return null;
}

// ==========================================
// 8. Multi-Device Staff FCM Push Tokens in Realtime Database
// ==========================================
import { DeviceRegistration, DevicePlatform } from '../types';

export type StaffFcmTokenData = DeviceRegistration;

/**
 * Sanitizes any string (including FCM tokens) to be safe for Firebase RTDB keys
 */
export function sanitizeRTDBKey(key: string): string {
  return key.replace(/[.#$[\]/]/g, '_').slice(0, 120);
}

/**
 * Registers or updates a specific device token for a user without overwriting their other devices.
 * A single user can have multiple active devices (e.g. Android phone, iPhone, Desktop web).
 */
export async function registerStaffDeviceToken(
  employeeId: string,
  token: string,
  meta?: {
    name?: string;
    role?: string;
    department?: string;
    platform?: DevicePlatform;
    deviceName?: string;
    isNative?: boolean;
    appVersion?: string;
    subscription?: any;
    endpoint?: string;
    keys?: { p256dh: string; auth: string };
  }
): Promise<void> {
  if (!employeeId || !token) return;

  try {
    const tokenKey = sanitizeRTDBKey(token.slice(-40) || token);
    const sanitizedEmpId = sanitizeRTDBKey(employeeId);
    
    // Determine platform
    let platform: DevicePlatform = meta?.platform || (meta?.isNative ? 'android' : 'web');
    if (!meta?.platform && typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      if (/iPhone|iPad|iPod/.test(ua)) platform = 'ios';
      else if (/Android/.test(ua)) platform = 'android';
      else platform = 'web';
    }

    const deviceName = meta?.deviceName || (
      platform === 'ios' ? 'Apple iPhone' :
      platform === 'android' ? 'Android Device' :
      'Desktop Web Client'
    );

    const now = Date.now();

    const devicePayload: any = {
      id: tokenKey,
      userId: employeeId,
      userName: meta?.name || '',
      userRole: meta?.role || '',
      userDepartment: meta?.department || '',
      token: token,
      fcmToken: token,
      subscription: meta?.subscription || null,
      endpoint: meta?.subscription?.endpoint || meta?.endpoint || (token.startsWith('http') ? token : null),
      keys: meta?.subscription?.keys || meta?.keys || null,
      platform: platform,
      deviceName: deviceName,
      createdAt: now,
      updatedAt: now,
      enabled: true,
      appVersion: meta?.appVersion || '2.5.0',
      lastActive: new Date().toISOString(),
      deviceInfo: {
        isNative: !!meta?.isNative,
        platform: platform,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      }
    };

    // 1. Write to /staffTokens/{tokenKey} (for fast multicast lookup by backend)
    const tokenRef = ref(rtdb, `staffTokens/${tokenKey}`);
    await set(tokenRef, devicePayload);

    // 2. Also record under /userDevices/{employeeId}/{tokenKey} for user device management
    const userDeviceRef = ref(rtdb, `userDevices/${sanitizedEmpId}/${tokenKey}`);
    await set(userDeviceRef, devicePayload);

    console.log(`✅ Registered multi-device token [${platform} - ${deviceName}] with WebPush for: ${employeeId}`);
  } catch (err) {
    console.error('Error registering staff device token in RTDB:', err);
  }
}

// Backward-compatible alias
export const registerStaffFcmToken = async (
  employeeId: string,
  fcmToken: string,
  staffMeta?: { name?: string; role?: string; department?: string; isNative?: boolean; platform?: DevicePlatform; deviceName?: string }
) => {
  return registerStaffDeviceToken(employeeId, fcmToken, staffMeta);
};

/**
 * Removes or disables a specific device token upon logout or disable action
 */
export async function unregisterStaffDeviceToken(employeeId: string, token?: string): Promise<void> {
  try {
    const currentToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('mdf_fcm_device_token') : null);
    const sanitizedEmpId = sanitizeRTDBKey(employeeId);

    if (currentToken) {
      const tokenKey = sanitizeRTDBKey(currentToken.slice(-40) || currentToken);
      await remove(ref(rtdb, `staffTokens/${tokenKey}`));
      if (employeeId) {
        await remove(ref(rtdb, `userDevices/${sanitizedEmpId}/${tokenKey}`));
      }
      console.log(`🚪 Unregistered device token [${tokenKey}] for employee: ${employeeId}`);
    } else if (employeeId) {
      // If no token specified, remove user from /staffTokens matching employeeId
      const tokensSnap = await get(ref(rtdb, 'staffTokens'));
      if (tokensSnap.exists()) {
        tokensSnap.forEach((child) => {
          const val = child.val();
          if (val && (val.userId === employeeId || val.employeeId === employeeId)) {
            remove(ref(rtdb, `staffTokens/${child.key}`));
          }
        });
      }
    }
  } catch (err) {
    console.error('Error unregistering staff device token in RTDB:', err);
  }
}

// Backward-compatible alias
export const unregisterStaffFcmToken = unregisterStaffDeviceToken;

/**
 * Subscribes to all registered devices for a specific user (/userDevices/{employeeId})
 */
export function subscribeUserDevices(employeeId: string, callback: (devices: DeviceRegistration[]) => void): () => void {
  if (!employeeId) {
    callback([]);
    return () => {};
  }
  const sanitizedEmpId = sanitizeRTDBKey(employeeId);
  const userDevsRef = ref(rtdb, `userDevices/${sanitizedEmpId}`);

  return onValue(userDevsRef, (snapshot: DataSnapshot) => {
    const list: DeviceRegistration[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        list.push(childSnap.val() as DeviceRegistration);
      });
    }
    callback(list);
  }, (err) => {
    console.warn('Realtime Database /userDevices listener note:', err);
    callback([]);
  });
}

/**
 * Subscribes to /staffTokens in Realtime Database for monitoring active devices across all staff
 */
export function subscribeStaffTokens(callback: (tokens: DeviceRegistration[]) => void): () => void {
  const tokensRef = ref(rtdb, 'staffTokens');
  return onValue(tokensRef, (snapshot: DataSnapshot) => {
    const list: DeviceRegistration[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        list.push(childSnap.val() as DeviceRegistration);
      });
    }
    callback(list);
  }, (err) => {
    console.warn('Realtime Database /staffTokens listener note:', err);
    callback([]);
  });
}
