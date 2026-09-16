'use client';
import { useEffect, useState } from 'react';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { API_BASE } from '@/platform/api';
import VizFigure from '@/platform/VizFigure';
import { cacheGet, cachePut, onReconnect, queueAdd, queueList, syncNow } from '@/platform/offlineDb';

const KEY = (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_GATEWAY_KEY as string)) || '';

export default function OfflinePage() {
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<{ key: string; kind: string }[]>([]);
  const [msg, setMsg] = useState('');
  const [cached, setCached] = useState<string[]>([]);

  const refresh = async () => {
    setQueue((await queueList()).map((q) => ({ key: q.key, kind: q.kind })));
    const out: string[] = [];
    for (const k of ['risk:last', 'alerts:last']) {
      const hit = await cacheGet(k);
      if (hit) out.push(`${k} · ${new Date(hit.ts).toLocaleString()}`);
    }
    setCached(out);
  };

  useEffect(() => {
    setOnline(navigator.onLine);
    refresh();
    const off1 = onReconnect(() => { setOnline(true); sync(); });
    const off2 = () => setOnline(false);
    window.addEventListener('offline', off2);
    try {
      fetch(`${API_BASE}/api/v1/alerts?limit=5`).then((r) => r.json()).then((j) => cachePut('alerts:last', j)).catch(() => {});
    } catch { /* noop */ }
    return () => { off1(); window.removeEventListener('offline', off2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = async () => {
    try {
      const r = await syncNow(API_BASE, KEY);
      setMsg(`AUTO SYNC: ${r.synced} item(s) accepted${KEY ? '' : ' (no key — server may 401; queue kept)'}`);
    } catch { setMsg('Sync failed — queue kept, will retry.'); }
    refresh();
  };

  const demoQueue = async () => {
    await queueAdd('reading', { sensor_id: 'FIELD-1', soil_moisture: 81 });
    refresh();
  };

  return (
    <ModuleShell title="Offline / Low-Network PWA" sub="Cached map · risk · alerts · GPS · photo/video · queue · auto-sync" status={online ? 'LIVE' : 'OFFLINE'} source="Service Worker + IndexedDB">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">SYNC FLOW (TECHNICAL DIAGRAM — NOT A SCREENSHOT)</div>
        <div className="mt-2"><VizFigure src="/img/offline-sync.svg" alt="Offline sync flow diagram" caption="Online → network lost → IndexedDB queue → restored → receipt" status="LIVE" /></div>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">{online ? 'ONLINE' : 'OFFLINE MODE'}</div>
        <div className="text-xs mt-1">✓ Cached risk map ✓ Latest alerts ✓ GPS ✓ Photo ✓ Video ✓ Incident report ✓ Local queue</div>
        <div className="text-xs mt-2">Queued: <b>{queue.length}</b> {queue.map((q) => q.kind).join(', ')}</div>
        <div className="text-xs">Cache: {cached.join(' · ') || 'warming up…'}</div>
        <div className="flex gap-2 mt-2">
          <button onClick={sync} className="text-xs bg-[#00d2ff] text-black font-bold rounded px-3 py-1">SYNC NOW</button>
          <button onClick={demoQueue} className="text-xs bg-[#051424] border border-[#1b314b] rounded px-3 py-1">queue demo reading</button>
        </div>
        {msg && <p className="text-xs mt-1">{msg}</p>}
        {!online && <p className="text-xs mt-1 text-amber-200">OFFLINE — reports are queued locally and never lost.</p>}
      </div>
    </ModuleShell>
  );
}
