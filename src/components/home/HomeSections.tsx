'use client';
/**
 * STEP 01 — cinematic home sections. Each section: purpose, honest provenance,
 * CTA(s) to existing working routes only. VFX is CSS-only (GPU-cheap transforms,
 * reduced-motion safe via the global kill-switch + local media query).
 */
import Link from 'next/link';
import VizFigure from '@/platform/VizFigure';
import { StatusBadge } from '@/platform/provenance';

function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section className="home-section home-flow-section" aria-labelledby={id}>
      <p className="home-eyebrow">{kicker}</p>
      <h2 id={id} className="home-section-title home-flow-title">{title}</h2>
      {children}
    </section>
  );
}

function CtaRow({ items }: { items: { href: string; label: string; primary?: boolean }[] }) {
  return (
    <div className="home-cta" style={{ justifyContent: 'flex-start' }}>
      {items.map((c) => (
        <Link key={c.href + c.label} href={c.href} className={c.primary ? 'home-cta-primary' : 'home-cta-ghost'}>
          {c.label}
        </Link>
      ))}
    </div>
  );
}

export function MissionSection() {
  return (
    <Section id="home-mission" kicker="MISSION" title="One platform, every signal, zero guesswork">
      <p className="home-side-small" style={{ maxWidth: 720 }}>
        Disasters don&apos;t wait for fragmented dashboards. DRISHTI-X fuses open Earth observation,
        weather, terrain, sensors, and citizen reports into a single intelligence loop —
        every value labeled <StatusBadge status="LIVE" small /> <StatusBadge status="DEMO" small /> or honestly in between.
      </p>
      <div className="home-particles" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="home-particle" style={{ left: `${(i * 67) % 100}%`, animationDelay: `${(i * 0.7) % 5}s`, animationDuration: `${5 + (i % 4)}s` }} />
        ))}
      </div>
    </Section>
  );
}

export function DataSourcesSection() {
  const rows: [string, string, string][] = [
    ['Open-Meteo', 'Weather + rainfall', 'LIVE'],
    ['SoilGrids', 'Soil texture', 'LIVE'],
    ['OpenStreetMap', 'Tiles + geocoding', 'LIVE'],
    ['NASA GIBS', 'Satellite composites', 'LIVE'],
    ['IMD / Copernicus / SMS', 'Credential-gated feeds', 'NOT_CONFIGURED'],
  ];
  return (
    <Section id="home-data" kicker="MULTI-SOURCE DATA" title="Free-first data, honest provenance">
      <div className="home-grid home-grid-secondary">
        {rows.map(([name, use, status]) => (
          <div key={name} className="home-mini">
            <span className="home-mini-title">{name}</span>
            <span className="home-mini-meta">{use}</span>
            <span><StatusBadge status={status} small /></span>
          </div>
        ))}
      </div>
      <CtaRow items={[{ href: '/data-sources', label: 'Full source catalog', primary: true }]} />
    </Section>
  );
}

export function AiMlSection() {
  return (
    <Section id="home-ai" kicker="AI / ML" title="Explainable risk, never a black box">
      <div className="home-split">
        <VizFigure src="/img/ml-pipeline.svg" alt="AI risk pipeline diagram from weather and terrain data to warning" caption="RandomForest · 22 features · SYNTHETIC-DEMO training" status="DEMO" />
        <div>
          <p className="home-side-small">Every prediction ships its contributing factors, model version, and confidence. The demo model trains on synthetic data — metrics are labeled, never sold as field accuracy.</p>
          <CtaRow items={[{ href: '/prediction', label: 'Try prediction', primary: true }, { href: '/ml', label: 'Model lab' }, { href: '/model-health', label: 'Model health' }]} />
        </div>
      </div>
    </Section>
  );
}

export function GisSection() {
  return (
    <Section id="home-gis" kicker="GIS" title="Risk you can see on a map">
      <div className="home-split">
        <VizFigure src="/img/terrain.svg" alt="Terrain contour and slope diagram" caption="Slope + elevation drive the grid" status="DEMO" />
        <div>
          <p className="home-side-small">Leaflet heatmaps, MapLibre 3D GIS, Nominatim search, Overpass POIs, OSRM routing — all keyless. Google stays strictly optional.</p>
          <CtaRow items={[{ href: '/risk-map', label: 'Open risk map', primary: true }, { href: '/regions', label: 'Browse regions' }]} />
        </div>
      </div>
    </Section>
  );
}

