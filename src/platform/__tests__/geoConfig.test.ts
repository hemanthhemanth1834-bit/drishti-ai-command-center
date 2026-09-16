import { describe, expect, it } from 'vitest';
import { AGENCIES, DISASTERS, SECTORS } from '../../config/disasters';
import { SHOWCASE_CITIES } from '../../config/regions';
import { clearRegion, getRegion, setRegion } from '../regionStore';

describe('geo config integrity', () => {
  it('every disaster maps to a known sector with TE names', () => {
    const sectors = new Set(SECTORS.map((s) => s.code));
    for (const d of DISASTERS) {
      expect(sectors.has(d.sector)).toBe(true);
      expect(d.name_te.length).toBeGreaterThan(0);
    }
  });
  it('showcase cities carry confident India coords', () => {
    for (const c of SHOWCASE_CITIES) {
      expect(c.lat).toBeGreaterThan(6);
      expect(c.lat).toBeLessThan(38);
      expect(c.lon).toBeGreaterThan(66);
      expect(c.lon).toBeLessThan(98);
    }
  });
  it('agencies have scopes', () => {
    for (const a of AGENCIES) expect(a.scope.length).toBeGreaterThan(0);
  });
});

describe('regionStore transitions', () => {
  it('set derives label, clear resets', () => {
    clearRegion();
    expect(getRegion().label).toBe('India');
    setRegion({ state: 'IN-AP', district: 'Krishna', city: 'Vijayawada', lat: 16.5, lon: 80.6 });
    expect(getRegion().label).toBe('Vijayawada → Krishna → IN-AP → IN');
    setRegion({ label: 'Custom', city: 'X' });
    expect(getRegion().label).toBe('Custom');
    clearRegion();
    expect(getRegion().lat).toBeNull();
  });
});
