import React, { useState } from 'react';
import { 
  Radio, 
  Cpu, 
  Zap, 
  Plus, 
  Edit3, 
  Trash2, 
  Code2, 
  Battery, 
  Activity, 
  CheckCircle2, 
  Power, 
  Copy, 
  Megaphone, 
  Send, 
  BellRing, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { ESP32Device, AlertType } from '../../types';
import { AppLanguage, translations } from '../../lib/i18n';

interface AdminProgramsControlProps {
  devices: ESP32Device[];
  lang: AppLanguage;
  onAddDevice: (device: Omit<ESP32Device, 'id'>) => Promise<void>;
  onUpdateDevice: (device: ESP32Device) => Promise<void>;
  onDeleteDevice: (id: string) => Promise<void>;
  onSendBroadcast: (title: string, message: string, target: 'all' | 'Departures' | 'Arrivals') => Promise<void>;
  onQuickSimulate: (type: 'customer_assistance' | 'it_support') => void;
}

export const AdminProgramsControl: React.FC<AdminProgramsControlProps> = ({
  devices,
  lang,
  onAddDevice,
  onUpdateDevice,
  onDeleteDevice,
  onSendBroadcast,
  onQuickSimulate
}) => {
  const t = translations[lang];

  // Device Modal States
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<ESP32Device | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [deviceIdInput, setDeviceIdInput] = useState('');
  const [deviceLocation, setDeviceLocation] = useState('');
  const [deviceType, setDeviceType] = useState<'Customer Assistance Button' | 'IT Support Button' | 'Dual Alert Console'>('Customer Assistance Button');
  const [deviceStatus, setDeviceStatus] = useState<'Online' | 'Offline'>('Online');
  const [codeModalDevice, setCodeModalDevice] = useState<ESP32Device | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Broadcast States
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'Departures' | 'Arrivals'>('all');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const openAddDeviceModal = () => {
    setEditingDevice(null);
    setDeviceName('');
    setDeviceIdInput(`POS-${Math.floor(100 + Math.random() * 900)}`);
    setDeviceLocation('PN012');
    setDeviceType('Customer Assistance Button');
    setDeviceStatus('Online');
    setIsDeviceModalOpen(true);
  };

  const openEditDeviceModal = (dev: ESP32Device) => {
    setEditingDevice(dev);
    setDeviceName(dev.name);
    setDeviceIdInput(dev.deviceId);
    setDeviceLocation(dev.location);
    setDeviceType(dev.type as any);
    setDeviceStatus(dev.status === 'Online' ? 'Online' : 'Offline');
    setIsDeviceModalOpen(true);
  };

  const handleDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceIdInput.trim() || !deviceName.trim()) return;

    if (editingDevice) {
      await onUpdateDevice({
        ...editingDevice,
        name: deviceName.trim(),
        deviceId: deviceIdInput.trim().toUpperCase(),
        location: deviceLocation.trim().toUpperCase(),
        type: deviceType,
        status: deviceStatus,
      });
    } else {
      await onAddDevice({
        name: deviceName.trim(),
        deviceId: deviceIdInput.trim().toUpperCase(),
        location: deviceLocation.trim().toUpperCase(),
        type: deviceType,
        status: deviceStatus,
        lastPing: new Date().toISOString(),
        apiKey: `mdf_key_${Math.random().toString(36).substring(2, 9)}`,
        batteryLevel: 100,
      });
    }
    setIsDeviceModalOpen(false);
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    try {
      await onSendBroadcast(broadcastTitle.trim(), broadcastMessage.trim(), broadcastTarget);
      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setBroadcastSuccess(false), 4000);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const generateCppCode = (dev: ESP32Device) => {
    return `// ================================================================
// Muscat Duty Free - ESP32 Smart Push Node
// Node ID: ${dev.deviceId} | Location: ${dev.location}
// ================================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid     = "MDF_STAFF_WIFI";
const char* password = "DUTY_FREE_AIRPORT_SECURE";
const char* rtdb_url = "https://mdf-2abd6-default-rtdb.europe-west1.firebasedatabase.app/alerts.json";

const int BUTTON_PIN = 4;
const int LED_PIN    = 2;

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(250); digitalWrite(LED_PIN, !digitalRead(LED_PIN)); }
  digitalWrite(LED_PIN, HIGH);
  Serial.println("MDF Node ${dev.deviceId} Ready!");
}

void triggerAlert() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(rtdb_url);
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<256> doc;
    doc["deviceID"] = "${dev.deviceId}";
    doc["location"] = "${dev.location}";
    doc["type"]     = "${dev.type === 'IT Support Button' ? 'VOID' : 'customer_assistance'}";
    doc["message"]  = "POS ${dev.location} Alert Triggered";
    doc["status"]   = "pending";
    doc["timestamp"]= millis();
    
    String payload;
    serializeJson(doc, payload);
    int httpCode = http.POST(payload);
    http.end();
  }
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BUTTON_PIN) == LOW) {
      triggerAlert();
      delay(2000);
    }
  }
}`;
  };

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Banner: Programs & Hardware Fleet */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              <span>{lang === 'ar' ? 'إدارة البرامج والأنظمة وأجهزة الصالة' : 'Programs & Hardware Fleet Management'}</span>
            </h2>
            <p className="text-xs text-gray-400">
              {lang === 'ar' 
                ? 'التحكم بنقاط الكاشير (POS)، أزرار المساعدة ESP32، نظام تفويض VOID، وبث الإعلانات الفورية.' 
                : 'Manage Cashier POS buttons, ESP32 hardware fleet, VOID subsystem and live announcements.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onQuickSimulate('it_support')}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-[#D2122E] text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"
            >
              <Zap className="w-4 h-4" />
              <span>{lang === 'ar' ? 'محاكاة تفويض VOID' : 'Simulate VOID'}</span>
            </button>
            <button
              onClick={openAddDeviceModal}
              className="px-4 py-2.5 bg-[#D2122E] hover:bg-[#b00e25] text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة جهاز كاشير جديد' : 'Add New Node'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast Announcement Console */}
      <div className="bg-gradient-to-br from-[#181818] to-[#121212] border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>{lang === 'ar' ? 'وحدة البث والإعلانات الفورية لكافة شاشات الموظفين' : 'Live Global Announcement Console'}</span>
          </h3>
          <span className="text-[11px] text-amber-300 font-mono">📢 Live Broadcast</span>
        </div>

        {broadcastSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-xs text-emerald-200 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ar' ? 'تم بث التنبيه بنجاح ووصل لجميع شاشات الموظفين مع إطلاق نغمة التنبيه!' : 'Announcement broadcasted successfully to all connected staff screens!'}</span>
          </div>
        )}

        <form onSubmit={handleBroadcastSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder={lang === 'ar' ? 'عنوان الإعلان أو التنبيه العاجل (مثال: اجتماع فوري في صالة المغادرون)' : 'Announcement Title...'}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <select
                value={broadcastTarget}
                onChange={(e: any) => setBroadcastTarget(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">{lang === 'ar' ? 'كافة الصالات (الكل)' : 'All Terminals'}</option>
                <option value="Departures">{t.hallDepartures}</option>
                <option value="Arrivals">{t.hallArrivals}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2.5">
            <input
              type="text"
              required
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder={lang === 'ar' ? 'نص الرسالة والتفاصيل للموظفين...' : 'Detailed message content...'}
              className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={isBroadcasting}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-[#D2122E] hover:from-amber-500 text-white rounded-xl text-xs font-black shadow flex items-center gap-2 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>{isBroadcasting ? '...' : (lang === 'ar' ? 'بث الإعلان' : 'Broadcast')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ESP32 Hardware Fleet Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-emerald-400" />
          <span>{lang === 'ar' ? 'أجهزة الصالة ونقاط الكاشير (ESP32 Fleet)' : 'ESP32 Hardware Fleet Nodes'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => {
            const isOnline = device.status === 'Online';
            return (
              <div 
                key={device.id} 
                className="bg-[#141414] border border-white/5 hover:border-white/20 rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white">{device.name}</span>
                    </div>
                    <div className="text-xs text-amber-300 font-mono font-bold">{device.location} ({device.deviceId})</div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isOnline 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-gray-500 text-[10px] block">TYPE</span>
                    <span className="text-gray-300 font-bold truncate block">{device.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">BATTERY</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5" />
                      {device.batteryLevel || 98}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setCodeModalDevice(device)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <Code2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>C++ Code</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditDeviceModal(device)}
                      className="p-1.5 bg-white/5 hover:bg-amber-500/20 text-gray-300 hover:text-amber-400 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDevice(device.id)}
                      className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD / EDIT DEVICE MODAL */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white">
              {editingDevice ? (lang === 'ar' ? 'تعديل بيانات نقطة الكاشير' : 'Edit POS Node') : (lang === 'ar' ? 'إضافة نقطة كاشير / جهاز جديد' : 'Add New Node')}
            </h3>

            <form onSubmit={handleDeviceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">{lang === 'ar' ? 'اسم الجهاز / النقطة' : 'Device Name'} *</label>
                <input
                  type="text"
                  required
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="POS Terminal 012"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">{lang === 'ar' ? 'معرف الجهاز (ID)' : 'Device ID'} *</label>
                  <input
                    type="text"
                    required
                    value={deviceIdInput}
                    onChange={(e) => setDeviceIdInput(e.target.value)}
                    placeholder="POS-012"
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">{lang === 'ar' ? 'الموقع والكاشير' : 'Location'} *</label>
                  <input
                    type="text"
                    required
                    value={deviceLocation}
                    onChange={(e) => setDeviceLocation(e.target.value)}
                    placeholder="PN012"
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">{lang === 'ar' ? 'نوع الزر / الجهاز' : 'Type'}</label>
                <select
                  value={deviceType}
                  onChange={(e: any) => setDeviceType(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Customer Assistance Button">Customer Assistance Button (مساعدة زبون)</option>
                  <option value="IT Support Button">IT Support Button / VOID (تفويض وإلغاء)</option>
                  <option value="Dual Alert Console">Dual Alert Console (زر مزدوج)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeviceModalOpen(false)}
                  className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#D2122E] text-white font-bold rounded-xl"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C++ CODE GENERATOR MODAL */}
      {codeModalDevice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                <span>ESP32 Arduino Firmware Code ({codeModalDevice.deviceId})</span>
              </h3>
              <button onClick={() => setCodeModalDevice(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="relative">
              <pre className="bg-black/80 border border-white/10 rounded-2xl p-4 text-xs font-mono text-emerald-300 max-h-[350px] overflow-y-auto" dir="ltr">
                {generateCppCode(codeModalDevice)}
              </pre>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-mono">Compatible with ESP32 WROOM / NodeMCU-32S</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateCppCode(codeModalDevice));
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2500);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedCode ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ كود C++' : 'Copy Code')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
