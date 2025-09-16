import logging
import requests
import json
import time
import os
from datetime import datetime, timezone
import tempfile

# TikTok Content Posting API URLs
TIKTOK_API_BASE = "https://open.tiktokapis.com"
TIKTOK_CREATOR_INFO_URL = f"{TIKTOK_API_BASE}/v2/post/publish/creator_info/query/"
TIKTOK_UPLOAD_INIT_URL = f"{TIKTOK_API_BASE}/v2/post/publish/inbox/video/init/"
TIKTOK_VIDEO_UPLOAD_URL = f"{TIKTOK_API_BASE}/v2/post/publish/video/init/"
TIKTOK_CONTENT_POST_URL = f"{TIKTOK_API_BASE}/v2/post/publish/content/init/"  # For photos

def _upload_video_to_tiktok(content, access_token, video_url, title=None, privacy_level=None, disable_comment=True, disable_duet=True, disable_stitch=True, auto_add_music=False, brand_content_toggle=False, brand_organic_toggle=False, page_id=None, user_id=None):
    """
    Internal function to upload videos to TikTok
    
    Args:
        content (str): The description for the video (fallback if title not provided)
        access_token (str): The TikTok OAuth2 access token
        video_url (str): URL of the video to upload
        title (str, optional): Title for the video
        privacy_level (str, optional): Privacy level (SELF_ONLY for unaudited clients, PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, FOLLOWER_OF_CREATOR for audited clients)
        disable_comment (bool, optional): Whether to disable comments
        disable_duet (bool, optional): Whether to disable duets
        disable_stitch (bool, optional): Whether to disable stitches
        auto_add_music (bool, optional): Whether to auto-add music
        brand_content_toggle (bool, optional): Whether this is branded content
        brand_organic_toggle (bool, optional): Whether this is branded organic content
        page_id (str, optional): TikTok page/account ID for token refresh
        user_id (str, optional): User ID for token refresh
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    
    result_data = None
    
    try:
        logging.info("Starting TikTok video upload process")
        logging.info(f"TikTok upload called with privacy_level: {privacy_level}")
        
        # Step 1: Validate token and refresh if needed
        if not validate_tiktok_token(access_token):
            logging.warning("TikTok token is invalid, attempting refresh...")
            
            # Get refresh token from database and refresh
            from database import get_supabase_client
            supabase = get_supabase_client()
            
            tiktok_accounts = supabase.table('tiktok_accounts').select('*').eq('tiktok_id', page_id).eq('user_id', user_id).execute()
            if not tiktok_accounts.data:
                return False, {"error": "TikTok account not found"}, None
                
            account_data = tiktok_accounts.data[0]
            refresh_token = account_data.get('refresh_token')
            
            if not refresh_token:
                return False, {"error": "No refresh token available. Please re-authenticate."}, None
                
            # Refresh the token
            client_key = os.getenv('TIKTOK_CLIENT_KEY')
            client_secret = os.getenv('TIKTOK_CLIENT_SECRET')
            
            new_token_data = refresh_tiktok_token(refresh_token, client_key, client_secret)
            
            if new_token_data:
                access_token = new_token_data['access_token']
                # Update database
                supabase.table('tiktok_accounts').update({
                    'access_token': access_token,
                    'refresh_token': new_token_data.get('refresh_token', refresh_token)
                }).eq('id', account_data['id']).execute()
                logging.info("TikTok token refreshed successfully")
            else:
                return False, {"error": "Failed to refresh token. Please re-authenticate."}, None
        
        # Step 2: Query creator info to get available privacy levels
        logging.info("Querying creator info...")
        creator_info = get_creator_info(access_token)
        if not creator_info:
            return False, {"error": "Failed to get creator info. Please check your TikTok authentication."}, None
            
        # Step 2: Validate privacy level is provided
        if not privacy_level:
            return False, {"error": "Privacy level must be specified"}, None
            
        available_privacy_levels = creator_info.get('privacy_level_options', [])
        logging.info(f"Available privacy levels for this account: {available_privacy_levels}")
        
        # Validate provided privacy level is available
        if privacy_level not in available_privacy_levels:
            return False, {"error": f"Privacy level '{privacy_level}' not available. Available options: {available_privacy_levels}"}, None
            
        actual_privacy_level = privacy_level
        logging.info(f"Using privacy level: {actual_privacy_level}")
        
        # Step 3: Download video temporarily
        logging.info(f"Downloading video from URL: {video_url}")
        try:
            video_response = requests.get(video_url, stream=True, timeout=300)
            video_response.raise_for_status()
            
            # Create temporary file for video
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video:
                for chunk in video_response.iter_content(chunk_size=8192):
                    temp_video.write(chunk)
                temp_video_path = temp_video.name
        except Exception as e:
            logging.error(f"Failed to download video: {str(e)}")
            return False, {"error": f"Failed to download video: {str(e)}"}, None
        
        try:
            # Step 4: Initialize video upload
            logging.info("Initializing TikTok video upload...")
            
            # Get video file size
            video_size = os.path.getsize(temp_video_path)
            
            init_headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json; charset=UTF-8'
            }
            
            # Use title if provided, otherwise use content
            video_title = title if title else content
            if not video_title:
                video_title = "Posted via Postwand"
            
            # Limit title to 2200 characters (TikTok's limit)
            if len(video_title) > 2200:
                video_title = video_title[:2197] + "..."
            
            init_data = {
                'post_info': {
                    'title': video_title,
                    'privacy_level': actual_privacy_level,
                    'disable_comment': disable_comment,
                    'disable_duet': disable_duet,
                    'disable_stitch': disable_stitch,
                    'video_cover_timestamp_ms': 1000  # Cover thumbnail at 1 second
                },
                'source_info': {
                    'source': 'FILE_UPLOAD',
                    'video_size': video_size,
                    'chunk_size': video_size,  # Upload in one chunk
                    'total_chunk_count': 1
                }
            }
            
            # Add optional features if enabled
            if auto_add_music:
                init_data['post_info']['auto_add_music'] = True
            
            if brand_content_toggle:
                init_data['post_info']['brand_content_toggle'] = True
                
            if brand_organic_toggle:
                init_data['post_info']['brand_organic_toggle'] = True
            
            logging.info(f"TikTok init data being sent: {json.dumps(init_data, indent=2)}")
            
            init_response = requests.post(
                TIKTOK_VIDEO_UPLOAD_URL,
                headers=init_headers,
                json=init_data,
                timeout=30
            )
            
            logging.info(f"Init response status: {init_response.status_code}")
            logging.info(f"Init response body: {init_response.text}")
            
            if init_response.status_code != 200:
                error_msg = f"Failed to initialize TikTok upload: {init_response.text}"
                logging.error(error_msg)
                return False, {"error": error_msg}, None
            
            init_result = init_response.json()
            
            if 'data' not in init_result:
                error_msg = f"Invalid initialization response: {init_result}"
                logging.error(error_msg)
                return False, {"error": error_msg}, None
            
            publish_id = init_result['data']['publish_id']
            upload_url = init_result['data']['upload_url']
            
            logging.info(f"Got publish_id: {publish_id}")
            logging.info(f"Got upload_url: {upload_url}")
            
            # Step 5: Upload the video file
            logging.info("Uploading video file to TikTok...")
            
            with open(temp_video_path, 'rb') as video_file:
                upload_headers = {
                    'Content-Type': 'video/mp4',
                    'Content-Length': str(video_size),
                    'Content-Range': f'bytes 0-{video_size-1}/{video_size}'
                }
                
                upload_response = requests.put(
                    upload_url,
                    data=video_file,
                    headers=upload_headers,
                    timeout=600  # 10 minutes for large files
                )
                
                logging.info(f"Upload response status: {upload_response.status_code}")
                
                if upload_response.status_code not in [200, 201]:
                    error_msg = f"Failed to upload video to TikTok: {upload_response.text}"
                    logging.error(error_msg)
                    return False, {"error": error_msg}, None
            
            # Success! Video will be processed and published automatically
            result_data = {
                'publish_id': publish_id,
                'status': 'PROCESSING_UPLOAD',
                'privacy_level_used': actual_privacy_level
            }
            
            logging.info(f"TikTok video uploaded successfully with publish_id: {publish_id}")
            return True, {"message": "TikTok video uploaded successfully! Note: Video is set to private (SELF_ONLY) due to unaudited API client restrictions. You can change this to public manually in your TikTok app."}, result_data
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_video_path)
                logging.info("Temporary video file cleaned up")
            except Exception as e:
                logging.warning(f"Failed to clean up temporary file: {e}")
        
    except Exception as e:
        logging.error(f"Unexpected error in TikTok upload: {str(e)}")
        return False, {"error": f"Unexpected error: {str(e)}"}, None

def _post_photos_to_tiktok(content, access_token, image_urls, title=None, description=None, privacy_level=None, disable_comment=True, auto_add_music=True, brand_content_toggle=False, brand_organic_toggle=False, photo_cover_index=0):
    """
    Internal function to post photos to TikTok
    
    Args:
        content (str): The main content/caption for the photos (fallback for title/description)
        access_token (str): The TikTok OAuth2 access token
        image_urls (list): List of image URLs (must be from verified domain)
        title (str, optional): Title for the photo post (max 90 characters)
        description (str, optional): Description for the photo post (max 4000 characters)
        privacy_level (str, optional): Privacy level
        disable_comment (bool, optional): Whether to disable comments
        auto_add_music (bool, optional): Whether to auto-add recommended music
        brand_content_toggle (bool, optional): Whether this is branded content
        brand_organic_toggle (bool, optional): Whether this is branded organic content
        photo_cover_index (int, optional): Index of photo to use as cover (0-based)
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    
    result_data = None
    
    try:
        logging.info("Starting TikTok photo upload process")
        logging.info(f"TikTok photo upload called with {len(image_urls)} images")
        
        # Step 1: Validate inputs
        if not image_urls or len(image_urls) == 0:
            return False, {"error": "At least one image URL is required for TikTok photo posts"}, None
            
        if len(image_urls) > 35:
            return False, {"error": "TikTok supports maximum 35 photos per post"}, None
            
        if photo_cover_index >= len(image_urls):
            photo_cover_index = 0  # Default to first image
        
        # Step 2: Query creator info to get available privacy levels
        logging.info("Querying creator info...")
        creator_info = get_creator_info(access_token)
        if not creator_info:
            return False, {"error": "Failed to get creator info. Please check your TikTok authentication."}, None
            
        # Step 3: Validate privacy level is provided
        if not privacy_level:
            return False, {"error": "Privacy level must be specified"}, None
            
        available_privacy_levels = creator_info.get('privacy_level_options', [])
        logging.info(f"Available privacy levels for this account: {available_privacy_levels}")
        
        # Validate provided privacy level is available
        if privacy_level not in available_privacy_levels:
            return False, {"error": f"Privacy level '{privacy_level}' not available. Available options: {available_privacy_levels}"}, None
            
        actual_privacy_level = privacy_level
        logging.info(f"Using privacy level: {actual_privacy_level}")
        
        # Step 4: Prepare post data
        # Use provided title/description or fallback to content
        photo_title = title if title else content
        photo_description = description if description else content
        
        if not photo_title:
            photo_title = "Posted via Postwand"
        if not photo_description:
            photo_description = "Posted via Postwand"
        
        # Limit title to 90 characters (TikTok's limit for photos)
        if len(photo_title) > 90:
            photo_title = photo_title[:87] + "..."
            
        # Limit description to 4000 characters (TikTok's limit for photos)
        if len(photo_description) > 4000:
            photo_description = photo_description[:3997] + "..."
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json; charset=UTF-8'
        }
        
        post_data = {
            'media_type': 'PHOTO',
            'post_mode': 'DIRECT_POST',
            'post_info': {
                'title': photo_title,
                'description': photo_description,
                'privacy_level': actual_privacy_level,
                'disable_comment': disable_comment,
                'auto_add_music': auto_add_music
            },
            'source_info': {
                'source': 'PULL_FROM_URL',
                'photo_cover_index': photo_cover_index,
                'photo_images': image_urls
            }
        }
        
        # Add optional branding features if enabled
        if brand_content_toggle:
            post_data['post_info']['brand_content_toggle'] = True
            
        if brand_organic_toggle:
            post_data['post_info']['brand_organic_toggle'] = True
        
        logging.info(f"TikTok photo post data being sent: {json.dumps(post_data, indent=2)}")
        
        # Step 5: Make the API call
        response = requests.post(
            TIKTOK_CONTENT_POST_URL,
            headers=headers,
            json=post_data,
            timeout=30
        )
        
        logging.info(f"TikTok photo post response status: {response.status_code}")
        logging.info(f"TikTok photo post response body: {response.text}")
        
        if response.status_code != 200:
            error_msg = f"Failed to post TikTok photos: {response.text}"
            logging.error(error_msg)
            return False, {"error": error_msg}, None
        
        response_data = response.json()
        
        if 'data' not in response_data:
            error_msg = f"Invalid TikTok photo post response: {response_data}"
            logging.error(error_msg)
            return False, {"error": error_msg}, None
        
        # Success!
        publish_id = response_data['data']['publish_id']
        result_data = {
            'publish_id': publish_id,
            'status': 'PROCESSING_UPLOAD',
            'privacy_level_used': actual_privacy_level,
            'image_count': len(image_urls)
        }
        
        logging.info(f"TikTok photos posted successfully with publish_id: {publish_id}")
        return True, {"message": f"TikTok photos posted successfully! {len(image_urls)} image(s) uploaded. Note: Post is set to private (SELF_ONLY) due to unaudited API client restrictions. You can change this to public manually in your TikTok app."}, result_data
        
    except Exception as e:
        logging.error(f"Unexpected error in TikTok photo upload: {str(e)}")
        return False, {"error": f"Unexpected error: {str(e)}"}, None

