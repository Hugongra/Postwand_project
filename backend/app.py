from flask import Flask, request, jsonify, session, send_from_directory, make_response
from flask_cors import CORS
from datetime import datetime, timezone, timedelta
import requests
import os
from dotenv import load_dotenv
import uuid
import base64
import json
import hmac

import hashlib
from urllib.parse import urlparse
import logging
import stripe

# Disable verbose logging - add this at the top
logging.getLogger("httpx").setLevel(logging.WARNING)


from utils import download_and_encode_image
from utils.translation_middleware import translate_response

from text_generation import (
    generate_posts,
    improve_post,
    generate_post_variations_grok
)

from create_text.text_chat import (
    send_chat_message,
    chat_service,
    handle_text_action
)

from image_generation import (
    generate_image_ideogram
)

# Import the message service
from message_service import (
    get_user_messages,
    reply_to_message,
    hide_show_message,
    delete_message,
    facebook_messages
)

from email_verification import (
    send_verification_code,
    verify_code,
    check_verification_status,
    require_verified_email
)

from decorators.decorators import login_required, subscription_required

from user_auth import (
    auth_status,
    register,
    login,
    logout,
    google_sign_in,
    update_profile,
    change_password,
    update_language
)

from stripe_service import (
    get_subscription_status,
    get_payment_methods,
    get_billing_history,
    cancel_subscription,
    reactivate_subscription,
    update_payment_method,
    create_setup_intent,
    get_trial_status,
    stripe_webhook,
    create_checkout_session,
    get_session_status
)

from brand_extraction.brand_endpoints import brand_bp
 
from viral_ideas_chat import initialize_chat, connect_to_chat
#SUPABASE
from database import get_supabase_client, get_service_role_client
from redis_cache import cache_result
supabase = get_supabase_client()
supabase_admin = get_service_role_client()



# import enviroment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

from rate_limiter import user_rate_limit

from usage.token_usage import get_user_token_usage

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')
app.config['JSON_AS_ASCII'] = False  # Ensure proper UTF-8 encoding in responses

app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['MAX_FORM_MEMORY_SIZE'] = 16 * 1024 * 1024  # 16MB for form data (handles base64 encoded images)
app.config['MAX_FORM_PARTS'] = 1000  # Maximum number of form parts

# Update session configuration
app.config.update(
    SESSION_COOKIE_SECURE=True,  # Set to True for HTTPS
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='None',  # Allow cross-site cookies for different domains
    # SESSION_COOKIE_DOMAIN=None,  # Don't set domain to allow cookies on any domain
    PERMANENT_SESSION_LIFETIME=timedelta(days=30),  # Make sessions last 30 days
    SESSION_COOKIE_NAME='threads_session',
    # Configure file upload limits  
   
)

# Register blueprints
app.register_blueprint(brand_bp)


# CORS configuration for production
CORS(app, 
     supports_credentials=True,
     origins=[
         "https://localhost:5174",           # For local development
         "https://tiktok-dev.local:5174",     # For TikTok Auth
         #"https://accounts.google.com",      # Allow Google OAuth popup
         #"https://app.postwand.io",          # Production frontend
     ],
     allow_headers=["Content-Type", "Authorization", "X-CSRFToken", "X-Requested-With"],
     expose_headers=["Content-Type", "X-CSRFToken"],
     methods=['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT', 'PATCH'],
     max_age=600)


# Add this critical function to make all sessions permanent
@app.before_request
def make_session_permanent():
    session.permanent = True  # This makes the session use PERMANENT_SESSION_LIFETIME

# Add COOP headers to allow Google OAuth popups
@app.after_request
def add_coop_headers(response):
    # For localhost development, completely remove COOP to allow Google OAuth popups
    # For production, use same-origin-allow-popups for better security
    if request.host.startswith('localhost') or 'localhost' in request.host:
        # Don't set COOP header at all for localhost - this is most permissive
        pass
    else:
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    
    # Always set COEP to allow cross-origin resources
    response.headers['Cross-Origin-Embedder-Policy'] = 'unsafe-none'
    return response

APP_URL = "/api"




def check_access_token_expiration(access_token):
    debug_url = (
        f"https://graph.facebook.com/debug_token"
        f"?input_token={access_token}"
        f"&access_token=1058640226029478|f159582a1c1e3b8e8ed6afc062dbb22a"
    )
    fb_response = requests.get(debug_url).json()

    return fb_response.get('data', {}).get('is_valid', False)

