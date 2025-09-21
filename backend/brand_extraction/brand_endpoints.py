from flask import Blueprint, request, jsonify, session
from datetime import datetime, timezone
from urllib.parse import urlparse

from decorators.decorators import login_required, subscription_required
from database import get_supabase_client, get_service_role_client
from brand_extraction.logo_extraction import extract_website_assets, normalize_url
from brand_extraction.info_extraction import info_extraction
from brand_extraction.color_extraction import color_extraction
from brand_service import invalidate_brand_cache, get_brand_profile as get_cached_brand_profile

# Initialize clients
supabase = get_supabase_client()
supabase_admin = get_service_role_client()

# Create blueprint for brand endpoints
brand_bp = Blueprint('brand', __name__, url_prefix='/api')

@brand_bp.route('/brands', methods=['GET'])
@login_required
@subscription_required
def api_get_brands():
    """Get all brand profiles for the current user"""
    try:
        user_id = session.get('user_id')
      
        # Get all brand profiles for this user
        result = supabase.table('brand_profiles').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        
        # Format the response to match what the frontend expects
        brands = []
        for brand_profile in result.data:
            # Extract domain name from website_url for the name
            website_url = brand_profile.get('website_url', '')
            try:
                parsed = urlparse(website_url if website_url.startswith('http') else f'https://{website_url}')
                domain_name = parsed.hostname.replace('www.', '') if parsed.hostname else website_url
                clean_name = domain_name.split('.')[0] if '.' in domain_name else domain_name
                name = clean_name.capitalize()
            except:
                name = website_url
            
            brands.append({
                'id': brand_profile['id'],
                'name': name,
                'website_url': brand_profile['website_url'],
                'logo_url': brand_profile.get('logo_url'),
                'created_at': brand_profile['created_at'],
                'updated_at': brand_profile['updated_at']
            })
        
        return jsonify({'brands': brands}), 200
        
    except Exception as e:
        print(f"Error getting brands: {str(e)}")
        return jsonify({'error': str(e)}), 500

@brand_bp.route('/brands/<brand_id>', methods=['DELETE'])
@login_required
@subscription_required
def api_delete_brand(brand_id):
    """Delete a brand profile"""
    try:
        user_id = session.get('user_id')
        
        # Check if brand belongs to user and delete it
        result = supabase.table('brand_profiles').delete(count='exact').eq('id', brand_id).eq('user_id', user_id).execute()
        
        if result.count == 0:
            return jsonify({'error': 'Brand not found or unauthorized'}), 404
        
        # Invalidate cache
        invalidate_brand_cache(user_id)
        
        return jsonify({'message': 'Brand deleted successfully'}), 200
        
    except Exception as e:
        print(f"Error deleting brand: {str(e)}")
        return jsonify({'error': str(e)}), 500

@brand_bp.route('/extract-brand', methods=['POST'])
@login_required
@subscription_required
def api_extract_brand():
    """Extract brand assets (logo, images, colors, brand info) from a website URL"""
    try:
        data = request.json
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        user_id = session.get('user_id')
        
        # Normalize URL
        normalized_url = normalize_url(url)
        
        # Step 1: Extract website assets (logo and images)
        print(f"Extracting assets from {normalized_url}")
        assets = extract_website_assets(normalized_url, supabase_admin, user_id, image_limit=10)
        
        # Step 2: Extract colors
        print("Extracting colors...")
        colors = color_extraction(
            url=normalized_url,
            logo_url=assets.get('logo'),
            image_urls=assets.get('images', [])
        )
        
        # Step 3: Extract brand information using LLM
        print("Extracting brand information...")
        brand_analyzer = info_extraction()
        brand_info = brand_analyzer.analyze_brand(normalized_url)
        
        # Prepare the response data
        result = {
            'success': True,
            'url': normalized_url,
            'assets': assets,
            'colors': colors,
            'brand_info': brand_info
        }
        
        # Store the brand profile in database
        try:
            # Extract domain from normalized URL
            parsed_url = urlparse(normalized_url)
            domain = parsed_url.netloc.replace('www.', '') if parsed_url.netloc else normalized_url
            
            brand_profile_data = {
                'user_id': user_id,
                'domain': domain,
                'website_url': normalized_url,
                'logo_url': assets.get('logo'),
                'image_urls': assets.get('images', []),
                'colors': colors,
                'brand_info': brand_info,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Check if brand profile already exists (use domain for faster lookup due to index)
            existing = supabase.table('brand_profiles').select('id').eq('user_id', user_id).eq('domain', domain).execute()
            
            if existing.data:
                # Update existing profile
                supabase.table('brand_profiles').update(brand_profile_data).eq('id', existing.data[0]['id']).execute()
            else:
                # Create new profile
                supabase.table('brand_profiles').insert(brand_profile_data).execute()
            
            # Invalidate cache
            invalidate_brand_cache(user_id)
            
        except Exception as db_error:
            print(f"Warning: Failed to save brand profile to database: {str(db_error)}")
            # Continue without failing the entire request
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error in brand extraction: {str(e)}")
        return jsonify({'error': f'Brand extraction failed: {str(e)}'}), 500

@brand_bp.route('/brand-profile', methods=['GET'])
@brand_bp.route('/brand-profile/<brand_id>', methods=['GET'])
@login_required
@subscription_required  
def api_get_brand_profile(brand_id=None):
    """Get brand profile from database"""
    try:
        brand_profile = get_cached_brand_profile(brand_id)
        
        if brand_profile:
            return jsonify({'brand_profile': brand_profile}), 200
        else:
            return jsonify({'error': 'Brand profile not found'}), 404
            
    except Exception as e:
        print(f"Error getting brand profile: {str(e)}")
        return jsonify({'error': str(e)}), 500
