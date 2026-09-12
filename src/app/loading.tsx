// Global route fallback: command-deck skeleton while a segment streams in.
export default function Loading() {
  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono p-4" aria-busy="true" aria-label="Loading">
      <div className="max-w-6xl mx-auto flex flex-col gap-3 animate-pulse">
        <div className="h-12 rounded-xl bg-[#051424] border border-[#1b314b]" />
        <div className="h-8 rounded-lg bg-[#051424] border border-[#1b314b] w-2/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-7 h-[420px] rounded-xl bg-[#051424] border border-[#1b314b]" />
          <div className="lg:col-span-5 h-[420px] rounded-xl bg-[#051424] border border-[#1b314b]" />
        </div>
        <div className="text-[11px] text-slate-500 tracking-widest">INITIALIZING DRISHTI-X…</div>
      </div>
    </main>
  );
}
