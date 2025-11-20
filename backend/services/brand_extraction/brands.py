
from flask import request, Response, stream_with_context
import json
import sys

from database import get_supabase_client
from utils.image_utils import save_image_supabase
from .logo_extraction import LogoExtractor
from .image_extraction import ImageExtractor
from .info_extraction import LLMBrandAnalyzer
from .color_extraction import ColorExtractor
from .product2 import SimpleJSONProductExtractor
from .utils import normalize_url, get_domain_and_name

supabase = get_supabase_client()

def get_brands(user_id):
    try:
        result = supabase.table('brands').select('id, name, domain, website_url, logo_url').eq('user_id', user_id).order('created_at', desc=True).execute()
        return {'brands': result.data}, 200
    except Exception as e:
        print(f"Error getting brands: {str(e)}")
        return {'error': str(e)}, 500

def get_brand(user_id, brand_id):
    try:
        result = supabase.table('brands').select('*').eq('user_id', user_id).eq('id', brand_id).execute()
        if not result.data: return {'error': 'Brand not found'}, 404
        return {'brand': result.data[0]}, 200
    except Exception as e:
        print(f"Error getting brand profile: {str(e)}")
        return {'error': str(e)}, 500


def delete_brand(user_id, brand_id):
    try:
        result = supabase.table('brands').delete(count='exact').eq('id', brand_id).eq('user_id', user_id).execute()
        if not result.data: return {'error': 'Brand not found'}, 404
        return {'success': True}, 200
    except Exception as e:
        print(f"Error deleting brand: {str(e)}")
        return {'error': str(e)}, 500

def get_default_colors():
    """Return default colors structure when extraction fails"""
    return {
        'ui_colors': [],
        'css_colors': [],
        'logo_colors': [],
        'palette': [],
        'dominant_colors': []
    }

def extract_brand(user_id):
    def generate():
        try:
            url = request.json.get('url')
            if not url:
                yield f"data: {json.dumps({'error': 'URL is required'})}\n\n"
                return

            url = normalize_url(url)
            domain, name = get_domain_and_name(url)
            
            # Step 1: Extract logo and images
            yield f"data: {json.dumps({'step': 'images', 'message': 'Extracting logos and images...'})}\n\n"
            sys.stdout.flush()
            try:
                logo_url = LogoExtractor().execute(url, user_id)
            except Exception as e:
                print(f"Logo extraction failed: {e}")
                logo_url = None
            
            # Step 2: Extract colors
            yield f"data: {json.dumps({'step': 'colors', 'message': 'Analyzing brand colors...'})}\n\n"
            sys.stdout.flush()
            try:
                colors = ColorExtractor(url, logo_url).execute()
            except Exception as e:
                print(f"Color extraction failed: {e}")
                colors = get_default_colors()
            
            # Step 3: Extract brand info
            yield f"data: {json.dumps({'step': 'info', 'message': 'Extracting brand voice and information...'})}\n\n"
            sys.stdout.flush()
            try:
                brand_info = LLMBrandAnalyzer().execute(url)
            except Exception as e:
                print(f"Brand info extraction failed: {e}")
                brand_info = LLMBrandAnalyzer().get_default_brand_info()
            
            # Step 4: Extract products (no separate step message since it's fast)
            try:
                product_extractor = SimpleJSONProductExtractor()
                products = product_extractor.execute(url, user_id)
            except Exception as e:
                print(f"Product extraction failed: {e}")
                products = []
            
            # Save to database
            brand_profile_data = { 
                'user_id': user_id,
                'domain': domain,
                'name': name,
                'website_url': url,
                'logo_url': logo_url if logo_url else None,
                'colors': colors,
                'brand_info': brand_info,
                'products': products,
            }
            
            result = supabase.table('brands').upsert(
                brand_profile_data,
                on_conflict='user_id,domain'
            ).execute()

            brand_id = result.data[0]['id'] if result.data else None
            
            # Final completion message
            yield f"data: {json.dumps({'step': 'complete', 'message': 'Brand extraction completed!', 'data': {'id': brand_id, 'url': url}})}\n\n"
            
        except Exception as e:
            print(f"Error in brand extraction: {str(e)}")
            yield f"data: {json.dumps({'error': f'Brand extraction failed: {str(e)}'})}\n\n"
    
    response = Response(stream_with_context(generate()), mimetype='text/event-stream')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no'
    return response

