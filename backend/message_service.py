import requests
import os
from flask import jsonify, request, session

import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json
from datetime import datetime, timedelta
from database import get_supabase_client
from redis_cache import cache_result, invalidate_cache
from rate_limiter import user_rate_limit
supabase = get_supabase_client()
# Configure requests to retry on failure
def create_session_with_retries():
    session = requests.Session()
    retries = Retry(
        total=3,  # Total number of retries
        backoff_factor=0.5,  # Backoff factor for sleep between retries
        status_forcelist=[429, 500, 502, 503, 504],  # Status codes to retry on
        allowed_methods=["GET", "POST", "DELETE"],  # HTTP methods to retry
    )
    session.mount('https://', HTTPAdapter(max_retries=retries))
    return session




@user_rate_limit(limit=5, period=60)  # 5 requests per minute for getting messages
def get_user_messages():
    """Get all messages/comments from user's Instagram media with fallback to mock data"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        
        
        try:
            
            # Get Instagram accounts for this user
            ig_accounts = supabase.table('instagram_accounts').select('*').eq('user_id', user_id).execute()
            if not ig_accounts.data:
                print("No Instagram accounts found - using mock data")
                return jsonify("No Instagram accounts found"), 200
            
            all_comments = []
            http_session = create_session_with_retries()
            
            # For each account, get recent media and their comments
            for account in ig_accounts.data:
                account_id = account['account_id']
                access_token = account['access_token']

                try:    
                    # Get recent media for this account with retry
                    media_response = http_session.get(
                        f'https://graph.facebook.com/v22.0/{account_id}/media',
                        params={'access_token': access_token, 'limit': 5},  # Reduced from 10 to 5
                        timeout=5  # Reduced timeout for faster response
                    )
                    
                    if media_response.status_code != 200:
                        print(f"Failed to get media for account {account_id}: {media_response.text}")
                        continue
                    
                    media_data = media_response.json()
                    media_items = media_data.get('data', [])
                    
                    # For each media, get comments
                    for media in media_items:
                        media_id = media['id']
                        
                        try:
                            # Get detailed media info with retry
                            media_details = http_session.get(
                                f'https://graph.facebook.com/v22.0/{media_id}',
                                params={
                                    'access_token': access_token,
                                    'fields': 'id,media_type,media_url,permalink,timestamp,caption'
                                },
                                timeout=5
                            ).json()
                            
                            # Get comments for this media with retry
                            comments_response = http_session.get(
                                f'https://graph.facebook.com/v22.0/{media_id}/comments',
                                params={
                                    'access_token': access_token,
                                    'fields': 'id,text,timestamp',  # Removed username field
                                    'limit': 10  # Reduced from 25 to 10
                                },
                                timeout=5
                            )
                            
                            if comments_response.status_code != 200:
                                print(f"Failed to get comments for media {media_id}: {comments_response.text}")
                                continue
                            
                            comments_data = comments_response.json()
                            comments = comments_data.get('data', [])
                            
                            # Process each comment
                            for comment in comments:
                                try:
                                    # Safely access data with defaults
                                    comment_id = comment.get('id', 'unknown')
                                    comment_text = comment.get('text', '')
                                    comment_timestamp = comment.get('timestamp', '')

                                    comment_data = http_session.get(
                                        f'https://graph.facebook.com/v22.0/{comment_id}',
                                        params={
                                            'access_token': access_token,
                                            'fields': 'like_count,hidden,user,username,parent_id,replies,media'
                                        },
                                        timeout=5
                                    ).json()
                                    # No username - use "Instagram User" as default
                                    comment_author = comment_data.get('user')
                                    if comment_author is None:
                                        comment_author = comment_data.get('username', 'Instagram User')
                                    
                                    comment_like_count = comment_data.get('like_count', 0)
                                    comment_hidden = comment_data.get('hidden', False)
                                    
                                    
                                    # Prepare comment data with safe access
                                    comment_data = {
                                        'message_id': comment_id,
                                        'platform': 'instagram',
                                        'content': comment_text,
                                        'author': comment_author,
                                        'timestamp': comment_timestamp,
                                        'account_id': account['account_id'],
                                        'account_name': account.get('name', 'Unknown Account'),
                                        'media_id': media_id,
                                        'likes': comment_like_count,
                                        'hidden': comment_hidden,
                                        'metadata': {
                                            'replies': comment_data.get('replies', []),
                                            'media': {
                                                'id': media_id,
                                                'media_type': media_details.get('media_type', ''),
                                                'media_url': media_details.get('media_url', ''),
                                                'permalink': media_details.get('permalink', ''),
                                                'timestamp': media_details.get('timestamp', ''),
                                                'caption': media_details.get('caption', ''),
                                           
                                            }
                                        }
                                    }

                                    print(comment_data)
                                    
                                    
                                    
                                    
                                    all_comments.append(comment_data)
                                except Exception as e:
                                    print(f"Error processing comment {comment.get('id', 'unknown')}: {str(e)}")
                                    continue
                        except Exception as e:
                            print(f"Error processing media {media_id}: {str(e)}")
                            continue
                except Exception as e:
                    print(f"Error fetching media for account {account_id}: {str(e)}")
                    continue
            
            # If we couldn't get any comments, provide mock data
            if not all_comments:
                print("No comments found - using mock data")
                return jsonify("No comments found"), 200
                
            # After processing all comments, fetch local replies and add them
            
            
            return jsonify(all_comments), 200
        
        except Exception as e:
            print(f"Error processing Instagram data: {str(e)}")
            # Fall back to mock data
            return jsonify("Error processing Instagram data"), 200
    
    except Exception as e:
        print(f"Error getting messages: {str(e)}")
        # Fall back to mock data on any error
        return jsonify("Error getting messages"), 200

@user_rate_limit(limit=10, period=60)  # 10 replies per minute
def reply_to_message():
    """Reply to a comment/message - direct API call without storing in our DB"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        print(f"Reply request received: {data}")
        
        message_id = data.get('message_id')
        reply_text = data.get('reply')
        
        if not message_id or not reply_text:
            print(f"Missing required fields: message_id={message_id}, reply_text={reply_text}")
            return jsonify({'error': 'Message ID and reply text are required'}), 400
        
        # Get Instagram auth data for this user
        ig_auth = supabase.table('instagram_auth').select('*').eq('user_id', user_id).execute()
        if not ig_auth.data:
            print(f"No Instagram auth found for user {user_id}")
            return jsonify({'error': 'Instagram not connected'}), 400
        
        access_token = ig_auth.data[0]['access_token']
        
        # Send reply to Instagram comment via Graph API
        response = requests.post(
            f'https://graph.facebook.com/v22.0/{message_id}/replies',
            params={
                'access_token': access_token,
                'message': reply_text
            }
        )
        
        if response.status_code != 200:
            print(f"Instagram API error: {response.text}")
            return jsonify({'error': f'Failed to post reply: {response.text}'}), 400
            
        reply_data = response.json()
        print(f"Reply posted successfully: {reply_data}")
        
        # If reply posted successfully, invalidate the messages cache
        invalidate_cache("user_messages")
        
        return jsonify({'success': True, 'reply_id': reply_data.get('id')}), 200
    
    except Exception as e:
        print(f"Error replying to message: {str(e)}")
        return jsonify({'error': str(e)}), 500


