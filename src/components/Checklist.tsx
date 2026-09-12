'use client';
import { useLocalList } from '@/hooks/useLocalList';

type Row = { id: string; label: string; done: boolean };

/** Progress checklist persisted on-device. Shared by Emergency Plan + Kit. */
export default function Checklist({ storageKey, seed }: { storageKey: string; seed: string[] }) {
  const { items, update, ready } = useLocalList<Row>(
    storageKey,
    seed.map((label, i) => ({ id: `c${i}`, label, done: false }))
  );
  const done = items.filter((i) => i.done).length;

  if (!ready) return <div className="text-slate-500 text-sm">Loading…</div>;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-bold">{done} / {items.length} completed</span>
        <span>{items.length ? Math.round((done / items.length) * 100) : 0}%</span>
      </div>
      <div className="h-2.5 mt-1 rounded bg-[#091a2e] border border-[#1b314b]">
        <div
          className="h-full rounded bg-emerald-400 transition-all"
          style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
        />
      </div>
      <div className="mt-2 space-y-1.5">
        {items.map((i) => (
          <label
            key={i.id}
            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer text-sm ${
              i.done ? 'bg-[#061410] border-emerald-500/40 text-slate-400' : 'bg-[#091a2e] border-[#1b314b] text-slate-100'
            }`}
          >
            <input
              type="checkbox"
              checked={i.done}
              onChange={(e) => update(i.id, { done: e.target.checked })}
              className="w-5 h-5 accent-emerald-400 shrink-0"
            />
            <span className={i.done ? 'line-through' : ''}>{i.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
