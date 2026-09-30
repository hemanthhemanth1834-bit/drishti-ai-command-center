import { beforeEach, describe, expect, it, vi } from 'vitest';

/** restoreSession must never hang: a stalled /me probe resolves false. */
describe('restoreSession timeout', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('resolves false when /me never responds (10s probe timeout)', async () => {
    vi.useFakeTimers();
    try {
      // Mirror real fetch: reject once the probe's AbortController fires.
      vi.stubGlobal('fetch', vi.fn(
        (_url: string, opts?: { signal?: AbortSignal }) =>
          new Promise<Response>((_, reject) => {
            opts?.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')));
          }),
      ));
      const { restoreSession } = await import('@/store/authStore');
      const p = restoreSession();
      await vi.advanceTimersByTimeAsync(10000);
      await expect(p).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('resolves false on 401 without hanging', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })));
    const { restoreSession } = await import('@/store/authStore');
    await expect(restoreSession()).resolves.toBe(false);
  });
});
