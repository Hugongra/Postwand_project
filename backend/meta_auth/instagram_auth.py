from flask import request, jsonify, session

import requests
import os


from database import get_supabase_client, get_service_role_client
supabase = get_supabase_client()
supabase_admin = get_service_role_client()
from utils import download_and_encode_image

from meta_auth.meta_utils import get_long_lived_token

FB_APP_ID = os.getenv('FB_APP_ID')
FB_APP_SECRET = os.getenv('FB_APP_SECRET')




def get_instagram_accounts(access_token):
    """Get user's Instagram business accounts"""
    print("\n=== FETCHING INSTAGRAM ACCOUNTS ===")
    url = "https://graph.facebook.com/v23.0/me/accounts"
    params = {
        "access_token": access_token,
        "fields": "instagram_business_account{id,username,profile_picture_url},name,id,tasks"
    }
    
    print(f"Making request to: {url}")
    print(f"With params: {params}")
    
    response = requests.get(url, params=params)
    print(f"Response status: {response.status_code}")
    print(f"Full response body: {response.text}")
    
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
    
    # If no accounts were found, return empty list instead of raising an error
    if not accounts:
        print("No Instagram Business accounts found")
    
    return accounts

def save_instagram_accounts(access_token, accounts):
    try:
      
        for i, account in enumerate(accounts):
            print(f"Account {i+1}: ID={account['id']}, Username={account['username']}")
        
        user_id = session.get('user_id')
        if not user_id:
            print("ERROR: No user_id in session")
            return jsonify({'error': 'User not authenticated'}), 401
        
       
        existing_accounts = supabase.table('instagram_accounts').select('account_id').eq('user_id', user_id).execute()
      
      
        existing_account_ids = [account['account_id'] for account in existing_accounts.data] if existing_accounts.data else []
      
        # Filter out accounts that already exist
        new_accounts = [account for account in accounts if account['id'] not in existing_account_ids]
       
      
        # Insert only new accounts
        if new_accounts:
           
            accounts_data = []
            
            for account in new_accounts:
                try:
                    profile_pic = download_and_encode_image(account['profile_picture'])
                  
                    
                    account_data = {
                        'user_id': user_id,
                        'access_token': access_token,
                        'account_id': account['id'],
                        'name': account['username'],
                        'profile_picture': profile_pic,
                        'type': 'facebook'
                    }
                    accounts_data.append(account_data)
                except Exception as e:
                    print(f"Error processing account {account['username']}: {str(e)}")
            
            if accounts_data:
                try:
                    
                    account_result = supabase.table('instagram_accounts').insert(accounts_data).execute()
                   
                    
                   
                except Exception as e:
                
                    import traceback
                   
                    return jsonify({'error': f'Failed to save Instagram accounts: {str(e)}'}), 500
            else:
                print("No accounts to insert after processing")
        else:
            print("No new accounts to add")
                   
        print("Returning success response to client")
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
    

def instagram_auth():
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
        response = save_instagram_accounts(long_lived_token, accounts)

        return response
    except Exception as e:
        
        import traceback
        print(traceback.format_exc())
        
        return jsonify({"error": str(e)}), 500
