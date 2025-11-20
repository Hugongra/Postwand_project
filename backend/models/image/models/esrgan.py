import fal_client

class ESRGANModel:
    def _call_fal_api(self, image_url):
        """
        Internal helper to call the FAL ESRGAN upscale API.
        """
        return fal_client.subscribe(
            "fal-ai/esrgan",
            arguments={
                "image_url": image_url,
                "scale": 2,  
                "model": "RealESRGAN_x4plus",  
                "output_format": "png"  
            },
            with_logs=True,
            on_queue_update=lambda update: None
        )

    def improve_quality(self, image_url):
        """
        Upscales an image using the FAL ESRGAN model.
        Returns a dictionary with success flag, image URL, and message.
        """
        try:
            result = self._call_fal_api(image_url)

            if not result.get('image'):
                return {'success': False, 'error': 'Error upscaling image with ESRGAN'}

            upscaled_url = result['image']['url']

            return {
                'success': True,
                'image': upscaled_url,
                'message': 'Image upscaled successfully with ESRGAN'
            }

        except Exception as e:
            print(f"Error in upscale_image: {str(e)}")
            return {'success': False, 'error': f'Failed to upscale image with ESRGAN: {str(e)}'}
