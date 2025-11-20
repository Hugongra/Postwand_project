from flask import Blueprint, g
from utils.token_usage import get_user_token_usage
from decorators.decorators import login_required

usage_bp = Blueprint('usage', __name__, url_prefix='/api')

@usage_bp.route('/usage/tokens', methods=['GET'])
@login_required
def get_token_usage():
    return get_user_token_usage(g.user_id)



