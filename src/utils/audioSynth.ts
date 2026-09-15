// src/utils/audioSynth.ts — Zero-dependency Web Audio API procedural sound engine
// Synthesizes sci-fi telemetry sound effects without any audio files.
// Respects soundEnabled preference and reduced motion/a11y defaults (off by default).

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function isAudioEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("drishti-sound") === "1";
  } catch {
    return false;
  }
}

export const soundSynth = {
  /** Soft tactical click on button interaction */
  click(gain = 0.025) {
    if (!isAudioEnabled()) return;
    const ctx = getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1040, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.04);

      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      /* Audio error */
    }
  },

  /** Tactical sonar/radar pulse */
  radarPing(freq = 1320, gain = 0.035) {
    if (!isAudioEnabled()) return;
    const ctx = getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, ctx.currentTime + 0.18);

      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      /* Audio error */
    }
  },

  /** High-priority alert warning chord */
  warningAlarm() {
    if (!isAudioEnabled()) return;
    const ctx = getContext();
    if (!ctx) return;
    try {
      [620, 840].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

        g.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.14);

        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.14);
      });
    } catch {
      /* Audio error */
    }
  },

  /** Scenario shift harmonic flourish */
  scenarioChange() {
    if (!isAudioEnabled()) return;
    const ctx = getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

        g.gain.setValueAtTime(0.03, ctx.currentTime + idx * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.18);

        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.18);
      });
    } catch {
      /* Audio error */
    }
  },

  /** Rapid telemetry data receipt packet */
  telemetryChirp() {
    if (!isAudioEnabled()) return;
    const ctx = getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.03);

      g.gain.setValueAtTime(0.02, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {
      /* Audio error */
    }
  }
};
