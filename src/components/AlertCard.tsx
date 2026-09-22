import React, { useLayoutEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Radio, 
  Volume2, 
  User, 
  CheckSquare, 
  AlertOctagon, 
  HelpCircle,
  ArrowRight,
  Lock
} from 'lucide-react';
import { Alert, AlertStatus, AuthUser } from '../types';
import { translations, AppLanguage, formatAlertTitle, formatAlertMessage } from '../lib/i18n';
import { ResponseTimer } from './ResponseTimer';

interface AlertCardProps {
  alert: Alert;
  onUpdateStatus: (alertId: string, status: AlertStatus, notes?: string) => void;
  onPlaySound: (type: 'customer_assistance' | 'it_support') => void;
  staffName: string;
  currentUser?: AuthUser | null;
  lang?: AppLanguage;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onUpdateStatus,
  onPlaySound,
  staffName,
  currentUser,
  lang = 'ar',
}) => {
  const t = translations[lang];

  const isIT = alert.type === 'it_support';
  const isNew = alert.status === 'New';
  const isSeen = alert.status === 'Seen';
  const isCompleted = alert.status === 'Completed';

  useLayoutEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__alertReceivedTimestamps) {
      const receivedTime = (window as any).__alertReceivedTimestamps[alert.id];
      if (receivedTime) {
        const diffMs = Date.now() - receivedTime;
        console.log(`⏱️ Latency (AlertCard [${alert.id}]): ${diffMs}ms`);
      }
    }
  }, [alert.id, alert.status]);

  const attendingStaff = alert.viewedBy || alert.responder;

  // Permissions: Only Admin or the designated attending responder can resolve
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
      className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 shadow-lg bg-[#141414] ${
        isNew
          ? 'border-[#D2122E] ring-1 ring-[#D2122E]/40'
          : isSeen
          ? 'border-blue-500/40'
          : 'border-white/5 opacity-80'
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left / Info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 ${
            isCompleted 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : isIT 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'bg-[#D2122E]/20 text-[#D2122E]'
          }`}>
            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isIT ? <AlertOctagon className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-extrabold text-white">{formatAlertTitle(alert, lang)}</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isNew
                  ? 'bg-red-500/15 text-[#D2122E] border border-red-500/30'
                  : isSeen
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {isNew ? t.statusNew : isSeen ? t.statusSeen : t.statusCompleted}
              </span>
            </div>

            <p className="text-xs text-white font-medium">{formatAlertMessage(alert, lang)}</p>

            {/* Prominent Location Box & Live Response Timer */}
            <div className="flex flex-wrap items-center gap-2 my-1.5">
              <div className="p-2 px-3 bg-black/40 border border-amber-400/40 rounded-xl inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-sm sm:text-base font-black text-amber-300 font-mono tracking-wide">
                  {alert.location || alert.deviceId}
                </span>
                {alert.deviceId && alert.deviceId !== alert.location && (
                  <span className="text-[10px] text-gray-400 font-mono border-l border-white/20 pl-2">
                    {alert.deviceId}
                  </span>
                )}
              </div>

              {/* Live Stopwatch Response Timer beside POS Device */}
              <ResponseTimer alert={alert} size="md" showLabel={true} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 font-mono pt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-500" />
                {alert.timestamp}
              </span>
            </div>

            {/* Responder note */}
            {isSeen && attendingStaff && (
              <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pt-1 bg-emerald-950/40 p-1.5 px-2.5 rounded-lg border border-emerald-500/30">
                <User className="w-3.5 h-3.5" />
                <span>{t.goingToResolve(attendingStaff)}</span>
              </div>
            )}
            {isCompleted && alert.completedBy && (
              <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pt-1 bg-emerald-950/40 p-1.5 px-2.5 rounded-lg border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.problemResolvedBy(alert.completedBy)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right / Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => onPlaySound(isIT ? 'it_support' : 'customer_assistance')}
            className="p-2.5 bg-[#1A1A1A] hover:bg-white/10 text-gray-300 rounded-xl border border-white/5 transition-colors"
            title={t.replaySound}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {!isCompleted && (
            <>
              {isNew ? (
                <button
                  onClick={() => onUpdateStatus(alert.id, 'Seen')}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95 border border-emerald-400/40 animate-pulse"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{lang === 'ar' ? `(${staffName}) ذاهب للحل` : `${staffName} Attend`}</span>
                </button>
              ) : canResolve ? (
                <button
                  onClick={() => onUpdateStatus(alert.id, 'Completed')}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:via-emerald-400 hover:to-cyan-400 text-black font-black text-xs rounded-xl shadow-lg shadow-teal-950/60 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95 border border-teal-300/50 cursor-pointer"
                  title={lang === 'ar' ? 'تأكيد معالجة وحل البلاغ' : 'Confirm problem resolved'}
                >
                  <CheckSquare className="w-4 h-4 text-black" />
                  <span>{t.resolveBtn}</span>
                </button>
              ) : (
                <div 
                  className="px-3.5 py-2 bg-white/5 border border-white/10 text-gray-400 font-bold text-[11px] rounded-xl flex items-center gap-1.5 cursor-not-allowed opacity-75"
                  title={lang === 'ar' ? `المخول بالحل: ${attendingStaff || 'المستلم'} أو المشرف فقط` : `Only ${attendingStaff || 'responder'} or Admin can resolve`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'ar' ? `خاص بـ (${attendingStaff || 'المستلم'})` : `For ${attendingStaff || 'Responder'}`}</span>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
