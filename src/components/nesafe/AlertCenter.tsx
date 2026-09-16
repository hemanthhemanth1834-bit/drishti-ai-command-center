'use client';
/** Futuristic alert center — slide-in cards, sound only when user enables. */
import { useEffect, useRef } from 'react';
import { setNESafe, useNESafe } from '@/nesafe/store/nesafeStore';
import { notificationProvider } from '@/nesafe/providers/demoProviders';

export default function AlertCenter() {
  const { incidents, soundOn, selectedSlopeId } = useNESafe();
  const audio = useRef<{ beep: () => void } | null>(null);
  useEffect(() => {
    audio.current = {
      beep: () => {
        if (!soundOn) return;
        try {
          const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new Ctx();
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880; g.gain.value = 0.06;
          o.start(); o.stop(ctx.currentTime + 0.25);
          setTimeout(() => ctx.close(), 400);
        } catch { /* noop */ }
      },
    };
  }, [soundOn]);
  useEffect(() => { audio.current?.beep(); /* only on new incident */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents.length]);
  return (
    <div className="nesafe-glass">
      <div className="nesafe-row" style={{ justifyContent: 'space-between' }}>
        <b>🚨 ALERT CENTER</b>
        <label className="nesafe-sound"><input type="checkbox" checked={soundOn} onChange={(e) => setNESafe({ soundOn: e.target.checked })} /> sound</label>
      </div>
      <div className="nesafe-alerts">
        {incidents.map((a) => (
          <div key={a.id} className={`nesafe-alert nesafe-alert-${a.level}`}>
            <b>{a.title}</b>
            <span>{a.detail}</span>
            <small>{a.ts} · {a.id} · DEMO</small>
            <div className="nesafe-row">
              <button onClick={() => setNESafe({ tab: 'terrain' })}>VIEW LOCATION</button>
              <button onClick={() => { setNESafe({ tab: 'response' }); notificationProvider.send(a.title, a.detail); }}>RESPOND</button>
            </div>
          </div>
        ))}
      </div>
      <p className="nesafe-note">Watching {selectedSlopeId} · sound plays ONLY when you enable it.</p>
    </div>
  );
}
