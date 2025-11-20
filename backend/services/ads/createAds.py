from flask import request
from utils.image_utils import save_image_supabase, image_to_data_uri
import models.image.controller as edit_image_controller
from ad_engine.core.ad_copy import generate_ad_copy
from ad_engine.core.ad_visuals import build_visual_prompt
from ad_engine.core.variations import get_variation_index
from database import get_supabase_client
import json
from services.brand_extraction.brands import get_brand  
from ad_engine.factory.auto_generator import generate_auto_ad
supabase = get_supabase_client()


def handle_result(result, user_id):
    save_result = save_image_supabase('ad-images', user_id, result['images'])
    return save_result, 200


def generate_ad(user_id):
    try:
        prompt = request.form.get('prompt')
        image_file = request.files.get('image')
        ad_type = request.form.get('ad_type')
        aspect_ratio = request.form.get('aspect_ratio', '1:1')
        num_images = int(request.form.get('num_images', 1))
        
        # Convert image to data URI for processing
        image = image_to_data_uri(image_file)
        
        # Call the image editing controller
        result = edit_image_controller.edit_image('nano_banana', prompt, aspect_ratio, num_images, image)
        
        return handle_result(result, user_id)
    except Exception as e:
        print(f"Error in generate_ad endpoint: {str(e)}")
        return {'error': str(e), 'success': False}, 500


def generate_copy_service(user_id):
    try:
        data = request.json
        ad_type = data.get('ad_type')
        brand_id = data.get('brand_id')
        
        brand_response, status = get_brand(user_id, brand_id)
        if status != 200:
            return brand_response, status
        brand = brand_response.get('brand', {})   

        return {'copy': generate_ad_copy(ad_type, brand)}, 200
        
    except Exception as e:
        print(f"Error in generate_copy_service: {str(e)}")
        return {'error': str(e)}, 500


def create_ad_with_copy_service(user_id):
    try:
        ad_type = request.form.get('ad_type')
        brand_id = request.form.get('brand_id')
        copy_data = request.form.get('copy_data')
        variation_index = request.form.get('variation_index')
        
        # Image can be either a file upload or a URL string
        image_file = request.files.get('image')
        image_url = request.form.get('image')

        copy_data = json.loads(copy_data)
        
        if variation_index: variation_index = int(variation_index)
        else: variation_index = get_variation_index()
        
        brand_response, status = get_brand(user_id, brand_id)
        if status != 200:
            return brand_response, status
        brand = brand_response.get('brand', {})
        
        visual_prompt = build_visual_prompt(
            ad_type, 
            brand, 
            copy_data, 
            variation_index
        )
        
        # Use file if provided, otherwise use URL
        image_source = image_file if image_file else image_url
        if not image_source:
            return {'error': 'No image provided'}, 400
            
        image_uri = image_to_data_uri(image_source)
        
        result = edit_image_controller.edit_image(
            'nano_banana', 
            visual_prompt, 
            '4:5', 
            1, 
            [image_uri]
        )
        
        if not result.get('success'):
            return {'error': result.get('error', 'Failed to edit image')}, 500
        
        # When num_images=1, NanoBanana returns a single URL string, not a list
        generated_image_url = result['images'] if isinstance(result['images'], str) else result['images'][0]
        
        improved_result = edit_image_controller.improve_image(generated_image_url)
        
        if not improved_result.get('success'):
            return {'error': improved_result.get('error', 'Failed to improve image')}, 500

        # ESRGAN returns 'image' (singular), but handle_result expects 'images' (plural)
        # Convert the response format to match what handle_result expects
        result_for_save = {
            'success': True,
            'images': improved_result['image']  # Note: 'image' from ESRGAN -> 'images' for handle_result
        }
        return handle_result(result_for_save, user_id)        
    except Exception as e:
        print(f"Error in create_ad_with_copy_service: {str(e)}")
        return {'error': str(e)}, 500



def generate_auto_ad_service(user_id):
    try:
        ad_type = request.form.get('ad_type')
        brand_id = request.form.get('brand_id')
        variation_index = request.form.get('variation_index')
        
        # Image can be either a file upload or a URL string
        image_file = request.files.get('image')
        image_url = request.form.get('image')

        brand_response, status = get_brand(user_id, brand_id)
        if status != 200:
            return brand_response, status
        brand = brand_response.get('brand', {})
        
        # Use provided image or fallback to brand's first image
        image_source = image_file if image_file else image_url
        if not image_source and brand.get('image_urls'):
            image_source = brand['image_urls'][0]
        
        return {'ad': generate_auto_ad(ad_type, brand, variation_index, image_source)}, 200
    except Exception as e:
        print(f"Error in generate_auto_ad_service: {str(e)}")
        return {'error': str(e)}, 500