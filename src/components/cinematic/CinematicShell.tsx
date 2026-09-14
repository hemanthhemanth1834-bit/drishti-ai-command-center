"use client";
import type { ReactNode } from "react";
import CommandBackground from "./CommandBackground";
import type { IntelTone, FocusKind } from "@/store/intelStore";

/**
 * Cinematic page shell: fixed 3D backdrop + scanline reveal transition.
 * Content stays fully interactive above the backdrop.
 * V3: optional shared-intelligence tone/focus flow straight into the globe
 * so every route renders the SAME system state (defaults = neutral).
 */
export default function CinematicShell({
  children,
  intensity = 0.85,
  label,
  tone = "ok",
  focusKind = null,
}: {
  children: ReactNode;
  intensity?: number;
  label?: string;
  tone?: IntelTone;
  focusKind?: FocusKind;
}) {
  return (
    <div className="dx-shell">
      <CommandBackground intensity={intensity} tone={tone} focusKind={focusKind} />
      <div className="dx-shell-content dx-reveal" {...(label ? { "aria-label": label } : {})}>
        {children}
      </div>
    </div>
  );
}
