from flask import request, jsonify, session
import stripe
import os
import json
from datetime import datetime, timezone
from redis_cache import cache_result, invalidate_cache, get_cached, set_cached
from database import get_supabase_client, get_service_role_client

supabase = get_supabase_client()
supabase_admin = get_service_role_client()

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
stripe.api_version = '2025-03-31.basil'

def get_subscription_status():
    user_id = session.get('user_id')
    cache_key = f"user_subscription_status:{user_id}"
    
    # Try to get from cache
    cached_data = get_cached(cache_key)
    if cached_data:
        return jsonify(cached_data), 200
    
    try:
        # Get user from database to find Stripe customer ID and trial info
        user_result = supabase.table('users') \
                              .select('stripe_customer_id, trial_ends_at') \
                              .eq('id', user_id) \
                              .execute()
        print(f"data={user_result.data} count={user_result.count}")
        
        if not user_result.data:
            response_data = {
                'has_subscription': False,
                'message': 'User not found',
                'trial_info': {'trial_ends_at': None}
            }
            set_cached(cache_key, response_data, 300)  # Cache for 5 minutes
            return jsonify(response_data), 200
            
        user_data = user_result.data[0]
        customer_id = user_data.get('stripe_customer_id')
        
        if not customer_id:
            response_data = {
                'has_subscription': False,
                'message': 'No subscription found',
                'trial_info': {'trial_ends_at': user_data.get('trial_ends_at')}
            }
            set_cached(cache_key, response_data, 300)
            return jsonify(response_data), 200
        
        # Retrieve subscriptions for the customer using Stripe's list API
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status='all',
            limit=1
        )
        
        print("Subscriptions:", subscriptions)
        
        if not subscriptions.data or len(subscriptions.data) == 0:
            response_data = {
                'has_subscription': False,
                'message': 'No active subscription found',
                'trial_info': {'trial_ends_at': user_data.get('trial_ends_at')}
            }
            set_cached(cache_key, response_data, 300)
            return jsonify(response_data), 200

        # Get the first subscription from the list
        subscription = subscriptions.data[0]
        
        # Access the subscription items using dictionary access
        items = subscription.get('items', {}).get('data', [])
        
        if not items or len(items) == 0:
            response_data = {
                'has_subscription': False,
                'message': 'Subscription has no items',
                'trial_info': {'trial_ends_at': user_data.get('trial_ends_at')}
            }
            set_cached(cache_key, response_data, 300)
            return jsonify(response_data), 200
        
        # Get the first subscription item
        item = items[0]
        
        # Retrieve additional product details for the plan
        product = stripe.Product.retrieve(item['price']['product'])
        
        # Format the response with subscription details,
        # using .get() to safely access keys that might not exist.
        response_data = {
            'has_subscription': True,
            'subscription': {
                'id': subscription.get('id'),
                'status': subscription.get('status'),
                'current_period_end': subscription.get('current_period_end'),  # May be None if not present
                'cancel_at_period_end': subscription.get('cancel_at_period_end'),
                'plan': {
                    'id': item['price']['id'],
                    'name': product.get('name'),
                    'amount': item['price']['unit_amount'] / 100,  # converting cents to dollars
                    'currency': item['price']['currency'],
                    'interval': item['price']['recurring']['interval']
                }
            },
            'trial_info': {
                'trial_ends_at': user_data.get('trial_ends_at')
            }
        }
        
        set_cached(cache_key, response_data, 300)
        return jsonify(response_data), 200
        
    except Exception as e:
        import traceback
        print(f"Error getting subscription status: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'has_subscription': False,
            'error': str(e),
            'message': 'Error retrieving subscription information'
        }), 200

