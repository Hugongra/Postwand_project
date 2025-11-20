import logging
import sys
import os
import json
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from celery_config import celery_app
from .tasks_util import create_task, update_task, set_task_result
from .execute_post import execute_post

from database import get_supabase_client
supabase = get_supabase_client()

@celery_app.task(bind=True, name="scheduler.scheduler.run_in_background_task")
def run_in_background_task(self, task_id, user_id, postData, image_urls, video_url):
    try:
        update_task(task_id, user_id, status="processing")

        results = []
        # Loop through platforms that have accountId
        for platform, platform_data in postData.get("platforms", {}).items():
            if platform_data.get("accountId"):
                res = execute_post(user_id, platform, postData, image_urls, video_url)
                results.append(res)

        overall_status = "completed" if all(r["success"] for r in results) else "failed"
        set_task_result(task_id, user_id, results, status=overall_status)

        return {"task_id": task_id, "results": results, "status": overall_status}

    except Exception as e:
        logging.error(f"[CELERY_TASK] Critical error: {e}", exc_info=True)
        set_task_result(task_id, user_id, {"error": str(e)}, status="failed")
        raise


@celery_app.task(name="scheduler.scheduler.process_scheduled_posts")
def process_scheduled_posts():
    try:
        current_time = datetime.now(timezone.utc).isoformat()
        result = (
            supabase.table("scheduled_posts")
            .select("*")
            .eq("status", "scheduled")
            .lte("scheduled_time", current_time)
            .limit(20)
            .execute()
        )

        if not result.data:
            return

        for post in result.data:
            try:
                post_id = post["id"]
                user_id = post.get("user_id")
                platform = post.get("platform")
                image_urls = post.get("image_url")
                video_url = post.get("video_url")

                # Reconstruct platform_data from stored data or create from post
                platform_data_str = post.get("platform_data", "{}")
                platform_data = json.loads(platform_data_str) if isinstance(platform_data_str, str) else platform_data_str
                
                postData = {
                    "platforms": {
                        platform: {
                            "postType": post.get("post_type", "post"),
                            "accountId": post.get("account_id", ""),
                            "specificContent": post.get("content", ""),
                            **platform_data
                        }
                    },
                    "content": post.get("content", ""),
                }

                update_task_status = {"status": "processing"}
                supabase.table("scheduled_posts").update(update_task_status).eq("id", post_id).execute()

                task_id = create_task(user_id)
                celery_task = run_in_background_task.delay(
                    task_id, user_id, postData, image_urls, video_url
                )
                update_task(task_id, user_id, celery_task_id=celery_task.id)

            except Exception as e:
                logging.error(f"[PROCESS_SCHEDULED] Error posting {post.get('id')}: {e}", exc_info=True)
                supabase.table("scheduled_posts").update({
                    "status": "failed",
                    "error_message": str(e)
                }).eq("id", post["id"]).execute()

    except Exception as e:
        logging.error(f"[PROCESS_SCHEDULED] Fatal error: {e}", exc_info=True)