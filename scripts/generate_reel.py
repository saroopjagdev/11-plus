"""Generates a reel: a background video loop + timed text-card overlays
(rendered via Pillow) + background music, composited with ffmpeg. Replaces
the manual Canva production step.

Output lands in R2 `reels/` with a content-template-prefixed filename
(`vocab__<word>__<timestamp>.mp4` or `tip__<slug>__<timestamp>.mp4`) plus a
JSON metadata sidecar (`<same filename>.json`) — the prefix is assigned by
this script itself, not a human, so `post_reel.py`'s existing
`list_r2_keys`/`choose_random_subset` selection needs zero changes to pick
these up (the `.json` sidecar is filtered out by its own `list_r2_keys(...,
".mp4")` suffix match), and the sidecar lets `post_reel.py` build a caption
that actually matches the reel's content instead of a random pick.

Usage:
  R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=... R2_ENDPOINT_URL=... \
  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... OPENAI_API_KEY=... \
  python scripts/generate_reel.py [--dry-run] [--template vocab|tip]
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

from reel_common import (
    create_r2_client,
    create_temp_dir,
    download_r2_object,
    ensure_binary,
    get_env,
    list_r2_keys,
    load_env_files,
    logger,
    run_command,
    upload_file_to_r2,
)
from tip_content import TipContentError, get_verified_tip
from vocab_content import VocabContentError, get_random_vocabulary_word


WIDTH, HEIGHT = 1080, 1920
FONT_DIR = Path(__file__).resolve().parent / "assets" / "fonts"
FONT_BOLD = FONT_DIR / "Montserrat-Bold.ttf"
FONT_EXTRABOLD = FONT_DIR / "Montserrat-ExtraBold.ttf"

# Same hook as INSTAGRAM_RESOURCE_CTA in post_reel.py — the video and the
# caption reinforce the same RESOURCE-comment-to-DM funnel. No emoji here
# (unlike the caption version) — Montserrat has no emoji glyphs, so Pillow
# renders them as a blank/tofu box on the card.
CTA_TEXT = "Comment RESOURCE\nand we'll DM you our\nfree 11+ diagnostic tool!"


@dataclass
class Card:
    text: str
    duration: float
    font_path: Path
    font_size: int


class ReelGenerationError(RuntimeError):
    pass


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "reel"


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        words = paragraph.split()
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip()
            bbox = draw.textbbox((0, 0), candidate, font=font)
            if bbox[2] - bbox[0] <= max_width or not current:
                current = candidate
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


# Montserrat (like most non-emoji-specific fonts) has no emoji glyphs —
# Pillow silently renders them as a blank/tofu box. Strip anything outside
# the Basic Latin + Latin-1 Supplement range (covers plain ASCII, curly
# quotes, accented characters) so any future LLM-generated tip text that
# happens to include an emoji doesn't render as a broken box on the card —
# it just gets dropped, which is what makes it into captions.txt/captions
# elsewhere anyway.
def strip_unsupported_glyphs(text: str) -> str:
    return "".join(ch for ch in text if ord(ch) < 0x300)


def render_card_png(card: Card, output_path: Path) -> None:
    """Renders one text card as a transparent 1080x1920 PNG: centered,
    word-wrapped text with a black stroke outline (legible over any
    background) and a semi-transparent dark backdrop bar behind the text
    block for extra contrast.
    """
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(str(card.font_path), card.font_size)

    max_text_width = int(WIDTH * 0.82)
    lines = wrap_text(draw, strip_unsupported_glyphs(card.text), font, max_text_width)

    ascent, descent = font.getmetrics()
    line_height = ascent + descent
    line_spacing = int(line_height * 1.35)
    block_height = line_spacing * len(lines)
    start_y = (HEIGHT - block_height) // 2

    line_widths = [draw.textbbox((0, 0), line, font=font)[2] for line in lines]
    max_line_width = max(line_widths) if line_widths else 0

    pad_x, pad_y = 70, 55
    bar_left = (WIDTH - max_line_width) // 2 - pad_x
    bar_right = (WIDTH + max_line_width) // 2 + pad_x
    bar_top = start_y - pad_y
    bar_bottom = start_y + block_height + pad_y
    draw.rounded_rectangle([bar_left, bar_top, bar_right, bar_bottom], radius=40, fill=(10, 10, 20, 165))

    y = start_y
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        line_width = bbox[2] - bbox[0]
        x = (WIDTH - line_width) // 2
        draw.text((x, y), line, font=font, fill=(255, 255, 255, 255), stroke_width=3, stroke_fill=(0, 0, 0, 255))
        y += line_spacing

    img.save(output_path)


def build_card_sequence(template: str) -> tuple[list[Card], dict[str, Any], str]:
    """Returns (cards, content_metadata, filename_slug) for the chosen
    template.
    """
    if template == "vocab":
        entry = get_random_vocabulary_word(
            supabase_url=get_env("NEXT_PUBLIC_SUPABASE_URL"),
            service_role_key=get_env("SUPABASE_SERVICE_ROLE_KEY"),
        )
        cards = [
            Card("Word of the Day", 3.0, FONT_EXTRABOLD, 110),
            Card(f'{entry["word"].upper()}\n\n{entry["meaning"]}', 5.0, FONT_BOLD, 80),
            Card(entry["example_sentence"], 4.5, FONT_BOLD, 60),
            Card(CTA_TEXT, 3.5, FONT_EXTRABOLD, 68),
        ]
        metadata = {
            "template": "vocab",
            "word": entry["word"],
            "meaning": entry["meaning"],
            "example_sentence": entry["example_sentence"],
        }
        return cards, metadata, entry["word"].lower()

    if template == "tip":
        tip = get_verified_tip()
        cards = [
            Card(tip["hook"], 3.0, FONT_EXTRABOLD, 100),
            Card(tip["body"], 5.5, FONT_BOLD, 70),
            Card(CTA_TEXT, 3.5, FONT_EXTRABOLD, 68),
        ]
        metadata = {"template": "tip", "hook": tip["hook"], "body": tip["body"]}
        return cards, metadata, slugify(tip["hook"])

    raise ValueError(f"Unknown template: {template}")


def render_reel(
    *,
    cards: list[Card],
    background_path: Path,
    music_path: Path,
    output_path: Path,
    temp_dir: Path,
) -> float:
    total_duration = sum(card.duration for card in cards)

    card_paths = []
    for index, card in enumerate(cards):
        card_path = temp_dir / f"card_{index}.png"
        render_card_png(card, card_path)
        card_paths.append(card_path)

    command = [ensure_binary("ffmpeg"), "-y", "-stream_loop", "-1", "-i", str(background_path)]
    for card_path in card_paths:
        command += ["-loop", "1", "-i", str(card_path)]
    command += ["-stream_loop", "-1", "-i", str(music_path)]

    filter_parts = [
        f"[0:v]scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,"
        f"crop={WIDTH}:{HEIGHT},setsar=1[bg]"
    ]
    current_label = "bg"
    cursor = 0.0
    for index, card in enumerate(cards):
        start, end = cursor, cursor + card.duration
        out_label = f"v{index}"
        filter_parts.append(
            f"[{current_label}][{index + 1}:v]overlay=enable='between(t,{start},{end})'[{out_label}]"
        )
        current_label = out_label
        cursor = end

    music_input_index = len(cards) + 1
    volume = round(random.uniform(0.16, 0.20), 2)
    fade_duration = min(1.0, max(total_duration / 6, 0.3))
    fade_out_start = max(total_duration - fade_duration, 0)
    filter_parts.append(
        f"[{music_input_index}:a]atrim=0:{total_duration},asetpts=N/SR/TB,"
        f"volume={volume},afade=t=in:st=0:d={fade_duration},"
        f"afade=t=out:st={fade_out_start}:d={fade_duration}[aout]"
    )

    command += [
        "-filter_complex", ";".join(filter_parts),
        "-map", f"[{current_label}]",
        "-map", "[aout]",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-t", str(total_duration),
        str(output_path),
    ]
    run_command(command, capture_output=True)
    return total_duration


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a reel from a background loop, text cards, and music.")
    parser.add_argument("--dry-run", action="store_true", help="Render locally and print what would upload, without writing to R2.")
    parser.add_argument("--template", choices=["vocab", "tip"], default=None, help="Force a template instead of a random 50/50 choice.")
    return parser.parse_args()


def main() -> int:
    load_env_files()
    args = parse_args()

    try:
        bucket = get_env("R2_BUCKET_NAME", required=True)
        backgrounds_prefix = get_env("R2_BACKGROUNDS_PREFIX", "backgrounds/")
        reels_prefix = get_env("R2_REELS_PREFIX", "reels/")
        music_prefix = get_env("R2_MUSIC_PREFIX", "music/")
        client = create_r2_client()
        ensure_binary("ffmpeg")
    except Exception as exc:  # noqa: BLE001
        logger.error("%s", exc)
        return 1

    background_keys = list_r2_keys(client, bucket, backgrounds_prefix, ".mp4")
    if not background_keys:
        logger.error("No background loops found in R2 prefix %s. Upload some via upload_assets.py first.", backgrounds_prefix)
        return 1

    music_keys = list_r2_keys(client, bucket, music_prefix, ".mp3")
    if not music_keys:
        logger.error("No music found in R2 prefix %s.", music_prefix)
        return 1

    # Flat 50/50 for now — analytics-informed weighting (favouring whichever
    # content_template earns more reach/saves in instagram_media_insights)
    # is deferred until there's enough posted variety to make it meaningful.
    template = args.template or random.choice(["vocab", "tip"])
    logger.info("Selected template: %s", template)

    try:
        cards, metadata, slug = build_card_sequence(template)
    except (VocabContentError, TipContentError) as exc:
        logger.error("Failed to source content for template %s: %s", template, exc)
        return 1

    background_key = random.choice(background_keys)
    music_key = random.choice(music_keys)
    filename = f"{template}__{slug}__{int(time.time())}.mp4"

    with create_temp_dir() as temp_dir_name:
        temp_dir = Path(temp_dir_name)
        background_path = temp_dir / Path(background_key).name
        music_path = temp_dir / Path(music_key).name
        output_path = temp_dir / filename

        download_r2_object(client, bucket, background_key, background_path)
        download_r2_object(client, bucket, music_key, music_path)

        duration = render_reel(
            cards=cards,
            background_path=background_path,
            music_path=music_path,
            output_path=output_path,
            temp_dir=temp_dir,
        )
        logger.info("Rendered %s (%.1fs, background=%s music=%s)", output_path, duration, background_key, music_key)

        if args.dry_run:
            logger.info("[DRY RUN] Would upload %s -> %s%s", output_path, reels_prefix, filename)
            logger.info("[DRY RUN] Metadata: %s", metadata)
            return 0

        reel_key = f"{reels_prefix}{filename}"
        upload_file_to_r2(client, bucket, reel_key, output_path, content_type="video/mp4")
        logger.info("Uploaded reel: %s", reel_key)

        sidecar_path = temp_dir / f"{filename}.json"
        sidecar_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        sidecar_key = f"{reels_prefix}{filename}.json"
        upload_file_to_r2(client, bucket, sidecar_key, sidecar_path, content_type="application/json")
        logger.info("Uploaded metadata sidecar: %s", sidecar_key)

    return 0


if __name__ == "__main__":
    sys.exit(main())
