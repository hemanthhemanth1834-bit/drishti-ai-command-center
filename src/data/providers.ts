/** Free-data architecture: clean provider interfaces + labeled demo datasets.
 *  Swap any demo provider with an official API later without touching pages.
 *  NOTHING here is presented as a real emergency warning — all demo rows carry
 *  source: 'DEMO' and an updated stamp.
 */

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export const RISK_META: Record<
  RiskLevel,
  { color: string; bg: string; label: string }
> = {
  low: { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/40', label: 'LOW' },
  moderate: { color: 'text-yellow-300', bg: 'bg-yellow-500/15 border-yellow-500/40', label: 'MODERATE' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/40', label: 'HIGH' },
  critical: { color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/40', label: 'CRITICAL' },
};

export type HazardType =
  | 'flood' | 'cyclone' | 'earthquake' | 'fire'
  | 'landslide' | 'heat' | 'lightning' | 'industrial';

export type HazardZone = {
  id: string;
  type: HazardType;
  label: string;
  lat: number;
  lon: number;
  radiusKm: number;
  level: RiskLevel;
  note: string;
  factors: string[];
  confidence: number;
  source: 'DEMO' | 'SIMULATION';
  updated: string;
};

export type FacilityKind = 'shelter' | 'hospital' | 'police' | 'fire' | 'relief';

export type Facility = {
  id: string;
  kind: FacilityKind;
  name: string;
  lat: number;
  lon: number;
  status: string;
  detail: string;
  source: 'DEMO';
};

export type OfficialAlert = {
  id: string;
  category: 'info' | 'watch' | 'warning' | 'critical';
  title: string;
  area: string;
  issued: string;
  action: string;
  source: 'DEMO';
};

/** Configurable emergency numbers (India defaults — edit here, never hardcoded in pages). */
export const EMERGENCY_NUMBERS: { key: string; number: string }[] = [
  { key: 'emg_all', number: '112' },
  { key: 'emg_fire', number: '101' },
  { key: 'emg_ambulance', number: '108' },
  { key: 'emg_police', number: '100' },
  { key: 'emg_disaster', number: '1078' },
];

const STAMP = 'DEMO feed · updated 10 min ago';

/** Labeled simulation hazard zones (Krishna basin + Hyderabad low-lying cells). */
export const DEMO_HAZARDS: HazardZone[] = [
  { id: 'hz-flood-1', type: 'flood', label: 'Prakasam Barrage flood cell', lat: 16.512, lon: 80.648, radiusKm: 6, level: 'high', note: 'Simulated discharge above 45k cusecs; riverside wards may inundate.', factors: ['Heavy rainfall (simulated)', 'Rising water level', 'Low-lying terrain', 'Blocked drainage'], confidence: 86, source: 'SIMULATION', updated: STAMP },
  { id: 'hz-flood-2', type: 'flood', label: 'Musi riverside watch cell', lat: 17.3757, lon: 78.4669, radiusKm: 4, level: 'moderate', note: 'Simulated monsoon runoff; bund road under watch.', factors: ['Monsoon runoff (simulated)', 'Narrow channel'], confidence: 72, source: 'SIMULATION', updated: STAMP },
  { id: 'hz-heat-1', type: 'heat', label: 'Urban heat island', lat: 17.385, lon: 78.4867, radiusKm: 8, level: 'moderate', note: 'Simulated 44°C peak; outdoor workers at risk 12–4pm.', factors: ['Extreme temperature (simulated)', 'High humidity'], confidence: 78, source: 'SIMULATION', updated: STAMP },
  { id: 'hz-cyc-1', type: 'cyclone', label: 'Bay storm track (demo)', lat: 15.9, lon: 81.2, radiusKm: 60, level: 'high', note: 'Demo cyclonic track; coastal districts in drill mode.', factors: ['Demo track cone', 'Storm surge (simulated)'], confidence: 64, source: 'DEMO', updated: STAMP },
  { id: 'hz-fire-1', type: 'fire', label: 'Industrial belt fire risk', lat: 17.42, lon: 78.5, radiusKm: 3, level: 'low', note: 'No active fire. Chemical storage audit due.', factors: ['Chemical storage', 'Summer dryness (simulated)'], confidence: 58, source: 'DEMO', updated: STAMP },
  { id: 'hz-quake-1', type: 'earthquake', label: 'Seismic Zone II baseline', lat: 17.4, lon: 78.47, radiusKm: 25, level: 'low', note: 'Low seismicity region. Standard preparedness applies.', factors: ['Zone II classification'], confidence: 90, source: 'DEMO', updated: STAMP },
  { id: 'hz-land-1', type: 'landslide', label: 'Hill-slope watch', lat: 17.45, lon: 78.38, radiusKm: 2, level: 'low', note: 'No slide reported. Avoid cut slopes after heavy rain.', factors: ['Steep cut slopes'], confidence: 61, source: 'DEMO', updated: STAMP },
  { id: 'hz-light-1', type: 'lightning', label: 'Thunderstorm cell (demo)', lat: 17.3, lon: 78.55, radiusKm: 10, level: 'moderate', note: 'Demo storm cell; stay indoors during lightning.', factors: ['Convective cell (simulated)'], confidence: 55, source: 'DEMO', updated: STAMP },
  { id: 'hz-ind-1', type: 'industrial', label: 'Chemical cluster buffer', lat: 17.43, lon: 78.51, radiusKm: 2, level: 'low', note: 'No leak reported. Know the siren drill route.', factors: ['Hazmat storage'], confidence: 66, source: 'DEMO', updated: STAMP },
];

export const DEMO_FACILITIES: Facility[] = [
  { id: 'sh-1', kind: 'shelter', name: 'City Sports Complex', lat: 17.395, lon: 78.472, status: 'OPEN · 74% full', detail: 'Capacity 2,000 · medical desk · water', source: 'DEMO' },
  { id: 'sh-2', kind: 'shelter', name: 'Riverbend Hall', lat: 17.368, lon: 78.49, status: 'OPEN · 41% full', detail: 'Capacity 800 · family zone', source: 'DEMO' },
  { id: 'sh-3', kind: 'shelter', name: 'Cantonment Ground', lat: 17.42, lon: 78.47, status: 'STANDBY', detail: 'Opens on LEVEL-2+ alert', source: 'DEMO' },
  { id: 'hp-1', kind: 'hospital', name: 'District General #07', lat: 17.39, lon: 78.48, status: 'ICU 3 free · Vent 2 free', detail: 'Trauma + hypothermia intake', source: 'DEMO' },
  { id: 'hp-2', kind: 'hospital', name: 'Riverside Medical', lat: 17.372, lon: 78.46, status: 'ICU 5 free · Vent 4 free', detail: 'General + pediatric', source: 'DEMO' },
  { id: 'po-1', kind: 'police', name: 'Central Control Room', lat: 17.385, lon: 78.47, status: 'Dial 100 / 112', detail: '24×7 dispatch', source: 'DEMO' },
  { id: 'fs-1', kind: 'fire', name: 'Fire Station No. 4', lat: 17.378, lon: 78.478, status: 'Dial 101', detail: '2 tenders ready (demo)', source: 'DEMO' },
  { id: 'rc-1', kind: 'relief', name: 'Ward 14 Relief Depot', lat: 17.382, lon: 78.465, status: 'OPEN 8am–8pm', detail: 'Ration + water + tarps (demo)', source: 'DEMO' },
];

export const DEMO_ALERTS: OfficialAlert[] = [
  { id: 'al-1', category: 'critical', title: 'FLOOD WARNING (drill)', area: 'Krishna Basin Sector 04', issued: 'Today 06:30', action: 'Move to a safe/high area. Carry documents + water.', source: 'DEMO' },
  { id: 'al-2', category: 'warning', title: 'Heat wave watch (drill)', area: 'Hyderabad urban', issued: 'Today 08:00', action: 'Avoid sun 12–4pm. Drink water. Check on elders.', source: 'DEMO' },
  { id: 'al-3', category: 'watch', title: 'Thunderstorm watch (drill)', area: 'East sector', issued: 'Today 09:15', action: 'Stay indoors during lightning. Unplug appliances.', source: 'DEMO' },
  { id: 'al-4', category: 'info', title: 'Mock drill Sunday', area: 'City Sports Complex', issued: 'Yesterday', action: 'Volunteers report at 9am with ID.', source: 'DEMO' },
];

/** Provider interfaces — implement against official APIs later. */
export interface HazardDataProvider { zones(): Promise<HazardZone[]>; }
export interface ShelterDataProvider { list(): Promise<Facility[]>; }
export interface AlertDataProvider { latest(): Promise<OfficialAlert[]>; }
export interface WeatherDataProvider { now(lat: number, lon: number): Promise<WeatherNow>; }
export interface HospitalDataProvider { list(): Promise<Facility[]>; }
export interface EvacuationDataProvider { routes(fromLat: number, fromLon: number): Promise<EvacRoute[]>; }
export interface IncidentDataProvider { list(): Promise<StoredIncident[]>; }
export interface DroneDataProvider { fleet(): Promise<DroneUnit[]>; }

export type WeatherNow = {
  tempC: number;
  condition: string;
  humidity: number;
  windKmh: number;
  source: 'DEMO';
  updated: string;
};

export type EvacRoute = {
  id: string;
  mode: 'fastest' | 'safest' | 'walking' | 'vehicle';
  toName: string;
  distanceKm: number;
  etaMin: number;
  risk: RiskLevel;
  note: string;
  source: 'SIMULATION';
};

export type StoredIncident = {
  id: string;
  type: string;
  desc: string;
  lat?: number;
  lon?: number;
  time: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  status: 'SUBMITTED' | 'UNDER REVIEW' | 'VERIFIED' | 'RESPONDED' | 'RESOLVED';
};

export type DroneUnit = {
  id: string;
  mission: string;
  battery: number;
  status: 'AIRBORNE' | 'STAGED' | 'RTB' | 'CHARGING';
  source: 'SIMULATION';
};

export const demoWeatherProvider: WeatherDataProvider = {
  now: async () => ({ tempC: 34, condition: 'Hot & humid (demo)', humidity: 62, windKmh: 14, source: 'DEMO', updated: STAMP }),
};
export const demoHospitalProvider: HospitalDataProvider = {
  list: async () => DEMO_FACILITIES.filter((f) => f.kind === 'hospital'),
};
export const demoEvacProvider: EvacuationDataProvider = {
  routes: async () => [],
};
export const demoDroneProvider: DroneDataProvider = {
  fleet: async () => [
    { id: 'DRX-01', mission: 'FLIR recon — Ward 14', battery: 82, status: 'AIRBORNE', source: 'SIMULATION' },
    { id: 'DRX-04', mission: 'Med-kit standby', battery: 100, status: 'STAGED', source: 'SIMULATION' },
    { id: 'DRX-07', mission: 'LoRa relay + SAR', battery: 76, status: 'AIRBORNE', source: 'SIMULATION' },
    { id: 'DRX-11', mission: 'Survey — returning', battery: 34, status: 'RTB', source: 'SIMULATION' },
  ],
};

export const demoHazardProvider: HazardDataProvider = {
  zones: async () => DEMO_HAZARDS,
};
export const demoShelterProvider: ShelterDataProvider = {
  list: async () => DEMO_FACILITIES,
};
export const demoAlertProvider: AlertDataProvider = {
  latest: async () => DEMO_ALERTS,
};
