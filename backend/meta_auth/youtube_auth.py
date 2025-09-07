from flask import request, jsonify, session
from datetime import datetime, timezone
import requests
import os

from database import get_supabase_client
supabase = get_supabase_client()
from utils import download_and_encode_image

# YouTube API configuration
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
GOOGLE_CLIENT_ID_YOUTUBE = os.getenv('GOOGLE_CLIENT_ID_YOUTUBE')
GOOGLE_CLIENT_SECRET_YOUTUBE = os.getenv('GOOGLE_CLIENT_SECRET_YOUTUBE')

def get_youtube_channels(access_token):
    """Get user's YouTube channels"""
    print("\n=== FETCHING YOUTUBE CHANNELS ===")
    
    # Get user's channel information
    url = "https://www.googleapis.com/youtube/v3/channels"
    params = {
        "part": "snippet,statistics,brandingSettings",
        "mine": "true"
    }
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }
    
    print(f"Making request to: {url}")
    print(f"With params: {params}")
    
    response = requests.get(url, params=params, headers=headers)
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
    
    data = response.json()
    
    if "error" in data:
        error_msg = f"Failed to get YouTube channels: {data['error'].get('message', 'Unknown error')}"
        raise Exception(error_msg)
    
    if "items" not in data or not data["items"]:
        # User might not have a channel yet
        return []
    
    # Format the channels data for frontend
    channels = []
    for channel in data["items"]:
        snippet = channel.get("snippet", {})
        statistics = channel.get("statistics", {})
        
        channel_info = {
            "id": channel["id"],
            "title": snippet.get("title", "YouTube Channel"),
            "description": snippet.get("description", ""),
            "subscriber_count": statistics.get("subscriberCount", "0"),
            "video_count": statistics.get("videoCount", "0"),
            "view_count": statistics.get("viewCount", "0"),
            "profile_picture": snippet.get("thumbnails", {}).get("high", {}).get("url") or 
                             snippet.get("thumbnails", {}).get("default", {}).get("url"),
            "custom_url": snippet.get("customUrl", "")
        }
        channels.append(channel_info)
    
    print(f"Found {len(channels)} YouTube channels")
    return channels

