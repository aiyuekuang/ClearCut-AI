"""
ASR Service - Chinese/English speech recognition with word-level timestamps

Pipeline:
  1. Silero VAD → split audio into speech segments (skip long silences)
  2a. FunASR Paraformer → Chinese ASR (primary)
  2b. faster-whisper → English / fallback
  3. stable-ts → refine word-level timestamps
"""

import os
import tempfile
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import soundfile as sf
import torch

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lazy model singletons
# ---------------------------------------------------------------------------

_vad_model = None
_funasr_model = None
_whisper_model: dict = {}   # keyed by (model_size, device)


def _get_vad():
    global _vad_model
    if _vad_model is None:
        logger.info("[asr] Loading Silero VAD...")
        _vad_model, _ = torch.hub.load(
            repo_or_dir="snakers4/silero-vad",
            model="silero_vad",
            force_reload=False,
            onnx=False,
        )
        _vad_model.eval()
    return _vad_model


def _get_funasr():
    global _funasr_model
    if _funasr_model is None:
        logger.info("[asr] Loading FunASR Paraformer...")
        from funasr import AutoModel
        _funasr_model = AutoModel(
            model="paraformer-zh",
            model_revision="v2.0.4",
            punc_model="ct-punc",
            punc_model_revision="v2.0.4",
            vad_model="fsmn-vad",
            vad_model_revision="v2.0.4",
        )
    return _funasr_model


def _get_whisper(model_size: str = "large-v3"):
    global _whisper_model
    key = (model_size, "cuda" if torch.cuda.is_available() else "cpu")
    if key not in _whisper_model:
        logger.info("[asr] Loading faster-whisper %s on %s...", model_size, key[1])
        from faster_whisper import WhisperModel
        _whisper_model[key] = WhisperModel(model_size, device=key[1], compute_type="auto")
    return _whisper_model[key]


# ---------------------------------------------------------------------------
# VAD helpers
# ---------------------------------------------------------------------------

VAD_SAMPLE_RATE = 16000
VAD_WINDOW = 512   # samples per chunk for 16kHz

def _detect_speech_segments(
    audio: np.ndarray,
    sr: int,
    threshold: float = 0.5,
    min_silence_ms: int = 800,
    min_speech_ms: int = 300,
) -> list[dict]:
    """Return list of {start_s, end_s} speech segments."""
    if sr != VAD_SAMPLE_RATE:
        import librosa
        audio = librosa.resample(audio, orig_sr=sr, target_sr=VAD_SAMPLE_RATE)

    model = _get_vad()
    tensor = torch.FloatTensor(audio)

    from silero_vad import get_speech_timestamps
    timestamps = get_speech_timestamps(
        tensor,
        model,
        threshold=threshold,
        sampling_rate=VAD_SAMPLE_RATE,
        min_silence_duration_ms=min_silence_ms,
        min_speech_duration_ms=min_speech_ms,
    )

    return [
        {"start_s": t["start"] / VAD_SAMPLE_RATE, "end_s": t["end"] / VAD_SAMPLE_RATE}
        for t in timestamps
    ]


# ---------------------------------------------------------------------------
# Core transcribe function
# ---------------------------------------------------------------------------

def transcribe(
    audio_path: str,
    language: str = "zh",
    engine: str = "funasr",
    model_quality: str = "large",
) -> dict:
    """
    Transcribe audio and return structured result with word-level timestamps.

    Returns:
        {
          "text": str,
          "language": str,
          "words": [{"word": str, "start": float, "end": float, "confidence": float}],
          "segments": [...],
          "silence_segments": [{"start": float, "end": float}]
        }
    """
    audio, sr = sf.read(audio_path, always_2d=False)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)  # mono

    logger.info("[asr] Audio: %.1fs, sr=%d, engine=%s lang=%s", len(audio)/sr, sr, engine, language)

    # Detect silence regions first (used for both editor UI and subtitle gaps)
    silence_segments = _detect_silence(audio, sr)

    if language == "zh" and engine in ("funasr", "auto"):
        result = _transcribe_funasr(audio_path, audio, sr)
    else:
        model_size_map = {"large": "large-v3", "medium": "medium", "small": "small"}
        result = _transcribe_whisper(audio, sr, language, model_size_map.get(model_quality, "large-v3"))

    result["silence_segments"] = silence_segments
    return result


def _transcribe_funasr(audio_path: str, audio: np.ndarray, sr: int) -> dict:
    model = _get_funasr()
    res = model.generate(
        input=audio_path,
        return_raw_text=False,
        is_final=True,
        sentence_timestamp=True,
    )

    words = []
    segments = []
    full_text_parts = []

    for i, item in enumerate(res):
        seg_words = []
        text = item.get("text", "")
        full_text_parts.append(text)

        timestamps = item.get("timestamp", [])
        chars = list(text.replace(" ", ""))

        for j, (char, ts) in enumerate(zip(chars, timestamps)):
            w = {
                "word": char,
                "start": ts[0] / 1000.0,
                "end": ts[1] / 1000.0,
                "confidence": 0.95,
            }
            words.append(w)
            seg_words.append(w)

        if seg_words:
            segments.append({
                "id": i,
                "start": seg_words[0]["start"],
                "end": seg_words[-1]["end"],
                "text": text,
                "words": seg_words,
            })

    return {
        "text": "".join(full_text_parts),
        "language": "zh",
        "words": words,
        "segments": segments,
    }


def _transcribe_whisper(audio: np.ndarray, sr: int, language: str, model_size: str) -> dict:
    import stable_whisper

    model = stable_whisper.load_faster_whisper(model_size)
    result = model.transcribe_stable(audio, language=language if language != "auto" else None)

    words = []
    segments = []

    for i, seg in enumerate(result.segments):
        seg_words = []
        for w in seg.words or []:
            word_obj = {
                "word": w.word.strip(),
                "start": w.start,
                "end": w.end,
                "confidence": getattr(w, "probability", 0.9),
            }
            words.append(word_obj)
            seg_words.append(word_obj)

        segments.append({
            "id": i,
            "start": seg.start,
            "end": seg.end,
            "text": seg.text.strip(),
            "words": seg_words,
        })

    return {
        "text": result.text,
        "language": language,
        "words": words,
        "segments": segments,
    }


def _detect_silence(audio: np.ndarray, sr: int) -> list[dict]:
    """Detect silence segments not covered by speech."""
    speech = _detect_speech_segments(audio, sr)
    total_duration = len(audio) / sr
    silence = []

    prev_end = 0.0
    for seg in speech:
        if seg["start_s"] - prev_end > 0.3:
            silence.append({"start": prev_end, "end": seg["start_s"]})
        prev_end = seg["end_s"]

    if total_duration - prev_end > 0.3:
        silence.append({"start": prev_end, "end": total_duration})

    return silence


def detect_fillers(words: list[dict], filler_list: Optional[list[str]] = None) -> list[int]:
    """Return indices of words that are filler words."""
    default_fillers = {
        "嗯", "啊", "呢", "吧", "哦", "哈", "哎", "唉",
        "那个", "然后", "就是", "就是说", "对对对", "这个",
        "其实", "基本上", "大概", "差不多",
    }
    filler_set = set(filler_list) if filler_list else default_fillers
    return [i for i, w in enumerate(words) if w.get("word", "").strip() in filler_set]
