import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getDisasterImage } from '@/data/disasterImages';

const SRC = fs.readFileSync(
  path.resolve(__dirname, '..', 'HomePanels.tsx'), 'utf-8');

const EXPECTED: [string, string][] = [
  ['North India', 'cz-north-everest'],
  ['South India', 'cz-south-ghats'],
  ['East India', 'cz-east-delta'],
  ['West India', 'cz-west-thar'],
  ['Central India', 'cz-central-narmada'],
  ['Northeast India', 'cz-ne-brahmaputra'],
];

describe('COVERAGE ZONES zone photos', () => {
  it('all six zones map to zone-exact registry photos; heading/descs kept', () => {
    for (const [name, id] of EXPECTED) {
      expect(SRC.includes(`photoId: '${id}'`), name).toBe(true);
      const photo = getDisasterImage(id);
      expect(photo, id).not.toBeNull();
      expect(photo!.remoteUrl, id).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(photo!.status, id).not.toBe('LIVE');
    }
    for (const s of ['COVERAGE ZONES — GEOGRAPHIC CONTEXT, NOT RISK SCORES',
      'Himalayan slopes and northern plains', 'Peninsular plateau and long coasts',
      'Gangetic plains and Bay of Bengal coast', 'Arid west, megacities and Arabian Sea coast',
      'Plateau, forests and farmland', 'High hills, great rivers, extreme rainfall']) {
      expect(SRC.includes(s), s).toBe(true);
    }
  });
});