def save_youtube_channels(access_token, refresh_token, channels):
    """Save YouTube channel data to database"""
    try:
        print(f"Saving {len(channels)} YouTube channels")
        
        user_id = session.get('user_id')
        if not user_id:
            print("ERROR: No user_id in session")
            return jsonify({'error': 'User not authenticated'}), 401
        
        # Get existing channels for this user
        existing_channels = supabase.table('youtube_channels').select('channel_id').eq('user_id', user_id).execute()
        existing_channel_ids = [ch['channel_id'] for ch in existing_channels.data] if existing_channels.data else []
        
        # Filter out channels that already exist
        new_channels = [channel for channel in channels if channel['id'] not in existing_channel_ids]
        
        # Update existing channels with new tokens
        if existing_channels.data:
            for existing_channel in existing_channels.data:
                supabase.table('youtube_channels').update({
                    'access_token': access_token,
                    'refresh_token': refresh_token
                }).eq('user_id', user_id).eq('channel_id', existing_channel['channel_id']).execute()
            print(f"Updated tokens for {len(existing_channels.data)} existing channels")
        
        # Insert only new channels
        if new_channels:
            channels_data = []
            
            for channel in new_channels:
                try:
                    profile_pic = None
                    if channel.get('profile_picture'):
                        profile_pic = download_and_encode_image(channel['profile_picture'])
                    
                    channel_data = {
                        'user_id': user_id,
                        'channel_id': channel['id'],
                        'access_token': access_token,
                        'refresh_token': refresh_token,
                        'title': channel['title'],
                        'description': channel['description'],
                        'profile_picture': profile_pic,
                        'custom_url': channel.get('custom_url'),
                        'created_at': datetime.now(timezone.utc).isoformat()
                    }
                    channels_data.append(channel_data)
                except Exception as e:
                    print(f"Error processing channel {channel['title']}: {str(e)}")
            
            if channels_data:
                try:
                    channel_result = supabase.table('youtube_channels').insert(channels_data).execute()
                    print(f"Inserted {len(channels_data)} new YouTube channels")
                except Exception as e:
                    print(f"Error saving YouTube channels: {str(e)}")
                    return jsonify({'error': f'Failed to save YouTube channels: {str(e)}'}), 500
            else:
                print("No channels to insert after processing")
        else:
            print("No new channels to add")
        
        print("Returning success response to client")
        return jsonify({
            'success': True,
            'message': 'YouTube authentication updated successfully',
            'data': {
                'user_id': user_id,
                'channels': channels
            }
        })
        
    except Exception as e:
        print(f"Error in save_youtube_channels: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

def exchange_code_for_tokens(code, redirect_uri):
    """Exchange authorization code for access and refresh tokens"""
    token_url = "https://oauth2.googleapis.com/token"
    
    data = {
        'client_id': GOOGLE_CLIENT_ID_YOUTUBE,
        'client_secret': GOOGLE_CLIENT_SECRET_YOUTUBE,
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': redirect_uri
    }
    
    response = requests.post(token_url, data=data)
    
    if response.status_code != 200:
        raise Exception(f"Failed to exchange code for tokens: {response.text}")
    
    return response.json()

def youtube_auth():
    """Handle YouTube authentication and channel retrieval"""
    print("\n=== YOUTUBE AUTH REQUEST ===")
    print(f"Request method: {request.method}")
    
    # Handle different request methods
    if request.method == 'GET':
        # OAuth callback from Google (GET request with URL parameters)
        auth_code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        
        if error:
            print(f"OAuth error: {error}")
            return jsonify({"error": f"OAuth error: {error}"}), 400
            
        # For GET requests, we need to determine the redirect URI
        # This should match what was used in the original auth request
        redirect_uri = f"{request.scheme}://{request.host}/api/auth/youtube"
        
        # Set default values for GET requests
        access_token = None
        refresh_token = None
        
    else:
        # POST request from frontend with JSON data
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Check if we're receiving an authorization code (new OAuth flow)
        auth_code = data.get('code')
        redirect_uri = data.get('redirectUri')
        
        # Or if we're receiving tokens directly (legacy)
        access_token = data.get('accessToken')
        refresh_token = data.get('refreshToken')
    
    print(f"Auth code received: {bool(auth_code)}")
    print(f"Access token received: {bool(access_token)}")
    print(f"Refresh token received: {bool(refresh_token)}")
    print(f"Redirect URI: {redirect_uri}")
    
    try:
        if auth_code:
            # New flow: Exchange authorization code for tokens
            print("Exchanging authorization code for tokens...")
            
            if not redirect_uri:
                return jsonify({"error": "Redirect URI is required"}), 400
            
            token_data = exchange_code_for_tokens(auth_code, redirect_uri)
            access_token = token_data.get('access_token')
            refresh_token = token_data.get('refresh_token')
            
            if not access_token:
                return jsonify({"error": "Failed to obtain access token"}), 400
                
        elif access_token:
            # Legacy flow: Use provided tokens directly
            print("Using provided access token...")
        else:
            print("ERROR: No access token or authorization code provided")
            return jsonify({"error": "No access token or authorization code provided"}), 400
        
        # 1. Get YouTube channels
        channels = get_youtube_channels(access_token)
        print(f"Retrieved {len(channels)} channels")
        
        # 2. Store the tokens and channel data in database
        response = save_youtube_channels(access_token, refresh_token, channels)
        
        # 3. For GET requests (OAuth callback), return a success page or redirect
        if request.method == 'GET':
            # Return a simple HTML page that will close the popup and notify the parent
            html_response = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>YouTube Authentication</title>
            </head>
            <body>
                <script>
                    try {
                        // Send success message to parent window
                        window.opener.postMessage({
                            type: 'YOUTUBE_AUTH_SUCCESS',
                            data: 'YouTube authentication completed successfully'
                        }, '*');
                        
                        // Close the popup
                        window.close();
                    } catch (error) {
                        console.error('Error communicating with parent window:', error);
                        document.body.innerHTML = '<h2>Authentication successful! You can close this window.</h2>';
                    }
                </script>
                <h2>YouTube authentication successful!</h2>
                <p>This window should close automatically. If it doesn't, you can close it manually.</p>
            </body>
            </html>
            """
            from flask import Response
            return Response(html_response, mimetype='text/html')
        
        # For POST requests, return JSON response
        return response
        
    except Exception as e:
        print(f"Error in youtube_auth: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        if request.method == 'GET':
            # For GET requests, return an HTML error page
            html_response = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>YouTube Authentication Error</title>
            </head>
            <body>
                <script>
                    try {{
                        // Send error message to parent window
                        window.opener.postMessage({{
                            type: 'YOUTUBE_AUTH_ERROR',
                            error: '{str(e)}'
                        }}, '*');
                        
                        // Close the popup
                        window.close();
                    }} catch (error) {{
                        console.error('Error communicating with parent window:', error);
                        document.body.innerHTML = '<h2>Authentication failed: {str(e)}</h2>';
                    }}
                </script>
                <h2>YouTube authentication failed</h2>
                <p>Error: {str(e)}</p>
                <p>You can close this window and try again.</p>
            </body>
            </html>
            """
            from flask import Response
            return Response(html_response, mimetype='text/html')
        
        return jsonify({"error": str(e)}), 500
