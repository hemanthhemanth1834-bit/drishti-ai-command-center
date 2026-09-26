'use client';
/**
 * Shared location context bar: breadcrumb of the ONE selected place,
 * change-location entry, and layer deep-links for that place.
 * Mounts below primary navigation on exploration pages (never homepage).
 * On mount, adopts validated ?state=&district=&city=&locality=&lat=&lon=
 * params when the store still holds the default selection.
 */
import { useEffect } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { breadcrumbParts, regionFromQuery } from '@/platform/regionUtils';
import { getRegion, setRegion, useRegion } from '@/platform/regionStore';

const LAYERS = [
  { href: '/weather', label: 'WEATHER' },
  { href: '/risk-map', label: 'RISK' },
  { href: '/earthquakes', label: 'QUAKES' },
  { href: '/events', label: 'EVENTS' },
  { href: '/satellite', label: 'SATELLITE' },
  { href: '/response', label: 'RESPONSE' },
  { href: '/resources', label: 'RESOURCES' },
];

export default function LocationContextBar() {
  const region = useRegion();

  useEffect(() => {
    try {
      const cur = getRegion();
      const isDefault = !cur.state && !cur.district && !cur.city && !cur.locality && cur.lat == null;
      if (!isDefault) return;
      const sp = new URLSearchParams(window.location.search);
      const patch = regionFromQuery({
        state: sp.get('state'),
        district: sp.get('district'),
        city: sp.get('city'),
        locality: sp.get('locality'),
        lat: sp.get('lat'),
        lon: sp.get('lon'),
      });
      if (patch) setRegion(patch);
    } catch { /* never break navigation on URL parsing */ }
  }, []);

  const crumbs = breadcrumbParts(region);

  return (
    <div className="mx-4 mt-3 rounded-xl border border-[#1b314b] bg-[#051424]/85 backdrop-blur px-4 py-2.5 font-mono" aria-label="Selected location context">
      <div className="flex items-center gap-2 flex-wrap">
        <MapPin className="w-4 h-4 text-[#00d2ff]" aria-hidden="true" />
        <span className="dx-micro">LOCATION</span>
        <nav aria-label="Location breadcrumb" className="flex items-center gap-1.5 text-xs font-bold text-white flex-wrap">
          {crumbs.map((c, i) => (
            <span key={`${c}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-600" aria-hidden="true">/</span>}
              <span>{c}</span>
            </span>
          ))}
        </nav>
        {region.lat != null && region.lon != null && (
          <span className="text-[11px] text-slate-400 tnum">
            {region.lat.toFixed(3)}°N, {region.lon.toFixed(3)}°E
          </span>
        )}
        <Link
          href="/regions"
          className="dx-touch ml-auto px-3 py-1.5 rounded-lg border border-[#00d2ff]/60 text-[#00d2ff] text-[11px] font-bold hover:bg-[#00d2ff]/10"
        >
          CHANGE LOCATION
        </Link>
      </div>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[10px]" aria-label="Intelligence layers for this location">
        <span className="dx-micro">DATA CONTEXT</span>
        {LAYERS.map((l) => (
          <Link key={l.href} href={l.href} className="px-2 py-1 rounded border border-[#1b314b] text-slate-300 hover:border-[#00d2ff]/60 hover:text-white font-bold">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
