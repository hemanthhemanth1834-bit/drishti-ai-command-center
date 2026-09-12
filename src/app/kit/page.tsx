// EMERGENCY KIT — on-device checklist with progress.
'use client';
import Navbar from '@/components/layout/Navbar';
import Checklist from '@/components/Checklist';
import TrustBadge from '@/components/TrustBadge';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { Backpack } from 'lucide-react';

const SEED = [
  'Water — 3 litres per person per day (3 days)',
  'Dry food + energy bars (3 days)',
  'First-aid box + personal medicines',
  'Torch + extra batteries',
  'Power bank + charging cable',
  'IDs, insurance + cash in waterproof pouch',
  'Emergency contacts card',
  'Battery/hand-crank radio',
  'Cash in small notes',
  'Blanket, spare clothes, soap, masks',
];

export default function KitPage() {
  const { connected } = useTelemetrySocket();
  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-2xl mx-auto flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Backpack className="w-5 h-5 text-[#00d2ff]" />
          <h1 className="text-xl font-extrabold text-white">EMERGENCY KIT</h1>
          <TrustBadge kind="DEMO" source="saved on this device" />
        </div>
        <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <Checklist storageKey="drishti-kit" seed={SEED} />
        </div>
      </div>
    </main>
  );
}
