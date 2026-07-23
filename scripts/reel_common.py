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
from botocore.client import BaseClient
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from dotenv import load_dotenv


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
    with destination.open("wb") as fh:
        client.download_fileobj(bucket, key, fh)


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
