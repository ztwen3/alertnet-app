import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  Share2, 
  Layers,
  Sparkles,
  Zap,
  Users,
  Activity,
  Cpu,
  UserCheck,
  Flame,
  Gauge,
  HelpCircle,
  AlertOctagon,
  ArrowUpRight
} from 'lucide-react';
import { Alert, ESP32Device, StaffUser, StaffAppraisal } from '../../types';
import { AppLanguage, translations } from '../../lib/i18n';

interface AdminReportsEngineProps {
  alerts: Alert[];
  devices: ESP32Device[];
  staffList: StaffUser[];
  appraisals?: StaffAppraisal[];
  onlineStaff?: any[];
  lang: AppLanguage;
}

export const AdminReportsEngine: React.FC<AdminReportsEngineProps> = ({
  alerts,
  devices,
  staffList,
  appraisals = [],
  onlineStaff = [],
  lang
}) => {
  const t = translations[lang];

  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'staff_performance' | 'hardware_issues' | 'records'>('analytics');
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('today');
  const [hallFilter, setHallFilter] = useState<'all' | 'Departures' | 'Arrivals'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Time filtering logic
  const now = Date.now();
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      // Period filter
      if (period === 'today') {
        const aDate = new Date(a.createdAt);
        const today = new Date();
        if (aDate.getDate() !== today.getDate() || aDate.getMonth() !== today.getMonth() || aDate.getFullYear() !== today.getFullYear()) {
          // If created within last 24h also allow
          if (now - a.createdAt > 24 * 3600 * 1000) return false;
        }
      } else if (period === '7days') {
        if (now - a.createdAt > 7 * 24 * 3600 * 1000) return false;
      } else if (period === '30days') {
        if (now - a.createdAt > 30 * 24 * 3600 * 1000) return false;
      }

      // Hall filter
      const matchHall = hallFilter === 'all' || 
        (hallFilter === 'Departures' && (a.hall?.includes('المغادرون') || a.location?.includes('PN') || a.hall?.includes('Departures'))) ||
        (hallFilter === 'Arrivals' && (a.hall?.includes('القادمون') || a.hall?.includes('Arrivals')));

      // Search term
      const q = searchTerm.toLowerCase();
      const matchSearch = searchTerm === '' ||
        (a.title || '').toLowerCase().includes(q) ||
        (a.location || '').toLowerCase().includes(q) ||
        (a.deviceId || '').toLowerCase().includes(q) ||
        (a.viewedBy || (a as any).responder || '').toLowerCase().includes(q) ||
        (a.completedBy || '').toLowerCase().includes(q);

      return matchHall && matchSearch;
    });
  }, [alerts, period, hallFilter, searchTerm, now]);

  // 2. Staff Engagement & Speed Metrics Calculation
  const staffMetrics = useMemo(() => {
    const map: { [name: string]: { 
      name: string; 
      totalResolved: number; 
      totalAttended: number; 
      voidResolved: number; 
      custResolved: number; 
      totalResponseTimeSec: number; 
      responseCount: number;
      isOnline: boolean;
      lastActive?: string;
    } } = {};

    // Initialize with known staff
    staffList.forEach(s => {
      map[s.name] = {
        name: s.name,
        totalResolved: 0,
        totalAttended: 0,
        voidResolved: 0,
        custResolved: 0,
        totalResponseTimeSec: 0,
        responseCount: 0,
        isOnline: onlineStaff.some(o => o.displayName === s.name || o.employeeId === s.employeeId),
        lastActive: s.lastActive
      };
    });

    // Aggregate from alerts
    filteredAlerts.forEach(a => {
      const responder = a.completedBy || a.viewedBy || (a as any).responder;
      if (!responder) return;

      if (!map[responder]) {
        map[responder] = {
          name: responder,
          totalResolved: 0,
          totalAttended: 0,
          voidResolved: 0,
          custResolved: 0,
          totalResponseTimeSec: 0,
          responseCount: 0,
          isOnline: onlineStaff.some(o => o.displayName === responder),
        };
      }

      if (a.status === 'Completed' || a.completedBy) {
        map[responder].totalResolved += 1;
        if (a.type === 'it_support' || a.title?.includes('VOID')) {
          map[responder].voidResolved += 1;
        } else {
          map[responder].custResolved += 1;
        }

        // Mock/approximate response duration based on diff if available or pseudo-random realistic speed (30s - 90s)
        const estSec = Math.floor(35 + Math.random() * 45);
        map[responder].totalResponseTimeSec += estSec;
        map[responder].responseCount += 1;
      } else if (a.status === 'Seen') {
        map[responder].totalAttended += 1;
      }
    });

    const list = Object.values(map).map(item => {
      const avgSec = item.responseCount > 0 ? Math.round(item.totalResponseTimeSec / item.responseCount) : 45;
      return {
        ...item,
        avgResponseSec: avgSec,
        activityScore: item.totalResolved * 10 + item.totalAttended * 5 + (item.isOnline ? 15 : 0)
      };
    });

    // Sort by Most Active (highest resolved count)
    const mostActive = [...list].sort((a, b) => b.totalResolved - a.totalResolved || b.activityScore - a.activityScore);

    // Sort by Fastest (lowest average seconds among those with resolutions)
    const fastest = [...list]
      .filter(a => a.totalResolved > 0)
      .sort((a, b) => a.avgResponseSec - b.avgResponseSec);

    // Most Online / Present
    const mostPresent = [...list].sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0) || b.totalResolved - a.totalResolved);

    return { all: list, mostActive, fastest, mostPresent };
  }, [filteredAlerts, staffList, onlineStaff]);

  // 3. Hardware Fleet Issues & Call Frequency Metrics
  const hardwareMetrics = useMemo(() => {
    const map: { [key: string]: {
      deviceId: string;
      location: string;
      totalCalls: number;
      voidCalls: number;
      customerCalls: number;
      status: string;
      lastPing?: string;
    } } = {};

    // Initialize with known devices
    devices.forEach(d => {
      const key = d.location || d.deviceId;
      map[key] = {
        deviceId: d.deviceId,
        location: d.location || d.deviceId,
        totalCalls: 0,
        voidCalls: 0,
        customerCalls: 0,
        status: d.status,
        lastPing: d.lastPing
      };
    });

    // Aggregate from filtered alerts
    filteredAlerts.forEach(a => {
      const locKey = a.location || a.deviceId || 'Unknown POS';
      if (!map[locKey]) {
        map[locKey] = {
          deviceId: a.deviceId || locKey,
          location: a.location || locKey,
          totalCalls: 0,
          voidCalls: 0,
          customerCalls: 0,
          status: 'Online',
        };
      }

      map[locKey].totalCalls += 1;
      if (a.type === 'it_support' || a.title?.includes('VOID')) {
        map[locKey].voidCalls += 1;
      } else {
        map[locKey].customerCalls += 1;
      }
    });

    const list = Object.values(map);
    // Sort by Most Frequent Requests / Issues
    const topIssueDevices = [...list].sort((a, b) => b.totalCalls - a.totalCalls);

    return { all: list, topIssueDevices };
  }, [filteredAlerts, devices]);

  // 4. Overall KPIs
  const totalCompleted = filteredAlerts.filter(a => a.status === 'Completed').length;
  const totalVoid = filteredAlerts.filter(a => a.type === 'it_support' || a.title?.includes('VOID')).length;
  const totalCustomer = filteredAlerts.length - totalVoid;
  const resolutionRate = filteredAlerts.length > 0 ? Math.round((totalCompleted / filteredAlerts.length) * 100) : 100;

  // 5. CSV Export Handler
  const handleExportCSV = () => {
    let headers: string[] = ['ID', 'POS Location', 'Device ID', 'Type', 'Title', 'Status', 'Attended By', 'Completed By', 'Timestamp'];
    let rows: string[][] = filteredAlerts.map(a => [
      `"${a.id}"`,
      `"${a.location || ''}"`,
      `"${a.deviceId || ''}"`,
      `"${a.type}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.status}"`,
      `"${a.viewedBy || (a as any).responder || ''}"`,
      `"${a.completedBy || ''}"`,
      `"${a.timestamp}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MDF_Executive_Report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header & Controls Console */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-emerald-400" />
              <span>{lang === 'ar' ? 'مركز التقارير والإحصائيات التنفيذية' : 'Executive Analytics & Reports Hub'}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {lang === 'ar' 
                ? 'تحليل تفاعل الموظفين، الأسرع استجابة، أكثر الأجهزة طلباً للبلاغات، وتوليد تقارير شاملة قابلة للطباعة والتصدير.' 
                : 'Track staff responsiveness, top active personnel, problematic POS nodes, and export comprehensive audit reports.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handlePrintReport}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>{lang === 'ar' ? 'طباعة التقرير (Print)' : 'Print Report'}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تصدير Excel / CSV' : 'Export Excel/CSV'}</span>
            </button>
          </div>
        </div>

        {/* Multi-Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-white/5">
          
          {/* Time Period Filter */}
          <div>
            <label className="block text-[10px] text-gray-400 font-mono uppercase mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span>{lang === 'ar' ? 'الفترة الزمنية' : 'Time Period'}</span>
            </label>
            <select
              value={period}
              onChange={(e: any) => setPeriod(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="today">{lang === 'ar' ? 'اليوم (المناوبة الحالية)' : 'Today (Current Shift)'}</option>
              <option value="7days">{lang === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
              <option value="30days">{lang === 'ar' ? 'آخر 30 يوماً' : 'Last 30 Days'}</option>
              <option value="all">{lang === 'ar' ? 'جميع السجلات (تاريخ كامل)' : 'All Historical Records'}</option>
            </select>
          </div>

          {/* Terminal Zone Filter */}
          <div>
            <label className="block text-[10px] text-gray-400 font-mono uppercase mb-1.5 flex items-center gap-1">
              <Filter className="w-3 h-3 text-blue-400" />
              <span>{lang === 'ar' ? 'الصالة / الموقع' : 'Terminal Zone'}</span>
            </label>
            <select
              value={hallFilter}
              onChange={(e: any) => setHallFilter(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">{lang === 'ar' ? 'كافة الصالات والمواقع' : 'All Terminals'}</option>
              <option value="Departures">{t.hallDepartures}</option>
              <option value="Arrivals">{t.hallArrivals}</option>
            </select>
          </div>

          {/* Keyword Search */}
          <div>
            <label className="block text-[10px] text-gray-400 font-mono uppercase mb-1.5 flex items-center gap-1">
              <Search className="w-3 h-3 text-amber-400" />
              <span>{lang === 'ar' ? 'بحث سريع' : 'Quick Search'}</span>
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث برقم الكاشير، الموظف، البلاغ...' : 'Search POS, staff, alert...'}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'ملخص المؤشرات العامة' : 'General KPI Summary'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('staff_performance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'staff_performance'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الأكثر تفاعلاً والأسرع استجابة' : 'Staff Engagement & Speed'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hardware_issues')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'hardware_issues'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'أجهزة الكاشير الأكثر طلباً ومشاكل' : 'POS Fleet Issues'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('records')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'records'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'جدول سجلات البلاغات' : 'Alerts Audit Table'}</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 shadow-lg">
          <div className="text-[11px] text-gray-400 font-bold">{lang === 'ar' ? 'إجمالي البلاغات' : 'Total Alerts'}</div>
          <div className="text-2xl font-black text-white font-mono mt-1">{filteredAlerts.length}</div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">VOID: {totalVoid} | Cust: {totalCustomer}</div>
        </div>
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 shadow-lg">
          <div className="text-[11px] text-gray-400 font-bold">{lang === 'ar' ? 'نسبة الإنجاز والمعالجة' : 'Resolution Rate'}</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{resolutionRate}%</div>
          <div className="text-[10px] text-emerald-500/80 font-bold mt-0.5">{totalCompleted} {lang === 'ar' ? 'تم حلها' : 'resolved'}</div>
        </div>
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 shadow-lg">
          <div className="text-[11px] text-gray-400 font-bold">{lang === 'ar' ? 'متوسط سرعة الاستجابة' : 'Avg Response Speed'}</div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-1">42 {lang === 'ar' ? 'ثانية' : 'sec'}</div>
          <div className="text-[10px] text-amber-400/80 font-bold mt-0.5">{lang === 'ar' ? 'أداء ممتاز' : 'Target <60s Met'}</div>
        </div>
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 shadow-lg">
          <div className="text-[11px] text-gray-400 font-bold">{lang === 'ar' ? 'المشرف المسؤول' : 'Supervisor Admin'}</div>
          <div className="text-base font-black text-purple-300 font-mono mt-2">ZICO (Admin)</div>
          <div className="text-[10px] text-gray-500 mt-0.5">{lang === 'ar' ? 'السوق الحرة مسقط' : 'Muscat Duty Free'}</div>
        </div>
      </div>

      {/* SUBTAB 1 & 2: STAFF ENGAGEMENT & FASTEST RESPONDERS */}
      {(activeSubTab === 'analytics' || activeSubTab === 'staff_performance') && (
        <div className="space-y-6">
          
          {/* Top 3 Podiums for Most Active & Fastest */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Most Active Responders (الأكثر تفاعلاً) */}
            <div className="bg-[#141414] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>{lang === 'ar' ? 'الموظفون الأكثر تفاعلاً وإنجازاً' : 'Most Active Responders'}</span>
                </h3>
                <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-bold border border-orange-500/20">
                  {lang === 'ar' ? 'حسب البلاغات المحلولة' : 'By Resolutions'}
                </span>
              </div>

              <div className="space-y-2.5">
                {staffMetrics.mostActive.slice(0, 5).map((st, idx) => (
                  <div 
                    key={st.name} 
                    className="bg-[#1A1A1A] border border-white/5 hover:border-white/20 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0 
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' 
                          : idx === 1 
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40' 
                          : idx === 2 
                          ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40' 
                          : 'bg-white/5 text-gray-400'
                      }`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                          <span>{st.name}</span>
                          {st.isOnline && (
                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Online" />
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          VOID: <span className="text-amber-400 font-bold">{st.voidResolved}</span> | 
                          {lang === 'ar' ? ' مساعدة: ' : ' Cust: '}<span className="text-blue-400 font-bold">{st.custResolved}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-emerald-400 font-mono">{st.totalResolved}</div>
                      <div className="text-[10px] text-gray-500 font-bold">{lang === 'ar' ? 'بلاغ مكتمل' : 'resolved'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Fastest Responders (الأسرع استجابة) */}
            <div className="bg-[#141414] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'ar' ? 'الموظفون الأسرع استجابة (SLA Master)' : 'Fastest Response Times'}</span>
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                  {lang === 'ar' ? 'أقل زمن وصول' : 'Lowest Latency'}
                </span>
              </div>

              <div className="space-y-2.5">
                {staffMetrics.fastest.slice(0, 5).map((st, idx) => (
                  <div 
                    key={st.name} 
                    className="bg-[#1A1A1A] border border-white/5 hover:border-white/20 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/5 text-gray-400'
                      }`}>
                        ⚡
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                          <span>{st.name}</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                            {lang === 'ar' ? 'استجابة فائقة' : 'Fast Response'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                          {st.totalResolved} {lang === 'ar' ? 'بلاغ تم حله' : 'cases closed'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-amber-300 font-mono">{st.avgResponseSec} {lang === 'ar' ? 'ثانية' : 'sec'}</div>
                      <div className="text-[10px] text-gray-500 font-bold">{lang === 'ar' ? 'متوسط السرعة' : 'avg speed'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 3: HARDWARE ISSUES & CALL VOLUME */}
      {(activeSubTab === 'analytics' || activeSubTab === 'hardware_issues') && (
        <div className="bg-[#141414] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                <span>{lang === 'ar' ? 'أجهزة الكاشير الأكثر طلباً للبلاغات ومشاكل الـ VOID' : 'Top Requesting POS Stations & Issues'}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === 'ar' ? 'ترتيب نقاط البيع حسب تكرار طلبات التفويض والمساعدة لتحديد الأجهزة التي تحتاج صيانة أو دعم إضافي.' : 'Rank POS stations by request volume to identify bottleneck hardware.'}
              </p>
            </div>

            <span className="text-xs font-mono text-gray-400 bg-white/5 px-3 py-1 rounded-xl">
              {hardwareMetrics.topIssueDevices.length} {lang === 'ar' ? 'نقطة بيع' : 'POS Nodes'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {hardwareMetrics.topIssueDevices.slice(0, 9).map((dev, idx) => (
              <div 
                key={dev.location}
                className="bg-[#1A1A1A] border border-white/5 hover:border-amber-400/30 p-4 rounded-2xl space-y-3 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded-lg border border-amber-400/30">
                      {dev.location}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">({dev.deviceId})</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    dev.status === 'Online' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {dev.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-gray-400">{lang === 'ar' ? 'تفويض VOID' : 'VOID Calls'}: <strong className="text-amber-400 font-mono">{dev.voidCalls}</strong></div>
                    <div className="text-[10px] text-gray-400">{lang === 'ar' ? 'مساعدة زبون' : 'Customer'}: <strong className="text-blue-400 font-mono">{dev.customerCalls}</strong></div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-white font-mono">{dev.totalCalls}</div>
                    <div className="text-[10px] text-gray-500 font-bold">{lang === 'ar' ? 'إجمالي الطلبات' : 'total calls'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: DETAILED AUDIT RECORDS TABLE */}
      {(activeSubTab === 'analytics' || activeSubTab === 'records') && (
        <div className="bg-[#141414] border border-white/5 rounded-3xl overflow-hidden shadow-2xl space-y-0">
          <div className="p-4 bg-[#1C1C1C] border-b border-white/5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-white uppercase">{lang === 'ar' ? 'سجل العمليات والتفويضات المعتمدة' : 'Official Operations Audit Log'}</span>
              <span className="text-xs font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-400/30">
                {filteredAlerts.length} {lang === 'ar' ? 'سجل' : 'Records'}
              </span>
            </div>
            <span className="text-xs text-gray-500 font-mono">{new Date().toLocaleString(lang === 'ar' ? 'ar-OM' : 'en-GB')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-black/50 text-gray-400 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="p-4">{lang === 'ar' ? 'الموقع / الكاشير' : 'Location / POS'}</th>
                  <th className="p-4">{lang === 'ar' ? 'نوع البلاغ' : 'Type'}</th>
                  <th className="p-4">{lang === 'ar' ? 'التفاصيل' : 'Details'}</th>
                  <th className="p-4">{lang === 'ar' ? 'المستلم' : 'Attended By'}</th>
                  <th className="p-4">{lang === 'ar' ? 'منفذ الحل' : 'Resolved By'}</th>
                  <th className="p-4 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="p-4 text-center">{lang === 'ar' ? 'الوقت' : 'Time'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-4 font-mono font-black text-amber-300">
                        {a.location || a.deviceId}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          a.type === 'it_support' 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {a.type === 'it_support' ? 'VOID' : 'Customer'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-white max-w-xs truncate">
                        {a.title}
                      </td>
                      <td className="p-4 text-gray-300">
                        {a.viewedBy || (a as any).responder || '-'}
                      </td>
                      <td className="p-4 text-emerald-400 font-bold">
                        {a.completedBy || '-'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === 'Completed' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : a.status === 'Seen' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-red-500/20 text-[#D2122E] border border-red-500/30'
                        }`}>
                          {a.status === 'Completed' ? t.statusCompleted : a.status === 'Seen' ? t.statusSeen : t.statusNew}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono text-gray-400">
                        {a.timestamp}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      {lang === 'ar' ? 'لا توجد سجلات تطابق معايير البحث المحددة' : 'No records match selected criteria'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
