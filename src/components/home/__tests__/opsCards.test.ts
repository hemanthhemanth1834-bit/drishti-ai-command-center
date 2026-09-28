import { describe, expect, it } from 'vitest';
import { OPERATIONAL_FEATURES } from '@/config/navigation';
import { getDisasterImage } from '@/data/disasterImages';

const EXPECTED: [string, string][] = [
  ['Hospital Intelligence', 'ops-hospital-triage'],
  ['Shelter Management', 'ops-shelter-redcross'],
  ['Recovery Insights', 'fix-recovery-inspector'],
  ['Multi-Language', 'fix-lang-booth'],
  ['Accessibility', 'ops-access-medshelter'],
  ['Voice Assistant', 'ops-voice-eoc'],
  ['Offline Mode', 'fix-offline-hotshots'],
  ['Public Mode', 'ops-public-drc'],
  ['Command Mode', 'ops-command-eoc'],
];

describe('Operations & Platform card photos', () => {
  it('all nine cards map to verified registry photos (titles/actions untouched)', () => {
    expect(OPERATIONAL_FEATURES).toHaveLength(9);
    for (const [label, id] of EXPECTED) {
      const card = OPERATIONAL_FEATURES.find((c) => c.label === label);
      expect(card, label).toBeDefined();
      expect(card!.photoId, label).toBe(id);
      const photo = getDisasterImage(id);
      expect(photo, id).not.toBeNull();
      expect(photo!.remoteUrl, id).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(photo!.status, id).not.toBe('LIVE');
    }
  });
});
