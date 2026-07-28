from __future__ import annotations

import json
import logging
import os
import random
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any, Callable, Iterable

import boto3
import requests
from botocore.client import BaseClient
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from dotenv import load_dotenv


DEFAULT_TOKEN_REFRESH_SECONDS = 7 * 24 * 3600


LOGGER_NAME = "ace11plus.reels"


def configure_logging() -> logging.Logger:
    logger = logging.getLogger(LOGGER_NAME)
    if logger.handlers:
        return logger

    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger


logger = configure_logging()


def load_env_files() -> None:
    for candidate in (".env.local", ".env", "config.env"):
        if Path(candidate).exists():
            load_dotenv(candidate, override=False)


def get_env(name: str, default: str | None = None, required: bool = False) -> str:
    value = os.getenv(name, default)
    if required and (value is None or value.strip() == ""):
        raise ValueError(f"Missing required environment variable: {name}")
    if value is None:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def get_int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise ValueError(f"Environment variable {name} must be an integer.") from exc


def ensure_binary(name: str) -> str:
    binary_path = shutil.which(name)
    if not binary_path:
        raise RuntimeError(f"Required binary not found on PATH: {name}")
    return binary_path


def run_command(command: list[str], *, capture_output: bool = True) -> subprocess.CompletedProcess[str]:
    logger.info("Running command: %s", " ".join(command))
    return subprocess.run(
        command,
        check=True,
        text=True,
        capture_output=capture_output,
    )


def ffprobe_duration(path: Path) -> float:
    result = run_command(
        [
            ensure_binary("ffprobe"),
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(path),
        ]
    )
    payload = json.loads(result.stdout)
    duration = payload.get("format", {}).get("duration")
    if duration is None:
        raise RuntimeError(f"Could not determine duration for {path}")
    return float(duration)


def create_temp_dir(prefix: str = "ace11plus-reels-") -> tempfile.TemporaryDirectory[str]:
    return tempfile.TemporaryDirectory(prefix=prefix)


def create_r2_client() -> BaseClient:
    return boto3.client(
        "s3",
        endpoint_url=get_env("R2_ENDPOINT_URL", required=True),
        aws_access_key_id=get_env("R2_ACCESS_KEY_ID", required=True),
        aws_secret_access_key=get_env("R2_SECRET_ACCESS_KEY", required=True),
        region_name="auto",
        config=BotoConfig(signature_version="s3v4"),
    )


def list_r2_keys(client: BaseClient, bucket: str, prefix: str, suffix: str) -> list[str]:
    paginator = client.get_paginator("list_objects_v2")
    keys: list[str] = []
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for item in page.get("Contents", []):
            key = item["Key"]
            if key.lower().endswith(suffix.lower()):
                keys.append(key)
    return keys


def r2_object_exists(client: BaseClient, bucket: str, key: str) -> bool:
    try:
        client.head_object(Bucket=bucket, Key=key)
        return True
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code")
        if error_code in {"404", "NoSuchKey", "NotFound"}:
            return False
        raise


def upload_file_to_r2(client: BaseClient, bucket: str, key: str, file_path: Path, *, content_type: str | None = None) -> None:
    extra_args: dict[str, str] = {}
    if content_type:
        extra_args["ContentType"] = content_type
    with file_path.open("rb") as fh:
        if extra_args:
            client.upload_fileobj(fh, bucket, key, ExtraArgs=extra_args)
        else:
            client.upload_fileobj(fh, bucket, key)


def download_r2_object(client: BaseClient, bucket: str, key: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        with destination.open("wb") as fh:
            client.download_fileobj(bucket, key, fh)
    except Exception:
        # Opening destination for write creates an empty file before the
        # download itself can fail (e.g. key doesn't exist yet on a first
        # run) — remove it rather than leaving a 0-byte file that a later
        # "does this cache exist locally" check would find and choke on.
        destination.unlink(missing_ok=True)
        raise


def generate_presigned_url(client: BaseClient, bucket: str, key: str, *, expires_in: int = 3600) -> str:
    """Public, time-limited GET URL for an R2 object.

    Facebook's video endpoint accepts a direct file upload, but Instagram's
    Graph API (`/media` with `media_type=REELS`) requires a `video_url` it
    fetches from itself, so the rendered reel needs to be reachable over
    HTTP(S) rather than posted as multipart form data.
    """
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expires_in,
    )


def retry(
    operation: Callable[[], Any],
    *,
    attempts: int = 3,
    delay_seconds: float = 2.0,
    is_retryable: Callable[[Exception], bool] | None = None,
) -> Any:
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return operation()
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            retryable = is_retryable(exc) if is_retryable else True
            if not retryable or attempt == attempts:
                raise
            logger.warning("Retrying after error (%s/%s): %s", attempt, attempts, exc)
            time.sleep(delay_seconds * attempt)
    if last_error:
        raise last_error


