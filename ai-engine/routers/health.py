"""Health check endpoint for sidecar lifecycle management."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "ok", "engine": "clearcut-ai", "version": "0.1.0"}
