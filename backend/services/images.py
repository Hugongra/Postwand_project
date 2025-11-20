from database import get_supabase_client, get_service_role_client
from utils.image_utils import save_image_supabase
supabase = get_supabase_client()
supabase_admin = get_service_role_client()

def save_image(user_id, image):
    return save_image_supabase('image-library', user_id, image)

def get_images(user_id):
    def _get_files_from_bucket(bucket_name, file_type):
        files = supabase_admin.storage.from_(bucket_name).list(path=user_id)
        return [{
                'name': f['name'],
                'url': supabase_admin.storage.from_(bucket_name).get_public_url(f"{user_id}/{f['name']}"),
                'path': f"{user_id}/{f['name']}",
                'type': file_type
            } for f in files
        ]
    
    try:
        images = _get_files_from_bucket('image-library', 'image')
        images.extend(_get_files_from_bucket('ad-images', 'ad'))
        return {'success': True, 'images': images}
    except Exception as e:
        print(f"Error getting images: {str(e)}")
        return {'success': False, 'error': f"Error getting images: {str(e)}"}


def delete_image(user_id, image_name):
    try:
        file_path = f"{user_id}/{image_name}"
        supabase_admin.storage.from_('image-library').remove([file_path])
        return {'success': True, 'message': 'Image deleted successfully'}

    except Exception as e:
        print(f"Error deleting image: {str(e)}")
        return {'success': False, 'error': f"Error deleting image: {str(e)}"}
