"""Subtitle generation API - SRT/ASS with template-based styling."""

import os
import tempfile

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class GenerateRequest(BaseModel):
    words: list                     # [{ word, start, end, confidence }]
    template_id: str = "classic-white"
    output_dir: str
    format: str = "ass"             # ass | srt | both
    words_per_line: int = 12
    max_line_width: int = 20


class PreviewRequest(BaseModel):
    text: str
    template_id: str = "classic-white"
    width: int = 640
    height: int = 360


@router.post("/subtitle/generate")
async def generate(req: GenerateRequest):
    """Generate ASS and/or SRT subtitle files from word-level timestamps."""
    try:
        os.makedirs(req.output_dir, exist_ok=True)
        result = {}

        from services.subtitle_service import generate_ass, generate_srt

        if req.format in ("ass", "both"):
            ass_path = os.path.join(req.output_dir, "subtitle.ass")
            generate_ass(
                words=req.words,
                template_id=req.template_id,
                output_path=ass_path,
                words_per_line=req.words_per_line,
                max_line_width=req.max_line_width,
            )
            result["ass_path"] = ass_path

        if req.format in ("srt", "both"):
            srt_path = os.path.join(req.output_dir, "subtitle.srt")
            generate_srt(
                words=req.words,
                output_path=srt_path,
                words_per_line=req.words_per_line,
                max_line_width=req.max_line_width,
            )
            result["srt_path"] = srt_path

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/subtitle/preview")
async def preview(req: PreviewRequest):
    """Generate a preview frame image (base64) with the subtitle rendered."""
    try:
        # Simple PIL-based text rendering for preview
        from PIL import Image, ImageDraw, ImageFont
        import base64, io, json
        from pathlib import Path

        # Load template
        tmpl_file = Path(__file__).parent.parent / "templates" / f"{req.template_id}.json"
        if not tmpl_file.exists():
            tmpl_file = Path(__file__).parent.parent / "templates" / "classic-white.json"
        with open(tmpl_file) as f:
            template = json.load(f)

        style = template.get("style", {})
        font_size = style.get("fontSize", 22)
        color_hex = style.get("primaryColor", "#FFFFFF").lstrip("#")
        r, g, b = int(color_hex[0:2], 16), int(color_hex[2:4], 16), int(color_hex[4:6], 16)

        img = Image.new("RGBA", (req.width, req.height), (30, 30, 30, 255))
        draw = ImageDraw.Draw(img)

        try:
            font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", font_size)
        except Exception:
            font = ImageFont.load_default()

        # Draw text centered near bottom
        bbox = draw.textbbox((0, 0), req.text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        x = (req.width - text_w) // 2
        y = req.height - text_h - style.get("marginV", 40)

        # Outline
        outline_color = style.get("outlineColor", "#000000").lstrip("#")
        or_, og, ob = int(outline_color[0:2], 16), int(outline_color[2:4], 16), int(outline_color[4:6], 16)
        outline_w = style.get("outlineWidth", 2)
        for dx in range(-outline_w, outline_w + 1):
            for dy in range(-outline_w, outline_w + 1):
                if dx != 0 or dy != 0:
                    draw.text((x + dx, y + dy), req.text, font=font, fill=(or_, og, ob, 255))

        draw.text((x, y), req.text, font=font, fill=(r, g, b, 255))

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return {"image_base64": base64.b64encode(buf.getvalue()).decode()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
