/**
 * Public no-cache frontend health endpoint.
 *
 * Anonymous liveness probe for the Next.js web service itself (independent
 * of the backend telemetry service at /api/backend/api/health). No auth, no
 * secrets, no PII — safe for uptime monitors and load balancers.
 * `Cache-Control: no-store` guarantees monitors never see a stale result.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(
    { ok: true, service: 'drishti-x-web', time: new Date().toISOString() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
      },
    },
  );
}
