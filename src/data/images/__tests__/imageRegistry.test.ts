import { describe, expect, it } from 'vitest';
import {
  IMAGE_ASSETS,
  assetsByCategory,
  getAsset,
  latLonToTile,
  osmTileUrl,
  validateAsset,
} from '../imageRegistry';

describe('imageRegistry provenance', () => {
  it('ships only validated assets', () => {
    expect(IMAGE_ASSETS.length).toBeGreaterThan(0);
    for (const a of IMAGE_ASSETS) {
      const v = validateAsset(a);
      expect(v.errors, a.id).toEqual([]);
      expect(v.ok, a.id).toBe(true);
    }
  });

  it('never uses banned vague sources', () => {
    const banned = ['google', 'internet', 'public image', 'unknown', 'stock', 'random'];
    for (const a of IMAGE_ASSETS) {
      expect(banned.some((b) => a.source.toLowerCase().includes(b)), a.id).toBe(false);
      expect(a.sourceUrl.startsWith('https://'), a.id).toBe(true);
      expect(a.licenseUrl.startsWith('https://'), a.id).toBe(true);
    }
  });

  it('rejects missing source/license', () => {
    expect(validateAsset({ id: 'x' }).ok).toBe(false);
    expect(validateAsset({ id: 'x', source: 'Google', license: 'unknown' }).ok).toBe(false);
    expect(validateAsset({ id: 'x', source: 'Internet photos', license: 'Public image' }).ok).toBe(false);
  });

  it('rejects assets flagged both real and illustrative', () => {
    const base = validateAsset(getAsset('rain-nilam-modis')!);
    expect(base.ok).toBe(true);
    const bad = validateAsset({ ...getAsset('rain-nilam-modis')!, isIllustrative: true });
    expect(bad.ok).toBe(false);
  });

  it('covers every model-flow slot with a real observation', () => {
    for (const cat of ['weather', 'soil', 'terrain', 'history'] as const) {
      const found = assetsByCategory(cat).filter((a) => a.isReal && !a.isIllustrative);
      expect(found.length, cat).toBeGreaterThan(0);
    }
    expect(getAsset('history-kerala-before')).not.toBeNull();
    expect(getAsset('history-kerala-after')).not.toBeNull();
  });

  it('getAsset returns null for unknown ids', () => {
    expect(getAsset('nope')).toBeNull();
  });
});

describe('osmTileUrl', () => {
  it('maps Vijayawada to the correct tile at z5', () => {
    // lon 80.65 -> x = floor(260.65/360*32) = 23; lat 16.51 -> y = 14
    expect(latLonToTile(16.5062, 80.648, 5)).toEqual({ x: 23, y: 14 });
    expect(osmTileUrl(16.5062, 80.648, 5)).toBe('https://tile.openstreetmap.org/5/23/14.png');
  });

  it('keeps coordinates within valid ranges', () => {
    const { x, y } = latLonToTile(27.5, 81.5, 5);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(32);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThan(32);
  });
});
