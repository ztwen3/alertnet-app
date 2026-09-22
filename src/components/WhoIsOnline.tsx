import React, { useState } from 'react';
import { 
  Users, 
  Radio, 
  Wifi, 
  Search, 
  MapPin, 
  UserCheck,
  UserX,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { AuthUser, ESP32Device } from '../types';
import { translations, AppLanguage } from '../lib/i18n';

interface WhoIsOnlineProps {
  currentUser: AuthUser | null;
  onlineStaff: Array<{
    uid: string;
    displayName: string;
    employeeId: string;
    department: string;
    role: string;
    lastSeen: string;
    online: boolean;
  }>;
  devices: ESP32Device[];
  lang: AppLanguage;
  onKickUser?: (uidOrEmpId: string, name: string) => Promise<void>;
}

export const WhoIsOnline: React.FC<WhoIsOnlineProps> = ({
  currentUser,
  onlineStaff,
  devices,
  lang,
  onKickUser
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'staff' | 'devices'>('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmKickUid, setConfirmKickUid] = useState<string | null>(null);
  const [kickingUid, setKickingUid] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'Admin' || 
                  (currentUser?.displayName && currentUser.displayName.toLowerCase().includes('zico')) ||
                  (currentUser?.employeeId && currentUser.employeeId.toLowerCase().includes('zico'));

  // ONLY Show Active Connected Devices (Status === 'Online')
  const connectedOnlyDevices = devices.filter(d => d.status === 'Online');

  const filteredStaff = onlineStaff.filter(s => {
    const q = searchTerm.toLowerCase();
    return (s.displayName || '').toLowerCase().includes(q) || 
           (s.employeeId || '').toLowerCase().includes(q) || 
           (s.department || '').toLowerCase().includes(q);
  });

  const filteredDevices = connectedOnlyDevices.filter(d => {
    const q = searchTerm.toLowerCase();
    return (d.name || '').toLowerCase().includes(q) || 
           (d.location || '').toLowerCase().includes(q) || 
           (d.deviceId || '').toLowerCase().includes(q);
  });

  const handleKick = async (uidOrEmpId: string, name: string) => {
    if (!onKickUser) return;
    setKickingUid(uidOrEmpId);
    try {
      await onKickUser(uidOrEmpId, name);
      setConfirmKickUid(null);
    } catch (err) {
      console.error('Error kicking user:', err);
    } finally {
      setKickingUid(null);
    }
  };

  return (
    <div className="space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Banner Header */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/30 text-green-400 flex items-center justify-center shadow-lg shrink-0">
            <Wifi className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
              <span>{t.whoIsOnline}</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full border border-green-500/30 font-mono font-bold">
                {lang === 'ar' ? 'مباشر' : 'LIVE'}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {lang === 'ar' 
                ? 'عرض الموظفين المتصلين حالياً والأجهزة المتصلة النشطة في صالات السوق الحرة مسقط'
                : 'Real-time monitoring of on-duty staff members and connected active devices in Muscat Duty Free'}
            </p>
          </div>
        </div>

        {/* Tab Switcher: Staff vs Connected Devices */}
        <div className="flex items-center gap-1.5 bg-[#0C0C0C] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'staff'
                ? 'bg-[#D2122E] text-white shadow-lg shadow-red-950/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.onlineStaff} ({onlineStaff.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'devices'
                ? 'bg-[#D2122E] text-white shadow-lg shadow-red-950/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{t.onlineDevices} ({connectedOnlyDevices.length})</span>
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-[#161616] p-4 rounded-2xl border border-white/5 flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-500 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={lang === 'ar' ? 'بحث بالاسم، الرقم الوظيفي، أو موقع الجهاز...' : 'Search by name, employee ID, or device location...'}
          className="w-full bg-transparent text-xs text-white placeholder:text-gray-600 focus:outline-none"
        />
      </div>

      {/* TAB 1: Online Staff Members */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-400" />
              <span>{t.onlineStaff}</span>
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              {filteredStaff.length} {t.activeNow}
            </span>
          </div>

          {filteredStaff.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((st) => (
                <div
                  key={st.uid || st.employeeId}
                  className="bg-[#161616] border border-white/5 rounded-3xl p-5 shadow-lg flex items-center justify-between gap-4 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 group-hover:border-green-500/50 flex items-center justify-center text-white font-bold text-base relative shrink-0">
                      {st.displayName ? st.displayName.charAt(0) : 'U'}
                      <span className="w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#161616] absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                        <span>{st.displayName}</span>
                        {st.role === 'Admin' && (
                          <span className="text-[9px] bg-[#D2122E]/20 text-[#D2122E] px-1.5 py-0.2 rounded font-bold border border-[#D2122E]/30">
                            {lang === 'ar' ? 'مسؤول' : 'ADMIN'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span className="text-[#D2122E] font-bold">{st.employeeId}</span>
                        <span>•</span>
                        <span className="truncate">{st.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                        <span>{t.online}</span>
                      </span>
                      <div className="text-[10px] text-gray-500 font-mono mt-1">
                        {st.lastSeen || (lang === 'ar' ? 'الآن' : 'Now')}
                      </div>
                    </div>

                    {/* Admin Force Kick Action */}
                    {isAdmin && (st.uid !== currentUser?.uid && st.employeeId !== currentUser?.employeeId) && (
                      <div>
                        {confirmKickUid === (st.uid || st.employeeId) ? (
                          <div className="flex items-center gap-1.5 bg-red-950/80 p-1.5 rounded-xl border border-red-500/40">
                            <span className="text-[10px] text-red-300 font-bold">
                              {lang === 'ar' ? 'تأكيد الطرد؟' : 'Confirm kick?'}
                            </span>
                            <button
                              onClick={() => handleKick(st.uid || st.employeeId, st.displayName)}
                              disabled={kickingUid === (st.uid || st.employeeId)}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded-lg transition-all"
                            >
                              {kickingUid === (st.uid || st.employeeId) 
                                ? (lang === 'ar' ? 'جاري...' : '...') 
                                : (lang === 'ar' ? 'نعم، طرد' : 'Yes')}
                            </button>
                            <button
                              onClick={() => setConfirmKickUid(null)}
                              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-gray-300 text-[10px] rounded-lg transition-all"
                            >
                              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmKickUid(st.uid || st.employeeId)}
                            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-[10px] rounded-xl border border-red-500/20 transition-all flex items-center gap-1 cursor-pointer"
                            title={lang === 'ar' ? 'طرد من الجلسة المتصلة' : 'Kick online session'}
                          >
                            <UserX className="w-3 h-3" />
                            <span>{lang === 'ar' ? 'طرد المستخدم' : 'Kick User'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#161616] border border-white/5 rounded-3xl p-12 text-center text-gray-400 space-y-2">
              <Users className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-xs">{lang === 'ar' ? 'لا يوجد موظفون مسجلون حالياً' : 'No online staff members'}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ONLY Connected Devices */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-green-400" />
              <span>{t.onlineDevices} ({filteredDevices.length})</span>
            </h3>
            <span className="text-xs text-green-400 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>{lang === 'ar' ? 'أجهزة متصلة ونشطة فقط' : 'Active Connected Terminals'}</span>
            </span>
          </div>

          {filteredDevices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map((dev) => (
                <div
                  key={dev.id || dev.deviceId}
                  className="bg-[#161616] border border-white/5 rounded-3xl p-5 shadow-lg flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center font-bold text-sm shrink-0">
                      <Radio className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs truncate flex items-center gap-2">
                        <span>{dev.name}</span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 mt-1 font-mono">
                        <span className="flex items-center gap-1 text-white font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">
                          <MapPin className="w-3 h-3 text-[#D2122E]" />
                          {dev.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-bold border border-green-500/20 flex items-center gap-1 font-mono uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span>{t.online}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#161616] border border-white/5 rounded-3xl p-12 text-center text-gray-400 space-y-2">
              <Radio className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-xs">{lang === 'ar' ? 'لا توجد أجهزة متصلة حالياً' : 'No connected devices currently active'}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