def get_payment_methods():
    user_id = session.get('user_id')
    cache_key = f"user_payment_methods:{user_id}"
    
    # Try to get from cache
    cached_data = get_cached(cache_key)
    if cached_data:
        return jsonify(cached_data), 200
    
    try:
        # Get user from database to find Stripe customer ID
        user = supabase.table('users').select('stripe_customer_id').eq('id', user_id).execute()
        
        if not user.data or not user.data[0].get('stripe_customer_id'):
            return jsonify({'payment_methods': []}), 200
            
        customer_id = user.data[0]['stripe_customer_id']
        
        # Get payment methods from Stripe
        payment_methods = stripe.PaymentMethod.list(
            customer=customer_id,
            type='card'
        )
        
        # Format the payment methods for the frontend
        formatted_methods = []
        for method in payment_methods.data:
            formatted_methods.append({
                'id': method.id,
                'brand': method.card.brand,
                'last4': method.card.last4,
                'exp_month': method.card.exp_month,
                'exp_year': method.card.exp_year,
                'is_default': method.id == customer_id.default_source if hasattr(customer_id, 'default_source') else False
            })
            
        response_data = {'payment_methods': formatted_methods}
        set_cached(cache_key, response_data, 300)  # Cache for 5 minutes
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Error getting payment methods: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_billing_history():
    user_id = session.get('user_id')
    cache_key = f"user_billing_history:{user_id}"
    
    # Try to get from cache
    cached_data = get_cached(cache_key)
    if cached_data:
        return jsonify(cached_data), 200
    
    try:
        # Get user from database to find Stripe customer ID
        user = supabase.table('users').select('stripe_customer_id').eq('id', user_id).execute()
        
        if not user.data or not user.data[0].get('stripe_customer_id'):
            return jsonify({'invoices': []}), 200
            
        customer_id = user.data[0]['stripe_customer_id']
        
        # Get invoices from Stripe
        invoices = stripe.Invoice.list(
            customer=customer_id,
            limit=10
        )
        
        # Format the invoices for the frontend
        formatted_invoices = []
        for invoice in invoices.data:
            formatted_invoices.append({
                'id': invoice.id,
                'amount_paid': invoice.amount_paid / 100,
                'currency': invoice.currency,
                'status': invoice.status,
                'created': invoice.created,
                'invoice_pdf': invoice.invoice_pdf,
                'hosted_invoice_url': invoice.hosted_invoice_url
            })
            
        response_data = {'invoices': formatted_invoices}
        set_cached(cache_key, response_data, 300)  # Cache for 5 minutes
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Error getting billing history: {str(e)}")
        return jsonify({'error': str(e)}), 500

def cancel_subscription():
    try:
        user_id = session.get('user_id')
        
        # Get user from database to find Stripe customer ID
        user = supabase.table('users').select('stripe_customer_id').eq('id', user_id).execute()
        
        if not user.data or not user.data[0].get('stripe_customer_id'):
            return jsonify({'error': 'No subscription found'}), 404
            
        customer_id = user.data[0]['stripe_customer_id']
        
        # Get active subscriptions
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status='active'
        )
        
        if not subscriptions.data:
            return jsonify({'error': 'No active subscription found'}), 404
            
        # Cancel at period end
        subscription = stripe.Subscription.modify(
            subscriptions.data[0].id,
            cancel_at_period_end=True
        )
        
        # Invalidate subscription cache
        invalidate_cache(f"user_subscription_status:{user_id}")
        
        # Also invalidate the subscription_required decorator cache
        from decorators.decorators import invalidate_user_subscription_cache
        invalidate_user_subscription_cache(user_id)
        
        return jsonify({
            'message': 'Subscription will be canceled at the end of the billing period',
            'subscription': {
                'id': subscription.id,
                'current_period_end': subscription.current_period_end,
                'cancel_at_period_end': subscription.cancel_at_period_end
            }
        }), 200
        
    except Exception as e:
        print(f"Error canceling subscription: {str(e)}")
        return jsonify({'error': str(e)}), 500

