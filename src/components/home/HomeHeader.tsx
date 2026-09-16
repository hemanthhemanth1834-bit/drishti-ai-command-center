'use client';
/** Sticky glassmorphism home header: brand, nav, language, admin, emergency. */
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Siren, ShieldAlert, Languages } from 'lucide-react';
import { HEADER_NAV } from '@/config/navigation';
import { useApp, setApp, type Lang } from '@/store/appStore';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
];

export default function HomeHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, mode } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <header className="home-header" role="banner">
      <div className="home-header-inner">
        <Link href="/" className="home-brand" aria-label="DRISHTI-X home">
          <span className="home-brand-mark" aria-hidden="true">DX</span>
          <span className="home-brand-text">
            <strong>DRISHTI-X</strong>
            <small>AI DISASTER INTELLIGENCE</small>
          </span>
        </Link>

        <nav className="home-nav" aria-label="Primary">
          {HEADER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={pathname === item.href ? 'active' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="home-header-actions">
          <label className="home-lang" aria-label="Language">
            <Languages className="w-3.5 h-3.5" aria-hidden="true" />
            <select
              value={lang}
              onChange={(e) => setApp({ lang: e.target.value as Lang })}
              aria-label="Select language"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="home-admin"
            onClick={() => router.push(mode === 'command' ? '/admin' : '/command')}
            aria-label="Open command administration"
          >
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="home-admin-label">{mode === 'command' ? 'ADMIN' : 'COMMAND'}</span>
          </button>
          <Link href="/emergency" className="home-emergency" aria-label="Emergency SOS">
            <Siren className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="home-emergency-label">EMERGENCY</span>
          </Link>
          <button
            type="button"
            className="home-burger"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="home-mobile-nav" aria-label="Mobile">
          {HEADER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={pathname === item.href ? 'active' : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/emergency" onClick={() => setOpen(false)} className="sos">
            <Siren className="w-4 h-4" aria-hidden="true" /> EMERGENCY / SOS
          </Link>
        </nav>
      )}
    </header>
  );
}
