# DRISHTI-X model intelligence (Step 29)

Operational visibility over the existing backend ML contracts on
`/model-health`. No new model, no retraining, no backend changes.
Frontend-only step reusing `usePlatform` + existing endpoints.

## Contracts (verified from `backend/app/routers/ml.py` + `ml/monitoring.py`)

- `GET /api/v1/model-health` → metrics artifact: status, accuracy,
  precision, recall, f1, roc_auc, training/validation samples,
  last_trained, confusion_matrix, feature_importance, data_drift,
  data_kind, model_version.
- `GET /api/v1/ml/model` → version, READY/NOT_TRAINED status,
  trained_at, data_kind, features list (or train hint).
- `GET /api/v1/ml/health` → HEALTHY/UNKNOWN/NOT_TRAINED + metrics.
- `GET /api/v1/ml/features` → feature list + count.
- `POST /api/v1/ml/predict` → probability/risk/version/simulated/
  contributions (playground lives on `/prediction`; reused via link).
- No calibration source exists anywhere → calibration is always
  NOT AVAILABLE. Drift comes only from the health payload.

## Current production truth (2026-09-26)

Railway trial expired → backend unreachable → the page shows
MODEL OFFLINE with all values NOT AVAILABLE. On a live backend with
the shipped artifact, it shows SYNTHETIC-DEMO metrics honestly.

## UI contract (`/model-health`)

- MODEL OFFLINE banner when backend unreachable (never simulated healthy).
- SYNTHETIC-DEMO banner whenever `data_kind` indicates synthetic/demo
  data — prominent, permanent, never dismissible-by-design.
- Identity panel: contract fields only (version, status, trained_at,
  data kind, feature count, health).
- Calibration card: always NOT AVAILABLE (no source).
- Drift card: payload value or NOT AVAILABLE; never inferred from age.
- Inference panel: availability from model READY state + links to
  `/prediction` playground and `/ml` lab; demo inputs labeled on the
  playground side.
- Timeline: TRAINED / EVALUATED / RETRIEVED from source timestamps;
  missing → NOT AVAILABLE; retrieval labeled separately, never a
  substitute.

## Data integrity

- Metrics pass through untouched (no rounding, no derivation).
- Confidence shown only when returned (currently never — NOT AVAILABLE).
- Forbidden words unless sourced: accurate, production ready,
  validated, no drift, well calibrated, operational.
- `SYNTHETIC-DEMO` can never render as OPERATIONAL (asserted in tests).

## Tests

`model/__tests__/model.test.ts`: 18 deterministic cases (detection,
badge precedence, health mapping, metric passthrough, timeline
provenance, no-fabrication guards). No live backend dependency.

## Environment variables

None required. No secrets involved.
