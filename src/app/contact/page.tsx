'use client';
import Link from 'next/link';
import { ModuleShell } from '@/platform/provenance';

export default function ContactPage() {
  return (
    <ModuleShell
      title="Contact"
      sub="Reach the DRISHTI-X team and report issues."
      status="STATIC"
      source="DRISHTI-X project"
    >
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc ml-4">
          <li>
            GitHub repository (issues + contributions):{' '}
            <a
              className="text-[#00d2ff] underline"
              href="https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center"
              target="_blank"
              rel="noreferrer"
            >
              drishti-ai-command-center
            </a>
            .
          </li>
          <li>For a live emergency, contact local authorities first — this platform is a coordination aid, not a dispatch service.</li>
          <li>
            Field feedback? Use{' '}
            <Link className="text-[#00d2ff] underline" href="/report">Citizen Reporting</Link>{' '}
            to submit an incident with photo and GPS.
          </li>
        </ul>
      </div>
    </ModuleShell>
  );
}
