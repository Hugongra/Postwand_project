from flask import Blueprint, request, redirect, session, g
import stripe
import os
from database import get_supabase_client
supabase = get_supabase_client()

stripe_checkout_bp = Blueprint('stripe_checkout', __name__, url_prefix='/api')

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

PRICE_IDS = {
    'CREATOR': {
        'monthly': os.getenv('STRIPE_PRICE_ID_CREATOR_MONTHLY'),
        '3_months': os.getenv('STRIPE_PRICE_ID_CREATOR_3MONTHS')
    },
    'MANAGER': {
        'monthly': os.getenv('STRIPE_PRICE_ID_MANAGER_MONTHLY'),
        '3_months': os.getenv('STRIPE_PRICE_ID_MANAGER_3MONTHS')
    },
    'BUSINESS': {
        'monthly': os.getenv('STRIPE_PRICE_ID_BUSINESS_MONTHLY'),
        '3_months': os.getenv('STRIPE_PRICE_ID_BUSINESS_3MONTHS')
    }
}

DOMAIN = os.getenv('FRONTEND_URL', 'https://localhost:5174')


def create_checkout_session(user_id):
    try:
   
        user_email = session.get('email')
        plan = request.args.get('plan')
        interval = request.args.get('interval', 'monthly')

        price_id = PRICE_IDS[plan][interval]
        user_response = supabase.table('users').select('stripe_customer_id').eq('id', user_id).execute()
        
        customer_id = None
        if user_response.data and user_response.data[0].get('stripe_customer_id'):
            customer_id = user_response.data[0]['stripe_customer_id']
        else:
            customer = stripe.Customer.create(
                email=user_email,
                metadata={'user_id': user_id}
            )
            customer_id = customer.id
            supabase.table('users').update({'stripe_customer_id': customer_id}).eq('id', user_id).execute()

        metadata = {
            'user_id': user_id,
            'plan': plan,
            'interval': interval
        }
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            line_items=[{'price': price_id, 'quantity': 1}],
            mode='subscription',
            success_url=DOMAIN + '?success=true',
            cancel_url=DOMAIN + '?canceled=true',
            automatic_tax={'enabled': True},
            metadata=metadata,
            billing_address_collection='required',
            customer_update={'address': 'auto'},
            subscription_data={'metadata': metadata}
        )
        
        return redirect(checkout_session.url, code=303)
        
    except Exception as e:
        return str(e)


def session_status():
    session_id = request.args.get('session_id')
    
    try:
        checkout_session = stripe.checkout.Session.retrieve(
            session_id,
            expand=['customer', 'subscription']
        )
        
        return {
            'status': checkout_session.status,
            'customer_id': checkout_session.customer.id if checkout_session.customer else None,
            'subscription_id': checkout_session.subscription.id if checkout_session.subscription else None,
            'customer_email': checkout_session.customer_details.email if checkout_session.customer_details else None
        }
    except Exception as e:
        return {'error': str(e)}, 500


def create_customer_portal_session(user_id):
    try:
      
        user_email = session.get('email')
     
        user_response = supabase.table('users').select('stripe_customer_id').eq('id', user_id).execute()
        customer_id = user_response.data[0]['stripe_customer_id']

        if not customer_id:
            return {'error': 'No billing account found for this user'}, 404
            
        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{DOMAIN}/profile",
        )
        
        return {'url': portal_session.url}
        
    except Exception as e:
        print(f"Error creating customer portal session: {str(e)}")
        return {'error': str(e)}, 500

def webhook_received():
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    request_data = request.data
    signature = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload=request_data,
            sig_header=signature,
            secret=webhook_secret
        )
        
        if event['type'] == 'checkout.session.completed':
            session_obj = event['data']['object']
            
            customer_id = session_obj.get('customer')
            subscription_id = session_obj.get('subscription')
            metadata = session_obj.get('metadata', {})
            user_id = metadata.get('user_id')
            
            if user_id and subscription_id:
                supabase.table('users').update({
                    'subscription_id': subscription_id,
                    'subscription_status': 'active',
                    'subscription_active': True,
                    'plan': metadata.get('plan'),
                    'subscription_interval': metadata.get('interval')
                }).eq('id', user_id).execute()
        
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            customer_id = subscription.get('customer')
            
            user_response = supabase.table('users').select('id').eq('stripe_customer_id', customer_id).execute()
            
            if user_response.data:
                user_id = user_response.data[0]['id']
                status = subscription.get('status')
                supabase.table('users').update({
                    'subscription_status': status,
                    'subscription_active': (status == 'active'),
                    'current_period_end': subscription.get('current_period_end')
                }).eq('id', user_id).execute()
        
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            customer_id = subscription.get('customer')
            
            user_response = supabase.table('users').select('id').eq('stripe_customer_id', customer_id).execute()
            
            if user_response.data:
                user_id = user_response.data[0]['id']
                supabase.table('users').update({
                    'subscription_status': 'canceled',
                    'subscription_active': False,
                    'subscription_id': None
                }).eq('id', user_id).execute()
        
        return {'status': 'success'}
        
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return {'error': str(e)}, 400
