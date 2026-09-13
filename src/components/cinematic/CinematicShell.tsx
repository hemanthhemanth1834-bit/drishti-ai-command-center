"use client";
import type { ReactNode } from "react";
import CommandBackground from "./CommandBackground";

/**
 * Cinematic page shell: fixed 3D backdrop + scanline reveal transition.
 * Content stays fully interactive above the backdrop.
 */
export default function CinematicShell({
  children,
  intensity = 0.85,
  label,
}: {
  children: ReactNode;
  intensity?: number;
  label?: string;
}) {
  return (
    <div className="dx-shell">
      <CommandBackground intensity={intensity} />
      <div className="dx-shell-content dx-reveal" {...(label ? { "aria-label": label } : {})}>
        {children}
      </div>
    </div>
  );
}
