# 3D-ARCHITECTURE.md

- Vanilla Three.js: `AiCoreScene` (hero core), twin terrain, `DroneSwarmScene`, `FloodTimeline` — imperative, disposed, offscreen-parked, quality-gated.
- R3F + drei: `Terrain3D` (risk blobs, sensor masts, rain particles), `GlobeView` (drill-down schematic).
- MapLibre: `MapLibreCommand` (free OpenFreeMap style, risk heat + sensors + roads).
- Shared: `components/3d/SceneShell.tsx` (lifecycle chrome, streams overlay, reduced-motion/WebGL fallbacks), `DataStreams`, `EmergencyPulse`.
- Rules: dynamic `ssr:false` everywhere (13 usages), pixel-ratio caps, `prefers-reduced-motion` respected, 2D fallbacks mandatory. Effects must carry information (risk color, pulse = critical).

## Step 30 — Twin command-center expansion (`/twin`)

- `components/twin/twinLayers.ts`: layer catalog (FLOOD/HZ-FL, FIRE/HZ-FR, CORRIDOR) + camera presets (OVERVIEW dist 9, INCIDENT dist 6 at flood cell, GROUND dist 4.5) + reduced-motion helper. Pure + tested (12 cases).
- `components/twin/TwinControls.tsx`: checkbox layer toggles + preset buttons (44px, `aria-pressed`, SIM labels), stateless, page-owned state.
- `TwinViewport` (targeted props only, no rewrite): `hazards`, `corridor`, `camPreset` (snap-on-change, lerp otherwise), `motionOK` (freezes decorative motion, snaps camera). Scene content, entities, fallback, and picking untouched.
- Page HUD shows active layers + view + motion state (presentation facts from page state, never KPIs).
- Simulation semantics: every layer/corridor/marker is SIMULATION; procedural terrain stays DEMO; no live-terrain claims; corridor is not an official route.
- Mobile: stacked panels, 44px controls, no overflow; pinch/wheel zoom preserved.
- Tests: `twin/__tests__/twin.test.ts` (toggles, presets, fallback, motion default, no-fake-data guards). Limitations: presets frame fixed scene ids; corridor path is static geometry.
