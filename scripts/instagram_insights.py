"""Instagram media performance metrics via the Graph API Insights endpoint.

Used by scripts/collect_insights.py. Kept separate from
instagram_comments.py, which is scoped to comment reading/private replies —
Insights is a distinct concern with its own permission requirement.
"""

from __future__ import annotations

from typing import Any

import requests


DEFAULT_METRICS = "reach,saved,shares,comments,likes,total_interactions"


class InstagramInsightsError(RuntimeError):
    pass


def get_media_insights(
    *,
    graph_api_version: str,
    media_id: str,
    access_token: str,
    metrics: str = DEFAULT_METRICS,
) -> list[dict[str, Any]]:
    """Fetches Insights metrics for one media item.

    Requires the `instagram_manage_insights` permission — distinct from
    `instagram_manage_comments`/`instagram_manage_messages` used elsewhere
    in this repo, and needs its own re-authorization. See README.md's
    "Insights Setup" section.
    """
    endpoint = f"https://graph.facebook.com/{graph_api_version}/{media_id}/insights"
    response = requests.get(
        endpoint,
        params={"metric": metrics, "access_token": access_token},
        timeout=30,
    )
    if response.status_code >= 400:
        raise InstagramInsightsError(f"Failed to fetch insights for {media_id}: {response.text}")
    return list(response.json().get("data", []))
