/** Reviewed short alert templates — 9 NER languages + English.
Critical life-safety wording uses THESE static templates, never raw MT output.
Keep messages short; placeholders: {place} {prob}.
Codes: en English, hi Hindi, as Assamese, bn Bengali, brx Bodo,
mni Manipuri (Meitei Mayek transliterated Latin-safe), kh Khasi,
mizo Mizo (Lushai), ne Nepali.
*/
export const ALERT_LANGS = [
  { code: 'en', label: 'English' }, { code: 'hi', label: 'हिन्दी' },
  { code: 'as', label: 'অসমীয়া' }, { code: 'bn', label: 'বাংলা' },
  { code: 'brx', label: 'बड़ो' }, { code: 'mni', label: 'Manipuri' },
  { code: 'kh', label: 'Khasi' }, { code: 'mizo', label: 'Mizo' },
  { code: 'ne', label: 'नेपाली' },
] as const;

export type AlertLang = (typeof ALERT_LANGS)[number]['code'];
export type AlertLevel = 'WATCH' | 'ALERT' | 'WARNING' | 'CRITICAL';

const T: Record<AlertLevel, Record<AlertLang, string>> = {
  WATCH: {
    en: 'WATCH: Landslide conditions near {place} are being monitored. Risk {prob}. Stay informed. Helpline 1078.',
    hi: 'निगरानी: {place} के पास भूस्खलन की स्थिति पर नज़र है। जोखिम {prob}। सतर्क रहें। हेल्पलाइन 1078।',
    as: 'নিৰীক্ষণ: {place}ৰ ওচৰত ভূমিস্খলনৰ পৰিস্থিতি নিৰীক্ষণত আছে। বিপদ {prob}। সতৰ্ক থাকক। 1078।',
    bn: 'নজরদারি: {place}-এর কাছে ভূমিধস পরিস্থিতি পর্যবেক্ষণে আছে। ঝুঁকি {prob}। সতর্ক থাকুন। 1078।',
    brx: 'Nuguthai: {place} ni khathiyaw landslide ni khubor nuguthai jadong. Risk {prob}. Helpline 1078.',
    mni: 'Yengsin: {place} gi nakanda landslide gi phibam yengsin touri. Risk {prob}. Helpline 1078.',
    kh: 'Pahara: Ka jingma jong ka jingshlei lum ha {place} dang peit. Risk {prob}. Helpline 1078.',
    mizo: 'Ven: {place} bulah leimin chhiatna awm thei ven a ni. Risk {prob}. Helpline 1078.',
    ne: 'निगरानी: {place} नजिक पहिरो अवस्था निगरानीमा छ। जोखिम {prob}। सतर्क रहनुहोस्। 1078।',
  },
  ALERT: {
    en: 'ALERT: Heightened landslide risk near {place} ({prob}). Avoid steep slopes. Follow official updates. 1078.',
    hi: 'अलर्ट: {place} के पास भूस्खलन का बढ़ा जोखिम ({prob})। खड़ी ढलानों से बचें। आधिकारिक सूचना देखें। 1078।',
    as: 'সতৰ্কবাণী: {place}ৰ ওচৰত ভূমিস্খলনৰ বিপদ বৃদ্ধি ({prob})। ঠিয় গড়া এৰক। চৰকাৰী নিৰ্দেশ মানক। 1078।',
    bn: 'সতর্কতা: {place}-এর কাছে ভূমিধসের ঝুঁকি বেশি ({prob})। খাড়া ঢাল এড়িয়ে চলুন। সরকারি নির্দেশ মানুন। 1078।',
    brx: 'Alert: {place} ni khathiyaw landslide ni risk geder ({prob}). Hajo jougakhou dod. 1078.',
    mni: 'Alert: {place} gi nakanda landslide gi risk henna wangkhatle ({prob}). Chingda chatpa toklasi. 1078.',
    kh: 'Alert: Ka jingma jingshlei lum ha {place} ka la kiew ({prob}). Kiar na ki lum. 1078.',
    mizo: 'Alert: {place} bulah leimin risk a sang ({prob}). Tlang pangah kal suh. 1078.',
    ne: 'अलर्ट: {place} नजिक पहिरो जोखिम बढ्यो ({prob})। भिरालो ठाउँ नजानुहोस्। आधिकारिक सूचना पालना गर्नुहोस्। 1078।',
  },
  WARNING: {
    en: 'WARNING: Dangerous landslide conditions likely near {place} ({prob}). Prepare to move to safe ground. 1078.',
    hi: 'चेतावनी: {place} के पास खतरनाक भूस्खलन स्थिति संभावित ({prob})। सुरक्षित स्थान जाने की तैयारी करें। 1078।',
    as: 'সতৰ্কবাণী: {place}ৰ ওচৰত বিপদজনক ভূমিস্খলনৰ সম্ভাৱনা ({prob})। নিৰাপদ স্থানলৈ যাবলৈ সাজু হওক। 1078।',
    bn: 'সতর্কীকরণ: {place}-এর কাছে বিপজ্জনক ভূমিধসের সম্ভাবনা ({prob})। নিরাপদ স্থানে যাওয়ার প্রস্তুতি নিন। 1078।',
    brx: 'Warning: {place} ni khathiyaw gikhrawi landslide jagwnwi hagw ({prob}). Gwjwn thainwi thang. 1078.',
    mni: 'Warning: {place} gi nakanda akiba landslide thokpa ngamle ({prob}). Achumba mafamda chatnaba semdok-u. 1078.',
    kh: 'Warning: Ka jingma kaba ma ha {place} ({prob}). Pynkhreh ban leit sha jaka shngain. 1078.',
    mizo: 'Warning: {place} bulah leimin hlauhawm a thleng dawn ({prob}). Hmun himah insaseng rawh. 1078.',
    ne: 'चेतावनी: {place} नजिक खतरनाक पहिरो सम्भावना ({prob})। सुरक्षित ठाउँ जाने तयारी गर्नुहोस्। 1078।',
  },
  CRITICAL: {
    en: 'CRITICAL: Move to safe ground NOW near {place} ({prob}). Follow official orders only. Emergency 112 / 1078.',
    hi: 'गंभीर: {place} के पास अभी सुरक्षित स्थान जाएं ({prob})। केवल आधिकारिक आदेश मानें। आपातकाल 112 / 1078।',
    as: 'গুৰুতৰ: {place}ৰ ওচৰত এতিয়াই নিৰাপদ স্থানলৈ যাওক ({prob})। কেৱল চৰকাৰী নিৰ্দেশ মানক। 112 / 1078।',
    bn: 'গুরুতর: {place}-এর কাছে এখনই নিরাপদ স্থানে যান ({prob})। শুধু সরকারি নির্দেশ মানুন। 112 / 1078।',
    brx: 'Critical: {place} ni khathiyaw dakhouna gwjwn thaiyew thing ({prob}). Sarkari bithonkhoulou manw. 112 / 1078.',
    mni: 'Critical: {place} gi nakanda houjik achumba mafamda chatlu ({prob}). Sarkargi yathang khaktamak chatlu. 112 / 1078.',
    kh: 'CRITICAL: Leit sha jaka shngain MYNTA ha {place} ({prob}). Bud tang ki hukum sorkar. 112 / 1078.',
    mizo: 'CRITICAL: {place} bulah TUNAH hmun himah kal rawh ({prob}). Sorkar thu chauh zawm rawh. 112 / 1078.',
    ne: 'गम्भीर: {place} नजिक अहिले नै सुरक्षित ठाउँ जानुहोस् ({prob})। आधिकारिक आदेश मात्र पालना गर्नुहोस्। 112 / 1078।',
  },
};

export function renderAlert(level: AlertLevel, lang: string, place: string, prob: string): string {
  const row = T[level] ?? T.WATCH;
  const tpl = (row as Record<string, string>)[lang] ?? row.en;
  return tpl.replace('{place}', place).replace('{prob}', prob);
}
