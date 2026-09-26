/**
 * Auth error-mapping tests — deterministic, no network, no credentials.
 * Verifies the login failure message distinguishes a dead browser
 * connection from a dead authentication service without leaking
 * backend internals, URLs, or secrets.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { connectionErrorMessage } from '../authErrors';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('connectionErrorMessage', () => {
  it('browser offline blames the connection', () => {
    vi.stubGlobal('navigator', { onLine: false });
    const msg = connectionErrorMessage();
    expect(msg).toContain('check your connection');
    expect(msg).not.toMatch(/https?:\/\//);
  });

  it('server unreachable while browser online blames the service, not the user', () => {
    vi.stubGlobal('navigator', { onLine: true });
    const msg = connectionErrorMessage();
    expect(msg).toContain('backend offline');
    expect(msg).not.toContain('check your connection');
  });

  it('no navigator (SSR) reports service unavailable', () => {
    const msg = connectionErrorMessage();
    expect(msg).toContain('backend offline');
  });

  it('messages leak no internals or secrets', () => {
    vi.stubGlobal('navigator', { onLine: true });
    const msg = connectionErrorMessage();
    for (const leak of ['JWT', 'SECRET', 'stack', 'Traceback', '500', 'password', 'token']) {
      expect(msg.toLowerCase()).not.toContain(leak.toLowerCase());
    }
  });

  it('invalid credentials path is separate (backend 401 message preserved)', () => {
    // The 401 branch lives in authStore and is intentionally untouched here;
    // this asserts the network-error helper never masquerades as auth failure.
    vi.stubGlobal('navigator', { onLine: true });
    expect(connectionErrorMessage()).not.toContain('Invalid email');
  });
});
