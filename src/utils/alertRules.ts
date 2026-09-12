/** Pure rule engine for live hazard alerts. No React — testable anywhere. */

export type AlertLevel = 'critical' | 'warning' | 'info';

export type Alert = {
  id: string;
  level: AlertLevel;
  title: string;
  detail: string;
};

export type AlertInput = {
  scenario: string;
  /** Spillway discharge in thousand cusecs (shared sim state). */
  spillwayK: number;
  batteryPct?: number;
  signalPct?: number;
  geofenceBreach: boolean;
  droneId?: string;
};

/** 45,000 cusecs is the Prakasam Barrage critical-discharge threshold. */
export const DISCHARGE_LIMIT_K = 45;

export function evaluateAlerts(inp: AlertInput): Alert[] {
  const alerts: Alert[] = [];

  if (inp.spillwayK > DISCHARGE_LIMIT_K) {
    alerts.push({
      id: 'barrage-discharge',
      level: 'critical',
      title: `CRITICAL HAZARD BREACH: PRAKASAM BARRAGE DISCHARGE EXCEEDED ${DISCHARGE_LIMIT_K},000 CUSECS`,
      detail:
        `Live discharge at ${inp.spillwayK.toLocaleString()},000 cusecs. ` +
        `NH-65 Underpass submerged at ${(inp.spillwayK * 0.041).toFixed(2)}m depth. ` +
        `All ground traffic diverted to elevated Bypass Route B. Evacuee transit buses ` +
        `PB-08 and PB-11 en route to City Sports Complex.`,
    });
  }

  if (inp.geofenceBreach) {
    alerts.push({
      id: 'geofence-breach',
      level: 'critical',
      title: `GEOFENCE BREACH: ${inp.droneId ?? 'UNIT'} OUTSIDE HYDERABAD OPS POLYGON`,
      detail:
        'Unit has exited the authorized operations polygon. Acknowledge to stand down the ' +
        '20-second Return-To-Home fail-safe, or steer the unit back inside the boundary.',
    });
  }

  if (inp.scenario === 'storm') {
    alerts.push({
      id: 'storm-cell',
      level: 'critical',
      title: 'STORM CELL ACTIVE: TELEMETRY DEGRADED — EXPECT ALTITUDE NOISE ±120m',
      detail:
        'Backend scenario injector is running storm physics. Battery drain 4× nominal, ' +
        'link margin reduced. Hold all air-drop actuations until the cell passes.',
    });
  }

  if (inp.scenario === 'gps-denied') {
    alerts.push({
      id: 'gps-denied',
      level: 'warning',
      title: 'GPS-DENIED ops: FLEET ON DEAD-RECKONING',
      detail:
        'Satellite fix lost — units navigate on inertial dead-reckoning. Position drift ' +
        'accumulates over time; keep sorties short and within visual range of spotters.',
    });
  }

  if (inp.batteryPct !== undefined && inp.batteryPct < 20) {
    alerts.push({
      id: 'low-battery',
      level: 'warning',
      title: `LOW BATTERY: ${inp.droneId ?? 'UNIT'} AT ${inp.batteryPct.toFixed(0)}%`,
      detail: 'Below 20% reserve. Recall unit or commit to nearest recovery pad now.',
    });
  }

  if (inp.signalPct !== undefined && inp.signalPct < 30) {
    alerts.push({
      id: 'weak-link',
      level: 'warning',
      title: `WEAK MESH LINK: ${inp.droneId ?? 'UNIT'} AT ${inp.signalPct.toFixed(0)}% SIGNAL`,
      detail: 'Packet loss likely. Elevate LoRa relay drone or close distance to the gateway.',
    });
  }

  const rank: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => rank[a.level] - rank[b.level]);
}
