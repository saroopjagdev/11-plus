"""Unit tests for social_instagram_carousel.py.

Deliberately network-free: every `requests` call is monkeypatched to a fake
that returns a canned response, so these exercise only payload construction,
container-flow sequencing, validation, and caption building — never a real
call to Meta's Graph API. Run with:

    python scripts/test_social_instagram_carousel.py
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

import social_instagram_carousel as carousel_mod
from social_instagram_carousel import (
    CAROUSEL_RESOURCE_CTA,
    InstagramPostError,
    build_carousel_caption_from_metadata,
    build_instagram_carousel_caption,
    post_carousel_to_instagram,
)


class FakeResponse:
    def __init__(self, status_code: int, json_payload: dict) -> None:
        self.status_code = status_code
        self._json_payload = json_payload
        self.text = str(json_payload)

    def json(self) -> dict:
        return self._json_payload


class CreateCarouselItemContainerTests(unittest.TestCase):
    def test_builds_expected_payload_and_returns_container_id(self) -> None:
        captured = {}

        def fake_post(url, data=None, timeout=None):
            captured["url"] = url
            captured["data"] = data
            captured["timeout"] = timeout
            return FakeResponse(200, {"id": "child-123"})

        with patch.object(carousel_mod.requests, "post", side_effect=fake_post):
            container_id = carousel_mod._create_carousel_item_container(
                graph_api_version="v19.0",
                ig_user_id="ig-user-1",
                access_token="token-abc",
                image_url="https://r2.example/carousels/img1.jpg?sig=xyz",
            )

        self.assertEqual(container_id, "child-123")
        self.assertEqual(captured["url"], "https://graph.facebook.com/v19.0/ig-user-1/media")
        self.assertEqual(
            captured["data"],
            {
                "image_url": "https://r2.example/carousels/img1.jpg?sig=xyz",
                "is_carousel_item": "true",
                "access_token": "token-abc",
            },
        )

    def test_raises_on_error_status(self) -> None:
        with patch.object(
            carousel_mod.requests, "post", return_value=FakeResponse(400, {"error": "bad request"})
        ):
            with self.assertRaises(Exception):
                carousel_mod._create_carousel_item_container(
                    graph_api_version="v19.0",
                    ig_user_id="ig-user-1",
                    access_token="token-abc",
                    image_url="https://r2.example/img1.jpg",
                )

    def test_raises_instagram_post_error_when_no_id_returned(self) -> None:
        with patch.object(carousel_mod.requests, "post", return_value=FakeResponse(200, {})):
            with self.assertRaises(InstagramPostError):
                carousel_mod._create_carousel_item_container(
                    graph_api_version="v19.0",
                    ig_user_id="ig-user-1",
                    access_token="token-abc",
                    image_url="https://r2.example/img1.jpg",
                )


class CreateCarouselContainerTests(unittest.TestCase):
    def test_builds_expected_payload_with_joined_children(self) -> None:
        captured = {}

        def fake_post(url, data=None, timeout=None):
            captured["url"] = url
            captured["data"] = data
            return FakeResponse(200, {"id": "parent-999"})

        with patch.object(carousel_mod.requests, "post", side_effect=fake_post):
            container_id = carousel_mod._create_carousel_container(
                graph_api_version="v19.0",
                ig_user_id="ig-user-1",
                access_token="token-abc",
                children_ids=["child-1", "child-2", "child-3"],
                caption="Swipe through this!",
            )

        self.assertEqual(container_id, "parent-999")
        self.assertEqual(captured["data"]["media_type"], "CAROUSEL")
        self.assertEqual(captured["data"]["children"], "child-1,child-2,child-3")
        self.assertEqual(captured["data"]["caption"], "Swipe through this!")

    def test_raises_instagram_post_error_when_no_id_returned(self) -> None:
        with patch.object(carousel_mod.requests, "post", return_value=FakeResponse(200, {})):
            with self.assertRaises(InstagramPostError):
                carousel_mod._create_carousel_container(
                    graph_api_version="v19.0",
                    ig_user_id="ig-user-1",
                    access_token="token-abc",
                    children_ids=["child-1", "child-2"],
                    caption="caption",
                )


class PostCarouselToInstagramTests(unittest.TestCase):
    def test_rejects_too_few_images_without_any_network_calls(self) -> None:
        with patch.object(carousel_mod.requests, "post") as mock_post:
            with self.assertRaises(InstagramPostError):
                post_carousel_to_instagram(
                    r2_client=MagicMock(),
                    bucket="bucket",
                    image_keys=["carousels/only-one.jpg"],
                    ig_user_id="ig-user-1",
                    access_token="token-abc",
                    graph_api_version="v19.0",
                    caption="caption",
                )
        mock_post.assert_not_called()

    def test_rejects_too_many_images_without_any_network_calls(self) -> None:
        with patch.object(carousel_mod.requests, "post") as mock_post:
            with self.assertRaises(InstagramPostError):
                post_carousel_to_instagram(
                    r2_client=MagicMock(),
                    bucket="bucket",
                    image_keys=[f"carousels/img{i}.jpg" for i in range(11)],
                    ig_user_id="ig-user-1",
                    access_token="token-abc",
                    graph_api_version="v19.0",
                    caption="caption",
                )
        mock_post.assert_not_called()

    def test_full_flow_creates_children_then_parent_then_publishes(self) -> None:
        fake_r2_client = MagicMock()
        fake_r2_client.generate_presigned_url.side_effect = [
            "https://r2.example/img0.jpg?sig=0",
            "https://r2.example/img1.jpg?sig=1",
            "https://r2.example/img2.jpg?sig=2",
        ]

        post_calls = []

        def fake_post(url, data=None, timeout=None):
            post_calls.append((url, dict(data)))
            if data.get("is_carousel_item") == "true":
                return FakeResponse(200, {"id": f"child-{len(post_calls)}"})
            if data.get("media_type") == "CAROUSEL":
                return FakeResponse(200, {"id": "parent-1"})
            if "creation_id" in data:
                return FakeResponse(200, {"id": "published-media-1"})
            raise AssertionError(f"Unexpected POST payload: {data}")

        def fake_get(url, params=None, timeout=None):
            return FakeResponse(200, {"status_code": "FINISHED"})

        with patch.object(carousel_mod.requests, "post", side_effect=fake_post), patch.object(
            carousel_mod.requests, "get", side_effect=fake_get
        ), patch("social_instagram.requests.get", side_effect=fake_get):
            media_id = post_carousel_to_instagram(
                r2_client=fake_r2_client,
                bucket="bucket",
                image_keys=["carousels/img0.jpg", "carousels/img1.jpg", "carousels/img2.jpg"],
                ig_user_id="ig-user-1",
                access_token="token-abc",
                graph_api_version="v19.0",
                caption="Swipe through this!",
                poll_attempts=1,
                poll_delay_seconds=0,
            )

        self.assertEqual(media_id, "published-media-1")
        # 3 child container creations + 1 parent container creation + 1 publish.
        self.assertEqual(len(post_calls), 5)
        child_calls = [c for c in post_calls if c[1].get("is_carousel_item") == "true"]
        self.assertEqual(len(child_calls), 3)
        parent_calls = [c for c in post_calls if c[1].get("media_type") == "CAROUSEL"]
        self.assertEqual(len(parent_calls), 1)
        self.assertEqual(parent_calls[0][1]["children"], "child-1,child-2,child-3")
        self.assertEqual(parent_calls[0][1]["caption"], "Swipe through this!")
        publish_calls = [c for c in post_calls if "creation_id" in c[1]]
        self.assertEqual(publish_calls[0][1]["creation_id"], "parent-1")


class CaptionBuildingTests(unittest.TestCase):
    # Metadata shapes below are copied verbatim from what generate_carousel.py
    # actually writes (build_slide_sequence's `metadata` dict for each
    # template) — not reinvented to match what the reader expects. That
    # distinction matters: the previous version of these tests fabricated
    # metadata already shaped the way the (buggy) reader wanted, so they
    # passed while the real writer->reader handoff was silently broken
    # (generate_carousel.py writes a `words`/`tips` list — one entry per
    # content slide, since a carousel covers several words/tips, not one —
    # while the reader was checking for singular `word`/`hook` keys that
    # never existed, so every real carousel caption fell back to the pool).
    def test_vocab_template_uses_swipe_through_framing(self) -> None:
        caption = build_carousel_caption_from_metadata(
            {
                "template": "vocab",
                "words": [
                    {
                        "word": "ephemeral",
                        "meaning": "lasting for a very short time",
                        "example_sentence": "The morning mist was ephemeral.",
                    },
                    {
                        "word": "resilient",
                        "meaning": "able to recover quickly from difficulty",
                        "example_sentence": "She stayed resilient after the setback.",
                    },
                ],
            }
        )
        self.assertIsNotNone(caption)
        assert caption is not None
        self.assertIn("Swipe through", caption)
        self.assertIn("EPHEMERAL", caption)
        self.assertIn("RESILIENT", caption)
        self.assertIn("#Vocabulary", caption)

    def test_vocab_template_missing_required_fields_returns_none(self) -> None:
        self.assertIsNone(build_carousel_caption_from_metadata({"template": "vocab", "words": []}))
        self.assertIsNone(
            build_carousel_caption_from_metadata({"template": "vocab", "words": [{"word": "x", "meaning": ""}]})
        )

    def test_tip_template_uses_swipe_through_framing(self) -> None:
        caption = build_carousel_caption_from_metadata(
            {
                "template": "tip",
                "tips": [
                    {"hook": "Timing tip", "body": "Practice under a clock."},
                    {"hook": "Reading tip", "body": "Skim the questions first."},
                ],
            }
        )
        self.assertIsNotNone(caption)
        assert caption is not None
        self.assertIn("Swipe through", caption)
        self.assertIn("Timing tip", caption)
        self.assertIn("Reading tip", caption)

    def test_tip_template_missing_body_returns_none(self) -> None:
        self.assertIsNone(build_carousel_caption_from_metadata({"template": "tip", "tips": []}))
        self.assertIsNone(
            build_carousel_caption_from_metadata({"template": "tip", "tips": [{"hook": "", "body": "x"}]})
        )

    def test_unknown_template_returns_none(self) -> None:
        self.assertIsNone(build_carousel_caption_from_metadata({"template": "something-else"}))

    def test_build_instagram_carousel_caption_prefers_metadata_and_prepends_cta(self) -> None:
        caption, index = build_instagram_carousel_caption(
            {"template": "tip", "tips": [{"hook": "Hook", "body": "Body text."}]},
            captions=["pool caption one", "pool caption two"],
            fallback_caption="fallback",
        )
        self.assertTrue(caption.startswith(CAROUSEL_RESOURCE_CTA))
        self.assertIn("Hook", caption)
        self.assertIsNone(index)

    def test_build_instagram_carousel_caption_falls_back_to_pool_when_no_metadata(self) -> None:
        caption, index = build_instagram_carousel_caption(
            None,
            captions=["only pool caption"],
            fallback_caption="fallback",
        )
        self.assertEqual(caption, CAROUSEL_RESOURCE_CTA + "only pool caption")
        self.assertEqual(index, 1)

    def test_build_instagram_carousel_caption_falls_back_to_fixed_caption_when_pool_empty(self) -> None:
        caption, index = build_instagram_carousel_caption(None, captions=[], fallback_caption="fallback")
        self.assertEqual(caption, CAROUSEL_RESOURCE_CTA + "fallback")
        self.assertIsNone(index)


class LoadCarouselMetadataTests(unittest.TestCase):
    def test_returns_none_when_sidecar_does_not_exist(self) -> None:
        # r2_object_exists is imported locally inside load_carousel_metadata,
        # so patch it on the module it's actually looked up from.
        with patch("reel_common.r2_object_exists", return_value=False):
            result = carousel_mod.load_carousel_metadata(MagicMock(), "bucket", "carousels/missing.json")
        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()