def get_creator_info_for_ui(account_id, user_id):
    """
    Get creator info for UI display with token refresh handling
    
    Args:
        account_id (str): TikTok account ID
        user_id (str): User ID for database lookup
        
    Returns:
        dict: Response with success status and data or error
    """
    try:
        from database import get_supabase_client
        import os
        
        supabase = get_supabase_client()
        
        # Get TikTok account data from database
        tiktok_accounts = supabase.table('tiktok_accounts').select('*').eq('tiktok_id', account_id).eq('user_id', user_id).execute()
        
        if not tiktok_accounts.data:
            return {'success': False, 'error': 'TikTok account not found'}
            
        account = tiktok_accounts.data[0]
        access_token = account.get('access_token')
        
        if not access_token:
            return {'success': False, 'error': 'No access token available'}
            
        # Validate token and refresh if needed
        if not validate_tiktok_token(access_token):
            logging.warning("TikTok token is invalid, attempting refresh...")
            
            refresh_token = account.get('refresh_token')
            if not refresh_token:
                return {'success': False, 'error': 'Token expired. Please re-authenticate.'}
                
            # Refresh the token
            client_key = os.getenv('TIKTOK_CLIENT_KEY')
            client_secret = os.getenv('TIKTOK_CLIENT_SECRET')
            
            new_token_data = refresh_tiktok_token(refresh_token, client_key, client_secret)
            
            if new_token_data:
                access_token = new_token_data['access_token']
                # Update database
                supabase.table('tiktok_accounts').update({
                    'access_token': access_token,
                    'refresh_token': new_token_data.get('refresh_token', refresh_token)
                }).eq('id', account['id']).execute()
                logging.info("TikTok token refreshed successfully")
            else:
                return {'success': False, 'error': 'Failed to refresh token. Please re-authenticate.'}
        
        # Get creator info with validation
        creator_info = get_creator_info_with_validation(access_token)
        
        if not creator_info:
            return {'success': False, 'error': 'Failed to get creator info'}
            
        # Return formatted response
        return {
            'success': True,
            'data': {
                'display_name': account.get('display_name', 'TikTok User'),
                'can_post': creator_info.get('can_post', True),
                'privacy_level_options': creator_info.get('privacy_level_options', []),
                'max_video_duration_sec': creator_info.get('max_video_duration_sec', 600),
                'comment_disabled': creator_info.get('comment_disabled', False),
                'duet_disabled': creator_info.get('duet_disabled', False),
                'stitch_disabled': creator_info.get('stitch_disabled', False)
            }
        }
        
    except Exception as e:
        logging.error(f"Error in get_creator_info_for_ui: {str(e)}")
        return {'success': False, 'error': str(e)}

