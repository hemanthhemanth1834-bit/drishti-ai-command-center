'use client';

/** Cinematic, dependency-free architecture flow diagram for /platform. */
const LANES: { title: string; items: string[]; accent: string }[] = [
  { title: 'EXPERIENCES', items: ['PUBLIC MODE', 'COMMAND MODE'], accent: '#34d399' },
  {
    title: 'APPLICATION MODULES',
    items: ['Citizen Safety', 'Risk Engine', 'Alert Engine', 'Location Intel', 'Evacuation', 'Hospitals', 'Shelters', 'Reports', 'Family', 'Drone SAR', 'Digital Twin', 'What-If Sim', 'Recovery', 'Telemetry'],
    accent: '#00d2ff',
  },
  { title: 'DOMAIN / SERVICE LAYER', items: ['riskEngine', 'alertRules', 'opsStore', 'geocode', 'overpass'], accent: '#a78bfa' },
  {
    title: 'PROVIDER INTERFACES',
    items: ['Hazard', 'Weather', 'Alert', 'Shelter', 'Hospital', 'Evacuation', 'Incident', 'Drone'],
    accent: '#fbbf24',
  },
  { title: 'DEMO / LOCAL PROVIDERS', items: ['Demo cells', 'localStorage', 'Sim telemetry', 'Drill scripts'], accent: '#fb923c' },
  { title: 'FUTURE OFFICIAL PROVIDERS', items: ['IMD feeds', 'NDMA alerts', 'Hospital HMIS', 'River sensors', 'Satellite', 'Drone link'], accent: '#64748b' },
];

export default function ArchitectureDiagram() {
  return (
    <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4" aria-label="System architecture">
      <div className="text-xs font-bold text-white flex items-center gap-2">
        <span className="text-[#00d2ff]">⬢</span> DRISHTI-X SYSTEM ARCHITECTURE
      </div>
      <div className="mt-3 flex flex-col items-stretch gap-1">
        {LANES.map((lane, i) => (
          <div key={lane.title}>
            <div className="rounded-lg border border-[#1b314b] bg-[#020b14] p-2">
              <div className="text-[10px] font-bold tracking-wider" style={{ color: lane.accent }}>
                {lane.title}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {lane.items.map((it) => (
                  <span
                    key={it}
                    className="px-2 py-1 rounded bg-[#091a2e] border border-[#132d4a] text-[10px] text-slate-200"
                    style={{ boxShadow: `inset 0 0 0 1px ${lane.accent}22` }}
                  >
                    {it}
                  </span>
                ))}
              </div>
            </div>
            {i < LANES.length - 1 && (
              <div className="flex justify-center py-0.5" aria-hidden>
                <span className="text-[#00d2ff] text-sm leading-none">▼</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-slate-500">
        UI talks only to the service layer; official providers plug in below the interfaces — pages never change.
      </div>
    </div>
  );
}
