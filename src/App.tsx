import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { LiveAlerts } from './components/LiveAlerts';
import { AlertHistory } from './components/AlertHistory';
import { WhoIsOnline } from './components/WhoIsOnline';
import { AdminSettings } from './components/AdminSettings';
import { AdminReportsEngine } from './components/admin/AdminReportsEngine';
import { NotificationSettings } from './components/NotificationSettings';
import { IosPwaInstallPrompt } from './components/IosPwaInstallPrompt';
import { EnableNotificationBanner } from './components/EnableNotificationBanner';
import { Code2 } from 'lucide-react';

import { 
  Alert, 
  ESP32Device, 
  StaffUser, 
  AppSettings, 
  AuthUser, 
  AlertStatus, 
  AlertType,
  SoundTone
} from './types';

import { 
  subscribeAlerts, 
  subscribeDevices, 
  subscribeStaff, 
  subscribeSettings, 
  subscribeOnlineUsers,
  setOnlinePresenceInRTDB,
  setOfflinePresenceInRTDB,
  kickUserFromRTDB,
  subscribeKickedStatus,
  clearKickedStatus,
  updateAlertStatusInFirestore, 
  addStaffUserInFirestore, 
  saveSettingsInFirestore, 
  seedInitialFirestoreData, 
  ensureFirebaseAuth,
  DEFAULT_SETTINGS
} from './lib/firebase';

import { audioService } from './lib/audioService';
import { CapacitorNativeService } from './lib/capacitorService';
import { initPushNotifications, syncUserFcmToken, clearUserFcmToken } from './lib/fcm';
import { AppLanguage, translations } from './lib/i18n';

