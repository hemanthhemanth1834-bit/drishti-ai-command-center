'use client';
/**
 * DRISHTI-X live status strip for the command center:
 * WHAT IS HAPPENING · WHERE · HOW SEVERE — each pill shows
 * LIVE / RECENT / LATEST_AVAILABLE / STALE / OFFLINE / DEMO / NOT_CONFIGURED
 * with source + timestamp on hover.
 */
import { useEffect, useState } from 'react';
import { get } from '@/platform/api';
import { getWeather, getEarthquakes, gibsStatus, fireStatus } from '@/lib/liveServices';

interface Pill { label: string; state: string; detail: string; title: string }

export default function LiveStatusStrip() {
  const [pills, setPills] = useState<Pill[]>([]);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toISOString().slice(11, 19) + ' UTC'), 1000);
    setClock(new Date().toISOString().slice(11, 19) + ' UTC');
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let dead = false;
    const ctrl = new AbortController();
    (async () => {
      const [wx, qk, be] = await Promise.all([
        getWeather(21.5, 79.0, ctrl.signal),
        getEarthquakes(ctrl.signal),
        get<{ status?: string }>('/api/v1/ml/health').catch(() => ({ data: null as never, status: 'OFFLINE' as const })),
      ]);
      if (dead) return;
      const gibs = gibsStatus();
      const fire = fireStatus();
      setPills([
        {
          label: 'BACKEND', state: be.data ? 'LIVE' : 'DEMO',
          detail: be.data ? (be.data.status ?? 'reachable') : 'unreachable — demo fallback',
          title: `SOURCE: FastAPI ${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000'}`,
        },
        {
          label: 'WEATHER', state: wx.state,
          detail: wx.data ? `${wx.data.current.tempC ?? '?'}°C · rain24h ${wx.data.current.rain24hMm ?? '?'}mm` : (wx.note ?? 'unavailable'),
          title: `SOURCE: ${wx.source} · ${wx.updatedAt ?? 'no timestamp'}`,
        },
        {
          label: 'QUAKES', state: qk.state,
          detail: qk.data ? `${qk.data.countWeek} M2.5+/wk · ${qk.data.indiaCount} India` : (qk.note ?? 'unavailable'),
          title: `SOURCE: ${qk.source}`,
        },
        {
          label: 'SATELLITE', state: gibs.state,
          detail: 'VIIRS daily NRT',
          title: `SOURCE: ${gibs.source} · ${gibs.data?.latency ?? ''}`,
        },
        {
          label: 'FIRE', state: fire.state,
          detail: 'key required',
          title: `SOURCE: ${fire.source} · ${fire.note ?? ''}`,
        },
      ]);
    })();
    return () => { dead = true; ctrl.abort(); };
  }, []);

  const color = (s: string) =>
    s === 'LIVE' ? '#34d399' : s === 'RECENT' || s === 'LATEST_AVAILABLE' ? '#00d2ff'
    : s === 'DEMO' || s === 'STALE' ? '#fbbf24' : s === 'NOT_CONFIGURED' ? '#fb923c' : '#64748b';

  return (
    <div className="dx-status-ticker mx-4 mt-3" role="status" aria-label="Live feed status">
      <span><b className="text-white">FEEDS</b></span>
      {pills.length === 0 && <span>Probing feeds…</span>}
      {pills.map((p) => (
        <span key={p.label} title={`${p.title} · ${p.detail}`}>
          <i className="dx-dot" style={{ background: color(p.state), boxShadow: `0 0 8px ${color(p.state)}` }} aria-hidden="true" />
          {p.label}: <b style={{ color: color(p.state) }}>{p.state}</b> · {p.detail}
        </span>
      ))}
      <span className="ml-auto">{clock}</span>
    </div>
  );
}
