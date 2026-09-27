const GATEWAY_KEY = process.env.NEXT_PUBLIC_GATEWAY_KEY || "drishti-mesh-dev-key-2025";

/**
 * Environment-aware backend resolution (no caller changes needed).
 * - Explicit NEXT_PUBLIC_API_BASE always wins (local override / self-host).
 * - Browser on localhost/127.0.0.1 -> local uvicorn (dev).
 * - Any other host (Vercel prod/preview) -> same-origin /api/backend rewrite.
 *   The frontend NEVER contacts a visitor's localhost in production.
 */
export function isLocalHost(): boolean {
  if (typeof window === "undefined") return process.env.NODE_ENV !== "production";
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

export function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_BASE;
  if (env) return env;
  return isLocalHost() ? "http://localhost:8000" : "/api/backend";
}

export async function fetchTelemetryData(endpoint: string) {
  const base = getApiBase();
  const url = endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;
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
  const url = `${getApiBase()}/api/scenario`;
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
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env) return env;
  // Production uses the same-origin backend path over WSS (HTTPS -> WSS).
  // If the host cannot proxy WebSockets, the hook's backoff + SIM fallback applies.
  if (typeof window !== "undefined" && !isLocalHost()) {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${window.location.host}/api/backend/ws/telemetry`;
  }
  return "ws://localhost:8000/ws/telemetry";
}

export function getGatewayKey() {
  return GATEWAY_KEY;
}
