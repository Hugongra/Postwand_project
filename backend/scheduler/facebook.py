import logging
import requests
import json
import time

URL = "https://graph.facebook.com/v22.0/"

def post_to_facebook(page_id, content, access_token, image_url=None, location_id=None):
    """
    Post content to a Facebook page with optional image and location
    
    Args:
        page_id (str): The ID of the Facebook page
        content (str): The content to post
        access_token (str): The page access token
        image_url (str, optional): URL of image to include in post
        location_id (str, optional): ID of location to tag in post
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    
    result_data = None
    try:
        # Enhanced logging for location debugging
        if location_id:
            logging.info(f"Attempting to add location to Facebook post: location_id={location_id}, type={type(location_id)}")
            
            # Validate the location_id format - ensure it's a string
            if not isinstance(location_id, str):
                location_id = str(location_id)
                logging.info(f"Converted location_id to string: {location_id}")
        
        if image_url:
            # Prepare post data with image
            post_data = {
                'access_token': access_token,
                'message': content,
                'url': image_url
            }
            
            # Add location if provided
            if location_id:
                post_data['place'] = location_id
                logging.info(f"Adding location {location_id} to Facebook photo post - POST data: {post_data}")
                
            response = requests.post(
                f'{URL}/{page_id}/photos',
                data=post_data
            )
        else:
            # Prepare post data for text-only post
            post_data = {
                'message': content,
                'access_token': access_token
            }
            
            # Add location if provided
            if location_id:
                post_data['place'] = location_id
                logging.info(f"Adding location {location_id} to Facebook feed post - POST data: {post_data}")
            
            response = requests.post(
                f'{URL}/{page_id}/feed',
                data=post_data
            )
            
        # Enhanced response logging
        logging.info(f"Facebook API response status: {response.status_code}")
        logging.info(f"Facebook API response headers: {dict(response.headers)}")
        
        if response.ok:
            result_data = response.json()
            logging.info(f"Facebook post successful - Response: {result_data}")
            
            # If location was provided, log additional verification
            if location_id:
                post_id = result_data.get('id')
                if post_id:
                    # Try to verify the post was created with location by reading it back
                    verify_response = requests.get(
                        f'{URL}/{post_id}?fields=id,message,place&access_token={access_token}'
                    )
                    if verify_response.ok:
                        verify_data = verify_response.json()
                        logging.info(f"Post verification - Location in created post: {verify_data.get('place', 'NO LOCATION FOUND')}")
                    else:
                        logging.warning(f"Could not verify post location: {verify_response.text}")
            
            return True, {"message": "Posted to Facebook successfully!"}, result_data
            
        if not response.ok:
            error_text = response.text
            logging.error(f"Facebook API error: {response.status_code} - {error_text}")
            
            # Check for specific location-related errors
            if 'place' in error_text.lower() or 'location' in error_text.lower():
                logging.error(f"Location-specific error detected. Location ID provided: {location_id}")
                
            try:
                error_data = response.json()
                if 'error' in error_data:
                    error_message = error_data['error'].get('message', 'Unknown error')
                    error_code = error_data['error'].get('code', 'Unknown code')
                    logging.error(f"Facebook API structured error: Code {error_code} - {error_message}")
                    return False, {"error": f"Facebook API Error ({error_code}): {error_message}"}, None
            except:
                pass
                
            return False, {"error": f"Failed to post to Facebook: {error_text}"}, None

    except Exception as e:
        error_msg = f"Error posting to Facebook: {str(e)}"
        logging.error(error_msg)
        return False, {"error": error_msg}, None


def post_to_facebook_video(page_id, content, access_token, video_url, title=None, description=None, location_id=None, app_id=None):
    """
    Post a video to a Facebook page using the Facebook Resumable Upload API
    
    Args:
        page_id (str): The ID of the Facebook page
        content (str): The content/caption for the post
        access_token (str): The page access token
        video_url (str): URL of the video to post
        title (str, optional): Title for the video
        description (str, optional): Description for the video
        location_id (str, optional): ID of location to tag in post
        app_id (str, optional): The Facebook App ID (required for resumable upload)
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    try:
        logging.info(f"Starting Facebook video upload process for page {page_id}")
        
        # Step 1: Download the video from the URL
        logging.info(f"Downloading video from {video_url}")
        supabase_response = requests.get(video_url)
        if supabase_response.status_code != 200:
            error_msg = f"Failed to download the video from URL: {video_url}"
            logging.error(error_msg)
            return False, {"error": error_msg}, None

        video_bytes = supabase_response.content
        file_name = 'video.mp4'
        file_length = len(video_bytes)  # size in bytes
        file_type = 'video/mp4'
        
        logging.info(f"Video downloaded successfully, size: {file_length} bytes")
        
        # Try direct upload approach first as it's simpler
        try:
            logging.info("Attempting direct video upload to Facebook")
            direct_url = f"{URL}/{page_id}/videos"
            
            files = {
                'source': (file_name, video_bytes, file_type),
            }
            
            params = {
                'access_token': access_token,
                'description': content,
            }
            
            if title:
                params['title'] = title
                
            if description:
                params['description'] = description
            
            # Add location if provided
            if location_id:
                params['place'] = location_id
                logging.info(f"Adding location {location_id} to Facebook video post")
                
            direct_response = requests.post(direct_url, files=files, params=params)
            
            if direct_response.ok:
                direct_result = direct_response.json()
                logging.info(f"Direct video upload successful, video ID: {direct_result.get('id')}")
                return True, {"message": "Video posted to Facebook successfully!", "video_id": direct_result.get('id')}, direct_result
            else:
                logging.warning(f"Direct upload failed: {direct_response.text}. Falling back to resumable upload.")
        except Exception as e:
            logging.warning(f"Direct upload approach failed: {str(e)}. Falling back to resumable upload.")
        
        # Fallback to resumable upload if direct upload fails
        logging.info("Starting resumable upload process")
        
        if not app_id:
            error_msg = "App ID is required for resumable upload"
            logging.error(error_msg)
            return False, {"error": error_msg}, None
            
        # Step 2.1: Initiate the upload session on Facebook
        upload_session_url = f"{URL}/{app_id}/uploads"
        params = {
            'file_name': file_name,
            'file_length': file_length,
            'file_type': file_type,
            'access_token': access_token,
        }
        logging.info(f"Initiating upload session with params: {params}")
        session_response = requests.post(upload_session_url, params=params)
        
        if not session_response.ok:
            error_msg = f"Error initiating upload session: HTTP {session_response.status_code}, Response: {session_response.text}"
            logging.error(error_msg)
            return False, {"error": error_msg}, None
            
        session_data = session_response.json()

        if 'error' in session_data:
            error_msg = f"Error initiating upload session: {session_data['error'].get('message', '')}"
            logging.error(error_msg)
            return False, {"error": error_msg}, None

        # Extract the upload session ID
        upload_session_id = session_data.get('id')
        logging.info(f"Upload session initiated, session ID: {upload_session_id}")
        
        # Step 2.2: Upload the file
        upload_chunk_url = f"{URL}/{upload_session_id}"
        headers = {
            'Authorization': f'OAuth {access_token}',
            'file_offset': '0'
        }
        logging.info(f"Uploading video chunk to {upload_chunk_url}")
        chunk_response = requests.post(upload_chunk_url, headers=headers, data=video_bytes)
        
        if not chunk_response.ok:
            error_msg = f"Error uploading video chunk: HTTP {chunk_response.status_code}, Response: {chunk_response.text}"
            logging.error(error_msg)
            return False, {"error": error_msg}, None
            
        chunk_data = chunk_response.json()

        if 'error' in chunk_data:
            error_msg = f"Error uploading video chunk: {chunk_data['error'].get('message', '')}"
            logging.error(error_msg)
            return False, {"error": error_msg}, None

        # Get the uploaded file handle
        uploaded_file_handle = chunk_data.get('h')
        logging.info(f"Video chunk uploaded successfully, file handle: {uploaded_file_handle}")

        # Step 2.3: Publish the video on the Facebook Page
        publish_url = f"{URL}/{page_id}/videos"
        publish_payload = {
            'access_token': access_token,
            'title': title or '',
            'description': description or content,
            'fbuploader_video_file_chunk': uploaded_file_handle
        }
        
        # Add location if provided
        if location_id:
            publish_payload['place'] = location_id
            logging.info(f"Adding location {location_id} to Facebook video post")
            
        logging.info(f"Publishing video to {publish_url}")
        publish_response = requests.post(publish_url, data=publish_payload)
        
        if not publish_response.ok:
            error_msg = f"Error publishing video: HTTP {publish_response.status_code}, Response: {publish_response.text}"
            logging.error(error_msg)
            return False, {"error": error_msg}, None
            
        publish_data = publish_response.json()

        if 'error' in publish_data:
            error_msg = f"Error publishing video: {publish_data['error'].get('message', '')}"
            logging.error(error_msg)
            return False, {"error": error_msg}, None

        # Return success with the video ID
        logging.info(f"Video published successfully, video ID: {publish_data.get('id')}")
        return True, {"message": "Video posted to Facebook successfully!", "video_id": publish_data.get('id')}, publish_data
        
    except Exception as e:
        error_msg = f"Error posting video to Facebook: {str(e)}"
        logging.error(error_msg)
        logging.exception("Full exception traceback:")
        return False, {"error": error_msg}, None


