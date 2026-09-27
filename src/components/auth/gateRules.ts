/** Pure gate rules (no React/Next imports — unit-testable). */

/** Paths reachable without a session (SOS must never require sign-in). */
export const OPEN_PATHS = ['/emergency'];

export function requiresAuth(pathname: string | null): boolean {
  if (!pathname) return true;
  return !OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
