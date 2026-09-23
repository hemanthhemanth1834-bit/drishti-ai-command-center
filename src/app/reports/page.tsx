'use client';
/**
 * DRISHTI-X Reports — operational summary + CSV export.
 * Reads the preserved incident/response APIs; degrades to labeled DEMO
 * when the backend is unreachable. No functionality removed elsewhere.
 */
import { useEffect, useState } from 'react';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { get } from '@/platform/api';
import { DEMO_INCIDENTS, DEMO_SOURCE } from '@/data/operational';

interface Incident {
  id: string; type: string; severity: string; verified: boolean;
  lat: number; lon: number;
}

export default function ReportsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [status, setStatus] = useState('DEMO');
  const [note, setNote] = useState(DEMO_SOURCE);

  useEffect(() => {
    let dead = false;
    get<{ incidents: Incident[] }>('/api/v1/incidents?limit=100').then((r) => {
      if (dead) return;
      if (r.data && r.data.incidents.length > 0) {
        setIncidents(r.data.incidents);
        setStatus('LIVE');
        setNote('DRISHTI-X incident API');
      } else {
        setIncidents(DEMO_INCIDENTS.map((d) => ({
          id: d.id, type: d.type, severity: d.severity,
          verified: d.status === 'VERIFIED', lat: d.lat, lon: d.lon,
        })));
        setStatus('DEMO');
      }
    }).catch(() => {
      if (!dead) {
        setIncidents(DEMO_INCIDENTS.map((d) => ({
          id: d.id, type: d.type, severity: d.severity,
          verified: d.status === 'VERIFIED', lat: d.lat, lon: d.lon,
        })));
      }
    });
    return () => { dead = true; };
  }, []);

  const counts = incidents.reduce<Record<string, number>>((a, i) => {
    a[i.severity] = (a[i.severity] ?? 0) + 1;
    return a;
  }, {});

  function exportCsv() {
    const rows = [['id', 'type', 'severity', 'verified', 'lat', 'lon', 'status'],
      ...incidents.map((i) => [i.id, i.type, i.severity, String(i.verified), String(i.lat), String(i.lon), status])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drishti-x-incident-report-${status.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ModuleShell
      title="Reports"
      sub="Incident summary + export. DEMO rows are never presented as verified field data."
      status={status}
      source={note}
      right={<button onClick={exportCsv} className="text-xs px-3 py-1.5">Export CSV</button>}
    >
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">SEVERITY SUMMARY ({incidents.length} INCIDENTS)</div>
        <div className="flex gap-2 flex-wrap mt-2 text-xs">
          {Object.keys(counts).length === 0 && <span className="text-slate-400">No incidents in scope.</span>}
          {Object.entries(counts).map(([sev, n]) => (
            <span key={sev} className="bg-[#091a2e] border border-[#1b314b] rounded-lg px-3 py-1.5">
              {sev}: <b className="text-white">{n}</b>
            </span>
          ))}
          <span className="ml-auto"><StatusBadge status={status} small /></span>
        </div>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">INCIDENT LEDGER</div>
        {incidents.map((i) => (
          <div key={i.id} className="text-xs py-1.5 border-b border-[#1b314b] flex justify-between gap-2 flex-wrap">
            <span className="text-slate-200"><b>{i.id}</b> · {i.type} · {i.severity}</span>
            <span className="text-slate-500">{i.verified ? 'VERIFIED' : 'UNVERIFIED'} · {i.lat.toFixed(2)}, {i.lon.toFixed(2)}</span>
          </div>
        ))}
        <p className="text-[10px] text-slate-500 mt-2">
          DETECT → VERIFY → UNDERSTAND → RESPOND → MONITOR → RESOLVE. Exports carry the {status} flag in the filename.
        </p>
      </div>
    </ModuleShell>
  );
}
