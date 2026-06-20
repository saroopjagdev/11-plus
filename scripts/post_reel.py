from __future__ import annotations

import argparse
import json
import random
import shutil
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests

from reel_common import (
    choose_random_subset,
    create_r2_client,
    create_temp_dir,
    download_r2_object,
    ensure_binary,
    ffprobe_duration,
    get_env,
    get_int_env,
    list_r2_keys,
    load_env_files,
    logger,
    random_sleep_between,
    retry,
    run_command,
)


DEFAULT_GRAPH_API_VERSION = "v19.0"
DEFAULT_POSTS_PER_RUN = 1
DEFAULT_TOKEN_REFRESH_SECONDS = 7 * 24 * 3600
DEFAULT_CAPTIONS_PATH = "captions.txt"


@dataclass
class ReelJob:
    reel_key: str
    music_key: str | None


class TokenManager:
    def __init__(
        self,
        *,
        graph_api_version: str,
        app_id: str | None,
        app_secret: str | None,
        user_access_token: str | None,
        token_cache_path: Path,
    ) -> None:
        self.graph_api_version = graph_api_version
        self.app_id = app_id
        self.app_secret = app_secret
        self.initial_user_token = user_access_token
        self.token_cache_path = token_cache_path
        self.tokens: dict[str, Any] | None = None

    def _load_tokens(self) -> dict[str, Any]:
        if self.tokens is not None:
            return self.tokens

        if self.token_cache_path.exists():
            try:
                self.tokens = json.loads(self.token_cache_path.read_text(encoding="utf-8"))
                return self.tokens
            except Exception as exc:  # noqa: BLE001
                logger.warning("Could not read token cache %s: %s", self.token_cache_path, exc)

        if not self.initial_user_token:
            raise ValueError(
                "Missing Facebook token configuration. Set FACEBOOK_PAGE_ACCESS_TOKEN or FACEBOOK_USER_ACCESS_TOKEN."
            )

        self.tokens = {
            "user_token": self.initial_user_token,
            "last_refresh": 0,
        }
        return self.tokens

    def _save_tokens(self) -> None:
        if self.tokens is None:
            return
        self.token_cache_path.parent.mkdir(parents=True, exist_ok=True)
        self.token_cache_path.write_text(json.dumps(self.tokens, indent=2), encoding="utf-8")

    def get_user_token(self) -> str:
        tokens = self._load_tokens()
        user_token = tokens.get("user_token")
        if not user_token:
            raise ValueError("No Facebook user token available.")

        if not self.app_id or not self.app_secret:
            return user_token

        current_time = time.time()
        if current_time - float(tokens.get("last_refresh", 0)) > DEFAULT_TOKEN_REFRESH_SECONDS:
            self.refresh_user_token()
            tokens = self._load_tokens()
            user_token = tokens.get("user_token")
            if not user_token:
                raise ValueError("Facebook user token refresh did not return a usable token.")

        return str(user_token)

    def refresh_user_token(self) -> None:
        tokens = self._load_tokens()
        user_token = tokens.get("user_token")
        if not user_token:
            raise ValueError("Cannot refresh Facebook user token because none is configured.")
        if not self.app_id or not self.app_secret:
            logger.info("Skipping Facebook user token refresh because app credentials are not configured.")
            return

        logger.info("Refreshing Facebook long-lived user access token.")
        response = requests.get(
            f"https://graph.facebook.com/{self.graph_api_version}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": self.app_id,
                "client_secret": self.app_secret,
                "fb_exchange_token": user_token,
            },
            timeout=60,
        )
        payload = response.json()
        if response.status_code >= 400 or "access_token" not in payload:
            raise RuntimeError(f"Failed to refresh Facebook user token: {payload}")

        tokens["user_token"] = payload["access_token"]
        tokens["last_refresh"] = time.time()
        self._save_tokens()
        logger.info("Facebook user token refreshed and cached.")

    def get_page_token(self, page_id: str) -> str:
        user_token = self.get_user_token()
        response = requests.get(
            f"https://graph.facebook.com/{self.graph_api_version}/{page_id}",
            params={
                "fields": "access_token",
                "access_token": user_token,
            },
            timeout=60,
        )
        payload = response.json()
        if response.status_code >= 400 or "access_token" not in payload:
            raise RuntimeError(f"Failed to fetch Page token for {page_id}: {payload}")
        return str(payload["access_token"])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render and post random reels from Cloudflare R2 to Facebook.")
    parser.add_argument("--dry-run", action="store_true", help="Render the final MP4 and print what would upload.")
    return parser.parse_args()


