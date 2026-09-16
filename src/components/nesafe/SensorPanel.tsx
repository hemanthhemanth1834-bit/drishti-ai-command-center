'use client';
/** Animated sensor list + detail popup (glowing rings live in 3D; this is the data twin). */
import { useEffect, useState } from 'react';
import { sensorProvider } from '@/nesafe/providers/demoProviders';
import type { SensorReading } from '@/nesafe/providers/types';
import ModeBadge from './ModeBadge';

const DOT: Record<string, string> = { NORMAL: '#34d399', WARNING: '#fbbf24', HIGH: '#fb923c', CRITICAL: '#ff5470', OFFLINE: '#475569' };

export default function SensorPanel({ focusId, onFocus }: { focusId: string | null; onFocus: (id: string) => void }) {
  const [rows, setRows] = useState<SensorReading[]>([]);
  useEffect(() => {
    let live = true;
    const load = async () => { try { const l = await sensorProvider.list(); if (live) setRows(l); } catch { /* noop */ } };
    load();
    const id = setInterval(load, 2500);
    return () => { live = false; clearInterval(id); };
  }, []);
  const sel = rows.find((r) => r.id === focusId) ?? null;
  return (
    <div className="nesafe-glass">
      <div className="nesafe-row" style={{ justifyContent: 'space-between' }}>
        <b>📡 3D IoT SENSOR NETWORK</b><ModeBadge />
      </div>
      <div className="nesafe-sensors">
        {rows.map((r) => (
          <button key={r.id} onClick={() => onFocus(r.id)} className={r.id === focusId ? 'on' : ''}>
            <i style={{ background: DOT[r.state] }} />{r.id}
            <small>{r.state} · {r.soilMoisturePct}%</small>
          </button>
        ))}
      </div>
      {sel ? (
        <div className="nesafe-sensor-detail">
          <b>SENSOR {sel.id}</b>
          <div>Soil Moisture <b>{sel.soilMoisturePct}%</b></div>
          <div>Tilt <b>{sel.tiltDeg}°</b></div>
          <div>Ground Movement <b>{sel.groundMoveMm}mm</b></div>
          <div>Battery <b>{sel.batteryPct}%</b></div>
          <div>Last update <b>{sel.updatedAgoSec} sec ago</b></div>
          <div>State <b style={{ color: DOT[sel.state] }}>{sel.state}</b></div>
        </div>
      ) : (<p className="nesafe-note">Click a sensor node on the terrain or above to inspect.</p>)}
      <div className="nesafe-flow" aria-hidden>
        {['Sensor ●', 'Cloud', 'AI', 'GIS', 'Alert'].map((s, i) => (
          <span key={s}>{s}{i < 4 ? ' → ' : ''}<i className="nesafe-pkt" style={{ animationDelay: `${i * 0.4}s` }} /></span>
        ))}
      </div>
      <p className="nesafe-note">LIVE-STYLE DATA FLOW · animated particles show Sensor → Cloud → AI → GIS → Alert (demo).</p>
    </div>
  );
}
