'use client';
import PredictorCard from '@/platform/PredictorCard';
import DataFlowStrip from '@/components/home/DataFlowStrip';
import ModelFlowVisual from '@/components/ml/ModelFlowVisual';
import { ModuleShell } from '@/platform/provenance';
import LocationContextBar from '@/components/location/LocationContextBar';

export default function PredictionPage() {
  return (
    <>
      <LocationContextBar />
    <ModuleShell title="Landslide Prediction" sub="AI decision support for citizens & officers — always verify on the ground" status="LIVE" source="ML API + local DEMO fallback">
      <DataFlowStrip />
      <ModelFlowVisual predictHref="#dx-predictor" />
      <PredictorCard />
    </ModuleShell>
    </>
  );
}
