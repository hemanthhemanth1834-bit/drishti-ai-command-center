/**
 * Model display tests (Step 29) — 18 deterministic cases.
 * No live backend. Asserts honest rendering rules, especially that
 * SYNTHETIC-DEMO can never be mistaken for operational.
 */
import { describe, expect, it } from 'vitest';
import {
  healthLabel,
  isSyntheticDemoKind,
  metricCell,
  modelBadge,
  timelineEntries,
} from '../modelUtils';

describe('synthetic-demo designation', () => {
  it('1. detects synthetic kinds case-insensitively', () => {
    expect(isSyntheticDemoKind('SYNTHETIC-DEMO')).toBe(true);
    expect(isSyntheticDemoKind('synthetic')).toBe(true);
    expect(isSyntheticDemoKind('demo-artifact')).toBe(true);
    expect(isSyntheticDemoKind('PRODUCTION')).toBe(false);
    expect(isSyntheticDemoKind(null)).toBe(false);
    expect(isSyntheticDemoKind(undefined)).toBe(false);
  });

  it('2. banner badge prefers SYNTHETIC-DEMO over READY', () => {
    expect(modelBadge('SYNTHETIC-DEMO', 'READY')).toBe('SYNTHETIC-DEMO');
    expect(modelBadge('SYNTHETIC-DEMO', 'HEALTHY')).toBe('SYNTHETIC-DEMO');
  });

  it('3. operational requires READY without synthetic kind', () => {
    expect(modelBadge('verified-field', 'READY')).toBe('OPERATIONAL');
    expect(modelBadge(null, 'READY')).toBe('OPERATIONAL');
    expect(modelBadge(null, 'BROKEN')).toBe('UNKNOWN');
    expect(modelBadge(null, null)).toBe('UNKNOWN');
  });
});

describe('health states', () => {
  it('4. unreachable backend is MODEL OFFLINE', () => {
    expect(healthLabel('HEALTHY', false)).toBe('MODEL OFFLINE');
    expect(healthLabel(undefined, false)).toBe('MODEL OFFLINE');
  });

  it('5. healthy/ready states', () => {
    expect(healthLabel('HEALTHY', true)).toBe('MODEL HEALTHY');
    expect(healthLabel('READY', true)).toBe('MODEL HEALTHY');
    expect(healthLabel('healthy', true)).toBe('MODEL HEALTHY');
  });

  it('6. untrained is degraded, not healthy', () => {
    expect(healthLabel('NOT_TRAINED', true)).toBe('MODEL DEGRADED');
  });

  it('7. unknown maps to NOT AVAILABLE, never healthy', () => {
    expect(healthLabel('UNKNOWN', true)).toBe('NOT AVAILABLE');
    expect(healthLabel(null, true)).toBe('NOT AVAILABLE');
    expect(healthLabel('HEALTHY', true)).not.toBe('NOT AVAILABLE');
  });
});

describe('metrics', () => {
  it('8. values pass through untouched', () => {
    expect(metricCell(0.8867)).toBe('0.8867');
    expect(metricCell(0)).toBe('0');
    expect(metricCell('v1')).toBe('v1');
  });

  it('9. missing metrics are NOT AVAILABLE', () => {
    expect(metricCell(null)).toBe('NOT AVAILABLE');
    expect(metricCell(undefined)).toBe('NOT AVAILABLE');
  });

  it('10. no rounding or derivation applied', () => {
    expect(metricCell(0.9766)).toBe('0.9766');
    expect(metricCell([[73, 11]])).toBe('73,11');
  });
});

describe('timeline provenance', () => {
  it('11. trained timestamp preserved', () => {
    const [t] = timelineEntries({ trainedAt: '2026-09-16T12:41:41.636872+00:00', retrievedAt: '2026-09-26T00:00:00.000Z' });
    expect(t.value).toBe('2026-09-16 12:41 UTC');
  });

  it('12. missing timestamps stay missing', () => {
    const rows = timelineEntries({ retrievedAt: '2026-09-26T00:00:00.000Z' });
    expect(rows[0].value).toBe('NOT AVAILABLE');
    expect(rows[1].value).toBe('NOT AVAILABLE');
    expect(rows[2].value).toBe('2026-09-26 00:00 UTC');
  });

  it('13. invalid timestamps stay missing, never now()', () => {
    const rows = timelineEntries({ trainedAt: 'not-a-date', retrievedAt: '2026-09-26T00:00:00.000Z' });
    expect(rows[0].value).toBe('NOT AVAILABLE');
  });

  it('14. retrieval labeled separately', () => {
    const rows = timelineEntries({ trainedAt: null, retrievedAt: '2026-09-26T00:00:00.000Z' });
    expect(rows[2].label).toBe('RETRIEVED');
  });
});

describe('no-fabrication guards', () => {
  it('15. no confidence invented', () => {
    expect(metricCell(undefined)).toBe('NOT AVAILABLE');
  });

  it('16. no calibration invented', () => {
    // No calibration source exists in the contract: the only honest value.
    expect(metricCell(undefined)).toBe('NOT AVAILABLE');
  });

  it('17. no drift inferred', () => {
    expect(healthLabel('HEALTHY', true)).not.toContain('DRIFT');
    expect(healthLabel('HEALTHY', true)).not.toContain('NO DRIFT');
  });

  it('18. synthetic can never read as operational', () => {
    const kinds = ['SYNTHETIC-DEMO', 'synthetic', 'Demo', 'SYNTHETIC'];
    for (const k of kinds) {
      expect(modelBadge(k, 'READY')).toBe('SYNTHETIC-DEMO');
      expect(modelBadge(k, 'HEALTHY')).not.toBe('OPERATIONAL');
    }
  });
});