def load_captions(captions_path: Path) -> list[str]:
    if not captions_path.exists():
        logger.warning("Caption pool file not found at %s. Falling back to FIXED_CAPTION.", captions_path)
        return []

    raw_text = captions_path.read_text(encoding="utf-8").strip()
    if not raw_text:
        logger.warning("Caption pool file %s is empty. Falling back to FIXED_CAPTION.", captions_path)
        return []

    captions = [block.strip() for block in raw_text.split("---") if block.strip()]
    if not captions:
        logger.warning("Caption pool file %s contains no valid caption blocks. Falling back to FIXED_CAPTION.", captions_path)
        return []
    return captions


def select_caption(captions: list[str], fallback_caption: str) -> tuple[str, int | None]:
    if captions:
        selected_index = random.randrange(len(captions))
        return captions[selected_index], selected_index + 1
    return fallback_caption, None


def is_retryable_upload_error(error: Exception) -> bool:
    if isinstance(error, requests.RequestException):
        response = getattr(error, "response", None)
        if response is None:
            return True
        return response.status_code >= 500 or response.status_code == 429
    return False


def select_jobs(reel_keys: list[str], music_keys: list[str], posts_per_run: int) -> list[ReelJob]:
    selected_reels = choose_random_subset(reel_keys, posts_per_run)
    jobs: list[ReelJob] = []
    for reel_key in selected_reels:
        music_key = random.choice(music_keys) if music_keys else None
        jobs.append(ReelJob(reel_key=reel_key, music_key=music_key))
    return jobs


def build_output_path(temp_dir: Path, reel_key: str) -> Path:
    source_name = Path(reel_key).stem
    return temp_dir / f"{source_name}-final.mp4"


def copy_without_music(source_video: Path, output_video: Path) -> None:
    shutil.copy2(source_video, output_video)


def render_with_music(video_path: Path, music_path: Path, output_path: Path) -> tuple[float, float, float]:
    reel_duration = ffprobe_duration(video_path)
    music_duration = ffprobe_duration(music_path)
    volume = round(random.uniform(0.16, 0.20), 2)
    fade_duration = min(1.0, max(reel_duration / 4, 0.3))
    fade_out_start = max(reel_duration - fade_duration, 0)
    offset = 0.0

    if music_duration > reel_duration:
        offset = round(random.uniform(0, max(music_duration - reel_duration, 0)), 2)

    command = [
        ensure_binary("ffmpeg"),
        "-y",
        "-ss",
        str(offset),
        "-stream_loop",
        "-1",
        "-i",
        str(music_path),
        "-i",
        str(video_path),
        "-filter_complex",
        (
            f"[0:a]atrim=0:{reel_duration},asetpts=N/SR/TB,"
            f"volume={volume},afade=t=in:st=0:d={fade_duration},"
            f"afade=t=out:st={fade_out_start}:d={fade_duration}[music]"
        ),
        "-map",
        "1:v:0",
        "-map",
        "[music]",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        "-shortest",
        str(output_path),
    ]
    run_command(command, capture_output=True)
    return reel_duration, music_duration, offset


def upload_video_to_facebook(
    *,
    page_id: str,
    access_token: str,
    graph_api_version: str,
    caption: str,
    video_path: Path,
) -> dict[str, Any]:
    endpoint = f"https://graph.facebook.com/{graph_api_version}/{page_id}/videos"

    def do_upload() -> dict[str, Any]:
        with video_path.open("rb") as video_file:
            response = requests.post(
                endpoint,
                data={
                    "access_token": access_token,
                    "description": caption,
                },
                files={"source": (video_path.name, video_file, "video/mp4")},
                timeout=300,
            )

        if response.status_code >= 400:
            error = requests.HTTPError(
                f"Facebook upload failed with status {response.status_code}: {response.text}"
            )
            error.response = response
            raise error
        return response.json()

    return retry(do_upload, attempts=3, delay_seconds=3.0, is_retryable=is_retryable_upload_error)


