export type AlertType = 'customer_assistance' | 'it_support' | 'general_notice';

export type AlertStatus = 'New' | 'Seen' | 'Completed';

export type SoundTone = 
  | 'chime_dual' 
  | 'bell_soft' 
  | 'melody_up' 
  | 'siren_tech' 
  | 'beep_urgent' 
  | 'pulse_alert' 
  | 'chime_classic' 
  | 'high_pitch' 
  | 'subtle_ping';

export interface Alert {
  id: string;
  title: string;
  type: AlertType;
  message: string;
  location: string;
  deviceId: string;
  status: AlertStatus;
  timestamp: string; // Human formatted or ISO
  createdAt: number; // Unix timestamp for sorting
  hall?: string;
  viewedBy?: string;
  viewedAt?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  completedBy?: string;
  completedAt?: string;
  completedAtTimestamp?: number;
  durationSeconds?: number;
  notes?: string;
}

export interface ESP32Device {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  type: 'Customer Assistance Button' | 'IT Support Button' | 'Dual Alert Console';
  status: 'Online' | 'Offline' | 'Maintenance';
  lastPing: string;
  apiKey: string;
  batteryLevel?: number;
  firmwareVersion?: string;
}

export interface StaffUser {
  id: string;
  name: string; // اسم الموظف
  employeeId: string; // الرقم الوظيفي
  email?: string;
  role: 'Admin' | 'Duty Manager' | 'IT Support' | 'Customer Staff';
  department: string;
  active: boolean;
  lastActive?: string;
  rating?: number; // 1-5
  badge?: string;
  totalResolved?: number;
  totalAttended?: number;
}

export interface StaffAppraisal {
  id: string;
  staffId?: string;
  staffName: string;
  employeeId: string;
  employeeName?: string;
  rating: number; // 1 - 5 stars
  badge: string; // '🏆 Top Performer' | '⚡ Speed Master' | '⭐ Duty Star' | '🛡️ Customer Hero'
  notes: string;
  evaluator: string;
  evaluatedBy?: string;
  evaluatedAt?: number;
  period: string;
  speedScore?: number;
  accuracyScore?: number;
  slaCompliance?: number; // e.g. 98%
  avgResponseMinutes?: number; // e.g. 1.5
  createdAt?: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string | number;
  formattedTime?: string;
  actor: string;
  action: string;
  target?: string;
  details?: string;
  category?: 'user' | 'device' | 'alert' | 'system' | 'eval';
}

export interface AppSettings {
  soundEnabled: boolean;
  customerSound: SoundTone; // صوت تنبيه المساعدة
  itSound: SoundTone; // صوت تنبيه الدعم الفني / الكمبيوتر
  generalSound: SoundTone; // صوت التنبيهات العامة
  customerAlertsEnabled: boolean;
  itAlertsEnabled: boolean;
  generalAlertsEnabled: boolean;
  volume: number; // 0.0 - 1.0
  soundRepeatCount: number; // 1, 2, 3
  vibrationEnabled: boolean;
  browserNotificationsEnabled: boolean;
  highPriorityPopup: boolean;
  autoAcknowledgeSec: number;
}

export type DevicePlatform = 'android' | 'ios' | 'web';

export interface DeviceRegistration {
  id: string; // unique sanitized device token id
  userId: string; // employeeId or user uid
  userName?: string;
  userRole?: string;
  userDepartment?: string;
  token: string;
  platform: DevicePlatform;
  deviceName: string;
  createdAt: number;
  updatedAt: number;
  enabled: boolean;
  appVersion: string;
  lastActive?: string;
  deviceInfo?: {
    isNative: boolean;
    platform: string;
    userAgent?: string;
  };
}

export interface AuthUser {
  uid: string;
  displayName: string; // اسم الموظف
  employeeId: string; // الرقم الوظيفي
  email?: string;
  role: 'Admin' | 'Duty Manager' | 'IT Support' | 'Customer Staff';
  department: string;
}

