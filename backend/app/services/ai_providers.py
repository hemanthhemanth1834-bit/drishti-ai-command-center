"""Free AI providers. Paid LLM APIs are NEVER required.

- Ollama (local, optional): used for summarization/explanation ONLY.
- LocalTransformer: extractive fallback, always available, labeled.
- HuggingFace: documented stub (needs model id + optional token).
The ML/RISK ENGINE computes official risk; the LLM only explains text.
"""
from __future__ import annotations

import json as jsonlib
import os
import re
import urllib.request
from typing import Dict, List

AI_PROVIDER = os.getenv("AI_PROVIDER", "local")
OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "")


class AIProvider:
    name = "base"

    def status(self) -> Dict:
        raise NotImplementedError

    def summarize(self, text: str, max_sentences: int = 3) -> Dict:
        raise NotImplementedError


class OllamaProvider(AIProvider):
    name = "Ollama (local LLM)"

    def status(self) -> Dict:
        if AI_PROVIDER != "ollama" or not OLLAMA_MODEL:
            return {"provider": self.name, "status": "NOT_CONFIGURED",
                    "needs": "AI_PROVIDER=ollama + OLLAMA_MODEL (e.g. qwen2:1.5b). "
                             "Runs locally; nothing auto-downloaded."}
        try:
            req = urllib.request.Request(
                f"{OLLAMA_BASE}/api/tags",
                headers={"User-Agent": "drishti-x/1.0"})
            with urllib.request.urlopen(req, timeout=5) as r:
                models = [m.get("name") for m in
                          jsonlib.loads(r.read().decode()).get("models", [])]
            if OLLAMA_MODEL not in models:
                return {"provider": self.name, "status": "NOT_CONFIGURED",
                        "detail": f"Model '{OLLAMA_MODEL}' not pulled. "
                                  f"Available: {models}. Pull it yourself; "
                                  f"DRISHTI-X never auto-downloads models."}
            return {"provider": self.name, "status": "READY", "model": OLLAMA_MODEL}
        except Exception as e:
            return {"provider": self.name, "status": "UNAVAILABLE",
                    "detail": f"Ollama unreachable at {OLLAMA_BASE}: {type(e).__name__}"}

    def summarize(self, text: str, max_sentences: int = 3) -> Dict:
        st = self.status()
        if st["status"] != "READY":
            return {**LocalTransformer().summarize(text, max_sentences),
                    "via": "local-fallback", "ollama": st["status"]}
        try:
            body = jsonlib.dumps({
                "model": OLLAMA_MODEL, "stream": False,
                "prompt": ("Summarize for a disaster officer in at most "
                           f"{max_sentences} short sentences. Facts only, no advice "
                           f"beyond the text:\n\n{text[:3000]}")}).encode()
            req = urllib.request.Request(
                f"{OLLAMA_BASE}/api/generate", data=body,
                headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as r:
                out = jsonlib.loads(r.read().decode()).get("response", "")
            return {"summary": out.strip(), "model": OLLAMA_MODEL,
                    "source": "Ollama-local", "data_status": "ANALYZED"}
        except Exception as e:
            return {**LocalTransformer().summarize(text, max_sentences),
                    "via": "local-fallback",
                    "note": f"Ollama failed: {type(e).__name__}"}


class LocalTransformer(AIProvider):
    name = "Local extractive summarizer (always available)"

    def status(self) -> Dict:
        return {"provider": self.name, "status": "READY",
                "detail": "Deterministic sentence extraction. No model, no cost."}

    def summarize(self, text: str, max_sentences: int = 3) -> Dict:
        sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s.strip()]
        scored = sorted(sents,
                        key=lambda s: len(set(s.lower().split()) & {
                            "risk", "flood", "rain", "landslide", "road",
                            "alert", "evacuate", "cyclone", "fire", "casualt",
                            "damage", "shelter", "warning"}),
                        reverse=True)
        top = (scored[:max_sentences] or sents[:max_sentences]) or ["No content."]
        return {"summary": " ".join(top), "model": "extractive-v0",
                "source": "local", "data_status": "ANALYZED"}


class HuggingFaceStub(AIProvider):
    name = "HuggingFace (optional)"

    def status(self) -> Dict:
        return {"provider": self.name, "status": "NOT_CONFIGURED",
                "needs": "HF_MODEL_ID (+ HF_TOKEN for gated models). "
                         "Prefer small open models; see docs/AI.md."}

    def summarize(self, text: str, max_sentences: int = 3) -> Dict:
        return {**LocalTransformer().summarize(text, max_sentences),
                "via": "local-fallback"}


def ai() -> AIProvider:
    if AI_PROVIDER == "ollama":
        return OllamaProvider()
    if AI_PROVIDER == "huggingface":
        return HuggingFaceStub()
    return LocalTransformer()


OUTPUT_CLASSES = ["OBSERVED", "ANALYZED", "ESTIMATED", "PREDICTED", "SIMULATED"]