def check_instagram_token_validity(access_token):
    try:
        # Use the Instagram Graph API to check token validity
        debug_url = (
            f"https://graph.facebook.com/debug_token"
            f"?input_token={access_token}"
            f"&access_token=1058640226029478|f159582a1c1e3b8e8ed6afc062dbb22a"
        )
        response = requests.get(debug_url).json()
        return response.get('data', {}).get('is_valid', False)
    except Exception as e:
        print(f"Error checking Instagram token: {str(e)}")
        return False




@app.route(f'{APP_URL}/auth/status', methods=['GET', 'OPTIONS'])
def api_auth_status():
    if request.method == 'OPTIONS':
        return '', 204
    return auth_status()

@app.route(f'{APP_URL}/auth/register', methods=['POST'])
def api_register():
    return register()

@app.route(f'{APP_URL}/auth/login', methods=['POST'])
@user_rate_limit(limit=5, period=60)
def api_login():

 
   
    return login()

@app.route(f'{APP_URL}/auth/logout', methods=['POST', 'OPTIONS'])
def api_logout():
    return logout()

@app.route(f'{APP_URL}/auth/google-sign-in', methods=['POST', 'OPTIONS'])
def api_google_sign_in():
    if request.method == 'OPTIONS':
        return '', 204
    return google_sign_in()


@app.route(f'{APP_URL}/send-verification-code', methods=['POST'])
def api_send_verification_code():
    return send_verification_code()

@app.route(f'{APP_URL}/verify-code', methods=['POST'])
def api_verify_code():
    return verify_code()

@app.route(f'{APP_URL}/user/update-profile', methods=['POST'])
@login_required
def api_update_profile():
    return update_profile()

@app.route(f'{APP_URL}/user/change-password', methods=['POST'])
@login_required
def api_change_password():
    return change_password()

@app.route(f'{APP_URL}/user/update-language', methods=['POST'])
@login_required
def api_update_language():
    return update_language()


#META AUTHENTIFICATION
@app.route(f'{APP_URL}/auth/facebook', methods=['POST'])
@login_required
@subscription_required
def facebook_auth():
    from meta_auth.facebook_auth import facebook_auth
    
    return facebook_auth()

@app.route(f'{APP_URL}/auth/instagram', methods=['POST'])
@login_required
@subscription_required
def instagram_auth():
    from meta_auth.instagram_auth import instagram_auth

    return instagram_auth()

@app.route(f'{APP_URL}/auth/youtube', methods=['POST', 'GET'])
@login_required
@subscription_required
def youtube_auth():
    from meta_auth.youtube_auth import youtube_auth
    
    return youtube_auth()

@app.route(f'{APP_URL}/auth/instagram-business/exchange', methods=['GET', 'POST'])
@login_required
@subscription_required
def instagram_business_exchange():

    if request.method == 'POST':
        print(f"POST data: {request.get_json()}")
    
    from meta_auth.instagramLogin import instagram_business_auth
    return instagram_business_auth()

@app.route(f'{APP_URL}/auth/threads', methods=['GET', 'POST'])
@login_required
@subscription_required
def exchange_threads_code():
    from meta_auth.threads_auth import threads_auth

    return threads_auth()

@app.route(f'{APP_URL}/auth/linkedin/exchange', methods=['GET', 'POST'])
@login_required
@subscription_required
def exchange_linkedin_code():
    from meta_auth.linkedin_auth import linkedin_auth
    return linkedin_auth()

@app.route(f'{APP_URL}/auth/tiktok', methods=['GET', 'POST'])
@login_required
@subscription_required
def tiktok_auth():
    from meta_auth.tiktok_auth import tiktok_auth
    return tiktok_auth()

@app.route(f'{APP_URL}/auth/tiktok/callback', methods=['GET'])
def tiktok_callback():
    from meta_auth.tiktok_auth import handle_tiktok_callback
    return handle_tiktok_callback()

@app.route(f'{APP_URL}/tiktok/creator-info', methods=['POST'])
@login_required
def get_tiktok_creator_info():
    """Get TikTok creator info for validation and UI display"""
    try:
       
        from scheduler.tiktok import get_creator_info_for_ui
        result = get_creator_info_for_ui()
        
        if result['success']:return jsonify(result), 200
        else: return jsonify(result), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

#SCHEDULE POSTS ENDPOINTS
@app.route(f'{APP_URL}/schedule', methods=['POST'])
@login_required
@subscription_required
def schedule_endpoint():
    from scheduler.scheduler import create_scheduled_post
    
    return create_scheduled_post()


