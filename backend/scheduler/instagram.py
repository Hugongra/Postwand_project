import logging
import requests
import json
import time
import os

URL = "https://graph.facebook.com/v22.0/"


def post_to_instagram(host_url, page_id, content, access_token, image_url=None, location_id=None):
    """
    Post content to Instagram with optional image and location
    
    Args:
        page_id (str): The Instagram account ID
        content (str): The content to post
        access_token (str): The access token
        image_url (str, optional): URL of image to include in post
        location_id (str, optional): ID of location to tag in post
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    result_data = None
    try:
        if not image_url:
            return False, "Instagram requires an image for posts", None
            
        # Prepare container data
        container_data = {
            'image_url': image_url,
            'caption': content,
            'access_token': access_token
        }
        
        # Add location if provided
        if location_id:
            container_data['location_id'] = location_id
        
        # Step 1: Create media container
        create_container_response = requests.post(
            f'{URL}/{page_id}/media',
            data=container_data
        )

        if not create_container_response.ok:
            return False, create_container_response.json(), None

        creation_id = create_container_response.json().get('id')
        
        # Step 2: Publish the container
        publish_response = requests.post(
            f'{URL}/{page_id}/media_publish',
            data={
                'creation_id': creation_id,
                'access_token': access_token
            }
        )
        
        if publish_response.ok:
            result_data = publish_response.json()
            
        if not publish_response.ok:
            return False, publish_response.json(), None
            
        return True, {"message": "Posted to Instagram successfully!"}, result_data
        
    except Exception as e:
        logging.error(f"Error posting to Instagram: {str(e)}")
        return False, str(e), None


def post_to_instagram_carousel(host_url, page_id, content, access_token, image_urls, location_id=None):
    """
    Post a carousel with multiple images to Instagram
    
    Args:
        host_url (str): The host URL (graph.facebook.com or graph.instagram.com)
        page_id (str): The Instagram account ID
        content (str): The caption for the carousel
        access_token (str): The access token
        image_urls (list): List of image URLs to include in carousel
        location_id (str, optional): ID of location to tag in post
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    result_data = None
    try:
        if not image_urls or len(image_urls) < 2:
            return False, "Instagram carousel requires at least 2 images", None
            
        if len(image_urls) > 10:
            return False, "Instagram carousel supports maximum 10 images", None
        
        logging.info(f"Creating Instagram carousel with {len(image_urls)} images")
        
        # Step 1: Create media containers for each image
        container_ids = []
        for i, image_url in enumerate(image_urls):
            logging.info(f"Creating container for image {i+1}/{len(image_urls)}: {image_url}")
            
            container_data = {
                'image_url': image_url,
                'is_carousel_item': 'true',
                'access_token': access_token
            }
            
            # Create media container
            container_response = requests.post(
                f'https://{host_url}/v22.0/{page_id}/media',
                data=container_data
            )
            
            if not container_response.ok:
                error_msg = f"Failed to create container for image {i+1}: {container_response.text}"
                logging.error(error_msg)
                return False, error_msg, None
                
            container_id = container_response.json().get('id')
            if container_id:
                container_ids.append(container_id)
                logging.info(f"Successfully created container for image {i+1}, container_id: {container_id}")
            else:
                error_msg = f"No container ID returned for image {i+1}"
                logging.error(error_msg)
                return False, error_msg, None
        
        # Step 2: Create the carousel container
        carousel_data = {
            'media_type': 'CAROUSEL',
            'children': json.dumps(container_ids),  # Must be JSON array, not comma-separated string
            'caption': content,
            'access_token': access_token
        }
        
        # Add location if provided
        if location_id:
            carousel_data['location_id'] = location_id
            logging.info(f"Adding location {location_id} to Instagram carousel")
        
        logging.info(f"Creating carousel container with child containers: {container_ids}")
        
        carousel_response = requests.post(
            f'https://{host_url}/v22.0/{page_id}/media',
            data=carousel_data
        )
        
        if not carousel_response.ok:
            error_msg = f"Failed to create carousel container: {carousel_response.text}"
            logging.error(error_msg)
            return False, error_msg, None
            
        carousel_container_id = carousel_response.json().get('id')
        if not carousel_container_id:
            error_msg = "No carousel container ID returned"
            logging.error(error_msg)
            return False, error_msg, None
            
        logging.info(f"Successfully created carousel container: {carousel_container_id}")
        
        # Step 3: Publish the carousel
        publish_data = {
            'creation_id': carousel_container_id,
            'access_token': access_token
        }
        
        publish_response = requests.post(
            f'https://{host_url}/v22.0/{page_id}/media_publish',
            data=publish_data
        )
        
        if publish_response.ok:
            result_data = publish_response.json()
            post_id = result_data.get('id')
            logging.info(f"Instagram carousel published successfully. Post ID: {post_id}")
            return True, "Carousel posted successfully", result_data
        else:
            error_response = publish_response.json()
            error_msg = error_response.get('error', {}).get('message', 'Unknown error')
            logging.error(f"Instagram carousel publish failed: {error_msg}")
            return False, f"Instagram API error: {error_msg}", None
            
    except Exception as e:
        error_msg = f"Error posting Instagram carousel: {str(e)}"
        logging.error(error_msg)
        return False, error_msg, None


