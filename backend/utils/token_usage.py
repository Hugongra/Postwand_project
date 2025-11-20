
from dotenv import load_dotenv
from database import get_supabase_client
load_dotenv()

supabase = get_supabase_client()

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

def call_rpc(function_name, params, return_data=False):
    try:
        result = supabase.rpc(function_name, params).execute()
        return result.data if return_data else True
    except Exception:
        return False

RPC_MAP = {
    'grok': {
        'check': 'is_over_grok_limit',
        'update': 'add_grok_tokens'
    },
    'image': {
        'check': 'is_over_image_limit',
        'update': 'add_image_tokens'
    }
}

def check_token_limit(user_id, token_type):
    rpc_name = RPC_MAP.get(token_type, {}).get('check')
    return call_rpc(rpc_name, {'user_id': user_id}, return_data=True) if rpc_name else False


def update_token_usage(user_id, tokens, token_type):
    rpc_name = RPC_MAP.get(token_type, {}).get('update')
    return call_rpc(rpc_name, {'user_id': user_id, 'tokens': tokens}) if rpc_name else False

def initialize_new_user(user_id, plan='free'):
    try:
        plan = plan.lower()
        grok_max = GROK_LIMITS.get(plan, GROK_LIMITS['free'])
        image_max = IMAGE_LIMITS.get(plan, IMAGE_LIMITS['free'])
        
        supabase.table('token_usage').insert({
            'user_id': user_id,
            'grok_tokens_used': 0,
            'claude_tokens_used': 0,
            'image_tokens_used': 0,
            'grok_max_tokens': grok_max,
            'claude_max_tokens': 0,
            'image_max_tokens': image_max
        }).execute()
        return True
    except Exception:
        return False


def update_user_tier(user_id, tier):
    try:
        tier = tier.lower()
        grok_limit = GROK_LIMITS.get(tier, GROK_LIMITS['free'])
        image_limit = IMAGE_LIMITS.get(tier, IMAGE_LIMITS['free'])
        
        supabase.table('token_usage') \
            .update({
                'grok_max_tokens': grok_limit,
                'image_max_tokens': image_limit
            }) \
            .eq('user_id', user_id) \
            .execute()
        return True
    except Exception:
        return False


def get_user_token_usage(user_id):
    DEFAULTS = {
        'grok': {'used': 0, 'max': GROK_LIMITS['free']},
        'claude': {'used': 0, 'max': 0},
        'image': {'used': 0, 'max': IMAGE_LIMITS['free']}
    }

    try:
        result = supabase.table('token_usage') \
            .select('grok_tokens_used,claude_tokens_used,image_tokens_used,grok_max_tokens,claude_max_tokens,image_max_tokens') \
            .eq('user_id', user_id) \
            .single() \
            .execute()

        data = result.data or {}
        usage = {}

        for key in DEFAULTS.keys():
            used = data.get(f'{key}_tokens_used', DEFAULTS[key]['used'])
            max_tokens = data.get(f'{key}_max_tokens', DEFAULTS[key]['max'])
            percentage = round((used / max_tokens) * 100, 1) if max_tokens > 0 else 0

            usage[key] = {
                'tokens_used': used,
                'max_tokens': max_tokens,
                'percentage': percentage
            }

        return usage

    except Exception as e:
        return {
            k: {**v, 'percentage': 0, 'error': str(e)} 
            for k, v in DEFAULTS.items()
        }

