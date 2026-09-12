// FAMILY SAFETY — demo/local profiles. No real tracking; location is a manual toggle.
'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import TrustBadge from '@/components/TrustBadge';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useLocalList, cleanText } from '@/hooks/useLocalList';
import { Users, ShieldCheck } from 'lucide-react';

type Member = {
  id: string;
  name: string;
  relation: string;
  status: 'SAFE' | 'UNREPORTED' | 'NEEDS HELP';
  lastCheckin: string;
  sharing: boolean;
  checkinRequested: boolean;
};

export default function FamilyPage() {
  const { connected } = useTelemetrySocket();
  const { items, add, update, remove } = useLocalList<Member>('drishti-family', [
    { id: 'seed-1', name: 'Demo Mother', relation: 'Mother', status: 'SAFE', lastCheckin: 'Today 09:00', sharing: true, checkinRequested: false },
  ]);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');

  function addMember() {
    const n = cleanText(name, 60);
    if (!n) return;
    add({
      id: `F-${Date.now().toString(36)}`,
      name: n,
      relation: cleanText(relation, 40) || 'Family',
      status: 'UNREPORTED',
      lastCheckin: '—',
      sharing: false,
      checkinRequested: false,
    });
    setName('');
    setRelation('');
  }

  function imSafe() {
    const now = new Date().toLocaleString();
    items.forEach((m) => update(m.id, { status: 'SAFE', lastCheckin: now, checkinRequested: false }));
  }

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-3xl mx-auto flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#00d2ff]" />
          <h1 className="text-xl font-extrabold text-white">FAMILY SAFETY</h1>
          <TrustBadge kind="DEMO" source="this device only — no live tracking" />
        </div>
        <button onClick={imSafe} className="py-3.5 rounded-xl bg-emerald-500 text-black text-lg font-extrabold flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5" /> I&apos;M SAFE
        </button>
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Member name (nickname is fine)" maxLength={60} className="flex-1 bg-[#051424] border border-[#1b314b] rounded px-3 py-2 text-sm text-white" />
          <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Relation" maxLength={40} className="w-32 bg-[#051424] border border-[#1b314b] rounded px-3 py-2 text-sm text-white" />
          <button onClick={addMember} className="px-4 rounded bg-[#00d2ff] text-black text-sm font-bold">ADD</button>
        </div>
        <div className="space-y-2">
          {items.map((m) => (
            <div key={m.id} className="p-3 rounded-xl bg-[#051424] border border-[#1b314b] text-[12px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white text-sm">{m.name} <span className="font-normal text-slate-400">· {m.relation}</span></span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    m.status === 'SAFE' ? 'bg-emerald-500/20 text-emerald-300' : m.status === 'NEEDS HELP' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-500/20 text-slate-300'
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <div className="text-slate-500 mt-0.5">
                Last check-in: {m.lastCheckin} · Location sharing: {m.sharing ? 'ON (manual)' : 'OFF'}
                {m.checkinRequested ? ' · ⏳ check-in requested' : ''}
              </div>
              <div className="mt-2 flex gap-1.5 flex-wrap">
                <button onClick={() => update(m.id, { status: 'SAFE', lastCheckin: new Date().toLocaleString(), checkinRequested: false })} className="px-2.5 py-1.5 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold">MARK SAFE</button>
                <button onClick={() => update(m.id, { checkinRequested: true })} className="px-2.5 py-1.5 rounded border border-[#1b314b] text-[11px]">REQUEST CHECK-IN</button>
                <button onClick={() => update(m.id, { sharing: !m.sharing })} className="px-2.5 py-1.5 rounded border border-[#1b314b] text-[11px]">
                  {m.sharing ? 'STOP SHARING' : 'SHARE LOCATION'}
                </button>
                <button onClick={() => update(m.id, { status: 'NEEDS HELP' })} className="px-2.5 py-1.5 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[11px] font-bold">FLAG NEEDS HELP</button>
                <button onClick={() => remove(m.id)} className="px-2.5 py-1.5 rounded text-slate-500 text-[11px]">REMOVE</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
