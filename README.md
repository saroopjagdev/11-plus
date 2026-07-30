# Ace11Plus

This repository contains the Ace11Plus web app and a small reel posting automation for Facebook, Instagram, and YouTube.

## Reel Automation

The reel automation is intentionally simple:

- `scripts/upload_assets.py`
  Uploads local `.mp4` reels and `.mp3` music from your Windows laptop to Cloudflare R2.
- `scripts/post_reel.py`
  Selects random reels from R2, optionally bakes in random music with `ffmpeg`, and posts them to your Facebook Page, Instagram account, and YouTube channel.
- `scripts/social_instagram.py`
  Posts the same rendered reel to Instagram as a Reel via the Graph API.
- `scripts/social_youtube.py`
  Posts the same rendered reel to YouTube as a Short via the YouTube Data API.
- `scripts/youtube_auth_setup.py`
  One-time interactive script (run locally, never in CI) that mints the YouTube refresh token.
- `scripts/reply_to_comments.py`
  Checks comments on Instagram posts from the last 24 hours for the trigger word `RESOURCE`, and DMs the commenter a resource link via Meta's private-reply API. Keeps a record of who's already been DMd so nobody gets messaged twice.
- `scripts/instagram_comments.py`
  Instagram comment-reading and private-reply-sending helpers used by `reply_to_comments.py` and `collect_insights.py`.
- `scripts/collect_insights.py`
  Pulls per-post Instagram Insights metrics (reach, saves, shares, comments, likes, total interactions) and stores them in Supabase for trend analysis.
- `scripts/instagram_insights.py`
  Instagram Insights-fetching helper used by `collect_insights.py`.
- `.github/workflows/post-reel.yml`
  Runs the posting script twice daily and also supports manual runs.
- `.github/workflows/reply-to-comments.yml`
  Runs the comment-reply script every 15 minutes and also supports manual runs.
- `.github/workflows/collect-insights.yml`
  Runs the Insights-collection script daily and also supports manual runs (with an optional backfill-days input).

All three platforms post the **same rendered video** — there's still only one content source (your own reels in R2), not separate pipelines per platform. Instagram and YouTube are each optional: leave their environment variables unset and `post_reel.py` skips that platform with a log line, still posting to the others. This automation does not include TikTok, scraping, browser automation, or group posting — it only publishes your own produced content.

## Files

- [scripts/upload_assets.py](/C:/Users/ssjag/OneDrive/Programming/11-plus/scripts/upload_assets.py)
- [scripts/post_reel.py](/C:/Users/ssjag/OneDrive/Programming/11-plus/scripts/post_reel.py)
- [scripts/reel_common.py](/C:/Users/ssjag/OneDrive/Programming/11-plus/scripts/reel_common.py)
- [scripts/social_instagram.py](/C:/Users/ssjag/OneDrive/Programming/11-plus/scripts/social_instagram.py)
- [scripts/social_youtube.py](/C:/Users/ssjag/OneDrive/Programming/11-plus/scripts/social_youtube.py)
- [scripts/youtube_auth_setup.py](/C:/Users/ssjag/OneDrive/Programming/11-plus/scripts/youtube_auth_setup.py)
- [requirements.txt](/C:/Users/ssjag/OneDrive/Programming/11-plus/requirements.txt)
- [captions.txt](/C:/Users/ssjag/OneDrive/Programming/11-plus/captions.txt)
- [config.example.env](/C:/Users/ssjag/OneDrive/Programming/11-plus/config.example.env)
- [.github/workflows/post-reel.yml](/C:/Users/ssjag/OneDrive/Programming/11-plus/.github/workflows/post-reel.yml)

## Required Environment Variables

Copy [config.example.env](/C:/Users/ssjag/OneDrive/Programming/11-plus/config.example.env) into your local environment and fill in:

