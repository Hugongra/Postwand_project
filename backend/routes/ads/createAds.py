from flask import Blueprint, g
from decorators.decorators import login_required, require_image_quota
from services.ads.createAds import generate_ad, generate_copy_service, create_ad_with_copy_service, generate_auto_ad_service

create_ads_bp = Blueprint('create_ads', __name__, url_prefix='/api')

@create_ads_bp.route('/ads/create_ad', methods=['POST'])
@login_required
@require_image_quota
def create_ad_route():
    return generate_ad(g.user_id)

@create_ads_bp.route('/ads/generate-copy', methods=['POST'])
@login_required
def generate_copy_route():
    return generate_copy_service(g.user_id)

@create_ads_bp.route('/ads/create-ad-with-copy', methods=['POST'])
@login_required
@require_image_quota
def create_ad_with_copy_route():
    return create_ad_with_copy_service(g.user_id)

@create_ads_bp.route('/ads/auto-generate', methods=['POST'])
@login_required
def auto_generate_ad_route():
    return generate_auto_ad_service(g.user_id)