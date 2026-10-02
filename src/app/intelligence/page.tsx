'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import LocationContextBar from '@/components/location/LocationContextBar';
import { usePlatform } from '@/platform/usePlatform';
import DisasterPhoto from '@/components/visuals/DisasterPhoto';
import { getDisasterImage } from '@/data/disasterImages';
import SituationBrief from '@/components/intelligence/SituationBrief';

const DisasterGlobe = dynamic(
  () => import('@/components/3d/DisasterGlobe'),
  { ssr: false, loading: () => <p className="text-xs text-slate-400">Loading 3D globe…</p> }
);

const MODULES = [
  ['/risk-map', 'Risk Map', 'NER GIS heatmap + layers'],
  ['/weather', 'Weather', 'Rainfall intelligence + thresholds'],
  ['/satellite', 'Satellite', 'Change observation + provenance'],
  ['/terrain', 'Terrain', 'Slope/aspect + twin params'],
  ['/history', 'History', 'Incident DB + CSV import'],
  ['/incidents', 'Incidents', 'Field reports + verify'],
  ['/roads', 'Roads', 'Blockage + impact'],
  ['/response', 'Response', 'P1..P4 priority queue'],
  ['/notifications', 'Notifications', 'Router + templates + push'],
  ['/offline', 'Offline PWA', 'Queue + sync + cache'],
  ['/data-sources', 'Data Sources', 'Attribution + status'],
  ['/admin', 'Admin', 'Roles + audit + config'],
];

function Dot({ ok }: { ok: boolean }) {
  return <span style={{ width: 8, height: 8, borderRadius: 99, background: ok ? '#34d399' : '#fb923c', display: 'inline-block' }} />;
}

export default function IntelligencePage() {
  const wx = usePlatform<{ providers: { name: string; status: string }[] }>('/api/v1/weather/providers');
  const ch = usePlatform<{ channels: { channel: string; status: string }[] }>('/api/v1/notifications/channels');
  const sy = usePlatform<{ pending_verification: number }>('/api/v1/sync/status');
  return (
    <>
      <LocationContextBar />
    <ModuleShell title="Intelligence Hub" sub="REAL/OPEN DATA → RAINFALL → FLOOD RISK → GIS → EARLY WARNING → RESPONSE → VERIFY → LEARN" status="LIVE" source="Platform APIs + open providers">
      <SituationBrief />
      <DisasterGlobe height={320} />
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">SYSTEM STATUS</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
          <div>Weather <Dot ok={!!wx.data} /> {wx.loading ? '…' : `${wx.data?.providers.length ?? 0} providers`}</div>
          <div>Notify <Dot ok={!!ch.data} /> {ch.loading ? '…' : `${ch.data?.channels.length ?? 0} channels`}</div>
          <div>Sync queue <Dot ok={(sy.data?.pending_verification ?? 0) === 0} /> {sy.loading ? '…' : `${sy.data?.pending_verification ?? '?'} pending`}</div>
        </div>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">PIPELINE</div>
        <p className="text-xs text-slate-300 mt-1">FREE DATA (Open-Meteo · NASA GIBS · OSM · open DEM) → INGEST → VALIDATE → RAINFALL FEATURES → FLOOD RISK → GIS → EARLY WARNING → AUTHORITY + CITIZEN RESPONSE</p>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">CURRENT SITUATION — CONTEXT, NOT LIVE EVENTS</div>
        <div className="nesafe-vizgrid mt-2">
          <Link href="/risk-map" style={{ textDecoration: 'none' }}><DisasterPhoto photo={getDisasterImage('landslide-debris-flow')!} caption="Landslide risk (observed debris flow, archival)" status="DEMO" bare /></Link>
          <Link href="/weather" style={{ textDecoration: 'none' }}><DisasterPhoto photo={getDisasterImage('flood-ganges')!} caption="Flood watch (observed inundation, archival)" status="DEMO" bare /></Link>
          <Link href="/satellite" style={{ textDecoration: 'none' }}><DisasterPhoto photo={getDisasterImage('satellite-kerala-after')!} caption="Change watch (observed inundation, archival)" status="DEMO" bare /></Link>
          <Link href="/terrain" style={{ textDecoration: 'none' }}><DisasterPhoto photo={getDisasterImage('terrain-himalaya')!} caption="Terrain (orbital context, not a DEM render)" status="DEMO" bare /></Link>
          <Link href="/incidents" style={{ textDecoration: 'none' }}><DisasterPhoto photo={getDisasterImage('road-hebgen-highway')!} caption="Field reports (road damage, archival)" status="DEMO" bare /></Link>
          <Link href="/response" style={{ textDecoration: 'none' }}><DisasterPhoto photo={getDisasterImage('response-harvey-rescue')!} caption="Response (rescue operations, archival)" status="DEMO" bare /></Link>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MODULES.map(([href, t, d]) => (
          <Link key={href} href={href} className="dx-hud" style={{ textDecoration: 'none' }}>
            <div className="text-sm font-bold text-white">{t}</div>
            <div className="text-[11px] text-slate-400">{d}</div>
          </Link>
        ))}
      </div>
      <StatusBadge status="DEMO" />
    </ModuleShell>
    </>
  );
}
