import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('/api/health route', () => {
  it('returns {ok:true} with no-store cache headers, no auth required', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('drishti-x-web');
    expect(typeof body.time).toBe('string');
    expect(res.headers.get('cache-control')).toContain('no-store');
  });
});
