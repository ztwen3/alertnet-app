import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Bell, 
  Play, 
  CheckCircle2, 
  Save, 
  ToggleLeft, 
  ToggleRight, 
  HelpCircle, 
  AlertOctagon, 
  Sparkles, 
  Smartphone, 
  Laptop,
  Music,
  RefreshCw,
  Copy,
  Check,
  Radio,
  Send,
  Trash2,
  Apple,
  ShieldCheck,
  AlertTriangle,
  Info,
  Key,
  PlusSquare,
  Share,
  Layers
} from 'lucide-react';
import { AppSettings, SoundTone, AlertType, AuthUser, DeviceRegistration, DevicePlatform } from '../types';
import { AVAILABLE_SOUNDS, audioService } from '../lib/audioService';
import { AppLanguage, translations } from '../lib/i18n';
import { 
  initPushNotifications, 
  isIOSSafari, 
  isStandalonePWA, 
  getSavedVapidKey, 
  saveVapidKey, 
  getSavedFcmToken, 
  getSavedSubscription,
  sendTestPushToDevice 
} from '../lib/fcm';
import { CapacitorNativeService } from '../lib/capacitorService';
import { 
  registerStaffDeviceToken, 
  unregisterStaffDeviceToken, 
  subscribeUserDevices 
} from '../lib/firebase';

