from flask import Blueprint, g


from decorators.decorators import login_required
from services.scheduler.platforms.tiktok import get_creator_info_for_ui
import services.scheduler.scheduler as scheduler
scheduler_bp = Blueprint('scheduler', __name__, url_prefix='/api')

@scheduler_bp.route('/schedule', methods=['POST'])
@login_required
def schedule_endpoint():
    return scheduler.scheduled_post(g.user_id)
        
@scheduler_bp.route('/upload-status/<task_id>', methods=['GET'])
@login_required
def get_upload_status(task_id):
    return scheduler.get_upload_status(g.user_id, task_id)
    
@scheduler_bp.route('/task/<task_id>', methods=['GET'])
@login_required
def check_task_status(task_id):
    return scheduler.check_task(g.user_id, task_id)

@scheduler_bp.route('/posts', methods=['GET'])
@login_required
def get_scheduled_posts():
    return scheduler.get_scheduled_posts(g.user_id)
    
@scheduler_bp.route('/reschedule-post/<post_id>', methods=['POST'])
@login_required
def reschedule_post(post_id):
    return scheduler.reschedule_post(g.user_id, post_id)

@scheduler_bp.route('/delete-post/<post_id>', methods=['POST'])
@login_required
def delete_post(post_id):
    return scheduler.delete_post(g.user_id, post_id)

@scheduler_bp.route('/tiktok/creator-info', methods=['POST'])
@login_required
def get_tiktok_creator_info():
    return get_creator_info_for_ui(g.user_id)