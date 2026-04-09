import os
from flask import request, session
from datetime import datetime, timezone, timedelta
from postgrest.exceptions import APIError as PostgrestAPIError
from gotrue.errors import AuthError
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_auth_requests

from database import get_supabase_client, get_service_role_client

from utils.token_usage import initialize_new_user

# Must match the Web client ID in Google Cloud and Supabase Auth → Google provider.
GOOGLE_WEB_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "571535075302-87ga0u6mdta81cvbif83cul5834sg8fv.apps.googleusercontent.com",
).strip()

supabase = get_supabase_client()
supabase_admin = get_service_role_client()


def get_user_data(user_id):
    user_data = supabase.table('users').select('language, trial_ends_at, trial_expired, subscription_active').eq('id', user_id).execute()
    if not user_data.data:
        return None, None, None, None
    user_data = user_data.data[0]
    language = user_data.get('language', None)
    trial_ends_at = user_data.get('trial_ends_at', None)
    trial_expired = user_data.get('trial_expired', False)
    subscription_active = user_data.get('subscription_active', False)
    return language, trial_ends_at, trial_expired, subscription_active


def _is_unique_violation(err: PostgrestAPIError) -> bool:
    code = str(err.code or "")
    msg = ((err.message or "") + (err.details or "")).lower()
    return code == "23505" or "duplicate key" in msg or "unique constraint" in msg


def _get_user_data_admin(user_id):
    """Same as get_user_data but uses service role (safe after sign_in_with_id_token on shared client)."""
    user_data = (
        supabase_admin.table('users')
        .select('language, trial_ends_at, trial_expired, subscription_active')
        .eq('id', user_id)
        .execute()
    )
    if not user_data.data:
        return None, None, None, None
    row = user_data.data[0]
    return (
        row.get('language'),
        row.get('trial_ends_at'),
        row.get('trial_expired', False),
        row.get('subscription_active', False),
    )

def register():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        plan = data.get('plan', 'free')  

        existing_user = supabase.table('users').select('id').eq('email', email).execute()
        if existing_user.data:
            return {'error': 'An account with this email already exists.'}, 400

        try:
            auth_response = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "name": name 
                    }
                }
            })
        except Exception as auth_error:
            error_str = str(auth_error)
            if "already exists" in error_str.lower() or "duplicate" in error_str.lower():
                return {'error': 'An account with this email already exists.'}, 400
            raise auth_error
            
        user_id = auth_response.user.id
        trial_ends_at = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
        
        try:
            supabase_admin.table('users').insert({
                'id': user_id,  
                'email': email,
                'name': name,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'trial_ends_at': trial_ends_at,  
                'subscription_tier': plan  
            }).execute()
            
            initialize_new_user(user_id, plan)
            
        except Exception as db_error:
            print(f"Database error: {str(db_error)}")
            return {'error': 'An error occurred during registration. Please try again later.'}, 500

        sess = getattr(auth_response, 'session', None)
        session.clear()
        session.permanent = True
        session['user_id'] = auth_response.user.id
        session['email'] = email
        session['name'] = name
        if sess:
            session['access_token'] = sess.access_token
            session['refresh_token'] = getattr(sess, 'refresh_token', None) or ''

        # New users have access (trial just started)
        has_access = True

        payload = {
            'success': True,
            'user': {
                'id': auth_response.user.id,
                'email': email,
                'name': name,
                'trial_ends_at': trial_ends_at,
                'has_access': has_access,
                'plan': plan,
                'language': None,
            },
        }
        if sess:
            payload['access_token'] = sess.access_token
            rt = getattr(sess, 'refresh_token', None)
            if rt:
                payload['refresh_token'] = rt
        return payload

    except Exception as e:
        print(f"Registration error: {str(e)}")
        return {'error': 'An error occurred during registration. Please try again later.'}, 500


def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        language, trial_ends_at, trial_expired, subscription_active = get_user_data(auth_response.user.id)
        
        user = auth_response.user
        user_metadata = user.user_metadata
        
        session.clear()  
        session.permanent = True
  
        session['user_id'] = user.id
        session['email'] = user.email
        session['name'] = user_metadata.get('name', '')
        session['access_token'] = auth_response.session.access_token
        session['refresh_token'] = auth_response.session.refresh_token
        
        # User has access if trial not expired OR subscription is active
        has_access = (not trial_expired) or subscription_active
        
        response = {
            'access_token': auth_response.session.access_token,
            'refresh_token': getattr(auth_response.session, 'refresh_token', None),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user_metadata.get('name', ''),
                'language': language,
                'trial_ends_at': trial_ends_at,
                'has_access': has_access,
            },
        }
        rt = response.get('refresh_token')
        if not rt:
            response.pop('refresh_token', None)

        return response, 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return {'error': 'Invalid credentials'}, 401

