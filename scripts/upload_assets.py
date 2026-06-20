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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload local reel and music assets to Cloudflare R2.")
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
        reels_dir = Path(get_env("LOCAL_REELS_DIR", required=True))
        music_dir = Path(get_env("LOCAL_MUSIC_DIR", required=True))
        client = create_r2_client()
    except Exception as exc:  # noqa: BLE001
        logger.error("%s", exc)
        return 1

    if not reels_dir.exists():
        logger.error("Local reels directory does not exist: %s", reels_dir)
        return 1

    if not music_dir.exists():
        logger.error("Local music directory does not exist: %s", music_dir)
        return 1

    reels_summary = upload_directory(
        client=client,
        bucket=bucket,
        local_dir=reels_dir,
        pattern="*.mp4",
        prefix="reels/",
        content_type="video/mp4",
        force=args.force,
        dry_run=args.dry_run,
    )
    music_summary = upload_directory(
        client=client,
        bucket=bucket,
        local_dir=music_dir,
        pattern="*.mp3",
        prefix="music/",
        content_type="audio/mpeg",
        force=args.force,
        dry_run=args.dry_run,
    )

    logger.info(
        "Upload complete. reels(uploaded=%s skipped=%s failed=%s) music(uploaded=%s skipped=%s failed=%s)",
        reels_summary.uploaded,
        reels_summary.skipped,
        reels_summary.failed,
        music_summary.uploaded,
        music_summary.skipped,
        music_summary.failed,
    )
    return 0 if reels_summary.failed == 0 and music_summary.failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