def post_to_instagram_story(host_url, page_id, access_token, image_url=None, video_url=None):
    """
    Post content to Instagram Story with image or video
    
    Args:
        page_id (str): The Instagram account ID
        access_token (str): The access token
        image_url (str, optional): URL of image to include in story
        video_url (str, optional): URL of video to include in story
        
    Returns:
        tuple: (success, result_or_error)
    """
    result_data = None
    try:
        
        if not image_url and not video_url:
            logging.error("Instagram Story post failed: No image or video provided")
            return False, "Instagram Story requires either an image or video"
        
        # Prepare container data
        container_data = {
            'media_type': 'STORIES',
            'access_token': access_token
        }
        
        # Add either image or video URL
        if image_url:
            container_data['image_url'] = image_url
            # Shorter timeout for images
            timeout_value = 60
        elif video_url:
            container_data['video_url'] = video_url
            # Longer timeout for videos
            timeout_value = 120
        
        
        # Step 1: Create media container
        create_container_response = requests.post(
            f'{URL}/{page_id}/media',
            data=container_data,
            timeout=timeout_value  # Longer timeout
        )

        
        if not create_container_response.ok:
            error_data = create_container_response.json()
            return False, error_data

        container_result = create_container_response.json()
        creation_id = container_result.get('id')
        
        # Step 2: Publish the container
        
        # For videos, implement retry logic with increasing delays
        max_retries = 6
        # Much longer retry delays, especially for videos
        retry_delays = [5, 15, 30, 60, 120, 180]  # seconds to wait between retries
        
        for attempt in range(max_retries):
            publish_data = {
                'creation_id': creation_id,
                'access_token': access_token
            }
            
            try:
                publish_response = requests.post(
                    f'{URL}/{page_id}/media_publish',
                    data=publish_data,
                    timeout=timeout_value  # Same timeout as container creation
                )
                
                if publish_response.ok:
                    result_data = publish_response.json()
                    return True, {"message": "Posted to Instagram Story successfully!"}, result_data
                
                error_data = publish_response.json()
                error_code = error_data.get('error', {}).get('code')
                error_subcode = error_data.get('error', {}).get('error_subcode')
                
                # Check if this is the "media not ready" error (code 9007, subcode 2207027)
                if error_code == 9007 and (error_subcode == 2207027 or video_url):
                    if attempt < max_retries - 1:  # If we have retries left
                        retry_delay = retry_delays[attempt]
                        logging.info(f"Media not ready yet, waiting {retry_delay} seconds before retry {attempt+1}/{max_retries}")
                        time.sleep(retry_delay)
                        continue
                
                # If it's a different error or we've used all retries, return the error
                return False, error_data
                
            except requests.exceptions.Timeout:
                logging.warning(f"Timeout occurred during publish attempt {attempt+1}/{max_retries}")
                if attempt < max_retries - 1:
                    retry_delay = retry_delays[attempt]
                    logging.info(f"Retrying after timeout in {retry_delay} seconds (attempt {attempt+1}/{max_retries})")
                    time.sleep(retry_delay)
                    continue
                else:
                    return False, "Connection to Instagram API timed out after multiple retries"
                    
            except requests.exceptions.ConnectionError:
                logging.warning(f"Connection error during publish attempt {attempt+1}/{max_retries}")
                if attempt < max_retries - 1:
                    retry_delay = retry_delays[attempt]
                    logging.info(f"Retrying after connection error in {retry_delay} seconds (attempt {attempt+1}/{max_retries})")
                    time.sleep(retry_delay)
                    continue
                else:
                    return False, "Connection to Instagram API failed after multiple retries"
                
    except Exception as e:
        error_msg = f"Error posting to Instagram Story: {str(e)}"
        logging.error(error_msg)
        logging.exception("Full exception traceback:")
        return False, str(e)


