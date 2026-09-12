'use client';
import { useEffect, useState } from 'react';
import { useApp, setA11y } from '@/store/appStore';
import { Accessibility, Volume2 } from 'lucide-react';

/** Floating accessibility toolbar: text size, contrast, motion, read-aloud. */
export default function A11yBar() {
  const { a11y } = useApp();
  const [open, setOpen] = useState(false);

  // Apply prefs to <html> + respect OS reduced-motion by default.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-large', a11y.largeText);
    root.classList.toggle('a11y-contrast', a11y.highContrast);
    root.classList.toggle('a11y-still', a11y.reduceMotion);
  }, [a11y]);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setA11y({ reduceMotion: true });
    }
  }, []);

  function readAloud() {
    try {
      const el = document.querySelector('main');
      const text = (el?.innerText ?? '').slice(0, 1200);
      if (!text) return;
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    } catch {
      /* speech unsupported */
    }
  }

  return (
    <div className="fixed bottom-20 md:bottom-24 left-4 z-40 font-mono">
      {open && (
        <div className="mb-2 w-48 rounded-xl bg-[#051424] border border-[#1b314b] p-2 text-[11px] text-slate-200 space-y-1.5">
          {(
            [
              ['largeText', 'Large text'],
              ['highContrast', 'High contrast'],
              ['reduceMotion', 'Reduce motion'],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center justify-between gap-2 cursor-pointer">
              {label}
              <input
                type="checkbox"
                checked={a11y[k]}
                onChange={(e) => setA11y({ [k]: e.target.checked })}
                className="accent-cyan-400 w-4 h-4"
              />
            </label>
          ))}
          <button
            onClick={readAloud}
            className="w-full py-1.5 rounded bg-[#00d2ff]/15 border border-[#00d2ff]/40 text-[#00d2ff] font-bold flex items-center justify-center gap-1"
          >
            <Volume2 className="w-3.5 h-3.5" /> READ PAGE ALOUD
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Accessibility options"
        className="w-11 h-11 rounded-full bg-[#051424] border border-[#1b314b] text-slate-300 flex items-center justify-center hover:border-[#00d2ff]/60"
      >
        <Accessibility className="w-5 h-5" />
      </button>
    </div>
  );
}
