'use client';
/** Registry-driven disaster visual: local SVG or source-card, always with provenance. Never fakes imagery. */
import { useState } from 'react';
import { IMAGE_STATUS_LABEL, type DisasterImage } from '@/config/imageSources';
import { StatusBadge } from '@/platform/provenance';

export default function DisasterImage({ entry, showLocal = true }: { entry: DisasterImage; showLocal?: boolean }) {
  const [failed, setFailed] = useState(false);
  const photo = entry.image && !failed ? entry.image : null;
  const visual = !photo && entry.localVisual && showLocal && !failed ? entry.localVisual : null;
  const alt = photo
    ? `${entry.title} — historical NASA photo, not a current event`
    : `${entry.title} — project illustration, not evidence`;
  return (
    <div className="nesafe-fig" style={{ margin: 0 }}>
      {photo || visual ? (
        <div className="nesafe-fig-img" style={{ aspectRatio: '16 / 9' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={(photo ?? visual) as string} alt={alt} loading="lazy" decoding="async"
            onError={() => setFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ) : (
        <div className="nesafe-fig-img" style={{ aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', padding: 12, textAlign: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{entry.title}</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
              {failed ? 'IMAGE UNAVAILABLE — source below · STATUS: NOT AVAILABLE' : `SOURCE: ${entry.source}`}
            </div>
          </div>
        </div>
      )}
      <div className="nesafe-fig-cap" style={{ display: 'grid', gap: 2 }}>
        <span>{entry.title}</span>
        <span style={{ color: '#64748b', fontSize: 10 }}>
          {entry.location ? `${entry.location} · ` : ''}{entry.date ? `${entry.date} · ` : ''}{entry.license ? `${entry.license} · ` : ''}
          <a href={entry.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#7de9ff' }}>Source ↗</a>
        </span>
        <span><StatusBadge status={IMAGE_STATUS_LABEL[entry.status]} small /></span>
      </div>
    </div>
  );
}
