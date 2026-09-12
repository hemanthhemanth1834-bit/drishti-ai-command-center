// CHECK MY RISK — standalone risk flow (also embedded on /safety).
'use client';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import RiskChecker from '@/components/RiskChecker';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';

export default function RiskPage() {
  const { connected } = useTelemetrySocket();
  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-3xl mx-auto flex flex-col gap-3">
        <p className="text-[12px] text-slate-400">
          Uses your browser location <b>only after you tap the GPS button</b>. Nothing is
          uploaded — the check runs on your device against labeled demo hazard cells.
          Permission denied? Just search manually below.
        </p>
        <RiskChecker />
        <div className="flex gap-2 flex-wrap text-xs">
          <Link href="/safety" className="px-3 py-2 rounded border border-[#1b314b] text-slate-200">
            ← MY SAFETY DASHBOARD
          </Link>
          <Link href="/learn" className="px-3 py-2 rounded border border-[#1b314b] text-slate-200">
            LEARN WHAT TO DO
          </Link>
        </div>
      </div>
    </main>
  );
}
