# 3D-ARCHITECTURE.md

- Vanilla Three.js: `AiCoreScene` (hero core), twin terrain, `DroneSwarmScene`, `FloodTimeline` — imperative, disposed, offscreen-parked, quality-gated.
- R3F + drei: `Terrain3D` (risk blobs, sensor masts, rain particles), `GlobeView` (drill-down schematic).
- MapLibre: `MapLibreCommand` (free OpenFreeMap style, risk heat + sensors + roads).
- Shared: `components/3d/SceneShell.tsx` (lifecycle chrome, streams overlay, reduced-motion/WebGL fallbacks), `DataStreams`, `EmergencyPulse`.
- Rules: dynamic `ssr:false` everywhere (13 usages), pixel-ratio caps, `prefers-reduced-motion` respected, 2D fallbacks mandatory. Effects must carry information (risk color, pulse = critical).
