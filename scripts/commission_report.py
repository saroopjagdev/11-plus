"""Monthly tutor-partner commission report: single-command, no spreadsheet.

For every registered referral partner (scripts/tutor-partner-referrals-migration.sql),
shows how many students signed up through their code, how many actually
converted to a paid invoice, what's owed for the current calendar month, and
what's already been paid out historically. Commission rows themselves are
written by the invoice.payment_succeeded handler in
src/app/api/webhooks/stripe/route.ts -- this script only reads and
summarises, it never writes anything.

"Owed" here means recorded and unpaid (partner_commissions.paid_out = false)
-- it is not itself a payment mechanism. After actually paying a partner,
mark their rows paid with --mark-paid (see below), so next month's "total
paid historically" and this month's "owed" stay accurate.

Usage:
  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  python scripts/commission_report.py [--month YYYY-MM] [--mark-paid CODE]
"""

from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from datetime import date, datetime
from typing import Any

from reel_common import get_env, load_env_files, logger, supabase_select_rows

try:
    import requests
except ImportError:  # pragma: no cover - requests is already a hard dependency elsewhere
    requests = None  # type: ignore[assignment]


def month_bounds(month_str: str | None) -> tuple[date, str]:
    """Returns (first-of-month date, 'YYYY-MM' label). Defaults to the
    current calendar month -- "current period" in the brief.
    """
    if month_str:
        year, month = (int(part) for part in month_str.split("-", 1))
    else:
        today = date.today()
        year, month = today.year, today.month
    period_start = date(year, month, 1)
    return period_start, f"{year:04d}-{month:02d}"


def fetch_all(*, supabase_url: str, service_role_key: str, table: str, select: str) -> list[dict[str, Any]]:
    return supabase_select_rows(
        supabase_url=supabase_url,
        service_role_key=service_role_key,
        table=table,
        params={"select": select, "limit": "10000"},
    )


def money(cents: int, currency: str = "gbp") -> str:
    symbol = {"gbp": "£", "usd": "$", "eur": "€"}.get(currency.lower(), currency.upper() + " ")
    return f"{symbol}{cents / 100:,.2f}"


def print_table(rows: list[list[str]], headers: list[str]) -> None:
    widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            widths[i] = max(widths[i], len(cell))

    def fmt_row(cells: list[str]) -> str:
        return "  ".join(cell.ljust(widths[i]) for i, cell in enumerate(cells))

    print(fmt_row(headers))
    print("  ".join("-" * w for w in widths))
    for row in rows:
        print(fmt_row(row))


def mark_paid(*, supabase_url: str, service_role_key: str, code: str) -> int:
    """Marks every currently-unpaid commission row for one partner as paid,
    stamped with now(). Returns the count of rows updated. A blunt "pay
    everything owed right now" action -- intentionally simple, matching how
    this would actually be done (a human decides to pay a partner, then
    marks it), not a partial/period-scoped settlement tool.
    """
    if requests is None:
        raise RuntimeError("requests is required for --mark-paid")

    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/partner_commissions"
    response = requests.patch(
        endpoint,
        headers={
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        params={"partner_code": f"eq.{code}", "paid_out": "eq.false"},
        json={"paid_out": True, "paid_out_at": datetime.utcnow().isoformat() + "Z"},
        timeout=30,
    )
    if response.status_code >= 400:
        raise RuntimeError(f"Failed to mark {code} paid: {response.text}")
    return len(response.json())


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Monthly tutor-partner commission report.")
    parser.add_argument("--month", help="Report period as YYYY-MM. Defaults to the current calendar month.")
    parser.add_argument(
        "--mark-paid",
        metavar="CODE",
        help="Mark every currently-unpaid commission row for this partner code as paid, then exit.",
    )
    return parser.parse_args()


def main() -> int:
    load_env_files()
    args = parse_args()

    try:
        supabase_url = get_env("NEXT_PUBLIC_SUPABASE_URL", required=True)
        service_role_key = get_env("SUPABASE_SERVICE_ROLE_KEY", required=True)
    except Exception as exc:  # noqa: BLE001
        logger.error("%s", exc)
        return 1

    if args.mark_paid:
        updated = mark_paid(supabase_url=supabase_url, service_role_key=service_role_key, code=args.mark_paid)
        logger.info("Marked %s commission row(s) paid for %s.", updated, args.mark_paid)
        return 0

    period_start, period_label = month_bounds(args.month)

    try:
        partners = fetch_all(
            supabase_url=supabase_url,
            service_role_key=service_role_key,
            table="referral_partners",
            select="code,name,region,status",
        )
    except RuntimeError as exc:
        logger.error("%s", exc)
        logger.error(
            "If this is a missing-table error, scripts/tutor-partner-referrals-migration.sql "
            "needs to be applied via the Supabase SQL editor first."
        )
        return 1

    if not partners:
        print("No referral partners registered yet. Run scripts/generate_tutor_outreach.py first.")
        return 0

    signups = fetch_all(
        supabase_url=supabase_url,
        service_role_key=service_role_key,
        table="profiles",
        select="id,partner_referral_code",
    )
    commissions = fetch_all(
        supabase_url=supabase_url,
        service_role_key=service_role_key,
        table="partner_commissions",
        select="partner_code,profile_id,commission_cents,currency,period_start,paid_out",
    )

    signup_counts: dict[str, int] = defaultdict(int)
    for profile in signups:
        code = profile.get("partner_referral_code")
        if code:
            signup_counts[code] += 1

    converted: dict[str, set[str]] = defaultdict(set)
    current_period_owed: dict[str, int] = defaultdict(int)
    total_unpaid: dict[str, int] = defaultdict(int)
    total_paid: dict[str, int] = defaultdict(int)
    currency_by_code: dict[str, str] = {}

    for row in commissions:
        code = row["partner_code"]
        converted[code].add(row["profile_id"])
        currency_by_code[code] = row.get("currency", "gbp")
        cents = row["commission_cents"]

        if row["paid_out"]:
            total_paid[code] += cents
        else:
            total_unpaid[code] += cents
            if row["period_start"] == period_start.isoformat():
                current_period_owed[code] += cents

    table_rows = []
    grand_owed_this_period = 0
    grand_paid_total = 0

    for partner in sorted(partners, key=lambda p: p["name"].lower()):
        code = partner["code"]
        currency = currency_by_code.get(code, "gbp")
        owed_now = current_period_owed.get(code, 0)
        unpaid_all_time = total_unpaid.get(code, 0)
        paid_total = total_paid.get(code, 0)
        grand_owed_this_period += owed_now
        grand_paid_total += paid_total

        table_rows.append(
            [
                partner["name"],
                code,
                partner.get("region") or "-",
                str(signup_counts.get(code, 0)),
                str(len(converted.get(code, set()))),
                money(owed_now, currency),
                money(unpaid_all_time, currency),
                money(paid_total, currency),
            ]
        )

    print(f"Tutor Partner Commission Report -- period {period_label}")
    print(f"({len(partners)} partner(s) registered)")
    print()
    print_table(
        table_rows,
        headers=[
            "Partner",
            "Code",
            "Region",
            "Signups",
            "Converted",
            f"Owed ({period_label})",
            "Owed (all unpaid)",
            "Paid historically",
        ],
    )
    print()
    print(f"Total owed for {period_label}: {money(grand_owed_this_period)}")
    print(f"Total paid out historically (all partners, all time): {money(grand_paid_total)}")
    print()
    print("To record a payout after actually paying a partner:")
    print("  python scripts/commission_report.py --mark-paid <code>")
    return 0


if __name__ == "__main__":
    sys.exit(main())