def get_creator_info_with_validation(access_token):
    """
    Get creator info and validate posting capabilities
    
    Args:
        access_token (str): The TikTok access token
        
    Returns:
        dict: Creator info with validation results, or None if failed
    """
    try:
        creator_info = get_creator_info(access_token)
        if not creator_info:
            return None
            
        # Add posting validation
        can_post = creator_info.get('can_make_more_posts', True)
        max_video_duration = creator_info.get('max_video_post_duration_sec', 600)
        
        return {
            **creator_info,
            'can_post': can_post,
            'max_video_duration_sec': max_video_duration
        }
    except Exception as e:
        logging.error(f"Error getting creator info with validation: {str(e)}")
        return None

def get_creator_info(access_token):
    """
    Query TikTok creator info to get available privacy levels and other constraints
    
    Args:
        access_token (str): The TikTok access token
        
    Returns:
        dict: Creator info including privacy_level_options, or None if failed
    """
    try:
        logging.info(f"Getting TikTok creator info with token: {access_token[:20]}...")
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json; charset=UTF-8'
        }
        
        logging.info(f"Making request to: {TIKTOK_CREATOR_INFO_URL}")
        logging.info(f"Headers: Authorization=Bearer {access_token[:20]}..., Content-Type=application/json; charset=UTF-8")
        
        response = requests.post(
            TIKTOK_CREATOR_INFO_URL,
            headers=headers,
            timeout=10
        )
        
        logging.info(f"Creator info response status: {response.status_code}")
        logging.info(f"Creator info response headers: {dict(response.headers)}")
        logging.info(f"Creator info response text: {response.text}")
        
        if response.status_code == 200:
            creator_info = response.json()
            logging.info(f"Creator info response: {creator_info}")
            
            if 'data' in creator_info:
                return creator_info['data']
        
        logging.error(f"Failed to get creator info - Status: {response.status_code}, Response: {response.text}")
        return None
        
    except Exception as e:
        logging.error(f"Error getting creator info: {str(e)}")
        import traceback
        logging.error(f"Traceback: {traceback.format_exc()}")
        return None

