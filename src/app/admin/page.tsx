'use client';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';
import VizFigure from '@/platform/VizFigure';

export default function AdminPage() {
  const roles = usePlatform<{ roles: { role: string; permissions: string[] }[] }>('/api/v1/admin/roles');
  const audit = usePlatform<{ count: number; logs: { id: number; actor: string; action: string; detail: string; ts: string }[] }>('/api/v1/admin/audit?limit=20');
  const th = usePlatform<Record<string, unknown>>('/api/v1/warnings/config');
  const models = usePlatform<{ count: number; versions: { version: string; data_kind: string; f1: number; active: boolean }[] }>('/api/v1/admin/models');
  const ops = usePlatform<{ uptime_s: number; requests: number; errors: { '4xx': number; '5xx': number }; latency_ms: { p50: number | null; p95: number | null }; inference_ms: { p50: number | null }; provider_failures: Record<string, number>; sync: { accepted: number; rejected: number }; database: string }>('/api/v1/ops/health');
  return (
    <ModuleShell title="Administration" sub="Roles · audit · thresholds · model registry. Mutations need operator key." status="LIVE" source="Admin API (Bearer)">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">ROLES (RBAC)</div>
        {(roles.data?.roles ?? []).map((r) => (
          <div key={r.role} className="text-xs py-1 border-b border-[#1b314b]"><b className="text-white">{r.role}</b>: {r.permissions.join(', ')}</div>
        ))}
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">WARNING THRESHOLDS (ENV-CONFIGURABLE)</div>
        <pre className="text-[11px] mt-1">{JSON.stringify(th.data ?? th.status, null, 1)}</pre>
        <div className="mt-2"><VizFigure src="/img/hero-command.svg" alt="Command center situation wall illustration" caption="Authority view (reference render)" status="DEMO" /></div>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">OBSERVABILITY (LIGHTWEIGHT, IN-MEMORY)</div>
        {ops.data ? (
          <div className="text-xs mt-1 space-y-0.5">
            <div>uptime {ops.data.uptime_s}s · requests {ops.data.requests} · errors 4xx {ops.data.errors['4xx']} / 5xx {ops.data.errors['5xx']}</div>
            <div>latency p50 {String(ops.data.latency_ms.p50)}ms · p95 {String(ops.data.latency_ms.p95)}ms · inference p50 {String(ops.data.inference_ms.p50)}ms</div>
            <div>provider failures: {JSON.stringify(ops.data.provider_failures)} · sync ✓{ops.data.sync.accepted}/✗{ops.data.sync.rejected} · db {ops.data.database}</div>
          </div>
        ) : <p className="text-xs">…</p>}
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">MODEL REGISTRY ({models.data?.count ?? '…'})</div>
        {(models.data?.versions ?? []).map((m) => (
          <div key={m.version} className="text-xs py-1 border-b border-[#1b314b] flex justify-between">
            <span>{m.version} · {m.data_kind} · F1 {m.f1}</span>
            {m.active && <StatusBadge status="LIVE" small />}
          </div>
        ))}
        {audit.status === 'OFFLINE' || (audit.data === null && !audit.loading) ? (
          <p className="text-[11px] text-slate-400 mt-2">Audit log needs an operator key (401 without one) — refused honestly, never fabricated.</p>
        ) : (
          <div className="mt-2">
            <div className="dx-micro">AUDIT ({audit.data?.count})</div>
            {(audit.data?.logs ?? []).map((l) => (
              <div key={l.id} className="text-[11px] text-slate-400">{l.ts?.slice(0, 19)} · {l.actor} · {l.action} · {l.detail}</div>
            ))}
          </div>
        )}
      </div>
    </ModuleShell>
  );
}
