 
from flask import Blueprint, g, request
from decorators.decorators import login_required
import services.images as images

images_bp = Blueprint('images', __name__, url_prefix='/api')

@images_bp.route('/images', methods=['POST'])
@login_required
def save_image():
    image = request.files.get('image')
    if not image:
        return {'error': 'Image is required'}, 400
    return images.save_image(g.user_id, image)

@images_bp.route('/images', methods=['GET'])  
@login_required
def get_images():
    return images.get_images(g.user_id)  

@images_bp.route('/image/<image_id>', methods=['DELETE'])
@login_required
def delete_image(image_id):
    return images.delete_image(g.user_id, image_id) 

