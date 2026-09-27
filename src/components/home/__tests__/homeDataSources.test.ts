import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getDisasterImage } from '@/data/disasterImages';

const SRC = fs.readFileSync(
  path.resolve(__dirname, '..', 'HomeSections.tsx'), 'utf-8');

describe('DataSourcesSection provider photos', () => {
  it('maps all five providers to verified registry photos, statuses untouched', () => {
    for (const id of ['cyclone-nilam', 'soil-kerala-land', 'terrain-himalaya',
      'cyclone-ilsa', 'storm-lightning-india']) {
      expect(SRC.includes(`'${id}'`), id).toBe(true);
      const photo = getDisasterImage(id);
      expect(photo, id).not.toBeNull();
      expect(photo!.status, id).not.toBe('LIVE');
    }
    // provider names + truthful statuses preserved
    for (const s of ['Open-Meteo', 'SoilGrids', 'OpenStreetMap', 'NASA GIBS',
      'IMD / Copernicus / SMS', "'LIVE'", "'NOT_CONFIGURED'"]) {
      expect(SRC.includes(s), s).toBe(true);
    }
  });
});
