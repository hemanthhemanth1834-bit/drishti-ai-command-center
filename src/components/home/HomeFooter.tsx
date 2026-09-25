'use client';
import Link from 'next/link';
import { FOOTER_LINKS } from '@/config/navigation';

export default function HomeFooter() {
  return (
    <footer className="home-footer" aria-label="Site footer">
      <div className="home-footer-brand">
        <strong>DRISHTI-X</strong>
        <span>AI Disaster Intelligence Command Center</span>
        <p className="home-footer-note">
          Working prototype for preparedness and coordination. Always follow official
          government warnings in a real emergency.
        </p>
      </div>
      <nav className="home-footer-nav" aria-label="Footer pages">
        {FOOTER_LINKS.map((item) =>
          item.href.startsWith('http') ? (
            <a key={item.label} href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
          ) : (
            <Link key={item.label} href={item.href}>{item.label}</Link>
          ),
        )}
      </nav>
      <p className="home-footer-base">DRISHTI-X · Sovereign disaster intelligence · Open data, honest provenance</p>
      <p className="home-footer-strip" aria-label="Site commitments">
        <span>Made for People • Protecting the Planet • Building a Safer Tomorrow</span>
        <span className="home-footer-sos">Emergency? Stay Calm. Stay Informed. Stay Safe.</span>
      </p>
    </footer>
  );
}
