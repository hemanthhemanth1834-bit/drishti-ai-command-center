// TALK TO DRISHTI — browser-native voice assistant. No paid AI. Simulated data labeled.
'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useOps } from '@/store/opsStore';
import { assessRisk, nearestFacilities } from '@/utils/riskEngine';
import { Mic, Send } from 'lucide-react';

type Msg = { from: 'you' | 'drishti'; text: string };

const HOME = { lat: 17.385, lon: 78.4867 };

function speak(text: string) {
  try {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  } catch {
    /* speech unsupported */
  }
}

export default function TalkPage() {
  const { live, connected } = useTelemetrySocket();
  const ops = useOps();
  const [log, setLog] = useState<Msg[]>([
    { from: 'drishti', text: 'I am Drishti, running fully in your browser. Try: "Am I safe?" or "Find a shelter." Everything I say about risk is simulated demo data.' },
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const supported =
    typeof window !== 'undefined' &&
    ((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  function answer(q: string): { text: string; link?: { href: string; label: string } } {
    const s = q.toLowerCase();
    const lat = live?.lat ?? HOME.lat;
    const lon = live?.lon ?? HOME.lon;
    if (/(safe|danger|risk)/.test(s)) {
      const r = assessRisk(lat, lon);
      return {
        text: `Your selected location currently has a ${r.level.toUpperCase()} simulated risk. ${r.action} This is demo data, not an official warning.`,
        link: { href: '/safety', label: 'Open My Safety' },
      };
    }
    if (/(shelter|evacuat|stay)/.test(s)) {
      const n = nearestFacilities(lat, lon, 'shelter', 2);
      return {
        text: `Here are the nearest demo shelters: ${n.map((x) => `${x.f.name}, ${x.distKm.toFixed(1)} kilometres`).join('; ')}.`,
        link: { href: '/evacuate', label: 'Plan evacuation' },
      };
    }
    if (/(hospital|doctor|ambulance|hurt|medical)/.test(s)) {
      const n = nearestFacilities(lat, lon, 'hospital', 2);
      return {
        text: `Nearest demo hospitals: ${n.map((x) => `${x.f.name}, ${x.distKm.toFixed(1)} kilometres`).join('; ')}. For real emergencies call 108.`,
        link: { href: '/nearby', label: 'Help near me' },
      };
    }
    if (/(alert|warning|happen)/.test(s)) {
      return {
        text: `Current drill posture is scenario ${ops.scenario}. Live mesh alerts appear in the Alert Center; official-style drill alerts are labeled demo.`,
        link: { href: '/alerts', label: 'Open Alert Center' },
      };
    }
    if (/(emergency|sos|help|rescue)/.test(s)) {
      return {
        text: 'Opening emergency options. If anyone is in danger right now, call 112 first.',
        link: { href: '/emergency', label: 'Emergency Mode' },
      };
    }
    return {
      text: 'I understand: safety checks, shelters, hospitals, alerts, or emergency. Please ask one of those.',
    };
  }

  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    const a = answer(q);
    const you: Msg = { from: 'you', text: q };
    const bot: Msg = { from: 'drishti', text: a.text };
    setLog((l) => [...l, you, bot].slice(-30));
    speak(a.text);
    if (a.link) {
      const link = a.link;
      setTimeout(() => {
        const nav: Msg = { from: 'drishti', text: `→ ${link.label}` };
        setLog((l) => [...l, nav].slice(-30));
      }, 400);
    }
    setInput('');
  }

  function toggleMic() {
    try {
      const w = window as unknown as {
        SpeechRecognition?: new () => {
          lang: string;
          onresult: ((e: { results: { transcript: string }[][] }) => void) | null;
          onend: (() => void) | null;
          start: () => void;
          stop: () => void;
        };
        webkitSpeechRecognition?: new () => {
          lang: string;
          onresult: ((e: { results: { transcript: string }[][] }) => void) | null;
          onend: (() => void) | null;
          start: () => void;
          stop: () => void;
        };
      };
      const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (!Ctor) return;
      if (recRef.current) {
        recRef.current.stop();
        recRef.current = null;
        setListening(false);
        return;
      }
      const rec = new Ctor();
      rec.lang = 'en-IN';
      rec.onresult = (e) => {
        const t = e.results[0]?.[0]?.transcript ?? '';
        if (t) send(t);
      };
      rec.onend = () => {
        setListening(false);
        recRef.current = null;
      };
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-2xl mx-auto flex flex-col gap-3">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Mic className="w-5 h-5 text-[#00d2ff]" /> TALK TO DRISHTI
        </h1>
        {!supported && (
          <div className="text-[12px] text-amber-300 bg-[#141006] border border-amber-500/40 rounded-xl p-3">
            Voice input isn&apos;t supported in this browser — type below instead. Answers are spoken when speech output exists.
          </div>
        )}
        <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-3 h-[380px] overflow-y-auto space-y-2 text-sm" aria-live="polite">
          {log.map((m, i) => (
            <div key={i} className={`max-w-[85%] p-2.5 rounded-lg ${m.from === 'you' ? 'ml-auto bg-[#00d2ff]/15 border border-[#00d2ff]/40 text-white' : 'bg-[#091a2e] border border-[#1b314b] text-slate-200'}`}>
              {m.text.startsWith('→ ') ? (
                <Link href={m.text === '→ Open My Safety' ? '/safety' : m.text === '→ Plan evacuation' ? '/evacuate' : m.text === '→ Help near me' ? '/nearby' : m.text === '→ Open Alert Center' ? '/alerts' : '/emergency'} className="text-[#00d2ff] font-bold">
                  {m.text}
                </Link>
              ) : (
                m.text
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleMic}
            aria-label={listening ? 'Stop listening' : 'Start voice input'}
            className={`w-12 rounded-xl font-bold flex items-center justify-center ${listening ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#00d2ff] text-black'}`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder='Ask: "Am I safe?" / "Find a shelter"'
            aria-label="Type your question"
            className="flex-1 bg-[#051424] border border-[#1b314b] rounded-xl px-3 py-2.5 text-sm text-white"
          />
          <button onClick={() => send(input)} aria-label="Send" className="w-12 rounded-xl bg-[#00d2ff] text-black flex items-center justify-center">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
}
