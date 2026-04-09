import uuid
import logging
import os
import sys
import requests
import io
import base64
from flask import request
from tusclient import client as tus_client

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_service_role_client
from utils.image_utils import save_image_supabase

SUPABASE_BUCKET = "post-videos"
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
supabase_admin = get_service_role_client()

def handle_image_upload(user_id, image_file):
 
    try:
        
        result = save_image_supabase('post-images', user_id, image_file)
        
        if result['success']: return result['image_url']
       
    except Exception as e:
        logging.error(f"[HANDLE_IMAGE_UPLOAD] ✗ EXCEPTION: {str(e)}", exc_info=True)
        return None

def handle_video_upload(user_id):
    try:
        file_stream = None
        file_ext = None
        
        if 'video' in request.files:
            video = request.files['video']
            
            video.seek(0, os.SEEK_END)
            file_size = video.tell()
            video.seek(0)
            
            if file_size > 52428800:
                logging.warning(f"[HANDLE_VIDEO_UPLOAD] Video too large (> 50MB), rejecting")
                return None

            file_ext = video.filename.rsplit('.', 1)[1].lower()
            file_stream = video
            
        elif 'video' in request.form:
            video_url = request.form['video']
            
            if 'supabase.co/storage' in video_url:
                return video_url

            response = requests.get(video_url, stream=True)
            response.raise_for_status()
            
            content_length = response.headers.get('content-length')
            if content_length:
                if int(content_length) > 52428800:
                    logging.warning(f"[HANDLE_VIDEO_UPLOAD] Remote video too large (> 50MB), rejecting")
                    return None

            file_ext = 'mp4'
            if '.' in video_url.split('?')[0]:
                file_ext = video_url.split('?')[0].rsplit('.', 1)[1].lower()

            file_stream = io.BytesIO()
            for chunk in response.iter_content(chunk_size=1024*1024):
                file_stream.write(chunk)
            file_stream.seek(0)
        else:  return None

        filename = f"{uuid.uuid4()}.{file_ext}"
        bucket_path = f"{user_id}/{filename}"
        
        tus_upload_url = f"{SUPABASE_URL}/storage/v1/upload/resumable"
        
        tus_upload_client = tus_client.TusClient(
            tus_upload_url,
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}", 
                "x-upsert": "true"
            }
        )
        
        uploader = tus_upload_client.uploader(
            file_stream=file_stream,
            chunk_size=(10 * 1024 * 1024),
            metadata={
                "bucketName": SUPABASE_BUCKET,
                "objectName": bucket_path,
                "contentType": f"video/{file_ext}",
                "cacheControl": "3600",
            },
        )
        
        uploader.upload()

        video_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{bucket_path}"
        return video_url

    except Exception as e:
        logging.error(f"[HANDLE_VIDEO_UPLOAD] ✗ EXCEPTION: {str(e)}", exc_info=True)
        return None