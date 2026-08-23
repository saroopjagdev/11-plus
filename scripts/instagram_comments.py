"""Instagram comment reading + private-reply sending via the Graph API.

Used by scripts/reply_to_comments.py to find recent comments containing a
trigger word and DM the commenter a resource link, using Meta's official
"private reply to a comment" endpoint (`/{comment-id}/private_replies`) —
the supported, policy-compliant way to turn a public comment into a DM,
as opposed to messaging someone who hasn't messaged the Page/account first.
"""

from __future__ import annotations

from typing import Any

import requests

from reel_common import logger


class InstagramCommentsError(RuntimeError):
    pass


def list_recent_media(
    *,
    graph_api_version: str,
    ig_user_id: str,
    access_token: str,
    limit: int = 25,
) -> list[dict[str, Any]]:
    """Returns the account's most recent media items (id + timestamp), most
    recent first. Single page only — fine at this account's posting volume
    (a handful of reels a day); would need cursor pagination to be safe for
    a much higher-volume account.

    Includes `media_type` (Meta returns IMAGE/VIDEO/CAROUSEL_ALBUM) — added
    so scripts/collect_insights.py can tell Reels and carousels apart when
    it stores insights; unused by reply_to_comments.py, the other caller.
    """
    endpoint = f"https://graph.facebook.com/{graph_api_version}/{ig_user_id}/media"
    response = requests.get(
        endpoint,
        params={
            "fields": "id,timestamp,caption,media_type",
            "limit": limit,
            "access_token": access_token,
        },
        timeout=30,
    )
    if response.status_code >= 400:
        raise InstagramCommentsError(f"Failed to list Instagram media: {response.text}")
    return list(response.json().get("data", []))


def list_comments_for_media(
    *,
    graph_api_version: str,
    media_id: str,
    access_token: str,
    limit: int = 100,
) -> list[dict[str, Any]]:
    """Returns comments on a media item. Single page only — see
    list_recent_media's docstring for the same caveat.
    """
    endpoint = f"https://graph.facebook.com/{graph_api_version}/{media_id}/comments"
    response = requests.get(
        endpoint,
        params={"fields": "id,text,timestamp,username,from", "limit": limit, "access_token": access_token},
        timeout=30,
    )
    if response.status_code >= 400:
        raise InstagramCommentsError(f"Failed to list comments for media {media_id}: {response.text}")
    return list(response.json().get("data", []))


def send_private_reply(
    *,
    graph_api_version: str,
    comment_id: str,
    access_token: str,
    message: str,
) -> None:
    """Sends a DM to whoever left `comment_id`, via Meta's private-reply
    endpoint. Only valid within Meta's reply window (7 days) of the comment
    being made — always true here since this only ever looks at comments on
    posts from the last 24 hours.
    """
    endpoint = f"https://graph.facebook.com/{graph_api_version}/{comment_id}/private_replies"
    response = requests.post(
        endpoint,
        data={"message": message, "access_token": access_token},
        timeout=30,
    )
    if response.status_code >= 400:
        raise InstagramCommentsError(f"Failed to send private reply to comment {comment_id}: {response.text}")
    logger.info("Sent private reply for comment %s", comment_id)


def commenter_key(comment: dict[str, Any]) -> str | None:
    """Stable-ish identity for dedup purposes — prefers the Instagram-scoped
    user id (from.id) since usernames can change; falls back to username if
    the API didn't return a from.id for this comment.
    """
    from_field = comment.get("from") or {}
    user_id = from_field.get("id")
    if user_id:
        return f"id:{user_id}"
    username = comment.get("username")
    if username:
        return f"username:{username}"
    return None
