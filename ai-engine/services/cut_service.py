"""
Video/Audio cutting service with frame-accurate precision.

Adapted from podcastcut-skills (MIT):
  - cut_audio.py  → cut_audio() / detect_silences()
  - cut_video.sh  → cut_video()

Key design:
  - Video: filter_complex trim+concat + acrossfade for smooth audio transitions
  - Audio: decode to WAV first (avoids MP3 ~26ms frame boundary error), then atrim+concat
  - Both support edge buffer (margin) to avoid abrupt cuts
"""

import logging
import os
import re
import subprocess
import tempfile
from typing import Callable, Optional

logger = logging.getLogger(__name__)

# Defaults matching podcastcut-skills originals
DEFAULT_BUFFER_SEC = 0.05    # 50ms edge buffer around each cut
DEFAULT_CROSSFADE_SEC = 0.03  # 30ms audio crossfade at cut points


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _get_duration(file_path: str) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", file_path],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())


def _expand_and_merge(
    delete_segments: list[dict],
    total_duration: float,
    buffer_sec: float,
) -> list[dict]:
    """Expand each segment by buffer on both sides, then merge overlapping ones."""
    expanded = sorted(
        [
            {
                "start": max(0.0, s["start"] - buffer_sec),
                "end": min(total_duration, s["end"] + buffer_sec),
            }
            for s in delete_segments
        ],
        key=lambda x: x["start"],
    )
    merged: list[dict] = []
    for seg in expanded:
        if merged and seg["start"] <= merged[-1]["end"]:
            merged[-1]["end"] = max(merged[-1]["end"], seg["end"])
        else:
            merged.append(dict(seg))
    return merged


def _compute_keep_segments(
    delete_segments: list[dict],
    total_duration: float,
) -> list[tuple[float, float]]:
    """Invert delete list into keep list."""
    keep: list[tuple[float, float]] = []
    cursor = 0.0
    for seg in sorted(delete_segments, key=lambda x: x["start"]):
        if seg["start"] > cursor:
            keep.append((cursor, seg["start"]))
        cursor = seg["end"]
    if cursor < total_duration:
        keep.append((cursor, total_duration))
    return keep


# ---------------------------------------------------------------------------
# cut_video  (adapted from cut_video.sh)
# ---------------------------------------------------------------------------

