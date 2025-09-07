from flask import request, jsonify, session
from datetime import datetime, timezone, timedelta
import bcrypt
import os
import json
import stripe
from database import get_supabase_client, get_service_role_client
from redis_cache import cache_result, invalidate_cache
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

supabase = get_supabase_client()
supabase_admin = get_service_role_client()


def auth_status():
    """Get authentication status"""
    print(f"Auth status called, session keys: {list(session.keys())}")
    
    if 'user_id' not in session:
        print("No user_id in session")
        return jsonify({'isLoggedIn': False})
    
    try:
        user_id = session.get('user_id')
        print(f"Auth status for user_id: {user_id}")
        
        # Always try to refresh the token if we have a refresh token to get a fresh 30-day token
        if 'refresh_token' in session:
            try:
                print("Refreshing token to get fresh 30-day session...")
                refresh_result = supabase.auth.refresh_session(session['refresh_token'])
                if refresh_result and refresh_result.session:
                    # Update the session with new tokens (these should be valid for 30 days)
                    session['access_token'] = refresh_result.session.access_token
                    session['refresh_token'] = refresh_result.session.refresh_token
                    session.permanent = True  # Make sure session is permanent
                    print("Token refreshed successfully with 30-day validity")
                    
                    # Verify the new token
                    user = supabase.auth.get_user(refresh_result.session.access_token)
                else:
                    print("Token refresh failed - no session returned")
                    session.clear()
                    return jsonify({'isLoggedIn': False})
            except Exception as refresh_error:
                print(f"Token refresh failed: {str(refresh_error)}")
                session.clear()
                return jsonify({'isLoggedIn': False})
        else:
            # No refresh token, try with existing access token
            if 'access_token' not in session:
                print("No access_token in session")
                return jsonify({'isLoggedIn': False})
            
            try:
                user = supabase.auth.get_user(session['access_token'])
            except Exception as e:
                print(f"Access token invalid: {str(e)}")
                session.clear()
                return jsonify({'isLoggedIn': False})
        
        # Get user data including trial info
        user_data = supabase.table('users').select('trial_ends_at, stripe_customer_id, language, trial_expired').eq('id', user_id).execute()
        trial_ends_at = None
        has_subscription = False
        subscription_status = None
        trial_expired = False
        preferred_language = 'en'  # Default to English
        
        if user_data.data:
            trial_ends_at = user_data.data[0].get('trial_ends_at')
            customer_id = user_data.data[0].get('stripe_customer_id')
            preferred_language = user_data.data[0].get('language', 'en')
            trial_expired = user_data.data[0].get('trial_expired', False)
            
            # Check subscription status if customer ID exists
            if customer_id:
                subscriptions = stripe.Subscription.list(
                    customer=customer_id,
                    status='active',
                    limit=1
                )
                has_subscription = len(subscriptions.data) > 0
                if has_subscription:
                    subscription_status = subscriptions.data[0].status
        
        # Build response
        response_data = {
            'isLoggedIn': True,
            'user': {
                'id': user.user.id,
                'email': user.user.email,
                'name': user.user.user_metadata.get('name', ''),
                'language': preferred_language
            },
            'subscription': {
                'trial_ends_at': trial_ends_at,
                'has_subscription': has_subscription,
                'status': subscription_status,
                'trial_expired': trial_expired
            }
            }
            
            # Get Facebook auth with RLS - add user_id filter
        fb_auth = supabase.table('facebook_auth').select('id, user_id, created_at').eq('user_id', user_id).execute()
        if fb_auth.data:
            for i in fb_auth.data:
                fb_pages = supabase.table('facebook_pages').select('id, auth_id, page_id, name, profile_picture, created_at').eq('auth_id', i['id']).execute()
                response_data['facebook'] = {
                    'pages': fb_pages.data,
                }
      
    
        ig_accounts = supabase.table('instagram_accounts').select('id, user_id, account_id, name, type, profile_picture, created_at').eq('user_id', user_id).execute()
        if ig_accounts.data:
            response_data['instagram'] = {
                'accounts': ig_accounts.data,
            }

      
      
        linkedin_accounts = supabase.table('linkedin_accounts').select('id, user_id, account_id, name, picture, created_at').eq('user_id', user_id).execute()
         
        if linkedin_accounts.data:
            response_data['linkedin'] = {
                'accounts': linkedin_accounts.data
            }

        # Get YouTube channels
        youtube_channels = supabase.table('youtube_channels').select('id, user_id, channel_id, title, description, profile_picture, custom_url, created_at').eq('user_id', user_id).execute()
        
        if youtube_channels.data:
            response_data['youtube'] = {
                'channels': youtube_channels.data
            }

        # Get TikTok accounts
        tiktok_accounts = supabase.table('tiktok_accounts').select('id, user_id, tiktok_id, display_name, username, avatar_url, created_at').eq('user_id', user_id).execute()
        
        if tiktok_accounts.data:
            response_data['tiktok'] = {
                'accounts': tiktok_accounts.data
            }
      

        # Get brands - handle the case where the table might not exist
        try:
            brands = supabase.table('brand_profiles').select('*').eq('user_id', user_id).execute()
            if brands.data:
                response_data['brands'] = brands.data
        except Exception as brands_error:
            print(f"Warning: Could not fetch brands: {str(brands_error)}")
            # Continue without brands data
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Auth status error: {str(e)}")
        # Clear session on any error
        session.clear()
        return jsonify({'isLoggedIn': False})


