/**
 * Auth network-error mapping (no imports: must stay unit-testable under
 * plain vitest without path aliases).
 *
 * Distinguishes the browser being offline (user's connection) from the
 * authentication service being unreachable (server down). Never leaks
 * backend internals, URLs, or secrets.
 */
export function connectionErrorMessage(): string {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return 'Unable to connect to the authentication service. Please check your connection and try again.';
    }
  } catch {
    /* fall through to server-side message */
  }
  return 'Authentication service unavailable (backend offline). Please try again later.';
}
