import logging
import requests

def post_to_threads(page_id, content, access_token, image_url=None):
    """
    Post content to Threads with optional image
    
    Args:
        page_id (str): The Threads account ID
        content (str): The content to post
        access_token (str): The access token
        image_url (str, optional): URL of image to include in post
        
    Returns:
        tuple: (success, result_or_error)
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

          

            if not media_response.ok:
                error_data = media_response.json()
                logging.error(f"Threads media error: {error_data}")
           
                return False, f"Failed to create media container: {error_data}"

            creation_id = media_response.json().get('id')
          
            publish_data = {
                'access_token': access_token,
                'creation_id': creation_id
            }
          
            
            publish_response = requests.post(
                f'https://graph.threads.net/v1.0/{page_id}/threads_publish',
                data=publish_data
            )

         
            
            if not publish_response.ok:
                error_data = publish_response.json()
         
                return False, error_data
                
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

            
            
            if not response.ok:
                error_data = response.json()
             
                return False, error_data

            creation_id = response.json().get('id')
           

            # Publish the container
            publish_data = {
                'access_token': access_token,
                'creation_id': creation_id
            }
          
            
            publish_response = requests.post(
                f'https://graph.threads.net/v1.0/{page_id}/threads_publish',
                data=publish_data
            )

            if publish_response.ok:
               result_data = publish_response.json()
            
            if not publish_response.ok:
                error_data = publish_response.json()
            
                return False, error_data
                
        return True, {"message": "Posted to Threads successfully!"}, result_data
        
    except Exception as e:
        error_msg = f"Error posting to Threads: {str(e)}"
       
        logging.error(error_msg)
        return False, str(e)