def reactivate_subscription():
    try:
        user_id = session.get('user_id')
        
        # Get user from database to find Stripe customer ID
        user = supabase.table('users').select('stripe_customer_id').eq('id', user_id).execute()
        
        if not user.data or not user.data[0].get('stripe_customer_id'):
            return jsonify({'error': 'No subscription found'}), 404
            
        customer_id = user.data[0]['stripe_customer_id']
        
        # Get canceled subscriptions that haven't ended yet
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status='active'
        )
        
        if not subscriptions.data:
            return jsonify({'error': 'No subscription found to reactivate'}), 404
            
        subscription = subscriptions.data[0]
        
        if not subscription.cancel_at_period_end:
            return jsonify({'error': 'Subscription is not scheduled for cancellation'}), 400
            
        # Reactivate by setting cancel_at_period_end to False
        updated_subscription = stripe.Subscription.modify(
            subscription.id,
            cancel_at_period_end=False
        )
        
        # Invalidate subscription cache
        invalidate_cache(f"user_subscription_status:{user_id}")
        
        # Also invalidate the subscription_required decorator cache
        from decorators.decorators import invalidate_user_subscription_cache
        invalidate_user_subscription_cache(user_id)
        
        return jsonify({
            'message': 'Subscription reactivated successfully',
            'subscription': {
                'id': updated_subscription.id,
                'current_period_end': updated_subscription.current_period_end,
                'cancel_at_period_end': updated_subscription.cancel_at_period_end
            }
        }), 200
        
    except Exception as e:
        print(f"Error reactivating subscription: {str(e)}")
        return jsonify({'error': str(e)}), 500

def update_payment_method():
    try:
        data = request.json
        setup_intent_id = data.get('setup_intent_id')
        
        if not setup_intent_id:
            return jsonify({'error': 'Setup intent ID is required'}), 400
            
        user_id = session.get('user_id')
        
        # Get user from database to find Stripe customer ID
        user = supabase.table('users').select('stripe_customer_id').eq('id', user_id).execute()
        
        if not user.data or not user.data[0].get('stripe_customer_id'):
            return jsonify({'error': 'Customer not found'}), 404
            
        customer_id = user.data[0]['stripe_customer_id']
        
        # Get setup intent to find the payment method
        setup_intent = stripe.SetupIntent.retrieve(setup_intent_id)
        payment_method_id = setup_intent.payment_method
        
        # Attach payment method to customer
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id
        )
        
        # Set as default payment method
        stripe.Customer.modify(
            customer_id,
            invoice_settings={
                'default_payment_method': payment_method_id
            }
        )
        
        # Update subscriptions to use this payment method
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status='active'
        )
        
        for subscription in subscriptions.data:
            stripe.Subscription.modify(
                subscription.id,
                default_payment_method=payment_method_id
            )
        
        # Invalidate relevant caches
        invalidate_cache(f"user_payment_methods:{user_id}")
        
        return jsonify({
            'message': 'Payment method updated successfully',
            'payment_method_id': payment_method_id
        }), 200
        
    except Exception as e:
        print(f"Error updating payment method: {str(e)}")
        return jsonify({'error': str(e)}), 500

