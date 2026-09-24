'use client';
/**
 * STEP 01 — cinematic home sections. Each section: purpose, honest provenance,
 * CTA(s) to existing working routes only. VFX is CSS-only (GPU-cheap transforms,
 * reduced-motion safe via the global kill-switch + local media query).
 */
import Link from 'next/link';
import dynamic from 'next/dynamic';
import RealPhoto from '@/components/home/RealPhoto';
import BeforeAfter from '@/components/home/BeforeAfter';
import VizFigure from '@/platform/VizFigure';
import { StatusBadge } from '@/platform/provenance';

const HomeMiniMap = dynamic(() => import('@/components/map/DisasterMap'), {
  ssr: false,
  loading: () => <p className="text-xs text-slate-400">Loading live risk map…</p>,
});

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
        <strong className="text-white">DRISHTI-X is an AI-powered disaster-intelligence platform</strong> for
        real-time situational awareness — geo-spatial intelligence that watches hazards, predicts risk,
        assesses impact, and supports emergency response.
      </p>
      <p className="home-side-small" style={{ maxWidth: 720 }}>
        Disasters don&apos;t wait for fragmented dashboards. DRISHTI-X fuses open Earth observation,
        weather, terrain, sensors, and citizen reports into a single intelligence loop —
        every value labeled <StatusBadge status="LIVE" small /> <StatusBadge status="DEMO" small /> or honestly in between.
      </p>
      <div className="home-split">
        <RealPhoto
          src="/img/photos/mission-himalaya.jpg"
          alt="The Himalayan range and northern India photographed from the International Space Station"
          caption="OUR MISSION — To build a safer, more resilient India through AI-driven disaster intelligence."
          source="NASA ISS (public domain)"
          sourceHref="https://commons.wikimedia.org/wiki/File:ISS-64_India,_the_Himalayas_and_China.jpg"
          ratio="16 / 10"
        />
        <div>
          <p className="home-side-small">Satellite, ground and community data become early warning, informed decisions and faster response — from Himalayan slopes to coastal deltas.</p>
          <CtaRow items={[{ href: '/regions', label: 'Explore regions', primary: true }, { href: '/learn', label: 'Prepare yourself' }]} />
        </div>
      </div>
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
        <div className="min-w-0">
          <HomeMiniMap height={300} />
          <p className="home-photo-cap">
            Live operational layers — risk, evacuation, responders, satellite, quakes.{' '}
            <span className="home-photo-src">Tiles: OpenStreetMap · quakes: USGS (LIVE)</span>
          </p>
        </div>
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
      <p className="home-side-small" style={{ maxWidth: 720 }}>
        Kerala, August 2018 — drag the slider to compare Landsat 8 before the flood (6 Feb 2018)
        with Sentinel-2 after inundation (22 Aug 2018). Historical reference, not a live feed.
      </p>
      <BeforeAfter />
      <div className="home-split" style={{ marginTop: 4 }}>
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
        <div className="min-w-0">
          <VizFigure src="/img/hero-command.svg" alt="Command center situation wall illustration" caption="14 modules · role-gated actions · audited" status="DEMO" />
          <RealPhoto
            src="/img/photos/command-eoc.jpg"
            alt="Emergency operations center coordinating a hurricane response"
            caption="Illustrative Command Center — a real emergency operations center at work (not DRISHTI-X itself)."
            source="FEMA (public domain)"
            sourceHref="https://commons.wikimedia.org/wiki/File:FEMA_-_38184_-_Emergency_Operations_Center_in_Texas.jpg"
            ratio="16 / 9"
          />
        </div>
        <div>
          <p className="home-side-small">Situation, incidents, risk, weather, satellite, sensors, roads, shelters, resources, drones, alerts, evacuation, response, recovery — each a dedicated workflow behind role-aware sign-in.</p>
          <CtaRow items={[{ href: '/command', label: 'Launch command deck', primary: true }, { href: '/ops', label: 'Ops overview' }]} />
        </div>
      </div>
    </Section>
  );
}

export function EmergencySection() {
  const steps = [
    { step: '1 · DETECT', title: 'Live hazard layers', desc: 'Risk grid, quakes, weather and satellite on one map.', href: '/risk-map' },
    { step: '2 · ASSESS', title: 'Observed → analysis', desc: 'Situation brief with evidence, never bare alarms.', href: '/intelligence' },
    { step: '3 · RESPOND', title: 'SOS + triage board', desc: 'One-tap SOS and a transparent P1–P4 queue.', href: '/emergency' },
  ];
  return (
    <Section id="home-emergency" kicker="EMERGENCY RESPONSE" title="Help in one tap, no account needed">
      <div className="home-split">
        <div className="min-w-0">
          <VizFigure src="/img/response.svg" alt="Emergency response vehicles staged" caption="P1–P4 triage aid — commander decides, no auto-dispatch" status="DEMO" />
          <RealPhoto
            src="/img/photos/emergency-rescue.jpg"
            alt="Helicopter flood rescue during Hurricane Harvey relief operations"
            caption="Illustrative Response — helicopter flood rescue (archive photo; the pictured crew is not affiliated with DRISHTI-X)."
            source="U.S. Navy (public domain)"
            sourceHref="https://commons.wikimedia.org/wiki/File:Hurricane_Harvey_rescue_(37833567051).jpg"
            ratio="16 / 9"
          />
        </div>
        <div>
          <p className="home-side-small">SOS, evacuation routes, shelters with live capacity math, offline reporting with server receipts — emergency info never sits behind a login.</p>
          <div className="home-grid home-grid-secondary" style={{ marginTop: 10 }}>
            {steps.map((s) => (
              <Link key={s.step} href={s.href} className="home-mini">
                <span className="home-mini-status">{s.step}</span>
                <span className="home-mini-title">{s.title}</span>
                <span className="home-mini-meta">{s.desc}</span>
              </Link>
            ))}
          </div>
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
