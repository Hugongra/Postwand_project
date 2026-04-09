"""
Zernio API client — uses the official zernio-sdk.
Docs: https://docs.zernio.com
"""
import os
import logging
import requests as http_requests
from zernio import Zernio

_client = None

def _get_client():
    global _client
    if _client is None:
        key = os.getenv("ZERNIO_API_KEY")
        if not key:
            raise ValueError("ZERNIO_API_KEY is not set in .env")
        _client = Zernio(api_key=key)
    return _client

# ── Profiles ─────────────────────────────────────────────────

def create_profile(name, description=""):
    resp = _get_client().profiles.create(name=name, description=description)
    return {
        "profile": {
            "_id": resp.profile.field_id,
            "name": resp.profile.name,
        }
    }

def list_profiles():
    return _get_client().profiles.list()

# ── Account Connection ───────────────────────────────────────

def get_connect_url(platform, profile_id, redirect_url=None):
    """Start OAuth flow. Returns { authUrl }."""
    return _get_client().connect.get_connect_url(
        platform, profile_id, redirect_url=redirect_url
    )

def list_accounts(profile_id=None):
    """List connected social accounts, optionally filtered by profile."""
    resp = _get_client().accounts.list(profile_id=profile_id)
    accounts = []
    for acc in (resp.accounts or []):
        accounts.append({
            "_id": acc.field_id,
            "platform": acc.platform,
            "username": acc.username or "",
            "displayName": acc.displayName or "",
            "profileUrl": acc.profileUrl or "",
            "isActive": acc.isActive,
        })
    return {"accounts": accounts}

def delete_account(account_id):
    """Disconnect a social account (SDK has no delete, use raw HTTP)."""
    key = os.getenv("ZERNIO_API_KEY")
    r = http_requests.delete(
        f"https://zernio.com/api/v1/accounts/{account_id}",
        headers={"Authorization": f"Bearer {key}"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()

# ── Media Upload ─────────────────────────────────────────────

def upload_media_bytes(data, file_name, content_type=None):
    """Upload bytes to Zernio. Returns public URL string."""
    resp = _get_client().media.upload_bytes(data, file_name, mime_type=content_type)
    if resp.files:
        return str(resp.files[0].url)
    raise RuntimeError("Zernio media upload returned no files")

def upload_media_from_url(source_url, file_name=None, content_type=None):
    """Download from URL, upload to Zernio. Returns public URL."""
    r = http_requests.get(source_url, timeout=60)
    r.raise_for_status()
    ct = content_type or r.headers.get("Content-Type", "image/jpeg").split(";")[0]
    fname = file_name or source_url.split("/")[-1].split("?")[0] or "media"
    return upload_media_bytes(r.content, fname, ct)

# ── Posts ─────────────────────────────────────────────────────

def create_post(content, platforms, media_items=None, scheduled_for=None,
                timezone=None, publish_now=False):
    """
    Create/schedule/publish a post via Zernio SDK.
    platforms: [{"platform": "twitter", "accountId": "acc_..."}]
    media_items: [{"url": "...", "type": "image"|"video"}]
    """
    resp = _get_client().posts.create(
        content=content,
        platforms=platforms,
        media_items=media_items,
        scheduled_for=scheduled_for,
        timezone=timezone or "UTC",
        publish_now=publish_now,
    )
    return {
        "message": resp.message,
        "post": {"_id": resp.post.field_id} if resp.post else None,
    }
