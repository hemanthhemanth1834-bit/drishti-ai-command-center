'use client';
/**
 * DRISHTI-X LiveImagery wall (adapted from the Open Design `LiveImagery.js`
 * reference into this repo's provenance conventions).
 *
 * Maximum 6 useful panels. Every panel shows SOURCE · LOCATION · TIMESTAMP ·
 * STATUS. Where no real-time source exists the panel says
 * NO LIVE FEED AVAILABLE — feeds are never faked.
 */
import { useEffect, useState } from 'react';
import { StatusBadge } from '@/platform/provenance';
import { getWeather, getEarthquakes, gibsStatus, fireStatus, droneFleetStatus } from '@/lib/liveServices';

interface Panel {
  id: string;
  title: string;
  source: string;
  location: string;
  timestamp: string;
  status: string;
  body: string;
}

const CENTER = { lat: 21.5, lon: 79.0 };

export default function LiveImagery() {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    const ctrl = new AbortController();
    (async () => {
      const [wx, qk] = await Promise.all([
        getWeather(CENTER.lat, CENTER.lon, ctrl.signal),
        getEarthquakes(ctrl.signal),
      ]);
      if (dead) return;
      const gibs = gibsStatus();
      const fire = fireStatus();
      const drone = droneFleetStatus();
      const latestQuake = qk.data?.quakes[0];
      setPanels([
        {
          id: 'satellite', title: 'SATELLITE — TRUE COLOR',
          source: gibs.source, location: 'India (daily NRT composite)',
          timestamp: 'Latest daily composite (~1-day latency)',
          status: gibs.state,
          body: 'VIIRS SNPP true color via GIBS WMTS. Per-tile liveness is measured on the live map — this wall never claims fresher than the provider publishes.',
        },
        {
          id: 'weather', title: 'WEATHER — OBSERVED',
          source: wx.source, location: `${CENTER.lat}°N ${CENTER.lon}°E (central India)`,
          timestamp: wx.updatedAt ?? 'unknown',
          status: wx.state,
          body: wx.data
            ? `${wx.data.current.tempC ?? '?'}°C · rain24h ${wx.data.current.rain24hMm ?? '?'}mm · wind ${wx.data.current.windKph ?? '?'} km/h`
            : (wx.note ?? 'Weather feed unavailable'),
        },
        {
          id: 'earthquake', title: 'EARTHQUAKE — M2.5+ / 7 DAYS',
          source: qk.source, location: latestQuake ? latestQuake.place : 'Global feed',
          timestamp: latestQuake?.time ?? qk.updatedAt ?? 'unknown',
          status: qk.state,
          body: qk.data
            ? `Latest: ${latestQuake ? `M${(latestQuake.mag ?? 0).toFixed(1)} — ${latestQuake.place}` : 'none'} · ${qk.data.countWeek} events this week`
            : (qk.note ?? 'Earthquake feed unavailable'),
        },
        {
          id: 'fire', title: 'FIRE / HOTSPOT',
          source: fire.source, location: 'India',
          timestamp: '—',
          status: fire.state,
          body: 'NO LIVE FEED AVAILABLE — FIRMS MAP_KEY not configured. Burn-scar context via MODIS 7-2-1 on the live map. Hotspots are never synthesized.',
        },
        {
          id: 'drone', title: 'DRONE / FLEET',
          source: drone.source, location: 'Krishna Basin Sector 04',
          timestamp: '—',
          status: drone.state,
          body: 'NO LIVE FEED AVAILABLE — no fleet connected. Telemetry on /command is SIMULATION until hardware links.',
        },
        {
          id: 'reference', title: 'BEFORE / AFTER — REFERENCE',
          source: 'DRISHTI-X reference renders (local SVG)',
          location: 'Illustrative regions only',
          timestamp: 'Historical reference — not current',
          status: 'DEMO',
          body: 'Change-detection concept art. Gallery renders are NEVER live observations — see /satellite for the honest split.',
        },
      ]);
      setLoading(false);
    })();
    return () => { dead = true; ctrl.abort(); };
  }, []);

  return (
    <section className="dx-hud" aria-label="Live imagery wall">
      <div className="dx-hud-edge" />
      <div className="dx-hud-head">
        <div>
          <div className="dx-micro">IMAGERY WALL · HONEST FEEDS ONLY</div>
          <div className="dx-hud-title">Live Imagery (4 live-capable + 2 labeled gaps)</div>
        </div>
      </div>
      {loading && <p className="text-xs text-slate-400">Probing feeds…</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {panels.map((p) => (
          <article key={p.id} className="bg-[#091a2e] border border-[#1b314b] rounded-lg p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-extrabold tracking-wider text-white">{p.title}</h3>
              <StatusBadge status={p.status} small />
            </div>
            <p className="text-xs text-slate-200 mt-1.5">{p.body}</p>
            <dl className="text-[10px] text-slate-500 mt-2 space-y-0.5">
              <div className="flex gap-1"><dt>SOURCE:</dt><dd className="text-slate-300">{p.source}</dd></div>
              <div className="flex gap-1"><dt>LOCATION:</dt><dd className="text-slate-300">{p.location}</dd></div>
              <div className="flex gap-1"><dt>TIMESTAMP:</dt><dd className="text-slate-300">{p.timestamp}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
