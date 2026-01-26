from flask import Blueprint, g
from decorators.decorators import login_required, require_image_quota
import services.edit_images.edit_images as edit_images

edit_image_bp = Blueprint('edit_image', __name__)

@edit_image_bp.route('/edit-image/<model>', methods=['POST'])
@login_required
@require_image_quota
def edit_image(model):
    return edit_images.edit_image(g.user_id, model)

@edit_image_bp.route('/generate-image/<model>', methods=['POST'])
@login_required
@require_image_quota
def generate_image(model):
    return edit_images.generate_image(g.user_id, model)

@edit_image_bp.route('/remove-background', methods=['POST'])
@login_required
@require_image_quota
def remove_background():
    return edit_images.remove_background(g.user_id)



@edit_image_bp.route('/chat-sessions', methods=['GET'])
@login_required
def get_chat_sessions():
    return edit_images.get_chat_sessions(g.user_id)

@edit_image_bp.route('/chat-session/<chat_id>', methods=['GET'])
@login_required
def get_chat_session(chat_id):
    return edit_images.get_chat_session(g.user_id, chat_id)