def register():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        plan = data.get('plan', 'free')  # Get plan from request or default to 'free'

        if not name or not email or not password:
            return jsonify({'error': 'Name, email and password required'}), 400

        # Validate plan
        if plan not in ['free', 'creator', 'manager', 'business']:
            plan = 'free'  # Default to free tier if invalid plan

        # Check if email already exists
        existing_user = supabase.table('users').select('id').eq('email', email).execute()
        if existing_user.data:
            return jsonify({'error': 'An account with this email already exists. Please use a different email or try logging in.'}), 400

        # Register with Supabase Auth
        try:
            auth_response = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "name": name  # Store name in user metadata
                    }
                }
            })
        except Exception as auth_error:
            # Check for duplicate email error from Supabase Auth
            error_str = str(auth_error)
            if "already exists" in error_str.lower() or "duplicate" in error_str.lower():
                return jsonify({'error': 'An account with this email already exists. Please use a different email or try logging in.'}), 400
            raise auth_error
            
        user_id = auth_response.user.id
        
        # Set trial end date (10 days from now)
        trial_ends_at = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
        
        # Insert the user into your users table
        try:
            supabase_admin.table('users').insert({
                'id': user_id,  # Use the same ID from Auth
                'email': email,
                'name': name,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'trial_ends_at': trial_ends_at,  # Add trial end date
                'subscription_tier': plan  # Add subscription tier based on plan
            }).execute()
            
            # Initialize token usage for the user
            from usage.token_usage import initialize_new_user
            initialize_new_user(user_id, plan)
            
        except Exception as db_error:
            # Handle database-specific errors
            error_str = str(db_error)
            if "duplicate key" in error_str.lower() or "already exists" in error_str.lower():
                # Try to clean up the auth user since we couldn't create the DB entry
                try:
                    supabase_admin.auth.admin.delete_user(user_id)
                except:
                    pass
                return jsonify({'error': 'An account with this email already exists. Please use a different email or try logging in.'}), 400
            raise db_error
            
        # Store user session in Flask session for compatibility
        session.clear()  # Clear any existing session
        
        # Make the session permanent and long-lasting
        session.permanent = True
        
        session['user_id'] = auth_response.user.id
        session['email'] = email
        session['name'] = name
        session['access_token'] = auth_response.session.access_token
        session['refresh_token'] = auth_response.session.refresh_token
        
        # Invalidate auth cache
        invalidate_cache("user_auth")
        
        return jsonify({
            'success': True,
            'user': {
                'id': auth_response.user.id,
                'email': email,
                'name': name,
                'trial_ends_at': trial_ends_at,
                'plan': plan  # Include plan in response
            }
        })

    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'error': 'An error occurred during registration. Please try again later.'}), 500


def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Login with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        subscription_status = supabase.table('users').select('trial_expired').eq('id', auth_response.user.id).execute()
        trial_expired = subscription_status.data[0].get('trial_expired', False)
        
        # Get user metadata
        user = auth_response.user
        user_metadata = user.user_metadata
        
        # Store in Flask session
        session.clear()  # Clear any existing session
        
        # Make the session permanent and long-lasting
        session.permanent = True
  
        session['user_id'] = user.id
        session['email'] = user.email
        session['name'] = user_metadata.get('name', '')
        session['access_token'] = auth_response.session.access_token
        session['refresh_token'] = auth_response.session.refresh_token
        
        # Debug session setting
        print(f"DEBUG: Session after login: {dict(session)}")
        print(f"DEBUG: User ID set to: {user.id}")
       
        
        # Invalidate auth cache
        invalidate_cache("user_auth")
        
        response = jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user_metadata.get('name', ''),
            },
            'subscription': {
                'trial_expired': trial_expired
            }
        })
        
        return response, 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Invalid email or password'}), 401

