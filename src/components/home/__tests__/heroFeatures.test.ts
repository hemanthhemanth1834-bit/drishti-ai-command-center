import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
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

  it('renderers use the remote primary, never fallback-only', () => {
    // Regression guard: FeaturePhoto once rendered photo.fallbackUrl directly,
    // silently demoting every remote primary to a fallback (shelter.svg shipped).
    // root already resolves to <repo>/src here.
    const root = path.resolve(__dirname, '..', '..', '..');
    for (const f of [
      'components/home/HeroFeatureStrip.tsx',
      'components/visuals/DisasterPhoto.tsx',
      'components/visuals/DisasterCardPhoto.tsx',
    ]) {
      const src = fs.readFileSync(path.join(root, f), 'utf-8');
      expect(src.includes('remoteUrl'), f).toBe(true);
    }
    const strip = fs.readFileSync(
      path.join(root, 'components', 'home', 'HeroFeatureStrip.tsx'), 'utf-8');
    expect(strip.includes('src={photo.fallbackUrl}')).toBe(false);
  });
});
