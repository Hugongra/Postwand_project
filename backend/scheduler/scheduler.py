from flask import request, jsonify, session
import json
import uuid
from datetime import datetime, timezone
import logging
import os
import requests
import tempfile
import subprocess
import requests
import boto3
from botocore.client import Config
from flask import session
import base64
import io
from tusclient import client as tus_client

from celery import Celery
# Import Supabase client from your database module
from rate_limiter import user_rate_limit

from database import get_supabase_client, get_service_role_client
supabase = get_supabase_client()
supabase_admin = get_service_role_client()


from .facebook import post_to_facebook, post_to_facebook_story, post_to_facebook_reel, post_to_facebook_video, post_to_facebook_carousel
from .instagram import post_to_instagram, post_to_instagram_story, post_to_instagram_reel, post_to_instagram_carousel
from .threads import post_to_threads
from .linkedin import post_to_linkedin, post_to_linkedin_article, post_to_linkedin_video, post_to_linkedin_image
from .youtube import post_to_youtube, post_to_youtube_video, post_to_youtube_short
from .tiktok import post_to_tiktok, post_to_tiktok_video


# Set up Celery with Upstash Redis using the official format
UPSTASH_REDIS_HOST = os.getenv("UPSTASH_REDIS_HOST")
UPSTASH_REDIS_PORT = os.getenv("UPSTASH_REDIS_PORT")
UPSTASH_REDIS_PASSWORD = os.getenv("UPSTASH_REDIS_PASSWORD")

# Format the connection string according to Upstash docs
redis_url = f"rediss://:{UPSTASH_REDIS_PASSWORD}@{UPSTASH_REDIS_HOST}:{UPSTASH_REDIS_PORT}?ssl_cert_reqs=required"

celery_app = Celery('scheduler',
                   broker=redis_url,
                   backend=redis_url)

# Optional Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    broker_connection_retry_on_startup=True,
)

# Import the cache functions at the top of the file
from redis_cache import cache_result, invalidate_cache

def handle_image_upload(image, type):
    """
    Upload an image file to Supabase storage
    
    Args:
        image_file: The image file from request.files
        
    Returns:
        tuple: (file_name, image_url)
    """
    try:
        # Check if image is already a Supabase URL
        if type == 'url' and 'supabase.co/storage' in image:
            return None, image
            
        user_id = session.get('user_id')

        if type == 'file':
            image_data = image.read()
            format_type = image.filename.rsplit('.', 1)[1].lower()
            
        else:   
            # Extract image format and data
            content_type = image.split(';')[0].split(':')[1]
            format_type = content_type.split('/')[-1].lower()
            image_data = base64.b64decode(image.split(',')[1])

            
        filename = f"{uuid.uuid4()}.{format_type}"
        bucket_path = f"{user_id}/{filename}"
        
        print(f"Uploading to Supabase: {bucket_path}, size={len(image_data)} bytes")
        # Upload to Supabase storage
        upload_result = supabase_admin.storage.from_('post-images').upload(
            bucket_path,
            image_data,
            {'content-type': f'image/{format_type}'}
        )
        print(f"Upload result: {upload_result}")
        
        # Check if upload_result indicates success (depends on your client)
        image_url = supabase_admin.storage.from_('post-images').get_public_url(bucket_path)
        return bucket_path, image_url
        
    except Exception as e:
        logging.error(f"Error uploading image: {str(e)}")
        return None, None




# Load from env or hardcode
SUPABASE_PROJECT_REF = "qacaiikdxhlnvxmozbwl"
SUPABASE_BUCKET = "post-videos"
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

SUPABASE_S3_ACCESS_KEY = os.getenv("SUPABASE_S3_ACCESS_KEY")
SUPABASE_S3_SECRET_KEY = os.getenv("SUPABASE_S3_SECRET_KEY")


s3 = boto3.client(
    's3',
    endpoint_url=f"https://{SUPABASE_PROJECT_REF}.supabase.co/storage/v1/s3",
    aws_access_key_id=SUPABASE_S3_ACCESS_KEY,
    aws_secret_access_key=SUPABASE_S3_SECRET_KEY,
    config=Config(signature_version='s3v4')
)