def post_to_facebook_reel(page_id, content, access_token, video_url, cover_url=None, location_id=None, app_id=None):
    """
    Post a reel to a Facebook page
    
    Args:
        page_id (str): The ID of the Facebook page
        content (str): The caption for the reel
        access_token (str): The page access token
        video_url (str): URL of the video to use for the reel
        cover_url (str, optional): URL of the image to use as cover
        location_id (str, optional): ID of location to tag in post
        app_id (str, optional): The Facebook App ID
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    try:
       
        # Step 1: Download the video from the URL
    
        supabase_response = requests.get(video_url)
        if supabase_response.status_code != 200:
            error_msg = f"Failed to download the video from URL: {video_url}"
       
            return False, {"error": error_msg}, None

        video_bytes = supabase_response.content
        file_name = 'video.mp4'
        file_length = len(video_bytes)  # size in bytes
        file_type = 'video/mp4'
        
        
        # Step 2.1: Initiate the upload session on Facebook
      
        init_data = {
            "upload_phase": "start",
            "access_token": access_token
        }
        
        init_response = requests.post(
            f'{URL}/{page_id}/video_reels',
            data=init_data
        )
      
        
        if not init_response.ok:
            error_data = init_response.json() if init_response.text else {"error": f"HTTP {init_response.status_code}"}
           
            return False, error_data, None
        
        init_result = init_response.json()
        video_id = init_result.get('video_id')
        upload_url = init_result.get('upload_url')
        
        if not video_id or not upload_url:
            error_msg = f"Failed to get video ID or upload URL from initialization response: {init_result}"
         
            return False, {"error": error_msg}, None
        
      
        
        # Step 2.2: Upload the video bytes
        
        upload_headers = {
            "Authorization": f"OAuth {access_token}",
            "offset": "0",
            "file_size": str(file_length)
        }
        
        # Upload the video
        upload_response = requests.post(
            f"{upload_url}",
            headers=upload_headers,
            data=video_bytes
        )
        
        
        
        if not upload_response.ok:
            error_data = upload_response.json() if upload_response.text else {"error": f"HTTP {upload_response.status_code}"}
          
            return False, error_data, None
        
        # Parse the upload response
        try:
            upload_result = upload_response.json()
        except Exception as e:
            error_msg = f"Failed to parse upload response as JSON: {str(e)}, response: {upload_response.text[:100]}..."
           
            return False, {"error": error_msg}, None
        
        # Check for success in upload response
        if not upload_result.get('success', False):
            error_msg = f"Video upload was not successful, details: {upload_result}"
            
            return False, {"error": error_msg}, upload_result
            
       
        
        # Step 2.3: Publish the reel
        
        publish_data = {
            "access_token": access_token,
            "video_id": video_id,
            "upload_phase": "finish",
            "video_state": "PUBLISHED",  # Required parameter
            "description": content
        }
        
        # Add location if provided
        publish_response = requests.post(
            f'{URL}/{page_id}/video_reels',
            data=publish_data
        )
        
        
        
        if not publish_response.ok:
            error_data = publish_response.json() if publish_response.text else {"error": f"HTTP {publish_response.status_code}"}
            
            return False, error_data, None
        
        # Simplified response handling
        publish_result = publish_response.json()
       
        
        # Get the reel ID if available
        reel_id = publish_result.get('id')
        
        return True, {
            "message": "Reel posted to Facebook successfully!",
            "reel_id": reel_id if reel_id else None
        }, publish_result
        
    except Exception as e:
        error_msg = f"Error posting reel to Facebook: {str(e)}"
        
        return False, {"error": error_msg}, None

def post_to_facebook_carousel(page_id, content, access_token, image_urls, location_id=None):
    """
    Post a carousel with multiple images to Facebook
    
    Args:
        page_id (str): The ID of the Facebook page
        content (str): The caption for the carousel
        access_token (str): The page access token
        image_urls (list): List of image URLs to include in carousel
        location_id (str, optional): ID of location to tag in post
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    result_data = None
    try:
        if not image_urls or len(image_urls) < 2:
            return False, "Facebook carousel requires at least 2 images", None
            
        if len(image_urls) > 10:
            return False, "Facebook carousel supports maximum 10 images", None
        
        logging.info(f"Creating Facebook carousel with {len(image_urls)} images")
        
        # Step 1: Create media containers for each image
        container_ids = []
        for i, image_url in enumerate(image_urls):
            container_data = {
                'access_token': access_token,
                'url': image_url,
                'published': 'false'  # Don't publish individual photos
            }
            
            response = requests.post(
                f'{URL}/{page_id}/photos',
                data=container_data
            )
            
            if not response.ok:
                error_msg = f"Failed to create photo container {i+1}: {response.text}"
                logging.error(error_msg)
                return False, error_msg, None
            
            photo_data = response.json()
            container_ids.append(photo_data.get('id'))
            logging.info(f"Created photo container {i+1}: {photo_data.get('id')}")
        
        # Step 2: Create the carousel post
        carousel_data = {
            'access_token': access_token,
            'message': content,
            'attached_media': json.dumps([{'media_fbid': cid} for cid in container_ids])
        }
        
        # Add location if provided
        if location_id:
            carousel_data['place'] = location_id
            logging.info(f"Adding location {location_id} to Facebook carousel post")
        
        logging.info(f"Carousel data format: {carousel_data}")
        
        carousel_response = requests.post(
            f'{URL}/{page_id}/feed',
            data=carousel_data
        )
        
        if carousel_response.ok:
            result_data = carousel_response.json()
            logging.info(f"Facebook carousel post successful - Response: {result_data}")
            return True, {"message": "Carousel posted to Facebook successfully!"}, result_data
        else:
            error_msg = f"Failed to post carousel: {carousel_response.text}"
            logging.error(error_msg)
            return False, error_msg, None
            
    except Exception as e:
        error_msg = f"Error posting carousel to Facebook: {str(e)}"
        logging.error(error_msg)
        return False, error_msg, None


