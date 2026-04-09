
import os
import requests
import base64
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

class OpenAIModel:
    def __init__(self):
        self.base_url = "https://api.openai.com/v1/images"
        self.edit_url = f"{self.base_url}/edits"
        self.generate_url = f"{self.base_url}/generations"

    def _get_api_key(self):
        key = os.getenv("OPENAI_API_KEY_IMAGE") or os.getenv("OPENAI_API_KEY")
        if not key:
            raise ValueError("OPENAI_API_KEY is not set in .env")
        return key

    def process_image(self, prompt, aspect_ratio, num_images, images):
        try:
            headers = {"Authorization": f"Bearer {self._get_api_key()}"}
            params = {
                'model': 'gpt-image-1',
                'prompt': prompt,
                'n': num_images,
                'quality': 'medium',
                'size': aspect_ratio,
                'output_format': 'png'
            }

            if images is not None:
                url = self.edit_url
                if images.startswith("data:image"):
                    images = images.split(",")[1]
                image_bytes = base64.b64decode(images)
                files = {'image': ('image.png', BytesIO(image_bytes), 'image/png')}
                response = requests.post(url, headers=headers, files=files, data=params)
            else:
                url = self.generate_url
                headers["Content-Type"] = "application/json"
                response = requests.post(url, headers=headers, json=params)
            response.raise_for_status()
            result = response.json()
         
            #price = 0.042 if size == "1024x1024" else 0.063
            #update_token_usage(user_id, price, 'image')
            
            if result['data']:
                image_result = result['data'][0].get('b64_json')
                image_64 = f"data:image/png;base64,{image_result}"
                return {
                    'success': True, 
                    'images': image_64, 
                    'message': 'Image generated successfully'
                }
            
            return {'success': False, 'error': 'No image data in response'}

        except Exception as e:
            print(f"Error in process_image: {str(e)}")
            return {'success': False, 'error': f'Failed to process image: {str(e)}'}
