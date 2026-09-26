import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { INTEL_EXAMPLES } from '../GeospatialIntelGallery';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const BANNED_VALUES = [
  'images.unsplash.com',
  '142.8 km²',
  '968 hPa',
  '0.932',
  '54.2 FPS',
  '18.4 ms',
  '14 Detected',
  '85m AGL',
  'Illustrative image (Unsplash)',
  'Unsplash License (illustrative placeholder)',
  'Illustrative spec',
];

describe('GeospatialIntelGallery truthfulness', () => {
  it('contains no Unsplash hotlinks or fabricated example metrics', () => {
    const raw = JSON.stringify(INTEL_EXAMPLES);
    for (const banned of BANNED_VALUES) {
      expect(raw.includes(banned), banned).toBe(false);
    }
  });

  it('serves only local, on-disk images', () => {
    expect(INTEL_EXAMPLES.length).toBeGreaterThan(0);
    for (const item of INTEL_EXAMPLES) {
      expect(item.imageUrl.startsWith('/'), item.id).toBe(true);
      const disk = path.join(ROOT, 'public', item.imageUrl);
      expect(fs.existsSync(disk), `${item.id} -> ${item.imageUrl}`).toBe(true);
    }
  });

  it('every item carries source, license, verdict, and an honest badge', () => {
    for (const item of INTEL_EXAMPLES) {
      expect(item.source.length, item.id).toBeGreaterThan(10);
      expect(item.license.length, item.id).toBeGreaterThan(3);
      expect(item.verdict.length, item.id).toBeGreaterThan(10);
      expect(item.badge.includes('EXAMPLE'), item.id).toBe(false);
      expect(item.metrics.length, item.id).toBeGreaterThan(0);
    }
  });

  it('keeps all four filter categories populated', () => {
    const cats = new Set(INTEL_EXAMPLES.map((i) => i.category));
    for (const c of ['satellite', 'drone', 'vision', 'terrain'] as const) {
      expect(cats.has(c), c).toBe(true);
    }
  });
});