def handle_video_upload(video, type):
    """Ultra-fast video upload using Supabase TUS resumable uploads"""
    print(f"=== FAST TUS UPLOAD START ===")
    print(f"Type: {type}")
    
    try:
        # Check if already a Supabase URL
        if type == 'url' and 'supabase.co/storage' in video:
            print(f"Video is already a Supabase URL: {video}")
            return None, video, None

        user_id = session.get('user_id')
        print(f"User ID: {user_id}")
        
        if not user_id:
            print("ERROR: No user_id found in session")
            return None, None, "User not authenticated"

        # Get service role token for TUS upload
        access_token = SUPABASE_SERVICE_ROLE_KEY
        file_stream = None
        
        if type == 'file':
            print(f"Processing file upload...")
            print(f"Video filename: {getattr(video, 'filename', 'No filename')}")
            
            # Get file size efficiently
            video.seek(0, os.SEEK_END)
            file_size = video.tell()
            video.seek(0)
            print(f"File size: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB)")
            
            if file_size > 52428800:  # 50MB limit
                print(f"ERROR: File size exceeds 50MB limit")
                return None, None, "Video file exceeds 50MB limit"

            # Extract file extension
            try:
                file_ext = video.filename.rsplit('.', 1)[1].lower()
                print(f"Extracted file extension: {file_ext}")
            except IndexError:
                print(f"ERROR: Could not extract file extension from filename")
                return None, None, "Invalid filename"
            
            # Use the file directly - no temp files needed!
            file_stream = video
            
        else:  # type == 'url'
            print(f"Processing URL streaming: {video}")
            try:
                print(f"Making HTTP request to stream video...")
                response = requests.get(video, stream=True)
                response.raise_for_status()
                print(f"HTTP response status: {response.status_code}")
                
                content_length = response.headers.get('content-length')
                print(f"Content-Length header: {content_length}")
                
                if content_length and int(content_length) > 52428800:
                    print(f"ERROR: Video from URL exceeds 50MB limit")
                    return None, None, "Video file exceeds 50MB limit"

                # Extract file extension
                file_ext = 'mp4'  # default
                if '.' in video.split('?')[0]:
                    file_ext = video.split('?')[0].rsplit('.', 1)[1].lower()
                    print(f"Extracted file extension from URL: {file_ext}")
                else:
                    content_type_header = response.headers.get('content-type', '')
                    if 'video/' in content_type_header:
                        file_ext = content_type_header.split('/')[-1].split(';')[0]
                        print(f"Extracted file extension from Content-Type: {file_ext}")

                # Create file-like object from response - stream directly into memory
                print(f"Streaming video into memory...")
                file_stream = io.BytesIO()
                bytes_downloaded = 0
                for chunk in response.iter_content(chunk_size=1024*1024):  # 1MB chunks
                    file_stream.write(chunk)
                    bytes_downloaded += len(chunk)
                    if bytes_downloaded % (5*1024*1024) == 0:  # Log every 5MB
                        print(f"Streamed: {bytes_downloaded / 1024 / 1024:.1f} MB")
                
                file_stream.seek(0)  # Reset to beginning
                print(f"Total bytes streamed: {bytes_downloaded}")

            except requests.RequestException as e:
                print(f"ERROR: Failed to stream video from URL: {str(e)}")
                return None, None, f"Failed to download video: {str(e)}"

        # Generate unique filename and bucket path
        filename = f"{uuid.uuid4()}.{file_ext}"
        bucket_path = f"{user_id}/{filename}"
        
        print(f"Generated filename: {filename}")
        print(f"Bucket path: {bucket_path}")
        print(f"Starting TUS resumable upload...")
        
        # Create TUS client - using direct storage hostname for maximum speed!
        tus_upload_url = f"https://{SUPABASE_PROJECT_REF}.storage.supabase.co/storage/v1/upload/resumable"
        print(f"TUS upload URL: {tus_upload_url}")
        
        tus_upload_client = tus_client.TusClient(
            tus_upload_url,
            headers={
                "Authorization": f"Bearer {access_token}", 
                "x-upsert": "true"  # Allow overwriting for faster uploads
            }
        )
        
        # Create uploader with large chunks for maximum speed
        uploader = tus_upload_client.uploader(
            file_stream=file_stream,
            chunk_size=(10 * 1024 * 1024),  # 10MB chunks for maximum throughput
            metadata={
                "bucketName": SUPABASE_BUCKET,
                "objectName": bucket_path,
                "contentType": f"video/{file_ext}",
                "cacheControl": "3600",
            },
        )
        
        # Upload with progress tracking
        print(f"Uploading with 10MB chunks for maximum speed...")
        uploader.upload()
        print(f"TUS resumable upload completed successfully!")

        # Generate public URL
        video_url = f"https://{SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/{SUPABASE_BUCKET}/{bucket_path}"
        
        print(f"=== FAST TUS UPLOAD SUCCESS ===")
        print(f"Bucket path: {bucket_path}")
        print(f"Video URL: {video_url}")
        return bucket_path, video_url, None

    except Exception as e:
        print(f"=== FAST TUS UPLOAD ERROR ===")
        print(f"Exception message: {str(e)}")
        import traceback
        print(f"Full traceback:")
        print(traceback.format_exc())
        return None, None, str(e)



# Add caching to post_to_platform function (cache tokens)

def get_platform_token(platform, page_id, auth_id=None, user_id=None):
    """Get authentication token for a platform"""
    logging.info(f"-----------page_id {page_id}")
    if platform == 'facebook':
        pages = supabase.table('facebook_pages').select('*').eq('page_id', page_id).eq('auth_id', auth_id).execute()
        if not pages.data:
            return None
        return pages.data[0]['page_token']
    elif platform == 'instagram':
        ig_accounts = supabase.table('instagram_accounts').select('*').eq('account_id', page_id).eq('user_id', user_id).execute()
        if not ig_accounts.data:
            return ig_accounts.data
        # Return both the token and the type
        return {
            'access_token': ig_accounts.data[0]['access_token'],
            'type': ig_accounts.data[0]['type']
        }
    elif platform == 'threads':
        threads_accounts = supabase.table('threads_auth').select('*').eq('user_id', user_id).execute()
        if not threads_accounts.data:
            return None
        return threads_accounts.data[0]['access_token']
    
    elif platform == 'linkedin':

        logging.info(f"-----------page_id {page_id}")
        linkedin_accounts = supabase.table('linkedin_accounts').select('*').eq('account_id', page_id).eq('user_id', user_id).execute()
        if not linkedin_accounts.data:
            return None
        logging.info(f"-----------linkedin_accounts {linkedin_accounts.data}")
        return linkedin_accounts.data[0]['access_token']
    
    elif platform == 'youtube':
        logging.info(f"-----------channel_id {page_id}")
        youtube_channels = supabase.table('youtube_channels').select('*').eq('channel_id', page_id).eq('user_id', user_id).execute()
        if not youtube_channels.data:
            return None
        logging.info(f"-----------youtube_channels {youtube_channels.data}")
        # Return both access_token and refresh_token like Instagram
        return {
            'access_token': youtube_channels.data[0]['access_token'],
            'refresh_token': youtube_channels.data[0]['refresh_token']
        }
    
    elif platform == 'tiktok':
        logging.info(f"-----------tiktok_id {page_id}")
        logging.info(f"-----------user_id {user_id}")
        tiktok_accounts = supabase.table('tiktok_accounts').select('*').eq('tiktok_id', page_id).eq('user_id', user_id).execute()
        logging.info(f"-----------tiktok_accounts query result: {tiktok_accounts}")
        if not tiktok_accounts.data:
            logging.error(f"No TikTok account found for tiktok_id={page_id}, user_id={user_id}")
            return None
        logging.info(f"-----------tiktok_accounts {tiktok_accounts.data}")
        access_token = tiktok_accounts.data[0]['access_token']
        logging.info(f"-----------retrieved access_token: {access_token[:20] if access_token else 'None'}...")
        return access_token
   


