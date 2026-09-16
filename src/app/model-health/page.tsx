'use client';
import { ModuleShell } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';
import VizFigure from '@/platform/VizFigure';

function cell(v: unknown) {
  return v === undefined || v === null ? 'NOT AVAILABLE' : String(v);
}

export default function ModelHealthPage() {
  const h = usePlatform<Record<string, unknown>>('/api/v1/model-health');
  const d = h.data ?? {};
  const fi = (d.feature_importance ?? {}) as Record<string, number>;
  const cm = (d.confusion_matrix ?? []) as number[][];
  return (
    <ModuleShell title="Model Health" sub="Actual values only — NOT AVAILABLE when unknown. Never invented." status={String(d.status ?? h.status)} source={`artifacts · ${String(d.data_kind ?? '—')}`}>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-1">
          {([['version', d.model_version], ['accuracy', d.accuracy], ['precision', d.precision], ['recall', d.recall], ['F1', d.f1], ['ROC-AUC', d.roc_auc], ['train n', d.training_samples], ['test n', d.validation_samples], ['last trained', d.last_trained]] as [string, unknown][]).map(([l, v]) => (
            <div key={l as string} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
              <div className="dx-micro">{l}</div>
              <div className="text-sm font-bold text-white break-words">{cell(v)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">CONFUSION MATRIX + TOP FEATURES</div>
        <pre className="text-[11px] mt-1">{cm.length ? JSON.stringify(cm) : 'NOT AVAILABLE'}</pre>
        <ul className="text-xs mt-1 space-y-0.5">
          {Object.entries(fi).slice(0, 8).map(([k, v]) => <li key={k}>{k}: <b>{v}</b></li>)}
          {!Object.keys(fi).length && <li>NOT AVAILABLE</li>}
        </ul>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">DATA DRIFT</div>
        <pre className="text-[11px] mt-1 overflow-auto">{JSON.stringify(d.data_drift ?? 'NOT AVAILABLE', null, 1)}</pre>
        {'note' in d && <p className="text-[11px] text-slate-400">{String(d.note)}</p>}
      </div>
    </ModuleShell>
  );
}