def random_sleep_between(min_seconds: int, max_seconds: int) -> None:
    delay = random.randint(min_seconds, max_seconds)
    logger.info("Sleeping for %s seconds before the next post.", delay)
    time.sleep(delay)


def choose_random_subset(items: Iterable[str], count: int) -> list[str]:
    all_items = list(items)
    if not all_items:
        return []
    if count >= len(all_items):
        random.shuffle(all_items)
        return all_items
    return random.sample(all_items, count)


class TokenManager:
    """Long-lived Facebook Graph API user-token manager, shared by any script
    that needs a Page token (reel posting, comment/DM automation, ...).

    Two Graph API auth modes converge here: a long-lived user token that's
    refreshed automatically (app_id/app_secret configured), or a token used
    as-is with no refresh (app_id/app_secret omitted). Refreshed tokens are
    synced to R2 (when configured), not just written to token_cache_path —
    GitHub Actions runners are ephemeral, so a local-only cache means a
    refreshed token is silently discarded at the end of every run, and the
    next run falls back to the original (eventually-expiring) secret instead
    of the one actually refreshed 7 days ago.
    """

    def __init__(
        self,
        *,
        graph_api_version: str,
        app_id: str | None,
        app_secret: str | None,
        user_access_token: str | None,
        token_cache_path: Path,
        r2_client: BaseClient | None = None,
        r2_bucket: str | None = None,
        r2_key: str | None = None,
        platform_label: str = "Facebook",
    ) -> None:
        self.graph_api_version = graph_api_version
        self.app_id = app_id
        self.app_secret = app_secret
        self.initial_user_token = user_access_token
        self.token_cache_path = token_cache_path
        self.r2_client = r2_client
        self.r2_bucket = r2_bucket
        self.r2_key = r2_key
        # Purely cosmetic — distinguishes this instance's log lines when a
        # second, independent TokenManager is used for a different platform's
        # own Facebook Developer App (e.g. Instagram running under a separate
        # app from the one used for Facebook Page posting).
        self.platform_label = platform_label
        self.tokens: dict[str, Any] | None = None

    def _load_tokens(self) -> dict[str, Any]:
        if self.tokens is not None:
            return self.tokens

        if not self.token_cache_path.exists() and self.r2_client and self.r2_bucket and self.r2_key:
            try:
                download_r2_object(self.r2_client, self.r2_bucket, self.r2_key, self.token_cache_path)
                logger.info("Restored %s token cache from R2: %s", self.platform_label, self.r2_key)
            except Exception as exc:  # noqa: BLE001
                logger.info("No %s token cache in R2 yet (%s): %s", self.platform_label, self.r2_key, exc)

        if self.token_cache_path.exists():
            try:
                self.tokens = json.loads(self.token_cache_path.read_text(encoding="utf-8"))
                return self.tokens
            except Exception as exc:  # noqa: BLE001
                logger.warning("Could not read token cache %s: %s", self.token_cache_path, exc)

        if not self.initial_user_token:
            raise ValueError(
                f"Missing {self.platform_label} token configuration: no cached token, no R2 cache, "
                "and no initial user access token was provided."
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

        if self.r2_client and self.r2_bucket and self.r2_key:
            try:
                upload_file_to_r2(
                    self.r2_client,
                    self.r2_bucket,
                    self.r2_key,
                    self.token_cache_path,
                    content_type="application/json",
                )
                logger.info("Synced refreshed %s token cache to R2: %s", self.platform_label, self.r2_key)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Could not sync %s token cache to R2 (%s): %s", self.platform_label, self.r2_key, exc)

    def get_user_token(self) -> str:
        tokens = self._load_tokens()
        user_token = tokens.get("user_token")
        if not user_token:
            raise ValueError(f"No {self.platform_label} user token available.")

        if not self.app_id or not self.app_secret:
            return user_token

        current_time = time.time()
        if current_time - float(tokens.get("last_refresh", 0)) > DEFAULT_TOKEN_REFRESH_SECONDS:
            self.refresh_user_token()
            tokens = self._load_tokens()
            user_token = tokens.get("user_token")
            if not user_token:
                raise ValueError(f"{self.platform_label} user token refresh did not return a usable token.")

        return str(user_token)

    def refresh_user_token(self) -> None:
        tokens = self._load_tokens()
        user_token = tokens.get("user_token")
        if not user_token:
            raise ValueError(f"Cannot refresh {self.platform_label} user token because none is configured.")
        if not self.app_id or not self.app_secret:
            logger.info("Skipping %s user token refresh because app credentials are not configured.", self.platform_label)
            return

        logger.info("Refreshing %s long-lived user access token.", self.platform_label)
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
            raise RuntimeError(f"Failed to refresh {self.platform_label} user token: {payload}")

        tokens["user_token"] = payload["access_token"]
        tokens["last_refresh"] = time.time()
        self._save_tokens()
        logger.info("%s user token refreshed and cached.", self.platform_label)

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
