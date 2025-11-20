import logging
from flask import Blueprint, request, jsonify
from pydantic import BaseModel, Field, ValidationError
from typing import Optional, Dict
from services.scheduler.scheduler import scheduled_post as scheduler_post

post_api_bp = Blueprint("post_api", __name__)


# ----------------------------
# 🔹 Pydantic Models
# ----------------------------
class PlatformBase(BaseModel):
    accountId: Optional[str] = None


class Platforms(BaseModel):
    youtube: PlatformBase
    tiktok: PlatformBase
    facebook: PlatformBase
    instagram: PlatformBase
    linkedin: PlatformBase
    threads: PlatformBase


class PostRequest(BaseModel):
    content: str
    scheduledTime: str
    scheduleNow: bool
    media: Optional[list] = Field(default_factory=list)
    platforms: Platforms


# ----------------------------
# 🔹 Flask Route
# ----------------------------
@post_api_bp.route("/api/v1/posts", methods=["POST"])
def create_post(user_id):
    try:
        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "Content-Type must be application/json"
            }), 400

        # ✅ Validate & parse JSON payload using Pydantic
        try:
            payload = PostRequest(**request.get_json())
        except ValidationError as e:
            return jsonify({
                "success": False,
                "error": "Invalid payload structure",
                "details": e.errors(),
            }), 400

        # ✅ Ensure at least one platform has accountId
        has_valid_platform = any(
            getattr(payload.platforms, name).accountId
            for name in payload.platforms.__fields__
        )
        if not has_valid_platform:
            return jsonify({
                "success": False,
                "error": "At least one platform with accountId is required"
            }), 400

        # ✅ Proceed to scheduler
        result = scheduler_post(user_id)

        if isinstance(result, tuple):
            data, status = result
        else:
            data, status = result, 200

        return jsonify({
            "success": "error" not in data,
            **data
        }), status

    except Exception as e:
        logging.error(f"Error creating post via API: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e) 
        }, 500)
