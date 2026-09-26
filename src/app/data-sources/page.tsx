'use client';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';

const STATIC = [
  { provider: 'OpenStreetMap', purpose: 'Base map + Nominatim geocoding', license: 'ODbL', live: 'LIVE tiles (rate-limited)', free: 'Yes', fallback: 'CartoDB dark / Esri' },
  { provider: 'Overpass API', purpose: 'Hospitals/shelters/roads POIs', license: 'ODbL', live: 'LIVE (quota)', free: 'Yes', fallback: 'Seeded DEMO places' },
  { provider: 'Open-Meteo', purpose: 'Weather + rainfall + soil proxy', license: 'CC-BY 4.0', live: 'LIVE, no key', free: 'Yes', fallback: 'DemoWeather' },
  { provider: 'SoilGrids/ISRIC', purpose: 'Soil texture proxies', license: 'CC-BY 4.0', live: 'LIVE, no key', free: 'Yes', fallback: 'Open-Meteo soil → DEMO' },
  { provider: 'NASA GIBS', purpose: 'Satellite visualisation layers', license: 'Open', live: 'EXTERNAL tiles', free: 'Yes', fallback: 'Demo observation' },
  { provider: 'NASA GPM/Earthdata', purpose: 'Precipitation bulk', license: 'Open (login)', live: 'NOT_CONFIGURED', free: 'Yes (login)', fallback: 'Open-Meteo' },
  { provider: 'Copernicus Data Space', purpose: 'Sentinel-1/-2 tasking', license: 'Free (account)', live: 'NOT_CONFIGURED', free: 'Yes (account)', fallback: 'Demo observation' },
  { provider: 'ISRO/Bhuvan/Bhoonidhi', purpose: 'Soil + satellite (India)', license: 'Open where available', live: 'NOT_CONFIGURED', free: 'Yes', fallback: 'SoilGrids → DEMO' },
  { provider: 'SRTM/Copernicus DEM', purpose: 'Elevation (production path)', license: 'Open', live: 'PLANNED', free: 'Yes', fallback: 'Procedural DEM (demo)' },
  { provider: 'Web Push (VAPID)', purpose: 'Free push notifications', license: 'Open web standard', live: 'NOT_CONFIGURED', free: 'Yes', fallback: 'In-app queue' },
  { provider: 'SMTP / Mailpit', purpose: 'Email alerts', license: 'Open', live: 'NOT_CONFIGURED', free: 'Yes (self-host)', fallback: 'In-app queue' },
  { provider: 'Project SVG diagrams', purpose: 'Contextual visuals (public/img/)', license: 'Original, in-repo', live: 'STATIC', free: 'Yes', fallback: '—' },
  { provider: 'NASA EO archive (vendored)', purpose: 'Historical cyclone/flood/landslide photos + Kerala before/after', license: 'Public domain (NASA)', live: 'STATIC, verified', free: 'Yes', fallback: '—' },
  { provider: 'FEMA / U.S. Navy (vendored)', purpose: 'EOC + rescue archival photos', license: 'Public domain (U.S. federal)', live: 'STATIC, verified', free: 'Yes', fallback: '—' },
];

export default function DataSourcesPage() {
  const wx = usePlatform<{ providers: { name: string; status: string }[] }>('/api/v1/weather/providers');
  const nt = usePlatform<{ channels: { channel: string; status: string }[] }>('/api/v1/notifications/channels');
  return (
    <ModuleShell title="Data Sources & Attribution" sub="Provider · purpose · license · live/static · free status · fallback" status="LIVE" source="Static catalog + live provider checks">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="overflow-auto">
          <table className="text-[11px] w-full">
            <thead><tr className="text-slate-400 text-left"><th>Provider</th><th>Purpose</th><th>License</th><th>Live/Static</th><th>Free</th><th>Fallback</th></tr></thead>
            <tbody>
              {STATIC.map((r) => (
                <tr key={r.provider} className="border-t border-[#1b314b]">
                  <td className="text-white font-bold">{r.provider}</td><td>{r.purpose}</td><td>{r.license}</td>
                  <td><StatusBadge status={r.live.startsWith('LIVE') ? 'LIVE' : r.live.startsWith('EXTERNAL') ? 'EXTERNAL' : r.live === 'PLANNED' ? 'STALE' : 'NOT_CONFIGURED'} small /></td>
                  <td>{r.free}</td><td>{r.fallback}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Live checks: weather providers {wx.data ? 'reachable' : wx.status} · notify channels {nt.data ? 'reachable' : nt.status}. Last update: {new Date().toLocaleString()}.</p>
      </div>
    </ModuleShell>
  );
}
