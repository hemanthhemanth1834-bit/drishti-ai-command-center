# data/ — datasets

No verified external datasets are vendored here. Ingest real data via the
documented paths; keep this folder for local, licensed, attributed copies.

| Dataset | Source | License | Accessed | Purpose | Attribution |
|---|---|---|---|---|---|
| *(none yet)* | — | — | — | — | — |
| Demo seeds | generated in `backend/app/seed_*.py` | synthetic (no license needed) | — | dev/demo | labeled DEMO in app |

## Import paths
- Landslide history CSV → `POST /api/v1/history/import` (schema: `GET /api/v1/history/schema`).
- ML training CSV → `cd backend && python -m ml.train --csv data/verified.csv`.
- Region extension → extend `backend/app/seed_geo.py` + `src/config/regions.ts`, or insert via DB.

## Rules
- Never commit personal data, credentials, or copyrighted bulk data.
- Record every dataset row above: source, license, date, purpose, attribution.
- Casualty figures: official sources only, else `unknown`.
