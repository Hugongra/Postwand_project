from flask import request, jsonify, session
import requests
import os
from database import get_supabase_client, get_service_role_client
from utils import download_and_encode_image

supabase = get_supabase_client()
supabase_admin = get_service_role_client()

# Environment variables
INSTAGRAM_BUSINESS_APP_ID = os.getenv('INSTAGRAM_BUSINESS_APP_ID')
INSTAGRAM_BUSINESS_APP_SECRET = os.getenv('INSTAGRAM_BUSINESS_APP_SECRET')
INSTAGRAM_BUSINESS_REDIRECT_URI = os.getenv('INSTAGRAM_BUSINESS_REDIRECT_URI')

def get_instagram_business_long_lived_token(short_lived_token):
    """Exchange a short-lived token for a long-lived token for Instagram Business"""
    url = "https://graph.instagram.com/access_token"
    params = {
        "grant_type": "ig_exchange_token",
        "client_secret": INSTAGRAM_BUSINESS_APP_SECRET,
        "access_token": short_lived_token
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if "access_token" not in data:
        raise Exception(f"Failed to get long-lived token: {data.get('error', {}).get('message', 'Unknown error')}")
    
    return data["access_token"]

def get_instagram_business_profile(access_token):
    """Get Instagram business user profile data"""
    url = "https://graph.instagram.com/v23.0/me"
    params = {
        "access_token": access_token,
        "fields": "id,username,name,profile_picture_url,biography,media_count"
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if "id" not in data:
        raise Exception(f"Failed to get Instagram profile: {data.get('error', {}).get('message', 'Unknown error')}")
    
    # Format account data for frontend
    profile = {
        "id": data.get("id"),
        "username": data.get("username", "Instagram User"),
        "profile_picture": data.get("profile_picture_url", ""),
    }
    
    return profile

def save_instagram_business_auth(access_token, profile):
    try:
       
        user_id = session.get('user_id')

        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        # Check if account already exists
      
        existing_account = supabase.table('instagram_accounts').select('*').eq('account_id', profile['id']).eq('user_id', user_id).execute()
        
        if existing_account.data:
            # Update existing account

            account_data = {
                'name': profile['username'],
                'profile_picture': download_and_encode_image(profile['profile_picture']) if profile['profile_picture'] else None,
                'type': 'instagram'
            }
            account_result = supabase.table('instagram_accounts').update(account_data).eq('account_id', profile['id']).eq('user_id', user_id).execute()
          
        else:
            # Create new account
  
            account_data = {
                'user_id': user_id,
                'account_id': profile['id'],
                'access_token': access_token,
                'name': profile['username'],
                'profile_picture': download_and_encode_image(profile['profile_picture']) or f"https://graph.facebook.com/{profile['id']}/picture?type=large",
                'type': 'instagram'
            }
            account_result = supabase_admin.table('instagram_accounts').insert(account_data).execute()
           
        return jsonify({
            'success': True,
            'message': 'Instagram Business authentication updated successfully',
            'data': {
                'user_id': user_id,
                'accounts': [profile]
            }
        })

    except Exception as e:
       
        import traceback
        return jsonify({'error': str(e)}), 500

def exchange_instagram_business_code():
    try:
      
        # For GET requests (OAuth redirect)
        if request.method == 'GET':
            code = request.args.get('code').strip('#_')
            state = request.args.get('state')
            
        # For POST requests
        else:
            data = request.json
            code = data.get('code').strip('#_')
            state = data.get('state')
            
            
        if not code:
          
            return jsonify({'error': 'No authorization code provided'}), 400

        # Prepare data payload
        exchange_data = {
            'client_id': INSTAGRAM_BUSINESS_APP_ID,
            'client_secret': INSTAGRAM_BUSINESS_APP_SECRET,
            'grant_type': 'authorization_code',
            'redirect_uri': "https://threads-dev.local:5173/",
            'code': code
        }
          
        # Make the token exchange request with clear headers
        token_response = requests.post(
            'https://api.instagram.com/oauth/access_token',
            data=exchange_data,
           
        )
        
        try:
            token_data = token_response.json()
          
        except Exception as e:
          
            return jsonify({'error': f"Non-JSON response: {token_response.text}"}), 500
        
        if 'access_token' in token_data:
            # Success - proceed with the rest of the function
          
            short_lived_token = token_data['access_token']
            instagram_user_id = token_data['user_id']
            
            # Exchange for long-lived token
            try:
               
                access_token = get_instagram_business_long_lived_token(short_lived_token)
               
            except Exception as e:
              
                access_token = short_lived_token
                
            # Get profile data
            try:
              
                profile = get_instagram_business_profile(access_token)
              
            except Exception as e:
              
                return jsonify({'error': f"Failed to get profile: {str(e)}"}), 500
                
            # Save authentication
            return save_instagram_business_auth(access_token, profile)
        else:
            error_message = token_data.get('error_message', token_data.get('error', {}).get('message', 'Unknown error'))
           
            
            # Return detailed error information
            return jsonify({
                'error': error_message,
                'details': token_data
            }), 400

    except Exception as e:
       
        import traceback
      
        return jsonify({'error': str(e)}), 500

def instagram_business_auth():
    """Handle Instagram Business authentication and profile retrieval"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401

        # Handle the exchange_instagram_business_code logic
        return exchange_instagram_business_code()
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500 