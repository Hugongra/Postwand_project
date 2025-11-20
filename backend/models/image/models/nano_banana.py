import fal_client

class NanoBananaModel:
    def _call_fal_api(self, prompt, aspect_ratio="1:1", num_images=1, images=None):
   
        return fal_client.subscribe(
            "fal-ai/nano-banana/edit",
            arguments={
                "prompt": prompt,
                "image_urls": images,
                "num_images": num_images,
                "output_format": "png",
                "sync_mode": False,
                "aspect_ratio": aspect_ratio
            },
            with_logs=True,
            on_queue_update=lambda update: None
        )
    
    def process_image(self, prompt, aspect_ratio, num_images, images):
        try:
            if not isinstance(images, list):
                images = [images]
            
            result = self._call_fal_api(prompt, aspect_ratio, num_images, images)

            if not result['images']:
                return {'success': False, 'error': 'Error editing image with Nano Banana'}

            #update_token_usage(user_id, 0.04 * num_images, 'image')

            # Extract URLs from the response - Fal AI returns [{"url": "..."}, ...]
            image_urls = [img['url'] for img in result['images']]
            
            return {
                'success': True, 
                'images': image_urls[0] if num_images == 1 else image_urls,
                'message': 'Image edited successfully with Nano Banana'
            }
                
            

        except Exception as e:
            print(f"Error in process_image: {str(e)}")
            return {'success': False, 'error': f'Failed to process image with Nano Banana: {str(e)}'}