import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getDisasterImage } from '@/data/disasterImages';

const SRC = fs.readFileSync(
  path.resolve(__dirname, '..', 'HomePanels.tsx'), 'utf-8');

const EXPECTED: [string, string][] = [
  ['Andhra Pradesh', 'rg-ap-godavari'],
  ['Telangana', 'rg-tg-hyderabad'],
  ['India', 'rg-india-iss'],
  ['Global', 'rg-earth-marble'],
];

describe('REGIONAL STATUS region photos', () => {
  it('all four regions map to exact-region registry photos; schematic removed, logic kept', () => {
    for (const [name, id] of EXPECTED) {
      expect(SRC.includes(`photoId: '${id}'`), name).toBe(true);
      const photo = getDisasterImage(id);
      expect(photo, id).not.toBeNull();
      expect(photo!.remoteUrl, id).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(photo!.status, id).not.toBe('LIVE');
    }
    expect(SRC.includes('india-schematic.svg')).toBe(false);
    for (const s of ['REGIONAL STATUS', 'Country → State → District → City → GPS',
      'US · UK · AU · JP ready', 'home-mini-meta']) {
      expect(SRC.includes(s), s).toBe(true);
    }
  });
});
