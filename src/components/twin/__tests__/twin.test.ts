/**
 * Twin command-center tests (Step 30) — 12 deterministic cases.
 * Pure layer/camera logic only; no WebGL required.
 */
import { describe, expect, it } from 'vitest';
import {
  activeLayers,
  CAM_PRESETS,
  DEFAULT_HAZARDS,
  getCamPreset,
  prefersReducedMotion,
  TWIN_LAYERS,
  visibleHazardIds,
} from '../twinLayers';

describe('twin layers', () => {
  it('1. default hazards all visible', () => {
    expect(DEFAULT_HAZARDS).toEqual({ flood: true, fire: true });
    expect(visibleHazardIds(DEFAULT_HAZARDS)).toEqual(['HZ-FL', 'HZ-FR']);
  });

  it('2. hazard visibility follows toggles', () => {
    expect(visibleHazardIds({ flood: false, fire: true })).toEqual(['HZ-FR']);
    expect(visibleHazardIds({ flood: false, fire: false })).toEqual([]);
  });

  it('3. active layer names reflect state', () => {
    expect(activeLayers({ flood: true, fire: false }, true)).toEqual(['FLOOD', 'CORRIDOR']);
    expect(activeLayers({ flood: false, fire: false }, false)).toEqual([]);
  });

  it('4. layer catalog covers flood, fire, corridor', () => {
    expect(TWIN_LAYERS.map((l) => l.id).sort()).toEqual(['corridor', 'fire', 'flood']);
  });

  it('5. every layer carries a simulation hint', () => {
    for (const l of TWIN_LAYERS) {
      expect(l.hint.toLowerCase()).toMatch(/simulat/);
    }
  });
});

describe('camera presets', () => {
  it('6. three presets with sane distances', () => {
    expect(CAM_PRESETS.map((p) => p.id)).toEqual(['overview', 'incident', 'ground']);
    for (const p of CAM_PRESETS) {
      expect(p.dist).toBeGreaterThanOrEqual(4);
      expect(p.dist).toBeLessThanOrEqual(20);
      expect(p.focus).toHaveLength(3);
    }
  });

  it('7. incident preset focuses the flood cell', () => {
    const p = getCamPreset('incident');
    expect(p.focus[0]).toBeCloseTo(1.8, 1);
    expect(p.focus[2]).toBeCloseTo(2.6, 1);
  });

  it('8. unknown preset falls back to overview', () => {
    expect(getCamPreset('nope').id).toBe('overview');
    expect(getCamPreset(null).id).toBe('overview');
    expect(getCamPreset(undefined).id).toBe('overview');
  });

  it('9. overview matches the default scene framing', () => {
    const p = getCamPreset('overview');
    expect(p.dist).toBe(9);
    expect(p.focus).toEqual([0, 0.5, 0]);
  });
});

describe('motion + honesty guards', () => {
  it('10. reduced motion defaults safe without DOM', () => {
    expect(prefersReducedMotion()).toBe(true);
  });

  it('11. no fake live-terrain claims in layer copy', () => {
    const text = [...TWIN_LAYERS.map((l) => `${l.label} ${l.hint}`), ...CAM_PRESETS.map((p) => p.label)].join(' ').toLowerCase();
    for (const w of ['live terrain', 'real-time', 'operational']) {
      expect(text).not.toContain(w);
    }
  });

  it('12. hazard ids match the TwinViewport scene ids', () => {
    expect(visibleHazardIds({ flood: true, fire: true })).toContain('HZ-FL');
    expect(visibleHazardIds({ flood: true, fire: true })).toContain('HZ-FR');
  });
});
