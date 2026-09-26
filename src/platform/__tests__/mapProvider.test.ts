/**
 * Map provider tests — Google Embed gating + OSM default.
 * No live Google dependency; env read is the only input.
 * Never asserts or contains a real key.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { googleEmbedStatus, googleEmbedUrl, MAP_BASES } from '../mapProvider';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('google embed gating', () => {
  it('absent key reports NOT_CONFIGURED', () => {
    vi.stubGlobal('process', { env: {} });
    expect(googleEmbedStatus().status).toBe('NOT_CONFIGURED');
  });

  it('URL builder returns null without key (OSM fallback path)', () => {
    vi.stubGlobal('process', { env: {} });
    expect(googleEmbedUrl(17.38, 78.48)).toBeNull();
  });

  it('rejects invalid coordinates even with key', () => {
    vi.stubGlobal('process', { env: { NEXT_PUBLIC_GOOGLE_MAPS_KEY: 'TESTKEY' } });
    expect(googleEmbedUrl(NaN, 78.48)).toBeNull();
    expect(googleEmbedUrl(17.38, 999)).toBeNull();
  });

  it('present key reports READY and builds official embed URL without leaking internals', () => {
    vi.stubGlobal('process', { env: { NEXT_PUBLIC_GOOGLE_MAPS_KEY: 'TESTKEY' } });
    expect(googleEmbedStatus().status).toBe('READY');
    const url = googleEmbedUrl(17.38, 78.48);
    expect(url).toContain('https://www.google.com/maps/embed/v1/place');
    expect(url).toContain('17.38,78.48');
  });
});

describe('osm default preserved', () => {
  it('leaflet bases remain keyless OSM-family tiles', () => {
    expect(MAP_BASES.leaflet.length).toBeGreaterThan(0);
    for (const b of MAP_BASES.leaflet) {
      expect(b.url).not.toContain('googleapis');
      expect(b.url).not.toContain('google.com');
    }
  });
});
