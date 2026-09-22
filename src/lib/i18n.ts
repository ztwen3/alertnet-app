export type AppLanguage = 'ar' | 'en';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  developerName: string;
  developerCredit: string;
  welcomeLogin: string;
  loginPrompt: string;
  staffName: string;
  staffNamePlaceholder: string;
  employeeId: string;
  employeeIdPlaceholder: string;
  hallDepartmentLabel: string;
  hallArrivals: string;
  hallDepartures: string;
  loginBtn: string;
  adminLoginPrompt: string;
  adminUsername: string;
  adminPassword: string;
  adminLoginBtn: string;
  loginErrorRequired: string;
  adminAuthError: string;
  logout: string;
  dashboard: string;
  liveAlerts: string;
  history: string;
  whoIsOnline: string;
  reports: string;
  soundSettings: string;
  adminPanel: string;
  systemOnline: string;
  gatewayStatus: string;
  audioActive: string;
  audioMuted: string;
  newAlerts: string;
  customerAssistance: string;
  itSupport: string;
  generalNotice: string;
  nodesOnline: string;
  goingToResolve: (name: string) => string;
  problemResolved: string;
  problemResolvedBy: (name: string) => string;
  acknowledgeBtn: string;
  resolveBtn: string;
  replaySound: string;
  criticalAlert: string;
  noAlertsTitle: string;
  noAlertsDesc: string;
  recentActivity: string;
  viewAllHistory: string;
  statusNew: string;
  statusSeen: string;
  statusCompleted: string;
  onlineStaff: string;
  onlineDevices: string;
  location: string;
  nodeId: string;
  lastActive: string;
  switchLanguage: string;
  adminWelcome: string;
  dutyFreeHub: string;
  
  // Notification & Sound Settings Translations
  soundSettingsTitle: string;
  soundSettingsSubtitle: string;
  saveSoundSettings: string;
  savingSettings: string;
  savedSettingsSuccess: string;
  custAlertTitle: string;
  custAlertSub: string;
  itAlertTitle: string;
  itAlertSub: string;
  genAlertTitle: string;
  genAlertSub: string;
  customToneLabel: string;
  testCustSoundBtn: string;
  testITSoundBtn: string;
  testGenSoundBtn: string;
  masterVolLabel: string;
  alertRepeatLabel: string;
  repeatOnce: string;
  repeatThrice: string;
  repeatTen: string;
  masterSoundToggle: string;
  masterSoundToggleDesc: string;
  browserPushTitle: string;
  browserPushDesc: string;
  permissionGranted: string;
  permissionNeeded: string;
  requestPermissionBtn: string;
  vibrationTitle: string;
  vibrationDesc: string;
  visualFlashTitle: string;
  visualFlashDesc: string;
  soundLibraryTitle: string;
  soundLibrarySubtitle: string;
  listenTone: string;
  playingTone: string;

  // Admin Specific Translations
  adminOverview: string;
  devicesManagement: string;
  staffManagement: string;
  alertsMaintenance: string;
  systemBackup: string;
  addDevice: string;
  editDevice: string;
  deleteDevice: string;
  deviceName: string;
  deviceLocation: string;
  deviceType: string;
  deviceStatus: string;
  online: string;
  offline: string;
  sendTestAlert: string;
  testAlertSent: string;
  exportJSON: string;
  importJSON: string;
  exportCSV: string;
  addStaff: string;
  editStaff: string;
  deleteStaff: string;
  roleLabel: string;
  activeStatus: string;
  clearHistory: string;
  confirmClear: string;
  fullBackupTitle: string;
  fullBackupDesc: string;
  restoreBackup: string;
  backupSuccess: string;
  saveChanges: string;
  cancel: string;
  totalAlerts: string;
  totalStaff: string;
  totalDevices: string;
  quickSimulation: string;
  simCustomerAlert: string;
  simITAlert: string;
  simGeneralAlert: string;
  activeNow: string;
  unauthorizedNotice: string;
}

