'use client';
import { ModuleShell } from '@/platform/provenance';

export default function TermsPage() {
  return (
    <ModuleShell
      title="Terms of Use"
      sub="Prototype terms. Not a certified emergency-warning system."
      status="STATIC"
      source="DRISHTI-X project"
    >
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc ml-4">
          <li>DRISHTI-X is a working prototype for preparedness research and coordination demos.</li>
          <li>It does not replace official government warnings or professional emergency procedures.</li>
          <li>Always follow official warnings in a real emergency.</li>
          <li>Demo and simulated content is labeled DEMO / SIMULATION and must not be treated as live intelligence.</li>
          <li>Open data shown here carries its provider license (OSM ODbL, Open-Meteo CC-BY 4.0, NASA open data).</li>
          <li>Do not submit false incident reports; misuse may be logged for operator review.</li>
        </ul>
      </div>
    </ModuleShell>
  );
}
