import requests
import json


URL = "https://api.linkedin.com/v2"

def post_to_linkedin(author, access_token, content):
    print(f"Starting LinkedIn post for author: {author}")
    url = f"{URL}/ugcPosts"
    headers = {
        "X-Restli-Protocol-Version": "2.0.0",
        "Authorization": f"Bearer {access_token}"
    }
    print(f"LinkedIn API URL: {url}")
    print(f"Using headers: {headers}")
    
    data = {
    "author": "urn:li:person:" + author,
    "lifecycleState": "PUBLISHED",
    "specificContent": {
        "com.linkedin.ugc.ShareContent": {
            "shareCommentary": {
                "text": content
            },
            "shareMediaCategory": "NONE"
        }
    },
    "visibility": {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
    }
    }
    print(f"Preparing LinkedIn post data: {json.dumps(data)}")
    
    try:
        print("Sending request to LinkedIn API...")
        response = requests.post(url, headers=headers, data=json.dumps(data))
        print(f"LinkedIn API response status code: {response.status_code}")
        
        result_data = response.json()
        print(f"LinkedIn API response data: {json.dumps(result_data)}")
        
        if response.status_code >= 200 and response.status_code < 300:
            print("LinkedIn post successful!")
            return True, {"message": "Posted to LinkedIn successfully!"}, result_data
        
        print(f"LinkedIn post failed with status code: {response.status_code}")
        return False, result_data, None
    except Exception as e:
        print(f"Exception occurred during LinkedIn post: {str(e)}")
        return False, {"error": str(e)}, None
    

def post_to_linkedin_video(author, access_token, content, video_url=None, title="Video Title", description="Video Description"):
    """
    Share a video on LinkedIn
    
    Parameters:
    - author: LinkedIn URN of the author (e.g., "urn:li:person:12345")
    - access_token: OAuth access token
    - content: Text commentary for the share
    - video_url: URL of the video to share
    - title: Optional title for the video
    - description: Optional description for the video
    """
    # First register the video upload
    registration_result = register_media_upload(author, access_token, "VIDEO")
    
    if "error" in registration_result:
        return False, {"error": f"Failed to register video upload: {registration_result['error']}"}, None
    
    # Get the upload URL and asset URN
    upload_url = registration_result.get("upload_url")
    asset = registration_result.get("asset")
    
    if not upload_url or not asset:
        return False, {"error": "Missing upload URL or asset URN"}, None
    
    # Download the video from the URL and upload to LinkedIn
    try:
        # Download the video
        video_response = requests.get(video_url)
        if not video_response.ok:
            return False, {"error": f"Failed to download video: {video_response.status_code}"}, None
        
        # Upload to LinkedIn
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        upload_response = requests.post(upload_url, headers=headers, data=video_response.content)
        
        if not upload_response.ok:
            return False, {"error": f"Failed to upload video: {upload_response.status_code}"}, None
    except Exception as e:
        return False, {"error": f"Error during video upload: {str(e)}"}, None
    
    # Now create the post with the uploaded video
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
                "shareCommentary": {
                    "text": content
                },
                "shareMediaCategory": "VIDEO",
                "media": [
                    {
                        "status": "READY",
                        "description": {
                            "text": description
                        },
                        "media": asset,
                        "title": {
                            "text": title
                        }
                    }
                ]
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        result_data = response.json()
        if response.status_code >= 200 and response.status_code < 300:
            return True, {"message": "Posted video to LinkedIn successfully!"}, result_data
        return False, result_data, None
    except Exception as e:
        return False, {"error": str(e)}, None


def post_to_linkedin_article(author, access_token, content, article_url, title=None, description=None):
    """
    Share an article or URL on LinkedIn
    
    Parameters:
    - author: LinkedIn URN of the author (e.g., "urn:li:person:12345")
    - access_token: OAuth access token
    - content: Text commentary for the share
    - article_url: URL to share
    - title: Optional title for the article
    - description: Optional description for the article
    """
    url = f"{URL}/ugcPosts"
    headers = {
        "X-Restli-Protocol-Version": "2.0.0",
        "Authorization": f"Bearer {access_token}"
    }
    
    media_object = {
        "status": "READY",
        "originalUrl": article_url
    }
    
    if title:
        media_object["title"] = {"text": title}
    
    if description:
        media_object["description"] = {"text": description}
    
    data = {
        "author": "urn:li:person:" + author,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": content
                },
                "shareMediaCategory": "ARTICLE",
                "media": [media_object]
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        result_data = response.json()
        if response.status_code >= 200 and response.status_code < 300:
            return True, {"message": "Posted article to LinkedIn successfully!"}, result_data
        return False, result_data, None
    except Exception as e:
        return False, {"error": str(e)}, None


