from flask import request, redirect, session
import stripe
import os
import logging
from database import get_supabase_client, get_service_role_client

supabase = get_supabase_client()

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

PRICE_IDS = {
    'CREATOR': os.getenv('STRIPE_PRICE_ID_CREATOR'),
    'MANAGER': os.getenv('STRIPE_PRICE_ID_MANAGER'),
    'BUSINESS': os.getenv('STRIPE_PRICE_ID_BUSINESS'),
}

DOMAIN = os.getenv('FRONTEND_URL', 'https://localhost:5174')


def create_checkout_session(user_id):
    try:
        plan = request.args.get('plan', 'CREATOR').upper()
        price_id = PRICE_IDS.get(plan)

        if not price_id:
            return {'error': f'Invalid plan: {plan}'}, 400

        supa = get_service_role_client()
        user_response = supa.table('users').select('stripe_customer_id, email').eq('id', user_id).execute()

        customer_id = None
        user_email = None
        if user_response.data:
            customer_id = user_response.data[0].get('stripe_customer_id')
            user_email = user_response.data[0].get('email') or session.get('email')

        if not customer_id:
            customer = stripe.Customer.create(
                email=user_email,
                metadata={'user_id': user_id}
            )
            customer_id = customer.id
            supa.table('users').update({'stripe_customer_id': customer_id}).eq('id', user_id).execute()

        metadata = {'user_id': user_id, 'plan': plan}

        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            line_items=[{'price': price_id, 'quantity': 1}],
            mode='subscription',
            success_url=DOMAIN + '?success=true',
            cancel_url=DOMAIN + '?canceled=true',
            metadata=metadata,
            subscription_data={'metadata': metadata},
        )

        return redirect(checkout_session.url, code=303)

    except Exception as e:
        logging.error(f"[STRIPE] Checkout error: {e}", exc_info=True)
        return {'error': str(e)}, 500


def session_status():
    session_id = request.args.get('session_id')
    try:
        checkout_session = stripe.checkout.Session.retrieve(
            session_id, expand=['customer', 'subscription']
        )
        return {
            'status': checkout_session.status,
            'customer_id': checkout_session.customer.id if checkout_session.customer else None,
            'subscription_id': checkout_session.subscription.id if checkout_session.subscription else None,
        }
    except Exception as e:
        return {'error': str(e)}, 500


def create_customer_portal_session(user_id):
    try:
        supa = get_service_role_client()
        user_response = supa.table('users').select('stripe_customer_id').eq('id', user_id).execute()

        if not user_response.data or not user_response.data[0].get('stripe_customer_id'):
            return {'error': 'No billing account found'}, 404

        customer_id = user_response.data[0]['stripe_customer_id']

        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{DOMAIN}/profile",
        )
        return {'url': portal_session.url}

    except Exception as e:
        logging.error(f"[STRIPE] Portal error: {e}", exc_info=True)
        return {'error': str(e)}, 500


def webhook_received():
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    request_data = request.data
    signature = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload=request_data, sig_header=signature, secret=webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        logging.error("[STRIPE] Webhook signature verification failed")
        return {'error': 'Invalid signature'}, 400
    except Exception as e:
        logging.error(f"[STRIPE] Webhook construct error: {e}")
        return {'error': str(e)}, 400

    supa = get_service_role_client()

    if event['type'] == 'checkout.session.completed':
        obj = event['data']['object']
        metadata = obj.get('metadata', {})
        user_id = metadata.get('user_id')
        subscription_id = obj.get('subscription')

        if user_id and subscription_id:
            supa.table('users').update({
                'subscription_id': subscription_id,
                'subscription_status': 'active',
                'subscription_active': True,
                'plan': metadata.get('plan'),
                'has_access': True,
            }).eq('id', user_id).execute()
            logging.info(f"[STRIPE] User {user_id} subscribed to {metadata.get('plan')}")

    elif event['type'] == 'customer.subscription.updated':
        sub = event['data']['object']
        customer_id = sub.get('customer')
        user_response = supa.table('users').select('id').eq('stripe_customer_id', customer_id).execute()

        if user_response.data:
            user_id = user_response.data[0]['id']
            status = sub.get('status')
            is_active = status in ('active', 'trialing')
            supa.table('users').update({
                'subscription_status': status,
                'subscription_active': is_active,
                'has_access': is_active,
            }).eq('id', user_id).execute()

    elif event['type'] == 'customer.subscription.deleted':
        sub = event['data']['object']
        customer_id = sub.get('customer')
        user_response = supa.table('users').select('id').eq('stripe_customer_id', customer_id).execute()

        if user_response.data:
            user_id = user_response.data[0]['id']
            supa.table('users').update({
                'subscription_status': 'canceled',
                'subscription_active': False,
                'subscription_id': None,
                'has_access': False,
            }).eq('id', user_id).execute()
            logging.info(f"[STRIPE] User {user_id} subscription canceled")

    return {'status': 'success'}
