'use client';
/**
 * STEP 24 — FirePanel: NASA FIRMS active-fire intelligence.
 *
 * Data flows through the Step 22 engine (`fetchDataset('firms-fires')`).
 * This deployment configures no FIRMS MAP_KEY, so the engine honestly
 * returns NOT_CONFIGURED with zero detections. No synthetic fires, ever.
 * Burn-scar context remains available via MODIS 7-2-1 on the risk map.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/platform/provenance';
import { fetchDataset, type DatasetResult } from '@/data/engine/engine';
import type { FireProperties } from '@/data/engine/adapters';

export default function FirePanel() {
  const [result, setResult] = useState<DatasetResult<FireProperties> | null>(null);

  useEffect(() => {
    let dead = false;
    fetchDataset<FireProperties>('firms-fires', {}, { timeoutMs: 10000, maxRetries: 0 })
      .then((r) => { if (!dead) setResult(r); })
      .catch(() => { if (!dead) setResult(null); });
    return () => { dead = true; };
  }, []);

  return (
    <div className="dx-hud" aria-label="Fire intelligence">
      <div className="dx-hud-edge" />
      <div className="dx-hud-head">
        <div>
          <div className="dx-micro">FIRE INTELLIGENCE · NASA FIRMS (MODIS / VIIRS / LANDSAT)</div>
          <div className="dx-hud-title">Active Fire Detections</div>
        </div>
        <StatusBadge status={result ? result.provenance.status : 'OFFLINE'} />
      </div>

      {!result && <p className="text-xs text-slate-400 mt-2">Probing fire source…</p>}

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
            <div className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
              <div className="dx-micro">DETECTIONS</div>
              <div className="text-lg font-bold text-white tnum">{result.records.length}</div>
            </div>
            <div className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
              <div className="dx-micro">SKIPPED (INVALID)</div>
              <div className="text-lg font-bold text-white tnum">{result.skipped}</div>
            </div>
            <div className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
              <div className="dx-micro">RETRIEVED</div>
              <div className="text-xs text-white font-bold">
                {new Date(result.provenance.retrievedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC
              </div>
            </div>
            <div className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
              <div className="dx-micro">CACHE</div>
              <div className="text-xs text-white font-bold">{result.cache}</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-2" role="status">
            {result.provenance.status === 'NOT_CONFIGURED'
              ? 'FIRMS MAP_KEY is not configured (free signup; key stays server-side). No synthetic fire data displayed — fire context falls back to the MODIS 7-2-1 burn-scar layer on the risk map.'
              : result.records.length === 0
                ? 'No detections returned for this query. Absence of detections is not proof of absence of fire.'
                : `${result.records.length} detection(s) via ${result.provenance.source}.`}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Source: {result.provenance.source} · {result.provenance.attribution} · {result.provenance.limitations}
          </p>

          {result.records.length > 0 && (
            <ul className="mt-2 space-y-1 text-[11px]">
              {result.records.slice(0, 20).map((r) => (
                <li key={r.id} className="p-1.5 rounded bg-[#081a2c] border border-[#132d4a] text-slate-300 flex flex-wrap gap-x-3">
                  <span className="text-[#fb923c] font-bold">
                    {r.coordinates ? `${r.coordinates.lat.toFixed(2)}, ${r.coordinates.lon.toFixed(2)}` : r.id}
                  </span>
                  <span>{r.timestamp ? new Date(r.timestamp).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : 'time unknown'}</span>
                  <span>conf {r.properties.confidence ?? '—'}</span>
                  <span>{r.properties.satellite ?? ''} {r.properties.instrument ?? ''}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 flex gap-2 flex-wrap text-[11px]">
            <Link href="/risk-map" className="px-3 py-1.5 rounded border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60 font-bold">
              OPEN RISK MAP (FIRE LAYER)
            </Link>
            <Link href="/satellite" className="px-3 py-1.5 rounded border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60 font-bold">
              SATELLITE INTEL
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