def update_brand(user_id, brand_id):
    try:
        # Verify brand ownership and get current brand data
        result = supabase.table('brands').select('*').eq('user_id', user_id).eq('id', brand_id).execute()
        if not result.data: return {'error': 'Brand not found'}, 404

        current_brand = result.data[0]
        bd = request.json or {}
        
        # Get current brand_info structure
        brand_info = current_brand.get('brand_info', {})
        company_details = brand_info.get('company_details', {})
        audience = brand_info.get('audience', {})
        tone_data = brand_info.get('tone', {})
        product_features = brand_info.get('product_features', {})
        
        # Update nested structure
        if 'company_description' in bd:
            company_details['company_description'] = bd['company_description']
        
        if 'main_heading' in bd:
            if 'headers_taglines' not in company_details:
                company_details['headers_taglines'] = {}
            company_details['headers_taglines']['main_heading'] = bd['main_heading']
        
        if 'taglines' in bd:
            if 'headers_taglines' not in company_details:
                company_details['headers_taglines'] = {}
            # Handle taglines as either list or string
            if isinstance(bd['taglines'], list):
                taglines = [t.strip() for t in bd['taglines'] if t.strip()]
            else:
                taglines = [t.strip() for t in bd['taglines'].split(',') if t.strip()]
            company_details['headers_taglines']['taglines'] = taglines
        
        if 'industry_category' in bd or 'industry_subcategory' in bd:
            if 'industry_type' not in company_details:
                company_details['industry_type'] = {}
            if 'industry_category' in bd:
                company_details['industry_type']['category'] = bd['industry_category']
            if 'industry_subcategory' in bd:
                company_details['industry_type']['subcategory'] = bd['industry_subcategory']
        
        if 'fonts' in bd:
            # Handle fonts as either list or comma-separated string
            if isinstance(bd['fonts'], list):
                fonts = [f.strip() for f in bd['fonts'] if f.strip()]
            else:
                fonts = [f.strip() for f in bd['fonts'].split(',') if f.strip()]
            company_details['fonts'] = fonts
        
        if 'professions' in bd:
            # Handle professions as either list or comma-separated string
            if isinstance(bd['professions'], list):
                professions = [p.strip() for p in bd['professions'] if p.strip()]
            else:
                professions = [p.strip() for p in bd['professions'].split(',') if p.strip()]
            audience['professions'] = professions
        
        if 'age_range' in bd:
            audience['age_range'] = bd['age_range']
        
        if 'gender' in bd:
            audience['gender'] = bd['gender']
        
        if 'tone' in bd:
            # Handle tone as either list or comma-separated string
            if isinstance(bd['tone'], list):
                tone_list = [t.strip() for t in bd['tone'] if t.strip()]
            else:
                tone_list = [t.strip() for t in bd['tone'].split(',') if t.strip()]
            tone_data['tone_emotion'] = tone_list
        
        if 'brand_character' in bd:
            # Handle brand_character as either list or comma-separated string
            if isinstance(bd['brand_character'], list):
                character_list = [c.strip() for c in bd['brand_character'] if c.strip()]
            else:
                character_list = [c.strip() for c in bd['brand_character'].split(',') if c.strip()]
            tone_data['brand_character'] = character_list
        
        if 'language_style' in bd:
            # Handle language_style as either list or comma-separated string
            if isinstance(bd['language_style'], list):
                style_list = [s.strip() for s in bd['language_style'] if s.strip()]
            else:
                style_list = [s.strip() for s in bd['language_style'].split(',') if s.strip()]
            tone_data['language_style'] = style_list
        
        if 'main_products' in bd:
            # Handle main_products as either list or comma-separated string
            if isinstance(bd['main_products'], list):
                products = [p.strip() for p in bd['main_products'] if p.strip()]
            else:
                products = [p.strip() for p in bd['main_products'].split(',') if p.strip()]
            product_features['main_products_services'] = products
        
        if 'pricing_model' in bd:
            product_features['pricing_model'] = bd['pricing_model']
        
        # Reconstruct brand_info
        brand_info['company_details'] = company_details
        brand_info['audience'] = audience
        brand_info['tone'] = tone_data
        brand_info['product_features'] = product_features
        
        update_data = {'brand_info': brand_info}
        
        # Handle products update if provided
        if 'products' in bd:
            update_data['products'] = bd['products']
        
        # Handle colors update if provided
        if 'colors' in bd:
            colors_data = current_brand.get('colors', {})
            colors_data['dominant_colors'] = bd['colors']
            update_data['colors'] = colors_data

        # Update database
        result = supabase.table('brands').update(update_data).eq('id', brand_id).eq('user_id', user_id).execute()
        if not result.data: return {'error': 'Failed to update brand'}, 500

        return {'brand': result.data[0], 'success': True}, 200

    except Exception as e:
        print(f"Error updating brand: {e}")
        return {'error': str(e)}, 500



