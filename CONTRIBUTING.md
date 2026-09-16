# Contributing to DRISHTI-X

Thanks for helping with this working prototype. Small, honest, additive PRs beat rewrites.

## Ground rules

1. **Preserve existing functionality.** No route/component/store deletions; extend, don't replace.
2. **Never present synthetic data as live.** Every new demo value needs a `DEMO`/`SIMULATION` label in API (`data_status`/`simulated`) and UI badge.
3. **No secrets.** Keys live in `.env*` (gitignored) with placeholders in `.env.example` only.
4. **No invented metrics.** Model numbers come from real training runs (`backend/ml/artifacts/metrics.json`) or read `NOT AVAILABLE`.

## Workflow

```bash
git checkout -b feat/<short-name>
npm install
npm run typecheck && npm run lint && npm run build
cd backend && pip install -r requirements.txt && python -m pytest -q
```

- Backend: add router + tests in `backend/tests/test_platform.py`; keep `/api/v1/*` contracts backward compatible.
- Frontend: reuse `src/platform/` (api client, provenance badges, offline store); new pages use the cinematic shell + `ModuleShell`.
- ML: `cd backend && python -m ml.train --samples 3000` (or `--csv data/verified.csv`); never commit `ml/artifacts/`.

## PR checklist

- [ ] typecheck, lint, build, pytest green
- [ ] simulated vs live labeled; docs updated if behavior changed
- [ ] screenshots for UI changes (real captures → `docs/screenshots/`, see its README)
