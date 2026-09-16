'use client';
/** NE-SAFE i18n — 8 languages. Additive; never hardcode strings in components. */
import { useApp } from '@/store/appStore';

export type NESafeLang = 'en' | 'hi' | 'as' | 'kh' | 'mizo' | 'mni' | 'bn' | 'ne';
export const NE_LANGS: { code: NESafeLang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'as', label: 'অসমীয়া' },
  { code: 'kh', label: 'Khasi' },
  { code: 'mizo', label: 'Mizo' },
  { code: 'mni', label: 'Manipuri' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ne', label: 'नेपाली' },
];

const S: Record<string, Record<NESafeLang, string>> = {
  command_center: { en: 'NE-SAFE Command Center', hi: 'NE-SAFE कमांड सेंटर', as: 'NE-SAFE কমাণ্ড চেণ্টাৰ', kh: 'NE-SAFE Command Center', mizo: 'NE-SAFE Command Center', mni: 'NE-SAFE কমান্ড সেন্টর', bn: 'NE-SAFE কমান্ড সেন্টার', ne: 'NE-SAFE कमाण्ड सेन्टर' },
  demo_mode: { en: 'DEMO / SIMULATION MODE', hi: 'डेमो / सिमुलेशन मोड', as: 'ডেম’ / ছিমুলেশ্যন ম’ড', kh: 'DEMO MODE', mizo: 'DEMO MODE', mni: 'DEMO MODE', bn: 'ডেমো মোড', ne: 'डेमो मोड' },
  live_data: { en: 'LIVE DATA', hi: 'लाइव डेटा', as: 'লাইভ ডাটা', kh: 'LIVE', mizo: 'LIVE', mni: 'LIVE', bn: 'লাইভ', ne: 'लाइभ' },
  risk_score: { en: 'Risk score', hi: 'जोखिम स्कोर', as: 'বিপদৰ স্ক’ৰ', kh: 'Risk score', mizo: 'Risk score', mni: 'Risk score', bn: 'ঝুঁকি স্কোর', ne: 'जोखिम स्कोर' },
  view_location: { en: 'View location', hi: 'स्थान देखें', as: 'স্থান চাওক', kh: 'Peit jaka', mizo: 'Hmun en', mni: 'Mafam yeng-u', bn: 'অবস্থান দেখুন', ne: 'स्थान हेर्नुहोस्' },
  respond: { en: 'Respond', hi: 'प्रतिक्रिया', as: 'সঁহাৰি', kh: 'Leh', mizo: 'Chhang', mni: 'Paokhum', bn: 'সাড়া দিন', ne: 'प्रतिक्रिया' },
  start_sim: { en: '▶ Start simulation', hi: '▶ सिमुलेशन शुरू करें', as: '▶ ছিমুলেশ্যন আৰম্ভ', kh: '▶ Sdang simulation', mizo: '▶ Simulation tan', mni: '▶ Simulation hou', bn: '▶ সিমুলেশন শুরু', ne: '▶ सिमुलेशन सुरु' },
  simulate: { en: 'Simulate', hi: 'सिमुलेट', as: 'ছিমুলেট', kh: 'Simulate', mizo: 'Simulate', mni: 'Simulate', bn: 'সিমুলেট', ne: 'सिमुलेट' },
  why_risk: { en: 'Why did risk increase?', hi: 'जोखिम क्यों बढ़ा?', as: 'বিপদ কিয় বাঢ়িল?', kh: 'Balei risk kiew?', mizo: 'Engatinge risk a san?', mni: 'Risk karigi hen-gৎ?', bn: 'ঝুঁকি কেন বাড়ল?', ne: 'जोखिम किन बढ्यो?' },
  offline: { en: 'Offline', hi: 'ऑफ़लाइन', as: 'অফলাইন', kh: 'Offline', mizo: 'Offline', mni: 'Offline', bn: 'অফলাইন', ne: 'अफलाइन' },
  report_received: { en: 'Report received ✓', hi: 'रिपोर्ट मिली ✓', as: 'প্ৰতিবেদন পোৱা গ’ল ✓', kh: 'La pdi report ✓', mizo: 'Report dawn ✓', mni: 'Report fংle ✓', bn: 'রিপোর্ট পাওয়া গেছে ✓', ne: 'रिपोर्ट प्राप्त ✓' },
};

export function neT(lang: string, key: string): string {
  const row = S[key];
  if (!row) return key;
  return row[lang as NESafeLang] ?? row.en;
}

export function useNEText(): (key: string) => string {
  const app = useApp();
  const lang = app?.lang ?? 'en';
  // appStore currently en/te/hi + NE langs — map te→en fallback for NE strings, keep others
  const mapped = lang === 'te' ? 'en' : lang;
  return (key: string) => neT(mapped, key);
}
