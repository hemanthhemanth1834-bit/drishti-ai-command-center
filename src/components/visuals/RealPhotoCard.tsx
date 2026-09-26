'use client';
/**
 * RealPhotoCard — a registry-backed real photograph with honest framing.
 *
 * - Image + title + category come from `src/data/images/imageRegistry.ts`.
 * - `contextNote` states what the photo is (and is NOT) for this page.
 * - `badge` is a truthful text status (HISTORICAL / ARCHIVAL / REFERENCE).
 * - next/image with lazy loading + graceful IMAGE UNAVAILABLE fallback.
 * - Never presented as live data, a measurement, or a location report.
 */
import { useState } from 'react';
import Image from 'next/image';
import { StatusBadge } from '@/platform/provenance';
import { getAsset } from '@/data/images/imageRegistry';

export default function RealPhotoCard({ assetId, badge = 'ARCHIVAL', contextNote, ratio = '16 / 9' }: {
  assetId: string;
  badge?: string;
  contextNote: string;
  ratio?: string;
}) {
  const [failed, setFailed] = useState(false);
  const asset = getAsset(assetId);
  if (!asset) return null;
  return (
    <figure className="dx-hud overflow-hidden" style={{ margin: 0 }}>
      <div className="dx-hud-edge" />
      <div style={{ aspectRatio: ratio, overflow: 'hidden', background: '#020b14', position: 'relative' }}>
        {failed ? (
          <div role="img" aria-label={`Image unavailable: ${asset.title}`} className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-500 text-xs">
            <span className="font-bold tracking-widest">IMAGE UNAVAILABLE</span>
            <span className="text-[10px]">SOURCE: {asset.source}</span>
          </div>
        ) : (
          <Image
            src={asset.localPath}
            alt={asset.description}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 640px"
            loading="lazy"
            style={{ objectFit: 'cover' }}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <figcaption className="p-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <b className="text-white text-sm">{asset.title}</b>
          <StatusBadge status={badge} small />
        </div>
        <p className="text-[11px] text-slate-300 mt-1">{contextNote}</p>
        <p className="text-[10px] text-slate-500 mt-1">
          SOURCE: {asset.source} · {asset.license}
          {asset.date ? ` · ${asset.date}` : ''}
          {' · '}<a className="underline" href={asset.sourceUrl} target="_blank" rel="noreferrer">record</a>
        </p>
      </figcaption>
    </figure>
  );
}
