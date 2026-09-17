# PROVENANCE.md

Every data-driven value carries SOURCE + TIMESTAMP + STATUS. Canonical statuses:
`LIVE`, `FORECAST`, `CACHED`, `STALE`, `EXTERNAL`, `DEMO`, `SIMULATION`, `OFFLINE`,
`NOT_CONFIGURED`, `NOT_AVAILABLE` (+`MODEL`, `HISTORICAL REFERENCE`).
Implementation: backend `data_status`/`simulated` fields → `StatusBadge` UI
(`src/platform/provenance.tsx`); tests assert the flags. Forbidden transitions:
DEMO→LIVE, SIMULATION→LIVE, SYNTHETIC→REAL, HISTORICAL→LIVE, PLACEHOLDER→REAL,
NOT_CONFIGURED→CONNECTED. Synthetic ML metrics stay SYNTHETIC-DEMO.
