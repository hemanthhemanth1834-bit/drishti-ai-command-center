import { describe, expect, it } from 'vitest';
import { FEATURES } from '../HeroFeatureStrip';
import { getDisasterImage } from '@/data/disasterImages';

describe('HeroFeatureStrip photo cards', () => {
  it('maps all six cards to verified registry photos with explanations', () => {
    expect(FEATURES).toHaveLength(6);
    for (const f of FEATURES) {
      const photo = getDisasterImage(f.photoId);
      expect(photo, f.title).not.toBeNull();
      expect(photo!.status, f.title).not.toBe('LIVE');
      expect(f.explainer.length, f.title).toBeGreaterThan(40);
      expect(f.href.startsWith('/'), f.title).toBe(true);
    }
  });

  it('covers the six required topics', () => {
    expect(FEATURES.map((f) => f.title)).toEqual([
      'Real-time Monitoring',
      'AI-powered Risk Prediction',
      'Multi-source Data Fusion',
      'Nationwide Coverage',
      'Faster Response',
      'Safer Communities',
    ]);
  });
});
