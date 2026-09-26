/**
 * Shared location helpers: hierarchy parsing, validation, URL state.
 * Pure + deterministic (unit-tested). Only verified static data from
 * config/regions is used — district display names come from the backend
 * registry at runtime, never invented here.
 */
import { SHOWCASE_CITIES, STATE_NAMES } from '../config/regions';
import type { RegionSelection } from './regionStore';

export interface ParsedCityCode {
  country: string;
  state: string;
  district: string;
  city: string;
}

/** Split 'IN-AP-KRI-VJA' into hierarchy codes. Null when malformed. */
export function parseCityCode(code: string): ParsedCityCode | null {
  if (typeof code !== 'string') return null;
  const parts = code.split('-');
  if (parts.length !== 4 || parts.some((p) => !p)) return null;
  const [country, state, district, city] = parts;
  if (country !== 'IN') return null;
  return { country, state: `${country}-${state}`, district: `${country}-${state}-${district}`, city: code };
}

/** Static showcase lookup by full city code. */
export function cityByCode(code: string) {
  return SHOWCASE_CITIES.find((c) => c.code === code) ?? null;
}

export function stateName(code: string): string {
  return STATE_NAMES[code] ?? code;
}

/** Build a store selection from a verified showcase city (no invented names). */
export function cityToSelection(code: string): Partial<RegionSelection> | null {
  const node = cityByCode(code);
  if (!node || node.lat == null || node.lon == null) return null;
  const parsed = parseCityCode(node.code);
  if (!parsed) return null;
  return {
    country: parsed.country,
    state: parsed.state,
    district: '',
    city: node.name,
    locality: '',
    lat: node.lat,
    lon: node.lon,
  };
}

/** Validate a region patch: known state codes, sane coordinates. */
export function validateRegion(patch: Partial<RegionSelection>): boolean {
  if (patch.state !== undefined && patch.state !== '' && !(patch.state in STATE_NAMES)) return false;
  if (patch.lat !== undefined && patch.lat !== null && (typeof patch.lat !== 'number' || patch.lat < -90 || patch.lat > 90)) return false;
  if (patch.lon !== undefined && patch.lon !== null && (typeof patch.lon !== 'number' || patch.lon < -180 || patch.lon > 180)) return false;
  return true;
}

/** Serialize a selection to URL params (non-empty values only). */
export function regionToQuery(r: RegionSelection): Record<string, string> {
  const out: Record<string, string> = {};
  if (r.country) out.country = r.country;
  if (r.state) out.state = r.state;
  if (r.district) out.district = r.district;
  if (r.city) out.city = r.city;
  if (r.locality) out.locality = r.locality;
  if (r.lat != null) out.lat = String(r.lat);
  if (r.lon != null) out.lon = String(r.lon);
  return out;
}

/** Parse + validate URL params into a store patch. Null when empty/invalid. */
export function regionFromQuery(params: Record<string, string | null | undefined>): Partial<RegionSelection> | null {
  const patch: Partial<RegionSelection> = {};
  for (const k of ['state', 'district', 'city', 'locality'] as const) {
    const v = params[k];
    if (typeof v === 'string' && v.trim()) patch[k] = v.trim().slice(0, 80);
  }
  if (params.lat != null && params.lat !== '') {
    const lat = Number(params.lat);
    if (!Number.isFinite(lat)) return null;
    patch.lat = lat;
  }
  if (params.lon != null && params.lon !== '') {
    const lon = Number(params.lon);
    if (!Number.isFinite(lon)) return null;
    patch.lon = lon;
  }
  if (Object.keys(patch).length === 0) return null;
  if (!validateRegion(patch)) return null;
  return patch;
}

/** Breadcrumb parts for display (codes resolved to names where known). */
export function breadcrumbParts(r: RegionSelection): string[] {
  const parts: string[] = [];
  parts.push(r.country === 'IN' ? 'INDIA' : r.country || 'INDIA');
  if (r.state) parts.push(stateName(r.state).toUpperCase());
  if (r.district) parts.push(r.district.toUpperCase());
  if (r.city) parts.push(r.city.toUpperCase());
  if (r.locality) parts.push(r.locality.toUpperCase());
  return parts;
}
