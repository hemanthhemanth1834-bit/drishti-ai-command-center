const GATEWAY_KEY = process.env.NEXT_PUBLIC_GATEWAY_KEY || "drishti-mesh-dev-key-2025";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function fetchTelemetryData(endpoint: string) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GATEWAY_KEY}`,
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);
  return response.json();
}

export async function setScenario(scenario: string) {
  const url = `${API_BASE}/api/scenario`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GATEWAY_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ scenario })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function getWsUrl() {
  return process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/telemetry";
}

export function getGatewayKey() {
  return GATEWAY_KEY;
}
