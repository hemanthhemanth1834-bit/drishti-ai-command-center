import { describe, expect, it } from 'vitest';
import { PRIMARY_ACTIONS } from '@/config/navigation';
import { getDisasterImage } from '@/data/disasterImages';

describe('PRIMARY_ACTIONS photo cards', () => {
  it('maps all six actions to verified registry photos with explanations', () => {
    expect(PRIMARY_ACTIONS).toHaveLength(6);
    for (const a of PRIMARY_ACTIONS) {
      expect(a.photoId, a.label).toBeTruthy();
      const photo = getDisasterImage(a.photoId!);
      expect(photo, a.label).not.toBeNull();
      expect(photo!.status, a.label).not.toBe('LIVE');
      expect(a.explainer && a.explainer.length > 40, a.label).toBe(true);
    }
  });

  it('covers the six required actions in order', () => {
    expect(PRIMARY_ACTIONS.map((a) => a.label)).toEqual([
      'My Safety',
      'Live Location',
      'Hazard Maps',
      'Alert Center',
      'Emergency Mode',
      'Safe Evacuation',
    ]);
  });
});
