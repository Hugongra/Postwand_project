from flask import request

from datetime import datetime, timezone
import requests
import os

from database import get_supabase_client
from utils.image_utils import image_to_data_uri

supabase = get_supabase_client()

THREADS_APP_ID = os.getenv('THREADS_APP_ID')
THREADS_APP_SECRET = os.getenv('THREADS_APP_SECRET')
THREADS_REDIRECT_URI = os.getenv('THREADS_REDIRECT_URI')

def get_threads_long_lived_token(short_lived_token):
    """Exchange a short-lived token for a long-lived token for Threads"""
    url = "https://graph.threads.net/access_token"
    params = {
        "grant_type": "th_exchange_token",
        "client_secret": THREADS_APP_SECRET,
        "access_token": short_lived_token
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if "access_token" not in data:
        raise Exception(f"Failed to get long-lived token: {data.get('error', {}).get('message', 'Unknown error')}")
    
    return data["access_token"]



def exchange_threads_code(user_id):
    try:
       
        # Para solicitudes GET (redirección de OAuth)
        if request.method == 'GET':
            code = request.args.get('code')
            state = request.args.get('state')
        # Para solicitudes POST
        else:
            data = request.json
            code = data.get('code')
            state = data.get('state')

        if not code:
            return {'error': 'No authorization code provided'}, 400

       
        # Exchange code for token
        token_response = requests.post(
            'https://graph.threads.net/oauth/access_token',
            data={
                'client_id': THREADS_APP_ID,
                'client_secret': THREADS_APP_SECRET,
                'grant_type': 'authorization_code',
                'redirect_uri': THREADS_REDIRECT_URI,
                'code': code
            }
        )

        token_data = token_response.json()
        
        if 'error' in token_data or not token_response.ok:
            error_message = token_data.get('error_message', 'Unknown error')
            print(f"Threads token exchange error: {error_message}")
            return {'error': f"Failed to exchange code: {error_message}"}, 400

        print("Token data received:", token_data)  # Log token data
        short_lived_token = token_data.get('access_token')
        threads_user_id = token_data.get('user_id')
        
        print(f"Short-lived access token: {short_lived_token[:10]}... (truncated)")  # Log partial token
        print(f"Threads user ID: {threads_user_id}")
        
        # Exchange short-lived token for long-lived token
        try:
            print("Exchanging short-lived token for long-lived token...")
            access_token = get_threads_long_lived_token(short_lived_token)
            print(f"Long-lived access token: {access_token[:10]}... (truncated)")
        except Exception as e:
            print(f"Error getting long-lived token: {str(e)}")
            # Fall back to short-lived token if exchange fails
            print("Falling back to short-lived token")
            access_token = short_lived_token

        # Store token in database
        auth_data = {
            'user_id': user_id,
            'access_token': access_token,
            'created_at': datetime.now(timezone.utc).isoformat()
        }

        # Verificar auth existente
        print(f"Checking existing auth for user_id: {user_id}")
        existing_auth = supabase.table('threads_auth').select('*').eq('user_id', user_id).execute()
        print("Existing auth result:", existing_auth.data)

        if existing_auth.data:
            print("Updating existing auth")
            auth_result = supabase.table('threads_auth').update({
                'access_token': access_token
            }).eq('user_id', user_id).execute()
            auth_id = existing_auth.data[0]['id']
        else:
            print("Creating new auth with data:", auth_data)
            auth_result = supabase.table('threads_auth').insert(auth_data).execute()
            auth_id = auth_result.data[0]['id']
        
        print(f"Auth ID: {auth_id}")

        # Get profile data
        try:
            print("\nFetching Threads profile...")
            profile_response = requests.get(
                'https://graph.threads.net/v1.0/me',
                params={
                    'access_token': access_token,
                    'fields': 'id,username,name,threads_profile_picture_url,threads_biography'
                }
            )
            
            print(f"Profile API Response Status: {profile_response.status_code}")
            print(f"Profile API Response Headers: {dict(profile_response.headers)}")
            print(f"Profile API Response Body: {profile_response.text}")
            
            if profile_response.ok:
                profile_data = profile_response.json()
                print("\nProfile data retrieved:", profile_data)
                
                # Check if account already exists instead of deleting
                if existing_auth.data:
                    print(f"\nChecking for existing account with account_id: {profile_data.get('id')}")
                    existing_account = supabase.table('threads_accounts').select('*').eq('auth_id', auth_id).eq('account_id', profile_data.get('id')).execute()
                    
                    if existing_account.data:
                        print(f"Account already exists, updating if needed")
                        # Optionally update account details if they've changed
                        profile_pic = None
                        if profile_data.get('threads_profile_picture_url'):
                            try:
                                profile_pic = image_to_data_uri(profile_data.get('threads_profile_picture_url'))
                            except Exception:
                                profile_pic = None
                        
                        account_update = {
                            'name': profile_data.get('username', 'Threads User'),
                            'profile_picture': profile_pic
                        }
                        update_result = supabase.table('threads_accounts').update(account_update).eq('auth_id', auth_id).eq('account_id', profile_data.get('id')).execute()
                        print("Update result:", update_result.data)
                    else:
                        # Insert only this new account
                        print("Account doesn't exist, inserting new account")
                        profile_pic = None
                        if profile_data.get('threads_profile_picture_url'):
                            try:
                                profile_pic = image_to_data_uri(profile_data.get('threads_profile_picture_url'))
                            except Exception:
                                profile_pic = None
                        
                        account_data = {
                            'auth_id': auth_id,
                            'account_id': profile_data.get('id'),
                            'name': profile_data.get('username', 'Threads User'),
                            'profile_picture': profile_pic,
                            'created_at': datetime.now(timezone.utc).isoformat()
                        }
                        
                        print("\nInserting account data:", account_data)
                        try:
                            account_result = supabase.table('threads_accounts').insert(account_data).execute()
                            print("Account insert result:", account_result.data)
                        except Exception as insert_error:
                            print(f"Error inserting account: {str(insert_error)}")
                            import traceback
                            print(traceback.format_exc())
                else:
                    # No existing auth, insert new account
                    print("No existing auth, inserting new account")
                    profile_pic = None
                    if profile_data.get('threads_profile_picture_url'):
                        try:
                            profile_pic = image_to_data_uri(profile_data.get('threads_profile_picture_url'))
                        except Exception:
                            profile_pic = None
                    
                    account_data = {
                        'auth_id': auth_id,
                        'account_id': profile_data.get('id'),
                        'name': profile_data.get('username', 'Threads User'),
                        'profile_picture': profile_pic,
                        'created_at': datetime.now(timezone.utc).isoformat()
                    }
                    
                    print("\nInserting account data:", account_data)
                    try:
                        account_result = supabase.table('threads_accounts').insert(account_data).execute()
                        print("Account insert result:", account_result.data)
                    except Exception as insert_error:
                        print(f"Error inserting account: {str(insert_error)}")
                        import traceback
                        print(traceback.format_exc())
                
                accounts = [{
                    'id': profile_data.get('id'),
                    'username': profile_data.get('username', 'Threads User'),
                    'profilePicture': profile_data.get('threads_profile_picture_url'),
                    'name': profile_data.get('name'),
                    'biography': profile_data.get('threads_biography')
                }]
                print("\nAccounts data prepared:", accounts)
            else:
                print(f"\nFailed to get profile: {profile_response.status_code}")
                print(f"Error response: {profile_response.text}")
                accounts = []
        except Exception as e:
            print(f"\nError getting profile: {str(e)}")
            import traceback
            print(traceback.format_exc())
            accounts = []

        # Para solicitudes GET, devuelve HTML que cierra la ventana
        if request.method == 'GET':
            print("\nReturning close window script")
            return """
                <html>
                    <head><title>Authentication Successful</title></head>
                    <body>
                        <script>
                            window.opener.postMessage('threads_auth_success', '*');
                            window.close();
                        </script>
                        Authentication successful! You can close this window.
                    </body>
                </html>
            """
        
        # Para solicitudes POST, devuelve JSON
        print("\nReturning success response")
        return {
            'success': True,
            'message': 'Threads authentication successful',
            'accounts': accounts
        }

    except Exception as e:
        print(f"\nGlobal error in exchange_threads_code: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {'error': str(e)}, 500



def threads_auth(user_id):
    """Handle Threads authentication and profile retrieval"""
    try:
       
        # Handle the exchange_threads_code logic
        return exchange_threads_code(user_id)
        
    except Exception as e:
        return {"error": str(e)}, 500
