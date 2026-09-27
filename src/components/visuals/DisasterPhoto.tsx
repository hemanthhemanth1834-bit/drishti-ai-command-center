'use client';
/**
 * DisasterPhoto — registry-backed real photograph in the standard figure card.
 * Same `nesafe-fig` markup as VizFigure (dimensions/styling preserved).
 * Source chain: official remote URL → verified local fallback → safe text
 * state. Plain <img> (production /_next/image returns 404 — see SOURCES.md).
 * Every photo is ARCHIVAL/HISTORICAL/REFERENCE context, never LIVE data.
 */
import { useState } from 'react';
import { StatusBadge } from '@/platform/provenance';
import type { DisasterPhotoAsset } from '@/data/disasterImages';

export default function DisasterPhoto({ photo, caption, status, ratio, bare }: {
  photo: DisasterPhotoAsset;
  caption?: string;
  status?: string;
  ratio?: string;
  /** Omit the inner source anchor when nested inside a link card. */
  bare?: boolean;
}) {
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  const base = stage <= 1 ? photo.remoteUrl ?? photo.fallbackUrl : photo.fallbackUrl;
  const src = stage === 1 && photo.remoteUrl ? `${photo.remoteUrl}&retry=1` : base;
  const failed = stage >= 3;
  return (
    <figure className="nesafe-fig" style={{ margin: 0 }}>
      {!failed ? (
        <div className="nesafe-fig-img" style={{ aspectRatio: ratio ?? '16 / 9' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src} alt={photo.alt}
            loading="lazy" decoding="async"
            onError={() => setStage((s) => {
              if (s === 0 && !photo.remoteUrl) return 2; // local-only: no remote to retry
              return s >= 2 ? 3 : ((s + 1) as 0 | 1 | 2 | 3);
            })}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      ) : (
        <div className="nesafe-fig-img" style={{ aspectRatio: ratio ?? '16 / 9', display: 'grid', placeItems: 'center', padding: 12, textAlign: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{photo.description}</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>IMAGE UNAVAILABLE — source below · STATUS: NOT AVAILABLE</div>
          </div>
        </div>
      )}
      <figcaption className="nesafe-fig-cap">
        {caption && <span>{caption}</span>}
        <span style={{ color: '#64748b', fontSize: 10 }}>
          {[photo.location, photo.date, photo.license].filter(Boolean).join(' · ')}
          {!bare && (
            <a href={photo.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#7de9ff' }}> Source ↗</a>
          )}
        </span>
        <StatusBadge status={status ?? photo.status} small />
      </figcaption>
    </figure>
  );
}
