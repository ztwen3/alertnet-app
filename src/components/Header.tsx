import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  LogOut, 
  ShieldCheck, 
  Radio,
  Users,
  Languages,
  FileText
} from 'lucide-react';
import { AuthUser } from '../types';
import { translations, AppLanguage } from '../lib/i18n';
import { MDFLogo } from './MDFLogo';

interface HeaderProps {
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  unreadCount: number;
  audioMuted: boolean;
  onToggleMute: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  lang: AppLanguage;
  onToggleLang: () => void;
  onlineUsersCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenLogin,
  onLogout,
  unreadCount,
  audioMuted,
  onToggleMute,
  activeTab,
  setActiveTab,
  lang,
  onToggleLang,
  onlineUsersCount,
}) => {
  const t = translations[lang];
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  const isSuperAdmin = currentUser?.displayName.toLowerCase() === 'zico' || 
                       currentUser?.employeeId.toLowerCase() === 'zico' || 
                       currentUser?.role === 'Admin';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString(lang === 'ar' ? 'ar-OM' : 'en-GB', { hour12: false }));
      setDateStr(now.toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  return (
    <header className="bg-[#0F0F0F] border-b border-white/5 text-white sticky top-0 z-50 shadow-2xl" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Banner Status Bar */}
      <div className="bg-[#141414] px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between text-xs border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-semibold text-green-500 uppercase tracking-widest">{t.systemOnline}</span>
          </div>
          <span className="text-gray-500 hidden sm:inline">•</span>
          <span className="text-gray-400 hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px]">
            <Radio className="w-3.5 h-3.5 text-[#D2122E] animate-pulse" />
            <span>{t.gatewayStatus}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          
          {/* Language Switch */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-gray-300 hover:text-white transition-all shadow-sm"
            title={lang === 'ar' ? "Switch to English" : "التحويل إلى العربية"}
          >
            <Languages className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>{t.switchLanguage}</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition-all ${
              audioMuted 
                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            {audioMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-[#D2122E]" />
                <span>{t.audioMuted}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-green-400" />
                <span>{t.audioActive}</span>
              </>
            )}
          </button>

          <div className="text-right hidden sm:block font-mono">
            <div className="text-xs font-bold leading-none">{timeStr || '14:32:05'}</div>
            <div className="text-[9px] text-gray-500 uppercase mt-0.5">{dateStr}</div>
          </div>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <MDFLogo className="h-11 sm:h-12" lang={lang} />
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#161616] p-1.5 rounded-2xl border border-white/5">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#D2122E] text-white shadow-lg font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.dashboard}
          </button>

          {/* Live Alerts Tab shown for Admin only */}
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('alerts')}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'alerts'
                  ? 'bg-[#D2122E] text-white shadow-lg font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{t.liveAlerts}</span>
              {unreadCount > 0 && (
                <span className="bg-white text-[#D2122E] text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse shadow">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Who is Online */}
          <button
            onClick={() => setActiveTab('who_is_online')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'who_is_online'
                ? 'bg-[#D2122E] text-white shadow-lg font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-green-400" />
            <span>{t.whoIsOnline}</span>
            {onlineUsersCount > 0 && (
              <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-green-500/30">
                {onlineUsersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-[#D2122E] text-white shadow-lg font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.history}
          </button>

          {/* Reports Engine Tab (التقارير) */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-[#D2122E] text-white shadow-lg font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.reports}</span>
          </button>

          {/* Sound & Notification Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-[#D2122E] text-white shadow-lg font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.soundSettings}</span>
          </button>

          {/* Admin Panel Tab (Visible only to Admin / zico) */}
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-[#D2122E] text-white shadow-lg font-bold'
                  : 'text-yellow-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
              <span>{t.adminPanel}</span>
            </button>
          )}
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-3 bg-[#161616] border border-white/5 px-3 py-1.5 rounded-2xl shadow-md">
              {/* Green Oval Badge with Full Name (e.g. زكريا) */}
              <div className="px-3.5 py-1 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300 flex items-center justify-center text-xs font-black shadow-[0_0_12px_rgba(16,185,129,0.3)] tracking-wide">
                <span>{currentUser.displayName}</span>
              </div>

              <div className="text-right hidden sm:block" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className="text-[10px] text-gray-400 font-mono leading-tight flex items-center gap-1.5">
                  <span>{currentUser.department || (lang === 'ar' ? 'صالة السوق الحرة' : 'Duty Free Floor')}</span>
                  {currentUser.employeeId && (
                    <span className="text-[9px] bg-[#D2122E]/20 text-[#D2122E] px-1.5 py-0.2 rounded font-mono font-bold">
                      {currentUser.employeeId}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-gray-400 hover:text-[#D2122E] hover:bg-white/5 rounded-lg transition-colors"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 bg-[#D2122E] hover:bg-[#b00e25] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition-all"
            >
              <span>{t.loginBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-[#161616] border-t border-white/5 py-2 px-1 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2.5 py-1.5 rounded-lg ${activeTab === 'dashboard' ? 'bg-[#D2122E] text-white font-bold' : 'text-gray-400'}`}
        >
          {t.dashboard}
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative px-2.5 py-1.5 rounded-lg ${activeTab === 'alerts' ? 'bg-[#D2122E] text-white font-bold' : 'text-gray-400'}`}
          >
            {t.liveAlerts}
            {unreadCount > 0 && (
              <span className="ml-1 bg-white text-[#D2122E] text-[10px] font-extrabold px-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('who_is_online')}
          className={`px-2.5 py-1.5 rounded-lg ${activeTab === 'who_is_online' ? 'bg-[#D2122E] text-white font-bold' : 'text-gray-400'}`}
        >
          {t.whoIsOnline}
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-2.5 py-1.5 rounded-lg ${activeTab === 'reports' ? 'bg-[#D2122E] text-white font-bold' : 'text-gray-400'}`}
        >
          {t.reports}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-2.5 py-1.5 rounded-lg ${activeTab === 'settings' ? 'bg-[#D2122E] text-white font-bold' : 'text-gray-400'}`}
        >
          {t.soundSettings}
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-2.5 py-1.5 rounded-lg ${activeTab === 'admin' ? 'bg-[#D2122E] text-white font-bold' : 'text-gray-400'}`}
          >
            {t.adminPanel}
          </button>
        )}
      </div>
    </header>
  );
};
