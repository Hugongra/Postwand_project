from flask import request, jsonify, session
    

from datetime import datetime, timezone
import requests
import os

from database import get_supabase_client
supabase = get_supabase_client()
from utils.image_utils import image_to_data_uri

from .meta_utils import get_long_lived_token

FB_APP_ID = os.getenv('FB_APP_ID')
FB_APP_SECRET = os.getenv('FB_APP_SECRET')


def check_access_token_expiration(access_token):
    app_id = os.getenv('FB_APP_ID', '')
    app_secret = os.getenv('FB_APP_SECRET', '')
    debug_url = (
        f"https://graph.facebook.com/debug_token"
        f"?input_token={access_token}"
        f"&access_token={app_id}|{app_secret}"
    )
    fb_response = requests.get(debug_url).json()

    return fb_response.get('data', {}).get('is_valid', False)

def get_facebook_pages(access_token):
    """Get user's Facebook pages"""
    url = "https://graph.facebook.com/v22.0/me/accounts"
    params = {"access_token": access_token}
    
    # Now get pages
    response = requests.get(url, params=params)

    data = response.json()
    
    # Check for specific error conditions
    if "error" in data:
        error_info = data["error"]

        
    if "data" not in data:
        raise Exception(f"Failed to get pages: {data.get('error', {}).get('message', 'Unknown error')}")
    
    # Format the pages data for frontend
    pages = []
    for page in data["data"]:
        pages.append({
            "id": page["id"],
            "name": page["name"],
            "pageToken": page["access_token"],
            "profilePicture": f"https://graph.facebook.com/{page['id']}/picture?type=large"
        })
    
    return pages

def save_facebook_auth(user_id, access_token, pages):
    try:
        # Get user info from Facebook to identify this specific account
        user_url = "https://graph.facebook.com/v22.0/me"
        user_response = requests.get(user_url, params={"access_token": access_token})
        user_data = user_response.json()
        
        facebook_user_id = user_data.get('id')
        
        if not facebook_user_id:
            return jsonify({'error': 'Could not get Facebook user ID'}), 400
            
        # Check if this specific Facebook account is already connected
        existing_auth = supabase.table('facebook_auth').select('*').eq('user_id', user_id).eq('facebook_user_id', facebook_user_id).execute()

        auth_data = {
            'access_token': access_token,
            'facebook_user_id': facebook_user_id,
            'name': user_data.get('name')
        }

        if existing_auth.data and len(existing_auth.data) > 0:
            # Update existing auth
            auth_result = supabase.table('facebook_auth').update(auth_data).eq('user_id', user_id).eq('facebook_user_id', facebook_user_id).execute()
            auth_id = existing_auth.data[0]['id']
            
        else:
            # Create new auth
            auth_data['user_id'] = user_id
            auth_data['created_at'] = datetime.now(timezone.utc).isoformat()
            auth_result = supabase.table('facebook_auth').insert(auth_data).execute()
            auth_id = auth_result.data[0]['id']
          

        # Update pages
        if pages:
            if existing_auth.data:
                # Get existing pages
                existing_pages = supabase.table('facebook_pages').select('account_id').eq('auth_id', auth_id).execute()
                existing_account_ids = [page['account_id'] for page in existing_pages.data] if existing_pages.data else []
                
                # Filter out pages that already exist
                new_pages = [page for page in pages if page['id'] not in existing_account_ids]
                
                # Insert only new pages
                if new_pages:
                    pages_data = []
                    for page in new_pages:
                        try:
                            try:
                                profile_pic = image_to_data_uri(page['profilePicture'])
                            except Exception:
                                profile_pic = None
                            
                            page_data = {
                                'auth_id': auth_id,
                                'account_id': page['id'],
                                'name': page['name'],
                                'access_token': page['pageToken'],
                                'profile_picture': profile_pic,
                                'created_at': datetime.now(timezone.utc).isoformat()
                            }
                            pages_data.append(page_data)
                        except Exception as e:
                            import traceback
                            print(traceback.format_exc())
                    
                    if pages_data:
                        page_result = supabase.table('facebook_pages').insert(pages_data).execute()
            else:
                # No existing auth, insert all pages
                pages_data = []
                for page in pages:
                    try:
                        try:
                            profile_pic = image_to_data_uri(page['profilePicture'])
                        except Exception:
                            profile_pic = None
                        
                        page_data = {
                            'auth_id': auth_id,
                            'account_id': page['id'],
                            'name': page['name'],
                            'access_token': page['pageToken'],
                            'profile_picture': profile_pic,
                            'created_at': datetime.now(timezone.utc).isoformat()
                        }
                        pages_data.append(page_data)
                    except Exception as e:
                        import traceback
                        print(traceback.format_exc())
                
                if pages_data:
                    page_result = supabase.table('facebook_pages').insert(pages_data).execute()

        
        return jsonify({
            'success': True,
            'message': 'Facebook authentication updated successfully',
            'data': {
                'auth_id': auth_id,
                'user_id': user_id,
                'pages': pages
            }
        })

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    

def facebook_auth(user_id):
    """Handle Facebook authentication and page retrieval"""
    data = request.json
    short_lived_token = data.get('accessToken')
  
    if not short_lived_token:
        return jsonify({"error": "No token provided"}), 400
    
    try:
        # 1. Exchange for long-lived token
        long_lived_token = get_long_lived_token(short_lived_token)
       
        # 2. Get Facebook pages
        pages = get_facebook_pages(long_lived_token)
       
        # 3. Store the token in your database with user ID
        response = save_facebook_auth(user_id, long_lived_token, pages)
        
        # 4. Return pages data to frontend
        return response
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500