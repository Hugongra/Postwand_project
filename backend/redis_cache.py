import redis
import json
import os
from functools import wraps
from dotenv import load_dotenv

# Load environment variables if not already loaded
load_dotenv()

# Use the same Upstash Redis connection you already have configured
redis_client = redis.Redis(
    host=os.getenv("UPSTASH_REDIS_HOST"),
    port=int(os.getenv("UPSTASH_REDIS_PORT", "6379")),
    password=os.getenv("UPSTASH_REDIS_PASSWORD"),
    ssl=True,
    db=0  # Using db 0 for cache
)

# Default cache expiration (1 hour)
CACHE_EXPIRATION = 3600

def cache_result(key_prefix, expiration=CACHE_EXPIRATION):
    """
    Decorator to cache function results in Redis.
    
    Args:
        key_prefix: Prefix for the cache key
        expiration: Cache expiration time in seconds
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create a unique cache key
            cache_key = f"{key_prefix}:"
            
            # Add args to the key
            if args:
                for arg in args:
                    if isinstance(arg, (str, int, float, bool)):
                        cache_key += f"{arg}:"
            
            # Add kwargs to the key
            if kwargs:
                for k, v in sorted(kwargs.items()):
                    if isinstance(v, (str, int, float, bool)):
                        cache_key += f"{k}={v}:"
                        
            # Remove trailing colon and make sure key is valid
            cache_key = cache_key.rstrip(':')
            
            # Try to get cached result
            try:
                cached_result = redis_client.get(cache_key)
                if cached_result:
                    print(f"Cache hit: {cache_key}")
                    return json.loads(cached_result)
            except Exception as e:
                print(f"Cache fetch error: {str(e)}")
            
            # Get fresh result
            result = func(*args, **kwargs)
            
            # Cache the result
            try:
                if result is not None:  # Only cache non-None results
                    # Check if result is JSON serializable
                    json_result = json.dumps(result)
                    redis_client.setex(cache_key, expiration, json_result)
                    print(f"Cached: {cache_key}")
            except Exception as e:
                print(f"Cache store error: {str(e)}")
                
            return result
        return wrapper
    return decorator

def invalidate_cache(key_prefix, *args):
    """
    Invalidate cache for a specific prefix and optional arguments.
    
    Args:
        key_prefix: The prefix to match
        args: Optional arguments to include in the key
    """
    pattern = f"{key_prefix}*"
    
    if args:
        pattern = f"{key_prefix}:{':'.join(str(arg) for arg in args)}*"
        
    # Find all matching keys
    keys = redis_client.keys(pattern)
    
    # Delete all matching keys
    if keys:
        redis_client.delete(*keys)
        print(f"Invalidated {len(keys)} cache entries with pattern: {pattern}")
        return len(keys)
    return 0

def get_cached(key):
    """Get data from cache if it exists"""
    try:
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)
        return None
    except Exception as e:
        print(f"Cache get error: {str(e)}")
        return None

def set_cached(key, data, expiration=300):
    """Store data in cache with expiration in seconds"""
    try:
        redis_client.setex(key, expiration, json.dumps(data))
    except Exception as e:
        print(f"Cache set error: {str(e)}") 