def refresh_tiktok_token(refresh_token, client_key, client_secret):
    """
    Refresh TikTok access token using refresh token
    
    Args:
        refresh_token (str): The TikTok refresh token
        client_key (str): TikTok client key
        client_secret (str): TikTok client secret
        
    Returns:
        dict: New token data or None if failed
    """
    try:
        logging.info("Refreshing TikTok access token...")
        
        data = {
            'client_key': client_key,
            'client_secret': client_secret,
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token
        }
        
        response = requests.post(
            "https://open.tiktokapis.com/v2/oauth/token/",
            data=data,
            timeout=10
        )
        
        logging.info(f"TikTok token refresh response status: {response.status_code}")
        logging.info(f"TikTok token refresh response: {response.text}")
        
        if response.status_code == 200:
            token_data = response.json()
            logging.info("TikTok token refreshed successfully")
            return token_data
        else:
            logging.error(f"Failed to refresh TikTok token: {response.text}")
            return None
            
    except Exception as e:
        logging.error(f"Error refreshing TikTok token: {str(e)}")
        return None


def validate_tiktok_token(access_token):
    """
    Validate TikTok access token by making a test API call
    
    Args:
        access_token (str): The TikTok access token to validate
        
    Returns:
        bool: True if token is valid, False otherwise
    """
    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Use the user info endpoint to validate token
        response = requests.get(
            f"{TIKTOK_API_BASE}/v2/user/info/",
            headers=headers,
            params={'fields': 'open_id'},
            timeout=10
        )
        
        logging.info(f"TikTok token validation response: {response.status_code}")
        if response.status_code != 200:
            logging.error(f"TikTok token validation failed: {response.text}")
        
        return response.status_code == 200
        
    except Exception as e:
        logging.error(f"Error validating TikTok token: {str(e)}")
        return False

