"""Posts an already-rendered reel to YouTube as a Short via the YouTube Data
API v3, using a resumable upload.

YouTube has no equivalent of Facebook's long-lived Page token: it uses
standard Google OAuth2, so a refresh token has to be minted once via an
interactive consent flow (see `youtube_auth_setup.py`) and then reused
headlessly here indefinitely, refreshing its short-lived access token as
needed — the same "obtain once, refresh automatically forever" shape as the
existing Facebook long-lived user token, just with Google's own token
mechanics.
"""

from __future__ import annotations

from pathlib import Path

from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

from reel_common import logger


YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload"
DEFAULT_CATEGORY_ID = "27"  # Education — appropriate default for 11+ prep content
YOUTUBE_TITLE_MAX_LENGTH = 95  # leaves room for a trailing " #Shorts"


class YouTubePostError(RuntimeError):
    pass


def _build_credentials(
    *,
    client_id: str,
    client_secret: str,
    refresh_token: str,
) -> Credentials:
    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=[YOUTUBE_UPLOAD_SCOPE],
    )
    creds.refresh(GoogleAuthRequest())
    return creds


def _derive_title(caption: str) -> str:
    first_line = caption.strip().splitlines()[0].strip() if caption.strip() else "Ace 11+"
    if len(first_line) > YOUTUBE_TITLE_MAX_LENGTH:
        first_line = first_line[: YOUTUBE_TITLE_MAX_LENGTH - 1].rstrip() + "…"
    if "#shorts" not in first_line.lower():
        first_line = f"{first_line} #Shorts"
    return first_line


def _derive_description(caption: str) -> str:
    if "#shorts" in caption.lower():
        return caption
    return f"{caption}\n\n#Shorts"


def post_reel_to_youtube(
    *,
    output_path: Path,
    client_id: str,
    client_secret: str,
    refresh_token: str,
    caption: str,
    category_id: str = DEFAULT_CATEGORY_ID,
    privacy_status: str = "public",
    tags: list[str] | None = None,
) -> str:
    """Uploads the rendered reel to YouTube and returns the resulting video
    id. Raises YouTubePostError / HttpError on failure — callers should
    catch and log rather than let one platform's failure block posting to
    the others.
    """
    credentials = _build_credentials(
        client_id=client_id,
        client_secret=client_secret,
        refresh_token=refresh_token,
    )
    youtube = build("youtube", "v3", credentials=credentials)

    body = {
        "snippet": {
            "title": _derive_title(caption),
            "description": _derive_description(caption),
            "tags": tags or ["11plus", "elevenplus", "shorts"],
            "categoryId": category_id,
        },
        "status": {
            "privacyStatus": privacy_status,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(str(output_path), mimetype="video/mp4", chunksize=-1, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    logger.info("Starting YouTube resumable upload for %s", output_path.name)
    response = None
    try:
        while response is None:
            status, response = request.next_chunk()
            if status:
                logger.info("YouTube upload progress: %d%%", int(status.progress() * 100))
    except HttpError as exc:
        raise YouTubePostError(f"YouTube upload failed: {exc}") from exc

    video_id = response.get("id") if response else None
    if not video_id:
        raise YouTubePostError(f"YouTube did not return a video id: {response}")

    logger.info("Published YouTube Short: https://youtube.com/shorts/%s", video_id)
    return str(video_id)