def google_sign_in():
    print("=== GOOGLE SIGN IN REQUEST ===")
    
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        if not request.is_json or request.json is None:
            return {"error": "Invalid request body"}, 400
        credential = request.json.get('credential')
        print(f"Credential received: {bool(credential)}")
        
        if not credential:
            print("ERROR: No credential provided")
            return {"error": "No token provided"}, 400

        # Opcional: verificación local del JWT. Por defecto OFF: Supabase ya valida el token;
        # si GOOGLE_CLIENT_ID en .env no coincide exactamente con el del front, esta
        # comprobación falla aunque el login sea válido. Activa con GOOGLE_VERIFY_ID_TOKEN=1
        if os.getenv("GOOGLE_VERIFY_ID_TOKEN", "").lower() in ("1", "true", "yes") and GOOGLE_WEB_CLIENT_ID:
            try:
                google_id_token.verify_oauth2_token(
                    credential,
                    google_auth_requests.Request(),
                    GOOGLE_WEB_CLIENT_ID,
                    clock_skew_in_seconds=30,
                )
            except ValueError as verr:
                print(f"Google JWT verification failed: {verr}")
                return {
                    "error": (
                        "El token de Google no es válido para este sitio o el Client ID "
                        "del backend (GOOGLE_CLIENT_ID) no coincide con el del frontend/Supabase."
                    )
                }, 400

        response = supabase.auth.sign_in_with_id_token({
            "provider": "google",
            "token": credential
        })
        print(f"Supabase response: user={bool(response.user)}, session={bool(response.session)}")
        
        if not response.user or not response.session:
            return {"error": "Authentication failed"}, 400
            
        user = response.user
        user_id = user.id
        email = user.email
        name = user.user_metadata.get('name', '')
        
        # Use service role so this check is reliable regardless of RLS / JWT timing on
        # public.users. Otherwise every returning Google user can look "new" and hit
        # a duplicate insert, which surfaces as auth failure.
        existing_user = supabase_admin.table('users').select('id').eq('id', user_id).execute()
        is_new_user = not existing_user.data
        
        if is_new_user:
            trial_ends_at = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
            try:
                now_iso = datetime.now(timezone.utc).isoformat()
                supabase_admin.table('users').upsert(
                    {
                        'id': user_id,
                        'email': email,
                        'name': name,
                        'full_name': name,
                        'created_at': now_iso,
                        'trial_ends_at': trial_ends_at,
                        'subscription_tier': 'free',
                    },
                    on_conflict='id',
                ).execute()
                initialize_new_user(user_id, 'free')
            except PostgrestAPIError as dup_e:
                if _is_unique_violation(dup_e):
                    is_new_user = False
                else:
                    raise
        
       
        session.clear()
        session.permanent = True
        session['user_id'] = user_id
        session['email'] = email
        session['name'] = name
        session['access_token'] = response.session.access_token
        session['refresh_token'] = response.session.refresh_token
        
        language, trial_ends_at, trial_expired, subscription_active = _get_user_data_admin(user_id)
        
        # User has access if trial not expired OR subscription is active
        has_access = (not trial_expired) or subscription_active

        out = {
            "access_token": response.session.access_token,
            "user": {
                "id": user_id,
                "email": email,
                "name": name,
                "language": language,
                "trial_ends_at": trial_ends_at,
                "has_access": has_access,
            },
            "is_new_user": is_new_user,
            "success": True,
        }
        grt = getattr(response.session, "refresh_token", None)
        if grt:
            out["refresh_token"] = grt
        return out
        
    except AuthError as e:
        status = getattr(e, "status", None)
        if not isinstance(status, int):
            status = 400
        print(f"Supabase Auth error: {e.message} status={status}")
        if status >= 500:
            return {"error": e.message}, 502
        return {"error": e.message}, 400
    except PostgrestAPIError as e:
        print(f"PostgREST error: {e.message} code={e.code}")
        return {"error": e.message or "Database error during sign-in"}, 400
    except Exception as e:
        print(f"Google Sign-In Error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        error_message = str(e)
        if "Invalid token" in error_message or "JWT" in error_message:
            return {"error": "Invalid Google token. Please try signing in again."}, 400
        elif "Network" in error_message or "Connection" in error_message:
            return {"error": "Network error. Please check your connection and try again."}, 500
        return {"error": "Authentication failed. Please try again."}, 500

def logout():
    if request.method == 'OPTIONS':
        return '', 204

    session.clear()

    from flask import make_response
    resp = make_response({'success': True}, 200)
    for name in ('threads_session', 'threads_session_check'):
        resp.set_cookie(
            name, '', expires=0,
            secure=True, httponly=True, samesite='None',
        )
    return resp


def update_profile():
    try:
        user_id = session.get('user_id')
        name = request.json.get('name')
        
        result = supabase.table('users').update({'name': name}).eq('id', user_id).execute()
        if not result.data: return {'error': 'Failed to update profile'}, 500
            
        session['name'] = name
        
        language, trial_ends_at, trial_expired, subscription_active = get_user_data(user_id)
        
        # User has access if trial not expired OR subscription is active
        has_access = (not trial_expired) or subscription_active
        
        return {
            'success': True,
            'user': {
                'id': user_id, 
                'email': session.get('email'), 
                'name': name, 
                'language': language,
                'trial_ends_at': trial_ends_at,
                'has_access': has_access
            }
        }, 200
        
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        return {'error': str(e)}, 500


def reset_password(data):

    try:
        supabase.auth.reset_password_for_email(
        data['email'], {"redirect_to": "http://localhost:5173/reset-password"})
        return True
    except Exception as e:
        print(f"Error resetting password: {str(e)}")
        return False
    
def update_password(data):  
  
    auth_header = request.headers.get('Authorization')  
    access_token = auth_header.split(' ')[1]
    response = supabase.auth.get_user(access_token)
            
    if not response.user: return False
    user_id = response.user.id

    try:
        result = supabase_admin.auth.admin.update_user_by_id(
            user_id, {"password": data['new_password']}
        )
        return result.user
    except Exception as e:
        print(f"Error updating password: {str(e)}")
        return False
             

def update_language():
    try:
        data = request.json
        user_id = session.get('user_id')
        language = data.get('language')

        result = supabase.table('users').update({
                'language': language,
        }).eq('id', user_id).execute()
            
        if not result.data: return {'error': 'Failed to update profile'}, 500
        return {'success': True}, 200
        
    except Exception as e:
        print(f"Error updating language preference: {str(e)}")
        return  {'error': str(e)}, 500 