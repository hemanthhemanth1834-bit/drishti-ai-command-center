import { describe, expect, it } from 'vitest';
import { SECONDARY_FEATURES } from '@/config/navigation';
import { getDisasterImage } from '@/data/disasterImages';

const EXPECTED: [string, string][] = [
  ['Nearby Help', 'nearby-hospital-dmat'],
  ['Citizen Reporting', 'report-assessment-team'],
  ['Family Safety', 'family-preparedness-day'],
  ['Personal Plan', 'plan-eoc-texas'],
  ['Emergency Kit', 'kit-supply'],
  ['Disaster Education', 'learn-cert-rebuild'],
  ['What-If Copilot', 'whatif-shakemap'],
  ['3D Digital Twin', 'twin-himalaya-iss'],
  ['Drone SAR', 'drone-global-hawk'],
];

describe('Intelligence Capabilities card photos', () => {
  it('all nine cards map to verified registry photos (titles/routes untouched)', () => {
    expect(SECONDARY_FEATURES).toHaveLength(9);
    for (const [label, id] of EXPECTED) {
      const card = SECONDARY_FEATURES.find((c) => c.label === label);
      expect(card, label).toBeDefined();
      expect(card!.photoId, label).toBe(id);
      const photo = getDisasterImage(id);
      expect(photo, id).not.toBeNull();
      expect(photo!.remoteUrl, id).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(photo!.status, id).not.toBe('LIVE');
    }
  });
});
