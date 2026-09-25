/**
 * Satellite engine tests (Step 23) — deterministic, no live NASA calls.
 * Catalog, URL builder, date window, product metadata, Copernicus state.
 */
import { describe, expect, it } from 'vitest';
import {
  copernicusState,
  earliestNominalDate,
  GIBS_LAYERS,
  gibsProduct,
  gibsTileUrl,
  getGibsLayer,
  isSelectableDate,
  latestNominalDate,
} from '../satellite';

const NOW = new Date('2026-09-24T12:00:00.000Z');

describe('gibs catalog', () => {
  it('1. registers verified layers', () => {
    expect(GIBS_LAYERS.length).toBeGreaterThanOrEqual(4);
    expect(getGibsLayer('VIIRS_SNPP_CorrectedReflectance_TrueColor')?.platform).toBe('Suomi NPP');
    expect(getGibsLayer('NOPE')).toBeNull();
  });

  it('6. rejects unknown layers in URL builder', () => {
    expect(gibsTileUrl('NOPE', '2026-09-23')).toBeNull();
    expect(gibsTileUrl(GIBS_LAYERS[0].id, 'not-a-date')).toBeNull();
  });
});

describe('dates', () => {
  it('latest is yesterday UTC, earliest 14 days back', () => {
    expect(latestNominalDate(NOW)).toBe('2026-09-23');
    expect(earliestNominalDate(NOW)).toBe('2026-09-10');
  });

  it('selectable window excludes future and malformed', () => {
    expect(isSelectableDate('2026-09-23', NOW)).toBe(true);
    expect(isSelectableDate('2026-09-10', NOW)).toBe(true);
    expect(isSelectableDate('2026-09-24', NOW)).toBe(false);
    expect(isSelectableDate('2026-09-09', NOW)).toBe(false);
    expect(isSelectableDate('garbage', NOW)).toBe(false);
  });
});

describe('product + provenance', () => {
  it('2/3/5. builds honest product metadata, never live', () => {
    const p = gibsProduct(GIBS_LAYERS[0].id, '2026-09-23', 'All India');
    expect(p?.status).toBe('LATEST_AVAILABLE');
    expect(p?.acquisitionDate).toBe('2026-09-23');
    expect(p?.attribution).toContain('GIBS');
    expect(p?.limitations).toMatch(/tile/i);
    expect(gibsProduct('NOPE', '2026-09-23', 'x')).toBeNull();
  });

  it('4/9/10. copernicus is NOT_CONFIGURED with empty products', () => {
    const c = copernicusState();
    expect(c.status).toBe('NOT_CONFIGURED');
    expect(c.products).toEqual([]);
    expect(c.detail).toContain('COPERNICUS_USER');
  });

  it('tile URL shape matches verified production pattern', () => {
    const url = gibsTileUrl('VIIRS_SNPP_CorrectedReflectance_TrueColor', '2026-09-23');
    expect(url).toBe(
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/2026-09-23/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
    );
  });
});
