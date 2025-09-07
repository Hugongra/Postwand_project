import os
from functools import lru_cache
from supabase import create_client, Client

@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
        
    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"Error initializing Supabase: {str(e)}")
        raise

def get_service_role_client() -> Client:
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    
    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"Error initializing Supabase: {str(e)}")
        raise
