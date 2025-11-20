from flask import Blueprint, g
from decorators.decorators import login_required
import services.create_text.text_chat as text_chat
create_text_bp = Blueprint('create_text', __name__, url_prefix='/api')

@create_text_bp.route('/chat/send', methods=['POST'])
@login_required
def send_chat_message():
    return text_chat.send_chat_message(g.user_id)

@create_text_bp.route('/chat/history', methods=['GET'])
@login_required
def get_chat_history():
    return text_chat.get_chat_history(g.user_id)

@create_text_bp.route('/chat/clear', methods=['POST'])
@login_required
def clear_chat_history():
    return text_chat.clear_chat_history(g.user_id)

@create_text_bp.route('/chat/action', methods=['POST'])
@login_required
def text_action():
   
    return text_chat.text_action(g.user_id)