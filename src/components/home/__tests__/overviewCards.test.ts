import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getDisasterImage } from '@/data/disasterImages';

const SRC = fs.readFileSync(
  path.resolve(__dirname, '..', 'HomePanels.tsx'), 'utf-8');

const EXPECTED: [string, string][] = [
  ['Cyclone', 'ov-cyclone-khanun'],
  ['Flood', 'ov-flood-astor'],
  ['Landslide', 'ov-landslide-mameyes'],
  ['Heatwave', 'ov-heat-furnace'],
  ['Earthquake', 'ov-quake-northridge'],
  ['Wildfire', 'ov-wildfire-rim'],
];

describe('LIVE DISASTER OVERVIEW card photos', () => {
  it('all six categories map to exact-disaster registry photos; logic untouched', () => {
    for (const [cat, id] of EXPECTED) {
      expect(SRC.includes(`${cat}: '${id}'`), cat).toBe(true);
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
