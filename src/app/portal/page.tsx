// src/app/portal/page.tsx — Citizen Advisory Lifeline (low-bandwidth public view)
import Link from 'next/link';
import { Globe, AlertTriangle, Truck, MapPin } from 'lucide-react';

export const metadata = {
  title: 'DRISHTI-X Citizen Advisory',
  description: 'Public evacuation corridors, relief schedules, emergency contacts',
};

const CORRIDORS = [
  { route: 'Bypass Route B (elevated)', status: 'OPEN', note: 'All ground traffic diverted here' },
  { route: 'NH-65 Underpass', status: 'CLOSED', note: 'Submerged 1.85m — do not attempt' },
  { route: 'Bund Rd → Sports Complex', status: 'OPEN', note: 'Evacuee buses PB-08, PB-11 running' },
];

const TRUCKS = [
  { id: 'RT-03', cargo: 'Drinking water 5kL', eta: '14:40', point: 'Ward 14 distribution' },
  { id: 'RT-05', cargo: 'Dry ration 800 kits', eta: '15:20', point: 'Riverbend Hall' },
  { id: 'RT-09', cargo: 'Medical + ORS', eta: '16:05', point: 'City Sports Complex' },
];

export default function PortalPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fa] text-slate-900 font-sans">
      <header className="bg-[#030d17] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#00d2ff]" />
          <div>
            <div className="font-extrabold tracking-wider text-sm">DRISHTI-X CITIZEN ADVISORY</div>
            <div className="text-[11px] text-slate-400">Official public lifeline • updated 10 min ago</div>
          </div>
        </div>
        <Link href="/command" className="text-[11px] text-[#00d2ff] underline">
          Command login →
        </Link>
      </header>

      <div className="bg-rose-600 text-white px-4 py-2 text-sm flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        LEVEL-3 alert: avoid NH-65 underpass and riverbed areas. Move to marked shelters.
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
        <section className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="font-bold flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-sky-600" /> Evacuation corridors
          </div>
          <ul className="mt-2 space-y-2 text-sm">
            {CORRIDORS.map((c) => (
              <li key={c.route} className="border rounded p-2">
                <div className="flex justify-between font-semibold">
                  <span>{c.route}</span>
                  <span className={c.status === 'OPEN' ? 'text-emerald-600' : 'text-rose-600'}>
                    {c.status}
                  </span>
                </div>
                <div className="text-slate-600 text-[13px]">{c.note}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="font-bold flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-sky-600" /> Relief truck schedule
          </div>
          <ul className="mt-2 space-y-2 text-sm">
            {TRUCKS.map((t) => (
              <li key={t.id} className="border rounded p-2 flex justify-between gap-2">
                <div>
                  <div className="font-semibold">{t.id} — {t.cargo}</div>
                  <div className="text-slate-600 text-[13px]">{t.point}</div>
                </div>
                <div className="font-bold text-sky-700">ETA {t.eta}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="text-center text-xs text-slate-500 pb-6">
        Emergency helpline: <b>112</b> • This page is text-light for low-bandwidth access.
      </footer>
    </main>
  );
}
