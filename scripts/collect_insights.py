"""Pulls Instagram Insights metrics (reach, saves, shares, comments, likes,
total_interactions) for recent posts and persists them to Supabase for
trend analysis over time.

Runs daily (see .github/workflows/collect-insights.yml). Only looks at
posts old enough for their numbers to have stabilized
(INSTAGRAM_INSIGHTS_MIN_AGE_HOURS, default 24h) and not older than
INSTAGRAM_INSIGHTS_MAX_AGE_HOURS (default 168h/7 days) — use --backfill-days
to widen that window for a one-off historical backfill after first getting
Insights access.

Re-collecting the same post's metrics on a later day is intentional, not a
bug — that's how a trend gets built. Only exact duplicate rows (same media,
metric, and collection timestamp) are prevented, via a unique index in the
migration.

Requires the Instagram app's access token to include the
instagram_manage_insights permission, on top of whatever's already granted
for posting/comments/DMs — see README.md's "Insights Setup" section. This
typically needs a fresh Graph API Explorer re-authorization if the existing
token predates this feature.

Usage:
  R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=... R2_ENDPOINT_URL=... \
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  INSTAGRAM_USER_ID=... [INSTAGRAM_PAGE_ACCESS_TOKEN=... | INSTAGRAM_USER_ACCESS_TOKEN=... INSTAGRAM_APP_ID=... INSTAGRAM_APP_SECRET=... INSTAGRAM_PAGE_ID=...] \
  python scripts/collect_insights.py [--dry-run] [--backfill-days N]
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from reel_common import (
    TokenManager,
    create_r2_client,
    get_env,
    get_int_env,
    load_env_files,
    logger,
    supabase_insert_rows,
)
from instagram_comments import InstagramCommentsError, list_recent_media
from instagram_insights import InstagramInsightsError, get_media_insights


DEFAULT_GRAPH_API_VERSION = "v19.0"
DEFAULT_MIN_AGE_HOURS = 24
DEFAULT_MAX_AGE_HOURS = 168  # 7 days
SUPABASE_TABLE = "instagram_media_insights"
CAPTION_EXCERPT_LENGTH = 100


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collect Instagram Insights metrics into Supabase.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be collected/inserted without writing to Supabase.",
    )
    parser.add_argument(
        "--backfill-days",
        type=int,
        default=None,
        help="One-off wider lookback (in days) for historical posts, overriding the normal max-age window.",
    )
    return parser.parse_args()


def eligible_media(
    media_items: list[dict[str, Any]],
    *,
    min_age_hours: int,
    max_age_hours: int,
) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    min_cutoff = now - timedelta(hours=min_age_hours)
    max_cutoff = now - timedelta(hours=max_age_hours)

    eligible = []
    for media in media_items:
        timestamp = media.get("timestamp")
        if not timestamp:
            continue
        try:
            posted_at = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        except ValueError:
            continue
        # Old enough for numbers to have stabilized, not so old it's outside
        # the collection window.
        if max_cutoff <= posted_at <= min_cutoff:
            eligible.append(media)
    return eligible


def build_rows(media: dict[str, Any], insights: list[dict[str, Any]]) -> list[dict[str, Any]]:
    collected_at = datetime.now(timezone.utc).isoformat()
    caption = (media.get("caption") or "").strip()
    caption_excerpt = caption[:CAPTION_EXCERPT_LENGTH] if caption else None

    rows = []
    for metric in insights:
        name = metric.get("name")
        values = metric.get("values") or []
        if not name or not values:
            continue
        value = values[0].get("value")
        if value is None:
            continue
        rows.append(
            {
                "media_id": media["id"],
                "media_timestamp": media.get("timestamp"),
                "media_caption_excerpt": caption_excerpt,
                "metric_name": name,
                "metric_value": value,
                "collected_at": collected_at,
            }
        )
    return rows


def main() -> int:
    load_env_files()
    args = parse_args()

    try:
        graph_api_version = get_env("GRAPH_API_VERSION", DEFAULT_GRAPH_API_VERSION)
        min_age_hours = get_int_env("INSTAGRAM_INSIGHTS_MIN_AGE_HOURS", DEFAULT_MIN_AGE_HOURS)
        max_age_hours = get_int_env("INSTAGRAM_INSIGHTS_MAX_AGE_HOURS", DEFAULT_MAX_AGE_HOURS)
        if args.backfill_days is not None:
            max_age_hours = args.backfill_days * 24

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

        # Same fallback used elsewhere in this repo (e.g. scripts/run-batch.js) —
        # avoids requiring a second, duplicate Supabase URL secret.
        supabase_url = (
            get_env("SUPABASE_URL", "", required=False).strip()
            or get_env("NEXT_PUBLIC_SUPABASE_URL", "", required=False).strip()
            or None
        )
        supabase_service_role_key = get_env("SUPABASE_SERVICE_ROLE_KEY", required=True)

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
        if not supabase_url:
            raise ValueError("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL fallback).")

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

    try:
        # Backfill runs may need to look further back than the default
        # 25-item page — widen the fetch limit whenever the window is wider
        # than the normal 7-day default.
        fetch_limit = 25 if max_age_hours <= DEFAULT_MAX_AGE_HOURS else 100
        media_items = list_recent_media(
            graph_api_version=graph_api_version,
            ig_user_id=instagram_user_id,
            access_token=access_token,
            limit=fetch_limit,
        )
    except InstagramCommentsError as exc:
        logger.error("%s", exc)
        return 1

    eligible = eligible_media(media_items, min_age_hours=min_age_hours, max_age_hours=max_age_hours)
    logger.info(
        "Found %s post(s) eligible for collection (%s-%s hours old).",
        len(eligible),
        min_age_hours,
        max_age_hours,
    )

    all_rows: list[dict[str, Any]] = []
    for media in eligible:
        media_id = media["id"]
        try:
            insights = get_media_insights(
                graph_api_version=graph_api_version,
                media_id=media_id,
                access_token=access_token,
            )
        except InstagramInsightsError as exc:
            logger.error("%s", exc)
            continue

        rows = build_rows(media, insights)
        logger.info("Media %s: %s metric(s).", media_id, len(rows))
        all_rows.extend(rows)

    if args.dry_run:
        for row in all_rows:
            logger.info("[DRY RUN] Would insert: %s", row)
        logger.info("[DRY RUN] Would insert %s row(s) total.", len(all_rows))
        return 0

    if not all_rows:
        logger.info("Nothing to insert.")
        return 0

    supabase_insert_rows(
        supabase_url=supabase_url,
        service_role_key=supabase_service_role_key,
        table=SUPABASE_TABLE,
        rows=all_rows,
    )
    logger.info("Inserted %s row(s) into %s.", len(all_rows), SUPABASE_TABLE)
    return 0


if __name__ == "__main__":
    sys.exit(main())
