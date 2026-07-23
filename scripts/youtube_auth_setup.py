"""One-time interactive setup: mints a YouTube OAuth refresh token.

Run this locally (never in CI — it opens a browser for you to sign in and
grant consent). The printed refresh token only needs to be obtained once;
save it as the YOUTUBE_REFRESH_TOKEN secret and social_youtube.py will use
it to silently refresh short-lived access tokens forever after, the same
"authorize once, refresh headlessly forever" shape as the existing Facebook
long-lived user token.

Prerequisites (one-time, in Google Cloud Console):
  1. Create a project (or reuse one) and enable the "YouTube Data API v3".
  2. Configure the OAuth consent screen (External is fine; you don't need
     Google's review/verification just to authorize your own channel).
  3. Create OAuth 2.0 credentials of type "Desktop app" and note the
     Client ID / Client Secret.

Usage:
    python scripts/youtube_auth_setup.py --client-id ... --client-secret ...
or, with YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET set in your environment:
    python scripts/youtube_auth_setup.py
"""

from __future__ import annotations

import argparse
import sys

from google_auth_oauthlib.flow import InstalledAppFlow

from reel_common import get_env, load_env_files, logger


YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Mint a YouTube OAuth refresh token for headless uploads.")
    parser.add_argument("--client-id", help="Overrides YOUTUBE_CLIENT_ID from the environment.")
    parser.add_argument("--client-secret", help="Overrides YOUTUBE_CLIENT_SECRET from the environment.")
    return parser.parse_args()


def main() -> int:
    load_env_files()
    args = parse_args()

    try:
        client_id = args.client_id or get_env("YOUTUBE_CLIENT_ID", required=True)
        client_secret = args.client_secret or get_env("YOUTUBE_CLIENT_SECRET", required=True)
    except ValueError as exc:
        logger.error("%s", exc)
        return 1

    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }

    flow = InstalledAppFlow.from_client_config(client_config, scopes=[YOUTUBE_UPLOAD_SCOPE])
    logger.info("Opening a browser window — sign in with the Google account that owns the YouTube channel.")
    credentials = flow.run_local_server(port=0)

    if not credentials.refresh_token:
        logger.error(
            "Google did not return a refresh token. This usually means you've authorized this "
            "app before — go to https://myaccount.google.com/permissions, remove access for "
            "this app, and run this script again so Google issues a fresh one."
        )
        return 1

    print("\nSuccess! Save this as the YOUTUBE_REFRESH_TOKEN secret (in GitHub Actions and your .env.local):\n")
    print(credentials.refresh_token)
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
