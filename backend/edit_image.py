#!/usr/bin/env python3
import os
import base64
import requests
from openai import OpenAI
from dotenv import load_dotenv
import os
import fal_client
from flask import session
from usage.token_usage import check_image_limit, update_image_usage

load_dotenv()  
# Initialize
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY_IMAGE"))
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")


def edit_image(image_file, prompt):
    """Simple image editing - pass file directly to OpenAI"""
    try:
        user_id = session.get('user_id')
        
        # Check if user is over image token limit
        if check_image_limit(user_id):
            return {
                'success': False,
                'error': 'Monthly image generation limit exceeded. Please upgrade your plan to continue.'
            }
        
        # Reset file pointer and get content
        image_file.seek(0)
        file_content = image_file.read()
        
        # Create proper file tuple with filename and content type
        file_tuple = (image_file.filename, file_content, image_file.content_type)
        
        result = client.images.edit(
            model="gpt-image-1",
            image=file_tuple,
            prompt=prompt,
            n=1
        )
        
        # Update image token usage (1 token per image)
        update_image_usage(user_id, 0.04)
        
        # Get base64 result
        image_b64 = result.data[0].b64_json
        data_url = f"data:image/png;base64,{image_b64}"
        
        return {
            'success': True,
            'edited_image_url': data_url,
            'message': 'Image edited successfully'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to edit image: {str(e)}'
        }

def generate_image_openai(prompt):
    """Simple image generation using OpenAI image-1"""
    try:
        user_id = session.get('user_id')
        
        # Check if user is over image token limit
        if check_image_limit(user_id):
            return {
                'success': False,
                'error': 'Monthly image generation limit exceeded. Please upgrade your plan to continue.'
            }
        
        result = client.images.generate(
            model="gpt-image-1",  
            prompt=prompt,
            size="1024x1024",
            n=1
        )
        
        # Update image token usage (1 token per image)
        update_image_usage(user_id, 0.04)
        
        # Get base64 result - same as edit_image function
        image_b64 = result.data[0].b64_json
        data_url = f"data:image/png;base64,{image_b64}"
        
        return {
            'success': True,
            'image_url': data_url,
            'message': 'Image generated successfully'
        }
        
    except Exception as e:
        print(f"Error in generate_image_openai: {str(e)}")
        return {
            'success': False,
            'error': f'Failed to generate image: {str(e)}'
        }



def remove_background(image_file):
    user_id = session.get('user_id')
    
    # Check if user is over image token limit
    if check_image_limit(user_id):
        return {
            'success': False,
            'error': 'Monthly image generation limit exceeded. Please upgrade your plan to continue.'
        }
    
    image_file.seek(0)
    file_content = image_file.read()
    
    # Create proper file tuple with filename and content type
    file_tuple = (image_file.filename, file_content, image_file.content_type)
    
    try:
        response = requests.post(
            "https://api.stability.ai/v2beta/stable-image/edit/remove-background",
            headers={
                "authorization": f"Bearer {STABILITY_API_KEY}",  
                "accept": "image/*" 
            },
            files={
                "image": file_tuple
            },
            data={
                "output_format": "png"
            }
        )
        
        if response.status_code == 200:
            # Update image token usage (1 token per image)
            update_image_usage(user_id, 0.04)
            
            # Response contains raw image bytes
            image_bytes = response.content
            
            # Convert bytes to base64 for data URL
            image_b64 = base64.b64encode(image_bytes).decode('utf-8')
            data_url = f"data:image/webp;base64,{image_b64}"
            
            return {
                'success': True,
                'edited_image_url': data_url,
                'message': 'Image edited successfully'
            }
        else:
            # When accept is "image/*", errors still come as JSON
            try:
                error_data = response.json()
                error_messages = error_data.get('errors', ['Unknown error'])
                error_message = f'Failed to edit image: {", ".join(error_messages)}'
            except:
                error_message = f'Failed to edit image: HTTP {response.status_code}'
            
            return {
                'success': False,
                'edited_image_url': None,
                'message': error_message
            }
            
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'edited_image_url': None,
            'error': f'Request failed: {str(e)}'
        }
    except Exception as e:
        return {
            'success': False,
            'edited_image_url': None,
            'error': f'Failed to edit image: {str(e)}'
        }
    
