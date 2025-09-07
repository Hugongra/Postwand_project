# backend/token_service.py
from database import get_supabase_client
import logging
from datetime import datetime, timezone

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get Supabase client
supabase = get_supabase_client()

# Token limits per subscription tier
GROK_LIMITS = {
    'free': 5000000,     
    'creator': 500000,  
    'manager': 1000000, 
    'business': 2147483647 
}

IMAGE_LIMITS = {
    'free': 5,     
    'creator': 5,   
    'manager': 10,   
    'business': 15
}

CLAUDE_LIMITS = {
    'free': 200000,     
    'creator': 50000,   
    'manager': 100000, 
    'business': 500000  
}

def check_grok_limit(user_id):
    """
    Check if user has exceeded their Grok token limit
    
    Args:
        user_id: User ID
        
    Returns:
        bool: True if user is over limit, False otherwise
    """
    if not user_id:
        logger.warning("No user_id provided to check_grok_limit")
        return False
    
    try:
        logger.info(f"Checking Grok token limit for user {user_id}")
        result = supabase.rpc('is_over_grok_limit', {'user_id': user_id}).execute()
        
        if result.data is None:
            logger.warning(f"No data returned from is_over_grok_limit for user {user_id}")
            return False
        
        is_over_limit = result.data
        logger.info(f"User {user_id} over Grok limit: {is_over_limit}")
        return is_over_limit
        
    except Exception as e:
        logger.error(f"Error checking Grok token limit for user {user_id}: {str(e)}")
        return False

def check_claude_limit(user_id):
    """
    Check if user has exceeded their Claude token limit
    
    Args:
        user_id: User ID
        
    Returns:
        bool: True if user is over limit, False otherwise
    """
    if not user_id:
        logger.warning("No user_id provided to check_claude_limit")
        return False
    
    try:
        logger.info(f"Checking Claude token limit for user {user_id}")
        result = supabase.rpc('is_over_claude_limit', {'user_id': user_id}).execute()
        
        if result.data is None:
            logger.warning(f"No data returned from is_over_claude_limit for user {user_id}")
            return False
        
        is_over_limit = result.data
        logger.info(f"User {user_id} over Claude limit: {is_over_limit}")
        return is_over_limit
        
    except Exception as e:
        logger.error(f"Error checking Claude token limit for user {user_id}: {str(e)}")
        return False

def check_image_limit(user_id):
    """
    Check if user has exceeded their image token limit
    
    Args:
        user_id: User ID
        
    Returns:
        bool: True if user is over limit, False otherwise
    """
    if not user_id:
        logger.warning("No user_id provided to check_image_limit")
        return False
    
    try:
        logger.info(f"Checking image token limit for user {user_id}")
        result = supabase.rpc('is_over_image_limit', {'user_id': user_id}).execute()
        
        if result.data is None:
            logger.warning(f"No data returned from is_over_image_limit for user {user_id}")
            return False
        
        is_over_limit = result.data
        logger.info(f"User {user_id} over image limit: {is_over_limit}")
        return is_over_limit
        
    except Exception as e:
        logger.error(f"Error checking image token limit for user {user_id}: {str(e)}")
        return False

def update_grok_usage(user_id, tokens):
    """
    Update Grok token usage for a user
    
    Args:
        user_id: User ID
        tokens: Number of tokens to add
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not user_id or tokens <= 0:
        return True
    
    try:
        result = supabase.rpc('add_grok_tokens', {
            'user_id': user_id,
            'tokens': tokens
        }).execute()
        
        logger.info(f"Updated Grok usage for user {user_id}: +{tokens} tokens")
        return True
        
    except Exception as e:
        logger.error(f"Error updating Grok token usage: {str(e)}")
        return False

def update_claude_usage(user_id, tokens):
    """
    Update Claude token usage for a user
    
    Args:
        user_id: User ID
        tokens: Number of tokens to add
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not user_id or tokens <= 0:
        return True
    
    try:
        result = supabase.rpc('add_claude_tokens', {
            'user_id': user_id,
            'tokens': tokens
        }).execute()
        
        logger.info(f"Updated Claude usage for user {user_id}: +{tokens} tokens")
        return True
        
    except Exception as e:
        logger.error(f"Error updating Claude token usage: {str(e)}")
        return False

def update_image_usage(user_id, tokens):
    """
    Update image token usage for a user
    
    Args:
        user_id: User ID
        tokens: Number of tokens to add
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not user_id or tokens <= 0:
        return True
    
    try:
        result = supabase.rpc('add_image_tokens', {
            'user_id': user_id,
            'tokens': tokens
        }).execute()
        
        logger.info(f"Updated image usage for user {user_id}: +{tokens} tokens")
        return True
        
    except Exception as e:
        logger.error(f"Error updating image token usage: {str(e)}")
        return False

def initialize_new_user(user_id, plan='free'):
    """
    Initialize token usage for a new user
    
    Args:
        user_id: User ID
        plan: Subscription plan (free, creator, manager, business)
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not user_id:
        return False
    
    try:
        # Set max tokens based on plan
        grok_max = GROK_LIMITS.get(plan.lower(), GROK_LIMITS['free'])
        claude_max = CLAUDE_LIMITS.get(plan.lower(), CLAUDE_LIMITS['free'])
        image_max = IMAGE_LIMITS.get(plan.lower(), IMAGE_LIMITS['free'])
        
        # Initialize token usage record
        result = supabase.table('token_usage').insert({
            'user_id': user_id,
            'grok_tokens_used': 0,
            'claude_tokens_used': 0,
            'image_tokens_used': 0,
            'grok_max_tokens': grok_max,
            'claude_max_tokens': claude_max,
            'image_max_tokens': image_max,
            'subscription_start_date': datetime.now(timezone.utc).isoformat()
        }).execute()
        
        logger.info(f"Initialized token usage for user {user_id} with plan {plan}")
        return True
        
    except Exception as e:
        logger.error(f"Error initializing token usage: {str(e)}")
        return False

