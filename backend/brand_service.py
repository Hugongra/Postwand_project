from flask import session
from database import get_supabase_client
from redis_cache import cache_result

# Initialize Supabase client
supabase = get_supabase_client()

@cache_result("user_brand_profile", expiration=7200*10)  # Cache for 10 hours
def get_brand_profile(brand_id=None):
    """
    Get the latest brand profile for the current user from Supabase with caching.
    
    Args:
        brand_id: Optional brand ID. If not provided, gets from Flask session.
        
    Returns:
        dict: Brand profile data or None if no brand profile found
    """
    try:
        # Get user_id from session if not provided
        
        user_id = session.get('user_id')
        
        if not user_id:
            print("No user_id found in session or provided as argument")
            return None
            
        # Get the latest brand profile for this user
        if brand_id:
            # Get specific brand by ID
            result = supabase.table('brand_profiles').select('*').eq('user_id', user_id).eq('id', brand_id).execute()
        else:
            # Get the most recent brand profile for the user
            result = supabase.table('brand_profiles').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(1).execute()
        
        if result.data and len(result.data) > 0:
            brand_profile = result.data[0]
            print(f"Retrieved brand profile for user {user_id}: {brand_profile.get('id', 'Unknown')}")
            return brand_profile
        else:
            print(f"No brand profile found for user {user_id}")
            return None
            
    except Exception as e:
        print(f"Error retrieving brand profile: {str(e)}")
        return None

def invalidate_brand_cache(user_id):
    """
    Invalidate the brand profile cache for a specific user.
    Call this when a user updates their brand profile.
    
    Args:
        user_id: The user ID whose brand cache should be invalidated
    """
    try:
        from redis_cache import invalidate_cache
        invalidated_count = invalidate_cache("user_brand_profile", user_id)
        print(f"Invalidated {invalidated_count} brand cache entries for user {user_id}")
        return invalidated_count
    except Exception as e:
        print(f"Error invalidating brand cache: {str(e)}")
        return 0 