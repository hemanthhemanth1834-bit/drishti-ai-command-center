"use client";
import { useEffect, useRef } from "react";

type Blip = {
  angle: number;
  dist: number;
  label: string;
  tone: string;
  coord?: string;
  sig?: number; // 0..100 signal strength
};

/** Professional radar: sweep gradient, contact trails, pulses, signal + coords. Canvas 2D. */
export default function RadarSweep({
  blips,
  height = 260,
  label = "SAR SWEEP // 2 KM",
}: {
  blips?: Blip[];
  height?: number;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const contacts: Blip[] = blips ?? [
    { angle: 0.6, dist: 0.35, label: "DRX-01", tone: "#00d2ff", coord: "17.39°N 78.47°E", sig: 92 },
    { angle: 2.1, dist: 0.62, label: "DRX-07", tone: "#34d399", coord: "17.37°N 78.49°E", sig: 84 },
    { angle: 3.6, dist: 0.48, label: "RB-07", tone: "#fbbf24", coord: "16.51°N 80.65°E", sig: 71 },
    { angle: 5.1, dist: 0.78, label: "TGT-14", tone: "#ff5470", coord: "16.51°N 80.65°E", sig: 63 },
  ];

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let sweep = 0;
    let onScreen = true;
    const pulses: { r: number; a: number }[] = [{ r: 0, a: 1 }];
    // per-contact trail buffers (screen-space, refreshed on resize)
    const trails: { x: number; y: number; a: number }[][] = contacts.map(() => []);
    const io = new IntersectionObserver((e) => {
      onScreen = e[0]?.isIntersecting ?? true;
      if (onScreen && !reduced && !raf) draw();
    });
    io.observe(cvs);

    const angDiff = (a: number, b: number) =>
      Math.abs(((a - b) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);

    const draw = () => {
      const W = (cvs.width = cvs.clientWidth * 2 || 600);
      const H = (cvs.height = height * 2);
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) / 2 - 16;
      ctx.clearRect(0, 0, W, H);

      // dim phosphor base
      const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      base.addColorStop(0, "rgba(4,22,37,0.9)");
      base.addColorStop(1, "rgba(2,11,20,0.9)");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, H);

      // rings (kept dim — radar should not shout)
      ctx.strokeStyle = "rgba(0,210,255,0.20)";
      ctx.lineWidth = 2;
      [0.33, 0.66, 1].forEach((f) => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.stroke();
      });
      // cross
      ctx.strokeStyle = "rgba(0,210,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.stroke();
      // subtle scanline texture
      ctx.fillStyle = "rgba(255,255,255,0.018)";
      for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 2);

      // expanding detection pulses
      pulses.forEach((p) => {
        ctx.beginPath();
        ctx.arc(cx, cy, p.r * R, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,210,255,${0.30 * p.a})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // sweep gradient wedge + leading edge
      const grad = (
        ctx as CanvasRenderingContext2D & {
          createConicGradient?: (a: number, x: number, y: number) => CanvasGradient;
        }
      ).createConicGradient?.(sweep, cx, cy);
      if (grad) {
        grad.addColorStop(0, "rgba(0,210,255,0.38)");
        grad.addColorStop(0.10, "rgba(0,210,255,0.05)");
        grad.addColorStop(0.22, "rgba(0,210,255,0)");
        grad.addColorStop(1, "rgba(0,210,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(0,210,255,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
      ctx.stroke();

      // contacts: trails + blip + label + signal bars + coords
      ctx.font = "20px monospace";
      contacts.forEach((b, ci) => {
        const drift = reduced ? 0 : Math.sin(sweep * 0.7 + ci * 2) * 0.012;
        const x = cx + Math.cos(b.angle + drift) * b.dist * R;
        const y = cy + Math.sin(b.angle + drift) * b.dist * R;
        const lit = angDiff(sweep, b.angle) < 0.5;
        // trail: push fading echo each sweep pass
        const tr = trails[ci];
        if (lit && tr.length === 0) tr.push({ x, y, a: 0.5 });
        for (let i = tr.length - 1; i >= 0; i--) {
          tr[i].a -= 0.012;
          if (tr[i].a <= 0) tr.splice(i, 1);
        }
        tr.forEach((p) => {
          ctx.globalAlpha = Math.max(0, p.a * 0.5);
          ctx.fillStyle = b.tone;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.fillStyle = b.tone;
        ctx.beginPath();
        ctx.arc(x, y, lit ? 9 : 6, 0, Math.PI * 2);
        ctx.fill();
        if (lit) {
          ctx.strokeStyle = b.tone;
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.arc(x, y, 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = "#c8f5ff";
        ctx.fillText(b.label, x + 14, y - 10);
        // signal strength bars
        const sig = b.sig ?? 70;
        for (let sIdx = 0; sIdx < 4; sIdx++) {
          ctx.fillStyle = sig >= (sIdx + 1) * 25 ? b.tone : "rgba(120,140,160,0.3)";
          ctx.fillRect(x + 14 + sIdx * 9, y + 2, 6, 8);
        }
        ctx.fillStyle = "rgba(148,163,184,0.9)";
        ctx.font = "16px monospace";
        ctx.fillText(b.coord ?? "", x + 14, y + 28);
        ctx.font = "20px monospace";
      });

      if (!reduced) {
        sweep += 0.022;
        pulses.forEach((p) => {
          p.r += 0.008;
          p.a -= 0.008;
        });
        if (pulses[pulses.length - 1].r > 0.35) pulses.push({ r: 0, a: 1 });
        for (let i = pulses.length - 1; i >= 0; i--) if (pulses[i].a <= 0) pulses.splice(i, 1);
        raf = requestAnimationFrame(draw);
      } else {
        raf = 0;
      }
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      io.disconnect();
    };
  }, [height]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="dx-radar">
      <canvas ref={ref} style={{ width: "100%", height }} aria-label={label} role="img" />
      <div className="dx-radar-foot">
        <span>{label}</span>
        <span className="dx-status-sub">17.3850°N 78.4867°E · SIMULATION</span>
      </div>
    </div>
  );
}
