import logging
import requests
import json
import os
import tempfile
from flask import request, session
from database import get_supabase_client

supabase = get_supabase_client()

# TikTok Content Posting API URLs
TIKTOK_API_BASE = "https://open.tiktokapis.com"
TIKTOK_CREATOR_INFO_URL = f"{TIKTOK_API_BASE}/v2/post/publish/creator_info/query/"
TIKTOK_VIDEO_UPLOAD_URL = f"{TIKTOK_API_BASE}/v2/post/publish/video/init/"
TIKTOK_CONTENT_POST_URL = f"{TIKTOK_API_BASE}/v2/post/publish/content/init/"


def _upload_video_to_tiktok(
    content,
    access_token,
    video_url,
    title=None,
    privacy_level=None,
    disable_comment=True,
    disable_duet=True,
    disable_stitch=True,
    auto_add_music=False,
    brand_content_toggle=False,
    brand_organic_toggle=False,
    page_id=None,
    user_id=None,
):
    """
    Upload a video to TikTok using the TikTok Content Posting API flow.
    Returns Option B style responses:
      - Success: {"success": True, "message": "...", "data": {...}}
      - Error:   {"success": False, "error": "..."}
    """
    try:
        logging.info("Starting TikTok video upload process")
        logging.info(f"TikTok upload called with privacy_level: {privacy_level}")

        # Step 1: Retrieve account data to get refresh token
        tiktok_accounts = (
            supabase.table("tiktok_accounts")
            .select("*")
            .eq("account_id", page_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not getattr(tiktok_accounts, "data", None):
            return {"success": False, "error": "TikTok account not found"}

        account_data = tiktok_accounts.data[0]
        refresh_token = account_data.get("refresh_token")

        # Validate token and refresh if needed
        access_token, error = validate_tiktok_token(access_token, refresh_token)
        if error:
            return {"success": False, "error": error}

        # Step 2: Query creator info to get available privacy levels
        logging.info("Querying creator info...")
        creator_info = get_creator_info(access_token)
        if not creator_info:
            return {"success": False, "error": "Failed to get creator info. Please check your TikTok authentication."}

        # Step 2: Validate privacy level is provided
        if not privacy_level:
            return {"success": False, "error": "Privacy level must be specified"}

        available_privacy_levels = creator_info.get("privacy_level_options", [])
        logging.info(f"Available privacy levels for this account: {available_privacy_levels}")

        # Validate provided privacy level is available
        if privacy_level not in available_privacy_levels:
            return {
                "success": False,
                "error": f"Privacy level '{privacy_level}' not available. Available options: {available_privacy_levels}",
            }

        actual_privacy_level = privacy_level
        logging.info(f"Using privacy level: {actual_privacy_level}")

        # Step 3: Download video temporarily
        logging.info(f"Downloading video from URL: {video_url}")
        try:
            video_response = requests.get(video_url, stream=True, timeout=300)
            video_response.raise_for_status()

            # Create temporary file for video
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
                for chunk in video_response.iter_content(chunk_size=8192):
                    temp_video.write(chunk)
                temp_video_path = temp_video.name
        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to download video: {str(e)}")
            return {"success": False, "error": f"Failed to download video: {str(e)}"}
        except Exception as e:
            logging.error(f"Unexpected error downloading video: {str(e)}")
            return {"success": False, "error": f"Failed to download video: {str(e)}"}

        try:
            # Step 4: Initialize video upload
            logging.info("Initializing TikTok video upload...")

            # Get video file size
            video_size = os.path.getsize(temp_video_path)

            init_headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json; charset=UTF-8",
            }

            # Use title if provided, otherwise use content
            video_title = title if title else content
            if not video_title:
                video_title = "Posted via Postwand"

            # Limit title to 2200 characters (TikTok's limit)
            if len(video_title) > 2200:
                video_title = video_title[:2197] + "..."

            init_data = {
                "post_info": {
                    "title": video_title,
                    "privacy_level": actual_privacy_level,
                    "disable_comment": disable_comment,
                    "disable_duet": disable_duet,
                    "disable_stitch": disable_stitch,
                    "video_cover_timestamp_ms": 1000,
                },
                "source_info": {
                    "source": "FILE_UPLOAD",
                    "video_size": video_size,
                    "chunk_size": video_size,
                    "total_chunk_count": 1,
                },
            }

            # Add optional features if enabled
            if auto_add_music:
                init_data["post_info"]["auto_add_music"] = True
            if brand_content_toggle:
                init_data["post_info"]["brand_content_toggle"] = True
            if brand_organic_toggle:
                init_data["post_info"]["brand_organic_toggle"] = True

            logging.info(f"TikTok init data being sent: {json.dumps(init_data, indent=2)}")

            init_response = requests.post(
                TIKTOK_VIDEO_UPLOAD_URL, headers=init_headers, json=init_data, timeout=30
            )

            # Use raise_for_status to unify HTTP error handling
            try:
                init_response.raise_for_status()
            except requests.exceptions.RequestException as e:
                logging.error(f"Failed to initialize TikTok upload: {init_response.status_code} {init_response.text}")
                return {"success": False, "error": f"Failed to initialize TikTok upload: {init_response.text}"}

            init_result = init_response.json()

            if "data" not in init_result:
                error_msg = f"Invalid initialization response: {init_result}"
                logging.error(error_msg)
                return {"success": False, "error": error_msg}

            publish_id = init_result["data"]["publish_id"]
            upload_url = init_result["data"]["upload_url"]

            logging.info(f"Got publish_id: {publish_id}")
            logging.info(f"Got upload_url: {upload_url}")

            # Step 5: Upload the video file
            logging.info("Uploading video file to TikTok...")

            with open(temp_video_path, "rb") as video_file:
                upload_headers = {
                    "Content-Type": "video/mp4",
                    "Content-Length": str(video_size),
                    "Content-Range": f"bytes 0-{video_size-1}/{video_size}",
                }

                upload_response = requests.put(
                    upload_url, data=video_file, headers=upload_headers, timeout=600
                )

                # For upload endpoints that return 200/201, raise_for_status is okay but some providers return 201
                if upload_response.status_code not in (200, 201):
                    logging.error(f"Failed to upload video to TikTok: {upload_response.status_code} {upload_response.text}")
                    return {"success": False, "error": f"Failed to upload video to TikTok: {upload_response.text}"}

            # Success! Video will be processed and published automatically
            result_data = {
                "publish_id": publish_id,
                "status": "PROCESSING_UPLOAD",
                "privacy_level_used": actual_privacy_level,
            }

            logging.info(f"TikTok video uploaded successfully with publish_id: {publish_id}")
            return {
                "success": True,
                "message": "TikTok video uploaded successfully! Note: Video is set to private (SELF_ONLY) due to unaudited API client restrictions. You can change this to public manually in your TikTok app.",
                "data": result_data,
            }

        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_video_path)
                logging.info("Temporary video file cleaned up")
            except Exception as e:
                logging.warning(f"Failed to clean up temporary file: {e}")

    except Exception as e:
        logging.error(f"Unexpected error in TikTok upload: {str(e)}", exc_info=True)
        return {"success": False, "error": f"Unexpected error: {str(e)}"}


