# DATABASE.md — free data layer

- Dev: SQLite file (`drishti.db`, gitignored). Prod path: `DATABASE_URL=postgresql+psycopg2://…` (compose `full` profile ships PostGIS 16).
- Tables (24): telemetry has none (legacy); platform 17 (`app/models/platform.py`); geo/sector 8 (`app/models/geo.py`): countries, states, districts, cities, localities, disaster_types, sectors, agencies, resources, shelters, risk_zones, evacuation_zones.
- Migrations: `Base.metadata.create_all` + additive `ALTER TABLE` shim in `app/db.py` (dev). Adopt Alembic before production.
- PostGIS upgrade: add `GEOGRAPHY` columns + GIST indexes; spatial helpers in `app/services/spatial.py` document the PostGIS equivalents. Watch: naive `DateTime` → use timestamptz; SQLite `Boolean`/`Integer` PKs map fine.
- Seeds: `seed_demo.py` (labeled DEMO, skips non-empty tables) + `seed_geo.py` (real AP/TG district names; coords only where verified).
