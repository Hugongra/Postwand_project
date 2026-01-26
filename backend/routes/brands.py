from flask import Blueprint, g
from decorators.decorators import login_required
import services.brand_extraction.brands as brands

brand_bp = Blueprint('brand', __name__)

@brand_bp.route('/brands', methods=['GET'])
@login_required
def get_brands():
    return brands.get_brands(g.user_id)
    
@brand_bp.route('/brands/<brand_id>', methods=['DELETE'])
@login_required
def delete_brand(brand_id):
    return brands.delete_brand(g.user_id, brand_id)
    
@brand_bp.route('/extract-brand', methods=['POST'])
@login_required
def extract_brand():
    return brands.extract_brand(g.user_id)
  
@brand_bp.route('/brand/<brand_id>', methods=['GET'])
@login_required
def get_brand(brand_id):
    return brands.get_brand(g.user_id, brand_id)

@brand_bp.route('/brand/<brand_id>', methods=['PUT'])
@login_required
def update_brand(brand_id):
    return brands.update_brand(g.user_id, brand_id)

