// CITIZEN INCIDENT REPORTING — local demo storage with status pipeline.
'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import TrustBadge from '@/components/TrustBadge';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useLocalList, cleanText } from '@/hooks/useLocalList';
import { getLivePosition } from '@/utils/geocode';
import type { StoredIncident } from '@/data/providers';
import { FileWarning, Camera } from 'lucide-react';

const TYPES = ['Flood', 'Fire', 'Road blocked', 'Building collapse', 'Power outage', 'Landslide', 'Medical emergency', 'Missing person', 'Other'];
const SEV = ['low', 'moderate', 'high', 'critical'] as const;
const FLOW: StoredIncident['status'][] = ['SUBMITTED', 'UNDER REVIEW', 'VERIFIED', 'RESPONDED', 'RESOLVED'];

export default function ReportPage() {
  const { connected } = useTelemetrySocket();
  const { items, add, update } = useLocalList<StoredIncident & { photo?: string }>('drishti-reports');
  const [form, setForm] = useState({ type: TYPES[0], desc: '', severity: 'moderate' as (typeof SEV)[number], photo: '' });
  const [coords, setCoords] = useState('');
  const [note, setNote] = useState('');

  async function attachGps() {
    try {
      const fix = await getLivePosition();
      setCoords(`${fix.lat.toFixed(3)}, ${fix.lon.toFixed(3)}`);
    } catch (e: unknown) {
      setNote((e as Error).message);
    }
  }

  function onPhoto(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_500_000) {
      setNote('Photo too large — please pick one under 1.5 MB.');
      return;
    }
    const r = new FileReader();
    r.onload = () => setForm((f) => ({ ...f, photo: String(r.result ?? '').slice(0, 1_500_000) }));
    r.readAsDataURL(file);
  }

  function submit() {
    const desc = cleanText(form.desc, 500);
    if (!desc) {
      setNote('Please describe the incident in a few words.');
      return;
    }
    const [la, lo] = coords.split(',').map((s) => Number(s.trim()));
    add({
      id: `IN-${Date.now().toString(36).toUpperCase()}`,
      type: form.type,
      desc,
      lat: Number.isFinite(la) ? la : undefined,
      lon: Number.isFinite(lo) ? lo : undefined,
      time: new Date().toLocaleString(),
      severity: form.severity,
      status: 'SUBMITTED',
      photo: form.photo || undefined,
    });
    setForm({ type: TYPES[0], desc: '', severity: 'moderate', photo: '' });
    setCoords('');
    setNote('Report saved on this device (demo storage).');
  }

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-3xl mx-auto flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FileWarning className="w-5 h-5 text-amber-300" />
          <h1 className="text-xl font-extrabold text-white">REPORT INCIDENT</h1>
          <TrustBadge kind="DEMO" source="stored on this device only" />
        </div>
        <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-white" aria-label="Incident type">
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as (typeof SEV)[number] })} className="bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-white" aria-label="Severity">
            {SEV.map((s) => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
          <input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="What happened? (no names/phone numbers)" maxLength={500} className="sm:col-span-2 bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-white" />
          <input value={coords} onChange={(e) => setCoords(e.target.value)} placeholder="Location: lat, lon — or attach GPS" className="bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-white" />
          <div className="flex gap-2">
            <button onClick={attachGps} className="flex-1 py-2 rounded border border-[#1b314b] text-xs font-bold">📍 ATTACH GPS</button>
            <label className="flex-1 py-2 rounded border border-[#1b314b] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
              <Camera className="w-3.5 h-3.5" /> PHOTO
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
            </label>
          </div>
          <button onClick={submit} className="sm:col-span-2 py-2.5 rounded bg-[#00d2ff] text-black font-bold">SUBMIT REPORT</button>
          {note && <div className="sm:col-span-2 text-[12px] text-amber-300">{note}</div>}
        </div>
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="p-3 rounded-xl bg-[#051424] border border-[#1b314b] text-[12px]">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-white">{r.type} · {r.severity.toUpperCase()}</span>
                <span className="px-2 py-0.5 rounded bg-[#00d2ff]/15 border border-[#00d2ff]/40 text-[#00d2ff] font-bold text-[10px]">
                  {r.status}
                </span>
              </div>
              <div className="text-slate-300 mt-1">{r.desc}</div>
              <div className="text-slate-500 mt-0.5">{r.time}{r.lat !== undefined ? ` · ${r.lat}, ${r.lon}` : ''}</div>
              <div className="mt-1.5 flex gap-1.5 flex-wrap">
                {FLOW.map((s) => (
                  <button
                    key={s}
                    onClick={() => update(r.id, { status: s })}
                    className={`px-2 py-1 rounded border text-[10px] ${
                      r.status === s ? 'bg-[#00d2ff] text-black font-bold border-[#00d2ff]' : 'border-[#1b314b] text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-slate-500 text-sm text-center py-4">No reports yet — submitted ones appear here.</div>
          )}
        </div>
      </div>
    </main>
  );
}
