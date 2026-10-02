"""SIH26071 unified feature router.

This adapter keeps the original production DRISHTI-X application as the
canonical shell while exposing the imported SIH rainfall/nowcast/inundation
research capabilities under non-conflicting API namespaces.
"""
from fastapi import APIRouter

from .sih26071_inundation import router as inundation_router
from .sih26071_ml import router as ml_router
from .sih26071_nowcast import router as nowcast_router
from .sih26071_validation import router as validation_router
from .sih26071_impact import router as impact_router

router = APIRouter()
router.include_router(inundation_router, prefix="/api/sih26071/inundation", tags=["SIH26071 Inundation"])
router.include_router(ml_router, prefix="/api/sih26071/ml", tags=["SIH26071 ML"])
router.include_router(nowcast_router, tags=["SIH26071 Nowcast"])
router.include_router(validation_router, prefix="/api/sih26071/validation", tags=["SIH26071 Validation"])
router.include_router(impact_router, prefix="/api/sih26071/impact", tags=["SIH26071 Impact"])