```env
FACEBOOK_PAGE_ID=
FACEBOOK_PAGE_ACCESS_TOKEN=
FACEBOOK_USER_ACCESS_TOKEN=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_TOKEN_CACHE_PATH=scratch/facebook_tokens.json
FACEBOOK_TOKEN_R2_KEY=state/facebook_tokens.json
CAPTIONS_FILE_PATH=captions.txt
FIXED_CAPTION=
GRAPH_API_VERSION=v19.0
POSTS_PER_RUN=1
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT_URL=
R2_REELS_PREFIX=reels/
R2_MUSIC_PREFIX=music/
LOCAL_REELS_DIR=C:\Users\ssjag\OneDrive\Ace11Plus\reels
LOCAL_MUSIC_DIR=C:\Users\ssjag\OneDrive\Ace11Plus\music

# Optional — Instagram (own, independent Facebook Developer App — not the
# same credentials as the FACEBOOK_* app above)
INSTAGRAM_USER_ID=
INSTAGRAM_PAGE_ACCESS_TOKEN=
INSTAGRAM_USER_ACCESS_TOKEN=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_PAGE_ID=
INSTAGRAM_TOKEN_CACHE_PATH=scratch/instagram_tokens.json
INSTAGRAM_TOKEN_R2_KEY=state/instagram_tokens.json

# Optional — Comment-to-DM automation (reuses INSTAGRAM_* above)
INSTAGRAM_COMMENTS_LOOKBACK_HOURS=24
INSTAGRAM_DM_RECORD_R2_KEY=state/instagram_dmd_commenters.json

# Optional — Insights collection (reuses INSTAGRAM_* above; also needs
# SUPABASE_URL, or falls back to NEXT_PUBLIC_SUPABASE_URL, and
# SUPABASE_SERVICE_ROLE_KEY)
INSTAGRAM_INSIGHTS_MIN_AGE_HOURS=24
INSTAGRAM_INSIGHTS_MAX_AGE_HOURS=168
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Optional — YouTube
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
YOUTUBE_PRIVACY_STATUS=public
```

## Local Setup

1. Install Python 3.11+.
2. Install `ffmpeg` and `ffprobe` so they are available on your PATH.
3. Install the Python dependencies:

```bash
pip install -r requirements.txt
```

4. Load your environment variables from `.env.local`, `.env`, or your shell.

For Facebook auth, the script now supports two modes:

- preferred for your existing setup:
  - `FACEBOOK_USER_ACCESS_TOKEN`
  - `FACEBOOK_APP_ID`
  - `FACEBOOK_APP_SECRET`
  - the script refreshes the long-lived user token when needed and fetches the Page token dynamically
  - the refreshed token is synced to R2 (`FACEBOOK_TOKEN_R2_KEY`), not just the local `FACEBOOK_TOKEN_CACHE_PATH` file, so it survives across separate GitHub Actions runs instead of being silently discarded when the runner is torn down
- fallback:
  - `FACEBOOK_PAGE_ACCESS_TOKEN`
  - if this is set, the script uses it directly

For captions, the script looks for [captions.txt](/C:/Users/ssjag/OneDrive/Programming/11-plus/captions.txt) by default.
You can override that with `CAPTIONS_FILE_PATH` if needed.

## Instagram Setup (optional)

Instagram posting authenticates through its **own, independent Facebook Developer App** — not the same App/token used for Facebook Page posting above. Two ways to configure it:

**Simple (recommended to start)** — set a Page access token directly, no auto-refresh:

