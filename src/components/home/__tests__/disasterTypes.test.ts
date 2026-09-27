import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getDisasterImage } from '@/data/disasterImages';

const SRC = fs.readFileSync(
  path.resolve(__dirname, '..', 'DisasterTypes.tsx'), 'utf-8');

const EXPECTED: [string, string][] = [
  ['Cyclone', 'cyclone-nilam'],
  ['Flood', 'flood-ganges'],
  ['Wildfire', 'wildfire-ferguson'],
  ['Landslide', 'landslide-debris-flow'],
  ['Drought', 'drought-lake-mead'],
  ['Heatwave', 'heatwave-hottest-spots'],
];

describe('DisasterTypes homepage cards', () => {
  it('references all six registry photos and no legacy SVG icons', () => {
    for (const [name, id] of EXPECTED) {
      expect(SRC.includes(`photoId: '${id}'`), name).toBe(true);
      const photo = getDisasterImage(id);
      expect(photo, name).not.toBeNull();
      expect(photo!.status, name).not.toBe('LIVE');
    }
    for (const svg of ['dis-cyclone.svg', 'dis-flood.svg', 'dis-fire.svg',
      'dis-landslide.svg', 'dis-drought.svg', 'wx-storm.svg']) {
      expect(SRC.includes(svg), svg).toBe(false);
    }
  });

  it('preserves card links', () => {
    const links: [string, number][] = [['/risk-map', 2], ['/weather', 3], ['/terrain', 1]];
    for (const [href, count] of links) {
      const hits = SRC.split(`href: '${href}'`).length - 1;
      expect(hits, href).toBe(count);
    }
  });
});
