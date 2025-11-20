from flask import session
from database import get_supabase_client

supabase = get_supabase_client()

# Platform to table name mapping
PLATFORM_TABLES = {
    'facebook': 'facebook_pages',
    'instagram': 'instagram_accounts',
    'linkedin': 'linkedin_accounts',
    'youtube': 'youtube_channels',
    'tiktok': 'tiktok_accounts'
}

def get_accounts(user_id):
    response_data = {}
    
    # Facebook - special case with auth_id relationship
    fb_auth = supabase.table('facebook_auth').select('id, user_id, created_at').eq('user_id', user_id).execute()
    if fb_auth.data:
        for auth in fb_auth.data:
            fb_pages = supabase.table('facebook_pages').select('id, auth_id, account_id, name, profile_picture, created_at').eq('auth_id', auth['id']).execute()
            response_data['facebook'] = {'accounts': fb_pages.data}
    
    # Instagram
    ig_accounts = supabase.table('instagram_accounts').select('id, user_id, account_id, name, profile_picture, created_at').eq('user_id', user_id).execute()
    if ig_accounts.data:
        response_data['instagram'] = {'accounts': ig_accounts.data}
    
    # LinkedIn
    linkedin_accounts = supabase.table('linkedin_accounts').select('id, user_id, account_id, name, profile_picture, created_at').eq('user_id', user_id).execute()
    if linkedin_accounts.data:
        response_data['linkedin'] = {'accounts': linkedin_accounts.data}

    # YouTube
    youtube_channels = supabase.table('youtube_channels').select('id, user_id, account_id, name, description, profile_picture, custom_url, created_at').eq('user_id', user_id).execute()
    if youtube_channels.data:
        response_data['youtube'] = {'accounts': youtube_channels.data}

    # TikTok
    tiktok_accounts = supabase.table('tiktok_accounts').select('id, user_id, account_id, name, username, profile_picture, created_at').eq('user_id', user_id).execute()
    if tiktok_accounts.data:
        response_data['tiktok'] = {'accounts': tiktok_accounts.data}
      
    return response_data

def disconnect_account(user_id, platform, account_id):
    try:
        
        table_name = PLATFORM_TABLES[platform]
        
        if platform == 'facebook':
            fb_auth = supabase.table('facebook_auth').select('id').eq('user_id', user_id).execute()
            if not fb_auth.data:
                return {'error': 'Facebook authentication not found'}, 404
            
            auth_id = fb_auth.data[0]['id']
            result = supabase.table(table_name).delete().eq('account_id', account_id).eq('auth_id', auth_id).execute()
        else:
            result = supabase.table(table_name).delete().eq('account_id', account_id).eq('user_id', user_id).execute()
        
        if not result.data:
            return {'error': 'Account not found or already disconnected'}, 404
        
        return {'message': 'Account disconnected successfully'}, 200
        
    except Exception as e:
        print(f"Error disconnecting account: {str(e)}")
        return {'error': f'Failed to disconnect account: {str(e)}'}, 500
