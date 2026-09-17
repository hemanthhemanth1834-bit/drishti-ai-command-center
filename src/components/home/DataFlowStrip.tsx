'use client';
/**
 * Phase 9 — DATA → AI → GIS flow strip. Mirrors the real backend pipeline
 * (ingest → validate → features → ML/risk → grid → GIS → alert → response).
 * CSS animation only; stages link to their real pages.
 */
import Link from 'next/link';

const STAGES: { label: string; href: string }[] = [
  { label: 'DATA', href: '/data-sources' },
  { label: 'VALIDATE', href: '/data-sources' },
  { label: 'FEATURES', href: '/ml' },
  { label: 'ML/AI', href: '/ml' },
  { label: 'RISK', href: '/prediction' },
  { label: 'GIS', href: '/risk-map' },
  { label: 'ALERT', href: '/alerts' },
  { label: 'INCIDENT', href: '/incidents' },
  { label: 'RESPONSE', href: '/response' },
];

const INPUTS = ['WEATHER', 'SATELLITE', 'TERRAIN', 'SOIL', 'SENSORS', 'HISTORY'];

export default function DataFlowStrip() {
  return (
    <div className="dx-flow" role="img" aria-label="Data fusion pipeline: weather, satellite, terrain, soil, sensors and history flow into ML, risk, GIS, alert and response">
      <div className="dx-flow-inputs">
        {INPUTS.map((s, i) => (
          <span key={s} className="dx-flow-chip" style={{ animationDelay: `${i * 0.3}s` }}>{s}</span>
        ))}
      </div>
      <div className="dx-flow-arrow" aria-hidden="true">↓ FUSION ↓</div>
      <div className="dx-flow-stages">
        {STAGES.map((s, i) => (
          <Link key={`${s.label}-${i}`} href={s.href} className="dx-flow-chip dx-flow-link" style={{ animationDelay: `${1.8 + i * 0.25}s` }}>
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