export const translations: Record<AppLanguage, Translations> = {
  ar: {
    appTitle: 'السوق الحرة مسقط',
    appSubtitle: 'السوق الحرة مسقط',
    developerName: 'زكريا الخالدي',
    developerCredit: 'تطوير وبرمجة: زكريا الخالدي',
    welcomeLogin: 'مرحباً بكم في السوق الحرة مسقط',
    loginPrompt: 'سجّل دخولك بالاسم والرقم الوظيفي لاستلام البلاغات والتنبيهات المباشرة',
    staffName: 'اسم الموظف',
    staffNamePlaceholder: 'مثال: عايشة الحبسي',
    employeeId: 'الرقم الوظيفي',
    employeeIdPlaceholder: 'مثال: 1042 أو 2088',
    hallDepartmentLabel: 'الصالة / القسم',
    hallArrivals: 'القادمون',
    hallDepartures: 'المغادرون',
    loginBtn: 'تسجيل الدخول',
    adminLoginPrompt: 'تسجيل دخول مسؤول النظام',
    adminUsername: 'اسم المستخدم',
    adminPassword: 'كلمة المرور',
    adminLoginBtn: 'دخول لوحة الإدارة',
    loginErrorRequired: 'يرجى كتابة اسم الموظف والرقم الوظيفي للمتابعة',
    adminAuthError: 'اسم المستخدم أو كلمة المرور غير صحيحة!',
    logout: 'تسجيل خروج',
    dashboard: 'الرئيسية',
    liveAlerts: 'البلاغات الحية',
    history: 'سجل البلاغات',
    whoIsOnline: 'من متواجد الآن',
    reports: 'التقارير',
    soundSettings: 'التنبيهات والإشعارات',
    adminPanel: 'لوحة الإدارة',
    systemOnline: 'النظام متصل',
    gatewayStatus: 'بوابة استقبال البلاغات الفورية',
    audioActive: 'الصوت مفعّل',
    audioMuted: 'الصوت مكتوم',
    newAlerts: 'بلاغات جديدة',
    customerAssistance: 'مساعدة زبون',
    itSupport: 'تفويض (VOID)',
    generalNotice: 'إشعار عام',
    nodesOnline: 'الأجهزة المتصلة',
    goingToResolve: (name: string) => `${name} ذاهب لحل المشكلة`,
    problemResolved: 'تم حل المشكلة',
    problemResolvedBy: (name: string) => `تم حل المشكلة بواسطة: ${name}`,
    acknowledgeBtn: 'ذاهب لحل المشكلة',
    resolveBtn: 'تم حل المشكلة',
    replaySound: 'إعادة التنبيه',
    criticalAlert: 'تنبيه عاجل وفوري',
    noAlertsTitle: 'لا يوجد أي تنبيه في الوقت الحالي',
    noAlertsDesc: 'تم التعامل مع كافة الإشارات والبلاغات بنجاح',
    recentActivity: 'آخر البلاغات',
    viewAllHistory: 'عرض كل السجل',
    statusNew: 'جديد',
    statusSeen: 'جاري التوجه',
    statusCompleted: 'تم الحل',
    onlineStaff: 'الموظفون المتواجدون الآن',
    onlineDevices: 'الأجهزة المتصلة النشطة',
    location: 'الموقع',
    nodeId: 'رمز الجهاز',
    lastActive: 'آخر ظهور',
    switchLanguage: 'English',
    adminWelcome: 'لوحة تحكم مسؤول النظام الشاملة (Zico Executive)',
    dutyFreeHub: 'السوق الحرة مسقط - مطار مسقط الدولي',
    
    // Notification & Sound Settings Translations
    soundSettingsTitle: 'إعدادات الإشعارات وتخصيص الأصوات',
    soundSettingsSubtitle: 'تخصيص نغمات الرنين، تكرار التنبيه، مستوى الصوت، وإشعارات الشاشة الفورية لجميع أنواع البلاغات',
    saveSoundSettings: 'حفظ إعدادات الأصوات',
    savingSettings: 'جاري الحفظ...',
    savedSettingsSuccess: 'تم حفظ الإعدادات بنجاح!',
    custAlertTitle: 'طلب مساعدة زبون / طوارئ',
    custAlertSub: 'Customer Assistance (زر 5)',
    itAlertTitle: 'طلب تفويض وإلغاء (VOID)',
    itAlertSub: 'Supervisor Authorization VOID (زر 4)',
    genAlertTitle: 'النداءات والإشعارات العامة',
    genAlertSub: 'General Broadcasts',
    customToneLabel: 'نغمة الرنين المخصصة (Sound Tone):',
    testCustSoundBtn: 'استماع لنغمة طلب المساعدة',
    testITSoundBtn: 'استماع لنغمة طلب التفويض (VOID)',
    testGenSoundBtn: 'استماع لنغمة الإشعارات العامة',
    masterVolLabel: 'مستوى الصوت الرئيسي (Master Volume):',
    alertRepeatLabel: 'تكرار الرنين عند وصول التنبيه (Alert Repetition):',
    repeatOnce: 'مرة واحدة',
    repeatThrice: '3 مرات',
    repeatTen: '10 مرات',
    masterSoundToggle: 'تفعيل نظام الأصوات العام',
    masterSoundToggleDesc: 'تشغيل نغمات التنبيهات على هذا الجهاز',
    browserPushTitle: 'إشعارات المتصفح والنظام (Desktop Push)',
    browserPushDesc: 'تنبيه الموظف حتى وإن كانت النافذة في الخلفية',
    permissionGranted: 'مفعل (Active)',
    permissionNeeded: 'يحتاج إذن',
    requestPermissionBtn: 'طلب إذن إشعارات المتصفح الآن',
    vibrationTitle: 'الاهتزاز على الهواتف والأجهزة اللوحية',
    vibrationDesc: 'نمط اهتزاز تحذيري عند استلام نداء جديد',
    visualFlashTitle: 'وميض الشاشة والنافذة العاجلة (Visual Banner)',
    visualFlashDesc: 'إظهار شريط أحمر وميضي مع كل نداء طوارئ',
    soundLibraryTitle: 'مكتبة نغمات التنبيه المتاحة للاختيار',
    soundLibrarySubtitle: 'يمكنك الاستماع والتجربة الفورية لكل نغمة لتحديد النغمة الأنسب',
    listenTone: 'استماع',
    playingTone: 'يعمل',
    
    // Admin
    adminOverview: 'نظرة عامة وإحصائيات شاملة',
    devicesManagement: 'إدارة أجهزة الصالة',
    staffManagement: 'إدارة الموظفين والمستخدمين',
    alertsMaintenance: 'صيانة وسجل البلاغات',
    systemBackup: 'النسخ الاحتياطي والاستعادة',
    addDevice: 'إضافة جهاز جديد',
    editDevice: 'تعديل الجهاز',
    deleteDevice: 'حذف الجهاز',
    deviceName: 'اسم الجهاز / النقطة',
    deviceLocation: 'موقع الجهاز في الصالة',
    deviceType: 'نوع البلاغ المخصص',
    deviceStatus: 'حالة الاتصال',
    online: 'متصل',
    offline: 'غير متصل',
    sendTestAlert: 'إرسال بلاغ تجريبي',
    testAlertSent: 'تم إرسال بلاغ الاختبار بنجاح',
    exportJSON: 'تصدير ملف البيانات',
    importJSON: 'استيراد ملف البيانات',
    exportCSV: 'تصدير تقرير إكسل',
    addStaff: 'إضافة موظف جديد',
    editStaff: 'تعديل بيانات الموظف',
    deleteStaff: 'حذف الموظف',
    roleLabel: 'الدور والوظيفة',
    activeStatus: 'الحالة التشغيلية',
    clearHistory: 'مسح سجل البلاغات القديمة',
    confirmClear: 'هل أنت متأكد من مسح جميع البلاغات المسجلة؟',
    fullBackupTitle: 'النسخة الاحتياطية الشاملة للنظام',
    fullBackupDesc: 'حفظ وتصدير قاعدة البيانات بالكامل تشمل الأجهزة والموظفين والإعدادات.',
    restoreBackup: 'استعادة نسخة احتياطية',
    backupSuccess: 'تمت العملية بنجاح تام',
    saveChanges: 'حفظ التعديلات',
    cancel: 'إلغاء',
    totalAlerts: 'إجمالي البلاغات المسجلة',
    totalStaff: 'إجمالي الموظفين المسجلين',
    totalDevices: 'إجمالي أجهزة الصالة المعتمدة',
    quickSimulation: 'محاكاة وإرسال إشارة فورية',
    simCustomerAlert: 'إرسال طلب مساعدة زبون',
    simITAlert: 'إرسال طلب تفويض (VOID)',
    simGeneralAlert: 'إرسال إشعار عام',
    activeNow: 'متواجد الآن',
    unauthorizedNotice: 'هذه الشاشة مخصصة فقط لمسؤول النظام.',
  },
  en: {
    appTitle: 'Muscat Duty Free',
    appSubtitle: 'Real-Time Emergency & Alert Network',
    developerName: 'Zakariya Alkhaldi',
    developerCredit: 'Developed & Programmed by: Zakariya Alkhaldi',
    welcomeLogin: 'Welcome to Muscat Duty Free Alert Network',
    loginPrompt: 'Sign in with your Name and Employee ID to receive real-time alerts.',
    staffName: 'Staff Name',
    staffNamePlaceholder: 'e.g. Tariq Al-Busaidi',
    employeeId: 'Employee ID',
    employeeIdPlaceholder: 'e.g. 1042 or 2088',
    hallDepartmentLabel: 'Terminal / Hall',
    hallArrivals: 'Arrivals',
    hallDepartures: 'Departures',
    loginBtn: 'Sign In',
    adminLoginPrompt: 'System Administrator Access',
    adminUsername: 'Username',
    adminPassword: 'Password',
    adminLoginBtn: 'Admin Login',
    loginErrorRequired: 'Please enter both Staff Name and Employee ID',
    adminAuthError: 'Invalid Admin username or password!',
    logout: 'Sign Out',
    dashboard: 'Dashboard',
    liveAlerts: 'Live Alerts',
    history: 'History Log',
    whoIsOnline: 'Who is Online',
    reports: 'Reports',
    soundSettings: 'Sound Settings',
    adminPanel: 'Admin Panel',
    systemOnline: 'System Online',
    gatewayStatus: 'Real-Time Emergency Dispatch Gateway',
    audioActive: 'Audio Active',
    audioMuted: 'Audio Muted',
    newAlerts: 'New Alerts',
    customerAssistance: 'Customer Assistance',
    itSupport: 'Authorization (VOID)',
    generalNotice: 'General Notice',
    nodesOnline: 'Connected Devices',
    goingToResolve: (name: string) => `${name} is attending to resolve the issue`,
    problemResolved: 'Problem Resolved',
    problemResolvedBy: (name: string) => `Problem resolved by: ${name}`,
    acknowledgeBtn: 'Attend Issue',
    resolveBtn: 'Mark as Resolved',
    replaySound: 'Replay Alert',
    criticalAlert: 'Critical Alert',
    noAlertsTitle: 'No Pending Alerts',
    noAlertsDesc: 'System standing by for wireless hardware signals.',
    recentActivity: 'Recent Alerts',
    viewAllHistory: 'View Full History',
    statusNew: 'New',
    statusSeen: 'In Progress',
    statusCompleted: 'Resolved',
    onlineStaff: 'Online Personnel',
    onlineDevices: 'Active Connected Devices',
    location: 'Location',
    nodeId: 'Device ID',
    lastActive: 'Last Active',
    switchLanguage: 'العربية',
    adminWelcome: 'System Administrator Full Control Panel (Zico Executive)',
    dutyFreeHub: 'Muscat Duty Free - Muscat International Airport',
    
    // Notification & Sound Settings Translations
    soundSettingsTitle: 'Notification & Sound Settings',
    soundSettingsSubtitle: 'Customize ringtones, alert repetitions, master volume, and instant visual banners for all emergency dispatch alerts',
    saveSoundSettings: 'Save Sound Settings',
    savingSettings: 'Saving...',
    savedSettingsSuccess: 'Settings saved successfully!',
    custAlertTitle: 'Customer Assistance Alert',
    custAlertSub: 'Customer Assistance (Key 5)',
    itAlertTitle: 'Supervisor Authorization (VOID)',
    itAlertSub: 'Supervisor Authorization VOID (Key 4)',
    genAlertTitle: 'General Staff Broadcasts',
    genAlertSub: 'General Broadcasts',
    customToneLabel: 'Custom Sound Tone:',
    testCustSoundBtn: 'Play Customer Alert Tone',
    testITSoundBtn: 'Play VOID Alert Tone',
    testGenSoundBtn: 'Play General Broadcast Tone',
    masterVolLabel: 'Master Volume:',
    alertRepeatLabel: 'Alert Sound Repetition:',
    repeatOnce: 'Once',
    repeatThrice: '3 Times',
    repeatTen: '10 Times',
    masterSoundToggle: 'Enable System Audio',
    masterSoundToggleDesc: 'Play audio alert chimes on this workstation',
    browserPushTitle: 'Desktop & Push Notifications',
    browserPushDesc: 'Alert staff even when browser window is minimized',
    permissionGranted: 'Active (Granted)',
    permissionNeeded: 'Permission Needed',
    requestPermissionBtn: 'Request Desktop Notification Permission',
    vibrationTitle: 'Mobile & Tablet Vibration',
    vibrationDesc: 'Haptic alert pulse pattern upon receiving new signals',
    visualFlashTitle: 'Visual Emergency Flash Banner',
    visualFlashDesc: 'Display persistent top banner for high-priority dispatch',
    soundLibraryTitle: 'Available Sound Tone Library',
    soundLibrarySubtitle: 'Preview and test each synthesized chime to pick the ideal tone',
    listenTone: 'Play Tone',
    playingTone: 'Playing',

    // Admin
    adminOverview: 'Overview & Analytics',
    devicesManagement: 'Hardware & Terminals Management',
    staffManagement: 'Staff & Personnel Directory',
    alertsMaintenance: 'Alerts Archive & Maintenance',
    systemBackup: 'System Backup & Restoration',
    addDevice: 'Add New Device',
    editDevice: 'Edit Device',
    deleteDevice: 'Delete Device',
    deviceName: 'Device / Terminal Name',
    deviceLocation: 'Hall / Location',
    deviceType: 'Assigned Alert Type',
    deviceStatus: 'Connectivity Status',
    online: 'Online',
    offline: 'Offline',
    sendTestAlert: 'Trigger Test Alert',
    testAlertSent: 'Test alert dispatched successfully',
    exportJSON: 'Export Data (JSON)',
    importJSON: 'Import Data (JSON)',
    exportCSV: 'Export Excel (CSV)',
    addStaff: 'Add Staff Member',
    editStaff: 'Edit Staff Details',
    deleteStaff: 'Delete Staff',
    roleLabel: 'Role & Position',
    activeStatus: 'Operational Status',
    clearHistory: 'Clear Alert Archive',
    confirmClear: 'Are you sure you want to clear all stored alerts?',
    fullBackupTitle: 'Comprehensive System Backup',
    fullBackupDesc: 'Save and export the complete system database including devices, staff, and configuration.',
    restoreBackup: 'Restore System Snapshot',
    backupSuccess: 'Operation completed successfully',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    totalAlerts: 'Total Registered Alerts',
    totalStaff: 'Total Registered Personnel',
    totalDevices: 'Total Certified Terminals',
    quickSimulation: 'Immediate Signal Simulation',
    simCustomerAlert: 'Send Customer Help Signal',
    simITAlert: 'Send VOID Signal',
    simGeneralAlert: 'Send General Notice Signal',
    activeNow: 'Active Now',
    unauthorizedNotice: 'This section is strictly restricted to the System Administrator.',
  }
};

