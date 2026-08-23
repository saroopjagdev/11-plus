"""Posts an already-rendered image carousel to Instagram via the Graph API.

Mirrors the Reels flow in `social_instagram.py` but follows Instagram's
carousel-specific container flow, which has one extra layer:

    1. Create one "carousel item" child container per image
       (`is_carousel_item=true`, `image_url=<presigned R2 URL>`).
    2. Create a single parent container referencing all child container ids
       (`media_type=CAROUSEL`, `children=<id1,id2,...>`, `caption=...`).
    3. Poll the parent container until Instagram finishes processing it.
    4. Publish the parent container (`/media_publish`), same as a Reel.

Unlike `post_reel_to_instagram`, this module does not upload or delete
anything in R2 itself. `scripts/generate_carousel.py` is expected to have
already uploaded the carousel's images under a `carousels/` prefix (plus a
JSON metadata sidecar, following the same convention as generated reels) —
those are the carousel's real, persistent assets, not a throwaway
"processed" copy, so this module only reads them (via a short-lived
presigned URL handed to Instagram) and leaves them in place.

Auth, retry, and error-handling patterns are reused directly from
`social_instagram.py` rather than re-implemented: `_is_retryable_request_error`,
`_wait_for_container_ready`, and `_publish_media_container` are generic
across media types (video or image), so only the carousel-item/carousel
container creation is carousel-specific.
"""

from __future__ import annotations

from typing import Any

import requests
from botocore.client import BaseClient

from reel_common import generate_presigned_url, logger, retry
from social_instagram import (
    InstagramPostError,
    _is_retryable_request_error,
    _publish_media_container,
    _wait_for_container_ready,
)


DEFAULT_CONTAINER_POLL_ATTEMPTS = 30
DEFAULT_CONTAINER_POLL_DELAY_SECONDS = 10
DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS = 3600

# Instagram's documented carousel size bounds (Graph API rejects containers
# outside this range at parent-container creation time, but validating here
# fails fast before any child containers/network calls are made).
MIN_CAROUSEL_ITEMS = 2
MAX_CAROUSEL_ITEMS = 10

# Prepended to the caption, mirroring INSTAGRAM_RESOURCE_CTA in
# post_reel.py but reworded for a carousel: "swipe through" replaces the
# reel's implicit watch-through framing, since a carousel's whole value is
# the multi-slide flip-through rather than a single clip.
CAROUSEL_RESOURCE_CTA = (
    "👉 Swipe through for the full breakdown! 📌 Save this so you don't lose "
    "it! 💬 Comment RESOURCE and we'll DM you our free 11+ diagnostic tool!\n\n"
)


def _create_carousel_item_container(
    *,
    graph_api_version: str,
    ig_user_id: str,
    access_token: str,
    image_url: str,
) -> str:
    endpoint = f"https://graph.facebook.com/{graph_api_version}/{ig_user_id}/media"

    def do_create() -> dict[str, Any]:
        response = requests.post(
            endpoint,
            data={
                "image_url": image_url,
                "is_carousel_item": "true",
                "access_token": access_token,
            },
            timeout=60,
        )
        if response.status_code >= 400:
            error = requests.HTTPError(
                f"Instagram carousel item container creation failed: {response.text}"
            )
            error.response = response
            raise error
        return response.json()

    payload = retry(do_create, attempts=3, delay_seconds=3.0, is_retryable=_is_retryable_request_error)
    container_id = payload.get("id")
    if not container_id:
        raise InstagramPostError(f"Instagram did not return a carousel item container id: {payload}")
    return str(container_id)


def _create_carousel_container(
    *,
    graph_api_version: str,
    ig_user_id: str,
    access_token: str,
    children_ids: list[str],
    caption: str,
) -> str:
    endpoint = f"https://graph.facebook.com/{graph_api_version}/{ig_user_id}/media"

    def do_create() -> dict[str, Any]:
        response = requests.post(
            endpoint,
            data={
                "media_type": "CAROUSEL",
                "children": ",".join(children_ids),
                "caption": caption,
                "access_token": access_token,
            },
            timeout=60,
        )
        if response.status_code >= 400:
            error = requests.HTTPError(f"Instagram carousel container creation failed: {response.text}")
            error.response = response
            raise error
        return response.json()

    payload = retry(do_create, attempts=3, delay_seconds=3.0, is_retryable=_is_retryable_request_error)
    container_id = payload.get("id")
    if not container_id:
        raise InstagramPostError(f"Instagram did not return a carousel container id: {payload}")
    return str(container_id)


