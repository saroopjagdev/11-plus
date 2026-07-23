"""Posts an already-rendered reel to Instagram (Reels) via the Graph API.

Reuses the same Facebook Page access token the Facebook poster already
obtains (an Instagram Business/Creator account must be linked to that Page),
so no separate Instagram login/token is needed — only the Instagram
Business Account ID (`INSTAGRAM_USER_ID`, distinct from the Facebook Page
ID) has to be configured.

Unlike Facebook's `/videos` endpoint, which accepts a direct multipart file
upload, Instagram's Graph API requires a `video_url` it fetches itself. The
rendered reel is uploaded to R2 and a short-lived presigned URL is handed to
Instagram, then deleted again once publishing succeeds (or definitively
fails) so processed copies don't accumulate in the bucket.
"""

from __future__ import annotations

import time
from pathlib import Path
from typing import Any

import requests
from botocore.client import BaseClient

from reel_common import (
    generate_presigned_url,
    logger,
    retry,
    upload_file_to_r2,
)


DEFAULT_CONTAINER_POLL_ATTEMPTS = 30
DEFAULT_CONTAINER_POLL_DELAY_SECONDS = 10
DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS = 3600


class InstagramPostError(RuntimeError):
    pass


def _is_retryable_request_error(error: Exception) -> bool:
    if isinstance(error, requests.RequestException):
        response = getattr(error, "response", None)
        if response is None:
            return True
        return response.status_code >= 500 or response.status_code == 429
    return False


def _create_media_container(
    *,
    graph_api_version: str,
    ig_user_id: str,
    access_token: str,
    video_url: str,
    caption: str,
) -> str:
    endpoint = f"https://graph.facebook.com/{graph_api_version}/{ig_user_id}/media"

    def do_create() -> dict[str, Any]:
        response = requests.post(
            endpoint,
            data={
                "media_type": "REELS",
                "video_url": video_url,
                "caption": caption,
                "access_token": access_token,
            },
            timeout=60,
        )
        if response.status_code >= 400:
            error = requests.HTTPError(f"Instagram media container creation failed: {response.text}")
            error.response = response
            raise error
        return response.json()

    payload = retry(do_create, attempts=3, delay_seconds=3.0, is_retryable=_is_retryable_request_error)
    container_id = payload.get("id")
    if not container_id:
        raise InstagramPostError(f"Instagram did not return a container id: {payload}")
    return str(container_id)


def _wait_for_container_ready(
    *,
    graph_api_version: str,
    container_id: str,
    access_token: str,
    attempts: int,
    delay_seconds: int,
) -> None:
    endpoint = f"https://graph.facebook.com/{graph_api_version}/{container_id}"

    for attempt in range(1, attempts + 1):
        response = requests.get(
            endpoint,
            params={"fields": "status_code,status", "access_token": access_token},
            timeout=30,
        )
        if response.status_code >= 400:
            raise InstagramPostError(f"Failed to check Instagram container status: {response.text}")

        payload = response.json()
        status_code = payload.get("status_code")
        logger.info("Instagram container %s status: %s (%s/%s)", container_id, status_code, attempt, attempts)

        if status_code == "FINISHED":
            return
        if status_code == "ERROR":
            raise InstagramPostError(f"Instagram failed to process the video: {payload}")

        time.sleep(delay_seconds)

    raise InstagramPostError(
        f"Instagram container {container_id} did not finish processing within "
        f"{attempts * delay_seconds} seconds."
    )


def _publish_media_container(
    *,
    graph_api_version: str,
    ig_user_id: str,
    container_id: str,
    access_token: str,
) -> str:
    endpoint = f"https://graph.facebook.com/{graph_api_version}/{ig_user_id}/media_publish"

    def do_publish() -> dict[str, Any]:
        response = requests.post(
            endpoint,
            data={"creation_id": container_id, "access_token": access_token},
            timeout=60,
        )
        if response.status_code >= 400:
            error = requests.HTTPError(f"Instagram media publish failed: {response.text}")
            error.response = response
            raise error
        return response.json()

    payload = retry(do_publish, attempts=3, delay_seconds=5.0, is_retryable=_is_retryable_request_error)
    media_id = payload.get("id")
    if not media_id:
        raise InstagramPostError(f"Instagram did not return a media id on publish: {payload}")
    return str(media_id)


def post_reel_to_instagram(
    *,
    r2_client: BaseClient,
    bucket: str,
    output_path: Path,
    ig_user_id: str,
    access_token: str,
    graph_api_version: str,
    caption: str,
    processed_prefix: str = "processed/",
    poll_attempts: int = DEFAULT_CONTAINER_POLL_ATTEMPTS,
    poll_delay_seconds: int = DEFAULT_CONTAINER_POLL_DELAY_SECONDS,
    presigned_url_expiry_seconds: int = DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS,
) -> str:
    """Uploads the rendered reel to R2, posts it to Instagram, and returns the
    published media id. Raises InstagramPostError / requests errors on
    failure — callers should catch and log rather than let one platform's
    failure block posting to the others.
    """
    r2_key = f"{processed_prefix}{output_path.name}"
    logger.info("Uploading rendered reel to R2 for Instagram: %s", r2_key)
    upload_file_to_r2(r2_client, bucket, r2_key, output_path, content_type="video/mp4")

    try:
        video_url = generate_presigned_url(r2_client, bucket, r2_key, expires_in=presigned_url_expiry_seconds)

        container_id = _create_media_container(
            graph_api_version=graph_api_version,
            ig_user_id=ig_user_id,
            access_token=access_token,
            video_url=video_url,
            caption=caption,
        )
        logger.info("Created Instagram media container: %s", container_id)

        _wait_for_container_ready(
            graph_api_version=graph_api_version,
            container_id=container_id,
            access_token=access_token,
            attempts=poll_attempts,
            delay_seconds=poll_delay_seconds,
        )

        media_id = _publish_media_container(
            graph_api_version=graph_api_version,
            ig_user_id=ig_user_id,
            container_id=container_id,
            access_token=access_token,
        )
        logger.info("Published Instagram Reel: %s", media_id)
        return media_id
    finally:
        # Best-effort cleanup — the presigned URL will expire on its own
        # either way, but there is no reason to keep the processed copy
        # around once Instagram has fetched (or failed to fetch) it.
        try:
            r2_client.delete_object(Bucket=bucket, Key=r2_key)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Could not delete processed R2 object %s: %s", r2_key, exc)
