'use client';
/** Telugu-first platform strings (EN + TE). Component code never hard-codes UI text.
 * More languages plug in as extra columns — same pattern as src/i18n/dict.ts.
 */
import { useApp } from '@/store/appStore';

type L2 = { en: string; te: string };
const S: Record<string, L2> = {
  region_title: { en: 'Region Command', te: 'ప్రాంత కమాండ్' },
  region_sub: { en: 'Country → State → District → City. Context drives map, weather, risk, shelters.', te: 'దేశం → రాష్ట్రం → జిల్లా → నగరం. సందర్భం మ్యాప్, వాతావరణం, రిస్క్, శెల్టర్లను నడుపుతుంది.' },
  select_country: { en: 'Country', te: 'దేశం' },
  select_state: { en: 'State', te: 'రాష్ట్రం' },
  select_district: { en: 'District', te: 'జిల్లా' },
  select_city: { en: 'City', te: 'నగరం' },
  context: { en: 'Active context', te: 'ప్రస్తుత సందర్భం' },
  weather_now: { en: 'Weather now', te: 'ప్రస్తుత వాతావరణం' },
  risk_now: { en: 'Risk now', te: 'ప్రస్తుత రిస్క్' },
  shelters_near: { en: 'Shelters nearby', te: 'దగ్గరి శెల్టర్లు' },
  evacuate_now: { en: 'Evacuate immediately from the identified flood-risk zone.', te: 'గుర్తించిన వరద ప్రమాద ప్రాంతం నుండి వెంటనే సురక్షిత ప్రాంతానికి తరలించండి.' },
  call_help: { en: 'Call 112 for rescue. Follow official orders only.', te: 'సహాయం కోసం 112కు కాల్ చేయండి. అధికారిక ఆదేశాలు మాత్రమే పాటించండి.' },
  no_coords: { en: 'No verified coordinates for this area yet — showing national context.', te: 'ఈ ప్రాంతానికి ధృవీకరించిన నిర్దేశాంకాలు లేవు — జాతీయ సందర్భం చూపుతున్నాం.' },
  demo_geo: { en: 'Boundary overlays are schematic until open boundary datasets are wired.', te: 'ఓపెన్ సరిహద్దు డేటా అనుసంధానించే వరకు సరిహద్దులు సూచనాత్మకమే.' },
};

export function usePT(): (key: string) => string {
  const app = useApp();
  const lang = app?.lang ?? 'en';
  return (key: string) => {
    const row = S[key];
    if (!row) return key;
    return lang === 'te' ? row.te : row.en;
  };
}
