from .translations.translation_middleware import translate_response

def init_translation(app):
    @app.after_request
    def process_response(response):
        return translate_response(response) 

   