def main() -> int:
    load_env_files()
    args = parse_args()

    try:
        page_id = get_env("FACEBOOK_PAGE_ID", required=True)
        graph_api_version = get_env("GRAPH_API_VERSION", DEFAULT_GRAPH_API_VERSION)
        fallback_caption = get_env("FIXED_CAPTION", "")
        posts_per_run = get_int_env("POSTS_PER_RUN", DEFAULT_POSTS_PER_RUN)
        bucket = get_env("R2_BUCKET_NAME", required=True)
        reels_prefix = get_env("R2_REELS_PREFIX", "reels/")
        music_prefix = get_env("R2_MUSIC_PREFIX", "music/")
        captions_path = Path(get_env("CAPTIONS_FILE_PATH", DEFAULT_CAPTIONS_PATH))
        direct_page_access_token = get_env("FACEBOOK_PAGE_ACCESS_TOKEN", "", required=False).strip() or None
        user_access_token = get_env("FACEBOOK_USER_ACCESS_TOKEN", "", required=False).strip() or None
        app_id = get_env("FACEBOOK_APP_ID", "", required=False).strip() or None
        app_secret = get_env("FACEBOOK_APP_SECRET", "", required=False).strip() or None
        token_cache_path = Path(get_env("FACEBOOK_TOKEN_CACHE_PATH", "scratch/facebook_tokens.json"))
        client = create_r2_client()
        ensure_binary("ffmpeg")
        ensure_binary("ffprobe")
        captions = load_captions(captions_path)
        token_manager = TokenManager(
            graph_api_version=graph_api_version,
            app_id=app_id,
            app_secret=app_secret,
            user_access_token=user_access_token,
            token_cache_path=token_cache_path,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("%s", exc)
        return 1

    reel_keys = list_r2_keys(client, bucket, reels_prefix, ".mp4")
    if not reel_keys:
        logger.warning("No reels found in R2 prefix %s. Exiting cleanly.", reels_prefix)
        return 0

    music_keys = list_r2_keys(client, bucket, music_prefix, ".mp3")
    if not music_keys:
        logger.warning("No music found in R2 prefix %s. Reels will post without added music.", music_prefix)

    jobs = select_jobs(reel_keys, music_keys, posts_per_run)
    logger.info("Selected %s reel(s) for this run.", len(jobs))

    for index, job in enumerate(jobs, start=1):
        logger.info("Processing reel %s/%s: %s", index, len(jobs), job.reel_key)
        with create_temp_dir() as temp_dir_name:
            temp_dir = Path(temp_dir_name)
            reel_path = temp_dir / Path(job.reel_key).name
            output_path = build_output_path(temp_dir, job.reel_key)
            music_path = temp_dir / Path(job.music_key).name if job.music_key else None

            try:
                selected_caption, selected_caption_index = select_caption(captions, fallback_caption)
                if selected_caption_index is not None:
                    logger.info("Selected caption index: %s", selected_caption_index)
                else:
                    logger.info("Caption pool unavailable. Falling back to FIXED_CAPTION.")

                retry(
                    lambda: download_r2_object(client, bucket, job.reel_key, reel_path),
                    attempts=3,
                    delay_seconds=2.0,
                )
                logger.info("Downloaded reel: %s", reel_path)

                if job.music_key and music_path:
                    retry(
                        lambda: download_r2_object(client, bucket, job.music_key, music_path),
                        attempts=3,
                        delay_seconds=2.0,
                    )
                    logger.info("Downloaded music: %s", music_path)
                    reel_duration, music_duration, offset = render_with_music(reel_path, music_path, output_path)
                    logger.info(
                        "Rendered final reel with music. reel_duration=%.2fs music_duration=%.2fs offset=%.2fs",
                        reel_duration,
                        music_duration,
                        offset,
                    )
                else:
                    copy_without_music(reel_path, output_path)
                    logger.warning("No music selected. Using original reel without added music.")

                if args.dry_run:
                    logger.info(
                        "[DRY RUN] Would upload %s with caption=%r from reel=%s music=%s",
                        output_path,
                        selected_caption,
                        job.reel_key,
                        job.music_key,
                    )
                else:
                    upload_token = direct_page_access_token
                    if upload_token:
                        logger.info("Using configured Facebook Page access token.")
                    else:
                        logger.info("Fetching fresh Facebook Page token using the configured user access token.")
                        upload_token = token_manager.get_page_token(page_id)

                    response = upload_video_to_facebook(
                        page_id=page_id,
                        access_token=upload_token,
                        graph_api_version=graph_api_version,
                        caption=selected_caption,
                        video_path=output_path,
                    )
                    logger.info("Posted reel successfully. Facebook response: %s", response)

                if index < len(jobs):
                    random_sleep_between(60, 120)
            except Exception as exc:  # noqa: BLE001
                logger.error("Failed to process %s: %s", job.reel_key, exc)
                return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
