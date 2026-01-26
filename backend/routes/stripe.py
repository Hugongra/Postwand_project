from flask import Blueprint, g
import services.stripe as stripe_service

stripe_bp = Blueprint('stripe', __name__)

@stripe_bp.route('/create-checkout-session', methods=['GET', 'POST'])
def create_checkout_session():
    return stripe_service.create_checkout_session(g.user_id)

@stripe_bp.route('/session-status', methods=['GET'])
def session_status():
    return stripe_service.session_status()

@stripe_bp.route('/create-portal-session', methods=['POST'])
def create_customer_portal_session():
    return stripe_service.create_customer_portal_session(g.user_id)

@stripe_bp.route('/webhook', methods=['POST'])
def webhook_received():
    return stripe_service.webhook_received()