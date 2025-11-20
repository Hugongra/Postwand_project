import logging
import requests
import json
import os
URL = "https://graph.facebook.com/v22.0"
FB_APP_ID = os.getenv('FB_APP_ID')
def post_to_facebook_post(page_id, access_token, content, image_url=None, location_id=None):
    data = {
        'access_token': access_token,
        'message': content,
    }

    if location_id: data['place'] = location_id

    try:
        if image_url:
            data['url'] = image_url
            response = requests.post(f'{URL}/{page_id}/photos', data=data)
        else:
            response = requests.post(f'{URL}/{page_id}/feed', data=data)

        response.raise_for_status()
        result_data = response.json()

        return {"success": True, "message": "Posted to Facebook successfully!", "data": result_data}

    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Facebook post request failed: {str(e)}", "data": None}


def post_to_facebook_reel(page_id, access_token, content, video_url, cover_url=None, ):
    try:
        response = requests.get(video_url, timeout=120)
        response.raise_for_status()
        video_bytes = response.content
        file_length = len(video_bytes)

        # Start upload
        response = requests.post(f'{URL}/{page_id}/video_reels', data={
            "upload_phase": "start",
            "access_token": access_token
        }, timeout=60)
        response.raise_for_status()

        init_data = response.json()
        video_id = init_data.get('video_id')
        upload_url = init_data.get('upload_url')

        upload_headers = {
            "Authorization": f"OAuth {access_token}",
            "offset": "0",
            "file_size": str(file_length)
        }

        response = requests.post(upload_url, headers=upload_headers, data=video_bytes, timeout=180)
        response.raise_for_status()

        response = requests.post(f'{URL}/{page_id}/video_reels', data={
            "access_token": access_token,
            "video_id": video_id,
            "upload_phase": "finish",
            "video_state": "PUBLISHED",
            "description": content
        }, timeout=60)
        response.raise_for_status()
        publish_data = response.json()

        return {"success": True, "message": "Reel posted to Facebook successfully!", "data": publish_data}

    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Error posting reel: {str(e)}", "data": None}


def post_to_facebook_carousel(page_id, access_token, content, image_urls, location_id=None):
    try:

        container_ids = []
        for image_url in image_urls:
            response = requests.post(f'{URL}/{page_id}/photos', data={
                'access_token': access_token,
                'url': image_url,
                'published': 'false'
            })
            response.raise_for_status()
            container_ids.append(response.json().get('id'))

        data = {
            'access_token': access_token,
            'message': content,
            'attached_media': json.dumps([{'media_fbid': cid} for cid in container_ids])
        }
        if location_id: data['place'] = location_id

        response = requests.post(f'{URL}/{page_id}/feed', data=data)
        response.raise_for_status()
        result_data = response.json()

        return {"success": True, "message": "Carousel posted to Facebook successfully!", "data": result_data}

    except requests.exceptions.RequestException as e:
        return {"success": False, "error": str(e), "data": None}


def post_to_facebook_story(page_id, access_token, image_url=None, video_url=None):
    try:
        if image_url:
            response = requests.post(f'{URL}/{page_id}/photos', data={
                "url": image_url,
                "published": "false",
                "access_token": access_token
            })
            response.raise_for_status()
            photo_id = response.json().get('id')

            response = requests.post(f'{URL}/{page_id}/photo_stories', data={
                "photo_id": photo_id,
                "access_token": access_token
            })
            response.raise_for_status()
            story_data = response.json()

            return {"success": True, "message": "Image story posted successfully!", "data": story_data}

        elif video_url:
            response = requests.post(f'{URL}/{page_id}/video_stories', data={
                "upload_phase": "start",
                "access_token": access_token
            }, timeout=60)
            response.raise_for_status()

            init_data = response.json()
            video_id = init_data.get('video_id')
            upload_url = init_data.get('upload_url')

            response = requests.get(video_url, timeout=120)
            response.raise_for_status()
            video_bytes = response.content
            file_length = len(video_bytes)  # ← Calculate file_length

            upload_headers = {
                "Authorization": f"OAuth {access_token}", 
                "offset": "0",
                "file_size": str(file_length)  # ← Add file_size header
            }
            response = requests.post(upload_url, headers=upload_headers, data=video_bytes, timeout=180)
            response.raise_for_status()

            response = requests.post(f'{URL}/{page_id}/video_stories', data={
                "video_id": video_id,
                "upload_phase": "finish",
                "access_token": access_token
            }, timeout=60)
            response.raise_for_status()
            publish_data = response.json()

            return {"success": True, "message": "Video story posted successfully!", "data": publish_data}

    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Error posting story: {str(e)}", "data": None}


def post_to_facebook(postData, image_urls, video_url, access_token):
    try:
        platform = 'facebook'
        platform_data = postData.get('platforms', {}).get(platform, {})
        post_type = platform_data.get('postType', 'post')
        content = platform_data.get('specificContent') or postData.get('content', '')

        page_id = platform_data.get('accountId', '')
        location_id = platform_data.get('locationId')

        image_url = image_urls[0] if image_urls else None
        if post_type == 'post':
            return post_to_facebook_post(page_id, access_token, content, image_url, location_id)
        elif post_type == 'video' or post_type == 'reel':
            # Facebook deprecated regular videos, now all videos are posted as reels
            return post_to_facebook_reel(page_id, access_token, content, video_url, cover_url=None)
        elif post_type == 'carousel':
            return post_to_facebook_carousel(page_id, access_token, content, image_urls, location_id)
        elif post_type == 'story':
            return post_to_facebook_story(page_id, access_token, image_url, video_url)
        else:
            return {"success": False, "error": f"Unsupported post type: {post_type}", "data": None}

    except Exception as e:
        logging.error(f"Error in post_to_facebook router: {str(e)}")
        return {"success": False, "error": str(e), "data": None}


if __name__ == "__main__":
   
    post_to_facebook_carousel("538166356053015",
    "EAAOq14KLeDsBPPKtEh0uUafU6RsXbv8VAetZCfkm9PrmiZBI0IT4QCW4G9w583pNC3Gd68PflAlsC08zjcmYJDRbqJVMwOHI6QUAzYOrUKfa1WOHMR6fwatcZBxZAvmUi6xN8spMZATZCZAJi5IWn0y7340LXfyDZBPsSZAo01PFuXgfLvCSSktPc0zHZAZAGd2ln5xbebb", 
    "hello theree",
    image_urls=[
        "https://qacaiikdxhlnvxmozbwl.supabase.co/storage/v1/object/public/post-images/11ec095a-5309-4ede-8fd6-9927d7d314b0/ce7e188a-2e06-4557-ae1c-1ad720791f88.png",
        "https://qacaiikdxhlnvxmozbwl.supabase.co/storage/v1/object/public/post-images/11ec095a-5309-4ede-8fd6-9927d7d314b0/0eabe59e-e17f-4892-a660-855cb66109c4.jpeg"
    ],
    location_id="538166356053015"
    )
#"https://qacaiikdxhlnvxmozbwl.supabase.co/storage/v1/object/public/post-images/11ec095a-5309-4ede-8fd6-9927d7d314b0/0eabe59e-e17f-4892-a660-855cb66109c4.jpeg"
    #    video_url="https://qacaiikdxhlnvxmozbwl.supabase.co/storage/v1/object/public/post-videos/11ec095a-5309-4ede-8fd6-9927d7d314b0/09a70b89-8c12-4988-9f34-0b9976e9f822.mp4", 

