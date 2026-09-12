'use client';
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/** Offline banner + last-sync stamp. Never claims live data while offline. */
export default function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [synced, setSynced] = useState('');

  useEffect(() => {
    setOnline(navigator.onLine);
    try {
      setSynced(localStorage.getItem('drishti-last-sync') ?? '');
    } catch {
      /* ignore */
    }
    const on = () => {
      setOnline(true);
      try {
        localStorage.setItem('drishti-last-sync', new Date().toLocaleString());
      } catch {
        /* ignore */
      }
    };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;
  return (
    <div
      role="alert"
      className="bg-amber-500 text-black text-xs font-mono px-4 py-1.5 flex items-center gap-2 justify-center"
    >
      <WifiOff className="w-3.5 h-3.5" />
      OFFLINE MODE — showing saved content, not live data.
      {synced ? ` LAST SYNCED: ${synced}` : ''}
    </div>
  );
}
