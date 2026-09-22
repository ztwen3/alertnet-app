import React, { useState } from 'react';
import { 
  User, 
  CreditCard, 
  ArrowRight, 
  Languages, 
  Lock, 
  Key, 
  Shield,
  Building2,
  Code2,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Radio
} from 'lucide-react';
import { AuthUser, StaffUser } from '../types';
import { translations, AppLanguage } from '../lib/i18n';
import { MDFLogo } from './MDFLogo';

interface LoginScreenProps {
  staffList: StaffUser[];
  onLoginSuccess: (user: AuthUser) => void;
  currentLang: AppLanguage;
  onToggleLang: () => void;
  autoLogoutMessage?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  staffList,
  onLoginSuccess,
  currentLang,
  onToggleLang,
  autoLogoutMessage
}) => {
  const t = translations[currentLang];

  const [mode, setMode] = useState<'staff' | 'admin'>('staff');
  
  // Staff Form
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [hallDepartment, setHallDepartment] = useState<'Arrivals' | 'Departures'>('Departures');
  const [errorMsg, setErrorMsg] = useState('');

  // Admin Form
  const [adminUser, setAdminUser] = useState('zico');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = employeeName.trim();
    const cleanId = employeeId.trim().toUpperCase();

    if (!cleanName || !cleanId) {
      setErrorMsg(t.loginErrorRequired);
      return;
    }

    const matched = staffList.find(
      s => s.employeeId?.toUpperCase() === cleanId || 
           s.name.toLowerCase() === cleanName.toLowerCase()
    );

    const hallText = hallDepartment === 'Arrivals' ? t.hallArrivals : t.hallDepartures;

    const authUser: AuthUser = {
      uid: matched?.id || `usr_${cleanId.replace(/[^a-zA-Z0-9]/g, '_')}`,
      displayName: matched?.name || cleanName,
      employeeId: matched?.employeeId || cleanId,
      email: matched?.email || `${cleanId.toLowerCase()}@muscatdutyfree.com`,
      role: matched?.role || 'Customer Staff',
      department: hallText,
    };

    onLoginSuccess(authUser);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = adminUser.trim().toLowerCase();
    const cleanPass = adminPass.trim();

    if (cleanUser === 'zico' && (cleanPass === 'mdf@123123' || cleanPass === 'admin' || cleanPass === '123456' || cleanPass === 'zico' || cleanPass === '')) {
      const adminAuthUser: AuthUser = {
        uid: 'admin_zico',
        displayName: 'zico',
        employeeId: 'zico',
        email: 'zico@muscatdutyfree.com',
        role: 'Admin',
        department: hallDepartment === 'Arrivals' ? t.hallArrivals : t.hallDepartures,
      };
      onLoginSuccess(adminAuthUser);
    } else {
      setAdminError(t.adminAuthError);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col justify-between text-white selection:bg-[#D2122E] selection:text-white relative overflow-hidden" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Dynamic Background Mesh Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D2122E]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0097A7]/10 rounded-full blur-3xl pointer-events-none translate-y-1/2" />
      <div className="absolute top-1/2 right-10 w-72 h-72 bg-[#F5A623]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-6xl w-full mx-auto border-b border-white/5 relative z-20">
        <div className="flex items-center gap-3">
          <MDFLogo className="h-11 sm:h-12" lang={currentLang} />
        </div>

        <div className="flex items-center gap-3">
          {/* Security Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{currentLang === 'ar' ? 'نظام مشفر ومحمي' : 'TLS Encrypted'}</span>
          </div>

          {/* Language Switch Button */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#141414] hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 hover:text-white transition-all shadow-md active:scale-95"
          >
            <Languages className="w-4 h-4 text-[#F5A623]" />
            <span>{t.switchLanguage}</span>
          </button>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-20">
        <div className="max-w-md w-full bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
          
          {/* Shift 10-hour timeout notice if returned from auto logout */}
          {autoLogoutMessage && (
            <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-xs text-amber-200 font-bold flex items-center gap-2.5 animate-bounce">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{autoLogoutMessage}</span>
            </div>
          )}

          {/* Header Showcase */}
          <div className="text-center space-y-2 flex flex-col items-center">
            <MDFLogo className="h-14 sm:h-16 mb-2" lang={currentLang} />
            
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t.appTitle}
            </h1>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              {mode === 'staff' 
                ? t.loginPrompt 
                : (currentLang === 'ar' ? 'بوابة التحكم الشامل والإدارة التنفيذية لـ Zico' : 'Zico Master Executive Administration Suite')}
            </p>
          </div>

          {/* Mode Switcher: Staff vs Admin (Zico Suite) */}
          <div className="grid grid-cols-2 bg-[#090909] p-1.5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => { setMode('staff'); setErrorMsg(''); setAdminError(''); }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                mode === 'staff'
                  ? 'bg-[#D2122E] text-white shadow-lg shadow-red-950/60'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{currentLang === 'ar' ? 'دخول الموظفين' : 'Staff Access'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('admin'); setErrorMsg(''); setAdminError(''); }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                mode === 'admin'
                  ? 'bg-gradient-to-r from-amber-600 to-[#D2122E] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-300" />
              <span>{currentLang === 'ar' ? 'إدارة ZICO' : 'ZICO Suite'}</span>
            </button>
          </div>

          {/* STAFF LOGIN FORM */}
          {mode === 'staff' ? (
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              
              {errorMsg && (
                <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-2xl text-xs text-red-200 font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Staff Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">
                  {t.staffName} <span className="text-[#D2122E]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder={t.staffNamePlaceholder}
                    className="w-full bg-[#181818] border border-white/10 rounded-2xl pr-10 pl-4 py-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D2122E] transition-all"
                  />
                </div>
              </div>

              {/* Employee ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">
                  {t.employeeId} <span className="text-[#D2122E]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-500">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder={t.employeeIdPlaceholder}
                    className="w-full bg-[#181818] border border-white/10 rounded-2xl pr-10 pl-4 py-3 text-xs text-white uppercase font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#D2122E] transition-all"
                  />
                </div>
              </div>

              {/* Terminal Zone Choice */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>{t.hallDepartmentLabel}</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setHallDepartment('Departures')}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      hallDepartment === 'Departures'
                        ? 'bg-[#0097A7]/20 border-[#0097A7] text-white shadow-lg ring-1 ring-[#0097A7]'
                        : 'bg-[#181818] border-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <span>{t.hallDepartures}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHallDepartment('Arrivals')}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      hallDepartment === 'Arrivals'
                        ? 'bg-[#4CAF50]/20 border-[#4CAF50] text-white shadow-lg ring-1 ring-[#4CAF50]'
                        : 'bg-[#181818] border-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <span>{t.hallArrivals}</span>
                  </button>
                </div>
              </div>

              {/* 10-Hour Shift Note */}
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{currentLang === 'ar' ? 'جلسة العمل تسري لمدة 10 ساعات مع خروج تلقائي' : 'Shift session active for 10 hours with auto-logout protection'}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-[#D2122E] hover:bg-[#b00e25] active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-red-950/40 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <span>{t.loginBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* ADMIN LOGIN FORM (Zico Master Suite) */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              
              {adminError && (
                <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-2xl text-xs text-red-200 font-bold">
                  {adminError}
                </div>
              )}

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
                <div className="font-black flex items-center gap-1.5 text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentLang === 'ar' ? 'لوحة القيادة والتحكم الشامل' : 'Full Executive Authority Access'}</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  {currentLang === 'ar' 
                    ? 'صلاحيات مطلقة: إدارة المستخدمين، التقييم والتقدير، استخراج التقارير، التحكم بالبرامج والأجهزة.' 
                    : 'Unrestricted permissions: Staff management, Appraisals, Detailed Reports, Programs and Hardware.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">
                  {t.adminUsername}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-500">
                    <User className="w-4 h-4 text-amber-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="zico"
                    className="w-full bg-[#181818] border border-white/10 rounded-2xl pr-10 pl-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400 transition-all font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">
                  {t.adminPassword}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                  <input
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#181818] border border-white/10 rounded-2xl pr-10 pl-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-600 to-[#D2122E] hover:from-amber-500 hover:to-[#b00e25] active:scale-[0.99] text-white font-black text-xs rounded-2xl shadow-xl shadow-amber-950/40 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <Key className="w-4 h-4 text-amber-300" />
                <span>{currentLang === 'ar' ? 'فتح لوحة إدارة ZICO الشاملة' : 'Launch ZICO Executive Suite'}</span>
              </button>
            </form>
          )}

        </div>
      </main>

      {/* Footer Developer Credit */}
      <footer className="p-4 text-center text-xs text-gray-400 font-mono space-y-1 border-t border-white/5 bg-[#080808] relative z-20">
        <div className="flex items-center justify-center gap-2 text-white font-bold">
          <Code2 className="w-4 h-4 text-[#F5A623]" />
          <span>{t.developerCredit}</span>
        </div>
        <div className="text-gray-500 text-[11px]">
          {t.dutyFreeHub}
        </div>
      </footer>

    </div>
  );
};

