import fal_client
import requests
class FluxModel:
    def process_image(self, prompt, aspect_ratio="1:1", num_images=1, images=None):
        try:
            arguments = {
                "prompt": prompt,
                "guidance_scale": 3.5,
                "num_images": num_images,
                "output_format": "png",
                "safety_tolerance": "2",
                "aspect_ratio": aspect_ratio
            }
            if images:
                type = "kontext"
                arguments["image_url"] = images
            else:
                type = "kontext/text-to-image"
            
            result = fal_client.subscribe(
                f"fal-ai/flux-pro/{type}",
                arguments=arguments,
                with_logs=True,
                on_queue_update=lambda update: None
            )
            
            #update_token_usage(user_id, 0.04, 'image')
            
            return {
                'success': True, 
                'images': result['images'][0]['url'], 
                'message': 'Image generated successfully with FLUX Kontext'
            }

        except requests.exceptions.RequestException as e:
            print(f"Error in process_image: {str(e)}")
            return {'success': False, 'error': f'FLUX Kontext request failed: {str(e)}'}
        except Exception as e:
            print(f"Error in process_image: {str(e)}")
            return {'success': False, 'error': f'Failed to process image with FLUX Kontext: {str(e)}'}