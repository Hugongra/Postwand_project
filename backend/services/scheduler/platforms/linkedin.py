import requests
import json
import logging

URL = "https://api.linkedin.com/v2"


def post_to_linkedin_post(author, access_token, content):
    url = f"{URL}/ugcPosts"
    headers = {
        "X-Restli-Protocol-Version": "2.0.0",
        "Authorization": f"Bearer {access_token}"
    }

    data = {
        "author": "urn:li:person:" + author,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": content},
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status()
        result_data = response.json()
        return {"success": True, "message": "Posted to LinkedIn successfully!", "data": result_data}

    except requests.exceptions.RequestException as e:
        error_msg = f"LinkedIn post failed: {str(e)}"
        return {"success": False, "error": error_msg, "data": None}


def post_to_linkedin_video(author, access_token, content, video_url=None, image_url=None, title="Video Title", description="Video Description"):
    
    registration_result = register_media_upload(author, access_token, "VIDEO")
    if "error" in registration_result:
        return {"success": False, "error": f"Failed to register video upload: {registration_result['error']}", "data": None}

    upload_url = registration_result.get("upload_url")
    asset = registration_result.get("asset")
    if not upload_url or not asset:
        return {"success": False, "error": "Missing upload URL or asset URN", "data": None}

    try:
        video_response = requests.get(video_url)
        video_response.raise_for_status()

        headers = {"Authorization": f"Bearer {access_token}"}
        upload_response = requests.post(upload_url, headers=headers, data=video_response.content)
        upload_response.raise_for_status()

    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Video upload failed: {str(e)}", "data": None}

    url = f"{URL}/ugcPosts"
    headers = {
        "X-Restli-Protocol-Version": "2.0.0",
        "Authorization": f"Bearer {access_token}"
    }

    data = {
        "author": "urn:li:person:" + author,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": content},
                "shareMediaCategory": "VIDEO",
                "media": [{
                    "status": "READY",
                    "description": {"text": description},
                    "media": asset,
                    "title": {"text": title}
                }]
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status()
        result_data = response.json()
        return {"success": True, "message": "Posted video to LinkedIn successfully!", "data": result_data}

    except requests.exceptions.RequestException as e:
        return {"success": False, "error": str(e), "data": None}


def post_to_linkedin_article(author, access_token, content, article_url, title=None, description=None):
    url = f"{URL}/ugcPosts"
    headers = {
        "X-Restli-Protocol-Version": "2.0.0",
        "Authorization": f"Bearer {access_token}"
    }

    media_object = {"status": "READY", "originalUrl": article_url}
    if title:
        media_object["title"] = {"text": title}
    if description:
        media_object["description"] = {"text": description}

    data = {
        "author": "urn:li:person:" + author,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": content},
                "shareMediaCategory": "ARTICLE",
                "media": [media_object]
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status()
        result_data = response.json()
        return {"success": True, "message": "Posted article to LinkedIn successfully!", "data": result_data}

    except requests.exceptions.RequestException as e:
        return {"success": False, "error": str(e), "data": None}


def register_media_upload(author, access_token, media_type="IMAGE"):
    url = f"{URL}/assets?action=registerUpload"
    headers = {
        "X-Restli-Protocol-Version": "2.0.0",
        "Authorization": f"Bearer {access_token}"
    }

    recipe_type = "feedshare-image" if media_type == "IMAGE" else "feedshare-video"

    data = {
        "registerUploadRequest": {
            "recipes": [f"urn:li:digitalmediaRecipe:{recipe_type}"],
            "owner": "urn:li:person:" + author,
            "serviceRelationships": [{
                "relationshipType": "OWNER",
                "identifier": "urn:li:userGeneratedContent"
            }]
        }
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status()
        result = response.json()

        if "value" in result:
            return {
                "upload_url": result["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"],
                "asset": result["value"]["asset"]
            }
        return result

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}


def upload_media_binary(upload_url, access_token, file_path):
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        with open(file_path, 'rb') as file:
            response = requests.post(upload_url, headers=headers, data=file)
            response.raise_for_status()
        return {"success": True, "data": response.text}

    except requests.exceptions.RequestException as e:
        return {"success": False, "error": str(e), "data": None}




def post_to_linkedin_image(author, access_token, content, image_url, title=None, description=None):
    registration_result = register_media_upload(author, access_token, "IMAGE")
  
    upload_url = registration_result.get("upload_url")
    asset = registration_result.get("asset")
 
    try:
        image_response = requests.get(image_url)
        image_response.raise_for_status()

        headers = {"Authorization": f"Bearer {access_token}"}
        upload_response = requests.post(upload_url, headers=headers, data=image_response.content)
        upload_response.raise_for_status()

    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Image upload failed: {str(e)}", "data": None}

    url = f"{URL}/ugcPosts"
    headers = {
        "X-Restli-Protocol-Version": "2.0.0",
        "Authorization": f"Bearer {access_token}"
    }

    media = {"status": "READY", "media": asset}
    if title: media["title"] = {"text": title}
    if description: media["description"] = {"text": description}

    data = {
        "author": "urn:li:person:" + author,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": content},
                "shareMediaCategory": "IMAGE",
                "media": [media]
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status()
        result_data = response.json()
        return {"success": True, "message": "Posted image to LinkedIn successfully!", "data": result_data}

    except requests.exceptions.RequestException as e:
        return {"success": False, "error": str(e), "data": None}


def post_to_linkedin(postData, image_urls, video_url, access_token):
    try:
        platform = 'linkedin'
        platform_data = postData.get('platforms', {}).get(platform, {})
        post_type = platform_data.get('postType', 'post')
        content = platform_data.get('specificContent') or postData.get('content', '')

        author = platform_data.get('accountId', '')
        image_url = image_urls[0] if image_urls else None
        article_url = platform_data.get('articleUrl', '')
        title = platform_data.get('title')
        description = platform_data.get('description')

        if post_type == 'post':
            if image_url: return post_to_linkedin_image(author, access_token, content, image_url)
            else: return post_to_linkedin_post(author, access_token, content)
        elif post_type == 'video': 
            return post_to_linkedin_video(author, access_token, content, video_url, image_url)
        elif post_type == 'article': 
            return post_to_linkedin_article(author, access_token, content, article_url, title, description)
        else: 
            return {"success": False, "error": f"Unsupported post type: {post_type}", "data": None}

    except Exception as e:
        logging.error(f"Error in post_to_linkedin router: {str(e)}")
        return {"success": False, "error": str(e), "data": None}
