"use client";
import { useEffect, useRef, useState } from "react";
import { getWsUrl } from "../utils/apiClient";

export type TelemetryPacket = {
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

/** Reconnecting WebSocket client hook with exponential backoff. */
export function useTelemetrySocket(url?: string) {
  const [packets, setPackets] = useState<TelemetryPacket[]>([]);
  const [live, setLive] = useState<TelemetryPacket | null>(null);
  const [connected, setConnected] = useState(false);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let closed = false;
    let ws: WebSocket | null = null;

    function connect() {
      if (closed) return;
      ws = new WebSocket(url ?? getWsUrl());
      ws.onopen = () => {
        setConnected(true);
        retryRef.current = 0;
      };
      ws.onclose = () => {
        setConnected(false);
        if (closed) return;
        const backoff = Math.min(1000 * 2 ** retryRef.current, 10000);
        retryRef.current += 1;
        timerRef.current = setTimeout(connect, backoff);
      };
      ws.onerror = () => ws?.close();
      ws.onmessage = (ev) => {
        try {
          const pkt = JSON.parse(ev.data) as TelemetryPacket;
          setLive(pkt);
          setPackets((p) => [pkt, ...p].slice(0, 50));
        } catch {
          /* ignore malformed frames */
        }
      };
    }

    connect();
    return () => {
      closed = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      ws?.close();
    };
  }, [url]);

  return { packets, live, connected };
}
