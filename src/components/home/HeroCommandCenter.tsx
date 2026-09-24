'use client';
/** Cinematic hero: brand, mission, live 3D core (graceful fallback), side panels, CTAs. */
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Activity, HeartPulse, Box, ChevronRight } from 'lucide-react';

const AiCoreScene = dynamic(() => import('@/components/cinematic/AiCoreScene'), {
  ssr: false,
  loading: () => (
    <div className="home-core-fallback" role="img" aria-label="DRISHTI-X AI core visualization loading">
      <span className="home-core-orb" aria-hidden="true" />
    </div>
  ),
});

const FLOW = ['SPACE', 'SATELLITE', 'EARTH OBSERVATION', 'AI', 'GIS', 'FIELD INTELLIGENCE', 'EARLY WARNING', 'RESPONSE', 'RECOVERY'];

export default function HeroCommandCenter() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/photos/hero-nilam.jpg"
          alt=""
          className="home-hero-photo"
          loading="eager"
          decoding="async"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/hero-scene.svg" alt="" className="home-hero-scene" loading="eager" decoding="async" />
        <span className="home-hero-grid" />
        <span className="home-hero-glow" />
      </div>
      <span className="home-hero-photo-chip">ILLUSTRATIVE IMAGE · NASA MODIS cyclone over Bay of Bengal, 2012</span>

      <div className="home-hero-main">
        <p className="home-eyebrow">SOVEREIGN DISASTER INTELLIGENCE COMMAND CENTER</p>
        <h1 id="home-hero-title" className="home-title">DRISHTI-X</h1>
        <p className="home-pillars" aria-label="Mission pillars">PEOPLE&nbsp;&nbsp;|&nbsp;&nbsp;PLANET&nbsp;&nbsp;|&nbsp;&nbsp;PREPARE&nbsp;&nbsp;|&nbsp;&nbsp;RESPOND&nbsp;&nbsp;|&nbsp;&nbsp;RECOVER</p>
        <p className="home-tagline">SEE EARLY • UNDERSTAND BETTER • ACT FASTER • SAVE LIVES</p>
        <p className="home-mission">FOR A SAFER, STRONGER, RESILIENT INDIA — FOR A SAFER WORLD</p>

        <div className="home-core">
          <div className="home-core-fallback" aria-hidden="true">
            <span className="home-core-orb" />
          </div>
          <AiCoreScene height={300} tone="ok" />
        </div>
        <ol className="home-flow" aria-label="Intelligence data flow">
          {FLOW.map((step, i) => (
            <li key={step}>
              <span>{step}</span>
              {i < FLOW.length - 1 && <ChevronRight className="w-3 h-3" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <div className="home-cta">
          <Link href="/command" className="home-cta-primary">
            <Activity className="w-4 h-4" aria-hidden="true" /> LAUNCH COMMAND DECK
          </Link>
          <Link href="/safety" className="home-cta-secondary">
            <HeartPulse className="w-4 h-4" aria-hidden="true" /> CHECK CITIZEN RISK
          </Link>
          <Link href="/twin" className="home-cta-ghost">
            <Box className="w-4 h-4" aria-hidden="true" /> 3D TWIN
          </Link>
        </div>
      </div>

      <aside className="home-hero-side home-hero-left" aria-label="Field intelligence">
        <p className="home-side-kicker">FROM SPACE TO GROUND — FROM DATA TO LIVES</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/satellite.svg" alt="Illustrative observation satellite" className="home-side-visual" loading="lazy" decoding="async" />
        <p className="home-side-big">DISASTERS DON&rsquo;T WAIT.<br />BUT WE CAN BE READY.</p>
        <p className="home-side-small">Satellite passes, sensor meshes, and citizen eyes stream into one honest operational picture — every value labeled LIVE, FORECAST, DEMO, or OFFLINE.</p>
        <Link href="/intelligence" className="home-side-link">Open intelligence hub →</Link>
      </aside>

      <aside className="home-hero-side home-hero-right" aria-label="Resilience">
        <p className="home-side-kicker">A SAFER TOMORROW — TOGETHER</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/drone.svg" alt="Illustrative survey drone" className="home-side-visual" loading="lazy" decoding="async" />
        <ul className="home-side-phases">
          <li><strong>BEFORE</strong><span>PREPARE</span><Link href="/plan">Make a plan →</Link></li>
          <li><strong>DURING</strong><span>RESPOND</span><Link href="/emergency">Get help →</Link></li>
          <li><strong>AFTER</strong><span>RECOVER</span><Link href="/recovery">Rebuild →</Link></li>
        </ul>
        <p className="home-side-small">Responders, hospitals, shelters, and volunteers coordinate from the same map.</p>
        <p className="home-safe-badge" aria-label="People safe, communities resilient, a stronger tomorrow">PEOPLE SAFE · COMMUNITIES RESILIENT · A STRONGER TOMORROW</p>
        <Link href="/response" className="home-side-link">Open response board →</Link>
      </aside>
    </section>
  );
}
