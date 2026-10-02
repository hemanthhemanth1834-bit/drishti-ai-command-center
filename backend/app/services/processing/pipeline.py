"""Processing pipeline (Step 4). Raw is immutable; everything lands in processed/.

RAW (data/raw/**) → DECODER → QC → NORMALIZATION → SPATIAL → TEMPORAL → OUTPUT
(data/processed/<dataset_id>/) + dataset manifest. Lineage: input manifest IDs +
checksums flow into output provenance (docs/PROVENANCE.md chain unbroken).
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from app.core.provenance import make_provenance, new_run_id

PROCESSING_VERSION = "process@v0.4"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PipelineRun:
    def __init__(self, dataset_id: str, processed_root: str | Path = "data/processed"):
        self.dataset_id = dataset_id
        self.root = Path(processed_root) / dataset_id
        self.root.mkdir(parents=True, exist_ok=True)
        self.run_id = new_run_id()
        self.inputs: list[dict] = []

    def add_raw_input(self, path: str | Path, manifest: dict | None = None) -> dict:
        """Register (never modify) a raw input. Returns the input record."""
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"raw input missing: {path}")
        rec = {"path": str(p), "sha256": sha256_file(p), "size_bytes": p.stat().st_size,
               "manifest": manifest or {}}
        self.inputs.append(rec)
        return rec

    def write_output(self, name: str, payload: dict) -> Path:
        dest = self.root / name
        dest.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
        return dest

    def write_manifest(self, *, source: str, product: str, time_range: dict,
                       spatial_extent: list[float], crs: str, resolution: str,
                       variables: dict, quality_summary: dict,
                       outputs: list[str], config: dict | None = None) -> dict:
        manifest = {
            "dataset_id": self.dataset_id, "source": source, "product": product,
            "input_files": self.inputs, "output_files": outputs,
            "created_at": utcnow().isoformat(), "processing_version": PROCESSING_VERSION,
            "time_range": time_range, "spatial_extent": spatial_extent, "crs": crs,
            "resolution": resolution, "variables": variables,
            "units": {k: v.get("unit") for k, v in variables.items()},
            "quality_summary": quality_summary,
            "provenance": make_provenance(
                run_id=self.run_id, request={"dataset_id": self.dataset_id},
                code_ref="app/services/processing/pipeline.py",
                config=config or {},
                parents=[i.get("manifest", {}).get("pipeline_run_id", "") for i in self.inputs],
            ).model_dump(mode="json"),
        }
        self.write_output("manifest.json", manifest)
        return manifest
