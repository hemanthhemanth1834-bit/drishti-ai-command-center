/**
 * NE-SAFE AI — Northeast India demo geography.
 * Realistic-looking but clearly SIMULATED sample data.
 * No real current incidents are claimed.
 */

export type NEState =
  | 'Assam' | 'Arunachal Pradesh' | 'Meghalaya' | 'Manipur'
  | 'Mizoram' | 'Nagaland' | 'Sikkim' | 'Tripura';

export interface NESlope {
  id: string;
  name: string;
  district: string;
  state: NEState;
  lat: number; lon: number;
  elevationM: number;
  slopeDeg: number;
  baseRisk: number; // 0-100 starting point for gradual sim
  populationExposed: number;
  road: string;
}

export interface NESensorMeta {
  id: string;
  slopeId: string;
  lat: number; lon: number;
}

export interface NERoad {
  id: string;
  name: string;
  from: string; to: string;
  path: [number, number][]; // [lon, lat]
  status: 'OPEN' | 'CAUTION' | 'HIGH RISK' | 'CLOSED';
  slopeId: string;
}

export interface NEFacility {
  id: string;
  kind: 'hospital' | 'emergency' | 'bridge' | 'village' | 'shelter';
  name: string;
  lat: number; lon: number;
  detail: string;
}

export const NE_SLOPES: NESlope[] = [
  { id: 'AS-01', name: 'Kamrup Hillslope', district: 'Kamrup Metro', state: 'Assam', lat: 26.1445, lon: 91.7362, elevationM: 240, slopeDeg: 28, baseRisk: 24, populationExposed: 1500, road: 'Guwahati–Shillong Rd' },
  { id: 'AR-01', name: 'Tawang Valley Slope', district: 'Tawang', state: 'Arunachal Pradesh', lat: 27.5862, lon: 91.8639, elevationM: 3100, slopeDeg: 38, baseRisk: 42, populationExposed: 620, road: 'Tawang–Bomdila Rd' },
  { id: 'MEG-01', name: 'East Khasi Hills Escarpment', district: 'East Khasi Hills', state: 'Meghalaya', lat: 25.5788, lon: 91.8933, elevationM: 1496, slopeDeg: 41, baseRisk: 52, populationExposed: 1500, road: 'Shillong–Dawki Rd' },
  { id: 'MEG-02', name: 'Cherrapunji Plateau Edge', district: 'East Khasi Hills', state: 'Meghalaya', lat: 25.2700, lon: 91.7320, elevationM: 1318, slopeDeg: 36, baseRisk: 47, populationExposed: 890, road: 'Shillong–Cherrapunji Rd' },
  { id: 'MN-01', name: 'Senapati Ridge', district: 'Senapati', state: 'Manipur', lat: 25.2678, lon: 94.0256, elevationM: 1450, slopeDeg: 33, baseRisk: 31, populationExposed: 740, road: 'Imphal–Kohima Rd (NH-2)' },
  { id: 'MZ-01', name: 'Aizawl City Slope', district: 'Aizawl', state: 'Mizoram', lat: 23.7271, lon: 92.7176, elevationM: 1132, slopeDeg: 35, baseRisk: 44, populationExposed: 2100, road: 'Aizawl–Silchar Rd' },
  { id: 'NL-01', name: 'Kohima Hill Flank', district: 'Kohima', state: 'Nagaland', lat: 25.6751, lon: 94.1086, elevationM: 1444, slopeDeg: 30, baseRisk: 28, populationExposed: 980, road: 'Kohima–Dimapur Rd' },
  { id: 'SK-01', name: 'Gangtok Ridge Spur', district: 'Gangtok', state: 'Sikkim', lat: 27.3389, lon: 88.6065, elevationM: 1650, slopeDeg: 39, baseRisk: 49, populationExposed: 1320, road: 'Gangtok–Nathula Rd' },
  { id: 'TR-01', name: 'Jampui Hills Scarp', district: 'North Tripura', state: 'Tripura', lat: 24.0500, lon: 92.2700, elevationM: 930, slopeDeg: 29, baseRisk: 22, populationExposed: 430, road: 'Dharmanagar–Jampui Rd' },
  { id: 'AS-02', name: 'Dima Hasao Cut Slope', district: 'Dima Hasao', state: 'Assam', lat: 25.1800, lon: 93.0300, elevationM: 680, slopeDeg: 34, baseRisk: 38, populationExposed: 560, road: 'Haflong–Silchar Rd' },
];

