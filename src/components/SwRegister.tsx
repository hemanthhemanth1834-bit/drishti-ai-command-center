'use client';
import { useEffect } from 'react';

/** Register the offline service worker (safe no-op where unsupported). */
export default function SwRegister() {
  useEffect(() => {
    try {
      if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
    } catch {
      /* unsupported */
    }
  }, []);
  return null;
}
