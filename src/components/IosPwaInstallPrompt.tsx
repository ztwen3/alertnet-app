import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, Bell, CheckCircle2, Smartphone, X, Sparkles, ArrowDown } from 'lucide-react';
import { isIOSSafari, isStandalonePWA } from '../lib/fcm';
import { AppLanguage } from '../lib/i18n';

interface IosPwaInstallPromptProps {
  lang?: AppLanguage;
  onDismiss?: () => void;
}

export const IosPwaInstallPrompt: React.FC<IosPwaInstallPromptProps> = ({
  lang = 'ar',
  onDismiss,
}) => {
  const isEn = lang === 'en';
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show if user is on iOS Safari AND NOT running as standalone PWA
    const isIOS = isIOSSafari();
    const isPWA = isStandalonePWA();
    
    // Check if dismissed recently in this session
    const isDismissed = sessionStorage.getItem('mdf_ios_pwa_dismissed');

    if (isIOS && !isPWA && !isDismissed) {
      setShowPrompt(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('mdf_ios_pwa_dismissed', 'true');
    if (onDismiss) onDismiss();
  };

  if (!showPrompt) return null;

  return (
    <div 
      className="bg-gradient-to-br from-[#1C1814] via-[#161616] to-[#121212] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-amber-950/30 text-white mb-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300"
      dir={isEn ? 'ltr' : 'rtl'}
    >
      {/* Top Banner Header */}
      <div className="flex items-start justify-between gap-3 border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {isEn ? 'iPhone & iPad Push Setup' : 'تفعيل إشعارات آيفون (iOS PWA)'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white mt-1">
              {isEn 
                ? 'To receive notifications on iPhone, first add this app to your Home Screen.'
                : 'لاستلام الإشعارات الفورية على آيفون، أضف التطبيق أولاً إلى الشاشة الرئيسية.'}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors"
          title={isEn ? 'Close' : 'إغلاق'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 6 Clear Steps List */}
      <div className="mt-4 space-y-3">
        <p className="text-xs text-gray-300 font-medium">
          {isEn 
            ? 'Apple requires web apps to be installed on your Home Screen to enable background push notifications:' 
            : 'تتطلب سياسة آبل في نظام iOS تثبيت التطبيق على الشاشة الرئيسية لتفعيل إشعارات الدفع الفورية في الخلفية:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          
          {/* Step 1 */}
          <div className="bg-[#1F1F1F] p-3 rounded-2xl border border-white/5 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-white/10 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div className="text-xs">
              <span className="font-bold text-white block">
                {isEn ? 'Open in Safari' : 'افتح الرابط في متصفح Safari'}
              </span>
              <span className="text-[11px] text-gray-400">
                {isEn ? 'Ensure you are browsing in Safari' : 'تأكد من فتح الرابط داخل متصفح سفاري'}
              </span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#1F1F1F] p-3 rounded-2xl border border-amber-500/20 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div className="text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span>{isEn ? 'Tap Share' : 'اضغط زر المشاركة'}</span>
                <Share className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <span className="text-[11px] text-gray-400">
                {isEn ? 'Tap the share button in Safari bar' : 'الأيقونة المربعة في أسفل شريط سفاري'}
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#1F1F1F] p-3 rounded-2xl border border-amber-500/20 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div className="text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span>{isEn ? 'Add to Home Screen' : 'إضافة إلى الصفحة الرئيسية'}</span>
                <PlusSquare className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <span className="text-[11px] text-gray-400">
                {isEn ? 'Select "Add to Home Screen"' : 'اختر "إضافة إلى الشاشة الرئيسية"'}
              </span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-[#1F1F1F] p-3 rounded-2xl border border-white/5 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-white/10 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              4
            </div>
            <div className="text-xs">
              <span className="font-bold text-white block">
                {isEn ? 'Open from Home Screen' : 'افتح التطبيق من الشاشة الرئيسية'}
              </span>
              <span className="text-[11px] text-gray-400">
                {isEn ? 'Launch the installed PWA icon' : 'اضغط على أيقونة MDF Alert الجديدة'}
              </span>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-[#1F1F1F] p-3 rounded-2xl border border-red-500/20 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
              5
            </div>
            <div className="text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span>{isEn ? 'Tap Enable Notifications' : 'اضغط "تفعيل الإشعارات"'}</span>
                <Bell className="w-3.5 h-3.5 text-red-400" />
              </span>
              <span className="text-[11px] text-gray-400">
                {isEn ? 'Go to Settings -> Enable Notifications' : 'في تبويب الإعدادات داخل التطبيق'}
              </span>
            </div>
          </div>

          {/* Step 6 */}
          <div className="bg-[#1F1F1F] p-3 rounded-2xl border border-green-500/20 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
              6
            </div>
            <div className="text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span>{isEn ? 'Allow Notifications' : 'اختر السماح (Allow)'}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              </span>
              <span className="text-[11px] text-gray-400">
                {isEn ? 'Accept the iOS permission prompt' : 'امنح الإذن لتصلك تنبيهات الطوارئ'}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Footer quick action */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-gray-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{isEn ? 'Works 100% in Safari without Mac or Xcode!' : 'يعمل مباشرة بدون الحاجة لجهاز ماك أو حساب مطورين!'}</span>
        </span>

        <button
          type="button"
          onClick={handleDismiss}
          className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
        >
          {isEn ? 'Got it' : 'فهمت'}
        </button>
      </div>
    </div>
  );
};
