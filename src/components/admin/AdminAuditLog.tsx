import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  UserCheck, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  Megaphone, 
  Sliders, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Download
} from 'lucide-react';
import { AuditLogEntry } from '../../types';
import { AppLanguage, translations } from '../../lib/i18n';

interface AdminAuditLogProps {
  logs: AuditLogEntry[];
  lang: AppLanguage;
}

export const AdminAuditLog: React.FC<AdminAuditLogProps> = ({ logs, lang }) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.target || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const handleExportLogs = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Target', 'Details'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.actor}"`,
      `"${l.action}"`,
      `"${l.target || ''}"`,
      `"${l.details || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MDF_Executive_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header Banner */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <span>{lang === 'ar' ? 'سجل العمليات والرقابة الإدارية (Audit Log)' : 'Executive Audit & Operations Log'}</span>
            </h2>
            <p className="text-xs text-gray-400">
              {lang === 'ar' 
                ? 'تتبع غير قابل للتعديل لجميع التغييرات الإدارية، إضافة الموظفين، تفويضات VOID، والبث المباشر.' 
                : 'Immutable audit trail of all management actions, staff updates, VOID approvals, and system broadcasts.'}
            </p>
          </div>

          <button
            onClick={handleExportLogs}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 flex items-center gap-2 transition-all shadow"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ar' ? 'تصدير السجل' : 'Export Logs'}</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute inset-y-0 right-3 my-auto text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث في سجل العمليات...' : 'Search logs...'}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">{lang === 'ar' ? 'جميع أنواع العمليات' : 'All Action Types'}</option>
            <option value="STAFF_ADDED">STAFF_ADDED (إضافة موظف)</option>
            <option value="STAFF_UPDATED">STAFF_UPDATED (تعديل موظف)</option>
            <option value="STAFF_DELETED">STAFF_DELETED (حذف موظف)</option>
            <option value="DEVICE_ADDED">DEVICE_ADDED (إضافة جهاز)</option>
            <option value="VOID_RESOLVED">VOID_RESOLVED (حل تفويض)</option>
            <option value="BROADCAST_SENT">BROADCAST_SENT (بث إعلان)</option>
            <option value="SETTINGS_UPDATED">SETTINGS_UPDATED (تعديل إعدادات)</option>
          </select>
        </div>
      </div>

      {/* Logs Timeline / Table */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#1C1C1C] text-gray-400 uppercase font-mono border-b border-white/5">
              <tr>
                <th className="p-4">{lang === 'ar' ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                <th className="p-4">{lang === 'ar' ? 'المنفذ (المسؤول)' : 'Actor'}</th>
                <th className="p-4">{lang === 'ar' ? 'نوع العملية' : 'Action Type'}</th>
                <th className="p-4">{lang === 'ar' ? 'الهدف / الكاشير' : 'Target Entity'}</th>
                <th className="p-4">{lang === 'ar' ? 'تفاصيل التغيير' : 'Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-gray-400">
                    {log.timestamp}
                  </td>
                  <td className="p-4 font-bold text-white">
                    <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {log.actor}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-amber-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-emerald-400">
                    {log.target || '-'}
                  </td>
                  <td className="p-4 text-gray-300 max-w-sm truncate">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