/**
 * Formats alert title accurately according to chosen language:
 * - VOID / Supervisor Authorization -> "Supervisor Authorization Request (VOID)" or "طلب تفويض (VOID)"
 * - Customer Assistance -> "Customer Assistance Request" or "طلب مساعدة زبون"
 * - General Notice -> "General Broadcast Notice" or "نداء وإشعار عام"
 */
export function formatAlertTitle(
  alert: { title?: string; type?: string; deviceId?: string },
  lang: AppLanguage | string = 'ar'
): string {
  const rawTitle = alert.title || '';
  const rawType = (alert.type || '').toString();
  
  const isVoid =
    rawTitle.toUpperCase().includes('VOID') ||
    rawTitle.includes('تفويض') ||
    rawType.toUpperCase() === 'VOID' ||
    alert.type === 'it_support' ||
    rawTitle.includes('دعم') ||
    rawTitle.includes('كمبيوتر') ||
    rawTitle.toLowerCase().includes('it') ||
    rawTitle.toLowerCase().includes('pos');

  const isCust =
    alert.type === 'customer_assistance' ||
    rawTitle.includes('زبون') ||
    rawTitle.includes('مساعدة') ||
    rawTitle.toLowerCase().includes('customer');

  const isGen =
    alert.type === 'general_notice' ||
    rawTitle.includes('عام') ||
    rawTitle.toLowerCase().includes('general');

  if (lang === 'en') {
    if (isVoid) {
      return `Supervisor Authorization (VOID - ${alert.deviceId || 'POS'})`;
    }
    if (isCust) {
      return 'Customer Assistance Request';
    }
    if (isGen) {
      return 'General Broadcast Notice';
    }
    return rawTitle || 'Emergency Alert';
  } else {
    if (isVoid) {
      return `طلب تفويض (VOID - ${alert.deviceId || 'POS'})`;
    }
    if (isCust) {
      return 'طلب مساعدة زبون';
    }
    if (isGen) {
      return 'نداء وإشعار عام';
    }
    return rawTitle || 'تنبيه طوارئ';
  }
}

