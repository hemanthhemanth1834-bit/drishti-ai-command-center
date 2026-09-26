'use client';
import Link from 'next/link';
import { ModuleShell } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';
import VizFigure from '@/platform/VizFigure';
import { healthLabel, isSyntheticDemoKind, metricCell, modelBadge, timelineEntries } from '@/components/model/modelUtils';

function cell(v: unknown) {
  return v === undefined || v === null ? 'NOT AVAILABLE' : String(v);
}

export default function ModelHealthPage() {
  const h = usePlatform<Record<string, unknown>>('/api/v1/model-health');
  const mi = usePlatform<{ model_version?: string; status?: string; trained_at?: string; data_kind?: string; features?: string[]; note?: string }>('/api/v1/ml/model');
  const fx = usePlatform<{ features?: string[]; count?: number }>('/api/v1/ml/features');
  const d = h.data ?? {};
  const reachable = Boolean(h.data);
  const badge = modelBadge(d.data_kind ?? mi.data?.data_kind, d.status ?? mi.data?.status);
  const retrievedAt = new Date().toISOString();
  const drift = (d.data_drift ?? null) as unknown;
  const fi = (d.feature_importance ?? {}) as Record<string, number>;
  const cm = (d.confusion_matrix ?? []) as number[][];
  return (
    <ModuleShell title="Model Health" sub="Actual values only — NOT AVAILABLE when unknown. Never invented." status={String(d.status ?? h.status)} source={`artifacts · ${String(d.data_kind ?? '—')}`}>
      {!reachable && (
        <div className="dx-hud" role="alert" aria-label="Model backend offline">
          <div className="dx-hud-edge" />
          <div className="text-sm font-black text-slate-200">MODEL OFFLINE — backend unreachable</div>
          <p className="text-[11px] text-slate-400 mt-1">No live model data. Values below are NOT AVAILABLE until the backend reconnects. Nothing here is simulated as healthy.</p>
        </div>
      )}
      {badge === 'SYNTHETIC-DEMO' && (
        <div className="dx-hud" role="status" aria-label="Synthetic demo model designation" style={{ borderColor: '#fbbf24' }}>
          <div className="dx-hud-edge" />
          <div className="text-sm font-black text-amber-300">SYNTHETIC-DEMO MODEL — NOT AN OPERATIONAL PREDICTOR</div>
          <p className="text-[11px] text-slate-300 mt-1">Trained on synthetic data ({String(d.data_kind ?? mi.data?.data_kind ?? 'unknown kind')}). Metrics below describe the demo artifact only — never field accuracy.</p>
        </div>
      )}
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
      <div className="dx-hud" aria-label="Model identity">
        <div className="dx-hud-edge" />
        <div className="dx-micro">MODEL IDENTITY — CONTRACT FIELDS ONLY</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-1">
          {([
            ['version', mi.data?.model_version], ['status', mi.data?.status],
            ['trained at', mi.data?.trained_at], ['data kind', mi.data?.data_kind],
            ['features', fx.data?.count ?? mi.data?.features?.length],
            ['health', healthLabel(d.status ?? mi.data?.status, reachable)],
          ] as [string, unknown][]).map(([l, v]) => (
            <div key={l as string} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
              <div className="dx-micro">{l}</div>
              <div className="text-sm font-bold text-white break-words">{metricCell(v)}</div>
            </div>
          ))}
        </div>
        {mi.data?.note && <p className="text-[11px] text-slate-400 mt-1">{mi.data.note}</p>}
      </div>
      <div className="dx-hud" aria-label="Calibration and drift">
        <div className="dx-hud-edge" />
        <div className="dx-micro">CALIBRATION / DRIFT — SOURCE-BACKED ONLY</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-1">
          <div className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
            <div className="dx-micro">CALIBRATION</div>
            <div className="text-sm font-bold text-white">NOT AVAILABLE</div>
            <p className="text-[11px] text-slate-400 mt-1">No calibration source exists in the backend contract — no score, curve, or percentage is shown.</p>
          </div>
          <div className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
            <div className="dx-micro">DRIFT</div>
            <div className="text-sm font-bold text-white break-words">{drift == null ? 'NOT AVAILABLE' : typeof drift === 'string' ? drift : JSON.stringify(drift)}</div>
            <p className="text-[11px] text-slate-400 mt-1">PSI drift over recent inputs when the backend provides it; never inferred from model age.</p>
          </div>
        </div>
      </div>
      <div className="dx-hud" aria-label="Inference availability">
        <div className="dx-hud-edge" />
        <div className="dx-micro">INFERENCE — EXISTING CONTRACT</div>
        <p className="text-xs text-slate-300 mt-1">
          {reachable && mi.data?.status === 'READY'
            ? 'Inference endpoint available. Run predictions with explicit demo inputs on the prediction page — inputs are never presented as live measurements.'
            : 'INFERENCE UNAVAILABLE — backend unreachable or model not ready. No predictions shown.'}
        </p>
        <div className="mt-2 flex gap-2 flex-wrap text-[11px]">
          <Link href="/prediction" className="px-3 py-1.5 rounded border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60 font-bold">OPEN PREDICTION PLAYGROUND</Link>
          <Link href="/ml" className="px-3 py-1.5 rounded border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60 font-bold">MODEL LAB</Link>
        </div>
      </div>
      <div className="dx-hud" aria-label="Model timeline">
        <div className="dx-hud-edge" />
        <div className="dx-micro">TIMELINE — SOURCE TIMESTAMPS ONLY</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mt-1">
          {timelineEntries({ trainedAt: (d.last_trained ?? mi.data?.trained_at) as unknown, retrievedAt }).map((t) => (
            <div key={t.label} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
              <div className="dx-micro">{t.label}</div>
              <div className="text-sm font-bold text-white tnum">{t.value}</div>
            </div>
          ))}
        </div>
      </div>
    </ModuleShell>
  );
}
