import logging
import fal_client
from utils.token_usage import update_token_usage
from utils.image_utils import image_to_data_uri

logger = logging.getLogger(__name__)    

class VeoModel:
    AUDIO_COST = 0.10
    NO_AUDIO_COST = 0.067
    VALID_ASPECTS = {"16:9", "9:16", "1:1"}
    VALID_RESOLUTIONS = {"720p", "1080p"}

    def _call_veo_api(self, user_id, image_url, prompt, aspect_ratio, duration, generate_audio, resolution):
        if aspect_ratio not in self.VALID_ASPECTS or resolution not in self.VALID_RESOLUTIONS:
            return {'success': False, 'error': 'Invalid aspect ratio or resolution'}

        result = fal_client.subscribe(
            "fal-ai/veo3.1/fast/image-to-video",
            arguments={
                "prompt": prompt,
                "image_url": image_url,
                "aspect_ratio": aspect_ratio,
                "duration": duration,
                "generate_audio": generate_audio,
                "resolution": resolution
            },
            with_logs=True,
            on_queue_update=lambda update: None
        )

        if not result or 'video' not in result:
            return {'success': False, 'error': 'No video returned from Veo 3.1'}

        credit_cost = self.AUDIO_COST if generate_audio else self.NO_AUDIO_COST
        update_token_usage(user_id, credit_cost, 'video')

        return {
            'success': True,
            'video_url': result['video']['url'],
            'message': f'Video generated successfully ({resolution}, {duration})'
        }

    def generate_video(self, user_id, prompt, image_file=None, image_url=None,
                       aspect_ratio="16:9", duration="8s", generate_audio=True, resolution="720p"):
        try:
            if not (image_file or image_url):
                return {'success': False, 'error': 'Image input required'}

            image_url = image_to_data_uri(image_file) if image_file else image_url
            return self._call_veo_api(user_id, image_url, prompt, aspect_ratio, duration, generate_audio, resolution)

        except Exception as e:
            logger.exception("Error generating video")
            return {'success': False, 'error': 'Internal server error'}
