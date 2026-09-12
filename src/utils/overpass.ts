/** Free OSM amenity lookup via Overpass (no key). Falls back to demo on failure. */

export type OsmPlace = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: string;
};

type OverpassResp = {
  elements?: {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }[];
};

const KIND_LABEL: Record<string, string> = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  pharmacy: 'Pharmacy',
  doctors: 'Doctor',
  police: 'Police',
  fire_station: 'Fire Station',
  ambulance_station: 'Ambulance',
};

/** Real nearby help from OpenStreetMap. Throws on network/timeout — caller shows demo. */
export async function queryNearbyHelp(
  lat: number,
  lon: number,
  radiusM = 6000
): Promise<OsmPlace[]> {
  const q = `[out:json][timeout:12];(node["amenity"~"hospital|clinic|pharmacy|doctors|police|fire_station"](around:${radiusM},${lat},${lon});way["amenity"~"hospital|police|fire_station"](around:${radiusM},${lat},${lon});node["emergency"~"ambulance_station|fire_station"](around:${radiusM},${lat},${lon}););out center 20;`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(q),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`overpass ${res.status}`);
    const j = (await res.json()) as OverpassResp;
    const out: OsmPlace[] = [];
    for (const el of j.elements ?? []) {
      const la = el.lat ?? el.center?.lat;
      const lo = el.lon ?? el.center?.lon;
      if (la === undefined || lo === undefined) continue;
      const amenity = el.tags?.amenity ?? el.tags?.emergency ?? 'amenity';
      out.push({
        id: `${el.type}/${el.id}`,
        name: el.tags?.name ?? `Unnamed ${amenity.replace(/_/g, ' ')}`,
        lat: la,
        lon: lo,
        kind: KIND_LABEL[amenity] ?? amenity.replace(/_/g, ' '),
      });
      if (out.length >= 20) break;
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}
