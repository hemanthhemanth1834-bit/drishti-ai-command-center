// LEARN — short BEFORE / DURING / AFTER guides. Plain public-safety advice.
'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { BookOpen, ChevronDown } from 'lucide-react';

type Topic = { id: string; emoji: string; title: string; before: string[]; during: string[]; after: string[] };

const TOPICS: Topic[] = [
  { id: 'flood', emoji: '🌊', title: 'Flood', before: ['Know if you live in a low-lying area.', 'Keep documents in a waterproof pouch.', 'Charge phone + power bank.'], during: ['Move to high ground immediately.', 'Never walk through flowing water.', 'Turn off gas and electricity if told to.'], after: ['Do not drink tap water until declared safe.', 'Watch for snakes and debris.', 'Photograph damage for claims.'] },
  { id: 'cyclone', emoji: '🌀', title: 'Cyclone', before: ['Trim weak branches; secure loose items.', 'Stock 3 days of food and water.', 'Know your shelter route.'], during: ['Stay indoors away from windows.', 'Do not go out in the calm eye — winds return.', 'Listen to radio advisories.'], after: ['Beware fallen power lines.', 'Boil water before drinking.', 'Help clear only with gloves.'] },
  { id: 'quake', emoji: '🏚️', title: 'Earthquake', before: ['Fix heavy furniture to walls.', 'Know safe spots: under sturdy tables.', 'Keep shoes + torch by the bed.'], during: ['DROP, COVER, HOLD ON.', 'Stay away from glass and facades.', 'If outside, move to open ground.'], after: ['Expect aftershocks.', 'Check gas leaks before lighting anything.', 'Use stairs, not lifts.'] },
  { id: 'fire', emoji: '🔥', title: 'Fire', before: ['Keep exits clear; test alarms.', 'Store fuel away from heat.', 'Know two exits from every room.'], during: ['Crawl low under smoke.', 'Feel doors before opening.', 'Call 101, then leave fast.'], after: ['Do not re-enter until cleared.', 'Cool burns with water, seek care.', 'Ventilate before switching power on.'] },
  { id: 'lightning', emoji: '⚡', title: 'Lightning', before: ['Check weather before outdoor work.', 'Unplug sensitive appliances.', 'Shelter plan for open fields.'], during: ['Go indoors; avoid trees and poles.', 'Stay away from water and metal.', 'Wait 30 min after last thunder.'], after: ['Check for smouldering fires.', 'Seek care for any shock symptoms.', 'Report damaged lines.'] },
  { id: 'heat', emoji: '🌡️', title: 'Extreme Heat', before: ['Plan outdoor work before 11am.', 'Stock ORS and water.', 'Check on elders daily.'], during: ['Stay in shade; sip water often.', 'Wear light cotton + cap.', 'Move anyone dizzy to cool shade.'], after: ['Watch for heat-stroke signs (hot dry skin).', 'Cool with wet cloths, call 108.', 'Rest 24 hours after recovery.'] },
  { id: 'landslide', emoji: '⛰️', title: 'Landslide', before: ['Watch for new cracks on slopes.', 'Keep drains on slopes clear.', 'Know the uphill escape path.'], during: ['Move sideways away from the slide path.', 'Alert neighbours loudly.', 'Call 112 after reaching safety.'], after: ['Stay away — more slides can follow.', 'Do not cross fresh debris.', 'Report blocked roads.'] },
  { id: 'tsunami', emoji: '🌅', title: 'Tsunami', before: ['Know your coastal evacuation route.', 'Learn the natural signs: long quake, sea receding.', 'Keep a go-bag ready.'], during: ['Run to high ground immediately.', 'Never go to watch the wave.', 'Stay until official all-clear.'], after: ['Stay out of floodwater.', 'Help rescuers with local knowledge.', 'Boil water; discard soaked food.'] },
];

export default function LearnPage() {
  const { connected } = useTelemetrySocket();
  const [open, setOpen] = useState<string>('flood');
  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-3xl mx-auto flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#00d2ff]" />
          <h1 className="text-xl font-extrabold text-white">LEARN — BEFORE / DURING / AFTER</h1>
        </div>
        {TOPICS.map((t) => {
          const isOpen = open === t.id;
          return (
            <div key={t.id} className="rounded-xl bg-[#051424] border border-[#1b314b] overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? '' : t.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-2 px-4 py-3 text-left"
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="font-bold text-white">{t.title}</span>
                <ChevronDown className={`w-4 h-4 ml-auto text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px]">
                  {(
                    [
                      ['BEFORE', t.before, 'text-sky-300'],
                      ['DURING', t.during, 'text-rose-300'],
                      ['AFTER', t.after, 'text-emerald-300'],
                    ] as const
                  ).map(([h, items, cls]) => (
                    <div key={h} className="bg-[#091a2e] border border-[#132d4a] rounded-lg p-2.5">
                      <div className={`font-bold ${cls}`}>{h}</div>
                      <ul className="mt-1 list-disc ml-4 text-slate-300 space-y-0.5">
                        {items.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
