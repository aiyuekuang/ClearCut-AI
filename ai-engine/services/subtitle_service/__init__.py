"""
Subtitle generation service using pysubs2

Supports:
- ASS (Advanced SubStation Alpha) - for styled / karaoke subtitles
- SRT (SubRip Text) - for basic subtitles

Template configs are loaded from ai-engine/templates/*.json
"""

import json
import logging
from pathlib import Path

import pysubs2

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"


def _load_template(template_id: str) -> dict:
    template_file = TEMPLATES_DIR / f"{template_id}.json"
    if not template_file.exists():
        template_file = TEMPLATES_DIR / "classic-white.json"
    with open(template_file) as f:
        return json.load(f)


def _parse_color(hex_color: str) -> tuple:
    """Return (R, G, B, A) from #RRGGBB hex string."""
    if hex_color in ("transparent", "none"):
        return (0, 0, 0, 255)  # fully transparent in ASS
    h = hex_color.lstrip("#")
    if len(h) == 6:
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        return r, g, b, 0
    return 255, 255, 255, 0


def _build_ass_style(template: dict) -> pysubs2.SSAStyle:
    cfg = template.get("style", {})
    style = pysubs2.SSAStyle()
    style.fontname = cfg.get("fontFamily", "PingFang SC")
    style.fontsize = cfg.get("fontSize", 22)
    style.bold = cfg.get("fontWeight", "normal") == "bold"
    style.primarycolor = pysubs2.Color(*_parse_color(cfg.get("primaryColor", "#FFFFFF")))
    style.outlinecolor = pysubs2.Color(*_parse_color(cfg.get("outlineColor", "#000000")))
    style.outline = cfg.get("outlineWidth", 2)
    style.shadow = cfg.get("shadowOffset", 0)
    style.alignment = cfg.get("alignment", 2)
    style.marginv = cfg.get("marginV", 40)
    return style


def _group_words_into_lines(
    words: list,
    words_per_line: int = 12,
    max_line_width: int = 20,
) -> list:
    """Group word dicts into subtitle lines."""
    lines = []
    current_line: list = []
    current_width = 0

    for word in words:
        word_len = len(word.get("word", ""))
        force_break = (
            any(p in word.get("word", "") for p in "。！？\n")
            or current_width + word_len > max_line_width
            or len(current_line) >= words_per_line
        )

        if force_break and current_line:
            lines.append(current_line)
            current_line = []
            current_width = 0

        current_line.append(word)
        current_width += word_len

    if current_line:
        lines.append(current_line)

    return lines


def generate_ass(
    words: list,
    template_id: str,
    output_path: str,
    words_per_line: int = 12,
    max_line_width: int = 20,
) -> str:
    """Generate an ASS subtitle file and return its path."""
    template = _load_template(template_id)
    anim = template.get("animation", {})
    anim_type = anim.get("type", "none")

    subs = pysubs2.SSAFile()
    subs.styles["Default"] = _build_ass_style(template)

    for line_words in _group_words_into_lines(words, words_per_line, max_line_width):
        if not line_words:
            continue

        start_ms = int(line_words[0]["start"] * 1000)
        end_ms = int(line_words[-1]["end"] * 1000)

        if anim_type == "karaoke":
            parts = []
            for w in line_words:
                cs = max(1, int((w["end"] - w["start"]) * 100))
                parts.append(f"{{\\k{cs}}}{w['word']}")
            text = "".join(parts)
        elif anim_type == "fade":
            fi = anim.get("fadeInMs", 300)
            fo = anim.get("fadeOutMs", 300)
            text = "{\\fad(" + str(fi) + "," + str(fo) + ")}" + "".join(w["word"] for w in line_words)
        else:
            text = "".join(w["word"] for w in line_words)

        subs.append(pysubs2.SSAEvent(start=start_ms, end=end_ms, text=text))

    subs.save(output_path)
    logger.info("[subtitle] ASS saved: %s (%d lines)", output_path, len(subs))
    return output_path


def generate_srt(
    words: list,
    output_path: str,
    words_per_line: int = 12,
    max_line_width: int = 20,
) -> str:
    """Generate a plain SRT subtitle file and return its path."""
    subs = pysubs2.SSAFile()
    for line_words in _group_words_into_lines(words, words_per_line, max_line_width):
        if not line_words:
            continue
        start_ms = int(line_words[0]["start"] * 1000)
        end_ms = int(line_words[-1]["end"] * 1000)
        text = "".join(w["word"] for w in line_words)
        subs.append(pysubs2.SSAEvent(start=start_ms, end=end_ms, text=text))

    subs.save(output_path, format_="srt")
    logger.info("[subtitle] SRT saved: %s (%d lines)", output_path, len(subs))
    return output_path
