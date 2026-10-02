# DRISHTI-X ML pipelines (Step 1: design only — no training, no metrics)

Three dedicated models (new; no reuse of prior landslide/RF work):

1. `training/train_rainfall.py` — heavy rainfall prediction (fused grids → 24/48/72 h + exceedance probs)
2. `training/train_nowcast.py` — 0–6 h nowcasting (radar/sat/obs blend)
3. `training/train_inundation.py` — depth/extent + uncertainty from rainfall + terrain + drainage

`features/` holds builder contracts (lags, rolling stats, spatial context, terrain joins).
`inference/` holds predict contracts (grid in → grid + uncertainty out, with `model_version` + `data_status`).
`evaluation/` holds the event-based validation protocol (time + spatial blocking; Brier/ROC/reliability/IoU/MAE-RMSE-bias).
`models/` registry stays docs-only until Step 8; binaries via releases/storage, never git.
