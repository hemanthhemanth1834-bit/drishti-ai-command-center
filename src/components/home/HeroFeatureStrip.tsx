'use client';
/**
 * Hero feature strip — six capability cards directly under the hero.
 * Each card leads with a REAL topic photograph (registry-backed plain img),
 * then a small semantic icon + title + description + topic explanation.
 * No live-data claims here; photos are archival reference.
 */
import Link from 'next/link';
import { useState } from 'react';
import {
  Radio,
  BrainCircuit,
  Layers,
  Globe2,
  Zap,
  HeartHandshake,
} from 'lucide-react';
import { getDisasterImage } from '@/data/disasterImages';

export const FEATURES = [
  {
    href: '/sensors',
    icon: Radio,
    photoId: 'satellite-kerala-after',
    title: 'Real-time Monitoring',
    desc: 'Satellites, sensors and field telemetry streaming into one view.',
    explainer: 'Satellite, sensor and field observations provide continuously updated situational information for disaster monitoring.',
    accent: '#00d2ff',
  },
  {
    href: '/prediction',
    icon: BrainCircuit,
    photoId: 'landslide-debris-flow',
    title: 'AI-powered Risk Prediction',
    desc: 'RandomForest models with explanations, never black-box alarms.',
    explainer: 'Machine-learning models can combine environmental and historical features to estimate disaster risk; model outputs must be interpreted with their data and validation limits.',
    accent: '#a78bfa',
  },
  {
    href: '/data-sources',
    icon: Layers,
    photoId: 'cyclone-nilam',
    title: 'Multi-source Data Fusion',
    desc: 'Satellite, weather, soil, sensors and citizen reports combined.',
    explainer: 'Disaster intelligence can combine satellite, weather, soil, sensor and field-report information into a common operational view.',
    accent: '#38bdf8',
  },
  {
    href: '/regions',
    icon: Globe2,
    photoId: 'terrain-himalaya',
    title: 'Nationwide Coverage',
    desc: 'Country → State → District → City registry driving every view.',
    explainer: 'The geographic hierarchy connects national, state, district, city and local views for regional disaster awareness.',
    accent: '#34d399',
  },
  {
    href: '/response',
    icon: Zap,
    photoId: 'command-eoc',
    title: 'Faster Response',
    desc: 'Transparent P1–P4 triage with a WHY behind every score.',
    explainer: 'Emergency response teams assess incidents, coordinate resources, and prioritize actions during disaster operations.',
    accent: '#fbbf24',
  },
  {
    href: '/safety',
    icon: HeartHandshake,
    photoId: 'shelter-fema-cots',
    title: 'Safer Communities',
    desc: 'Citizen risk checks, alerts and preparedness in 9 languages.',
    explainer: 'Preparedness information, alerts and evacuation guidance can help communities understand hazards and response options.',
    accent: '#fb7185',
  },
];

function FeaturePhoto({ photoId, alt }: { photoId: string; alt: string }) {
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  const photo = getDisasterImage(photoId);
  if (!photo || stage >= 3) return <span className="home-card-photo" aria-hidden="true" />;
  // remote primary → remote retry → verified local fallback → empty box
  const remote = photo.remoteUrl;
  const src = stage === 0 ? remote ?? photo.fallbackUrl
    : stage === 1 && remote ? `${remote}&retry=1`
    : photo.fallbackUrl;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src} alt={alt}
      loading="lazy" decoding="async"
      onError={() => setStage((s) => {
        if (s === 0 && !remote) return 2;
        return s >= 2 ? 3 : ((s + 1) as 0 | 1 | 2 | 3);
      })}
      className="home-card-photo"
    />
  );
}

export default function HeroFeatureStrip() {
  return (
    <section className="home-section" aria-label="Platform capabilities" style={{ paddingTop: 14 }}>
      <div className="home-grid home-grid-primary">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const photo = getDisasterImage(f.photoId);
          return (
            <Link key={f.href + f.title} href={f.href} className="home-card">
              <FeaturePhoto photoId={f.photoId} alt={photo?.alt ?? f.title} />
              <span className="home-card-title"><Icon className="w-4 h-4" aria-hidden="true" style={{ color: f.accent, display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />{f.title}</span>
              <span className="home-card-desc">{f.desc}</span>
              <span className="home-card-desc" style={{ color: '#7d93a8' }}>{f.explainer}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