def post_to_platform(platform_data, content, image_url=None, video_url=None, location_id=None, user_id=None, file_name=None, video_file_name=None, scheduled_post_id=None, youtube_metadata=None, tiktok_metadata=None):
   
    """Helper function to post to a specific platform with appropriate content"""

    if not user_id:
        return {
            'platform': platform_data.get('platform', 'unknown'),
            'success': False,
            'result': "User not authenticated"
        }
    
    platform = platform_data.get('platform')
    auth_id = platform_data.get('auth_id')
    page_id = platform_data.get('page_id')
    post_type = platform_data.get('post_type', 'post')  # Default to regular post
    
    logging.info(f"Starting post_to_platform for {platform} ({post_type})")
    
    # Auto-convert regular Instagram posts with video to reels
    if platform == 'instagram' and post_type == 'post' and video_url:
        logging.info("Detected video for regular Instagram post - automatically converting to reel")
        post_type = 'reel'
        
    # Get cached token
    if platform_data.get('scheduled'):
        access_token = platform_data.get('page_token')
        if not access_token:
            return {
                'platform': platform,
                'success': False,
                'result': f'{platform} authentication not found'
            }
        # For Instagram and YouTube scheduled posts, get additional data from platform_data
        if platform == 'instagram':
            instagram_type = platform_data.get('instagram_type', 'facebook')  # Default to facebook if not specified
            refresh_token = None
            logging.info(f"Using stored Instagram auth type for scheduled post: {instagram_type}")
        elif platform == 'youtube':
            instagram_type = None
            refresh_token = platform_data.get('refresh_token')
            logging.info(f"Using stored YouTube refresh token for scheduled post: {bool(refresh_token)}")
        elif platform == 'tiktok':
            instagram_type = None
            refresh_token = None
            logging.info(f"Using stored TikTok access token for scheduled post")
        else:
            instagram_type = None
            refresh_token = None
    else:
        token_data = get_platform_token(platform, page_id, auth_id, user_id)
        
        if not token_data:
            return {
                'token_data': token_data,
                'platform': platform,
                'success': False,
                'result': f'{platform} authentication not found',
                'page_id': page_id,
                
            }
        
        # For Instagram and YouTube, token_data is a dict with access_token and other data
        if platform == 'instagram':
            access_token = token_data['access_token']
            instagram_type = token_data['type']
            refresh_token = None
        elif platform == 'youtube':
            access_token = token_data['access_token']
            refresh_token = token_data['refresh_token']
            instagram_type = None
        elif platform == 'tiktok':
            access_token = token_data
            instagram_type = None
            refresh_token = None
        else:
            access_token = token_data
            instagram_type = None
            refresh_token = None
    
    
    
    
    # Handle multiple images - convert to list format for easier processing
    if isinstance(image_url, str):
        image_urls = [image_url] if image_url else []
    elif isinstance(image_url, list):
        image_urls = image_url
    else:
        image_urls = []
    
    # Helper function to determine if we should use carousel
    use_carousel = len(image_urls) > 1 and post_type == 'post'
    
    if platform == 'facebook':
        
        # Get Facebook App ID from environment variables if available
        app_id = os.environ.get('FB_APP_ID')
        
        # Check post type for Facebook
        if post_type == 'story':
            logging.info("Calling post_to_facebook_story")
            try:
                # Use first image for stories
                first_image = image_urls[0] if image_urls else None
                success, result, result_data = post_to_facebook_story(
                    page_id=page_id,
                    access_token=access_token,
                    image_url=first_image,
                    video_url=video_url,
                    app_id=app_id
                )
                logging.info(f"post_to_facebook_story returned: {success}, {result}, {result_data is not None}")
            except Exception as e:
                logging.error(f"Error in post_to_facebook_story: {str(e)}")
                raise
                
        elif post_type == 'reel':
            logging.info("Calling post_to_facebook_reel")
            try:
                # Use first image as cover for reels
                first_image = image_urls[0] if image_urls else None
                success, result, result_data = post_to_facebook_reel(
                    page_id=page_id,
                    content=content,
                    access_token=access_token,
                    video_url=video_url,
                    cover_url=first_image,  # Use first image as cover if provided
                    location_id=location_id,
                    app_id=app_id
                )
                logging.info(f"post_to_facebook_reel returned: {success}, {result}, {result_data is not None}")
            except Exception as e:
                logging.error(f"Error in post_to_facebook_reel: {str(e)}")
                raise
            
        else:
            # Regular Facebook post - check if video is provided
            if video_url:
                logging.info("Calling post_to_facebook_video")
                try:
                    success, result, result_data = post_to_facebook_video(
                        page_id=page_id,
                        content=content,
                        access_token=access_token,
                        video_url=video_url,
                        title=None,  # Could be derived from content if needed
                        description=content,
                        location_id=location_id,
                        app_id=app_id
                    )
                    logging.info(f"post_to_facebook_video returned: {success}, {result}, {result_data is not None}")
                except Exception as e:
                    logging.error(f"Error in post_to_facebook_video: {str(e)}")
                    raise
            elif use_carousel:
                logging.info(f"Calling post_to_facebook_carousel with {len(image_urls)} images")
                try:
                    success, result, result_data = post_to_facebook_carousel(
                        page_id=page_id,
                        content=content,
                        access_token=access_token,
                        image_urls=image_urls,
                        location_id=location_id
                    )
                    logging.info(f"post_to_facebook_carousel returned: {success}, {result}, {result_data is not None}")
                except Exception as e:
                    logging.error(f"Error in post_to_facebook_carousel: {str(e)}")
                    raise
            else:
                logging.info("Calling post_to_facebook")
                try:
                    # Use first image for single posts
                    first_image = image_urls[0] if image_urls else None
                    success, result, result_data = post_to_facebook(
                        page_id=page_id,
                        content=content,
                        access_token=access_token,
                        image_url=first_image,
                        location_id=location_id
                    )
                   
                except Exception as e:
                    logging.error(f"Error in post_to_facebook unpacking: {str(e)}")
                    raise
    
    elif platform == 'instagram':
        # Determine the host URL based on the Instagram auth type
        if instagram_type == 'facebook':
            host_url = "graph.facebook.com"
            logging.info("Using Facebook Graph API for Instagram posting")
        else:  # instagram type
            host_url = "graph.instagram.com"
            logging.info("Using Instagram Graph API for Instagram posting")
        
        # Handle different Instagram post types
        if post_type == 'story':
            logging.info(f"Posting Instagram Story for page_id: {page_id}")
            # For stories, we need at least one media type
            if not image_url and not video_url:
                logging.error("Instagram Story requires media but none provided")
                return {
                    'platform': 'instagram',
                    'post_type': 'story',
                    'success': False,
                    'result': 'Either image or video URL is required for Instagram Stories'
                }
                
            try:
                success, result, result_data = post_to_instagram_story(
                    host_url=host_url,
                    page_id=page_id,
                    access_token=access_token,
                    image_url=image_url,
                    video_url=video_url
                )
                logging.info(f"Instagram Story post result - success: {success}, result: {json.dumps(result) if isinstance(result, dict) else result}")
            except ValueError as e:
                logging.error(f"Instagram Story posting error: {str(e)}")
                return {
                    'platform': 'instagram',
                    'post_type': 'story',
                    'success': False,
                    'result': f"Error posting to Instagram story: {str(e)}"
                }
        
        elif post_type == 'reel':
            logging.info(f"Posting Instagram Reel for page_id: {page_id}")
            # For reels, we need video content
            if not video_url:
                logging.error("Instagram Reel requires video but none provided")
                return {
                    'platform': 'instagram',
                    'post_type': 'reel',
                    'success': False,
                    'result': 'Video URL is required for Instagram Reels'
                }
            
            # Read share_to_feed from platform_data, defaulting to false
            share_to_feed = platform_data.get('share_to_feed', False)
            logging.info(f"Posting Instagram Reel with share_to_feed={share_to_feed}")
            
            try:
                success, result, result_data = post_to_instagram_reel(
                    host_url=host_url,
                    page_id=page_id,
                    content=content,
                    access_token=access_token,
                    video_url=video_url,
                    cover_url=image_url,  # Use image_url as cover if provided
                    share_to_feed=share_to_feed
                )
                logging.info(f"Instagram Reel post result - success: {success}, result: {json.dumps(result) if isinstance(result, dict) else result}")
            except ValueError as e:
                logging.error(f"Instagram Reel posting error: {str(e)}")
                return {
                    'platform': 'instagram',
                    'post_type': 'reel',
                    'success': False,
                    'result': f"Error posting to Instagram reel: {str(e)}"
                }
        
        else:
            logging.info(f"Posting regular Instagram post for page_id: {page_id}")
            # Regular Instagram post (needs image)
            if not image_urls:
                logging.error("Regular Instagram post requires image but none provided")
                return {
                    'platform': 'instagram',
                    'success': False,
                    'result': 'Image URL is required for Instagram posts'
                }
                
            try:
                if use_carousel:
                    logging.info(f"Posting Instagram carousel with {len(image_urls)} images")
                    success, result, result_data = post_to_instagram_carousel(
                        host_url=host_url,
                        page_id=page_id,
                        content=content,
                        access_token=access_token,
                        image_urls=image_urls,
                        location_id=location_id
                    )
                else:
                    # Single image post
                    first_image = image_urls[0]
                    success, result, result_data = post_to_instagram(
                        host_url=host_url,
                        page_id=page_id,
                        content=content,
                        access_token=access_token,
                        image_url=first_image,
                        location_id=location_id
                    )
                logging.info(f"Instagram post result - success: {success}, result: {json.dumps(result) if isinstance(result, dict) else result}")
            except ValueError as e:
                logging.error(f"Instagram post error: {str(e)}")
                return {
                    'platform': 'instagram',
                    'post_type': 'post',
                    'success': False,
                    'result': f"Error posting to Instagram post: {str(e)}"
                }
            
    elif platform == 'threads':
       
        
        success, result, result_data = post_to_threads(
            page_id=page_id,
            content=content,
            access_token=access_token,
            image_url=image_urls[0] if image_urls else None
        )
        
    elif platform == 'linkedin':
        if post_type == 'post':
            
            if image_url:
                success, result, result_data = post_to_linkedin_image(
                    author=page_id,
                    content=content,
                    access_token=access_token,
                    image_url=image_urls[0] if image_urls else None
                )
            if image_url == None and video_url == None:
                success, result, result_data = post_to_linkedin(
                    author=page_id,
                    access_token=access_token,
                    content=content,
                    
                )

        elif post_type == 'reel' or post_type == 'story':
            if video_url == None:
                return {
                    'platform': 'linkedin',
                    'post_type': post_type,
                    'success': False,
                    'result': 'Video URL is required for LinkedIn video'
                }
            success, result, result_data = post_to_linkedin_video(
                author=page_id,
                content=content,
                access_token=access_token,
                video_url=video_url
            )
        
        elif post_type == 'article':
            success, result, result_data = post_to_linkedin_article(
                author=page_id,
                content=content,
                access_token=access_token,
                article_url=None,
                title=None,
                description=content
            )
    
    elif platform == 'youtube':
        print(f"=== YOUTUBE UPLOAD STARTING ===")
        print(f"Access token: {access_token[:20]}...")
        print(f"Refresh token: {refresh_token[:20] if refresh_token else 'None'}...")
        print(f"Video URL: {video_url}")
        
        # Extract YouTube metadata
        youtube_title = None
        youtube_tags = None
        youtube_description = None
        youtube_category = None
        
        if youtube_metadata:
            youtube_title = youtube_metadata.get('title')
            youtube_tags = youtube_metadata.get('tags')
            youtube_description = youtube_metadata.get('description')
            youtube_category = youtube_metadata.get('category')
            
            # Parse tags if they're a comma-separated string
            if youtube_tags and isinstance(youtube_tags, str):
                youtube_tags = [tag.strip() for tag in youtube_tags.split(',') if tag.strip()]
        
        # Use metadata or fallback to content
        title = youtube_title if youtube_title else (content[:100] if content else "Untitled Video")
        description = youtube_description if youtube_description else content
        tags = youtube_tags if youtube_tags else None
        category_id = str(youtube_category) if youtube_category else "22"  # Ensure category_id is a string
        
        if post_type == 'video':
            if not video_url:
                return {
                    'platform': 'youtube',
                    'post_type': post_type,
                    'success': False,
                    'result': 'Video URL is required for YouTube videos'
                }
            success, result, result_data = post_to_youtube_video(
                content=content,
                access_token=access_token,
                video_url=video_url,
                title=title,
                description=description,
                tags=tags,
                category_id=category_id,
                refresh_token=refresh_token
            )
        elif post_type == 'short':
            if not video_url:
                return {
                    'platform': 'youtube',
                    'post_type': post_type,
                    'success': False,
                    'result': 'Video URL is required for YouTube Shorts'
                }
            success, result, result_data = post_to_youtube_short(
                content=content,
                access_token=access_token,
                video_url=video_url,
                title=title if title != "Untitled Video" else "Untitled Short",
                description=description,
                tags=tags,
                refresh_token=refresh_token
            )
        else:
            # Default to video for YouTube
            if not video_url:
                return {
                    'platform': 'youtube',
                    'post_type': 'video',
                    'success': False,
                    'result': 'Video URL is required for YouTube posts'
                }
            success, result, result_data = post_to_youtube_video(
                content=content,
                access_token=access_token,
                video_url=video_url,
                title=title,
                description=description,
                tags=tags,
                category_id=category_id,
                refresh_token=refresh_token
            )
    
    elif platform == 'tiktok':
        print(f"=== TIKTOK UPLOAD STARTING ===")
        print(f"Access token: {access_token[:20]}...")
        print(f"Video URL: {video_url}")
        
        if post_type == 'video' or post_type == 'post':
            if not video_url:
                return {
                    'platform': 'tiktok',
                    'post_type': post_type,
                    'success': False,
                    'result': 'Video URL is required for TikTok posts'
                }
            
            # Extract title from content or use default
            title = content[:100] if content else "Posted via Postwand"
            
            logging.info("About to call post_to_tiktok_video with compliance parameters")
            try:
                success, result, result_data = post_to_tiktok_video(
                    content=content,
                    access_token=access_token,
                    video_url=video_url,
                    title=title,
                    tiktok_compliance=tiktok_metadata,
                    page_id=page_id,
                    user_id=user_id
                )
                logging.info(f"post_to_tiktok_video returned: success={success}, result={result}, result_data={result_data is not None}")
            except Exception as e:
                logging.error(f"Error in post_to_tiktok_video: {str(e)}")
                raise
        else:
            # Default to video for TikTok since it's a video platform
            if not video_url:
                return {
                    'platform': 'tiktok',
                    'post_type': 'video',
                    'success': False,
                    'result': 'Video URL is required for TikTok posts'
                }
            
            title = content[:100] if content else "Posted via Postwand"
            
            try:
                success, result, result_data = post_to_tiktok_video(
                    content=content,
                    access_token=access_token,
                    video_url=video_url,
                    title=title,
                    tiktok_compliance=tiktok_metadata,
                    page_id=page_id,
                    user_id=user_id
                )
                logging.info(f"post_to_tiktok_video returned: success={success}, result={result}, result_data={result_data is not None}")
            except Exception as e:
                logging.error(f"Error in post_to_tiktok_video: {str(e)}")
                raise
    
    else:
        logging.error(f"Unknown platform: {platform}")
        return {
            'platform': platform,
            'success': False,
            'result': f'Unknown platform: {platform}'
        }
    

    post_data = {
        'content': content, 
        'page_id': page_id, 
        'page_token': access_token, 
        'scheduled_time': datetime.now().isoformat(),
        'status': 'published',
        'image_url': image_urls,
        'platform': platform, 
        'post_type': post_type,
        'video_url': video_url, 
        'post_creation_id': result_data.get('id') or result_data.get('post_id') or result_data.get('publish_id') if result_data else None,
        'user_id': user_id,
    }
    
    logging.info(f"Saving post to Supabase: user_id={user_id}, platform={platform}, post_type={post_type}")
    
    try:
        # If this is from a scheduled post, update the existing record instead of creating a new one
        if scheduled_post_id:
            logging.info(f"Updating existing scheduled post with ID: {scheduled_post_id}")
            db_result = supabase.table('scheduled_posts').update(post_data).eq('id', scheduled_post_id).execute()
            if db_result.data:
                logging.info(f"Successfully updated scheduled post to published status")
            else:
                logging.error(f"Failed to update scheduled post: No data returned from update operation")
        else:
            # Otherwise create a new record for immediate posts
            db_result = supabase.table('scheduled_posts').insert(post_data).execute()
            if db_result.data:
                logging.info(f"Successfully saved post to Supabase with ID: {db_result.data[0].get('id')}")
            else:
                logging.error(f"Failed to save post to Supabase: No data returned from insert operation")
            
    except Exception as db_error:
        logging.error(f"Error saving post to Supabase: {str(db_error)}")
        # Continue execution - we don't want to fail the whole function if just the DB save fails
    
    logging.info(f"Completed posting to {platform} (post_type: {post_type}) - success: {success}")
    return {
        'platform': platform,
        'post_type': post_type,
        'success': success,
        'result': result
    }


