import os
from functools import wraps
from flask import request, session, g
from database import get_supabase_client
from utils.token_usage import check_token_limit
from gotrue.errors import AuthApiError, AuthSessionMissingError, AuthRetryableError

# Cliente con ANON key únicamente — auth.get_user(access_token) no debe usar service_role.
supabase = get_supabase_client()

_DEBUG_AUTH = os.getenv("DEBUG_AUTH", "").lower() in ("1", "true", "yes")


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Bearer: front (Vite proxy) a menudo no envía la cookie de sesión Flask; el token va en el header.
        auth_header = request.headers.get("Authorization") or ""
        if _DEBUG_AUTH:
            if auth_header.startswith("Bearer "):
                tok = auth_header[7:].strip()
                print(
                    f"DEBUG: Auth Header: Bearer <len={len(tok)}> path={request.path}"
                )
            else:
                print(f"DEBUG: Auth Header: {auth_header!r} path={request.path}")

        if auth_header.startswith('Bearer '):
            bearer = auth_header[7:].strip()
            if bearer:
                try:
                    user_response = supabase.auth.get_user(bearer)
                    u = getattr(user_response, 'user', None)
                    if u is not None and getattr(u, 'id', None):
                        g.user_id = u.id
                        g.supabase_access_token = bearer
                        if not _has_access(u.id):
                            return {
                                'error': 'Subscription required',
                                'code': 'subscription_required',
                                'message': 'Your trial has ended. Please subscribe to continue.',
                            }, 403
                        return f(*args, **kwargs)
                except AuthRetryableError:
                    return {
                        'error': 'Authentication service temporarily unavailable',
                        'code': 'auth_service_error',
                    }, 503
                except (AuthSessionMissingError, AuthApiError) as e:
                    if _DEBUG_AUTH:
                        print(f"DEBUG: Bearer get_user AuthApiError/Session: {e!r}")
                    pass
                except Exception as e:
                    if _DEBUG_AUTH:
                        print(
                            f"DEBUG: Bearer get_user unexpected: {type(e).__name__}: {e!r}"
                        )
                    pass

        user_id = session.get('user_id')
        access_token = session.get('access_token')
        refresh_token = session.get('refresh_token')
        
        if not user_id or not access_token:
            return {'error': 'Unauthorized', 'code': 'session_expired'}, 401

        # Check authentication
        try:
            user_response = supabase.auth.get_user(access_token)
            if hasattr(user_response, 'user') and user_response.user:
                g.user_id = user_id
        except Exception:
            # Try to refresh token
            try:
                if not refresh_token:
                    session.clear()
                    return {'error': 'Unauthorized', 'code': 'session_expired'}, 401

                response = supabase.auth.set_session(access_token, refresh_token)
                if hasattr(response, 'session') and response.session:
                    session['access_token'] = response.session.access_token
                    session['refresh_token'] = response.session.refresh_token
                    session['user_id'] = user_id
                    session.permanent = True
                    g.user_id = user_id
            except AuthRetryableError:
                # Network/temporary errors - don't clear session
                return {'error': 'Authentication service temporarily unavailable', 'code': 'auth_service_error'}, 503
            except (AuthSessionMissingError, AuthApiError):
                # Invalid/expired refresh token - clear session
                session.clear()
                return {'error': 'Unauthorized', 'code': 'session_expired'}, 401
            except Exception:
                # Unknown error - clear session to be safe
                session.clear()
                return {'error': 'Unauthorized', 'code': 'session_expired'}, 401

        g.supabase_access_token = session.get('access_token')

        # Check subscription status once at the end
        if not _has_access(user_id):
            return {
                'error': 'Subscription required',
                'code': 'subscription_required',
                'message': 'Your trial has ended. Please subscribe to continue.'
            }, 403
        
        return f(*args, **kwargs)

    return decorated_function


def _has_access(user_id):
    """Check if user has access — temporarily grant access to everyone."""
    return True
    # --- Original logic (re-enable when trial/subscription is ready) ---
    # try:
    #     user = supabase.table('users').select('trial_expired, subscription_active').eq('id', user_id).execute()
    #     if not user.data:
    #         return False
    #     user_data = user.data[0]
    #     trial_expired = user_data.get('trial_expired', False)
    #     subscription_active = user_data.get('subscription_active', False)
    #     return (not trial_expired) or subscription_active
    # except Exception as e:
    #     print(f"Error checking access: {str(e)}")
    #     return True






def require_image_quota(func):
    @wraps(func)
    def wrapper( *args, **kwargs):
        user_id = getattr(g, 'user_id', None) or session.get('user_id')
        if check_token_limit(user_id, 'image'):
            return {
                'success': False,
                'error': 'Monthly image generation limit exceeded. Please upgrade your plan.'
            }, 403
        return func(*args, **kwargs)
    return wrapper
