/** Lower-hazard routing — honest labels, never "safe" unless verified. */
import { NE_ROADS } from '../data/northeast';

export interface RouteOption {
  id: string;
  name: string;
  hazard: 'LOWER CURRENT HAZARD' | 'MODERATE CURRENT HAZARD' | 'HIGH CURRENT HAZARD';
  color: 'green' | 'yellow' | 'red';
  etaMin: number;
  note: string;
}

const HAZARD_OF: Record<string, RouteOption['hazard']> = {
  OPEN: 'LOWER CURRENT HAZARD',
  CAUTION: 'MODERATE CURRENT HAZARD',
  'HIGH RISK': 'HIGH CURRENT HAZARD',
  CLOSED: 'HIGH CURRENT HAZARD',
};
const COLOR_OF: Record<string, RouteOption['color']> = {
  OPEN: 'green', CAUTION: 'yellow', 'HIGH RISK': 'red', CLOSED: 'red',
};

export function routeOptions(from: string, to: string): RouteOption[] {
  const direct = NE_ROADS.filter((r) => r.from === from && r.to === to);
  const base = (direct.length ? direct : NE_ROADS.slice(0, 3)).map((r, i) => ({
    id: `${r.id}-alt${i}`,
    name: `${r.name} via alt-${i + 1}`,
    hazard: HAZARD_OF[r.status],
    color: COLOR_OF[r.status],
    etaMin: 35 + i * 18,
    note: r.status === 'OPEN'
      ? 'Lower current hazard in demo feed — verify before travel.'
      : `Current status ${r.status} (demo) — field verification required.`,
  }));
  return base.slice(0, 3);
}