def update_user_tier(user_id, tier):
    """Update user's token limits based on subscription tier"""
    if not user_id:
        return False
        
    try:
        grok_limit = GROK_LIMITS.get(tier, GROK_LIMITS['free'])
        claude_limit = CLAUDE_LIMITS.get(tier, CLAUDE_LIMITS['free'])
        image_limit = IMAGE_LIMITS.get(tier, IMAGE_LIMITS['free'])
        
        supabase.table('token_usage') \
            .update({
                'grok_max_tokens': grok_limit,
                'claude_max_tokens': claude_limit,
                'image_max_tokens': image_limit
            }, returning='minimal', count='exact') \
            .eq('user_id', user_id) \
            .execute()
            
        logger.info(f"Updated tier for user {user_id} to {tier}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating user tier: {str(e)}")
        return False

def get_user_token_usage(user_id):
    """
    Get current token usage for user across all token types
    
    Args:
        user_id: User ID
        
    Returns:
        dict: Dictionary with usage stats for all token types
    """
    if not user_id:
        return {
            'grok': {'tokens_used': 0, 'max_tokens': GROK_LIMITS['free'], 'percentage': 0},
            'claude': {'tokens_used': 0, 'max_tokens': CLAUDE_LIMITS['free'], 'percentage': 0},
            'image': {'tokens_used': 0, 'max_tokens': IMAGE_LIMITS['free'], 'percentage': 0}
        }
        
    try:
        # Get user's token usage
        result = supabase.table('token_usage') \
            .select('grok_tokens_used,claude_tokens_used,image_tokens_used,grok_max_tokens,claude_max_tokens,image_max_tokens') \
            .eq('user_id', user_id) \
            .single() \
            .execute()
            
        if not result.data:
            return {
                'grok': {'tokens_used': 0, 'max_tokens': GROK_LIMITS['free'], 'percentage': 0},
                'claude': {'tokens_used': 0, 'max_tokens': CLAUDE_LIMITS['free'], 'percentage': 0},
                'image': {'tokens_used': 0, 'max_tokens': IMAGE_LIMITS['free'], 'percentage': 0}
            }
            
        data = result.data
        
        # Calculate Grok usage
        grok_used = data.get('grok_tokens_used', 0)
        grok_max = data.get('grok_max_tokens', GROK_LIMITS['free'])
        grok_percentage = round((grok_used / grok_max) * 100, 1) if grok_max > 0 else 0
        
        # Calculate Claude usage
        claude_used = data.get('claude_tokens_used', 0)
        claude_max = data.get('claude_max_tokens', CLAUDE_LIMITS['free'])
        claude_percentage = round((claude_used / claude_max) * 100, 1) if claude_max > 0 else 0
        
        # Calculate Image usage
        image_used = data.get('image_tokens_used', 0)
        image_max = data.get('image_max_tokens', IMAGE_LIMITS['free'])
        image_percentage = round((image_used / image_max) * 100, 1) if image_max > 0 else 0
        
        return {
            'grok': {
                'tokens_used': grok_used,
                'max_tokens': grok_max,
                'percentage': grok_percentage
            },
            'claude': {
                'tokens_used': claude_used,
                'max_tokens': claude_max,
                'percentage': claude_percentage
            },
            'image': {
                'tokens_used': image_used,
                'max_tokens': image_max,
                'percentage': image_percentage
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting token usage: {str(e)}")
        return {
            'grok': {'tokens_used': 0, 'max_tokens': GROK_LIMITS['free'], 'percentage': 0, 'error': str(e)},
            'claude': {'tokens_used': 0, 'max_tokens': CLAUDE_LIMITS['free'], 'percentage': 0, 'error': str(e)},
            'image': {'tokens_used': 0, 'max_tokens': IMAGE_LIMITS['free'], 'percentage': 0, 'error': str(e)}
        }

# Convenience functions for checking any token type
def check_token_limit(user_id, token_type):
    """
    Check if user has exceeded their limit for a specific token type
    
    Args:
        user_id: User ID
        token_type: 'grok', 'claude', or 'image'
        
    Returns:
        bool: True if user is over limit, False otherwise
    """
    if token_type == 'grok':
        return check_grok_limit(user_id)
    elif token_type == 'claude':
        return check_claude_limit(user_id)
    elif token_type == 'image':
        return check_image_limit(user_id)
    else:
        logger.error(f"Invalid token type: {token_type}")
        return False

def update_token_usage(user_id, tokens, token_type):
    """
    Update token usage for a specific token type
    
    Args:
        user_id: User ID
        tokens: Number of tokens to add
        token_type: 'grok', 'claude', or 'image'
        
    Returns:
        bool: True if successful, False otherwise
    """
    if token_type == 'grok':
        return update_grok_usage(user_id, tokens)
    elif token_type == 'claude':
        return update_claude_usage(user_id, tokens)
    elif token_type == 'image':
        return update_image_usage(user_id, tokens)
    else:
        logger.error(f"Invalid token type: {token_type}")
        return False