from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings

router = APIRouter(prefix="/api/v1/system", tags=["system"])


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/config")
def get_config(settings: Settings = Depends(get_settings)) -> dict[str, int | float]:
    return {
        "primary_timer_seconds": settings.primary_timer_seconds,
        "steal_timer_seconds": settings.steal_timer_seconds,
        "steal_points_factor": settings.steal_points_factor,
        "min_teams": settings.min_teams,
        "max_teams": settings.max_teams,
    }
