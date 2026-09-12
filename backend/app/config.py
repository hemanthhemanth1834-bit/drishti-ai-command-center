import os

# DRISHTI-X offline + sovereign defaults
# No live secrets here — override locally via .env files only.
DEV_GATEWAY_KEY = os.getenv("GATEWAY_KEY", "drishti-mesh-dev-key-2025")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

TELEMETRY_HZ = float(os.getenv("TELEMETRY_HZ", "2"))
