# AI.md — free AI stack

- Risk math: scikit-learn RandomForest (`backend/ml/`) + deterministic fallback engine. Metrics only from real runs.
- Text AI: `AIProvider` → Ollama (local, optional) / local extractive (always) / HuggingFace (stub). Env: `AI_PROVIDER`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`. Nothing auto-downloads models.
- Rule: **LLM explains text; ML/risk engine computes risk.** Outputs classified OBSERVED/ANALYZED/ESTIMATED/PREDICTED/SIMULATED (`/api/v1/ai/status`).
- Vision: pluggable interface, DEMO heuristic labeled; OpenCV/PyTorch/YOLO wire-up points documented in code.
- Lightweight guidance: 1–2B models (e.g. qwen2:1.5b-class) for ≤8 GB RAM; summarization timeout 60 s with local fallback.
