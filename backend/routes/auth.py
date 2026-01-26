from flask import Blueprint
import services.auth.auth as auth

import services.auth.email_verification as email_verification       
from decorators.decorators import login_required

from utils.token_usage import get_user_token_usage

# Create blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    return auth.register()

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    return auth.login()

@auth_bp.route('/auth/logout', methods=['POST', 'OPTIONS'])
def logout():
    return auth.logout()

@auth_bp.route('/auth/google-sign-in', methods=['POST', 'OPTIONS'])
def google_sign_in():
    return auth.google_sign_in()

@auth_bp.route('/send-verification-code', methods=['POST'])
def send_verification_code():
    return email_verification.send_verification_code()

@auth_bp.route('/verify-code', methods=['POST'])
def verify_code():
    return email_verification.verify_code()

@auth_bp.route('/user/update-profile', methods=['POST'])
@login_required
def update_profile():
    return auth.update_profile()

@auth_bp.route('/user/change-password', methods=['POST'])
@login_required
def change_password():
    return auth.change_password()

@auth_bp.route('/user/update-language', methods=['POST'])
@login_required
def update_language():
    return auth.update_language()


@auth_bp.route('/usage/tokens', methods=['GET'])
@login_required
def get_token_usage():
    return get_user_token_usage()
 

