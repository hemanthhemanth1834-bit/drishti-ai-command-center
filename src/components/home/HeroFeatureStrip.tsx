'use client';
/**
 * Hero feature strip — six capability cards directly under the hero.
 * Every card navigates to a real existing route. Neon lucide icons,
 * hover animation via .home-card. No live-data claims here.
 */
import Link from 'next/link';
import {
  Radio,
  BrainCircuit,
  Layers,
  Globe2,
  Zap,
  HeartHandshake,
} from 'lucide-react';

const FEATURES = [
  {
    href: '/sensors',
    icon: Radio,
    title: 'Real-time Monitoring',
    desc: 'Satellites, sensors and field telemetry streaming into one view.',
    accent: '#00d2ff',
  },
  {
    href: '/prediction',
    icon: BrainCircuit,
    title: 'AI-powered Risk Prediction',
    desc: 'RandomForest models with explanations, never black-box alarms.',
    accent: '#a78bfa',
  },
  {
    href: '/data-sources',
    icon: Layers,
    title: 'Multi-source Data Fusion',
    desc: 'Satellite, weather, soil, sensors and citizen reports combined.',
    accent: '#38bdf8',
  },
  {
    href: '/regions',
    icon: Globe2,
    title: 'Nationwide Coverage',
    desc: 'Country → State → District → City registry driving every view.',
    accent: '#34d399',
  },
  {
    href: '/response',
    icon: Zap,
    title: 'Faster Response',
    desc: 'Transparent P1–P4 triage with a WHY behind every score.',
    accent: '#fbbf24',
  },
  {
    href: '/safety',
    icon: HeartHandshake,
    title: 'Safer Communities',
    desc: 'Citizen risk checks, alerts and preparedness in 9 languages.',
    accent: '#fb7185',
  },
];

export default function HeroFeatureStrip() {
  return (
    <section className="home-section" aria-label="Platform capabilities" style={{ paddingTop: 14 }}>
      <div className="home-grid home-grid-primary">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Link key={f.href + f.title} href={f.href} className="home-card">
              <span className="home-card-icon" style={{ color: f.accent }} aria-hidden="true">
                <Icon className="w-5 h-5" />
              </span>
              <span className="home-card-title">{f.title}</span>
              <span className="home-card-desc">{f.desc}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
