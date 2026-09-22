// ==========================================================
// قائمة كل الأجهزة المعتمدة في شبكة سوق مسقط الحرة
// ==========================================================
export const ALL_DEVICES: string[] = [
  // الأجهزة المتسلسلة (PN012 إلى PN033)
  ...Array.from({ length: 22 }, (_, i) => `PN${String(i + 12).padStart(3, '0')}`),
  
  // أضف أي أسماء أو أرقام عشوائية إضافية هنا:
  "PN-VIP-01",
  "POS-GATE-3"
];

/**
 * معرفة هل الجهاز اونلاين ومعتمد من خلال اسمه فقط
 */
export function isDeviceApprovedOnline(deviceNameOrId: string): boolean {
  if (!deviceNameOrId) return false;
  const clean = deviceNameOrId.trim().toUpperCase();
  return ALL_DEVICES.some(dev => {
    const devUpper = dev.toUpperCase();
    return clean === devUpper || clean.includes(devUpper) || devUpper.includes(clean);
  });
}
