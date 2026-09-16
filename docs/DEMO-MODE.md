# DEMO-MODE.md — presentation without deception

Scenarios (drive from `/nesafe` demo panel or `/demo` presenter): NORMAL, HEAVY RAIN, LANDSLIDE RISK, FLASH FLOOD, ROAD BLOCKAGE, MULTI-HAZARD, NETWORK FAILURE (backend down → OFFLINE badges + cached/demo fallbacks).

Rules: every synthetic value shows DEMO/SIMULATION; `data_status`/`simulated` asserted in tests; never call demo output a government feed. Showcase regions: AP + Telangana equally (`/regions` quick-pick); the same UI works for any region in the DB.
