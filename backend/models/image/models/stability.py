import os
import requests
from dotenv import load_dotenv

load_dotenv()
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")

class StabilityModel:
    def remove_background(self, image):
        try:
            image.seek(0)
            file_content = image.read()
            file_tuple = (image.filename, file_content, image.content_type)

            response = requests.post(
                "https://api.stability.ai/v2beta/stable-image/edit/remove-background",
                headers={
                    "authorization": f"Bearer {STABILITY_API_KEY}",
                    "accept": "image/*"
                },
                files={"image": file_tuple},
                data={"output_format": "png"}
            )
            response.raise_for_status()

            #update_token_usage(user_id, 0.04, 'image')

            return {
                'success': True, 
                'image': response.content, 
                'message': 'Background removed successfully'
            }, 200

        except requests.exceptions.RequestException as e:
            print(f"Error in remove_background: {str(e)}")
            return {'success': False, 'error': f'Request failed: {str(e)}'}
        except Exception as e:
            print(f"Error in remove_background: {str(e)}")
            return {'success': False, 'error': f'Failed to remove background: {str(e)}'}
