import os
import requests

FB_APP_ID = os.getenv('FB_APP_ID')
FB_APP_SECRET = os.getenv('FB_APP_SECRET')

def get_long_lived_token(short_lived_token):
    """Exchange short-lived token for long-lived token
    Used by Facebook, Instagram, and Threads authentication
    """
    url = f"https://graph.facebook.com/v23.0/oauth/access_token"
    params = {
        "grant_type": "fb_exchange_token",
        "client_id": FB_APP_ID,
        "client_secret": FB_APP_SECRET,
        "fb_exchange_token": short_lived_token
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if "access_token" not in data:
        raise Exception(f"Failed to exchange token: {data.get('error', {}).get('message', 'Unknown error')}")
    
    return data["access_token"] 