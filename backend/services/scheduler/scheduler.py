
import json
import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import request

from .tasks_util import create_task, update_task, get_task
from .media_uploads import handle_image_upload, handle_video_upload
from .process_posts import run_in_background_task
from celery_config import celery_app
from .supabase_service import supabase_service as supabase

def scheduled_post(user_id):
    try:
        # Handle both JSON (API) and FormData (frontend with file uploads)
        if request.is_json:
            # API call with JSON body
            postData = request.get_json()

            print(postData)
            # Extract media URLs from media array
            media = postData.get("media", [])
            image_urls = [m.get("url") for m in media if m.get("type") == "image" and m.get("url")]
            video_url = next((m.get("url") for m in media if m.get("type") == "video" and m.get("url")), None)
        else:
            # FormData with file uploads (frontend)
            postData = json.loads(request.form.get("postData", "{}"))
            print("FormData postData:", postData)
            
            # Handle uploaded files
            images = request.files.getlist("images")
            image_urls = [handle_image_upload(user_id, img) for img in images if img]
            image_urls = [url for url in image_urls if url]  # Filter out None values
            
            # Also check for URLs from library in media array
            media = postData.get("media", [])
            library_image_urls = [m.get("url") for m in media if m.get("type") == "image" and m.get("url")]
            image_urls.extend(library_image_urls)  # Combine uploaded + library images
            
            video_url = handle_video_upload(user_id)

        if postData.get("scheduleNow"):
            task_id = create_task(user_id)
            celery_task = run_in_background_task.delay(
                task_id, user_id, postData, image_urls, video_url
            )
            update_task(task_id, user_id, celery_task_id=celery_task.id)
            return {"message": "Post is being processed", "task_id": task_id}

        # Loop through platforms that have accountId set
        for platform, platform_data in postData.get("platforms", {}).items():
            account_id = platform_data.get("accountId", "")
            
            # Skip platforms without accountId
            if not account_id:
                continue
            
            post_type = platform_data.get("postType", "post")
            
            # Use platform-specific content if available, otherwise use general content
            content = platform_data.get("specificContent") or postData.get("content", "")

            supabase.table("scheduled_posts").insert({
                "user_id": user_id,
                "platform": platform,
                "account_id": account_id,
                "post_type": post_type,
                "status": "scheduled",
                "scheduled_time": postData.get("scheduledTime", ""),
                "image_url": image_urls,
                "video_url": video_url,
                "content": content,
                "platform_data": json.dumps(platform_data),
            }).execute()

        return {"message": "Post scheduled successfully"}

    except Exception as e:
        logging.error(f"[CREATE_SCHEDULED_POST] Error: {e}", exc_info=True)
        return {"error": str(e)}, 500


def check_task(user_id, task_id):
    try:
        task = get_task(task_id, user_id)

        if not task: return {"error": "Task not found"}, 404

        celery_task_id = task.get("celery_task_id")
        results = {}

        if celery_task_id:
            celery_result = celery_app.AsyncResult(celery_task_id)
            celery_state = celery_result.state

            if celery_state in ("PENDING", "STARTED") and task.get("status") != "processing":
                update_task(task_id, user_id, status="processing")
                task["status"] = "processing"

        if task.get("results"):
            try:
                results = json.loads(task["results"]) if isinstance(task["results"], str) else task["results"]
            except Exception:
                results = {"error": "Could not parse results data"}

        return {
            "id": task.get("id"),
            "status": task.get("status"),
            "results": results,
            "created_at": task.get("created_at"),
        }, 200

    except Exception as e:
        logging.error(f"[CHECK_TASK] Error checking task {task_id}: {e}", exc_info=True)
        return {"error": str(e)}, 500



def get_upload_status(user_id, task_id):
    
    # Query task status
    task = supabase.table('upload_tasks').select('*').eq('task_id', task_id).eq('user_id', user_id).execute()
    
    if not task: return {"error": "Task not found"}, 404
    
    task_data = task.data[0]
    
    result = None
    if task_data.get('result'):
        try: result = json.loads(task_data['result'])
        except: result = task_data['result']
    
    return {
        'task_id': task_data['task_id'],
        'platform': task_data['platform'],
        'post_type': task_data['post_type'],
        'status': task_data['status'],
        'created_at': task_data['created_at'],
        'completed_at': task_data.get('completed_at'),
        'result': result
    }

def get_scheduled_posts(user_id):
    try:
        result = supabase.table('scheduled_posts')\
            .select('*')\
            .eq('user_id', user_id)\
            .in_('status', ['scheduled', 'published'])\
            .execute()
        
        return {"posts": result.data}, 200
    except Exception as e:
        print(f"Error fetching posts: {str(e)}")
        return {'error': str(e)}, 400
    

def reschedule_post(user_id, post_id):
    try:
        data = request.json
        new_scheduled_time = data.get('new_scheduled_time')

        result = supabase.table('scheduled_posts')\
            .update({'scheduled_time': new_scheduled_time}, returning='minimal', count='exact')\
            .eq('id', post_id)\
            .in_('status', 'scheduled')\
            .eq('user_id', user_id)\
            .execute()
        
        if result.count == 0: return {"error": "Post not found"}, 404
        
        return {"message": "Post rescheduled successfully"}, 200  

    except Exception as e:
        return {'error': str(e)}, 400


def delete_post(user_id, post_id):
    try:

        result = supabase.table('scheduled_posts')\
            .delete(returning='minimal', count='exact')\
            .eq('id', post_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if result.count == 0: return {"error": "Post not found"}, 404
        
        return {"message": "Post deleted successfully"}, 200
    
    except Exception as e:
        return {'error': str(e)}, 400


