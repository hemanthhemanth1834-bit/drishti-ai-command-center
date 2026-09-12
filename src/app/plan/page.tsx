// MY EMERGENCY PLAN — on-device checklist. No account needed.
'use client';
import Navbar from '@/components/layout/Navbar';
import Checklist from '@/components/Checklist';
import TrustBadge from '@/components/TrustBadge';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { ClipboardList } from 'lucide-react';

const SEED = [
  'Save emergency contacts (112, family, neighbour)',
  'Know your nearest shelter + route there',
  'Know your nearest hospital + route there',
  'Plan evacuation route with a backup road',
  'Pack the emergency kit (see Kit page)',
  'Keep IDs + insurance copies in a waterproof pouch',
  'Agree a family meeting point + out-of-town contact',
  'Charge power bank; save offline maps',
  'Learn utility shut-offs (gas, water, mains)',
  'Practice the plan with family once',
];

export default function PlanPage() {
  const { connected } = useTelemetrySocket();
  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-2xl mx-auto flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#00d2ff]" />
          <h1 className="text-xl font-extrabold text-white">MY EMERGENCY PLAN</h1>
          <TrustBadge kind="DEMO" source="saved on this device" />
        </div>
        <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <Checklist storageKey="drishti-plan" seed={SEED} />
        </div>
      </div>
    </main>
  );
}
