from flask import request, jsonify
import requests
import os


from database import get_supabase_client, get_service_role_client

supabase = get_supabase_client()
supabase_admin = get_service_role_client()

from utils.image_utils import image_to_data_uri
from .meta_utils import get_long_lived_token



FB_APP_ID = os.getenv('FB_APP_ID')
FB_APP_SECRET = os.getenv('FB_APP_SECRET')


def check_instagram_token_validity(access_token):
    try:
        app_id = os.getenv('FB_APP_ID', '')
        app_secret = os.getenv('FB_APP_SECRET', '')
        debug_url = (
            f"https://graph.facebook.com/debug_token"
            f"?input_token={access_token}"
            f"&access_token={app_id}|{app_secret}"
        )
        response = requests.get(debug_url).json()
        return response.get('data', {}).get('is_valid', False)
    except Exception as e:
        print(f"Error checking Instagram token: {str(e)}")
        return False


def get_instagram_accounts(access_token):
    """Get user's Instagram business accounts"""
    url = "https://graph.facebook.com/v23.0/me/accounts"
    params = {
        "access_token": access_token,
        "fields": "instagram_business_account{id,username,profile_picture_url},name,id,tasks"
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if "data" not in data:
        error_msg = f"Failed to get accounts: {data.get('error', {}).get('message', 'Unknown error')}"
        raise Exception(error_msg)
    
    # Format the Instagram accounts data for frontend
    accounts = []
    for page in data["data"]:
        if "instagram_business_account" in page:
            ig_account = page["instagram_business_account"]
            account_info = {
                "id": ig_account["id"],
                "username": ig_account.get("username", "Instagram User"),
                "profile_picture": ig_account.get("profile_picture_url") or f"https://graph.facebook.com/{ig_account['id']}/picture?type=large"
            }
            accounts.append(account_info)
    
    return accounts

def save_instagram_accounts(user_id, access_token, accounts):
    try:
        existing_accounts = supabase.table('instagram_accounts').select('account_id').eq('user_id', user_id).execute()
        existing_account_ids = [account['account_id'] for account in existing_accounts.data] if existing_accounts.data else []
        
        # Filter out accounts that already exist
        new_accounts = [account for account in accounts if account['id'] not in existing_account_ids]
        
        # Insert only new accounts
        if new_accounts:
            accounts_data = []
            
            for account in new_accounts:
                try:
                    try:
                        profile_pic = image_to_data_uri(account['profile_picture'])
                    except Exception:
                        profile_pic = None
                    
                    account_data = {
                        'user_id': user_id,
                        'access_token': access_token,
                        'account_id': account['id'],
                        'name': account['username'],
                        'profile_picture': profile_pic,
                    }
                    accounts_data.append(account_data)
                except Exception as e:
                    import traceback
                    print(traceback.format_exc())
            
            if accounts_data:
                try:
                    account_result = supabase.table('instagram_accounts').insert(accounts_data).execute()
                except Exception as e:
                    import traceback
                    print(traceback.format_exc())
                    return jsonify({'error': f'Failed to save Instagram accounts: {str(e)}'}), 500
                   
        return jsonify({
            'success': True,
            'message': 'Instagram authentication updated successfully',
            'data': {
                'user_id': user_id,
                'accounts': accounts
            }
        })

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    

def instagram_auth(user_id):
    """Handle Instagram authentication and account retrieval"""
    data = request.json
    
    short_lived_token = data.get('accessToken')
   
    if not short_lived_token:
        return jsonify({"error": "No token provided"}), 400
    
    try:
        # 1. Exchange for long-lived token
        long_lived_token = get_long_lived_token(short_lived_token)
        
        # 2. Get Instagram accounts
        accounts = get_instagram_accounts(long_lived_token)
        
        # 3. Store the token in your database with user ID
        response = save_instagram_accounts(user_id, long_lived_token, accounts)

        return response
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        
        return jsonify({"error": str(e)}), 500
