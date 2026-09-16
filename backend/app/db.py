"""Database layer: PostgreSQL/PostGIS-ready, SQLite fallback for local dev.

- Set DATABASE_URL=postgresql+psycopg2://... for production.
- Default: local SQLite file (no server needed, demo-friendly).
- Spatial columns are stored as lat/lon floats; when PostGIS is available,
  use backend/app/services/spatial.py helpers which emit PostGIS SQL.
- Migrations: dev uses init_db(); production should adopt Alembic
  (schema is versioned via model_versions table + MODEL_SCHEMA_VERSION).
"""
from __future__ import annotations

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

MODEL_SCHEMA_VERSION = "v1"

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./drishti.db")
CONNECT_ARGS = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=CONNECT_ARGS, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def get_db():
    _ensure_ready()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


_ready = False


def _ensure_ready() -> None:
    """Lazy init: guarantees tables + demo seed even without startup event."""
    global _ready
    if _ready:
        return
    try:
        from .models import platform, geo  # noqa: F401
        Base.metadata.create_all(bind=engine)
        _migrate_additive()
        from .seed_demo import seed_demo
        from .seed_geo import seed_geo
        db = SessionLocal()
        try:
            seed_demo(db)
            seed_geo(db)
        finally:
            db.close()
        _ready = True
    except Exception:
        pass


def _migrate_additive() -> None:
    """Tiny additive migrations for pre-existing dev DBs (no data loss)."""
    try:
        from sqlalchemy import inspect, text
        cols = [c["name"] for c in inspect(engine).get_columns("field_reports")]
        if "status" not in cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE field_reports ADD COLUMN "
                                  "status VARCHAR(20) DEFAULT 'UNVERIFIED'"))
    except Exception:
        pass


def init_db() -> None:
    from .models import platform, geo  # noqa: F401  (register tables)
    Base.metadata.create_all(bind=engine)
