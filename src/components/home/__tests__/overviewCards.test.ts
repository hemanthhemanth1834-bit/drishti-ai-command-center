import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DISASTER_CATEGORIES } from '@/config/navigation';
import { getDisasterImage } from '@/data/disasterImages';

const SRC = fs.readFileSync(
  path.resolve(__dirname, '..', 'HomePanels.tsx'), 'utf-8');

const EXPECTED: [string, string][] = [
  ['Flood', 'ov-flood-astor'],
  ['Heavy Rainfall', 'sih-rain-mumbai'],
  ['Inundation', 'sih-inundation-sindh'],
  ['Cyclone', 'ov-cyclone-khanun'],
  ['Landslide', 'ov-landslide-mameyes'],
];

describe('LIVE DISASTER OVERVIEW card photos', () => {
  it('all five SIH 26071 categories map to exact-topic registry photos; logic untouched', () => {
    expect([...DISASTER_CATEGORIES]).toEqual(EXPECTED.map(([c]) => c));
    for (const [cat, id] of EXPECTED) {
      expect(SRC.includes(`'${id}'`), cat).toBe(true);
      const photo = getDisasterImage(id);
      expect(photo, id).not.toBeNull();
      expect(photo!.remoteUrl, id).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(photo!.status, id).not.toBe('LIVE');
    }
    // live/demo logic, statuses, provenance preserved
    for (const s of ['LIVE DISASTER OVERVIEW', "'DEMO'", 'No live feed connected',
      'home-mini-status', 'home-mini-meta', 'CATEGORY_PHOTOS']) {
      expect(SRC.includes(s), s).toBe(true);
    }
  });
});
