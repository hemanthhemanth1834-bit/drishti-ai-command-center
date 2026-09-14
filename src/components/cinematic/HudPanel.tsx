"use client";
import type { ReactNode } from "react";

type Props = {
  title?: ReactNode;
  micro?: string;
  right?: ReactNode;
  tone?: "default" | "warn" | "critical" | "ok";
  children: ReactNode;
  className?: string;
  id?: string;
};

/** Glass HUD panel with thin border, glow, corner ticks. Hierarchy-safe. */
export default function HudPanel({ title, micro, right, tone = "default", children, className = "", id }: Props) {
  return (
    <section id={id} className={`dx-hud dx-hud-${tone} ${className}`}>
      <span className="dx-hud-edge" aria-hidden="true" />
      {(title || micro || right) && (
        <header className="dx-hud-head">
          <div>
            {micro ? <div className="dx-micro">{micro}</div> : null}
            {title ? <h2 className="dx-hud-title">{title}</h2> : null}
          </div>
          {right ? <div className="dx-hud-right">{right}</div> : null}
        </header>
      )}
      <div className="dx-hud-body">{children}</div>
    </section>
  );
}
