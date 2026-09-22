import React, { useState } from 'react';
import { Bell, Filter, CheckCircle2 } from 'lucide-react';
import { Alert, AlertStatus, AlertType, AuthUser } from '../types';
import { AlertCard } from './AlertCard';
import { translations, AppLanguage } from '../lib/i18n';

interface LiveAlertsProps {
  alerts: Alert[];
  onUpdateStatus: (alertId: string, status: AlertStatus, notes?: string) => void;
  onPlaySound: (type: AlertType) => void;
  staffName: string;
  currentUser?: AuthUser | null;
  lang?: AppLanguage;
}

export const LiveAlerts: React.FC<LiveAlertsProps> = ({
  alerts,
  onUpdateStatus,
  onPlaySound,
  staffName,
  currentUser,
  lang = 'ar',
}) => {
  const t = translations[lang];
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Sorted newest first
  const sortedAlerts = [...alerts].sort((a, b) => b.createdAt - a.createdAt);

  const filteredAlerts = sortedAlerts.filter((a) => {
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (typeFilter === 'customer' && a.type !== 'customer_assistance') return false;
    if (typeFilter === 'it' && a.type !== 'it_support') return false;
    return true;
  });

  const newCount = alerts.filter(a => a.status === 'New').length;

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header Bar */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D2122E]/20 text-[#D2122E] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight uppercase flex items-center gap-3">
              <span>{t.liveAlerts}</span>
              {newCount > 0 && (
                <span className="bg-[#D2122E] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                  {newCount} {t.statusNew}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {lang === 'ar' 
                ? 'بث مباشر للبلاغات والإشعارات الفورية لجميع موظفي صالات سوق مسقط الحرة'
                : 'Simultaneous push notification updates across all Muscat Duty Free staff devices'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141414] p-3 sm:p-4 rounded-2xl border border-white/5">
        
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1 ml-2">
            <Filter className="w-3.5 h-3.5 text-[#D2122E]" />
            <span>الحالة:</span>
          </span>

          {[
            { id: 'All', label: lang === 'ar' ? 'الكل' : 'All' },
            { id: 'New', label: t.statusNew },
            { id: 'Seen', label: t.statusSeen },
            { id: 'Completed', label: t.statusCompleted }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st.id
                  ? st.id === 'New' 
                    ? 'bg-[#D2122E] text-white shadow-lg'
                    : st.id === 'Seen'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : st.id === 'Completed'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-[#0A0A0A]'
                  : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {st.label} {st.id === 'New' && newCount > 0 ? `(${newCount})` : ''}
            </button>
          ))}
        </div>

        {/* Type Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              typeFilter === 'All' ? 'bg-white text-[#0A0A0A]' : 'bg-[#1A1A1A] text-gray-400 border border-white/5'
            }`}
          >
            {lang === 'ar' ? 'الكل' : 'All'} ({alerts.length})
          </button>

          <button
            onClick={() => setTypeFilter('customer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              typeFilter === 'customer' ? 'bg-amber-500 text-black' : 'bg-[#1A1A1A] text-amber-400 border border-white/5'
            }`}
          >
            {t.customerAssistance}
          </button>

          <button
            onClick={() => setTypeFilter('it')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              typeFilter === 'it' ? 'bg-blue-600 text-white' : 'bg-[#1A1A1A] text-blue-400 border border-white/5'
            }`}
          >
            {t.itSupport}
          </button>
        </div>

      </div>

      {/* Simplified Alert Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onUpdateStatus={onUpdateStatus}
              onPlaySound={onPlaySound}
              staffName={staffName}
              currentUser={currentUser}
              lang={lang}
            />
          ))
        ) : (
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">{t.noAlertsTitle}</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {t.noAlertsDesc}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
