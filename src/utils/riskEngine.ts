/** Citizen risk engine over labeled demo/SIMULATION zones. Never real warnings. */
import { haversineKm } from '@/utils/geocode';
import {
  DEMO_FACILITIES,
  DEMO_HAZARDS,
  type Facility,
  type HazardZone,
  type RiskLevel,
} from '@/data/providers';

const RANK: Record<RiskLevel, number> = { low: 0, moderate: 1, high: 2, critical: 3 };

export type NearbyHazard = { zone: HazardZone; distKm: number; inside: boolean };

export type RiskReport = {
  level: RiskLevel;
  nearby: NearbyHazard[];
  factors: string[];
  confidence: number;
  assessedAt: string;
  action: string;
};

const ACTIONS: Record<RiskLevel, string> = {
  low: 'Continue normal activities. Keep your emergency kit ready.',
  moderate: 'Stay alert. Avoid risk zones, check alerts twice daily.',
  high: 'Prepare for evacuation. Pack documents, water, medicine. Review your safe route.',
  critical: 'Evacuate now via your safe route. Call 112 if you need rescue.',
};

/** Overall risk = highest level among zones within (radius + 15km), else LOW. */
export function assessRisk(lat: number, lon: number): RiskReport {
  const nearby: NearbyHazard[] = DEMO_HAZARDS.map((zone) => {
    const distKm = haversineKm(lat, lon, zone.lat, zone.lon);
    return { zone, distKm, inside: distKm <= zone.radiusKm };
  })
    .filter((x) => x.distKm <= x.zone.radiusKm + 15)
    .sort(
      (a, b) =>
        RANK[b.zone.level] - RANK[a.zone.level] || a.distKm - b.distKm
    );
  const top = nearby.find((x) => x.inside) ?? nearby[0];
  return {
    level: top ? top.zone.level : 'low',
    nearby: nearby.slice(0, 6),
    factors: top ? top.zone.factors : ['No hazard cells near you (demo coverage)'],
    confidence: top ? top.zone.confidence : 95,
    assessedAt: new Date().toLocaleString(),
    action: top ? ACTIONS[top.zone.level] : ACTIONS.low,
  };
}

export function nearestFacilities(
  lat: number,
  lon: number,
  kind?: Facility['kind'],
  n = 3
): { f: Facility; distKm: number }[] {
  return DEMO_FACILITIES.filter((f) => !kind || f.kind === kind)
    .map((f) => ({ f, distKm: haversineKm(lat, lon, f.lat, f.lon) }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, n);
}
