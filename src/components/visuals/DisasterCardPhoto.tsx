'use client';
/**
 * DisasterCardPhoto — compact registry-backed photo for homepage cards.
 * Fills the existing 38px icon box (object-fit cover, same radius/border).
 * Source chain: official remote URL → verified local fallback → styled empty
 * box (never a broken icon). Plain <img>, lazy, async decode.
 * Photos are ARCHIVAL/HISTORICAL reference, never labeled LIVE.
 */
import { useState } from 'react';
import type { DisasterPhotoAsset } from '@/data/disasterImages';

export default function DisasterCardPhoto({ photo, alt }: { photo: DisasterPhotoAsset; alt: string }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const src = stage === 0 ? photo.remoteUrl ?? photo.fallbackUrl : photo.fallbackUrl;
  return (
    <span className="home-card-icon" style={{ overflow: 'hidden', padding: 0 }} aria-hidden={stage >= 2}>
      {stage < 2 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src} alt={alt}
          loading="lazy" decoding="async"
          onError={() => setStage((s) => (s >= 1 ? 2 : 1) as 0 | 1 | 2)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </span>
  );
}