def schedule_future_post(status, content, platform, page_id, page_token, scheduled_time, post_type='post', 
                         image_url=None, video_url=None, location_id=None, location_name=None, share_to_feed=False):
    """
    Schedule a post for future publishing
    
    Args:
        content (str): The content to post
        platform (str): The platform to post to (facebook, instagram, threads)
        page_id (str): The page or account ID
        page_token (str): The access token
        scheduled_time (str): ISO format datetime string
        post_type (str): Type of post (regular, story, reel)
        image_url (str, optional): URL of image to include
        video_url (str, optional): URL of video to include
        location_id (str, optional): ID of location to tag
        location_name (str, optional): Name of location to tag
        share_to_feed (bool, optional): Whether to share reels to feed
        
    Returns:
        tuple: (success, result_or_error)
    """
    
    try:
        user_id = session.get('user_id')
        if not user_id:
            return False, "User not authenticated"
        
        # Validate scheduled time
        try:
            scheduled_datetime = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
        except ValueError:
            return False, "Invalid scheduled time format"
        
        if scheduled_datetime <= datetime.now().astimezone():
            return False, "Scheduled time must be in the future"

        # Prepare post data
        post_data = {
            'user_id': user_id,
            'content': content,
            'page_id': page_id,
            'platform': platform,
            'page_token': page_token,
            'scheduled_time': scheduled_time,
            'post_type': post_type,
            'status': status
        }
        
        # Add optional fields
        if image_url:
            post_data['image_url'] = image_url
            
        if video_url:
            post_data['video_url'] = video_url
            
        if location_id:
            post_data['location_id'] = location_id
            post_data['location_name'] = location_name
            
        if share_to_feed:
            post_data['share_to_feed'] = True
        
        # Save to Supabase
        result = supabase.table('scheduled_posts').insert(post_data).execute()
        
        return True, {
            'message': 'Post scheduled successfully!',
            'id': result.data[0]['id']
        }
        
    except Exception as e:
        logging.error(f"Error scheduling post: {str(e)}")
        return False, str(e)


