// LEARN — trilingual BEFORE / DURING / AFTER + emergency actions + do/don't.
'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useApp } from '@/store/appStore';
import { LEARN_TOPICS } from '@/data/learn';
import { BookOpen, ChevronDown, Siren, Check, X } from 'lucide-react';

export default function LearnPage() {
  const { connected } = useTelemetrySocket();
  const { lang } = useApp();
  // Learn content ships EN/TE/HI — fall back to EN for newer NE-SAFE langs (preserves existing).
  const lang3 = (lang === 'te' || lang === 'hi' ? lang : 'en') as 'en' | 'te' | 'hi';
  const [open, setOpen] = useState<string>('flood');
  const H = {
    before: { en: 'BEFORE', te: 'ముందు', hi: 'पहले' },
    during: { en: 'DURING', te: 'సమయంలో', hi: 'दौरान' },
    after: { en: 'AFTER', te: 'తర్వాత', hi: 'बाद में' },
    emergency: { en: 'EMERGENCY ACTIONS', te: 'అత్యవసర చర్యలు', hi: 'आपातकालीन कार्रवाई' },
    dos: { en: 'DO', te: 'చేయండి', hi: 'करें' },
    donts: { en: "DON'T", te: 'చేయవద్దు', hi: 'न करें' },
  } as const;
  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-3xl mx-auto flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#00d2ff]" />
          <h1 className="text-xl font-extrabold text-white">LEARN — BEFORE / DURING / AFTER</h1>
        </div>
        {LEARN_TOPICS.map((t) => {
          const isOpen = open === t.id;
          return (
            <div key={t.id} className="rounded-xl bg-[#051424] border border-[#1b314b] overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? '' : t.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-2 px-4 py-3 text-left"
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="font-bold text-white">{t.title[lang3]}</span>
                <ChevronDown className={`w-4 h-4 ml-auto text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 flex flex-col gap-2 text-[12px]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(
                        [
                          [H.before[lang3], t.before[lang3], 'text-sky-300'],
                          [H.during[lang3], t.during[lang3], 'text-rose-300'],
                          [H.after[lang3], t.after[lang3], 'text-emerald-300'],
                        ] as const
                      ).map(([h, items, cls]: readonly [string, readonly string[], string]) => (
                      <div key={h} className="bg-[#091a2e] border border-[#132d4a] rounded-lg p-2.5">
                        <div className={`font-bold ${cls}`}>{h}</div>
                        <ul className="mt-1 list-disc ml-4 text-slate-300 space-y-0.5">
                          {items.map((s: string) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#140608] border border-rose-500/40 rounded-lg p-2.5">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <Siren className="w-3.5 h-3.5" /> {H.emergency[lang3]}
                    </div>
                    <ul className="mt-1 list-disc ml-4 text-rose-100/90 space-y-0.5">
                      {t.emergency[lang3].map((s: string) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-[#061410] border border-emerald-500/40 rounded-lg p-2.5">
                      <div className="font-bold text-emerald-300 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {H.dos[lang3]}
                      </div>
                      <ul className="mt-1 list-disc ml-4 text-slate-300 space-y-0.5">
                        {t.dos[lang3].map((s: string) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-[#141006] border border-amber-500/40 rounded-lg p-2.5">
                      <div className="font-bold text-amber-300 flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> {H.donts[lang3]}
                      </div>
                      <ul className="mt-1 list-disc ml-4 text-slate-300 space-y-0.5">
                        {t.donts[lang3].map((s: string) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
