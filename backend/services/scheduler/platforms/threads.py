import logging
import requests


def post_to_threads(postData, image_urls, video_url, access_token):
    """
    Main routing function for Threads posts - decides which specific function to use based on post type.
    Returns unified dict responses.
    """
    try:
        platform = 'threads'
        platform_data = postData.get('platforms', {}).get(platform, {})
        post_type = platform_data.get('postType', 'post')
        content = platform_data.get('specificContent') or postData.get('content', '')

        page_id = platform_data.get('accountId', '')

        if post_type == 'post':
            image_url = image_urls[0] if image_urls else None
            return post_to_threads_post(page_id, content, access_token, image_url)
        else:
            return {"success": False, "error": f"Unsupported post type: {post_type}"}

    except Exception as e:
        logging.error(f"Error in post_to_threads router: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}


def post_to_threads_post(page_id, content, access_token, image_url=None):
    """
    Post content to Threads with optional image.
    Returns unified dict responses.
    """
    result_data = None
    try:
        if image_url:
            # Media post with image
            post_data = {
                'access_token': access_token,
                'media_type': 'IMAGE',
                'image_url': image_url,
                'text': content
            }

            media_response = requests.post(
                f'https://graph.threads.net/v1.0/{page_id}/threads',
                data=post_data
            )

            try:
                media_response.raise_for_status()
            except requests.exceptions.RequestException:
                error_data = media_response.json()
                logging.error(f"Threads media error: {error_data}")
                return {"success": False, "error": f"Failed to create media container: {error_data}"}

            creation_id = media_response.json().get('id')

            publish_data = {
                'access_token': access_token,
                'creation_id': creation_id
            }

            publish_response = requests.post(
                f'https://graph.threads.net/v1.0/{page_id}/threads_publish',
                data=publish_data
            )

            try:
                publish_response.raise_for_status()
            except requests.exceptions.RequestException:
                error_data = publish_response.json()
                logging.error(f"Threads publish error: {error_data}")
                return {"success": False, "error": f"Failed to publish media: {error_data}"}

            result_data = publish_response.json()

        else:
            # Text-only post
            post_data = {
                'access_token': access_token,
                'media_type': 'TEXT',
                'text': content
            }

            response = requests.post(
                f'https://graph.threads.net/v1.0/{page_id}/threads',
                data=post_data
            )

            try:
                response.raise_for_status()
            except requests.exceptions.RequestException:
                error_data = response.json()
                logging.error(f"Threads text post error: {error_data}")
                return {"success": False, "error": f"Failed to post text: {error_data}"}

            creation_id = response.json().get('id')

            publish_data = {
                'access_token': access_token,
                'creation_id': creation_id
            }

            publish_response = requests.post(
                f'https://graph.threads.net/v1.0/{page_id}/threads_publish',
                data=publish_data
            )

            try:
                publish_response.raise_for_status()
            except requests.exceptions.RequestException:
                error_data = publish_response.json()
                logging.error(f"Threads publish error: {error_data}")
                return {"success": False, "error": f"Failed to publish text: {error_data}"}

            result_data = publish_response.json()

        return {
            "success": True,
            "message": "Posted to Threads successfully!",
            "data": result_data
        }

    except Exception as e:
        error_msg = f"Error posting to Threads: {str(e)}"
        logging.error(error_msg, exc_info=True)
        return {"success": False, "error": error_msg}
