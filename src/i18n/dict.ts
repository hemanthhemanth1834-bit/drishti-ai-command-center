'use client';
import { useApp, type Lang } from '@/store/appStore';

/** Central translation dictionary — add keys here, never duplicate pages per language. */
const DICT: Record<string, Record<Lang, string>> = {
  // Nav
  nav_command: { en: 'Command Center', te: 'కమాండ్ సెంటర్', hi: 'कमांड सेंटर' },
  nav_drones: { en: 'Drone Swarm & SAR', te: 'డ్రోన్ దళం', hi: 'ड्रोन दस्ता' },
  nav_twin: { en: '3D Digital Twin', te: '3D డిజిటల్ ట్విన్', hi: '3D डिजिटल ट्विन' },
  nav_location: { en: 'Location Intel', te: 'ప్రదేశ సమాచారం', hi: 'स्थान जानकारी' },
  nav_sim: { en: 'What-If Copilot', te: 'ఏమైతే కో-పైలట్', hi: 'क्या-हो को-पायलट' },
  nav_resources: { en: 'Hospital ICU Command', te: 'ఆసుపత్రి ICU', hi: 'अस्पताल ICU' },
  nav_shelter: { en: 'Shelter Scanner', te: 'శెల్టర్ స్కానర్', hi: 'शेल्टर स्कैनर' },
  nav_reunion: { en: 'OP-MILAN Reunion', te: 'కుటుంబ కలయిక', hi: 'परिवार मिलन' },
  nav_recovery: { en: 'Recovery & Audit', te: 'పునరుద్ధరణ', hi: 'पुनर्वास' },
  nav_portal: { en: 'Citizen Portal', te: 'పౌర పోర్టల్', hi: 'नागरिक पोर्टल' },
  nav_platform: { en: 'Platform Specs', te: 'వ్యవస్థ వివరాలు', hi: 'प्लेटफ़ॉर्म विवरण' },
  nav_safety: { en: 'My Safety', te: 'నా భద్రత', hi: 'मेरी सुरक्षा' },
  nav_risk: { en: 'Check My Risk', te: 'నా రిస్క్ చూడండి', hi: 'मेरा जोखिम जांचें' },
  nav_alerts: { en: 'Alert Center', te: 'హెచ్చరికలు', hi: 'अलर्ट केंद्र' },
  nav_nearby: { en: 'Help Near Me', te: 'దగ్గరి సహాయం', hi: 'नज़दीकी मदद' },
  nav_evacuate: { en: 'Safe Evacuation', te: 'సురక్షిత తరలింపు', hi: 'सुरक्षित निकासी' },
  nav_emergency: { en: 'Emergency', te: 'అత్యవసరం', hi: 'आपातकाल' },
  nav_report: { en: 'Report Incident', te: 'ఘటన నివేదించండి', hi: 'घटना रिपोर्ट करें' },
  nav_family: { en: 'Family Safety', te: 'కుటుంబ భద్రత', hi: 'परिवार सुरक्षा' },
  nav_plan: { en: 'My Emergency Plan', te: 'నా అత్యవసర ప్రణాళిక', hi: 'मेरी आपात योजना' },
  nav_kit: { en: 'Emergency Kit', te: 'అత్యవసర కిట్', hi: 'आपात किट' },
  nav_learn: { en: 'Learn', te: 'నేర్చుకోండి', hi: 'सीखें' },
  nav_talk: { en: 'Talk to Drishti', te: 'దృష్టితో మాట్లాడండి', hi: 'दृष्टि से बात करें' },
  nav_welcome: { en: 'Welcome', te: 'స్వాగతం', hi: 'स्वागत' },
  // Modes
  mode_public: { en: 'PUBLIC MODE', te: 'పబ్లిక్ మోడ్', hi: 'पब्लिक मोड' },
  mode_command: { en: 'COMMAND MODE', te: 'కమాండ్ మోడ్', hi: 'कमांड मोड' },
  // Risk
  risk_title: { en: 'Overall Risk', te: 'మొత్తం రిస్క్', hi: 'कुल जोखिम' },
  risk_check: { en: 'CHECK MY RISK', te: 'నా రిస్క్ చూడండి', hi: 'मेरा जोखिम जांचें' },
  risk_low: { en: 'LOW', te: 'తక్కువ', hi: 'कम' },
  risk_moderate: { en: 'MODERATE', te: 'మధ్యస్థం', hi: 'मध्यम' },
  risk_high: { en: 'HIGH', te: 'ఎక్కువ', hi: 'उच्च' },
  risk_critical: { en: 'CRITICAL', te: 'తీవ్రం', hi: 'गंभीर' },
  risk_action: { en: 'Recommended action', te: 'సిఫార్సు చర్య', hi: 'सुझाई गई कार्रवाई' },
  // Emergency
  emg_title: { en: 'EMERGENCY MODE', te: 'అత్యవసర మోడ్', hi: 'आपातकालीन मोड' },
  emg_call: { en: 'CALL NOW', te: 'ఇప్పుడే కాల్ చేయండి', hi: 'अभी कॉल करें' },
  emg_all: { en: 'Emergency (all-in-one)', te: 'అత్యవసరం (అన్నీ)', hi: 'आपातकाल (सभी)' },
  emg_fire: { en: 'Fire', te: 'అగ్నిమాపక', hi: 'आग' },
  emg_ambulance: { en: 'Ambulance', te: 'అంబులెన్స్', hi: 'एम्बुलेंस' },
  emg_police: { en: 'Police', te: 'పోలీస్', hi: 'पुलिस' },
  emg_disaster: { en: 'Disaster Helpline', te: 'విపత్తు హెల్ప్‌లైన్', hi: 'आपदा हेल्पलाइन' },
  emg_share: { en: 'SHARE MY LOCATION', te: 'నా లొకేషన్ పంచుకోండి', hi: 'मेरी लोकेशन साझा करें' },
  emg_shelter: { en: 'NAVIGATE TO SHELTER', te: 'శెల్టర్‌కు వెళ్లండి', hi: 'शेल्टर तक जाएं' },
  emg_hospital: { en: 'NAVIGATE TO HOSPITAL', te: 'ఆసుపత్రికి వెళ్లండి', hi: 'अस्पताल जाएं' },
  emg_advice: {
    en: 'Stay calm. Move away from danger. Call 112 first, then follow official instructions.',
    te: 'ప్రశాంతంగా ఉండండి. ప్రమాదం నుండి దూరంగా వెళ్లండి. ముందు 112కు కాల్ చేసి, అధికారిక సూచనలు పాటించండి.',
    hi: 'शांत रहें। खतरे से दूर जाएं। पहले 112 पर कॉल करें, फिर आधिकारिक निर्देशों का पालन करें।',
  },
  // Common
  common_loading: { en: 'Loading…', te: 'లోడ్ అవుతోంది…', hi: 'लोड हो रहा है…' },
  common_retry: { en: 'Retry', te: 'మళ్లీ ప్రయత్నించండి', hi: 'पुनः प्रयास करें' },
  common_demo: { en: 'DEMO DATA', te: 'డెమో డేటా', hi: 'डेमो डेटा' },
  common_sim: { en: 'SIMULATION', te: 'అనుకరణ', hi: 'सिमुलेशन' },
  common_live: { en: 'LIVE', te: 'ప్రత్యక్షం', hi: 'लाइव' },
};

export function t(lang: Lang, key: string): string {
  return DICT[key]?.[lang] ?? DICT[key]?.en ?? key;
}

/** Translate with the current app language. */
export function useT(): (key: string) => string {
  const { lang } = useApp();
  return (key: string) => t(lang, key);
}
