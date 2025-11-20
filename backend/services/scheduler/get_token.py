import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_supabase_client

supabase = get_supabase_client()

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
    else:
        account = supabase.table(table_name).select('*').eq('account_id', account_id).eq('user_id', user_id).execute()
    
    if platform == 'youtube':
        return account.data[0]['access_token'], account.data[0]['refresh_token']
    else:
        return account.data[0]['access_token']