def _post_photos_to_tiktok(
    content,
    access_token,
    image_urls,
    title=None,
    description=None,
    privacy_level=None,
    disable_comment=True,
    auto_add_music=True,
    brand_content_toggle=False,
    brand_organic_toggle=False,
    photo_cover_index=0,
):
    """
    Post photos to TikTok (photo post). Returns Option B style responses.
    """
    try:
        logging.info("Starting TikTok photo upload process")
        logging.info(f"TikTok photo upload called with {len(image_urls) if image_urls else 0} images")

        # Step 1: Validate inputs
        if not image_urls or len(image_urls) == 0:
            return {"success": False, "error": "At least one image URL is required for TikTok photo posts"}

        if len(image_urls) > 35:
            return {"success": False, "error": "TikTok supports maximum 35 photos per post"}

        if photo_cover_index >= len(image_urls):
            photo_cover_index = 0  # Default to first image

        # Step 2: Query creator info to get available privacy levels
        logging.info("Querying creator info...")
        creator_info = get_creator_info(access_token)
        if not creator_info:
            return {"success": False, "error": "Failed to get creator info. Please check your TikTok authentication."}

        # Step 3: Validate privacy level is provided
        if not privacy_level:
            return {"success": False, "error": "Privacy level must be specified"}

        available_privacy_levels = creator_info.get("privacy_level_options", [])
        logging.info(f"Available privacy levels for this account: {available_privacy_levels}")

        if privacy_level not in available_privacy_levels:
            return {
                "success": False,
                "error": f"Privacy level '{privacy_level}' not available. Available options: {available_privacy_levels}",
            }

        actual_privacy_level = privacy_level
        logging.info(f"Using privacy level: {actual_privacy_level}")

        # Step 4: Prepare post data
        photo_title = title if title else content
        photo_description = description if description else content

        if not photo_title:
            photo_title = "Posted via Postwand"
        if not photo_description:
            photo_description = "Posted via Postwand"

        if len(photo_title) > 90:
            photo_title = photo_title[:87] + "..."
        if len(photo_description) > 4000:
            photo_description = photo_description[:3997] + "..."

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
        }

        post_data = {
            "media_type": "PHOTO",
            "post_mode": "DIRECT_POST",
            "post_info": {
                "title": photo_title,
                "description": photo_description,
                "privacy_level": actual_privacy_level,
                "disable_comment": disable_comment,
                "auto_add_music": auto_add_music,
            },
            "source_info": {
                "source": "PULL_FROM_URL",
                "photo_cover_index": photo_cover_index,
                "photo_images": image_urls,
            },
        }

        if brand_content_toggle:
            post_data["post_info"]["brand_content_toggle"] = True
        if brand_organic_toggle:
            post_data["post_info"]["brand_organic_toggle"] = True

        logging.info(f"TikTok photo post data being sent: {json.dumps(post_data, indent=2)}")

        response = requests.post(TIKTOK_CONTENT_POST_URL, headers=headers, json=post_data, timeout=30)

        # unify HTTP error handling
        try:
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to post TikTok photos: {response.status_code} {response.text}")
            return {"success": False, "error": f"Failed to post TikTok photos: {response.text}"}

        response_data = response.json()

        if "data" not in response_data:
            error_msg = f"Invalid TikTok photo post response: {response_data}"
            logging.error(error_msg)
            return {"success": False, "error": error_msg}

        publish_id = response_data["data"]["publish_id"]
        result_data = {
            "publish_id": publish_id,
            "status": "PROCESSING_UPLOAD",
            "privacy_level_used": actual_privacy_level,
            "image_count": len(image_urls),
        }

        logging.info(f"TikTok photos posted successfully with publish_id: {publish_id}")
        return {
            "success": True,
            "message": f"TikTok photos posted successfully! {len(image_urls)} image(s) uploaded. Note: Post is set to private (SELF_ONLY) due to unaudited API client restrictions. You can change this to public manually in your TikTok app.",
            "data": result_data,
        }

    except Exception as e:
        logging.error(f"Unexpected error in TikTok photo upload: {str(e)}", exc_info=True)
        return {"success": False, "error": f"Unexpected error: {str(e)}"}


