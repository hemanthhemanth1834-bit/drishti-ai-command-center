'use client';

/** Data-trust label: every important panel shows where its numbers come from. */
export default function TrustBadge({
  kind,
  source,
  updated,
  confidence,
}: {
  kind: 'LIVE' | 'SIMULATION' | 'DEMO' | 'OFFLINE' | 'LOCAL';
  source?: string;
  updated?: string;
  confidence?: number;
}) {
  const styles =
    kind === 'LIVE'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
      : kind === 'SIMULATION'
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
        : kind === 'OFFLINE'
          ? 'bg-slate-500/15 text-slate-300 border-slate-500/40'
          : kind === 'LOCAL'
            ? 'bg-violet-500/15 text-violet-300 border-violet-500/40'
            : 'bg-sky-500/15 text-sky-300 border-sky-500/40';
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${styles}`}
      title={`${kind}${source ? ` · ${source}` : ''}${updated ? ` · ${updated}` : ''}${
        confidence !== undefined ? ` · ${confidence}% confidence` : ''
      }`}
    >
      {kind}
      {source ? ` · ${source}` : ''}
      {updated ? ` · ${updated}` : ''}
      {confidence !== undefined ? ` · ${confidence}%` : ''}
    </span>
  );
}
