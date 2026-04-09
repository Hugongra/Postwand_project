import logging
from flask import Blueprint, g, request
from decorators.decorators import login_required
from services.zernio_client import zernio_service as zernio
from database import get_service_role_client

zernio_bp = Blueprint('zernio', __name__)

_profile_cache = {}

def _get_or_create_profile(user_id):
    """Each user gets one Zernio profile, cached in memory + persisted in Supabase."""
    if user_id in _profile_cache:
        return _profile_cache[user_id]

    supabase = get_service_role_client()
    try:
        row = supabase.table("zernio_profiles").select("zernio_profile_id").eq("user_id", user_id).execute()
        if row.data:
            _profile_cache[user_id] = row.data[0]["zernio_profile_id"]
            return _profile_cache[user_id]
    except Exception as e:
        logging.warning(f"[ZERNIO] zernio_profiles table query failed (may not exist yet): {e}")

    result = zernio.create_profile(f"user-{user_id[:8]}", "PostWand profile")
    profile_id = result["profile"]["_id"]
    logging.info(f"[ZERNIO] Created Zernio profile {profile_id} for user {user_id}")

    try:
        supabase.table("zernio_profiles").insert({
            "user_id": user_id,
            "zernio_profile_id": profile_id,
        }).execute()
    except Exception as e:
        logging.warning(f"[ZERNIO] Could not save profile to DB (table may not exist): {e}")

    _profile_cache[user_id] = profile_id
    return profile_id


@zernio_bp.route('/zernio/connect/<platform>', methods=['GET'])
@login_required
def connect_platform(platform):
    """Return the OAuth URL for the given platform."""
    try:
        frontend_url = request.args.get('redirect_url', request.host_url.rstrip('/') + '/integrations')
        profile_id = _get_or_create_profile(g.user_id)
        logging.info(f"[ZERNIO] connect: platform={platform}, profile={profile_id}, redirect={frontend_url}")
        result = zernio.get_connect_url(platform, profile_id, redirect_url=frontend_url)
        auth_url = result.get("authUrl")
        logging.info(f"[ZERNIO] Got authUrl: {auth_url[:80] if auth_url else 'None'}...")
        return {"success": True, "authUrl": auth_url}, 200
    except Exception as e:
        logging.error(f"[ZERNIO] connect error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}, 500


@zernio_bp.route('/zernio/accounts', methods=['GET'])
@login_required
def get_accounts():
    """List connected accounts from Zernio (filtered to user's profile)."""
    try:
        profile_id = _get_or_create_profile(g.user_id)
        logging.info(f"[ZERNIO] get_accounts: user={g.user_id}, profile={profile_id}")

        result = zernio.list_accounts(profile_id=profile_id)
        accounts = result.get("accounts", [])
        logging.info(f"[ZERNIO] Accounts for profile {profile_id}: {len(accounts)}")

        grouped = {}
        for acc in accounts:
            plat = acc.get("platform", "unknown")
            if plat not in grouped:
                grouped[plat] = {"accounts": []}

            display_name = (
                acc.get("displayName")
                or acc.get("name")
                or acc.get("username")
                or plat
            )
            username = acc.get("username", "")
            avatar = acc.get("avatar") or acc.get("profileUrl") or ""

            grouped[plat]["accounts"].append({
                "id": acc["_id"],
                "account_id": acc["_id"],
                "name": display_name,
                "username": username,
                "profile_picture": avatar,
                "profilePicture": avatar,
                "platform": plat,
            })

        logging.info(f"[ZERNIO] Returning grouped: {list(grouped.keys())}")
        return grouped, 200
    except Exception as e:
        logging.error(f"[ZERNIO] get_accounts error: {e}", exc_info=True)
        return {"error": str(e)}, 500


@zernio_bp.route('/zernio/accounts/<account_id>', methods=['DELETE'])
@login_required
def disconnect_account(account_id):
    """Disconnect a social account via Zernio."""
    try:
        zernio.delete_account(account_id)
        return {"success": True, "message": "Account disconnected"}, 200
    except Exception as e:
        return {"error": str(e)}, 500


@zernio_bp.route('/zernio/post', methods=['POST'])
@login_required
def publish_post():
    """Create/schedule a post via Zernio. Accepts JSON or FormData (with file uploads)."""
    try:
        import json as _json

        if request.is_json:
            data = request.json
            content = data.get("content", "")
            platforms = data.get("platforms", [])
            media_url_items = data.get("mediaItems")
            scheduled_for = data.get("scheduledFor")
            timezone = data.get("timezone")
            publish_now = data.get("publishNow", False)
            uploaded_files = []
        else:
            content = request.form.get("content", "")
            platforms = _json.loads(request.form.get("platforms", "[]"))
            media_url_items = _json.loads(request.form.get("mediaUrls", "[]")) or None
            scheduled_for = request.form.get("scheduledFor")
            timezone = request.form.get("timezone")
            publish_now = request.form.get("publishNow") == "true"
            uploaded_files = request.files.getlist("files")

        if not platforms:
            return {"error": "No platforms selected"}, 400

        zernio_media = []

        # Upload file-based media to Zernio
        for f in uploaded_files:
            try:
                file_bytes = f.read()
                public_url = zernio.upload_media_bytes(file_bytes, f.filename, f.content_type)
                media_type = "video" if f.content_type and f.content_type.startswith("video") else "image"
                zernio_media.append({"url": public_url, "type": media_type})
            except Exception as e:
                logging.error(f"[ZERNIO] File upload failed: {e}")

        # Upload URL-based media to Zernio
        if media_url_items:
            for item in media_url_items:
                url = item.get("url")
                media_type = item.get("type", "image")
                if url:
                    try:
                        public_url = zernio.upload_media_from_url(url)
                        zernio_media.append({"url": public_url, "type": media_type})
                    except Exception:
                        zernio_media.append({"url": url, "type": media_type})

        logging.info(f"[ZERNIO] post: content={content[:50]!r}, platforms={len(platforms)}, media={len(zernio_media)}")

        result = zernio.create_post(
            content=content,
            platforms=platforms,
            media_items=zernio_media or None,
            scheduled_for=scheduled_for,
            timezone=timezone or "UTC",
            publish_now=publish_now,
        )
        return {"success": True, "data": result}, 200
    except Exception as e:
        logging.error(f"[ZERNIO] post error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}, 500
