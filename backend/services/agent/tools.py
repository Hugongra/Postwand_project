"""
Tool definitions and implementations for the Content Planning Agent.

Each tool is an OpenAI function-calling schema + a Python implementation
that the agent orchestrator can invoke.
"""
import os
import json
import logging
from openai import OpenAI
from models.image import controller as image_controller
from services.zernio_client import zernio_service as zernio
from database import get_service_role_client

_log = logging.getLogger(__name__)

_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---------------------------------------------------------------------------
# Tool schemas (OpenAI function-calling format)
# ---------------------------------------------------------------------------

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "generate_content_plan",
            "description": (
                "Generate a content plan (list of posts) for a given topic, "
                "brand, or campaign. Returns a structured plan with post ideas, "
                "captions, and suggested platforms. Use this FIRST to plan before "
                "generating images or scheduling."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic, brand, or campaign to plan content for.",
                    },
                    "num_posts": {
                        "type": "integer",
                        "description": "Number of posts to plan (1-14).",
                        "default": 7,
                    },
                    "platforms": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Target platforms (e.g. ['instagram', 'facebook', 'tiktok']).",
                    },
                    "tone": {
                        "type": "string",
                        "description": "Desired tone: professional, casual, humorous, inspirational, etc.",
                        "default": "professional",
                    },
                    "language": {
                        "type": "string",
                        "description": "Language for the content (e.g. 'en', 'es').",
                        "default": "en",
                    },
                },
                "required": ["topic", "platforms"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_caption",
            "description": (
                "Generate a social media caption for a specific post idea. "
                "Returns optimized text with hashtags for the target platform."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "idea": {
                        "type": "string",
                        "description": "The post idea or brief to write a caption for.",
                    },
                    "platform": {
                        "type": "string",
                        "description": "Target platform (instagram, facebook, tiktok, linkedin, twitter).",
                    },
                    "tone": {
                        "type": "string",
                        "description": "Tone of voice for the caption.",
                        "default": "professional",
                    },
                    "language": {
                        "type": "string",
                        "description": "Language for the caption.",
                        "default": "en",
                    },
                },
                "required": ["idea", "platform"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_image",
            "description": (
                "Generate an image using AI (DALL-E). Returns the image URL. "
                "Use this to create visual content for social media posts."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": (
                            "Detailed image generation prompt. Be specific about "
                            "style, colors, composition, and subject."
                        ),
                    },
                    "aspect_ratio": {
                        "type": "string",
                        "enum": ["1024x1024", "1024x1536", "1024x1792"],
                        "description": "Image dimensions. 1024x1024 for square, 1024x1536 for portrait (4:5), 1024x1792 for tall (9:16).",
                        "default": "1024x1024",
                    },
                },
                "required": ["prompt"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_connected_accounts",
            "description": (
                "Retrieve the user's connected social media accounts. "
                "Use this to check which platforms are available before scheduling. "
                "Returns account IDs needed for schedule_post."
            ),
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "schedule_post",
            "description": (
                "Schedule or immediately publish a post to social media via Zernio. "
                "Requires account IDs from get_connected_accounts. "
                "Can include text content and/or media URLs."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "The post text/caption.",
                    },
                    "platforms": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "platform": {"type": "string"},
                                "accountId": {"type": "string"},
                            },
                            "required": ["platform", "accountId"],
                        },
                        "description": "List of platform + accountId objects from get_connected_accounts.",
                    },
                    "media_urls": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "URLs of images/videos to attach.",
                        "default": [],
                    },
                    "scheduled_for": {
                        "type": "string",
                        "description": "ISO 8601 datetime for scheduling (e.g. '2026-04-10T14:00:00Z'). Omit for immediate publishing.",
                    },
                    "publish_now": {
                        "type": "boolean",
                        "description": "If true, publish immediately instead of scheduling.",
                        "default": False,
                    },
                },
                "required": ["content", "platforms"],
            },
        },
    },
]


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

