from flask import Blueprint,  g

import services.integrations.platforms.facebook as facebook
import services.integrations.platforms.instagram as instagram        
import services.integrations.platforms.youtube as youtube

import services.integrations.platforms.threads as threads
import services.integrations.platforms.linkedin as linkedin
import services.integrations.platforms.tiktok as tiktok
import services.integrations.get_accounts as get_accounts
from decorators.decorators import login_required

integrations_auth_bp = Blueprint('integrations_auth', __name__)

@integrations_auth_bp.route('/auth/facebook', methods=['POST'])
@login_required
def facebook_auth():
    return facebook.facebook_auth(g.user_id)

@integrations_auth_bp.route('/auth/instagram', methods=['POST'])
@login_required
def instagram_auth():
    return instagram.instagram_auth(g.user_id)

@integrations_auth_bp.route('/auth/youtube', methods=['POST', 'GET'])
@login_required
def youtube_auth():
    return youtube.youtube_auth()

@integrations_auth_bp.route('/auth/threads', methods=['GET', 'POST'])
@login_required
def exchange_threads_code():
    return threads.threads_auth(g.user_id)

@integrations_auth_bp.route('/auth/linkedin', methods=['GET', 'POST'])
@login_required
def linkedin_auth_endpoint():
    return linkedin.linkedin_auth(g.user_id)

@integrations_auth_bp.route('/auth/tiktok', methods=['GET', 'POST'])
@login_required
def tiktok_auth():
    return tiktok.tiktok_auth(g.user_id)

@integrations_auth_bp.route('/auth/tiktok/callback', methods=['GET'])
def tiktok_callback():
    return tiktok.handle_tiktok_callback(g.user_id)


@integrations_auth_bp.route('/social-accounts', methods=['GET'])
@login_required
def get_accounts_endpoint():
    return get_accounts.get_accounts(g.user_id)

@integrations_auth_bp.route('/auth/disconnect/<platform>/<account_id>', methods=['DELETE'])
@login_required
def disconnect_account(platform, account_id):
    return get_accounts.disconnect_account(g.user_id, platform, account_id)




