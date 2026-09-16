'use client';
/** Futuristic demo computer-vision screen — upload → scanning grid → detections. DEMO CV labeled. */
import { useRef, useState } from 'react';
import ModeBadge from './ModeBadge';

const DETS = [
  { label: 'CRACK DETECTED', conf: 91 },
  { label: 'DEBRIS DETECTED', conf: 87 },
  { label: 'POTENTIAL SLOPE INSTABILITY', conf: 78 },
];

export default function VisionPanel() {
  const [img, setImg] = useState<string | null>(null);
  const [phase, setPhase] = useState(0); // 0 idle 1 scanning 2 done
  const file = useRef<HTMLInputElement>(null);
  const start = (url: string) => {
    setImg(url); setPhase(1);
    setTimeout(() => setPhase(2), 2600);
  };
  return (
    <div className="nesafe-glass">
      <div className="nesafe-row" style={{ justifyContent: 'space-between' }}>
        <b>📷 AI COMPUTER VISION · DEMO MODEL</b><ModeBadge />
      </div>
      <div className="nesafe-vision" onClick={() => file.current?.click()} role="button" tabIndex={0} aria-label="Upload slope photo for demo analysis">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img ? <img src={img} alt="Uploaded slope (demo analysis)" /> : <span>Click to upload a slope photo (stays on device)</span>}
        {phase === 1 && <div className="nesafe-scan-grid"><i /></div>}
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const url = URL.createObjectURL(f);
          start(url);
        }} />
      </div>
      <div className="nesafe-steps">
        <span>IMAGE UPLOADED ↓</span><span>AI SCANNING ↓</span><span>SEGMENTATION ↓</span>
        <span>OBJECT DETECTION ↓</span><span>RISK ANALYSIS</span>
      </div>
      {phase === 2 && (
        <ul className="nesafe-dets">
          {DETS.map((d) => (<li key={d.label}><b>{d.label}</b><span>Confidence {d.conf}% (demo)</span></li>))}
        </ul>
      )}
      {phase === 1 && <p className="nesafe-note">AI SCANNING… segmentation running (demo animation).</p>}
    </div>
  );
}
