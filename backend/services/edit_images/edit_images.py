from flask import  request
from utils.image_utils import save_image_supabase, image_to_data_uri
import models.image.controller as edit_image_controller
from database import get_supabase_client
supabase = get_supabase_client()    
def convert_aspect_ratio(model, aspect_ratio):
    if model == 'openai':
        return '1024x1024' if aspect_ratio == '1:1' else '1024x1536'
    elif model == 'flux':
        return {'1:1': '1:1', '4:5': '3:4'}.get(aspect_ratio, '9:16')
    else:  
        return aspect_ratio


def handle_result(result, user_id, chat_id):
    if not result.get('success', False): return result, 500
    save_result = save_image_supabase('chat-images', f"{user_id}/{chat_id}", result['images'])
    return save_result, 200

def edit_image(user_id, model):
    try:
        prompt = request.form.get('prompt')
        image_url = request.form.get('image_url')
        image_file = request.files.get('image')
        chat_id = request.form.get('chat_id' or None)
        aspect_ratio = request.form.get('aspect_ratio')
        num_images = request.form.get('num_images', 1)
        # Still need to convert here for passing to the controller
        image = image_to_data_uri(image_file or image_url)
        result = edit_image_controller.edit_image(model, prompt, aspect_ratio, num_images, image)

        return handle_result(result, user_id, chat_id)
    except Exception as e:
        print(f"Error in edit_image endpoint: {str(e)}")
        return {'error': str(e), 'success': False}, 500

def generate_image(user_id, model):
    try:
        prompt = request.form.get('prompt')
        chat_id = request.form.get('chat_id' or None)
        aspect_ratio = request.form.get('aspect_ratio')
        num_images = request.form.get('num_images', 1)
        result = edit_image_controller.generate_image(model, prompt, aspect_ratio, num_images)
        
        return handle_result(result, user_id, chat_id)
    except Exception as e:
        print(f"Error in generate image endpoint: {str(e)}")
        return {'error': str(e), 'success': False}, 500


def remove_background(user_id):
    try:
        image_file = request.files['image']
        chat_id = request.form.get('chat_id' or None)

        # Still need to convert here for passing to the controller
        image = image_to_data_uri(image_file)
        result = edit_image_controller.remove_background(image)
        return handle_result(result, user_id, chat_id)
    except Exception as e:
        print(f"Error removing image: {str(e)}")
        return {'error': str(e), 'success': False}, 500



def get_chat_sessions(user_id):
    try:
        folders = supabase.storage.from_('chat-images').list(path=user_id)
        
        if not folders: return {'error': 'No chats found'}, 404
        
        chat_ids = [folder['name'] for folder in folders if folder.get('name')]
        
        return {'success': True, 'chats': chat_ids}, 200
    except Exception as e:
        print(f"Error getting chat sessions: {str(e)}")
        return {'error': str(e), 'success': False}, 500

def get_chat_session(user_id, chat_id):
    try:
        # List all images in the specific chat folder
        images = supabase.storage.from_('chat-images').list(path=f"{user_id}/{chat_id}")
        
        if not images:
            return {'error': 'Chat not found'}, 404
        
        image_urls = [
            supabase.storage.from_('chat-images').get_public_url(f"{user_id}/{chat_id}/{img['name']}")
            for img in images if img.get('name')
        ]
        
        return {'success': True, 'images': image_urls}, 200
    except Exception as e:
        print(f"Error loading chat session: {str(e)}")
        return {'error': str(e), 'success': False}, 500