# LOCAL-DEVELOPMENT.md — 5-minute start

```bash
git clone https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center.git
cd drishti-ai-command-center
npm install && cp .env.example .env.local && npm run dev   # :3000
cd backend && pip install -r requirements.txt
python -m ml.train --samples 3000                          # demo model (git-ignored artifacts)
uvicorn app.main:app --port 8000                           # docs at /docs
```

Tour: `/welcome` → `/regions` (pick Vijayawada/Hyderabad) → `/risk-map` → `/prediction` → `/incidents` → `/offline` (airplane-mode test) → `/nesafe`.
Useful: `python -m pytest -q` (backend), `npm run typecheck|lint|build` (frontend).
Ollama (optional): install Ollama, `ollama pull qwen2:1.5b`, set `AI_PROVIDER=ollama OLLAMA_MODEL=qwen2:1.5b`, restart backend.