def get_creator_info_for_ui():
    """Returns account capabilities for UI display."""
    try:
        data = request.get_json()
        account_id = data.get("account_id")
        user_id = session.get("user_id")

        if not account_id:
            raise ValueError("Account ID is required")

        supabase = get_supabase_client()
        result = supabase.table("tiktok_accounts").select("*").eq("account_id", account_id).eq("user_id", user_id).execute()

        if not result.data:
            raise ValueError("TikTok account not found")

        account = result.data[0]
        if not account.get("access_token"):
            raise ValueError("No access token available")

        access_token, error = validate_tiktok_token(account["access_token"], account.get("refresh_token"))
        if error:
            raise ValueError(error)

        creator_info = get_creator_info(access_token)
        if not creator_info:
            raise ValueError("Failed to get creator info")

        return {
            "success": True,
            "data": {
                "display_name": account.get("display_name", "TikTok User"),
                "can_post": creator_info.get("can_post", True),
                "privacy_level_options": creator_info.get("privacy_level_options", []),
                "max_video_duration_sec": creator_info.get("max_video_duration_sec", 600),
                "comment_disabled": creator_info.get("comment_disabled", False),
                "duet_disabled": creator_info.get("duet_disabled", False),
                "stitch_disabled": creator_info.get("stitch_disabled", False),
            },
        }

    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:
        logging.error(f"Error in get_creator_info_for_ui: {str(e)}", exc_info=True)
        return {"success": False, "error": "An unexpected error occurred"}

