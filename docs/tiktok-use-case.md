# TikTok Content Posting API — Use Case Description

*Drafted for pasting into TikTok's developer app review form.*

Ace 11+ (ace11plus.org) is a UK-based online learning platform that helps parents prepare their children (ages 7–11) for the 11+ entrance exam, used for selective secondary school admissions in England. We provide practice questions, progress tracking, and an AI tutor to support families through exam preparation.

We are requesting Content Posting API access to automate publishing our own original educational content to our business's TikTok account. This is 100% first-party content creation and posting: we generate short (15–30 second) practice-tip and vocabulary videos in-house, using a background video loop, text-card overlays summarizing an 11+ exam tip or vocabulary word, and licensed background music. This content is already produced and posted automatically to our Instagram Reels, Facebook, and YouTube accounts today via the Meta Graph API and YouTube Data API; TikTok would be an additional destination for the same content pipeline, using the same generation process (`scripts/generate_reel.py`) and the same posting cadence.

This integration does not use TikTok Login Kit and does not involve any end-user TikTok authentication, scraping, or engagement with other users' content or accounts. We are not collecting, storing, or processing any TikTok user data — the API is used solely to publish videos from our own account to our own account, authenticated with our own business credentials.

Intended posting cadence is twice per day, matching our existing Instagram/Facebook/YouTube schedule, run on an automated cron-triggered pipeline (GitHub Actions).
