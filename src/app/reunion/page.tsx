// src/app/reunion/page.tsx — OP-MILAN family reunification match queue
// NOTE: candidate ranking here is a transparent demo heuristic (camp + age +
// name overlap). ResNet-101 facial-model integration is pending backend support.
'use client';
import { useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { ScanFace, UserPlus, HeartHandshake, Info } from 'lucide-react';

type Person = {
  id: string;
  name: string;
  age: number;
  camp: string;
  contact: string;
  note: string;
  reunited: boolean;
};

const CAMPS = ['City Sports Complex', 'Riverbend Hall', 'Cantonment Ground'];

const SEED_FOUND: Person[] = [
  { id: 'F-201', name: 'Anitha Rao', age: 34, camp: 'City Sports Complex', contact: 'desk-2', note: 'Checked in via kiosk', reunited: false },
  { id: 'F-202', name: 'Ravi Kumar', age: 41, camp: 'City Sports Complex', contact: 'desk-2', note: 'Checked in via kiosk', reunited: false },
  { id: 'F-203', name: 'Meera Sharma', age: 29, camp: 'Riverbend Hall', contact: 'desk-5', note: 'Medical tent', reunited: false },
];

const SEED_MISSING: Person[] = [
  { id: 'M-101', name: 'Anita Rao', age: 33, camp: 'City Sports Complex', contact: '99870xxxx1', note: 'Reported by brother', reunited: false },
  { id: 'M-102', name: 'Kiran Verma', age: 52, camp: 'Riverbend Hall', contact: '99870xxxx2', note: 'Last seen Bund Rd', reunited: false },
];

function nameOverlap(a: string, b: string): number {
  const ta = new Set(a.toLowerCase().split(/\s+/));
  const tb = new Set(b.toLowerCase().split(/\s+/));
  let hit = 0;
  ta.forEach((t) => {
    if (tb.has(t)) hit += 1;
  });
  return Math.min(1, hit / Math.max(1, Math.min(ta.size, tb.size)));
}

/** Transparent demo score with breakdown (NOT a facial-recognition result). */
function scoreCandidate(m: Person, f: Person) {
  const campPts = m.camp === f.camp ? 40 : 0;
  const agePts = Math.abs(m.age - f.age) <= 5 ? 30 : 0;
  const namePts = Math.round(nameOverlap(m.name, f.name) * 30);
  return { total: campPts + agePts + namePts, campPts, agePts, namePts };
}

export default function ReunionPage() {
  const { connected } = useTelemetrySocket();
  const [missing, setMissing] = useState<Person[]>(SEED_MISSING);
  const [found, setFound] = useState<Person[]>(SEED_FOUND);
  const [activeId, setActiveId] = useState<string>(SEED_MISSING[0].id);
  const [form, setForm] = useState({ name: '', age: '', camp: CAMPS[0], contact: '', note: '' });

  const active = missing.find((m) => m.id === activeId) ?? missing[0];

  const ranked = useMemo(() => {
    if (!active) return [];
    return found
      .filter((f) => !f.reunited)
      .map((f) => ({ person: f, score: scoreCandidate(active, f) }))
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, 5);
  }, [active, found]);

  function report() {
    if (!form.name.trim() || !form.age) return;
    const p: Person = {
      id: `M-${103 + missing.length}`,
      name: form.name.trim(),
      age: Number(form.age),
      camp: form.camp,
      contact: form.contact.trim() || '—',
      note: form.note.trim() || '—',
      reunited: false,
    };
    setMissing((l) => [p, ...l]);
    setActiveId(p.id);
    setForm({ name: '', age: '', camp: CAMPS[0], contact: '', note: '' });
  }

  function reunite(missingId: string, foundId: string) {
    setMissing((l) => l.map((m) => (m.id === missingId ? { ...m, reunited: true } : m)));
    setFound((l) => l.map((f) => (f.id === foundId ? { ...f, reunited: true } : f)));
  }

  const open = missing.filter((m) => !m.reunited);

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="px-4 pt-3 flex items-start gap-2 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#00d2ff]" />
        <span>
          OP-MILAN queue scaffold — ranking is a transparent camp/age/name heuristic for workflow
          demo. ResNet-101 facial-model integration pending backend support; no biometric data
          leaves this browser.
        </span>
      </div>
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Missing queue + report form */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
              <UserPlus className="w-4 h-4 text-[#00d2ff]" /> REPORT MISSING PERSON
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-white" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age" type="number" className="bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-white" />
                <select value={form.camp} onChange={(e) => setForm({ ...form, camp: e.target.value })} className="bg-[#020b14] border border-[#1b314b] rounded px-2 py-2 text-white">
                  {CAMPS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Reporter contact" className="w-full bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-white" />
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Last-seen note" className="w-full bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-white" />
              <button onClick={report} className="w-full py-2 bg-[#00d2ff] text-black font-bold rounded text-xs">
                ADD TO QUEUE
              </button>
            </div>
          </div>

          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white pb-2 border-b border-[#1b314b]">
              MISSING QUEUE ({open.length} OPEN)
            </div>
            <div className="mt-2 space-y-1 text-[11px] max-h-[220px] overflow-y-auto">
              {open.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveId(m.id)}
                  className={`w-full text-left p-2 rounded border ${m.id === active?.id ? 'bg-[#0e2740] border-[#00d2ff]/60' : 'bg-[#081a2c] border-[#132d4a]'}`}
                >
                  <div className="flex justify-between">
                    <span className="text-[#00d2ff] font-bold">{m.id} — {m.name}</span>
                    <span>age {m.age}</span>
                  </div>
                  <div className="text-slate-500">{m.camp} • {m.note}</div>
                </button>
              ))}
              {open.length === 0 && <div className="text-emerald-400 py-2">Queue clear — all reunited.</div>}
            </div>
          </div>
        </section>

        {/* Match candidates */}
        <section className="lg:col-span-8 bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
            <ScanFace className="w-4 h-4 text-[#00d2ff]" />
            MATCH CANDIDATES {active ? `FOR ${active.id} — ${active.name.toUpperCase()}` : ''}
          </div>
          <div className="mt-3 space-y-2 text-xs">
            {ranked.map(({ person: f, score }) => (
              <div key={f.id} className="p-3 rounded bg-[#091a2e] border border-[#1b314b]">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-white">{f.id} — {f.name}, {f.age} • {f.camp}</span>
                  <span className={`font-bold ${score.total >= 70 ? 'text-emerald-400' : score.total >= 40 ? 'text-amber-300' : 'text-slate-400'}`}>
                    {score.total}/100 heuristic
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  camp {score.campPts} + age {score.agePts} + name {score.namePts} • {f.note}
                </div>
                {active && (
                  <button
                    onClick={() => reunite(active.id, f.id)}
                    className="mt-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold rounded flex items-center gap-1"
                  >
                    <HeartHandshake className="w-3.5 h-3.5" /> CONFIRM REUNION
                  </button>
                )}
              </div>
            ))}
            {ranked.length === 0 && (
              <div className="text-slate-500 py-4 text-center">No candidates in intake registry.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
