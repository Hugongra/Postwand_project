from flask import request, Response
import os
import json
import requests
from flask import session

from database import get_supabase_client

supabase = get_supabase_client()

LINKEDIN_APP_ID = os.getenv('LINKEDIN_APP_ID')
LINKEDIN_CLIENT_SECRET = os.getenv('LINKEDIN_CLIENT_SECRET')
LINKEDIN_REDIRECT_URI = os.getenv('LINKEDIN_REDIRECT_URI')


def refresh_access_token(refresh_token):
    url = "https://www.linkedin.com/oauth/v2/accessToken"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": LINKEDIN_APP_ID,
        "client_secret": LINKEDIN_CLIENT_SECRET
    }
    response = requests.post(url, headers=headers, data=data)
    if response.status_code != 200:
        raise Exception(f"Failed to refresh access token: {response}")
    
    return response.json()

def exchange_code(code):
    url = "https://www.linkedin.com/oauth/v2/accessToken"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": LINKEDIN_APP_ID,
        "client_secret": LINKEDIN_CLIENT_SECRET,
        "redirect_uri": LINKEDIN_REDIRECT_URI
    }
    
    response = requests.post(url, headers=headers, data=data)
    
    if response.status_code != 200:
 
        raise Exception(f"Failed to exchange code: {response.status_code} - {response.text}")
   
    return response.json()



def get_user_info(access_token):
    url = "https://api.linkedin.com/v2/userinfo"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to get user info: {response.text}")
    
    return response.json()

def linkedin_auth():
    user_id = session.get('user_id')
    
    if request.method == 'GET':
        code = request.args.get('code')

    else:

        if request.is_json:
            data = request.json
            code = data.get('code')

        elif request.form:
            code = request.form.get('code')

        else:
            code = request.args.get('code')
       
    
    if not code:

        return {"success": False, "error": "No authorization code provided"}, 400

    try:
        # Exchange authorization code for tokens
        token_data = exchange_code(code)
        
        # Extract tokens
        access_token = token_data.get('access_token')
      
        
        # Get user info using the access token
        user_info = get_user_info(access_token)
        
        # Print detailed information about the tokens and user info

        
        # Construct the LinkedIn URN for the person
        person_id = user_info.get("sub")
        linkedin_urn = f"urn:li:person:{person_id}" if person_id else None
        
      
        
        # Prepare the response data
        response_data = {
            "success": True,
        }
        
        # Check if the user already has a LinkedIn account
        existing_account = supabase.table("linkedin_accounts").select("*").eq("user_id", user_id).eq("account_id", user_info.get("sub")).execute()
        
        # Prepare account data
        account_data = {
            "user_id": user_id, 
            "account_id": user_info.get("sub"),
            "access_token": access_token,
            "refresh_token": token_data.get("refresh_token"),
            "token_expires_in": token_data.get("expires_in"),
            "scope": token_data.get("scope"),
            "urn": linkedin_urn,
            "identifier": user_info.get("sub"),
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "picture": user_info.get("picture"),
        }
        
        if existing_account.data and len(existing_account.data) > 0:
            # Update existing account
            supabase.table("linkedin_accounts").update(account_data).eq("user_id", user_id).eq("account_id", user_info.get("sub")).execute()
        else:
            # Insert new account
            supabase.table("linkedin_accounts").insert(account_data).execute()
        
        # For GET requests (OAuth redirects), return a simple auto-close script
        if request.method == 'GET':
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Complete</title>
                <script>
                    window.onload = function() {{
                        if (window.opener) {{
                            window.opener.postMessage({{
                                type: 'linkedin_auth_success'
                            }}, '*');
                            window.close();
                        }}
                    }};
                </script>
            </head>
            <body>
                <p>Authentication successful. This window will close automatically.</p>
            </body>
            </html>
            """
            return Response(html, mimetype='text/html')
        
        # For API requests, return JSON
        return response_data
    except Exception as e:
        error_response = {"success": False, "error": str(e)}
        
        # For GET requests, return an error page that will close itself
        if request.method == 'GET':
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Error</title>
                <script>
                    window.onload = function() {{
                        if (window.opener) {{
                            window.opener.postMessage({{
                                type: 'linkedin_auth_error',
                                data: {json.dumps(error_response)}
                            }}, '*');
                            setTimeout(function() {{
                                window.close();
                            }}, 2000);
                        }}
                    }};
                </script>
            </head>
            <body>
                <p>Authentication failed: {str(e)}</p>
                <p>This window will close automatically in 2 seconds.</p>
            </body>
            </html>
            """
            return Response(html, mimetype='text/html')
        
        # For API requests, return JSON error
        return error_response, 500