1. Link your Instagram Business/Creator account to a Facebook Page (Meta Business Suite → Settings → Linked Accounts).
2. In the [Graph API Explorer](https://developers.facebook.com/tools/explorer/), select your Instagram app, get a Page access token for that linked Page.
3. Find the Instagram Business Account ID: `GET /{page-id}?fields=instagram_business_account` — copy the `id` from the response.
4. Set `INSTAGRAM_USER_ID` to that id, and `INSTAGRAM_PAGE_ACCESS_TOKEN` to the Page token from step 2.

This token isn't refreshed automatically — Facebook Page tokens derived from a long-lived user token typically last ~60 days, so you'll need to regenerate it periodically unless you use the auto-refreshing mode below.

**Auto-refreshing (optional upgrade)** — same long-lived-token-refresh + R2-persistence machinery as Facebook, running independently for the Instagram app:

1. Instead of `INSTAGRAM_PAGE_ACCESS_TOKEN`, set `INSTAGRAM_USER_ACCESS_TOKEN` (a long-lived user token for the Instagram app), `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, and `INSTAGRAM_PAGE_ID` (the Page linked to the Instagram account, under this app).
2. `post_reel.py` will refresh this token automatically and sync it to R2 (`INSTAGRAM_TOKEN_R2_KEY`), the same way it does for Facebook.

Leave `INSTAGRAM_USER_ID` blank and `post_reel.py` skips Instagram, still posting to Facebook (and YouTube, if configured).

## Comment-to-DM Setup (optional)

`scripts/reply_to_comments.py` checks comments on Instagram posts from the last 24 hours, and for any comment containing the word `RESOURCE` (case insensitive), sends the commenter a DM with a link to the free diagnostic tool — using Meta's official ["private reply to a comment"](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/private-replies) endpoint (`/{comment-id}/private_replies`), the supported, policy-compliant way to turn a public comment into a DM. It reuses the same `INSTAGRAM_*` credentials already configured above.

**This needs additional Meta permissions** beyond what reel posting already uses:

1. In the [Graph API Explorer](https://developers.facebook.com/tools/explorer/), with your Instagram app selected, click **"Get User Access Token"** again and make sure `instagram_manage_comments` and `instagram_manage_messages` are both checked in the permissions list, alongside whatever's already granted for posting.
2. If you're using the auto-refreshing auth mode (`INSTAGRAM_USER_ACCESS_TOKEN`), replace it with the freshly-authorized long-lived token — the old one won't have these scopes.
3. If you're using the simple mode (`INSTAGRAM_PAGE_ACCESS_TOKEN`), regenerate a Page token from the re-authorized user token the same way as the original Instagram setup.

Behavior:

- runs on its own schedule (`.github/workflows/reply-to-comments.yml`, every 15 minutes), independent of reel posting, so a comment gets a reply quickly rather than waiting for the next twice-daily reel run — GitHub's scheduled-workflow cron is best-effort, so expect some jitter, not exact 15-minute timing
- only looks at posts from the last `INSTAGRAM_COMMENTS_LOOKBACK_HOURS` hours (default 24) — a comment on an older post won't be picked up
- the trigger word and DM message are hardcoded constants at the top of `reply_to_comments.py` (`TRIGGER_WORD`, `DM_MESSAGE`) — edit the file directly to change them
- keeps a record of who's already been DMd (keyed by Instagram-scoped user id, falling back to username) in R2 at `INSTAGRAM_DM_RECORD_R2_KEY`, so the same commenter is never messaged twice, even across separate posts or runs
- `python scripts/reply_to_comments.py --dry-run` lists which comments would trigger a DM without sending anything or updating the record

## Insights Setup (optional)

`scripts/collect_insights.py` pulls per-post performance metrics (reach, saves, shares, comments, likes, total interactions) from Instagram's Insights API and stores them in Supabase (`instagram_media_insights`) so content strategy can be based on what's actually earning reach/saves/shares — the signals that matter most for Reels distribution — rather than guessed.

**This needs another Meta permission**, distinct from the comments/DM ones above:

1. In the [Graph API Explorer](https://developers.facebook.com/tools/explorer/), with your Instagram app selected, click **"Get User Access Token"** again and make sure `instagram_manage_insights` is checked, alongside whatever's already granted.
2. Replace `INSTAGRAM_USER_ACCESS_TOKEN` (or regenerate `INSTAGRAM_PAGE_ACCESS_TOKEN`) the same way as for the Comment-to-DM setup above — the old token won't have this scope either.
3. Apply the migration: run [scripts/instagram-insights-migration.sql](/C:/Users/ssjag/OneDrive/Programming/11-plus/scripts/instagram-insights-migration.sql) manually via the Supabase SQL editor (no automated migration runner exists in this repo).
4. Add `SUPABASE_URL` (or rely on the `NEXT_PUBLIC_SUPABASE_URL` fallback already used elsewhere) and `SUPABASE_SERVICE_ROLE_KEY` as GitHub Actions secrets — neither existing workflow currently has Supabase access.
5. Once the above are in place, run a one-off backfill so you're not starting from zero: `python scripts/collect_insights.py --backfill-days 30` (or trigger `.github/workflows/collect-insights.yml` manually from the Actions tab with the `backfill_days` input set).

Behavior:

- runs daily (`.github/workflows/collect-insights.yml`, `0 6 * * *` UTC) — Insights numbers need time to stabilize after posting, so more-frequent collection wouldn't add useful signal
- only collects for posts between `INSTAGRAM_INSIGHTS_MIN_AGE_HOURS` (default 24) and `INSTAGRAM_INSIGHTS_MAX_AGE_HOURS` (default 168/7 days) old, so numbers have had time to settle but the window stays bounded
- re-collecting the same post's metrics on a later day is intentional, not a duplicate — that's how a trend gets built; only exact duplicate rows (same media, metric, and collection timestamp) are prevented
- `instagram_media_insights` is a narrow (long) table — one row per post/metric/collection-run — rather than fixed columns per metric, so it keeps working if Meta adds or retires a metric later
- `python scripts/collect_insights.py --dry-run` prints what would be collected without writing to Supabase

## YouTube Setup (optional)

YouTube uses Google's own OAuth2, not the Facebook Graph API, so it needs a one-time interactive authorization to mint a refresh token — after that, `post_reel.py` refreshes its short-lived access token automatically on every run, the same "authorize once, run headlessly forever" shape as the existing Facebook long-lived user token.

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project (or reuse one) and enable the **YouTube Data API v3**.
2. Configure the OAuth consent screen (External is fine — you don't need Google's app review just to authorize your own channel).
3. Create OAuth 2.0 credentials of type **Desktop app**. Note the Client ID and Client Secret.
4. Set `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET` in your local environment.
5. Run the one-time setup script, which opens a browser for you to sign in and grant consent:

```bash
python scripts/youtube_auth_setup.py
```

6. Save the printed refresh token as `YOUTUBE_REFRESH_TOKEN`, both locally and as a GitHub secret.

Leave any of `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` / `YOUTUBE_REFRESH_TOKEN` unset and `post_reel.py` skips YouTube, still posting to Facebook (and Instagram, if configured).

`YOUTUBE_PRIVACY_STATUS` controls the upload visibility (`public`, `unlisted`, or `private`) and defaults to `public`.

## Upload Local Assets to R2

Dry run:

```bash
python scripts/upload_assets.py --dry-run
```

Real upload:

```bash
python scripts/upload_assets.py
```

Force re-upload of existing filenames:

```bash
python scripts/upload_assets.py --force
```

Behavior:

- uploads `*.mp4` from `LOCAL_REELS_DIR` to `reels/`
- uploads `*.mp3` from `LOCAL_MUSIC_DIR` to `music/`
- keeps original filenames
- skips existing R2 keys unless `--force` is used

## Test Posting Locally

Dry run:

```bash
python scripts/post_reel.py --dry-run
```

This will:

- list reels and music in R2
- choose random assets
- download them locally
- render the final MP4 with `ffmpeg`
- print what would be uploaded, and to which platforms are configured (Facebook, plus Instagram/YouTube if their environment variables are set)
- skip the actual upload to any platform

Real post:

```bash
python scripts/post_reel.py
```

## Captions

Captions are stored in [captions.txt](/C:/Users/ssjag/OneDrive/Programming/11-plus/captions.txt).

Format:

- one caption block
- then a separator line containing exactly `---`
- then the next caption block

Example:

```text
First caption block...
---
Second caption block...
```

How random caption selection works:

- the script loads all caption blocks from `captions.txt`
- for each reel upload, it randomly selects one caption
- it logs the selected caption index
- in `--dry-run` mode, it prints the selected caption that would be used

Fallback behavior:

- if `captions.txt` is missing
- or the file is empty
- or no valid caption blocks can be parsed

the script falls back to:

```env
FIXED_CAPTION=...
```

To edit or add captions:

1. Open [captions.txt](/C:/Users/ssjag/OneDrive/Programming/11-plus/captions.txt)
2. Edit an existing caption block or append a new one
3. Separate each caption block with a line containing `---`
4. Save the file

**Caption SEO**: when writing new captions, work at least one specific, searchable term into the body text — e.g. "verbal reasoning," "non-verbal reasoning," "GL Assessment," "CEM exam," "grammar school entrance exam," "comprehension," "maths reasoning" — rather than relying on hashtags alone. Caption text semantics are a real Explore/Search ranking signal, not just decoration; hashtag-only targeting under-delivers.

## Posting Behavior

For each reel:

- picks a random `.mp4` from `reels/`
- picks a random `.mp3` from `music/`
- uses `ffprobe` to inspect durations
- chooses a random music offset if the music is longer than the reel
- trims music to the reel duration
- applies low-volume background music around `0.16` to `0.20`
- adds short fade in and fade out
- chooses one random caption from `captions.txt` for each upload
- uploads the final MP4 to Facebook (`/{page-id}/videos`), then — if configured — the same file to Instagram (as a Reel) and YouTube (as a Short)
- falls back to `FIXED_CAPTION` only if the caption pool is unavailable
- waits 60 to 120 seconds between posts in the same run

If no music is available, the script logs a warning and posts the original reel without added music.

Instagram and YouTube post the identical final video Facebook received — there's no separate per-platform rendering. Each platform is attempted independently: if Instagram or YouTube fails (bad token, API error, etc.) it's logged and the run still tries the remaining platform(s) rather than aborting, though the run exits non-zero afterward so a partial failure is still visible in GitHub Actions. A Facebook failure still aborts the run immediately, since it's the platform every run has always required.

Instagram specifically uploads the rendered file to a temporary `processed/` key in R2, generates a short-lived presigned URL (Instagram's Graph API fetches videos by URL rather than accepting a direct file upload like Facebook), and deletes that temporary copy again once publishing finishes or definitively fails.

## GitHub Actions

The workflow lives at [.github/workflows/post-reel.yml](/C:/Users/ssjag/OneDrive/Programming/11-plus/.github/workflows/post-reel.yml).

It:

- runs on `workflow_dispatch`
- runs twice daily by cron
- installs Python dependencies
- installs `ffmpeg`
- runs `python scripts/post_reel.py`

Set these GitHub Secrets:

- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `FACEBOOK_USER_ACCESS_TOKEN`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `FIXED_CAPTION`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT_URL`

Optional — only needed for Instagram posting (see [Instagram Setup](#instagram-setup-optional)):

- `INSTAGRAM_USER_ID`
- `INSTAGRAM_PAGE_ID` (only if it differs from `FACEBOOK_PAGE_ID`)

Optional — only needed for YouTube posting (see [YouTube Setup](#youtube-setup-optional)):

- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`

Leaving the Instagram or YouTube secrets unset is safe — `post_reel.py` logs that the platform is disabled and continues posting to the others.

`POSTS_PER_RUN` is set to `1` in the workflow so each scheduled run creates one post per enabled platform.
`GRAPH_API_VERSION`, `R2_REELS_PREFIX`, `R2_MUSIC_PREFIX`, and `YOUTUBE_PRIVACY_STATUS` are set to safe defaults in the script/workflow.

Important:

- GitHub cron uses UTC, not UK local time
- the current workflow uses `07:30 UTC` and `17:30 UTC`
- that will shift by one hour relative to local UK time when BST/GMT changes

## Failure Cases

The scripts fail clearly for:

- missing Facebook credentials
- missing R2 credentials
- missing local source directories
- missing `ffmpeg` / `ffprobe`

They also:

- exit cleanly if no reels are found
- warn and continue if no music is found
- retry small Facebook/Instagram network/server upload errors
- log major steps for easier debugging
- refresh and cache the Facebook long-lived user token when app credentials are configured, syncing the refreshed token to R2 (`FACEBOOK_TOKEN_R2_KEY`) as well as the local cache path, so a refresh isn't silently lost between separate GitHub Actions runs
- refresh the YouTube access token automatically from the stored refresh token on every run
- skip Instagram or YouTube individually (logging why) rather than failing the run when their credentials aren't configured
- log an Instagram or YouTube posting failure and still attempt the remaining platform(s), but exit non-zero at the end of the run so a partial failure is visible in GitHub Actions
