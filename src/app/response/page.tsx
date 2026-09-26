'use client';
import { ModuleShell, StatusBadge, WhyList } from '@/platform/provenance';
import LocationContextBar from '@/components/location/LocationContextBar';
import RealPhotoCard from '@/components/visuals/RealPhotoCard';
import { usePlatform } from '@/platform/usePlatform';
import VizFigure from '@/platform/VizFigure';

export default function ResponsePage() {
  const q = usePlatform<{ count: number; queue: { alert_id: string; level: string; title: string; score: number; band: string; why: string[] }[] }>('/api/v1/response/queue');
  return (
    <>
      <LocationContextBar />
    <ModuleShell title="Response Prioritisation" sub="Transparent P1..P4 triage — every score shows WHY. Commander decides." status="DEMO" source="Priority engine over alerts">
      <RealPhotoCard assetId="response-harvey-rescue" badge="ARCHIVAL" contextNote="ARCHIVAL SAR CONTEXT — helicopter flood rescue. The priority queue below is computed from live alerts, not from this photo." />
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">PRIORITY QUEUE ({q.data?.count ?? '…'})</div>
        <div className="nesafe-vizgrid mt-2">
          <VizFigure src="/img/response.svg" alt="Emergency response vehicles staged" caption="Response units (reference)" status="DEMO" />
          <VizFigure src="/img/shelter.svg" alt="Relief shelter illustration" caption="Shelter capacity (reference)" status="DEMO" />
        </div>
        {(q.data?.queue ?? []).map((i) => (
          <div key={i.alert_id} className="border-b border-[#1b314b] py-2">
            <div className="flex justify-between text-sm">
              <b className="text-white">{i.band} · {i.title}</b>
              <span><StatusBadge status={i.level} small /> {i.score}</span>
            </div>
            <WhyList items={i.why.map((w) => ({ label: w }))} />
          </div>
        ))}
        {!(q.data?.queue?.length) && <p className="text-xs">No active alerts — queue fills from /api/v1/warnings/evaluate.</p>}
      </div>
    </ModuleShell>
    </>
  );
}
