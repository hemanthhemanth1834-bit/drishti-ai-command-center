'use client';
import { useCallback, useEffect, useState } from 'react';
import { get, type ApiResult, type DataStatus } from './api';

export function usePlatform<T>(path: string | null, intervalMs = 0) {
  const [state, setState] = useState<ApiResult<T> & { loading: boolean }>({
    data: null, status: 'OFFLINE', loading: true,
  });
  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true }));
    const r = await get<T>(path);
    setState({ ...r, loading: false });
  }, [path]);
  useEffect(() => {
    load();
    if (!intervalMs) return;
    const id = setInterval(load, intervalMs);
    return () => clearInterval(id);
  }, [load, intervalMs]);
  const status: DataStatus = state.loading ? 'STALE' : state.status;
  return { ...state, status, reload: load };
}
