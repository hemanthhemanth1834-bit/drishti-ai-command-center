'use client';
/**
 * STEP 5 — Disaster intelligence / disaster types.
 * Six category cards with existing verified SVG icons, factual descriptions,
 * and links to real routes. No live statistics, no fabricated incidents.
 */
import Link from 'next/link';

const TYPES = [
  {
    name: 'Cyclone',
    href: '/risk-map',
    icon: '/img/dis-cyclone.svg',
    alt: 'Cyclone spiral over coastline',
    desc: 'Tropical cyclones threaten India\u2019s coasts with extreme wind, storm surge and intense rainfall.',
  },
  {
    name: 'Flood',
    href: '/weather',
    icon: '/img/dis-flood.svg',
    alt: 'River flood over roads and houses',
    desc: 'Monsoon riverine, flash and urban floods across basins — tracked with rainfall intelligence.',
  },
  {
    name: 'Wildfire',
    href: '/risk-map',
    icon: '/img/dis-fire.svg',
    alt: 'Forest fire flame icon',
    desc: 'Forest and scrub fires in dry seasons; satellite burn-scar context where available.',
  },
  {
    name: 'Landslide',
    href: '/terrain',
    icon: '/img/dis-landslide.svg',
    alt: 'Landslide affecting a mountain road',
    desc: 'Slope failures on Himalayan and Western Ghats roads — slope and rain driven.',
  },
  {
    name: 'Drought',
    href: '/weather',
    icon: '/img/dis-drought.svg',
    alt: 'Drought-affected farmland',
    desc: 'Rainfall deficit and soil-moisture stress tracked over agricultural regions.',
  },
  {
    name: 'Heatwave',
    href: '/weather',
    icon: '/img/wx-storm.svg',
    alt: 'Severe weather warning icon',
    desc: 'Extreme heat episodes with health advisories for vulnerable districts.',
  },
];

export default function DisasterTypes() {
  return (
    <section className="home-section" aria-labelledby="home-disaster-types">
      <p className="home-eyebrow">DISASTER INTELLIGENCE</p>
      <h2 id="home-disaster-types" className="home-section-title">
        Six hazards, one intelligence loop
      </h2>
      <div className="home-grid home-grid-primary">
        {TYPES.map((t) => (
          <Link key={t.name} href={t.href} className="home-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.icon} alt={t.alt} className="home-card-icon" loading="lazy" decoding="async" />
            <strong>{t.name}</strong>
            <span>{t.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