export function SatelliteSection() {
  return (
    <Section id="home-satellite" kicker="SATELLITE" title="Earth observation, labeled truthfully">
      <div className="home-split">
        <VizFigure src="/img/sat-change.svg" alt="Reference change detection with highlighted disturbed area" caption="GIBS composites live · tasking needs accounts" status="LIVE" />
        <div>
          <p className="home-side-small">Daily VIIRS/MODIS composites stream straight into the risk map. Sentinel, FIRMS, and Bhuvan stay honest NOT_CONFIGURED stubs until credentials exist — gallery renders are never passed off as tasking.</p>
          <CtaRow items={[{ href: '/satellite', label: 'Satellite intel', primary: true }, { href: '/risk-map', label: 'See live layers' }]} />
        </div>
      </div>
    </Section>
  );
}

export function TwinSection() {
  return (
    <Section id="home-twin" kicker="3D DIGITAL TWIN" title="Terrain you can rotate, scenarios you can run">
      <div className="home-split">
        <VizFigure src="/img/hero-scene.svg" alt="Command-center situation render" caption="R3F terrain · sensor masts · rain · WebGL fallback included" status="SIMULATION" />
        <div>
          <p className="home-side-small">Procedural Himalayan-scale terrain with live-style sensor nodes, disaster scenario presets, and a global→slope drill-down globe. Simulation is always labeled — never live reality.</p>
          <CtaRow items={[{ href: '/twin', label: 'Open digital twin', primary: true }, { href: '/nesafe', label: 'NE-SAFE 3D center' }]} />
        </div>
      </div>
    </Section>
  );
}

export function CommandSection() {
  return (
    <Section id="home-command" kicker="COMMAND CENTER" title="Operators see everything at once">
      <div className="home-split">
        <VizFigure src="/img/hero-command.svg" alt="Command center situation wall illustration" caption="14 modules · role-gated actions · audited" status="DEMO" />
        <div>
          <p className="home-side-small">Situation, incidents, risk, weather, satellite, sensors, roads, shelters, resources, drones, alerts, evacuation, response, recovery — each a dedicated workflow behind role-aware sign-in.</p>
          <CtaRow items={[{ href: '/command', label: 'Launch command deck', primary: true }, { href: '/ops', label: 'Ops overview' }]} />
        </div>
      </div>
    </Section>
  );
}

export function EmergencySection() {
  return (
    <Section id="home-emergency" kicker="EMERGENCY RESPONSE" title="Help in one tap, no account needed">
      <div className="home-split">
        <VizFigure src="/img/response.svg" alt="Emergency response vehicles staged" caption="P1–P4 triage aid — commander decides, no auto-dispatch" status="DEMO" />
        <div>
          <p className="home-side-small">SOS, evacuation routes, shelters with live capacity math, offline reporting with server receipts — emergency info never sits behind a login.</p>
          <CtaRow items={[{ href: '/emergency', label: 'Emergency SOS', primary: true }, { href: '/evacuate', label: 'Evacuate' }, { href: '/response', label: 'Response board' }]} />
        </div>
      </div>
    </Section>
  );
}

export function FinalCta() {
  return (
    <section className="home-section home-final" aria-labelledby="home-final">
      <div className="home-holo" aria-hidden="true" />
      <h2 id="home-final" className="home-title" style={{ fontSize: 'clamp(24px, 4vw, 44px)' }}>READY WHEN DISASTER ISN&apos;T</h2>
      <p className="home-tagline">PICK A REGION · CHECK THE RISK · KNOW WHAT TO DO</p>
      <div className="home-cta" style={{ justifyContent: 'center' }}>
        <Link href="/regions" className="home-cta-primary">SELECT YOUR REGION</Link>
        <Link href="/intelligence" className="home-cta-secondary">ENTER INTELLIGENCE HUB</Link>
      </div>
    </section>
  );
}
