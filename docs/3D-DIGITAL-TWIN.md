# DRISHTI-X 3D Digital Twin (Step 30)

## Stack actually used

Vanilla Three.js `TwinViewport` (procedural city, surge plane, pickables, corridor, vehicles, VFX rig) + R3F `DisasterGlobe`/`Terrain3D`/`GlobeView` + MapLibre command view + `SceneShell` lifecycle chrome. Dynamic `ssr:false`, pixel-ratio caps.

## TwinViewport

Terrain slab + river + roads + extruded buildings + bridge + surge plane + drone + spotlight + drop-flash ring + pickable entity markers (boat, ambulance, drone, hospital, shelter, bridge, fire tender, 2 hazard cells) + emergency corridor + vehicles + zone wall + VFX (grid mode). Fixed scene ids (e.g. HZ-FL, HZ-FR).

## DigitalTwinCanvas

Used on `/command` workstation tab (3D twin viewport). Preserved as-is.

## Terrain / hazard layers / scenarios

Procedural Himalayan-scale DEM (SIMULATION/DEMO labeled). Step 30 toggles: FLOOD cell, FIRE cell, evacuation corridor (+vehicles). FloodTimeline surge slider drives the surge plane. Scenario presets (Flood/Storm/Cyclone/Landslide/Fire) on `/twin`.

## Incident markers / evacuation corridor / vehicles

Markers from fixed scene data (pick → detail panel, SIMULATION-labeled); corridor is static amber geometry with animated vehicles — explicitly not an official route.

## Camera presets / controls

OVERVIEW (dist 9) / INCIDENT (flood cell) / GROUND + free orbit, wheel/pinch zoom, reset; snap-on-preset, lerp otherwise. TwinControls panel (44px, aria-pressed).

## Timeline / reduced motion / WebGL fallback

Surge timeline via FloodTimeline; `motionOK` freezes decorative motion and snaps camera under `prefers-reduced-motion`; offline-tile dark terrain + 2D canvas fallbacks; never a blank screen.

## SIMULATION labeling / limitations

Every layer, marker, corridor, and scenario carries SIMULATION. Procedural terrain is not live geography; corridor is not an evacuation instruction; no live sensor/terrain claims. Mobile stacked, pinch zoom, no overflow.
