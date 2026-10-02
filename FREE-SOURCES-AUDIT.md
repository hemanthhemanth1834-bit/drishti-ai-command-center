# Free Sources Audit — DRISHTI-X

This audit reflects the 26071-focused repository after legacy cleanup.

| Capability | Source | Status / rule |
|---|---|---|
| Weather | Open-Meteo | Live when reachable; no synthetic fallback |
| Rainfall | Open-Meteo | Observed/forecast values kept distinct |
| Satellite imagery | NASA GIBS | Context imagery; not claimed as tasked observation |
| GIS / maps | OpenStreetMap ecosystem | Keyless/free paths where policy permits |
| River/flood context | Open-Meteo / GloFAS where available | Source/status must remain explicit |
| Official IMD | IMD | Not configured unless a legitimate integration exists |
| Radar | None currently connected | No fake radar data |
| NWP | None currently fused | No NWP-fusion claim |
| ML | SIH model work only when artifacts/data are actually present | No fabricated predictions |

## Free-first rule

No paid provider is required to keep the core application running. Provider failure must surface as `UNAVAILABLE` or `NOT_CONFIGURED`; it must never trigger a synthetic operational fallback.

## Attribution

Provider-specific attribution and usage restrictions remain documented with the corresponding integration.