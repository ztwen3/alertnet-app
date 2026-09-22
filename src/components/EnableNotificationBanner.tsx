import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, RefreshCw, X, ShieldAlert, Sparkles, Send } from 'lucide-react';
import { initPushNotifications, getSavedFcmToken, isIOSSafari, isStandalonePWA } from '../lib/fcm';
import { registerStaffDeviceToken } from '../lib/firebase';
import { CapacitorNativeService } from '../lib/capacitorService';
import { AuthUser } from '../types';
import { AppLanguage } from '../lib/i18n';

interface EnableNotificationBannerProps {
  currentUser: AuthUser | null;
  lang: AppLanguage;
  onOpenSettings?: () => void;
}

export const EnableNotificationBanner: React.FC<EnableNotificationBannerProps> = ({
  currentUser,
  lang,
  onOpenSettings
}) => {
  const isEn = lang === 'en';
  const [permission, setPermission] = useState<string>('default');
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    const token = getSavedFcmToken() || CapacitorNativeService.getDeviceFcmToken();
    if (token) {
      setHasToken(true);
    }

    const dismissed = sessionStorage.getItem('mdf_enable_push_banner_dismissed');
    if (dismissed === 'true') {
      setBannerDismissed(true);
    }
  }, []);

  const isIOS = isIOSSafari();
  const isPWA = isStandalonePWA();

  // If already granted and token exists, don't show the intrusive banner
  if (permission === 'granted' && hasToken) {
    return null;
  }

  // If user dismissed in this session
  if (bannerDismissed) {
    return null;
  }

  const handleEnableNotifications = async () => {
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await initPushNotifications();
      setPermission(res.permission);

      if (res.token) {
        setHasToken(true);
        if (currentUser?.employeeId) {
          await registerStaffDeviceToken(currentUser.employeeId, res.token, {
            name: currentUser.displayName,
            role: currentUser.role,
            department: currentUser.department,
            platform: res.platform,
            deviceName: res.deviceName,
            isNative: CapacitorNativeService.isNative(),
            appVersion: '2.5.0'
          });
        }
      }

      if (res.success && res.permission === 'granted') {
        setStatusMsg({
          text: isEn ? 'Notifications activated successfully!' : 'تم تفعيل الإشعارات السحابية بنجاح على هذا الجهاز!',
          isError: false
        });
        setTimeout(() => {
          setBannerDismissed(true);
        }, 3000);
      } else if (res.error) {
        setStatusMsg({
          text: res.error,
          isError: true
        });
      }
    } catch (err: any) {
      setStatusMsg({
        text: err?.message || (isEn ? 'Failed to enable notifications.' : 'حدث خطأ أثناء طلب تفعيل الإشعارات.'),
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setBannerDismissed(true);
    sessionStorage.setItem('mdf_enable_push_banner_dismissed', 'true');
  };

  return (
    <div 
      className="bg-gradient-to-r from-[#1E1113] via-[#1A1A1A] to-[#141414] border border-[#D2122E]/40 rounded-2xl p-4 mb-5 shadow-xl shadow-red-950/20 text-white animate-in fade-in slide-in-from-top-3 duration-300"
      dir={isEn ? 'ltr' : 'rtl'}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Side: Info */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D2122E]/20 border border-[#D2122E]/40 text-[#D2122E] flex items-center justify-center shrink-0 shadow-md">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-2">
                <span>{isEn ? 'Push Notifications (FCM)' : 'تفعيل إشعارات الدفع الفورية (FCM)'}</span>
                <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 font-mono px-2 py-0.5 rounded-full">
                  PWA • iPhone & Android
                </span>
              </h4>
            </div>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              {isEn 
                ? 'Enable push notifications to receive immediate emergency POS alerts even when the browser or app is closed.' 
                : 'قم بتفعيل الإشعارات لتصلك تنبيهات بلاغات الكاشير والطوارئ فوراً مع الصوت والاهتزاز حتى أثناء إغلاق المتصفح أو التطبيق.'}
            </p>

            {statusMsg && (
              <div className={`mt-2 text-xs font-bold flex items-center gap-1.5 ${statusMsg.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                {statusMsg.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          {permission === 'denied' ? (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-xl text-xs text-red-300 font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{isEn ? 'Permission Blocked in Browser Settings' : 'الإذن مرفوض في إعدادات الموقع بالمتصفح'}</span>
            </div>
          ) : (
            <button
              type="button"
              id="btn-enable-notifications-banner"
              onClick={handleEnableNotifications}
              disabled={loading}
              className="px-5 py-2.5 bg-[#D2122E] hover:bg-[#b00e25] text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-red-950/40 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              <span>{isEn ? 'Enable Notifications' : 'Enable Notifications (تفعيل الإشعارات)'}</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all whitespace-nowrap border border-white/5"
            >
              {isEn ? 'Settings' : 'الإعدادات'}
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            title={isEn ? 'Dismiss' : 'إخفاء'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