def post_to_tiktok(content, access_token, video_url, title=None, privacy_level=None, page_id=None, user_id=None, **kwargs):
    """
    Post a video to TikTok (private visibility for unaudited API clients)
    
    Args:
        content (str): The description for the video
        access_token (str): The TikTok OAuth2 access token  
        video_url (str): URL of the video to upload
        title (str, optional): Title for the video
        privacy_level (str, optional): Privacy level
        page_id (str, optional): TikTok account ID for token refresh
        user_id (str, optional): User ID for token refresh
        **kwargs: Additional options
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    return _upload_video_to_tiktok(
        content=content,
        access_token=access_token,
        video_url=video_url,
        title=title,
        privacy_level=privacy_level,
        page_id=page_id,
        user_id=user_id,
        **kwargs
    )

def post_to_tiktok_video(content, access_token, video_url, title=None, tiktok_compliance=None, page_id=None, user_id=None, **kwargs):
    """
    Post a video to TikTok (alias for standard posting)
    
    Args:
        content (str): The description for the video
        access_token (str): The TikTok OAuth2 access token
        video_url (str): URL of the video to upload
        title (str, optional): Title for the video
        privacy_level (str, optional): Privacy level
        page_id (str, optional): TikTok account ID for token refresh
        user_id (str, optional): User ID for token refresh
        **kwargs: Additional options
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    # Extract compliance parameters
    compliance = tiktok_compliance or {}
    privacy_level = compliance.get('privacy_level', 'SELF_ONLY')
    disable_comment = compliance.get('disable_comment', True)
    disable_duet = compliance.get('disable_duet', True)
    disable_stitch = compliance.get('disable_stitch', True)
    brand_content_toggle = compliance.get('brand_content_toggle', False)
    brand_organic_toggle = compliance.get('brand_organic_toggle', False)
    
    return post_to_tiktok(
        content=content,
        access_token=access_token,
        video_url=video_url,
        title=title,
        privacy_level=privacy_level,
        disable_comment=disable_comment,
        disable_duet=disable_duet,
        disable_stitch=disable_stitch,
        brand_content_toggle=brand_content_toggle,
        brand_organic_toggle=brand_organic_toggle,
        page_id=page_id,
        user_id=user_id,
        **kwargs
    )

