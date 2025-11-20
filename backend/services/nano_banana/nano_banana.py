#!/usr/bin/env python3
import os
import sys
import base64
import requests
import fal_client
from dotenv import load_dotenv
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from utils.image_utils import image_to_data_uri

load_dotenv()

def edit_images_nano_banana(image_files, prompt, num_images=1, output_format="png"):
    """Edit multiple images using Nano Banana - allows combining and editing multiple images"""
    try:
        # try:
        #     user_id = session.get('user_id')
        # except RuntimeError:
        #     user_id = 'test_user_123'  # Use test user when running standalone
        
        # # Check if user is over image token limit
        # if check_image_limit(user_id):
        #     return {
        #         'success': False,
        #         'error': 'Monthly image generation limit exceeded. Please upgrade your plan to continue.'
        #     }
        
        # Check if we have at least one image
        if not image_files or len(image_files) == 0:
            return {
                'success': False,
                'error': 'At least one image is required for multi-image editing'
            }
        
        # Convert image files to data URIs
        image_urls = []
        for image_file in image_files:
            data_uri = image_to_data_uri(image_file)
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
        
        # # Update image token usage (cost per image generated)
        # update_image_usage(user_id, 0.04 * num_images)
        
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
                    data_url = image_to_data_uri(response.content)
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
    # Test function - create mock file objects
    class MockFile:
        def __init__(self, filename):
            self.filename = filename
            self.content_type = "image/png"
            self.file = open(filename, "rb")
        
        def seek(self, pos):
            self.file.seek(pos)
        
        def read(self):
            return self.file.read()
    
    # Test with multiple images
    image_files = [MockFile("beats.png")]
    prompt = """
     Create an ad image for this product:
     Big header text: Beats
     Small text: Beats is a brand of headphones and speakers.
     Feataures: $100, 10 hour battery life, available in black and white

    the image should contain the header and subheader. A call to action and feattures around the product.
    """
    
    result = edit_images_nano_banana(image_files, prompt)
    if result['success']:
        print(f"Successfully edited {len(result['edited_images'])} images")
        if 'description' in result:
            print(f"Description: {result['description']}")
        
        # Save the first edited image
        if result['edited_images']:
            image_b64 = result['edited_images'][0].split(',')[1]
            image_bytes = base64.b64decode(image_b64)
            with open("nano_banana_edited.png", "wb") as f:
                f.write(image_bytes)
            print("First edited image saved as: nano_banana_edited.png")
    else:
        print(f"Error: {result.get('error', 'Unknown error')}")
