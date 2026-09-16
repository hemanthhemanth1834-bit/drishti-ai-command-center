# ARCHITECTURE.md — universal platform design

```
Country → State → District → City → Locality → Incident   (DB-driven, backend/app/models/geo.py)
Disaster sectors/types + agencies                         (config + DB, src/config/)
        │                        │
        └──────────┬─────────────┘
            Intelligence layer
   AI (Ollama/local, explains only) · GIS (Leaflet/MapLibre) · Open data
            ML/Risk engine (computes risk) · NER/grid risk cells
                     │
   Command center (region context store drives map/weather/risk/shelters)
                     │
   Alerts (INFO→CRITICAL) · Resources · Shelters · P1–P4 response
                     │
   Government / agencies / responders / communities
```

- Universal core: no city/state hard-coding; AP + Telangana are showcase rows, India is the schema, other countries are stub rows.
- Provider rule: interface → FREE API → LOCAL → OPTIONAL EXTERNAL → labeled FALLBACK (see backend/app/services/).
- Status truth: `data_status` on every response; UI badges LIVE/FORECAST/CACHED/DEMO/SIMULATION/EXTERNAL/OFFLINE/STALE/NOT_CONFIGURED/NOT_AVAILABLE.
