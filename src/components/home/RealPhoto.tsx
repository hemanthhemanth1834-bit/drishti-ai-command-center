'use client';
/**
 * RealPhoto — real-world example imagery with honest labeling.
 *
 * - next/image (lazy below the fold, responsive sizes, local files)
 * - onError fallback panel: IMAGE UNAVAILABLE + SOURCE (never broken icons)
 * - visible attribution caption + ILLUSTRATIVE badge (never presented as live)
 */
import { useState } from 'react';
import Image from 'next/image';

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
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 700px"
            loading={eager ? 'eager' : 'lazy'}
            priority={eager}
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
