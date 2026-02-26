"""Transcription API - ASR with word-level timestamps.

Job-based async flow:
  POST /transcribe/start      → { job_id }
  GET  /transcribe/status/:id → { status, progress, result? }
  DELETE /transcribe/jobs/:id → cancel
  POST /transcribe/detect-fillers   → { filler_indices }
  POST /transcribe/detect-silence   → { silence_segments }
"""

import asyncio
import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

router = APIRouter()

# In-memory job store (sufficient for single-user desktop app)
_jobs: dict = {}


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class StartRequest(BaseModel):
    audio_path: str
    project_id: str
    language: str = "zh"        # zh | en | auto
    engine: str = "funasr"      # funasr | whisper
    model_quality: str = "large"


class FillerRequest(BaseModel):
    words: list
    filler_list: Optional[list[str]] = None


class SilenceRequest(BaseModel):
    audio_path: str
    threshold: float = -35.0    # dB
    min_duration: float = 0.8   # seconds


# ---------------------------------------------------------------------------
# Job lifecycle
# ---------------------------------------------------------------------------

def _run_transcription(job_id: str, req: StartRequest):
    """Run in thread pool - updates job state when done."""
    try:
        _jobs[job_id]["status"] = "processing"
        _jobs[job_id]["progress"] = 10

        from services.asr_service import transcribe
        result = transcribe(
            audio_path=req.audio_path,
            language=req.language,
            engine=req.engine,
            model_quality=req.model_quality,
        )

        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["progress"] = 100
        _jobs[job_id]["result"] = result

    except Exception as e:
        _jobs[job_id]["status"] = "error"
        _jobs[job_id]["error"] = str(e)
        import traceback
        traceback.print_exc()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/transcribe/start")
async def start_transcription(req: StartRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "pending",
        "progress": 0,
        "result": None,
        "error": None,
    }
    # Run in thread pool so FastAPI event loop isn't blocked
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, _run_transcription, job_id, req)
    return {"job_id": job_id}


@router.get("/transcribe/status/{job_id}")
async def get_status(job_id: str):
    job = _jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.delete("/transcribe/jobs/{job_id}")
async def cancel_job(job_id: str):
    if job_id in _jobs:
        _jobs.pop(job_id, None)
    return {"ok": True}


@router.post("/transcribe/detect-fillers")
async def detect_fillers(req: FillerRequest):
    from services.asr_service import detect_fillers
    indices = detect_fillers(req.words, req.filler_list)
    return {"filler_indices": indices}


@router.post("/transcribe/detect-silence")
async def detect_silence(req: SilenceRequest):
    """Detect silence segments using ffmpeg silence detection (no model needed)."""
    import subprocess
    import json
    import re

    try:
        result = subprocess.run(
            [
                "ffmpeg", "-i", req.audio_path,
                "-af", f"silencedetect=noise={int(req.threshold)}dB:d={req.min_duration}",
                "-f", "null", "-",
            ],
            capture_output=True,
            text=True,
        )
        output = result.stderr

        # Parse ffmpeg silence_start / silence_end lines
        starts = [float(m) for m in re.findall(r"silence_start: (\d+\.?\d*)", output)]
        ends = [float(m) for m in re.findall(r"silence_end: (\d+\.?\d*)", output)]

        segments = [
            {"start": s, "end": e}
            for s, e in zip(starts, ends)
        ]
        return {"silence_segments": segments}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
