'use client';
import { ModuleShell } from '@/platform/provenance';

export default function PrivacyPage() {
  return (
    <ModuleShell
      title="Privacy"
      sub="How DRISHTI-X handles your data. Working prototype notice included."
      status="STATIC"
      source="DRISHTI-X project"
    >
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc ml-4">
          <li>GPS and location stay in your browser unless you submit a report.</li>
          <li>Incident reports (photo, GPS, type) are stored to coordinate response and are visible to operators.</li>
          <li>Preferences (language, mode, map view) live in this browser&apos;s localStorage only.</li>
          <li>No advertising trackers. No sale of personal data.</li>
          <li>Operator sign-in credentials are verified server-side and never exposed to other users.</li>
          <li>This is a working prototype — review before any production use with real personal data.</li>
        </ul>
      </div>
    </ModuleShell>
  );
}
