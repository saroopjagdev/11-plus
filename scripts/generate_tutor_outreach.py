"""Generates personalised tutor-partnership outreach email drafts from a
CSV of leads, and registers a unique referral code per lead in the
referral_partners table (see scripts/tutor-partner-referrals-migration.sql).

Deliberately does not send anything -- see README's Outreach Setup section.
Every draft is written to a local review folder for a human to read, adjust
if needed, and send manually. This is intentional: a cold-outreach list
scraped from tutoring directories needs a human's judgment before anything
goes out, the same way scripts/generate_reel.py's output is reviewed before
first use rather than auto-posted sight-unseen.

Idempotent: re-running against an updated CSV (e.g. once real emails are
filled in) reuses each lead's existing code/partner row by matching on
(name, region) rather than minting a fresh one and duplicating them in
referral_partners.

Usage:
  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  python scripts/generate_tutor_outreach.py \
      [--csv PATH] [--output-dir PATH] [--dry-run]
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from dataclasses import dataclass
from pathlib import Path

from reel_common import get_env, load_env_files, logger, supabase_insert_rows, supabase_select_rows


DEFAULT_CSV_PATH = r"C:\Users\ssjag\OneDrive\Ace11Plus\Outreach\tutor_leads.csv"
DEFAULT_OUTPUT_DIR = r"C:\Users\ssjag\OneDrive\Ace11Plus\Outreach\drafts"
SITE_URL = "https://www.ace11plus.org"

# Placeholder defaults per the outreach brief -- adjust here (or per-partner
# in referral_partners, once that supports a dynamic Stripe coupon) if
# different numbers are wanted before sending.
DISCOUNT_PCT = 15
COMMISSION_PCT = 20
COMMISSION_MONTHS = 3

EMAIL_TEMPLATE = """Subject: Quick idea for your {region_clause}11+ students

Hi {name}, I am a parent who built Ace11Plus, a free 11+ practice platform covering Maths, English and Verbal Reasoning. I know tutoring time is valuable, so I built this to help handle repetitive practice between sessions.

I would love to offer you a referral partnership: any student who signs up through your unique link gets {discount_pct}% off their first payment, and you earn {commission_pct}% of what they pay for their first {commission_months} months. No obligation either way, just thought it might be useful.

Is this something that would interest you?

Your unique link: {signup_link}

