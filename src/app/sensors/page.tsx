'use client';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';
import VizFigure from '@/platform/VizFigure';

interface Row {
  sensor_id: string; lat: number; lon: number; kind: string; status: string; source: string;
  last: { soil_moisture: number; temperature: number; battery: number; signal: number; ts: string; anomaly: boolean; low_battery: boolean } | null;
}

export default function SensorsPage() {
  const net = usePlatform<{ count: number; sensors: Row[] }>('/api/v1/sensors/network', 15000);
  return (
    <ModuleShell title="Sensor Network" sub="Soil-moisture + temperature · ESP32/LoRa/MQTT/HTTP ingest ready · POST /api/v1/sensors/ingest" status={net.data ? 'LIVE' : net.status} source="DB live rows + seeded DEMO">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">NETWORK TOPOLOGY (ILLUSTRATIVE — NOT DEPLOYED HARDWARE)</div>
        <div className="mt-2"><VizFigure src="/img/sensor-net.svg" alt="Sensor network diagram with field nodes and gateway" caption="Soil / rain / tilt nodes → LoRa gateway → ingest API" status="DEMO" /></div>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">NODES ({net.data?.count ?? '…'}) — LIVE, stale &gt; 15 min marked STALE</div>
        <div className="overflow-auto">
          <table className="text-xs w-full mt-2">
            <thead><tr className="text-slate-400 text-left"><th>ID</th><th>Status</th><th>Soil%</th><th>Temp</th><th>Batt</th><th>Sig</th><th>Source</th></tr></thead>
            <tbody>
              {(net.data?.sensors ?? []).map((s) => (
                <tr key={s.sensor_id} className="border-t border-[#1b314b]">
                  <td className="text-white font-bold">{s.sensor_id}</td>
                  <td><StatusBadge status={s.status === 'online' ? 'LIVE' : s.status === 'anomaly' ? 'HIGH RISK' : 'OFFLINE'} small /></td>
                  <td className="tnum">{s.last?.soil_moisture ?? '—'}{s.last?.anomaly ? ' ⚠' : ''}</td>
                  <td className="tnum">{s.last?.temperature ?? '—'}</td>
                  <td className="tnum">{s.last?.battery ?? '—'}{s.last?.low_battery ? ' 🪫' : ''}</td>
                  <td className="tnum">{s.last?.signal ?? '—'}</td>
                  <td>{s.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Thresholds: soil ≥ 90% anomaly · battery &lt; 20% low. History per node: GET /api/v1/sensors/{'{id}'}/history. Seeded nodes are DEMO; POSTed rows are source=live.</p>
      </div>
    </ModuleShell>
  );
}
