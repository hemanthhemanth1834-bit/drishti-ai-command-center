"""Model training: RandomForest, stratified validation, honest metrics.

Usage (from backend/):
    python -m ml.train --samples 3000 --out ml/artifacts --name Landslide-RF-v1
    python -m ml.train --csv path/to/verified.csv --out ml/artifacts

Artifacts written: model.joblib, metrics.json, version.json.
metrics.json is the ONLY source the /health endpoint reports.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from .datasets import demo_dataframe, load_csv, train_test_split_df
from .schemas import FEATURE_ORDER


def train(df, model_name: str, out_dir: Path) -> dict:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                                 precision_score, recall_score, roc_auc_score)

    X_train, X_test, y_train, y_test = train_test_split_df(df)
    clf = RandomForestClassifier(n_estimators=250, min_samples_leaf=4,
                                 class_weight="balanced", random_state=42,
                                 n_jobs=-1)
    clf.fit(X_train, y_train)
    proba = clf.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)
    metrics = {
        "model_name": model_name,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "data_kind": "SYNTHETIC-DEMO",
        "accuracy": round(float(accuracy_score(y_test, pred)), 4),
        "precision": round(float(precision_score(y_test, pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, proba)), 4),
        "confusion_matrix": [[int(v) for v in row]
                             for row in confusion_matrix(y_test, pred).tolist()],
        "feature_importance": {
            f: round(float(v), 5)
            for f, v in sorted(zip(FEATURE_ORDER, clf.feature_importances_),
                               key=lambda kv: kv[1], reverse=True)
        },
        "features": FEATURE_ORDER,
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    import joblib
    joblib.dump(clf, out_dir / "model.joblib")
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))
    (out_dir / "version.json").write_text(json.dumps(
        {"model_version": model_name, "trained_at": metrics["trained_at"],
         "data_kind": metrics["data_kind"]}, indent=2))
    return metrics


def main() -> None:
    ap = argparse.ArgumentParser(description="Train landslide RF model")
    ap.add_argument("--samples", type=int, default=3000)
    ap.add_argument("--csv", type=str, default=None,
                    help="Path to VERIFIED dataset (same schema as demo)")
    ap.add_argument("--out", type=str, default="ml/artifacts")
    ap.add_argument("--name", type=str, default="Landslide-RF-v1")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
    if args.csv:
        df = load_csv(args.csv)
        print(f"Training on VERIFIED dataset: {args.csv} ({len(df)} rows)")
    else:
        df = demo_dataframe(n_samples=args.samples, seed=args.seed)
        print(f"Training on SYNTHETIC DEMO data ({len(df)} rows, seed={args.seed})")
    metrics = train(df, args.name, Path(args.out))
    print(json.dumps({k: v for k, v in metrics.items()
                      if k != "feature_importance"}, indent=2))


if __name__ == "__main__":
    main()
