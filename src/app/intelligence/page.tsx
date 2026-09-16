'use client';
import Link from 'next/link';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';

const MODULES = [
  ['/prediction', 'Prediction', 'AI landslide probability + WHY'],
  ['/risk-map', 'Risk Map', 'NER GIS heatmap + layers'],
  ['/weather', 'Weather', 'Rainfall intelligence + thresholds'],
  ['/sensors', 'Sensors', 'Soil-moisture network + ingest'],
  ['/satellite', 'Satellite', 'Change observation + provenance'],
  ['/terrain', 'Terrain', 'Slope/aspect + twin params'],
  ['/history', 'History', 'Incident DB + CSV import'],
  ['/ml', 'ML Lab', 'Train/infer/explain pipeline'],
  ['/model-health', 'Model Health', 'Metrics + drift (honest)'],
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
  const ml = usePlatform<{ status: string; f1: unknown }>('/api/v1/ml/health');
  const wx = usePlatform<{ providers: { name: string; status: string }[] }>('/api/v1/weather/providers');
  const ch = usePlatform<{ channels: { channel: string; status: string }[] }>('/api/v1/notifications/channels');
  const sy = usePlatform<{ pending_verification: number }>('/api/v1/sync/status');
  return (
    <ModuleShell title="Intelligence Hub" sub="REAL/OPEN DATA → AI/ML → RISK → GIS → EARLY WARNING → RESPONSE → VERIFY → LEARN" status="LIVE" source="Platform APIs + open providers">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">SYSTEM STATUS</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
          <div>ML model <Dot ok={ml.data?.status === 'HEALTHY'} /> {ml.loading ? '…' : String(ml.data?.status ?? ml.status)}</div>
          <div>Weather <Dot ok={!!wx.data} /> {wx.loading ? '…' : `${wx.data?.providers.length ?? 0} providers`}</div>
          <div>Notify <Dot ok={!!ch.data} /> {ch.loading ? '…' : `${ch.data?.channels.length ?? 0} channels`}</div>
          <div>Sync queue <Dot ok={(sy.data?.pending_verification ?? 0) === 0} /> {sy.loading ? '…' : `${sy.data?.pending_verification ?? '?'} pending`}</div>
        </div>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">PIPELINE</div>
        <p className="text-xs text-slate-300 mt-1">FREE DATA (Open-Meteo · SoilGrids · OSM · open DEM) → INGEST → VALIDATE → FEATURES → OPEN-SOURCE ML → RISK → GIS HEATMAP → EARLY WARNING → WEB PUSH/APP → AUTHORITY + CITIZEN PWA → FIELD REPORT → IMAGE ANALYSIS → DATABASE → LEARN</p>
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
  );
}