@user_rate_limit(limit=20, period=60)  # 20 hide/show operations per minute
def hide_show_message():
    """Hide or show a comment/message - direct API call with no local storage"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        data = request.json
        message_id = data.get('message_id')
        hide = data.get('hide', True)  # Default to hiding
        
        if not message_id:
            return jsonify({'error': 'Message ID is required'}), 400
        
        # Get Instagram auth data for this user
        ig_auth = supabase.table('instagram_auth').select('*').eq('user_id', user_id).execute()
        if not ig_auth.data:
            return jsonify({'error': 'Instagram not connected'}), 400
        
        access_token = ig_auth.data[0]['access_token']
        
        # Hide/show comment on Instagram - direct API call
        response = requests.post(
            f'https://graph.facebook.com/v22.0/{message_id}',
            params={
                'access_token': access_token,
                'hide': 'true' if hide else 'false'
            }
        )
        
        if response.status_code != 200:
            return jsonify({'error': f'Failed to update visibility: {response.text}'}), 400
        
        # If visibility updated successfully, invalidate the messages cache
        invalidate_cache("user_messages")
        
        return jsonify({'success': True}), 200
    
    except Exception as e:
        print(f"Error updating message visibility: {str(e)}")
        return jsonify({'error': str(e)}), 500



@user_rate_limit(limit=20, period=60)  # 5 delete operations per minute
def delete_message():
    """Delete a comment/message from Instagram"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        data = request.json
        message_id = data.get('message_id')
        
        if not message_id:
            return jsonify({'error': 'Message ID is required'}), 400
        
        # Get Instagram auth data for this user
        ig_auth = supabase.table('instagram_auth').select('*').eq('user_id', user_id).execute()
        if not ig_auth.data:
            return jsonify({'error': 'Instagram not connected'}), 400
        
        access_token = ig_auth.data[0]['access_token']
        
        # Delete comment on Instagram - direct API call with retry
        http_session = create_session_with_retries()
        response = http_session.delete(
            f'https://graph.facebook.com/v22.0/{message_id}',
            params={'access_token': access_token},
            timeout=10
        )
        
        if response.status_code != 200:
            return jsonify({'error': f'Failed to delete comment: {response.text}'}), 400
        
        
        
        # If comment deleted successfully, invalidate the messages cache
        invalidate_cache("user_messages")
        
        return jsonify({'success': True}), 200
    
    except Exception as e:
        print(f"Error deleting message: {str(e)}")
        return jsonify({'error': str(e)}), 500