def register_media_upload(author, access_token, media_type="IMAGE"):
    """
    Register media to be uploaded to LinkedIn
    
    Parameters:
    - author: LinkedIn URN of the author (e.g., "urn:li:person:12345")
    - access_token: OAuth access token
    - media_type: "IMAGE" or "VIDEO"
    
    Returns:
    - Dictionary with upload URL and asset URN
    """
    url = f"{URL}/assets?action=registerUpload"
    headers = {
        "X-Restli-Protocol-Version": "2.0.0",
        "Authorization": f"Bearer {access_token}"
    }
    
    recipe_type = "feedshare-image" if media_type == "IMAGE" else "feedshare-video"
    
    data = {
        "registerUploadRequest": {
            "recipes": [
                f"urn:li:digitalmediaRecipe:{recipe_type}"
            ],
            "owner": "urn:li:person:" + author,
            "serviceRelationships": [
                {
                    "relationshipType": "OWNER",
                    "identifier": "urn:li:userGeneratedContent"
                }
            ]
        }
    }
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        result = response.json()
        
        if "value" in result:
            return {
                "upload_url": result["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"],
                "asset": result["value"]["asset"]
            }
        return result
    except Exception as e:
        return {"error": str(e)}


def upload_media_binary(upload_url, access_token, file_path):
    """
    Upload binary media file to LinkedIn using the upload URL
    
    Parameters:
    - upload_url: URL obtained from register_media_upload
    - access_token: OAuth access token
    - file_path: Path to the local file to upload
    
    Returns:
    - Response from the upload
    """
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        with open(file_path, 'rb') as file:
            response = requests.post(upload_url, headers=headers, data=file)
        return {"status": response.status_code, "response": response.text}
    except Exception as e:
        return {"error": str(e)}


def post_to_linkedin_image(author, access_token, content, image_url, title=None, description=None):
    """
    Share an image on LinkedIn after it has been uploaded
    
    Parameters:
    - author: LinkedIn URN of the author (e.g., "urn:li:person:12345")
    - access_token: OAuth access token
    - content: Text commentary for the share
    - image_url: URL of the image to share
    - title: Optional title for the image
    - description: Optional description for the image
    """
    # First register the image upload
    registration_result = register_media_upload(author, access_token, "IMAGE")
    
    if "error" in registration_result:
        return False, {"error": f"Failed to register image upload: {registration_result['error']}"}, None
    
    # Get the upload URL and asset URN
    upload_url = registration_result.get("upload_url")
    asset = registration_result.get("asset")
    
    if not upload_url or not asset:
        return False, {"error": "Missing upload URL or asset URN"}, None
    
    # Download the image from the URL and upload to LinkedIn
    try:
        # Download the image
        image_response = requests.get(image_url)
        if not image_response.ok:
            return False, {"error": f"Failed to download image: {image_response.status_code}"}, None
        
        # Upload to LinkedIn
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        upload_response = requests.post(upload_url, headers=headers, data=image_response.content)
        
        if not upload_response.ok:
            return False, {"error": f"Failed to upload image: {upload_response.status_code}"}, None
    except Exception as e:
        return False, {"error": f"Error during image upload: {str(e)}"}, None
    
    # Now create the post with the uploaded image
    url = f"{URL}/ugcPosts"
    headers = {
        "X-Restli-Protocol-Version": "2.0.0",
        "Authorization": f"Bearer {access_token}"
    }
    
    media_object = {
        "status": "READY",
        "media": asset
    }
    
    if title:
        media_object["title"] = {"text": title}
    
    if description:
        media_object["description"] = {"text": description}
    
    data = {
        "author": "urn:li:person:" + author,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": content
                },
                "shareMediaCategory": "IMAGE",
                "media": [media_object]
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        result_data = response.json()
        if response.status_code >= 200 and response.status_code < 300:
            return True, {"message": "Posted image to LinkedIn successfully!"}, result_data
        return False, result_data, None
    except Exception as e:
        return False, {"error": str(e)}, None



if __name__ == "__main__":
    # The post_to_linkedin function already adds "urn:li:person:" to the author ID
    success, result, data = post_to_linkedin_video("BteJEWaO_K", "AQV_rzMmTbKeuZbC9n9DZa5dG2kZYBTsa0fcPoQPiXlfkPsk6KTtVWMAubLnF92_StTQETNpIGnEA1LTVEBmexIwYe6B6pvu7-MpJ_88gX2fC1W5YW9YR9GUHk9O1ig0LtTP2NaHIg10wNFaEDFYJ0B4OCIEwamkR7jsqcug5e0zd-WS1BN1lnCCsUAXPdV8sRo6EsGunkT3PRXdlgCRt7iGu6zrtIUYqDxGnEnh5kUQb-vyQnhstTFdjGgLiKCnG22me2qj7BQnZeB9Q_fUmsc5oTPKSBowiLVN3WNUcV7cENU8Ht26NC7nz_Zpqu4-CYVD8vX59_yqgwENRZQcPz0kqCUz1A", "Test post","https://qacaiikdxhlnvxmozbwl.supabase.co/storage/v1/object/public/post-videos//temp_199e70e4-06ae-4479-989d-26eaddb0003c.mp4")
    print("\nFinal result:")
    print(f"Success: {success}")
    print(f"Result: {result}")
    print(f"Data: {data}")