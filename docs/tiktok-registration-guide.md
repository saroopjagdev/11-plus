# TikTok Content Posting API — Manual Registration Guide

This is a manual, human-only process — TikTok requires business verification tied to a real person/company, so this can't be automated or done on your behalf. Follow these steps yourself at developers.tiktok.com. Where I'm not fully certain of a current exact button label or menu path (TikTok's developer UI changes fairly often), I've flagged it — treat those as "look for something like this" rather than a literal script.

## 1. Create a TikTok Business Account for Ace 11+

If Ace 11+ doesn't already have a dedicated TikTok account:

1. Download the TikTok app or go to tiktok.com and sign up with a dedicated email (e.g. a shared team inbox, not a personal one) — use `support@ace11plus.org` or similar so access isn't tied to one person.
2. In the app: **Profile → Settings and privacy → Account → Switch to Business Account** (label may read slightly differently, e.g. "Manage account"). This unlocks analytics and is a prerequisite for API access.
3. Fill in the business category (Education), profile photo, bio, and a link to ace11plus.org.

If you already post to TikTok personally/informally, do **not** reuse that personal account — create a separate, dedicated business account for Ace 11+ so posting credentials aren't tied to a personal profile.

## 2. Register as a Developer

1. Go to **developers.tiktok.com** and log in with the Ace 11+ TikTok account (or a separate developer login linked to it — TikTok has changed this pairing before, so use whichever the site prompts for at the "Manage apps" / "Register" step).
2. Complete the developer registration form: company/individual name, contact email, country (United Kingdom).
3. Verify your email address if prompted.

## 3. Create an App and Request Content Posting API Access

1. From the developer portal, go to **Manage apps → Create an app** (exact label may vary).
2. Give it a name (e.g. "Ace 11+ Reel Publisher") and a short description — you can reuse the use-case text in `docs/tiktok-use-case.md`.
3. Under the app's **Products** or **Add products** section, add **Content Posting API**. Do not just add Login Kit alone — you specifically need Content Posting API (sometimes shown under a "Direct Post" or "Content Posting" product tile) since that's what allows publishing video without a human clicking "post" inside the app each time.
4. You'll be asked to specify the intended scope(s) — for this use case you want video upload/publish scopes (commonly named something like `video.publish` and `video.upload`; exact scope names have changed over time, so pick whatever is labeled for posting/publishing video, not just reading user data).
5. Fill in the use-case description field with the text from `docs/tiktok-use-case.md`.

## 4. Business Verification

TikTok will require verifying that you're a real, operating business before granting Content Posting API access beyond a small sandbox/test quota. Typically this includes:

- **Business name and registration details** — if Ace 11+ is a registered company (check what's on file — the terms of service at `src/app/terms/page.tsx` currently refers to "Ace 11+ Intelligence" as the entity holding IP), have your company registration number and registered address ready. If it isn't currently a registered legal entity, be prepared for this to be a blocker or to need sole-trader/individual verification instead.
- **Privacy Policy URL** — use `https://ace11plus.org/privacy` (now updated and adequate per Deliverable 1 above).
- **Terms of Service URL** — `https://ace11plus.org/terms` exists and is live, so use that.
- **A working website** with content matching what you describe (ace11plus.org already qualifies).
- Possibly a short video demo or screen recording showing your intended posting flow, depending on the review stage — some apps are asked for this, some aren't.

## 5. Review and Approval Timelines

Set honest expectations here:

- Initial app creation and sandbox access is usually near-instant.
- Full Content Posting API approval (unaudited apps are limited to posting privately/to a small user set) typically takes **anywhere from a few days to several weeks**. TikTok's review process is generally regarded as slower and stricter than Meta's Graph API review — expect follow-up questions, possible rejection-and-resubmission cycles, and don't be surprised if the first submission comes back asking for more detail or a demo video.
- Until fully approved, posts may be restricted (e.g. private-only, or capped volume) — don't rely on 2x/day public posting working immediately after submission.
- If rejected, TikTok usually gives a reason; the most common ones are an inadequate privacy policy (should be resolved by Deliverable 1) or an unclear/generic use-case description (Deliverable 2 is written to be specific and non-generic for exactly this reason).

## 6. Credentials You'll End Up With

Once the app is created (even before full approval, for sandbox testing), the developer portal will show:

- **Client Key** (sometimes called Client ID) — public-ish identifier for the app.
- **Client Secret** — must be kept private, same handling as `FACEBOOK_APP_SECRET` in the existing GitHub Actions secrets.
- An **OAuth authorization flow** you'll need to complete once, manually, in a browser, logged in as the Ace 11+ TikTok business account, to grant the app permission to post on that account's behalf. This produces:
  - An **access token** (short-lived)
  - A **refresh token** (long-lived — this is the one that matters for unattended/cron posting, analogous to `YOUTUBE_REFRESH_TOKEN` / the Facebook long-lived user token pattern already in `scripts/`)

Once you have Client Key, Client Secret, and a refresh token, hand those back (as GitHub Actions secrets, the same way `INSTAGRAM_APP_ID`/`INSTAGRAM_APP_SECRET`/etc. are handled today) and the actual `social_tiktok.py`-style posting script can be built to mirror `scripts/social_instagram.py`.

## A note on certainty

Steps 1–2 and the general shape of steps 3–6 reflect how TikTok's developer program has worked in recent years, but exact menu labels, scope names, and verification document requirements do change without much notice. If anything on the actual site doesn't match what's described here, go with what's on screen — the concepts (business account → developer registration → app → request Content Posting API product → business verification → OAuth → refresh token) are what matter, not the precise wording.
