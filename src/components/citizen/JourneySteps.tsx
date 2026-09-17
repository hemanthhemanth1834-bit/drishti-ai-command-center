'use client';
/**
 * Phase 4 — citizen journey stepper. Pathname-driven, links to real routes.
 * WELCOME → SAFETY → LOCATION → RISK → ALERTS → EMERGENCY → EVACUATE →
 * NEARBY → REPORT → OFFLINE SYNC. Current step highlighted; completed dimmed.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STEPS: { href: string; label: string }[] = [
  { href: '/welcome', label: 'Welcome' },
  { href: '/safety', label: 'Safety' },
  { href: '/location', label: 'Location' },
  { href: '/risk', label: 'Risk' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/emergency', label: 'Emergency' },
  { href: '/evacuate', label: 'Evacuate' },
  { href: '/nearby', label: 'Nearby' },
  { href: '/report', label: 'Report' },
  { href: '/offline', label: 'Sync' },
];

export default function JourneySteps() {
  const pathname = usePathname();
  const current = STEPS.findIndex((s) => s.href === pathname);
  return (
    <nav className="dx-journey" aria-label="Citizen safety journey">
      {STEPS.map((s, i) => {
        const state = i === current ? 'now' : i < current ? 'done' : 'next';
        return (
          <Link key={s.href} href={s.href} aria-current={i === current ? 'step' : undefined} className={`dx-journey-step dx-journey-${state}`}>
            <span className="dx-journey-dot" aria-hidden="true">{i + 1}</span>
            <span>{s.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