interface NotificationSettingsProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onTestSound: (type: AlertType) => void;
  lang?: AppLanguage;
  currentUser?: AuthUser | null;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSaveSettings,
  onTestSound,
  lang = 'ar',
  currentUser = null,
}) => {
  const t = translations[lang];
  const isEn = lang === 'en';

  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTestingTone, setActiveTestingTone] = useState<string | null>(null);

  // Sync with incoming settings when user switches or updates
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Device & Push State
  const [platform, setPlatform] = useState<DevicePlatform>(() => CapacitorNativeService.getPlatform());
  const [deviceName, setDeviceName] = useState<string>(() => CapacitorNativeService.getDeviceName());
  const [isIOS, setIsIOS] = useState<boolean>(() => isIOSSafari());
  const [isPWA, setIsPWA] = useState<boolean>(() => isStandalonePWA());
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | string>(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });
  const [fcmToken, setFcmToken] = useState<string | null>(() => {
    return CapacitorNativeService.getDeviceFcmToken() || getSavedFcmToken() || null;
  });
  const [vapidKeyInput, setVapidKeyInput] = useState<string>(() => getSavedVapidKey());
  const [savedVapidKeyMsg, setSavedVapidKeyMsg] = useState(false);
  const [requestingPush, setRequestingPush] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Test Push State
  const [sendingTestPush, setSendingTestPush] = useState(false);
  const [lockScreenCountdown, setLockScreenCountdown] = useState<number | null>(null);
  const [testPushResult, setTestPushResult] = useState<{ success: boolean; message: string } | null>(null);

  // Multi-Device Registry State
  const [userDevices, setUserDevices] = useState<DeviceRegistration[]>([]);

  // Refresh current device info
  useEffect(() => {
    setPlatform(CapacitorNativeService.getPlatform());
    setDeviceName(CapacitorNativeService.getDeviceName());
    setIsIOS(isIOSSafari());
    setIsPWA(isStandalonePWA());
    setFcmToken(CapacitorNativeService.getDeviceFcmToken() || getSavedFcmToken() || null);
    if (typeof Notification !== 'undefined') {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Listen to current user's registered devices from RTDB
  useEffect(() => {
    if (!currentUser?.employeeId) return;

    const unsubscribe = subscribeUserDevices(currentUser.employeeId, (devices) => {
      setUserDevices(devices);
    });

    return () => unsubscribe();
  }, [currentUser?.employeeId]);

  const getUserStorageKey = () => {
    return currentUser?.employeeId ? `mdf_user_settings_${currentUser.employeeId}` : 'mdf_app_settings';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const key = getUserStorageKey();
      localStorage.setItem(key, JSON.stringify(localSettings));
      localStorage.setItem('mdf_app_settings', JSON.stringify(localSettings));
    } catch (e) {
      console.warn('Local storage write error:', e);
    }
    audioService.setVolume(localSettings.volume);
    
    await onSaveSettings(localSettings);
    
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveVapidKey = () => {
    saveVapidKey(vapidKeyInput);
    setSavedVapidKeyMsg(true);
    setTimeout(() => setSavedVapidKeyMsg(false), 2500);
  };

  const handleToneChange = (type: 'customer' | 'it' | 'general', tone: SoundTone) => {
    setLocalSettings(prev => {
      const updated = { ...prev };
      if (type === 'customer') updated.customerSound = tone;
      if (type === 'it') updated.itSound = tone;
      if (type === 'general') updated.generalSound = tone;
      try {
        const key = getUserStorageKey();
        localStorage.setItem(key, JSON.stringify(updated));
        localStorage.setItem('mdf_app_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    audioService.setVolume(localSettings.volume);
    audioService.playTone(tone, 1);
  };

  const handleTestSpecificTone = (tone: SoundTone) => {
    setActiveTestingTone(tone);
    audioService.setVolume(localSettings.volume);
    audioService.playTone(tone, 1);
    setTimeout(() => setActiveTestingTone(null), 1200);
  };

  const handleTestAlertCategory = (type: AlertType) => {
    audioService.setVolume(localSettings.volume);
    const repeats = localSettings.soundRepeatCount || 1;
    if (type === 'customer_assistance') {
      audioService.playCustomerAssistanceSound(localSettings.customerSound, repeats);
    } else if (type === 'it_support') {
      audioService.playITSupportSound(localSettings.itSound, repeats);
    } else {
      audioService.playGeneralSound(localSettings.generalSound, repeats);
    }
  };

  // Enable Notifications Action (Strictly on User Gesture)
  const handleEnablePushNotifications = async () => {
    setRequestingPush(true);
    setTestPushResult(null);
    try {
      const res = await initPushNotifications(vapidKeyInput);
      setBrowserPermission(res.permission);
      
      if (res.token) {
        setFcmToken(res.token);
        // Register in RTDB under current employee
        if (currentUser?.employeeId) {
          await registerStaffDeviceToken(currentUser.employeeId, res.token, {
            name: currentUser.displayName,
            role: currentUser.role,
            department: currentUser.department,
            platform: res.platform,
            deviceName: res.deviceName,
            isNative: CapacitorNativeService.isNative(),
            appVersion: '2.5.0',
            subscription: res.subscription || getSavedSubscription()
          });
        }
      }

      if (res.success && res.permission === 'granted') {
        if (!CapacitorNativeService.isNative() && typeof Notification !== 'undefined') {
          new Notification(isEn ? 'MDF AlertNet • Push Activated' : 'السوق الحرة مسقط • تم تفعيل الإشعارات', {
            body: isEn ? 'Real Web Push notifications are now active on your iPhone!' : 'تم تفعيل إشعارات الويب الفورية على جهازك بنجاح!',
            icon: '/icon.png',
          });
        }
        setTestPushResult({
          success: true,
          message: isEn ? 'Push notifications enabled successfully!' : 'تم تفعيل الإشعارات بنجاح وحفظ رمز الجهاز في قاعدة البيانات.'
        });
      } else if (res.error) {
        setTestPushResult({
          success: false,
          message: res.error
        });
      }
    } catch (e: any) {
      console.warn('Push registration note:', e);
      setTestPushResult({
        success: false,
        message: e?.message || 'حدث خطأ أثناء تفعيل الإشعارات'
      });
    } finally {
      setRequestingPush(false);
    }
  };

  // Disable Notifications for current device
  const handleDisablePushNotifications = async () => {
    if (currentUser?.employeeId && fcmToken) {
      await unregisterStaffDeviceToken(currentUser.employeeId, fcmToken);
    }
    localStorage.removeItem('mdf_fcm_device_token');
    setFcmToken(null);
    setTestPushResult({
      success: true,
      message: isEn ? 'Notifications disabled for this device.' : 'تم تعطيل الإشعارات لهذا الجهاز بنجاح.'
    });
  };

  // Send Instant Test Notification
  const handleSendTestNotification = async () => {
    setSendingTestPush(true);
    setTestPushResult(null);

    try {
      // 1. Play local sound & haptic vibration immediately for instant feedback
      audioService.playTone(localSettings.customerSound || 'chime_dual', 1);
      CapacitorNativeService.vibrateAlert('warning');

      // 2. Dispatch real test push to backend
      const data = await sendTestPushToDevice(fcmToken || '', deviceName, platform);

      if (data.success) {
        setTestPushResult({
          success: true,
          message: isEn 
            ? `Push notification delivered! (${data.recipient ? `Device: ...${data.recipient}` : 'Delivered via WebPush/FCM'})`
            : `تم إرسال إشعار الدفع بنجاح! (${data.recipient ? `الجهاز: ...${data.recipient}` : 'تم التسليم عبر WebPush/FCM'})`
        });
      } else {
        setTestPushResult({
          success: false,
          message: data.message || (isEn ? 'Push dispatched locally.' : 'تم إطلاق التنبيه محلياً بنجاح.')
        });
      }
    } catch (err: any) {
      console.warn('Test push dispatch note:', err);
      setTestPushResult({
        success: false,
        message: isEn ? 'Sent test alert locally.' : 'تم تشغيل التنبيه التجريبي محلياً.'
      });
    } finally {
      setSendingTestPush(false);
    }
  };

  // Send Lock Screen Delayed Test Notification (5s Countdown to lock phone)
  const handleTestLockScreenNotification = async () => {
    if (!fcmToken) {
      setTestPushResult({
        success: false,
        message: isEn ? 'Please enable notifications on this device first.' : 'يرجى النقر على تفعيل واستلام الإشعارات أولاً.'
      });
      return;
    }

    setSendingTestPush(true);
    setLockScreenCountdown(5);
    setTestPushResult({
      success: true,
      message: isEn 
        ? '⏱️ 5-second countdown started! Lock your iPhone now or switch to Home Screen to see the lock screen notification.' 
        : '⏱️ بدأ العد التنازلي (5 ثوانٍ).. اقفل شاشة الآيفون الآن أو اخرج للشاشة الرئيسية لمعاينة الإشعار على شاشة القفل!'
    });

    let count = 5;
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setLockScreenCountdown(count);
      } else {
        clearInterval(timer);
        setLockScreenCountdown(null);
      }
    }, 1000);

    try {
      const data = await sendTestPushToDevice(fcmToken, deviceName, platform, {
        delayMs: 5000,
        title: isEn ? '🚨 MDF AlertNet • Lock Screen Alert' : '🚨 تنبيه شاشة القفل • سوق مسقط الحرة',
        message: isEn 
          ? `Lock Screen Push verified on ${deviceName} at ${new Date().toLocaleTimeString()}`
          : `تم استلام تنبيه البلاغ بنجاح على شاشة القفل (${deviceName}) في ${new Date().toLocaleTimeString('ar-OM')}`
      });

      if (data.success) {
        setTestPushResult({
          success: true,
          message: isEn ? '✅ Lock screen push sent! Check your iPhone lock screen.' : '✅ تم إرسال إشعار شاشة القفل بنجاح! تفقد شاشة قفل الآيفون الآن.'
        });
      }
    } catch (err: any) {
      console.warn('Lock screen test push error:', err);
    } finally {
      setSendingTestPush(false);
    }
  };

  const handleCopyToken = () => {
    if (!fcmToken) return;
    navigator.clipboard.writeText(fcmToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const isPushActive = browserPermission === 'granted' && !!fcmToken;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12" dir={isEn ? 'ltr' : 'rtl'}>
      
      {/* Top Header Card */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D2122E]/20 border border-[#D2122E]/30 text-[#D2122E] flex items-center justify-center shadow-lg shrink-0">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {t.soundSettingsTitle}
              </h2>
              <span className="text-[10px] bg-[#D2122E]/20 text-[#D2122E] font-bold px-2.5 py-0.5 rounded-full border border-[#D2122E]/30">
                {isEn ? 'Web Push & Audio Center' : 'مركز إشعارات الويب والصوتيات'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t.soundSettingsSubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#D2122E] hover:bg-[#b00e25] text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-red-950/40 transition-all flex items-center justify-center gap-2 shrink-0 uppercase tracking-wider active:scale-[0.98]"
        >
          {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-green-300" /> : <Save className="w-4 h-4" />}
          <span>{saving ? t.savingSettings : saveSuccess ? t.savedSettingsSuccess : t.saveSoundSettings}</span>
        </button>
      </div>

      {/* Per-User Device Isolation Banner */}
      {currentUser && (
        <div className="bg-[#181818] border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
              👤
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                <span>{isEn ? 'Personal Device Preferences' : 'إعدادات مخصصة لجهازك الخاص فقط'}</span>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded text-[11px] font-mono">
                  {currentUser.displayName} ({currentUser.employeeId})
                </span>
              </div>
              <p className="text-gray-400 text-[11px] mt-0.5">
                {isEn 
                  ? 'Your sound volume, selected tones, and notification preferences are kept specifically on this device and do not overwrite other staff members.'
                  : 'مستوى الصوت، النغمات، وخيارات الإشعارات والتكرار تخص جهازك هذا فقط ولا تؤثر على حسابات أو أجهزة باقي الموظفين.'}
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold shrink-0 self-start sm:self-center">
            {isEn ? 'Device Isolated' : 'مستقل على جهازك'}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: iPhone PWA Setup Instruction Banner (iOS Safari Specific)        */}
      {/* ========================================================================= */}
      {isIOS && (
        <div className="bg-gradient-to-br from-[#1C1814] via-[#161616] to-[#121212] border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Apple className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase">
                    {isEn ? 'iPhone Web Push (PWA)' : 'إشعارات آيفون بدون Mac أو Xcode'}
                  </span>
                  {isPWA ? (
                    <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{isEn ? 'Running as Home Screen App' : 'مثبت على الشاشة الرئيسية'}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-bold px-2 py-0.5 rounded-full">
                      {isEn ? 'Safari Browser Tab' : 'تبويب سفاري العادي'}
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-1">
                  {isEn 
                    ? 'To receive notifications on iPhone, first add this app to your Home Screen.'
                    : 'لاستلام الإشعارات على آيفون، أضف التطبيق أولاً إلى الشاشة الرئيسية.'}
                </h3>
              </div>
            </div>
          </div>

          {/* 6 Steps Guide */}
          <div className="space-y-2">
            <div className="text-xs text-gray-300 font-medium">
              {isEn ? 'Follow these 6 steps on your iPhone:' : 'اتبع الخطوات الست التالية على جهاز الآيفون:'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              <div className="bg-[#1F1F1F] p-3 rounded-2xl border border-white/5 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white/10 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">1</div>
                <div className="text-xs">
                  <span className="font-bold text-white block">{isEn ? 'Open in Safari' : 'افتح الرابط في Safari'}</span>
                  <span className="text-[11px] text-gray-400">{isEn ? 'Use iOS Safari browser' : 'استخدم متصفح سفاري على الآيفون'}</span>
                </div>
              </div>

              <div className="bg-[#1F1F1F] p-3 rounded-2xl border border-amber-500/20 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">2</div>
                <div className="text-xs">
                  <span className="font-bold text-white flex items-center gap-1">
                    <span>{isEn ? 'Tap Share' : 'اضغط زر المشاركة'}</span>
                    <Share className="w-3.5 h-3.5 text-amber-400" />
                  </span>
                  <span className="text-[11px] text-gray-400">{isEn ? 'Tap share button in bottom bar' : 'الأيقونة المربعة في أسفل شريط Safari'}</span>
                </div>
              </div>

              <div className="bg-[#1F1F1F] p-3 rounded-2xl border border-amber-500/20 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">3</div>
                <div className="text-xs">
                  <span className="font-bold text-white flex items-center gap-1">
                    <span>{isEn ? 'Add to Home Screen' : 'إضافة إلى الصفحة الرئيسية'}</span>
                    <PlusSquare className="w-3.5 h-3.5 text-amber-400" />
                  </span>
                  <span className="text-[11px] text-gray-400">{isEn ? 'Select "Add to Home Screen"' : 'اختر "إضافة إلى الصفحة الرئيسية"'}</span>
                </div>
              </div>

              <div className="bg-[#1F1F1F] p-3 rounded-2xl border border-white/5 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white/10 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">4</div>
                <div className="text-xs">
                  <span className="font-bold text-white block">{isEn ? 'Open from Home Screen' : 'افتح من الشاشة الرئيسية'}</span>
                  <span className="text-[11px] text-gray-400">{isEn ? 'Launch installed MDF Alert app' : 'اضغط على أيقونة التطبيق المثبتة'}</span>
                </div>
              </div>

              <div className="bg-[#1F1F1F] p-3 rounded-2xl border border-red-500/20 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">5</div>
                <div className="text-xs">
                  <span className="font-bold text-white flex items-center gap-1">
                    <span>{isEn ? 'Tap Enable Notifications' : 'اضغط "تفعيل الإشعارات"'}</span>
                    <Bell className="w-3.5 h-3.5 text-red-400" />
                  </span>
                  <span className="text-[11px] text-gray-400">{isEn ? 'Tap button below to request' : 'اضغط الزر الأحمر بالأسفل'}</span>
                </div>
              </div>

              <div className="bg-[#1F1F1F] p-3 rounded-2xl border border-green-500/20 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">6</div>
                <div className="text-xs">
                  <span className="font-bold text-white flex items-center gap-1">
                    <span>{isEn ? 'Allow Notifications' : 'اختر السماح (Allow)'}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  </span>
                  <span className="text-[11px] text-gray-400">{isEn ? 'Accept iOS prompt' : 'امنح الإذن لتصلك التنبيهات'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Web Push & Cloud Messaging Device Center                          */}
      {/* ========================================================================= */}
      <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase flex items-center gap-2">
                <span>{isEn ? 'Web Push & Device Notification Center' : 'مركز إشعارات الويب والأجهزة السحابي'}</span>
                <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 font-mono px-2 py-0.5 rounded-full">
                  FCM Web Push • PWA
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEn ? 'Real-time background emergency alerts with sound, vibration, and multi-device sync' : 'استلام بلاغات الطوارئ في الخلفية مع الصوت والاهتزاز والمزامنة بين كافة أجهزتك'}
              </p>
            </div>
          </div>

          {/* Quick Test Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleTestLockScreenNotification}
              disabled={sendingTestPush}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg relative"
            >
              {lockScreenCountdown !== null ? (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-black font-mono text-[10px] font-black flex items-center justify-center animate-ping">
                  {lockScreenCountdown}
                </span>
              ) : (
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>
                {lockScreenCountdown !== null 
                  ? (isEn ? `Lock Phone! (${lockScreenCountdown}s)` : `اقفل هاتفك الآن! (${lockScreenCountdown} ثوانٍ)`)
                  : (isEn ? 'Test Lock Screen (5s Delay)' : 'فحص شاشة القفل (عد 5 ثوانٍ)')}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSendTestNotification}
              disabled={sendingTestPush}
              className="px-4 py-2.5 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg"
            >
              {sendingTestPush && lockScreenCountdown === null ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isEn ? 'Instant Test Push' : 'إرسال إشعار فوري'}</span>
            </button>
          </div>
        </div>

        {/* Current Device Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Device Platform & Mode */}
          <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 space-y-2">
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {isEn ? 'Device Platform & Mode' : 'نوع وبيئة الجهاز'}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                {platform === 'ios' ? <Apple className="w-5 h-5 text-gray-200" /> : 
                 platform === 'android' ? <Smartphone className="w-5 h-5 text-green-400" /> : 
                 <Laptop className="w-5 h-5 text-blue-400" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{deviceName}</span>
                  <span className="text-[9px] bg-white/10 px-1.5 py-0.2 rounded font-mono text-gray-300 uppercase">
                    {platform}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-medium">
                  {isPWA ? '📱 PWA Standalone (Home Screen)' : (CapacitorNativeService.isNative() ? '📦 Capacitor Native' : '🌐 Web Browser Tab')}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Notification Permission Status */}
          <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 space-y-2">
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {isEn ? 'Notification Permission' : 'حالة إذن الإشعارات'}
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                isPushActive 
                  ? 'bg-green-500/15 border-green-500/30 text-green-400' 
                  : browserPermission === 'denied'
                  ? 'bg-red-500/15 border-red-500/30 text-red-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}>
                {isPushActive ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {isPushActive ? (isEn ? 'Granted & Connected' : 'مفعل ومستعد للاستلام') :
                   browserPermission === 'denied' ? (isEn ? 'Permission Denied' : 'الإذن مرفوض في الإعدادات') :
                   (isEn ? 'Permission Required' : 'مطلوب النقر للتفعيل')}
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {browserPermission}
                </div>
              </div>
            </div>
          </div>

          {/* 3. FCM Device Token Registration */}
          <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 space-y-2">
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {isEn ? 'Cloud Database Registration' : 'التسجيل في قاعدة البيانات'}
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                fcmToken 
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' 
                  : 'bg-gray-800 border-white/10 text-gray-500'
              }`}>
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {fcmToken ? (isEn ? 'Token Synchronized' : 'الرمز متزامن مع الخادم') : (isEn ? 'Not Registered' : 'غير مسجل')}
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {currentUser?.employeeId ? `${isEn ? 'User:' : 'الموظف:'} ${currentUser.employeeId}` : (isEn ? 'No user logged in' : 'لم يتم تسجيل الدخول')}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* VAPID Public Key Configuration Field */}
        <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-gray-300">
                {isEn ? 'Firebase Web Push Certificates (VAPID Public Key)' : 'مفتاح شهادة الويب السحابية (Firebase VAPID Public Key)'}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">
              Firebase Console &gt; Project Settings &gt; Cloud Messaging &gt; Web Push Certificates
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={vapidKeyInput}
              onChange={(e) => setVapidKeyInput(e.target.value)}
              placeholder={isEn ? "Paste your Firebase VAPID public key here..." : "الصق مفتاح VAPID العام من Firebase Console هنا..."}
              className="flex-1 bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-all"
            />
            <button
              type="button"
              onClick={handleSaveVapidKey}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              {savedVapidKeyMsg ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedVapidKeyMsg ? (isEn ? 'Saved!' : 'تم الحفظ!') : (isEn ? 'Save Key' : 'حفظ المفتاح')}</span>
            </button>
          </div>
        </div>

        {/* Token Box & Actions */}
        <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-300">
                {isEn ? 'Device Web Push FCM Token' : 'رمز الإشعار المخصص لهذا الجهاز (FCM Token)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {fcmToken && (
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? (isEn ? 'Copied' : 'تم النسخ') : (isEn ? 'Copy Token' : 'نسخ الرمز')}</span>
                </button>
              )}

              {isPushActive ? (
                <button
                  type="button"
                  onClick={handleDisablePushNotifications}
                  className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Disable on this device' : 'تعطيل على هذا الجهاز'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEnablePushNotifications}
                  disabled={requestingPush}
                  className="px-5 py-2.5 bg-[#D2122E] hover:bg-[#b00e25] text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-red-950/40 transition-all active:scale-95"
                >
                  {requestingPush ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  <span>{isEn ? 'Enable Notifications' : 'تفعيل الإشعارات الآن'}</span>
                </button>
              )}
            </div>
          </div>

          {fcmToken ? (
            <div className="p-2.5 bg-black/50 rounded-xl border border-white/5 font-mono text-[11px] text-gray-400 break-all select-all">
              {fcmToken}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                <span>
                  {isEn 
                    ? 'Click [ Enable Notifications ] to grant permission and connect this iPhone / browser to the background notification server.'
                    : 'انقر على زر [ تفعيل الإشعارات الآن ] لمنح الصلاحية وربط هذا الجهاز بخادم الإشعارات السحابي.'}
                </span>
                <button
                  type="button"
                  onClick={handleEnablePushNotifications}
                  disabled={requestingPush}
                  className="px-3 py-1.5 bg-amber-500 text-black font-bold rounded-lg text-xs hover:bg-amber-400 shrink-0"
                >
                  {isEn ? 'Enable Now' : 'تفعيل الآن'}
                </button>
              </div>
            </div>
          )}

          {/* Test Push Result Alert */}
          {testPushResult && (
            <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              testPushResult.success 
                ? 'bg-green-500/15 border-green-500/30 text-green-300' 
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}>
              {testPushResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" /> : <Info className="w-4 h-4 shrink-0 text-amber-400" />}
              <span>{testPushResult.message}</span>
            </div>
          )}

          {/* iOS Lock Screen Troubleshooting & Status Guide */}
          <div className="p-4 bg-[#181818] rounded-2xl border border-blue-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Apple className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">
                  {isEn ? 'Apple iOS Lock Screen & Background Push Checklist' : 'دليل شاشة قفل الآيفون واستقبال الإشعارات خارج التطبيق'}
                </span>
              </div>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                iOS 16.4+ / 17 / 18
              </span>
            </div>

            <p className="text-[11px] text-gray-300 leading-relaxed">
              {isEn 
                ? 'To ensure notifications appear on your locked iPhone screen and when the app is closed, verify the following 3 requirements:'
                : 'لكي تظهر الإشعارات على شاشة قفل الآيفون والتطبيق مقفل تماماً في الخلفية، يرجى التأكد من تحقق الشروط الثلاثة التالية:'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              {/* Check 1: Home Screen PWA */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                isPWA 
                  ? 'bg-green-500/10 border-green-500/30 text-green-300' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {isPWA ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  <span className="text-xs font-bold">{isEn ? '1. Home Screen App' : '1. الشاشة الرئيسية'}</span>
                </div>
                <div className="text-[11px] text-gray-300">
                  {isPWA 
                    ? (isEn ? '✅ App running from Home Screen' : '✅ التطبيق مفتوح من أيقونة الشاشة الرئيسية')
                    : (isEn ? '⚠️ Must open from Home Screen icon (Share > Add to Home Screen)' : '⚠️ يجب فتح التطبيق من أيقونة الشاشة الرئيسية (مشاركة -> إضافة إلى الصفحة الرئيسية)')}
                </div>
              </div>

              {/* Check 2: iOS Settings */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">{isEn ? '2. iOS Settings' : '2. إعدادات الآيفون'}</span>
                </div>
                <div className="text-[11px] text-gray-300">
                  {isEn 
                    ? 'Settings > Notifications > MDF Alert > Enable Lock Screen & Banners' 
                    : 'الإعدادات > الإشعارات > MDF Alert > تفعيل "شاشة القفل" و"الشعارات" و"الأصوات"'}
                </div>
              </div>

              {/* Check 3: Focus Mode */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-1.5">
                  <Bell className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">{isEn ? '3. Focus / DND' : '3. نمط التركيز'}</span>
                </div>
                <div className="text-[11px] text-gray-300">
                  {isEn 
                    ? 'Ensure Do Not Disturb / Focus is not silencing alerts' 
                    : 'تأكد من عدم كتم الإشعارات بنمط "عدم الإزعاج" أو اسمح لتطبيق MDF Alert'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Multi-Device List */}
        {currentUser?.employeeId && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-300">
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-red-400" />
                <span>{isEn ? 'Your Registered Devices (Multi-Device Sync)' : 'الأجهزة المسجلة لحسابك (المزامنة المتعددة)'}</span>
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono text-gray-300">
                {userDevices.length} {isEn ? 'Device(s)' : 'أجهزة'}
              </span>
            </div>

            {userDevices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {userDevices.map((dev) => {
                  const isCurrent = dev.token === fcmToken || (fcmToken && dev.token.slice(-30) === fcmToken.slice(-30));
                  return (
                    <div 
                      key={dev.id || dev.token}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isCurrent 
                          ? 'bg-[#1D1D1D] border-red-500/40 shadow-lg shadow-red-950/20' 
                          : 'bg-[#181818] border-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                            {dev.platform === 'ios' ? <Apple className="w-4 h-4" /> :
                             dev.platform === 'android' ? <Smartphone className="w-4 h-4 text-green-400" /> :
                             <Laptop className="w-4 h-4 text-blue-400" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1">
                              <span>{dev.deviceName || 'Device'}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.2 rounded font-bold">
                                  {isEn ? 'This Device' : 'هذا الجهاز'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {dev.platform.toUpperCase()} • v{dev.appVersion || '2.5.0'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => unregisterStaffDeviceToken(currentUser.employeeId, dev.token)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                          title={isEn ? 'Remove device' : 'حذف الجهاز'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500 font-mono">
                        <span>{isEn ? 'Last Active:' : 'آخر نشاط:'}</span>
                        <span>{dev.lastActive ? new Date(dev.lastActive).toLocaleTimeString() : 'Recently'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-[#181818] rounded-2xl border border-dashed border-white/10 text-center text-xs text-gray-400">
                {isEn ? 'No other devices registered for this user account.' : 'لا توجد أجهزة إضافية مسجلة لهذا الحساب حالياً.'}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* Grid: 3 Main Alert Sound Customization Cards                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Alert Type 1: Customer Assistance (Emergency Help) */}
        <div className="bg-[#141414] border border-amber-500/20 rounded-3xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase">{t.custAlertTitle}</h3>
                  <p className="text-[10px] text-gray-400">{t.custAlertSub}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLocalSettings(p => ({ ...p, customerAlertsEnabled: !p.customerAlertsEnabled }))}
                className="text-xs font-bold transition-transform active:scale-95"
                title={localSettings.customerAlertsEnabled ? (isEn ? 'Disable' : 'تعطيل') : (isEn ? 'Enable' : 'تفعيل')}
              >
                {localSettings.customerAlertsEnabled ? (
                  <ToggleRight className="w-7 h-7 text-green-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-600" />
                )}
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-gray-300 font-bold mb-2">
                {t.customToneLabel}
              </label>
              <select
                value={localSettings.customerSound}
                onChange={(e) => handleToneChange('customer', e.target.value as SoundTone)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-sans cursor-pointer"
              >
                {AVAILABLE_SOUNDS.map(snd => (
                  <option key={snd.id} value={snd.id}>
                    {isEn ? `${snd.nameEn} (${snd.category})` : `${snd.nameAr} - ${snd.nameEn}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-[#1A1A1A] rounded-xl border border-white/5 text-[11px] text-gray-400">
              {isEn 
                ? (AVAILABLE_SOUNDS.find(s => s.id === localSettings.customerSound)?.descriptionEn || 'Custom synthesized audio tone')
                : AVAILABLE_SOUNDS.find(s => s.id === localSettings.customerSound)?.descriptionAr
              }
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTestAlertCategory('customer_assistance')}
            className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-amber-300" />
            <span>{t.testCustSoundBtn}</span>
          </button>
        </div>

        {/* Alert Type 2: IT Support / PC Maintenance */}
        <div className="bg-[#141414] border border-blue-500/20 rounded-3xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase">{t.itAlertTitle}</h3>
                  <p className="text-[10px] text-gray-400">{t.itAlertSub}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLocalSettings(p => ({ ...p, itAlertsEnabled: !p.itAlertsEnabled }))}
                className="text-xs font-bold transition-transform active:scale-95"
                title={localSettings.itAlertsEnabled ? (isEn ? 'Disable' : 'تعطيل') : (isEn ? 'Enable' : 'تفعيل')}
              >
                {localSettings.itAlertsEnabled ? (
                  <ToggleRight className="w-7 h-7 text-green-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-600" />
                )}
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-gray-300 font-bold mb-2">
                {t.customToneLabel}
              </label>
              <select
                value={localSettings.itSound}
                onChange={(e) => handleToneChange('it', e.target.value as SoundTone)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans cursor-pointer"
              >
                {AVAILABLE_SOUNDS.map(snd => (
                  <option key={snd.id} value={snd.id}>
                    {isEn ? `${snd.nameEn} (${snd.category})` : `${snd.nameAr} - ${snd.nameEn}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-[#1A1A1A] rounded-xl border border-white/5 text-[11px] text-gray-400">
              {isEn 
                ? (AVAILABLE_SOUNDS.find(s => s.id === localSettings.itSound)?.descriptionEn || 'High-frequency attention signal')
                : AVAILABLE_SOUNDS.find(s => s.id === localSettings.itSound)?.descriptionAr
              }
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTestAlertCategory('it_support')}
            className="w-full py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-blue-300" />
            <span>{t.testITSoundBtn}</span>
          </button>
        </div>

        {/* Alert Type 3: General Notices */}
        <div className="bg-[#141414] border border-purple-500/20 rounded-3xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase">{t.genAlertTitle}</h3>
                  <p className="text-[10px] text-gray-400">{t.genAlertSub}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLocalSettings(p => ({ ...p, generalAlertsEnabled: !p.generalAlertsEnabled }))}
                className="text-xs font-bold transition-transform active:scale-95"
                title={localSettings.generalAlertsEnabled ? (isEn ? 'Disable' : 'تعطيل') : (isEn ? 'Enable' : 'تفعيل')}
              >
                {localSettings.generalAlertsEnabled ? (
                  <ToggleRight className="w-7 h-7 text-green-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-600" />
                )}
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-gray-300 font-bold mb-2">
                {t.customToneLabel}
              </label>
              <select
                value={localSettings.generalSound}
                onChange={(e) => handleToneChange('general', e.target.value as SoundTone)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all font-sans cursor-pointer"
              >
                {AVAILABLE_SOUNDS.map(snd => (
                  <option key={snd.id} value={snd.id}>
                    {isEn ? `${snd.nameEn} (${snd.category})` : `${snd.nameAr} - ${snd.nameEn}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-[#1A1A1A] rounded-xl border border-white/5 text-[11px] text-gray-400">
              {isEn 
                ? (AVAILABLE_SOUNDS.find(s => s.id === localSettings.generalSound)?.descriptionEn || 'Subtle airport announcement chime')
                : AVAILABLE_SOUNDS.find(s => s.id === localSettings.generalSound)?.descriptionAr
              }
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTestAlertCategory('general_notice')}
            className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-purple-300" />
            <span>{t.testGenSoundBtn}</span>
          </button>
        </div>

      </div>

      {/* Global Volume & Sound Behavior Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Audio Volume & Hardware Repetition */}
        <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
            <Volume2 className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-bold text-white uppercase">
              {isEn ? 'Master Volume & Alert Repetition' : 'التحكم بمستوى الصوت والتكرار'}
            </h3>
          </div>

          {/* Master Volume */}
          <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-300">
              <span className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-green-400" />
                <span>{t.masterVolLabel}</span>
              </span>
              <span className="font-mono text-[#D2122E] text-sm font-extrabold">
                {Math.round(localSettings.volume * 100)}%
              </span>
            </div>
            
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={localSettings.volume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                setLocalSettings(p => ({ ...p, volume: vol }));
                audioService.setVolume(vol);
              }}
              className="w-full accent-[#D2122E] h-2 bg-[#252525] rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
              <span>{isEn ? '10% (Low)' : '10% (منخفض)'}</span>
              <span>{isEn ? '50% (Medium)' : '50% (متوسط)'}</span>
              <span>{isEn ? '100% (Max)' : '100% (أقصى صوت)'}</span>
            </div>
          </div>

          {/* Repeat Chime Count */}
          <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 space-y-2">
            <label className="block text-xs font-bold text-gray-300">
              {t.alertRepeatLabel}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 10].map(count => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setLocalSettings(p => ({ ...p, soundRepeatCount: count }))}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    localSettings.soundRepeatCount === count
                      ? 'bg-[#D2122E] text-white border-[#D2122E] shadow-lg shadow-red-950/40'
                      : 'bg-[#141414] text-gray-400 border-white/10 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {count === 1 ? t.repeatOnce : count === 3 ? t.repeatThrice : t.repeatTen}
                </button>
              ))}
            </div>
          </div>

          {/* Master Sound On/Off Switch */}
          <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {localSettings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-green-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-red-400" />
              )}
              <div>
                <div className="text-xs font-bold text-white">{t.masterSoundToggle}</div>
                <div className="text-[10px] text-gray-400">{t.masterSoundToggleDesc}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLocalSettings(p => ({ ...p, soundEnabled: !p.soundEnabled }))}
              className="transition-transform active:scale-95"
            >
              {localSettings.soundEnabled ? (
                <ToggleRight className="w-8 h-8 text-green-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-600" />
              )}
            </button>
          </div>

        </div>

        {/* Visual & Hardware Behavior */}
        <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase">
              {isEn ? 'Hardware Feedback & Display' : 'الاستجابة الحركية والشاشة'}
            </h3>
          </div>

          {/* Mobile Vibration Toggle */}
          <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-white">{t.vibrationTitle}</div>
                <div className="text-[10px] text-gray-400">{t.vibrationDesc}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextVal = !localSettings.vibrationEnabled;
                setLocalSettings(p => ({ ...p, vibrationEnabled: nextVal }));
                if (nextVal) {
                  CapacitorNativeService.vibrateAlert('warning');
                }
              }}
              className="transition-transform active:scale-95"
            >
              {localSettings.vibrationEnabled ? (
                <ToggleRight className="w-8 h-8 text-green-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-600" />
              )}
            </button>
          </div>

          {/* High Priority Visual Flash Overlay */}
          <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#D2122E]" />
              <div>
                <div className="text-xs font-bold text-white">{t.visualFlashTitle}</div>
                <div className="text-[10px] text-gray-400">{t.visualFlashDesc}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLocalSettings(p => ({ ...p, highPriorityPopup: !p.highPriorityPopup }))}
              className="transition-transform active:scale-95"
            >
              {localSettings.highPriorityPopup ? (
                <ToggleRight className="w-8 h-8 text-green-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-600" />
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Complete Audio Sound Tone Showcase Library */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <Music className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase">
                {t.soundLibraryTitle} ({AVAILABLE_SOUNDS.length})
              </h3>
              <p className="text-[11px] text-gray-400">
                {t.soundLibrarySubtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {AVAILABLE_SOUNDS.map(snd => {
            const isTesting = activeTestingTone === snd.id;
            return (
              <div 
                key={snd.id}
                className="bg-[#1A1A1A] p-3.5 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:border-white/20 transition-all group"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{isEn ? snd.nameEn : snd.nameAr}</span>
                    <span className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.2 rounded font-mono">
                      {snd.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 font-mono truncate max-w-[180px]">
                    {isEn ? snd.descriptionEn : snd.nameEn}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTestSpecificTone(snd.id)}
                  disabled={isTesting}
                  className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                    isTesting 
                      ? 'bg-green-500 text-black animate-pulse' 
                      : 'bg-white/10 hover:bg-[#D2122E] text-white'
                  }`}
                  title={t.listenTone}
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span className="text-[10px]">{isTesting ? t.playingTone : t.listenTone}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
