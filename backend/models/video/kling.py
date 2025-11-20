import fal_client
from utils.token_usage import update_token_usage
from utils.image_utils import image_to_data_uri

class KlingModel:
    """Unified handler for Kling 2.1 Master and Pro image-to-video generation."""

    def generate_video(self, user_id, model_type, prompt,
                       image_file=None, image_url=None,
                       duration=5, aspect_ratio=None, tail_image_url=None,
                       negative_prompt="blur, distort, and low quality",
                       cfg_scale=0.5):


        try:
            if not image_file and not image_url:
                return {"success": False, "error": "Either image_file or image_url is required."}

            # Convert file to data URI if provided
            if image_file:
                image_url = image_to_data_uri(image_file)

            # Base arguments for both models
            args = {
                "prompt": prompt,
                "image_url": image_url,
                "duration": duration,
                "negative_prompt": negative_prompt,
                "cfg_scale": cfg_scale
            }

            # Add Pro-only fields
            if model_type == "pro":
                if aspect_ratio:
                    args["aspect_ratio"] = aspect_ratio
                if tail_image_url:
                    args["tail_image_url"] = tail_image_url

            endpoint = f"fal-ai/kling-video/v2.1/{model_type}/image-to-video"

            result = fal_client.subscribe(
                endpoint,
                arguments=args,
                with_logs=True,
                on_queue_update=lambda update: None
            )

            if not result or "video" not in result:
                return {"success": False, "error": f"No video returned from Kling 2.1 {model_type.title()}"}

            # Track credit usage (Pro may cost more)
            credit_cost = 0.10 if model_type == "master" else 0.15
            update_token_usage(user_id, credit_cost, "video")

            return {
                "success": True,
                "video_url": result["video"]["url"],
                "message": f"Video generated successfully with Kling 2.1 {model_type.title()}",
                "duration": duration,
                "cfg_scale": cfg_scale,
                "aspect_ratio": aspect_ratio,
            }

        except Exception as e:
            print(f"Error in generate_video: {e}")
            return {"success": False, "error": f"Failed to generate video: {e}"}
