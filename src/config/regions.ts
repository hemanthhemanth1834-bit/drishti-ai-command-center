/** Universal region config — mirrors backend seed; DB/API is source of truth at runtime.
 * Add countries/states/districts/cities here AND via API seed; no code changes needed.
 * Coordinates only where confidently known (hasCoords flag). */
export interface RegionNode {
  code: string;
  name: string;
  lat?: number;
  lon?: number;
  coastal?: boolean;
}

export const SHOWCASE = {
  country: 'IN',
  states: ['IN-AP', 'IN-TG'],
} as const;

export const STATE_NAMES: Record<string, string> = {
  'IN-AP': 'Andhra Pradesh',
  'IN-TG': 'Telangana',
};

export const SHOWCASE_CITIES: RegionNode[] = [
  { code: 'IN-AP-KRI-VJA', name: 'Vijayawada', lat: 16.5062, lon: 80.648 },
  { code: 'IN-AP-VSP-VSP', name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185, coastal: true },
  { code: 'IN-AP-GTR-GTR', name: 'Guntur', lat: 16.3067, lon: 80.4365 },
  { code: 'IN-AP-TPT-TPT', name: 'Tirupati', lat: 13.6288, lon: 79.4192 },
  { code: 'IN-AP-KKD-KKD', name: 'Kakinada', lat: 16.9891, lon: 82.2475, coastal: true },
  { code: 'IN-AP-NLR-NLR', name: 'Nellore', lat: 14.4426, lon: 79.9865, coastal: true },
  { code: 'IN-AP-KNL-KNL', name: 'Kurnool', lat: 15.8281, lon: 78.0373 },
  { code: 'IN-TG-HYD-HYD', name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { code: 'IN-TG-WGL-WGL', name: 'Warangal', lat: 17.9689, lon: 79.5941 },
  { code: 'IN-TG-NZB-NZB', name: 'Nizamabad', lat: 18.6725, lon: 78.0941 },
  { code: 'IN-TG-KHM-KHM', name: 'Khammam', lat: 17.2473, lon: 80.1514 },
  { code: 'IN-TG-KRM-KRM', name: 'Karimnagar', lat: 18.4386, lon: 79.1288 },
];

export const FUTURE_COUNTRIES = ['US', 'GB', 'AU', 'JP'] as const;
