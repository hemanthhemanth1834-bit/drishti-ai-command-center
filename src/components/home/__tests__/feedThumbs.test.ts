import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getDisasterImage } from '@/data/disasterImages';

const SRC = fs.readFileSync(
  path.resolve(__dirname, '..', 'HomePanels.tsx'), 'utf-8');

const EXPECTED: [string, string][] = [
  ['demo-1', 'fd-rain-krishna'],
  ['demo-2', 'fd-slide-wayanad'],
  ['demo-3', 'fd-cyclone-fani'],
  ['demo-4', 'fd-flood-chennai'],
  ['demo-5', 'fd-report-volunteer'],
];

describe('REAL-TIME FEEDS demo thumbnails', () => {
  it('all five demo rows map to event-exact registry photos; rows stay DEMO', () => {
    for (const [row, id] of EXPECTED) {
      expect(SRC.includes(`photoId: '${id}'`), row).toBe(true);
      const photo = getDisasterImage(id);
      expect(photo, id).not.toBeNull();
      expect(photo!.remoteUrl, id).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(photo!.status, id).not.toBe('LIVE');
    }
    for (const s of ['Heavy rainfall watch — Krishna basin (demo)',
      'Landslide susceptibility elevated — ghat roads (demo)',
      'Cyclone outlook: Bay of Bengal monitoring (demo)',
      'Road waterlogging reports — low-lying wards (demo)',
      'New citizen field report received (demo)',
      'home-feed-thumb', 'Open →', 'DEMO feed']) {
      expect(SRC.includes(s), s).toBe(true);
    }
  });
});
