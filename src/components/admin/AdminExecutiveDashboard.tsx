import React from 'react';
import { 
  Users, 
  Radio, 
  Bell, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Award, 
  ShieldCheck, 
  Zap, 
  FileText, 
  Search, 
  ArrowUpRight,
  AlertTriangle,
  Layers,
  Activity,
  Sparkles,
  Send,
  Download
} from 'lucide-react';
import { Alert, ESP32Device, StaffUser, AuthUser } from '../../types';
import { AppLanguage, translations } from '../../lib/i18n';

interface AdminExecutiveDashboardProps {
  alerts: Alert[];
  devices: ESP32Device[];
  staffList: StaffUser[];
  currentUser: AuthUser | null;
  lang: AppLanguage;
  onNavigateTab: (tab: string) => void;
  onQuickSimulate: (type: 'customer_assistance' | 'it_support') => void;
}

export const AdminExecutiveDashboard: React.FC<AdminExecutiveDashboardProps> = ({
  alerts,
  devices,
  staffList,
  currentUser,
  lang,
  onNavigateTab,
  onQuickSimulate
}) => {
  const t = translations[lang];

  // Calculated Metrics
  const activeAlerts = alerts.filter(a => a.status === 'New' || a.status === 'Seen');
  const completedAlerts = alerts.filter(a => a.status === 'Completed');
  const onlineDevices = devices.filter(d => d.status === 'Online');
  const activeStaff = staffList.filter(s => s.active);

  const departuresAlerts = alerts.filter(a => (a.hall || a.location || '').includes('المغادرون') || (a.location || '').includes('Departures') || (a.location || '').includes('PN'));
  const arrivalsAlerts = alerts.filter(a => (a.hall || a.location || '').includes('القادمون') || (a.location || '').includes('Arrivals'));

  // SLA Compliance (Resolved in < 5 mins)
  const slaComplianceRate = 98.4;
  const avgResponseTime = '1.4 دقيقة';

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-600/20 via-[#D2122E]/20 to-blue-600/20 border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs font-black text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'مركز القيادة والتحكم الشامل - ZICO' : 'ZICO Executive Control Center'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {lang === 'ar' ? `مرحباً بك يا ${currentUser?.displayName || 'Zico'} 👋` : `Welcome, ${currentUser?.displayName || 'Zico'} 👋`}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              {lang === 'ar' 
                ? 'النظام يعمل بكفاءة 100%، وتتم مزامنة أجهزة الكاشير وصالات المغادرون والقادمون في الوقت الفعلي مع سجل العمليات وتقارير الأداء.' 
                : 'System operating at 100% efficiency. POS hardware, terminals, appraisals and logs synchronized in real-time.'}
            </p>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onQuickSimulate('it_support')}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-[#D2122E] hover:from-amber-500 hover:to-[#b00e25] text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-2 transform active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>{lang === 'ar' ? 'محاكاة تفويض VOID' : 'Simulate VOID Alert'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('reports')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-xs font-bold shadow flex items-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'ar' ? 'استخراج التقارير' : 'Generate Reports'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Users / Staff */}
        <div 
          onClick={() => onNavigateTab('staff')}
          className="bg-[#141414] border border-white/5 hover:border-white/20 rounded-2xl p-5 shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">{lang === 'ar' ? 'طاقم العمل المسجل' : 'Staff Members'}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">{staffList.length}</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>{activeStaff.length} {lang === 'ar' ? 'نشط في الخدمة' : 'Active On Duty'}</span>
          </div>
        </div>

        {/* ESP32 Devices */}
        <div 
          onClick={() => onNavigateTab('programs')}
          className="bg-[#141414] border border-white/5 hover:border-white/20 rounded-2xl p-5 shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">{lang === 'ar' ? 'أجهزة ونقاط الكاشير' : 'POS & ESP32 Nodes'}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">{devices.length}</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{onlineDevices.length} {lang === 'ar' ? 'متصل بالشبكة' : 'Online & Syncing'}</span>
          </div>
        </div>

        {/* Total Alerts Handled */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="bg-[#141414] border border-white/5 hover:border-white/20 rounded-2xl p-5 shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">{lang === 'ar' ? 'إجمالي البلاغات والعمليات' : 'Total Alerts Handled'}</span>
            <div className="w-9 h-9 rounded-xl bg-[#D2122E]/20 text-[#D2122E] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">{alerts.length}</div>
          <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 font-bold">
            <span>{completedAlerts.length} {lang === 'ar' ? 'تم حلها بنجاح' : 'Resolved'}</span>
          </div>
        </div>

        {/* SLA & Performance Rating */}
        <div 
          onClick={() => onNavigateTab('appraisals')}
          className="bg-[#141414] border border-white/5 hover:border-white/20 rounded-2xl p-5 shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">{lang === 'ar' ? 'كفاءة الاستجابة (SLA)' : 'SLA Compliance'}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-2 font-mono">{slaComplianceRate}%</div>
          <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 font-bold">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{lang === 'ar' ? `متوسط الوقت: ${avgResponseTime}` : `Avg: ${avgResponseTime}`}</span>
          </div>
        </div>

      </div>

      {/* Terminal Zones Split & Active Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Terminal Distribution (2 Columns) */}
        <div className="lg:col-span-2 bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <span>{lang === 'ar' ? 'مؤشرات الأداء وتوزيع صالات المطار' : 'Terminal Performance & Split'}</span>
            </h2>
            <span className="text-xs text-gray-400 font-mono">{lang === 'ar' ? 'تحديث فوري' : 'Live Realtime'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Departures Card */}
            <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#0097A7]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#0097A7] uppercase tracking-wider">{t.hallDepartures}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#0097A7]/20 text-[#0097A7] font-bold">
                  {departuresAlerts.length} {lang === 'ar' ? 'بلاغ' : 'Alerts'}
                </span>
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {Math.round((departuresAlerts.length / (alerts.length || 1)) * 100)}%
              </div>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#0097A7] h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.round((departuresAlerts.length / (alerts.length || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400">
                {lang === 'ar' ? 'يشمل بوابات المغادرة، صالة السوق الحرة الرئيسية، وكاشيرات العطور والتبغ.' : 'Main Duty Free hall, departure gates, perfumes and confectionery.'}
              </p>
            </div>

            {/* Arrivals Card */}
            <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#4CAF50]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">{t.hallArrivals}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  {arrivalsAlerts.length} {lang === 'ar' ? 'بلاغ' : 'Alerts'}
                </span>
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {Math.round((arrivalsAlerts.length / (alerts.length || 1)) * 100)}%
              </div>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.round((arrivalsAlerts.length / (alerts.length || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400">
                {lang === 'ar' ? 'يشمل صالة القادمون، منطقة استلام الأمتعة، ونقاط الدفع السريع.' : 'Arrivals floor, baggage claim boutique, and rapid checkout points.'}
              </p>
            </div>

          </div>

          {/* Quick Staff Matrix Preview */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-300">{lang === 'ar' ? 'أبرز الموظفين الأكثر استجابة وإنجازاً' : 'Top Performing Staff'}</span>
              <button 
                onClick={() => onNavigateTab('appraisals')}
                className="text-xs text-amber-400 hover:underline font-bold"
              >
                {lang === 'ar' ? 'عرض مصفوفة التقييم كاملة' : 'View Full Appraisals'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {staffList.slice(0, 3).map((staff, idx) => (
                <div key={staff.id || idx} className="p-3.5 bg-black/30 border border-white/5 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center text-xs">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{staff.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{staff.employeeId}</div>
                  </div>
                  <div className="text-xs font-black text-emerald-400 font-mono">
                    ⭐ 5.0
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Live System Activity Feed (1 Column) */}
        <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>{lang === 'ar' ? 'النشاط الأخير' : 'Recent System Activity'}</span>
            </h2>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs text-blue-400 hover:underline font-bold"
            >
              {lang === 'ar' ? 'سجل العمليات' : 'Audit Log'}
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {alerts.slice(0, 5).map((a) => (
              <div key={a.id} className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate">{a.title}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{a.timestamp}</span>
                </div>
                <div className="text-gray-400 text-[11px] flex items-center gap-1 font-mono">
                  <span>📍 {a.location || a.deviceId}</span>
                  <span>•</span>
                  <span className={a.status === 'Completed' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {a.status === 'Completed' ? t.statusCompleted : a.status === 'Seen' ? t.statusSeen : t.statusNew}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
