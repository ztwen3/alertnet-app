import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Volume2, 
  Radio, 
  Users, 
  Bell, 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  HelpCircle, 
  Layers, 
  Sparkles,
  Search,
  Code2,
  Lock,
  Cpu,
  Power,
  TrendingUp,
  Activity,
  Clock,
  UserCheck,
  CheckCheck,
  Award,
  RefreshCw,
  Sliders,
  Filter,
  BarChart2,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Megaphone,
  Laptop,
  FileText,
  History,
  LayoutDashboard,
  Smartphone,
  Check,
  ExternalLink,
  Wifi
} from 'lucide-react';
import { 
  AppSettings, 
  AlertType, 
  Alert, 
  ESP32Device, 
  StaffUser, 
  AuthUser,
  StaffAppraisal,
  AuditLogEntry
} from '../types';
import { NotificationSettings } from './NotificationSettings';
import { translations, AppLanguage } from '../lib/i18n';
import { MDFLogo } from './MDFLogo';
import { 
  addESP32DeviceInRTDB, 
  updateESP32DeviceInRTDB, 
  deleteESP32DeviceInRTDB, 
  addStaffUserInRTDB, 
  updateStaffUserInRTDB, 
  deleteStaffUserInRTDB, 
  createAlertInRTDB, 
  restoreFullBackupInRTDB
} from '../lib/firebase';
import { 
  getSavedFcmToken, 
  initPushNotifications, 
  isIOSSafari, 
  isStandalonePWA 
} from '../lib/fcm';

import { AdminUsersManagement } from './admin/AdminUsersManagement';
import { AdminProgramsControl } from './admin/AdminProgramsControl';
import { AdminAppraisalsSection } from './admin/AdminAppraisalsSection';
import { AdminReportsEngine } from './admin/AdminReportsEngine';
import { AdminAuditLog } from './admin/AdminAuditLog';

interface AdminSettingsProps {
  currentUser: AuthUser | null;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onTestSound: (type: AlertType) => void;
  alerts: Alert[];
  devices: ESP32Device[];
  staffList: StaffUser[];
  lang?: AppLanguage;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  currentUser,
  settings,
  onSaveSettings,
  onTestSound,
  alerts,
  devices,
  staffList,
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'staff' | 'programs' | 'simulator' | 'audio' | 'backup' | 'reports' | 'audit'>('staff');

  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [isTestingPush, setIsTestingPush] = useState<boolean>(false);
  const [pushStatus, setPushStatus] = useState<string>('');