def cut_video(
    input_path: str,
    delete_segments: list[dict],
    output_path: str,
    buffer_sec: float = DEFAULT_BUFFER_SEC,
    crossfade_sec: float = DEFAULT_CROSSFADE_SEC,
    on_progress: Optional[Callable[[float], None]] = None,
) -> dict:
    """
    Cut a video file by removing the specified segments.

    Uses FFmpeg filter_complex for frame-accurate cuts with audio acrossfade.

    Args:
        input_path:       Source video file (MP4/MOV/AVI/MKV)
        delete_segments:  List of {start, end} dicts (seconds) to remove
        output_path:      Destination video file
        buffer_sec:       Edge margin added around each cut (avoids abrupt transitions)
        crossfade_sec:    Audio crossfade duration at cut points
        on_progress:      Optional callback(0.0–1.0) for progress reporting

    Returns:
        {original_duration, final_duration, deleted_count, deleted_time,
         compression_ratio, output_path}
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input not found: {input_path}")

    total_duration = _get_duration(input_path)
    merged = _expand_and_merge(delete_segments, total_duration, buffer_sec)
    keep = _compute_keep_segments(merged, total_duration)

    if not keep:
        raise ValueError("All segments would be deleted — nothing to output.")

    deleted_time = sum(s["end"] - s["start"] for s in merged)
    logger.info(
        "[cut_video] keep=%d del=%d deleted=%.1fs total=%.1fs",
        len(keep), len(merged), deleted_time, total_duration,
    )

    if on_progress:
        on_progress(0.1)

    # Build filter_complex ─ trim each keep segment independently
    filters: list[str] = []
    n = len(keep)
    for i, (start, end) in enumerate(keep):
        filters.append(
            f"[0:v]trim=start={start:.4f}:end={end:.4f},setpts=PTS-STARTPTS[v{i}]"
        )
        filters.append(
            f"[0:a]atrim=start={start:.4f}:end={end:.4f},asetpts=PTS-STARTPTS[a{i}]"
        )

    # Video: simple concat
    filters.append("".join(f"[v{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0[outv]")

    # Audio: acrossfade chain for smooth transitions at cut points
    if n == 1:
        filters.append("[a0]anull[outa]")
    else:
        cur = "a0"
        for i in range(1, n):
            nxt = f"a{i}"
            out = "outa" if i == n - 1 else f"amid{i}"
            filters.append(
                f"[{cur}][{nxt}]acrossfade=d={crossfade_sec:.3f}:c1=tri:c2=tri[{out}]"
            )
            cur = out

    filter_complex = ";".join(filters)

    if on_progress:
        on_progress(0.2)

    # Write filter to temp file to avoid shell quoting issues with complex graphs
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as tf:
        filter_file = tf.name
        tf.write(filter_complex)

    try:
        cmd = [
            "ffmpeg", "-y", "-i", f"file:{input_path}",
            "-filter_complex_script", filter_file,
            "-map", "[outv]", "-map", "[outa]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-c:a", "aac", "-b:a", "192k",
            f"file:{output_path}",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg error:\n{result.stderr[-1500:]}")
    finally:
        os.unlink(filter_file)

    if on_progress:
        on_progress(1.0)

    final_duration = _get_duration(output_path)
    return {
        "original_duration": total_duration,
        "final_duration": final_duration,
        "deleted_count": len(merged),
        "deleted_time": deleted_time,
        "compression_ratio": round(1 - final_duration / total_duration, 4),
        "output_path": output_path,
    }


# ---------------------------------------------------------------------------
# cut_audio  (adapted from cut_audio.py)
# ---------------------------------------------------------------------------

def cut_audio(
    input_path: str,
    delete_segments: list[dict],
    output_path: str,
    buffer_sec: float = DEFAULT_BUFFER_SEC,
    on_progress: Optional[Callable[[float], None]] = None,
) -> dict:
    """
    Cut an audio-only file with sample-accurate precision.

    Decodes to PCM WAV first to avoid MP3 frame-boundary ~26ms rounding errors,
    then uses atrim+concat filter_complex to splice keep segments.

    Args:
        input_path:      Source audio (MP3/M4A/WAV/FLAC)
        delete_segments: List of {start, end} dicts (seconds) to remove
        output_path:     Destination audio file (format inferred from extension)
        buffer_sec:      Edge margin around each cut
        on_progress:     Optional callback(0.0–1.0)
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input not found: {input_path}")

    total_duration = _get_duration(input_path)
    merged = _expand_and_merge(delete_segments, total_duration, buffer_sec)
    keep = _compute_keep_segments(merged, total_duration)

    if not keep:
        raise ValueError("All segments would be deleted — nothing to output.")

    deleted_time = sum(s["end"] - s["start"] for s in merged)
    logger.info(
        "[cut_audio] keep=%d del=%d deleted=%.1fs total=%.1fs",
        len(keep), len(merged), deleted_time, total_duration,
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        temp_wav = os.path.join(tmpdir, "source.wav")

        if on_progress:
            on_progress(0.1)

        # Step 1: decode to WAV for sample-accurate cutting
        subprocess.run(
            ["ffmpeg", "-v", "quiet", "-i", input_path,
             "-c:a", "pcm_s16le", "-y", temp_wav],
            check=True,
        )

        if on_progress:
            on_progress(0.35)

        # Step 2: build filter_complex atrim+concat
        filter_parts: list[str] = []
        for i, (start, end) in enumerate(keep):
            filter_parts.append(
                f"[0:a]atrim=start={start:.4f}:end={end:.4f},asetpts=N/SR/TB[p{i}]"
            )
        concat_in = "".join(f"[p{i}]" for i in range(len(keep)))
        filter_parts.append(f"{concat_in}concat=n={len(keep)}:v=0:a=1[out]")

        filter_file = os.path.join(tmpdir, "filter.txt")
        with open(filter_file, "w") as f:
            f.write(";\n".join(filter_parts))

        if on_progress:
            on_progress(0.5)

        # Step 3: apply filter and encode
        subprocess.run(
            ["ffmpeg", "-y", "-i", temp_wav,
             "-filter_complex_script", filter_file,
             "-map", "[out]", output_path],
            check=True,
        )

    if on_progress:
        on_progress(1.0)

    final_duration = _get_duration(output_path)
    return {
        "original_duration": total_duration,
        "final_duration": final_duration,
        "deleted_count": len(merged),
        "deleted_time": deleted_time,
        "compression_ratio": round(1 - final_duration / total_duration, 4),
        "output_path": output_path,
    }


# ---------------------------------------------------------------------------
# detect_silences  (adapted from trim_silences.py)
# ---------------------------------------------------------------------------

def detect_silences(
    audio_path: str,
    threshold_sec: float = 0.8,
    noise_db: float = -30.0,
) -> list[dict]:
    """
    Detect silence segments via FFmpeg silencedetect filter.

    Args:
        audio_path:     Audio or video file to scan
        threshold_sec:  Minimum silence duration to report (seconds)
        noise_db:       Noise floor threshold in dBFS (negative value)

    Returns:
        List of {start, end, duration} for each detected silence.
    """
    cmd = [
        "ffmpeg", "-i", audio_path,
        "-af", f"silencedetect=noise={noise_db:.0f}dB:d={threshold_sec}",
        "-f", "null", "-",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    silences: list[dict] = []
    for line in result.stderr.split("\n"):
        m = re.search(
            r"silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)", line
        )
        if m:
            end = float(m.group(1))
            dur = float(m.group(2))
            silences.append({"start": round(end - dur, 4), "end": round(end, 4), "duration": round(dur, 4)})

    return silences


# ---------------------------------------------------------------------------
# words_to_delete_segments  (helper for TranscriptEditor integration)
# ---------------------------------------------------------------------------

def words_to_delete_segments(
    words: list[dict],
    word_indices: list[int],
    merge_gap_sec: float = 0.1,
) -> list[dict]:
    """
    Convert a list of deleted word indices into time segments for cutting.

    This bridges the TranscriptEditor (which tracks deleted words by index)
    with cut_video/cut_audio (which consume {start, end} segment lists).

    Args:
        words:          Word list with {start, end} fields (from ASR output)
        word_indices:   Indices of words marked as deleted in the editor
        merge_gap_sec:  Merge adjacent segments with gap < this value

    Returns:
        List of {start, end} segments ready for cut_video/cut_audio.
    """
    if not word_indices:
        return []

    raw = [
        {"start": words[i]["start"], "end": words[i]["end"]}
        for i in sorted(set(word_indices))
        if 0 <= i < len(words)
    ]
    if not raw:
        return []

    merged = [raw[0]]
    for seg in raw[1:]:
        if seg["start"] - merged[-1]["end"] < merge_gap_sec:
            merged[-1]["end"] = seg["end"]
        else:
            merged.append(dict(seg))

    return merged
