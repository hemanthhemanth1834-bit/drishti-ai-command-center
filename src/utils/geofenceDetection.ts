/** Point-in-polygon collision math (ray-casting) for geofence breaches. */
export type LatLon = { lat: number; lon: number };

export function isInsideGeofence(
  point: LatLon,
  polygon: LatLon[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lon;
    const yi = polygon[i].lat;
    const xj = polygon[j].lon;
    const yj = polygon[j].lat;
    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lon < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Default Hyderabad operations geofence (rough rectangle). */
export const HYDERABAD_GEOFENCE: LatLon[] = [
  { lat: 17.3757 - 0.05, lon: 78.4669 - 0.05 },
  { lat: 17.3757 - 0.05, lon: 78.4669 + 0.05 },
  { lat: 17.3757 + 0.05, lon: 78.4669 + 0.05 },
  { lat: 17.3757 + 0.05, lon: 78.4669 - 0.05 },
];

export function checkGeofenceBreach(point: LatLon): boolean {
  return !isInsideGeofence(point, HYDERABAD_GEOFENCE);
}
