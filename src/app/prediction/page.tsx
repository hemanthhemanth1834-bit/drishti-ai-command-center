'use client';
import PredictorCard from '@/platform/PredictorCard';
import VizFigure from '@/platform/VizFigure';
import { ModuleShell } from '@/platform/provenance';

export default function PredictionPage() {
  return (
    <ModuleShell title="Landslide Prediction" sub="AI decision support for citizens & officers — always verify on the ground" status="LIVE" source="ML API + local DEMO fallback">
      <VizFigure src="/img/ml-pipeline.svg" alt="AI risk pipeline diagram from weather and terrain data to warning" caption="How the prediction is made — transparent pipeline" status="MODEL" />
      <PredictorCard />
    </ModuleShell>
  );
}
