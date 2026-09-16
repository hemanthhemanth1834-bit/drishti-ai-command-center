'use client';
import PredictorCard from '@/platform/PredictorCard';
import { ModuleShell } from '@/platform/provenance';

export default function PredictionPage() {
  return (
    <ModuleShell title="Landslide Prediction" sub="AI decision support for citizens & officers — always verify on the ground" status="LIVE" source="ML API + local DEMO fallback">
      <PredictorCard />
    </ModuleShell>
  );
}
