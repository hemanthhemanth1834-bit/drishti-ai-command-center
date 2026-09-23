'use client';
/**
 * DRISHTI-X operational fallback data (adapted from the Open Design
 * `mockData.js` reference into typed TypeScript).
 *
 * HARD RULE: everything here is DEMO. Existing backend APIs always take
 * priority — these rows render ONLY when the API is unreachable, and every
 * consumer must label them DEMO via StatusBadge/provenance.
 */

export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface DemoIncident {
  id: string;
  type: string;
  severity: Severity;
  place: string;
  lat: number;
  lon: number;
  reportedAt: string;
  status: 'UNVERIFIED' | 'UNDER_REVIEW' | 'VERIFIED';
  summary: string;
}

export interface DemoFacility {
  id: string;
  kind: 'HOSPITAL' | 'SHELTER' | 'RESPONDER' | 'DRONE' | 'RESOURCE';
  name: string;
  lat: number;
  lon: number;
  detail: string;
}

export const DEMO_SOURCE = 'DRISHTI-X demo registry (local fallback)';

export const DEMO_INCIDENTS: DemoIncident[] = [
  { id: 'DEMO-101', type: 'Flood', severity: 'HIGH', place: 'Krishna Basin Sector 04', lat: 17.385, lon: 78.4867, reportedAt: '2026-09-20T10:42:00Z', status: 'UNDER_REVIEW', summary: 'Riverine flooding reported near Ward 14 bund; field verification pending.' },
  { id: 'DEMO-102', type: 'Landslide', severity: 'CRITICAL', place: 'Wayanad Ghat Pass', lat: 11.68, lon: 76.13, reportedAt: '2026-09-21T04:15:00Z', status: 'UNVERIFIED', summary: 'Slope failure reported blocking ghat road; verify before dispatch.' },
  { id: 'DEMO-103', type: 'Cyclone', severity: 'MODERATE', place: 'Odisha Coast', lat: 20.3, lon: 85.8, reportedAt: '2026-09-19T16:00:00Z', status: 'VERIFIED', summary: 'Coastal wind damage watch; shelters on standby.' },
  { id: 'DEMO-104', type: 'Heatwave', severity: 'MODERATE', place: 'Telangana Interior', lat: 17.9, lon: 79.6, reportedAt: '2026-09-18T09:30:00Z', status: 'VERIFIED', summary: 'Sustained high temperatures; health advisory active.' },
  { id: 'DEMO-105', type: 'Wildfire', severity: 'LOW', place: 'Northeast Ridge', lat: 25.5, lon: 92.5, reportedAt: '2026-09-17T12:00:00Z', status: 'UNVERIFIED', summary: 'Smoke plume reported; satellite confirmation pending.' },
];

export const DEMO_FACILITIES: DemoFacility[] = [
  { id: 'H-07', kind: 'HOSPITAL', name: 'District General Hospital #07', lat: 17.41, lon: 78.5, detail: 'ICU-03 available · demo capacity' },
  { id: 'S-12', kind: 'SHELTER', name: 'Ward 14 Community Shelter', lat: 17.36, lon: 78.47, detail: '74% occupied · demo occupancy' },
  { id: 'R-03', kind: 'RESPONDER', name: 'NDRF Boat RB-07 (simulated)', lat: 17.39, lon: 78.49, detail: 'Staged · simulation' },
  { id: 'D-07', kind: 'DRONE', name: 'DRX-07 FLIR (simulated)', lat: 17.4, lon: 78.48, detail: '2.0 Hz sim link' },
  { id: 'R-11', kind: 'RESOURCE', name: 'Relief Depot East (demo)', lat: 17.42, lon: 78.52, detail: 'Stock nominal · demo' },
];

export const SEVERITY_COLOR: Record<Severity, string> = {
  LOW: '#34d399',
  MODERATE: '#fbbf24',
  HIGH: '#fb923c',
  CRITICAL: '#ff5470',
};

/** Full severity signal: color + icon + text (never color alone). */
export function severitySignal(sev: Severity): { color: string; icon: string; label: string } {
  const icons: Record<Severity, string> = {
    LOW: '●', MODERATE: '▲', HIGH: '⬢', CRITICAL: '■',
  };
  return { color: SEVERITY_COLOR[sev], icon: icons[sev], label: sev };
}
