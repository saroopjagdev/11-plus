"""Generates a static Instagram carousel: a sequence of N still PNG cards
(cover -> N content slides -> CTA) sharing the same bold-text-over-dark-
backdrop branding as `generate_reel.py`'s text cards, but laid out for a
static square/4:5 post instead of a 9:16 video overlay.

`render_card_png()` in generate_reel.py renders a *transparent* 1080x1920
PNG meant to be composited over a looping background video with ffmpeg —
there's no video here, so this script reuses its text-wrapping/glyph-
stripping helpers and its visual language (centered wrapped text, black
stroke outline, semi-transparent dark backdrop bar) but paints its own
opaque gradient background sized for the carousel's aspect ratio.

Output lands in R2 under `carousels/<template>__<slug>__<timestamp>/` as
`slide_01.png` .. `slide_NN.png` plus a `metadata.json` sidecar (same
sidecar convention as generate_reel.py's `<filename>.json`, just one level
up since a carousel is a set of images rather than a single file).

Usage:
  R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=... R2_ENDPOINT_URL=... \
  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... OPENAI_API_KEY=... \
  python scripts/generate_carousel.py [--dry-run] [--template vocab|tip] [--count 5] [--aspect portrait|square]
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

from generate_reel import (
    CTA_TEXT,
    FONT_BOLD,
    FONT_EXTRABOLD,
    SAVE_TEXT,
    slugify,
    strip_unsupported_glyphs,
    wrap_text,
)
from reel_common import (
    create_r2_client,
    create_temp_dir,
    get_env,
    load_env_files,
    logger,
    upload_file_to_r2,
)
from tip_content import TipContentError, get_verified_tip
from vocab_content import VocabContentError, get_random_vocabulary_word


# Instagram recommends 4:5 for feed carousels — it claims more vertical
# space in-feed than 1:1 without being cropped the way 9:16 is outside
# Stories/Reels. `--aspect square` switches to the classic 1:1 instead.
ASPECT_SIZES = {
    "portrait": (1080, 1350),
    "square": (1080, 1080),
}

# Same dark backdrop-bar colour as generate_reel.py's render_card_png, used
# here as the gradient's darker end so slides read as "the same brand" when
# a reel and a carousel post appear back-to-back in-feed.
BAR_FILL = (10, 10, 20)
GRADIENT_TOP = (26, 24, 46)
GRADIENT_BOTTOM = (9, 9, 17)

DEFAULT_COUNT = 5


class CarouselGenerationError(RuntimeError):
    pass


@dataclass
class Slide:
    text: str
    font_path: Path
    font_size: int
    subtext: str | None = None
    subtext_font_size: int = 40


def render_gradient_background(width: int, height: int) -> Image.Image:
    """Paints a simple vertical gradient (dark violet -> near-black) as the
    carousel's opaque background — render_card_png has no equivalent since
    it renders onto a transparent layer for video compositing instead.
    """
    img = Image.new("RGB", (width, height))
    pixels = img.load()
    for y in range(height):
        t = y / max(height - 1, 1)
        row = tuple(
            int(GRADIENT_TOP[channel] + (GRADIENT_BOTTOM[channel] - GRADIENT_TOP[channel]) * t)
            for channel in range(3)
        )
        for x in range(width):
            pixels[x, y] = row
    return img.convert("RGBA")


def render_carousel_card_png(
    slide: Slide,
    output_path: Path,
    *,
    width: int,
    height: int,
    slide_number: int,
    total_slides: int,
) -> None:
    """Renders one opaque carousel slide: gradient background, centered
    word-wrapped title text in the same stroked-white-over-dark-bar style as
    render_card_png, an optional smaller subtext block underneath (used for
    a vocab word's example sentence), and a small "n/total" page indicator
    in the corner so viewers can tell it's part of a swipeable set.
    """
    img = render_gradient_background(width, height)
    draw = ImageDraw.Draw(img)

    font = ImageFont.truetype(str(slide.font_path), slide.font_size)
    max_text_width = int(width * 0.84)
    lines = wrap_text(draw, strip_unsupported_glyphs(slide.text), font, max_text_width)

    sub_font = None
    sub_lines: list[str] = []
    if slide.subtext:
        sub_font = ImageFont.truetype(str(FONT_BOLD), slide.subtext_font_size)
        sub_lines = wrap_text(draw, strip_unsupported_glyphs(slide.subtext), sub_font, max_text_width)

    ascent, descent = font.getmetrics()
    line_height = ascent + descent
    line_spacing = int(line_height * 1.3)
    title_block_height = line_spacing * len(lines)

    sub_line_spacing = 0
    sub_block_height = 0
    gap_between = 0
    if sub_lines and sub_font is not None:
        sub_ascent, sub_descent = sub_font.getmetrics()
        sub_line_spacing = int((sub_ascent + sub_descent) * 1.3)
        sub_block_height = sub_line_spacing * len(sub_lines)
        gap_between = int(line_height * 0.6)

    total_block_height = title_block_height + gap_between + sub_block_height
    start_y = (height - total_block_height) // 2

    all_widths = [draw.textbbox((0, 0), line, font=font)[2] for line in lines]
    all_widths += [draw.textbbox((0, 0), line, font=sub_font)[2] for line in sub_lines] if sub_lines else []
    max_line_width = max(all_widths) if all_widths else 0

    pad_x, pad_y = 70, 55
    bar_left = (width - max_line_width) // 2 - pad_x
    bar_right = (width + max_line_width) // 2 + pad_x
    bar_top = start_y - pad_y
    bar_bottom = start_y + total_block_height + pad_y
    draw.rounded_rectangle(
        [max(bar_left, 20), bar_top, min(bar_right, width - 20), bar_bottom],
        radius=40,
        fill=(*BAR_FILL, 165) if img.mode == "RGBA" else BAR_FILL,
    )

    y = start_y
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        line_width = bbox[2] - bbox[0]
        x = (width - line_width) // 2
        draw.text((x, y), line, font=font, fill=(255, 255, 255, 255), stroke_width=3, stroke_fill=(0, 0, 0, 255))
        y += line_spacing

    if sub_lines and sub_font is not None:
        y += gap_between
        for line in sub_lines:
            bbox = draw.textbbox((0, 0), line, font=sub_font)
            line_width = bbox[2] - bbox[0]
            x = (width - line_width) // 2
            draw.text(
                (x, y),
                line,
                font=sub_font,
                fill=(230, 230, 235, 255),
                stroke_width=2,
                stroke_fill=(0, 0, 0, 255),
            )
            y += sub_line_spacing

    # Small page indicator, bottom-right — purely functional (tells a
    # viewer scrubbing through it's part of a set), not a brand mark.
    indicator_font = ImageFont.truetype(str(FONT_BOLD), 32)
    indicator_text = f"{slide_number}/{total_slides}"
    bbox = draw.textbbox((0, 0), indicator_text, font=indicator_font)
    ind_w, ind_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        (width - ind_w - 40, height - ind_h - 50),
        indicator_text,
        font=indicator_font,
        fill=(255, 255, 255, 200),
        stroke_width=2,
        stroke_fill=(0, 0, 0, 255),
    )

    img.convert("RGB").save(output_path)


def build_slide_sequence(template: str, count: int) -> tuple[list[Slide], dict[str, Any], str]:
    """Returns (slides, content_metadata, filename_slug) for the chosen
    template. Mirrors generate_reel.py's build_card_sequence shape (cover
    hook -> content -> CTA) but with `count` distinct content items instead
    of a single word/tip, since a carousel's whole premise is "N things to
    know" rather than one card's worth of content.
    """
    if template == "vocab":
        entries: list[dict[str, Any]] = []
        seen_words: set[str] = set()
        attempts = 0
        max_attempts = count * 6
        while len(entries) < count and attempts < max_attempts:
            attempts += 1
            try:
                entry = get_random_vocabulary_word(
                    supabase_url=get_env("NEXT_PUBLIC_SUPABASE_URL"),
                    service_role_key=get_env("SUPABASE_SERVICE_ROLE_KEY"),
                )
            except VocabContentError:
                break
            key = entry["word"].lower()
            if key in seen_words:
                continue
            seen_words.add(key)
            entries.append(entry)

        if len(entries) < count:
            raise VocabContentError(
                f"Could only source {len(entries)} distinct vocabulary words (need {count})."
            )

        slides = [Slide(f"{count} VOCAB WORDS\nTO KNOW THIS WEEK", FONT_EXTRABOLD, 100)]
        for entry in entries:
            slides.append(
                Slide(
                    f'{entry["word"].upper()}\n\n{entry["meaning"]}',
                    FONT_BOLD,
                    76,
                    subtext=entry["example_sentence"],
                    subtext_font_size=42,
                )
            )
        slides.append(Slide(SAVE_TEXT, FONT_EXTRABOLD, 90))
        slides.append(Slide(CTA_TEXT, FONT_EXTRABOLD, 66))

        metadata = {
            "template": "vocab",
            "words": [
                {
                    "word": entry["word"],
                    "meaning": entry["meaning"],
                    "example_sentence": entry["example_sentence"],
                }
                for entry in entries
            ],
        }
        slug = slugify("-".join(entry["word"] for entry in entries[:3]))
        return slides, metadata, slug

    if template == "tip":
        tips: list[dict[str, str]] = []
        seen_hooks: set[str] = set()
        attempts = 0
        max_attempts = count * 3
        while len(tips) < count and attempts < max_attempts:
            attempts += 1
            try:
                tip = get_verified_tip()
            except TipContentError:
                continue
            key = tip["hook"].lower()
            if key in seen_hooks:
                continue
            seen_hooks.add(key)
            tips.append(tip)

        if len(tips) < count:
            raise TipContentError(f"Could only source {len(tips)} verified tips (need {count}).")

        slides = [Slide(f"{count} TIPS\nFOR 11+ SUCCESS", FONT_EXTRABOLD, 100)]
        for tip in tips:
            slides.append(Slide(tip["hook"], FONT_EXTRABOLD, 72, subtext=tip["body"], subtext_font_size=46))
        slides.append(Slide(SAVE_TEXT, FONT_EXTRABOLD, 90))
        slides.append(Slide(CTA_TEXT, FONT_EXTRABOLD, 66))

        metadata = {"template": "tip", "tips": tips}
        slug = slugify(tips[0]["hook"])
        return slides, metadata, slug

    raise ValueError(f"Unknown template: {template}")


def render_carousel(
    *,
    slides: list[Slide],
    width: int,
    height: int,
    output_dir: Path,
) -> list[Path]:
    paths = []
    total = len(slides)
    for index, slide in enumerate(slides, start=1):
        slide_path = output_dir / f"slide_{index:02d}.png"
        render_carousel_card_png(
            slide,
            slide_path,
            width=width,
            height=height,
            slide_number=index,
            total_slides=total,
        )
        paths.append(slide_path)
    return paths


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a static Instagram carousel of text cards.")
    parser.add_argument("--dry-run", action="store_true", help="Render locally and print what would upload, without writing to R2.")
    parser.add_argument("--template", choices=["vocab", "tip"], default=None, help="Force a template instead of a random 50/50 choice.")
    parser.add_argument("--count", type=int, default=DEFAULT_COUNT, help=f"Number of content slides (words/tips), default {DEFAULT_COUNT}.")
    parser.add_argument("--aspect", choices=list(ASPECT_SIZES), default="portrait", help="Carousel image aspect ratio (default: portrait 4:5).")
    return parser.parse_args()


def main() -> int:
    load_env_files()
    args = parse_args()

    if args.count < 1:
        logger.error("--count must be at least 1.")
        return 1

    try:
        bucket = get_env("R2_BUCKET_NAME", required=True)
        carousels_prefix = get_env("R2_CAROUSELS_PREFIX", "carousels/")
        client = create_r2_client()
    except Exception as exc:  # noqa: BLE001
        logger.error("%s", exc)
        return 1

    width, height = ASPECT_SIZES[args.aspect]

    template = args.template or random.choice(["vocab", "tip"])
    logger.info("Selected template: %s (count=%s, aspect=%sx%s)", template, args.count, width, height)

    try:
        slides, metadata, slug = build_slide_sequence(template, args.count)
    except (VocabContentError, TipContentError) as exc:
        logger.error("Failed to source content for template %s: %s", template, exc)
        return 1

    carousel_name = f"{template}__{slug}__{int(time.time())}"
    metadata = {**metadata, "carousel": carousel_name, "aspect": args.aspect, "width": width, "height": height, "slide_count": len(slides)}

    with create_temp_dir(prefix="ace11plus-carousel-") as temp_dir_name:
        temp_dir = Path(temp_dir_name)
        slide_paths = render_carousel(slides=slides, width=width, height=height, output_dir=temp_dir)

        for slide_path in slide_paths:
            size = slide_path.stat().st_size
            logger.info("Rendered %s (%s bytes)", slide_path, size)

        if args.dry_run:
            logger.info("[DRY RUN] Would upload %s slides -> %s%s/", len(slide_paths), carousels_prefix, carousel_name)
            logger.info("[DRY RUN] Metadata: %s", metadata)
            return 0

        carousel_key_prefix = f"{carousels_prefix}{carousel_name}/"
        for slide_path in slide_paths:
            key = f"{carousel_key_prefix}{slide_path.name}"
            upload_file_to_r2(client, bucket, key, slide_path, content_type="image/png")
            logger.info("Uploaded slide: %s", key)

        sidecar_path = temp_dir / "metadata.json"
        sidecar_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        sidecar_key = f"{carousel_key_prefix}metadata.json"
        upload_file_to_r2(client, bucket, sidecar_key, sidecar_path, content_type="application/json")
        logger.info("Uploaded metadata sidecar: %s", sidecar_key)

    return 0


if __name__ == "__main__":
    sys.exit(main())