#TRACK TASKS SCHEDULE POSTS
@app.route(f'{APP_URL}/upload-status/<task_id>', methods=['GET'])
@login_required
@subscription_required
def get_upload_status(task_id):
    """Get status of an upload task"""
    user_id = session.get('user_id')
    
    # Query task status
    task = supabase.table('upload_tasks').select('*').eq('task_id', task_id).eq('user_id', user_id).execute()
    
    if not task.data:
        return jsonify({'error': 'Task not found'}), 404
    
    task_data = task.data[0]
    
    # Parse the result JSON if it exists
    result = None
    if task_data.get('result'):
        try:
            result = json.loads(task_data['result'])
        except:
            result = task_data['result']
    
    return jsonify({
        'task_id': task_data['task_id'],
        'platform': task_data['platform'],
        'post_type': task_data['post_type'],
        'status': task_data['status'],
        'created_at': task_data['created_at'],
        'completed_at': task_data.get('completed_at'),
        'result': result
    })

@app.route(f'{APP_URL}/task/<task_id>', methods=['GET'])
@login_required
@subscription_required
def task_status_endpoint(task_id):

    from scheduler.scheduler import check_task 

    data, status_code = check_task(task_id)
    return jsonify(data), status_code

@app.route(f'{APP_URL}/get_scheduled_posts', methods=['GET'])
@login_required
@cache_result("user_scheduled_posts", expiration=60)  # Cache for 1 minute
@subscription_required
def get_scheduled_posts():
    try:
        user_id = session.get('user_id')
      
        # Fetch all scheduled posts from Supabase for the current user
        result = supabase.table('scheduled_posts')\
            .select('*')\
            .eq('user_id', user_id)\
            .in_('status', ['scheduled', 'published'])\
            .execute()
        
        return jsonify(result.data), 200
    except Exception as e:
        print(f"Error fetching posts: {str(e)}")
        return jsonify({'error': str(e)}), 400
    

