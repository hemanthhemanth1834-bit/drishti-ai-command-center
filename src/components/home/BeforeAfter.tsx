'use client';
/**
 * STEP 6 — Before/after satellite comparison slider.
 * Both frames are the verified NASA Earth Observatory Kerala 2018 pair
 * (Landsat 8 before, Sentinel-2 after), labeled with capture dates.
 * User-driven position (native range input = keyboard accessible).
 * If either frame fails, a labeled fallback panel renders instead.
 */
import { useState } from 'react';

export default function BeforeAfter() {
  const [pos, setPos] = useState(50);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const fail = (k: string) => setFailed((f) => ({ ...f, [k]: true }));
  const broken = failed.before || failed.after;

  return (
    <div className="home-ba" role="group" aria-label="Kerala floods before and after satellite comparison">
      <div className="home-ba-view">
        {broken ? (
          <div className="home-photo-fallback" role="img" aria-label="Satellite comparison unavailable">
            <span className="home-photo-fallback-title">COMPARISON UNAVAILABLE</span>
            <span className="home-photo-fallback-src">SOURCE: NASA Earth Observatory record 92669</span>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/photos/kerala-after.jpg"
              alt="False-color satellite view of Kerala after flood water inundated the area in August 2018"
              className="home-ba-img"
              loading="lazy"
              decoding="async"
              onError={() => fail('after')}
            />
            <div className="home-ba-top" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/photos/kerala-before.jpg"
                alt=""
                aria-hidden="true"
                className="home-ba-img home-ba-img-top"
                loading="lazy"
                decoding="async"
                onError={() => fail('before')}
              />
            </div>
            <div className="home-ba-divider" style={{ left: `${pos}%` }} aria-hidden="true" />
            <span className="home-ba-tag home-ba-tag-before">BEFORE · 6 FEB 2018</span>
            <span className="home-ba-tag home-ba-tag-after">AFTER · 22 AUG 2018</span>
          </>
        )}
      </div>
      {!broken && (
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="home-ba-slider"
          aria-label="Reveal before and after comparison"
        />
      )}
      <p className="home-photo-cap">
        Drag to compare — Landsat 8 (before) vs Sentinel-2 (after). False-color: flood water dark
        blue, vegetation bright green. Historical reference, not a live feed.{' '}
        <span className="home-photo-src">
          Imagery: <a href="https://science.nasa.gov/earth/earth-observatory/before-and-after-the-kerala-floods-92669/" target="_blank" rel="noreferrer">NASA Earth Observatory</a> (public domain)
        </span>
      </p>
    </div>
  );
}
