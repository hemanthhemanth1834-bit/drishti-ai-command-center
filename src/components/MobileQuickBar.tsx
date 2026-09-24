'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Siren, HeartPulse, Bell, LifeBuoy, Crosshair } from 'lucide-react';

/** Mobile-first emergency shortcuts (mobile only — desktop keeps the full deck). */
const ITEMS = [
  { href: '/emergency', label: 'SOS', icon: Siren },
  { href: '/safety', label: 'Risk', icon: HeartPulse },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/nearby', label: 'Help', icon: LifeBuoy },
  { href: '/risk', label: 'Check', icon: Crosshair },
];

export default function MobileQuickBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Emergency shortcuts"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#030d17]/95 backdrop-blur border-t border-[#1b314b] grid grid-cols-5 font-mono"
    >
      {ITEMS.map((it) => {
        const Icon = it.icon;
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[44px] text-[10px] ${
              active ? 'text-[#00d2ff]' : 'text-slate-400'
            } ${it.href === '/emergency' ? 'text-rose-400 font-bold' : ''}`}
          >
            <Icon className="w-5 h-5" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
