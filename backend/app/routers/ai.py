"""Free AI API: status, summarization, classification.

The LLM NEVER computes official risk — it explains/summarizes text only.
Every output is classified OBSERVED/ANALYZED/ESTIMATED/PREDICTED/SIMULATED.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..services.ai_providers import OUTPUT_CLASSES, ai
from ..services.security import rate_limit

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


class TextIn(BaseModel):
    text: str
    max_sentences: int = 3


class ClassifyIn(BaseModel):
    text: str


DISASTER_HINTS = {
    "flood": ["flood", "waterlog", "inundat", "వరద"],
    "fire": ["fire", "smoke", "blaze", "అగ్ని", "మంట"],
    "landslide": ["landslide", "debris", "slope", "కొండచరియ"],
    "cyclone": ["cyclone", "storm", "తుఫాను"],
    "earthquake": ["earthquake", "tremor", "భూకంప"],
    "heatwave": ["heat", "heatwave", "వడగాలులు"],
}


@router.get("/status")
def status():
    return {"providers": [
        {"name": "Ollama (local LLM)", "id": "ollama"},
        {"name": "Local extractive", "id": "local"},
        {"name": "HuggingFace (optional)", "id": "huggingface"},
    ], "active": ai().status(), "output_classes": OUTPUT_CLASSES,
        "rule": "LLM explains text; ML/risk engine computes risk."}


@router.post("/summarize")
def summarize(body: TextIn, _=Depends(rate_limit(60))):
    if not body.text.strip():
        return {"summary": "", "data_status": "ANALYZED"}
    out = ai().summarize(body.text, body.max_sentences)
    out["output_class"] = "ANALYZED"
    return out


@router.post("/classify")
def classify(body: TextIn, _=Depends(rate_limit(120))):
    text = body.text.lower()
    hits = {k: sum(1 for w in words if w in text) for k, words in DISASTER_HINTS.items()}
    best = max(hits, key=lambda k: hits[k])
    conf = 40 + min(50, hits[best] * 15) if hits[best] else 25
    return {"label": best if hits[best] else "other",
            "confidence": conf if hits[best] else 25,
            "hints": hits, "model": "keyword-v0 (transparent, not validated)",
            "output_class": "ESTIMATED",
            "note": "Triage hint only — human verification required."}