def get_creator_info(access_token):
    """Get TikTok creator info with posting validation."""
    try:
        logging.info(f"Getting TikTok creator info with token: {access_token[:20]}...")
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8"
        }
        
        response = requests.post(TIKTOK_CREATOR_INFO_URL, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json().get("data", {})
        
        return {
            **data,
            "can_post": data.get("can_make_more_posts", True),
            "max_video_duration_sec": data.get("max_video_post_duration_sec", 600)
        }
        
    except requests.exceptions.HTTPError as e:
        logging.error(f"HTTP error getting creator info - Status: {e.response.status_code}, Response: {e.response.text}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"Request error getting creator info: {str(e)}")
        return None
    except Exception as e:
        logging.error(f"Unexpected error getting creator info: {str(e)}", exc_info=True)
        return None


def refresh_tiktok_token(refresh_token):
    """
    Refresh TikTok access token using refresh token.
    Returns: (new_access_token, error_message)
    """
    client_key = os.getenv("TIKTOK_CLIENT_KEY")
    client_secret = os.getenv("TIKTOK_CLIENT_SECRET")
    
    token_url = "https://open.tiktokapis.com/v2/oauth/token/"
    data = {
        "client_key": client_key,
        "client_secret": client_secret,
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }
    
    try:
        response = requests.post(token_url, data=data, timeout=10)
        response.raise_for_status()
        token_data = response.json()
        
        return token_data.get("access_token"), None
    except requests.exceptions.RequestException as e:
        logging.error(f"Error refreshing TikTok token: {e}")
        return None, f"Error refreshing token: {e}"


def validate_tiktok_token(access_token, refresh_token=None):
    """
    Validate TikTok access token and refresh if needed.
    Returns: (valid_access_token, error_message)
    """
    try:
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        response = requests.get(
            f"{TIKTOK_API_BASE}/v2/user/info/", 
            headers=headers, 
            params={"fields": "open_id"}, 
            timeout=10
        )
        
        if response.ok: return access_token, None
        
        if refresh_token:
            new_access_token, refresh_error = refresh_tiktok_token(refresh_token)
            if new_access_token:
                return new_access_token, None
            return None, refresh_error
        
        return None, "Access token invalid and no refresh token provided"
    
    except requests.exceptions.RequestException as e:
        logging.error(f"Error validating TikTok token: {e}")
        return None, f"Error validating token: {e}"


def post_to_tiktok(postData, image_urls, video_url, access_token):
    """
    Main routing function for TikTok posts - decides which specific function to use based on post type
    Returns Option B style responses
    """
    try:
        platform = "tiktok"
        platform_data = postData.get("platforms", {}).get(platform, {})
        post_type = platform_data.get("postType", "video")
        content = platform_data.get("specificContent") or postData.get("content", "")

        page_id = platform_data.get("accountId", "")
        user_id = postData.get("user_id")

        privacy_level = platform_data.get("privacyLevel", "SELF_ONLY")

        interactions = platform_data.get("interactions", {})
        disable_comment = not interactions.get("allowComment", False)
        disable_duet = not interactions.get("allowDuet", False)
        disable_stitch = not interactions.get("allowStitch", False)

        commercial_content = platform_data.get("commercialContent", {})
        brand_content_toggle = commercial_content.get("brandedContent", False)
        brand_organic_toggle = commercial_content.get("yourBrand", False)

        if post_type == "video":
            return _upload_video_to_tiktok(
                content,
                access_token,
                video_url,
                title=content,
                page_id=page_id,
                user_id=user_id,
                privacy_level=privacy_level,
                disable_comment=disable_comment,
                disable_duet=disable_duet,
                disable_stitch=disable_stitch,
                brand_content_toggle=brand_content_toggle,
                brand_organic_toggle=brand_organic_toggle,
            )

        elif post_type == "photo":
            return _post_photos_to_tiktok(
                content,
                access_token,
                image_urls,
                title=content,
                privacy_level=privacy_level,
                disable_comment=disable_comment,
            )

        else:
            return {"success": False, "error": f"Unsupported post type: {post_type}"}

    except Exception as e:
        logging.error(f"Error in post_to_tiktok router: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}