# Convert run_in_background to a Celery task
@celery_app.task(bind=True, name='scheduler.scheduler.run_in_background_task')
def run_in_background_task(self, task_id, platforms_data, content_data, image_urls, video_url,  location_id, user_id, file_names=None, video_file_name=None, scheduled_post_id=None, youtube_metadata=None, tiktok_metadata=None):
    """Celery task to handle posting to multiple platforms"""
    try:
        print(f"=== CELERY TASK STARTED ===")
        print(f"Task ID: {task_id}")
        print(f"Celery Task ID: {self.request.id}")
        print(f"Platforms: {platforms_data}")
        print(f"Content: {content_data}")
        print(f"User ID: {user_id}")
        logging.info(f"Starting Celery task {task_id} (task_id: {self.request.id})")
        
        # Update task status to "processing"
        supabase.table('background_task_post').update({
            'status': 'processing',
            'user_id': user_id
        }, returning='minimal', count='exact').eq('id', task_id).execute()
        
        # Invalidate cache after update
        invalidate_cache("task_status", task_id)
            
        results = {
            'success': [],
            'failed': []
        }
      
        # Process each platform sequentially
        for platform_data in platforms_data:
            try:
                # Get content for this specific platform
                platform = platform_data.get('platform')
                if isinstance(content_data, dict) and platform in content_data:
                    content = content_data[platform]
                elif isinstance(content_data, dict) and 'general' in content_data:
                    content = content_data['general']
                else:
                    content = str(content_data)  # Fallback to string conversion
                
                result = post_to_platform(
                    platform_data, 
                    content, 
                    image_urls, 
                    video_url, 
                    location_id,
                    user_id,
                    file_names,
                    video_file_name,
                    scheduled_post_id,  # Pass the scheduled post ID if available
                    youtube_metadata,  # Pass YouTube metadata
                    tiktok_metadata  # Pass TikTok metadata
                )
                
                platform = platform_data.get('platform')
                post_type = platform_data.get('post_type', 'post')
         
                if result['success']:
                    results['success'].append(result)
                    logging.info(f"Successfully posted to {platform} ({post_type})")
                else:
                    results['failed'].append(result)
                    logging.error(f"Failed to post to {platform} ({post_type}): {result['result']}")
                
            except Exception as exc:
                platform = platform_data.get('platform', 'unknown')
                post_type = platform_data.get('post_type', 'post')
                error_msg = f"Error posting to {platform} ({post_type}): {str(exc)}"
                logging.error(error_msg)
                
                results['failed'].append({
                    'platform': platform,
                    'post_type': post_type,
                    'success': False,
                    'result': error_msg
                })
                
        

        # Update task status based on results
        status = 'completed' if results['success'] else 'failed'
        supabase.table('background_task_post').update({
            'status': status,
            'results': json.dumps(results),
            'celery_task_id': self.request.id,
            'user_id': user_id
        }, returning='minimal', count='exact').eq('id', task_id).execute()
        
        # Invalidate cache after update
        invalidate_cache("task_status", task_id)
        
        return {'task_id': task_id, 'status': status, 'results': results}
            
    except Exception as e:
        # Update on error
        logging.error(f"Error in Celery task: {str(e)}")
        supabase.table('background_task_post').update({
            'status': 'failed',
            'results': json.dumps({'error': str(e)}),
            'celery_task_id': self.request.id,
            'user_id': user_id
        }, returning='minimal', count='exact').eq('id', task_id).execute()
        
        # Invalidate cache after update
        invalidate_cache("task_status", task_id)
        
        # Re-raise the exception to mark the task as failed in Celery
        raise

