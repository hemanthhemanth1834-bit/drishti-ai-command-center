"use client";
import { useEffect, useRef } from "react";

export default function RadarMap({ lat = 17.385, lon = 78.4867 }: { lat?: number; lon?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
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
    })();
    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  return <div ref={ref} className="leaflet-container" />;
}
