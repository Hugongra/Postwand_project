import fal_client
from utils.token_usage import update_token_usage
from utils.image_utils import image_to_data_uri


class SoraModel:
    """Unified handler for OpenAI's Sora 2 base and Pro models."""

    def generate_video(self, user_id, model_type="base", prompt=None,
                       image_file=None, image_url=None,
                       resolution="auto", aspect_ratio="auto", duration=4):

        try:
            if not prompt:
                return {"success": False, "error": "Prompt is required."}
            if not image_file and not image_url:
                return {"success": False, "error": "Either image_file or image_url is required."}

            image_url = image_to_data_uri(image_file)

            model_type = model_type.lower()
    
            endpoint = f"fal-ai/sora-2/image-to-video"
            if model_type == "pro":
                endpoint += "/pro"

          
            result = fal_client.subscribe(
                endpoint,
                arguments={
                    "prompt": prompt,
                    "image_url": image_url,
                    "resolution": resolution,
                    "aspect_ratio": aspect_ratio,
                    "duration": duration
                },
                with_logs=True,
                on_queue_update=lambda update: None
            )

            if not result or "video" not in result:
                return {"success": False, "error": f"No video returned from Sora 2 {model_type.title()}"}

      
            credit_cost = 0.12 if model_type == "base" else 0.18
            update_token_usage(user_id, credit_cost, "video")

            return {
                "success": True,
                "video_url": result["video"]["url"],
                "video_id": result.get("video_id"),
                "message": f"Video generated successfully with Sora 2 {model_type.title()}",
                "resolution": resolution,
                "aspect_ratio": aspect_ratio,
                "duration": duration
            }

        except Exception as e:
            print(f"Error in generate_video: {e}")
            return {"success": False, "error": f"Failed to generate video: {e}"}
