import logging
import requests
import json
import time
import os

URL = "https://graph.facebook.com/v22.0"


def post_to_instagram_post(page_id, access_token, content, image_url=None, location_id=None):
    try:
        logging.info(f"[INSTAGRAM_POST] page_id={page_id}, image_url={image_url}, content={content[:50] if content else 'None'}...")
       
        data = {
            'image_url': image_url,
            'caption': content,
            'access_token': access_token
        }

        if location_id: data['location_id'] = location_id

        create_container_response = requests.post(f'{URL}/{page_id}/media', data=data)
        
        if not create_container_response.ok:
            error_detail = create_container_response.json() if create_container_response.text else {}
            logging.error(f"[INSTAGRAM_POST] Media creation failed: {error_detail}")
        
        create_container_response.raise_for_status()

        creation_id = create_container_response.json().get('id')

        response = requests.post(
            f'{URL}/{page_id}/media_publish',
            data={'creation_id': creation_id, 'access_token': access_token}
        )
        response.raise_for_status()

        result_data = response.json()
        return {"success": True, "message": "Posted to Instagram successfully!", "data": result_data}

    except Exception as e:
        logging.error(f"Error posting to Instagram: {str(e)}")
        return {"success": False, "error": str(e), "data": None}


def post_to_instagram_carousel(page_id, access_token, content, image_urls, location_id=None):
    try:
       

        container_ids = []
        for i, image_url in enumerate(image_urls):

            data = {'image_url': image_url, 'is_carousel_item': 'true', 'access_token': access_token}
            response = requests.post(f'{URL}/{page_id}/media', data=data)
            response.raise_for_status()   
            result_data = response.json()    

            container_id = result_data.get('id')
            if not container_id:
                return {"success": False, "error": f"No container ID returned for image {i+1}", "data": result_data}

            container_ids.append(container_id)

        data = {
            'media_type': 'CAROUSEL',
            'children': ', '.join(container_ids),
            'caption': content,
            'access_token': access_token
        }

        if location_id: data['location_id'] = location_id

        response = requests.post(f'{URL}/{page_id}/media', data=data)
        response.raise_for_status()
        result_data = response.json()

        carousel_container_id = result_data.get('id')
        if not carousel_container_id:
            return {"success": False, "error": "No carousel container ID returned", "data": result_data}

        response = requests.post(
            f'{URL}/{page_id}/media_publish',
            data={'creation_id': carousel_container_id, 'access_token': access_token}
        )
        response.raise_for_status()

        result_data = response.json()
        return {"success": True, "message": "Carousel posted successfully", "data": result_data}

    except Exception as e:
        return {"success": False, "error": f"Error posting Instagram carousel: {str(e)}", "data": result_data}


def post_to_instagram_story(page_id, access_token, image_url=None, video_url=None):
    try:
        data = {'media_type': 'STORIES', 'access_token': access_token}

        if image_url:
            data['image_url'] = image_url
            t_value = 60
        else:
            data['video_url'] = video_url
            t_value = 120

        response = requests.post(f'{URL}/{page_id}/media', data=data, timeout=t_value)
        response.raise_for_status()

        container_result = response.json()
        creation_id = container_result.get('id')

        max_status_checks = 5
        status_check_interval = 60  # seconds
        
        for check in range(max_status_checks):
            # Check status
            status_response = requests.get(
                f'{URL}/{creation_id}',
                params={'fields': 'status_code', 'access_token': access_token},
                timeout=30
            )
            status_response.raise_for_status()
            status_data = status_response.json()
            status_code = status_data.get('status_code', 'UNKNOWN')
            
            if status_code == 'FINISHED':
                break
            elif status_code == 'PUBLISHED':
                return {"success": True, "message": "Posted to Instagram Story successfully!", "data": status_data}
            elif status_code == 'ERROR':
                return {"success": False, "error": "Media processing failed on Instagram's servers", "data": status_data}
            elif status_code == 'EXPIRED':
                return {"success": False, "error": "Media container expired", "data": status_data}
            elif status_code == 'IN_PROGRESS':
                if check < max_status_checks - 1:
                    time.sleep(status_check_interval)
                else:
                    return {"success": False, "error": "Media processing timeout", "data": status_data}
        
        # Attempt to publish
        try:
            response = requests.post(
                f'{URL}/{page_id}/media_publish',
                data={'creation_id': creation_id, 'access_token': access_token},
                timeout=t_value
            )
            response.raise_for_status()
            
            result_data = response.json()
            return {"success": True, "message": "Posted to Instagram Story successfully!", "data": result_data}
            
        except requests.exceptions.HTTPError as e:
            error_message = e.response.text if hasattr(e, 'response') else str(e)
            return {"success": False, "error": f"Failed to publish: {error_message}", "data": None}
        except Exception as e:
            return {"success": False, "error": str(e), "data": None}

    except Exception as e:
        logging.error(f"Error posting to Instagram Story: {str(e)}")
        return {"success": False, "error": f"Error posting to Instagram Story: {str(e)}", "data": None}