def edit_image_flux_kontext(image_file, prompt):
    """Edit image using FLUX Kontext - context-aware image editing"""
    try:
        user_id = session.get('user_id')
        
        # Check if user is over image token limit
        if check_image_limit(user_id):
            return {
                'success': False,
                'error': 'Monthly image generation limit exceeded. Please upgrade your plan to continue.'
            }
        
        # Reset file pointer and get content
        image_file.seek(0)
        file_content = image_file.read()
        
        # Convert image to base64 data URI
        image_b64 = base64.b64encode(file_content).decode('utf-8')
        mime_type = image_file.content_type or 'image/png'
        data_uri = f"data:{mime_type};base64,{image_b64}"
        
        # Use fal_client to submit the request
        result = fal_client.subscribe(
            "fal-ai/flux-pro/kontext",
            arguments={
                "prompt": prompt,
                "image_url": data_uri,  # Using data URI instead of URL
                "guidance_scale": 3.5,
                "num_images": 1,
                "output_format": "png",
                "safety_tolerance": "2"
            },
            with_logs=True,
            on_queue_update=lambda update: None  # Silent queue updates
        )
        
        # Check if we got valid results
        if not result or 'images' not in result or not result['images']:
            return {
                'success': False,
                'error': 'No image returned from FLUX Kontext'
            }
        
        # Update image token usage (1 token per image)
        update_image_usage(user_id, 0.04)
        
        # Download the result image
        image_url = result['images'][0]['url']
        response = requests.get(image_url)
        
        if response.status_code != 200:
            return {
                'success': False,
                'error': f'Failed to download result image: HTTP {response.status_code}'
            }
        
        # Convert to base64 data URL
        result_b64 = base64.b64encode(response.content).decode('utf-8')
        result_data_url = f"data:image/png;base64,{result_b64}"
        
        return {
            'success': True,
            'edited_image_url': result_data_url,
            'message': 'Image edited successfully with FLUX Kontext'
        }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to edit image with FLUX Kontext: {str(e)}'
        }

def generate_image_flux_kontext(prompt):
    """Generate image using FLUX Kontext - text-to-image generation"""
    try:
        user_id = session.get('user_id')
        
        # Check if user is over image token limit
        if check_image_limit(user_id):
            return {
                'success': False,
                'error': 'Monthly image generation limit exceeded. Please upgrade your plan to continue.'
            }
        
        # Use fal_client to submit the request
        result = fal_client.subscribe(
            "fal-ai/flux-pro/kontext/text-to-image",
            arguments={
                "prompt": prompt,
                "guidance_scale": 3.5,
                "num_images": 1,
                "output_format": "png",
                "safety_tolerance": "2",
                "aspect_ratio": "1:1"
            },
            with_logs=True,
            on_queue_update=lambda update: None  # Silent queue updates
        )
        
        # Check if we got valid results
        if not result or 'images' not in result or not result['images']:
            return {
                'success': False,
                'error': 'No image returned from FLUX Kontext'
            }
        
        # Update image token usage (1 token per image)
        update_image_usage(user_id, 0.04)
        
        # Download the result image
        image_url = result['images'][0]['url']
        response = requests.get(image_url)
        
        if response.status_code != 200:
            return {
                'success': False,
                'error': f'Failed to download result image: HTTP {response.status_code}'
            }
        
        # Convert to base64 data URL
        result_b64 = base64.b64encode(response.content).decode('utf-8')
        result_data_url = f"data:image/png;base64,{result_b64}"
        
        return {
            'success': True,
            'image_url': result_data_url,
            'message': 'Image generated successfully with FLUX Kontext'
        }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to generate image with FLUX Kontext: {str(e)}'
        }

