// src/app/recovery/page.tsx — Post-Disaster Audit & PDNA
'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import CinematicShell from '@/components/cinematic/CinematicShell';
import StatusHeader from '@/components/cinematic/StatusHeader';
import HudPanel from '@/components/cinematic/HudPanel';
import AnimatedCounter from '@/components/cinematic/AnimatedCounter';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { BarChart3, Link2, Activity } from 'lucide-react';

type Entry = { id: string; item: string; amount: number; hash: string };

function mockHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const SEED: Entry[] = [
  { id: 'RL-001', item: 'Tarpaulin + dry ration — Ward 14', amount: 18400, hash: '' },
  { id: 'RL-002', item: 'Boat fuel advance — RB-07', amount: 6200, hash: '' },
];
SEED.forEach((e) => (e.hash = mockHash(e.id + e.item + e.amount)));

const SENSORS = [
  { id: 'SCOUR-03', loc: 'Pier P-12, Prakasam Barrage', val: '0.42m exposure', state: 'WATCH' },
  { id: 'PWP-11', loc: 'Borehole BH-4, Bund Rd', val: '18.6 kPa', state: 'NORMAL' },
  { id: 'SCOUR-07', loc: 'Pier P-18, Railway Bridge', val: '1.10m exposure', state: 'ALERT' },
];

export default function RecoveryPage() {
  const { connected } = useTelemetrySocket();
  const [ledger, setLedger] = useState<Entry[]>(SEED);
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');

  function addEntry() {
    if (!item.trim() || !amount) return;
    const id = `RL-${String(ledger.length + 1).padStart(3, '0')}`;
    const prev = ledger.length ? ledger[ledger.length - 1].hash : 'genesis';
    const e: Entry = {
      id,
      item: item.trim(),
      amount: Number(amount),
      hash: mockHash(prev + id + item + amount),
    };
    setLedger((l) => [...l, e]);
    setItem('');
    setAmount('');
  }

  const total = ledger.reduce((a, e) => a + e.amount, 0);

  return (
    <CinematicShell intensity={0.6} label="Recovery and audit">
    <main className="min-h-screen text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <StatusHeader wsConnected={connected} />
      {/* Professional incident timeline */}
      <div className="px-4 pt-4">
        <HudPanel micro="EVENT · TIME · ACTION · RESPONDER · RESULT · STATUS" title="INCIDENT TIMELINE — ANIMATED" right={<span className="dx-sim">SIMULATION</span>}>
          <div className="dx-timeline text-[11px] grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {[
              ['10:42:18', 'Flood alert generated', 'RULE ENGINE', 'RISK 72/100', 'DONE'],
              ['10:43:04', 'AI prediction completed', 'HYDRA-NET', 'CONF 98.4%', 'DONE'],
              ['10:44:17', 'Drone DRX-07 dispatched', 'OPS', 'AIRBORNE', 'DONE'],
              ['10:47:31', 'Civilian detected · Ward 14', 'FLIR SIM', '3 CONTACTS', 'ACTIVE'],
              ['10:48:02', 'Rescue approved · RB-07', 'COMMANDER', 'ETA 04:48', 'QUEUED'],
              ['10:52:40', 'ICU-03 reserved · AMB-12 rolling', 'MEDICAL', 'O₂ OK', 'QUEUED'],
            ].map(([t, what, who, res, st]) => (
              <div key={t} className="dx-tl-item">
                <div className="text-[#00d2ff] font-bold">{t} · {st}</div>
                <div className="text-slate-100">{what}</div>
                <div className="text-slate-500">{who} · {res}</div>
              </div>
            ))}
          </div>
        </HudPanel>
      </div>
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
            <Link2 className="w-4 h-4 text-[#00d2ff]" />
            RELIEF DISBURSEMENT LEDGER (MERKLE-CHAINED) — TOTAL ₹{total.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 space-y-1 text-[11px] max-h-[280px] overflow-y-auto">
            {ledger.map((e) => (
              <div key={e.id} className="p-2 rounded bg-[#081a2c] border border-[#132d4a]">
                <div className="flex justify-between">
                  <span className="text-[#00d2ff] font-bold">{e.id}</span>
                  <span className="text-white">₹{e.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-slate-300 mt-0.5">{e.item}</div>
                <div className="text-slate-500 mt-0.5">hash:{e.hash} ← prev-linked</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="Disbursement item…"
              className="flex-1 bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-xs text-white"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="₹"
              type="number"
              className="w-28 bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-xs text-white"
            />
            <button onClick={addEntry} className="px-4 py-2 bg-[#00d2ff] text-black text-xs font-bold rounded">
              APPEND
            </button>
          </div>
        </section>

        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
              <Activity className="w-4 h-4 text-[#00d2ff]" /> STRUCTURAL SENSOR DIAGNOSTICS
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              {SENSORS.map((s) => (
                <div key={s.id} className="p-2 rounded bg-[#081a2c] border border-[#132d4a]">
                  <div className="flex justify-between">
                    <span className="text-[#00d2ff] font-bold">{s.id}</span>
                    <span className={s.state === 'ALERT' ? 'text-rose-400 font-bold' : s.state === 'WATCH' ? 'text-amber-300' : 'text-emerald-400'}>
                      {s.state}
                    </span>
                  </div>
                  <div className="text-slate-400 mt-0.5">{s.loc}</div>
                  <div className="text-slate-300">{s.val}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#051424]/85 backdrop-blur border border-[#1b314b] rounded-xl p-4 text-xs">
            <div className="font-bold text-white flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#00d2ff]" /> PDNA SNAPSHOT · <AnimatedCounter value={4800000} prefix="₹" />
            </div>
            <div className="mt-2 text-slate-400 leading-relaxed">
              Housing: 312 units affected • Roads: 18/62 blocked • Power: 6 feeders down •
              preliminary loss: ₹4.8Cr. Full assessment pending field-team sync.
            </div>
          </div>
        </section>
      </div>
    </main>
    </CinematicShell>
  );
}
