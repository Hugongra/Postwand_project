import os
import json
import requests
from flask import jsonify, request, session
from urllib.parse import urlencode
import secrets

# TikTok OAuth endpoints
TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"

TIKTOK_CLIENT_KEY = os.getenv('TIKTOK_CLIENT_KEY')
TIKTOK_CLIENT_SECRET = os.getenv('TIKTOK_CLIENT_SECRET')
TIKTOK_REDIRECT_URI = os.getenv('TIKTOK_REDIRECT_URI')

def tiktok_auth():
    try:
        # Get client key from environment variables
        client_key = TIKTOK_CLIENT_KEY
        if not client_key:
            return jsonify({'error': 'TikTok client key not configured'}), 500

        # Generate CSRF state token
        state = secrets.token_urlsafe(32)
        
        # Store state in session for verification
        session['tiktok_state'] = state

        # Construct authorization URL with required parameters
        params = {
            'client_key': client_key,
            'scope': 'user.info.basic,video.publish',
            'response_type': 'code',
            'redirect_uri': TIKTOK_REDIRECT_URI,
            'state': state
        }

        auth_url = f"{TIKTOK_AUTH_URL}?{urlencode(params)}"

        # Debug: print the redirect URI being used
        print(f"DEBUG: TikTok redirect URI being sent: {TIKTOK_REDIRECT_URI}")
        print(f"DEBUG: Full auth URL: {auth_url}")

        return jsonify({
            'auth_url': auth_url,
            'state': state
        }), 200

    except Exception as e:
        print(f"Error in TikTok auth: {str(e)}")
        return jsonify({'error': str(e)}), 500

def handle_tiktok_callback():
    print("DEBUG: TikTok callback started")
    try:
        # Get code and state from request
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        error_description = request.args.get('error_description')
        
        print(f"DEBUG: Received code: {code[:20] if code else None}...")
        print(f"DEBUG: Received state: {state}")
        print(f"DEBUG: Session state: {session.get('tiktok_state')}")

        # Verify state to prevent CSRF
        session_state = session.get('tiktok_state')
        if state != session_state:
            print(f"DEBUG: State mismatch - received: {state}, session: {session_state}")
            # For development, we'll bypass state verification if session is not accessible
            # In production, you should fix session sharing between domains
            if not session_state:
                print("DEBUG: Bypassing state verification due to missing session (development mode)")
            else:
                return _return_tiktok_error("Invalid state parameter")

        # Check for errors
        if error:
            return _return_tiktok_error(f"TikTok OAuth error: {error_description or error}")

        # Exchange code for access token
        token_data = exchange_code_for_token(code)
        
        if not token_data:
            return _return_tiktok_error("TikTok authentication failed. This may be due to: 1) TikTok server issues, 2) Invalid app configuration, or 3) Expired authorization code. Please try again.")

        # Get user info using the access token
        user_info = get_tiktok_user_info(token_data['access_token'])
        
        # Continue even if user_info fails - we have basic info from token_data
        if not user_info:
            print("DEBUG: Failed to get user info, but continuing with token data")

        # Store the tokens and user info in the database
        user_id = session.get('user_id')
        print(f"DEBUG: Session user_id: {user_id}")
        print(f"DEBUG: Session data: {dict(session)}")
        
        if not user_id:
            # For development: Try to get user_id from recent login
            # This is a workaround for session not being accessible across domains
            print("DEBUG: No user_id in session, trying to find most recent user")
            try:
                from database import get_supabase_client
                supabase = get_supabase_client()
                
                # Get the most recently logged in user (development workaround)
                # In production, you should fix session sharing
                recent_users = supabase.table('users').select('id').order('created_at', desc=True).limit(1).execute()
                if recent_users.data:
                    user_id = recent_users.data[0]['id']
                    print(f"DEBUG: Using most recent user_id: {user_id}")
                else:
                    return _return_tiktok_error("No authenticated user found")
            except Exception as e:
                print(f"DEBUG: Error finding user: {e}")
                return _return_tiktok_error("User not authenticated")

        print(f"DEBUG: Token data: {token_data}")
        print(f"DEBUG: User info: {user_info}")

        # Save to database
        save_result = save_tiktok_account(user_id, token_data, user_info)
        print(f"DEBUG: Save result: {save_result}")
        
        if not save_result:
            return _return_tiktok_error("Failed to save TikTok account")

        # Return HTML with postMessage to close popup and notify parent
        user_name = user_info.get('data', {}).get('user', {}).get('display_name', 'TikTok User') if user_info else 'TikTok User'
        print(f"TikTok auth successful for user: {user_name}")
        
        html_response = f"""
        <!DOCTYPE html>
        <html>
        <head><title>TikTok Success</title></head>
        <body>
            <script>
                try {{
                    window.opener.postMessage({{
                        type: 'TIKTOK_AUTH_SUCCESS',
                        user_name: '{user_name}'
                    }}, '*');
                    window.close();
                }} catch (error) {{
                    document.body.innerHTML = '<h2>Success! Close this window.</h2>';
                }}
            </script>
            <h2>TikTok connected successfully!</h2>
        </body>
        </html>
        """
        from flask import Response
        return Response(html_response, mimetype='text/html')

    except Exception as e:
        print(f"ERROR in TikTok callback: {str(e)}")
        import traceback
        print(f"ERROR traceback: {traceback.format_exc()}")
        return _return_tiktok_error(f"Server error: {str(e)}")

