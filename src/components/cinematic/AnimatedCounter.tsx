"use client";
import { useEffect, useRef, useState } from "react";

type CounterProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
};

/** Animated number counting (respects reduced motion). */
export default function AnimatedCounter({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 900,
  className = "",
}: CounterProps) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const from = prev.current;
    const to = value;
    if (from === to) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={`dx-count ${className}`} suppressHydrationWarning>
      {prefix}
      {display.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export function RadialGauge({
  value,
  max = 100,
  label,
  tone = "#00d2ff",
}: {
  value: number;
  max?: number;
  label: string;
  tone?: string;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const R = 26;
  const C = 2 * Math.PI * R;
  return (
    <div className="dx-gauge" role="img" aria-label={`${label}: ${value} of ${max}`}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={R} fill="none" stroke="#132d4a" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={R}
          fill="none"
          stroke={tone}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          transform="rotate(-90 36 36)"
          className="dx-gauge-arc"
        />
        <text x="36" y="40" textAnchor="middle" className="dx-gauge-text">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div className="dx-micro">{label}</div>
    </div>
  );
}

export function Sparkline({
  data,
  width = 120,
  height = 28,
  stroke = "#00d2ff",
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data
    .map((v, i) => {
      const x = (i / Math.max(1, data.length - 1)) * width;
      const y = height - ((v - min) / Math.max(1e-6, max - min)) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className="dx-spark" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function Waveform({ color = "#00d2ff", height = 34 }: { color?: string; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(cvs.width, height / 2);
      ctx.stroke();
      return;
    }
    let raf = 0;
    let t = 0;
    let onScreen = true;
    const io = new IntersectionObserver((e) => {
      onScreen = e[0]?.isIntersecting ?? true;
      if (onScreen && !raf) draw();
    });
    io.observe(cvs);
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!onScreen) return; // park canvas when scrolled away
      t += 0.06;
      ctx.clearRect(0, 0, cvs.width, height);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < cvs.width; x += 2) {
        const y =
          height / 2 +
          Math.sin(x * 0.09 + t) * 6 * Math.sin(x * 0.013 + t * 0.6);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [color, height]);
  return <canvas ref={ref} width={220} height={height} className="dx-wave" aria-hidden="true" />;
}