export const NE_SENSORS: NESensorMeta[] = [
  { id: 'MEG-042', slopeId: 'MEG-01', lat: 25.5801, lon: 91.8951 },
  { id: 'MEG-043', slopeId: 'MEG-01', lat: 25.5772, lon: 91.8915 },
  { id: 'MEG-044', slopeId: 'MEG-02', lat: 25.2712, lon: 91.7335 },
  { id: 'AS-011', slopeId: 'AS-01', lat: 26.1458, lon: 91.7378 },
  { id: 'AR-007', slopeId: 'AR-01', lat: 27.5875, lon: 91.8655 },
  { id: 'MZ-019', slopeId: 'MZ-01', lat: 23.7284, lon: 92.7192 },
  { id: 'SK-003', slopeId: 'SK-01', lat: 27.3402, lon: 91.8951 - 3.2886 }, // ~88.6065
  { id: 'NL-012', slopeId: 'NL-01', lat: 25.6764, lon: 94.1102 },
];

export const NE_ROADS: NERoad[] = [
  { id: 'RD-01', name: 'Shillong–Dawki', from: 'Shillong', to: 'Dawki', status: 'HIGH RISK', slopeId: 'MEG-01', path: [[91.8933, 25.5788], [91.95, 25.45], [92.0, 25.30], [92.02, 25.18]] },
  { id: 'RD-02', name: 'Shillong–Cherrapunji', from: 'Shillong', to: 'Cherrapunji', status: 'CAUTION', slopeId: 'MEG-02', path: [[91.8933, 25.5788], [91.82, 25.42], [91.732, 25.27]] },
  { id: 'RD-03', name: 'Guwahati–Shillong', from: 'Guwahati', to: 'Shillong', status: 'OPEN', slopeId: 'AS-01', path: [[91.7362, 26.1445], [91.8, 25.9], [91.8933, 25.5788]] },
  { id: 'RD-04', name: 'Aizawl–Silchar', from: 'Aizawl', to: 'Silchar', status: 'CAUTION', slopeId: 'MZ-01', path: [[92.7176, 23.7271], [92.8, 24.0], [92.9, 24.5]] },
  { id: 'RD-05', name: 'Gangtok–Nathula', from: 'Gangtok', to: 'Nathula', status: 'HIGH RISK', slopeId: 'SK-01', path: [[88.6065, 27.3389], [88.7, 27.4], [88.83, 27.42]] },
];

export const NE_FACILITIES: NEFacility[] = [
  { id: 'H-MEG-1', kind: 'hospital', name: 'Shillong Civil Hospital (demo)', lat: 25.5785, lon: 91.89, detail: 'ICU 4 free (demo) · trauma intake' },
  { id: 'E-MEG-1', kind: 'emergency', name: 'East Khasi Response Station (demo)', lat: 25.575, lon: 91.9, detail: 'Response team · 12 km from MEG-01' },
  { id: 'H-AS-1', kind: 'hospital', name: 'Guwahati Medical College (demo)', lat: 26.15, lon: 91.74, detail: 'ICU 6 free (demo)' },
  { id: 'B-MEG-1', kind: 'bridge', name: 'Dawki Bridge (demo)', lat: 25.18, lon: 92.02, detail: 'Scour watch (demo)' },
  { id: 'V-MEG-1', kind: 'village', name: 'Mawlynnong village (demo)', lat: 25.2, lon: 91.92, detail: 'Pop. ~500 (demo)' },
  { id: 'S-MEG-1', kind: 'shelter', name: 'Shillong Relief Shelter (demo)', lat: 25.585, lon: 91.885, detail: 'Capacity 800 (demo)' },
];

export const NE_CENTER: [number, number] = [25.5788, 91.8933]; // Shillong focus
export const INDIA_CENTER: [number, number] = [22.0, 79.0];
