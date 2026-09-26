'use client';
/**
 * STEP 30 — Twin command-center controls: hazard layer toggles, evacuation
 * corridor toggle, camera presets. All state lives in the page; this panel
 * is stateless presentation. Every layer is SIMULATION presentation state.
 */
import { CAM_PRESETS, TWIN_LAYERS, type HazardState } from './twinLayers';

interface Props {
  hazards: HazardState;
  onHazards: (h: HazardState) => void;
  corridor: boolean;
  onCorridor: (v: boolean) => void;
  presetId: string | null;
  onPreset: (id: string | null) => void;
}

export default function TwinControls({ hazards, onHazards, corridor, onCorridor, presetId, onPreset }: Props) {
  return (
    <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4" aria-label="Twin command controls">
      <div className="text-xs font-bold text-white pb-3 border-b border-[#1b314b]">
        COMMAND LAYERS <span className="text-slate-500 font-normal">· SIMULATION</span>
      </div>
      <div className="mt-3 space-y-2" role="group" aria-label="Hazard and corridor layers">
        {TWIN_LAYERS.map((l) => {
          const checked = l.id === 'corridor' ? corridor : hazards[l.id as 'flood' | 'fire'];
          return (
            <label key={l.id} className="dx-touch flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer" title={l.hint}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  if (l.id === 'corridor') onCorridor(e.target.checked);
                  else onHazards({ ...hazards, [l.id]: e.target.checked });
                }}
                className="w-4 h-4 accent-cyan-400"
                aria-label={`${l.label}: ${l.hint}`}
              />
              <span className="font-bold tracking-wider">{l.label}</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-[#1b314b] text-slate-500">SIM</span>
            </label>
          );
        })}
      </div>
      <div className="text-xs font-bold text-white mt-4 pb-2 border-b border-[#1b314b]">
        CAMERA PRESETS
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Camera presets">
        {CAM_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPreset(presetId === p.id ? null : p.id)}
            aria-pressed={presetId === p.id}
            className={`dx-touch px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
              presetId === p.id
                ? 'bg-[#00d2ff] text-black border-[#00d2ff]'
                : 'bg-[#091a2e] border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
        Layers toggle simulated scene content only — no live data. Camera presets reframe the viewport; orbit and zoom stay free.
      </p>
    </div>
  );
}
