import React from 'react';
import { 
  Bell, 
  Wifi, 
  Clock, 
  HelpCircle, 
  Zap, 
  ArrowRight,
  Volume2,
  Users,
  CheckCircle2,
  CheckSquare,
  ShieldCheck
} from 'lucide-react';
import { Alert, ESP32Device, AlertStatus, AuthUser } from '../types';
import { translations, AppLanguage, formatAlertTitle, formatAlertMessage } from '../lib/i18n';
import { ResponseTimer } from './ResponseTimer';

interface DashboardProps {
  alerts: Alert[];
  devices: ESP32Device[];
  onSelectTab: (tab: string) => void;
  onUpdateStatus: (alertId: string, status: AlertStatus) => void;
  onPlaySound: (type: 'customer_assistance' | 'it_support') => void;
  staffName: string;
  currentUser?: AuthUser | null;
  lang?: AppLanguage;
  onlineStaff: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  alerts,
  devices,
  onSelectTab,
  onUpdateStatus,
  onPlaySound,
  staffName,
  currentUser,
  lang = 'ar',
  onlineStaff
}) => {
  const t = translations[lang];

  // Active / pending alerts (New and Seen), sorted newest first
  const activeAlerts = alerts
    .filter(a => a.status === 'New' || a.status === 'Seen')
    .sort((a, b) => b.createdAt - a.createdAt);

  const newAlertsCount = alerts.filter(a => a.status === 'New').length;
  const customerAlertsCount = alerts.filter(a => a.type === 'customer_assistance').length;
  const itAlertsCount = alerts.filter(a => a.type === 'it_support').length;
  const onlineDevicesCount = devices.filter(d => d.status === 'Online').length;

  return (
    <div className="space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Section (8 Cols): Live Alerts on Top */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Active Alerts Stack (Prepends newest alerts seamlessly on top) */}
          {activeAlerts.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D2122E] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D2122E]"></span>
                  </span>
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    {lang === 'ar' ? 'البلاغات النشطة الفورية' : 'Active Live Alerts'} ({activeAlerts.length})
                  </h2>
                </div>

                <button
                  onClick={() => onSelectTab('alerts')}
                  className="text-xs text-[#D2122E] hover:underline font-bold"
                >
                  {t.liveAlerts}
                </button>
              </div>

              {activeAlerts.map((alert, index) => {
                const isNew = alert.status === 'New';
                const isIT = alert.type === 'it_support';
                const attendingStaff = alert.viewedBy || alert.responder;

                const isAdmin = currentUser?.role === 'Admin' || 
                                (staffName && staffName.toLowerCase().includes('zico')) || 
                                (currentUser?.displayName && currentUser.displayName.toLowerCase().includes('zico')) ||
                                (currentUser?.employeeId && currentUser.employeeId.toLowerCase().includes('zico'));

                const isAttendingResponder = Boolean(
                  attendingStaff && (
                    attendingStaff.trim().toLowerCase() === (staffName || '').trim().toLowerCase() ||
                    attendingStaff.trim().toLowerCase() === (currentUser?.displayName || '').trim().toLowerCase() ||
                    attendingStaff.trim().toLowerCase() === (currentUser?.employeeId || '').trim().toLowerCase()
                  )
                );

                const canResolve = isAdmin || isAttendingResponder;

                return (
                  <div
                    key={alert.id}
                    className={`p-6 rounded-3xl relative overflow-hidden shadow-2xl border transition-all duration-300 ${
                      index === 0
                        ? 'bg-gradient-to-br from-[#D2122E] to-[#8C0C1E] border-white/10 ring-2 ring-[#D2122E]/40'
                        : 'bg-[#181818] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Badge Header */}
                    <div className="flex justify-between items-start relative z-10 mb-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#D2122E] text-[10px] font-black uppercase tracking-wider rounded-lg shadow">
                        {isNew ? (
                          <>
                            <Bell className="w-3 h-3 animate-bounce" />
                            <span>{t.criticalAlert}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>{t.statusSeen}</span>
                          </>
                        )}
                      </div>
                      <span className="text-white/80 text-xs font-mono tracking-wider">
                        {t.nodeId}: {alert.deviceId || alert.location}
                      </span>
                    </div>

                    {/* Huge Prominent Location & Device ID Box with Live Response Timer */}
                    <div className="relative z-10 bg-black/40 border-2 border-amber-400/40 rounded-2xl p-4 sm:p-5 my-2 shadow-inner text-center">
                      <div className="text-xs uppercase tracking-widest text-amber-200/90 font-bold mb-1">
                        {lang === 'ar' ? '📍 موقع البلاغ ورقم الكاشير' : '📍 ALERT LOCATION & POS NUMBER'}
                      </div>
                      <div className="text-3xl sm:text-4xl md:text-5xl font-black text-amber-300 font-mono tracking-wider drop-shadow-md py-1">
                        {alert.location || alert.deviceId}
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                        {alert.deviceId && alert.location && alert.deviceId !== alert.location && (
                          <div className="px-3 py-1 bg-white/10 rounded-xl text-xs font-mono text-white/90 border border-white/10">
                            {t.nodeId}: {alert.deviceId}
                          </div>
                        )}
                        {/* Stopwatch Live Timer calculating response duration until resolution */}
                        <ResponseTimer alert={alert} size="md" showLabel={true} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 space-y-2 mt-2">
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                        {formatAlertTitle(alert, lang)}
                      </h3>
                      <p className="text-white/95 text-sm sm:text-base font-medium">
                        {formatAlertMessage(alert, lang)}
                      </p>
                      
                      {/* Attending Responder Notice */}
                      {alert.status === 'Seen' && attendingStaff && (
                        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-sm font-bold text-emerald-200 flex items-center gap-2 shadow-lg animate-pulse">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span>{t.goingToResolve(attendingStaff)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-white/80 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-white/90" />
                          {alert.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons with Interactive Green Button & Animation */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-3 pt-4 relative z-10">
                      {isNew ? (
                        <button
                          onClick={() => onUpdateStatus(alert.id, 'Seen')}
                          className="w-full bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-400 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-950/60 transition-all duration-300 text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 transform hover:scale-[1.02] active:scale-95 border border-emerald-400/40 relative overflow-hidden group cursor-pointer"
                        >
                          <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                          <span className="relative z-10">
                            {lang === 'ar' ? `(${staffName}) ذاهب لحل المشكلة` : `${staffName} ${t.acknowledgeBtn}`}
                          </span>
                        </button>
                      ) : canResolve ? (
                        <button
                          onClick={() => onUpdateStatus(alert.id, 'Completed')}
                          className="w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:via-emerald-400 hover:to-cyan-400 text-black font-black py-4 px-6 rounded-2xl shadow-xl shadow-teal-950/60 transition-all duration-300 text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 transform hover:scale-[1.02] active:scale-95 border border-teal-300/50 cursor-pointer"
                        >
                          <CheckSquare className="w-5 h-5 text-black" />
                          <span>{t.resolveBtn}</span>
                        </button>
                      ) : (
                        <div
                          className="w-full bg-white/5 border border-white/10 text-gray-400 font-bold py-3.5 px-6 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>{lang === 'ar' ? `المخول بالحل: (${attendingStaff || 'المستلم'}) أو المشرف` : `Restricted to ${attendingStaff || 'Responder'} or Admin`}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* No Alerts State: Displayed when all issues are solved / zero pending alerts */
            <div className="bg-[#141414] border border-white/5 rounded-3xl p-10 text-center space-y-3 shadow-xl">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white tracking-wide">
                {t.noAlertsTitle}
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                {t.noAlertsDesc}
              </p>
            </div>
          )}

          {/* Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#141414] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D2122E]/20 flex items-center justify-center text-[#D2122E]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold">{newAlertsCount}</div>
                <div className="text-[10px] text-gray-400 uppercase font-mono">{t.newAlerts}</div>
              </div>
            </div>

            <div className="bg-[#141414] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold">{customerAlertsCount}</div>
                <div className="text-[10px] text-gray-400 uppercase font-mono">{t.customerAssistance}</div>
              </div>
            </div>

            <div className="bg-[#141414] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold">{itAlertsCount}</div>
                <div className="text-[10px] text-gray-400 uppercase font-mono">{t.itSupport}</div>
              </div>
            </div>

            <div className="bg-[#141414] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold">{onlineDevicesCount}</div>
                <div className="text-[10px] text-gray-400 uppercase font-mono">{t.nodesOnline}</div>
              </div>
            </div>
          </div>

        </section>

        {/* Sidebar Panel (4 Cols): Online Staff */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Active Staff Card */}
          <div className="bg-[#141414] rounded-3xl p-6 border border-white/5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-green-400" />
                <span>{t.onlineStaff}</span>
              </h3>
              <button
                onClick={() => onSelectTab('who_is_online')}
                className="text-[11px] text-[#D2122E] font-bold hover:underline"
              >
                {t.whoIsOnline}
              </button>
            </div>
            
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {onlineStaff.map((st) => (
                <div key={st.uid || st.employeeId} className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1A1A] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-400">
                      {st.displayName ? st.displayName.charAt(0) : 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{st.displayName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{st.employeeId} • {st.department || 'صالة السوق الحرة'}</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
              ))}
            </div>
          </div>

        </aside>

      </div>

    </div>
  );
};