def google_sign_in():
    try:
        credential = request.json.get('credential')
        
        if not credential:
            return jsonify({"error": "No token provided"}), 400
            
        # Sign in with Google ID token
        response = supabase.auth.sign_in_with_id_token({
            "provider": "google",
            "token": credential
        })
        
        if not response.user or not response.session:
            return jsonify({"error": "Authentication failed"}), 400
            
        user = response.user
        user_id = user.id
        email = user.email
        name = user.user_metadata.get('name', '')
        
        # Check if user exists in custom users table, create if not
        existing_user = supabase.table('users').select('id').eq('id', user_id).execute()
        if not existing_user.data:
            # Set trial end date (10 days from now)
            from datetime import datetime, timezone, timedelta
            trial_ends_at = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
            
            # Create user in custom table
            supabase_admin.table('users').insert({
                'id': user_id,
                'email': email,
                'name': name,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'trial_ends_at': trial_ends_at,
                'subscription_tier': 'free'
            }).execute()
            
            # Initialize token usage for the user
            from usage.token_usage import initialize_new_user
            initialize_new_user(user_id, 'free')
        
        # Store session data in Flask session (same as login function)
        session.clear()
        session.permanent = True
        session['user_id'] = user_id
        session['email'] = email
        session['name'] = name
        session['access_token'] = response.session.access_token
        session['refresh_token'] = response.session.refresh_token
        
        # Invalidate auth cache
        from redis_cache import invalidate_cache
        invalidate_cache("user_auth")
        
        return jsonify({
            "user": {
                "id": user_id,
                "email": email,
                "name": name
            },
            "success": True
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def logout():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Sign out from Supabase if we have a token
        if 'access_token' in session:
            # Invalidate auth cache
            invalidate_cache("user_auth")
            supabase.auth.sign_out(session['access_token'])
    except:
        pass  # Continue even if Supabase logout fails
    
    # Clear Flask session
    session.clear()
    
    response = jsonify({"success": True, "message": "Logged out successfully"})
    response.set_cookie('threads_session', '', expires=0, secure=True, 
                        httponly=True, samesite='None', 
                        domain='.threads-dev.local')
    response.set_cookie('threads_session_check', '', expires=0, secure=True, 
                        httponly=False, samesite='None', 
                        domain='.threads-dev.local')
    
    return response




def update_profile():
    try:
        data = request.json
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
            
        name = data.get('name')
        if not name or not name.strip():
            return jsonify({'error': 'Name cannot be empty'}), 400
            
        # Update user in database
        result = supabase.table('users').update({
            'name': name,
            
        }).eq('id', user_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Failed to update profile'}), 500
            
        # Update session
        session['name'] = name
        
        # Invalidate auth cache
        invalidate_cache("user_auth")
        
        return jsonify({'success': True, 'message': 'Profile updated successfully'})
        
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        return jsonify({'error': str(e)}), 500


def change_password():
    try:
        data = request.json
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
            
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current and new passwords are required'}), 400
            
            
        # Get user from database
        user_result = supabase.table('users').select('password_hash').eq('id', user_id).execute()
        
        if not user_result.data:
            return jsonify({'error': 'User not found'}), 404
            
        stored_hash = user_result.data[0].get('password_hash')
        
        # For users who signed up with Google, they might not have a password
        if not stored_hash:
            # Set new password for Google users
            password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            result = supabase.table('users').update({
                'password_hash': password_hash,
            }).eq('id', user_id).execute()
            
            # Invalidate auth cache
            invalidate_cache("user_auth")
            
            return jsonify({'success': True, 'message': 'Password set successfully'})
        
        # Verify current password
        if not bcrypt.checkpw(current_password.encode('utf-8'), stored_hash.encode('utf-8')):
            return jsonify({'error': 'Current password is incorrect'}), 401
            
        # Hash new password
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update password in database
        result = supabase.table('users').update({
            'password_hash': password_hash,
           
        }).eq('id', user_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Failed to update password'}), 500
        
        # Invalidate auth cache
        invalidate_cache("user_auth")
            
        return jsonify({'success': True, 'message': 'Password changed successfully'})
        
    except Exception as e:
        print(f"Error changing password: {str(e)}")
        return jsonify({'error': str(e)}), 500


def update_language():
    """Update user's preferred language"""
    try:
        data = request.json
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
            
        language = data.get('language')
        if not language or language not in ['en', 'es']:
            return jsonify({'error': 'Invalid language selection'}), 400
            
        # Update user in database
        result = supabase.table('users').update({
                'language': language,
        }).eq('id', user_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Failed to update language preference'}), 500
            
        # Invalidate auth cache
        invalidate_cache("user_auth")
        
        return jsonify({'success': True, 'message': 'Language preference updated successfully'})
        
    except Exception as e:
        print(f"Error updating language preference: {str(e)}")
        return jsonify({'error': str(e)}), 500 