# DRISHTI-X Unified Consolidation

The production `drishti-ai-command-center` repository is the canonical DRISHTI-X application and website.

## Integrated SIH26071 capabilities

- rainfall ML feature engineering and inference contracts
- nowcasting feature definitions and model registry
- inundation/runoff processing
- risk, weather, temporal, spatial, QC and fusion processing
- Open-Meteo, GFS, GIBS and terrain/free-provider adapters
- validation and impact API contracts

The existing command-center frontend remains the single UI. The separate SIH frontend/skeleton is intentionally not copied because it duplicates the application shell.

## Intentionally not merged

- duplicate SIH frontend/project shell
- duplicate root project metadata that would overwrite the canonical app
- secrets and environment files
- binary model artifacts that cannot be safely transferred through the connected repository text API; the model registry remains explicit about artifact availability

## API

SIH-specific routes are grouped under `/api/sih26071/...`. Existing production routes remain unchanged. The imported nowcast contract retains its documented `/api/v1/ml/nowcast/...` paths.

## Retirement rule

The two original repositories/deployments remain untouched until the unified branch is built, tested and production-verified. No deletion is performed before verification.