def create_setup_intent():
    try:
        user_id = session.get('user_id')
        
        # Get or create Stripe customer ID
        user = supabase.table('users').select('stripe_customer_id, email').eq('id', user_id).execute()
        
        if not user.data:
            return jsonify({'error': 'User not found'}), 404
            
        user_data = user.data[0]
        customer_id = user_data.get('stripe_customer_id')
        
        # If user doesn't have a Stripe customer ID, create one
        if not customer_id:
            customer = stripe.Customer.create(
                email=user_data.get('email'),
                metadata={'user_id': user_id}
            )
            customer_id = customer.id
            
            # Save Stripe customer ID to user record
            supabase.table('users').update({
                'stripe_customer_id': customer_id
            }, returning='minimal', count='exact').eq('id', user_id).execute()
        
        # Create a SetupIntent to securely collect payment details
        setup_intent = stripe.SetupIntent.create(
            customer=customer_id,
            payment_method_types=['card'],
            usage='off_session'
        )
        
        return jsonify({
            'client_secret': setup_intent.client_secret
        }), 200
        
    except Exception as e:
        print(f"Error creating setup intent: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_trial_status():
    try:
        user_id = session.get('user_id')
        
        # Get user data including trial info
        user_data = supabase.table('users').select('trial_ends_at, created_at').eq('id', user_id).execute()
        
        if not user_data.data:
            return jsonify({'error': 'User not found'}), 404
            
        trial_ends_at = user_data.data[0].get('trial_ends_at')
        created_at = user_data.data[0].get('created_at')
        
        # Calculate trial status
        now = datetime.now(timezone.utc)
        trial_active = False
        days_left = 0
        
        if trial_ends_at:
            trial_end_date = datetime.fromisoformat(trial_ends_at.replace('Z', '+00:00'))
            trial_active = trial_end_date > now
            
            if trial_active:
                days_left = (trial_end_date - now).days
        
        return jsonify({
            'trial_active': trial_active,
            'days_left': days_left,
            'trial_ends_at': trial_ends_at,
            'account_created_at': created_at
        }), 200
        
    except Exception as e:
        print(f"Error getting trial status: {str(e)}")
        return jsonify({'error': str(e)}), 500

def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400
        
    # Log the event (optional but helpful for debugging)
    try:
        # Replace the deprecated to_dict() method
        customer_id = event.data.object.get('customer')
        
        supabase.table('stripe_events').insert({
            'stripe_event_id': event.id,
            'event_type': event.type,
            'customer_id': customer_id,
            'data': json.dumps(event),
            'created_at': datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        print(f"Error logging Stripe event: {str(e)}")
    
    # Handle subscription events
    if event['type'] in ['customer.subscription.created', 'customer.subscription.updated']:
        subscription = event['data']['object']
        customer_id = subscription.get('customer')
        
        if customer_id:
            # Update user subscription status
            is_active = subscription['status'] == 'active'
            supabase.table('users').update({
                'subscription_active': is_active
            }, returning='minimal', count='exact').eq('stripe_customer_id', customer_id).execute()
            
            # Invalidate subscription cache for this user
            user_result = supabase.table('users').select('id').eq('stripe_customer_id', customer_id).execute()
            if user_result.data:
                user_id = user_result.data[0]['id']
                from decorators.decorators import invalidate_user_subscription_cache
                invalidate_user_subscription_cache(user_id)
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        customer_id = subscription.get('customer')
        
        if customer_id:
            # Mark subscription as inactive
            supabase.table('users').update({
                'subscription_active': False
            }, count='exact').eq('stripe_customer_id', customer_id).execute()
            
            # Invalidate subscription cache for this user
            user_result = supabase.table('users').select('id').eq('stripe_customer_id', customer_id).execute()
            if user_result.data:
                user_id = user_result.data[0]['id']
                from decorators.decorators import invalidate_user_subscription_cache
                invalidate_user_subscription_cache(user_id)
    
    return jsonify({'status': 'success'})

def create_checkout_session():
    try:
        user_id = session.get('user_id')
        user_email = session.get('email', 'customer@example.com')
        
        # Get or create Stripe customer ID
        user = supabase.table('users').select('stripe_customer_id, email').eq('id', user_id).execute()
        
        if not user.data:
            return jsonify({'error': 'User not found'}), 404
            
        user_data = user.data[0]
        customer_id = user_data.get('stripe_customer_id')
        
        # If user doesn't have a Stripe customer ID, create one
        if not customer_id:
            customer = stripe.Customer.create(
                email=user_email,
                metadata={'user_id': user_id}
            )
            customer_id = customer.id
            
            # Save Stripe customer ID to user record
            supabase.table('users').update({
                'stripe_customer_id': customer_id
            }, returning='minimal', count='exact').eq('id', user_id).execute()
        
        # Create checkout session with the customer ID
        checkout_session = stripe.checkout.Session.create(
            ui_mode='custom',
            customer=customer_id,  # Use customer ID instead of email
            billing_address_collection='auto',
            
            line_items=[
                {
                    # Replace with your actual product price ID
                    'price': os.getenv('STRIPE_PRICE_ID'),
                    'quantity': 1,
                },
            ],
            mode='subscription',
            return_url=f"https://threads-dev.local:5173/checkout/return?session_id={{CHECKOUT_SESSION_ID}}",
            #automatic_tax={'enabled': True},
        )
        
        return jsonify(clientSecret=checkout_session.client_secret)
    except Exception as e:
        print(f"Stripe error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_session_status():
    try:
        session_id = request.args.get('session_id')
        if not session_id:
            return jsonify({'error': 'Missing session_id parameter'}), 400
            
        # Retrieve checkout session from Stripe
        checkout_session = stripe.checkout.Session.retrieve(session_id)
        
        return jsonify({
            'status': checkout_session.status,
            'customer_email': checkout_session.customer_details.email if hasattr(checkout_session, 'customer_details') else None
        })
    except Exception as e:
        print(f"Stripe session status error: {str(e)}")
        return jsonify({'error': str(e)}), 500 