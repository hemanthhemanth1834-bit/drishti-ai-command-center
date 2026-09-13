"use client";
import { useEffect, useRef, useState } from "react";
import { VolumeX, Volume2 } from "lucide-react";

let ctx: AudioContext | null = null;
function beep(freq = 880, dur = 0.07, gain = 0.04) {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    o.type = "sine";
    g.gain.value = gain;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {
    /* audio unavailable */
  }
}

export function playClick() {
  if (localStorage.getItem("drishti-sound") === "1") beep(920, 0.05, 0.03);
}
export function playPing() {
  if (localStorage.getItem("drishti-sound") === "1") beep(1320, 0.12, 0.04);
}
export function playConfirm() {
  if (localStorage.getItem("drishti-sound") !== "1") return;
  beep(660, 0.08, 0.04);
  window.setTimeout(() => beep(990, 0.1, 0.04), 90);
}

/** Muted-by-default sound toggle (Web Audio only, no assets). */
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      setOn(localStorage.getItem("drishti-sound") === "1");
    } catch {
      /* ignore */
    }
  }, []);
  function toggle() {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem("drishti-sound", next ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (next) beep(880, 0.08, 0.05);
  }
  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute interface sounds" : "Enable interface sounds"}
      title="Interface sounds (off by default)"
      className="dx-sound"
    >
      {on ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{on ? "SOUND ON" : "SOUND OFF"}</span>
    </button>
  );
}