def reply_to_facebook_message():
    """Reply to a Facebook comment"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        print(f"Reply request received: {data}")
        
        message_id = data.get('message_id')
        reply_text = data.get('reply')
        
        if not message_id or not reply_text:
            print(f"Missing required fields: message_id={message_id}, reply_text={reply_text}")
            return jsonify({'error': 'Message ID and reply text are required'}), 400
        
        # Get Facebook auth data for this user
        fb_auth = supabase.table('facebook_auth').select('*').eq('user_id', user_id).execute()
        if not fb_auth.data:
            print(f"No Facebook auth found for user {user_id}")
            return jsonify({'error': 'Facebook not connected'}), 400
        
        access_token = fb_auth.data[0]['access_token']
        
        # Send reply to Facebook comment via Graph API
        http_session = create_session_with_retries()
        response = http_session.post(
            f'https://graph.facebook.com/v22.0/{message_id}/comments',
            params={
                'access_token': access_token,
                'message': reply_text
            }
        )
        
        if response.status_code != 200:
            print(f"Facebook API error: {response.text}")
            return jsonify({'error': f'Failed to post reply: {response.text}'}), 400
            
        reply_data = response.json()
        print(f"Reply posted successfully: {reply_data}")
        
        return jsonify({'success': True, 'reply_id': reply_data.get('id')}), 200
    
    except Exception as e:
        print(f"Error replying to Facebook message: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cache_result("facebook_messages", expiration=60)  # Cache for 1 minute 
def facebook_messages():
    """Get all messages/comments from user's Facebook posts with fallback to mock data"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
       
        
        try:
            # Get Facebook pages for this user
            fb_posts = supabase.table('scheduled_posts').select('*').eq('user_id', user_id).eq('platform', 'facebook').execute()
            if not fb_posts.data:
                print("No Facebook posts found")
                return jsonify([]), 200
            
            # Check if we have any posts with page_token
            posts_with_token = [post for post in fb_posts.data if 'page_token' in post and post['page_token']]
            if not posts_with_token:
                print("No Facebook posts with page_token found")
                return jsonify([]), 200
                
            access_token = posts_with_token[0]['page_token']
            all_comments = []
            http_session = create_session_with_retries()
            
            # For each post, get recent posts and their comments
            for post in fb_posts.data:
                if 'post_creation_id' not in post or not post['post_creation_id']:
                    continue
                    
                post_id = post['post_creation_id']
       
                try:
                    # Get comments for this post
                    posts_response = http_session.get(
                        f'https://graph.facebook.com/v22.0/{post_id}/comments',
                        params={
                            'access_token': access_token, 
                            'limit': 10,
                            'fields': 'from,message,created_time,id'
                        },
                        timeout=10
                    )
                    
                    if posts_response.status_code != 200:
                        print(f"Failed to get posts for post {post_id}: {posts_response.text}")
                        continue
                    
                    comments_data = posts_response.json()
                    comments = comments_data.get('data', [])
                    
                    # Process and add comments to all_comments list
                    for comment in comments:
                        try:
                            # Safely access data with defaults
                            comment_id = comment.get('id', 'unknown')
                            comment_text = comment.get('message', '')
                            comment_timestamp = comment.get('created_time', '')

                            # Get additional comment details
                            comment_details = http_session.get(
                                f'https://graph.facebook.com/v22.0/{comment_id}',
                                params={
                                    'access_token': access_token,
                                    'fields': 'like_count,is_hidden,parent_id,attachment,can_remove,can_hide,from'
                                },
                                timeout=5
                            ).json()
                            
                            # Get author information
                            comment_author = comment.get('from', {}).get('name', 'Facebook User')
                            
                            # Get like count and hidden status
                            comment_like_count = comment_details.get('like_count', 0)
                            comment_hidden = comment_details.get('is_hidden', False)
                            
                            # Prepare comment data with safe access
                            comment_data = {
                                'message_id': comment_id,
                                'platform': 'facebook',
                                'content': comment_text,
                                'author': comment_author,
                                'timestamp': comment_timestamp,
                                'account_id': post.get('page_id', ''),
                                'account_name': post.get('page_name', 'Unknown Page'),
                                'post_id': post_id,
                                'likes': comment_like_count,
                                'hidden': comment_hidden,
                                'parent_id': comment_details.get('parent_id', None),
                                'can_remove': comment_details.get('can_remove', False),
                                'can_hide': comment_details.get('can_hide', False),
                                'metadata': {
                                    'post': {
                                        'id': post_id,
                                        'content': post.get('content', '')
                                    },
                                    'attachment': comment_details.get('attachment', {})
                                }
                            }
                            
                            print(comment_data)
                            all_comments.append(comment_data)
                            
                        except Exception as e:
                            print(f"Error processing comment {comment.get('id', 'unknown')}: {str(e)}")
                            continue
                        
                except Exception as e:
                    print(f"Error getting posts for post {post_id}: {str(e)}")
                    continue
            
           
            return jsonify(all_comments), 200
            
        except Exception as e:
            print(f"Error getting posts: {str(e)}")
            return jsonify([]), 200
            
    except Exception as e:
        print(f"Error getting messages: {str(e)}")
        # Fall back to empty array on any error
        return jsonify([]), 200 