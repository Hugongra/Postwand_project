import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .supabase_service import supabase_service as supabase

def get_token(platform, account_id, user_id):
    account = None
    table_map = {
        'facebook': 'facebook_pages',
        'instagram': 'instagram_accounts',
        'threads': 'threads_auth',
        'linkedin': 'linkedin_accounts',
        'youtube': 'youtube_channels',
        'tiktok': 'tiktok_accounts',
    }
    
    table_name = table_map.get(platform)
    if not table_name:
        logging.error(f"[GET_PLATFORM_TOKEN] Unknown platform: {platform}")
        return None
    

    if platform == 'facebook':
        auth_result = supabase.table("facebook_auth").select('id').eq('user_id', user_id).execute()
        account = supabase.table(table_name).select('*').eq('account_id', account_id).eq('auth_id', auth_result.data[0]['id']).execute()
    elif platform == 'threads':
        auth_result = supabase.table("threads_auth").select('*').eq('user_id', user_id).execute()
        if not auth_result.data:
            logging.error(f"[GET_PLATFORM_TOKEN] No threads_auth for user {user_id}")
            return None
        return auth_result.data[0]['access_token']
    else:
        account = supabase.table(table_name).select('*').eq('account_id', account_id).eq('user_id', user_id).execute()
    
    if platform == 'youtube':
        return account.data[0]['access_token'], account.data[0]['refresh_token']
    else:
        return account.data[0]['access_token']