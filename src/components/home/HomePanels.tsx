'use client';
/** Live disaster overview — honest statuses, never fabricated live values. */
import Link from 'next/link';
import { CloudLightning, Waves, Mountain, Sun, Activity, Flame } from 'lucide-react';
import { DISASTER_CATEGORIES } from '@/config/navigation';
import { usePlatform } from '@/platform/usePlatform';
import { StatusBadge } from '@/platform/provenance';

const CATEGORY_ICONS: Record<string, typeof Waves> = {
  Cyclone: CloudLightning, Flood: Waves, Landslide: Mountain,
  Heatwave: Sun, Earthquake: Activity, Wildfire: Flame,
};

function timeAgo(ts?: string): string {
  if (!ts || ts === 'demo') return 'demo';
  const t = Date.parse(ts);
  if (Number.isNaN(t)) return 'demo';
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface AlertItem {
  id?: string; level?: string; severity?: string; title?: string;
  lat?: number; lon?: number; ts?: string; source?: string;
}

function levelTone(level: string): string {
  const l = level.toUpperCase();
  if (l.includes('CRIT') || l.includes('EMERG') || l.includes('SEVERE')) return 'critical';
  if (l.includes('WARN')) return 'warning';
  if (l.includes('WATCH') || l.includes('ADVIS')) return 'watch';
  return 'info';
}

export function DisasterOverview() {
  const alerts = usePlatform<{ alerts?: AlertItem[]; count?: number }>('/api/v1/alerts?limit=50');
  const live = !!alerts.data && (alerts.status === 'LIVE' || alerts.status === 'MODEL');
  const items = alerts.data?.alerts ?? [];
  const updated = new Date().toLocaleString();

  const perCategory = DISASTER_CATEGORIES.map((cat) => {
    const hit = items.filter((a) =>
      `${a.title ?? ''}`.toLowerCase().includes(cat.toLowerCase().slice(0, 5)));
    const top = hit[0];
    return {
      cat,
      status: live ? (top ? (top.level ?? top.severity ?? 'WATCH') : 'NO LIVE DATA') : 'DEMO',
      count: live ? hit.length : 0,
      provenance: live ? (top?.source ?? 'operations feed') : 'No live feed connected',
    };
  });

  return (
    <section className="home-section" aria-labelledby="home-overview">
      <div className="home-section-head">
        <h2 id="home-overview" className="home-section-title">LIVE DISASTER OVERVIEW</h2>
        <StatusBadge status={live ? 'LIVE' : 'DEMO'} />
      </div>
      {alerts.loading && <p className="home-muted" role="status">Loading overview…</p>}
      <div className="home-grid home-grid-overview">
        {perCategory.map((c) => {
          const Icon = CATEGORY_ICONS[c.cat] ?? Waves;
          return (
            <Link key={c.cat} href="/alerts" className="home-mini" aria-label={`${c.cat}: ${c.status}`}>
              <span className="home-mini-icon" aria-hidden="true"><Icon className="w-4 h-4" /></span>
              <span className={`home-sev home-sev-${levelTone(c.status)}`} aria-hidden="true" />
              <span className="home-mini-title">{c.cat}</span>
              <span className="home-mini-status">{c.status}{live && c.count > 0 ? ` · ${c.count}` : ''}</span>
              <span className="home-mini-meta">Updated {updated} · {c.provenance}</span>
            </Link>
          );
        })}
      </div>
      {!live && !alerts.loading && (
        <p className="home-muted">No live disaster feed is connected — showing DEMO structure. Connect the backend alert pipeline for live values.</p>
      )}
    </section>
  );
}

export function RegionalStatus() {
  const states = usePlatform<{ count?: number; states?: { code: string; name: string }[] }>('/api/regions/states?country=IN');
  const ap = usePlatform<{ count?: number }>('/api/regions/districts?state=IN-AP');
  const tg = usePlatform<{ count?: number }>('/api/regions/districts?state=IN-TG');
  const alerts = usePlatform<{ count?: number }>('/api/v1/alerts?limit=1');
  const live = !!states.data;
  const rows = [
    { name: 'Andhra Pradesh', href: '/regions', meta: ap.data ? `${ap.data.count} districts · showcase region` : 'Registry unreachable — demo view' },
    { name: 'Telangana', href: '/regions', meta: tg.data ? `${tg.data.count} districts · showcase region` : 'Registry unreachable — demo view' },
    { name: 'India', href: '/regions', meta: live ? `${states.data?.count ?? '—'} states in registry · Country → GPS` : 'Country → State → District → City → GPS' },
    { name: 'Global', href: '/regions', meta: 'US · UK · AU · JP ready; expansion without code changes' },
  ];
  const alertNote = live && alerts.data ? `${alerts.data.count ?? 0} alerts tracked` : 'Alerts unreachable — demo view';
  // Static geographic coverage — context only, never risk claims.
  const zones = [
    { name: 'North India', desc: 'Himalayan slopes and northern plains; landslide and winter-hazard context.' },
    { name: 'South India', desc: 'Peninsular plateau and long coasts; monsoon and cyclone context.' },
    { name: 'East India', desc: 'Gangetic plains and Bay of Bengal coast; flood and cyclone context.' },
    { name: 'West India', desc: 'Arid west, megacities and Arabian Sea coast; heat and urban-flood context.' },
    { name: 'Central India', desc: 'Plateau, forests and farmland; heat and drought context.' },
    { name: 'Northeast India', desc: 'High hills, great rivers, extreme rainfall; landslide and flood context.' },
  ];

  return (
    <section className="home-section" aria-labelledby="home-regions">
      <div className="home-section-head">
        <h2 id="home-regions" className="home-section-title">REGIONAL STATUS</h2>
        <StatusBadge status={live ? 'LIVE' : 'DEMO'} />
      </div>
      <div className="home-grid home-grid-regions">
        <div className="home-mini home-region-map">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/india-schematic.svg" alt="Schematic India map, Andhra Pradesh and Telangana highlighted, not to scale" loading="lazy" decoding="async" />
          <span className="home-mini-meta">Schematic — not to scale</span>
        </div>
        {rows.map((r) => (
          <Link key={r.name} href={r.href} className="home-mini" aria-label={`Region: ${r.name}`}>
            <span className="home-mini-title">{r.name}</span>
            <span className="home-mini-meta">{r.meta}</span>
          </Link>
        ))}
      </div>
      <p className="home-muted">{alertNote}. District counts come from the live region registry when the backend is reachable; risk states are DEMO unless a live feed is connected.</p>
      <h3 className="home-section-title" style={{ fontSize: 12, marginTop: 14 }}>COVERAGE ZONES — GEOGRAPHIC CONTEXT, NOT RISK SCORES</h3>
      <div className="home-grid home-grid-secondary" style={{ marginTop: 8 }}>
        {zones.map((z) => (
          <Link key={z.name} href="/regions" className="home-mini" aria-label={`Coverage zone: ${z.name}`}>
            <span className="home-mini-title">{z.name}</span>
            <span className="home-mini-meta">{z.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function RealtimeFeed() {
  const feed = usePlatform<{ alerts?: AlertItem[] }>('/api/v1/alerts?limit=8', 30000);
  const live = !!feed.data;
  const demo: AlertItem[] = [
    { id: 'demo-1', level: 'WATCH', title: 'Heavy rainfall watch — Krishna basin (demo)', ts: 'demo', source: 'DEMO feed' },
    { id: 'demo-2', level: 'ADVISORY', title: 'Landslide susceptibility elevated — ghat roads (demo)', ts: 'demo', source: 'DEMO feed' },
    { id: 'demo-3', level: 'INFO', title: 'Cyclone outlook: Bay of Bengal monitoring (demo)', ts: 'demo', source: 'DEMO feed' },
    { id: 'demo-4', level: 'WATCH', title: 'Road waterlogging reports — low-lying wards (demo)', ts: 'demo', source: 'DEMO feed' },
    { id: 'demo-5', level: 'INFO', title: 'New citizen field report received (demo)', ts: 'demo', source: 'DEMO feed' },
  ];
  const items = live && feed.data?.alerts?.length ? feed.data.alerts.slice(0, 8) : demo;

  return (
    <section className="home-section" aria-labelledby="home-feed">
      <div className="home-section-head">
        <h2 id="home-feed" className="home-section-title">REAL-TIME FEEDS</h2>
        <StatusBadge status={live ? 'LIVE' : 'DEMO'} />
      </div>
      {feed.loading && <p className="home-muted" role="status">Loading feed…</p>}
      <ul className="home-feed">
        {items.map((a, i) => (
          <li key={a.id ?? i} className="home-feed-item">
            <span className={`home-sev home-sev-${levelTone(a.level ?? a.severity ?? 'INFO')}`} aria-hidden="true" />
            <div>
              <p className="home-feed-title">{a.title ?? 'Untitled alert'}</p>
              <p className="home-feed-meta">
                {(a.level ?? a.severity ?? 'INFO').toUpperCase()}
                {typeof a.lat === 'number' ? ` · ${a.lat.toFixed(2)}, ${(a.lon ?? 0).toFixed(2)}` : ' · region feed'}
                {` · ${timeAgo(a.ts)} · ${a.source ?? (live ? 'operations feed' : 'DEMO')}`}
              </p>
            </div>
            <Link href="/alerts" className="home-feed-link" aria-label={`Open alert: ${a.title ?? 'untitled'}`}>Open →</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MissionBanner() {
  return (
    <section className="home-mission" aria-label="Mission statement">
      <p className="home-mission-big">TECHNOLOGY FOR HUMANITY,<br />RESILIENCE FOR GENERATIONS.</p>
      <p className="home-mission-by">— DRISHTI-X</p>
    </section>
  );
}
