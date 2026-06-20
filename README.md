# Ace11Plus

This repository contains the Ace11Plus web app and a small Facebook reel posting automation.

## Facebook Reel Automation

The reel automation is intentionally simple:

- `scripts/upload_assets.py`
  Uploads local `.mp4` reels and `.mp3` music from your Windows laptop to Cloudflare R2.
- `scripts/post_reel.py`
  Selects random reels from R2, optionally bakes in random music with `ffmpeg`, and posts them to your Facebook Page.
- `.github/workflows/post-reel.yml`
  Runs the posting script twice daily and also supports manual runs.

This automation is **Facebook only**. It does not include Instagram, TikTok, YouTube, scraping, browser automation, or group posting.

## Files

- [scripts/upload_assets.py](/C:/Users/ssjag/OneDrive/Programming/11-plus/scripts/upload_assets.py)
- [scripts/post_reel.py](/C:/Users/ssjag/OneDrive/Programming/11-plus/scripts/post_reel.py)
- [scripts/reel_common.py](/C:/Users/ssjag/OneDrive/Programming/11-plus/scripts/reel_common.py)
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
- fallback:
  - `FACEBOOK_PAGE_ACCESS_TOKEN`
  - if this is set, the script uses it directly

For captions, the script looks for [captions.txt](/C:/Users/ssjag/OneDrive/Programming/11-plus/captions.txt) by default.
You can override that with `CAPTIONS_FILE_PATH` if needed.

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
- print what would be uploaded
- skip the Facebook upload

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
- uploads the final MP4 to `/{page-id}/videos`
- falls back to `FIXED_CAPTION` only if the caption pool is unavailable
- waits 60 to 120 seconds between posts in the same run

If no music is available, the script logs a warning and posts the original reel without added music.

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

`POSTS_PER_RUN` is set to `1` in the workflow so each scheduled run creates one Facebook post.
`GRAPH_API_VERSION`, `R2_REELS_PREFIX`, and `R2_MUSIC_PREFIX` are set to safe defaults in the script/workflow.

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
- retry small Facebook network/server upload errors
- log major steps for easier debugging
- refresh and cache the Facebook long-lived user token when app credentials are configured
