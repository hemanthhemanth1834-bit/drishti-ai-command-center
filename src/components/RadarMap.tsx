"use client";
import { useEffect, useRef } from "react";

export type MapCircle = {
  lat: number;
  lon: number;
  radiusM: number;
  color: string;
  label?: string;
};

type Props = {
  lat?: number;
  lon?: number;
  /** Hazard / facility circles (additive — existing callers unaffected). */
  circles?: MapCircle[];
  /** Search-grid overlay for SAR pages. */
  grid?: boolean;
  /** Target marker, e.g. a place focused from Location Intel. */
  target?: { lat: number; lon: number; label?: string } | null;
};

export default function RadarMap({ lat = 17.385, lon = 78.4867, circles = [], grid = false, target = null }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);

  // Stringified overlay deps: rebuild overlays only when their content changes.
  const circlesKey = JSON.stringify(circles);
  const targetKey = JSON.stringify(target);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const liveCircles = JSON.parse(circlesKey) as MapCircle[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const liveTarget = JSON.parse(targetKey) as Props["target"];
    (async () => {
      const L = await import("leaflet");
      if (!ref.current || cancelled) return;
      if (!mapRef.current) {
        // Fix default icon paths for Next.js
        // @ts-ignore
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
        });
        mapRef.current = L.map(ref.current).setView([lat, lon], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap"
        }).addTo(mapRef.current);
        markerRef.current = L.marker([lat, lon]).addTo(mapRef.current);
      } else {
        mapRef.current.setView([lat, lon]);
        markerRef.current?.setLatLng([lat, lon]);
      }
      // Rebuild additive overlays (circles / grid / target) on every prop change.
      try {
        overlayRef.current?.clearLayers?.();
      } catch {
        /* first paint */
      }
      if (!overlayRef.current) overlayRef.current = L.layerGroup().addTo(mapRef.current);
      for (const c of liveCircles) {
        L.circle([c.lat, c.lon], {
          radius: c.radiusM,
          color: c.color,
          weight: 2,
          fillColor: c.color,
          fillOpacity: 0.18,
        })
          .bindTooltip(c.label ?? "", { direction: "top" })
          .addTo(overlayRef.current);
      }
      if (grid) {
        const step = 0.02;
        for (let i = -2; i <= 2; i++) {
          L.polyline(
            [
              [lat - 2 * step, lon + i * step],
              [lat + 2 * step, lon + i * step],
            ],
            { color: "#00d2ff", weight: 1, opacity: 0.5, dashArray: "4 4" }
          ).addTo(overlayRef.current);
          L.polyline(
            [
              [lat + i * step, lon - 2 * step],
              [lat + i * step, lon + 2 * step],
            ],
            { color: "#00d2ff", weight: 1, opacity: 0.5, dashArray: "4 4" }
          ).addTo(overlayRef.current);
        }
      }
      if (liveTarget) {
        L.marker([liveTarget.lat, liveTarget.lon], {
          title: liveTarget.label ?? "target",
        })
          .bindTooltip(liveTarget.label ?? "target", { permanent: true, direction: "top" })
          .addTo(overlayRef.current);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, circlesKey, grid, targetKey]);

  return <div ref={ref} className="leaflet-container" />;
}
