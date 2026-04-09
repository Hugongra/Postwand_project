# post_executor.py
import logging
import sys
import os
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .platforms.facebook import post_to_facebook
from .platforms.instagram import post_to_instagram
from .platforms.threads import post_to_threads
from .platforms.linkedin import post_to_linkedin
from .platforms.youtube import post_to_youtube
from .platforms.tiktok import post_to_tiktok

from .get_token import get_token

from .supabase_service import supabase_service as supabase

platform_functions = {
    'facebook': post_to_facebook,
    'instagram': post_to_instagram,
    'threads': post_to_threads,
    'linkedin': post_to_linkedin,
    'youtube': post_to_youtube,
    'tiktok': post_to_tiktok,
}

def execute_post(user_id, platform, postData, image_urls, video_url):
    try:
        logging.info(f"[EXECUTE_POST] {platform}: image_urls={image_urls}, video_url={video_url}")
        
        fn = platform_functions[platform]

        # Get platform data from new structure
        platform_data = postData.get("platforms", {}).get(platform, {})
        account_id = platform_data.get("accountId", "")
        post_type = platform_data.get("postType", "post")

        token_data = get_token(platform, account_id, user_id)
        
        # Inject user_id into postData so platform modules can access it
        postData['user_id'] = user_id

        # Handle YouTube which returns (access_token, refresh_token)
        if platform == 'youtube' and isinstance(token_data, tuple):
            access_token = token_data[0]
            refresh_token = token_data[1]
            result = fn(postData, image_urls, video_url, access_token, refresh_token, account_id, user_id)
        else:
            access_token = token_data
            result = fn(postData, image_urls, video_url, token_data)

        # Check if the post was actually successful
        if not result.get("success"):
            logging.error(f"[EXECUTE_POST] {platform} post failed: {result.get('error')}")
            return {"platform": platform, "post_type": post_type, "success": False, "error": result.get("error")}

        post_creation_id = None
        if result.get("data"):
            post_creation_id = (
                result["data"].get("id")
                or result["data"].get("post_id")
                or result["data"].get("publish_id")
            )

        # Get content from platform-specific or general
        content = platform_data.get("specificContent") or postData.get("content", "")

        post_entry = {
            "user_id": user_id,
            "platform": platform,
            "account_id": account_id,
            "post_type": post_type,
            "status": "published",
            "content": content,
            "image_url": image_urls,
            "video_url": video_url,
            "post_creation_id": post_creation_id,
            "scheduled_time": datetime.now().isoformat(),
            "access_token": access_token,
        }

        supabase.table("scheduled_posts").insert(post_entry).execute()

        return {"platform": platform, "post_type": post_type, "success": True, "result": result}

    except Exception as e:
        logging.error(f"[EXECUTE_POST] Failed for {platform}: {e}", exc_info=True)
        return {"platform": platform, "success": False, "error": str(e)}
