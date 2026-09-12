"use client";

type Props = {
  scenario: string;
  onScenario: (s: string) => void;
  onTestRest: () => void;
  statusMsg?: string;
};

const SCENARIOS = ["nominal", "storm", "swarm-surge", "gps-denied"];

/** Mission status & control selectors header bar. */
export default function HeaderBar({ scenario, onScenario, onTestRest, statusMsg }: Props) {
  return (
    <div className="header">
      <div>
        <h1 style={{ margin: 0 }}>DRISHTI-X COMMAND CENTER</h1>
        <small>offline • sovereign • Next.js 14 + FastAPI WS</small>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select value={scenario} onChange={(e) => onScenario(e.target.value)}>
          {SCENARIOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button onClick={onTestRest}>Test REST</button>
      </div>
      {statusMsg ? <span className="badge">{statusMsg}</span> : null}
    </div>
  );
}
