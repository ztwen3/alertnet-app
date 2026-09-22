import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  Building2, 
  CreditCard,
  Check,
  X,
  UserCheck
} from 'lucide-react';
import { StaffUser, Alert } from '../../types';
import { AppLanguage, translations } from '../../lib/i18n';

interface AdminUsersManagementProps {
  staffList: StaffUser[];
  alerts?: Alert[];
  lang: AppLanguage;
  onAddStaff: (staff: Omit<StaffUser, 'id'>) => Promise<void>;
  onUpdateStaff: (staff: StaffUser) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
}

export const AdminUsersManagement: React.FC<AdminUsersManagementProps> = ({
  staffList,
  lang,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff
}) => {
  const isEn = lang === 'en';

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Inputs
  const [nameInput, setNameInput] = useState('');
  const [empIdInput, setEmpIdInput] = useState('');
  const [roleInput, setRoleInput] = useState<'Admin' | 'Duty Manager' | 'IT Support' | 'Customer Staff'>('Customer Staff');
  const [deptInput, setDeptInput] = useState<'Departures' | 'Arrivals'>('Departures');
  const [activeInput, setActiveInput] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => {
      const matchesSearch = 
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || staff.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staffList, searchTerm, roleFilter]);

  const openAddModal = () => {
    setEditingStaff(null);
    setNameInput('');
    setEmpIdInput('');
    setRoleInput('Customer Staff');
    setDeptInput('Departures');
    setActiveInput(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (staff: StaffUser) => {
    setEditingStaff(staff);
    setNameInput(staff.name);
    setEmpIdInput(staff.employeeId);
    setRoleInput(staff.role);
    setDeptInput(staff.department as any);
    setActiveInput(staff.active);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nameInput.trim()) {
      setFormError(isEn ? 'Please enter employee name' : 'يرجى إدخال اسم الموظف');
      return;
    }
    if (!empIdInput.trim()) {
      setFormError(isEn ? 'Please enter Employee ID' : 'يرجى إدخال الرقم الوظيفي / كود الدخول');
      return;
    }

    // Check duplicate ID
    const normalizedEmpId = empIdInput.trim().toUpperCase();
    const isDuplicate = staffList.some(
      s => s.employeeId.toUpperCase() === normalizedEmpId && (!editingStaff || s.id !== editingStaff.id)
    );

    if (isDuplicate) {
      setFormError(isEn ? 'Employee ID is already in use' : 'الرقم الوظيفي مسجل مسبقاً لموظف آخر');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStaff) {
        await onUpdateStaff({
          ...editingStaff,
          name: nameInput.trim(),
          employeeId: normalizedEmpId,
          role: roleInput,
          department: deptInput,
          active: activeInput,
        });
      } else {
        await onAddStaff({
          name: nameInput.trim(),
          employeeId: normalizedEmpId,
          role: roleInput,
          department: deptInput,
          active: activeInput,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || (isEn ? 'Failed to save staff' : 'حدث خطأ أثناء حفظ بيانات المستخدم'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (staff: StaffUser) => {
    try {
      await onUpdateStaff({
        ...staff,
        active: !staff.active,
      });
    } catch (err) {
      console.error('Error toggling staff status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteStaff(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting staff:', err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">{isEn ? 'Executive Admin' : 'مدير تنفيذي'}</span>;
      case 'Duty Manager':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">{isEn ? 'Duty Manager' : 'مشرف مناوب'}</span>;
      case 'IT Support':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">{isEn ? 'IT Support' : 'دعم فني'}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">{isEn ? 'Floor Staff' : 'موظف صالة'}</span>;
    }
  };

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      
      {/* Header & Actions */}
      <div className="bg-[#141414] border border-white/5 p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D2122E]/10 border border-[#D2122E]/20 text-[#D2122E] flex items-center justify-center shrink-0 shadow">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>{isEn ? 'Staff & User Management' : 'إدارة المستخدمين والموظفين'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 font-mono text-gray-300">
                {staffList.length}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEn ? 'Manage staff accounts, login IDs, roles and shift status.' : 'إدارة حسابات الموظفين، أرقام الدخول، الصلاحيات وحالة الحساب.'}
            </p>
          </div>
        </div>

        {/* Add User Button */}
        <button
          type="button"
          onClick={openAddModal}
          className="px-5 py-3 bg-[#D2122E] hover:bg-[#b00e25] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 transition-all active:scale-95 whitespace-nowrap cursor-pointer self-stretch sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isEn ? 'Add New Staff' : 'إضافة موظف جديد'}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute top-3.5 right-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search by name or Employee ID...' : 'بحث بالاسم أو الرقم الوظيفي...'}
            className="w-full bg-[#161616] border border-white/10 rounded-2xl px-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D2122E] transition-all"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-[#161616] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#D2122E] transition-all"
        >
          <option value="all">{isEn ? 'All Roles' : 'جميع الأدوار والصلاحيات'}</option>
          <option value="Admin">{isEn ? 'Executive Admin' : 'المدير التنفيذي'}</option>
          <option value="Duty Manager">{isEn ? 'Duty Manager' : 'مشرف مناوب'}</option>
          <option value="IT Support">{isEn ? 'IT Support' : 'الدعم الفني'}</option>
          <option value="Customer Staff">{isEn ? 'Floor Staff' : 'موظف الصالة'}</option>
        </select>
      </div>

      {/* Users List (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staff) => (
          <div 
            key={staff.id}
            className={`bg-[#141414] border rounded-3xl p-5 transition-all shadow-md relative flex flex-col justify-between ${
              staff.active 
                ? 'border-white/5 hover:border-white/20' 
                : 'border-red-950/40 bg-black/40 opacity-70'
            }`}
          >
            <div>
              {/* Top Row: Avatar + Name + Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white ${
                    staff.role === 'Admin' 
                      ? 'bg-red-600/30 border border-red-500/40 text-red-300' 
                      : staff.role === 'Duty Manager'
                      ? 'bg-amber-600/30 border border-amber-500/40 text-amber-300'
                      : staff.role === 'IT Support'
                      ? 'bg-purple-600/30 border border-purple-500/40 text-purple-300'
                      : 'bg-blue-600/30 border border-blue-500/40 text-blue-300'
                  }`}>
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {staff.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 font-mono">
                      <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                      <span>{staff.employeeId}</span>
                    </div>
                  </div>
                </div>

                {/* Active Status Badge */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(staff)}
                  title={staff.active ? (isEn ? 'Click to deactivate' : 'انقر للتعطيل') : (isEn ? 'Click to activate' : 'انقر للتفعيل')}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                    staff.active 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' 
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${staff.active ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                  <span>{staff.active ? (isEn ? 'Active' : 'نشط') : (isEn ? 'Inactive' : 'معطل')}</span>
                </button>
              </div>

              {/* Badges Row: Role & Department */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/5">
                {getRoleBadge(staff.role)}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/5 text-gray-300 border border-white/10 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-gray-400" />
                  <span>{staff.department === 'Departures' ? (isEn ? 'Departures' : 'المغادرون') : (isEn ? 'Arrivals' : 'القادمون')}</span>
                </span>
              </div>
            </div>

            {/* Bottom Actions: Edit & Delete */}
            <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-white/5">
              {deleteConfirmId === staff.id ? (
                <div className="flex items-center gap-2 w-full justify-between animate-in fade-in">
                  <span className="text-[11px] text-red-400 font-bold">
                    {isEn ? 'Confirm delete?' : 'تأكيد الحذف؟'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDelete(staff.id)}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      {isEn ? 'Yes, Delete' : 'نعم، احذف'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      {isEn ? 'Cancel' : 'إلغاء'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openEditModal(staff)}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-white/5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isEn ? 'Edit' : 'تعديل'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(staff.id)}
                    className="p-2 text-gray-500 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer"
                    title={isEn ? 'Delete' : 'حذف'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredStaff.length === 0 && (
          <div className="col-span-full bg-[#141414] border border-white/5 rounded-3xl p-8 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-600" />
            <p className="text-sm font-bold text-gray-300">
              {isEn ? 'No staff members found' : 'لم يتم العثور على أي موظف'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isEn ? 'Try adjusting your search criteria or add a new staff member.' : 'جرب تغيير كلمة البحث أو قم بإضافة موظف جديد.'}
            </p>
          </div>
        )}
      </div>

      {/* Simplified Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D2122E]/20 text-[#D2122E] flex items-center justify-center font-bold">
                  {editingStaff ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <h3 className="text-base font-extrabold text-white">
                  {editingStaff 
                    ? (isEn ? 'Edit Staff Member' : 'تعديل بيانات الموظف') 
                    : (isEn ? 'Add New Staff Member' : 'إضافة موظف جديد')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-xs text-red-400 font-bold">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  {isEn ? 'Full Name' : 'اسم الموظف الكامل'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={isEn ? 'e.g. Salim Al-Harthy' : 'مثال: سالم الحارثي'}
                  className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D2122E]"
                />
              </div>

              {/* Employee ID */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  {isEn ? 'Employee ID / Login Code' : 'الرقم الوظيفي / كود الدخول'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={empIdInput}
                  onChange={(e) => setEmpIdInput(e.target.value)}
                  placeholder={isEn ? 'e.g. MDF-1042 or 3115' : 'مثال: MDF-1042 أو 3115'}
                  className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D2122E] uppercase font-mono"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  {isEn ? 'Role & Permission' : 'الدور والمسمى الوظيفي'}
                </label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value as any)}
                  className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D2122E]"
                >
                  <option value="Customer Staff">{isEn ? 'Floor Staff (موظف صالة)' : 'موظف صالة (Floor Staff)'}</option>
                  <option value="Duty Manager">{isEn ? 'Duty Manager (مشرف مناوب)' : 'مشرف مناوب (Duty Manager)'}</option>
                  <option value="IT Support">{isEn ? 'IT Support (دعم فني)' : 'دعم فني ونظم (IT Support)'}</option>
                  <option value="Admin">{isEn ? 'Executive Admin (مدير تنفيذي)' : 'مدير تنفيذي (Executive Admin)'}</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  {isEn ? 'Department / Hall' : 'القسم / موقع الصالة'}
                </label>
                <select
                  value={deptInput}
                  onChange={(e) => setDeptInput(e.target.value as any)}
                  className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D2122E]"
                >
                  <option value="Departures">{isEn ? 'Departures Hall (صالة المغادرون)' : 'صالة المغادرون (Departures)'}</option>
                  <option value="Arrivals">{isEn ? 'Arrivals Hall (صالة القادمون)' : 'صالة القادمون (Arrivals)'}</option>
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5">
                <div>
                  <div className="text-xs font-bold text-white">
                    {isEn ? 'Account Status' : 'حالة الحساب'}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {activeInput 
                      ? (isEn ? 'User can log in and receive notifications' : 'الموظف يمكنه تسجيل الدخول واستلام الإشعارات') 
                      : (isEn ? 'User account is deactivated' : 'الحساب معطل مؤقتاً')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveInput(!activeInput)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${activeInput ? 'bg-emerald-600' : 'bg-gray-700'}`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${activeInput ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#D2122E] hover:bg-[#b00e25] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? (isEn ? 'Saving...' : 'جاري الحفظ...') : (isEn ? 'Save Staff' : 'حفظ البيانات')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-gray-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'إلغاء'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
