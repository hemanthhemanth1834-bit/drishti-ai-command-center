// src/app/simulation/page.tsx — What-If Hydrodynamic Copilot
'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import TrustBadge from '@/components/TrustBadge';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useOps, setOps } from '@/store/opsStore';
import { evaluateAlerts, incidentLevel } from '@/utils/alertRules';
import AlertBanner from '@/components/alerts/AlertBanner';
import { ackAlert } from '@/store/opsStore';
import { setScenario } from '@/utils/apiClient';
import { Cpu, Droplets, FlaskConical } from 'lucide-react';

const SCENARIOS = ['nominal', 'storm', 'swarm-surge', 'gps-denied'] as const;

export default function SimulationPage() {
  const { live, connected } = useTelemetrySocket();
  const ops = useOps();
  const scenario = ops.scenario;
  const spillway = ops.spillwayK;
  const setSpillway = (v: number) => setOps({ spillwayK: v });
  const [msg, setMsg] = useState('');

  const inundation = Math.min(100, Math.round(30 + spillway * 1.1 + (scenario === 'storm' ? 18 : 0)));

  const previewBreach = evaluateAlerts({
    scenario,
    spillwayK: spillway,
    geofenceBreach: false,
  });

  async function applyScenario(s: string) {
    setOps({ scenario: s, acked: [] });
    try {
      await setScenario(s);
      setMsg(`backend scenario → ${s}`);
    } catch (e: unknown) {
      setMsg(`backend unreachable: ${(e as Error).message}`);
    }
  }

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} incident={incidentLevel(previewBreach)} />
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
            <Droplets className="w-4 h-4 text-[#00d2ff]" />
            HYDRAULIC TWIN — PRAKASAM BARRAGE SPILLWAY CONTROL
          </div>
          <label className="block mt-4 text-[11px] text-slate-400">
            UPSTREAM DAM DISCHARGE: <span className="text-white font-bold">{spillway},000 CUSECS</span>
          </label>
          <input
            type="range"
            min={5}
            max={80}
            value={spillway}
            onChange={(e) => setSpillway(Number(e.target.value))}
            className="w-full mt-2 accent-cyan-400"
          />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#091a2e] p-3 rounded border border-[#1b314b]">
              <div className="text-[10px] text-slate-400">PROJECTED INUNDATION</div>
              <div className={`text-2xl font-bold ${inundation > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {inundation}/100
              </div>
            </div>
            <div className="bg-[#091a2e] p-3 rounded border border-[#1b314b]">
              <div className="text-[10px] text-slate-400">NH-65 UNDERPASS</div>
              <div className="text-2xl font-bold text-amber-300">
                {(spillway * 0.041).toFixed(2)}m
              </div>
            </div>
            <div className="bg-[#091a2e] p-3 rounded border border-[#1b314b]">
              <div className="text-[10px] text-slate-400">EVAC LEAD TIME</div>
              <div className="text-2xl font-bold text-[#00d2ff]">
                {Math.max(1, Math.round(12 - spillway / 10))}h
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Physics-informed surrogate: inundation ≈ f(discharge, rainfall scenario). Move the
            slider to preview downstream impact before issuing gate orders.
          </p>
          <div className="mt-3">
            <div className="text-[10px] text-slate-500 mb-1">
              COMMAND-CENTER BANNER PREVIEW (same live rules as /)
            </div>
            <AlertBanner alerts={previewBreach} acked={ops.acked} onAck={ackAlert} />
          </div>
        </section>

        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
              <FlaskConical className="w-4 h-4 text-[#00d2ff]" /> TELEMETRY SCENARIO INJECTOR
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s}
                  onClick={() => applyScenario(s)}
                  className={`py-2 rounded text-xs font-bold border transition-all ${
                    scenario === s
                      ? 'bg-[#00d2ff] text-black border-[#00d2ff]'
                      : 'bg-[#091a2e] text-slate-300 border-[#1b314b] hover:border-[#00d2ff]/60'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {msg && <div className="mt-2 text-[11px] text-[#00d2ff]">{msg}</div>}
            <div className="mt-2 text-[11px] text-slate-500">
              Live drone: {live?.drone_id ?? '—'} • {live ? `${live.alt_m.toFixed(1)}m` : 'awaiting WS…'}
            </div>
          </div>

          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
              <Cpu className="w-4 h-4 text-[#00d2ff]" /> LOCAL AI ADVISOR (OLLAMA / RAG)
            </div>
            <div className="mt-3 text-xs bg-[#091a2e] p-3 rounded border border-[#1b314b] leading-relaxed">
              <span className="text-[#00d2ff] font-bold">DeepSeek-R1 (offline): </span>
              {spillway > 45 ? (
                <span>
                  Discharge above 45k cusecs submerges NH-65 underpass. Recommend opening
                  Bypass Route B and pre-staging boats RB-07/RB-11 at Ward 14.
                </span>
              ) : (
                <span>
                  Current discharge within safe band. Maintain watch; re-run twin if rainfall
                  scenario shifts to storm.
                </span>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* What-if presets + projected impact (SIMULATION — model output, not a forecast) */}
      <div className="px-4 pb-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-5 bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <div className="text-xs font-bold text-white pb-3 border-b border-[#1b314b]">
            WHAT-IF QUESTIONS
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              { q: 'Rainfall +50%?', run: () => { applyScenario('storm'); setSpillway(Math.min(80, spillway + 10)); } },
              { q: 'River level +2m?', run: () => setSpillway(Math.min(80, spillway + 15)) },
              { q: 'Cyclone landfall?', run: () => { applyScenario('storm'); setSpillway(65); } },
              { q: 'Evacuation drill?', run: () => { applyScenario('swarm-surge'); setSpillway(50); } },
            ].map((p) => (
              <button
                key={p.q}
                onClick={p.run}
                className="py-2.5 px-3 rounded-lg bg-[#091a2e] border border-[#1b314b] text-left text-slate-100 hover:border-[#00d2ff]/60"
              >
                “{p.q}”
              </button>
            ))}
          </div>
        </section>
        <section className="lg:col-span-7 bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <div className="text-xs font-bold text-white pb-3 border-b border-[#1b314b] flex items-center gap-2">
            PROJECTED IMPACT <TrustBadge kind="SIMULATION" source="surrogate model" confidence={71} />
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-[11px]">
            {[
              ['AFFECTED POPULATION', `~${(inundation * 420).toLocaleString()}`],
              ['ROADS BLOCKED', `${Math.round((inundation / 100) * 62)} / 62`],
              ['BUILDINGS EXPOSED', `~${(inundation * 38).toLocaleString()}`],
              ['HOSPITALS AFFECTED', inundation > 70 ? '2' : inundation > 40 ? '1' : '0'],
              ['SHELTERS NEEDED', `${Math.max(1, Math.ceil((inundation * 420) / 2000))}`],
              ['EVAC ZONES', inundation > 70 ? 'Wards 12, 14, 18' : inundation > 40 ? 'Ward 14 bund' : 'None'],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#091a2e] p-2.5 rounded border border-[#1b314b]">
                <div className="text-slate-500 text-[10px]">{k}</div>
                <div className="text-white font-bold text-sm mt-0.5">{v}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            CURRENT → SCENARIO → PROJECTED IMPACT · toy multipliers on the inundation index for
            drill planning. Not a forecast.
          </p>
        </section>
      </div>
    </main>
  );
}