def generate_content_plan(topic, platforms, num_posts=7, tone="professional", language="en"):
    """Use GPT to generate a structured content plan."""
    system = (
        "You are an expert social media content strategist. "
        "Create a detailed content plan as a JSON object with a 'posts' array. "
        "Each post should have: 'day' (int), 'idea' (brief description), "
        "'caption' (full ready-to-post text with emojis and hashtags), "
        "'platform' (target platform), 'image_prompt' (a detailed DALL-E prompt "
        "for generating a matching image — be specific about style, colors, "
        "composition), and 'post_type' (post/story/reel). "
        f"Tone: {tone}. Language: {language}. "
        "Make captions platform-optimized (character limits, hashtag usage, etc.)."
    )
    user_msg = (
        f"Create a {num_posts}-post content plan for: {topic}\n"
        f"Target platforms: {', '.join(platforms)}\n"
        "Return ONLY valid JSON."
    )

    response = _openai.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user_msg}],
        response_format={"type": "json_object"},
        max_completion_tokens=8000,
    )
    plan = json.loads(response.choices[0].message.content)
    return {"success": True, "plan": plan, "tokens": getattr(response.usage, "total_tokens", None)}


def generate_caption(idea, platform, tone="professional", language="en"):
    """Generate a single optimized caption."""
    system = (
        f"You are a {platform} content expert. Write a single ready-to-post caption. "
        f"Tone: {tone}. Language: {language}. "
        "Include relevant emojis and hashtags. Return ONLY the caption text, nothing else."
    )
    response = _openai.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "system", "content": system}, {"role": "user", "content": idea}],
        max_completion_tokens=2000,
    )
    return {
        "success": True,
        "caption": response.choices[0].message.content.strip(),
        "tokens": getattr(response.usage, "total_tokens", None),
    }


def generate_image(prompt, aspect_ratio="1024x1024"):
    """Generate an image via the existing OpenAI image model."""
    result = image_controller.generate_image("openai", prompt, aspect_ratio, 1)
    if result.get("success"):
        image_data = result["images"]
        if image_data.startswith("data:image"):
            try:
                url = _upload_base64_to_zernio(image_data, "agent_image.png")
                return {"success": True, "image_url": url}
            except Exception as e:
                _log.warning(f"Zernio upload failed, returning data URI: {e}")
                return {"success": True, "image_url": image_data}
        return {"success": True, "image_url": image_data}
    return {"success": False, "error": result.get("error", "Image generation failed")}


def _upload_base64_to_zernio(data_uri, filename):
    """Convert a base64 data URI to bytes and upload to Zernio for a public URL."""
    import base64 as b64
    header, b64_data = data_uri.split(",", 1)
    content_type = header.split(";")[0].split(":")[1]
    raw_bytes = b64.b64decode(b64_data)
    url = zernio.upload_media_bytes(raw_bytes, filename, content_type)
    return url


def get_connected_accounts(user_id):
    """Fetch connected social media accounts for the current user."""
    try:
        supa = get_service_role_client()
        profile_row = supa.table("zernio_profiles").select("zernio_profile_id").eq("user_id", user_id).execute()
        if not profile_row.data:
            return {"success": True, "accounts": {}, "message": "No social accounts connected. Go to Integrations to connect."}

        profile_id = profile_row.data[0]["zernio_profile_id"]
        result = zernio.list_accounts(profile_id=profile_id)
        accounts_list = result.get("accounts", [])

        grouped = {}
        for acc in accounts_list:
            plat = acc.get("platform", "unknown")
            if plat not in grouped:
                grouped[plat] = []
            grouped[plat].append({
                "accountId": acc["_id"],
                "username": acc.get("username", ""),
                "displayName": acc.get("displayName", ""),
            })

        return {"success": True, "accounts": grouped}
    except Exception as e:
        _log.error(f"get_connected_accounts error: {e}")
        return {"success": False, "error": str(e)}


def schedule_post(content, platforms, media_urls=None, scheduled_for=None, publish_now=False):
    """Publish or schedule a post via Zernio."""
    media_items = None
    if media_urls:
        media_items = []
        for url in media_urls:
            if url.startswith("data:image"):
                try:
                    public_url = _upload_base64_to_zernio(url, "agent_post_image.png")
                    media_items.append({"url": public_url, "type": "image"})
                except Exception as e:
                    _log.warning(f"Failed to upload base64 media: {e}")
            else:
                media_items.append({"url": url, "type": "image"})

    result = zernio.create_post(
        content=content,
        platforms=platforms,
        media_items=media_items,
        scheduled_for=scheduled_for,
        publish_now=publish_now,
    )
    return {"success": True, "result": result}


# ---------------------------------------------------------------------------
# Dispatch: name -> function
# ---------------------------------------------------------------------------

TOOL_DISPATCH = {
    "generate_content_plan": generate_content_plan,
    "generate_caption": generate_caption,
    "generate_image": generate_image,
    "get_connected_accounts": None,  # needs user_id injection
    "schedule_post": schedule_post,
}