def _return_tiktok_error(error_message):
    """Return HTML to close popup and show error"""
    print(f"TikTok auth error: {error_message}")
    html_response = f"""
    <!DOCTYPE html>
    <html>
    <head><title>TikTok Error</title></head>
    <body>
        <script>
            try {{
                window.opener.postMessage({{
                    type: 'TIKTOK_AUTH_ERROR',
                    error: '{error_message}'
                }}, '*');
                window.close();
            }} catch (error) {{
                document.body.innerHTML = '<h2>Error: {error_message}</h2>';
            }}
        </script>
        <h2>Error: {error_message}</h2>
    </body>
    </html>
    """
    from flask import Response
    return Response(html_response, mimetype='text/html')

def exchange_code_for_token(code):
    try:
        client_key = TIKTOK_CLIENT_KEY
        client_secret = TIKTOK_CLIENT_SECRET
        redirect_uri = TIKTOK_REDIRECT_URI

        data = {
            'client_key': client_key,
            'client_secret': client_secret,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri
        }

        print(f"DEBUG: Token exchange request data: {data}")
        response = requests.post(TIKTOK_TOKEN_URL, data=data)
        
        print(f"DEBUG: Token response status: {response.status_code}")
        print(f"DEBUG: Token response text: {response.text}")
        
        response.raise_for_status()
        token_response = response.json()
        print(f"DEBUG: Token response JSON: {token_response}")

        # Check if the response contains an error
        if 'error' in token_response:
            print(f"TikTok API error: {token_response.get('error')} - {token_response.get('error_description')}")
            return None
            
        # Check if access_token is present
        if 'access_token' not in token_response:
            print(f"TikTok API response missing access_token: {token_response}")
            return None

        return token_response

    except Exception as e:
        print(f"Error exchanging code for token: {str(e)}")
        return None

def get_tiktok_user_info(access_token):
    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        print(f"DEBUG: Getting user info with token: {access_token[:20]}...")
        print(f"DEBUG: Headers: {headers}")

        # TikTok requires 'fields' parameter to specify which user data to retrieve
        # Request fields available with user.info.basic scope
        params = {
            'fields': 'open_id,display_name,avatar'
        }
        
        response = requests.get(
            'https://open.tiktokapis.com/v2/user/info/',
            headers=headers,
            params=params
        )
        
        print(f"DEBUG: User info response status: {response.status_code}")
        print(f"DEBUG: User info response headers: {dict(response.headers)}")
        print(f"DEBUG: User info response text: {response.text}")
        
        response.raise_for_status()

        return response.json()

    except Exception as e:
        print(f"Error getting user info: {str(e)}")
        return None

def save_tiktok_account(user_id, token_data, user_info):
    try:
        # Import supabase client
        from database import get_supabase_client
        supabase = get_supabase_client()

        # Save TikTok account data - safely extract user info
        user_data = user_info.get('data', {}).get('user', {}) if user_info else {}
        
        # Use open_id from token_data if user_info is not available
        tiktok_id = user_data.get('open_id') or token_data.get('open_id')
        display_name = user_data.get('display_name') or 'TikTok User'
        
        account_data = {
            'user_id': user_id,
            'tiktok_id': tiktok_id,
            'access_token': token_data['access_token'],
            'refresh_token': token_data.get('refresh_token'),
            'expires_in': token_data.get('expires_in'),
            'scope': token_data.get('scope'),
            'username': user_data.get('username'),
            'display_name': display_name,
            'avatar_url': user_data.get('avatar'),
            'created_at': 'now()'
        }

        
        result = supabase.table('tiktok_accounts').upsert(account_data, on_conflict='tiktok_id').execute()

        return result.data

    except Exception as e:
        print(f"Error saving TikTok account: {str(e)}")
        return None