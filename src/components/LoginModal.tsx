import React, { useState } from 'react';
import { X, User, Shield, CreditCard, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { AuthUser, StaffUser } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffUser[];
  onSelectUser: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onSelectUser,
}) => {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickLogin = (st: StaffUser) => {
    const authUser: AuthUser = {
      uid: st.id,
      displayName: st.name,
      employeeId: st.employeeId || 'MDF-' + Math.floor(1000 + Math.random() * 9000),
      email: st.email,
      role: st.role,
      department: st.department,
    };
    onSelectUser(authUser);
    onClose();
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = employeeName.trim();
    const cleanId = employeeId.trim().toUpperCase();

    if (!cleanName) {
      setErrorMsg('يرجى كتابة اسم الموظف / Please enter Staff Name');
      return;
    }
    if (!cleanId) {
      setErrorMsg('يرجى كتابة الرقم الوظيفي / Please enter Employee ID');
      return;
    }

    // Check if staff already exists in directory to auto-fill department and role
    const matched = staffList.find(
      s => s.employeeId?.toUpperCase() === cleanId || 
           s.name.toLowerCase().includes(cleanName.toLowerCase())
    );

    const authUser: AuthUser = {
      uid: matched?.id || `usr_${cleanId.replace(/[^a-zA-Z0-9]/g, '_')}`,
      displayName: matched?.name || cleanName,
      employeeId: matched?.employeeId || cleanId,
      email: matched?.email || `${cleanId.toLowerCase()}@muscatdutyfree.com`,
      role: matched?.role || 'Customer Staff',
      department: matched?.department || 'Duty Free Operations',
    };

    onSelectUser(authUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#0C0C0C] px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D2122E]/20 border border-[#D2122E]/30 text-[#D2122E] flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white uppercase tracking-tight">
                  تسجيل دخول الموظفين
                </h2>
                <span className="text-[10px] bg-[#D2122E]/20 text-[#D2122E] font-bold px-2 py-0.5 rounded-full border border-[#D2122E]/30">
                  Staff Login
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Muscat Duty Free Emergency & Alert Gateway
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          
          {/* Requirement Notice */}
          <div className="p-4 bg-gradient-to-r from-[#1A1A1A] to-[#141414] border border-white/5 rounded-2xl text-xs text-gray-300 flex items-start gap-3 shadow-inner">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white text-xs mb-0.5">
                تسجيل الدخول بالاسم والرقم الوظيفي فقط:
              </div>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                ادخل اسمك ورقمك الوظيفي (Employee ID) أو اختر حسابك من قائمة المناوبة السريعة لاستلام الإشعارات والتنبيهات المباشرة.
              </p>
            </div>
          </div>

          {/* Direct Login Form */}
          <form onSubmit={handleDirectSubmit} className="space-y-4 bg-[#1A1A1A] p-5 rounded-2xl border border-white/5">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>بيانات تسجيل الدخول المباشر:</span>
              <span className="text-[10px] text-gray-500 font-normal">Direct Auth</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 font-medium animate-pulse">
                {errorMsg}
              </div>
            )}

            {/* Field 1: Staff Name */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center justify-between">
                <span>اسم الموظف (Staff Name):</span>
                <span className="text-red-400 font-bold">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={employeeName}
                  onChange={(e) => {
                    setEmployeeName(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="مثال: طارق البوسعيدي / Tariq Al-Busaidi"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D2122E] transition-all"
                />
              </div>
            </div>

            {/* Field 2: Employee ID */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center justify-between">
                <span>الرقم الوظيفي (Employee ID):</span>
                <span className="text-red-400 font-bold">*</span>
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="مثال: MDF-1042 أو 2088"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder:text-gray-600 uppercase font-mono focus:outline-none focus:border-[#D2122E] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#D2122E] hover:bg-[#b00e25] active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 uppercase tracking-wider transition-all"
            >
              <span>دخول النظام • Confirm Staff Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Select from Registered Duty Staff */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-white">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>أو اختر حسابك للمناوبة السريعة:</span>
              </span>
              <span className="font-mono text-[10px] text-gray-500">{staffList.length} موظف مسجل</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {staffList.map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleQuickLogin(st)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1A1A] border border-white/5 hover:border-[#D2122E] hover:bg-[#202020] transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-[#D2122E] group-hover:text-white flex items-center justify-center text-white font-extrabold text-xs transition-colors shrink-0">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-white transition-colors">
                        {st.name}
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span className="text-[#D2122E] font-bold">الرقم الوظيفي: {st.employeeId || 'MDF-XXXX'}</span>
                        <span>•</span>
                        <span className="text-gray-400">{st.department}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/10 group-hover:border-[#D2122E]/40 shrink-0">
                    {st.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};


