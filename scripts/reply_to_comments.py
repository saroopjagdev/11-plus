"""Checks comments on Instagram posts from the last 24 hours for a trigger
word, and DMs the commenter a resource link via Meta's private-reply API.

Runs on its own schedule (see .github/workflows/reply-to-comments.yml),
separate from the reel-posting workflow, so a comment gets a reply within a
couple of hours rather than waiting for the next twice-daily reel post.

Requires the Instagram app's access token to include the
instagram_manage_comments and instagram_manage_messages permissions, on top
of whatever's already granted for reel posting (instagram_content_publish) —
see README.md's "Comment-to-DM Setup" section. These typically need to be
re-granted via a fresh Graph API Explorer authorization if the existing
token predates this feature.

Usage:
  R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=... R2_ENDPOINT_URL=... \
  INSTAGRAM_USER_ID=... [INSTAGRAM_PAGE_ACCESS_TOKEN=... | INSTAGRAM_USER_ACCESS_TOKEN=... INSTAGRAM_APP_ID=... INSTAGRAM_APP_SECRET=... INSTAGRAM_PAGE_ID=...] \
  python scripts/reply_to_comments.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from reel_common import (
    TokenManager,
    create_r2_client,
    download_r2_object,
    get_env,
    get_int_env,
    load_env_files,
    logger,
    upload_file_to_r2,
)
from instagram_comments import (
    InstagramCommentsError,
    commenter_key,
    list_comments_for_media,
    list_recent_media,
    send_private_reply,
)


DEFAULT_GRAPH_API_VERSION = "v19.0"
DEFAULT_LOOKBACK_HOURS = 24
TRIGGER_WORD = "RESOURCE"
DM_MESSAGE = (
    "Hi! Thanks for commenting. Here is the free 11+ diagnostic tool I "
    "mentioned: https://www.ace11plus.org/diagnostics. Hope it helps your "
    "child's prep 😊"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reply-via-DM to Instagram comments containing the trigger word."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List matching comments without sending DMs or updating the dedup record.",
    )
    return parser.parse_args()


def load_dmd_record(client, bucket: str, r2_key: str, local_path: Path) -> set[str]:
    if not local_path.exists():
        try:
            download_r2_object(client, bucket, r2_key, local_path)
            logger.info("Restored DMd-commenters record from R2: %s", r2_key)
        except Exception as exc:  # noqa: BLE001
            logger.info("No DMd-commenters record in R2 yet (%s): %s", r2_key, exc)

    if not local_path.exists():
        return set()

    try:
        data = json.loads(local_path.read_text(encoding="utf-8"))
        return set(data.get("dmd_keys", []))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not read DMd-commenters record %s: %s", local_path, exc)
        return set()


def save_dmd_record(client, bucket: str, r2_key: str, local_path: Path, dmd_keys: set[str]) -> None:
    local_path.parent.mkdir(parents=True, exist_ok=True)
    local_path.write_text(json.dumps({"dmd_keys": sorted(dmd_keys)}, indent=2), encoding="utf-8")
    try:
        upload_file_to_r2(client, bucket, r2_key, local_path, content_type="application/json")
        logger.info("Synced DMd-commenters record to R2: %s", r2_key)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not sync DMd-commenters record to R2 (%s): %s", r2_key, exc)


def main() -> int:
    load_env_files()
    args = parse_args()

    try:
        graph_api_version = get_env("GRAPH_API_VERSION", DEFAULT_GRAPH_API_VERSION)
        lookback_hours = get_int_env("INSTAGRAM_COMMENTS_LOOKBACK_HOURS", DEFAULT_LOOKBACK_HOURS)
        instagram_user_id = get_env("INSTAGRAM_USER_ID", "", required=False).strip() or None

        instagram_direct_page_access_token = (
            get_env("INSTAGRAM_PAGE_ACCESS_TOKEN", "", required=False).strip() or None
        )
        instagram_user_access_token = get_env("INSTAGRAM_USER_ACCESS_TOKEN", "", required=False).strip() or None
        instagram_app_id = get_env("INSTAGRAM_APP_ID", "", required=False).strip() or None
        instagram_app_secret = get_env("INSTAGRAM_APP_SECRET", "", required=False).strip() or None
        instagram_page_id = get_env("INSTAGRAM_PAGE_ID", "", required=False).strip() or None
        instagram_token_cache_path = Path(
            get_env("INSTAGRAM_TOKEN_CACHE_PATH", "scratch/instagram_tokens.json")
        )
        instagram_token_r2_key = get_env("INSTAGRAM_TOKEN_R2_KEY", "state/instagram_tokens.json")

        dmd_record_r2_key = get_env("INSTAGRAM_DM_RECORD_R2_KEY", "state/instagram_dmd_commenters.json")
        dmd_record_local_path = Path(
            get_env("INSTAGRAM_DM_RECORD_CACHE_PATH", "scratch/instagram_dmd_commenters.json")
        )

        bucket = get_env("R2_BUCKET_NAME", required=True)

        if not instagram_user_id:
            logger.info("INSTAGRAM_USER_ID not set — nothing to do.")
            return 0
        if not instagram_direct_page_access_token and not (
            instagram_user_access_token and instagram_page_id
        ):
            logger.info(
                "Neither INSTAGRAM_PAGE_ACCESS_TOKEN nor "
                "INSTAGRAM_USER_ACCESS_TOKEN+INSTAGRAM_PAGE_ID are set — nothing to do."
            )
            return 0

        client = create_r2_client()

        instagram_token_manager: TokenManager | None = None
        if not instagram_direct_page_access_token:
            instagram_token_manager = TokenManager(
                graph_api_version=graph_api_version,
                app_id=instagram_app_id,
                app_secret=instagram_app_secret,
                user_access_token=instagram_user_access_token,
                token_cache_path=instagram_token_cache_path,
                r2_client=client,
                r2_bucket=bucket,
                r2_key=instagram_token_r2_key,
                platform_label="Instagram",
            )
    except Exception as exc:  # noqa: BLE001
        logger.error("%s", exc)
        return 1

    if instagram_direct_page_access_token:
        access_token = instagram_direct_page_access_token
    else:
        assert instagram_token_manager is not None
        assert instagram_page_id is not None
        access_token = instagram_token_manager.get_page_token(instagram_page_id)

    dmd_keys = load_dmd_record(client, bucket, dmd_record_r2_key, dmd_record_local_path)
    logger.info("Loaded %s previously-DMd commenter(s).", len(dmd_keys))

    cutoff = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)

    try:
        media_items = list_recent_media(
            graph_api_version=graph_api_version,
            ig_user_id=instagram_user_id,
            access_token=access_token,
        )
    except InstagramCommentsError as exc:
        logger.error("%s", exc)
        return 1

    recent_media = []
    for media in media_items:
        timestamp = media.get("timestamp")
        if not timestamp:
            continue
        try:
            posted_at = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        except ValueError:
            continue
        if posted_at >= cutoff:
            recent_media.append(media)

    logger.info("Found %s post(s) from the last %s hours.", len(recent_media), lookback_hours)

    sent_count = 0
    new_dmd_keys: set[str] = set()

    for media in recent_media:
        media_id = media["id"]
        try:
            comments = list_comments_for_media(
                graph_api_version=graph_api_version,
                media_id=media_id,
                access_token=access_token,
            )
        except InstagramCommentsError as exc:
            logger.error("Failed to fetch comments for %s: %s", media_id, exc)
            continue

        for comment in comments:
            text = comment.get("text", "")
            if TRIGGER_WORD.lower() not in text.lower():
                continue

            key = commenter_key(comment)
            if key is None:
                logger.warning("Comment %s has no usable commenter identity — skipping.", comment.get("id"))
                continue
            if key in dmd_keys or key in new_dmd_keys:
                logger.info("Already DMd %s — skipping.", key)
                continue

            comment_id = comment["id"]
            if args.dry_run:
                logger.info("[DRY RUN] Would DM %s for comment %s: %r", key, comment_id, text)
                continue

            try:
                send_private_reply(
                    graph_api_version=graph_api_version,
                    comment_id=comment_id,
                    access_token=access_token,
                    message=DM_MESSAGE,
                )
                new_dmd_keys.add(key)
                sent_count += 1
            except InstagramCommentsError as exc:
                logger.error("Failed to DM %s for comment %s: %s", key, comment_id, exc)

    if not args.dry_run and new_dmd_keys:
        save_dmd_record(client, bucket, dmd_record_r2_key, dmd_record_local_path, dmd_keys | new_dmd_keys)

    logger.info("Sent %s new DM(s).", sent_count)
    return 0


if __name__ == "__main__":
    sys.exit(main())
