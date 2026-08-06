from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

from reel_common import (
    create_r2_client,
    get_env,
    load_env_files,
    logger,
    r2_object_exists,
    upload_file_to_r2,
)


@dataclass
class UploadSummary:
    uploaded: int = 0
    skipped: int = 0
    failed: int = 0


# Each entry is one local-dir -> R2-prefix upload lane. `required=False`
# lanes (backgrounds) are skipped with a log line rather than failing the
# whole run if their env var isn't set yet — reels/music stay required
# since the rest of the pipeline can't function without them.
ASSET_TYPES = [
    {
        "name": "reels",
        "env_dir": "LOCAL_REELS_DIR",
        "env_prefix": "R2_REELS_PREFIX",
        "default_prefix": "reels/",
        "pattern": "*.mp4",
        "content_type": "video/mp4",
        "required": True,
    },
    {
        "name": "music",
        "env_dir": "LOCAL_MUSIC_DIR",
        "env_prefix": "R2_MUSIC_PREFIX",
        "default_prefix": "music/",
        "pattern": "*.mp3",
        "content_type": "audio/mpeg",
        "required": True,
    },
    {
        "name": "backgrounds",
        "env_dir": "LOCAL_BACKGROUNDS_DIR",
        "env_prefix": "R2_BACKGROUNDS_PREFIX",
        "default_prefix": "backgrounds/",
        "pattern": "*.mp4",
        "content_type": "video/mp4",
        "required": False,
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload local reel, music, and background assets to Cloudflare R2.")
    parser.add_argument("--force", action="store_true", help="Upload even if the key already exists in R2.")
    parser.add_argument("--dry-run", action="store_true", help="Print what would upload without writing to R2.")
    return parser.parse_args()


def iter_files(directory: Path, pattern: str) -> list[Path]:
    return sorted([path for path in directory.glob(pattern) if path.is_file()])


def upload_directory(
    *,
    client,
    bucket: str,
    local_dir: Path,
    pattern: str,
    prefix: str,
    content_type: str,
    force: bool,
    dry_run: bool,
) -> UploadSummary:
    summary = UploadSummary()
    files = iter_files(local_dir, pattern)
    logger.info("Found %s files matching %s in %s", len(files), pattern, local_dir)

    for file_path in files:
        key = f"{prefix}{file_path.name}"
        try:
            if not force and r2_object_exists(client, bucket, key):
                logger.info("Skipped existing object: %s", key)
                summary.skipped += 1
                continue

            if dry_run:
                logger.info("[DRY RUN] Would upload %s -> %s", file_path, key)
                summary.uploaded += 1
                continue

            upload_file_to_r2(client, bucket, key, file_path, content_type=content_type)
            logger.info("Uploaded %s -> %s", file_path, key)
            summary.uploaded += 1
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to upload %s: %s", file_path, exc)
            summary.failed += 1

    return summary


def main() -> int:
    load_env_files()
    args = parse_args()

    try:
        bucket = get_env("R2_BUCKET_NAME", required=True)
        client = create_r2_client()
    except Exception as exc:  # noqa: BLE001
        logger.error("%s", exc)
        return 1

    summaries: dict[str, UploadSummary] = {}

    for asset_type in ASSET_TYPES:
        name = asset_type["name"]
        raw_dir = get_env(asset_type["env_dir"], "", required=False).strip()
        prefix = get_env(asset_type["env_prefix"], asset_type["default_prefix"])

        if not raw_dir:
            if asset_type["required"]:
                logger.error("Missing required environment variable: %s", asset_type["env_dir"])
                return 1
            logger.info("%s not set — skipping %s upload.", asset_type["env_dir"], name)
            continue

        local_dir = Path(raw_dir)
        if not local_dir.exists():
            if asset_type["required"]:
                logger.error("Local %s directory does not exist: %s", name, local_dir)
                return 1
            logger.info("Local %s directory does not exist (%s) — skipping.", name, local_dir)
            continue

        summaries[name] = upload_directory(
            client=client,
            bucket=bucket,
            local_dir=local_dir,
            pattern=asset_type["pattern"],
            prefix=prefix,
            content_type=asset_type["content_type"],
            force=args.force,
            dry_run=args.dry_run,
        )

    for name, summary in summaries.items():
        logger.info(
            "%s: uploaded=%s skipped=%s failed=%s",
            name,
            summary.uploaded,
            summary.skipped,
            summary.failed,
        )

    any_failed = any(summary.failed > 0 for summary in summaries.values())
    return 1 if any_failed else 0


if __name__ == "__main__":
    sys.exit(main())
