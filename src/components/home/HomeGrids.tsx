'use client';
/** Homepage card grids — every card navigates to a real route or flips real store state. */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setApp, useApp, type Lang } from '@/store/appStore';
import {
  PRIMARY_ACTIONS, SECONDARY_FEATURES, OPERATIONAL_FEATURES,
  type ActionCard, type NavigationItem,
} from '@/config/navigation';

function Card({ item }: { item: NavigationItem }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="home-card" aria-label={`${item.label}${item.description ? ` — ${item.description}` : ''}`}>
      <span className="home-card-icon" aria-hidden="true"><Icon className="w-5 h-5" /></span>
      <span className="home-card-title">{item.label}</span>
      {item.description && <span className="home-card-desc">{item.description}</span>}
    </Link>
  );
}

const LANG_CYCLE: Lang[] = ['en', 'te', 'hi'];

export function PrimaryActionGrid() {
  return (
    <section className="home-section" aria-labelledby="home-primary">
      <p className="home-eyebrow">START HERE</p>
      <h2 id="home-primary" className="home-section-title">PRIMARY ACTIONS</h2>
      <p className="home-muted" style={{ marginTop: 6 }}>
        The six fastest paths — check safety, explore hazards, and get help. No account needed.
      </p>
      <div className="home-grid home-grid-primary">
        {PRIMARY_ACTIONS.map((item) => (
          <Card key={item.href + item.label} item={item} />
        ))}
      </div>
    </section>
  );
}

export function IntelligenceFeatureGrid() {
  return (
    <section className="home-section" aria-labelledby="home-features">
      <p className="home-eyebrow">CAPABILITIES</p>
      <h2 id="home-features" className="home-section-title">INTELLIGENCE CAPABILITIES</h2>
      <p className="home-muted" style={{ marginTop: 6 }}>
        Citizen-first tools for help, reporting, readiness and recovery — every card opens a working route.
      </p>
      <div className="home-grid home-grid-secondary">
        {SECONDARY_FEATURES.map((item) => (
          <Card key={item.href + item.label} item={item} />
        ))}
      </div>
    </section>
  );
}

export function OperationalGrid() {
  const router = useRouter();
  const { lang, a11y } = useApp();

  const onAction = (item: ActionCard) => (e: React.MouseEvent) => {
    if (!item.action) return;
    e.preventDefault();
    if (item.action === 'public-mode') {
      setApp({ mode: 'public' });
      router.push(item.href);
    } else if (item.action === 'command-mode') {
      setApp({ mode: 'command' });
      router.push(item.href);
    } else if (item.action === 'cycle-lang') {
      const next = LANG_CYCLE[(LANG_CYCLE.indexOf(lang as Lang) + 1) % LANG_CYCLE.length] ?? 'en';
      setApp({ lang: next });
    } else if (item.action === 'large-text') {
      setApp({ a11y: { ...a11y, largeText: !a11y.largeText } });
    }
  };

  return (
    <section className="home-section" aria-labelledby="home-ops">
      <p className="home-eyebrow">PLATFORM</p>
      <h2 id="home-ops" className="home-section-title">OPERATIONS &amp; PLATFORM</h2>
      <p className="home-muted" style={{ marginTop: 6 }}>
        Live preferences and platform views — language, readability and operating mode apply instantly.
      </p>
      <div className="home-grid home-grid-ops">
        {OPERATIONAL_FEATURES.map((item) => {
          const Icon = item.icon;
          if (!item.action) return <Card key={item.href + item.label} item={item} />;
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={onAction(item)}
              className="home-card"
              aria-label={`${item.label}${item.description ? ` — ${item.description}` : ''}`}
            >
              <span className="home-card-icon" aria-hidden="true"><Icon className="w-5 h-5" /></span>
              <span className="home-card-title">{item.label}</span>
              {item.description && <span className="home-card-desc">{item.description}</span>}
              {item.action === 'cycle-lang' && (
                <span className="home-card-state" aria-live="polite">Active: {lang.toUpperCase()}</span>
              )}
              {item.action === 'large-text' && (
                <span className="home-card-state" aria-live="polite">{a11y.largeText ? 'Large text: ON' : 'Large text: OFF'}</span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
