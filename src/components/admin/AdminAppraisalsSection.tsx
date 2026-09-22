import React, { useState } from 'react';
import { 
  Award, 
  Star, 
  Sparkles, 
  TrendingUp, 
  Plus, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  User, 
  Download,
  Filter
} from 'lucide-react';
import { StaffUser, StaffAppraisal, Alert } from '../../types';
import { AppLanguage, translations } from '../../lib/i18n';

interface AdminAppraisalsSectionProps {
  staffList: StaffUser[];
  alerts: Alert[];
  appraisals: StaffAppraisal[];
  lang: AppLanguage;
  onAddAppraisal: (appraisal: Omit<StaffAppraisal, 'id' | 'createdAt'>) => Promise<void>;
}

export const AdminAppraisalsSection: React.FC<AdminAppraisalsSectionProps> = ({
  staffList,
  alerts,
  appraisals,
  lang,
  onAddAppraisal
}) => {
  const t = translations[lang];

  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffTargetId, setStaffTargetId] = useState('');
  const [ratingScore, setRatingScore] = useState(5);
  const [badgeCategory, setBadgeCategory] = useState<'🏆 Top Performer' | '⚡ Speed Master' | '⭐ Duty Star' | '🛡️ Customer Hero'>('🏆 Top Performer');
  const [notesInput, setNotesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredAppraisals = selectedStaffId === 'all' 
    ? appraisals 
    : appraisals.filter(a => a.staffId === selectedStaffId);

  const handleCreateAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStaff = staffList.find(s => s.id === staffTargetId);
    if (!targetStaff) return;

    setIsSubmitting(true);
    try {
      await onAddAppraisal({
        staffId: targetStaff.id,
        staffName: targetStaff.name,
        employeeId: targetStaff.employeeId,
        evaluator: 'Zico (Executive Admin)',
        rating: ratingScore,
        speedScore: 98,
        accuracyScore: 99,
        badge: badgeCategory,
        notes: notesInput.trim() || (lang === 'ar' ? 'أداء متميز واستجابة فورية لبلاغات الصالة والكاشير.' : 'Outstanding response time and excellent teamwork.'),
        period: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`
      });
      setIsAddModalOpen(false);
      setNotesInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header Banner */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>{lang === 'ar' ? 'نظام التقييم والتقدير والأداء الوظيفي' : 'Staff Appraisal & Recognition System'}</span>
            </h2>
            <p className="text-xs text-gray-400">
              {lang === 'ar' 
                ? 'تقييم كفاءة الاستجابة، دقة حل المشكلات، منح أوسمة التميز، وتقدير جهود موظفي السوق الحرة.' 
                : 'Evaluate SLA compliance, response speed, issue resolution accuracy, and award badges.'}
            </p>
          </div>

          <button
            onClick={() => {
              if (staffList.length > 0) setStaffTargetId(staffList[0].id);
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-[#D2122E] hover:from-amber-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة تقييم ووسام جديد' : 'New Appraisal'}</span>
          </button>
        </div>
      </div>

      {/* KPI Appraisal Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'متوسط تقييم الطاقم' : 'Overall Team Rating'}</div>
          <div className="text-3xl font-black text-amber-300 font-mono flex items-center gap-2">
            <span>4.9</span>
            <div className="flex text-amber-400 text-sm">★★★★★</div>
          </div>
          <div className="text-[11px] text-emerald-400 font-bold">98.4% {lang === 'ar' ? 'مطابقة معايير الخدمة' : 'SLA Met'}</div>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'سرعة الاستجابة' : 'Response Speed'}</div>
          <div className="text-3xl font-black text-blue-400 font-mono">99.1%</div>
          <div className="text-[11px] text-gray-400">{lang === 'ar' ? 'أقل من دقيقتين للمغادرون' : '< 2 min average'}</div>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'دقة الإنجاز وحل VOID' : 'VOID Accuracy'}</div>
          <div className="text-3xl font-black text-emerald-400 font-mono">100%</div>
          <div className="text-[11px] text-gray-400">{lang === 'ar' ? 'بدون أي تجاوزات أمنية' : 'Zero discrepancies'}</div>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'أوسمة التميز الممنوحة' : 'Badges Awarded'}</div>
          <div className="text-3xl font-black text-purple-400 font-mono">{appraisals.length || 12}</div>
          <div className="text-[11px] text-purple-300 font-bold">🏆 4 {lang === 'ar' ? 'هذا الشهر' : 'this month'}</div>
        </div>
      </div>

      {/* Appraisals Feed / List */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{lang === 'ar' ? 'سجل تقييمات الأداء والملاحظات الإدارية' : 'Staff Appraisal Records'}</span>
          </h3>

          <div className="flex items-center gap-2">
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">{lang === 'ar' ? 'جميع الموظفين' : 'All Staff'}</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.employeeId})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppraisals.map((appr) => (
            <div 
              key={appr.id}
              className="p-5 bg-black/40 border border-white/5 hover:border-amber-500/30 rounded-2xl space-y-3 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-extrabold text-white">{appr.staffName}</div>
                  <div className="text-xs text-amber-300 font-mono">{appr.employeeId}</div>
                </div>

                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-black border border-amber-500/30">
                  {appr.badge || '🏆 Top Performer'}
                </span>
              </div>

              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: appr.rating || 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>

              <p className="text-xs text-gray-300 leading-relaxed bg-[#1A1A1A] p-3 rounded-xl border border-white/5">
                "{appr.notes}"
              </p>

              <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1">
                <span>{lang === 'ar' ? 'التقييم بواسطة:' : 'Evaluated by:'} {appr.evaluator}</span>
                <span>{appr.period || 'Q1 2026'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD APPRAISAL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>{lang === 'ar' ? 'إضافة تقييم وتقدير للموظف' : 'Add Staff Appraisal'}</span>
            </h3>

            <form onSubmit={handleCreateAppraisal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">{lang === 'ar' ? 'الموظف المعني' : 'Staff Member'} *</label>
                <select
                  value={staffTargetId}
                  onChange={(e) => setStaffTargetId(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.employeeId} ({s.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">{lang === 'ar' ? 'التقييم (النجوم)' : 'Rating Score'}</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      className={`p-2 rounded-xl transition-all ${
                        ratingScore >= star ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-600'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${ratingScore >= star ? 'fill-amber-400' : ''}`} />
                    </button>
                  ))}
                  <span className="text-sm font-black text-white mr-2">{ratingScore} / 5</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">{lang === 'ar' ? 'وسام التميز' : 'Badge Award'}</label>
                <select
                  value={badgeCategory}
                  onChange={(e: any) => setBadgeCategory(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="🏆 Top Performer">🏆 Top Performer (نجم الأداء)</option>
                  <option value="⚡ Speed Master">⚡ Speed Master (أسرع استجابة)</option>
                  <option value="⭐ Duty Star">⭐ Duty Star (نجم المناوبة)</option>
                  <option value="🛡️ Customer Hero">🛡️ Customer Hero (بطل خدمة الزبائن)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">{lang === 'ar' ? 'الملاحظات الإدارية وشهادة التقدير' : 'Appraisal Notes & Recognition'}</label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder={lang === 'ar' ? 'أداء متميز في إدارة صالة المغادرون والاستجابة السريعة لبلاغات الكاشير...' : 'Enter appraisal notes...'}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-[#D2122E] text-white rounded-xl font-black shadow-lg"
                >
                  {isSubmitting ? '...' : (lang === 'ar' ? 'حفظ التقييم' : 'Save Appraisal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