export default function App() {
  const [lang, setLang] = useState<AppLanguage>(() => {
    return (localStorage.getItem('mdf_alert_lang') as AppLanguage) || 'ar';
  });

  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Auth state: check saved user in local storage
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('mdf_logged_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Realtime Collections State
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<ESP32Device[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  
  // Per-user device settings helper
  const getUserSettingsKey = (user: AuthUser | null): string => {
    if (user?.employeeId) {
      return `mdf_user_settings_${user.employeeId}`;
    }
    return 'mdf_app_settings';
  };

  const loadLocalUserSettings = (user: AuthUser | null): AppSettings => {
    try {
      const key = getUserSettingsKey(user);
      const saved = localStorage.getItem(key);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      
      const deviceSaved = localStorage.getItem('mdf_app_settings');
      if (deviceSaved) return { ...DEFAULT_SETTINGS, ...JSON.parse(deviceSaved) };
    } catch {}
    return DEFAULT_SETTINGS;
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const savedUser = localStorage.getItem('mdf_logged_user');
      const user = savedUser ? JSON.parse(savedUser) : null;
      return loadLocalUserSettings(user);
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [responderToast, setResponderToast] = useState<{
    id: string;
    alertId: string;
    responder: string;
    location: string;
    title: string;
  } | null>(null);

  const settingsRef = useRef<AppSettings>(settings);
  const audioMutedRef = useRef<boolean>(audioMuted);

  useEffect(() => {
    settingsRef.current = settings;
    audioService.setVolume(settings.volume);
  }, [settings]);

  useEffect(() => {
    audioMutedRef.current = audioMuted;
  }, [audioMuted]);

  const handleToggleLang = () => {
    const nextLang: AppLanguage = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    localStorage.setItem('mdf_alert_lang', nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  };

  const playAlertChime = useCallback((type: AlertType, overrideTone?: SoundTone) => {
    const currentSettings = settingsRef.current;
    if (!currentSettings.soundEnabled || audioMutedRef.current) return;
    const repeats = currentSettings.soundRepeatCount || 1;
    audioService.setVolume(currentSettings.volume);

    if (overrideTone) {
      audioService.playTone(overrideTone, repeats);
      return;
    }

    if (type === 'customer_assistance' && currentSettings.customerAlertsEnabled) {
      audioService.playCustomerAssistanceSound(currentSettings.customerSound, repeats);
    } else if (type === 'it_support' && currentSettings.itAlertsEnabled) {
      audioService.playITSupportSound(currentSettings.itSound, repeats);
    } else if (type === 'general_notice' && currentSettings.generalAlertsEnabled) {
      audioService.playGeneralSound(currentSettings.generalSound, repeats);
    }
  }, []);

  // Update presence, sync FCM token & load user's personal device settings whenever user logs in or switches
  useEffect(() => {
    if (currentUser) {
      const userSettings = loadLocalUserSettings(currentUser);
      setSettings(userSettings);
      settingsRef.current = userSettings;
      audioService.setVolume(userSettings.volume);

      localStorage.setItem('mdf_logged_user', JSON.stringify(currentUser));
      setOnlinePresenceInRTDB(currentUser);
      syncUserFcmToken(currentUser).catch((e) => console.warn('FCM token sync note:', e));
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      CapacitorNativeService.init().catch(() => {});
      ensureFirebaseAuth().catch(() => {});
      seedInitialFirestoreData().catch(() => {});
      
      // If token already saved, sync it with current user
      if (currentUser) {
        syncUserFcmToken(currentUser).catch(() => {});
      }
    } catch (e) {
      console.warn('Startup initialization note:', e);
    }

    // Listen to token reception on native Android to ensure token is synced
    const unsubToken = CapacitorNativeService.onTokenReceived((token) => {
      console.log('📲 FCM Token received in App:', token);
      if (currentUser) {
        syncUserFcmToken(currentUser).catch(() => {});
      }
    });

    // Check URL parameters for direct notification navigation (?tab=alerts&alertId=...)
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      }
    } catch {}

    // Listen to Web Push Service Worker clicks
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'OPEN_ALERT') {
        console.log('🔔 Web Push click received in window, switching to alerts tab:', event.data.alertId);
        setActiveTab('alerts');
      }
    };
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Listen to push notification clicks (navigate to Alerts tab upon notification tap)
    const unsubNotificationAction = CapacitorNativeService.onNotificationActionPerformed((alertId) => {
      console.log('🔔 Navigating to Alerts tab for alertId:', alertId);
      setActiveTab('alerts');
    });

    // 1. Realtime Database /alerts listener
    const unsubAlerts = subscribeAlerts({
      onChildAdded: (newAlert: Alert, isLive: boolean) => {
        setAlerts((prev) => {
          const exists = prev.some((a) => a.id === newAlert.id);
          if (exists) {
            return prev.map((a) => (a.id === newAlert.id ? newAlert : a));
          }
          const updated = [newAlert, ...prev];
          return updated.sort((a, b) => b.createdAt - a.createdAt);
        });

        // Trigger sound, vibration and native notification immediately upon live new alert with deduplication
        if (isLive && newAlert.status === 'New') {
          const shouldAlert = CapacitorNativeService.shouldProcessAlert(newAlert.id);
          if (shouldAlert) {
            const isVoid = newAlert.title.includes('VOID') || newAlert.type === 'it_support';
            playAlertChime(newAlert.type, isVoid ? 'beep_urgent' : undefined);
            
            if (settingsRef.current.vibrationEnabled) {
              CapacitorNativeService.vibrateAlert(isVoid ? 'urgent' : (newAlert.type === 'it_support' ? 'error' : 'warning'));
            }
            if (settingsRef.current.browserNotificationsEnabled) {
              CapacitorNativeService.scheduleAlertNotification(newAlert);
            }
          }
        }
      },
      onChildChanged: (updatedAlert: Alert) => {
        setAlerts((prev) => {
          const existing = prev.find((a) => a.id === updatedAlert.id);
          const responderName = updatedAlert.viewedBy || (updatedAlert as any).responder;
          const statusIsSeen = updatedAlert.status === 'Seen';
          const previouslyNotSeen = existing ? existing.status !== 'Seen' : true;

          // When a colleague accepts / goes to solve the alert
          if (statusIsSeen && previouslyNotSeen && responderName) {
            // Informative sound chime
            if (settingsRef.current.soundEnabled && !audioMutedRef.current) {
              audioService.playTone('melody_up', 1);
            }
            // Haptic feedback
            if (settingsRef.current.vibrationEnabled) {
              CapacitorNativeService.vibrateAlert('warning');
            }
            // Device Local Notification
            if (settingsRef.current.browserNotificationsEnabled) {
              CapacitorNativeService.scheduleResponderNotification(updatedAlert, responderName);
            }

            // In-app interactive toast notification
            setResponderToast({
              id: `${updatedAlert.id}_${Date.now()}`,
              alertId: updatedAlert.id,
              responder: responderName,
              location: updatedAlert.location || updatedAlert.deviceId,
              title: updatedAlert.title,
            });

            setTimeout(() => {
              setResponderToast((cur) => (cur && cur.alertId === updatedAlert.id ? null : cur));
            }, 6500);
          }

          return prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a));
        });
      },
      onChildRemoved: (alertId: string) => {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    });

    const unsubDevices = subscribeDevices((devs) => setDevices(devs));
    const unsubStaff = subscribeStaff((st) => setStaffList(st));
    const unsubOnline = subscribeOnlineUsers((users) => setOnlineUsers(users));
    const unsubSettings = subscribeSettings((sett) => {
      try {
        const userKey = getUserSettingsKey(currentUser);
        const userSaved = localStorage.getItem(userKey) || localStorage.getItem('mdf_app_settings');
        if (userSaved) {
          const parsed = JSON.parse(userSaved);
          const merged = { ...sett, ...parsed };
          setSettings(merged);
          settingsRef.current = merged;
          audioService.setVolume(merged.volume);
          return;
        }
      } catch {}
      setSettings(sett);
      settingsRef.current = sett;
      audioService.setVolume(sett.volume);
    });

    return () => {
      unsubToken();
      unsubNotificationAction();
      unsubAlerts();
      unsubDevices();
      unsubStaff();
      unsubOnline();
      unsubSettings();
    };
  }, [playAlertChime, currentUser]);

  const [autoLogoutMsg, setAutoLogoutMsg] = useState<string>('');

  // 10-Hour Auto-Logout Timer for active staff session
  useEffect(() => {
    if (!currentUser) return;

    // Check if session start time exists, else initialize
    let sessionStart = localStorage.getItem('mdf_session_start_time');
    if (!sessionStart) {
      sessionStart = Date.now().toString();
      localStorage.setItem('mdf_session_start_time', sessionStart);
    }

    const checkSessionExpiry = () => {
      const startTime = parseInt(localStorage.getItem('mdf_session_start_time') || '0', 10);
      const MAX_SESSION_DURATION = 10 * 60 * 60 * 1000; // 10 Hours in milliseconds

      if (startTime > 0 && Date.now() - startTime >= MAX_SESSION_DURATION) {
        console.warn('⚠️ 10-hour session limit exceeded. Auto-logging out user.');
        setAutoLogoutMsg(
          lang === 'ar' 
            ? 'تم تسجيل خروجك تلقائياً لتجاوز مدة المناوبة القصوى (10 ساعات). يرجى إعادة تسجيل الدخول.' 
            : 'You have been automatically logged out because your session reached the 10-hour limit. Please log in again.'
        );
        handleLogout();
      }
    };

    // Run check immediately and every minute
    checkSessionExpiry();
    const interval = setInterval(checkSessionExpiry, 60000);

    return () => clearInterval(interval);
  }, [currentUser, lang]);

  // Remote Kick / Force Disconnect listener for current session
  useEffect(() => {
    if (!currentUser) return;
    const userIdentifier = currentUser.uid || currentUser.employeeId;
    const unsub = subscribeKickedStatus(userIdentifier, async (kickData) => {
      console.warn('⚠️ User session was kicked by Admin:', kickData);
      await clearKickedStatus(userIdentifier);
      setAutoLogoutMsg(
        lang === 'ar'
          ? `تم إنهاء وطرد جلستك من النظام بواسطة مسؤول النظام (${kickData.kickedBy || 'Zico'}).`
          : `Your session was terminated by System Admin (${kickData.kickedBy || 'Zico'}).`
      );
      handleLogout();
    });

    return () => {
      unsub();
    };
  }, [currentUser, lang]);

  const handleKickUser = async (uidOrEmpId: string, name: string) => {
    const adminName = currentUser ? currentUser.displayName : 'Zico (Admin)';
    await kickUserFromRTDB(uidOrEmpId, adminName);
  };

  const handleToggleMute = () => {
    const nextMute = !audioMuted;
    setAudioMuted(nextMute);
    audioService.setMuted(nextMute);
  };

  const handleLoginSuccess = async (user: AuthUser) => {
    setAutoLogoutMsg('');
    localStorage.setItem('mdf_session_start_time', Date.now().toString());
    setCurrentUser(user);
    // Automatically register staff user if not already in directory
    const existing = staffList.find(s => s.employeeId === user.employeeId);
    if (!existing && user.role !== 'Admin') {
      addStaffUserInFirestore({
        name: user.displayName,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role as any,
        department: user.department || (lang === 'ar' ? 'صالة المغادرون' : 'Departures'),
        active: true,
      });
    }
    await syncUserFcmToken(user);
  };

  const handleLogout = async () => {
    if (currentUser) {
      await clearUserFcmToken(currentUser);
      await setOfflinePresenceInRTDB(currentUser.uid || currentUser.employeeId);
    }
    localStorage.removeItem('mdf_logged_user');
    localStorage.removeItem('mdf_session_start_time');
    setCurrentUser(null);
  };

  const handleUpdateStatus = async (alertId: string, status: AlertStatus, notes?: string) => {
    const staffName = currentUser ? currentUser.displayName : (lang === 'ar' ? 'موظف الصالة' : 'Staff');
    await updateAlertStatusInFirestore(alertId, status, staffName, notes);
  };

  const handleSaveSettings = async (newSettings: AppSettings, isGlobalAdminSync: boolean = false) => {
    try {
      const userKey = getUserSettingsKey(currentUser);
      localStorage.setItem(userKey, JSON.stringify(newSettings));
      localStorage.setItem('mdf_app_settings', JSON.stringify(newSettings));
    } catch {}
    setSettings(newSettings);
    settingsRef.current = newSettings;
    audioService.setVolume(newSettings.volume);

    // Only sync to cloud database if Admin explicitly chooses to save global system defaults
    if (isGlobalAdminSync && currentUser?.role === 'Admin') {
      try {
        await saveSettingsInFirestore(newSettings);
      } catch (e) {
        console.warn('Could not sync global settings to database:', e);
      }
    }
  };

  // If user is not logged in on startup, show Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        staffList={staffList}
        onLoginSuccess={handleLoginSuccess}
        currentLang={lang}
        onToggleLang={handleToggleLang}
        autoLogoutMessage={autoLogoutMsg}
      />
    );
  }

  const unreadCount = alerts.filter(a => a.status === 'New').length;
  const staffOnlineList = onlineUsers.length > 0 ? onlineUsers : [
    {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      employeeId: currentUser.employeeId,
      department: currentUser.department || (lang === 'ar' ? 'صالة المغادرون' : 'Departures'),
      role: currentUser.role,
      lastSeen: lang === 'ar' ? 'الآن' : 'Now',
      online: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans antialiased selection:bg-[#D2122E] selection:text-white flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onOpenLogin={() => {}}
        onLogout={handleLogout}
        unreadCount={unreadCount}
        audioMuted={audioMuted}
        onToggleMute={handleToggleMute}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        volume={settings.volume}
        onVolumeChange={(vol) => handleSaveSettings({ ...settings, volume: vol })}
        lang={lang}
        onToggleLang={handleToggleLang}
        onlineUsersCount={staffOnlineList.length}
      />

      {/* Floating Responder Alert Notification Banner */}
      {responderToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg transition-all animate-bounce">
          <div className="bg-gradient-to-r from-blue-900/95 via-indigo-900/95 to-slate-900/95 border border-blue-400/40 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 ring-2 ring-blue-500/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0 text-xl shadow-inner">
                🏃‍♂️
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-blue-200 truncate">{responderToast.responder}</span>
                  <span className="text-[10px] bg-blue-500/30 text-blue-100 font-bold px-2 py-0.5 rounded-full border border-blue-400/30 whitespace-nowrap">
                    {lang === 'ar' ? 'ذاهب للحل' : 'On the way'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-300 mt-0.5 font-medium truncate">
                  {lang === 'ar' 
                    ? `استلم البلاغ [${responderToast.location}] وجارٍ التوجه للمعالجة`
                    : `Attending to alert at [${responderToast.location}]`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                onClick={() => {
                  setActiveTab('alerts');
                  setResponderToast(null);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white rounded-xl shadow transition-all whitespace-nowrap"
              >
                {lang === 'ar' ? 'عرض' : 'View'}
              </button>
              <button 
                onClick={() => setResponderToast(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"
                title="إغلاق"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Prominent Enable Notifications Banner (displays when push is not yet enabled) */}
        <EnableNotificationBanner 
          currentUser={currentUser} 
          lang={lang} 
          onOpenSettings={() => setActiveTab('settings')} 
        />

        {/* iOS Safari PWA 6-step prompt (shows only when browsing in Safari on iOS) */}
        <IosPwaInstallPrompt lang={lang} />
        
        {activeTab === 'dashboard' && (
          <Dashboard
            alerts={alerts}
            devices={devices}
            currentUser={currentUser}
            onSelectTab={setActiveTab}
            onUpdateStatus={handleUpdateStatus}
            onPlaySound={(type) => playAlertChime(type)}
            staffName={currentUser.displayName}
            lang={lang}
            onlineStaff={staffOnlineList}
          />
        )}

        {activeTab === 'alerts' && (
          <LiveAlerts
            alerts={alerts}
            currentUser={currentUser}
            onUpdateStatus={handleUpdateStatus}
            onPlaySound={(type) => playAlertChime(type)}
            staffName={currentUser.displayName}
            lang={lang}
          />
        )}

        {/* Dedicated "Who is Online (من متواجد الآن)" Tab */}
        {activeTab === 'who_is_online' && (
          <WhoIsOnline
            currentUser={currentUser}
            onlineStaff={staffOnlineList}
            devices={devices}
            onKickUser={handleKickUser}
            lang={lang}
          />
        )}

        {/* Dedicated "Reports (التقارير)" Tab */}
        {activeTab === 'reports' && (
          <AdminReportsEngine
            alerts={alerts}
            devices={devices}
            staffList={staffList}
            onlineStaff={staffOnlineList}
            lang={lang}
          />
        )}

        {activeTab === 'history' && (
          <AlertHistory alerts={alerts} currentUser={currentUser} lang={lang} />
        )}

        {activeTab === 'settings' && (
          <NotificationSettings
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onTestSound={(type) => playAlertChime(type)}
            lang={lang}
            currentUser={currentUser}
          />
        )}

        {/* Super Admin Control Panel (zico) */}
        {activeTab === 'admin' && (
          <AdminSettings
            currentUser={currentUser}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onTestSound={(type) => playAlertChime(type)}
            alerts={alerts}
            devices={devices}
            staffList={staffList}
            lang={lang}
          />
        )}

      </main>

      {/* Footer with official Muscat Duty Free branding & Developer Zakariya Alkhaldi */}
      <footer className="bg-[#0F0F0F] border-t border-white/5 py-4 px-6 text-center text-xs text-gray-500" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="tracking-wide text-gray-400 font-bold">
            {lang === 'ar' ? '© السوق الحرة مسقط' : '© Muscat Duty Free'}
          </span>
          <div className="flex items-center gap-2 text-gray-300 font-medium">
            <Code2 className="w-4 h-4 text-[#F5A623]" />
            <span>{t.developerCredit}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
