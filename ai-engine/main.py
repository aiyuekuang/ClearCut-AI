"""ClearCut-AI Python Sidecar - FastAPI AI Engine

Provides ASR transcription, VAD silence detection, subtitle generation,
and LLM-powered content analysis via REST API.

Electron starts this process on port 18721.
"""

import argparse
import logging
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import transcribe, analyze, subtitle, health, cut, llm

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("clearcut-ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    logger.info("ClearCut-AI engine starting...")
    # Models loaded lazily on first request
    yield
    logger.info("ClearCut-AI engine stopped.")


app = FastAPI(
    title="ClearCut-AI Engine",
    version="0.1.0",
    lifespan=lifespan,
)

# Allow Electron renderer (localhost) to call directly if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# All routes - no prefix (health at /health, rest at /transcribe, /subtitle, /analyze)
app.include_router(health.router, tags=["health"])
app.include_router(transcribe.router, tags=["transcribe"])
app.include_router(subtitle.router, tags=["subtitle"])
app.include_router(analyze.router, tags=["analyze"])
app.include_router(cut.router)
app.include_router(llm.router, tags=["llm"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=18721)
    parser.add_argument("--host", type=str, default="127.0.0.1")
    args = parser.parse_args()

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")
