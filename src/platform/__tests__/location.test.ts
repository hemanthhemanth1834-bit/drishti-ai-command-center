/**
 * Shared location tests — hierarchy, validation, URL state, store.
 * Deterministic; no network, no secrets, no invented places.
 */
import { describe, expect, it } from 'vitest';
import {
  breadcrumbParts,
  cityByCode,
  cityToSelection,
  parseCityCode,
  regionFromQuery,
  regionToQuery,
  stateName,
  validateRegion,
} from '../regionUtils';
import { clearRegion, getRegion, setRegion } from '../regionStore';

describe('city codes', () => {
  it('parses verified showcase codes', () => {
    expect(parseCityCode('IN-AP-KRI-VJA')).toEqual({ country: 'IN', state: 'IN-AP', district: 'IN-AP-KRI', city: 'IN-AP-KRI-VJA' });
    expect(parseCityCode('nope')).toBeNull();
    expect(parseCityCode('US-CA-X-Y')).toBeNull();
  });

  it('resolves cities without inventing names', () => {
    const sel = cityToSelection('IN-AP-KRI-VJA');
    expect(sel).toMatchObject({ country: 'IN', state: 'IN-AP', city: 'Vijayawada', lat: 16.5062, lon: 80.648 });
    expect(sel?.district).toBe('');
    expect(cityToSelection('IN-XX-YYY-ZZZ')).toBeNull();
  });

  it('state names resolve, unknown codes pass through', () => {
    expect(stateName('IN-AP')).toBe('Andhra Pradesh');
    expect(stateName('ZZ')).toBe('ZZ');
  });
});

describe('validation', () => {
  it('accepts empty/default patches', () => {
    expect(validateRegion({})).toBe(true);
    expect(validateRegion({ state: 'IN-AP', lat: 16.5, lon: 80.6 })).toBe(true);
  });

  it('rejects unknown states and out-of-range coordinates', () => {
    expect(validateRegion({ state: 'XX' })).toBe(false);
    expect(validateRegion({ lat: 91, lon: 0 })).toBe(false);
    expect(validateRegion({ lat: 0, lon: 181 })).toBe(false);
    expect(validateRegion({ lat: 'x' as unknown as number })).toBe(false);
  });
});

describe('URL state', () => {
  it('round-trips a selection', () => {
    const q = regionToQuery({ country: 'IN', state: 'IN-AP', district: '', city: 'Vijayawada', locality: '', lat: 16.5062, lon: 80.648, label: 'x' });
    expect(q).toEqual({ country: 'IN', state: 'IN-AP', city: 'Vijayawada', lat: '16.5062', lon: '80.648' });
    const back = regionFromQuery(q);
    expect(back).toMatchObject({ state: 'IN-AP', city: 'Vijayawada', lat: 16.5062 });
  });

  it('rejects empty and malformed query', () => {
    expect(regionFromQuery({})).toBeNull();
    expect(regionFromQuery({ lat: 'abc' })).toBeNull();
    expect(regionFromQuery({ state: 'XX' })).toBeNull();
  });
});

describe('breadcrumb', () => {
  it('skips empty levels, resolves state names', () => {
    expect(breadcrumbParts({ country: 'IN', state: 'IN-AP', district: '', city: 'Vijayawada', locality: '', lat: null, lon: null, label: '' }))
      .toEqual(['INDIA', 'ANDHRA PRADESH', 'VIJAYAWADA']);
    expect(breadcrumbParts({ country: 'IN', state: '', district: '', city: '', locality: '', lat: null, lon: null, label: '' }))
      .toEqual(['INDIA']);
  });
});

describe('store locality + persistence contract', () => {
  it('locality leads the derived label', () => {
    clearRegion();
    setRegion({ city: 'Vijayawada', locality: 'Gandhi Nagar' });
    expect(getRegion().label).toBe('Gandhi Nagar → Vijayawada → IN');
    clearRegion();
  });

  it('existing label behavior preserved', () => {
    clearRegion();
    setRegion({ state: 'IN-AP', district: 'Krishna', city: 'Vijayawada', lat: 16.5, lon: 80.6 });
    expect(getRegion().label).toBe('Vijayawada → Krishna → IN-AP → IN');
    clearRegion();
    expect(getRegion().locality).toBe('');
  });
});
