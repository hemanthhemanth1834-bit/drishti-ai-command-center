'use client';
import { useEffect, useRef, useState } from 'react';
import { useOps, startDemo, demoGoto, stopDemo, DEMO_META, DEMO_PHASES, type DemoId } from '@/store/opsStore';
import { evaluateAlerts, incidentLevel } from '@/utils/alertRules';
import TrustBadge from '@/components/TrustBadge';

/** Mission Replay: timestamped timeline driving the SAME demo engine (no second sim). */
const TIMELINE = [
  { t: '00:00', label: 'NORMAL', phase: 0 },
  { t: '00:20', label: 'RAIN DETECTED', phase: 1 },
  { t: '00:40', label: 'RISK INCREASED', phase: 2 },
  { t: '01:00', label: 'WARNING', phase: 2 },
  { t: '01:20', label: 'CRITICAL', phase: 3 },
  { t: '01:40', label: 'EVACUATION', phase: 4 },
  { t: '02:00', label: 'DRONE DEPLOYED', phase: 4 },
  { t: '02:20', label: 'RESCUE', phase: 5 },
  { t: '02:40', label: 'RECOVERY', phase: 6 },
];

const SPEEDS = [1, 4, 8] as const;

export default function MissionReplay() {
  const ops = useOps();
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(4);
  const [tick, setTick] = useState(0); // seconds into the 160s mission
  const idRef = useRef<DemoId>('flood');

  const MISSION_LEN = 160;

  // Ensure the flood scenario is the active demo while replaying.
  useEffect(() => {
    if (playing && (!ops.demo || ops.demo.id !== idRef.current)) {
      startDemo(idRef.current);
      setTick(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setTick((t) => {
        const next = t + speed;
        if (next >= MISSION_LEN) {
          setPlaying(false);
          return MISSION_LEN;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [playing, speed]);

  // Sync engine phase to the timeline position.
  useEffect(() => {
    if (!playing || !ops.demo) return;
    const mm = Math.floor(tick / 60);
    const ss = tick % 60;
    const stamp = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    let phase = 0;
    for (const ev of TIMELINE) {
      if (ev.t <= stamp) phase = ev.phase;
    }
    if (phase !== ops.demo.phase) demoGoto(phase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, playing]);

  const mm = String(Math.floor(tick / 60)).padStart(2, '0');
  const ss = String(tick % 60).padStart(2, '0');

  function restart() {
    startDemo('flood');
    setTick(0);
    setPlaying(true);
  }

  function skip() {
    const stamp = `${mm}:${ss}`;
    const nextEv = TIMELINE.find((ev) => ev.t > stamp);
    if (!nextEv) {
      setTick(MISSION_LEN);
      setPlaying(false);
      return;
    }
    const [m, s] = nextEv.t.split(':').map(Number);
    setTick(m * 60 + s);
    demoGoto(nextEv.phase);
  }

  return (
    <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
      <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
        🎞️ MISSION REPLAY — VIJAYAWADA FLOOD RESPONSE
        <TrustBadge kind="DEMO" source="replays the demo engine" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-emerald-300 font-mono text-sm font-bold">
          {mm}:{ss}
        </span>
        <input
          type="range"
          min={0}
          max={MISSION_LEN}
          value={tick}
          onChange={(e) => {
            const v = Number(e.target.value);
            setTick(v);
            if (ops.demo) {
              const stamp = `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
              let phase = 0;
              for (const ev of TIMELINE) {
                if (ev.t <= stamp) phase = ev.phase;
              }
              demoGoto(phase);
            }
          }}
          className="flex-1 accent-cyan-400"
          aria-label="Mission timeline scrubber"
        />
        <span className="text-[10px] text-slate-500">02:40</span>
      </div>
      <div className="mt-1 flex gap-1 overflow-x-auto pb-1" aria-hidden>
        {TIMELINE.map((ev) => {
          const active =
            ops.demo &&
            (() => {
              const stamp = `${mm}:${ss}`;
              let cur = TIMELINE[0];
              for (const e of TIMELINE) {
                if (e.t <= stamp) cur = e;
              }
              return cur.t === ev.t;
            })();
          return (
            <span
              key={ev.t}
              className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] border ${
                active ? 'border-[#00d2ff] text-[#00d2ff]' : 'border-[#1b314b] text-slate-500'
              }`}
            >
              {ev.t} {ev.label}
            </span>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {!playing ? (
          <button onClick={() => setPlaying(true)} className="px-4 py-1.5 rounded-lg bg-[#00d2ff] text-black text-xs font-bold">
            ▶ PLAY
          </button>
        ) : (
          <button onClick={() => setPlaying(false)} className="px-4 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold">
            ❚❚ PAUSE
          </button>
        )}
        <button onClick={restart} className="px-3 py-1.5 rounded-lg border border-[#1b314b] text-xs">
          ⟲ RESTART
        </button>
        <button onClick={skip} className="px-3 py-1.5 rounded-lg border border-[#1b314b] text-xs">
          SKIP ›
        </button>
        <span className="text-[10px] text-slate-500">speed:</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-1 rounded text-[10px] border ${speed === s ? 'border-[#00d2ff] text-[#00d2ff]' : 'border-[#1b314b] text-slate-500'}`}
          >
            {s}×
          </button>
        ))}
        {ops.demo && (
          <button onClick={() => { stopDemo(); setPlaying(false); setTick(0); }} className="ml-auto px-3 py-1.5 rounded-lg border border-rose-500/60 text-rose-300 text-xs font-bold">
            END
          </button>
        )}
      </div>
      <div className="mt-1 text-[10px] text-slate-500">
        {DEMO_META.flood.emoji} {ops.demo ? `Phase: ${ops.demo.phase + 1}/7` : 'Press PLAY to run the flood mission.'} All pages follow the same engine.
        {ops.demo && (
          <span className="ml-2 text-slate-300">
            RISK NOW: {incidentLevel(evaluateAlerts({ scenario: ops.scenario, spillwayK: ops.spillwayK, geofenceBreach: false })).label}
          </span>
        )}
      </div>
    </div>
  );
}
