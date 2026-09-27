import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  DISASTER_PHOTOS,
  disasterImageByCategory,
  getDisasterImage,
} from '../disasterImages';

const ROOT = path.resolve(__dirname, '..', '..', '..');

describe('disasterImages registry', () => {
  it('every entry carries complete verified provenance', () => {
    expect(DISASTER_PHOTOS.length).toBeGreaterThan(0);
    for (const a of DISASTER_PHOTOS) {
      expect(a.id, 'id').toBeTruthy();
      expect(a.category, a.id).toBeTruthy();
      expect(a.source, a.id).not.toMatch(/google|internet|unknown/i);
      expect(a.sourceUrl.startsWith('https://'), a.id).toBe(true);
      expect(a.license, a.id).toBeTruthy();
      expect(a.license).not.toMatch(/unknown|n\/a/i);
      expect(a.attribution, a.id).toBeTruthy();
      expect(a.alt.length, a.id).toBeGreaterThan(20);
      expect(a.description, a.id).toBeTruthy();
      expect(['HISTORICAL', 'ARCHIVAL', 'REFERENCE']).toContain(a.status);
      // never presented as live
      expect(a.status).not.toBe('LIVE');
    }
  });

  it('remote entries use official Commons FilePath URLs with local fallbacks on disk', () => {
    const remote = DISASTER_PHOTOS.filter((a) => a.remoteUrl);
    expect(remote.length).toBeGreaterThan(0);
    for (const a of remote) {
      expect(a.remoteUrl!.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath'), a.id).toBe(true);
      const disk = path.join(ROOT, 'public', a.fallbackUrl);
      expect(fs.existsSync(disk), `${a.id} fallback ${a.fallbackUrl}`).toBe(true);
    }
  });

  it('local-only entries reference on-disk files', () => {
    for (const a of DISASTER_PHOTOS.filter((x) => !x.remoteUrl)) {
      const disk = path.join(ROOT, 'public', a.fallbackUrl);
      expect(fs.existsSync(disk), `${a.id} -> ${a.fallbackUrl}`).toBe(true);
    }
  });

  it('covers every replaced disaster category', () => {
    for (const cat of ['cyclone', 'flood', 'landslide', 'wildfire', 'earthquake',
      'drought', 'heatwave', 'terrain', 'response', 'command']) {
      expect(disasterImageByCategory(cat), cat).not.toBeNull();
    }
  });

  it('looks up by id, null for unknown', () => {
    expect(getDisasterImage('wildfire-ferguson')?.category).toBe('wildfire');
    expect(getDisasterImage('nope')).toBeNull();
    expect(disasterImageByCategory('nope')).toBeNull();
  });
});
