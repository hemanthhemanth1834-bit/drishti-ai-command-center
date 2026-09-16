'use client';
/** Project visual primitive: contextual figure with provenance, lazy-load, alt text.
 * Images are CONTEXT, never evidence — status badge is mandatory.
 */
import { StatusBadge } from './provenance';

export default function VizFigure({ src, alt, caption, status, eager, ratio }: {
  src: string; alt: string; caption?: string; status: string;
  eager?: boolean; ratio?: string;
}) {
  return (
    <figure className="nesafe-fig" style={{ margin: 0 }}>
      <div className="nesafe-fig-img" style={{ aspectRatio: ratio ?? '16 / 9' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src} alt={alt}
          loading={eager ? 'eager' : 'lazy'} decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      {(caption || status) && (
        <figcaption className="nesafe-fig-cap">
          {caption && <span>{caption}</span>}
          <StatusBadge status={status} small />
        </figcaption>
      )}
    </figure>
  );
}
