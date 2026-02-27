"""
Cut API — video/audio cutting endpoints.

IPC channels (via Electron preload):
  POST /cut/video            → cut video file, return stats
  POST /cut/audio            → cut audio-only file
  POST /cut/detect-silences  → scan for silence segments
  POST /cut/words-to-segments → convert editor word indices → time segments
"""

import asyncio
import logging
import os
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.cut_service import (
    cut_audio,
    cut_video,
    detect_silences,
    words_to_delete_segments,
)

router = APIRouter(prefix="/cut", tags=["cut"])
logger = logging.getLogger(__name__)

# Run blocking FFmpeg calls in a thread pool (keeps event loop free)
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="cut-worker")


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class Segment(BaseModel):
    start: float
    end: float


class CutVideoRequest(BaseModel):
    input_path: str
    output_path: str
    delete_segments: list[Segment]
    buffer_sec: float = Field(default=0.05, ge=0.0, le=1.0)
    crossfade_sec: float = Field(default=0.03, ge=0.0, le=0.5)


class CutAudioRequest(BaseModel):
    input_path: str
    output_path: str
    delete_segments: list[Segment]
    buffer_sec: float = Field(default=0.05, ge=0.0, le=1.0)


class DetectSilencesRequest(BaseModel):
    audio_path: str
    threshold_sec: float = Field(default=0.8, gt=0.0)
    noise_db: float = Field(default=-30.0, le=0.0)


class WordsToSegmentsRequest(BaseModel):
    words: list[dict]        # [{start, end, word, ...}]
    word_indices: list[int]  # indices of deleted words from TranscriptEditor
    merge_gap_sec: float = Field(default=0.1, ge=0.0)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/video")
async def cut_video_endpoint(req: CutVideoRequest):
    """
    Cut a video file by removing specified time segments.

    Segments are expanded by buffer_sec on each side and merged before cutting.
    Uses filter_complex trim+concat with acrossfade for smooth audio transitions.
    """
    if not os.path.exists(req.input_path):
        raise HTTPException(404, f"Input file not found: {req.input_path}")

    segments = [{"start": s.start, "end": s.end} for s in req.delete_segments]
    loop = asyncio.get_event_loop()

    try:
        result = await loop.run_in_executor(
            _executor,
            lambda: cut_video(
                req.input_path,
                segments,
                req.output_path,
                req.buffer_sec,
                req.crossfade_sec,
            ),
        )
        return {"status": "success", **result}
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))
    except ValueError as e:
        raise HTTPException(400, str(e))
    except RuntimeError as e:
        logger.error("[cut/video] FFmpeg error: %s", e)
        raise HTTPException(500, str(e))


@router.post("/audio")
async def cut_audio_endpoint(req: CutAudioRequest):
    """
    Cut an audio-only file with sample-accurate precision.

    Decodes to WAV internally to avoid MP3 frame boundary ~26ms rounding errors.
    """
    if not os.path.exists(req.input_path):
        raise HTTPException(404, f"Input file not found: {req.input_path}")

    segments = [{"start": s.start, "end": s.end} for s in req.delete_segments]
    loop = asyncio.get_event_loop()

    try:
        result = await loop.run_in_executor(
            _executor,
            lambda: cut_audio(req.input_path, segments, req.output_path, req.buffer_sec),
        )
        return {"status": "success", **result}
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))
    except ValueError as e:
        raise HTTPException(400, str(e))
    except RuntimeError as e:
        logger.error("[cut/audio] FFmpeg error: %s", e)
        raise HTTPException(500, str(e))


@router.post("/detect-silences")
async def detect_silences_endpoint(req: DetectSilencesRequest):
    """
    Scan an audio/video file for silence segments.

    Returns segments longer than threshold_sec at or below noise_db.
    Use the results to auto-mark silent regions in the TranscriptEditor.
    """
    if not os.path.exists(req.audio_path):
        raise HTTPException(404, f"File not found: {req.audio_path}")

    loop = asyncio.get_event_loop()
    try:
        silences = await loop.run_in_executor(
            _executor,
            lambda: detect_silences(req.audio_path, req.threshold_sec, req.noise_db),
        )
        return {"status": "success", "silences": silences, "count": len(silences)}
    except Exception as e:
        logger.error("[cut/detect-silences] Error: %s", e)
        raise HTTPException(500, str(e))


@router.post("/words-to-segments")
async def words_to_segments_endpoint(req: WordsToSegmentsRequest):
    """
    Convert deleted word indices (from TranscriptEditor) into time segments.

    This is a pure-Python transform — no FFmpeg involved, responds immediately.

    Workflow:
      TranscriptEditor marks words deleted (by index)
        → POST /cut/words-to-segments → [{start, end}, ...]
        → POST /cut/video with those segments → output file
    """
    segments = words_to_delete_segments(req.words, req.word_indices, req.merge_gap_sec)
    return {"status": "success", "segments": segments, "count": len(segments)}
