"""Synthetic telemetry generator for DRISHTI-X local dev.

Canonical implementation lives in services.telemetry_engine;
this module re-exports it so legacy `from .telemetry import make_packet`
imports keep working.
"""
from .services.telemetry_engine import make_packet  # noqa: F401

__all__ = ["make_packet"]
