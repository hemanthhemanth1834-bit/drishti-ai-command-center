/** Free OSM Nominatim geocoding (no API key) + geo math helpers. */

export type Place = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: string;
  category: string;
  address: Record<string, string>;
};

type NominatimRow = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  address?: Record<string, string>;
};

/** Forward-geocode a place name. Debounce callers to ~1 req/sec (usage policy). */
export async function searchPlaces(query: string, limit = 5): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=${limit}` +
    `&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`geocode ${res.status}`);
  const rows = (await res.json()) as NominatimRow[];
  return rows.map((r) => ({
    id: String(r.place_id),
    name: r.display_name,
    lat: Number(r.lat),
    lon: Number(r.lon),
    kind: r.type,
    category: r.class,
    address: r.address ?? {},
  }));
}

const R_KM = 6371;

/** Great-circle distance in km. */
export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const a =
    s1 * s1 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * s2 * s2;
  return 2 * R_KM * Math.asin(Math.sqrt(a));
}

/** Initial bearing in degrees (0=N, 90=E). */
export function bearingDeg(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((bLat * Math.PI) / 180);
  const x =
    Math.cos((aLat * Math.PI) / 180) * Math.sin((bLat * Math.PI) / 180) -
    Math.sin((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export function compass16(deg: number): string {
  return COMPASS[Math.round(deg / 22.5) % 16];
}