@user_rate_limit(limit=20, period=60)  # 10 scheduled posts per minute
def create_scheduled_post():
    """Main function to handle post scheduling and immediate posting"""
    try:
        # Get user_id from session while inside the request context
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
            
        # Handle platform-specific content or fallback to general content
        platforms_content_json = request.form.get('platforms_content')
        general_content = request.form.get('content', '')
        
        if platforms_content_json:
            try:
                platforms_content = json.loads(platforms_content_json)
                logging.info(f"Platform-specific content received: {list(platforms_content.keys())}")
            except json.JSONDecodeError:
                logging.error("Invalid platforms_content JSON")
                return jsonify({'error': 'Invalid platform content format'}), 400
        else:
            platforms_content = {}
            logging.info("Using general content for all platforms")
        
        scheduled_time = request.form.get('scheduled_time')
        schedule_now = request.form.get('schedule_now', 'false').lower() == 'true'
        
        # Helper function to get content for a specific platform
        def get_content_for_platform(platform):
            """Get content for a specific platform, fallback to general content"""
            if platforms_content and platform in platforms_content:
                return platforms_content[platform]
            return general_content
        
        if schedule_now == 'false' and not scheduled_time:
            logging.error("Missing posting now or scheduled time")
            return jsonify({'error': 'Please select a date and time for your post or post now.'}), 400
        
        logging.info(f"Create scheduled post request received")
        logging.info(f"General content length: {len(general_content) if general_content else 0} characters")
        logging.info(f"Platform-specific content: {bool(platforms_content)}")
        logging.info(f"Scheduled time: {scheduled_time}")
        logging.info(f"Schedule now: {schedule_now}")
        
        # Validate required data
        platforms_json = request.form.get('platforms')
        if not platforms_json:
            logging.error("No platforms data provided in the request")
            return jsonify({'error': 'Platforms data is required. Please select at least one platform.'}), 400
        
        logging.info(f"Platforms JSON: {platforms_json}")
        platforms_data = json.loads(platforms_json)
        logging.info(f"Parsed platforms data: {json.dumps(platforms_data)}")
        
        if not platforms_data:
            logging.error("Empty platforms data array")
            return jsonify({'error': 'No platforms selected. Please select at least one platform.'}), 400
        
        for platform_data in platforms_data:
            platform = platform_data.get('platform')
            auth_id = platform_data.get('auth_id') or None
            page_id = platform_data.get('page_id')
            post_type = platform_data.get('post_type', 'post')
            logging.info(f"Validating platform: {platform}, auth_id: {auth_id}, page_id: {page_id}, post_type: {post_type}")

            if not page_id:
                logging.error(f"Missing page_id for platform: {platform}")
                return jsonify({'error': f'{platform} account is required. Please connect your {platform} account again'}), 400
            
            if not platform:
                logging.error("Missing platform field in platform data")
                return jsonify({'error': 'Platform is required. Please select a platform.'}), 400
            
            if not auth_id and platform not in ['instagram', 'linkedin', 'youtube', 'tiktok']:
                logging.error(f"Missing auth_id for platform: {platform}")
                return jsonify({'error': f'{platform} authentication is required. Log in with your {platform} credentials again'}), 400
            
            # Validate content requirements based on platform and post type
            # Note: Instagram posts and reels do not require captions - they're optional
        
        if not schedule_now and not scheduled_time:
            logging.error("Missing scheduled_time for future post")
            return jsonify({'error': 'Scheduled time is required for future posts. Please select a date and time for your post.'}), 400
      
        # Handle media files if present
        file_names = []
        image_urls = []
        video_file_name = None
        video_url = None
        
        # Handle multiple images from frontend (image_0, image_1, etc.)
        image_count = int(request.form.get('image_count', 0))
        if image_count > 0:
            # Upload all images and use the first one for now
            
            for i in range(image_count):
                if f'image_{i}' in request.files:
                    image_file = request.files[f'image_{i}']
                    if image_file:
                        file_name_temp, image_url_temp = handle_image_upload(image_file, 'file')
                        if image_url_temp:
                            file_names.append(file_name_temp)
                            image_urls.append(image_url_temp)
                elif f'image_{i}' in request.form:  
                    image_data = request.form.get(f'image_{i}')
                    if image_data:
                        file_name_temp, image_url_temp = handle_image_upload(image_data, 'url')
                        if image_url_temp:
                            file_names.append(file_name_temp)
                            image_urls.append(image_url_temp)
            
     
        if 'video' in request.files:
            video_file = request.files['video']
            if video_file:
                video_file_name, video_url, error = handle_video_upload(video_file, 'file')
                if error:
                    return jsonify({'error': f'Video upload failed: {error}'}), 400
                
        elif 'video' in request.form:
            video_url = request.form.get('video')
            if video_url:   
                video_file_name, video_url, error = handle_video_upload(video_url, 'url')
                if error:
                    return jsonify({'error': f'Video upload failed: {error}'}), 400


        # Get location data from request
        location_id = request.form.get('location_id', None)
        location_name = request.form.get('location_name', None)
        
        # Get YouTube metadata from request
        youtube_title = request.form.get('youtube_title', None)
        youtube_tags = request.form.get('youtube_tags', None)
        youtube_description = request.form.get('youtube_description', None)
        youtube_category = request.form.get('youtube_category', None)  # This is the category ID
        
        # Get TikTok compliance metadata from request
        tiktok_compliance_json = request.form.get('tiktok_compliance', None)
        tiktok_compliance = None
        if tiktok_compliance_json:
            try:
                tiktok_compliance = json.loads(tiktok_compliance_json)
            except json.JSONDecodeError:
                logging.error("Invalid TikTok compliance JSON")
                return jsonify({'error': 'Invalid TikTok compliance format'}), 400
        
        # Log location data if available
        if location_id and location_name:
            logging.info(f"Location data received: {location_id} - {location_name}")
            
        # Log YouTube metadata if available
        if youtube_title or youtube_tags or youtube_description:
            logging.info(f"YouTube metadata received - Title: {youtube_title}, Tags: {youtube_tags}, Category ID: {youtube_category}")

        if schedule_now:
            # Create a simple task record
            task_id = str(uuid.uuid4())
            supabase.table('background_task_post').insert({
                'id': task_id,
                'status': 'pending',
                'created_at': datetime.now().isoformat(),
                'user_id': user_id  # Add user_id to the task record
            }).execute()
            
            # Launch Celery task instead of threading
            # Pass platforms_content if available, otherwise use general_content for all platforms
            content_data = platforms_content if platforms_content else {'general': general_content}
            
            # Prepare YouTube metadata if available
            youtube_meta = None
            if youtube_title or youtube_tags or youtube_description or youtube_category:
                youtube_meta = {
                    'title': youtube_title,
                    'tags': youtube_tags,
                    'description': youtube_description,
                    'category': youtube_category
                }
            
            print(f"=== DISPATCHING CELERY TASK ===")
            print(f"Task ID: {task_id}")
            print(f"Platforms: {platforms_data}")
            print(f"Content: {content_data}")
            
            celery_task = run_in_background_task.delay(
                task_id, platforms_data, content_data, image_urls, video_url, 
                location_id, user_id, file_names, video_file_name, None, youtube_meta, tiktok_compliance
            )
            
            print(f"Celery task dispatched with ID: {celery_task.id}")
            
            # Store the Celery task ID
            supabase.table('background_task_post').update({
                'celery_task_id': celery_task.id,
                'user_id': user_id  # Make sure user_id is included
            }, returning='minimal', count='exact').eq('id', task_id).execute()
            
            # Return immediately with task ID
            return jsonify({
                'message': 'Your post is being processed',
                'task_id': task_id
            }), 202
                
        else:
            # Schedule for future posting - directly save to the database
            results = []
            errors = []
            
            # Process each platform in the request
            for platform_data in platforms_data:
                platform = platform_data.get('platform')
                auth_id = platform_data.get('auth_id')
                page_id = platform_data.get('page_id')
                post_type = platform_data.get('post_type', 'post')
                
                # Get access token based on platform
                token_data = get_platform_token(platform, page_id, auth_id, user_id)
                
                if not token_data:
                    errors.append(f"Could not get access token for platform: {platform}")
                    continue
                    
                # Get content for this specific platform
                platform_content = get_content_for_platform(platform)
                
                # Prepare post data
                post_data = {
                    'user_id': user_id,
                    'content': platform_content,
                    'page_id': page_id,
                    'platform': platform,
                    'post_type': post_type,
                    'status': 'scheduled',
                    'scheduled_time': scheduled_time
                }
                
                # For Instagram and YouTube, store both token and additional data
                if platform == 'instagram':
                    post_data['page_token'] = token_data['access_token']
                    post_data['instagram_type'] = token_data['type']
                    logging.info(f"Scheduling Instagram post with auth type: {token_data['type']}")
                elif platform == 'youtube':
                    post_data['page_token'] = token_data['access_token']
                    post_data['refresh_token'] = token_data['refresh_token']
                    logging.info(f"Scheduling YouTube post with refresh token available")
                elif platform == 'tiktok':
                    post_data['page_token'] = token_data
                    logging.info(f"Scheduling TikTok post with access token")
                else:
                    post_data['page_token'] = token_data
                
                # Add optional fields
                if image_urls:
                    post_data['image_url'] = image_urls
                    
                if video_url:
                    post_data['video_url'] = video_url
                    
                if location_id:
                    post_data['location_id'] = location_id
                    post_data['location_name'] = location_name
                    
                if platform_data.get('share_to_feed', False):
                    post_data['share_to_feed'] = True
                
                # Save to Supabase
                try:
                    db_result = supabase.table('scheduled_posts').insert(post_data).execute()
                    
                    if db_result.data:
                        logging.info(f"Successfully scheduled post to Supabase with ID: {db_result.data[0].get('id')}")
                        results.append({
                            'platform': platform,
                            'post_type': post_type,
                            'result': {
                                'message': 'Post scheduled successfully!',
                                'id': db_result.data[0]['id']
                            }
                        })
                    else:
                        logging.error(f"Failed to schedule post to Supabase: No data returned from insert operation")
                        errors.append(f"Database error scheduling post for {platform}")
                except Exception as db_error:
                    logging.error(f"Error scheduling post to Supabase: {str(db_error)}")
                    errors.append(f"Error scheduling post for {platform}: {str(db_error)}")
            
            # Return response based on results
            if results:
                response = {
                    'message': 'Post scheduled successfully',
                    'scheduled_posts': results
                }
                if errors:
                    response['errors'] = errors
                return jsonify(response), 200 if not errors else 207  # 207 Multi-Status if partial success
            else:
                return jsonify({'error': 'Failed to schedule posts', 'details': errors}), 400

    except Exception as e:
        logging.error(f"Error in create_scheduled_post: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


def check_task(task_id):
    """Check if a task is complete"""
    try:
        user_id = session.get('user_id')
        result = supabase.table('background_task_post').select('*').eq('id', task_id).eq("user_id", user_id).execute()
        if not result.data:
            # Return the data, not the response
            return {'error': 'Task not found'}, 404
            
        task = result.data[0]
        celery_task_id = task.get('celery_task_id')
        
        # If we have a Celery task ID, check its status directly
        if celery_task_id:
            celery_result = run_in_background_task.AsyncResult(celery_task_id)
            
            # If the task is still running but our DB shows something else,
            # update from Celery's status
            if celery_result.state in ('PENDING', 'STARTED') and task.get('status') != 'processing':
                supabase.table('background_task_post').update({
                    'status': 'processing',
                    'user_id': user_id
                }, returning='minimal', count='exact').eq('id', task_id).execute()
                # Invalidate cache after update
                invalidate_cache("task_status", task_id)
                task['status'] = 'processing'
        
        # Process results if they exist
        results = {}
        if task.get('results'):
            try:
                if isinstance(task['results'], str):
                    results = json.loads(task['results'])
                else:
                    results = task['results']
            except:
                results = {'error': 'Could not parse results data'}
        
        # Return data dictionary, not jsonify response
        return {
            'id': task.get('id'),
            'status': task.get('status'),
            'results': results,
            'created_at': task.get('created_at')
        }, 200
    except Exception as e:
        logging.error(f"Error checking task status: {str(e)}")
        return {'error': str(e)}, 500  

@celery_app.task(name='scheduler.scheduler.process_scheduled_posts')
def process_scheduled_posts():
    """Process any scheduled posts that are due for publishing"""
    logging.info("Checking for scheduled posts to publish")
    
    try:
        # Get current time - use timezone-aware approach
        current_time = datetime.now(timezone.utc).isoformat()
        
        # Query Supabase for scheduled posts that are due
        result = supabase.table('scheduled_posts')\
            .select('*')\
            .eq('status', 'scheduled')\
            .lte('scheduled_time', current_time)\
            .limit(20)\
            .execute()
            
        if not result.data:
            logging.info("No scheduled posts to publish")
            return
            
        logging.info(f"Found {len(result.data)} scheduled posts to publish")
        
        # Process each post
        for post in result.data:
            try:
                post_id = post['id']  # Store the post ID to pass to the task
                user_id = post.get('user_id')
                platform = post.get('platform')
                page_id = post.get('page_id')
                content = post.get('content')
                image_urls = post.get('image_url')
                video_url = post.get('video_url')
                location_id = post.get('location_id')
                post_type = post.get('post_type', 'post')
                page_token = post.get('page_token')
                scheduled_time = post.get('scheduled_time') # Get scheduled_time from the post
                # First update status to processing to prevent duplicate processing
                supabase.table('scheduled_posts').update({
                    'status': 'processing'
                }, returning='minimal', count='exact').eq('id', post_id).execute()
                
                # Create platform data object
                platform_data = [{
                    'platform': platform,
                    'page_id': page_id,
                    'post_type': post_type,
                    'share_to_feed': post.get('share_to_feed', False),
                    'scheduled': True,
                    'page_token': page_token
                }]
                
                # Add Instagram type if this is an Instagram post
                if platform == 'instagram':
                    platform_data[0]['instagram_type'] = post.get('instagram_type', 'facebook')
                    logging.info(f"Processing scheduled Instagram post with auth type: {platform_data[0]['instagram_type']}")
                
                # Create a background task record
                task_id = str(uuid.uuid4())
                supabase.table('background_task_post').insert({
                    'id': task_id,
                    'status': 'pending',
                    'created_at': datetime.now().isoformat(),
                    'user_id': user_id
                }).execute()
                
                # Launch Celery task for background processing
                # For scheduled posts, content is already platform-specific from the database
                content_data = {'general': content}  # Wrap in the expected format
                
                celery_task = run_in_background_task.delay(
                    task_id, platform_data, content_data, image_urls, video_url, 
                    location_id, user_id, None, None, post_id, None, None  # Pass the scheduled post ID, no YouTube/TikTok metadata for scheduled posts yet
                )
                
                # Update the background task with Celery task ID
                supabase.table('background_task_post').update({
                    'celery_task_id': celery_task.id,
                    'user_id': user_id
                }, returning='minimal', count='exact').eq('id', task_id).execute()
                
                logging.info(f"Scheduled post {post_id} queued for background processing with task ID {task_id}")
                    
            except Exception as e:
                logging.error(f"Error processing scheduled post {post['id']}: {str(e)}")
                
                # Update post status to failed
                supabase.table('scheduled_posts').update({
                    'status': 'failed',
                    'error_message': str(e)
                }, returning='minimal', count='exact').eq('id', post['id']).execute()
    except Exception as e:
        logging.error(f"Error in process_scheduled_posts: {str(e)}")  