def post_to_instagram_reel(host_url, page_id, content, access_token, video_url, cover_url=None, share_to_feed=False, audio_name=None):
    """
    Post content to Instagram Reels
    
    Args:
        page_id (str): The Instagram account ID
        content (str): Caption for the reel
        access_token (str): The access token
        video_url (str): URL of video to include in reel
        cover_url (str, optional): URL of image to use as cover
        share_to_feed (bool, optional): Whether to share the reel to feed
        audio_name (str, optional): Name of audio for the reel
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    result_data = None
    try:
        logging.info(f"Starting Instagram Reel post for page ID: {page_id}")
        
        # Prepare container data
        container_data = {
            'media_type': 'REELS',
            'video_url': video_url,
            'caption': content,
            'access_token': access_token
        }
        
        # Add optional fields
        if cover_url:
            container_data['cover_url'] = cover_url
            
        if share_to_feed:
            container_data['share_to_feed'] = 'true'
            
        if audio_name:
            container_data['audio_name'] = audio_name
        
        # Set a longer timeout for Reels as they can take more time to process
        timeout_value = 180  # 3 minutes
        
        # Step 1: Create media container
        logging.info(f"Creating media container for Reel")
        create_container_response = requests.post(
            f'{URL}/{page_id}/media',
            data=container_data,
            timeout=timeout_value
        )
        
        if not create_container_response.ok:
            error_data = create_container_response.json()
            logging.error(f"Failed to create container for Reel: {error_data}")
            return False, error_data, None

        container_result = create_container_response.json()
        creation_id = container_result.get('id')
        logging.info(f"Successfully created media container with ID: {creation_id}")
        
        # Step 2: Publish the container with retry logic
        
        # For Reels, implement retry logic with increasing delays
        # Reels take longer to process than Stories, so use longer delays
        max_retries = 10
        retry_delays = [10, 20, 30, 60, 90, 120, 180, 240, 300, 360]  # seconds to wait between retries
        
        for attempt in range(max_retries):
            publish_data = {
                'creation_id': creation_id,
                'access_token': access_token
            }
            
            logging.info(f"Attempting to publish Reel, attempt {attempt+1}/{max_retries}")
            try:
                publish_response = requests.post(
                    f'{URL}/{page_id}/media_publish',
                    data=publish_data,
                    timeout=timeout_value
                )
                
                if publish_response.ok:
                    result_data = publish_response.json()
                    logging.info(f"Successfully published Reel with ID: {result_data.get('id')}")
                    return True, {"message": "Posted to Instagram Reel successfully!"}, result_data
                
                error_data = publish_response.json()
                error = error_data.get('error', {})
                error_code = error.get('code')
                error_subcode = error.get('error_subcode')
                error_message = error.get('message', 'Unknown error')
                
                logging.warning(f"Publish attempt {attempt+1} failed: Code {error_code}, Subcode {error_subcode}, Message: {error_message}")
                
                # Check if this is the "media not ready" error (code 9007, subcode 2207027)
                if error_code == 9007:
                    if attempt < max_retries - 1:  # If we have retries left
                        retry_delay = retry_delays[attempt]
                        logging.info(f"Media not ready yet, waiting {retry_delay} seconds before retry {attempt+1}/{max_retries}")
                        time.sleep(retry_delay)
                        continue
                
                # If it's a different error or we've used all retries, return the error
                return False, error_data, None
                
            except requests.exceptions.Timeout:
                logging.warning(f"Timeout occurred during publish attempt {attempt+1}/{max_retries}")
                if attempt < max_retries - 1:
                    retry_delay = retry_delays[attempt]
                    logging.info(f"Retrying after timeout in {retry_delay} seconds (attempt {attempt+1}/{max_retries})")
                    time.sleep(retry_delay)
                    continue
                else:
                    return False, "Connection to Instagram API timed out after multiple retries", None
                    
            except requests.exceptions.ConnectionError:
                logging.warning(f"Connection error during publish attempt {attempt+1}/{max_retries}")
                if attempt < max_retries - 1:
                    retry_delay = retry_delays[attempt]
                    logging.info(f"Retrying after connection error in {retry_delay} seconds (attempt {attempt+1}/{max_retries})")
                    time.sleep(retry_delay)
                    continue
                else:
                    return False, "Connection to Instagram API failed after multiple retries", None
        
        # If we've exhausted all retries
        logging.error(f"Failed to publish Reel after {max_retries} attempts")
        return False, {"error": "Failed to publish after maximum retry attempts"}, None
                
    except Exception as e:
        error_msg = f"Error posting to Instagram Reel: {str(e)}"
        logging.error(error_msg)
        logging.exception("Full exception traceback:")
        return False, str(e), None
    
    