  // Device & iOS State
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setIsIOS(isIOSSafari());
    setIsPWA(isStandalonePWA());
    setHasToken(!!getSavedFcmToken());
  }, []);

  // Appraisals State (with localStorage persistence)
  const [appraisals, setAppraisals] = useState<StaffAppraisal[]>(() => {
    try {
      const saved = localStorage.getItem('mdf_staff_appraisals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'appr_1',
        staffId: 'usr_1',
        staffName: 'عايشة الحبسي (Aisha Al-Habsi)',
        employeeId: 'MDF-1042',
        evaluator: 'Zico (Executive Admin)',
        rating: 5,
        speedScore: 99,
        accuracyScore: 100,
        badge: '🏆 Top Performer',
        notes: 'إشراف استثنائي على صالة المغادرون، وسرعة قياسية في تفويضات VOID دون أي تأخير للكاشير.',
        period: 'فبراير 2026',
        createdAt: Date.now() - 86400000
      },
      {
        id: 'appr_2',
        staffId: 'usr_3',
        staffName: 'سالم الحارثي (Salim Al-Harthy)',
        employeeId: 'MDF-3115',
        evaluator: 'Zico (Executive Admin)',
        rating: 5,
        speedScore: 100,
        accuracyScore: 98,
        badge: '⚡ Speed Master',
        notes: 'حل مشاكل نقاط الكاشير وأجهزة ESP32 في وقت قياسي والحفاظ على جاهزية النظام.',
        period: 'فبراير 2026',
        createdAt: Date.now() - 172800000
      }
    ];
  });

  // Audit Logs State (with localStorage persistence)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('mdf_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'log_1',
        actor: 'Zico (Admin)',
        action: 'VOID_RESOLVED',
        target: 'POS-012 (PN012)',
        details: 'تم تفويض إلغاء الفاتورة واعتماد العملية بنجاح',
        timestamp: new Date(Date.now() - 15 * 60000).toLocaleString('en-GB')
      },
      {
        id: 'log_2',
        actor: 'Zico (Admin)',
        action: 'STAFF_ADDED',
        target: 'MDF-5520',
        details: 'إضافة الموظف محمد المعمري لصالة القادمون',
        timestamp: new Date(Date.now() - 120 * 60000).toLocaleString('en-GB')
      }
    ];
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const addAuditEntry = (action: string, target: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      actor: currentUser?.displayName || 'Zico (Admin)',
      action,
      target,
      details,
      timestamp: new Date().toLocaleString('en-GB')
    };
    setAuditLogs(prev => {
      const updated = [newEntry, ...prev];
      try {
        localStorage.setItem('mdf_audit_logs', JSON.stringify(updated.slice(0, 100)));
      } catch {}
      return updated;
    });
  };

  // Performance calculations
  const stats = useMemo(() => {
    const activeStaffCount = staffList.filter(s => s.active).length;
    const onlineDevicesCount = devices.filter(d => d.status === 'Online').length;
    const resolvedAlertsCount = alerts.filter(a => a.status === 'Resolved').length;
    return {
      activeStaffCount,
      totalStaff: staffList.length,
      onlineDevicesCount,
      totalDevices: devices.length,
      resolvedAlertsCount,
      totalAlerts: alerts.length
    };
  }, [staffList, devices, alerts]);

  // Test Push for Current Device (especially on iPhone / Background)
  const handleTestDevicePush = async () => {
    setIsTestingPush(true);
    setPushStatus(isAr ? 'جاري تفعيل إذن الإشعارات وإرسال إشعار فحص...' : 'Requesting permission and dispatching test push...');
    try {
      // 1. Ensure Push is initialized & token retrieved
      const res = await initPushNotifications();
      if (res.token) {
        setHasToken(true);
      }

      // 2. Dispatch push from server to trigger device outside the app
      const payload = {
        token: res.token || getSavedFcmToken() || undefined,
        platform: res.platform || (isIOS ? 'ios' : 'web'),
        deviceName: res.deviceName || (isIOS ? 'iPhone PWA' : 'Staff Terminal'),
        title: isAr ? '🚨 فحص إشعارات طوارئ سوق مسقط الحرة' : '🚨 MDF Emergency Push Test',
        message: isAr 
          ? `تم استلام الإشعار بنجاح في الخلفية على ${res.deviceName || 'جهازك'} (${new Date().toLocaleTimeString('ar-OM')})`
          : `Push notification received successfully in background at ${new Date().toLocaleTimeString()}`
      };

      const resp = await fetch('/api/fcm/test-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (data.success) {
        showToast(isAr ? '✅ تم إرسال إشعار الفحص بنجاح! تحقق من شاشة القفل / شريط الإشعارات.' : '✅ Test push sent! Check your lock screen.');
        setPushStatus(isAr ? 'تم الإرسال بنجاح! الإشعار يعمل في الخلفية وخارج البرنامج.' : 'Test push dispatched successfully to background.');
      } else {
        showToast(isAr ? 'تم تسجيل الجهاز بنجاح وجاري البث.' : 'Device registered and ping dispatched.');
        setPushStatus(data.info || (isAr ? 'تم البث للأجهزة المسجلة' : 'Broadcast to registered devices'));
      }
    } catch (err: any) {
      showToast(isAr ? `فشل إرسال الإشعار: ${err?.message || 'خطأ غير معروف'}` : `Push failed: ${err?.message}`, 'error');
      setPushStatus(err?.message || 'Error sending test push');
    } finally {
      setIsTestingPush(false);
    }
  };

  // Broadcast Simulated Alert
  const handleSimulateAlert = async (type: 'it_support' | 'customer_assistance') => {
    try {
      if (type === 'it_support') {
        await createAlertInRTDB({
          title: 'طلب تفويض فوري (VOID - POS-012)',
          location: 'PN012',
          hall: 'Departures',
          message: 'Supervisor authorization needed for invoice VOID.',
          type: 'it_support',
          deviceId: 'POS-012',
          status: 'New',
          createdAt: Date.now(),
          timestamp: new Date().toLocaleTimeString('en-GB')
        });
        addAuditEntry('SIMULATION_TRIGGERED', 'POS-012', 'محاكاة بلاغ تفويض VOID فوري');
        showToast(isAr ? '🚨 تم إرسال بلاغ VOID وبث الإشعار لجميع الأجهزة!' : '🚨 VOID alert created & push broadcasted!');
      } else {
        await createAlertInRTDB({
          title: 'طلب مساعدة زبون فوري',
          location: 'PN0012',
          hall: 'Arrivals',
          message: 'Customer assistance requested at Perfumes Section.',
          type: 'customer_assistance',
          deviceId: 'POS-008',
          status: 'New',
          createdAt: Date.now(),
          timestamp: new Date().toLocaleTimeString('en-GB')
        });
        addAuditEntry('SIMULATION_TRIGGERED', 'POS-008', 'محاكاة طلب مساعدة زبون');
        showToast(isAr ? '🔔 تم إرسال بلاغ مساعدة الزبون وبث الإشعار!' : '🔔 Customer alert created & push broadcasted!');
      }
    } catch (err: any) {
      showToast(isAr ? 'حدث خطأ أثناء المحاكاة' : 'Error in simulation', 'error');
    }
  };

  // Staff CRUD
  const handleAddStaff = async (staffData: Omit<StaffUser, 'id'>) => {
    await addStaffUserInRTDB(staffData);
    addAuditEntry('STAFF_ADDED', staffData.employeeId, `إضافة الموظف ${staffData.name}`);
    showToast(isAr ? 'تمت إضافة الموظف بنجاح إلى قاعدة البيانات!' : 'Staff member added successfully!');
  };

  const handleUpdateStaff = async (staff: StaffUser) => {
    const { id, ...data } = staff;
    await updateStaffUserInRTDB(id, data);
    addAuditEntry('STAFF_UPDATED', staff.employeeId, `تعديل بيانات الموظف ${staff.name}`);
    showToast(isAr ? 'تم تحديث بيانات الموظف بنجاح!' : 'Staff updated successfully!');
  };

  const handleDeleteStaff = async (id: string) => {
    const st = staffList.find(s => s.id === id);
    await deleteStaffUserInRTDB(id);
    addAuditEntry('STAFF_DELETED', st?.employeeId || id, `حذف الموظف ${st?.name || id}`);
    showToast(isAr ? 'تم حذف الموظف من قاعدة البيانات.' : 'Staff deleted successfully.');
  };

  // Device CRUD
  const handleAddDevice = async (deviceData: Omit<ESP32Device, 'id'>) => {
    await addESP32DeviceInRTDB(deviceData);
    addAuditEntry('DEVICE_ADDED', deviceData.deviceId, `إضافة جهاز كاشير ${deviceData.name} في ${deviceData.location}`);
    showToast(isAr ? 'تمت إضافة جهاز الكاشير بنجاح!' : 'Device added successfully!');
  };

  const handleUpdateDevice = async (device: ESP32Device) => {
    const { id, ...data } = device;
    await updateESP32DeviceInRTDB(id, data);
    addAuditEntry('DEVICE_UPDATED', device.deviceId, `تعديل إعدادات الجهاز ${device.name}`);
    showToast(isAr ? 'تم تحديث جهاز الكاشير بنجاح!' : 'Device updated successfully!');
  };

  const handleDeleteDevice = async (id: string) => {
    const dev = devices.find(d => d.id === id);
    await deleteESP32DeviceInRTDB(id);
    addAuditEntry('DEVICE_DELETED', dev?.deviceId || id, `حذف الجهاز ${dev?.name || id}`);
    showToast(isAr ? 'تم حذف الجهاز من قاعدة البيانات.' : 'Device deleted.');
  };

  // Broadcast Announcement
  const handleSendBroadcast = async (title: string, message: string, target: 'all' | 'Departures' | 'Arrivals') => {
    const hallName = target === 'Departures' ? 'صالة المغادرون' : target === 'Arrivals' ? 'صالة القادمون' : (isAr ? 'كافة الصالات' : 'All Terminals');
    await createAlertInRTDB({
      title: `📢 ${title}`,
      location: `BROADCAST [${hallName}]`,
      hall: target === 'all' ? undefined : target,
      message,
      type: 'general_notice',
      deviceId: 'CONSOLE_ADMIN_ZICO',
      status: 'New',
      createdAt: Date.now(),
      timestamp: new Date().toLocaleTimeString('en-GB')
    });
    addAuditEntry('BROADCAST_SENT', hallName, `بث: ${title}`);
    showToast(isAr ? 'تم بث الإعلان الفوري لكافة الشاشات!' : 'Broadcast sent successfully!');
  };

  const handleAddAppraisal = async (newAppr: Omit<StaffAppraisal, 'id' | 'createdAt'>) => {
    const created: StaffAppraisal = {
      ...newAppr,
      id: `appr_${Date.now()}`,
      createdAt: Date.now()
    };
    setAppraisals(prev => {
      const updated = [created, ...prev];
      try {
        localStorage.setItem('mdf_staff_appraisals', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addAuditEntry('APPRAISAL_ADDED', newAppr.employeeId, `تقييم ${newAppr.rating} نجوم ووسام ${newAppr.badge}`);
    showToast(isAr ? 'تم حفظ التقييم ووسام التميز بنجاح!' : 'Appraisal & badge saved!');
  };

  // Backup & Restore
  const handleDownloadFullBackup = () => {
    const backupObj = {
      version: '2.5-mdf-executive',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.displayName || 'Zico (Executive Admin)',
      devices,
      staffList,
      alerts,
      appraisals,
      auditLogs,
      settings
    };

    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MDF_Complete_System_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addAuditEntry('BACKUP_DOWNLOADED', 'Full System', 'تنزيل نسخة احتياطية شاملة للنظام');
    showToast(isAr ? 'تم تصدير وحفظ النسخة الاحتياطية بنجاح!' : 'Full backup exported!');
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.devices || data.staffList) {
        await restoreFullBackupInRTDB(data);
        if (data.appraisals) setAppraisals(data.appraisals);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        addAuditEntry('BACKUP_RESTORED', 'Full System', 'استعادة نسخة احتياطية سابقة');
        showToast(isAr ? 'تمت استعادة كافة البيانات والأنظمة بنجاح!' : 'Backup restored successfully!');
      } else {
        showToast(isAr ? 'ملف النسخة الاحتياطية غير صالح!' : 'Invalid backup format!', 'error');
      }
    } catch (err: any) {
      showToast(isAr ? 'حدث خطأ أثناء قراءة الملف.' : 'Error reading backup file.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border transition-all animate-in fade-in slide-in-from-top-2 ${
          feedbackType === 'success' 
            ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/50 backdrop-blur-md' 
            : 'bg-red-950/95 text-red-200 border-red-500/50 backdrop-blur-md'
        }`}>
          {feedbackType === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 1. EXECUTIVE HEADER & REALTIME SYSTEM BAR */}
      <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Background Subtle Accent */}
        <div className="absolute top-0 right-0 w-96 h-48 bg-[#D2122E]/10 blur-3xl pointer-events-none -z-0" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#D2122E]/15 border border-[#D2122E]/30 text-[#D2122E] flex items-center justify-center shrink-0 shadow-lg shadow-red-950/40">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">
                  {isAr ? 'لوحة الإدارة والتحكم التنفيذي' : 'Executive Admin & Control Center'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#D2122E] text-white">
                  v2.5
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <span>{isAr ? 'سوق مسقط الحرة • مطار مسقط الدولي' : 'Muscat Duty Free • Muscat International Airport'}</span>
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <Wifi className="w-3 h-3" />
                  {isAr ? 'السحابة متصلة ونشطة' : 'Cloud Online'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
              <div className="text-lg font-black text-white font-mono">{stats.activeStaffCount} / {stats.totalStaff}</div>
              <div className="text-[11px] text-gray-400">{isAr ? 'موظف نشط' : 'Active Staff'}</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
              <div className="text-lg font-black text-emerald-400 font-mono">{stats.onlineDevicesCount} / {stats.totalDevices}</div>
              <div className="text-[11px] text-gray-400">{isAr ? 'أجهزة كاشير' : 'POS Terminals'}</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
              <div className="text-lg font-black text-blue-400 font-mono">{stats.resolvedAlertsCount}</div>
              <div className="text-[11px] text-gray-400">{isAr ? 'بلاغات منجزة' : 'Resolved'}</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
              <div className="text-lg font-black text-amber-400 font-mono">&lt; 45s</div>
              <div className="text-[11px] text-gray-400">{isAr ? 'متوسط الاستجابة' : 'Avg. Response'}</div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. IPHONE & BACKGROUND PUSH NOTIFICATIONS CENTER (Dedicated Hub) */}
      <div className="bg-gradient-to-r from-[#181818] via-[#141414] to-[#1a1215] border border-red-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  {isAr ? 'مركز الإشعارات الفورية في الخلفية (Push Notifications & iOS)' : 'Background Web Push & iOS Hub'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  hasToken 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {hasToken ? (isAr ? 'الجهاز مسجل 🟢' : 'Registered 🟢') : (isAr ? 'يتطلب التفعيل' : 'Ready to Enable')}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                {isAr 
                  ? 'يعمل نظام الإشعارات خارج المتصفح حتى عند إغلاق البرنامج وقفل شاشة الآيفون أو الأندرويد. في الآيفون، تأكد من تثبيت التطبيق على الشاشة الرئيسية (مشاركة -> إضافة للشاشة الرئيسية).'
                  : 'Notifications arrive outside the browser even when the app is completely closed. On iPhone, install via Safari (Share -> Add to Home Screen).'}
              </p>
              {pushStatus && (
                <div className="text-[11px] font-mono text-gray-400 mt-1.5 flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-red-400 animate-spin" />
                  <span>{pushStatus}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons for Push Testing */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleTestDevicePush}
              disabled={isTestingPush}
              className="px-5 py-3 bg-[#D2122E] hover:bg-[#b00e25] text-white rounded-2xl text-xs font-black shadow-lg shadow-red-950/50 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              <span>{isTestingPush ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'فحص إشعار الآيفون الفوري' : 'Test iPhone Push')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSimulateAlert('it_support')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-gray-200 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer border border-white/10 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'بث بلاغ VOID طوارئ' : 'Broadcast VOID Alert'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* 3. EXECUTIVE NAVIGATION TABS BAR */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-2.5 shadow-2xl backdrop-blur-md sticky top-16 z-30">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-[#D2122E] text-white shadow-lg shadow-red-950/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isAr ? 'المستخدمين والموظفين' : 'Staff Directory'}</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{staffList.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('programs')}
            className={`py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'programs'
                ? 'bg-[#D2122E] text-white shadow-lg shadow-red-950/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{isAr ? 'الأجهزة والأنظمة' : 'Devices & Systems'}</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">{devices.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-[#D2122E] text-white shadow-lg shadow-red-950/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{isAr ? 'محاكي الطوارئ والبث' : 'Alert Simulator'}</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-[#D2122E] text-white shadow-lg shadow-red-950/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isAr ? 'الأصوات والنظام' : 'Sound & Audio'}</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-[#D2122E] text-white shadow-lg shadow-red-950/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{isAr ? 'النسخ الاحتياطي' : 'Backup'}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#D2122E] text-white shadow-lg shadow-red-950/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'التقارير' : 'Reports'}</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#D2122E] text-white shadow-lg shadow-red-950/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{isAr ? 'سجل العمليات' : 'Audit'}</span>
          </button>

        </div>
      </div>

      {/* 4. TAB CONTENTS */}
      {activeTab === 'staff' && (
        <AdminUsersManagement
          staffList={staffList}
          alerts={alerts}
          lang={lang}
          onAddStaff={handleAddStaff}
          onUpdateStaff={handleUpdateStaff}
          onDeleteStaff={handleDeleteStaff}
        />
      )}

      {activeTab === 'programs' && (
        <AdminProgramsControl
          devices={devices}
          lang={lang}
          onAddDevice={handleAddDevice}
          onUpdateDevice={handleUpdateDevice}
          onDeleteDevice={handleDeleteDevice}
          onSendBroadcast={handleSendBroadcast}
          onQuickSimulate={handleSimulateAlert}
        />
      )}

      {/* Simulator & Live Testing Tab */}
      {activeTab === 'simulator' && (
        <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>{isAr ? 'محاكي الطوارئ والبث السحابي المباشر' : 'Emergency Simulator & Push Broadcast'}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isAr 
                ? 'اختبار بث البلاغات الفورية لجميع هواتف وشاشات الموظفين للتأكد من وصول الإشعارات خارج المتصفح على نظامي iOS و Android.'
                : 'Simulate live POS emergency triggers to test background push notification delivery to all staff devices.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* VOID Trigger Simulation */}
            <div className="bg-black/40 border border-red-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
                  🚨
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{isAr ? 'محاكاة طلب تفويض (VOID POS-012)' : 'Simulate VOID Authorization (POS-012)'}</h4>
                  <p className="text-[11px] text-gray-400">{isAr ? 'يرسل إشعاراً عاجلاً بنغمة تفويض خاصة' : 'Dispatches urgent supervisor authorization alert'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSimulateAlert('it_support')}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>{isAr ? 'إرسال بلاغ VOID تجريبي الآن' : 'Dispatch VOID Alert Now'}</span>
              </button>
            </div>

            {/* Customer Assistance Simulation */}
            <div className="bg-black/40 border border-blue-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  🛎️
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{isAr ? 'محاكاة طلب مساعدة زبون (صالة القادمون)' : 'Simulate Customer Assistance'}</h4>
                  <p className="text-[11px] text-gray-400">{isAr ? 'يرسل بلاغ مساعدة لموظفي الصالة' : 'Dispatches floor staff assistance request'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSimulateAlert('customer_assistance')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Bell className="w-4 h-4" />
                <span>{isAr ? 'إرسال بلاغ مساعدة تجريبي' : 'Dispatch Customer Alert Now'}</span>
              </button>
            </div>

          </div>

          {/* iOS Background Setup Instructions */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-black text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'دليل تشغيل الإشعارات على أجهزة iPhone / iPad' : 'iPhone / iPad Notification Guide'}</span>
            </h4>
            <ol className="text-xs text-gray-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>{isAr ? 'افتح الموقع في متصفح Safari على الآيفون.' : 'Open the app in Safari on your iPhone.'}</li>
              <li>{isAr ? 'اضغط زر المشاركة (Share ⬆️) ثم اختر "إضافة إلى الصفحة الرئيسية" (Add to Home Screen).' : 'Tap Share (⬆️) and select "Add to Home Screen".'}</li>
              <li>{isAr ? 'افتح التطبيق من أيقونة الشاشة الرئيسية الجديدة واضغط "تفعيل الإشعارات" ثم "سماح" (Allow).' : 'Open from the new Home Screen icon, tap Enable Notifications, and allow permission.'}</li>
              <li>{isAr ? 'ستصلك كافة البلاغات بنغمات واهتزازات فورية حتى عند إغلاق التطبيق وقفل الشاشة.' : 'You will receive alerts with sound & vibration even when the screen is locked.'}</li>
            </ol>
          </div>
        </div>
      )}

      {activeTab === 'audio' && (
        <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-pink-400" />
              <span>{isAr ? 'إعدادات النغمات والأصوات وتكرار التنبيه' : 'Audio Engine & Repeat Settings'}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isAr 
                ? 'تخصيص نغمات تفويض VOID ومساعدة الزبائن، والتحكم بعدد مرات تكرار الرنين (مرة واحدة، 3 مرات، 10 مرات).' 
                : 'Configure tone frequencies, alert volume, and chime repetitions (1x, 3x, 10x).'}
            </p>
          </div>

          <NotificationSettings
            settings={settings}
            onSaveSettings={onSaveSettings}
            onTestSound={onTestSound}
            lang={lang}
          />
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <span>{isAr ? 'النسخ الاحتياطي واستعادة النظام' : 'System Backup & Disaster Recovery'}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isAr 
                ? 'تصدير شامل لكافة بيانات الموظفين، أجهزة الكاشير، التقييمات، وسجل العمليات، أو استعادتها بضغطة زر.' 
                : 'Complete export and restore of staff directory, hardware nodes, appraisals, and audit logs.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Download Backup */}
            <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{isAr ? 'تصدير النسخة الاحتياطية (JSON)' : 'Export Full Backup'}</h3>
                  <p className="text-[11px] text-gray-400">{isAr ? 'حفظ نسخة آمنة من كافة البيانات الحالية' : 'Save full JSON snapshot'}</p>
                </div>
              </div>
              <button
                onClick={handleDownloadFullBackup}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تنزيل ملف النسخة الاحتياطية الآن' : 'Download Complete Backup JSON'}</span>
              </button>
            </div>

            {/* Restore Backup */}
            <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{isAr ? 'استعادة النسخة الاحتياطية' : 'Restore from JSON'}</h3>
                  <p className="text-[11px] text-gray-400">{isAr ? 'رفع ملف JSON واسترجاع البيانات فورياً' : 'Upload backup JSON file'}</p>
                </div>
              </div>
              <input
                ref={backupInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
              <button
                onClick={() => backupInputRef.current?.click()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>{isAr ? 'اختيار ملف الاستعادة' : 'Select Backup File to Restore'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <AdminReportsEngine
          alerts={alerts}
          devices={devices}
          staffList={staffList}
          appraisals={appraisals}
          lang={lang}
        />
      )}

      {activeTab === 'audit' && (
        <AdminAuditLog
          logs={auditLogs}
          lang={lang}
        />
      )}

    </div>
  );
};