def post_to_tiktok_photo(content, access_token, image_urls, title=None, description=None, privacy_level=None, **kwargs):
    """
    Post photos to TikTok
    
    Args:
        content (str): The main content/caption for the photos
        access_token (str): The TikTok OAuth2 access token
        image_urls (list): List of image URLs (must be from verified domain)
        title (str, optional): Title for the photo post (max 90 characters)
        description (str, optional): Description for the photo post (max 4000 characters)
        privacy_level (str, optional): Privacy level
        **kwargs: Additional options
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    return _post_photos_to_tiktok(
        content=content,
        access_token=access_token,
        image_urls=image_urls,
        title=title,
        description=description,
        privacy_level=privacy_level,
        **kwargs
    )

def check_tiktok_upload_status(publish_id, access_token):
    """
    Check the status of a TikTok video upload
    
    Args:
        publish_id (str): The publish ID returned from upload
        access_token (str): The TikTok access token
        
    Returns:
        dict: Status information
    """
    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Note: TikTok doesn't have a public status check endpoint yet
        # This is a placeholder for future implementation
        return {
            'publish_id': publish_id,
            'status': 'PROCESSING_UPLOAD',
            'message': 'TikTok video is being processed'
        }
        
    except Exception as e:
        logging.error(f"Error checking TikTok upload status: {str(e)}")
        return {
            'publish_id': publish_id,
            'status': 'UNKNOWN',
            'error': str(e)
        }