Ace11Plus Team
"""


class OutreachError(RuntimeError):
    pass


@dataclass
class Lead:
    name: str
    region: str
    specialism: str
    email: str
    source: str


def slugify_code(name: str) -> str:
    """Lowercased, no spaces or punctuation -- per the brief. Messy source
    names (`Acn (Alison)`, `Mr Alam`) are common in this CSV; strip down to
    alphanumerics only rather than trying to guess a "real" name out of them.
    """
    slug = re.sub(r"[^a-z0-9]", "", name.lower())
    return slug or "partner"


def unique_code(base: str, taken: set[str]) -> str:
    if base not in taken:
        return base
    n = 2
    while f"{base}{n}" in taken:
        n += 1
    return f"{base}{n}"


def load_leads(csv_path: Path) -> tuple[list[Lead], int]:
    """Returns (leads with a usable email, count of rows skipped for having
    none) -- the brief is explicit about only drafting for leads with a
    public email, never fabricating one.
    """
    with csv_path.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    leads: list[Lead] = []
    skipped_no_email = 0
    for row in rows:
        email = (row.get("Email") or "").strip()
        if not email or "@" not in email:
            skipped_no_email += 1
            continue
        leads.append(
            Lead(
                name=(row.get("Name") or "").strip(),
                region=(row.get("Region") or "").strip(),
                specialism=(row.get("Specialism") or "").strip(),
                email=email,
                source=(row.get("Source") or "").strip(),
            )
        )
    return leads, skipped_no_email


def build_email(lead: Lead, code: str) -> str:
    region_clause = f"{lead.region} " if lead.region else ""
    signup_link = f"{SITE_URL}/signup?ref={code}"
    return EMAIL_TEMPLATE.format(
        region_clause=region_clause,
        name=lead.name or "there",
        discount_pct=DISCOUNT_PCT,
        commission_pct=COMMISSION_PCT,
        commission_months=COMMISSION_MONTHS,
        signup_link=signup_link,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate personalised tutor outreach email drafts.")
    parser.add_argument("--csv", default=DEFAULT_CSV_PATH, help="Path to the tutor leads CSV.")
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR, help="Folder to write draft emails to.")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing files or touching Supabase.")
    return parser.parse_args()


def main() -> int:
    load_env_files()
    args = parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        logger.error("CSV not found: %s", csv_path)
        return 1

    leads, skipped_no_email = load_leads(csv_path)
    logger.info(
        "Read %s row(s) from %s: %s with a usable email, %s skipped (no email).",
        len(leads) + skipped_no_email,
        csv_path,
        len(leads),
        skipped_no_email,
    )

    if not leads:
        logger.info("No leads with an email to draft for. Nothing to do.")
        logger.info("SUMMARY: 0 outreach drafts created.")
        return 0

    try:
        supabase_url = get_env("NEXT_PUBLIC_SUPABASE_URL", required=True)
        service_role_key = get_env("SUPABASE_SERVICE_ROLE_KEY", required=True)
    except Exception as exc:  # noqa: BLE001
        logger.error("%s", exc)
        return 1

    existing_partners = supabase_select_rows(
        supabase_url=supabase_url,
        service_role_key=service_role_key,
        table="referral_partners",
        params={"select": "code,name,region"},
    )
    existing_codes = {p["code"] for p in existing_partners}
    # (name, region) lowercased -> code, so re-running against an updated
    # CSV reuses a lead's existing code instead of minting + registering a
    # duplicate partner row for the same person.
    existing_by_identity = {
        ((p.get("name") or "").strip().lower(), (p.get("region") or "").strip().lower()): p["code"]
        for p in existing_partners
    }

    output_dir = Path(args.output_dir)
    if not args.dry_run:
        output_dir.mkdir(parents=True, exist_ok=True)

    new_partner_rows = []
    drafts_written = 0
    reused = 0

    for lead in leads:
        identity = (lead.name.strip().lower(), lead.region.strip().lower())
        code = existing_by_identity.get(identity)

        if code:
            reused += 1
        else:
            code = unique_code(slugify_code(lead.name), existing_codes)
            existing_codes.add(code)
            existing_by_identity[identity] = code
            new_partner_rows.append(
                {
                    "code": code,
                    "name": lead.name,
                    "email": lead.email,
                    "region": lead.region or None,
                    "discount_pct": DISCOUNT_PCT,
                    "commission_pct": COMMISSION_PCT,
                    "commission_months": COMMISSION_MONTHS,
                }
            )

        email_body = build_email(lead, code)

        if args.dry_run:
            logger.info("[DRY RUN] Would draft %s (code=%s) -> %s", lead.email, code, output_dir / f"{code}.txt")
        else:
            draft_path = output_dir / f"{code}.txt"
            draft_path.write_text(f"To: {lead.email}\n{email_body}", encoding="utf-8")
        drafts_written += 1

    if not args.dry_run and new_partner_rows:
        supabase_insert_rows(
            supabase_url=supabase_url,
            service_role_key=service_role_key,
            table="referral_partners",
            rows=new_partner_rows,
        )
        logger.info("Registered %s new partner code(s) in referral_partners.", len(new_partner_rows))

    if not args.dry_run:
        index_path = output_dir / "_index.csv"
        with index_path.open("w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["code", "name", "region", "email", "specialism", "source", "draft_file"])
            for lead in leads:
                identity = (lead.name.strip().lower(), lead.region.strip().lower())
                code = existing_by_identity[identity]
                writer.writerow([code, lead.name, lead.region, lead.email, lead.specialism, lead.source, f"{code}.txt"])
        logger.info("Wrote index: %s", index_path)

    logger.info(
        "SUMMARY: %s outreach draft(s) created (%s new partner code(s), %s reused from a previous run). "
        "%s row(s) skipped for having no email. Nothing was sent -- review drafts in %s before sending manually.",
        drafts_written,
        len(new_partner_rows),
        reused,
        skipped_no_email,
        output_dir,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
