'use client';
/**
 * Shared 3D scene primitives (Phase 2): consistent lifecycle chrome for every
 * WebGL viewport — corner ticks, optional data-stream overlay, reduced-motion
 * fallback. Presentational only; never touches scene logic.
 */
import { useEffect, useState, type ReactNode } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      setReduced(!!mq?.matches);
      const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq?.addEventListener?.('change', fn);
      return () => mq?.removeEventListener?.('change', fn);
    } catch {
      return undefined;
    }
  }, []);
  return reduced;
}

export function useWebGLAvailable(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') ?? c.getContext('webgl');
      setOk(!!gl);
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
}

export default function SceneShell({
  label, children, streams = false, className = '',
}: {
  label: string;
  children: ReactNode;
  streams?: boolean;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <div className={`dx-scene ${className}`} role="img" aria-label={label}>
      <div className="dx-hud-corner-tl" />
      <div className="dx-hud-corner-tr" />
      <div className="dx-hud-corner-bl" />
      <div className="dx-hud-corner-br" />
      {children}
      {streams && !reduced && <DataStreams />}
    </div>
  );
}

/** CSS-only data-flow overlay: sensor → AI → GIS → alert pulses. */
export function DataStreams() {
  const nodes = ['SENSOR', 'AI', 'GIS', 'ALERT'];
  return (
    <div className="dx-streams" aria-hidden="true">
      {nodes.map((n, i) => (
        <span key={n} className="dx-stream-node" style={{ animationDelay: `${i * 0.55}s` }}>
          {n}
        </span>
      ))}
    </div>
  );
}

/** Pulsing incident marker ring (CSS only). */
export function EmergencyPulse({ tone = 'critical', label }: { tone?: 'critical' | 'warning' | 'info'; label?: string }) {
  return (
    <span className={`dx-epulse dx-epulse-${tone}`} role={label ? 'img' : undefined} aria-label={label}>
      <span className="dx-epulse-ring" />
      <span className="dx-epulse-dot" />
    </span>
  );
}
