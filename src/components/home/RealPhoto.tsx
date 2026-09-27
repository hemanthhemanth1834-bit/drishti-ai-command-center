'use client';
/**
 * RealPhoto — real-world example imagery with honest labeling.
 *
 * - plain <img> (lazy below the fold, async decoding, object-fit cover).
 *   Deliberately NOT next/image: the production image-optimization endpoint
 *   (/_next/image) returns 404 on this deployment, which rendered every
 *   optimized photo as IMAGE UNAVAILABLE. Local files need no optimizer.
 * - onError fallback panel: IMAGE UNAVAILABLE + SOURCE (never broken icons)
 * - visible attribution caption + ILLUSTRATIVE badge (never presented as live)
 */
import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  caption: string;
  source: string;
  sourceHref?: string;
  eager?: boolean;
  ratio?: string;
}

export default function RealPhoto({
  src, alt, caption, source, sourceHref, eager = false, ratio = '16 / 9',
}: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="home-photo-frame">
      <div className="home-photo-view" style={{ aspectRatio: ratio }}>
        {failed ? (
          <div className="home-photo-fallback" role="img" aria-label={`Image unavailable: ${alt}`}>
            <span className="home-photo-fallback-title">IMAGE UNAVAILABLE</span>
            <span className="home-photo-fallback-src">SOURCE: {source}</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 700px"
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="home-photo-img"
            onError={() => setFailed(true)}
          />
        )}
        <span className="home-photo-badge" aria-hidden="true">ILLUSTRATIVE IMAGE</span>
      </div>
      <figcaption className="home-photo-cap">
        {caption}{' '}
        <span className="home-photo-src">
          Imagery: {sourceHref ? (
            <a href={sourceHref} target="_blank" rel="noreferrer">{source}</a>
          ) : source}
        </span>
      </figcaption>
    </figure>
  );
}