def post_to_facebook_story(page_id, access_token, image_url=None, video_url=None, app_id=None):
    """
    Post a story to a Facebook page
    
    Args:
        page_id (str): The ID of the Facebook page
        access_token (str): The page access token
        image_url (str, optional): URL of image to use for story
        video_url (str, optional): URL of video to use for story
        sticker_data (dict, optional): Dictionary containing sticker data for the story
        app_id (str, optional): The Facebook App ID (not needed for stories API)
        
    Returns:
        tuple: (success, result_or_error, result_data)
    """
    try:
        
        result_data = None
        
        if not (image_url or video_url):
            return False, {"error": "Either image_url or video_url is required for Facebook stories"}, None
        
        # For image stories
        if image_url:
        
            # Try alternative approach first - upload as regular photo with story flag
            try:
                # Step 1: Upload image
                upload_image = requests.post(
                f'{URL}/{page_id}/photos',
                data={
                    "url": image_url,
                    "published": "false",  # Don't publish to feed
                    "access_token": access_token
                })

                if not upload_image.ok:
                     error_data = upload_image.json() if upload_image.text else {"error": f"HTTP {upload_image.status_code}"}
                     return False, error_data, None

                photo_id = upload_image.json().get('id')

                if not photo_id:
                    return False, {"error": f"Failed to get photo ID from upload response {upload_image.json()}"}, None
                
                # Step 2: Create story with photo
                
                
                story_response = requests.post(
                    f'{URL}/{page_id}/photo_stories',
                    data={
                        "photo_id": photo_id,
                        "access_token": access_token
                    }
                )
                
                if not story_response.ok:
                    error_data = story_response.json() if story_response.text else {"error": f"HTTP {story_response.status_code}"}
                    return False, error_data, None
                
                story_result = story_response.json()

                return True, {
                    "message": "Image story posted to Facebook successfully!",
                    "data": story_result
                }, story_result
                
            
            except Exception as e:
                logging.error(f"Error posting story to Facebook: {str(e)}")
                return False, {"error": str(e)}, None
        
        # For video stories
        elif video_url:
        
            
            # Step 1: Initialize upload session
            init_response = requests.post(
                f'{URL}/{page_id}/video_stories',
                data={
                    "upload_phase": "start",
                    "access_token": access_token
                }
            )
            
            if not init_response.ok:
                error_data = init_response.json() if init_response.text else {"error": f"Failed with status {init_response.status_code}"}
                return False, error_data, None
            
            init_result = init_response.json()
            video_id = init_result.get('video_id')
            upload_url = init_result.get('upload_url')
            
            if not video_id or not upload_url:
                return False, {"error": "Failed to get video ID or upload URL from initialization response"}, None
            
            # Step 2: Download the video from the URL
            supabase_response = requests.get(video_url)
            if supabase_response.status_code != 200:
                error_msg = f"Failed to download the video from URL: {video_url}"
                return False, {"error": error_msg}, None

            video_bytes = supabase_response.content
            file_length = len(video_bytes)  # size in bytes
            
            # Step 3: Upload the video bytes
            upload_headers = {
                "Authorization": f"OAuth {access_token}",
                "offset": "0",
                "file_size": str(file_length)
            }
            
            upload_response = requests.post(
                upload_url,
                headers=upload_headers,
                data=video_bytes
            )
            
            if not upload_response.ok:
                error_data = upload_response.json() if upload_response.text else {"error": f"HTTP {upload_response.status_code}"}
                return False, error_data, None
            
            # Parse the upload response
            try:
                upload_result = upload_response.json()
            except Exception as e:
                error_msg = f"Failed to parse upload response as JSON: {str(e)}, response: {upload_response.text[:100]}..."
                return False, {"error": error_msg}, None
            
            # Check for success in upload response
            if not upload_result.get('success', False):
                error_msg = f"Video upload was not successful, details: {upload_result}"
                return False, {"error": error_msg}, upload_result

            # Step 4: Publish the story
            publish_response = requests.post(
                f'{URL}/{page_id}/video_stories',
                data={
                    "video_id": video_id,
                    "upload_phase": "finish",
                    "access_token": access_token
                }
            )

            if not publish_response.ok:
                error_data = publish_response.json() if publish_response.text else {"error": f"HTTP {publish_response.status_code}"}
                return False, error_data, None
            
            publish_result = publish_response.json()

            return True, {
                "message": "Video story posted to Facebook successfully!",
                "data": publish_result
            }, publish_result
            
            
            
        
    except Exception as e:
        logging.error(f"Error posting story to Facebook: {str(e)}")
        logging.exception("Full exception traceback:")
        return False, {"error": str(e)}, None