'use client';
/**
 * STEP 5 — Rainfall/flood intelligence / hazard types (SIH 26071 focus).
 * Five category cards with verified real photographs (registry-backed),
 * factual descriptions, and links to real routes. No live statistics,
 * no fabricated incidents. Photos are archival reference, never live feeds.
 */
import Link from 'next/link';
import DisasterCardPhoto from '@/components/visuals/DisasterCardPhoto';
import { getDisasterImage } from '@/data/disasterImages';

export const TYPES = [
  {
    name: 'Cyclone',
    href: '/risk-map',
    photoId: 'cyclone-nilam',
    alt: 'NASA satellite observation of Cyclonic Storm Nilam over the Bay of Bengal',
    desc: 'Tropical cyclones threaten India\u2019s coasts with extreme wind, storm surge and intense rainfall.',
  },
  {
    name: 'Flood',
    href: '/weather',
    photoId: 'flood-ganges',
    alt: 'NASA satellite observation of flooding across northern India',
    desc: 'Monsoon riverine, flash and urban floods across basins — tracked with rainfall intelligence.',
  },
  {
    name: 'Heavy Rainfall',
    href: '/weather',
    photoId: 'sih-rain-mumbai',
    alt: 'Heavy monsoon rains falling over a Mumbai street',
    desc: 'Intense downpours monitored and forecast — the trigger behind floods and inundation.',
  },
  {
    name: 'Inundation',
    href: '/risk-map',
    photoId: 'sih-inundation-sindh',
    alt: 'NASA satellite view of widespread inundation across Sindh province',
    desc: 'Flood extent mapped from satellite observation — which areas go under water.',
  },
  {
    name: 'Landslide',
    href: '/terrain',
    photoId: 'landslide-debris-flow',
    alt: 'NASA satellite observation of a debris flow in India',
    desc: 'Slope failures on Himalayan and Western Ghats roads — slope and rain driven.',
  },
];

export default function DisasterTypes() {
  return (
    <section className="home-section" aria-labelledby="home-disaster-types">
      <p className="home-eyebrow">RAINFALL + INUNDATION INTELLIGENCE</p>
      <h2 id="home-disaster-types" className="home-section-title">
        Five hazards, one early-warning loop
      </h2>
      <div className="home-grid home-grid-primary">
        {TYPES.map((t) => {
          const photo = getDisasterImage(t.photoId);
          return (
            <Link key={t.name} href={t.href} className="home-card">
              {photo ? (
                <DisasterCardPhoto photo={photo} alt={t.alt} />
              ) : (
                <span className="home-card-icon" aria-hidden="true" />
              )}
              <strong>{t.name}</strong>
              <span>{t.desc}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
