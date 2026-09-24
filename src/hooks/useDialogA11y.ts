'use client';
/**
 * Dialog/drawer accessibility helper (Open Design UI polish v1.0.1, items 7–9).
 *
 * When `open` becomes true: moves focus into the panel (by id).
 * Escape: calls `onClose`. No dependencies, no behavior change otherwise.
 * `onClose` is read via ref so inline callbacks never re-trigger focus.
 */
import { useEffect, useRef } from 'react';

export function useDialogA11y(open: boolean, panelId: string, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    // Focus the panel on open (deferred one frame so it exists in the DOM).
    const t = window.requestAnimationFrame(() => {
      document.getElementById(panelId)?.focus({ preventScroll: true });
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      }
    };
    // Capture phase so nested stopPropagation cannot swallow Escape.
    document.addEventListener('keydown', onKey, true);
    return () => {
      window.cancelAnimationFrame(t);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, panelId]);
}
