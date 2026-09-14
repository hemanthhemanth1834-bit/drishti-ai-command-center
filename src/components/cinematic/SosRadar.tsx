"use client";
import { useEffect, useRef } from "react";

type Props = {
  /** true = emergency pulses run; false = idle dim radar */
  active: boolean;
  lat?: number | null;
  lon?: number | null;
  height?: number;
  label?: string;
};

/**
 * SOS cinematic radar — Canvas 2D expanding warning rings, location-lock
 * brackets, sweep + contact blip. Controlled pulse (no strobe): slow,
 * professional red emergency tone. Parks offscreen, reduced-motion aware.
 */
export default function SosRadar({ active, lat, lon, height = 280, label = "SOS emergency radar" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let t = 0;
    let onScreen = true;
    const pulses: { r: number; a: number }[] = [{ r: 0.1, a: 1 }];
    const io = new IntersectionObserver((e) => {
      onScreen = e[0]?.isIntersecting ?? true;
      if (onScreen && !reduced && !raf) draw();
    });
    io.observe(cvs);

    const draw = () => {
      const W = (cvs.width = cvs.clientWidth * 2 || 640);
      const H = (cvs.height = height * 2);
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) / 2 - 18;
      const on = activeRef.current;
      ctx.clearRect(0, 0, W, H);

      // base: deep red-tinted phosphor when active, calm navy when idle
      const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
      if (on) {
        base.addColorStop(0, "rgba(60,8,16,0.95)");
        base.addColorStop(1, "rgba(12,3,6,0.95)");
      } else {
        base.addColorStop(0, "rgba(8,22,34,0.9)");
        base.addColorStop(1, "rgba(2,11,20,0.9)");
      }
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, H);

      const ringTone = on ? "255,84,112" : "0,210,255";
      ctx.strokeStyle = `rgba(${ringTone},0.25)`;
      ctx.lineWidth = 2;
      [0.33, 0.66, 1].forEach((f) => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.strokeStyle = `rgba(${ringTone},0.14)`;
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.stroke();

      // expanding warning rings (slow, professional — not strobe)
      if (on) {
        pulses.forEach((p) => {
          ctx.beginPath();
          ctx.arc(cx, cy, p.r * R, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,84,112,${(0.5 * p.a).toFixed(3)})`;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, p.r * R * 0.82, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,176,32,${(0.28 * p.a).toFixed(3)})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      // sweep line
      const sweep = t * (on ? 0.9 : 0.35);
      ctx.strokeStyle = on ? "rgba(255,84,112,0.9)" : "rgba(0,210,255,0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
      ctx.stroke();

      // center: location-lock brackets
      const lock = on ? 1 + Math.sin(t * 2.4) * 0.06 : 1;
      const L = 34 * lock;
      ctx.strokeStyle = on ? "#ff8ba0" : "#7de9ff";
      ctx.lineWidth = 4;
      const corners: [number, number, number, number][] = [
        [-1, -1, 1, 0],
        [1, -1, 0, 0],
        [-1, 1, 1, 1],
        [1, 1, 0, 1],
      ];
      void corners;
      // draw 4 corner brackets around center
      const bx = L;
      const by = L;
      const arms: [number, number, number, number][] = [
        [cx - bx, cy - by, cx - bx + 26, cy - by],
        [cx - bx, cy - by, cx - bx, cy - by + 26],
        [cx + bx, cy - by, cx + bx - 26, cy - by],
        [cx + bx, cy - by, cx + bx, cy - by + 26],
        [cx - bx, cy + by, cx - bx + 26, cy + by],
        [cx - bx, cy + by, cx - bx, cy + by - 26],
        [cx + bx, cy + by, cx + bx - 26, cy + by],
        [cx + bx, cy + by, cx + bx, cy + by - 26],
      ];
      arms.forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // center blip
      ctx.fillStyle = on ? "#ff5470" : "#00d2ff";
      ctx.beginPath();
      ctx.arc(cx, cy, on ? 10 + Math.sin(t * 2.4) * 2 : 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // satellite blips
      const blips = [
        { a: 0.7, d: 0.55, c: on ? "#ffb020" : "#34d399" },
        { a: 2.6, d: 0.72, c: "#7de9ff" },
        { a: 4.4, d: 0.42, c: on ? "#ff8ba0" : "#9beaff" },
      ];
      blips.forEach((b, i) => {
        const drift = reduced ? 0 : Math.sin(t * 0.5 + i * 2) * 0.02;
        const x = cx + Math.cos(b.a + drift) * b.d * R;
        const y = cy + Math.sin(b.a + drift) * b.d * R;
        ctx.fillStyle = b.c;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // scanline texture
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 2);

      if (!reduced) {
        t += 0.022;
        if (on) {
          pulses.forEach((p) => {
            p.r += 0.006;
            p.a -= 0.006;
          });
          if (pulses[pulses.length - 1].r > 0.4) pulses.push({ r: 0.05, a: 1 });
          for (let i = pulses.length - 1; i >= 0; i--) if (pulses[i].a <= 0 || pulses[i].r > 1.05) pulses.splice(i, 1);
          if (pulses.length === 0) pulses.push({ r: 0.05, a: 1 });
        }
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
  }, [height]);

  return (
    <div className={`dx-sos-radar ${active ? "dx-sos-active" : "dx-sos-idle"}`}>
      <canvas ref={ref} style={{ width: "100%", height }} role="img" aria-label={label} />
      <div className="dx-radar-foot">
        <span>{active ? "◉ SOS BROADCASTING // LOCATION LOCK" : "○ SOS STANDBY // TAP ACTIVATE"}</span>
        <span className="dx-status-sub">
          {lat != null && lon != null ? `${lat.toFixed(3)}°N ${lon.toFixed(3)}°E` : "GPS FIX PENDING"} · ON-DEVICE
        </span>
      </div>
    </div>
  );
}