/**
 * Formats alert message based on chosen language
 */
export function formatAlertMessage(
  alert: { message?: string; type?: string; location?: string },
  lang: AppLanguage | string = 'ar'
): string {
  const rawMsg = alert.message || '';
  
  if (lang === 'en') {
    if (rawMsg.includes('تفويض') || rawMsg.includes('VOID') || rawMsg.includes('إلغاء')) {
      return 'Supervisor authorization required for transaction / VOID at counter.';
    }
    if (rawMsg.includes('زبون') || rawMsg.includes('مساعدة')) {
      return 'Customer is currently present at counter and requires assistance.';
    }
    if (rawMsg.includes('كمبيوتر') || rawMsg.includes('دعم') || rawMsg.includes('عطل')) {
      return 'Technical assistance / system maintenance required at terminal.';
    }
    if (rawMsg.includes('تنبيه تشغيلي')) {
      return 'Operational emergency signal triggered from workstation.';
    }
    return rawMsg;
  } else {
    if (
      rawMsg.toLowerCase().includes('supervisor authorization') ||
      rawMsg.toLowerCase().includes('authorization needed')
    ) {
      return 'مطلوب تفويض المشرف لإتمام عملية الإلغاء (VOID) في الكاونتر.';
    }
    if (
      rawMsg.toLowerCase().includes('customer is currently present') ||
      rawMsg.toLowerCase().includes('requires assistance')
    ) {
      return 'زبون متواجد في الكاونتر ويطلب المساعدة الفورية.';
    }
    if (
      rawMsg.toLowerCase().includes('technical') ||
      rawMsg.toLowerCase().includes('malfunction') ||
      rawMsg.toLowerCase().includes('maintenance required')
    ) {
      return 'بلاغ عطل فني في جهاز الكاشير أو النظام بالصالة.';
    }
    return rawMsg;
  }
}
