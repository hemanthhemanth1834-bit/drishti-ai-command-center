'use client';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import LocationContextBar from '@/components/location/LocationContextBar';
import ModelFlowVisual from '@/components/ml/ModelFlowVisual';
import { useRegion } from '@/platform/regionStore';
import { usePlatform } from '@/platform/usePlatform';

export default function MlPage() {
  const region = useRegion();
  const m = usePlatform<{ model_version: string; status: string; trained_at?: string; data_kind?: string; features?: string[] }>('/api/v1/ml/model');
  const h = usePlatform<{ accuracy: unknown; precision: unknown; recall: unknown; f1: unknown; roc_auc: unknown; training_samples: unknown; validation_samples: unknown }>('/api/v1/ml/health');
  return (
    <>
      <LocationContextBar />
    <ModuleShell title="ML Lab" sub="RandomForest pipeline: train → validate → infer → explain → monitor. Metrics only from real runs." status={m.data?.status ?? 'OFFLINE'} source={m.data?.data_kind ?? 'model artifacts'}>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">PIPELINE: WEATHER + RAINFALL + SOIL + SLOPE + TERRAIN + HISTORY → FEATURES → RANDOM FOREST → PROBABILITY → GIS CELL → WARNING</div>
        <div className="mt-2"><ModelFlowVisual predictHref="/prediction" /></div>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">MODEL CARD</div>
        <div className="text-xs text-[#7de9ff] mt-1">ANALYSIS LOCATION: {region.label}{region.lat != null && region.lon != null ? ` (${region.lat.toFixed(2)}, ${region.lon.toFixed(2)})` : ' — pick a location via CHANGE LOCATION above'}</div>
        <div className="text-sm text-white font-bold">{m.data?.model_version ?? '…'} <StatusBadge status={m.data?.status ?? '…'} small /></div>
        <div className="text-xs text-slate-400">trained: {m.data?.trained_at ?? '—'} · features: {m.data?.features?.length ?? '—'}</div>
        <p className="text-[11px] text-slate-400 mt-2">Train locally: <code>cd backend && python -m ml.train --samples 3000</code> · or verified CSV: <code>--csv data.csv</code>. Artifacts are git-ignored; health shows NOT AVAILABLE until trained.</p>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">VALIDATION (HELD-OUT)</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs mt-2">
          {([['accuracy', h.data?.accuracy], ['precision', h.data?.precision], ['recall', h.data?.recall], ['F1', h.data?.f1], ['ROC-AUC', h.data?.roc_auc]] as [string, unknown][]).map(([l, v]) => (
            <div key={l as string} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
              <div className="dx-micro">{l}</div>
              <div className="text-base font-bold text-white">{v === undefined ? '…' : String(v)}</div>
            </div>
          ))}
        </div>
        <div className="text-xs mt-1">train n={String(h.data?.training_samples)} · test n={String(h.data?.validation_samples)}</div>
      </div>
    </ModuleShell>
    </>
  );
}
