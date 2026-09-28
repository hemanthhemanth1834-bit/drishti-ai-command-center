#!/usr/bin/env node
/**
 * DRISHTI-X production smoke test — authoritative automated verifier.
 *
 * Runs in GitHub Actions AND locally (`npm run smoke:production`).
 * Zero dependencies (Node 18+: native fetch; net/tls for the WS probe).
 * No secrets: anonymous checks only (gate presence, public content,
 * backend 401 enforcement). Never prints credentials — none are used.
 *
 * Usage: node scripts/production-smoke.mjs [BASE_URL]
 */
import net from 'node:net';
import tls from 'node:tls';
import crypto from 'node:crypto';

const BASE = (process.argv[2] || 'https://drishti-ai-command-center.vercel.app').replace(/\/$/, '');
const TS = Date.now();
const TIMEOUT_MS = 15000;
const WAITS = [2000, 5000]; // sleeps between attempt 1->2, 2->3
const UA = { 'User-Agent': 'drishti-x-smoke/1.0', 'Cache-Control': 'no-cache' };
const ERROR_PAGE = /Application Error|Internal Server Error|404: Not Found|Deployment Error/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const results = [];

async function fetchOnce(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const r = await fetch(url, { ...opts, headers: { ...UA, ...(opts.headers || {}) }, signal: ctrl.signal });
    const body = await r.text();
    return { ok: true, status: r.status, body, latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, status: 0, body: '', latencyMs: Date.now() - start, error: String(e && e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

async function withRetry(label, fn) {
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    last = await fn(attempt);
    if (last.pass) {
      results.push({ label, ...last, attempts: attempt });
      console.log(`${label}  PASS | ${last.detail} (attempt ${attempt})`);
      return true;
    }
    console.log(`${label}  attempt ${attempt}/3: ${last.detail}`);
    if (attempt < 3) await sleep(WAITS[attempt - 1]);
  }
  failures += 1;
  results.push({ label, ...last, attempts: 3 });
  console.log(`${label}  FAIL | ${last.detail} | attempts: 3/3 | failure: ${last.failure || 'see detail'}`);
  return false;
}

function checkRoute(path, expect) {
  return withRetry(`${path} `, async () => {
    const url = `${BASE}${path}?smoke=${TS}`;
    const r = await fetchOnce(url);
    if (!r.ok) return { pass: false, detail: `HTTP ${r.status}`, failure: `connection/timeout: ${r.error || r.status}` };
    if (r.status !== 200) return { pass: false, detail: `HTTP ${r.status}`, failure: `unexpected status ${r.status}` };
    if (ERROR_PAGE.test(r.body)) return { pass: false, detail: 'HTTP 200', failure: 'Vercel/Next.js error page detected' };
    if (expect === 'gate') {
      if (!r.body.includes('data-testid="auth-gate"')) {
        return { pass: false, detail: 'HTTP 200', failure: 'login gate marker data-testid="auth-gate" missing' };
      }
      if (r.body.includes('dx-hud') || r.body.includes('SOVEREIGN V4.2')) {
        return { pass: false, detail: 'HTTP 200', failure: 'protected app content exposed without session' };
      }
      return { pass: true, detail: `200 | AUTH_GATE | ${r.latencyMs}ms` };
    }
    // public emergency page
    if (!/emergency SOS command|Activate SOS/.test(r.body)) {
      return { pass: false, detail: 'HTTP 200', failure: 'public SOS markers missing' };
    }
    if (r.body.includes('data-testid="auth-gate"')) {
      return { pass: false, detail: 'HTTP 200', failure: 'emergency unexpectedly gated' };
    }
    return { pass: true, detail: `200 | PUBLIC | ${r.latencyMs}ms` };
  });
}

async function checkHealth() {
  return withRetry('/api/backend/api/health', async () => {
    const r = await fetchOnce(`${BASE}/api/backend/api/health`);
    if (!r.ok) return { pass: false, detail: `HTTP ${r.status}`, failure: `connection/timeout: ${r.error || r.status}` };
    if (r.status !== 200) return { pass: false, detail: `HTTP ${r.status}`, failure: `unexpected status ${r.status}` };
    let j = null;
    try { j = JSON.parse(r.body); } catch { /* fall through */ }
    if (!j || j.ok !== true) return { pass: false, detail: 'HTTP 200', failure: 'health JSON missing {ok:true}' };
    return { pass: true, detail: `200 | HEALTHY | service=${j.service || '?'} scenario=${j.scenario || '?'}` };
  });
}

async function checkFrontendHealth() {
  return withRetry('/api/health', async () => {
    const r = await fetchOnce(`${BASE}/api/health`);
    if (!r.ok) return { pass: false, detail: `HTTP ${r.status}`, failure: `connection/timeout: ${r.error || r.status}` };
    if (r.status !== 200) return { pass: false, detail: `HTTP ${r.status}`, failure: `unexpected status ${r.status}` };
    let j = null;
    try { j = JSON.parse(r.body); } catch { /* fall through */ }
    if (!j || j.ok !== true) return { pass: false, detail: 'HTTP 200', failure: 'frontend health JSON missing {ok:true}' };
    return { pass: true, detail: `200 | HEALTHY | service=${j.service || '?'}` };
  });
}

async function checkBackend401() {
  return withRetry('backend anonymous 401', async () => {
    const r = await fetchOnce(`${BASE}/api/backend/api/v1/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'smoke_probe', secret: 'wrong' }),
    });
    if (!r.ok) return { pass: false, detail: `HTTP ${r.status}`, failure: `connection/timeout: ${r.error || r.status}` };
    if (r.status !== 401) return { pass: false, detail: `HTTP ${r.status}`, failure: 'anonymous token request not rejected with 401' };
    return { pass: true, detail: '401 | anonymous rejected, nothing issued' };
  });
}

function wsProbeOnce() {
  return new Promise((resolve) => {
    const key = crypto.randomBytes(16).toString('base64');
    const start = Date.now();
    const done = (pass, detail, failure) => resolve({ pass, detail, failure });
    const timer = setTimeout(() => { try { sock.destroy(); } catch { /* noop */ } done(false, 'timeout', 'no handshake within 15s'); }, TIMEOUT_MS);
    const sock = tls.connect(443, 'drishti-ai-command-center.vercel.app', { servername: 'drishti-ai-command-center.vercel.app' }, () => {
      sock.write(
        'GET /api/backend/ws/telemetry HTTP/1.1\r\nHost: drishti-ai-command-center.vercel.app\r\n' +
        'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
        `Sec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`,
      );
    });
    let buf = Buffer.alloc(0);
    let got101 = false;
    sock.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (!got101) {
        const head = buf.toString('utf8');
        const end = head.indexOf('\r\n\r\n');
        if (end < 0) return;
        const statusLine = head.slice(0, head.indexOf('\r\n'));
        if (!statusLine.includes('101')) {
          clearTimeout(timer);
          try { sock.destroy(); } catch { /* noop */ }
          done(false, statusLine.slice(0, 60) || 'no status', 'WebSocket handshake did not return 101');
          return;
        }
        got101 = true;
        buf = buf.slice(end + 4);
      }
      if (buf.length > 0) {
        clearTimeout(timer);
        try { sock.destroy(); } catch { /* noop */ }
        done(true, `101 | CONNECTED | telemetry flowing | ${Date.now() - start}ms`);
      }
    });
    sock.on('error', (e) => { clearTimeout(timer); done(false, 'socket error', String(e && e.message || e).slice(0, 80)); });
    sock.on('close', () => {
      if (!got101) { /* handled by error/timeout paths */ }
      else { clearTimeout(timer); done(true, `101 | CONNECTED | clean close | ${Date.now() - start}ms`); }
    });
    setTimeout(() => {
      if (got101 && buf.length === 0) {
        clearTimeout(timer);
        try { sock.destroy(); } catch { /* noop */ }
        done(true, `101 | CONNECTED | handshake ok, no frame within 5s | ${Date.now() - start}ms`);
      }
    }, 5000);
  });
}

async function checkWs() {
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    last = await wsProbeOnce();
    if (last.pass) {
      console.log(`/api/backend/ws/telemetry  PASS | ${last.detail} (attempt ${attempt})`);
      results.push({ label: 'ws', ...last, attempts: attempt });
      return true;
    }
    console.log(`/api/backend/ws/telemetry  attempt ${attempt}/3: ${last.detail}`);
    if (attempt < 3) await sleep(WAITS[attempt - 1]);
  }
  failures += 1;
  console.log(`/api/backend/ws/telemetry  FAIL | ${last.detail} | attempts: 3/3 | failure: ${last.failure || 'see detail'}`);
  return false;
}

const protectedRoutes = ['/', '/command', '/weather', '/satellite', '/events', '/earthquakes', '/risk-map'];

console.log('DRISHTI-X PRODUCTION SMOKE TEST');
console.log(`Production:\n${BASE}/`);
console.log('\nPROTECTED ROUTES\n');
for (const p of protectedRoutes) {
  // eslint-disable-next-line no-await-in-loop
  await checkRoute(p, 'gate');
}
console.log('\nPUBLIC\n');
await checkRoute('/emergency', 'public');
console.log('\nFRONTEND\n');
await checkFrontendHealth();
console.log('\nBACKEND\n');
await checkHealth();
await checkBackend401();
console.log('\nWEBSOCKET\n');
await checkWs();

console.log(`\nOVERALL:\n\n${failures === 0 ? 'PASS' : 'FAIL'}`);
process.exit(failures === 0 ? 0 : 1);
