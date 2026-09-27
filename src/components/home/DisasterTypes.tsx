'use client';
/**
 * STEP 5 — Disaster intelligence / disaster types.
 * Six category cards with verified real photographs (registry-backed),
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
    name: 'Wildfire',
    href: '/risk-map',
    photoId: 'wildfire-ferguson',
    alt: 'U.S. Forest Service photograph of the Ferguson Fire',
    desc: 'Forest and scrub fires in dry seasons; satellite burn-scar context where available.',
  },
  {
    name: 'Landslide',
    href: '/terrain',
    photoId: 'landslide-debris-flow',
    alt: 'NASA satellite observation of a debris flow in India',
    desc: 'Slope failures on Himalayan and Western Ghats roads — slope and rain driven.',
  },
  {
    name: 'Drought',
    href: '/weather',
    photoId: 'drought-lake-mead',
    alt: 'National Park Service photograph of drought-cracked ground',
    desc: 'Rainfall deficit and soil-moisture stress tracked over agricultural regions.',
  },
  {
    name: 'Heatwave',
    href: '/weather',
    photoId: 'heatwave-hottest-spots',
    alt: 'NASA satellite map of the hottest land surface spots on Earth',
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
