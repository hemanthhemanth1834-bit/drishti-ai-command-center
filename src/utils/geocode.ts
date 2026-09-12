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

type ReverseRow = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  address?: Record<string, string>;
};

/** Reverse-geocode GPS coordinates into a Place (address details included). */
export async function reverseGeocode(lat: number, lon: number): Promise<Place> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1` +
    `&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`reverse-geocode ${res.status}`);
  const r = (await res.json()) as ReverseRow;
  if (!r || !r.display_name) throw new Error('no address found for these coordinates');
  return {
    id: `gps-${lat.toFixed(5)},${lon.toFixed(5)}`,
    name: r.display_name,
    lat: Number(r.lat),
    lon: Number(r.lon),
    kind: r.type ?? 'position',
    category: r.class ?? 'gps',
    address: r.address ?? {},
  };
}

export type GpsFix = { lat: number; lon: number; accuracyM: number };

/** One-shot browser GPS read. Requires HTTPS (or localhost) + user permission. */
export function getLivePosition(timeoutMs = 15000): Promise<GpsFix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('geolocation not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED)
          reject(new Error('location permission denied — allow access and retry'));
        else if (err.code === err.POSITION_UNAVAILABLE)
          reject(new Error('position unavailable — check GPS / network'));
        else if (err.code === err.TIMEOUT)
          reject(new Error('GPS timed out — try again outdoors'));
        else reject(new Error('could not read position'));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
    );
  });
}
