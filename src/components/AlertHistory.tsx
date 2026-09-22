import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertOctagon, 
  HelpCircle,
  MapPin,
  Radio
} from 'lucide-react';
import { Alert, AuthUser } from '../types';
import { translations, AppLanguage, formatAlertTitle, formatAlertMessage } from '../lib/i18n';
import { ResponseTimer } from './ResponseTimer';

interface AlertHistoryProps {
  alerts: Alert[];
  currentUser?: AuthUser | null;
  lang?: AppLanguage;
}

export const AlertHistory: React.FC<AlertHistoryProps> = ({ 
  alerts, 
  currentUser,
  lang = 'ar' 
}) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  const isSuperAdmin = currentUser?.role === 'Admin' || 
                       currentUser?.displayName?.toLowerCase() === 'zico' || 
                       currentUser?.employeeId?.toLowerCase() === 'zico';

  const filteredAlerts = alerts.filter((a) => {
    if (selectedStatus !== 'All' && a.status !== selectedStatus) return false;
    if (selectedType !== 'All' && a.type !== selectedType) return false;

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const matchText = (
        a.title.toLowerCase() +
        a.message.toLowerCase() +
        a.location.toLowerCase() +
        a.deviceId.toLowerCase() +
        (a.viewedBy || '').toLowerCase() +
        (a.completedBy || '').toLowerCase()
      );
      if (!matchText.includes(query)) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Type', 'Location', 'Device ID', 'Status', 'Timestamp', 'Message', 'Viewed By', 'Viewed At', 'Completed By', 'Completed At', 'Notes'];
    const rows = filteredAlerts.map(a => [
      a.id,
      `"${a.title}"`,
      a.type,
      `"${a.location}"`,
      `"${a.deviceId}"`,
      a.status,
      `"${a.timestamp}"`,
      `"${a.message.replace(/"/g, '""')}"`,
      `"${a.viewedBy || ''}"`,
      `"${a.viewedAt || ''}"`,
      `"${a.completedBy || ''}"`,
      `"${a.completedAt || ''}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `muscat_duty_free_alerts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header Bar */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D2122E]/20 text-[#D2122E] flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight uppercase">
              {t.history}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {lang === 'ar' 
                ? 'أرشيف كامل لجميع البلاغات المنفذة والمستجابة في صالات مطار مسقط الدولي'
                : 'Comprehensive audit trail for all emergency assistance requests'}
            </p>
          </div>
        </div>

        {/* Export CSV is strictly visible ONLY for Admin */}
        {isSuperAdmin && (
          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
          >
            <Download className="w-4 h-4 text-[#D2122E]" />
            <span>{lang === 'ar' ? 'تصدير التقرير (CSV)' : 'Export CSV'}</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث في السجل والموظفين والمواقع...' : 'Search logs, staff, or locations...'}
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D2122E]"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#1A1A1A] border border-white/10 text-xs text-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#D2122E]"
          >
            <option value="All">{lang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="New">{t.statusNew}</option>
            <option value="Seen">{t.statusSeen}</option>
            <option value="Completed">{t.statusCompleted}</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#1A1A1A] border border-white/10 text-xs text-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#D2122E]"
          >
            <option value="All">{lang === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
            <option value="customer_assistance">{t.customerAssistance}</option>
            <option value="it_support">{t.itSupport}</option>
          </select>
        </div>
      </div>

      {/* History Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const isIT = alert.type === 'it_support';
            const isCompleted = alert.status === 'Completed';

            return (
              <div 
                key={alert.id}
                className="bg-[#141414] border border-white/5 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/15 transition-all shadow-md"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 ${
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' : isIT ? 'bg-blue-500/20 text-blue-400' : 'bg-[#D2122E]/20 text-[#D2122E]'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isIT ? <AlertOctagon className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-white text-sm">{formatAlertTitle(alert, lang)}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        alert.status === 'New' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : alert.status === 'Seen' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {alert.status === 'New' ? t.statusNew : alert.status === 'Seen' ? t.statusSeen : t.statusCompleted}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 font-medium">{formatAlertMessage(alert, lang)}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 pt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        {alert.timestamp}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        {alert.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Radio className="w-3 h-3 text-gray-500" />
                        {alert.deviceId}
                      </span>
                      <span>•</span>
                      <ResponseTimer alert={alert} size="sm" showLabel={true} />
                    </div>
                  </div>
                </div>

                {/* Handled By Summary */}
                <div className="flex items-center gap-2 bg-[#1A1A1A] p-2.5 rounded-xl border border-white/5 text-xs shrink-0 self-start md:self-auto">
                  <User className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-gray-500">{lang === 'ar' ? 'تم الحل بواسطة' : 'Resolved By'}</div>
                    <div className="font-bold text-white text-xs">{alert.completedBy || alert.viewedBy || (lang === 'ar' ? 'غير مسجل' : 'N/A')}</div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-12 text-center text-gray-500 space-y-2">
            <History className="w-8 h-8 mx-auto text-gray-600" />
            <h3 className="text-sm font-bold text-gray-300">{lang === 'ar' ? 'لا توجد سجلات مطابقة للبحث' : 'No records found'}</h3>
          </div>
        )}
      </div>

    </div>
  );
};
