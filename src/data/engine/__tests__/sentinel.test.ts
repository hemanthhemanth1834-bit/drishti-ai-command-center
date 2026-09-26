/**
 * Copernicus / Sentinel tests (Step 28, OUTCOME B).
 * No live Copernicus dependency. Asserts the honest NOT_CONFIGURED
 * posture: no products, no credentials, documented enablement.
 */
import { describe, expect, it } from 'vitest';
import { copernicusState } from '../satellite';
import { getSource } from '../registry';

describe('copernicus availability', () => {
  it('1. NOT_CONFIGURED state', () => {
    expect(copernicusState().status).toBe('NOT_CONFIGURED');
  });

  it('2. credential gating names server-side env only', () => {
    const c = copernicusState();
    expect(c.detail).toContain('COPERNICUS_USER');
    expect(c.detail).toContain('server-side');
    expect(JSON.stringify(c)).not.toMatch(/NEXT_PUBLIC_/);
  });

  it('3. no fake products', () => {
    expect(copernicusState().products).toEqual([]);
  });

  it('4. honest unavailable state with probe evidence', () => {
    const c = copernicusState();
    expect(c.probe.catalogReachable).toBe(true);
    expect(c.probe.quicklookPublic).toBe(false);
    expect(c.probe.downloadsRequireAuth).toBe(true);
    expect(typeof c.probe.probedAt).toBe('string');
  });

  it('5. provenance attribution comes from registry', () => {
    expect(getSource('copernicus')?.attribution).toContain('Copernicus');
  });

  it('6. documentation/enablement state is actionable', () => {
    const steps = copernicusState().enablement;
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.join(' ').toLowerCase()).toContain('never');
  });

  it('7. registry contract keeps Copernicus disabled', () => {
    const def = getSource('copernicus');
    expect(def?.enabled).toBe(false);
    expect(def?.access).toBe('free-account');
    expect(def?.adapter).toContain('Step 28');
  });
});
