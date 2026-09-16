/** Multi-sector disaster taxonomy (mirrors backend seed). Sectors group disaster types. */
export interface DisasterType {
  code: string;
  sector: string;
  name_en: string;
  name_te: string;
}

export const SECTORS: { code: string; name_en: string; name_te: string }[] = [
  { code: 'natural', name_en: 'Natural disasters', name_te: 'ప్రకృతి విపత్తులు' },
  { code: 'urban', name_en: 'Urban emergencies', name_te: 'పట్టణ అత్యవసరాలు' },
  { code: 'industrial', name_en: 'Industrial / technological', name_te: 'పారిశ్రామిక / సాంకేతిక' },
  { code: 'health', name_en: 'Public health', name_te: 'ప్రజారోగ్యం' },
  { code: 'agri', name_en: 'Agriculture / rural', name_te: 'వ్యవసాయం / గ్రామీణ' },
  { code: 'coastal', name_en: 'Coastal', name_te: 'తీరప్రాంతం' },
  { code: 'transport', name_en: 'Transportation', name_te: 'రవాణా' },
];

export const DISASTERS: DisasterType[] = [
  { code: 'cyclone', sector: 'coastal', name_en: 'Cyclone', name_te: 'తుఫాను' },
  { code: 'flood', sector: 'natural', name_en: 'Flood', name_te: 'వరద' },
  { code: 'flash_flood', sector: 'natural', name_en: 'Flash flood', name_te: 'ఆకస్మిక వరద' },
  { code: 'heavy_rain', sector: 'natural', name_en: 'Heavy rainfall', name_te: 'భారీ వర్షం' },
  { code: 'landslide', sector: 'natural', name_en: 'Landslide', name_te: 'కొండచరియలు విరిగిపడటం' },
  { code: 'heatwave', sector: 'natural', name_en: 'Heatwave', name_te: 'వడగాలులు' },
  { code: 'earthquake', sector: 'natural', name_en: 'Earthquake', name_te: 'భూకంపం' },
  { code: 'drought', sector: 'agri', name_en: 'Drought', name_te: 'కరువు' },
  { code: 'fire', sector: 'urban', name_en: 'Major fire', name_te: 'భారీ అగ్నిప్రమాదం' },
  { code: 'building_collapse', sector: 'urban', name_en: 'Building collapse', name_te: 'భవనం కూలిపోవడం' },
  { code: 'road_accident', sector: 'transport', name_en: 'Major road accident', name_te: 'రోడ్డు ప్రమాదం' },
  { code: 'power_failure', sector: 'urban', name_en: 'Power failure', name_te: 'విద్యుత్ అంతరాయం' },
  { code: 'storm_surge', sector: 'coastal', name_en: 'Storm surge', name_te: 'తుఫాను ఉప్పెన' },
  { code: 'chemical', sector: 'industrial', name_en: 'Chemical incident', name_te: 'రసాయన ప్రమాదం' },
  { code: 'health_alert', sector: 'health', name_en: 'Health emergency', name_te: 'ఆరోగ్య అత్యవసరం' },
];

export const AGENCIES: { code: string; name: string; scope: string }[] = [
  { code: 'AP-SDMA', name: 'AP State Disaster Management Authority', scope: 'state' },
  { code: 'TG-SDMA', name: 'Telangana Disaster Management Authority', scope: 'state' },
  { code: 'DIST-ADM', name: 'District Administration', scope: 'district' },
  { code: 'MUNICIPAL', name: 'Municipal Authority', scope: 'municipal' },
  { code: 'POLICE', name: 'Police (100)', scope: 'district' },
  { code: 'FIRE', name: 'Fire & Emergency Services (101)', scope: 'district' },
  { code: 'HEALTH', name: 'Health Dept / Hospitals (108)', scope: 'district' },
  { code: 'SDRF', name: 'State Disaster Response Force', scope: 'state' },
  { code: 'NGO', name: 'Relief NGOs & Volunteers', scope: 'local' },
];
