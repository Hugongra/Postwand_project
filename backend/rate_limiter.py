import time
import redis
import os
from functools import wraps
from flask import request, jsonify
from dotenv import load_dotenv

# Load environment variables if not already loaded
load_dotenv()

# Use the same Redis connection
redis_client = redis.Redis(
    host=os.getenv("UPSTASH_REDIS_HOST", "credible-chigger-31971.upstash.io"),
    port=int(os.getenv("UPSTASH_REDIS_PORT", "6379")),
    password=os.getenv("UPSTASH_REDIS_PASSWORD"),
    ssl=True,
    db=0
)

def rate_limit(limit=100, period=60, key_prefix='rate_limit'):
    """
    Rate limiter decorator using Redis.
    
    Args:
        limit: Maximum number of requests allowed in the time period
        period: Time period in seconds
        key_prefix: Prefix for Redis key
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get client identifier - IP address or user ID
            client_ip = request.remote_addr
            user_id = request.headers.get('X-User-ID') or getattr(request, 'user_id', None)
            
            # Create a unique key for this client and endpoint
            identifier = user_id if user_id else client_ip
            endpoint = request.path
            redis_key = f"{key_prefix}:{endpoint}:{identifier}"
            
            # Get current count from Redis
            current = redis_client.get(redis_key)
            count = int(current) if current else 0
            
            # Check if rate limit exceeded
            if count >= limit:
                response = {
                    'error': 'Rate limit exceeded',
                    'limit': limit,
                    'period': period,
                    'retry_after': period - (int(time.time()) % period)
                }
                return jsonify(response), 429
            
            # Increment the counter
            if count == 0:
                # First request in period, set expiry
                pipeline = redis_client.pipeline()
                pipeline.incr(redis_key)
                pipeline.expire(redis_key, period)
                pipeline.execute()
            else:
                # Just increment
                redis_client.incr(redis_key)
            
            # Add rate limit headers to response
            response = func(*args, **kwargs)
            
            # Handle different types of responses
            if isinstance(response, tuple) and len(response) == 2:
                resp_obj, status_code = response
                if isinstance(resp_obj, dict):
                    # Add rate limit headers to JSON response
                    resp_obj['X-RateLimit-Limit'] = limit
                    resp_obj['X-RateLimit-Remaining'] = limit - (count + 1)
                    resp_obj['X-RateLimit-Reset'] = period - (int(time.time()) % period)
                return resp_obj, status_code
            
            return response
        
        return wrapper
    
    return decorator

# For user-specific rate limits where user_id is known
def user_rate_limit(limit=100, period=60, key_prefix='user_rate_limit'):
    """
    User-specific rate limiter.
    Uses the user_id from session rather than IP address.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            from flask import session
            
            # Get user ID from session
            user_id = session.get('user_id')
            if not user_id:
                # If no user_id, fall back to IP-based limiting
                return rate_limit(limit, period, 'anon_rate_limit')(func)(*args, **kwargs)
            
            # Create a unique key for this user and endpoint
            endpoint = request.path
            redis_key = f"{key_prefix}:{endpoint}:{user_id}"
            
            # Get current count from Redis
            current = redis_client.get(redis_key)
            count = int(current) if current else 0
            
            # Check if rate limit exceeded
            if count >= limit:
                response = {
                    'error': 'Rate limit exceeded',
                    'limit': limit,
                    'period': period,
                    'retry_after': period - (int(time.time()) % period)
                }
                return jsonify(response), 429
            
            # Increment the counter
            if count == 0:
                # First request in period, set expiry
                pipeline = redis_client.pipeline()
                pipeline.incr(redis_key)
                pipeline.expire(redis_key, period)
                pipeline.execute()
            else:
                # Just increment
                redis_client.incr(redis_key)
            
            # Execute the function
            return func(*args, **kwargs)
        
        return wrapper
    
    return decorator 