"use client";
import { useEffect, useRef, useState } from "react";
import { getWsUrl } from "../utils/apiClient";

export type Packet = {
  id: string;
  tick: number;
  drone_id: string;
  lat: number;
  lon: number;
  alt_m: number;
  speed_ms: number;
  battery_pct: number;
  signal_pct: number;
  scenario: string;
  ts: number;
};

export function useTelemetry() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [live, setLive] = useState<Packet | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const pkt = JSON.parse(ev.data) as Packet;
        setLive(pkt);
        setPackets((p) => [pkt, ...p].slice(0, 50));
      } catch {}
    };
    return () => ws.close();
  }, []);

  return { packets, live, connected };
}

export default function TelemetryFeed() {
  const { packets, live, connected } = useTelemetry();
  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span className="badge">{connected ? "● LIVE WS" : "○ OFFLINE"}</span>
        {live && <span>{live.drone_id} Alt {live.alt_m.toFixed(1)}m Batt {live.battery_pct.toFixed(1)}%</span>}
      </div>
      <div className="feed" style={{ marginTop: 8 }}>
        {packets.map((p) => (
          <div key={p.id + p.tick} className="row">
            <span>#{p.tick} {p.drone_id}</span>
            <span>{p.lat.toFixed(4)},{p.lon.toFixed(4)}</span>
            <span>{p.speed_ms.toFixed(1)} m/s</span>
            <span>{p.signal_pct.toFixed(0)}%</span>
          </div>
        ))}
        {!packets.length && <p>Waiting for ws://localhost:8000/ws/telemetry …</p>}
      </div>
    </div>
  );
}
