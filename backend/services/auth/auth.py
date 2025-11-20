from flask import request, session
from datetime import datetime, timezone, timedelta
from database import get_supabase_client, get_service_role_client

from utils.token_usage import initialize_new_user

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
            
        session.clear()  
        
        session.permanent = True
        
        session['user_id'] = auth_response.user.id
        session['email'] = email
        session['name'] = name
        session['access_token'] = auth_response.session.access_token
        session['refresh_token'] = auth_response.session.refresh_token
        
        # New users have access (trial just started)
        has_access = True
                
        return {
            'success': True,
            'user': {
                'id': auth_response.user.id,
                'email': email,
                'name': name,
                'trial_ends_at': trial_ends_at,
                'has_access': has_access,
                'plan': plan,
                'language': None
            }
        }

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
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user_metadata.get('name', ''),
                'language': language,
                'trial_ends_at': trial_ends_at,
                'has_access': has_access
            }
        }
        
        return response, 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return  401

def google_sign_in():
    print("=== GOOGLE SIGN IN REQUEST ===")
    
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        credential = request.json.get('credential')
        print(f"Credential received: {bool(credential)}")
        
        if not credential:
            print("ERROR: No credential provided")
            return {"error": "No token provided"}, 400

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
        
        # Check if this is a new user
        existing_user = supabase.table('users').select('id').eq('id', user_id).execute()
        is_new_user = not existing_user.data
        
        if is_new_user:
            trial_ends_at = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
            
            supabase_admin.table('users').insert({
                'id': user_id,
                'email': email,
                'name': name,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'trial_ends_at': trial_ends_at,
                'subscription_tier': 'free'
            }).execute()
            
            initialize_new_user(user_id, 'free')
        
       
        session.clear()
        session.permanent = True
        session['user_id'] = user_id
        session['email'] = email
        session['name'] = name
        session['access_token'] = response.session.access_token
        session['refresh_token'] = response.session.refresh_token
        
        language, trial_ends_at, trial_expired, subscription_active = get_user_data(user_id)
        
        # User has access if trial not expired OR subscription is active
        has_access = (not trial_expired) or subscription_active
        
        return {    
            "user": {
                "id": user_id,
                "email": email,
                "name": name,
                "language": language,
                "trial_ends_at": trial_ends_at,
                "has_access": has_access
            },
            "is_new_user": is_new_user,
            "success": True
        }
        
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
        else:
            return {"error": "Authentication failed. Please try again."}, 500

def logout():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        get_user_id = session.get('access_token')
        if get_user_id:
            supabase.auth.sign_out(session['access_token'])
    except:
        pass  
    
    session.clear()
    response = 200
    response.set_cookie('threads_session', '', expires=0, secure=True, 
                        only=True, samesite='None', 
                        domain='.threads-dev.local')
    response.set_cookie('threads_session_check', '', expires=0, secure=True, 
                        httponly=False, samesite='None', 
                        domain='.threads-dev.local')
    
    return response


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