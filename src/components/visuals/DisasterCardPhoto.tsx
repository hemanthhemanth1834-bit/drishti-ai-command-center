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

export default function DisasterCardPhoto({ photo, alt, layout }: { photo: DisasterPhotoAsset; alt: string; layout?: 'icon' | 'side' }) {
  const side = layout === 'side';
  // 0 remote → 1 remote retry (transient thumbor 429s) → 2 local fallback → 3 empty.
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  const base = stage <= 1 ? photo.remoteUrl ?? photo.fallbackUrl : photo.fallbackUrl;
  const src = stage === 1 && photo.remoteUrl ? `${photo.remoteUrl}&retry=1` : base;
  return (
    <span className={side ? 'home-side-visual' : 'home-card-icon'} style={side ? undefined : { overflow: 'hidden', padding: 0 }} aria-hidden={stage >= 3}>
      {stage < 3 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src} alt={alt}
          loading="lazy" decoding="async"
          onError={() => setStage((s) => {
            if (s === 0 && !photo.remoteUrl) return 2; // local-only: no remote to retry
            return s >= 2 ? 3 : ((s + 1) as 0 | 1 | 2 | 3);
          })}
          style={side
            ? { width: '100%', height: 'auto', display: 'block' }
            : { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </span>
  );
}
