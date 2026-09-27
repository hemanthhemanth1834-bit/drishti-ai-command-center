import { describe, expect, it } from 'vitest';
import { OPEN_PATHS, requiresAuth } from '../gateRules';

describe('AuthGate routing rules', () => {
  it('gates every application route by default', () => {
    for (const p of ['/', '/command', '/weather', '/satellite', '/events',
      '/earthquakes', '/risk-map', '/admin', '/settings', '/ml', '/twin']) {
      expect(requiresAuth(p), p).toBe(true);
    }
    expect(requiresAuth(null)).toBe(true);
    expect(requiresAuth('')).toBe(true);
  });

  it('keeps SOS reachable without a session', () => {
    expect(requiresAuth('/emergency')).toBe(false);
    expect(requiresAuth('/emergency/extra')).toBe(false);
    // near-miss paths stay gated
    expect(requiresAuth('/emergencyX')).toBe(true);
  });

  it('documents the open set explicitly', () => {
    expect(OPEN_PATHS).toEqual(['/emergency']);
  });
});
