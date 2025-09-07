from functools import wraps
from flask import session, jsonify
from datetime import datetime, timezone
import stripe
from database import get_supabase_client
from redis_cache import get_cached, set_cached, invalidate_cache

supabase = get_supabase_client()

def invalidate_user_subscription_cache(user_id):
    """
    Invalidate the cached subscription status for a specific user.
    Call this when subscription status changes (e.g., through webhooks).
    """
    cache_key = f"subscription_status:{user_id}"
    try:
        from redis_cache import redis_client
        redis_client.delete(cache_key)
        print(f"Invalidated subscription cache for user {user_id}")
    except Exception as e:
        print(f"Error invalidating subscription cache: {str(e)}")

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or 'access_token' not in session:
            return jsonify({'error': 'Unauthorized', 'expired': True}), 401
            
        # Verify token is still valid with Supabase
        try:
            # This will throw an exception if the token is invalid
            supabase.auth.get_user(session['access_token'])
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Auth error: {str(e)}")
            # Try to refresh the token
            try:
                if 'refresh_token' in session:
                    refresh_response = supabase.auth.refresh_session(session['refresh_token'])
                    if refresh_response and refresh_response.session:
                        # Update both tokens to ensure we have fresh long-lived tokens
                        session['access_token'] = refresh_response.session.access_token
                        session['refresh_token'] = refresh_response.session.refresh_token
                        session.permanent = True  # Ensure session remains permanent
                        print("Tokens refreshed successfully in login_required decorator")
                        return f(*args, **kwargs)
            except Exception as refresh_error:
                print(f"Token refresh failed in decorator: {str(refresh_error)}")
                pass
                
            # If we get here, authentication failed
            session.clear()
            return jsonify({'error': 'Session expired, please login again', 'expired': True}), 401
            
    return decorated_function

def subscription_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # First check if user is logged in
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
            
        user_id = session.get('user_id')
        
        
        
       
        
        # Check cached subscription status first
        cache_key = f"subscription_status:{user_id}"
        cached_status = get_cached(cache_key)
        
        if cached_status:
            # Use cached result
            if cached_status.get('has_access'):
                return f(*args, **kwargs)
            else:
                return jsonify(cached_status.get('error_response', {
                    'error': 'Subscription required',
                    'code': 'subscription_required',
                    'message': 'This feature requires an active subscription'
                })), 403
        
        # Check if user has an active subscription
        try:
            # Get user from database to find Stripe customer ID
            user = supabase.table('users').select('stripe_customer_id, trial_ends_at, trial_expired').eq('id', user_id).execute()
            
            if not user.data:
                error_response = {'error': 'User not found'}
                set_cached(cache_key, {'has_access': False, 'error_response': error_response}, 300)
                return jsonify(error_response), 404
                
            user_data = user.data[0]
            customer_id = user_data.get('stripe_customer_id')
            trial_ends_at = user_data.get('trial_ends_at')
            trial_expired = user_data.get('trial_expired', False)
            
            # Check if trial is explicitly marked as expired
            if trial_expired:
                error_response = {
                    'error': 'Trial expired',
                    'code': 'trial_expired',
                    'message': 'Your trial period has ended. Please subscribe to continue.'
                }
                set_cached(cache_key, {'has_access': False, 'error_response': error_response}, 300)
                return jsonify(error_response), 403
                
            # Check if user is still in trial period
            if trial_ends_at:
                trial_end_date = datetime.fromisoformat(trial_ends_at.replace('Z', '+00:00'))
                if trial_end_date > datetime.now(timezone.utc):
                    # User is in trial period, cache and allow access
                    set_cached(cache_key, {'has_access': True}, 300)  # Cache for 5 minutes
                    return f(*args, **kwargs)
            
            # If no customer ID or trial ended, require subscription
            if not customer_id:
                error_response = {
                    'error': 'Subscription required',
                    'code': 'subscription_required',
                    'message': 'This feature requires an active subscription'
                }
                set_cached(cache_key, {'has_access': False, 'error_response': error_response}, 300)
                return jsonify(error_response), 403
                
            # Check if customer has active subscription (only call Stripe if not cached)
            subscriptions = stripe.Subscription.list(
                customer=customer_id,
                status='active',
                limit=1
            )
            
            if not subscriptions.data:
                error_response = {
                    'error': 'Subscription required',
                    'code': 'subscription_required',
                    'message': 'This feature requires an active subscription'
                }
                set_cached(cache_key, {'has_access': False, 'error_response': error_response}, 300)
                return jsonify(error_response), 403
                
            # User has active subscription, cache and allow access
            set_cached(cache_key, {'has_access': True}, 300)  # Cache for 5 minutes
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"Error checking subscription: {str(e)}")
            # If there's an error, deny access to be safe
            error_response = {
                'error': 'Subscription check failed',
                'message': 'Please try again later'
            }
            # Don't cache errors for too long
            set_cached(cache_key, {'has_access': False, 'error_response': error_response}, 60)
            return jsonify(error_response), 500
            
    return decorated_function 