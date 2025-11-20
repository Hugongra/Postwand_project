import requests
import base64
import uuid
from backend.database import get_supabase_client

supabase_admin = get_supabase_client()

def image_to_data_uri(image):
    try:
        if isinstance(image, str):
            if image.startswith("data:image/"):
                return image
            elif image.startswith(('http://', 'https://')):
                response = requests.get(image, timeout=30)
                response.raise_for_status()
                mime_type = response.headers.get('Content-Type', 'image/png')
                mime_type = mime_type.split(';')[0].strip()
                image_bytes = response.content
        else:
            image.seek(0)
            image_bytes = image.read()
            mime_type = getattr(image, 'content_type', 'image/png')

        encoded = base64.b64encode(image_bytes).decode('utf-8')
        return f"data:{mime_type};base64,{encoded}"

    except requests.RequestException as e:
        raise ValueError(f"Failed to download image: {e}")
    except Exception as e:
        raise ValueError(f"Failed to convert image to data URI: {e}")



def save_image_supabase(storage_bucket, folder_name, image):
 
    try:

        data_uri = image_to_data_uri(image)
        
        # Parse the data URI
        content_type = data_uri.split(';')[0].split(':')[1]
        format_type = content_type.split('/')[-1]
        image_data = base64.b64decode(data_uri.split(',')[1])

        filename = f"{uuid.uuid4()}.{format_type}"
        bucket_path = f"{folder_name}/{filename}"

        supabase_admin.storage.from_(storage_bucket).upload(
            bucket_path,
            image_data,
            file_options={"content-type": content_type}
        )
        public_url = supabase_admin.storage.from_(storage_bucket).get_public_url(bucket_path)

        return {'success': True, 'image_url': public_url, 'path': bucket_path}

    except Exception as e:
        print(f"Auto-save failed: {str(e)}")
        return {'success': False, 'error': f"Auto-save failed: {str(e)}"}
