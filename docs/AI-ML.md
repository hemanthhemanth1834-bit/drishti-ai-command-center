# DRISHTI-X AI/ML (Step 29 operational view)

## Model

- Name: Landslide-RF-v1 (from `backend/ml/artifacts/metrics.json`)
- Algorithm: scikit-learn RandomForest (+ deterministic weighted fallback engine)
- Features: 22-feature schema (`FEATURE_ORDER`, `backend/ml/schemas.py`)
- Training provenance: `data_kind: SYNTHETIC-DEMO`, trained 2026-09-16T12:41:41Z, 2400 train / 600 test
- Metrics (artifact values, pass-through only): accuracy 0.8867, precision 0.9766, recall 0.8895, F1 0.931, ROC-AUC 0.9408, confusion matrix [[73,11],[57,459]]

## Inference API

- `POST /api/v1/ml/predict` (rate-limited, no auth): probability, risk level, version, simulated flag, contributions; persists to DB (survives DB outages)
- `POST /api/v1/ml/batch-predict` (auth), `GET /api/v1/ml/model|health|features`, `GET /api/v1/ml/explain/{id}`
- Confidence exists per-prediction in backend responses; the frontend shows confidence only when returned, else NOT AVAILABLE

## Model health

`GET /api/v1/model-health`: HEALTHY/UNKNOWN/NOT_TRAINED + metrics + PSI drift (or honest NOT AVAILABLE + quantile note). No calibration source exists anywhere → calibration always NOT AVAILABLE.

## Explainability

Per-feature contribution_pct (value × importance, normalized) + factors + `/explain/{id}` endpoint; decision-support wording, field verification required.

## Confidence handling

Never fabricated. `PredictorCard` shows backend confidence when present, DEMO heuristic otherwise (labeled).

## Synthetic/demo limitations

Model trained on synthetic data with 87% positive skew (per README audit). Metrics describe the demo artifact, never field accuracy. UI banner is immutable when `data_kind` indicates synthetic/demo.

## Model-flow visualization

`src/components/ml/ModelFlowVisual.tsx` (used on /ml and /prediction; homepage keeps its frozen diagram) renders inputs → RandomForest → output → GIS with real source-backed imagery from `src/data/images/imageRegistry.ts` (NASA/FEMA public-domain photos, real OSM tile preview). Photographs are labeled CONTEXT, never measurements; the old static `ml-pipeline.svg` "87/100" score is not used — output shows registry state (NOT AVAILABLE when OFFLINE) and links to the predictor for per-run scores. Feature count, version, and training kind come from `/api/v1/ml/model`, never hardcoded.

## Current backend availability / deployment state

Backend OFFLINE (Railway trial expired 2026-09-26) → MODEL OFFLINE UI, all values NOT AVAILABLE, no simulated health. Artifacts ship in-repo (`backend/ml/artifacts/`); retraining via `python -m ml.train`.