@app.route(f'{APP_URL}/reschedule_post', methods=['POST'])
@login_required
@subscription_required
def reschedule_post():
    try:
        data = request.json
        post_id = data.get('post_id')
        new_scheduled_time = data.get('new_scheduled_time')

        if not post_id or not new_scheduled_time:
            return jsonify({'error': 'Post ID and new scheduled time are required'}), 400
        
        # Update the scheduled post
        result = supabase.table('scheduled_posts')\
            .update({'scheduled_time': new_scheduled_time}, returning='minimal', count='exact')\
            .eq('id', post_id)\
            .in_('status', 'scheduled')\
            .execute()
        
        if result.count == 0:
            return jsonify({'error': 'Failed to reschedule post'}), 400
            
        return jsonify({'message': 'Post rescheduled successfully!', 'data': result.data}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400
        

@app.route(f'{APP_URL}/delete_post', methods=['POST'])
@login_required
@subscription_required
def delete_post():
    try:
        data = request.json
        post_id = data.get('post_id')

        if not post_id:
            return jsonify({'error': 'Post ID is required'}), 400
        
        # Delete the post from the database
        result = supabase.table('scheduled_posts')\
            .delete(returning='minimal', count='exact')\
            .eq('id', post_id)\
            .execute()
        
        if result.count == 0:
            return jsonify({'error': 'Failed to delete post'}), 400
            
        return jsonify({'message': 'Post deleted successfully!', 'data': result.data}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400



@app.route(f'{APP_URL}/generate-posts', methods=['POST'])
@login_required
@subscription_required
def api_generate_posts():
    try:
        
        data = request.json
        topic = data.get('topic')
        platform = data.get('platform', 'facebook')
        tone = data.get('tone', 'professional')
        content_type = data.get('contentType', 'post')

        if not topic:
            return jsonify({'error': 'Topic is required'}), 400

        result = generate_posts(topic, platform, tone, content_type)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error in generate_posts: {str(e)}")  # Add this for debugging
        return jsonify({'error': str(e)}), 500



@app.route(f'{APP_URL}/improve-post', methods=['POST'])
@login_required
@subscription_required
def api_improve_post():
    try:
        data = request.json
        original_post = data.get('originalPost')
        platform = data.get('platform', 'facebook')
        tone = data.get('tone', 'friendly')

        if not original_post:
            return jsonify({'error': 'Original post is required'}), 400

        result = improve_post(original_post, platform, tone)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error in improve_post: {str(e)}")  # Add this for debugging
        return jsonify({'error': str(e)}), 500


@app.route(f'{APP_URL}/generate-posts-variations', methods=['POST'])
@login_required
@subscription_required
def api_generate_posts_variations():
    try:
        data = request.json
        topic = data.get('topic')
        platform = data.get('platform', 'facebook')
        tone = data.get('tone', 'professional')
        content_type = data.get('contentType', 'post')
        num_variations = data.get('numVariations', 10)
        brand = data.get('brand', 'no-brand')

        result = generate_post_variations_grok(topic, platform, tone, content_type, num_variations, brand)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error in generate_post_variations: {str(e)}")
        return jsonify({'error': str(e)}), 500


# TEXT CHAT ENDPOINTS
@app.route(f'{APP_URL}/chat/send', methods=['POST'])
@login_required
@subscription_required
def api_send_chat_message():
    try:
        data = request.json
        message = data.get('message')
        mode = data.get('mode', 'ask')  # Default to 'ask' mode
        platforms = data.get('platforms', [])           
        if not message:
            return jsonify({'error': 'Message is required'}), 400
    
        
        # Send message to Grok with mode parameter
        result = send_chat_message(message, mode=mode, platforms=platforms)
        
        if result['success']:
            response_data = {
                'success': True,
                'message': result['message']
            }
            
            # Add structured content if it exists
            if 'structured_content' in result:
                response_data['structured_content'] = result['structured_content']
            
            return jsonify(response_data), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500



@app.route(f'{APP_URL}/chat/history', methods=['GET'])
@login_required
@subscription_required
def api_get_chat_history():
    try:
        user_id = session.get('user_id')
        history = chat_service.get_conversation_history(user_id)
        
        return jsonify({
            'success': True,
            'history': history
        }), 200
        
    except Exception as e:
        print(f"Error getting chat history: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route(f'{APP_URL}/chat/clear', methods=['POST'])
@login_required
@subscription_required
def api_clear_chat_history():
    try:
        user_id = session.get('user_id')
        chat_service.clear_conversation(user_id)
        
        return jsonify({
            'success': True,
            'message': 'Chat history cleared'
        }), 200
        
    except Exception as e:
        print(f"Error clearing chat history: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route(f'{APP_URL}/chat/action', methods=['POST'])
@login_required
@subscription_required
def api_text_action():
    try:
        data = request.json
        action = data.get('action')
        content = data.get('content', '')
        platform = data.get('platform', 'facebook')
        user_input = data.get('user_input', '')  # For "Ask" action
        
        if not action:
            return jsonify({'error': 'Action is required'}), 400
            
        result = handle_text_action(action, content, platform, user_input)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        print(f"Error in text action endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500


#IMAGE GENERATION

@app.route(f'{APP_URL}/generate-image', methods=['POST'])
@login_required
@subscription_required
def api_generate_image():
    try:
        data = request.json
        style = data.get('style', 'realistic')
        text = data.get('text', '')
        text_position = data.get('textPosition', 'bottom')
        prompt = data.get('prompt', '')
        aspect_ratio = data.get('aspectRatio', '1:1')
        num_images = data.get('numImages', 1)

        
        use_openai = data.get('service', 'ideogram') == 'ideogram'
        
        result = generate_image_ideogram(style, text, text_position, prompt, aspect_ratio, num_images)
           
            
        return jsonify(result), 200
     

    except Exception as e:
       return jsonify({'error': str(e), 'status': 'error'}), 500
    

    

# Register after_request handler for translation
@app.after_request
def process_response(response):
    return translate_response(response)


# Token usage endpoint
@app.route(f'{APP_URL}/usage/tokens', methods=['GET'])
@login_required
@subscription_required
def get_token_usage():
    """Get token usage for the current user"""
    user_id = session.get('user_id')
    
        
    usage_data = get_user_token_usage(user_id)
    return jsonify(usage_data)







#IMAGE CHAT


# Auto-save helper function
def auto_save_image(image_url,image_type='generated',chat_id=None):
    """Auto-save image to storage and database - super simple"""
    try:
        user_id = session.get('user_id')
        if not user_id or not image_url:
            return None
            

        # Extract image format and data
        content_type = image_url.split(';')[0].split(':')[1]
        format_type = content_type.split('/')[-1]
        image_data = base64.b64decode(image_url.split(',')[1])
        
        # Generate storage path
        filename = f"{uuid.uuid4()}.{format_type}"
        bucket_path = f"{user_id}/{filename}"
        
        # Upload to Supabase storage
        supabase_admin.storage.from_('chat-images').upload(
            bucket_path,
            image_data,
            file_options={"content-type": content_type}
        )
        
        # Get the permanent URL
        permanent_url = supabase_admin.storage.from_('chat-images').get_public_url(bucket_path)
   
      
        
        # Single query to check if chat record exists and get image_urls
        existing_chat = supabase_admin.table('chat_images').select('id, image_urls').eq('user_id', user_id).eq('chat_id', chat_id).execute()
        
        if existing_chat.data:
            # Update existing chat with new image URL
            chat_record = existing_chat.data[0]
            current_urls = chat_record.get('image_urls', [])
            current_urls.append(permanent_url)
            
            result = supabase.table('chat_images').update({
                'image_urls': current_urls,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).eq('id', chat_record['id']).execute()
        else:
            # Create new chat record
            result = supabase.table('chat_images').insert({
                'user_id': user_id,
                'chat_id': chat_id,
                'image_urls': [permanent_url],
                'created_at': datetime.now(timezone.utc).isoformat(),
                'storage_path': bucket_path,
                'image_type': image_type,

            }).execute()
            
        return {'success': True, 'image_data': result.data[0] if result.data else None}
    except Exception as e:
        print(f"Auto-save failed: {str(e)}")
        return {'success': False, 'error': f"Auto-save failed: {str(e)}"}

@app.route(f'{APP_URL}/edit-image', methods=['POST'])
@login_required
@subscription_required
def api_edit_image():
    try:
        image_file = request.files['image']
        prompt = request.form.get('prompt')
        chat_id = request.form.get('chat_id')
        model = request.form.get('model', 'OpenAI')  # Default to OpenAI if not specified

        if image_file is None:
            return jsonify({'error': 'No image file uploaded', 'success': False}), 400
        
        if not prompt:
            return jsonify({'error': 'Prompt is required', 'success': False}), 400
        
        # Choose editing function based on model
        from edit_image import edit_image, edit_image_flux_kontext
        if model == 'Flux':
            result = edit_image_flux_kontext(image_file, prompt)
        else:
            result = edit_image(image_file, prompt)
        
        # Auto-save the edited image
        if result['success'] and result.get('edited_image_url'):
            save_result = auto_save_image(result['edited_image_url'], 'edited', chat_id)
            if save_result['success']:
                return jsonify({'success': True, 'image_data': save_result['image_data']}), 200
            else:
                return jsonify({'error': save_result.get('error', 'Failed to save image')}), 500
        elif result['success']:
            return jsonify({'success': True, 'message': result.get('message', 'Image edited successfully')}), 200
        else:
            return jsonify({'error': result.get('error', 'Failed to edit image')}), 500
        
    except Exception as e:
        print(f"Error in edit_image endpoint: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500


@app.route(f'{APP_URL}/generate-image-chat', methods=['POST'])
@login_required
@subscription_required
def api_generate_image_chat():
    try:
        data = request.json
        prompt = data.get('prompt')
        chat_id = data.get('chat_id')
        model = data.get('model', 'OpenAI')  # Default to OpenAI if not specified
        if not prompt:
            return jsonify({'error': 'Prompt is required', 'success': False}), 400
        
        # Choose generation function based on model
        from edit_image import generate_image_openai, generate_image_flux_kontext
        if model == 'Flux':
            result = generate_image_flux_kontext(prompt)
        else:
            result = generate_image_openai(prompt)
        
        # Auto-save the generated image
        if result['success'] and result.get('image_url'):
            save_result = auto_save_image(result['image_url'],'generated', chat_id)
            
            if save_result and save_result.get('success'):
                return jsonify({'success': True, 'image_data': save_result['image_data']}), 200
            else:
                return jsonify({'error': 'Failed to save image'}), 500
        else:
            return jsonify({'error': result.get('error', 'Image generation failed')}), 500
        
    except Exception as e:
        print(f"Error in generate_image_openai endpoint: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500


@app.route(f'{APP_URL}/remove-background', methods=['POST'])
@login_required
@subscription_required
def api_remove_background():
    try:
        image_file = request.files['image']
        chat_id = request.form.get('chat_id')

        if image_file is None:
            return jsonify({'error': 'No image file uploaded', 'success': False}), 400
        

        from edit_image import remove_background
        result = remove_background(image_file)

        if result['success'] and result.get('edited_image_url'):
            result = auto_save_image(result['edited_image_url'], 'edited', chat_id)
        
        if result['success']:
            return jsonify({'success': True, 'image_data': result['image_data']}), 200
        else:
            return jsonify({'error': 'Failed to save image'}), 500
    
    except Exception as e:
        print(f"Error removing background: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500


@app.route(f'{APP_URL}/save-chat-image', methods=['POST'])
@login_required
@subscription_required
def save_user_image_simple():
    try:
        data = request.json
        image_url = data.get('image_url')
        image_type = data.get('image_type', 'uploaded')
        chat_id = data.get('chat_id')
        if not image_url:
            return jsonify({'error': 'Image URL is required'}), 400
            
        # Use the auto-save function
        result = auto_save_image(image_url, image_type, chat_id)
        
        if result['success']:
            return jsonify({'success': True, 'image_data': result['image_data']}), 200
        else:
            return jsonify({'error': 'Failed to save image'}), 500
            
    except Exception as e:
        print(f"Error saving image: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route(f'{APP_URL}/save-chat-image-library', methods=['POST'])
@login_required
@subscription_required
def save_chat_image_library():
    try:
        data = request.json
        image_url = data.get('image_url')
  
        if not image_url:
            return jsonify({'error': 'Image URL is required'}), 400
            
        user_id = session.get('user_id')

        # Use the contains operator (@>) to search within the array
        # Note: PostgreSQL array contains operator syntax
        result = supabase.table('chat_images').select('*').eq('user_id', user_id).contains('image_urls', [image_url]).execute()
        
        if not result.data:
            return jsonify({'error': 'Image not found in chat history'}), 404
        
        # Insert into saved_images table
        save_result = supabase_admin.table('saved_images').insert({
            'user_id': user_id,
            'image_url': image_url,
            'storage_path': result.data[0]['storage_path'] if result.data[0].get('storage_path') else None,
            'prompt': 'Saved image',
            'created_at': datetime.now(timezone.utc).isoformat()
        }).execute()

        if save_result.data:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Failed to save image'}), 500
            
    except Exception as e:
        print(f"Error saving image: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route(f'{APP_URL}/chat-images', methods=['GET'])
@login_required
@subscription_required
def get_image_chats():
    """Get all image chat sessions for the user"""
    try:
        user_id = session.get('user_id')
        
        # Get all chat sessions ordered by most recent
        result = supabase.table('chat_images').select('*').eq('user_id', user_id).order('updated_at', desc=True).execute()
        
        # Group by chat_id and format for frontend
        chats = {}
        for record in result.data:
            chat_id = record['chat_id']
            if chat_id not in chats:
                chats[chat_id] = {
                    'chat_id': chat_id,
                    'created_at': record['created_at'],
                    'updated_at': record['updated_at'],
                    'images': record['image_urls'],
                    'image_count': len(record['image_urls'])
                }
        
        # Convert to list and sort by updated_at
        chat_list = list(chats.values())
        chat_list.sort(key=lambda x: x['updated_at'], reverse=True)
        
        return jsonify({'chats': chat_list}), 200
        
    except Exception as e:
        print(f"Error getting image chats: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route(f'{APP_URL}/chat-images/<chat_id>', methods=['GET'])
@login_required
@subscription_required
def load_image_chat(chat_id):
    """Load a specific image chat session"""
    try:
        user_id = session.get('user_id')
        
        # Get the specific chat session
        result = supabase.table('chat_images').select('*').eq('user_id', user_id).eq('chat_id', chat_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Chat session not found'}), 404
        
        chat_data = result.data[0]
        
    
 
        
        return jsonify({
            'chat_id': chat_data['chat_id'],
            'images': chat_data['image_urls'],
            'image_type': chat_data['image_type'],
            'created_at': chat_data['created_at']
        }), 200
        
    except Exception as e:
        print(f"Error loading image chat: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Brand endpoints are now handled by the brand_bp blueprint

#MAIN
if __name__ == '__main__':
 
    
    
    app.run(
        host='0.0.0.0',  
        port=5001,
        debug=True,
        ssl_context=(
           '../localhost+3.pem',      
            '../localhost+3-key.pem'   
        ),
    )

    #For production, get port from environment variable or use default
    #port = int(os.environ.get('PORT', 5000))
    #Listen on all interfaces (0.0.0.0)
    #Don't use SSL context in production - the platform handles HTTPS
    #Disable debug mode
    #app.run(host='0.0.0.0', port=port, debug=False)







