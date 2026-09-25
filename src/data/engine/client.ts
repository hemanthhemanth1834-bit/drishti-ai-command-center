/**
 * DRISHTI-X data engine — request layer (Step 22).
 * GET + timeout + AbortController + bounded retry (exponential backoff) +
 * in-flight deduplication + normalized errors + safe diagnostics.
 */
import { dataError, isRetryable } from './errors';
import type { DataError, ErrorKind, RequestDiagnostics } from './types';

export interface RequestOptions {
  timeoutMs?: number;
  /** Max retries after the initial attempt (default 2). */
  maxRetries?: number;
  backoffBaseMs?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Override fetch (tests). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  onDiagnostics?: (d: RequestDiagnostics) => void;
}

export interface RequestSuccess<T> {
  ok: true;
  data: T;
  status: number;
  durationMs: number;
  attempts: number;
}

export interface RequestFailure {
  ok: false;
  error: DataError;
  durationMs: number;
  attempts: number;
}

export type RequestResult<T> = RequestSuccess<T> | RequestFailure;

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 400;

/** In-flight deduplication: identical concurrent GETs share one request. */
const inflight = new Map<string, Promise<RequestResult<unknown>>>();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function kindForStatus(status: number): ErrorKind {
  if (status === 429) return 'RATE_LIMITED';
  if (status === 401 || status === 403) return 'AUTH_REQUIRED';
  if (status >= 500) return 'SOURCE_UNAVAILABLE';
  return 'HTTP_ERROR';
}

export function inflightCount(): number {
  return inflight.size;
}

export async function request<T>(source: string, endpoint: string, url: string, opts: RequestOptions = {}): Promise<RequestResult<T>> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_RETRIES,
    backoffBaseMs = DEFAULT_BACKOFF_MS,
    signal,
    headers,
    fetchImpl,
    onDiagnostics,
  } = opts;
  const key = `GET ${url}`;
  const existing = inflight.get(key);
  if (existing) return existing as Promise<RequestResult<T>>;

  const started = Date.now();
  const diag = (status: RequestDiagnostics['status'], cacheHit: boolean, recordCount: number | null, errorKind: ErrorKind | null) =>
    onDiagnostics?.({ source, endpoint, durationMs: Date.now() - started, status, cacheHit, recordCount, errorKind });

  const run = (async (): Promise<RequestResult<T>> => {
    const fetchFn = fetchImpl ?? fetch;
    let attempts = 0;
    let lastError: DataError = dataError('UNKNOWN_ERROR', 'Request failed before first attempt');
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      attempts = attempt + 1;
      if (signal?.aborted) {
        lastError = dataError('UNKNOWN_ERROR', 'Request aborted by caller');
        break;
      }
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const onAbort = () => ctrl.abort();
      signal?.addEventListener('abort', onAbort, { once: true });
      try {
        const res = await fetchFn(url, { signal: ctrl.signal, headers });
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        if (!res.ok) {
          const kind = kindForStatus(res.status);
          lastError = dataError(kind, `HTTP ${res.status} from ${source}`, res.status);
          if (!isRetryable(kind, res.status)) break;
        } else {
          try {
            const data = (await res.json()) as T;
            diag('SUCCESS', false, Array.isArray(data) ? data.length : 1, null);
            return { ok: true, data, status: res.status, durationMs: Date.now() - started, attempts };
          } catch {
            lastError = dataError('PARSE_ERROR', `Unparseable JSON from ${source}`);
            break;
          }
        }
      } catch (e) {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        const aborted = e instanceof DOMException && e.name === 'AbortError';
        if (signal?.aborted) {
          lastError = dataError('UNKNOWN_ERROR', 'Request aborted by caller');
          break;
        }
        lastError = aborted
          ? dataError('TIMEOUT', `Request to ${source} timed out after ${timeoutMs}ms`)
          : dataError('NETWORK_ERROR', `Network failure reaching ${source}: ${(e as Error)?.message ?? 'unknown'}`);
        if (!isRetryable(lastError.kind, null)) break;
      }
      if (attempt < maxRetries && isRetryable(lastError.kind, lastError.httpStatus)) {
        await sleep(backoffBaseMs * 2 ** attempt);
      } else break;
    }
    diag('ERROR', false, null, lastError.kind);
    return { ok: false, error: lastError, durationMs: Date.now() - started, attempts };
  })();

  inflight.set(key, run as Promise<RequestResult<unknown>>);
  try {
    return await run;
  } finally {
    inflight.delete(key);
  }
}
