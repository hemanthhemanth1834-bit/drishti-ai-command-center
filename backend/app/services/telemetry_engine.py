"""Live coordinate simulation & drift loops (Hyderabad ref 17.3757, 78.4669)."""
import math
import random
import time
import uuid


def make_packet(tick: int, scenario: str = "nominal") -> dict:
    now = time.time()
    base_lat, base_lon = 17.3850, 78.4867  # Hyderabad ref

    if scenario == "storm":
        alt_noise = random.uniform(-120, 120)
        batt_drain = 0.08
        sig = random.uniform(35, 65)
    elif scenario == "swarm-surge":
        alt_noise = random.uniform(-30, 30)
        batt_drain = 0.05
        sig = random.uniform(70, 98)
    elif scenario == "gps-denied":
        alt_noise = random.uniform(-50, 50)
        batt_drain = 0.04
        sig = random.uniform(5, 25)
    else:  # nominal
        alt_noise = random.uniform(-15, 15)
        batt_drain = 0.02
        sig = random.uniform(75, 99)

    return {
        "id": str(uuid.uuid4())[:8],
        "tick": tick,
        "ts": now,
        "scenario": scenario,
        "drone_id": f"DRX-{random.randint(1, 12):02d}",
        "lat": base_lat + 0.02 * math.sin(tick / 12.0) + random.uniform(-0.001, 0.001),
        "lon": base_lon + 0.02 * math.cos(tick / 15.0) + random.uniform(-0.001, 0.001),
        "alt_m": 120 + 10 * math.sin(tick / 8.0) + alt_noise,
        "speed_ms": max(0, 18 + 4 * math.sin(tick / 10.0) + random.uniform(-1, 1)),
        "battery_pct": max(0, 100 - tick * batt_drain),
        "signal_pct": sig,
        "temp_c": 32 + random.uniform(-2, 4),
        "mode": "AUTO-MESH" if scenario != "gps-denied" else "DEAD-RECKONING",
    }