def post_carousel_to_instagram(
    *,
    r2_client: BaseClient,
    bucket: str,
    image_keys: list[str],
    ig_user_id: str,
    access_token: str,
    graph_api_version: str,
    caption: str,
    poll_attempts: int = DEFAULT_CONTAINER_POLL_ATTEMPTS,
    poll_delay_seconds: int = DEFAULT_CONTAINER_POLL_DELAY_SECONDS,
    presigned_url_expiry_seconds: int = DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS,
) -> str:
    """Publishes a carousel of already-uploaded R2 images to Instagram and
    returns the published media id. Raises InstagramPostError / requests
    errors on failure — callers should catch and log rather than let one
    platform's failure block posting to the others (same convention as
    post_reel_to_instagram).

    `image_keys` are R2 object keys (e.g. under the `carousels/` prefix),
    already uploaded by scripts/generate_carousel.py, in the order they
    should appear when a viewer swipes through the carousel.
    """
    item_count = len(image_keys)
    if not (MIN_CAROUSEL_ITEMS <= item_count <= MAX_CAROUSEL_ITEMS):
        raise InstagramPostError(
            f"Instagram carousels require between {MIN_CAROUSEL_ITEMS} and "
            f"{MAX_CAROUSEL_ITEMS} items, got {item_count}."
        )

    child_container_ids: list[str] = []
    for image_key in image_keys:
        image_url = generate_presigned_url(
            r2_client, bucket, image_key, expires_in=presigned_url_expiry_seconds
        )
        container_id = _create_carousel_item_container(
            graph_api_version=graph_api_version,
            ig_user_id=ig_user_id,
            access_token=access_token,
            image_url=image_url,
        )
        logger.info("Created Instagram carousel item container for %s: %s", image_key, container_id)
        child_container_ids.append(container_id)

    parent_container_id = _create_carousel_container(
        graph_api_version=graph_api_version,
        ig_user_id=ig_user_id,
        access_token=access_token,
        children_ids=child_container_ids,
        caption=caption,
    )
    logger.info("Created Instagram carousel container: %s", parent_container_id)

    _wait_for_container_ready(
        graph_api_version=graph_api_version,
        container_id=parent_container_id,
        access_token=access_token,
        attempts=poll_attempts,
        delay_seconds=poll_delay_seconds,
    )

    media_id = _publish_media_container(
        graph_api_version=graph_api_version,
        ig_user_id=ig_user_id,
        container_id=parent_container_id,
        access_token=access_token,
    )
    logger.info("Published Instagram carousel: %s", media_id)
    return media_id


def load_carousel_metadata(client: BaseClient, bucket: str, metadata_key: str) -> dict[str, Any] | None:
    """Loads a carousel's JSON metadata sidecar from R2, following the same
    convention `load_reel_metadata` (post_reel.py) uses for reels: the
    caller resolves the sidecar's key (this module doesn't assume anything
    about scripts/generate_carousel.py's exact naming — only that a sidecar
    with the same shape as the reel one, i.e. containing `template` plus the
    template's fields, may exist at a known key). Returns None if the
    sidecar doesn't exist or can't be read, so callers fall back to the
    existing random-caption behaviour unchanged.
    """
    # Local imports to avoid a hard import-time dependency on these two
    # reel_common helpers for callers that only need caption building.
    import json
    from pathlib import Path

    from reel_common import create_temp_dir, download_r2_object, r2_object_exists

    if not r2_object_exists(client, bucket, metadata_key):
        return None

    with create_temp_dir() as temp_dir_name:
        temp_path = Path(temp_dir_name) / "metadata.json"
        try:
            download_r2_object(client, bucket, metadata_key, temp_path)
            return json.loads(temp_path.read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Could not load carousel metadata sidecar %s: %s", metadata_key, exc)
            return None


def build_carousel_caption_from_metadata(metadata: dict[str, Any]) -> str | None:
    """Adapted from build_caption_from_metadata (post_reel.py) for a
    carousel format: wording nudges the viewer to swipe through the slides
    rather than describing a single clip, since that's the whole point of
    posting a carousel instead of a Reel for this content.

    A carousel covers *multiple* words/tips (generate_carousel.py writes a
    `words`/`tips` list, one entry per content slide — not the single
    `word`/`hook` a reel's metadata sidecar has), so the caption lists all of
    them rather than describing just one.
    """
    template = metadata.get("template")

    if template == "vocab":
        words = metadata.get("words")
        if not isinstance(words, list):
            return None
        lines = []
        for item in words:
            if not isinstance(item, dict):
                continue
            word = str(item.get("word", "")).strip()
            meaning = str(item.get("meaning", "")).strip()
            if word and meaning:
                lines.append(f"{word.upper()} — {meaning}")
        if not lines:
            return None
        parts = [f"Swipe through for {len(lines)} words every 11+ candidate should know this week 👉\n\n"]
        parts.append("\n".join(lines))
        parts.append("\n\n#11Plus #Vocabulary #WordOfTheDay #GrammarSchool #11PlusPreparation")
        return "".join(parts)

    if template == "tip":
        tips = metadata.get("tips")
        if not isinstance(tips, list):
            return None
        hooks = []
        for item in tips:
            if not isinstance(item, dict):
                continue
            hook = str(item.get("hook", "")).strip()
            if hook:
                hooks.append(hook)
        if not hooks:
            return None
        parts = [f"Swipe through for {len(hooks)} tips for 11+ success 👉\n\n"]
        parts.append("\n".join(f"• {hook}" for hook in hooks))
        parts.append("\n\n#11Plus #11PlusTips #11PlusPreparation #GrammarSchool")
        return "".join(parts)

    return None


def build_instagram_carousel_caption(
    metadata: dict[str, Any] | None,
    captions: list[str],
    fallback_caption: str,
) -> tuple[str, int | None]:
    """Reuses post_reel.py's caption-pool logic (load_captions/select_caption
    over captions.txt) for carousels without matched content metadata, same
    as post_reel.py does for hand-made reels. Returns
    (caption_with_cta, selected_caption_index) — index is None when the
    caption came from metadata rather than the pool, matching
    post_reel.py's select_caption convention.
    """
    # Local import: keeps this module importable without pulling in
    # post_reel.py's own argparse/main-script surface at module load time.
    from post_reel import select_caption

    generated_caption = build_carousel_caption_from_metadata(metadata) if metadata else None
    if generated_caption:
        return CAROUSEL_RESOURCE_CTA + generated_caption, None

    selected_caption, selected_index = select_caption(captions, fallback_caption)
    return CAROUSEL_RESOURCE_CTA + selected_caption, selected_index
