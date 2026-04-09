import json
import uuid
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .supabase_service import supabase_service as supabase

def create_task(user_id, status="pending"):
    task_id = str(uuid.uuid4())
    supabase.table("background_task_post").insert({
        "id": task_id,
        "user_id": user_id,
        "status": status,
    }).execute()
    return task_id

def update_task(task_id, user_id, **fields):
    supabase.table("background_task_post")\
        .update({**fields, "user_id": user_id})\
        .eq("id", task_id)\
        .execute()

def get_task(task_id, user_id):
    res = supabase.table("background_task_post")\
        .select("*")\
        .eq("id", task_id)\
        .eq("user_id", user_id)\
        .execute()
    return res.data[0] if res.data else None

def set_task_result(task_id, user_id, results, status="completed"):
    update_task(task_id, user_id,
        status=status,
        results=json.dumps(results)
    )
