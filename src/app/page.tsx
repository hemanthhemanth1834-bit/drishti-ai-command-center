"use client";
import { useState } from "react";
import TelemetryFeed, { useTelemetry } from "../components/TelemetryFeed";
import DigitalTwin from "../components/DigitalTwin";
import RadarMap from "../components/RadarMap";
import { fetchTelemetryData, setScenario } from "../utils/apiClient";

const SCENARIOS = ["nominal", "storm", "swarm-surge", "gps-denied"];

export default function Page() {
  const { live } = useTelemetry();
  const [scenario, setScenarioState] = useState("nominal");
  const [msg, setMsg] = useState("");

  async function changeScenario(s: string) {
    setScenarioState(s);
    try {
      await setScenario(s);
      setMsg(`scenario → ${s}`);
    } catch (e: any) {
      setMsg(`WS live, REST needs backend: ${e.message}`);
    }
  }

  async function testRest() {
    try {
      const j = await fetchTelemetryData("/api/telemetry");
      setMsg(`REST OK: ${j.drone_id} ${j.alt_m.toFixed(1)}m`);
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  const lat = live?.lat ?? 17.385;
  const lon = live?.lon ?? 78.4867;
  const alt = live?.alt_m ?? 120;

  return (
    <main className="hud">
      <div className="header">
        <div>
          <h1 style={{ margin: 0 }}>DRISHTI-X COMMAND CENTER</h1>
          <small>offline • sovereign • Next.js 14 + FastAPI WS</small>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={scenario} onChange={(e) => changeScenario(e.target.value)}>
            {SCENARIOS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={testRest}>Test REST</button>
        </div>
      </div>

      {msg && <p className="badge" style={{ marginTop: 8 }}>{msg}</p>}

      <div className="grid">
        <div className="card">
          <h3>Live Telemetry Feed</h3>
          <TelemetryFeed />
        </div>
        <div className="card">
          <h3>Three.js Digital Twin — Alt {alt.toFixed(1)}m</h3>
          <DigitalTwin alt={alt} />
        </div>
        <div className="card">
          <h3>Leaflet Radar — {lat.toFixed(4)}, {lon.toFixed(4)}</h3>
          <RadarMap lat={lat} lon={lon} />
        </div>
      </div>

      <p style={{ opacity: 0.7 }}>
        Backend: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload (from backend/) •
        Frontend: npm run dev → http://localhost:3000
      </p>
    </main>
  );
}