def post_to_instagram_reel(page_id, access_token, content, video_url, cover_url=None, share_to_feed=False, audio_name=None):
    try:
        data = {
            'media_type': 'REELS',
            'video_url': video_url,
            'caption': content,
            'access_token': access_token
        }

        if cover_url: data['cover_url'] = cover_url
        if share_to_feed: data['share_to_feed'] = 'true'
        if audio_name: data['audio_name'] = audio_name

        t_value = 180
        response = requests.post(f'{URL}/{page_id}/media', data=data, timeout=t_value)
        response.raise_for_status()

        result_data = response.json()
        creation_id = result_data.get('id')

        max_status_checks = 5
        status_check_interval = 60  
        
        for check in range(max_status_checks):
            status_response = requests.get(
                f'{URL}/{creation_id}',
                params={'fields': 'status_code', 'access_token': access_token},
                timeout=30
            )
            status_response.raise_for_status()
            status_data = status_response.json()
            status_code = status_data.get('status_code', 'UNKNOWN')
            
            if status_code == 'FINISHED':
                break
            elif status_code == 'PUBLISHED':
                return {"success": True, "message": "Posted to Instagram Reel successfully!", "data": status_data}
            elif status_code == 'ERROR':
                return {"success": False, "error": "Media processing failed on Instagram's servers", "data": status_data}
            elif status_code == 'EXPIRED':
                return {"success": False, "error": "Media container expired", "data": status_data}
            elif status_code == 'IN_PROGRESS':
                if check < max_status_checks - 1:
                    time.sleep(status_check_interval)
                else:
                    return {"success": False, "error": "Media processing timeout", "data": status_data}
        
        try:
            response = requests.post(
                f'{URL}/{page_id}/media_publish',
                data={'creation_id': creation_id, 'access_token': access_token},
                timeout=t_value
            )
            response.raise_for_status()
            
            result_data = response.json()
            return {"success": True, "message": "Posted to Instagram Reel successfully!", "data": result_data}
            
        except requests.exceptions.HTTPError as e:
            error_message = e.response.text if hasattr(e, 'response') else str(e)
            return {"success": False, "error": f"Failed to publish: {error_message}", "data": None}
        except Exception as e:
            return {"success": False, "error": str(e), "data": None}

    except Exception as e:
        logging.error(f"Error posting to Instagram Reel: {str(e)}")
        return {"success": False, "error": str(e), "data": None}


def post_to_instagram(postData, image_urls, video_url, access_token):
    try:
        platform = 'instagram'
        platform_data = postData.get('platforms', {}).get(platform, {})
        post_type = platform_data.get('postType', 'post')
        content = platform_data.get('specificContent') or postData.get('content', '')

        page_id = platform_data.get('accountId', '')
        location_id = platform_data.get('locationId')
        share_to_feed = platform_data.get('shareToFeed', False)
        
        image_url = image_urls[0] if image_urls else None
        if post_type == 'post':
            return post_to_instagram_post(page_id, access_token, content, image_url, location_id)
        elif post_type == 'carousel':
            return post_to_instagram_carousel(page_id, access_token, content, image_urls, location_id)
        elif post_type == 'story':
            return post_to_instagram_story(page_id, access_token, image_url, video_url)
        elif post_type == 'reel':
            return post_to_instagram_reel(page_id, access_token, content, video_url, share_to_feed=share_to_feed)
        else:
            return {"success": False, "error": f"Unsupported post type: {post_type}", "data": None}

    except Exception as e:
        logging.error(f"Error in post_to_instagram router: {str(e)}")
        return {"success": False, "error": str(e), "data": None}

if __name__ == "__main__":
    post_to_instagram_reel("17841472309744991", 
    "EAAOq14KLeDsBP7TznzLSZBKRijZCmN4PZCT8epYKPXFDDahVkY0ZBMZASbGfXSdgMAtETqcFzwi4U4kSohfG8pO8ZBZA0NIbwSBmPxsEL0B0SiWdqk1xcuFjVgZCBalQdWaCkzgSiicIhS3MaUoOgLcZBK3g7sefRDupDor2Oj1W9F4knHYW3DpkfauBZCDhrB0ALr", 
    content="",
    video_url="https://qacaiikdxhlnvxmozbwl.supabase.co/storage/v1/object/public/post-videos/11ec095a-5309-4ede-8fd6-9927d7d314b0/09a70b89-8c12-4988-9f34-0b9976e9f822.mp4"
    )
    