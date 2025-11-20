import json
from flask import request, g
from .google_translator import translator

def get_user_language():
    """Get user's preferred language from request headers"""
    return request.headers.get('Accept-Language', 'en').split(',')[0]

def translate_response(response):
    """Translate response messages to user's preferred language"""
    if not hasattr(g, 'language'):
        g.language = get_user_language()
        
    if g.language == 'en':  # Skip translation for English
        return response
        
    if response.is_json:
        try:
            data = response.get_json()
            modified = False
            
            for key in ['message', 'error']:
                if key in data and isinstance(data[key], str):
                    data[key] = translator.translate(data[key], g.language)
                    modified = True
            
            if modified:
                response.set_data(json.dumps(data, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            print(f"Error translating response: {e}")
        
    return response 