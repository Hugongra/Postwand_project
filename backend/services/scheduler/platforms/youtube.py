import logging
import requests
import os
import requests
import logging
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_service_role_client

GOOGLE_CLIENT_ID_YOUTUBE = os.getenv('GOOGLE_CLIENT_ID_YOUTUBE')
GOOGLE_CLIENT_SECRET_YOUTUBE = os.getenv('GOOGLE_CLIENT_SECRET_YOUTUBE')
YOUTUBE_API_URL = "https://www.googleapis.com"
supabase = get_service_role_client()

def update_youtube_tokens_in_db(account_id, user_id, access_token, refresh_token=None):
    """Update YouTube tokens in database after refresh"""
    try:
        update_data = {'access_token': access_token}
        if refresh_token:
            update_data['refresh_token'] = refresh_token
        
        supabase.table('youtube_channels').update(update_data).eq(
            'account_id', account_id
        ).eq('user_id', user_id).execute()
        
        logging.info(f"Successfully updated YouTube tokens for account {account_id}")
        return True
    except Exception as e:
        logging.error(f"Error updating YouTube tokens in database: {str(e)}")
        return False

def _upload_video_to_youtube(content, access_token, video_url, is_short, title,
                             description, tags, category_id, privacy_status,
                             thumbnail_url, refresh_token, account_id, user_id):
    try:
    
        validated_access_token, validated_refresh_token, error = validate_youtube_token(access_token, refresh_token)
        if error:
            return {"success": False, "error": error, "data": None}
        
        # Update tokens in database if they were refreshed
        if validated_access_token != access_token or validated_refresh_token != refresh_token:
            update_youtube_tokens_in_db(account_id, user_id, validated_access_token, validated_refresh_token)
            logging.info("YouTube tokens were refreshed and updated in database")
        
        # Use the validated token for the rest of the upload
        access_token = validated_access_token
      
        # Step 2: Download video
        video_response = requests.get(video_url, stream=True)
        video_response.raise_for_status()
        video_bytes = video_response.content
        file_size = len(video_bytes)

        # Step 3: Prepare metadata
        video_title = title or content[:100] or ("Untitled Short" if is_short else "Untitled Video")
        video_description = description or content or ""
        if is_short and "#shorts" not in video_description.lower():
            video_description += "\n\n#Shorts"

        video_metadata = {
            "snippet": {
                "title": video_title,
                "description": video_description,
                "categoryId": "22" if is_short else category_id,
            },
            "status": {
                "privacyStatus": privacy_status,
                "embeddable": True,
                "license": "youtube",
                "publicStatsViewable": True
            }
        }

        if is_short:
            video_metadata["status"]["selfDeclaredMadeForKids"] = False

        video_tags = tags or []
        if isinstance(video_tags, list):
            if is_short and "Shorts" not in video_tags:
                video_tags.append("Shorts")
            if video_tags:
                video_metadata["snippet"]["tags"] = video_tags

        # Step 4: Initiate resumable upload
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        params = {"part": "snippet,status", "uploadType": "resumable"}
        initial_response = requests.post(f"{YOUTUBE_API_URL}/upload/youtube/v3/videos", headers=headers, params=params, json=video_metadata)
        initial_response.raise_for_status()

        upload_url = initial_response.headers.get("Location")
        if not upload_url:
            return {"success": False, "error": "No upload URL returned from YouTube", "data": None}

        # Step 5: Upload the actual file
        upload_headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "video/*",
            "Content-Length": str(file_size)
        }
        upload_response = requests.put(upload_url, headers=upload_headers, data=video_bytes)
        upload_response.raise_for_status()

        result_data = upload_response.json()
        video_id = result_data.get("id")

        # Step 6: Optional thumbnail
        if thumbnail_url and video_id:
            try:
                if set_video_thumbnail(video_id, access_token, thumbnail_url):
                    logging.info("Custom thumbnail uploaded successfully")
            except Exception as e:
                logging.warning(f"Error setting thumbnail: {str(e)}")

        return {
            "success": True,
            "message": f"Video uploaded successfully!",
            "error": None,
            "data": {
                "video_id": video_id,
                "video_url": f"https://www.youtube.com/watch?v={video_id}",
                "response": result_data
            }
        }

    except Exception as e:
        error_msg = f"Error uploading video: {str(e)}"
        logging.error(error_msg)
        return {"success": False, "error": error_msg, "data": None}



def set_video_thumbnail(video_id, access_token, thumbnail_url):
    try:
        response = requests.get(thumbnail_url)
        response.raise_for_status()
        thumbnail_upload_url = f"{YOUTUBE_API_URL}/youtube/v3/thumbnails/set"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "image/jpeg"
        }
        params = {"videoId": video_id, "uploadType": "media"}
        upload_response = requests.post(thumbnail_upload_url, headers=headers, params=params, data=response.content)
        upload_response.raise_for_status()

        return True

    except Exception as e:
        logging.error(f"Error setting video thumbnail: {str(e)}")
        return False

def refresh_access_token(refresh_token):

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        'client_id': GOOGLE_CLIENT_ID_YOUTUBE,
        'client_secret': GOOGLE_CLIENT_SECRET_YOUTUBE,
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token'
    }
    try:
        response = requests.post(token_url, data=data, timeout=5)
        response.raise_for_status()
        token_data = response.json()

        new_access_token = token_data.get('access_token')
        # Google may return a new refresh token, otherwise keep the old one
        new_refresh_token = token_data.get('refresh_token', refresh_token)
        
        return new_access_token, new_refresh_token, None
    except requests.exceptions.RequestException as e:
        logging.error(f"Error refreshing YouTube token: {e}")
        return None, None, f"Error refreshing token: {e}"


def validate_youtube_token(access_token, refresh_token=None):
    
    try:
        response = requests.get(
            "https://www.googleapis.com/oauth2/v3/tokeninfo",
            params={"access_token": access_token},
            timeout=5
        )

        if response.ok: 
            return access_token, refresh_token, None

        if refresh_token:
            new_access_token, new_refresh_token, refresh_error = refresh_access_token(refresh_token)
            if new_access_token:
                return new_access_token, new_refresh_token, None
            return None, None, refresh_error
        
        return None, None, "Access token invalid and no refresh token provided"

    except requests.exceptions.RequestException as e:
        logging.error(f"Error validating YouTube token: {e}")
        return None, None, f"Error validating token: {e}"



def post_to_youtube(postData, image_urls, video_url, access_token, refresh_token, account_id, user_id):
    try:
        platform = 'youtube'
        platform_data = postData.get('platforms', {}).get(platform, {})
        post_type = platform_data.get('postType', 'video')
        content = platform_data.get('specificContent') or postData.get('content', '')

        title = platform_data.get('title')
        description = platform_data.get('description')
        tags = platform_data.get('tags')
        category = platform_data.get('category', '22')
        privacy_status = platform_data.get('privacyStatus', 'public')
        thumbnail_url = platform_data.get('thumbnailUrl')

        if post_type == 'video': is_short = False
        else: is_short = True

        return _upload_video_to_youtube(content, access_token, video_url, is_short, title,
                             description, tags, category, privacy_status,
                             thumbnail_url, refresh_token, account_id, user_id)


    except Exception as e:
        logging.error(f"Error in post_to_youtube router: {str(e)}")
        return {"success": False, "error": str(e), "data": None}