def edit_multiple_images_nano_banana(image_files, prompt, num_images=1, output_format="png"):
    """Edit multiple images using Nano Banana - allows combining and editing multiple images"""
    try:
        user_id = session.get('user_id')
        
        # Check if user is over image token limit
        if check_image_limit(user_id):
            return {
                'success': False,
                'error': 'Monthly image generation limit exceeded. Please upgrade your plan to continue.'
            }
        
        # Check if we have at least one image
        if not image_files or len(image_files) == 0:
            return {
                'success': False,
                'error': 'At least one image is required for multi-image editing'
            }
        
        # Convert image files to data URIs
        image_urls = []
        for image_file in image_files:
            # Reset file pointer and get content
            image_file.seek(0)
            file_content = image_file.read()
            
            # Convert image to base64 data URI
            image_b64 = base64.b64encode(file_content).decode('utf-8')
            mime_type = image_file.content_type or 'image/png'
            data_uri = f"data:{mime_type};base64,{image_b64}"
            image_urls.append(data_uri)
        
        # Use fal_client to submit the request
        result = fal_client.subscribe(
            "fal-ai/nano-banana/edit",
            arguments={
                "prompt": prompt,
                "image_urls": image_urls,
                "num_images": num_images,
                "output_format": output_format,
                "sync_mode": True  # Return as data URIs for consistency
            },
            with_logs=True,
            on_queue_update=lambda update: None  # Silent queue updates
        )
        
        # Check if we got valid results
        if not result or 'images' not in result or not result['images']:
            return {
                'success': False,
                'error': 'No image returned from Nano Banana'
            }
        
        # Update image token usage (cost per image generated)
        update_image_usage(user_id, 0.04 * num_images)
        
        # Handle the results - could be URLs or data URIs depending on sync_mode
        edited_images = []
        for image_result in result['images']:
            if 'url' in image_result and image_result['url'].startswith('data:'):
                # Already a data URI
                edited_images.append(image_result['url'])
            elif 'url' in image_result:
                # Download the image and convert to data URI
                response = requests.get(image_result['url'])
                if response.status_code == 200:
                    result_b64 = base64.b64encode(response.content).decode('utf-8')
                    data_url = f"data:image/{output_format};base64,{result_b64}"
                    edited_images.append(data_url)
                else:
                    return {
                        'success': False,
                        'error': f'Failed to download result image: HTTP {response.status_code}'
                    }
        
        response_data = {
            'success': True,
            'edited_images': edited_images,
            'message': 'Images edited successfully with Nano Banana'
        }
        
        # Add description if available
        if 'description' in result:
            response_data['description'] = result['description']
        
        return response_data
            
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to edit images with Nano Banana: {str(e)}'
        }

if __name__ == "__main__":
    # Create a mock file object with the required attributes
    class MockFile:
        def __init__(self, filename):
            self.filename = filename
            self.content_type = "image/png"
            self.file = open(filename, "rb")
        
        def seek(self, pos):
            self.file.seek(pos)
        
        def read(self):
            return self.file.read()
    
    # Test with FLUX Kontext image editing
    image_file = MockFile("download.png")
    prompt = "Make the background green"  # Example prompt
    
    result = edit_image_flux_kontext(image_file, prompt)
    if result['success']:
        # Convert base64 to image and save
        import base64
        image_b64 = result['edited_image_url'].split(',')[1]
        image_bytes = base64.b64decode(image_b64)
        with open("flux_kontext_edited.png", "wb") as f:
            f.write(image_bytes)
        print(f"Image edited with FLUX Kontext and saved as: flux_kontext_edited.png")
    else:
        print(f"Error: {result.get('message', result.get('error', 'Unknown error'))}")